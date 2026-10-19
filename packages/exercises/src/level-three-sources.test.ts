import { describe, expect, it } from 'vitest';
import { createRng, midi, parsePitch } from '@harmonia/theory';
import { eventPitches } from '@harmonia/notation';
import { contextAnswer, generateContext } from './context.ts';
import {
  contextChoiceLabel,
  contextExplanation,
  contextHint,
  contextPrompt,
} from './context-text.ts';

describe('Stufe-3-Quellenaufgaben', () => {
  it.each(['form-return', 'clarinet-transposition'] as const)(
    '%s leitet 200 Antworten aus dem angezeigten Notenbild ab',
    (topic) => {
      for (let seed = 0; seed < 200; seed++) {
        const item = generateContext({ topics: [topic] }, createRng(seed));
        expect(item.source.kind).toBe('score');
        if (item.source.kind !== 'score') continue;
        const measures = item.source.score.staves[0]?.measures ?? [];
        const answer = contextAnswer(item);
        expect(item.choices).toContain(answer);
        if (topic === 'form-return') {
          const pitches = measures.map((measure) =>
            measure.voices[0]?.events
              .flatMap(eventPitches)
              .map((pitch) => midi(pitch))
              .join(','),
          );
          expect(pitches).toHaveLength(3);
          expect(pitches[0]).not.toBe(pitches[1]);
          expect(answer).toBe(pitches[0] === pitches[2] ? 'form:aba' : 'form:abc');
        } else {
          const written = measures[0]?.voices[0]?.events.flatMap(eventPitches)[0];
          expect(written).toBeDefined();
          if (written) expect(midi(parsePitch(answer.slice(6)))).toBe(midi(written) - 2);
        }
        for (const locale of ['de', 'en-US', 'en-GB'] as const) {
          expect(contextPrompt(item, locale).length).toBeGreaterThan(20);
          expect(contextChoiceLabel(item, answer, locale)).not.toContain('unknown');
          expect(contextHint(item, 1, locale).length).toBeGreaterThan(10);
          expect(contextHint(item, 2, locale).length).toBeGreaterThan(10);
          expect(contextExplanation(item, locale).length).toBeGreaterThan(20);
        }
      }
    },
  );
});
