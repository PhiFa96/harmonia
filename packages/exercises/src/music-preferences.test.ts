import { describe, expect, it } from 'vitest';
import { pitchInputLabel } from './feedback.ts';
import { parsePitch, keyName, key, parseNoteName, chordName, chord } from '@harmonia/theory';
import { engineLanguage } from '@harmonia/i18n';
describe('Independent musical presentation', () => {
  it('keeps UI language while German and international note names change independently', () => {
    expect(pitchInputLabel(parsePitch('B4'), { locale: 'en-US', noteNaming: 'de' })).toBe('h¹');
    expect(pitchInputLabel(parsePitch('Bb4'), { locale: 'de', noteNaming: 'intl' })).toBe('B♭4');
    expect(
      keyName(
        key(parseNoteName('B'), 'major'),
        engineLanguage({ locale: 'en-US', noteNaming: 'de' }),
      ),
    ).toBe('H major');
    expect(
      chordName(
        chord(parseNoteName('B'), 'major'),
        engineLanguage({ locale: 'en-GB', noteNaming: 'de' }),
      ),
    ).toBe('H major triad');
  });
});
