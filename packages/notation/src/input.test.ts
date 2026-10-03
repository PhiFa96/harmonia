import type { Pitch } from '@harmonia/theory';
import { formatPitch, parsePitch } from '@harmonia/theory';
import { describe, expect, it } from 'vitest';

import {
  addPitch,
  hitTest,
  measureAt,
  MAX_STEP,
  MIN_STEP,
  moveByStep,
  naturalAtStep,
  pitchAt,
  pitchAtStep,
  prevailingAlter,
  removePitch,
  setAlter,
  setPitch,
  stepAt,
  stepOf,
  stepY,
} from './input.ts';
import type { ScoreLayout } from './layout.ts';
import { eventBounds, layoutScore, staffY } from './layout.ts';
import type { Score } from './score.ts';
import { validateScore } from './score.ts';
import { formatScore, parseScore } from './shorthand.ts';

const p = (text: string): Pitch => parsePitch(text);
const names = (pitches: readonly (Pitch | undefined)[]) =>
  pitches.map((x) => (x ? formatPitch(x) : '–'));

describe('Schritte im System', () => {
  it('rastet auf Linie oder Zwischenraum ein', () => {
    expect([0, 0.2, 0.26, 0.5, 0.74, 2.1, -0.3].map(stepAt)).toEqual([0, 0, 1, 1, 1, 4, -1]);
  });

  it('begrenzt auf vier Hilfslinien', () => {
    expect(stepAt(-10)).toBe(MIN_STEP);
    expect(stepAt(20)).toBe(MAX_STEP);
    expect(stepY(MIN_STEP)).toBe(-4);
    expect(stepY(MAX_STEP)).toBe(8);
  });

  it.each([
    ['treble', 0, 'F5'],
    ['treble', 8, 'E4'],
    ['treble', 10, 'C4'],
    ['treble', -2, 'A5'],
    ['bass', 0, 'A3'],
    ['bass', 8, 'G2'],
    ['bass', -2, 'C4'],
  ] as const)('%s, Schritt %d → %s', (clef, step, expected) => {
    const { letter, octave } = naturalAtStep(step, clef);
    expect(`${letter}${String(octave)}`).toBe(expected);
  });

  it('Gegenprobe mit staffY: jede Position hin und zurück', () => {
    for (const clef of ['treble', 'bass'] as const) {
      for (let step = MIN_STEP; step <= MAX_STEP; step++) {
        const natural = naturalAtStep(step, clef);
        const pitch = { ...natural, alter: 0 };
        expect(stepOf(pitch, clef)).toBe(step);
        expect(staffY(pitch, clef)).toBe(stepY(step));
      }
    }
  });
});

describe('Geltendes Vorzeichen', () => {
  it('aus der Vorzeichnung', () => {
    const score = parseScore('treble | key:G | 4/4 | r/1');
    expect(prevailingAlter(score, 0, 0, 'F', 4)).toBe(1);
    expect(prevailingAlter(score, 0, 0, 'C', 4)).toBe(0);
    const flats = parseScore('treble | key:Eb | 4/4 | r/1');
    expect(['B', 'E', 'A', 'D'].map((l) => prevailingAlter(flats, 0, 0, l as 'B', 4))).toEqual([
      -1, -1, -1, 0,
    ]);
  });

  it('frühere Vorzeichen im Takt gelten weiter, nur in derselben Oktave', () => {
    const score = parseScore('treble | 4/4 | F#4/4 r/4 r/4 r/4 | r/1');
    expect(prevailingAlter(score, 0, 1, 'F', 4)).toBe(1);
    expect(prevailingAlter(score, 0, 1, 'F', 5)).toBe(0);
    expect(prevailingAlter(score, 0, 0, 'F', 4)).toBe(0);
    // Neuer Takt: wieder die Vorzeichnung
    expect(prevailingAlter(score, 1, 0, 'F', 4)).toBe(0);
  });

  it('Auflösungszeichen hebt ein früheres Vorzeichen auf', () => {
    const score = parseScore('treble | key:G | 4/4 | F4/4 r/4 r/2');
    expect(prevailingAlter(score, 0, 1, 'F', 4)).toBe(0);
  });

  it('übergebundene Note gilt im neuen Takt nicht weiter', () => {
    const score = parseScore('treble | 4/4 | r/2 r/4 F#4/4~ | F#4/4 r/4 r/2');
    expect(prevailingAlter(score, 1, 1, 'F', 4)).toBe(0);
  });

  it('Gegenprobe mit dem Layout: mit geltendem Vorzeichen kein Versetzungszeichen, sonst eins', () => {
    const cases = [
      ['treble | key:G | 4/4 | r/2 r/2', 0, 1],
      ['treble | 4/4 | F#4/4 r/4 r/2', 0, 1],
      ['treble | key:Bb | 4/4 | B4/4 r/4 r/2', 0, 1],
      ['treble | 4/4 | r/2 r/4 F#4/4~ | F#4/4 r/4 r/2', 1, 1],
      ['bass | key:D | 4/4 | r/1', 0, 0],
    ] as const;
    for (const [text, measure, event] of cases) {
      const base = parseScore(text);
      for (const letter of ['F', 'C', 'B'] as const) {
        const octave = text.startsWith('bass') ? 3 : 4;
        const alter = prevailingAlter(base, measure, event, letter, octave);
        const withNote = setPitch(base, { measure, event }, { letter, alter, octave });
        const accidentals = (score: Score) =>
          layoutScore(score).items.filter(
            (i) =>
              i.kind === 'glyph' &&
              i.role === 'accidental' &&
              i.ref?.measure === measure &&
              i.ref.event === event,
          ).length;
        expect(accidentals(withNote), `${text} ${letter}`).toBe(0);
        const other = setPitch(base, { measure, event }, { letter, alter: alter + 1, octave });
        expect(accidentals(other), `${text} ${letter} anders`).toBe(1);
      }
    }
  });

  it('Tonhöhe an einer Position im Zusammenhang', () => {
    const score = parseScore('treble | key:D | 4/4 | r/1');
    expect(formatPitch(pitchAtStep(score, 9, 0, 0))).toBe('D4');
    expect(formatPitch(pitchAtStep(score, 1, 0, 0))).toBe('E5');
    expect(formatPitch(pitchAtStep(score, 7, 0, 0))).toBe('F#4');
    expect(formatPitch(pitchAtStep(score, 4, 0, 0))).toBe('B4');
    expect(formatPitch(pitchAtStep(score, 5, 0, 0))).toBe('A4');
    expect(formatPitch(pitchAtStep(score, 3, 0, 0))).toBe('C#5');
  });
});

describe('Treffer', () => {
  const score = parseScore('treble | 4/4 | C4/1 | r/1');
  const layout: ScoreLayout = layoutScore(score);
  const [first, second] = eventBounds(layout);
  if (!first || !second) {
    throw new Error('Testpartitur ohne Ereignisse');
  }

  it('Takt nach den Taktstrichen', () => {
    expect(measureAt(layout, first.x1)).toBe(0);
    expect(measureAt(layout, second.x1)).toBe(1);
    expect(measureAt(layout, layout.width + 5)).toBe(1);
    expect(measureAt(layout, 0)).toBe(0);
  });

  it('Tipp in den zweiten Takt auf den Zwischenraum der e¹-Position', () => {
    const hit = hitTest(layout, score, (second.x1 + second.x2) / 2, staffY(p('E4'), 'treble'));
    expect(hit).toMatchObject({ step: 8, measure: 1, event: { measure: 1, event: 0 } });
    expect(formatPitch(hit.pitch)).toBe('E4');
    expect(hit.head).toBeUndefined();
  });

  it('Tipp auf einen Notenkopf trifft ihn, auch etwas daneben', () => {
    const y = staffY(p('C4'), 'treble');
    for (const dy of [0, 0.3, -0.4]) {
      const hit = hitTest(layout, score, (first.x1 + first.x2) / 2, y + dy);
      expect(hit.head).toEqual({ measure: 0, event: 0, note: 0 });
    }
    expect(hitTest(layout, score, (first.x1 + first.x2) / 2, y - 1.5).head).toBeUndefined();
  });

  it('knapp neben einem Ereignis zählt noch dazu, weit daneben nicht', () => {
    const near = hitTest(layout, score, first.x2 + 0.5, 2);
    expect(near.event).toEqual({ measure: 0, event: 0 });
    const far = hitTest(layout, score, first.x2 + 3, 2);
    expect(far.event).toBeUndefined();
  });

  it('Tonhöhe beim Tippen berücksichtigt Vorzeichen davor im Takt', () => {
    const s = parseScore('treble | 4/4 | F#4/2 r/2');
    const l = layoutScore(s);
    const rest = eventBounds(l)[1];
    const hit = hitTest(l, s, ((rest?.x1 ?? 0) + (rest?.x2 ?? 0)) / 2, staffY(p('F4'), 'treble'));
    expect(formatPitch(hit.pitch)).toBe('F#4');
  });
});

describe('Bearbeiten', () => {
  const at = { measure: 1, event: 0 };

  it('Note setzen: Pause wird Note gleicher Dauer', () => {
    const score = setPitch(parseScore('treble | 4/4 | C4/1 | r/1'), at, p('E4'));
    expect(formatScore(score)).toBe('treble | 4/4 | C4/1 | E4/1');
    expect(validateScore(score)).toEqual([]);
  });

  it('Note verschieben und Vorzeichen setzen', () => {
    let score = parseScore('treble | key:G | 4/4 | C4/1 | E4/1');
    score = moveByStep(score, at, 1);
    expect(names([pitchAt(score, at)])).toEqual(['F#4']);
    score = setAlter(score, at, 0);
    expect(names([pitchAt(score, at)])).toEqual(['F4']);
    score = moveByStep(score, at, -2);
    expect(names([pitchAt(score, at)])).toEqual(['D4']);
  });

  it('verschieben bleibt in den Grenzen des Systems', () => {
    let score = parseScore('treble | 4/4 | C6/1');
    score = moveByStep(score, { measure: 0, event: 0 }, 20);
    expect(names([pitchAt(score, { measure: 0, event: 0 })])).toEqual([
      formatPitch({ ...naturalAtStep(MIN_STEP, 'treble'), alter: 0 }),
    ]);
  });

  it('Ton hinzufügen (harmonisches Intervall) und wieder entfernen', () => {
    const start = parseScore('treble | 4/4 | C4/1~ | C4/1');
    const ref = { measure: 0, event: 0 };
    const withThird = addPitch(start, ref, p('E4'));
    expect(formatScore(withThird)).toBe('treble | 4/4 | (C4~ E4)/1 | C4/1');
    expect(formatScore(addPitch(withThird, ref, p('E4')))).toBe(formatScore(withThird));
    const back = removePitch(withThird, { ...ref, note: 1 });
    expect(formatScore(back)).toBe('treble | 4/4 | C4/1~ | C4/1');
  });

  it('Note löschen: wird zur Pause', () => {
    const score = removePitch(parseScore('treble | 4/4 | C4/1 | E4/1'), at);
    expect(formatScore(score)).toBe('treble | 4/4 | C4/1 | r/1');
  });

  it('Akkordton auf eine schon vorhandene Tonhöhe setzen: keine Dopplung', () => {
    const score = setPitch(
      parseScore('treble | 4/4 | (C4 E4)/1'),
      { measure: 0, event: 0, note: 1 },
      p('C4'),
    );
    expect(formatScore(score)).toBe('treble | 4/4 | C4/1');
  });

  it('die Ausgangspartitur bleibt unverändert', () => {
    const start = parseScore('treble | 4/4 | C4/1 | r/1');
    const before = formatScore(start);
    setPitch(start, at, p('E4'));
    expect(formatScore(start)).toBe(before);
  });

  it('unbekannte Position', () => {
    expect(() =>
      setPitch(parseScore('treble | 4/4 | C4/1'), { measure: 3, event: 0 }, p('E4')),
    ).toThrow(RangeError);
  });
});
