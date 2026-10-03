// Englisch (UK): nur Abweichungen von en-US, der Rest kommt aus en-US.
// Fachbegriffe (crotchet, bar …) nicht hier, sondern im Glossar überschreiben.

import type { PartialMessages } from './types.ts';

export const enGB = {
  profile: {
    licenses: 'Licences',
  },
} as const satisfies PartialMessages;
