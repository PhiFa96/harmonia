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
    type_interval_semitones: 'Count semitones',
    question_interval_semitones:
      'How many semitones separate the two written pitches? Count the moves between adjacent piano keys. The starting key counts as 0.',
    question_interval_quality:
      'What is the full name of the written interval? Check its number and distance in semitones.',
    question_interval_perfect:
      'Is the written interval a perfect fourth, perfect fifth or perfect octave? Check both its number and semitone distance.',
    intervalReadingExplanation_perfect:
      '{{from}} → {{to}}: interval number {{count}}, sounding distance {{distance}}. A perfect fourth has 5 semitones, a perfect fifth 7 and a perfect octave 12. Number and distance must both fit. Answer: {{answer}}.',
    intervalReadingHint_semitones_1:
      'Begin at the first marked key with 0. Each move to the next key counts 1, regardless of key colour.',
    intervalReadingHint_semitones_2:
      'E to F and B to C have no intervening black key: one semitone. Other adjacent white keys have a black key between them: two semitones.',
    intervalReadingHint_quality_1:
      'Count the letter-name positions first, including the start and destination. Then find the semitone distance between the pitches.',
    intervalReadingHint_quality_2:
      'A minor third has 3 semitones; a major third has 4. Perfect fourth, fifth and octave combine the numbers 4, 5 and 8 with 5, 7 and 12 semitones.',
    intervalReadingHint_perfect_1:
      'A fourth or fifth letter-name position alone is not enough. Also check the number of semitones.',
    intervalReadingHint_perfect_2:
      'Compare number and distance: fourth 4 with 5 semitones, fifth 5 with 7, octave 8 with 12. A distance of 6 semitones meets none of these conditions.',
    intervalReadingHint_direction_1:
      'Read the left notehead first, then the right. Compare their height on the stave.',
    knowledgeStart: 'Practise knowledge, matching and ordering',
    knowledgeHistoryDefinition_evidence_metadata:
      'A labelled source gives authorship, place or date, for example; its reliability must be checked separately.',
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
