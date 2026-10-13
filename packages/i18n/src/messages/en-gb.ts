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
    intervalReadingHint_direction_1:
      'Read the left notehead first, then the right. Compare their height on the stave.',
    knowledgeStart: 'Practise knowledge, matching and ordering',
    knowledgeHint_meters:
      'Distinguish the number of denominator units from the number of beats. In compound metres, three units form one beat.',
    rhythmStart: 'Practise rhythm and metre',
    type_PICKUP_IDENTIFY: 'Recognise an $t(glossary:pickup_one)',
    question_PICKUP_IDENTIFY:
      'Is the first notated bar before the first bar line an upbeat? Compare its duration with the following complete bar.',
    pickupYes: 'Yes, an upbeat',
    pickupNo: 'No, a complete bar',
    pickupExplanation:
      '{{meter}} holds {{capacity}} × one crotchet value. Before the first bar line: {{first}} × one crotchet value. {{answer}}. The second bar shows the full length.',
    pickupDescription:
      'Time signature {{meter}}. First bar before the bar line: {{events}} A complete bar follows.',
    pickupHint2:
      'Compare that sum with the numerator of the time signature: 2/4, 3/4 or 4/4. Two quavers equal one crotchet.',
    pickupScroll: 'Scroll the notation sideways to see the full following bar.',
    meterHint1:
      'The numerator gives the number of units; the denominator gives their note value. In 6/8, 9/8 and 12/8, three quavers form one beat.',
    chordStart: 'Recognise and write chords',
    chordIntro:
      'Nine questions: write major, minor, diminished and augmented triads with inversions, recognise them in notation and identify them by ear.',
    type_CHORD_IDENTIFY: 'Recognise $t(glossary:chord_other)',
    question_INTERVAL_BUILD:
      'Write the second note: {{interval}} from {{from}}. Place it in the empty second bar.',
    staffInputHint:
      'Tap the empty bar or adjust the rest with your screen reader. Drag to move your note. Choose its accidental with the controls below.',
  },
  lesson: {
    scrollKeyboardExample:
      'Scroll the piano keyboard sideways to see all labelled octave registers.',
    overview:
      'Your first lesson: ten reading and listening questions. Learn the basics, practise with hints and revisit mistakes with new notation examples.',
    restart: 'Practise lesson again',
    latestDate: 'Practised on {{date}}',
    loadError: 'Saved results could not be loaded. You can still practise.',
  },
} as const satisfies PartialMessages;
