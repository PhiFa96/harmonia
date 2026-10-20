import { describe, expect, it } from 'vitest';
import { createRng, intervalBetween, midi } from '@harmonia/theory';
import { eventPitches, parseScore } from '@harmonia/notation';
import { contextAnswer, generateContext } from './context.ts';
import {
  contextChoiceLabel,
  contextExplanation,
  contextHint,
  contextNotationDescription,
  contextPrompt,
} from './context-text.ts';

describe('Stufe-4-Notenquellen', () => {
  it('liest 200 C-Schlüssel-Varianten aus Schlüssel und gedruckter Tonposition', () => {
    const clefs = new Set<string>();
    for (let seed = 0; seed < 200; seed++) {
      const item = generateContext({ topics: ['clef-reading'] }, createRng(seed));
      if (item.source.kind !== 'score') throw new Error('Notenbild fehlt');
      const staff = item.source.score.staves[0];
      const pitch = staff?.measures[0]?.voices[0]?.events.flatMap(eventPitches)[0];
      if (!staff || !pitch) throw new Error('Ton fehlt');
      clefs.add(staff.clef);
      expect(contextAnswer(item)).toBe(
        `pitch:${pitch.letter}${pitch.alter === 0 ? '' : pitch.alter > 0 ? '#' : 'b'}${String(pitch.octave)}`,
      );
      for (const locale of ['de', 'en-US', 'en-GB'] as const) {
        expect(contextPrompt(item, locale).length).toBeGreaterThan(20);
        expect(contextNotationDescription(item, locale).length).toBeGreaterThan(15);
        expect(contextChoiceLabel(item, contextAnswer(item), locale)).not.toContain('unknown');
      }
    }
    expect(clefs).toEqual(new Set(['alto', 'tenor']));
  });
  it.each(['parallel-fifths', 'figured-bass'] as const)(
    '%s: 200 Antworten stimmen mit den tatsächlich gedruckten Tönen überein',
    (topic) => {
      const seen = new Set<string>();
      for (let seed = 0; seed < 200; seed++) {
        const item = generateContext({ topics: [topic] }, createRng(seed));
        expect(item.source.kind).toBe('score');
        if (item.source.kind !== 'score') continue;
        const events = item.source.score.staves[0]?.measures[0]?.voices[0]?.events ?? [];
        const answer = contextAnswer(item);
        seen.add(answer);
        expect(item.choices).toContain(answer);
        if (topic === 'figured-bass') {
          const pitches =
            events[0]?.kind === 'chord'
              ? events[0].notes.map((note) => note.pitch).sort((a, b) => midi(a) - midi(b))
              : [];
          expect(pitches).toHaveLength(3);
          const bass = pitches[0];
          if (!bass) throw new Error('Bass fehlt');
          const figures = pitches
            .slice(1)
            .map((pitch) => intervalBetween(bass, pitch).number)
            .sort()
            .join('-');
          expect(answer).toBe(
            `figure:${figures === '3-5' ? '5-3' : figures === '3-6' ? '6-3' : '6-4'}`,
          );
        } else {
          const chords = events.map((event) =>
            event.kind === 'chord'
              ? event.notes.map((note) => note.pitch).sort((a, b) => midi(a) - midi(b))
              : [],
          );
          const a = chords[0],
            b = chords[1];
          if (!a?.[0] || !a[1] || !b?.[0] || !b[1]) throw new Error('Zwei Stimmen fehlen');
          const fifths = [a, b].every(
            ([low, high]) =>
              low &&
              high &&
              intervalBetween(low, high).number === 5 &&
              intervalBetween(low, high).quality === 'P',
          );
          const lower = Math.sign(midi(b[0]) - midi(a[0]));
          const upper = Math.sign(midi(b[1]) - midi(a[1]));
          expect(answer).toBe(
            fifths && lower !== 0 && lower === upper ? 'boolean:yes' : 'boolean:no',
          );
        }
        for (const locale of ['de', 'en-US', 'en-GB'] as const) {
          expect(contextPrompt(item, locale).length).toBeGreaterThan(20);
          expect(contextChoiceLabel(item, answer, locale)).not.toContain('unknown');
          expect(contextHint(item, 1, locale).length).toBeGreaterThan(10);
          expect(contextHint(item, 2, locale).length).toBeGreaterThan(10);
          expect(contextExplanation(item, locale).length).toBeGreaterThan(20);
        }
      }
      expect(seen.size).toBe(topic === 'figured-bass' ? 3 : 2);
    },
  );

  it('bewertet geänderte Noten neu und verwendet keine gespeicherte Lösung', () => {
    const parallels = generateContext({ topics: ['parallel-fifths'] }, createRng(1));
    const score = (source: string) => ({ kind: 'score' as const, score: parseScore(source) });
    expect(
      contextAnswer({ ...parallels, source: score('treble | 4/4 | (C4 G4)/2 (D4 A4)/2') }),
    ).toBe('boolean:yes');
    expect(
      contextAnswer({ ...parallels, source: score('treble | 4/4 | (C4 G4)/2 (C4 A4)/2') }),
    ).toBe('boolean:no');
    const figures = generateContext({ topics: ['figured-bass'] }, createRng(1));
    expect(contextAnswer({ ...figures, source: score('bass | 4/4 | (E3 G3 C4)/1') })).toBe(
      'figure:6-3',
    );
    expect(contextAnswer({ ...figures, source: score('bass | 4/4 | (G2 C3 E3)/1') })).toBe(
      'figure:6-4',
    );
  });
});
