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
  practice: {
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
  profile: {
    language: 'Language',
    languageDevice: 'Same as device',
    licenses: 'Licenses',
    audioTest: 'Audio test (measurements)',
    bravuraLicense:
      'Music font Bravura © Steinberg Media Technologies GmbH, SIL Open Font License 1.1',
    pianoLicense:
      'Piano sound: Salamander Grand Piano by Alexander Holm, CC BY 3.0 (creativecommons.org/licenses/by/3.0). Modified: selection, shortened, mono, tuning corrected.',
  },
} as const satisfies Messages;
