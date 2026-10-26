import type { ParseKeys } from 'i18next';
import type { historyJourneyMessages } from './history-journey-published.ts';
import { createContentI18n } from './instance.ts';
import type { AppLocale } from './locale.ts';
import type { MessageTree } from './messages/types.ts';

type Era = keyof (typeof historyJourneyMessages)['de'];
type RawStory = (typeof historyJourneyMessages)['de']['medieval'];
export type HistoryJourneyMessages = Readonly<
  Record<AppLocale, Readonly<Partial<Record<Era, RawStory>>>>
>;
export type HistoryJourneyText = {
  readonly [K in keyof RawStory]: RawStory[K] extends readonly string[]
    ? readonly string[]
    : string;
};

function resource(stories: HistoryJourneyMessages[AppLocale]): MessageTree {
  return Object.fromEntries(
    Object.entries<RawStory>(stories).map(([era, story]): [string, MessageTree] => [
      era,
      Object.fromEntries(
        Object.entries<string | readonly string[]>(story).map(
          ([field, value]): [string, string | MessageTree] => [
            field,
            typeof value === 'string'
              ? value
              : Object.fromEntries(
                  value.map((text, index): [string, string] => [String(index), text]),
                ),
          ],
        ),
      ),
    ]),
  );
}

/** Explicit, isolated copy binding. No draft data is imported at runtime. */
export function createHistoryJourneyText(locale: AppLocale, messages: HistoryJourneyMessages) {
  const content = {
    de: { historyJourney: resource(messages.de) },
    'en-US': { historyJourney: resource(messages['en-US']) },
    'en-GB': { historyJourney: resource(messages['en-GB']) },
  };
  const instance = createContentI18n(locale, content);
  return (era: Era): HistoryJourneyText => {
    const story = content[locale].historyJourney[era];
    if (!story || typeof story === 'string') throw new Error('History translation unavailable');
    const text = (field: keyof RawStory, index?: number) => {
      const value = story[field];
      const raw =
        index === undefined ? value : typeof value === 'object' ? value[String(index)] : undefined;
      if (typeof raw !== 'string') throw new Error('History translation unavailable');
      // Only existing glossary references are allowed; no cross-story nesting.
      for (const [, reference = ''] of raw.matchAll(/\$t\(([^,)]+)(?:,[^)]*)?\)/g)) {
        const key = reference.trim();
        if (!key.startsWith('glossary:') || !instance.exists(key))
          throw new Error('History glossary reference unavailable');
      }
      const key = `content.historyJourney.${era}.${field}${index === undefined ? '' : `.${String(index)}`}`;
      if (!instance.exists(key)) throw new Error('History translation unavailable');
      const translated = instance.t(key as unknown as ParseKeys);
      if (!translated.trim() || translated.includes('$t(') || translated.includes('{{'))
        throw new Error('History translation unresolved');
      return translated;
    };
    const options = (
      field: 'knowledgeOptions' | 'listeningOptions' | 'personaPrompts' | 'personaReplies',
    ) => {
      const values = story[field];
      if (!values || typeof values === 'string' || Object.keys(values).length !== 3)
        throw new Error('History translated answers must have three options');
      return [0, 1, 2].map((index) => text(field, index));
    };
    const copy: HistoryJourneyText = {
      title: text('title'),
      scene: text('scene'),
      modelCaption: text('modelCaption'),
      personaName: text('personaName'),
      personaPrompts: options('personaPrompts'),
      personaReplies: options('personaReplies'),
      knowledgePrompt: text('knowledgePrompt'),
      knowledgeOptions: options('knowledgeOptions'),
      knowledgeExplanation: text('knowledgeExplanation'),
      knowledgeHint: text('knowledgeHint'),
      listeningPrompt: text('listeningPrompt'),
      listeningOptions: options('listeningOptions'),
      listeningExplanation: text('listeningExplanation'),
      listeningHint: text('listeningHint'),
    };
    for (const options of [
      copy.knowledgeOptions,
      copy.listeningOptions,
      copy.personaPrompts,
      copy.personaReplies,
    ])
      if (options.length !== 3 || new Set(options.map((option) => option.trim())).size !== 3)
        throw new Error('History translated answers must be distinct');
    return copy;
  };
}
