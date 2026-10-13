import { describe, expect, it } from 'vitest';
import { scoreTimeline, validateScore } from '@harmonia/notation';
import { duration, keyFromFifths } from '@harmonia/theory';
import {
  feedbackMedia,
  generateExercise,
  createRng,
  CONTEXT_TOPICS,
  generateContext,
} from './index.ts';
const tempo = { bpm: 90, beat: duration('quarter') };
describe('Musikalische Quellen im Feedback', () => {
  it.each(CONTEXT_TOPICS)('erhält Quelle, Stimmen, Dauern und Haltebögen für %s', (topic) => {
    for (let seed = 0; seed < 12; seed++) {
      const item = generateContext({ topics: [topic] }, createRng(seed)),
        media = feedbackMedia(item);
      if (item.source.kind === 'document') expect(media).toEqual({});
      else {
        expect(media.audio).toBeDefined();
        expect(media.label).toBe('source');
        if (!media.audio) throw new Error('Klang fehlt');
        expect(validateScore(media.audio)).toEqual([]);
        expect(scoreTimeline(media.audio, tempo).tones.length).toBeGreaterThan(0);
        if (item.source.kind === 'score') expect(media.audio).toBe(item.source.score);
      }
    }
  });
  it('leitet das Tonleiterbeispiel beim Erkennen aus der sichtbaren Vorzeichnung ab', () => {
    const item = generateExercise(
      { type: 'KEYSIG_IDENTIFY', params: { fifths: [2], modes: ['minor'], clefs: ['bass'] } },
      createRng(3),
    );
    if (item.type !== 'KEYSIG_IDENTIFY') throw new Error('Typ');
    const correct = feedbackMedia(item),
      altered = feedbackMedia({ ...item, key: keyFromFifths(-4, 'minor') });
    expect(altered).toEqual(correct);
    expect(correct.audio && scoreTimeline(correct.audio, tempo).tones.length).toBe(8);
  });
  it('zeigt bei Namensaufgaben das passende Quellbild und lässt den Pulseinstieg ohne zusätzlichen Notensatz', () => {
    const named = generateExercise(
      {
        type: 'NOTE_NAME',
        params: {
          presentation: 'octave-name',
          sourceSystem: 'both',
          clefs: ['bass'],
          maxAccidentals: 0,
        },
      },
      createRng(9),
    );
    expect(feedbackMedia(named)).toMatchObject({
      score: named.type === 'NOTE_NAME' ? named.score : null,
    });
    const pulse = generateExercise(
      {
        type: 'RHYTHM_TAP',
        params: { level: 'pulse', meters: ['4/4'], tempos: [90], toleranceMs: 120 },
      },
      createRng(9),
    );
    expect(feedbackMedia(pulse)).toEqual({});
    const knowledge = generateExercise(
      { type: 'KNOWLEDGE_MC', params: { topics: ['intervals'] } },
      createRng(9),
    );
    expect(feedbackMedia(knowledge)).toEqual({});
  });
});
