// Englisch (UK): nur Abweichungen von en-US, der Rest kommt aus en-US.
// Fachbegriffe (crotchet, bar …) nicht hier, sondern im Glossar überschreiben.

import type { PartialMessages } from './types.ts';
import { contentMessages } from '@harmonia/i18n/content-messages';

export const enGB = {
  content: contentMessages['en-GB'],
  profile: {
    licenses: 'Licences',
  },
  exercise: {
    question_INTERVAL_BUILD:
      'Write the second note: {{interval}} from {{from}}. Place it in the empty second bar.',
    staffInputHint:
      'Tap the empty bar or adjust the rest with your screen reader. Drag to move your note. Choose its accidental with the controls below.',
  },
  lesson: {
    overview:
      'Your first lesson: ten reading and listening questions. Learn the basics, practise with hints and revisit mistakes with new notation examples.',
    restart: 'Practise lesson again',
    latestDate: 'Practised on {{date}}',
    loadError: 'Saved results could not be loaded. You can still practise.',
  },
} as const satisfies PartialMessages;
