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
