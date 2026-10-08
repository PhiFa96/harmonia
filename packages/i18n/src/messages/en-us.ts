import { contentMessages } from '@harmonia/i18n/content-messages';
// Texte der Oberfläche auf Englisch (US). Muss alle Schlüssel aus de.ts haben.

import type { Messages } from './types.ts';

export const enUS = {
  content: contentMessages['en-US'],
  tabs: {
    learn: 'Learn',
    practice: 'Practice',
    profile: 'Profile',
  },
  placeholder: 'Something is being built here.',
  learn: {
    unavailable: 'New lessons are being prepared. You can already practise freely.',
    exampleScale: 'Example: C major scale in $t(glossary:notes.quarter_other)',
  },
  practice: {
    input: 'Input',
    input_staff: 'Staff',
    input_piano: 'Piano',
    intervalTitle: 'Enter an interval',
    intervalTask: 'Place a major third above C4.',
    intervalHint:
      'Tap the staff to place the note. Drag to move it; the bar below adds an accidental.',
    keyboardHint: 'With a keyboard: Tab to the note, then use the up and down arrows to move it.',
    placed: 'Placed: {{note}}',
    nothingPlaced: 'No note placed yet.',
    accidentals: '$t(glossary:accidental_other)',
    remove: 'Delete',
    check: 'Check',
    correct: 'Correct, that is the major third.',
    wrong: 'Not quite. Try again.',
    correctTitle: 'Correct!',
    wrongTitle: 'Not quite',
  },
  exercise: {
    title: 'Read and hear music',
    intro:
      'Practice note names and intervals. Choose an answer and check it. Hints guide you step by step.',
    start: 'Start practice set',
    restart: 'Start a new practice set',
    noteInput: 'Try notation and piano input',
    constructionStart: 'Enter notes and build intervals',
    chooseSet: 'Choose practice set',
    rhythmStart: 'Practice rhythm and meter',
    rhythmIntro:
      'Six questions: tap note onsets after a count-in $t(glossary:measure_one) and identify how $t(glossary:timeSignature_other) are grouped. Stay silent during rests.',
    type_RHYTHM_TAP: 'Tap $t(glossary:rhythm_one)',
    type_METER_IDENTIFY: 'Group the $t(glossary:meter_one)',
    question_RHYTHM_TAP:
      'Tap each note onset in this $t(glossary:measure_one). Each $t(glossary:beat_one) has the value {{beat}}; the $t(glossary:tempo) is {{bpm}} beats per minute. Your recording starts after one count-in $t(glossary:measure_one).',
    question_METER_IDENTIFY:
      'How is this $t(glossary:meter_one) grouped? Choose the number of beats and their note value.',
    meterOption: '{{count}} beats with the value {{beat}}',
    meterExplanation:
      '{{meter}}: {{count}} beats per $t(glossary:measure_one), each with the value {{beat}}. Each beat divides into {{division}} equal parts. The grouping in denominator units is {{groups}}. The numerator counts denominator units, which are not always the beats.',
    rhythmExplanation:
      '{{matched}} of {{total}} note onsets within ±{{tolerance}} ms; {{missing}} are missing or outside the window, {{extra}} are extra. {{pattern}} Tap note onsets only; stay silent during rests. Any missing or extra tap counts as an error.',
    rhythmPattern: 'Note onsets after the start of the $t(glossary:measure_one): {{times}} ms.',
    rhythmDescription: 'Time signature {{meter}}. {{events}}',
    rhythmEvent: '{{index}}: {{kind}}, {{duration}}.',
    rhythmNote: 'note',
    rhythmRest: 'rest',
    rhythmHint1:
      'Keep counting the beat. Tap only when a note begins, not throughout its duration. Rests have duration but no tap.',
    rhythmHint2:
      'This $t(glossary:measure_one) has {{total}} note onsets. Keep {{count}} steady beats with the value {{beat}} at {{bpm}} beats per minute.',
    meterHint1:
      'The numerator gives the number of units; the denominator gives their note value. In 6/8, 9/8 and 12/8, three eighth notes form one beat.',
    meterHint2: 'Group the units as follows: {{groups}}. Each group forms one beat.',
    rhythmReady: 'Ready for the count-in.',
    rhythmPreparing: 'Preparing sound …',
    rhythmCountIn: 'Count-in: {{current}} of {{count}}',
    rhythmRecording: 'Recording: {{current}} of {{count}} beats',
    rhythmFinished: 'Recording complete. Check it or record again.',
    rhythmBegin: 'Count in and record',
    rhythmRetry: 'Record again',
    rhythmCancel: 'Cancel recording',
    rhythmTap: 'Tap now',
    rhythmTapHint:
      'Tap at each note onset. With a keyboard, press Space or Enter on this button. Holding a key counts once.',
    rhythmTapCount_one: '{{count}} tap recorded.',
    rhythmTapCount_other: '{{count}} taps recorded.',
    rhythmWindow:
      'Timing window: ±{{tolerance}} ms. Note onsets are measured, not how long you hold the button.',
    rhythmPreview: 'Listen to the rhythm example',
    rhythmTarget: 'Note onset {{index}}: {{time}} ms',
    rhythmHit: 'matched, offset {{offset}} ms',
    rhythmMiss: 'missing or outside the timing window',
    rhythmExtras: 'Extra taps: {{times}} ms.',
    rhythmLatency:
      'Reported audio delay: {{latency}} ms; taken into account when measuring your taps.',
    chordStart: 'Recognize and write chords',
    chordIntro:
      'Nine questions: write major, minor, diminished and augmented triads with inversions, recognize them in notation and identify them by ear.',
    type_CHORD_BUILD: 'Write $t(glossary:chord_other)',
    type_CHORD_IDENTIFY: 'Recognize $t(glossary:chord_other)',
    question_CHORD_BUILD:
      'Write {{name}} in close position above {{bass}}. The $t(glossary:bassNote_one) is given; add the two remaining notes.',
    question_CHORD_IDENTIFY:
      'Which $t(glossary:chord_one) do you see? Identify its $t(glossary:root_one), quality and $t(glossary:inversion_one).',
    question_CHORD_AURAL:
      'You hear $t(glossary:root_one) {{root}} first, then the $t(glossary:triad_one). Which quality and $t(glossary:inversion_one) do you hear?',
    chordExplanation:
      '{{name}}: {{notes}}. From $t(glossary:root_one) {{root}}, the intervals are {{third}} and {{fifth}}. The $t(glossary:bassNote_one) is {{bass}}, giving {{inversion}}. Written answers require complete notes, including accidentals and octave. Close position places the remaining chord tones in their next higher registers above the bass note.',
    chordHint1:
      'Arrange the three letter names mentally in thirds. The bottom note of that arrangement is the $t(glossary:root_one). Compare it with the actual lowest note: root, third or fifth in the bass determines $t(glossary:rootPosition) or $t(glossary:inversion_one).',
    chordHint2:
      'The $t(glossary:root_one) is {{root}}. From there you need {{third}} and {{fifth}}. The given or heard $t(glossary:bassNote_one) {{bass}} shows the position; place the other chord tones as close above it as possible.',
    chordAuralHint1:
      'Remember the first single note as the $t(glossary:root_one). Then listen for the lowest note of the $t(glossary:chord_one): compare it with the reference note, including across octaves. Root, third or fifth in the bass determines the position. The intervals between the notes determine the triad quality.',
    chordPreview: 'Your $t(glossary:chord_one)',
    chordSelectTone: 'Choose a chord tone to edit',
    chordTone: 'Note {{index}}',
    chordToneEmpty: 'not placed yet',
    chordFilled: '{{count}} of 2 answer notes placed.',
    chordInputHint:
      'Choose note 2 or 3 and place it in the right $t(glossary:measure_one). The $t(glossary:bassNote_one) stays fixed on the left. The combined notation shows your $t(glossary:chord_one). You may enter the upper notes in either order.',
    tonalityStart: 'Practise scales and key signatures',
    tonalityIntro:
      'Twelve questions: identify and write major and minor scales, recognise key signatures and build them yourself.',
    type_SCALE_BUILD: 'Write $t(glossary:scale_other)',
    type_SCALE_IDENTIFY: 'Identify $t(glossary:scale_other)',
    type_KEYSIG_BUILD: 'Build $t(glossary:keySignature_other)',
    type_KEYSIG_IDENTIFY: 'Identify $t(glossary:keySignature_other)',
    question_SCALE_BUILD:
      'Write {{type}} {{direction}} from {{tonic}}, over one octave with eight notes. The first note is given.',
    question_SCALE_IDENTIFY:
      'Which scale type do you see? The sequence starts on {{tonic}} and goes {{direction}}.',
    question_KEYSIG_BUILD:
      'Build the $t(glossary:keySignature_one) for {{key}}. Choose the altered notes in the usual notation order.',
    question_KEYSIG_IDENTIFY:
      'Which {{mode}} key has this $t(glossary:keySignature_one)? The mode is given.',
    scaleAscending: 'ascending',
    scaleDescending: 'descending',
    scaleExplanation:
      '{{type}} {{direction}} from {{tonic}}: {{notes}}. The distances, counted in $t(glossary:semitone_other), are {{pattern}}. Order, spelling and octave are part of the answer.',
    melodicDescending:
      'In the classical convention, descending melodic minor is written like natural minor. The sixth and seventh degrees are not raised.',
    scaleHint1:
      'Work through the seven natural notes in the requested direction. Note 8 is the starting note in the next octave. Then determine the accidentals.',
    scaleHint2:
      'Compare the distances: {{pattern}} in $t(glossary:semitone_other). Write each letter once in the appropriate octave before adding the octave note.',
    signatureEmpty: 'no accidentals',
    signatureCount: '{{count}} {{sign}}',
    signatureExplanation:
      '{{key}} has {{signature}}. The order is: {{notes}}. Major and its relative natural minor share a key signature; the given mode determines the answer here.',
    signatureDescription:
      '$t(glossary:keySignature_one): {{signature}}. Altered notes in order: {{notes}}.',
    signatureHint1:
      'Sharp order: {{sharps}}. Flat order: {{flats}}. Always start at the beginning of the relevant sequence.',
    signatureHint2:
      'The required signature has {{signature}}. Read or write these notes at the beginning of the appropriate accidental sequence.',
    scaleDegree: 'Note {{index}}',
    scaleSelectDegree: 'Choose the note to edit',
    scaleInputHint:
      'Choose note 2 to 8. Tap and drag on the staff or use the arrow keys to set its pitch. The accidental controls change the selected note.',
    scaleFilled: '{{count}} of 7 answer notes placed.',
    signatureInput: 'Choose accidentals',
    signatureSharp: '$t(glossary:sharp_one)',
    signatureFlat: '$t(glossary:flat_one)',
    signatureAppend: 'Add {{note}}',
    signatureNoAccidentals: 'No accidentals',
    signatureRemoveLast: 'Remove last accidental',
    signatureEntered: 'Your accidental sequence: {{notes}}',
    signatureNothingEntered: 'No accidental sequence entered yet.',
    constructionIntro:
      'Place notes, find keys and build intervals. Nine questions with hints and explained solutions.',
    type_NOTE_PLACE: 'Place notes',
    type_KEY_FIND: 'Find piano keys',
    type_INTERVAL_BUILD: 'Build intervals',
    question_NOTE_PLACE: 'Write {{note}} on the empty staff. Check its accidental and octave.',
    question_KEY_FIND: 'Find the key for {{note}}. Check the octave.',
    question_INTERVAL_BUILD:
      'Write the second note: {{interval}} from {{from}}. Place it in the empty second measure.',
    writtenPitch:
      'The complete answer is {{note}}. The letter, accidental and octave must match; an equally sounding note with a different spelling does not count here.',
    keyExplanation:
      'The required key sounds as {{note}}. Start from the natural note {{natural}} in the same octave. {{alteration}} Equally sounding spellings belong to the same key; a different octave does not count.',
    keyHint1:
      'Find the groups of two black keys: C is immediately to their left, and D is between the two black keys. Count from there to the required natural note in the stated octave.',
    keyHint2:
      'First find {{natural}}. {{alteration}} Moving to the immediately adjacent key is one semitone, including between E and F and between B and C.',
    buildHint2:
      'The pitch distance is {{distance}}. First count the natural notes in the requested direction, including the starting note. Then adjust the target note’s accidental.',
    inputSolution: 'This is the solution',
    staffInputHint:
      'Tap the empty measure or adjust the rest with your screen reader. Drag to move your note. Choose its accidental with the controls below.',
    back: 'Back to exercises',
    question_NOTE_NAME: 'What is this note called? Choose the name without its octave.',
    question_INTERVAL_IDENTIFY_VISUAL:
      'Which $t(glossary:interval_one) do you see between these two notes?',
    question_INTERVAL_IDENTIFY_AURAL:
      'Which $t(glossary:interval_one) do you hear between these two notes?',
    type_NOTE_NAME: 'Note names',
    type_INTERVAL_IDENTIFY_VISUAL: 'Read intervals',
    type_INTERVAL_IDENTIFY_AURAL: 'Hear intervals',
    progress: 'Question {{current}} of {{total}}',
    progressLabel: 'Practice set progress',
    answers: 'Choose an answer',
    next: 'Continue',
    finish: 'View results',
    play: 'Listen to the notes',
    replay: 'Listen again',
    stop: 'Stop playback',
    audioError: 'The sound could not start. Try again or skip the listening questions.',
    noHearing: 'Cannot listen right now',
    hearingPaused:
      'Listening questions are skipped in this practice set. You can practice them with headphones in your next set.',
    headphones: 'Listen to the notes before answering. Headphones help in a noisy environment.',
    hint: 'Hint {{level}}',
    solution: 'Explain the answer',
    assisted: 'Answered with a hint',
    hintHeading: 'Your hint',
    complete: 'Practice set complete',
    summary: '{{correct}} of {{answered}} answers correct.',
    independent_one: '{{count}} answer correct without a hint.',
    independent_other: '{{count}} answers correct without a hint.',
    assistedSummary_one: '{{count}} question answered with a hint.',
    assistedSummary_other: '{{count}} questions answered with a hint.',
    skippedSummary_one: '{{count}} listening question skipped; it does not count as a mistake.',
    skippedSummary_other: '{{count}} listening questions skipped; they do not count as mistakes.',
    noAnswers:
      'You skipped the listening questions. Start a new practice set when you can listen again.',
    unknownAnswer: 'Unknown answer',
    up: 'up',
    down: 'down',
    atReference: 'The note is on this exact line.',
    noteSteps_one: 'From there, move {{count}} letter-name step {{direction}}.',
    noteSteps_other: 'From there, move {{count}} letter-name steps {{direction}}.',
    noteExplanation:
      'In the {{clef}}, {{reference}} is on line {{line}} from the bottom. {{steps}} {{alteration}} The note is called {{answer}}.',
    alter_0: 'Without an $t(glossary:accidental_one), the letter name stays unaltered.',
    alter_1: 'The $t(glossary:sharp_one) raises the note by one $t(glossary:semitone_one).',
    alter_2: 'The $t(glossary:doubleSharp_one) raises the note by two $t(glossary:semitone_other).',
    'alter_-1': 'The $t(glossary:flat_one) lowers the note by one $t(glossary:semitone_one).',
    'alter_-2':
      'The $t(glossary:doubleFlat_one) lowers the note by two $t(glossary:semitone_other).',
    diatonicCount_one: '{{count}} letter name',
    diatonicCount_other: '{{count}} letter names',
    halfSteps_one: '{{count}} $t(glossary:semitone_one)',
    halfSteps_other: '{{count}} $t(glossary:semitone_other)',
    intervalExplanation:
      '{{from}} → {{to}} spans {{diatonic}}, counting both end notes, and {{distance}} in pitch. The interval is {{answer}}.',
    noteHint1:
      'Start with the $t(glossary:clef_one). Count lines and spaces before reading the $t(glossary:accidental_one).',
    noteHint2:
      '{{reference}} is on line {{line}} from the bottom. Each next line or space moves to the next letter name.',
    visualHint1:
      'First count letter names, including both end notes. Then find the pitch distance; the spelling is part of the answer.',
    auralHint1:
      'Listen to the notes again. Compare the pitch distance with intervals you already know.',
    intervalHint2: 'The pitch distance is {{distance}}. Compare it with the available answers.',
    notationDescription: '{{clef}}. {{notes}}',
    positionBottom: 'Note {{index}} is on the bottom line. {{alteration}}',
    positionSteps: 'Note {{index}}: Start on the bottom line. {{steps}} {{alteration}}',
  },
  lesson: {
    overview:
      'Your first lesson: ten reading and listening questions. Learn the basics, practice with hints and revisit mistakes with new notation examples.',
    open: 'View lesson',
    start_one: 'Start {{count}} question',
    start_other: 'Start {{count}} questions',
    restart: 'Practice lesson again',
    home: 'Back to learning',
    introProgress: 'Introduction {{current}} of {{total}}',
    introNext: 'Next introduction card',
    example: 'Sound example',
    chooseExample: 'Choose an example',
    progressLabel: 'Lesson progress',
    hearingPaused:
      'Listening questions are skipped for this lesson, including the review. You can listen again with headphones on your next attempt.',
    reviewTitle: 'Revisit your mistakes',
    reviewIntro_one:
      'One question was not correct yet. You will get a new notation example on the same topic. Your first attempt is counted separately.',
    reviewIntro_other:
      '{{count}} questions were not correct yet. You will get new notation examples on the same topics. Your first attempt is counted separately.',
    reviewStart: 'Start review',
    reviewProgress: 'Review {{current}} of {{total}}',
    reviewProgressLabel: 'Review progress',
    roundEnd: 'Finish round',
    complete: 'Lesson finished',
    initialResult: 'First attempt: {{correct}} of {{answered}} correct.',
    accuracy: 'First-attempt accuracy: {{value}}%.',
    reviewResult_one: 'Review: {{correct}} of {{count}} question correct.',
    reviewResult_other: 'Review: {{correct}} of {{count}} questions correct.',
    reviewAssisted_one: 'One review question answered with hints.',
    reviewAssisted_other: '{{count}} review questions answered with hints.',
    reviewSkipped_one: 'One listening question skipped in the review.',
    reviewSkipped_other: '{{count}} listening questions skipped in the review.',
    unresolved_one: 'One question needs more practice. Start a new attempt when you are ready.',
    unresolved_other:
      '{{count}} questions need more practice. Start a new attempt when you are ready.',
    allResolved: 'All answered topics were solved correctly, some during the review.',
    duration: 'Practice time: {{minutes}} min {{seconds}} sec.',
    saving: 'Saving your result on this device …',
    saved: 'Result saved on this device.',
    saveError:
      'Your result has not been saved yet. Keep this page open and try again. Your first attempt and review remain visible here.',
    retrySave: 'Try saving again',
    latestTitle: 'Your last attempt',
    latestSummary: '{{correct}} of {{answered}} correct on the first attempt.',
    latestReview: '{{correct}} of {{total}} review questions correct.',
    latestDate: 'Practiced on {{date}}',
    olderVersion: 'This attempt belongs to an earlier version of the lesson.',
    loadError: 'Saved results could not be loaded. You can still practice.',
    retryLoad: 'Try loading results again',
  },
  piano: {
    settings: 'Customize',
    title: 'Piano keyboard',
    labels: 'Note names',
    labels_none: 'No labels',
    labels_de: 'German (H/B)',
    labels_intl: 'International (B/B♭)',
    range: 'Range',
    range_practice: 'C4–E5',
    range_middle: 'C3–C6',
    range_full: 'Full piano (A0–C8)',
    eitherName: '{{sharp}} or {{flat}}',
    smaller: '−',
    larger: '+',
    smallerHint: 'Make keys smaller',
    largerHint: 'Make keys larger',
    lower: 'Lower',
    higher: 'Higher',
    moveMode: 'Move',
    playMode: 'Play',
    playHint: 'Touch one or several keys. Move shifts the range without playing.',
    moveHint: 'Swipe left or right. Choose Play to turn the sound back on.',
    shortcutHint:
      'With the piano keyboard focused: the physical keys starting at A play C4–E5 (QWERTY: A W S E D F T G Y H U J K O L P ;). Tab and Space or Enter play individual keys.',
  },
  audioTest: {
    title: 'Audio test',
    intro: 'For latency measurements (P1.16). The tone starts on touch, not on release.',
    tone: 'Tone A4',
    chord: 'C major triad',
    sequence: 'Scale with metronome',
    metronome: 'Metronome 90 BPM',
    stop: 'Stop all',
    notStarted: 'Sound starts with the first tap.',
    sampleRate: 'Sample rate: {{rate}} Hz',
    reportedLatency: 'Latency reported by the system: {{base}} ms processing, {{output}} ms output',
    noReportedLatency: 'The system does not report latency; please measure (see guide).',
    piano_idle: 'Piano: loads with the first tone.',
    piano_loading: 'Loading piano … simple sound until then.',
    piano_ready: 'Piano ready.',
    piano_error: 'Piano could not be loaded; simple sound.',
  },
  highlight: {
    correct: 'correct',
    wrong: 'wrong',
    active: 'selected',
  },
  common: {
    close: 'Close',
  },
  profile: {
    settings: 'Settings',
    language: 'Language',
    languageDevice: 'Same as device',
    appearance: 'Appearance',
    appearanceSystem: 'Same as device',
    appearanceLight: 'Light',
    appearanceDark: 'Dark',
    haptics: 'Vibration',
    reduceMotion: 'Reduce motion',
    reduceMotionHint: 'Applies in addition to the device setting.',
    more: 'More',
    gallery: 'Components (development only)',
    licenses: 'Licenses',
    audioTest: 'Audio test (measurements)',
    bravuraLicense:
      'Music font Bravura © Steinberg Media Technologies GmbH, SIL Open Font License 1.1',
    figtreeLicense:
      'Typeface Figtree © 2022 The Figtree Project Authors, SIL Open Font License 1.1',
    accidentalsLicense:
      'Accidentals in text: subset of Bravura Text © Steinberg Media Technologies GmbH, SIL Open Font License 1.1, renamed Harmonia Accidentals',
    pianoLicense:
      'Piano sound: Salamander Grand Piano by Alexander Holm, CC BY 3.0 (creativecommons.org/licenses/by/3.0). Modified: selection, shortened, mono, tuning corrected.',
  },
  gallery: {
    title: 'Components',
    intro: 'All basic components of the design system. Development builds only.',
    preview: 'Preview',
    text: 'Type',
    sampleDisplay: 'Lesson complete!',
    sampleTitle: 'Which interval do you hear?',
    sampleBody: 'Place a note a major third above C4.',
    sampleMuted: 'Round 3 of 4 · about 4 minutes',
    sampleAccidentals: 'F♯ and G♭ sound the same but are written differently.',
    buttons: 'Buttons',
    primary: 'Check',
    secondary: 'Listen again',
    ghost: 'Skip',
    success: 'Continue',
    danger: 'Got it',
    disabled: 'Locked',
    progress: 'Progress',
    progressValue: '{{done}} of {{total}}',
    more: 'One more round',
    feedback: 'Feedback',
    correctMessage: 'C4–E4 is a major third: three letter names, four $t(glossary:semitone_other).',
    wrongMessage:
      'C4–E♭4 is a minor third. The major third needs one more $t(glossary:semitone_one).',
    replay: 'Listen again',
    card: 'Card',
    cardText: 'Cards hold content such as music examples or statistics.',
    list: 'Lists and switches',
    sheet: 'Bottom sheet',
    openSheet: 'Open sheet',
    sheetTitle: 'Appearance',
    sheetText:
      'Choices or details go here. Close with the button, by tapping outside or with Back.',
  },
} as const satisfies Messages;
