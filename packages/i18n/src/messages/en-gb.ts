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
    // Stufe 2: britische Fachwörter in neuen Quellenaufgaben.
    'contextQuestion_crossbar-duration':
      'How many crotchet values does the first pitch last across the bar line?',
    'contextHint1_crossbar-duration':
      'Follow the tie into the next bar. Silence before the first pitch is not part of its sounding duration.',
    'contextHint2_crossbar-duration':
      'Add the last note value of the first bar and its tied continuation at the start of the second.',
    'contextExplain_crossbar-duration':
      'The bar line does not interrupt the tie. There is only one onset; both note values add to one sounding duration.',
    'question_listening_rhythm-completion':
      'Listen to the complete bar. Which cell supplies the missing fourth crotchet beat in the written outline?',
    'listeningExplanation_rhythm-completion':
      'The first three crotchet beats match the outline. The final cell is compared with the actual sound of beat four. Answer: {{answer}}.',
    listeningOutline: 'Outline: beat four is missing. Each option spans one crotchet value.',
    contextEvent: 'Bar {{measure}}, event {{index}}: {{duration}}. {{positions}}',
    contextFraction: '{{fraction}} × crotchet value',
    'contextQuestion_accidental-scope':
      'Name note {{target}}, including its octave. Check bar lines, naturals and register.',
    'contextHint1_accidental-scope':
      'An accidental applies within the bar to the same letter name in the same octave.',
    'contextHint2_accidental-scope':
      'At the bar line, the key signature applies again. A natural cancels the alteration previously in force.',
    'contextExplain_accidental-scope':
      'The target note’s actual spelling accounts for the accidental state in its bar and register.',
    'contextQuestion_dotted-duration': 'How many crotchet values does the first dotted note last?',
    'contextHint2_dotted-duration':
      'Dotted quaver = quaver + semiquaver; dotted crotchet = crotchet + quaver.',
    'contextQuestion_tied-duration':
      'How many crotchet values does the first pitch last, including all its ties?',
    'contextHint2_tied-duration':
      'Add only the tied note values. Exclude rests; crossing a bar line does not end the tie.',
    'contextExplain_tied-duration':
      'The checked tie chain has one onset. Its continuous duration is the sum of its tied values, including across a bar line.',
    contextQuestion_syncopation:
      'Does a note start between crotchet beats and continue past the next beat?',
    contextHint2_syncopation:
      'An quaver on the second half alone is insufficient: its sound must cross the following beat.',
    contextExplain_syncopation:
      'This introductory question checks whether a pitch starting between beats continues across the following crotchet beat.',
    'contextQuestion_triplet-duration':
      'How many crotchet values do the first three quavers under the triplet number 3 occupy together?',
    'contextHint1_triplet-duration':
      'An quaver triplet has three equal quavers in the time of two ordinary quavers.',
    'contextHint2_triplet-duration':
      'Each triplet quaver is 1/3 of a crotchet. Add the three triplet notes, excluding the following note.',
    'contextExplain_triplet-duration':
      'The 3:2 ratio shortens each quaver to two thirds of its ordinary value. Three together equal exactly one crotchet value.',
    'contextHint1_scale-pattern': 'Count piano-key steps: tone = 2, semitone = 1.',
    'contextHint2_scale-pattern': 'A major scale has its semitones between degrees 3–4 and 7–8.',
    // Ende Stufe 2.
    grandStaffDescription:
      'Grand stave: treble clef above, bass clef below. {{description}} The stave in {{silent}} contains a rest for the entire bar.',
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
