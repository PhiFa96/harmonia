import { contentMessages } from '@harmonia/i18n/content-messages';
// Texte der Oberfläche auf Deutsch. Diese Datei gibt die Schlüssel vor; en-US muss dieselben haben.
// Fachbegriffe kommen aus dem Glossar: $t(glossary:…).

export const de = {
  content: contentMessages.de,
  tabs: {
    learn: 'Lernen',
    practice: 'Üben',
    profile: 'Profil',
  },
  placeholder: 'Hier entsteht gerade etwas.',
  learn: {
    unavailable: 'Neue Lektionen werden vorbereitet. Du kannst schon frei üben.',
    exampleScale: 'Beispiel: C-Dur-Tonleiter in $t(glossary:notes.quarter_other)',
  },
  practice: {
    input: 'Eingabe',
    input_staff: 'Notenbild',
    input_piano: 'Klaviatur',
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
    correctTitle: 'Richtig!',
    wrongTitle: 'Noch nicht ganz',
  },
  exercise: {
    knowledgeStart: 'Wissen, Zuordnen und Reihenfolgen üben',
    knowledgeIntro:
      'Neun Aufgaben: Begriffe aus den Grundlagen erkennen, Erklärungen zuordnen und Notenwerte oder Tonhöhen ordnen.',
    type_KNOWLEDGE_MC: 'Wissensfrage',
    type_MATCH: 'Begriffe zuordnen',
    type_ORDER: 'Reihenfolge bilden',
    orderMoveUp: 'Nach oben',
    orderMoveDown: 'Nach unten',
    orderRemoveItem: 'Entfernen',
    question_KNOWLEDGE_MC: 'Welcher Begriff passt zu dieser Erklärung? {{definition}}',
    question_MATCH:
      'Ordne jedem Begriff die passende Erklärung zu. Jede Erklärung gehört genau zu einem Begriff.',
    question_ORDER: 'Bringe alle Angaben in die Reihenfolge {{direction}}. {{rule}}',
    knowledgeExplanation: '{{term}}: {{definition}}',
    knowledgeKeyboard_semitone: '$t(glossary:semitone_one)',
    knowledgeKeyboard_wholeTone: '$t(glossary:wholeTone_one)',
    knowledgeKeyboard_twoBlackKeys: '$t(glossary:twoBlackKeys_one)',
    knowledgeKeyboard_threeBlackKeys: '$t(glossary:threeBlackKeys_one)',
    knowledgeKeyboardDefinition_semitone:
      'Abstand zwischen unmittelbar benachbarten $t(glossary:pianoKey_other), einschließlich schwarzer Tasten. Keine Taste liegt dazwischen.',
    knowledgeKeyboardDefinition_wholeTone:
      'Abstand von zwei $t(glossary:semitone_other). Auf der $t(glossary:keyboard_one) liegt genau eine Taste zwischen Start und Ziel.',
    knowledgeKeyboardDefinition_twoBlackKeys:
      'Wiederkehrende Gruppe aus zwei schwarzen Tasten. Die weiße Taste unmittelbar links davon heißt C.',
    knowledgeKeyboardDefinition_threeBlackKeys:
      'Wiederkehrende Gruppe aus drei schwarzen Tasten. Die weiße Taste unmittelbar links davon heißt F.',
    knowledgeHint_keyboard:
      'Nutze die Gruppen schwarzer Tasten als Orientierung und zähle alle Tastenschritte, auch über schwarze Tasten.',
    knowledgeRaises: 'Erhöht einen Stammton um {{distance}}.',
    knowledgeLowers: 'Erniedrigt einen Stammton um {{distance}}.',
    knowledgeNatural:
      'Hebt eine geltende Alteration auf und stellt die natürliche Tonhöhe des Stammtons her.',
    knowledgeDuration: 'Wert: {{value}} × $t(glossary:notes.whole_one).',
    knowledgeInterval: 'Umfasst {{positions}} (Start und Ziel mitgezählt) und {{distance}}.',
    knowledgePositions_one: '{{count}} Stammtonstufe',
    knowledgePositions_other: '{{count}} Stammtonstufen',
    knowledgeTriad:
      '$t(glossary:triad_one) in Terzschichtung: Die Töne liegen {{pattern}} $t(glossary:semitone_other) über dem $t(glossary:root_one).',
    knowledgeTriad_major: '$t(glossary:major)-$t(glossary:triad_one)',
    knowledgeTriad_minor: '$t(glossary:minor)-$t(glossary:triad_one)',
    knowledgeTriad_diminished: 'Verminderter $t(glossary:triad_one)',
    knowledgeTriad_augmented: 'Übermäßiger $t(glossary:triad_one)',
    knowledgeScale:
      '$t(glossary:scale_one) aufwärts: Die aufeinanderfolgenden Schritte über eine Oktave zählen {{pattern}} $t(glossary:semitone_other).',
    knowledgeMeter:
      '{{count}} Grundschläge pro $t(glossary:measure_one), jeweils im Wert {{beat}}. Gruppierung in Nenner-Einheiten: {{groups}}.',
    knowledgeHint_accidentals:
      'Vergleiche Erhöhen, Erniedrigen und Aufheben einer Alteration. $t(glossary:sharp_other) und $t(glossary:flat_other) verändern die natürliche Tonhöhe um einen $t(glossary:semitone_one), doppelte Zeichen um zwei.',
    knowledgeHint_noteValues:
      'Bezug für die Brüche: $t(glossary:notes.whole_one). Eine Punktierung verlängert den unpunktierten Wert um seine Hälfte.',
    knowledgeHint_intervals:
      'Zähle die Stammtöne einschließlich Start und Ziel und zusätzlich die Halbtonabstände. Gleich viele Halbtöne allein bestimmen die Schreibweise nicht.',
    knowledgeHint_triads:
      'Betrachte Grundton, Terz und Quinte in Terzschichtung. Vergleiche die Halbtonabstände vom Grundton aus.',
    knowledgeHint_scales:
      'Vergleiche die Folge der Halbtonschritte aufwärts. Klassisch melodisches Moll wird hier ausdrücklich in seiner Aufwärtsform betrachtet.',
    knowledgeHint_meters:
      'Unterscheide die Anzahl der Nenner-Einheiten von der Anzahl der Grundschläge. In zusammengesetzten Taktarten bilden drei Einheiten einen Grundschlag.',
    knowledgeHint_pitches:
      'Vergleiche zuerst die Oktavlage und danach die Tonhöhe innerhalb der Oktave. Der deutsche Ton H entspricht dem englischen B.',
    knowledgeHint2_KNOWLEDGE_MC:
      'Grenze deine Auswahl auf diese beiden Begriffe ein: {{candidates}}.',
    knowledgeHint2_MATCH: 'Beginne mit diesem Paar: {{term}} – {{definition}}',
    knowledgeHint2_ORDER: 'An erster Stelle steht {{first}}.',
    order_noteValues_ascending: 'von kurzer zu langer Dauer',
    order_noteValues_descending: 'von langer zu kurzer Dauer',
    order_pitches_ascending: 'von tief zu hoch',
    order_pitches_descending: 'von hoch zu tief',
    orderRule_noteValues: 'Verglichen wird der vollständige Notenwert einschließlich Punktierung.',
    orderRule_pitches: 'Die Oktavlage gehört zur Tonhöhe.',
    orderExplanation: 'Die richtige Reihenfolge {{direction}} lautet: {{sequence}}. {{rule}}',
    matchSelectTerm: 'Begriff zur Bearbeitung wählen',
    matchDefinitions: 'Erklärung für {{term}} wählen',
    matchUnset: 'noch nicht zugeordnet',
    matchFilled: '{{count}} von {{total}} Begriffen zugeordnet.',
    matchClear: 'Zuordnung löschen',
    matchInstruction:
      'Wähle einen Begriff und danach eine Erklärung. Wird eine bereits verwendete Erklärung neu zugeordnet, wird ihre bisherige Zuordnung gelöst.',
    orderChoices: 'Verfügbare Angaben',
    orderAnswer: 'Deine Reihenfolge',
    orderEmpty: 'Wähle die erste Angabe aus der Auswahl.',
    orderFilled: '{{count}} von {{total}} Angaben eingeordnet.',
    orderPosition: 'Position {{index}}: {{value}}',
    orderUp: '{{value}} nach oben',
    orderDown: '{{value}} nach unten',
    orderRemove: '{{value}} entfernen',
    orderInputHint:
      'Wähle die Angaben in der gewünschten Reihenfolge. Mit den Knöpfen kannst du sie verschieben oder entfernen.',
    title: 'Musik lesen und hören',
    intro:
      'Übe Notennamen und Intervalle. Wähle eine Antwort und prüfe sie. Hinweise helfen dir Schritt für Schritt.',
    start: 'Übungssatz starten',
    restart: 'Neuen Übungssatz starten',
    noteInput: 'Noten und Klaviatur ausprobieren',
    constructionStart: 'Noten und Intervalle selbst eingeben',
    chooseSet: 'Übungssatz auswählen',
    rhythmStart: 'Rhythmus und Taktgliederung üben',
    rhythmIntro:
      'Sechs Aufgaben: Notenanfänge nach einem Einzähltakt mittippen und die Gliederung von Taktangaben bestimmen. Pausen bleiben still.',
    type_RHYTHM_TAP: '$t(glossary:rhythm_one) mittippen',
    type_METER_IDENTIFY: '$t(glossary:meter_one) gliedern',
    question_RHYTHM_TAP:
      'Tippe jeden Notenanfang dieses Takts. Ein $t(glossary:beat_one) ist eine {{beat}}; das $t(glossary:tempo) beträgt {{bpm}} Schläge pro Minute. Nach einem Einzähltakt beginnt deine Aufnahme.',
    question_METER_IDENTIFY:
      'Wie gliedert sich diese $t(glossary:meter_one)? Wähle die Zahl der Grundschläge und ihren Notenwert.',
    meterOption: '{{count}} Grundschläge mit dem Wert {{beat}}',
    meterExplanation:
      '{{meter}}: {{count}} Grundschläge pro $t(glossary:measure_one), jeweils im Wert {{beat}}. Jeder Grundschlag wird in {{division}} gleiche Teile unterteilt. Die Gruppierung in Einheiten des Nenners ist {{groups}}. Der Zähler zählt Nenner-Einheiten, nicht immer die Grundschläge.',
    rhythmExplanation:
      '{{matched}} von {{total}} Notenanfängen innerhalb von ±{{tolerance}} ms; {{missing}} fehlen oder liegen außerhalb, {{extra}} sind zusätzlich. {{pattern}} Tippe nur die Notenanfänge; während einer Pause bleibt die Hand still. Auch ein fehlender oder zusätzlicher Anschlag zählt als Fehler.',
    rhythmPattern: 'Notenanfänge nach Taktbeginn: {{times}} ms.',
    rhythmDescription: 'Taktangabe {{meter}}. {{events}}',
    rhythmEvent: '{{index}}: {{kind}}, {{duration}}.',
    rhythmNote: 'Note',
    rhythmRest: 'Pause',
    rhythmHint1:
      'Zähle den Grundschlag weiter. Tippe nur beim Beginn einer Note, nicht für ihre gesamte Dauer. Pausen haben eine Dauer, aber keinen Anschlag.',
    rhythmHint2:
      'Dieser Takt enthält {{total}} Notenanfänge. Halte {{count}} gleichmäßige Grundschläge im Wert {{beat}} bei {{bpm}} Schlägen pro Minute.',
    meterHint1:
      'Der Zähler gibt die Zahl der Einheiten an; der Nenner ihren Notenwert. Bei 6/8, 9/8 und 12/8 gehören jeweils drei Achtel zu einem Grundschlag.',
    meterHint2: 'Gruppiere die Einheiten so: {{groups}}. Jede Gruppe bildet einen Grundschlag.',
    rhythmReady: 'Bereit zum Einzählen.',
    rhythmPreparing: 'Klang wird vorbereitet …',
    rhythmCountIn: 'Einzählen: {{current}} von {{count}}',
    rhythmRecording: 'Aufnahme: {{current}} von {{count}} Grundschlägen',
    rhythmFinished: 'Aufnahme vollständig. Du kannst sie prüfen oder neu aufnehmen.',
    rhythmBegin: 'Einzählen und aufnehmen',
    rhythmRetry: 'Neu aufnehmen',
    rhythmCancel: 'Aufnahme abbrechen',
    rhythmTap: 'Jetzt tippen',
    rhythmTapHint:
      'Tippe beim Notenanfang. Mit der Tastatur: Leertaste oder Enter auf diesem Knopf. Gedrückthalten zählt einmal.',
    rhythmTapCount_one: '{{count}} Anschlag aufgenommen.',
    rhythmTapCount_other: '{{count}} Anschläge aufgenommen.',
    rhythmWindow:
      'Toleranz: ±{{tolerance}} ms. Gemessen werden Notenanfänge, nicht die Dauer des Gedrückthaltens.',
    rhythmPreview: 'Rhythmus als Beispiel anhören',
    rhythmTarget: 'Notenanfang {{index}}: {{time}} ms',
    rhythmHit: 'getroffen, Abweichung {{offset}} ms',
    rhythmMiss: 'fehlt oder außerhalb der Toleranz',
    rhythmExtras: 'Zusätzliche Anschläge: {{times}} ms.',
    rhythmLatency:
      'Gemeldete Audio-Verzögerung: {{latency}} ms; beim Messen deiner Anschläge berücksichtigt.',
    chordStart: 'Akkorde erkennen und schreiben',
    chordIntro:
      'Neun Aufgaben: Dur-, Moll-, verminderte und übermäßige Dreiklänge mit Umkehrungen schreiben, im Notenbild erkennen und nach Gehör bestimmen.',
    type_CHORD_BUILD: '$t(glossary:chord_other) schreiben',
    type_CHORD_IDENTIFY: '$t(glossary:chord_other) erkennen',
    question_CHORD_BUILD:
      'Schreibe diesen $t(glossary:chord_one) in enger Lage: {{name}}. Der $t(glossary:bassNote_one) {{bass}} ist vorgegeben; ergänze die zwei weiteren Töne.',
    question_CHORD_IDENTIFY:
      'Welchen $t(glossary:chord_one) siehst du? Bestimme den $t(glossary:root_one), die Art und die $t(glossary:inversion_one).',
    question_CHORD_AURAL:
      'Du hörst zuerst den $t(glossary:root_one) {{root}}, dann den $t(glossary:triad_one). Welche Art und $t(glossary:inversion_one) hörst du?',
    chordExplanation:
      '{{name}}: {{notes}}. Vom $t(glossary:root_one) {{root}} aus liegen {{third}} und {{fifth}}. Der $t(glossary:bassNote_one) ist {{bass}}; daraus folgt {{inversion}}. Beim Schreiben zählen die vollständigen Töne einschließlich Vorzeichen und Oktave. Enge Lage bedeutet: Über dem Basston stehen die übrigen Akkordtöne in ihren nächsthöheren Lagen.',
    chordHint1:
      'Ordne die drei Stammtöne gedanklich in Terzschichtung. Der unterste Ton dieser Schichtung ist der $t(glossary:root_one). Vergleiche ihn mit dem tatsächlich tiefsten Ton: Grundton, Terz oder Quinte im Bass bestimmen die $t(glossary:rootPosition) oder $t(glossary:inversion_one).',
    chordHint2:
      'Der $t(glossary:root_one) ist {{root}}. Von dort brauchst du {{third}} und {{fifth}}. Der vorgegebene oder gehörte $t(glossary:bassNote_one) {{bass}} zeigt dir die Lage; die übrigen Akkordtöne stehen möglichst nah darüber.',
    chordAuralHint1:
      'Merke dir den ersten einzelnen Ton als $t(glossary:root_one). Höre danach auf den tiefsten Ton des $t(glossary:chord_one): Vergleiche ihn mit dem Bezugston, auch über Oktaven hinweg. Grundton, Terz oder Quinte im Bass bestimmen die Lage. Die Abstände zwischen den Tönen bestimmen die Dreiklangart.',
    chordPreview: 'Dein $t(glossary:chord_one)',
    chordSelectTone: 'Akkordton zur Bearbeitung wählen',
    chordTone: 'Ton {{index}}',
    chordToneEmpty: 'noch nicht gesetzt',
    chordFilled: '{{count}} von 2 Antworttönen gesetzt.',
    chordInputHint:
      'Wähle Ton 2 oder 3 und setze ihn im rechten $t(glossary:measure_one). Links bleibt der $t(glossary:bassNote_one) fest. Das gemeinsame Notenbild zeigt deinen $t(glossary:chord_one). Die oberen Töne kannst du in beliebiger Reihenfolge eingeben.',
    tonalityStart: 'Tonleitern und Tonarten üben',
    tonalityIntro:
      'Zwölf Aufgaben: Dur- und Molltonleitern erkennen und schreiben, Tonartvorzeichnungen bestimmen und selbst aufbauen.',
    type_SCALE_BUILD: '$t(glossary:scale_other) schreiben',
    type_SCALE_IDENTIFY: '$t(glossary:scale_other) erkennen',
    type_KEYSIG_BUILD: '$t(glossary:keySignature_other) aufbauen',
    type_KEYSIG_IDENTIFY: '$t(glossary:keySignature_other) erkennen',
    question_SCALE_BUILD:
      'Schreibe {{type}} {{direction}} ab {{tonic}}, über eine Oktave mit acht Tönen. Der erste Ton ist vorgegeben.',
    question_SCALE_IDENTIFY:
      'Welche Tonleiterart siehst du? Die Folge beginnt auf {{tonic}} und geht {{direction}}.',
    question_KEYSIG_BUILD:
      'Baue die $t(glossary:keySignature_one) für {{key}}. Wähle die Vorzeichentöne in der üblichen Notationsreihenfolge.',
    question_KEYSIG_IDENTIFY:
      'Welche Tonart in {{mode}} gehört zu dieser $t(glossary:keySignature_one)? Das Tongeschlecht ist vorgegeben.',
    scaleAscending: 'aufwärts',
    scaleDescending: 'abwärts',
    scaleExplanation:
      '{{type}} {{direction}} ab {{tonic}}: {{notes}}. Die Abstände, gezählt als $t(glossary:semitone_other), sind {{pattern}}. Reihenfolge, Schreibweise und Oktavlage gehören zur Antwort.',
    melodicDescending:
      'In der klassischen Lehre wird melodisches Moll abwärts wie natürliches Moll geschrieben. Die sechste und siebte Stufe sind dabei nicht erhöht.',
    scaleHint1:
      'Gehe die sieben Stammtöne in der gefragten Richtung durch. Ton 8 ist der Anfangston in der nächsten Oktave. Bestimme danach die Vorzeichen.',
    scaleHint2:
      'Vergleiche die Tonabstände: {{pattern}}. Jede Zahl zählt $t(glossary:semitone_other). Achte darauf, jeden Stammton in der passenden Oktave genau einmal zu schreiben, bevor du den Oktavton ergänzt.',
    signatureEmpty: 'keine Vorzeichen',
    signatureCount: '{{count}} {{sign}}',
    signatureExplanation:
      '{{key}} hat {{signature}}. Die Reihenfolge lautet: {{notes}}. Dur und die zugehörige natürliche Molltonart teilen dieselbe Vorzeichnung; das vorgegebene Tongeschlecht bestimmt hier die Antwort.',
    signatureDescription:
      '$t(glossary:keySignature_one): {{signature}}. Vorzeichentöne in Reihenfolge: {{notes}}.',
    signatureHint1:
      'Kreuz-Reihenfolge: {{sharps}}. b-Reihenfolge: {{flats}}. Beginne immer am Anfang der jeweiligen Reihe.',
    signatureHint2:
      'Die gesuchte Vorzeichnung hat {{signature}}. Lies beziehungsweise schreibe diese Töne am Anfang der passenden Vorzeichenreihe.',
    scaleDegree: 'Ton {{index}}',
    scaleSelectDegree: 'Ton zum Bearbeiten auswählen',
    scaleInputHint:
      'Wähle Ton 2 bis 8. Tippen und Ziehen im Notensystem oder die Pfeiltasten setzen die Tonhöhe. Die Vorzeichenleiste ändert den ausgewählten Ton.',
    scaleFilled: '{{count}} von 7 Antworttönen gesetzt.',
    signatureInput: 'Vorzeichen wählen',
    signatureSharp: '$t(glossary:sharp_one)',
    signatureFlat: '$t(glossary:flat_one)',
    signatureAppend: '{{note}} hinzufügen',
    signatureNoAccidentals: 'Keine Vorzeichen',
    signatureRemoveLast: 'Letztes Vorzeichen entfernen',
    signatureEntered: 'Deine Vorzeichenfolge: {{notes}}',
    signatureNothingEntered: 'Noch keine Vorzeichenfolge eingegeben.',
    constructionIntro:
      'Setze Noten, finde Tasten und baue Intervalle. Neun Aufgaben mit Hinweisen und erklärten Lösungen.',
    type_NOTE_PLACE: 'Noten setzen',
    type_KEY_FIND: 'Tasten finden',
    type_INTERVAL_BUILD: 'Intervalle aufbauen',
    question_NOTE_PLACE:
      'Schreibe {{note}} in das leere Notensystem. Achte auf Vorzeichen und Oktavlage.',
    question_KEY_FIND: 'Finde die Taste für {{note}}. Achte auf die Oktavlage.',
    question_KEY_FIND_name: 'Finde die Taste für {{note}}.',
    question_INTERVAL_BUILD:
      'Schreibe den zweiten Ton: {{interval}} von {{from}} aus. Setze ihn in den leeren zweiten Takt.',
    writtenPitch:
      'Die vollständige Antwort ist {{note}}. Stammton, Vorzeichen und Oktavlage müssen stimmen; ein gleich klingender Ton mit anderer Schreibweise zählt hier nicht.',
    keyExplanation:
      'Die gesuchte Taste klingt als {{note}}. Gehe vom Stammton {{natural}} in derselben Oktave aus. {{alteration}} Gleich klingende Schreibweisen gehören zur selben Taste; eine andere Oktave zählt nicht.',
    keyNameExplanation:
      'Die gesuchte Taste klingt als {{note}}. Im gezeigten Ausschnitt gibt es den $t(glossary:naturalNote_one) {{natural}} nur einmal. Gehe von dort aus. {{alteration}} Gleich klingende Schreibweisen gehören zur selben Taste.',
    keyHint1:
      'Suche die Zweiergruppen der schwarzen Tasten: C liegt direkt links davon, D zwischen den beiden schwarzen Tasten. Zähle von dort bis zum gesuchten Stammton in der angegebenen Oktave.',
    keyNameHint1:
      'Suche die $t(glossary:twoBlackKeys_other): C liegt direkt links davon, D zwischen den beiden schwarzen Tasten. Zähle von dort bis zum gesuchten $t(glossary:naturalNote_one) im gezeigten Ausschnitt.',
    keyHint2:
      'Suche zuerst {{natural}}. {{alteration}} Jeder Schritt zur unmittelbar benachbarten Taste ist ein Halbtonschritt, auch zwischen E und F sowie H und C.',
    buildHint2:
      'Der Klangabstand ist {{distance}}. Zähle zuerst die Stammtöne in der gefragten Richtung, einschließlich des Anfangstons. Passe dann das Vorzeichen des Zieltons an.',
    inputSolution: 'So sieht die Lösung aus',
    staffInputHint:
      'Tippe in den leeren Takt oder verstelle die Pause mit dem Screenreader. Ziehen verschiebt deine Note. Wähle das Vorzeichen mit der Leiste darunter.',
    back: 'Zurück zu den Übungen',
    question_NOTE_NAME: 'Wie heißt diese Note? Wähle den Namen ohne Oktavlage.',
    question_INTERVAL_IDENTIFY_VISUAL:
      'Welches $t(glossary:interval_one) siehst du zwischen den beiden Tönen?',
    question_INTERVAL_IDENTIFY_AURAL:
      'Welches $t(glossary:interval_one) hörst du zwischen den beiden Tönen?',
    type_NOTE_NAME: 'Notennamen',
    type_INTERVAL_IDENTIFY_VISUAL: 'Intervalle lesen',
    type_INTERVAL_IDENTIFY_AURAL: 'Intervalle hören',
    progress: 'Aufgabe {{current}} von {{total}}',
    progressLabel: 'Fortschritt des Übungssatzes',
    answers: 'Antwort auswählen',
    next: 'Weiter',
    finish: 'Ergebnis ansehen',
    play: 'Töne anhören',
    replay: 'Noch einmal hören',
    stop: 'Wiedergabe stoppen',
    audioError:
      'Der Klang konnte nicht gestartet werden. Versuche es noch einmal oder überspringe die Hörfragen.',
    noHearing: 'Gerade nicht hören',
    hearingPaused:
      'Hörfragen werden in diesem Übungssatz übersprungen. Mit Kopfhörern kannst du sie beim nächsten Übungssatz wieder üben.',
    headphones: 'Höre die Töne vor deiner Antwort an. Kopfhörer helfen in einer lauten Umgebung.',
    hint: 'Hinweis {{level}}',
    solution: 'Lösung erklären',
    assisted: 'Mit Hinweis beantwortet',
    hintHeading: 'Dein Hinweis',
    complete: 'Übungssatz beendet',
    summary: '{{correct}} von {{answered}} Antworten richtig.',
    independent_one: '{{count}} Antwort ohne Hinweis richtig.',
    independent_other: '{{count}} Antworten ohne Hinweis richtig.',
    assistedSummary_one: '{{count}} Aufgabe mit Hinweis beantwortet.',
    assistedSummary_other: '{{count}} Aufgaben mit Hinweis beantwortet.',
    skippedSummary_one: '{{count}} Hörfrage übersprungen; sie zählt nicht als Fehler.',
    skippedSummary_other: '{{count}} Hörfragen übersprungen; sie zählen nicht als Fehler.',
    noAnswers:
      'Du hast die Hörfragen übersprungen. Starte einen neuen Übungssatz, wenn du wieder hören kannst.',
    unknownAnswer: 'Unbekannte Antwort',
    up: 'nach oben',
    down: 'nach unten',
    atReference: 'Die Note liegt genau auf dieser Linie.',
    noteSteps_one: 'Von dort gehst du {{count}} Stammtonschritt {{direction}}.',
    noteSteps_other: 'Von dort gehst du {{count}} Stammtonschritte {{direction}}.',
    noteExplanation:
      'Im {{clef}} liegt {{reference}} auf Linie {{line}} von unten. {{steps}} {{alteration}} Die Note heißt {{answer}}.',
    alter_0: 'Ohne $t(glossary:accidental_one) bleibt der Stammton unverändert.',
    alter_1: 'Das $t(glossary:sharp_one) erhöht den Stammton um einen $t(glossary:semitone_one).',
    alter_2:
      'Das $t(glossary:doubleSharp_one) erhöht den Stammton um zwei $t(glossary:semitone_other).',
    'alter_-1':
      'Das $t(glossary:flat_one) erniedrigt den Stammton um einen $t(glossary:semitone_one).',
    'alter_-2':
      'Das $t(glossary:doubleFlat_one) erniedrigt den Stammton um zwei $t(glossary:semitone_other).',
    diatonicCount_one: '{{count}} Stammton',
    diatonicCount_other: '{{count}} Stammtöne',
    halfSteps_one: '{{count}} $t(glossary:semitone_one)',
    halfSteps_other: '{{count}} $t(glossary:semitone_other)',
    intervalExplanation:
      '{{from}} → {{to}}: {{diatonic}} einschließlich beider Töne gezählt, mit einem Klangabstand von {{distance}}. Das Intervall heißt {{answer}}.',
    noteHint1:
      'Beginne beim $t(glossary:clef_one). Zähle Linien und Zwischenräume, bevor du das $t(glossary:accidental_one) liest.',
    noteHint2:
      '{{reference}} liegt auf Linie {{line}} von unten. Jede nächste Linie oder jeder nächste Zwischenraum führt zum nächsten Stammton.',
    visualHint1:
      'Zähle zuerst die Stammtöne einschließlich beider Endtöne. Bestimme danach den Klangabstand; die Schreibweise gehört zur Lösung.',
    auralHint1:
      'Höre die beiden Töne noch einmal. Vergleiche den Klangabstand mit den Intervallen, die du schon kennst.',
    intervalHint2:
      'Der Klangabstand beträgt {{distance}}. Vergleiche ihn mit den angebotenen Antworten.',
    notationDescription: '{{clef}}. {{notes}}',
    positionBottom: 'Ton {{index}} liegt auf der untersten Linie. {{alteration}}',
    positionSteps: 'Ton {{index}}: Beginne auf der untersten Linie. {{steps}} {{alteration}}',
  },
  lesson: {
    overview:
      'Deine erste Lektion: zehn Aufgaben zum Lesen und Hören. Lerne die Grundlagen, übe mit Hinweisen und wiederhole deine Fehler mit neuen Notenbeispielen.',
    open: 'Lektion ansehen',
    openNamed: '{{title}} öffnen',
    openAnother: 'Lektion öffnen',
    taskCount_one: '{{count}} Aufgabe',
    taskCount_other: '{{count}} Aufgaben',
    exampleTempo: 'Klangbeispiel: {{bpm}} $t(glossary:notes.quarter_other) pro Minute.',
    scrollExample: 'Verschiebe das Notenbild seitlich, um alle Töne zu sehen.',
    keyboardExample: 'Klaviaturbeispiel; markierte Tasten: {{notes}}.',
    keyboardMarkers: 'Punkte markieren die Tasten des Notenbeispiels.',
    start_one: 'Mit {{count}} Aufgabe starten',
    start_other: 'Mit {{count}} Aufgaben starten',
    restart: 'Lektion erneut üben',
    home: 'Zurück zum Lernen',
    introProgress: 'Einführung {{current}} von {{total}}',
    introNext: 'Nächste Einführungskarte',
    example: 'Klangbeispiel',
    chooseExample: 'Beispiel auswählen',
    progressLabel: 'Fortschritt der Lektion',
    hearingPaused:
      'Hörfragen werden in dieser Lektion einschließlich der Wiederholung übersprungen. Beim nächsten Durchgang kannst du mit Kopfhörern wieder hören.',
    reviewTitle: 'Übe deine Fehler noch einmal',
    reviewIntro_one:
      'Eine Aufgabe war noch nicht richtig. Du bekommst ein neues Notenbeispiel zum selben Thema. Dein Erstversuch bleibt getrennt gezählt.',
    reviewIntro_other:
      '{{count}} Aufgaben waren noch nicht richtig. Du bekommst neue Notenbeispiele zu denselben Themen. Dein Erstversuch bleibt getrennt gezählt.',
    reviewStart: 'Wiederholung starten',
    reviewProgress: 'Wiederholung {{current}} von {{total}}',
    reviewProgressLabel: 'Fortschritt der Wiederholung',
    roundEnd: 'Runde abschließen',
    complete: 'Lektion beendet',
    initialResult: 'Im Erstversuch: {{correct}} von {{answered}} richtig.',
    accuracy: 'Genauigkeit im Erstversuch: {{value}} %.',
    reviewResult_one: 'In der Wiederholung: {{correct}} von {{count}} Aufgabe richtig.',
    reviewResult_other: 'In der Wiederholung: {{correct}} von {{count}} Aufgaben richtig.',
    reviewAssisted_one: 'Eine Wiederholung mit Hinweis beantwortet.',
    reviewAssisted_other: '{{count}} Wiederholungen mit Hinweis beantwortet.',
    reviewSkipped_one: 'Eine Hörfrage in der Wiederholung ausgelassen.',
    reviewSkipped_other: '{{count}} Hörfragen in der Wiederholung ausgelassen.',
    unresolved_one:
      'Eine Aufgabe braucht noch Übung. Starte einen neuen Durchgang, wenn du bereit bist.',
    unresolved_other:
      '{{count}} Aufgaben brauchen noch Übung. Starte einen neuen Durchgang, wenn du bereit bist.',
    allResolved: 'Alle beantworteten Themen wurden richtig gelöst, teilweise in der Wiederholung.',
    duration: 'Übungszeit: {{minutes}} Min. {{seconds}} Sek.',
    saving: 'Ergebnis wird auf diesem Gerät gespeichert …',
    saved: 'Ergebnis auf diesem Gerät gespeichert.',
    saveError:
      'Dein Ergebnis wurde noch nicht gespeichert. Lass diese Seite geöffnet und versuche es erneut. Dein Erstversuch und deine Wiederholung bleiben hier sichtbar.',
    retrySave: 'Speichern erneut versuchen',
    latestTitle: 'Dein letzter Durchgang',
    latestSummary: '{{correct}} von {{answered}} im Erstversuch richtig.',
    latestReview: '{{correct}} von {{total}} Wiederholungen richtig.',
    latestDate: 'Geübt am {{date}}',
    olderVersion: 'Dieser Durchgang gehört zu einer früheren Version der Lektion.',
    loadError: 'Gespeicherte Ergebnisse konnten nicht geladen werden. Du kannst trotzdem üben.',
    retryLoad: 'Ergebnisse erneut laden',
  },
  piano: {
    settings: 'Anpassen',
    title: 'Klaviatur',
    labels: 'Tonnamen',
    labels_none: 'Keine Beschriftung',
    labels_de: 'Deutsch (H/B)',
    labels_intl: 'International (B/B♭)',
    range: 'Tonumfang',
    range_practice: 'c¹–e²',
    range_middle: 'c–c³',
    range_full: 'Ganzes Klavier (A₂–c⁵)',
    range_fixed: 'Ausschnitt: {{from}}–{{to}}',
    eitherName: '{{sharp}} oder {{flat}}',
    smaller: '−',
    larger: '+',
    smallerHint: 'Tasten verkleinern',
    largerHint: 'Tasten vergrößern',
    lower: 'Tiefer',
    higher: 'Höher',
    moveMode: 'Verschieben',
    playMode: 'Spielen',
    playHint:
      'Berühre eine oder mehrere Tasten. Verschieben bewegt den Ausschnitt, ohne zu spielen.',
    moveHint: 'Wische nach links oder rechts. Mit Spielen schaltest du den Klang wieder ein.',
    shortcutHint:
      'Bei Fokus auf der Klaviatur: Die physischen Tasten ab A spielen c¹–e² (QWERTZ: A W S E D F T G Z H U J K O L P Ö). Tab und Leertaste oder Enter spielen einzelne Tasten.',
    shortcutFixedHint:
      'Mit fokussierter Klaviatur spielen die Buchstabentasten nur Töne im gezeigten Ausschnitt. Tab und Leertaste oder Enter spielen einzelne Tasten.',
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
    piano_idle: 'Klavier: lädt beim ersten Ton.',
    piano_loading: 'Klavier wird geladen … bis dahin einfacher Klang.',
    piano_ready: 'Klavier bereit.',
    piano_error: 'Klavier konnte nicht geladen werden; einfacher Klang.',
  },
  highlight: {
    correct: 'richtig',
    wrong: 'falsch',
    active: 'ausgewählt',
  },
  common: {
    close: 'Schließen',
  },
  profile: {
    settings: 'Einstellungen',
    language: 'Sprache',
    languageDevice: 'Wie das Gerät',
    appearance: 'Erscheinungsbild',
    appearanceSystem: 'Wie das Gerät',
    appearanceLight: 'Hell',
    appearanceDark: 'Dunkel',
    haptics: 'Vibration',
    reduceMotion: 'Bewegung reduzieren',
    reduceMotionHint: 'Gilt zusätzlich zur Einstellung des Geräts.',
    more: 'Mehr',
    gallery: 'Bausteine (nur Entwicklung)',
    licenses: 'Lizenzen',
    audioTest: 'Audio-Test (Messungen)',
    bravuraLicense:
      'Notenfont Bravura © Steinberg Media Technologies GmbH, SIL Open Font License 1.1',
    figtreeLicense: 'Schrift Figtree © 2022 The Figtree Project Authors, SIL Open Font License 1.1',
    accidentalsLicense:
      'Vorzeichen im Text: Teilmenge von Bravura Text © Steinberg Media Technologies GmbH, SIL Open Font License 1.1, umbenannt in Harmonia Accidentals',
    pianoLicense:
      'Klavierklang: Salamander Grand Piano von Alexander Holm, CC BY 3.0 (creativecommons.org/licenses/by/3.0). Bearbeitet: Auswahl, gekürzt, Mono, Stimmung ausgeglichen.',
  },
  gallery: {
    keyboardExample: '$t(glossary:keyboard_one): Lernbeispiel',
    title: 'Bausteine',
    intro: 'Alle Grundbausteine des Design-Systems. Nur in Entwicklungsbuilds.',
    preview: 'Vorschau',
    text: 'Schrift',
    sampleDisplay: 'Lektion geschafft!',
    sampleTitle: 'Welches Intervall hörst du?',
    sampleBody: 'Setze eine Note eine große Terz über c¹.',
    sampleMuted: 'Runde 3 von 4 · etwa 4 Minuten',
    sampleAccidentals: 'Fis und Ges klingen gleich, werden aber verschieden notiert: F♯ und G♭.',
    buttons: 'Knöpfe',
    primary: 'Prüfen',
    secondary: 'Noch mal hören',
    ghost: 'Überspringen',
    success: 'Weiter',
    danger: 'Verstanden',
    disabled: 'Gesperrt',
    progress: 'Fortschritt',
    progressValue: '{{done}} von {{total}}',
    more: 'Eine Runde weiter',
    feedback: 'Rückmeldung',
    correctMessage: 'c¹–e¹ ist eine große Terz: drei Stammtöne, vier $t(glossary:semitone_other).',
    wrongMessage:
      'c¹–es¹ ist eine kleine Terz. Für die große Terz fehlt ein $t(glossary:semitone_one).',
    replay: 'Noch mal anhören',
    card: 'Karte',
    cardText: 'Karten tragen Inhalte wie Notenbilder oder Statistiken.',
    list: 'Listen und Schalter',
    sheet: 'Blatt von unten',
    openSheet: 'Blatt öffnen',
    sheetTitle: 'Erscheinungsbild',
    sheetText: 'Hier stehen Auswahl oder Details. Schließen per Knopf, Tippen daneben oder Zurück.',
  },
} as const;
