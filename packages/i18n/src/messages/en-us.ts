import { contentMessages } from '@harmonia/i18n/content-messages';
// Texte der Oberfläche auf Englisch (US). Muss alle Schlüssel aus de.ts haben.

import type { Messages } from './types.ts';

export const enUS = {
  content: contentMessages['en-US'],
  placement: {
    title: 'Placement test',
    open: 'View placement',
    offer: 'Find a suitable starting point. Take or repeat the test whenever you like.',
    requested: 'Your test is ready. Find your starting point now.',
    unavailable:
      'The placement test needs reviewed course exercises. None are available in this app version yet. You can practice freely meanwhile.',
    intro:
      '15–25 tasks sample the key skills in levels 1–2. Difficulty adapts to your answers in each subject area.',
    rules:
      'No time limit. Pause or finish early whenever you like. Hints help you but do not count as independent answers. Skip listening tasks without a penalty. The test awards no XP.',
    start: 'Start test',
    restart: 'Start again with the current tasks',
    retake: 'Repeat placement test',
    resume: 'Continue test',
    paused: 'Your unfinished test is saved. Continue where you left off.',
    savedResult: 'Your last placement is saved. View the results or take another test.',
    viewResult: 'View result',
    progress: 'Task {{current}} · at most {{max}}',
    progressLabel: 'Placement test progress',
    hearingPaused:
      'Listening tasks are skipped. They count as neither errors nor evidence of listening ability.',
    pause: 'Pause and go back',
    pauseHint: 'Going back pauses the test. A checked answer is also preserved when you continue.',
    finishEarly: 'Finish test now',
    close: 'Back to learning',
    discard: 'Discard unfinished test',
    changed:
      'The tasks or saved history no longer match this app version. Start a new test; your lessons are preserved.',
    loadError: 'Your test could not be loaded. Try again. Saved data will not be overwritten.',
    saving: 'Saving your test …',
    saveError: 'Your test has not been saved yet. Try again before closing the app.',
    resultTitle: 'Your starting point',
    resultBody:
      'Placement is estimated separately for each subject area. Choose a recommended start or revisit the basics freely.',
    partialTitle: 'Preliminary result',
    partialBody:
      'You finished the test early. This sample is too small to skip units. Recommendations start with the basics.',
    summary:
      '{{answered}} answered · {{correct}} independently correct · {{assisted}} with help · {{skipped}} skipped',
    estimateHint:
      'An estimate from a few tasks, not a qualification or proof of every skill. Level 2 is the ceiling of this test.',
    notRated: 'Not enough evidence to estimate a level',
    foundation: 'Basic skills not yet reliably demonstrated',
    level: 'Estimated level: {{level}}',
    areaEvidence:
      '{{independent}} independently answered · {{correct}} correct · {{assisted}} with help · {{skipped}} skipped',
    uncertain: 'The sample is small or inconsistent. Reviewing the basics is recommended here.',
    startPoint: 'Starting point: {{title}}',
    startLearning: 'Continue learning here',
    startNamed: 'Continue learning: {{title}}',
    testedHint:
      'Units estimated as tested remain available for optional practice. They do not count as completed lessons.',
    testedUnit: 'Tested · {{title}} · optional review',
    prerequisite: 'Helpful foundation first: {{title}}',
    overallStart: 'Recommended first step',
  },
  onboarding: {
    brand: 'Harmonia',
    progress: 'Step {{current}} of {{total}}',
    progressLabel: 'Setup progress',
    continue: 'Continue',
    back: 'Back',
    finish: 'Start learning',
    finishError:
      'Your setup could not be completed. Try again or confirm your sign-in again. Your preferences stay available here.',
    loading: 'Preparing your learning space …',
    loadError:
      'Your saved preferences could not be loaded. Try again or start for this session only.',
    retry: 'Try again',
    temporary: 'Start for this session only',
    temporaryHint:
      'Your preferences stay available during this session. They are not saved after you close it.',
    saveError:
      'Your latest preferences have not been saved yet. Try again; they remain visible here.',
    saving: 'Saving your preferences …',
    languageTitle: 'Music starts with you.',
    languageBody: 'Choose your language. You will try your first question in a moment.',
    languageDevice: 'Same as device',
    languageDeviceBody: 'Follows your device language.',
    languageDeBody: 'German note names and terminology.',
    languageUsBody: 'English with American music terminology.',
    languageUkBody: 'English with British music terminology.',
    goalTitle: 'What would you like to achieve?',
    goalBody: 'Choose what matters most to you today. You can change your preferences later.',
    goal_hobby: 'Music as a hobby',
    goal_hobbyBody: 'Understand music and try it for yourself.',
    goal_school: 'School or lessons',
    goal_schoolBody: 'Learn the basics and solve questions confidently.',
    goal_exam: 'Entrance exam',
    goal_examBody: 'Develop your knowledge and listening skills.',
    goal_ensemble: 'Choir or ensemble',
    goal_ensembleBody: 'Understand written music and musical relationships.',
    experienceTitle: 'Where are you starting?',
    experienceBody: 'There is no wrong self-assessment. It does not replace a placement test.',
    experience_new: 'I am just starting',
    experience_newBody: 'No previous knowledge needed.',
    experience_basics: 'I know some basics',
    experience_basicsBody: 'I have read music or made music before.',
    experience_experienced: 'I have experience',
    experience_experiencedBody: 'I want to find gaps and keep learning.',
    placementTitle: 'Find your starting point',
    placementBody:
      'A short adaptive test finds your starting point. Would you like to take it after setup or try the basics first?',
    placement_later: 'Try the basics first',
    placement_requested: 'Take the test after setup',
    placementHint:
      'Find the test in Learn and Profile whenever you like. Only the test changes your estimated level.',
    dailyTitle: 'A small daily habit',
    dailyBody:
      'Choose your daily goal. Experience points (XP) will be awarded for solved questions later.',
    dailyOption: '{{count}} XP a day',
    dailyHint: 'You can adjust your goal to fit your day at any time.',
    remindersTitle: 'Learn in your own rhythm',
    remindersBody:
      'You decide whether you would like learning reminders later. Saving this preference does not enable notifications.',
    reminderConsent: 'Save a preference for learning reminders',
    reminderHint:
      'You can withdraw your consent in your profile at any time. We will ask separately for permission before enabling reminders.',
    reminderTime: 'Preferred time',
    timeOption: '{{time}}',
    miniTitle: 'Your first small question',
    miniBody:
      'Read the two $t(glossary:notehead_other) from left to right. Higher on the page means a higher pitch; lower means a lower pitch. You do not need note names yet.',
    miniProgress: 'One question to try',
    miniProgressLabel: 'Mini-question progress',
    miniNext: 'Choose my starting profile',
    audioStart: 'Start sound',
    audioStop: 'Stop playback',
    audioHint: 'Tap to hear the two pitches. You can also solve the question without sound.',
    audioError: 'The sound could not be started. Try again or use the written example to answer.',
    accountTitle: 'Your learning is yours.',
    accountBody: 'Start as a guest or sign in by email. Your answers so far stay on this device.',
    account_guest: 'Learn as a guest',
    account_guestBody: 'No email address, with progress saved locally.',
    account_email: 'Sign in by email',
    account_emailBody: 'A code confirms your address; a new account is created automatically.',
    ageConfirmed: 'I am at least 16 years old',
    localProgress:
      'Your learning progress is currently saved on this device. An account does not yet sync it to other devices.',
    profileTitle: 'Your learning setup',
    profileSummary: '{{goal}} · {{experience}}',
    profileEdit: 'Adjust learning goals',
    profileRestart: 'Review setup again',
    profileDaily: 'Daily goal',
    profileReminder: 'Reminder preference',
    reminderOff: 'Off',
    reminderOn: 'Saved: {{time}}',
    profilePlacement: 'Placement',
    placementLater: 'Decide later',
    placementRequested: 'Test requested',
    profileAccount: 'Account',
    guestLabel: 'Guest on this device',
    signedIn: 'Signed in: {{email}}',
    signedOut: 'Currently signed out',
    accountOpen: 'Sign in by email',
    learnWelcome: 'Your learning setup is ready.',
    learnPreference: 'Your goal: {{goal}} · {{count}} XP a day',
    learnPlacement: 'Your placement preference is saved. Start the test from your learning area.',
    editTitle: 'Your learning goals',
    editBody: 'Changes take effect immediately and are saved on this device.',
    done: 'Back to profile',
  },
  auth: {
    title: 'Sign in by email',
    email: 'Email address',
    emailPlaceholder: 'name@example.com',
    send: 'Send code',
    sending: 'Sending code …',
    code: 'Six-digit code',
    verify: 'Confirm address',
    verifying: 'Checking code …',
    sent: 'If this address can be used, your code will be in your inbox. Check your spam folder too.',
    resend: 'Send a new code',
    resendWait: 'Send a new code in {{seconds}} seconds',
    changeEmail: 'Use a different email address',
    invalidEmail: 'Enter a complete email address.',
    invalidCode: 'Enter the six-digit code from your email.',
    sendError: 'The code could not be sent. Check your connection and try again.',
    verifyError:
      'The code is invalid, expired, or could not be checked. Check it or request a new code.',
    unavailable:
      'Email sign-in is not available here yet. You can keep learning locally as a guest.',
    signedIn: 'You are signed in as {{email}}.',
    signOut: 'Sign out on this device',
    signOutError: 'Sign-out could not be completed. Try again.',
    sessionError: 'Your sign-in could not be loaded. Try again.',
    privacy:
      'Choosing “Send code” uses your email address for sign-in. We do not send a learning newsletter.',
    ageHint: 'First confirm that you are at least 16 years old.',
    back: 'Back to profile',
  },
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
    listeningCell: 'Cell {{count}}',
    'contextQuestion_crossbar-duration':
      'How many quarter-note values does the first pitch last across the barline?',
    'contextHint1_crossbar-duration':
      'Follow the tie into the next measure. Silence before the first pitch is not part of its sounding duration.',
    'contextHint2_crossbar-duration':
      'Add the last note value of the first measure and its tied continuation at the start of the second.',
    'contextExplain_crossbar-duration':
      'The barline does not interrupt the tie. There is only one onset; both note values add to one sounding duration.',
    'contextQuestion_jazz-roots':
      'Which social context does this fictional jazz teaching dossier document?',
    'contextHint1_jazz-roots':
      'Identify whether the source describes local music-making, relocation or the production of a recording.',
    'contextHint2_jazz-roots':
      'Community, migration and the recording business are different levels. None of these sources alone proves a first origin.',
    'contextExplain_jazz-roots':
      'Classification follows the social activity explicitly described. African American musical practice, migration and media businesses interact but are not interchangeable.',
    contextSocial_neighbourhood:
      'Fictional neighbourhood report, {{year}}: African American musicians organize local performances and exchange musical ideas within their community.',
    contextSocial_migration:
      'Fictional travel account, {{year}}: musicians move from the southern United States to a northern city and build new musical networks there.',
    'contextSocial_recording-business':
      'Fictional studio file, {{year}}: a company hires musicians, produces a record and distributes it commercially.',
    contextSocialOption_neighbourhood: 'Local community life and musical exchange',
    contextSocialOption_migration: 'Migration and new musical networks',
    'contextSocialOption_recording-business': 'Commercial recording production and distribution',
    listeningSubdivision: '{{count}} equal subdivisions per beat',
    listeningPosition: 'Note {{count}} changed',
    listeningMajorScale: 'Major scale',
    listeningMinorScale: 'Natural minor',
    question_CHORD_DIATONIC:
      'Build the diatonic triad on degree {{degree}} in {{key}}. Use natural minor; given root: {{bass}}.',
    'question_listening_rhythm-choice-dotted':
      'Which complete score matches the dotted rhythm you heard?',
    'question_listening_pulse-subdivision':
      'How many equal subdivisions form one beat? Include the higher starting note as the first part.',
    'question_listening_rhythm-completion':
      'Listen to the complete measure. Which cell supplies the missing fourth quarter-note beat in the written outline?',
    'question_listening_scale-mode':
      'Listen to the ascending scale from tonic to octave. Is it major or natural minor?',
    'question_listening_melodic-memory':
      'Listen to A and B. Which of the four notes changed in the second example?',
    'listeningExplanation_rhythm-choice-dotted':
      'The comparison uses actual onsets, rests and durations, including dots. Answer: {{answer}}.',
    'listeningExplanation_pulse-subdivision':
      'The higher tone marks each beat start. Equal subdivisions up to the next start form the group. Answer: {{answer}}. A heard group alone does not determine a time signature.',
    'listeningExplanation_rhythm-completion':
      'The first three quarter-note beats match the outline. The final cell is compared with the actual sound of beat four. Answer: {{answer}}.',
    'listeningExplanation_scale-mode':
      'Distances are compared from the first note. Major and natural minor differ especially on degrees 3, 6 and 7. Answer: {{answer}}.',
    'listeningExplanation_melodic-memory':
      'Both sources contain four equal-duration notes; exactly one sounding pitch differs at its position. Answer: {{answer}}.',
    listeningOutline: 'Outline: beat four is missing. Each option spans one quarter-note value.',
    contextEvent: 'Measure {{measure}}, event {{index}}: {{duration}}. {{positions}}',
    contextPosition:
      'Notehead {{index}}, {{steps}} letter-name steps from the bottom line; visible accidental: {{sign}}.',
    contextSign_none: 'none',
    contextSign_sharp: 'sharp',
    contextSign_flat: 'flat',
    contextSign_natural: 'natural',
    contextSign_doubleSharp: 'double sharp',
    contextSign_doubleFlat: 'double flat',
    contextResult: '{{explanation}} Answer: {{answer}}.',
    contextFraction: '{{fraction}} × quarter-note value',
    contextDegree: 'Degree {{count}}',
    contextPattern: 'Semitone steps: {{pattern}}',
    contextYes: 'Yes',
    contextNo: 'No',
    contextRole_root: 'root',
    contextRole_third: 'third',
    contextRole_fifth: 'fifth',
    contextScore: 'Written source',
    contextKey: 'Key: {{key}}',
    contextDossier:
      'Fictional European teaching dossier: composition year {{year}}. Stated feature: {{feature}}. The piano example is an original teaching model.',
    contextDocument:
      'Fictional source dated {{year}}: {{medium}}. Consider only what this medium documents.',
    'contextComparison_same-event':
      'Two reports date the same performance to {{year}} and {{secondYear}}, respectively. Their independence is unknown.',
    'contextComparison_work-recording':
      'Source A gives composition year {{year}}. Source B gives recording date {{secondYear}}.',
    'contextComparison_advertised-performed':
      'A programme from {{year}} advertises performing forces. A report from {{secondYear}} describes the forces that actually performed at the same event.',
    contextFeature_monophony: '$t(glossary:monophony) in singing',
    contextFeature_imitation: '$t(glossary:imitation) in vocal $t(glossary:polyphony)',
    contextFeature_continuo: '$t(glossary:continuo)',
    contextFeature_phrases: 'regular periodic phrases',
    contextFeature_chromaticism: 'Expanded $t(glossary:chromaticism)',
    contextFeature_electronics: 'electronic sound production',
    contextMedium_recording: '$t(glossary:recording_one)',
    contextMedium_programme: '$t(glossary:programmeSource_one)',
    contextMedium_report: '$t(glossary:report_one)',
    contextMedium_broadcast: '$t(glossary:broadcast_one)',
    contextMedium_stream: '$t(glossary:stream_one)',
    'contextOption_recorded-performance': 'Documented sound of a recorded performance',
    'contextOption_advertised-event': 'Advertised event; actual execution remains unverified',
    'contextOption_reported-view': 'Preserved view of the report’s author',
    'contextOption_mediated-distribution': 'Distribution through a media channel',
    'contextOption_invented-origin': 'Proof of the musical style’s very first origin',
    'contextOption_universal-style': 'Proof about every musician and work in this tradition',
    'contextOption_different-date-roles': 'Composition and recording date different events',
    'contextOption_intention-performance':
      'Announcement and actual performance are different claims',
    'contextOption_unresolved-conflict': 'Unresolved conflict; additional evidence is needed',
    'contextOption_agreement-not-proof': 'Agreement; independence remains unproven',
    type_CONTEXT_CHOICE: 'Musical relationships',
    question_CONTEXT_CHOICE: 'Examine the source shown.',
    'contextQuestion_accidental-scope':
      'Name note {{target}}, including its octave. Check barlines, naturals and register.',
    'contextHint1_accidental-scope':
      'An accidental applies within the measure to the same letter name in the same octave.',
    'contextHint2_accidental-scope':
      'At the barline, the key signature applies again. A natural cancels the alteration previously in force.',
    'contextExplain_accidental-scope':
      'The target note’s actual spelling accounts for the accidental state in its measure and register.',
    'contextQuestion_enharmonic-spelling':
      'Which different spelling sounds like the written note on an equal-tempered piano?',
    'contextHint1_enharmonic-spelling': 'Compare sounding keys, not just letters.',
    'contextHint2_enharmonic-spelling':
      'C-sharp and D-flat share a key. E-sharp is the F key; B-sharp reaches the next C key.',
    'contextExplain_enharmonic-spelling':
      'Enharmonic spellings preserve the sounding key but change the written letter name. The octave number can change.',
    'contextQuestion_dotted-duration':
      'How many quarter-note values does the first dotted note last?',
    'contextHint1_dotted-duration': 'One dot adds half of the original value.',
    'contextHint2_dotted-duration':
      'Dotted eighth = eighth + sixteenth; dotted quarter = quarter + eighth.',
    'contextExplain_dotted-duration':
      'The first dot multiplies the original value by 3/2. Following rests do not change this note’s duration.',
    'contextQuestion_tied-duration':
      'How many quarter-note values does the first pitch last, including all its ties?',
    'contextHint1_tied-duration': 'A tie joins identical pitches into one continuous sound.',
    'contextHint2_tied-duration':
      'Add only the tied note values. Exclude rests; crossing a barline does not end the tie.',
    'contextExplain_tied-duration':
      'The checked tie chain has one onset. Its continuous duration is the sum of its tied values, including across a barline.',
    contextQuestion_syncopation:
      'Does a note start between quarter-note beats and continue past the next beat?',
    contextHint1_syncopation: 'Find an onset between two beats.',
    contextHint2_syncopation:
      'An eighth on the second half alone is insufficient: its sound must cross the following beat.',
    contextExplain_syncopation:
      'This introductory question checks whether a pitch starting between beats continues across the following quarter-note beat.',
    'contextQuestion_triplet-duration':
      'How many quarter-note values do the first three eighth notes under the triplet number 3 occupy together?',
    'contextHint1_triplet-duration':
      'An eighth-note triplet has three equal eighth notes in the time of two ordinary eighth notes.',
    'contextHint2_triplet-duration':
      'Each triplet eighth is 1/3 of a quarter. Add the three triplet notes, excluding the following note.',
    'contextExplain_triplet-duration':
      'The 3:2 ratio shortens each eighth to two thirds of its ordinary value. Three together equal exactly one quarter-note value.',
    'contextQuestion_interval-inversion':
      'Which interval results when you invert the written simple interval by moving an endpoint by one octave?',
    'contextHint1_interval-inversion': 'The two interval numbers add to 9.',
    'contextHint2_interval-inversion':
      'Perfect stays perfect; minor becomes major; augmented becomes diminished, and conversely.',
    'contextExplain_interval-inversion':
      'Inversion complements the number to 9 and reverses the quality. Unison and octave are the edge case in this model.',
    'contextQuestion_interval-reduction':
      'Which simple interval corresponds to the written distance after removing complete octaves?',
    'contextHint1_interval-reduction': 'An additional octave increases the interval number by 7.',
    'contextHint2_interval-reduction':
      'A ninth corresponds to a second and a tenth to a third. The quality is preserved.',
    'contextExplain_interval-reduction':
      'For compound intervals, subtract 7 from the number for each octave. Preserve the quality; stop reduction at the simple octave.',
    'contextQuestion_scale-pattern':
      'Which semitone pattern describes the seven steps of the ascending scale shown?',
    'contextHint1_scale-pattern': 'Count piano-key steps: whole step = 2, half step = 1.',
    'contextHint2_scale-pattern': 'A major scale has its half steps between degrees 3–4 and 7–8.',
    'contextExplain_scale-pattern':
      'The pattern is calculated from every pair of adjacent sounding pitches, rather than the number of visible accidentals.',
    'contextQuestion_scale-degree':
      'Which degree of the major scale shown is {{focus}}? Count the starting note as 1.',
    'contextHint1_scale-degree':
      'The tonic is degree 1; following letter names are degrees 2, 3 and so on.',
    'contextHint2_scale-degree':
      'Read from the actual starting note. C is not degree 1 in every key.',
    'contextExplain_scale-degree':
      'The degree follows the queried note’s position in this scale. The octave repetition is the tonic again.',
    'contextQuestion_fifth-neighbour':
      'Which key is one fifth {{direction}} from {{key}} on the circle of fifths? Keep the same mode.',
    'contextHint1_fifth-neighbour':
      'An ascending fifth shifts the signature one step towards sharps.',
    'contextHint2_fifth-neighbour':
      'Downwards moves one step towards flats. This can first remove an existing sharp.',
    'contextExplain_fifth-neighbour':
      'Neighbouring circle-of-fifths positions differ by exactly one signature step. Tonic and mode are considered together.',
    'contextQuestion_relative-key': 'Which relative key shares the signature of {{key}}?',
    'contextHint1_relative-key':
      'Relative keys have different tonics and modes but share the same key signature.',
    'contextHint2_relative-key':
      'The relative-minor tonic lies a minor third below the major tonic. Same-tonic minor would be a parallel key.',
    'contextExplain_relative-key':
      'The signature count is unchanged and the mode changes. German Paralleltonart means English relative key, not parallel key.',
    'contextQuestion_chord-member':
      'Which note is the {{role}} of this triad? Its inversion can vary.',
    'contextHint1_chord-member': 'Mentally rearrange the written triad into root position.',
    'contextHint2_chord-member':
      'Root, third and fifth are named from the chord root. The lowest note may have a different role.',
    'contextExplain_chord-member':
      'The engine identifies the complete written triad, then the queried chord-member role. Inversion does not change those roles.',
    'contextQuestion_chord-root': 'What is the root of this written triad?',
    'contextHint1_chord-root': 'Root and lowest sounding note are different concepts.',
    'contextHint2_chord-root':
      'Find the stack of thirds in root position. The bass determines the inversion only.',
    'contextExplain_chord-root':
      'Chord identity follows from all three written notes. A root written above the bass remains the root.',
    'contextQuestion_diatonic-triad':
      'Which triad quality forms on degree {{degree}} in {{key}} when you stack only scale notes in thirds? Minor is natural here.',
    'contextHint1_diatonic-triad':
      'Take degrees n, n+2 and n+4; continue into the next octave above degree seven.',
    'contextHint2_diatonic-triad':
      'Major: major–minor–minor–major–major–minor–diminished. Natural minor follows a different sequence.',
    'contextExplain_diatonic-triad':
      'The three notes are stacked from the actual major or natural-minor scale, then identified as a triad.',
    'contextQuestion_period-context':
      'Which period in the broad European overview fits this teaching dossier’s explicitly stated composition year and feature?',
    'contextHint1_period-context':
      'Use the stated composition year together with the feature; one sonic feature alone cannot date a work.',
    'contextHint2_period-context':
      'The examples lie far from transitions. This is a European overview with overlapping boundaries.',
    'contextExplain_period-context':
      'The teaching dossier supplies a composition year. Classification uses the explicitly taught broad overview and makes no dating claim from the piano model.',
    'contextQuestion_jazz-source':
      'Which statement does this fictional source about a jazz context actually support?',
    'contextHint1_jazz-source':
      'Distinguish a documented performance from the origins of an entire musical tradition.',
    'contextHint2_jazz-source':
      'A recording documents its recorded sound; a programme an announcement; a report its author’s view.',
    'contextExplain_jazz-source':
      'The medium limits the claim. The earliest surviving or commercially issued source does not establish the first musical origin.',
    'contextQuestion_popular-source':
      'Which statement does this fictional source about popular music actually support?',
    'contextHint1_popular-source':
      'Ask whether the source documents sound, an announcement, a view or distribution.',
    'contextHint2_popular-source':
      'Broadcasts and streams document distribution, not automatically a work’s creation or original performing forces.',
    'contextExplain_popular-source':
      'Recording, media channel and composition are different levels. The answer stays at the level actually documented.',
    'contextQuestion_source-comparison':
      'How can you justify the relationship between these two fictional sources?',
    'contextHint1_source-comparison': 'First compare which event or claim each date concerns.',
    'contextHint2_source-comparison':
      'Composition and recording dates can differ. Conflicting dates for the same performance require further evidence.',
    'contextExplain_source-comparison':
      'Matching claims are agreement, not automatic independent corroboration. Different date roles must be distinguished from an unresolved conflict.',
    question_octaveName: 'What is {{name}} in {{system}}?',
    scientificSystem: '$t(glossary:scientificNotation)',
    helmholtzSystem: '$t(glossary:helmholtzNotation)',
    question_grandStaff:
      'Which key matches the only written note on the $t(glossary:grandStaff_one)?',
    octaveNameExplanation:
      '{{source}} and {{answer}} name the same pitch. Scientific octave number {{octave}} starts at C and runs through the following B. Uppercase/lowercase letters and superscript numbers indicate the register in Helmholtz notation.',
    octaveNameHint1:
      'Read the register first: c = C3, c¹ = C4, c² = C5. Each new register starts at C.',
    octaveNameHint2:
      'The number applies to all seven natural notes in that register: b = B3 and b¹ = B4. International B is German H.',
    grandStaffHint1:
      'Find the staff containing the note. The upper staff uses the $t(glossary:trebleClef_one); the lower one uses the $t(glossary:bassClef_one).',
    grandStaffHint2:
      'C4/c¹ lies on the first $t(glossary:ledgerLine_one) below the upper staff and the first above the lower staff. Both spellings belong to the same key.',
    grandStaffDescription:
      'Grand staff: treble clef above, bass clef below. {{description}} The staff in {{silent}} contains a whole-measure rest.',
    type_LISTENING_CHOICE: 'Listen and compare',
    question_listening_pulse:
      'Listen to the two steady pulse groups. How many beats belong to each group? Count the higher starting sound as 1; the next start belongs to the next group.',
    'question_listening_rhythm-compare':
      'Listen to example A and, after the gap, example B. Do they have the same rhythm? Compare starts, sound durations and rests.',
    'question_listening_rhythm-choice':
      'Which of the three scores matches the heard rhythm? All examples use the same pitch.',
    'question_listening_pitch-direction':
      'Listen to the two pitches in sequence. Is the second higher, lower or the same pitch?',
    'question_listening_melody-compare':
      'Listen to melody A and, after the gap, melody B. Do all pitches in the same order and all durations match?',
    question_listening_observation:
      'Which statement describes something you can directly hear in this teaching example?',
    listeningOption: 'Score {{count}}',
    listeningClip: 'Listening example {{count}}',
    listeningPulseCount: 'Pulse group with {{count}} beats',
    listeningSame: 'Same',
    listeningDifferent: 'Different',
    listeningUp: 'Second pitch higher',
    listeningDown: 'Second pitch lower',
    listeningRepeat: 'Same pitch',
    listeningSingle: 'Only one pitch sounds at a time',
    listeningTogether: 'At least two pitches sound together',
    listeningDate: 'The work was certainly composed in 1750',
    listeningPlace: 'The music was certainly performed in a church',
    listeningHint1:
      'Listen to the whole example first. You can stop and replay it. Focus on the property asked about.',
    listeningHint2:
      'Compare beats and rests for rhythm, and pitches for melody. A score describes the sounds; historical claims require additional sources.',
    listeningExplanation_pulse:
      'The higher sound marks the beginning of each group. The evenly spaced beats between two beginnings form one group. Answer: {{answer}}. The next starting sound belongs to the next group.',
    'listeningExplanation_rhythm-compare':
      'The assessment compares actual starts, sound durations and rests in both sound sources. Answer: {{answer}}. Pitch stays the same in these questions.',
    'listeningExplanation_rhythm-choice':
      '{{answer}} has the same starts, sound durations and rests as the played example. The three complete $t(glossary:measure_other) differ audibly.',
    'listeningExplanation_pitch-direction':
      'The second sounding pitch is compared with the first. Answer: {{answer}}. Loudness and duration do not determine higher or lower.',
    'listeningExplanation_melody-compare':
      'The sounding pitches, their order, starts and durations are compared. Answer: {{answer}}. Here, “same” means the same pitches, not just a similar direction.',
    listeningExplanation_observation:
      '{{answer}} can be checked in the sound example. Date and performance venue cannot be established from it alone. This is an original piano teaching model, not a historical recording.',
    orderRule_periods:
      'Order by the conventional broad sequence of European periods; their boundaries can overlap.',
    order_periods_ascending: 'Order the periods from earlier to later.',
    order_periods_descending: 'Order the periods from later to earlier.',
    knowledgeHint_soundSources:
      'Read the described property carefully. Distinguish the term from related categories and consider the limits of the source.',
    knowledgeHistory_soundSources_voice: '$t(glossary:voice_one)',
    knowledgeHistoryDefinition_soundSources_voice:
      'Sound is produced by the vibrating vocal folds of a singing person.',
    knowledgeHistory_soundSources_instrument: '$t(glossary:instrument_one)',
    knowledgeHistoryDefinition_soundSources_instrument:
      'A performer sets a string or a column of air, for example, into vibration.',
    knowledgeHistory_soundSources_recording: '$t(glossary:recording_one)',
    knowledgeHistoryDefinition_soundSources_recording:
      'Stored sound is played back; it can contain voices, instruments or electronic sounds.',
    knowledgeHistory_soundSources_electronic: '$t(glossary:electronicSound)',
    knowledgeHistoryDefinition_soundSources_electronic:
      'An electronic device or program generates the audio signal.',
    knowledgeHint_sourceTypes:
      'Read the described property carefully. Distinguish the term from related categories and consider the limits of the source.',
    knowledgeHistory_sourceTypes_score: '$t(glossary:scoreSource_one)',
    knowledgeHistoryDefinition_sourceTypes_score:
      'A written source specifies pitches, durations and other performance instructions; it is not itself a sounding performance.',
    knowledgeHistory_sourceTypes_recording: '$t(glossary:recording_one)',
    knowledgeHistoryDefinition_sourceTypes_recording:
      'This source documents a particular sounding performance, including its interpretation.',
    knowledgeHistory_sourceTypes_report: '$t(glossary:report_one)',
    knowledgeHistoryDefinition_sourceTypes_report:
      'A person describes a musical event in words; their perspective and memory need to be examined.',
    knowledgeHistory_sourceTypes_programme: '$t(glossary:programmeSource_one)',
    knowledgeHistoryDefinition_sourceTypes_programme:
      'An announcement lists works, performers, venue and date, for example; it alone does not prove that everything happened as announced.',
    knowledgeHint_context:
      'Read the described property carefully. Distinguish the term from related categories and consider the limits of the source.',
    knowledgeHistory_context_place: '$t(glossary:place_one)',
    knowledgeHistoryDefinition_context_place:
      'The question is: where did the performance take place, for example in a concert hall?',
    knowledgeHistory_context_time: '$t(glossary:time_one)',
    knowledgeHistoryDefinition_context_time:
      'The question is: when did the event take place? Composition and recording dates can differ.',
    knowledgeHistory_context_occasion: '$t(glossary:occasion_one)',
    knowledgeHistoryDefinition_context_occasion:
      'The question is: what event was the music part of, for example a wedding?',
    knowledgeHistory_context_author: '$t(glossary:author)',
    knowledgeHistoryDefinition_context_author:
      'The question is: who wrote the music or the report? This is not automatically the same person as the performer.',
    knowledgeHint_periods:
      'Read the described property carefully. Distinguish the term from related categories and consider the limits of the source.',
    knowledgeHistory_periods_medieval: '$t(glossary:medieval)',
    knowledgeHistoryDefinition_periods_medieval:
      'In this broad overview of European art music, roughly 500–1400; boundaries vary by region and topic.',
    knowledgeHistory_periods_renaissance: '$t(glossary:renaissance)',
    knowledgeHistoryDefinition_periods_renaissance:
      'In this broad overview of European art music, roughly 1400–1600, after the Middle Ages and before the Baroque.',
    knowledgeHistory_periods_baroque: '$t(glossary:baroque)',
    knowledgeHistoryDefinition_periods_baroque:
      'In this broad overview of European art music, roughly 1600–1750, after the Renaissance and before the Classical period.',
    knowledgeHistory_periods_classical: '$t(glossary:classicalPeriod)',
    knowledgeHistoryDefinition_periods_classical:
      'In this broad overview of European art music, roughly 1750–1820; overlap with Romanticism is possible.',
    knowledgeHistory_periods_romantic: '$t(glossary:romanticPeriod)',
    knowledgeHistoryDefinition_periods_romantic:
      'In this broad overview of European art music, mainly the nineteenth century, approximately 1800–1900.',
    knowledgeHistory_periods_since1900: '$t(glossary:musicSince1900)',
    knowledgeHistoryDefinition_periods_since1900:
      'In this overview, the twentieth and twenty-first centuries with many coexisting styles; not a single sound style.',
    knowledgeHint_genreContext:
      'Read the described property carefully. Distinguish the term from related categories and consider the limits of the source.',
    knowledgeHistory_genreContext_genre: '$t(glossary:genre_one)',
    knowledgeHistoryDefinition_genreContext_genre:
      'The question is: what kind of work is it, for example an opera or a symphony?',
    knowledgeHistory_genreContext_forces: '$t(glossary:performingForces_one)',
    knowledgeHistoryDefinition_genreContext_forces:
      'The question is: which voices or instruments take part, for example a choir or a string quartet?',
    knowledgeHistory_genreContext_occasion: '$t(glossary:occasion_one)',
    knowledgeHistoryDefinition_genreContext_occasion:
      'The question is: at which specific event was music performed, for example a wedding ceremony?',
    knowledgeHistory_genreContext_function: '$t(glossary:function_one)',
    knowledgeHistoryDefinition_genreContext_function:
      'The question is: what purpose did the music serve, for example dancing, worship or focused listening?',
    knowledgeHint_evidence:
      'Read the described property carefully. Distinguish the term from related categories and consider the limits of the source.',
    knowledgeHistory_evidence_observation: '$t(glossary:observation_one)',
    knowledgeHistoryDefinition_evidence_observation:
      'A statement describes something directly heard, for example two pitches sounding at the same time.',
    knowledgeHistory_evidence_metadata: '$t(glossary:sourceInformation_one)',
    knowledgeHistoryDefinition_evidence_metadata:
      'A labeled source gives authorship, place or date, for example; its reliability must be checked separately.',
    knowledgeHistory_evidence_inference: '$t(glossary:inference_one)',
    knowledgeHistoryDefinition_evidence_inference:
      'An informed conclusion is drawn from observations and sources; it is not identical to direct perception.',
    knowledgeHistory_evidence_uncertainty: '$t(glossary:uncertainty)',
    knowledgeHistoryDefinition_evidence_uncertainty:
      'Missing or conflicting evidence is explicitly identified; sound alone does not establish a certain place or date of origin.',
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
    type_interval_semitones: 'Count half steps',
    type_interval_quality: 'Identify interval quality',
    type_interval_perfect: 'Check perfect intervals',
    question_interval_semitones:
      'How many half steps separate the two written pitches? Count the moves between adjacent piano keys. The starting key counts as 0.',
    question_interval_quality:
      'What is the full name of the written interval? Check its number and distance in half steps.',
    question_interval_perfect:
      'Is the written interval a perfect fourth, perfect fifth or perfect octave? Check both its number and half-step distance.',
    intervalPerfectYes: 'Yes, a perfect interval',
    intervalPerfectNo: 'No, not a perfect interval here',
    intervalReadingExplanation_semitones:
      '{{from}} → {{to}}: distance {{distance}}. Count moves between immediately adjacent keys, including black keys. The starting key counts as 0; identical pitches have distance 0.',
    intervalReadingExplanation_quality:
      '{{from}} → {{to}}: letter-name sequence {{path}}, interval number {{count}}, sounding distance {{distance}}. Number and distance together give {{answer}}.',
    intervalReadingExplanation_perfect:
      '{{from}} → {{to}}: interval number {{count}}, sounding distance {{distance}}. A perfect fourth has 5 half steps, a perfect fifth 7 and a perfect octave 12. Number and distance must both fit. Answer: {{answer}}.',
    intervalReadingHint_semitones_1:
      'Begin at the first marked key with 0. Each move to the next key counts 1, regardless of key color.',
    intervalReadingHint_semitones_2:
      'E to F and B to C have no intervening black key: one half step. Other adjacent white keys have a black key between them: two half steps.',
    intervalReadingHint_quality_1:
      'Count the letter-name positions first, including the start and destination. Then find the half-step distance between the pitches.',
    intervalReadingHint_quality_2:
      'A minor third has 3 half steps; a major third has 4. Perfect fourth, fifth and octave combine the numbers 4, 5 and 8 with 5, 7 and 12 half steps.',
    intervalReadingHint_perfect_1:
      'A fourth or fifth letter-name position alone is not enough. Also check the number of half steps.',
    intervalReadingHint_perfect_2:
      'Compare number and distance: fourth 4 with 5 half steps, fifth 5 with 7, octave 8 with 12. A distance of 6 half steps meets none of these conditions.',
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
    contextQuestion: 'Source-based question',
    grandStaff: '$t(glossary:grandStaff_one): learning example',
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
