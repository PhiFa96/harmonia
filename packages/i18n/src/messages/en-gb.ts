// Englisch (UK): nur Abweichungen von en-US, der Rest kommt aus en-US.
// Fachbegriffe (crotchet, bar …) nicht hier, sondern im Glossar überschreiben.

import type { PartialMessages } from './types.ts';
import { contentMessages } from '@harmonia/i18n/content-messages';

export const enGB = {
  content: contentMessages['en-GB'],
  profile: {
    licenses: 'Licences',
  },
  lesson: {
    overview:
      'Your first lesson: ten reading and listening questions. Learn the basics, practise with hints and revisit mistakes with new notation examples.',
    restart: 'Practise lesson again',
    latestDate: 'Practised on {{date}}',
    loadError: 'Saved results could not be loaded. You can still practise.',
  },
} as const satisfies PartialMessages;
