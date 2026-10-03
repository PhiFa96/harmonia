import { describe, expect, it } from 'vitest';

import { describeEvent, describeScore } from './describe.ts';
import { parseScore } from './shorthand.ts';

const events = (text: string) => parseScore(text).staves[0]?.measures[0]?.voices[0]?.events ?? [];

describe('Texte für Screenreader', () => {
  it.each([
    ['C4/4', 'Viertelnote, eingestrichenes c', 'Quarter note, C 4', 'Crotchet, C 4'],
    [
      'F#3/2.',
      'Punktierte halbe Note, kleines fis',
      'Dotted half note, F sharp 3',
      'Dotted minim, F sharp 3',
    ],
    ['r/8', 'Achtelpause', 'Eighth rest', 'Quaver rest'],
    [
      '(C4 E4 G4)/1',
      'Ganze Note, Akkord: eingestrichenes c, eingestrichenes e, eingestrichenes g',
      'Whole note, chord: C 4, E 4, G 4',
      'Semibreve, chord: C 4, E 4, G 4',
    ],
  ])('%s', (text, german, us, uk) => {
    const [event] = events(text);
    if (!event) {
      throw new Error('kein Ereignis');
    }
    expect(describeEvent(event)).toBe(german);
    expect(describeEvent(event, { language: 'en' })).toBe(us);
    expect(describeEvent(event, { language: 'en', variant: 'uk' })).toBe(uk);
  });

  it('alle Ereignisse mit Position', () => {
    expect(describeScore(parseScore('C4/2 r/2 | Bb3/1'))).toEqual([
      { staff: 0, measure: 0, voice: 0, event: 0, text: 'Halbe Note, eingestrichenes c' },
      { staff: 0, measure: 0, voice: 0, event: 1, text: 'Halbe Pause' },
      { staff: 0, measure: 1, voice: 0, event: 0, text: 'Ganze Note, kleines b' },
    ]);
  });
});
