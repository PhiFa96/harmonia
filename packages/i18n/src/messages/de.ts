// Texte der Oberfläche auf Deutsch. Diese Datei gibt die Schlüssel vor; en-US muss dieselben haben.
// Fachbegriffe kommen aus dem Glossar: $t(glossary:…).

export const de = {
  tabs: {
    learn: 'Lernen',
    practice: 'Üben',
    profile: 'Profil',
  },
  placeholder: 'Hier entsteht gerade etwas.',
  learn: {
    exampleScale: 'Beispiel: C-Dur-Tonleiter in $t(glossary:notes.quarter_other)',
  },
  practice: {
    intervalTitle: 'Intervall eingeben',
    intervalTask: 'Setze eine große Terz über c¹.',
    intervalHint:
      'Tippe ins System, um die Note zu setzen. Ziehen verschiebt sie, die Leiste darunter setzt ein Versetzungszeichen.',
    keyboardHint: 'Mit der Tastatur: Tab bis zur Note, Pfeil hoch und runter verschiebt sie.',
    placed: 'Gesetzt: {{note}}',
    nothingPlaced: 'Noch keine Note gesetzt.',
    accidentals: '$t(glossary:accidental_other)',
    remove: 'Löschen',
    check: 'Prüfen',
    correct: 'Richtig, das ist die große Terz.',
    wrong: 'Noch nicht richtig. Versuch es noch einmal.',
  },
  audioTest: {
    title: 'Audio-Test',
    intro: 'Für Latenzmessungen (P1.16). Der Ton startet beim Berühren, nicht erst beim Loslassen.',
    tone: 'Ton a¹',
    chord: 'C-Dur-Dreiklang',
    sequence: 'Tonleiter mit Metronom',
    metronome: 'Metronom 90 BPM',
    stop: 'Alles stoppen',
    notStarted: 'Der Klang startet beim ersten Tippen.',
    sampleRate: 'Abtastrate: {{rate}} Hz',
    reportedLatency: 'Vom System gemeldete Latenz: {{base}} ms Verarbeitung, {{output}} ms Ausgabe',
    noReportedLatency: 'Das System meldet keine Latenz; bitte messen (siehe Anleitung).',
  },
  highlight: {
    correct: 'richtig',
    wrong: 'falsch',
    active: 'ausgewählt',
  },
  profile: {
    language: 'Sprache',
    languageDevice: 'Wie das Gerät',
    licenses: 'Lizenzen',
    audioTest: 'Audio-Test (Messungen)',
    bravuraLicense:
      'Notenfont Bravura © Steinberg Media Technologies GmbH, SIL Open Font License 1.1',
  },
} as const;
