// Eingabe: Treffer im Notensystem bestimmen und Noten setzen, verschieben, löschen.
// Reine Funktionen auf Layout und Partitur, unabhängig vom Renderer (Finger, Maus, Tests).

import type { Letter, Pitch } from '@harmonia/theory';
import { LETTERS, diatonicIndex, equals, keyFromFifths, signatureAlter } from '@harmonia/theory';

import type { EventRef, ScoreLayout } from './layout.ts';
import { eventBounds, glyphMetrics, staffY } from './layout.ts';
import type { Clef, Score, Staff, VoiceEvent } from './score.ts';
import { chord, eventPitches, note, rest, ties } from './score.ts';

export type { Letter, Pitch } from '@harmonia/theory';

/**
 * Notenposition als Schritt: 0 = oberste Linie, 1 = Zwischenraum darunter, 8 = unterste Linie.
 * Negativ über dem System, über 8 darunter.
 */
export type StaffStep = number;

/** Bis zu vier Hilfslinien über und unter dem System. */
export const MIN_STEP: StaffStep = -8;
export const MAX_STEP: StaffStep = 16;

export interface StaffHit {
  /** Nächste Linie oder nächster Zwischenraum (eingerastet, begrenzt auf ±4 Hilfslinien). */
  readonly step: StaffStep;
  /** Tonhöhe an dieser Stelle: Stammton aus dem Schlüssel, Vorzeichen aus Vorzeichnung und Takt. */
  readonly pitch: Pitch;
  /** Takt unter dem Punkt. */
  readonly measure: number;
  /** Ereignis, dessen Bereich den Punkt enthält. */
  readonly event?: EventRef;
  /** Notenkopf in der Nähe (gleiches Ereignis, höchstens einen Schritt entfernt). */
  readonly head?: EventRef;
}

/** Schritt zu einer y-Koordinate (Notenlinienabstände ab oberster Linie), eingerastet. */
export function stepAt(y: number): StaffStep {
  const step = Math.round(y * 2);
  return Math.min(MAX_STEP, Math.max(MIN_STEP, step)) || 0;
}

/** y-Koordinate eines Schritts. */
export function stepY(step: StaffStep): number {
  return step / 2;
}

/** Stammton und Oktave an einer Position (ohne Vorzeichen). */
export function naturalAtStep(step: StaffStep, clef: Clef): { letter: Letter; octave: number } {
  const top = topLineIndex(clef);
  const index = top - step;
  const letter = LETTERS[((index % 7) + 7) % 7] ?? 'C';
  return { letter, octave: Math.floor(index / 7) };
}

/** Schritt einer Tonhöhe. */
export function stepOf(p: Pitch, clef: Clef): StaffStep {
  return Math.round(staffY(p, clef) * 2);
}

function topLineIndex(clef: Clef): number {
  // staffY(p) = (top − diatonicIndex(p)) / 2 → top = diatonicIndex(p) + 2·staffY(p)
  const probe: Pitch = { letter: 'C', alter: 0, octave: 4 };
  return diatonicIndex(probe) + Math.round(staffY(probe, clef) * 2);
}

/**
 * Geltendes Vorzeichen an einer Notenposition vor einem Ereignis: das letzte Versetzungszeichen
 * an derselben Position im Takt, sonst die Vorzeichnung. Haltebogen-Ziele zählen nicht
 * (wie im Layout: Ihr Vorzeichen wird nicht neu gesetzt).
 */
export function prevailingAlter(
  score: Score,
  measure: number,
  beforeEvent: number,
  letter: Letter,
  octave: number,
): number {
  const staff = firstStaff(score);
  const tieTargets = new Set(
    ties(score)
      .filter((t) => t.to.measure === measure)
      .map((t) => `${String(t.to.event)}:${pitchId(t.pitch)}`),
  );
  let alter = signatureAlter(keyFromFifths(staff.keySignature.fifths), letter);
  const events = staff.measures[measure]?.voices[0]?.events ?? [];
  events.slice(0, Math.max(0, beforeEvent)).forEach((event, index) => {
    for (const p of eventPitches(event)) {
      if (
        p.letter === letter &&
        p.octave === octave &&
        !tieTargets.has(`${String(index)}:${pitchId(p)}`)
      ) {
        alter = p.alter;
      }
    }
  });
  return alter;
}

/** Tonhöhe an einer Position im Zusammenhang: Schlüssel, Vorzeichnung, frühere Vorzeichen im Takt. */
export function pitchAtStep(
  score: Score,
  step: StaffStep,
  measure: number,
  beforeEvent: number,
): Pitch {
  const { letter, octave } = naturalAtStep(step, firstStaff(score).clef);
  return { letter, alter: prevailingAlter(score, measure, beforeEvent, letter, octave), octave };
}

/** Wie weit (in Notenlinienabständen) ein Punkt waagerecht neben einem Ereignis noch dazu zählt. */
const EVENT_TOLERANCE = 0.75;

/**
 * Treffer für einen Punkt im Layout (Koordinaten in Notenlinienabständen, Ursprung oberste Linie links).
 * Das Ereignis ist das, dessen Bereich (mit Toleranz) den Punkt enthält; bei Überschneidung das nächste.
 */
export function hitTest(layout: ScoreLayout, score: Score, x: number, y: number): StaffHit {
  const step = stepAt(y);
  const measure = measureAt(layout, x);
  const candidates = eventBounds(layout)
    .filter((b) => b.measure === measure)
    .map((b) => ({
      b,
      distance: x < b.x1 ? b.x1 - x : x > b.x2 ? x - b.x2 : 0,
    }))
    .filter((c) => c.distance <= EVENT_TOLERANCE)
    .sort((a, b) => a.distance - b.distance);
  const hitEvent = candidates[0]?.b;
  const event = hitEvent ? { measure: hitEvent.measure, event: hitEvent.event } : undefined;
  const beforeEvent =
    event?.event ?? eventBounds(layout).filter((b) => b.measure === measure && b.x2 < x).length;
  const head = event ? nearestHead(layout, event, y) : undefined;
  return {
    step,
    pitch: pitchAtStep(score, step, measure, beforeEvent),
    measure,
    ...(event ? { event } : {}),
    ...(head ? { head } : {}),
  };
}

/** Takt unter x: gezählt werden die Taktstriche links davon (Schlussstriche liegen hinter allen Noten). */
export function measureAt(layout: ScoreLayout, x: number): number {
  const barlines = [
    ...new Set(
      layout.items
        .filter((i) => i.kind === 'line' && i.role === 'barline')
        .map((i) => (i.kind === 'line' ? i.x1 : 0)),
    ),
  ].sort((a, b) => a - b);
  const measures = new Set(eventBounds(layout).map((b) => b.measure)).size;
  const passed = barlines.filter((bx) => bx < x).length;
  return Math.min(passed, Math.max(0, measures - 1));
}

function nearestHead(layout: ScoreLayout, event: EventRef, y: number): EventRef | undefined {
  let best: { ref: EventRef; distance: number } | undefined;
  for (const item of layout.items) {
    if (
      item.kind !== 'glyph' ||
      item.role !== 'notehead' ||
      item.ref?.measure !== event.measure ||
      item.ref.event !== event.event
    ) {
      continue;
    }
    const height = glyphMetrics(item.glyph).bBoxNE[1] - glyphMetrics(item.glyph).bBoxSW[1];
    const distance = Math.abs(item.y - y);
    if (distance <= Math.max(0.5, height / 2) + 0.01 && (!best || distance < best.distance)) {
      best = { ref: item.ref, distance };
    }
  }
  return best?.ref;
}

// ---------------------------------------------------------------------------
// Bearbeiten (Phase 1: ein System, eine Stimme). Alle Funktionen geben eine neue Partitur zurück.

/** Setzt die Tonhöhe: Note → neue Tonhöhe, Akkordton → ersetzt, Pause → Note gleicher Dauer. */
export function setPitch(score: Score, ref: EventRef, pitch: Pitch): Score {
  return updateEvent(score, ref, (event) => {
    switch (event.kind) {
      case 'rest':
        return note(pitch, event.duration);
      case 'note':
        return { ...event, pitch };
      case 'chord': {
        const index = ref.note ?? 0;
        const notes = event.notes.map((n, i) => (i === index ? { ...n, pitch } : n));
        return withoutDuplicates({ ...event, notes });
      }
    }
  });
}

/** Fügt einen Ton hinzu (harmonisches Intervall, Akkord). Pause → Note; schon vorhandene Tonhöhe → unverändert. */
export function addPitch(score: Score, ref: EventRef, pitch: Pitch): Score {
  return updateEvent(score, ref, (event) => {
    switch (event.kind) {
      case 'rest':
        return note(pitch, event.duration);
      case 'note':
        return equals(event.pitch, pitch)
          ? event
          : chord(
              [
                { pitch: event.pitch, tie: event.tie },
                { pitch, tie: false },
              ],
              event.duration,
            );
      case 'chord':
        return event.notes.some((n) => equals(n.pitch, pitch))
          ? event
          : chord([...event.notes, { pitch, tie: false }], event.duration);
    }
  });
}

/** Entfernt einen Ton: Note → Pause gleicher Dauer; aus einem Akkord nur diesen Ton. */
export function removePitch(score: Score, ref: EventRef): Score {
  return updateEvent(score, ref, (event) => {
    switch (event.kind) {
      case 'rest':
        return event;
      case 'note':
        return rest(event.duration);
      case 'chord': {
        const index = ref.note ?? 0;
        const notes = event.notes.filter((_, i) => i !== index);
        const [only] = notes;
        if (notes.length === 1 && only) {
          return note(only.pitch, event.duration, only.tie);
        }
        return notes.length === 0 ? rest(event.duration) : { ...event, notes };
      }
    }
  });
}

/** Tonhöhe eines Tons (Note oder Akkordton), sonst undefined. */
export function pitchAt(score: Score, ref: EventRef): Pitch | undefined {
  const event = eventAt(score, ref);
  if (!event) {
    return undefined;
  }
  return eventPitches(event)[event.kind === 'chord' ? (ref.note ?? 0) : 0];
}

/**
 * Verschiebt einen Ton um Schritte (Linie ↔ Zwischenraum). Das Vorzeichen folgt der neuen Position
 * (Vorzeichnung, frühere Vorzeichen im Takt), wie beim Setzen per Tippen.
 */
export function moveByStep(score: Score, ref: EventRef, steps: number): Score {
  const current = pitchAt(score, ref);
  if (!current) {
    return score;
  }
  const clef = firstStaff(score).clef;
  const step = Math.min(MAX_STEP, Math.max(MIN_STEP, stepOf(current, clef) - steps));
  return setPitch(score, ref, pitchAtStep(score, step, ref.measure, ref.event));
}

/** Ändert nur das Vorzeichen eines Tons (Vorzeichen-Leiste). */
export function setAlter(score: Score, ref: EventRef, alter: number): Score {
  const current = pitchAt(score, ref);
  return current ? setPitch(score, ref, { ...current, alter }) : score;
}

export function eventAt(score: Score, ref: EventRef): VoiceEvent | undefined {
  return firstStaff(score).measures[ref.measure]?.voices[0]?.events[ref.event];
}

function updateEvent(
  score: Score,
  ref: EventRef,
  change: (event: VoiceEvent) => VoiceEvent,
): Score {
  const staff = firstStaff(score);
  const event = eventAt(score, ref);
  if (!event) {
    throw new RangeError(
      `Kein Ereignis in Takt ${String(ref.measure + 1)}, Position ${String(ref.event + 1)}`,
    );
  }
  const measures = staff.measures.map((m, mi) =>
    mi !== ref.measure
      ? m
      : {
          ...m,
          voices: m.voices.map((v, vi) =>
            vi !== 0
              ? v
              : { ...v, events: v.events.map((e, ei) => (ei === ref.event ? change(e) : e)) },
          ),
        },
  );
  return { ...score, staves: [{ ...staff, measures }, ...score.staves.slice(1)] };
}

function withoutDuplicates(event: Extract<VoiceEvent, { kind: 'chord' }>): VoiceEvent {
  const notes = event.notes.filter(
    (n, i) => event.notes.findIndex((m) => equals(m.pitch, n.pitch)) === i,
  );
  const [only] = notes;
  return notes.length === 1 && only
    ? note(only.pitch, event.duration, only.tie)
    : { ...event, notes };
}

function firstStaff(score: Score): Staff {
  const [staff] = score.staves;
  if (!staff) {
    throw new RangeError('Partitur ohne System');
  }
  return staff;
}

function pitchId(p: Pitch): string {
  return `${p.letter}${String(p.alter)}${String(p.octave)}`;
}
