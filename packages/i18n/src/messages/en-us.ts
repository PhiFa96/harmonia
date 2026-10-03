// Texte der Oberfläche auf Englisch (US). Muss alle Schlüssel aus de.ts haben.

import type { Messages } from './types.ts';

export const enUS = {
  tabs: {
    learn: 'Learn',
    practice: 'Practice',
    profile: 'Profile',
  },
  placeholder: 'Something is being built here.',
  learn: {
    exampleScale: 'Example: C major scale in $t(glossary:notes.quarter_other)',
  },
  profile: {
    language: 'Language',
    languageDevice: 'Same as device',
    licenses: 'Licenses',
    bravuraLicense:
      'Music font Bravura © Steinberg Media Technologies GmbH, SIL Open Font License 1.1',
  },
} as const satisfies Messages;
