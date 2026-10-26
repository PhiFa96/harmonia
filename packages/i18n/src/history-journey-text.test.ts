import { describe, expect, it } from 'vitest';
import { createHistoryJourneyText } from './history-journey-text.ts';
import { historyJourneyMessages } from './history-journey-draft.ts';
import { RESOURCES } from './resources.ts';

const fresh = () =>
  JSON.parse(JSON.stringify(historyJourneyMessages)) as typeof historyJourneyMessages;

describe('history journey glossary rendering', () => {
  it.each(['de', 'en-US', 'en-GB'] as const)(
    '%s: resolves all fields and options in all four stories',
    (locale) => {
      const text = createHistoryJourneyText(locale, historyJourneyMessages);
      for (const era of ['medieval', 'renaissance', 'baroque', 'classical'] as const) {
        const story = text(era);
        for (const value of Object.values(story))
          for (const field of typeof value === 'string' ? [value] : value) {
            expect(field.trim()).not.toBe('');
            expect(field).not.toContain('$t(');
            expect(field).not.toContain('glossary:');
          }
        expect(story.knowledgeOptions).toHaveLength(3);
        expect(story.listeningOptions).toHaveLength(3);
      }
      expect(text('medieval').scene).toContain(locale === 'de' ? 'Einstimmigkeit' : 'monophony');
      expect(text('baroque').scene).toContain(locale === 'de' ? 'Generalbass' : 'basso continuo');
      if (locale !== 'de')
        expect(text('baroque').scene).toContain(locale === 'en-GB' ? 'realisation' : 'realization');
    },
  );
  it('uses German and US/UK terms without changing global resources or the input', () => {
    const copy = fresh();
    for (const locale of ['de', 'en-US', 'en-GB'] as const)
      copy[locale].medieval.scene = '$t(glossary:notes.half_one) / $t(glossary:measure_one)';
    const before = JSON.stringify(RESOURCES),
      original = JSON.stringify(copy);
    expect(createHistoryJourneyText('de', copy)('medieval').scene).toBe('halbe Note / Takt');
    expect(createHistoryJourneyText('en-US', copy)('medieval').scene).toBe('half note / measure');
    expect(createHistoryJourneyText('en-GB', copy)('medieval').scene).toBe('minim / bar');
    expect(JSON.stringify(RESOURCES)).toBe(before);
    expect(JSON.stringify(copy)).toBe(original);
  });
  it('keeps bindings isolated from later input changes and other instances', () => {
    const copy = fresh();
    copy.de.medieval.scene = 'First private scene';
    const first = createHistoryJourneyText('de', copy);
    copy.de.medieval.scene = 'Second private scene';
    const second = createHistoryJourneyText('de', copy);
    expect(first('medieval').scene).toBe('First private scene');
    expect(second('medieval').scene).toBe('Second private scene');
    expect(first('medieval').scene).toBe('First private scene');
  });
  it('rejects missing, cross-story and incomplete references', () => {
    for (const reference of [
      '$t(glossary:missingHistoryTerm)',
      '$t(content.historyJourney.medieval.title)',
      '$t(glossary:voice_one',
      '{{unbound}}',
    ]) {
      const copy = fresh();
      copy.de.medieval.scene = reference;
      expect(() => createHistoryJourneyText('de', copy)('medieval')).toThrow();
    }
  });
  it('rejects answers that become identical after glossary expansion', () => {
    const copy = fresh();
    copy.de.medieval.knowledgeOptions = ['$t(glossary:voice_one)', 'Stimme', 'Third option'];
    expect(() => createHistoryJourneyText('de', copy)('medieval')).toThrow('distinct');
  });
  it('does not fall back to draft copy when the selected locale has no published stories', () => {
    const empty = createHistoryJourneyText('de', { de: {}, 'en-US': {}, 'en-GB': {} });
    expect(() => empty('medieval')).toThrow('unavailable');
    const partial = createHistoryJourneyText('de', { ...historyJourneyMessages, de: {} });
    expect(() => partial('medieval')).toThrow('unavailable');
  });
});
