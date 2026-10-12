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
    question_durationSymbol: 'What value does this {{kind}} symbol have?',
    question_measureGap:
      'Which {{kind}} completes this $t(glossary:measure_one) to exactly four $t(glossary:notes.quarter_other)?',
    measureGapDescription:
      'Four-four $t(glossary:measure_one). Present, in order: {{events}}. One {{kind}} is missing at the end.',
    measureGapExplanation:
      'The given values total {{used}} $t(glossary:notes.quarter_other). 4 − {{used}} = {{missing}}. Missing: {{answer}}. Rests count too; bar lines have no duration.',
    durationSymbolHint1:
      'Look at the shape, fill, stem and flags. For rectangular rests, their position relative to the line matters.',
    durationSymbolHint2:
      'Each step from $t(glossary:notes.whole_one) to $t(glossary:notes.half_one), $t(glossary:notes.quarter_one), $t(glossary:notes.eighth_one) and $t(glossary:notes.sixteenth_one) halves the duration. Rest symbols have matching values.',
    measureGapHint1:
      'Express notes and rests in $t(glossary:notes.quarter_other). Add them, then subtract the total from four.',
    measureGapHint2:
      'One $t(glossary:notes.half_one) equals two $t(glossary:notes.quarter_other); two $t(glossary:notes.eighth_other) or four $t(glossary:notes.sixteenth_other) equal one $t(glossary:notes.quarter_one). The missing value must fit exactly.',
    knowledgeRestDuration:
      'Silence for {{value}} × the duration of a $t(glossary:notes.whole_one).',
    knowledge_barlines_single: '$t(glossary:barline_one)',
    knowledge_barlines_final: '$t(glossary:finalBarline_one)',
    knowledgeDefinition_barlines_single:
      'A thin vertical line separates adjacent $t(glossary:measure_other); it has no duration of its own.',
    knowledgeDefinition_barlines_final:
      'A thin and a thick vertical line mark the end of a piece or complete section.',
    knowledgeHint_rests:
      'Rests have definite durations. The steady pulse continues during silence.',
    knowledgeHint_barlines:
      'One thin line separates $t(glossary:measure_other); thin plus thick marks an ending.',
    durationShape_note_whole: 'Unfilled oval notehead without a stem.',
    durationShape_note_half: 'Unfilled oval notehead with a stem and no flag.',
    durationShape_note_quarter: 'Filled notehead with a stem and no flag.',
    durationShape_note_eighth: 'Filled notehead with a stem and one flag.',
    durationShape_note_sixteenth: 'Filled notehead with a stem and two flags.',
    durationShape_rest_whole: 'Filled rectangle hanging below a short reference line.',
    durationShape_rest_half: 'Filled rectangle sitting on a short reference line.',
    durationShape_rest_quarter: 'Vertical jagged rest symbol with a curved lower end.',
    durationShape_rest_eighth: 'Slanted rest symbol with one hook.',
    durationShape_rest_sixteenth: 'Slanted rest symbol with two hooks.',
    measureGapSlot: 'Missing value',
    measureGapCapacity: 'Target: four $t(glossary:notes.quarter_other) in total',

    knowledgeStart: 'Practice knowledge, matching and ordering',
    knowledgeIntro:
      'Nine questions: identify basic concepts, match their explanations and order note values or pitches.',
    type_KNOWLEDGE_MC: 'Knowledge question',
    type_MATCH: 'Match concepts',
    type_ORDER: 'Build a sequence',
    orderMoveUp: 'Move up',
    orderMoveDown: 'Move down',
    orderRemoveItem: 'Remove',
    question_KNOWLEDGE_MC: 'Which concept matches this explanation? {{definition}}',
    question_MATCH:
      'Match each concept with its explanation. Each explanation belongs to exactly one concept.',
    question_ORDER: 'Put all the items in order {{direction}}. {{rule}}',
    knowledgeExplanation: '{{term}}: {{definition}}',
    knowledgeKeyboard_semitone: '$t(glossary:semitone_one)',
    knowledgeKeyboard_wholeTone: '$t(glossary:wholeTone_one)',
    knowledgeKeyboard_twoBlackKeys: '$t(glossary:twoBlackKeys_one)',
    knowledgeKeyboard_threeBlackKeys: '$t(glossary:threeBlackKeys_one)',
    knowledgeKeyboardDefinition_semitone:
      'Distance between immediately adjacent $t(glossary:pianoKey_other), including black keys. There is no key in between.',
    knowledgeKeyboardDefinition_wholeTone:
      'Distance of two $t(glossary:semitone_other). Exactly one key lies between the start and end on the $t(glossary:keyboard_one).',
    knowledgeKeyboardDefinition_twoBlackKeys:
      'Repeating group of two black keys. The white key immediately to its left is C.',
    knowledgeKeyboardDefinition_threeBlackKeys:
      'Repeating group of three black keys. The white key immediately to its left is F.',
    knowledgeHint_keyboard:
      'Use the black-key groups to find your place and count every key step, including black keys.',
    knowledge_pulse_pulse: '$t(glossary:pulse)',
    knowledge_pulse_rhythm: '$t(glossary:rhythm_one)',
    knowledge_pulse_metronome: '$t(glossary:metronome_one)',
    knowledge_pulse_countIn: '$t(glossary:countIn)',
    knowledge_tempo_tempo: '$t(glossary:tempo)',
    knowledge_tempo_bpm: '$t(glossary:beatsPerMinute)',
    knowledge_tempo_faster: 'Higher $t(glossary:tempo)',
    knowledge_tempo_slower: 'Lower $t(glossary:tempo)',
    knowledge_beatGroup_first: 'First $t(glossary:beat_one)',
    knowledge_beatGroup_duple: '$t(glossary:beatGroup_one) of two $t(glossary:beat_other)',
    knowledge_beatGroup_triple: '$t(glossary:beatGroup_one) of three $t(glossary:beat_other)',
    knowledge_beatGroup_quadruple: '$t(glossary:beatGroup_one) of four $t(glossary:beat_other)',
    knowledgeDefinition_pulse_pulse:
      'Steady underlying beats that provide a timing reference when making music. Their spacing stays equal here.',
    knowledgeDefinition_pulse_rhythm:
      'The sequence of sounding events and rests in time. It can include long and short durations while the underlying beats stay steady.',
    knowledgeDefinition_pulse_metronome:
      'A device or app that produces evenly spaced clicks at a chosen speed.',
    knowledgeDefinition_pulse_countIn:
      'Steady clicks before your entrance. They establish the speed and starting point together.',
    knowledgeDefinition_tempo_tempo:
      'The speed of the underlying beat. It determines how quickly evenly spaced clicks follow one another.',
    knowledgeDefinition_tempo_bpm:
      'The unit for the number of underlying beats in one minute. At 60, consecutive clicks are one second apart.',
    knowledgeDefinition_tempo_faster:
      'More beats per minute than before: the gaps between clicks become shorter.',
    knowledgeDefinition_tempo_slower:
      'Fewer beats per minute than before: the gaps between clicks become longer.',
    knowledgeDefinition_beatGroup_first:
      'Here, the accented counting position that starts a new group. Counting returns to 1; the time interval stays equal.',
    knowledgeDefinition_beatGroup_duple:
      'Repeating count 1–2, 1–2. After the second position, the next group begins.',
    knowledgeDefinition_beatGroup_triple:
      'Repeating count 1–2–3, 1–2–3. After the third position, the next group begins.',
    knowledgeDefinition_beatGroup_quadruple:
      'Repeating count 1–2–3–4, 1–2–3–4. After the fourth position, the next group begins.',
    knowledgeHint_pulse:
      'Distinguish the steady timing reference, the sequence of sounds and rests, the click device and the lead-in before your entrance.',
    knowledgeHint_tempo:
      'Compare speed, its unit and changing click intervals: more beats per minute means shorter intervals.',
    knowledgeHint_beatGroup:
      'Count each position once. After the last position, return to 1; accenting a beat does not change the time interval.',
    type_PULSE_TAP: 'Tap the $t(glossary:pulse)',
    question_PULSE_TAP:
      'After the $t(glossary:countIn), tap every click: {{count}} steady beats at {{bpm}} beats per minute. Listen to one whole group first; recording starts on the next 1.',
    pulseDescription:
      '{{count}} evenly spaced counting positions at {{bpm}} beats per minute. The first is accented; all time intervals are equal.',
    pulseGroup: '{{count}} beats · {{bpm}} BPM · 1 starts the group',
    pulseHint1:
      'Listen to the whole count-in group first. Start tapping on the next accented 1 and tap every click, including unaccented ones.',
    pulseHint2:
      'Tap exactly {{count}} times at evenly spaced intervals at {{bpm}} beats per minute. Holding the button counts as one tap.',
    pulseExplanation:
      '{{matched}} of {{total}} beats within ±{{tolerance}} ms; {{missing}} are missing or outside the window, {{extra}} are extra. {{pattern}} Tap every click once. The accented 1 is no longer than other beats.',
    pulsePattern: 'Beats after recording starts: {{times}} ms.',
    pulseTapHint:
      'Tap every click. With a keyboard, press Space or Enter on this button. Holding a key counts once.',
    pulseWindow:
      'Timing window: ±{{tolerance}} ms. Tap onsets are measured, not how long you hold the button.',
    pulseTarget: 'Beat {{index}}: {{time}} ms',
    knowledgeRaises: 'Raises a natural note by {{distance}}.',
    knowledgeLowers: 'Lowers a natural note by {{distance}}.',
    knowledgeNatural: 'Cancels an existing alteration and restores the natural pitch of the note.',
    knowledgeDuration: 'Value: {{value}} × $t(glossary:notes.whole_one).',
    knowledgeInterval: 'Spans {{positions}}, counting both endpoints, and {{distance}}.',
    knowledgePositions_one: '{{count}} diatonic note position',
    knowledgePositions_other: '{{count}} diatonic note positions',
    knowledgeTriad:
      '$t(glossary:triad_one) in thirds: its notes are {{pattern}} $t(glossary:semitone_other) above the $t(glossary:root_one).',
    knowledgeTriad_major: 'Major $t(glossary:triad_one)',
    knowledgeTriad_minor: 'Minor $t(glossary:triad_one)',
    knowledgeTriad_diminished: 'Diminished $t(glossary:triad_one)',
    knowledgeTriad_augmented: 'Augmented $t(glossary:triad_one)',
    knowledgeScale:
      'Ascending $t(glossary:scale_one): consecutive steps over an octave contain {{pattern}} $t(glossary:semitone_other).',
    knowledgeMeter:
      '{{count}} beats per $t(glossary:measure_one), each with the value {{beat}}. Grouping in denominator units: {{groups}}.',
    knowledgeHint_accidentals:
      'Compare raising, lowering and cancelling an alteration. $t(glossary:sharp_other) and $t(glossary:flat_other) change the natural pitch by one $t(glossary:semitone_one), double signs by two.',
    knowledgeHint_noteValues:
      'Reference for the fractions: $t(glossary:notes.whole_one). A dot adds half of the undotted value.',
    knowledgeHint_intervals:
      'Count the note letters including both endpoints and also the semitone distance. Semitones alone do not determine the spelling.',
    knowledgeHint_triads:
      'Consider the root, third and fifth in thirds. Compare their semitone distances from the root.',
    knowledgeHint_scales:
      'Compare consecutive semitone steps upwards. Classical melodic minor is explicitly considered in its ascending form here.',
    knowledgeHint_meters:
      'Distinguish the number of denominator units from the number of beats. In compound meters, three units form one beat.',
    knowledgeHint_pitches:
      'Compare the octave first, then the pitch within it. German H corresponds to English B.',
    knowledgeHint2_KNOWLEDGE_MC: 'Narrow your choice to these two concepts: {{candidates}}.',
    knowledgeHint2_MATCH: 'Begin with this pair: {{term}} – {{definition}}',
    knowledgeHint2_ORDER: 'The first item is {{first}}.',
    order_noteValues_ascending: 'from shortest to longest duration',
    order_noteValues_descending: 'from longest to shortest duration',
    order_pitches_ascending: 'from lowest to highest',
    order_pitches_descending: 'from highest to lowest',
    orderRule_noteValues: 'The complete note value, including its dot, is compared.',
    orderRule_pitches: 'The octave is part of the pitch.',
    orderExplanation: 'The correct order {{direction}} is: {{sequence}}. {{rule}}',
    matchSelectTerm: 'Select a concept to edit',
    matchDefinitions: 'Choose an explanation for {{term}}',
    matchUnset: 'not matched yet',
    matchFilled: '{{count}} of {{total}} concepts matched.',
    matchClear: 'Clear match',
    matchInstruction:
      'Choose a concept, then an explanation. Choosing an explanation that is already used clears its previous match.',
    orderChoices: 'Available items',
    orderAnswer: 'Your sequence',
    orderEmpty: 'Choose the first item from the options.',
    orderFilled: '{{count}} of {{total}} items ordered.',
    orderPosition: 'Position {{index}}: {{value}}',
    orderUp: 'Move {{value}} up',
    orderDown: 'Move {{value}} down',
    orderRemove: 'Remove {{value}}',
    orderInputHint:
      'Choose the items in your preferred order. Use the buttons to move or remove them.',
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
    type_PICKUP_IDENTIFY: 'Recognize a $t(glossary:pickup_one)',
    question_RHYTHM_TAP:
      'Tap each note onset in this $t(glossary:measure_one). Each $t(glossary:beat_one) has the value {{beat}}; the $t(glossary:tempo) is {{bpm}} beats per minute. Your recording starts after one count-in $t(glossary:measure_one).',
    question_METER_IDENTIFY:
      'How is this $t(glossary:meter_one) grouped? Choose the number of beats and their note value.',
    question_PICKUP_IDENTIFY:
      'Is the first notated measure before the first bar line a pickup? Compare its duration with the following complete measure.',
    pickupYes: 'Yes, a pickup',
    pickupNo: 'No, a complete measure',
    pickupExplanation:
      '{{meter}} holds {{capacity}} × one quarter-note value. Before the first bar line: {{first}} × one quarter-note value. {{answer}}. The second measure shows the full length.',
    pickupDescription:
      'Time signature {{meter}}. First measure before the bar line: {{events}} A complete measure follows.',
    pickupHint1: 'Add only the note values before the first bar line.',
    pickupHint2:
      'Compare that sum with the numerator of the time signature: 2/4, 3/4 or 4/4. Two eighth notes equal one quarter note.',
    pickupScroll: 'Scroll the notation sideways to see the full following measure.',
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
    question_KEY_FIND_name: 'Find the key for {{note}}.',
    question_KEY_FIND_score:
      'Play the written note on the $t(glossary:keyboard_one). Check its $t(glossary:noteName_one) and $t(glossary:octave_one).',
    question_INTERVAL_BUILD:
      'Write the second note: {{interval}} from {{from}}. Place it in the empty second measure.',
    writtenPitch:
      'The complete answer is {{note}}. The letter, accidental and octave must match; an equally sounding note with a different spelling does not count here.',
    keyExplanation:
      'The required key sounds as {{note}}. Start from the natural note {{natural}} in the same octave. {{alteration}} Equally sounding spellings belong to the same key; a different octave does not count.',
    keyNameExplanation:
      'The required key sounds as {{note}}. The $t(glossary:naturalNote_one) {{natural}} occurs only once in the shown range. Start there. {{alteration}} Equally sounding spellings belong to the same key.',
    keyHint1:
      'Find the groups of two black keys: C is immediately to their left, and D is between the two black keys. Count from there to the required natural note in the stated octave.',
    keyNameHint1:
      'Find the $t(glossary:twoBlackKeys_other): C is immediately to their left, and D is between their keys. Count along the white keys to the requested $t(glossary:naturalNote_one) in the shown range.',
    keyScoreHint1:
      'First read the $t(glossary:clef_one) and the note position, including its $t(glossary:ledgerLine_other). Work out the complete $t(glossary:noteName_one). Find C in the same $t(glossary:octave_one) on the $t(glossary:keyboard_one), then move to the matching key.',
    keyHint2:
      'First find {{natural}}. {{alteration}} Moving to the immediately adjacent key is one semitone, including between E and F and between B and C.',
    buildHint2:
      'The pitch distance is {{distance}}. First count the natural notes in the requested direction, including the starting note. Then adjust the target note’s accidental.',
    inputSolution: 'This is the solution',
    staffInputHint:
      'Tap the empty measure or adjust the rest with your screen reader. Drag to move your note. Choose its accidental with the controls below.',
    back: 'Back to exercises',
    question_NOTE_NAME: 'What is this note called? Choose the name without its octave.',
    question_NOTE_NAME_octave:
      'What is the written note called, including its $t(glossary:octave_one)?',
    question_INTERVAL_IDENTIFY_VISUAL:
      'Which $t(glossary:interval_one) do you see between these two notes?',
    question_INTERVAL_IDENTIFY_AURAL:
      'Which $t(glossary:interval_one) do you hear between these two notes?',
    type_NOTE_NAME: 'Note names',
    type_INTERVAL_IDENTIFY_VISUAL: 'Read intervals',
    type_interval_number: 'Count the interval number',
    type_interval_direction: 'Read the direction',
    type_interval_motion: 'Repeated note, step or leap',
    question_interval_number:
      'What interval number do the two written notes form? Count the letter-name positions, including both end notes.',
    question_interval_direction: 'How does pitch move from the first written note to the second?',
    question_interval_motion: 'Is the pattern a repeated note, a step or a leap?',
    intervalNumberOption: '{{number}} · {{name}}',
    intervalNumber1: '$t(glossary:unison_one)',
    intervalNumber2: '$t(glossary:second_one)',
    intervalNumber3: '$t(glossary:third_one)',
    intervalNumber4: '$t(glossary:fourth_one)',
    intervalNumber5: '$t(glossary:fifth_one)',
    intervalNumber6: '$t(glossary:sixth_one)',
    intervalNumber7: '$t(glossary:seventh_one)',
    intervalNumber8: '$t(glossary:octave_one)',
    intervalDirectionUp: 'Ascending',
    intervalDirectionDown: 'Descending',
    intervalDirectionSame: 'Same pitch',
    intervalMotionRepeat: '$t(glossary:noteRepetition_one)',
    intervalMotionStep: '$t(glossary:melodicStep_one)',
    intervalMotionLeap: '$t(glossary:melodicLeap_one)',
    intervalReadingExplanation_number:
      '{{from}} → {{to}}: {{path}}. Include both end positions. Number of letter-name positions: {{count}}. Answer: {{answer}}.',
    intervalReadingExplanation_direction:
      '{{from}} → {{to}}: Compare the vertical positions of the two noteheads from left to right. Answer: {{answer}}.',
    intervalReadingExplanation_motion:
      '{{from}} → {{to}}: {{path}}. Interval number {{count}}. A unison is a repeated note, a second is a step; a third or larger is a leap. Answer: {{answer}}.',
    intervalReadingHint_number_1:
      'Begin at the first note with 1. Each next line or space takes you to the next number.',
    intervalReadingHint_number_2:
      'Count the destination note too. Two identical natural pitches form a unison with the number 1.',
    intervalReadingHint_direction_1:
      'Read the left notehead first, then the right. Compare their height on the staff.',
    intervalReadingHint_direction_2:
      'A higher second notehead means ascending; a lower one means descending. The same position here means the same pitch.',
    intervalReadingHint_motion_1:
      'First check whether the two noteheads occupy the same position. Otherwise, count the intervening letter-name positions too.',
    intervalReadingHint_motion_2:
      'The same pitch is a repetition; the immediately adjacent letter-name position is a step. Skipping positions makes a leap.',
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
    openNamed: 'Open {{title}}',
    openAnother: 'Open lesson',
    taskCount_one: '{{count}} question',
    taskCount_other: '{{count}} questions',
    exampleTempo: 'Sound example: {{bpm}} $t(glossary:notes.quarter_other) per minute.',
    scrollExample: 'Scroll the notation sideways to see all the notes.',
    keyboardExample: 'Piano keyboard example; marked keys: {{notes}}.',
    pulseExampleTempo: 'Sound example: {{bpm}} beats per minute, two beat groups.',
    keyboardMarkers: 'Dots mark the keys used in the notation example.',
    scrollKeyboardExample:
      'Scroll the piano keyboard sideways to see all labeled octave registers.',
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
    range_fixed: 'Range: {{from}}–{{to}}',
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
    shortcutFixedHint:
      'With the piano keyboard focused, letter keys only play notes in the shown range. Tab and Space or Enter play individual keys.',
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
    durationSymbols: 'Note values and rests',
    keyboardExample: '$t(glossary:keyboard_one): learning example',
    pulseExample: '$t(glossary:pulse): counting groups',
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
