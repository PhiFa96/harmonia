import { contentMessages } from '@harmonia/i18n/content-messages';
// Texte der Oberfläche auf Deutsch. Diese Datei gibt die Schlüssel vor; en-US muss dieselben haben.
// Fachbegriffe kommen aus dem Glossar: $t(glossary:…).

export const de = {
  content: contentMessages.de,
  onboarding: {
    brand: 'Harmonia',
    progress: 'Schritt {{current}} von {{total}}',
    progressLabel: 'Fortschritt der Einrichtung',
    continue: 'Weiter',
    back: 'Zurück',
    finish: 'Mit dem Lernen beginnen',
    finishError:
      'Dein Start konnte nicht abgeschlossen werden. Versuche es erneut oder bestätige deine Anmeldung noch einmal. Deine Angaben bleiben hier erhalten.',
    loading: 'Dein Lernbereich wird vorbereitet …',
    loadError:
      'Deine gespeicherten Angaben konnten nicht geladen werden. Versuche es erneut oder starte nur für diese Sitzung.',
    retry: 'Erneut versuchen',
    temporary: 'Nur für diese Sitzung starten',
    temporaryHint:
      'Deine Angaben bleiben in dieser Sitzung erhalten. Nach dem Schließen sind sie nicht gespeichert.',
    saveError:
      'Deine letzten Angaben sind noch nicht gespeichert. Versuche es erneut; sie bleiben hier sichtbar.',
    saving: 'Deine Angaben werden gespeichert …',
    languageTitle: 'Musik beginnt mit dir.',
    languageBody: 'Wähle deine Sprache. Gleich probierst du deine erste Aufgabe aus.',
    languageDevice: 'Wie das Gerät',
    languageDeviceBody: 'Folgt der Sprache deines Geräts.',
    languageDeBody: 'Deutsche Tonnamen und Begriffe.',
    languageUsBody: 'Englisch mit amerikanischen Fachbegriffen.',
    languageUkBody: 'Englisch mit britischen Fachbegriffen.',
    goalTitle: 'Was möchtest du erreichen?',
    goalBody: 'Wähle, was dir heute am wichtigsten ist. Du kannst deine Angaben später ändern.',
    goal_hobby: 'Musik als Hobby',
    goal_hobbyBody: 'Musik besser verstehen und selbst ausprobieren.',
    goal_school: 'Schule oder Unterricht',
    goal_schoolBody: 'Grundlagen lernen und Aufgaben sicher lösen.',
    goal_exam: 'Aufnahmeprüfung',
    goal_examBody: 'Gezielt Wissen und Gehör vertiefen.',
    goal_ensemble: 'Chor oder Ensemble',
    goal_ensembleBody: 'Noten und musikalische Zusammenhänge besser verstehen.',
    experienceTitle: 'Wo stehst du gerade?',
    experienceBody: 'Es gibt keine falsche Selbsteinschätzung. Sie ersetzt keinen Einstufungstest.',
    experience_new: 'Ich fange gerade an',
    experience_newBody: 'Noch keine Vorkenntnisse nötig.',
    experience_basics: 'Einige Grundlagen kenne ich',
    experience_basicsBody: 'Ich habe schon Noten gelesen oder Musik gemacht.',
    experience_experienced: 'Ich bringe Erfahrung mit',
    experience_experiencedBody: 'Ich möchte Lücken finden und weiterlernen.',
    placementTitle: 'Deinen Startpunkt finden',
    placementBody:
      'Der Einstufungstest folgt noch. Bis dahin kannst du frei üben. Möchtest du ihn für später vormerken?',
    placement_later: 'Erst die Grundlagen ausprobieren',
    placement_requested: 'Einstufungstest vormerken',
    placementHint: 'Dein Wunsch wird gespeichert. Er ändert dein Niveau noch nicht.',
    dailyTitle: 'Eine kleine Gewohnheit',
    dailyBody:
      'Wähle dein Tagesziel. Erfahrungspunkte (XP) werden später für gelöste Aufgaben vergeben.',
    dailyOption: '{{count}} XP am Tag',
    dailyHint: 'Das Ziel kannst du jederzeit an deinen Alltag anpassen.',
    remindersTitle: 'Lernen in deinem Rhythmus',
    remindersBody:
      'Du entscheidest, ob du später Lern-Erinnerungen möchtest. Der Wunsch allein aktiviert keine Benachrichtigungen.',
    reminderConsent: 'Lern-Erinnerungen vormerken',
    reminderHint:
      'Du kannst deine Einwilligung jederzeit im Profil widerrufen. Vor dem Aktivieren fragen wir gesondert nach der Berechtigung.',
    reminderTime: 'Bevorzugte Uhrzeit',
    timeOption: '{{time}} Uhr',
    miniTitle: 'Deine erste kleine Aufgabe',
    miniBody:
      'Lies die zwei $t(glossary:notehead_other) von links nach rechts. Höher im Bild bedeutet höherer Ton, tiefer bedeutet tieferer Ton. Du brauchst noch keine Tonnamen.',
    miniProgress: 'Eine Aufgabe zum Ausprobieren',
    miniProgressLabel: 'Fortschritt der Mini-Aufgabe',
    miniNext: 'Mein Startprofil wählen',
    audioStart: 'Klang starten',
    audioStop: 'Wiedergabe stoppen',
    audioHint: 'Tippe, um die beiden Töne zu hören. Die Aufgabe lässt sich auch ohne Ton lösen.',
    audioError:
      'Der Klang konnte nicht gestartet werden. Versuche es erneut oder löse die Aufgabe am Notenbild.',
    accountTitle: 'Dein Lernen bleibt deins.',
    accountBody:
      'Wähle einen Gaststart oder melde dich per E-Mail an. Deine bisherigen Antworten bleiben auf diesem Gerät erhalten.',
    account_guest: 'Als Gast lernen',
    account_guestBody: 'Ohne E-Mail-Adresse, mit lokal gespeichertem Fortschritt.',
    account_email: 'Mit E-Mail anmelden',
    account_emailBody: 'Ein Code bestätigt deine Adresse; ein neues Konto entsteht automatisch.',
    ageConfirmed: 'Ich bin mindestens 16 Jahre alt',
    localProgress:
      'Dein Lernfortschritt wird derzeit auf diesem Gerät gespeichert. Das Konto synchronisiert ihn noch nicht auf andere Geräte.',
    profileTitle: 'Dein Lernstart',
    profileSummary: '{{goal}} · {{experience}}',
    profileEdit: 'Lernziele anpassen',
    profileRestart: 'Einrichtung erneut ansehen',
    profileDaily: 'Tagesziel',
    profileReminder: 'Erinnerungswunsch',
    reminderOff: 'Aus',
    reminderOn: 'Vorgemerkt: {{time}} Uhr',
    profilePlacement: 'Einstufung',
    placementLater: 'Später entscheiden',
    placementRequested: 'Vorgemerkt',
    profileAccount: 'Konto',
    guestLabel: 'Gast auf diesem Gerät',
    signedIn: 'Angemeldet: {{email}}',
    signedOut: 'Konto derzeit abgemeldet',
    accountOpen: 'Per E-Mail anmelden',
    learnWelcome: 'Dein Einstieg ist eingerichtet.',
    learnPreference: 'Dein Ziel: {{goal}} · {{count}} XP am Tag',
    learnPlacement:
      'Dein Einstufungswunsch ist vorgemerkt. Bis der Test verfügbar ist, kannst du frei üben.',
    editTitle: 'Deine Lernziele',
    editBody: 'Änderungen gelten sofort und werden auf diesem Gerät gespeichert.',
    done: 'Zurück zum Profil',
  },
  auth: {
    title: 'Per E-Mail anmelden',
    email: 'E-Mail-Adresse',
    emailPlaceholder: 'name@beispiel.de',
    send: 'Code senden',
    sending: 'Code wird gesendet …',
    code: 'Sechsstelliger Code',
    verify: 'Adresse bestätigen',
    verifying: 'Code wird geprüft …',
    sent: 'Wenn die Adresse verwendet werden kann, findest du den Code in deinem Postfach. Prüfe auch den Spam-Ordner.',
    resend: 'Neuen Code senden',
    resendWait: 'Neuen Code in {{seconds}} Sekunden senden',
    changeEmail: 'Andere E-Mail-Adresse verwenden',
    invalidEmail: 'Gib eine vollständige E-Mail-Adresse ein.',
    invalidCode: 'Gib den sechsstelligen Code aus der E-Mail ein.',
    sendError:
      'Der Code konnte nicht gesendet werden. Prüfe deine Verbindung und versuche es erneut.',
    verifyError:
      'Der Code ist ungültig, abgelaufen oder konnte nicht geprüft werden. Prüfe ihn oder fordere einen neuen Code an.',
    unavailable:
      'Die E-Mail-Anmeldung ist hier noch nicht verfügbar. Du kannst als Gast lokal weiterlernen.',
    signedIn: 'Du bist mit {{email}} angemeldet.',
    signOut: 'Auf diesem Gerät abmelden',
    signOutError: 'Die Abmeldung konnte nicht abgeschlossen werden. Versuche es erneut.',
    sessionError: 'Deine Anmeldung konnte nicht geladen werden. Versuche es erneut.',
    privacy:
      'Mit „Code senden“ wird deine E-Mail-Adresse für die Anmeldung verwendet. Wir senden keinen Lern-Newsletter.',
    ageHint: 'Bestätige zuerst, dass du mindestens 16 Jahre alt bist.',
    back: 'Zurück zum Profil',
  },
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
    listeningCell: 'Baustein {{count}}',
    'contextQuestion_crossbar-duration':
      'Wie viele Viertelnotenwerte dauert der erste Ton über den Taktstrich hinweg?',
    'contextHint1_crossbar-duration':
      'Folge dem Haltebogen in den nächsten Takt. Die Stille vor dem ersten Ton zählt nicht zur Klangdauer.',
    'contextHint2_crossbar-duration':
      'Addiere den letzten Notenwert des ersten Takts und den gebundenen Anfang des zweiten.',
    'contextExplain_crossbar-duration':
      'Die Taktgrenze unterbricht die Bindung nicht. Es gibt nur einen Einsatz; beide Notenwerte werden zu einer Klangdauer addiert.',
    'contextQuestion_jazz-roots':
      'Welchen sozialen Zusammenhang dokumentiert dieses fiktive Jazz-Lehrdossier?',
    'contextHint1_jazz-roots':
      'Suche, ob die Quelle lokales Musizieren, einen Ortswechsel oder die Herstellung einer Aufnahme beschreibt.',
    'contextHint2_jazz-roots':
      'Gemeinschaft, Migration und Aufnahmegeschäft sind verschiedene Ebenen. Keine dieser Quellen beweist allein einen ersten Ursprung.',
    'contextExplain_jazz-roots':
      'Die Zuordnung bleibt bei der ausdrücklich beschriebenen sozialen Tätigkeit. Afroamerikanische musikalische Praxis, Migration und Medienwirtschaft wirken zusammen, sind aber nicht austauschbar.',
    contextSocial_neighbourhood:
      'Fiktiver Quartiersbericht, {{year}}: Afroamerikanische Musiker organisieren lokale Auftritte und tauschen musikalische Ideen in ihrer Gemeinschaft aus.',
    contextSocial_migration:
      'Fiktiver Reisebericht, {{year}}: Musiker ziehen vom Süden der USA in eine nördliche Stadt und bauen dort neue musikalische Netzwerke auf.',
    'contextSocial_recording-business':
      'Fiktive Studioakte, {{year}}: Eine Firma engagiert Musiker, produziert eine Schallplattenaufnahme und vertreibt sie kommerziell.',
    contextSocialOption_neighbourhood: 'Lokales Gemeinschaftsleben und musikalischer Austausch',
    contextSocialOption_migration: 'Migration und neue musikalische Netzwerke',
    'contextSocialOption_recording-business': 'Kommerzielle Aufnahmeproduktion und Verbreitung',
    listeningSubdivision: 'Je Grundschlag {{count}} gleich lange Unterteilungen',
    listeningPosition: 'Ton {{count}} wurde verändert',
    listeningMajorScale: 'Durtonleiter',
    listeningMinorScale: 'Natürliches Moll',
    question_CHORD_DIATONIC:
      'Baue den leitereigenen Dreiklang auf Stufe {{degree}} in {{key}}. Moll ist natürlich; vorgegebener Grundton: {{bass}}.',
    'question_listening_rhythm-choice-dotted':
      'Welches vollständige Notenbild passt zum gehörten punktierten Rhythmus?',
    'question_listening_pulse-subdivision':
      'Wie viele gleich lange Unterteilungen bilden einen Grundschlag? Zähle den höheren Anfangston als ersten Teil mit.',
    'question_listening_rhythm-completion':
      'Höre den ganzen Takt. Welcher Baustein ergänzt die fehlende vierte Viertel-Zählzeit des Notengerüsts?',
    'question_listening_scale-mode':
      'Höre die aufsteigende Tonfolge vom Grundton bis zur Oktave. Ist sie Dur oder natürliches Moll?',
    'question_listening_melodic-memory':
      'Höre A und B. Welcher der vier Töne hat sich im zweiten Beispiel verändert?',
    'listeningExplanation_rhythm-choice-dotted':
      'Verglichen werden tatsächliche Einsätze, Pausen und Dauern einschließlich der Punktierung. Antwort: {{answer}}.',
    'listeningExplanation_pulse-subdivision':
      'Der höhere Ton markiert jeden Grundschlaganfang. Die gleich langen Unterteilungen bis zum nächsten Anfang bilden die Gruppe. Antwort: {{answer}}. Eine gehörte Gruppe allein bestimmt noch keine Taktart.',
    'listeningExplanation_rhythm-completion':
      'Die ersten drei Viertel stimmen mit dem Gerüst überein. Der letzte Baustein wird mit dem tatsächlichen Klang der vierten Zählzeit verglichen. Antwort: {{answer}}.',
    'listeningExplanation_scale-mode':
      'Die Tonabstände werden vom ersten Ton aus verglichen. Dur und natürliches Moll unterscheiden sich besonders an Stufe 3, 6 und 7. Antwort: {{answer}}.',
    'listeningExplanation_melodic-memory':
      'Beide Quellen enthalten vier gleich lange Töne; genau eine klingende Tonhöhe ist an ihrer Position anders. Antwort: {{answer}}.',
    listeningOutline:
      'Gerüst: Die vierte Zählzeit fehlt. Die Auswahl enthält jeweils einen Viertelnotenwert.',
    contextEvent: 'Takt {{measure}}, Ereignis {{index}}: {{duration}}. {{positions}}',
    contextPosition:
      'Notenkopf {{index}}, {{steps}} Stammtonschritte von der untersten Linie; sichtbares Zeichen: {{sign}}.',
    contextSign_none: 'kein Zeichen',
    contextSign_sharp: 'Kreuz',
    contextSign_flat: 'b',
    contextSign_natural: 'Auflösungszeichen',
    contextSign_doubleSharp: 'Doppelkreuz',
    contextSign_doubleFlat: 'Doppel-b',
    contextResult: ' {{explanation}} Antwort: {{answer}}.',
    contextFraction: '{{fraction}} × Viertelnotenwert',
    contextDegree: 'Stufe {{count}}',
    contextPattern: 'Halbtonschritte: {{pattern}}',
    contextYes: 'Ja',
    contextNo: 'Nein',
    contextRole_root: 'Grundton',
    contextRole_third: 'Terz',
    contextRole_fifth: 'Quinte',
    contextScore: 'Notierte Quelle',
    contextKey: 'Tonart: {{key}}',
    contextDossier:
      'Fiktives europäisches Lehrdossier: Werkjahr {{year}}. Genanntes Merkmal: {{feature}}. Das Klavierbeispiel ist ein eigenes Lehrmodell.',
    contextDocument:
      'Fiktive Quelle im Jahr {{year}}: {{medium}}. Gefragt ist nur, was dieses Medium dokumentiert.',
    'contextComparison_same-event':
      'Zwei Berichte datieren dieselbe Aufführung auf {{year}} beziehungsweise {{secondYear}}. Über ihre Abhängigkeit ist nichts bekannt.',
    'contextComparison_work-recording':
      'Quelle A nennt das Werkjahr {{year}}. Quelle B nennt das Aufnahmedatum {{secondYear}}.',
    'contextComparison_advertised-performed':
      'Ein Programm aus {{year}} kündigt eine Besetzung an. Ein Aufführungsbericht aus {{secondYear}} beschreibt die tatsächlich aufgetretene Besetzung derselben Veranstaltung.',
    contextFeature_monophony: '$t(glossary:monophony) im Gesang',
    contextFeature_imitation: '$t(glossary:imitation) in vokaler $t(glossary:polyphony)',
    contextFeature_continuo: '$t(glossary:continuo)',
    contextFeature_phrases: 'regelmäßige Periodenbildung',
    contextFeature_chromaticism: 'Erweiterte $t(glossary:chromaticism)',
    contextFeature_electronics: 'elektronische Klangerzeugung',
    contextMedium_recording: '$t(glossary:recording_one)',
    contextMedium_programme: '$t(glossary:programmeSource_one)',
    contextMedium_report: '$t(glossary:report_one)',
    contextMedium_broadcast: '$t(glossary:broadcast_one)',
    contextMedium_stream: '$t(glossary:stream_one)',
    'contextOption_recorded-performance': 'Dokumentierter Klang einer aufgenommenen Aufführung',
    'contextOption_advertised-event': 'Angekündigtes Ereignis; tatsächliche Ausführung noch offen',
    'contextOption_reported-view': 'Überlieferte Sicht des Berichtsverfassers',
    'contextOption_mediated-distribution': 'Verbreitung über einen Medienkanal',
    'contextOption_invented-origin': 'Beweis für den allerersten Ursprung des Musikstils',
    'contextOption_universal-style': 'Beweis für alle Musiker und Werke dieser Tradition',
    'contextOption_different-date-roles':
      'Werkentstehung und Aufnahme datieren unterschiedliche Ereignisse',
    'contextOption_intention-performance':
      'Ankündigung und tatsächliche Aufführung sind verschiedene Aussagen',
    'contextOption_unresolved-conflict': 'Ungelöster Widerspruch; weitere Belege nötig',
    'contextOption_agreement-not-proof': 'Übereinstimmung; Unabhängigkeit noch nicht bewiesen',
    type_CONTEXT_CHOICE: 'Musikalische Zusammenhänge',
    question_CONTEXT_CHOICE: 'Prüfe die gezeigte Quelle.',
    'contextQuestion_accidental-scope':
      'Wie heißt Ton {{target}} einschließlich Oktavlage? Beachte Taktgrenze, Auflösungszeichen und Lage.',
    'contextHint1_accidental-scope':
      'Ein Versetzungszeichen gilt im Takt für denselben Stammton in derselben Oktavlage.',
    'contextHint2_accidental-scope':
      'Am Taktstrich gilt wieder die Vorzeichnung. Ein Auflösungszeichen hebt die zuvor geltende Veränderung auf.',
    'contextExplain_accidental-scope':
      'Die tatsächliche Schreibweise des gefragten Tons berücksichtigt den Zustand in seinem Takt und seiner Oktavlage.',
    'contextQuestion_enharmonic-spelling':
      'Welche andere Schreibweise klingt auf dem gleichstufigen Klavier wie der notierte Ton?',
    'contextHint1_enharmonic-spelling': 'Vergleiche klingende Tasten, nicht nur Buchstaben.',
    'contextHint2_enharmonic-spelling':
      'Cis und Des teilen eine Taste. Eis ist die F-Taste; His erreicht die nächste C-Taste.',
    'contextExplain_enharmonic-spelling':
      'Enharmonische Schreibweisen behalten die klingende Taste, ändern aber den geschriebenen Stammton. Die Oktavzahl kann dabei wechseln.',
    'contextQuestion_dotted-duration':
      'Wie viele Viertelnotenwerte dauert die erste punktierte Note?',
    'contextHint1_dotted-duration': 'Ein Punkt ergänzt die Hälfte des ursprünglichen Werts.',
    'contextHint2_dotted-duration':
      'Punktierte Achtel = Achtel + Sechzehntel; punktierte Viertel = Viertel + Achtel.',
    'contextExplain_dotted-duration':
      'Der erste Punkt multipliziert den ursprünglichen Wert mit 3/2. Die angehängten Pausen ändern die Dauer dieser Note nicht.',
    'contextQuestion_tied-duration':
      'Wie viele Viertelnotenwerte dauert der erste Ton einschließlich aller seiner Haltebögen?',
    'contextHint1_tied-duration':
      'Ein Haltebogen verbindet gleiche Tonhöhen zu einem durchgehenden Klang.',
    'contextHint2_tied-duration':
      'Addiere nur die gebundenen Notenwerte. Pausen gehören nicht dazu; am Taktstrich endet die Bindung nicht.',
    'contextExplain_tied-duration':
      'Die geprüfte Bindungskette zählt als ein Einsatz. Ihre ununterbrochene Dauer ist die Summe der gebundenen Werte, auch über einen Taktstrich.',
    contextQuestion_syncopation:
      'Beginnt hier ein Ton zwischen Viertel-Grundschlägen und reicht über den nächsten Grundschlag?',
    contextHint1_syncopation: 'Suche einen Einsatz zwischen zwei Grundschlägen.',
    contextHint2_syncopation:
      'Eine Achtel auf der zweiten Hälfte allein reicht nicht: Ihr Klang muss die nächste Zählzeit überbrücken.',
    contextExplain_syncopation:
      'Diese Einstiegsfrage prüft genau die Überbrückung eines Viertel-Grundschlags durch einen zuvor zwischen den Schlägen begonnenen Ton.',
    'contextQuestion_triplet-duration':
      'Wie viele Viertelnotenwerte dauern die ersten drei Achtel unter der Triolenzahl 3 zusammen?',
    'contextHint1_triplet-duration':
      'Eine Achteltriole enthält drei gleich lange Achtel in der Zeit von zwei gewöhnlichen Achteln.',
    'contextHint2_triplet-duration':
      'Jede Triolenachtel ist 1/3 einer Viertel. Addiere alle drei, nicht die folgende Note.',
    'contextExplain_triplet-duration':
      'Das Verhältnis 3:2 verkürzt jede Achtel auf zwei Drittel ihres gewöhnlichen Werts. Drei davon ergeben genau einen Viertelnotenwert.',
    'contextQuestion_interval-inversion':
      'Welches Intervall entsteht, wenn du das notierte einfache Intervall durch Oktavversetzung umkehrst?',
    'contextHint1_interval-inversion': 'Die beiden Intervallnummern ergänzen sich zu 9.',
    'contextHint2_interval-inversion':
      'Rein bleibt rein; klein wird groß; übermäßig wird vermindert und umgekehrt.',
    'contextExplain_interval-inversion':
      'Die Umkehrung ergänzt die Nummer zu 9 und kehrt die Qualität um. Prime und Oktave sind der Randfall dieses Modells.',
    'contextQuestion_interval-reduction':
      'Welches einfache Intervall entspricht dem notierten Abstand nach Wegnahme ganzer Oktaven?',
    'contextHint1_interval-reduction': 'Eine zusätzliche Oktave erhöht die Intervallnummer um 7.',
    'contextHint2_interval-reduction':
      'Eine None entspricht einer Sekunde, eine Dezime einer Terz. Die Qualität bleibt erhalten.',
    'contextExplain_interval-reduction':
      'Ziehe bei zusammengesetzten Intervallen jeweils 7 von der Nummer ab. Die Qualität bleibt; reduziere nur bis zur einfachen Oktave.',
    'contextQuestion_scale-pattern':
      'Welche Halbtonfolge beschreibt die sieben Schritte der gezeigten aufsteigenden Tonleiter?',
    'contextHint1_scale-pattern': 'Zähle Übergänge auf dem Klavier: Ganzton = 2, Halbton = 1.',
    'contextHint2_scale-pattern':
      'Eine Durtonleiter hat ihre Halbtonschritte zwischen Stufe 3–4 und 7–8.',
    'contextExplain_scale-pattern':
      'Die Folge wird aus allen benachbarten klingenden Tonhöhen berechnet, nicht aus der Anzahl sichtbarer Vorzeichen.',
    'contextQuestion_scale-degree':
      'Auf welcher Stufe der gezeigten Durtonleiter liegt {{focus}}? Zähle den Anfangston als 1.',
    'contextHint1_scale-degree':
      'Die Tonika ist Stufe 1; die nächsten Stammtöne folgen als 2, 3 und so weiter.',
    'contextHint2_scale-degree':
      'Lies vom tatsächlichen Anfangston aus. C ist nicht in jeder Tonart Stufe 1.',
    'contextExplain_scale-degree':
      'Die Stufe ergibt sich aus der Position des gefragten Tons in dieser Tonleiter. Der wiederholte Oktavton entspricht erneut der Tonika.',
    'contextQuestion_fifth-neighbour':
      'Welche Tonart liegt von {{key}} aus eine Quinte {{direction}} auf dem Quintenzirkel? Der Modus bleibt gleich.',
    'contextHint1_fifth-neighbour':
      'Eine Quinte aufwärts verschiebt die Vorzeichnung um ein Kreuz in die Kreuzrichtung.',
    'contextHint2_fifth-neighbour':
      'Abwärts geht es einen Schritt in die b-Richtung. Das kann zuerst ein vorhandenes Kreuz entfernen.',
    'contextExplain_fifth-neighbour':
      'Benachbarte Positionen des Quintenzirkels unterscheiden sich um genau eine Vorzeichnungseinheit. Grundton und Modus werden gemeinsam berücksichtigt.',
    'contextQuestion_relative-key': 'Welche Paralleltonart teilt die Vorzeichnung mit {{key}}?',
    'contextHint1_relative-key':
      'Paralleltonarten haben verschiedene Grundtöne und verschiedene Modi, aber dieselbe Vorzeichnung.',
    'contextHint2_relative-key':
      'Zu Dur liegt die Molltonika eine kleine Terz tiefer. Gleichnamiges Moll wäre eine Varianttonart.',
    'contextExplain_relative-key':
      'Die Vorzeichenzahl bleibt gleich, der Modus wechselt. Deutsches Paralleltonart entspricht englischem relative key, nicht parallel key.',
    'contextQuestion_chord-member':
      'Welcher Ton ist hier {{role}} des Dreiklangs? Die Lage kann wechseln.',
    'contextHint1_chord-member':
      'Sortiere den geschriebenen Dreiklang gedanklich in Grundstellung.',
    'contextHint2_chord-member':
      'Grundton, Terz und Quinte werden vom Akkordgrundton aus benannt. Der tiefste Ton kann eine andere Rolle haben.',
    'contextExplain_chord-member':
      'Die Engine bestimmt den vollständigen geschriebenen Dreiklang und anschließend die gefragte Akkordtonrolle. Eine Umkehrung verändert diese Rollen nicht.',
    'contextQuestion_chord-root': 'Was ist der Grundton dieses geschriebenen Dreiklangs?',
    'contextHint1_chord-root': 'Grundton und tiefster klingender Ton sind verschiedene Begriffe.',
    'contextHint2_chord-root':
      'Suche die Terzschichtung in Grundstellung. Der Bass entscheidet nur über die Umkehrung.',
    'contextExplain_chord-root':
      'Die Akkordidentität ergibt sich aus allen drei geschriebenen Tönen. Ein höher notierter Grundton bleibt der Grundton.',
    'contextQuestion_diatonic-triad':
      'Welche Dreiklangart entsteht auf Stufe {{degree}} in {{key}}, wenn du nur Tonleitertöne in Terzen schichtest? Moll ist hier natürlich.',
    'contextHint1_diatonic-triad':
      'Nimm Stufe n, n+2 und n+4; setze oberhalb der siebten Stufe die Tonleiter in der nächsten Oktave fort.',
    'contextHint2_diatonic-triad':
      'Dur: groß–klein–klein–groß–groß–klein–vermindert. Natürliches Moll hat eine andere Folge.',
    'contextExplain_diatonic-triad':
      'Die drei Töne werden aus der tatsächlichen Dur- oder natürlichen Molltonleiter geschichtet und anschließend als Dreiklang bestimmt.',
    'contextQuestion_period-context':
      'Welche Epoche der groben europäischen Übersicht passt zum ausdrücklich angegebenen Werkjahr und Merkmal dieses Lehrdossiers?',
    'contextHint1_period-context':
      'Nutze das angegebene Werkjahr gemeinsam mit dem Merkmal; ein Klangmerkmal allein datiert kein Werk.',
    'contextHint2_period-context':
      'Die Beispiele liegen weit von den Übergängen. Die Übersicht ist europäisch, mit überlappenden Grenzen.',
    'contextExplain_period-context':
      'Das Lehrdossier nennt ein Werkjahr. Die Zuordnung verwendet die ausdrücklich gelehrte grobe Übersicht und behauptet keine Datierung aus dem Klaviermodell.',
    'contextQuestion_jazz-source':
      'Welche Aussage wird von dieser fiktiven Quelle zum Jazzkontext tatsächlich gestützt?',
    'contextHint1_jazz-source':
      'Unterscheide eine dokumentierte Aufführung von der Entstehung einer ganzen Musiktradition.',
    'contextHint2_jazz-source':
      'Eine Aufnahme belegt ihren aufgenommenen Klang; ein Programm eine Ankündigung; ein Bericht die Sicht seines Verfassers.',
    'contextExplain_jazz-source':
      'Das Medium begrenzt die Aussage. Die früheste erhaltene oder kommerziell veröffentlichte Quelle beweist nicht den ersten musikalischen Ursprung.',
    'contextQuestion_popular-source':
      'Welche Aussage wird von dieser fiktiven Quelle zu populärer Musik tatsächlich gestützt?',
    'contextHint1_popular-source':
      'Frage, ob die Quelle Klang, Ankündigung, Meinung oder Verbreitung dokumentiert.',
    'contextHint2_popular-source':
      'Sendung und Stream belegen Medienverbreitung, nicht automatisch die Entstehung des Werks oder die ursprüngliche Besetzung.',
    'contextExplain_popular-source':
      'Aufnahme, Medienkanal und Werkentstehung sind unterschiedliche Ebenen. Die Antwort bleibt bei der tatsächlich dokumentierten Ebene.',
    'contextQuestion_source-comparison':
      'Wie lässt sich das Verhältnis der beiden fiktiven Quellen begründet beschreiben?',
    'contextHint1_source-comparison':
      'Vergleiche zuerst, welches Ereignis oder welche Aussage jede Datumsangabe betrifft.',
    'contextHint2_source-comparison':
      'Werkdatum und Aufnahmedatum dürfen verschieden sein. Zwei abweichende Angaben zur selben Aufführung brauchen zusätzliche Belege.',
    'contextExplain_source-comparison':
      'Gleiche Angaben sind Übereinstimmung, keine automatische unabhängige Bestätigung. Unterschiedliche Rollen sind von einem ungelösten Widerspruch zu trennen.',
    question_octaveName: 'Welche {{system}} entspricht {{name}}?',
    scientificSystem: '$t(glossary:scientificNotation)',
    helmholtzSystem: '$t(glossary:helmholtzNotation)',
    question_grandStaff:
      'Welche Taste gehört zum einzigen notierten Ton? Gezeigt ist ein $t(glossary:grandStaff_one).',
    octaveNameExplanation:
      '{{source}} und {{answer}} bezeichnen dieselbe Tonhöhe. Die wissenschaftliche Oktavnummer {{octave}} beginnt bei C und gilt bis zum folgenden B (deutsch H). Groß-/Kleinschreibung und Hochzahlen geben bei Helmholtz die Lage an.',
    octaveNameHint1:
      'Lies zuerst die Lage: c = C3, c¹ = C4, c² = C5. Jeder neue Abschnitt beginnt bei C.',
    octaveNameHint2:
      'Die Zahl gilt für alle sieben Stammtöne der Lage: h = B3 und h¹ = B4. Internationales B ist deutsches H.',
    grandStaffHint1:
      'Suche das System mit der Note. Oben gilt der $t(glossary:trebleClef_one), unten der $t(glossary:bassClef_one).',
    grandStaffHint2:
      'c¹/C4 steht oben auf der ersten $t(glossary:ledgerLine_one) unter dem System und unten auf der ersten darüber. Beide Schreibweisen gehören zu derselben Taste.',
    grandStaffDescription:
      'Großes System: oben Violinschlüssel, unten Bassschlüssel. {{description}} Das System im {{silent}} enthält eine ganze Pause.',
    type_LISTENING_CHOICE: 'Hören und vergleichen',
    question_listening_pulse:
      'Höre die zwei gleichmäßigen Pulsgruppen. Wie viele Schläge gehören jeweils zu einer Gruppe? Zähle den höheren Startklang als 1; der nächste Start gehört zur nächsten Gruppe.',
    'question_listening_rhythm-compare':
      'Höre Beispiel A und nach der Pause Beispiel B. Haben beide denselben Rhythmus? Vergleiche Einsätze, Tondauern und Pausen.',
    'question_listening_rhythm-choice':
      'Welches der drei Notenbilder passt zum gehörten Rhythmus? Alle Beispiele verwenden dieselbe Tonhöhe.',
    'question_listening_pitch-direction':
      'Höre die beiden Töne nacheinander. Ist der zweite höher, tiefer oder gleich hoch?',
    'question_listening_melody-compare':
      'Höre Tonfolge A und nach der Pause Tonfolge B. Stimmen alle Tonhöhen in derselben Reihenfolge und alle Dauern überein?',
    question_listening_observation:
      'Welche Aussage beschreibt etwas, das du in diesem Lehrbeispiel direkt hören kannst?',
    listeningOption: 'Notenbild {{count}}',
    listeningClip: 'Hörbeispiel {{count}}',
    listeningPulseCount: 'Pulsgruppe mit {{count}} Schlägen',
    listeningSame: 'Gleich',
    listeningDifferent: 'Verschieden',
    listeningUp: 'Zweiter Ton höher',
    listeningDown: 'Zweiter Ton tiefer',
    listeningRepeat: 'Gleiche Tonhöhe',
    listeningSingle: 'Es erklingt jeweils nur eine Tonhöhe',
    listeningTogether: 'Mindestens zwei Tonhöhen erklingen zugleich',
    listeningDate: 'Das Werk entstand sicher im Jahr 1750',
    listeningPlace: 'Die Musik wurde sicher in einer Kirche aufgeführt',
    listeningHint1:
      'Höre zuerst das ganze Beispiel. Du kannst es stoppen und erneut starten. Achte auf die Eigenschaft, nach der die Frage fragt.',
    listeningHint2:
      'Vergleiche Schläge und Pausen beim Rhythmus, Tonhöhen bei der Melodie. Ein Notenbild beschreibt die Töne; historische Aussagen brauchen zusätzliche Quellen.',
    listeningExplanation_pulse:
      'Der höhere Klang markiert jeweils den Gruppenanfang. Zwischen zwei Anfängen gehören die gleichmäßigen Schläge zu einer Gruppe. Antwort: {{answer}}. Der nächste Start gehört bereits zur nächsten Gruppe.',
    'listeningExplanation_rhythm-compare':
      'Die Bewertung vergleicht die tatsächlichen Einsätze, Tondauern und Pausen beider Klangquellen. Antwort: {{answer}}. Die Tonhöhe bleibt in diesen Aufgaben gleich.',
    'listeningExplanation_rhythm-choice':
      '{{answer}} hat dieselben Einsätze, Tondauern und Pausen wie das gespielte Beispiel. Die drei vollständigen Takte unterscheiden sich hörbar.',
    'listeningExplanation_pitch-direction':
      'Die zweite klingende Tonhöhe wird mit der ersten verglichen. Antwort: {{answer}}. Lautstärke und Dauer entscheiden nicht über höher oder tiefer.',
    'listeningExplanation_melody-compare':
      'Verglichen werden die klingenden Tonhöhen, ihre Reihenfolge, Einsätze und Dauern. Antwort: {{answer}}. Hier meint „gleich“ dieselben Tonhöhen, nicht nur eine ähnliche Richtung.',
    listeningExplanation_observation:
      '{{answer}} ist im Klangbeispiel überprüfbar. Jahr und Aufführungsort lassen sich daraus allein nicht sicher bestimmen. Dies ist ein eigenes Klavier-Lehrmodell und keine historische Aufnahme.',
    orderRule_periods:
      'Ordne nach der üblichen groben europäischen Epochenfolge; die Grenzen können sich überschneiden.',
    order_periods_ascending: 'Ordne die Epochen von früher nach später.',
    order_periods_descending: 'Ordne die Epochen von später nach früher.',
    knowledgeHint_soundSources:
      'Lies die beschriebene Eigenschaft genau. Trenne den Begriff von verwandten Kategorien und beachte die Grenzen der Quelle.',
    knowledgeHistory_soundSources_voice: '$t(glossary:voice_one)',
    knowledgeHistoryDefinition_soundSources_voice:
      'Der Klang entsteht durch die schwingenden Stimmlippen eines singenden Menschen.',
    knowledgeHistory_soundSources_instrument: '$t(glossary:instrument_one)',
    knowledgeHistoryDefinition_soundSources_instrument:
      'Eine spielende Person bringt etwa eine Saite oder Luftsäule zum Schwingen.',
    knowledgeHistory_soundSources_recording: '$t(glossary:recording_one)',
    knowledgeHistoryDefinition_soundSources_recording:
      'Gespeicherter Klang wird wiedergegeben; er kann Stimmen, Instrumente oder elektronische Klänge enthalten.',
    knowledgeHistory_soundSources_electronic: '$t(glossary:electronicSound)',
    knowledgeHistoryDefinition_soundSources_electronic:
      'Ein elektronisches Gerät oder Programm erzeugt das Audiosignal.',
    knowledgeHint_sourceTypes:
      'Lies die beschriebene Eigenschaft genau. Trenne den Begriff von verwandten Kategorien und beachte die Grenzen der Quelle.',
    knowledgeHistory_sourceTypes_score: '$t(glossary:scoreSource_one)',
    knowledgeHistoryDefinition_sourceTypes_score:
      'Eine schriftliche Quelle legt Tonhöhen, Dauern und weitere Spielanweisungen fest; sie ist selbst keine klingende Aufführung.',
    knowledgeHistory_sourceTypes_recording: '$t(glossary:recording_one)',
    knowledgeHistoryDefinition_sourceTypes_recording:
      'Diese Quelle dokumentiert eine bestimmte klingende Darbietung einschließlich ihrer Interpretationsentscheidungen.',
    knowledgeHistory_sourceTypes_report: '$t(glossary:report_one)',
    knowledgeHistoryDefinition_sourceTypes_report:
      'Ein Mensch beschreibt ein musikalisches Ereignis in Worten; seine Perspektive und Erinnerung sind zu prüfen.',
    knowledgeHistory_sourceTypes_programme: '$t(glossary:programmeSource_one)',
    knowledgeHistoryDefinition_sourceTypes_programme:
      'Eine Ankündigung nennt beispielsweise Werke, Mitwirkende, Ort und Termin; sie beweist allein nicht, dass alles wie angekündigt stattfand.',
    knowledgeHint_context:
      'Lies die beschriebene Eigenschaft genau. Trenne den Begriff von verwandten Kategorien und beachte die Grenzen der Quelle.',
    knowledgeHistory_context_place: '$t(glossary:place_one)',
    knowledgeHistoryDefinition_context_place:
      'Die Frage lautet: Wo fand die Aufführung statt, beispielsweise in einem Konzertsaal?',
    knowledgeHistory_context_time: '$t(glossary:time_one)',
    knowledgeHistoryDefinition_context_time:
      'Die Frage lautet: Wann fand das Ereignis statt? Kompositionsdatum und Aufnahmedatum können verschieden sein.',
    knowledgeHistory_context_occasion: '$t(glossary:occasion_one)',
    knowledgeHistoryDefinition_context_occasion:
      'Die Frage lautet: Zu welchem Ereignis gehörte die Musik, beispielsweise zu einer Hochzeit?',
    knowledgeHistory_context_author: '$t(glossary:author)',
    knowledgeHistoryDefinition_context_author:
      'Die Frage lautet: Wer verfasste die Musik oder den Bericht? Das ist nicht automatisch dieselbe Person wie die Ausführenden.',
    knowledgeHint_periods:
      'Lies die beschriebene Eigenschaft genau. Trenne den Begriff von verwandten Kategorien und beachte die Grenzen der Quelle.',
    knowledgeHistory_periods_medieval: '$t(glossary:medieval)',
    knowledgeHistoryDefinition_periods_medieval:
      'In dieser groben europäischen Kunstmusik-Übersicht etwa 500–1400; die Grenzen unterscheiden sich nach Region und Thema.',
    knowledgeHistory_periods_renaissance: '$t(glossary:renaissance)',
    knowledgeHistoryDefinition_periods_renaissance:
      'In dieser groben europäischen Kunstmusik-Übersicht etwa 1400–1600, nach dem Mittelalter und vor dem Barock.',
    knowledgeHistory_periods_baroque: '$t(glossary:baroque)',
    knowledgeHistoryDefinition_periods_baroque:
      'In dieser groben europäischen Kunstmusik-Übersicht etwa 1600–1750, nach der Renaissance und vor der Klassik.',
    knowledgeHistory_periods_classical: '$t(glossary:classicalPeriod)',
    knowledgeHistoryDefinition_periods_classical:
      'In dieser groben europäischen Kunstmusik-Übersicht etwa 1750–1820; Überschneidungen mit der Romantik sind möglich.',
    knowledgeHistory_periods_romantic: '$t(glossary:romanticPeriod)',
    knowledgeHistoryDefinition_periods_romantic:
      'In dieser groben europäischen Kunstmusik-Übersicht vor allem das 19. Jahrhundert, ungefähr 1800–1900.',
    knowledgeHistory_periods_since1900: '$t(glossary:musicSince1900)',
    knowledgeHistoryDefinition_periods_since1900:
      'In dieser Übersicht das 20. und 21. Jahrhundert mit vielen gleichzeitig bestehenden Stilen; kein einzelner Klangstil.',
    knowledgeHint_genreContext:
      'Lies die beschriebene Eigenschaft genau. Trenne den Begriff von verwandten Kategorien und beachte die Grenzen der Quelle.',
    knowledgeHistory_genreContext_genre: '$t(glossary:genre_one)',
    knowledgeHistoryDefinition_genreContext_genre:
      'Die Frage lautet: Welche Art von Werk ist es, beispielsweise eine Oper oder eine Sinfonie?',
    knowledgeHistory_genreContext_forces: '$t(glossary:performingForces_one)',
    knowledgeHistoryDefinition_genreContext_forces:
      'Die Frage lautet: Welche Stimmen oder Instrumente wirken mit, beispielsweise ein Chor oder ein Streichquartett?',
    knowledgeHistory_genreContext_occasion: '$t(glossary:occasion_one)',
    knowledgeHistoryDefinition_genreContext_occasion:
      'Die Frage lautet: Bei welchem konkreten Ereignis wurde Musik aufgeführt, beispielsweise bei einer Trauung?',
    knowledgeHistory_genreContext_function: '$t(glossary:function_one)',
    knowledgeHistoryDefinition_genreContext_function:
      'Die Frage lautet: Wozu diente die Musik, beispielsweise zum Tanzen, zur Andacht oder zum konzentrierten Zuhören?',
    knowledgeHint_evidence:
      'Lies die beschriebene Eigenschaft genau. Trenne den Begriff von verwandten Kategorien und beachte die Grenzen der Quelle.',
    knowledgeHistory_evidence_observation: '$t(glossary:observation_one)',
    knowledgeHistoryDefinition_evidence_observation:
      'Eine Aussage beschreibt direkt Gehörtes, beispielsweise zwei gleichzeitig erklingende Tonhöhen.',
    knowledgeHistory_evidence_metadata: '$t(glossary:sourceInformation_one)',
    knowledgeHistoryDefinition_evidence_metadata:
      'Eine beschriftete Quelle nennt etwa Urheberschaft, Ort oder Datum; ihre Zuverlässigkeit ist gesondert zu prüfen.',
    knowledgeHistory_evidence_inference: '$t(glossary:inference_one)',
    knowledgeHistoryDefinition_evidence_inference:
      'Aus Beobachtungen und Quellen wird eine begründete Vermutung abgeleitet; sie ist nicht identisch mit einer direkten Wahrnehmung.',
    knowledgeHistory_evidence_uncertainty: '$t(glossary:uncertainty)',
    knowledgeHistoryDefinition_evidence_uncertainty:
      'Fehlende oder widersprüchliche Belege werden ausdrücklich benannt; ein Klang allein verrät keinen sicheren Ort oder Entstehungszeitpunkt.',
    question_durationSymbol: 'Welchen Wert hat dieses Zeichen für eine {{kind}}?',
    question_measureGap: 'Welche {{kind}} ergänzt diesen Takt auf genau vier Viertelwerte?',
    measureGapDescription:
      'Vier-Viertel-Takt. Vorhanden, in Reihenfolge: {{events}}. Am Ende fehlt eine {{kind}}.',
    measureGapExplanation:
      'Die vorhandenen Werte ergeben {{used}} Viertelwerte. 4 − {{used}} = {{missing}}. Es fehlt: {{answer}}. Pausen zählen mit; Taktstriche haben keine Dauer.',
    durationSymbolHint1:
      'Betrachte Form, Füllung, Hals und Fähnchen. Bei den rechteckigen Pausen ist die Lage zur Linie entscheidend.',
    durationSymbolHint2:
      'Bei Noten halbiert jeder Schritt von ganz zu halb, Viertel, Achtel und Sechzehntel die Dauer. Pausenzeichen haben dieselben Zeitwerte.',
    measureGapHint1:
      'Rechne Noten und Pausen in Viertelwerte um. Addiere sie und ziehe die Summe von vier ab.',
    measureGapHint2:
      'Eine Halbe zählt zwei Viertel, zwei Achtel zählen ein Viertel, vier Sechzehntel zählen ein Viertel. Der fehlende Wert muss genau passen.',
    knowledgeRestDuration: 'Stille für {{value}} × die Dauer einer ganzen Note.',
    knowledge_barlines_single: '$t(glossary:barline_one)',
    knowledge_barlines_final: '$t(glossary:finalBarline_one)',
    knowledgeDefinition_barlines_single:
      'Eine dünne senkrechte Linie trennt benachbarte Takte; sie hat selbst keine Dauer.',
    knowledgeDefinition_barlines_final:
      'Eine dünne und eine dicke senkrechte Linie kennzeichnen das Ende eines Stücks oder abgeschlossenen Abschnitts.',
    knowledgeHint_rests:
      'Pausen haben feste Zeitwerte. Der gleichmäßige Puls läuft während der Stille weiter.',
    knowledgeHint_barlines:
      'Eine einzelne dünne Linie grenzt Takte ab; dünn plus dick kennzeichnet einen Abschluss.',
    durationShape_note_whole: 'Ungefüllter ovaler Notenkopf ohne Hals.',
    durationShape_note_half: 'Ungefüllter ovaler Notenkopf mit Hals, ohne Fähnchen.',
    durationShape_note_quarter: 'Gefüllter Notenkopf mit Hals, ohne Fähnchen.',
    durationShape_note_eighth: 'Gefüllter Notenkopf mit Hals und einem Fähnchen.',
    durationShape_note_sixteenth: 'Gefüllter Notenkopf mit Hals und zwei Fähnchen.',
    durationShape_rest_whole: 'Gefülltes Rechteck, das unter einer kurzen Bezugslinie hängt.',
    durationShape_rest_half: 'Gefülltes Rechteck, das auf einer kurzen Bezugslinie sitzt.',
    durationShape_rest_quarter:
      'Senkrechtes, gezacktes Pausenzeichen mit einem gebogenen unteren Ende.',
    durationShape_rest_eighth: 'Schräges Pausenzeichen mit einem Haken.',
    durationShape_rest_sixteenth: 'Schräges Pausenzeichen mit zwei Haken.',
    measureGapSlot: 'Fehlender Wert',
    measureGapCapacity: 'Ziel: insgesamt vier Viertelwerte',

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
    knowledge_pulse_pulse: '$t(glossary:pulse)',
    knowledge_pulse_rhythm: '$t(glossary:rhythm_one)',
    knowledge_pulse_metronome: '$t(glossary:metronome_one)',
    knowledge_pulse_countIn: '$t(glossary:countIn)',
    knowledge_tempo_tempo: '$t(glossary:tempo)',
    knowledge_tempo_bpm: '$t(glossary:beatsPerMinute)',
    knowledge_tempo_faster: 'Höheres $t(glossary:tempo)',
    knowledge_tempo_slower: 'Niedrigeres $t(glossary:tempo)',
    knowledge_beatGroup_first: 'Erster $t(glossary:beat_one)',
    knowledge_beatGroup_duple: '$t(glossary:beatGroup_one) aus zwei $t(glossary:beat_other)',
    knowledge_beatGroup_triple: '$t(glossary:beatGroup_one) aus drei $t(glossary:beat_other)',
    knowledge_beatGroup_quadruple: '$t(glossary:beatGroup_one) aus vier $t(glossary:beat_other)',
    knowledgeDefinition_pulse_pulse:
      'Gleichmäßiger Grundschlag, der beim Musizieren als zeitliche Orientierung dient. Seine Abstände bleiben hier gleich.',
    knowledgeDefinition_pulse_rhythm:
      'Die zeitliche Folge von klingenden Ereignissen und Pausen. Sie kann lange und kurze Dauern enthalten, während der Grundschlag gleichmäßig weiterläuft.',
    knowledgeDefinition_pulse_metronome:
      'Gerät oder App, die gleichmäßige Klicks in einer gewählten Geschwindigkeit erzeugt.',
    knowledgeDefinition_pulse_countIn:
      'Gleichmäßiger Vorlauf vor dem eigenen Einsatz. Er macht Geschwindigkeit und Beginn gemeinsam hörbar.',
    knowledgeDefinition_tempo_tempo:
      'Geschwindigkeit des Grundschlags. Sie bestimmt, wie schnell die gleichmäßigen Klicks aufeinanderfolgen.',
    knowledgeDefinition_tempo_bpm:
      'Einheit für die Anzahl der Grundschläge in einer Minute. Bei 60 liegt zwischen zwei Klicks eine Sekunde.',
    knowledgeDefinition_tempo_faster:
      'Mehr Grundschläge pro Minute als zuvor: Die Abstände zwischen den Klicks werden kürzer.',
    knowledgeDefinition_tempo_slower:
      'Weniger Grundschläge pro Minute als zuvor: Die Abstände zwischen den Klicks werden länger.',
    knowledgeDefinition_beatGroup_first:
      'Hier die betonte Zählposition, bei der eine neue Gruppe beginnt. Gezählt wird wieder ab 1; der zeitliche Abstand bleibt gleich.',
    knowledgeDefinition_beatGroup_duple:
      'Wiederkehrendes Zählmuster 1–2, 1–2. Nach der zweiten Position beginnt die nächste Gruppe.',
    knowledgeDefinition_beatGroup_triple:
      'Wiederkehrendes Zählmuster 1–2–3, 1–2–3. Nach der dritten Position beginnt die nächste Gruppe.',
    knowledgeDefinition_beatGroup_quadruple:
      'Wiederkehrendes Zählmuster 1–2–3–4, 1–2–3–4. Nach der vierten Position beginnt die nächste Gruppe.',
    knowledgeHint_pulse:
      'Unterscheide gleichmäßige Orientierung, die Folge von Klängen und Pausen, das Klickgerät und den Vorlauf vor dem Einsatz.',
    knowledgeHint_tempo:
      'Vergleiche Geschwindigkeit, ihre Einheit und die Änderung der Klickabstände: mehr Schläge pro Minute bedeuten kürzere Abstände.',
    knowledgeHint_beatGroup:
      'Zähle jede Position einmal. Nach dem Gruppenende folgt wieder 1; die Betonung verändert nicht den Zeitabstand.',
    type_PULSE_TAP: '$t(glossary:pulse) mittippen',
    question_PULSE_TAP:
      'Tippe nach dem $t(glossary:countIn) auf jeden Klick: {{count}} gleichmäßige Schläge bei {{bpm}} Schlägen pro Minute. Höre zuerst eine ganze Gruppe; bei der nächsten 1 beginnt deine Aufnahme.',
    pulseDescription:
      '{{count}} gleichmäßige Zählpositionen bei {{bpm}} Schlägen pro Minute. Die erste Position ist betont; alle Zeitabstände sind gleich.',
    pulseGroup: '{{count}} Schläge · {{bpm}} BPM · 1 beginnt die Gruppe',
    pulseHint1:
      'Höre zuerst die ganze Einzählgruppe. Tippe ab der nächsten betonten 1 auf jeden Klick, auch auf die unbetonten.',
    pulseHint2:
      'Tippe genau {{count}} Mal in gleichmäßigen Abständen bei {{bpm}} Schlägen pro Minute. Gedrückthalten zählt als ein Anschlag.',
    pulseExplanation:
      '{{matched}} von {{total}} Schlägen innerhalb von ±{{tolerance}} ms; {{missing}} fehlen oder liegen außerhalb, {{extra}} sind zusätzlich. {{pattern}} Tippe jeden Klick einmal. Die betonte 1 ist nicht länger als die anderen Schläge.',
    pulsePattern: 'Schläge nach Aufnahmebeginn: {{times}} ms.',
    pulseTapHint:
      'Tippe auf jeden Klick. Mit der Tastatur: Leertaste oder Enter auf diesem Knopf. Gedrückthalten zählt einmal.',
    pulseWindow:
      'Toleranz: ±{{tolerance}} ms. Bewertet wird der Anschlagbeginn, nicht die Dauer des Gedrückthaltens.',
    pulseTarget: 'Schlag {{index}}: {{time}} ms',
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
      'Unterscheide die Anzahl der Nenner-Einheiten von der Anzahl der Grundschläge. In Taktarten mit dreigeteilter Zählzeit (6/8, 9/8, 12/8) bilden drei Nenner-Einheiten einen Grundschlag.',
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
    type_PICKUP_IDENTIFY: '$t(glossary:pickup_one) erkennen',
    question_RHYTHM_TAP:
      'Tippe jeden Notenanfang dieses Takts. Ein $t(glossary:beat_one) ist eine {{beat}}; das $t(glossary:tempo) beträgt {{bpm}} Schläge pro Minute. Nach einem Einzähltakt beginnt deine Aufnahme.',
    question_METER_IDENTIFY:
      'Wie gliedert sich diese $t(glossary:meter_one)? Wähle die Zahl der Grundschläge und ihren Notenwert.',
    question_PICKUP_IDENTIFY:
      'Ist der erste notierte Takt vor dem ersten Taktstrich ein Auftakt? Vergleiche seine Dauer mit dem folgenden vollständigen Takt.',
    pickupYes: 'Ja, ein Auftakt',
    pickupNo: 'Nein, ein vollständiger Takt',
    pickupExplanation:
      '{{meter}} fasst {{capacity}} × einen Viertelwert. Vor dem ersten Taktstrich: {{first}} × ein Viertelwert. {{answer}}. Der zweite Takt zeigt die volle Taktlänge.',
    pickupDescription:
      'Taktangabe {{meter}}. Erster Takt vor dem Taktstrich: {{events}} Danach folgt ein vollständiger Takt.',
    pickupHint1: 'Addiere nur die Notenwerte vor dem ersten Taktstrich.',
    pickupHint2:
      'Vergleiche diese Summe mit dem Zähler der Taktangabe: 2/4, 3/4 oder 4/4. Zwei Achtel ergeben einen Viertelwert.',
    pickupScroll: 'Verschiebe das Notenbild seitlich, um den ganzen folgenden Takt zu sehen.',
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
    question_KEY_FIND_score:
      'Spiele die notierte Note auf der $t(glossary:keyboard_one). Achte auf $t(glossary:noteName_one) und $t(glossary:octave_one).',
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
    keyScoreHint1:
      'Lies zuerst den $t(glossary:clef_one) und die Position der Note, einschließlich der $t(glossary:ledgerLine_other). Bestimme dann den vollständigen $t(glossary:noteName_one). Suche auf der $t(glossary:keyboard_one) das C in derselben $t(glossary:octave_one) und gehe von dort zur passenden Taste.',
    keyHint2:
      'Suche zuerst {{natural}}. {{alteration}} Jeder Schritt zur unmittelbar benachbarten Taste ist ein Halbtonschritt, auch zwischen E und F sowie H und C.',
    buildHint2:
      'Der Klangabstand ist {{distance}}. Zähle zuerst die Stammtöne in der gefragten Richtung, einschließlich des Anfangstons. Passe dann das Vorzeichen des Zieltons an.',
    inputSolution: 'So sieht die Lösung aus',
    staffInputHint:
      'Tippe in den leeren Takt oder verstelle die Pause mit dem Screenreader. Ziehen verschiebt deine Note. Wähle das Vorzeichen mit der Leiste darunter.',
    back: 'Zurück zu den Übungen',
    question_NOTE_NAME: 'Wie heißt diese Note? Wähle den Namen ohne Oktavlage.',
    question_NOTE_NAME_octave:
      'Wie heißt die notierte Note einschließlich ihrer $t(glossary:octave_one)?',
    question_INTERVAL_IDENTIFY_VISUAL:
      'Welches $t(glossary:interval_one) siehst du zwischen den beiden Tönen?',
    question_INTERVAL_IDENTIFY_AURAL:
      'Welches $t(glossary:interval_one) hörst du zwischen den beiden Tönen?',
    type_NOTE_NAME: 'Notennamen',
    type_INTERVAL_IDENTIFY_VISUAL: 'Intervalle lesen',
    type_interval_number: 'Intervallnummer zählen',
    type_interval_direction: 'Richtung lesen',
    type_interval_motion: 'Wiederholung, Schritt oder Sprung',
    type_interval_semitones: 'Halbtöne zählen',
    type_interval_quality: 'Intervallqualität bestimmen',
    type_interval_perfect: 'Reine Intervalle prüfen',
    question_interval_semitones:
      'Wie viele Halbtöne liegen zwischen den beiden notierten Tonhöhen? Zähle auf der Klaviatur die Übergänge zwischen benachbarten Tasten. Die Starttaste zählt als 0.',
    question_interval_quality:
      'Wie heißt das notierte Intervall vollständig? Prüfe die Intervallnummer und den Abstand in Halbtönen.',
    question_interval_perfect:
      'Ist das notierte Intervall eine reine Quarte, reine Quinte oder reine Oktave? Prüfe Nummer und Halbtonabstand.',
    intervalPerfectYes: 'Ja, ein reines Intervall',
    intervalPerfectNo: 'Nein, hier kein reines Intervall',
    intervalReadingExplanation_semitones:
      '{{from}} → {{to}}: Abstand {{distance}}. Gezählt werden Übergänge zwischen unmittelbar benachbarten Tasten, auch über schwarze Tasten. Die Starttaste zählt als 0; zwei gleiche Tonhöhen haben Abstand 0.',
    intervalReadingExplanation_quality:
      '{{from}} → {{to}}: Stammtonfolge {{path}}, Intervallnummer {{count}}, Klangabstand {{distance}}. Nummer und Abstand zusammen ergeben {{answer}}.',
    intervalReadingExplanation_perfect:
      '{{from}} → {{to}}: Intervallnummer {{count}}, Klangabstand {{distance}}. Eine reine Quarte hat 5, eine reine Quinte 7 und eine reine Oktave 12 Halbtöne. Nummer und Abstand müssen zusammen passen. Antwort: {{answer}}.',
    intervalReadingHint_semitones_1:
      'Beginne bei der ersten markierten Taste mit 0. Jeder Übergang zur nächsten Taste zählt 1, unabhängig von der Tastenfarbe.',
    intervalReadingHint_semitones_2:
      'Zwischen E und F sowie H und C liegt keine schwarze Taste: ein Halbton. Bei den anderen benachbarten weißen Tasten liegt eine schwarze dazwischen: zwei Halbtöne.',
    intervalReadingHint_quality_1:
      'Zähle zuerst die Stammtonpositionen einschließlich Start und Ziel. Ermittle dann den Halbtonabstand beider Tonhöhen.',
    intervalReadingHint_quality_2:
      'Eine kleine Terz hat 3 Halbtöne, eine große Terz 4. Reine Quarte, Quinte und Oktave verbinden die Nummern 4, 5 und 8 mit 5, 7 und 12 Halbtönen.',
    intervalReadingHint_perfect_1:
      'Eine vierte oder fünfte Stammtonposition allein reicht nicht. Prüfe zusätzlich die Anzahl der Halbtöne.',
    intervalReadingHint_perfect_2:
      'Vergleiche Nummer und Abstand: Quarte 4 mit 5 Halbtönen, Quinte 5 mit 7, Oktave 8 mit 12. Ein Abstand von 6 Halbtönen erfüllt keine dieser Bedingungen.',
    question_interval_number:
      'Welche Intervallnummer haben die beiden notierten Töne? Zähle die Stammtöne einschließlich beider Endtöne.',
    question_interval_direction:
      'Wie bewegt sich die Tonhöhe vom ersten zum zweiten notierten Ton?',
    question_interval_motion:
      'Ist die Folge eine Tonwiederholung, ein Tonschritt oder ein Tonsprung?',
    intervalNumberOption: '{{number}} · {{name}}',
    intervalNumber1: '$t(glossary:unison_one)',
    intervalNumber2: '$t(glossary:second_one)',
    intervalNumber3: '$t(glossary:third_one)',
    intervalNumber4: '$t(glossary:fourth_one)',
    intervalNumber5: '$t(glossary:fifth_one)',
    intervalNumber6: '$t(glossary:sixth_one)',
    intervalNumber7: '$t(glossary:seventh_one)',
    intervalNumber8: '$t(glossary:octave_one)',
    intervalDirectionUp: 'Aufwärts',
    intervalDirectionDown: 'Abwärts',
    intervalDirectionSame: 'Gleiche Tonhöhe',
    intervalMotionRepeat: '$t(glossary:noteRepetition_one)',
    intervalMotionStep: '$t(glossary:melodicStep_one)',
    intervalMotionLeap: '$t(glossary:melodicLeap_one)',
    intervalReadingExplanation_number:
      '{{from}} → {{to}}: {{path}}. Beide Endpositionen gehören zur Zählung. Anzahl der Stammtonpositionen: {{count}}. Antwort: {{answer}}.',
    intervalReadingExplanation_direction:
      '{{from}} → {{to}}: Vergleiche die senkrechten Positionen der beiden Notenköpfe von links nach rechts. Antwort: {{answer}}.',
    intervalReadingExplanation_motion:
      '{{from}} → {{to}}: {{path}}. Intervallnummer {{count}}. Eine Prime ist eine Tonwiederholung, eine Sekunde ein Tonschritt; ab der Terz ist es ein Tonsprung. Antwort: {{answer}}.',
    intervalReadingHint_number_1:
      'Beginne beim ersten Ton mit 1. Jede nächste Linie oder jeder nächste Zwischenraum führt zur nächsten Zahl.',
    intervalReadingHint_number_2:
      'Zähle auch den Zielton mit. Zwei gleiche natürliche Tonhöhen bilden eine Prime mit der Nummer 1.',
    intervalReadingHint_direction_1:
      'Lies zuerst den linken, dann den rechten Notenkopf. Vergleiche ihre Höhe im System.',
    intervalReadingHint_direction_2:
      'Ein höherer zweiter Notenkopf bedeutet aufwärts, ein tieferer abwärts. Dieselbe Position bedeutet hier dieselbe Tonhöhe.',
    intervalReadingHint_motion_1:
      'Prüfe zuerst, ob beide Notenköpfe auf derselben Position liegen. Sonst zähle die Stammtonpositionen dazwischen mit.',
    intervalReadingHint_motion_2:
      'Dieselbe Tonhöhe ist eine Wiederholung; die unmittelbar nächste Stammtonposition ist ein Schritt. Werden Positionen übersprungen, ist es ein Sprung.',
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
    pulseExampleTempo: 'Klangbeispiel: {{bpm}} Schläge pro Minute, zwei Zählgruppen.',
    keyboardMarkers: 'Punkte markieren die Tasten des Notenbeispiels.',
    scrollKeyboardExample:
      'Verschiebe die Klaviatur seitlich, um alle beschrifteten Oktavlagen zu sehen.',
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
    contextQuestion: 'Quellenbezogene Aufgabe',
    grandStaff: '$t(glossary:grandStaff_one): Lernbild',
    durationSymbols: 'Notenwerte und Pausen',
    keyboardExample: '$t(glossary:keyboard_one): Lernbeispiel',
    pulseExample: '$t(glossary:pulse): Zählgruppen',
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
