import {
  duration,
  formatPitch,
  key,
  parseNoteName,
  parsePitch,
  timeSignature,
} from '@harmonia/theory';
import { describe, expect, it } from 'vitest';

import type { Score, Tie } from './score.ts';
import {
  chord,
  DEFAULT_TIME_SIGNATURE,
  eventPitches,
  keySignature,
  note,
  rest,
  singleStaffScore,
  ties,
  validateScore,
} from './score.ts';
import { parseScore } from './shorthand.ts';

const p = parsePitch;
const q = duration('quarter');

const showTie = (t: Tie): string =>
  `${formatPitch(t.pitch)}: T${String(t.from.measure + 1)}/${String(t.from.event + 1)} → T${String(t.to.measure + 1)}/${String(t.to.event + 1)}`;

describe('Bausteine', () => {
  it('Note, Pause, Akkord', () => {
    expect(note(p('C4'), q)).toEqual({ kind: 'note', pitch: p('C4'), duration: q, tie: false });
    expect(rest(q)).toEqual({ kind: 'rest', duration: q });
    const c = chord(
      [
        { pitch: p('C4'), tie: false },
        { pitch: p('E4'), tie: true },
      ],
      q,
    );
    expect(eventPitches(c).map((x) => formatPitch(x))).toEqual(['C4', 'E4']);
    expect(eventPitches(rest(q))).toEqual([]);
  });

  it('Akkord braucht zwei verschiedene Töne; enharmonisch gleiche sind erlaubt', () => {
    expect(() => chord([{ pitch: p('C4'), tie: false }], q)).toThrow(RangeError);
    expect(() =>
      chord(
        [
          { pitch: p('C4'), tie: false },
          { pitch: p('C4'), tie: true },
        ],
        q,
      ),
    ).toThrow(/doppelt/);
    // Cis und Des gleichzeitig ist ungewöhnlich, aber notierbar (verschiedene Schreibweise).
    expect(
      chord(
        [
          { pitch: p('C#4'), tie: false },
          { pitch: p('Db4'), tie: false },
        ],
        q,
      ).notes,
    ).toHaveLength(2);
  });

  it('Vorzeichnung aus Tonart oder Zahl', () => {
    expect(keySignature(key(parseNoteName('A'), 'minor'))).toEqual({
      fifths: 0,
      key: key(parseNoteName('A'), 'minor'),
    });
    expect(keySignature(-4)).toEqual({ fifths: -4 });
    expect(() => keySignature(8)).toThrow(RangeError);
    expect(() => keySignature(1.5)).toThrow(RangeError);
  });

  it('ein System mit Standardwerten', () => {
    const score = singleStaffScore([[note(p('C4'), duration('whole'))]]);
    expect(score.staves[0]?.clef).toBe('treble');
    expect(score.staves[0]?.timeSignature).toEqual(DEFAULT_TIME_SIGNATURE);
    expect(score.staves[0]?.measures[0]?.voices).toHaveLength(1);
  });
});

describe('Haltebögen', () => {
  it('über den Taktstrich, auch zu einem Akkord', () => {
    const score = parseScore('C4/2 E4/2~ | E4/1~ | (C4 E4 G4)/1');
    expect(ties(score).map(showTie)).toEqual(['E4: T1/2 → T2/1', 'E4: T2/1 → T3/1']);
    expect(validateScore(score)).toEqual([]);
  });

  it('einzelne Akkordtöne', () => {
    const score = parseScore('(C4~ E4 G4~)/2 (C4 F4 G4)/2');
    expect(ties(score).map(showTie)).toEqual(['C4: T1/1 → T1/2', 'G4: T1/1 → T1/2']);
  });

  it.each([
    ['C#4/2~ Db4/2', 'andere Schreibweise'],
    ['C4/2~ C5/2', 'andere Oktave'],
    ['C4/2~ r/2', 'Pause'],
    ['C4/2 C4/2~', 'letztes Ereignis'],
    ['(C4 E4)/2~ (C4 F4)/2', 'Akkordton fehlt im Ziel'],
  ])('ohne Ziel: %s (%s)', (text) => {
    const score = parseScore(text);
    const issues = validateScore(score);
    expect(issues.some((i) => i.type === 'tie-without-target')).toBe(true);
  });

  it('jede Stimme für sich', () => {
    const score = parseScore('C5/1~ & E4/1 | C5/1 & E4/1');
    expect(ties(score).map((t) => t.from.voice)).toEqual([0]);
    expect(validateScore(score)).toEqual([]);
  });
});

describe('Taktprüfung', () => {
  it('volle Takte', () => {
    expect(validateScore(parseScore('C4/4 D4/4 E4/2 | (C4 E4)/2. r/4'))).toEqual([]);
  });

  it('Auftakt im ersten Takt erlaubt, auf Wunsch nicht', () => {
    const score = parseScore('3/4 | G4/4 | C5/2.');
    expect(validateScore(score)).toEqual([]);
    expect(validateScore(score, { allowPickup: false })).toEqual([
      { type: 'measure-incomplete', staff: 0, measure: 0, voice: 0 },
    ]);
  });

  it('zu kurz und zu lang ab dem zweiten Takt', () => {
    expect(validateScore(parseScore('C4/1 | C4/2 | C4/1 D4/4'))).toEqual([
      { type: 'measure-incomplete', staff: 0, measure: 1, voice: 0 },
      { type: 'measure-overfull', staff: 0, measure: 2, voice: 0 },
    ]);
  });

  it('Taktwechsel wird berücksichtigt', () => {
    expect(validateScore(parseScore('4/4 | C4/1 | 3/4 | C4/2. | D4/2.'))).toEqual([]);
    expect(validateScore(parseScore('4/4 | C4/1 | 6/8 | C4/4. D4/4.'))).toEqual([]);
  });

  it('alle Stimmen und Systeme', () => {
    const score: Score = parseScore('C5/1 & E4/2\nbass | C3/2 C3/2');
    expect(validateScore(score, { allowPickup: false })).toEqual([
      { type: 'measure-incomplete', staff: 0, measure: 0, voice: 1 },
    ]);
  });

  it('Taktart aus dem Modell', () => {
    const score = singleStaffScore([[note(p('C4'), duration('half', 1))]], {
      timeSignature: timeSignature(3, 4),
    });
    expect(validateScore(score)).toEqual([]);
  });
});
