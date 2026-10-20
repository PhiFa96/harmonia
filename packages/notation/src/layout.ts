// Layout: berechnet Positionen als reine Daten.
// Koordinaten in Notenlinienabständen. Ursprung: oberste Notenlinie am linken Rand, y nach unten
// (SMuFL-Maße haben y nach oben und werden hier umgerechnet).

import type { Fraction, NoteValue, Pitch, TimeSignature } from '@harmonia/theory';
import {
  addFractions,
  beats,
  compareFractions,
  diatonicIndex,
  durationValue,
  equals,
  fractionEquals,
  fractionToNumber,
  keyFromFifths,
  measureLength,
  parsePitch,
  signatureAlter,
  ZERO,
} from '@harmonia/theory';

import type { Clef, Score, Staff, VoiceEvent } from './score.ts';
import { eventPitches, slurs, ties } from './score.ts';
import { ENGRAVING_DEFAULTS, GLYPHS } from './smufl-data.ts';

export type GlyphName = keyof typeof GLYPHS;

interface GlyphMetrics {
  readonly codepoint: number;
  readonly bBoxNE: readonly [number, number];
  readonly bBoxSW: readonly [number, number];
  readonly anchors?: Readonly<Record<string, readonly [number, number]>>;
}

const METRICS: Readonly<Record<GlyphName, GlyphMetrics>> = GLYPHS;

/** Bezug eines Elements auf die Partitur (für Interaktion und Hervorhebung). */
export interface EventRef {
  /** Bei mehreren Systemen gesetzt; bei einem System optional für Abwärtskompatibilität. */
  readonly staff?: number;
  readonly measure: number;
  /** Bei mehreren Stimmen gesetzt. */
  readonly voice?: number;
  readonly event: number;
  /** Index des Tons im Akkord (bei Einzelnoten 0). */
  readonly note?: number;
}

export type LayoutItem =
  | {
      readonly kind: 'label';
      readonly text: string;
      readonly x: number;
      readonly y: number;
      readonly role: 'chordSymbol' | 'functionSymbol';
      readonly ref: EventRef;
    }
  | {
      readonly kind: 'glyph';
      readonly glyph: GlyphName;
      readonly x: number;
      readonly y: number;
      readonly role:
        | 'clef'
        | 'keySignature'
        | 'timeSignature'
        | 'notehead'
        | 'accidental'
        | 'rest'
        | 'flag'
        | 'dot'
        | 'tuplet';
      readonly ref?: EventRef;
    }
  | {
      readonly kind: 'line';
      readonly x1: number;
      readonly y1: number;
      readonly x2: number;
      readonly y2: number;
      readonly thickness: number;
      readonly role: 'staffLine' | 'ledgerLine' | 'stem' | 'barline';
      readonly ref?: EventRef;
    }
  | {
      /** Balken: Linie an der äußeren Kante (am Halsende), Dicke zeigt zu den Notenköpfen. */
      readonly kind: 'beam';
      readonly x1: number;
      readonly y1: number;
      readonly x2: number;
      readonly y2: number;
      readonly thickness: number;
      /** +1: Dicke nach unten (Hälse nach oben), −1: nach oben */
      readonly towards: 1 | -1;
    }
  | {
      readonly kind: 'tie';
      readonly x1: number;
      readonly x2: number;
      readonly y: number;
      readonly direction: 'up' | 'down';
    }
  | {
      readonly kind: 'slur';
      readonly x1: number;
      readonly x2: number;
      readonly y: number;
      readonly direction: 'up' | 'down';
    };

export interface ScoreLayout {
  readonly width: number;
  /** Oberste und unterste Ausdehnung (y), z. B. für den sichtbaren Ausschnitt. */
  readonly top: number;
  readonly bottom: number;
  readonly items: readonly LayoutItem[];
}

export interface LayoutOptions {
  /** Taktangabe bei ausdrücklich beschrifteten Rhythmusbausteinen ausblenden; Standard true. */
  readonly showTimeSignature?: boolean;
  /** Platz für eine Viertel in Notenlinienabständen. Standard: 3,5. */
  readonly quarterSpace?: number;
  /** Abschluss: einfacher Taktstrich (Standard), Schlussstrich oder keiner. */
  readonly endBarline?: 'single' | 'final' | 'none';
}

// ---------------------------------------------------------------------------
// Feste Maße (in Notenlinienabständen)

const STEM_LENGTH = 3.5;
const MIDDLE_LINE = 2;
const ACCIDENTAL_GAP = 0.2;
const ACCIDENTAL_COLUMN_GAP = 0.1;
/** Zwei Vorzeichen dürfen in einer Spalte stehen, wenn sie mindestens eine Septime (3 Abstände) auseinander sind. */
const ACCIDENTAL_COLUMN_DISTANCE = 3;
const DOT_GAP = 0.35;
const DOT_SPACING = 0.5;
const MEASURE_PADDING = 1;
const HEADER_GAP = 1.5;
const BEAM_SLOPE_MAX = 1;
const BEAM_STEM_MIN = 3;
const STUB_LENGTH = 1.1;

const { stemThickness, beamThickness, beamSpacing, legerLineExtension } = ENGRAVING_DEFAULTS;

// ---------------------------------------------------------------------------

/** Berechnet das Layout einer Partitur. Wirft einen RangeError bei Elementen, die Layout v1 noch nicht kann. */
export function layoutScore(score: Score, options: LayoutOptions = {}): ScoreLayout {
  if (score.staves.length > 1) return layoutMultipleStaves(score, options);
  const staff = checkPhaseOne(score);
  const items: LayoutItem[] = [];
  const quarterSpace = options.quarterSpace ?? 3.5;

  let x = 0.5;
  x = layoutClef(staff.clef, x, items) + 1;
  x = layoutKeySignature(staff, x, items);
  x =
    (options.showTimeSignature === false ? x : layoutTimeSignature(staff.timeSignature, x, items)) +
    HEADER_GAP;

  const events = prepareEvents(score, staff);
  const placed = new Map<string, PlacedEvent>();

  staff.measures.forEach((_, measureIndex) => {
    const measureEvents = events.filter((e) => e.measure === measureIndex);
    const wholeMeasureRest = isWholeMeasureRest(measureEvents, staff.timeSignature);
    if (wholeMeasureRest) {
      const width = 5;
      const rest = measureEvents[0];
      if (rest) {
        const glyphX = x + (width - glyphWidth('restWhole')) / 2;
        items.push(glyph('restWhole', glyphX, 1, 'rest', { measure: measureIndex, event: 0 }));
      }
      x += width;
    } else {
      for (let index = 0; index < measureEvents.length;) {
        const first = measureEvents[index];
        if (!first) break;
        const group = measureEvents.filter((e) => fractionEquals(e.onset, first.onset));
        const left = Math.max(...group.map(leftExtent));
        const column = x + left;
        for (const e of group) {
          e.x = column;
          placed.set(key(e.measure, e.index, e.voice), e);
          emitEvent(e, items);
        }
        x +=
          left +
          Math.max(...group.map((e) => Math.max(spacing(e, quarterSpace), rightExtent(e) + 0.6)));
        index += group.length;
      }
    }
    const last = measureIndex === staff.measures.length - 1;
    if (!last) {
      items.push(barline(x));
      x += MEASURE_PADDING;
    }
  });

  layoutBeams(events, items);
  layoutTriplets(events, items);
  layoutTies(score, placed, items);
  layoutSlurs(score, placed, items);

  const end = options.endBarline ?? 'single';
  const width = layoutEndBarline(end, x, items);
  const staffLines: LayoutItem[] = [0, 1, 2, 3, 4].map((line) => ({
    kind: 'line',
    x1: 0,
    y1: line,
    x2: width,
    y2: line,
    thickness: ENGRAVING_DEFAULTS.staffLineThickness,
    role: 'staffLine',
  }));
  items.unshift(...staffLines);
  const { top, bottom } = extents(items);
  return {
    width: round(width),
    top: round(top),
    bottom: round(bottom),
    items: items.map(roundItem),
  };
}

/** Systeme werden nach ihren Taktstrichen auf gemeinsame Spalten gestreckt. */
function layoutMultipleStaves(score: Score, options: LayoutOptions): ScoreLayout {
  const at = <T>(values: readonly T[], index: number): T => {
    const value = values[index];
    if (value === undefined) throw new RangeError('Unvollständige Systemausrichtung');
    return value;
  };
  const count = score.staves[0]?.measures.length;
  if (!count || score.staves.some((staff) => staff.measures.length !== count))
    throw new RangeError('Alle Systeme brauchen dieselbe Taktzahl');
  const layouts = score.staves.map((staff) => layoutScore({ staves: [staff] }, options));
  const cuts = layouts.map((layout) => [
    0,
    ...layout.items
      .filter(
        (item): item is Extract<LayoutItem, { kind: 'line' }> =>
          item.kind === 'line' && item.role === 'barline',
      )
      .map((item) => item.x1)
      .slice(0, count),
  ]);
  if (options.endBarline === 'none')
    cuts.forEach((list, index) => list.push(at(layouts, index).width));
  if (cuts.some((list) => list.length !== cuts[0]?.length))
    throw new RangeError('Taktstriche der Systeme stimmen nicht überein');
  const shared = at(cuts, 0).map((_, i) => Math.max(...cuts.map((list) => at(list, i))));
  const mapX = (value: number, list: number[]): number => {
    const found = list.findIndex((_, i) => i < list.length - 1 && value <= at(list, i + 1));
    const segment = found < 0 ? list.length - 2 : found;
    const left = at(list, segment);
    const right = at(list, segment + 1);
    return (
      at(shared, segment) +
      ((value - left) * (at(shared, segment + 1) - at(shared, segment))) / (right - left)
    );
  };
  const gap = 10;
  const items = layouts.flatMap((layout, staff) =>
    layout.items.map((item): LayoutItem => {
      const x = (value: number) => mapX(value, at(cuts, staff));
      const y = (value: number) => value + staff * gap;
      const ref = 'ref' in item ? { ...item.ref, staff } : undefined;
      switch (item.kind) {
        case 'glyph':
          return { ...item, x: x(item.x), y: y(item.y), ...(ref ? { ref } : {}) };
        case 'label':
          return { ...item, x: x(item.x), y: y(item.y), ...(ref ? { ref } : {}) };
        case 'line':
          return {
            ...item,
            x1: x(item.x1),
            x2: x(item.x2),
            y1: y(item.y1),
            y2: y(item.y2),
            ...(ref ? { ref } : {}),
          };
        case 'beam':
          return { ...item, x1: x(item.x1), x2: x(item.x2), y1: y(item.y1), y2: y(item.y2) };
        case 'tie':
        case 'slur':
          return { ...item, x1: x(item.x1), x2: x(item.x2), y: y(item.y) };
      }
    }),
  );
  // Durchgehende Anfangs- und Taktstriche verbinden die Systeme.
  for (const x of shared.slice(1)) {
    items.push({
      kind: 'line',
      x1: x,
      x2: x,
      y1: 4,
      y2: (score.staves.length - 1) * gap,
      thickness: ENGRAVING_DEFAULTS.thinBarlineThickness,
      role: 'barline',
    });
  }
  items.push({
    kind: 'line',
    x1: 0,
    x2: 0,
    y1: 0,
    y2: (score.staves.length - 1) * gap + 4,
    thickness: ENGRAVING_DEFAULTS.thinBarlineThickness,
    role: 'barline',
  });
  const extent = extents(items);
  const width = Math.max(...layouts.map((layout, staff) => mapX(layout.width, at(cuts, staff))));
  return {
    width: round(width),
    top: round(extent.top),
    bottom: round(extent.bottom),
    items: items.map(roundItem),
  };
}

/** Bewusst begrenzt auf vollständige, zusammenhängende Achteltriolen innerhalb einer Viertel. */
function layoutTriplets(events: readonly PlacedEvent[], items: LayoutItem[]) {
  const voices = new Set(events.map((event) => event.voice));
  for (const voice of voices) {
    const stream = events.filter((event) => event.voice === voice);
    for (let index = 0; index < stream.length; index++) {
      const first = stream[index];
      if (!first?.event.duration.tuplet) continue;
      const group = stream.slice(index, index + 3);
      if (
        group.length !== 3 ||
        !Number.isInteger(fractionToNumber(first.onset) * 4) ||
        group.some(
          (e) =>
            e.measure !== first.measure ||
            e.voice !== first.voice ||
            e.event.kind !== 'note' ||
            e.event.duration.value !== 'eighth' ||
            e.event.duration.dots !== 0 ||
            e.event.duration.tuplet?.actual !== 3 ||
            e.event.duration.tuplet.normal !== 2,
        )
      )
        throw new RangeError(
          'Layout unterstützt nur vollständige unpunktierte 3:2-Achteltriolen ohne Pausen',
        );
      const last = group[2];
      if (
        !last ||
        !fractionEquals(durationValue(first.event.duration), durationValue(last.event.duration))
      )
        throw new RangeError('Ungültige Triole');
      const down = first.stem === 'down';
      const y = down
        ? Math.max(...group.map((e) => e.stemTip ?? 4)) + 1.5
        : Math.min(...group.map((e) => e.stemTip ?? 0)) - 0.8;
      items.push(
        glyph(
          'tuplet3',
          (first.x + last.x) / 2 -
            (glyphMetrics('tuplet3').bBoxNE[0] + glyphMetrics('tuplet3').bBoxSW[0]) / 2,
          y,
          'tuplet',
        ),
      );
      index += 2;
    }
  }
}
/** Auf Tausendstel eines Abstands runden: stabile, lesbare Daten (ein Tausendstel ist weit unter einem Pixel). */
function round(value: number): number {
  return Math.round(value * 1000) / 1000 || 0;
}

function roundItem(item: LayoutItem): LayoutItem {
  switch (item.kind) {
    case 'glyph':
    case 'label':
      return { ...item, x: round(item.x), y: round(item.y) };
    case 'line':
    case 'beam':
      return {
        ...item,
        x1: round(item.x1),
        y1: round(item.y1),
        x2: round(item.x2),
        y2: round(item.y2),
      };
    case 'tie':
    case 'slur':
      return { ...item, x1: round(item.x1), x2: round(item.x2), y: round(item.y) };
  }
}

function checkPhaseOne(score: Score): Staff {
  const [staff, ...others] = score.staves;
  if (!staff || others.length > 0) {
    throw new RangeError('Layout v1 kann genau ein System (mehrere ab Phase 3)');
  }
  staff.measures.forEach((m, i) => {
    if (m.voices.length < 1 || m.voices.length > 2) {
      throw new RangeError(`Takt ${String(i + 1)}: Layout kann eine oder zwei Stimmen`);
    }
    if (m.changes) {
      throw new RangeError(
        `Takt ${String(i + 1)}: Wechsel stellt Layout v1 noch nicht dar (ab Phase 3)`,
      );
    }
  });
  if (staff.measures.length === 0) {
    throw new RangeError('Partitur ohne Takte');
  }
  return staff;
}

// ---------------------------------------------------------------------------
// Tonhöhe → Position

const TOP_LINE: Readonly<Record<Clef, Pitch>> = {
  treble: parsePitch('F5'),
  bass: parsePitch('A3'),
  alto: parsePitch('G4'),
  tenor: parsePitch('E4'),
};

/** y einer Tonhöhe im System: oberste Linie 0, unterste 4, Schritt = halber Abstand. */
export function staffY(p: Pitch, clef: Clef): number {
  return (diatonicIndex(TOP_LINE[clef]) - diatonicIndex(p)) * 0.5;
}

// ---------------------------------------------------------------------------
// Schlüssel, Vorzeichnung, Taktart

const CLEF_GLYPHS: Readonly<Record<Clef, { glyph: GlyphName; y: number }>> = {
  treble: { glyph: 'gClef', y: 3 }, // Ursprung auf der g¹-Linie (zweite von unten)
  bass: { glyph: 'fClef', y: 1 }, // Ursprung auf der f-Linie (zweite von oben)
  alto: { glyph: 'cClef', y: 2 },
  tenor: { glyph: 'cClef', y: 1 }, // c¹ auf der vierten Linie von unten
};

function layoutClef(clef: Clef, x: number, items: LayoutItem[]): number {
  const { glyph: name, y } = CLEF_GLYPHS[clef];
  items.push(glyph(name, x, y, 'clef'));
  return x + glyphRight(name);
}

/** Notenposition der Vorzeichen im Violinschlüssel; im Bassschlüssel zwei Oktaven tiefer. */
const SIGNATURE_PITCHES = {
  sharps: ['F5', 'C5', 'G5', 'D5', 'A4', 'E5', 'B4'],
  flats: ['B4', 'E5', 'A4', 'D5', 'G4', 'C5', 'F4'],
} as const;

/** Positionen der Vorzeichnung (y) für Violin- und Bassschlüssel. */
export function keySignatureYs(fifths: number, clef: Clef): number[] {
  const list = fifths >= 0 ? SIGNATURE_PITCHES.sharps : SIGNATURE_PITCHES.flats;
  return list.slice(0, Math.abs(fifths)).map((text) => {
    const p = parsePitch(text);
    if (clef === 'treble') return staffY(p, clef);
    const preferred = clef === 'bass' ? 2 : clef === 'alto' ? 2 : 2.5;
    const candidates = [-2, -1, 0, 1].map((shift) =>
      staffY({ ...p, octave: p.octave + shift }, clef),
    );
    return (
      candidates
        .filter((y) => y >= -0.5 && y <= 4)
        .sort((a, b) => Math.abs(a - preferred) - Math.abs(b - preferred))[0] ?? staffY(p, clef)
    );
  });
}

function layoutKeySignature(staff: Staff, x: number, items: LayoutItem[]): number {
  const { fifths } = staff.keySignature;
  if (fifths === 0) {
    return x;
  }
  const name: GlyphName = fifths > 0 ? 'accidentalSharp' : 'accidentalFlat';
  let cursor = x;
  for (const y of keySignatureYs(fifths, staff.clef)) {
    items.push(glyph(name, cursor, y, 'keySignature'));
    cursor += glyphRight(name) + 0.12;
  }
  return cursor + 0.8;
}

function layoutTimeSignature(ts: TimeSignature, x: number, items: LayoutItem[]): number {
  const top = defaultGrouping(ts) ? String(ts.numerator) : ts.grouping.join('+');
  const bottom = String(ts.denominator);
  const width = Math.max(timeWidth(top), timeWidth(bottom));
  placeTimeText(top, x + (width - timeWidth(top)) / 2, 1, items);
  placeTimeText(bottom, x + (width - timeWidth(bottom)) / 2, 3, items);
  return x + width;
}

function defaultGrouping(ts: TimeSignature): boolean {
  if (ts.grouping.every((g) => g === 1)) {
    return true;
  }
  return ts.grouping.every((g) => g === 3) && [6, 9, 12].includes(ts.numerator);
}

function timeGlyph(char: string): GlyphName {
  return char === '+' ? 'timeSigPlus' : (`timeSig${char}` as GlyphName);
}

function timeWidth(text: string): number {
  return (text.match(/[0-9+]/g) ?? []).reduce((sum, c) => sum + glyphRight(timeGlyph(c)), 0);
}

function placeTimeText(text: string, x: number, y: number, items: LayoutItem[]): void {
  let cursor = x;
  for (const c of text) {
    const name = timeGlyph(c);
    items.push(glyph(name, cursor, y, 'timeSignature'));
    cursor += glyphRight(name);
  }
}

// ---------------------------------------------------------------------------
// Ereignisse vorbereiten: Notenköpfe, Vorzeichen, Halsrichtung, Balkengruppen

interface Head {
  readonly pitch: Pitch;
  readonly y: number;
  /** Index im Akkord der Partitur */
  readonly note: number;
  /** Seitlich versetzt (Sekunde im Akkord) */
  displaced: boolean;
  accidental?: GlyphName;
  accidentalX?: number;
}

interface PlacedEvent {
  readonly measure: number;
  readonly voice: number;
  readonly polyphonic: boolean;
  readonly index: number;
  readonly event: VoiceEvent;
  readonly value: NoteValue;
  readonly dots: number;
  readonly onset: Fraction;
  /** Notenköpfe von oben nach unten */
  readonly heads: Head[];
  stem: 'up' | 'down' | 'none';
  beamGroup?: number;
  beamLevels: number;
  /** x der normalen Notenkopfspalte (bzw. der Pause) */
  x: number;
  /** Halsende (y), sobald bekannt */
  stemTip?: number;
}

const NOTEHEADS: Readonly<Record<NoteValue, GlyphName>> = {
  breve: 'noteheadDoubleWhole',
  whole: 'noteheadWhole',
  half: 'noteheadHalf',
  quarter: 'noteheadBlack',
  eighth: 'noteheadBlack',
  sixteenth: 'noteheadBlack',
  thirtySecond: 'noteheadBlack',
  sixtyFourth: 'noteheadBlack',
};

const RESTS: Readonly<Record<NoteValue, GlyphName>> = {
  breve: 'restDoubleWhole',
  whole: 'restWhole',
  half: 'restHalf',
  quarter: 'restQuarter',
  eighth: 'rest8th',
  sixteenth: 'rest16th',
  thirtySecond: 'rest32nd',
  sixtyFourth: 'rest64th',
};

const BEAM_LEVELS: Readonly<Record<NoteValue, number>> = {
  breve: 0,
  whole: 0,
  half: 0,
  quarter: 0,
  eighth: 1,
  sixteenth: 2,
  thirtySecond: 3,
  sixtyFourth: 4,
};

const ACCIDENTALS: Readonly<Record<number, GlyphName>> = {
  [-2]: 'accidentalDoubleFlat',
  [-1]: 'accidentalFlat',
  0: 'accidentalNatural',
  1: 'accidentalSharp',
  2: 'accidentalDoubleSharp',
};

function key(measure: number, index: number, voice = 0): string {
  return `${String(measure)}:${String(voice)}:${String(index)}`;
}

function prepareEvents(score: Score, staff: Staff): PlacedEvent[] {
  const signature = keyFromFifths(staff.keySignature.fifths);
  // Haltebogen-Ziele bekommen kein Vorzeichen (die Bindung trägt es über den Taktstrich).
  const tieTargets = new Set(
    ties(score).map((t) => `${key(t.to.measure, t.to.event, t.to.voice)}:${pitchKey(t.pitch)}`),
  );
  const result: PlacedEvent[] = [];
  let groupCounter = 0;

  staff.measures.forEach((m, measure) => {
    const state = new Map<string, number>();
    const measureEvents: PlacedEvent[] = m.voices
      .flatMap((voice, voiceIndex) => {
        let onset = ZERO;
        return voice.events.map((event, index) => {
          const pitches = eventPitches(event);
          const heads: Head[] = pitches
            .map((pitch, note) => ({ pitch, y: staffY(pitch, staff.clef), note, displaced: false }))
            .sort((a, b) => a.y - b.y);
          const placedEvent: PlacedEvent = {
            measure,
            voice: voiceIndex,
            polyphonic: m.voices.length > 1,
            index,
            event,
            value: event.duration.value,
            dots: event.duration.dots,
            onset,
            heads,
            stem: 'none',
            beamLevels: event.kind === 'rest' ? 0 : BEAM_LEVELS[event.duration.value],
            x: 0,
          };
          onset = addFractions(onset, durationValue(event.duration));
          return placedEvent;
        });
      })
      .sort((a, b) => compareFractions(a.onset, b.onset) || a.voice - b.voice);
    for (const placedEvent of measureEvents) {
      for (const head of [...placedEvent.heads].sort((a, b) => a.note - b.note)) {
        const id = `${head.pitch.letter}${String(head.pitch.octave)}`;
        if (
          tieTargets.has(
            `${key(measure, placedEvent.index, placedEvent.voice)}:${pitchKey(head.pitch)}`,
          )
        ) {
          continue;
        }
        const expected = state.get(id) ?? signatureAlter(signature, head.pitch.letter);
        const accidental = ACCIDENTALS[head.pitch.alter];
        if (head.pitch.alter !== expected && accidental) {
          head.accidental = accidental;
          state.set(id, head.pitch.alter);
        }
      }
    }

    // Balkengruppen: aufeinanderfolgende Achtel und kürzer innerhalb einer Zählzeit
    const beatBounds = beatBoundaries(staff.timeSignature);
    m.voices.forEach((_, voice) => {
      let current: PlacedEvent[] = [];
      const flush = () => {
        if (current.length >= 2) {
          groupCounter++;
          for (const e of current) {
            e.beamGroup = groupCounter;
          }
        }
        current = [];
      };
      for (const e of measureEvents.filter((item) => item.voice === voice)) {
        const end = addFractions(e.onset, durationValue(e.event.duration));
        const beat = beatBounds.find(
          ([start, stop]) =>
            compareFractions(e.onset, start) >= 0 && compareFractions(e.onset, stop) < 0,
        );
        const fits = beat !== undefined && compareFractions(end, beat[1]) <= 0;
        if (e.beamLevels === 0 || !fits) {
          flush();
          continue;
        }
        const previous = current.at(-1);
        const previousBeat =
          previous &&
          beatBounds.find(
            ([start, stop]) =>
              compareFractions(previous.onset, start) >= 0 &&
              compareFractions(previous.onset, stop) < 0,
          );
        if (previousBeat && !fractionEquals(previousBeat[0], beat[0])) {
          flush();
        }
        current.push(e);
      }
      flush();
    });
    result.push(...measureEvents);
  });

  // Halsrichtung: Gruppen gemeinsam, sonst je Ereignis
  const groups = new Map<number, PlacedEvent[]>();
  for (const e of result) {
    if (e.beamGroup !== undefined) {
      groups.set(e.beamGroup, [...(groups.get(e.beamGroup) ?? []), e]);
    } else if (e.heads.length > 0 && e.value !== 'whole' && e.value !== 'breve') {
      e.stem = e.polyphonic
        ? e.voice === 0
          ? 'up'
          : 'down'
        : stemDirection(e.heads.map((h) => h.y));
    }
  }
  for (const members of groups.values()) {
    const direction = members[0]?.polyphonic
      ? members[0].voice === 0
        ? 'up'
        : 'down'
      : stemDirection(members.flatMap((e) => e.heads.map((h) => h.y)));
    for (const e of members) {
      e.stem = direction;
    }
  }
  for (const e of result) {
    displaceSeconds(e);
    placeAccidentals(e);
  }
  return result;
}

function pitchKey(p: Pitch): string {
  return `${p.letter}${String(p.alter)}${String(p.octave)}`;
}

function beatBoundaries(ts: TimeSignature): [Fraction, Fraction][] {
  let start = ZERO;
  return beats(ts).map((b) => {
    const span: [Fraction, Fraction] = [start, addFractions(start, b)];
    start = span[1];
    return span;
  });
}

/**
 * Halsrichtung nach der Note, die am weitesten von der Mittellinie entfernt ist.
 * Auf oder über der Mittellinie Hals nach unten; bei Gleichstand nach unten.
 */
export function stemDirection(ys: readonly number[]): 'up' | 'down' {
  const highest = Math.min(...ys);
  const lowest = Math.max(...ys);
  const above = MIDDLE_LINE - highest;
  const below = lowest - MIDDLE_LINE;
  return below > above ? 'up' : 'down';
}

/**
 * Sekunden im Akkord: Die untere Note einer Sekunde steht immer links.
 * Vom Halsansatz aus (Hals nach oben: von unten) bleibt die erste Note normal; folgt im Sekundabstand
 * eine weitere, wechselt sie auf die andere Seite des Halses.
 */
function displaceSeconds(e: PlacedEvent): void {
  if (e.heads.length < 2) {
    return;
  }
  const fromBase = e.stem === 'down' ? [...e.heads] : [...e.heads].reverse();
  let previous: Head | undefined;
  for (const head of fromBase) {
    if (previous && !previous.displaced && Math.abs(previous.y - head.y) === 0.5) {
      head.displaced = true;
    }
    previous = head;
  }
}

/** Vorzeichen in Spalten: oben, unten, zweitoberes, zweitunteres … jeweils in die erste passende Spalte. */
function placeAccidentals(e: PlacedEvent): void {
  const withAccidental = e.heads.filter((h) => h.accidental !== undefined);
  const order: Head[] = [];
  let top = 0;
  let bottom = withAccidental.length - 1;
  while (top <= bottom) {
    const upper = withAccidental[top];
    if (upper) {
      order.push(upper);
    }
    if (bottom !== top) {
      const lower = withAccidental[bottom];
      if (lower) {
        order.push(lower);
      }
    }
    top++;
    bottom--;
  }
  const columns: Head[][] = [];
  for (const head of order) {
    const column = columns.find((c) =>
      c.every((other) => Math.abs(other.y - head.y) >= ACCIDENTAL_COLUMN_DISTANCE),
    );
    if (column) {
      column.push(head);
    } else {
      columns.push([head]);
    }
  }
  // accidentalX wird relativ zur linken Kante der Notenköpfe gespeichert (negativ)
  let right = -ACCIDENTAL_GAP;
  for (const column of columns) {
    const width = Math.max(...column.map((h) => glyphRight(h.accidental ?? 'accidentalNatural')));
    for (const head of column) {
      head.accidentalX = right - glyphRight(head.accidental ?? 'accidentalNatural');
    }
    right -= width + ACCIDENTAL_COLUMN_GAP;
  }
}

// ---------------------------------------------------------------------------
// Horizontale Ausdehnung

function headGlyph(e: PlacedEvent): GlyphName {
  return NOTEHEADS[e.value];
}

/** Versatz eines Notenkopfs auf die andere Halsseite. */
function displacement(e: PlacedEvent): number {
  return glyphRight(headGlyph(e)) - stemThickness;
}

function leftExtent(e: PlacedEvent): number {
  const displacedLeft = e.stem === 'down' && e.heads.some((h) => h.displaced) ? displacement(e) : 0;
  const accidentals = Math.min(0, ...e.heads.map((h) => h.accidentalX ?? 0));
  return displacedLeft - accidentals;
}

function rightExtent(e: PlacedEvent): number {
  if (e.event.kind === 'rest') {
    return glyphRight(RESTS[e.value]) + (e.dots > 0 ? DOT_GAP + e.dots * DOT_SPACING : 0);
  }
  const displacedRight =
    e.stem !== 'down' && e.heads.some((h) => h.displaced) ? displacement(e) : 0;
  let right = glyphRight(headGlyph(e)) + displacedRight;
  if (e.dots > 0) {
    right += DOT_GAP + e.dots * DOT_SPACING;
  }
  if (e.stem === 'up' && e.beamGroup === undefined && e.beamLevels > 0) {
    right = Math.max(right, glyphRight(headGlyph(e)) + glyphRight('flag8thUp'));
  }
  if (e.event.harmony) {
    right = Math.max(
      right,
      Math.max(
        e.event.harmony.chordSymbol?.length ?? 0,
        e.event.harmony.functionSymbol?.length ?? 0,
      ) * 0.8,
    );
  }
  return right;
}

/** Abstand nach Notenwert: jede Verdopplung des Werts ×√2. */
function spacing(e: PlacedEvent, quarterSpace: number): number {
  const value = fractionToNumber(durationValue(e.event.duration));
  return quarterSpace * Math.sqrt(value / 0.25);
}

function isWholeMeasureRest(events: readonly PlacedEvent[], ts: TimeSignature): boolean {
  const [only, ...rest] = events;
  return (
    only !== undefined &&
    rest.length === 0 &&
    only.event.kind === 'rest' &&
    fractionEquals(durationValue(only.event.duration), measureLength(ts))
  );
}

// ---------------------------------------------------------------------------
// Zeichnen eines Ereignisses (ohne Balken)

function emitEvent(e: PlacedEvent, items: LayoutItem[]): void {
  const ref = e.polyphonic
    ? { measure: e.measure, voice: e.voice, event: e.index }
    : { measure: e.measure, event: e.index };
  if (e.event.kind !== 'rest' && e.event.harmony) {
    if (e.event.harmony.chordSymbol)
      items.push({
        kind: 'label',
        text: e.event.harmony.chordSymbol,
        x: e.x,
        y: -4.2,
        role: 'chordSymbol',
        ref,
      });
    if (e.event.harmony.functionSymbol)
      items.push({
        kind: 'label',
        text: e.event.harmony.functionSymbol,
        x: e.x,
        y: -2.6,
        role: 'functionSymbol',
        ref,
      });
  }
  if (e.event.kind === 'rest') {
    const name = RESTS[e.value];
    const y = e.polyphonic ? (e.voice === 0 ? 0 : 4) : e.value === 'whole' ? 1 : MIDDLE_LINE;
    items.push(glyph(name, e.x, y, 'rest', ref));
    emitDots(e.x + glyphRight(name) + DOT_GAP, [1.5], e.dots, items, ref);
    return;
  }
  const head = headGlyph(e);
  const width = glyphRight(head);
  const offset = displacement(e);
  const headX = (h: Head): number =>
    h.displaced ? e.x + (e.stem === 'down' ? -offset : offset) : e.x;

  // Hilfslinien
  const ledger = new Set<number>();
  for (const h of e.heads) {
    for (let line = -1; line >= h.y; line--) {
      ledger.add(line);
    }
    for (let line = 5; line <= h.y; line++) {
      ledger.add(line);
    }
  }
  const lefts = e.heads.map(headX);
  const ledgerLeft = Math.min(...lefts) - legerLineExtension;
  const ledgerRight = Math.max(...lefts) + width + legerLineExtension;
  for (const line of [...ledger].sort((a, b) => a - b)) {
    items.push({
      kind: 'line',
      x1: ledgerLeft,
      y1: line,
      x2: ledgerRight,
      y2: line,
      thickness: ENGRAVING_DEFAULTS.legerLineThickness,
      role: 'ledgerLine',
    });
  }

  const leftEdge = Math.min(...lefts);
  for (const h of e.heads) {
    const noteRef = { ...ref, note: h.note };
    items.push(glyph(head, headX(h), h.y, 'notehead', noteRef));
    if (h.accidental) {
      items.push(glyph(h.accidental, leftEdge + (h.accidentalX ?? 0), h.y, 'accidental', noteRef));
    }
  }

  // Punkte: auf einer Linie in den Zwischenraum darüber; doppelte Positionen nach unten ausweichen
  const dotX = Math.max(...lefts) + width + DOT_GAP;
  const dotYs: number[] = [];
  for (const h of e.heads) {
    let y = Number.isInteger(h.y) ? h.y - 0.5 : h.y;
    while (dotYs.includes(y)) {
      y += 1;
    }
    dotYs.push(y);
  }
  emitDots(dotX, dotYs, e.dots, items, ref);

  if (e.stem !== 'none' && e.beamGroup === undefined) {
    const tip = stemTip(e);
    e.stemTip = tip;
    items.push(stemLine(e, tip, ref));
    if (e.beamLevels > 0) {
      const name = flagGlyph(e.beamLevels, e.stem);
      const anchorName = e.stem === 'up' ? 'stemUpNW' : 'stemDownSW';
      const anchorY = METRICS[name].anchors?.[anchorName]?.[1] ?? 0;
      items.push(glyph(name, stemX(e) - stemThickness / 2, tip + anchorY, 'flag', ref));
    }
  }
}

function emitDots(
  x: number,
  ys: readonly number[],
  dots: number,
  items: LayoutItem[],
  ref: EventRef,
): void {
  for (const y of ys) {
    for (let i = 0; i < dots; i++) {
      items.push(glyph('augmentationDot', x + i * DOT_SPACING, y, 'dot', ref));
    }
  }
}

function flagGlyph(levels: number, stem: 'up' | 'down'): GlyphName {
  const size = ['8th', '16th', '32nd', '64th'][levels - 1] ?? '64th';
  return `flag${size}${stem === 'up' ? 'Up' : 'Down'}` as GlyphName;
}

/** x der Halsmitte. */
function stemX(e: PlacedEvent): number {
  const head = METRICS[headGlyph(e)];
  return e.stem === 'up'
    ? e.x + (head.anchors?.['stemUpSE']?.[0] ?? glyphRight(headGlyph(e))) - stemThickness / 2
    : e.x + (head.anchors?.['stemDownNW']?.[0] ?? 0) + stemThickness / 2;
}

/** Notenkopf am Halsansatz (fern vom Halsende) und am Halsende. */
function stemEnds(e: PlacedEvent): { base: Head; near: Head } {
  const first = e.heads[0];
  const last = e.heads.at(-1);
  if (!first || !last) {
    throw new RangeError('Hals ohne Notenkopf');
  }
  return e.stem === 'up' ? { base: last, near: first } : { base: first, near: last };
}

/**
 * Halsende bei Noten ohne Balken: eine Oktave (3,5 Abstände) vom äußersten Kopf, bei Noten außerhalb
 * des Systems mindestens bis zur Mittellinie. 32stel und 64stel verlängern wegen der Fähnchen.
 */
function stemTip(e: PlacedEvent): number {
  const { near } = stemEnds(e);
  const extra = Math.max(0, e.beamLevels - 2) * 0.5;
  return e.stem === 'up'
    ? Math.min(near.y - STEM_LENGTH - extra, MIDDLE_LINE)
    : Math.max(near.y + STEM_LENGTH + extra, MIDDLE_LINE);
}

function stemLine(e: PlacedEvent, tip: number, ref: EventRef): LayoutItem {
  const { base } = stemEnds(e);
  const head = METRICS[headGlyph(e)];
  const attach =
    e.stem === 'up'
      ? (head.anchors?.['stemUpSE']?.[1] ?? 0)
      : (head.anchors?.['stemDownNW']?.[1] ?? 0);
  const x = stemX(e);
  return {
    kind: 'line',
    x1: x,
    y1: base.y - attach,
    x2: x,
    y2: tip,
    thickness: stemThickness,
    role: 'stem',
    ref,
  };
}

// ---------------------------------------------------------------------------
// Balken

function layoutBeams(events: readonly PlacedEvent[], items: LayoutItem[]): void {
  const groups = new Map<number, PlacedEvent[]>();
  for (const e of events) {
    if (e.beamGroup !== undefined) {
      groups.set(e.beamGroup, [...(groups.get(e.beamGroup) ?? []), e]);
    }
  }
  for (const members of groups.values()) {
    layoutBeamGroup(members, items);
  }
}

function layoutBeamGroup(members: readonly PlacedEvent[], items: LayoutItem[]): void {
  const first = members[0];
  const last = members.at(-1);
  if (!first || !last) {
    return;
  }
  const up = first.stem === 'up';
  const sign = up ? -1 : 1;
  const xs = members.map(stemX);
  const x0 = xs[0] ?? 0;
  const x1 = xs.at(-1) ?? x0;
  const nears = members.map((e) => stemEnds(e).near.y);
  const firstNear = nears[0] ?? MIDDLE_LINE;
  const lastNear = nears.at(-1) ?? firstNear;

  // Neigung nach dem Abstand der äußeren Noten, höchstens ein Abstand; bei „Bogenform“ waagerecht
  const inner = nears.slice(1, -1);
  const concave = up
    ? inner.some((y) => y < Math.min(firstNear, lastNear))
    : inner.some((y) => y > Math.max(firstNear, lastNear));
  const rawSlope = (lastNear - firstNear) / 2;
  const totalSlope = concave ? 0 : Math.max(-BEAM_SLOPE_MAX, Math.min(BEAM_SLOPE_MAX, rawSlope));
  const slopeAt = (x: number): number => (x1 === x0 ? 0 : (totalSlope * (x - x0)) / (x1 - x0));

  // Startlage: ideale Halslänge an der ersten Note, dann so verschieben, dass alle Hälse lang genug sind
  const maxLevels = Math.max(...members.map((e) => e.beamLevels));
  const minStem = BEAM_STEM_MIN + (maxLevels - 1) * (beamThickness + beamSpacing);
  let y0 = firstNear + sign * STEM_LENGTH;
  members.forEach((e, i) => {
    const x = xs[i] ?? x0;
    const near = nears[i] ?? firstNear;
    const beamY = y0 + slopeAt(x);
    const length = (near - beamY) * -sign;
    if (length < minStem) {
      y0 += sign * (minStem - length);
    }
    // Hälse außerhalb des Systems reichen mindestens bis zur Mittellinie
    const atBeam = y0 + slopeAt(x);
    if (up ? atBeam > MIDDLE_LINE : atBeam < MIDDLE_LINE) {
      y0 += MIDDLE_LINE - atBeam;
    }
  });
  const beamY = (x: number): number => y0 + slopeAt(x);

  members.forEach((e, i) => {
    const x = xs[i] ?? x0;
    e.stemTip = beamY(x);
    items.push(
      stemLine(
        e,
        beamY(x),
        e.polyphonic
          ? { measure: e.measure, voice: e.voice, event: e.index }
          : { measure: e.measure, event: e.index },
      ),
    );
  });

  // Hauptbalken und weitere Ebenen (Teilbalken als kurze Stummel)
  const towards: 1 | -1 = up ? 1 : -1;
  for (let level = 1; level <= maxLevels; level++) {
    const shift = (level - 1) * (beamThickness + beamSpacing) * towards;
    let runStart = -1;
    for (let i = 0; i <= members.length; i++) {
      const has = (members[i]?.beamLevels ?? 0) >= level;
      if (has && runStart < 0) {
        runStart = i;
      }
      if (!has && runStart >= 0) {
        const runEnd = i - 1;
        const half = stemThickness / 2;
        let from = (xs[runStart] ?? x0) - half;
        let to = (xs[runEnd] ?? x0) + half;
        if (runStart === runEnd) {
          // Teilbalken: beim ersten Ereignis der Gruppe nach rechts, sonst nach links
          if (runStart === 0) {
            to = from + STUB_LENGTH;
          } else {
            from = to - STUB_LENGTH;
          }
        }
        items.push({
          kind: 'beam',
          x1: from,
          y1: beamY(from) + shift,
          x2: to,
          y2: beamY(to) + shift,
          thickness: beamThickness,
          towards,
        });
        runStart = -1;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Haltebögen

function layoutTies(score: Score, placed: Map<string, PlacedEvent>, items: LayoutItem[]): void {
  for (const t of ties(score)) {
    const from = placed.get(key(t.from.measure, t.from.event, t.from.voice));
    const to = placed.get(key(t.to.measure, t.to.event, t.to.voice));
    const fromHead = from?.heads.find((h) => equals(h.pitch, t.pitch));
    const toHead = to?.heads.find((h) => equals(h.pitch, t.pitch));
    if (!from || !to || !fromHead || !toHead) {
      continue;
    }
    const width = glyphRight(headGlyph(from));
    const direction = tieDirection(from, fromHead);
    const offset = direction === 'up' ? -0.6 : 0.6;
    items.push({
      kind: 'tie',
      x1:
        from.x +
        (fromHead.displaced && from.stem !== 'down' ? displacement(from) : 0) +
        width +
        0.1,
      x2: to.x - (toHead.displaced && to.stem === 'down' ? displacement(to) : 0) - 0.1,
      y: fromHead.y + offset,
      direction,
    });
  }
}

function layoutSlurs(score: Score, placed: Map<string, PlacedEvent>, items: LayoutItem[]): void {
  for (const span of slurs(score)) {
    const from = placed.get(key(span.from.measure, span.from.event, span.from.voice));
    const to = placed.get(key(span.to.measure, span.to.event, span.to.voice));
    if (!from || !to || from.heads.length === 0 || to.heads.length === 0) continue;
    const direction = from.polyphonic
      ? from.voice === 0
        ? 'up'
        : 'down'
      : from.stem === 'up'
        ? 'down'
        : 'up';
    const head = direction === 'up' ? from.heads[0] : from.heads.at(-1);
    if (!head) continue;
    items.push({
      kind: 'slur',
      x1: from.x + glyphRight(headGlyph(from)) + 0.1,
      x2: to.x - 0.1,
      y: head.y + (direction === 'up' ? -0.8 : 0.8),
      direction,
    });
  }
}

/** Einzelnoten: Bogen gegenüber dem Hals; Akkorde: oberster Ton nach oben, unterster nach unten, Mitte nach Lage. */
function tieDirection(e: PlacedEvent, head: Head): 'up' | 'down' {
  if (e.heads.length > 1) {
    if (head === e.heads[0]) {
      return 'up';
    }
    if (head === e.heads.at(-1)) {
      return 'down';
    }
    return head.y < MIDDLE_LINE ? 'up' : 'down';
  }
  if (e.stem === 'up') {
    return 'down';
  }
  if (e.stem === 'down') {
    return 'up';
  }
  return head.y < MIDDLE_LINE ? 'up' : 'down';
}

// ---------------------------------------------------------------------------
// Taktstriche

function barline(x: number): LayoutItem {
  const t = ENGRAVING_DEFAULTS.thinBarlineThickness;
  return {
    kind: 'line',
    x1: x + t / 2,
    y1: 0,
    x2: x + t / 2,
    y2: 4,
    thickness: t,
    role: 'barline',
  };
}

/** Zeichnet den Abschluss und liefert die Gesamtbreite. */
function layoutEndBarline(
  end: 'single' | 'final' | 'none',
  x: number,
  items: LayoutItem[],
): number {
  if (end === 'none') {
    return x;
  }
  items.push(barline(x));
  const thin = ENGRAVING_DEFAULTS.thinBarlineThickness;
  if (end === 'single') {
    return x + thin;
  }
  const thick = ENGRAVING_DEFAULTS.thickBarlineThickness;
  const thickX = x + thin + ENGRAVING_DEFAULTS.barlineSeparation + thick / 2;
  items.push({
    kind: 'line',
    x1: thickX,
    y1: 0,
    x2: thickX,
    y2: 4,
    thickness: thick,
    role: 'barline',
  });
  return thickX + thick / 2;
}

// ---------------------------------------------------------------------------
// Hilfsfunktionen

function glyph(
  name: GlyphName,
  x: number,
  y: number,
  role: Extract<LayoutItem, { kind: 'glyph' }>['role'],
  ref?: EventRef,
): LayoutItem {
  return ref
    ? { kind: 'glyph', glyph: name, x, y, role, ref }
    : { kind: 'glyph', glyph: name, x, y, role };
}

function glyphRight(name: GlyphName): number {
  return METRICS[name].bBoxNE[0];
}

function glyphWidth(name: GlyphName): number {
  return METRICS[name].bBoxNE[0] - METRICS[name].bBoxSW[0];
}

function extents(items: readonly LayoutItem[]): { top: number; bottom: number } {
  let top = 0;
  let bottom = 4;
  for (const item of items) {
    switch (item.kind) {
      case 'glyph': {
        const m = METRICS[item.glyph];
        top = Math.min(top, item.y - m.bBoxNE[1]);
        bottom = Math.max(bottom, item.y - m.bBoxSW[1]);
        break;
      }
      case 'label':
        top = Math.min(top, item.y - 1.4);
        bottom = Math.max(bottom, item.y);
        break;
      case 'line':
        top = Math.min(top, item.y1, item.y2);
        bottom = Math.max(bottom, item.y1, item.y2);
        break;
      case 'beam': {
        const ys = [
          item.y1,
          item.y2,
          item.y1 + item.towards * item.thickness,
          item.y2 + item.towards * item.thickness,
        ];
        top = Math.min(top, ...ys);
        bottom = Math.max(bottom, ...ys);
        break;
      }
      case 'tie':
      case 'slur':
        top = Math.min(top, item.y - 1);
        bottom = Math.max(bottom, item.y + 1);
        break;
    }
  }
  return { top, bottom };
}

/** Waagerechter Bereich eines Ereignisses (Notenköpfe, Vorzeichen, Punkte, Fähnchen, Hälse). */
export interface EventBounds {
  readonly staff?: number;
  readonly measure: number;
  readonly voice?: number;
  readonly event: number;
  readonly x1: number;
  readonly x2: number;
}

/** Bereiche aller Ereignisse, z. B. für Screenreader-Flächen und später für Antippen. */
export function eventBounds(layout: ScoreLayout): EventBounds[] {
  const bounds = new Map<string, EventBounds>();
  for (const item of layout.items) {
    if (!('ref' in item)) {
      continue;
    }
    const [left, right] =
      item.kind === 'glyph'
        ? [item.x + METRICS[item.glyph].bBoxSW[0], item.x + METRICS[item.glyph].bBoxNE[0]]
        : item.kind === 'label'
          ? [item.x, item.x + item.text.length * 0.8]
          : [Math.min(item.x1, item.x2), Math.max(item.x1, item.x2)];
    const id = `${String(item.ref.staff ?? 0)}:${key(item.ref.measure, item.ref.event, item.ref.voice)}`;
    const current = bounds.get(id);
    bounds.set(id, {
      measure: item.ref.measure,
      event: item.ref.event,
      ...(item.ref.staff !== undefined ? { staff: item.ref.staff } : {}),
      ...(item.ref.voice !== undefined ? { voice: item.ref.voice } : {}),
      x1: Math.min(current?.x1 ?? left, left),
      x2: Math.max(current?.x2 ?? right, right),
    });
  }
  return [...bounds.values()]
    .map((b) => ({ ...b, x1: round(b.x1), x2: round(b.x2) }))
    .sort(
      (a, b) =>
        (a.staff ?? 0) - (b.staff ?? 0) ||
        a.measure - b.measure ||
        (a.voice ?? 0) - (b.voice ?? 0) ||
        a.event - b.event,
    );
}

/** Glyphen-Metriken für Renderer (Codepoint und Begrenzungsrahmen). */
export function glyphMetrics(name: GlyphName): GlyphMetrics {
  return METRICS[name];
}
