import { describe, expect, it } from 'vitest';
import {
  createRng,
  exercisePrompt,
  generateKnowledge,
  HISTORY_FACTS,
  knowledgeDefinition,
  knowledgeFactLabel,
} from './index.ts';
import type { HistoryTopic } from './types.ts';

/**
 * Lösungsleck-Wache für die Begriffsaufgaben der Stufen 3 bis 5: Die Erklärung darf weder den
 * gesuchten Begriff noch dessen Wortstamm enthalten. Wörter ab fünf Buchstaben zählen mit ihren
 * ersten fünf Buchstaben (irgendwo im Text), kürzere nur als ganzes Wort.
 */
const STAGE_TOPICS = (Object.keys(HISTORY_FACTS) as HistoryTopic[]).slice(
  Object.keys(HISTORY_FACTS).indexOf('modes'),
);
const LOCALES = ['de', 'en-US', 'en-GB'] as const;
const STOP: Readonly<Record<string, ReadonlySet<string>>> = {
  de: new Set([
    'und',
    'im',
    'in',
    'der',
    'die',
    'das',
    'ein',
    'eine',
    'von',
    'mit',
    'zu',
    'auf',
    'über',
    'als',
    'am',
    'vom',
    'zur',
  ]),
  en: new Set([
    'and',
    'of',
    'in',
    'a',
    'an',
    'the',
    'on',
    'as',
    'across',
    'for',
    'to',
    'with',
    'by',
  ]),
};
const words = (text: string) =>
  text
    .toLowerCase()
    .split(/[^\p{L}¹²³⁴]+/u)
    .filter(Boolean);

function leaks(term: string, definition: string, locale: (typeof LOCALES)[number]): string[] {
  const stop = STOP[locale === 'de' ? 'de' : 'en'] ?? new Set<string>();
  const used = words(definition);
  const hits: string[] = [];
  for (const word of words(term)) {
    if (stop.has(word)) continue;
    if (word.length >= 5) {
      const stem = word.slice(0, 5);
      if (used.some((candidate) => candidate.includes(stem))) hits.push(word);
    } else if (used.includes(word)) hits.push(word);
  }
  return hits;
}

describe('Begriffsaufgaben der Stufen 3 bis 5 verraten den Begriff nicht', () => {
  it('prüft 29 Themen mit je vier Begriffen', () => {
    expect(STAGE_TOPICS).toHaveLength(29);
    expect(STAGE_TOPICS.reduce((sum, topic) => sum + HISTORY_FACTS[topic].length, 0)).toBe(116);
  });

  it.each(LOCALES)('%s: keine Erklärung enthält Begriff oder Wortstamm', (locale) => {
    const found: string[] = [];
    for (const topic of STAGE_TOPICS)
      for (const kind of HISTORY_FACTS[topic]) {
        const fact = { topic, kind } as never;
        const term = knowledgeFactLabel(fact, locale);
        const definition = knowledgeDefinition(fact, locale);
        expect(term, `${topic}/${kind}`).not.toMatch(/^(exercise|content|glossary)[.:]/);
        expect(definition.length, `${topic}/${kind}`).toBeGreaterThan(30);
        const hits = leaks(term, definition, locale);
        if (hits.length > 0) found.push(`${topic}/${kind}: ${hits.join(', ')}`);
      }
    expect(found).toEqual([]);
  });

  it.each(LOCALES)('%s: erzeugte Aufgaben zeigen im Text nicht die richtige Antwort', (locale) => {
    for (const topic of STAGE_TOPICS)
      for (let seed = 0; seed < 4; seed++) {
        const mc = generateKnowledge({ topics: [topic] }, createRng(seed));
        const prompt = exercisePrompt(mc, locale);
        expect(prompt).toContain(knowledgeDefinition(mc.fact, locale));
        expect(prompt.toLowerCase()).not.toContain(
          knowledgeFactLabel(mc.fact, locale).toLowerCase(),
        );
      }
  });
});
