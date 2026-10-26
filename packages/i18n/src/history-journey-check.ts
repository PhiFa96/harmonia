// Authoring-only entry; do not export through the public i18n index.
import { checkTranslations } from './check.ts';
import type { ResourceSet } from './check.ts';
import { historyJourneyMessages } from './history-journey-draft.ts';
import type { MessageTree } from './messages/types.ts';
import { RESOURCES } from './resources.ts';
import type { AppLocale } from './locale.ts';

const OPTIONS = ['knowledgeOptions', 'listeningOptions'] as const;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Arrays become numeric keys so every answer text participates in the usual checks. */
function textTree(
  value: Record<string, unknown> | readonly unknown[],
  path: string,
  problems: string[],
): MessageTree {
  return Object.fromEntries(
    Object.entries(value).map(([key, text]): [string, string | MessageTree] => {
      const location = `${path}.${key}`;
      if (typeof text === 'string') return [key, text];
      if (record(text) || Array.isArray(text)) return [key, textTree(text, location, problems)];
      problems.push(`${location}: Text oder Textstruktur erwartet`);
      return [key, ''];
    }),
  );
}

/** Resolved DE/US/UK draft copy, checked separately from public runtime resources. */
export function checkHistoryJourneyTranslations(input: unknown = historyJourneyMessages): string[] {
  const problems: string[] = [];
  const source = record(input) ? input : {};
  const localeResources = (locale: AppLocale) => {
    const value = source[locale];
    const stories = record(value) ? value : {};
    if (!Object.keys(stories).length)
      problems.push(`${locale} historyJourneyDraft: Stationstexte fehlen`);
    for (const [era, story] of Object.entries(stories)) {
      for (const field of OPTIONS) {
        const options = record(story) ? story[field] : undefined;
        if (
          !Array.isArray(options) ||
          options.length !== 3 ||
          !options.every((text: unknown) => typeof text === 'string')
        )
          problems.push(
            `${locale} historyJourneyDraft:${era}.${field}: genau drei Antworttexte erwartet`,
          );
        else if (new Set(options.map((text: string) => text.trim())).size !== 3)
          problems.push(
            `${locale} historyJourneyDraft:${era}.${field}: Antworttexte müssen unterschiedlich sein`,
          );
      }
      for (const field of ['knowledgeHint', 'listeningHint'])
        if (!record(story) || typeof story[field] !== 'string' || !story[field].trim())
          problems.push(`${locale} historyJourneyDraft:${era}.${field}: Hinweistext fehlt`);
    }
    return {
      ...RESOURCES[locale],
      historyJourneyDraft: textTree(stories, `${locale} historyJourneyDraft`, problems),
    };
  };
  const resources: ResourceSet = {
    de: localeResources('de'),
    'en-US': localeResources('en-US'),
    'en-GB': localeResources('en-GB'),
  };
  return [...problems, ...checkTranslations(resources)];
}
