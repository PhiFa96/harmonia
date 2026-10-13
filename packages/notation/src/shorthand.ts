// Kurzschreibweise für Tests und Inhalte, z. B. "treble | key:G | 3/4 | G4/4 B4/4 D5/4 | (G4 B4 D5)/2."
//
// Aufbau:
// - Abschnitte, getrennt durch "|": entweder Angaben (Schlüssel, Vorzeichnung, Taktart) oder ein Takt.
//   Angaben vor dem ersten Takt gelten für das System, Angaben zwischen Takten wechseln ab dem nächsten Takt.
// - Schlüssel: treble, bass, alto, tenor · Taktart: 4/4, 6/8, 3+2+2/8
// - Vorzeichnung: key:Eb (Es-Dur), key:c (c-Moll, kleiner Grundton = Moll), key:3b, key:2#, key:0
// - Note: Tonhöhe + Dauer, z. B. C4/4, F#5/8., Bb3/2.. – Dauer 1, 2, 4 … 64 oder breve, Punkte mit "."
// - Pause: r/4 · Akkord: (C4 E4 G4)/2 · Haltebogen: "~" hinter Note oder Akkordton, (C4 E4)/2~ bindet alle Töne
// - Mehrere Stimmen in einem Takt mit "&" trennen, mehrere Systeme in eigenen Zeilen (ab Phase 3)
// Unpunktierte Achteltriolen: /8{3:2}; weitere N-tolen bleiben Phase 3.

import type { Duration, Key, NoteValue, Pitch, TimeSignature } from '@harmonia/theory';
import {
  duration as makeDuration,
  formatNoteName,
  formatPitch,
  formatTimeSignature,
  key as makeKey,
  parseNoteName,
  parsePitch,
  parseTimeSignature,
  timeSignature,
} from '@harmonia/theory';

import type {
  ChordNote,
  Clef,
  KeySignature,
  Measure,
  MeasureChanges,
  Score,
  Staff,
  Voice,
  VoiceEvent,
} from './score.ts';
import {
  chord,
  CLEFS,
  DEFAULT_CLEF,
  DEFAULT_KEY_SIGNATURE,
  DEFAULT_TIME_SIGNATURE,
  keySignature,
  note,
  rest,
} from './score.ts';

const VALUE_BY_TEXT: Readonly<Record<string, NoteValue>> = {
  breve: 'breve',
  '1': 'whole',
  '2': 'half',
  '4': 'quarter',
  '8': 'eighth',
  '16': 'sixteenth',
  '32': 'thirtySecond',
  '64': 'sixtyFourth',
};

const TEXT_BY_VALUE: Readonly<Record<NoteValue, string>> = {
  breve: 'breve',
  whole: '1',
  half: '2',
  quarter: '4',
  eighth: '8',
  sixteenth: '16',
  thirtySecond: '32',
  sixtyFourth: '64',
};

// ---------------------------------------------------------------------------
// Lesen

/** Liest eine Partitur in Kurzschreibweise. Wirft einen SyntaxError mit Stelle und Grund. */
export function parseScore(text: string): Score {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    throw new SyntaxError('Leere Kurzschreibweise');
  }
  return {
    staves: lines.map((line, i) =>
      parseStaff(line, lines.length > 1 ? `System ${String(i + 1)}: ` : ''),
    ),
  };
}

function parseStaff(line: string, prefix: string): Staff {
  const segments = line.split('|').map((s) => s.trim());
  // Ein abschließender Taktstrich ist erlaubt.
  if (segments.length > 1 && segments.at(-1) === '') {
    segments.pop();
  }
  let initial: MutableChanges = {};
  let pending: MutableChanges = {};
  const measures: Measure[] = [];
  segments.forEach((segment, index) => {
    const where = `${prefix}Abschnitt ${String(index + 1)}`;
    if (segment === '') {
      throw new SyntaxError(`${where} ist leer`);
    }
    if (isAttributeSegment(segment)) {
      const target = measures.length === 0 ? initial : pending;
      const merged = parseAttributes(segment, target, where);
      if (measures.length === 0) {
        initial = merged;
      } else {
        pending = merged;
      }
      return;
    }
    const voices = segment.split('&').map((voiceText, v) => ({
      events: parseEvents(voiceText.trim(), `${where}, Stimme ${String(v + 1)}`),
    }));
    measures.push(hasChanges(pending) ? { changes: pending, voices } : { voices });
    pending = {};
  });
  if (hasChanges(pending)) {
    throw new SyntaxError(`${prefix}Angaben am Ende ohne folgenden Takt`);
  }
  return {
    clef: initial.clef ?? DEFAULT_CLEF,
    keySignature: initial.keySignature ?? DEFAULT_KEY_SIGNATURE,
    timeSignature: initial.timeSignature ?? DEFAULT_TIME_SIGNATURE,
    measures,
  };
}

interface MutableChanges {
  clef?: Clef;
  keySignature?: KeySignature;
  timeSignature?: TimeSignature;
}

function hasChanges(c: MutableChanges): c is MeasureChanges {
  return c.clef !== undefined || c.keySignature !== undefined || c.timeSignature !== undefined;
}

const TIME_PATTERN = /^\d+(?:\+\d+)*\/\d+$/;

function isAttributeToken(token: string): boolean {
  return CLEFS.includes(token as Clef) || token.startsWith('key:') || TIME_PATTERN.test(token);
}

function isAttributeSegment(segment: string): boolean {
  const tokens = segment.split(/\s+/);
  const attributes = tokens.filter(isAttributeToken);
  if (attributes.length > 0 && attributes.length < tokens.length) {
    throw new SyntaxError(`Angaben und Noten gemischt in „${segment}“ – bitte mit „|“ trennen`);
  }
  return attributes.length > 0;
}

function parseAttributes(segment: string, base: MutableChanges, where: string): MutableChanges {
  const result: MutableChanges = { ...base };
  const set = <K extends keyof MutableChanges>(
    name: K,
    value: MutableChanges[K],
    label: string,
  ) => {
    if (result[name] !== undefined) {
      throw new SyntaxError(`${where}: ${label} doppelt angegeben`);
    }
    result[name] = value;
  };
  for (const token of segment.split(/\s+/)) {
    if (CLEFS.includes(token as Clef)) {
      set('clef', token as Clef, 'Schlüssel');
    } else if (token.startsWith('key:')) {
      const ks = withSyntaxError(() => parseKeySignature(token.slice(4), where), where, token);
      set('keySignature', ks, 'Vorzeichnung');
    } else {
      set(
        'timeSignature',
        withSyntaxError(() => parseTimeSignature(token), where, token),
        'Taktart',
      );
    }
  }
  return result;
}

function parseKeySignature(text: string, where: string): KeySignature {
  const count = /^([0-7])([#b]?)$/.exec(text);
  if (count) {
    const [, digits = '0', sign = ''] = count;
    const n = Number.parseInt(digits, 10);
    if (n > 0 && sign === '') {
      throw new SyntaxError(`${where}: Vorzeichenzahl braucht # oder b („key:${text}“)`);
    }
    return keySignature(sign === 'b' ? -n : n);
  }
  const name = /^([A-Ga-g])([#b]*)$/.exec(text);
  if (!name) {
    throw new SyntaxError(`${where}: unbekannte Vorzeichnung „key:${text}“`);
  }
  const [, letter = '', accidentals = ''] = name;
  const tonic = parseNoteName(letter.toUpperCase() + accidentals);
  return keySignature(makeKey(tonic, letter === letter.toUpperCase() ? 'major' : 'minor'));
}

/** Ereignisse einer Stimme; Akkorde in Klammern dürfen Leerzeichen enthalten. */
function parseEvents(text: string, where: string): VoiceEvent[] {
  const tokens = text.match(/\([^)]*\)\S*|\S+/g) ?? [];
  if (tokens.length === 0) {
    throw new SyntaxError(`${where} ist leer`);
  }
  return tokens.map((token) => parseEvent(token, where));
}

const DURATION_PATTERN = /^\/(breve|\d+)(\.*)(?:\{(3):(2)\})?(~?)$/;

function parseEvent(token: string, where: string): VoiceEvent {
  const fail = (reason: string): never => {
    throw new SyntaxError(`${where}: ${reason} in „${token}“`);
  };
  const durationStart = token.lastIndexOf('/');
  if (durationStart <= 0) {
    return fail('Dauer fehlt (z. B. /4)');
  }
  const head = token.slice(0, durationStart);
  const match = DURATION_PATTERN.exec(token.slice(durationStart));
  if (!match) {
    return fail('ungültige Dauer');
  }
  const [, valueText = '', dots = '', actual, normal, tie = ''] = match;
  const value = VALUE_BY_TEXT[valueText];
  if (value === undefined) {
    return fail(`unbekannter Notenwert /${valueText}`);
  }
  if (actual && (value !== 'eighth' || dots.length !== 0))
    return fail('Nur unpunktierte 3:2-Achteltriolen sind unterstützt');
  const d = withSyntaxError(
    () =>
      makeDuration(
        value,
        dots.length,
        actual && normal ? { actual: Number(actual), normal: Number(normal) } : undefined,
      ),
    where,
    token,
  );
  if (head === 'r') {
    return tie ? fail('Pausen haben keinen Haltebogen') : rest(d);
  }
  if (head.startsWith('(') && head.endsWith(')')) {
    const notes = head
      .slice(1, -1)
      .trim()
      .split(/\s+/)
      .filter((part) => part.length > 0)
      .map((part): ChordNote => {
        const tied = part.endsWith('~');
        const pitch = readPitch(tied ? part.slice(0, -1) : part, where, token);
        return { pitch, tie: tied || tie === '~' };
      });
    return withSyntaxError(() => chord(notes, d), where, token);
  }
  return note(readPitch(head, where, token), d, tie === '~');
}

function readPitch(text: string, where: string, token: string): Pitch {
  return withSyntaxError(() => parsePitch(text), where, token);
}

function withSyntaxError<T>(action: () => T, where: string, token: string): T {
  try {
    return action();
  } catch (error) {
    if (error instanceof SyntaxError && error.message.startsWith(where)) {
      throw error;
    }
    const reason = error instanceof Error ? error.message : String(error);
    throw new SyntaxError(`${where}: ${reason} in „${token}“`, { cause: error });
  }
}

// ---------------------------------------------------------------------------
// Schreiben

/**
 * Schreibt eine Partitur in Kurzschreibweise (kanonische Form).
 * Wirft einen RangeError bei Elementen, die die Kurzschreibweise noch nicht kennt (N-tolen),
 * und bei Wechseln im ersten Takt (die gehören als Angaben zum System).
 */
export function formatScore(score: Score): string {
  return score.staves.map(formatStaff).join('\n');
}

function formatStaff(staff: Staff): string {
  const header = [
    staff.clef,
    ...formatKeySignature(staff.keySignature, true),
    formatTime(staff.timeSignature),
  ];
  if (staff.measures[0]?.changes) {
    throw new RangeError(
      'Wechsel im ersten Takt: diese Angaben gehören zum System (clef, keySignature, timeSignature)',
    );
  }
  const measures = staff.measures.flatMap((m) => {
    const changes = m.changes
      ? [
          ...(m.changes.clef ? [m.changes.clef] : []),
          ...(m.changes.keySignature ? formatKeySignature(m.changes.keySignature, false) : []),
          ...(m.changes.timeSignature ? [formatTime(m.changes.timeSignature)] : []),
        ]
      : [];
    return [...changes, m.voices.map(formatVoice).join(' & ')];
  });
  return [...header, ...measures].join(' | ');
}

/** Ohne Tonart und ohne Vorzeichen lässt die Kopfzeile die Vorzeichnung weg; bei Wechseln wird sie immer geschrieben. */
function formatKeySignature(ks: KeySignature, omitEmpty: boolean): string[] {
  if (ks.key) {
    return [`key:${formatKey(ks.key)}`];
  }
  if (ks.fifths === 0) {
    return omitEmpty ? [] : ['key:0'];
  }
  return [`key:${String(Math.abs(ks.fifths))}${ks.fifths > 0 ? '#' : 'b'}`];
}

function formatKey(k: Key): string {
  const name = formatNoteName(k.tonic, 'ascii');
  return k.mode === 'major' ? name : name.charAt(0).toLowerCase() + name.slice(1);
}

function formatTime(ts: TimeSignature): string {
  return formatTimeSignature(ts, { grouping: !hasDefaultGrouping(ts) });
}

function hasDefaultGrouping(ts: TimeSignature): boolean {
  try {
    const standard = timeSignature(ts.numerator, ts.denominator);
    return standard.grouping.join('+') === ts.grouping.join('+');
  } catch {
    return false;
  }
}

function formatVoice(v: Voice): string {
  return v.events.map(formatEvent).join(' ');
}

function formatEvent(event: VoiceEvent): string {
  const tie = (tied: boolean): string => (tied ? '~' : '');
  switch (event.kind) {
    case 'note':
      return `${formatPitch(event.pitch)}${formatDuration(event.duration)}${tie(event.tie)}`;
    case 'rest':
      return `r${formatDuration(event.duration)}`;
    case 'chord':
      return `(${event.notes.map((n) => formatPitch(n.pitch) + tie(n.tie)).join(' ')})${formatDuration(event.duration)}`;
  }
}

function formatDuration(d: Duration): string {
  if (d.tuplet) {
    if (d.tuplet.actual !== 3 || d.tuplet.normal !== 2 || d.value !== 'eighth' || d.dots !== 0)
      throw new RangeError('Kurzschreibweise unterstützt nur unpunktierte 3:2-Achteltriolen');
    return '/8{3:2}';
  }
  return `/${TEXT_BY_VALUE[d.value]}${'.'.repeat(d.dots)}`;
}
