import { describe, expect, it } from 'vitest';
import { checkHistoryJourneyTranslations } from './history-journey-check.ts';
import { historyJourneyMessages } from './history-journey-draft.ts';

const fresh = () =>
  JSON.parse(JSON.stringify(historyJourneyMessages)) as typeof historyJourneyMessages;

describe('P4.12 authoring translation checks', () => {
  it.each(['personaPrompts', 'personaReplies'] as const)(
    '%s requires three distinct interview entries',
    (field) => {
      const short = fresh();
      short.de.medieval[field].pop();
      const label = field === 'personaPrompts' ? 'Interviewfragen' : 'Interviewantworten';
      expect(checkHistoryJourneyTranslations(short)).toContain(
        `de historyJourneyDraft:medieval.${field}: genau drei ${label} erwartet`,
      );
      const duplicate = fresh();
      duplicate.de.medieval[field][2] = duplicate.de.medieval[field][0] ?? '';
      expect(checkHistoryJourneyTranslations(duplicate)).toContain(
        `de historyJourneyDraft:medieval.${field}: ${label} müssen unterschiedlich sein`,
      );
    },
  );
  it('requires distinct answers and nonempty retry hints', () => {
    const copy = fresh();
    copy['en-US'].medieval.knowledgeOptions[2] = copy['en-US'].medieval.knowledgeOptions[0] ?? '';
    copy['en-US'].medieval.knowledgeHint = ' ';
    const problems = checkHistoryJourneyTranslations(copy);
    expect(problems).toContain(
      'en-US historyJourneyDraft:medieval.knowledgeOptions: Antworttexte müssen unterschiedlich sein',
    );
    expect(problems).toContain(
      'en-US historyJourneyDraft:medieval.knowledgeHint: Hinweistext fehlt',
    );
  });
  it('keeps UK spellings separate and provides a retry hint for all eight questions', () => {
    expect(historyJourneyMessages['en-US'].baroque.scene).toContain('realization');
    expect(historyJourneyMessages['en-GB'].baroque.scene).toContain('realisation');
    for (const copy of Object.values(historyJourneyMessages))
      for (const story of Object.values(copy)) {
        expect(story.knowledgeHint.trim()).not.toBe('');
        expect(story.listeningHint.trim()).not.toBe('');
        expect(story.knowledgeHint).not.toBe(story.knowledgeExplanation);
        expect(story.listeningHint).not.toBe(story.listeningExplanation);
      }
  });
  it('checks actual draft copy without adding it to public resources', () => {
    expect(checkHistoryJourneyTranslations()).toEqual([]);
  });
  it('rejects distinct source options that render to the same answer', () => {
    const copy = fresh();
    copy.de.medieval.knowledgeOptions = ['$t(glossary:voice_one)', 'Stimme', 'Third option'];
    expect(checkHistoryJourneyTranslations(copy)).toContain(
      'de historyJourneyDraft:medieval: Texte oder Glossarverweise nicht auflösbar; übersetzte Antworten müssen unterschiedlich sein',
    );
  });
  it('reports missing translated fields', () => {
    const copy = fresh();
    Reflect.deleteProperty(copy['en-US'].medieval, 'personaName');
    expect(checkHistoryJourneyTranslations(copy)).toContain(
      'en-US historyJourneyDraft:medieval.personaName: fehlt (vorhanden in de)',
    );
  });
  it('checks individual answer texts for whitespace and interpolation placeholders', () => {
    const copy = fresh();
    copy['en-US'].medieval.knowledgeOptions[0] = ' ';
    copy['en-US'].medieval.listeningOptions[1] = '{{voices}} voices';
    const problems = checkHistoryJourneyTranslations(copy);
    expect(problems).toContain(
      'en-US historyJourneyDraft:medieval.knowledgeOptions.0: leerer Text',
    );
    expect(problems).toContain(
      'en-US historyJourneyDraft:medieval.listeningOptions.1: Platzhalter {{voices}} statt (keine) wie in de',
    );
  });
  it('requires three string options in both question types, including UK copy', () => {
    const copy = fresh();
    copy['en-GB'].baroque.knowledgeOptions.pop();
    copy.de.classical.listeningOptions = [];
    for (const field of [
      'en-GB historyJourneyDraft:baroque.knowledgeOptions',
      'de historyJourneyDraft:classical.listeningOptions',
    ])
      expect(checkHistoryJourneyTranslations(copy)).toContain(
        `${field}: genau drei Antworttexte erwartet`,
      );
  });
  it('rejects malformed copy and non-string options rather than skipping them', () => {
    for (const input of [null, [], { de: null }])
      expect(checkHistoryJourneyTranslations(input)).toContain(
        'de historyJourneyDraft: Stationstexte fehlen',
      );
    const copy = fresh();
    Reflect.set(copy['en-US'].renaissance.listeningOptions, 1, false);
    expect(checkHistoryJourneyTranslations(copy)).toContain(
      'en-US historyJourneyDraft.renaissance.listeningOptions.1: Text oder Textstruktur erwartet',
    );
  });
  it('resolves valid glossary references and rejects missing references in answers', () => {
    const copy = fresh();
    for (const locale of ['de', 'en-US', 'en-GB'] as const)
      copy[locale].medieval.listeningOptions[0] = '$t(glossary:notes.whole_one)';
    expect(checkHistoryJourneyTranslations(copy)).toEqual([]);
    copy['en-US'].medieval.listeningOptions[0] = '$t(glossary:missingHistoryTerm)';
    expect(checkHistoryJourneyTranslations(copy)).toContain(
      'en-US historyJourneyDraft:medieval.listeningOptions.0: Verweis auf unbekannten Text glossary:missingHistoryTerm',
    );
  });
});
