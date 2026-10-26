import { describe, expect, it } from 'vitest';
import { analyzeVoiceLeading } from './voice-leading.ts';
import type { FourPartSlice, Voice } from './voice-leading.ts';
import { parsePitch } from './pitch.ts';

const voices: readonly Voice[] = ['bass', 'tenor', 'alto', 'soprano'];
const tone = (voice: Voice, pitch: string | null): FourPartSlice => ({
  bass: null,
  tenor: null,
  alto: null,
  soprano: null,
  [voice]: pitch === null ? null : parsePitch(pitch),
});

describe('optional augmented melodic interval rule', () => {
  it.each([
    ['C4', 'C#4', true],
    ['C4', 'C##4', true],
    ['Cb4', 'C##4', true],
    ['Cbb4', 'D##4', true],
    ['Cbb4', 'F##4', true],
    ['C4', 'D#4', true],
    ['C4', 'E#4', true],
    ['C4', 'F#4', true],
    ['C4', 'G#4', true],
    ['C4', 'A#4', true],
    ['C4', 'B#4', true],
    ['C4', 'C#5', true],
    ['C4', 'D#5', true],
    ['C4', 'F#5', true],
    ['C4', 'G#5', true],
    ['C4', 'C#6', true],
    ['C##4', 'Db4', false],
    ['C4', 'Db4', false],
    ['C4', 'Eb4', false],
    ['C4', 'Gb4', false],
    ['C4', 'Ab4', false],
    ['C4', 'Bb4', false],
    ['C4', 'C5', false],
    ['C4', 'E5', false],
    ['C4', 'C4', false],
    ['B#3', 'C4', false],
    ['C#4', 'Db4', false],
    ['Cbb3', 'A#2', false],
    ['Cbb3', 'A##2', false],
    ['Cbb3', 'B2', false],
    ['D##4', 'Fbb4', false],
  ] as const)('%s ↔ %s: augmented=%s for every voice', (from, to, augmented) => {
    for (const voice of voices)
      for (const [a, b] of [
        [from, to],
        [to, from],
      ]) {
        if (!a || !b) throw new Error('Missing pitch fixture');
        expect(
          analyzeVoiceLeading([tone(voice, a), tone(voice, b)], {
            'augmented-melodic-interval': 'warning',
          }),
        ).toEqual(
          augmented
            ? [{ rule: 'augmented-melodic-interval', severity: 'warning', at: 1, voices: [voice] }]
            : [],
        );
      }
  });

  it('requires explicit activation and preserves the independent second-only rule', () => {
    const fourth = [tone('soprano', 'C4'), tone('soprano', 'F#4')];
    expect(analyzeVoiceLeading(fourth, {})).toEqual([]);
    expect(analyzeVoiceLeading(fourth, { 'augmented-second': 'error' })).toEqual([]);
    const second = [tone('soprano', 'C4'), tone('soprano', 'D#4')];
    expect(
      analyzeVoiceLeading(second, {
        'augmented-second': 'error',
        'augmented-melodic-interval': 'hint',
      }).map((finding) => [finding.rule, finding.severity]),
    ).toEqual([
      ['augmented-second', 'error'],
      ['augmented-melodic-interval', 'hint'],
    ]);
  });

  it.each(['error', 'warning', 'hint'] as const)(
    'uses only the requested severity %s',
    (severity) => {
      expect(
        analyzeVoiceLeading([tone('alto', 'C4'), tone('alto', 'G#4')], {
          'augmented-melodic-interval': severity,
        }),
      ).toEqual([{ rule: 'augmented-melodic-interval', severity, at: 1, voices: ['alto'] }]);
    },
  );

  it('does not bridge a rest or report a repeated pitch', () => {
    expect(
      analyzeVoiceLeading([tone('tenor', 'C4'), tone('tenor', null), tone('tenor', 'F#4')], {
        'augmented-melodic-interval': 'hint',
      }),
    ).toEqual([]);
    expect(
      analyzeVoiceLeading([tone('tenor', 'C4'), tone('tenor', 'C4'), tone('tenor', 'F#4')], {
        'augmented-melodic-interval': 'hint',
      }),
    ).toEqual([{ rule: 'augmented-melodic-interval', severity: 'hint', at: 2, voices: ['tenor'] }]);
  });
});
