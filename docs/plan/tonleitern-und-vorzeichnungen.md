# Tonleitern und Vorzeichnungen – zweiter Teil von P2.06

Stand: 07.10.2026. `SCALE_BUILD`, `SCALE_IDENTIFY`, `KEYSIG_IDENTIFY` und `KEYSIG_BUILD` sind technisch umgesetzt. Zusammen mit den [Tonhöheneingaben](tonhoeheneingabe.md) sind sieben der 14 zusätzlich geplanten P2.06-Typen vorhanden. P2.06 bleibt offen: Akkorde, Rhythmus/Takt und Wissens-/Zuordnungs-/Reihenfolgeaufgaben sowie Claudes getrennte fachliche Abnahme und echte Gerätetests fehlen.

Fortsetzung am selben Tag: [Akkordübungen](akkorduebungen.md) ergänzen zwei weitere Typen und einen vierten freien Übungssatz. Der nachfolgende Prüfstand dokumentiert weiterhin diesen zweiten Teil; den aktuellen Gesamtstand führt [P2.06](phase-2-mvp.md#p206--übungstypen-für-das-mvp).

## Bedienbarer Stand

Im Tab „Üben“ startet „Tonleitern und Tonarten üben“ zwölf Aufgaben, je drei pro Typ. Die beiden vorhandenen Neun-Aufgaben-Sätze bleiben erreichbar. Neustart behält den gewählten Satz; „Übungssatz auswählen“ führt zurück zur Auswahl.

| Typ | Bedienung | Bewertung |
| --- | --- | --- |
| `SCALE_BUILD` | Grundton ist vorgegeben, sieben weitere Viertelnoten werden in zwei 4/4-Takten gesetzt. Tonknöpfe wählen den Bearbeitungsplatz; Tippen, Ziehen und Vorzeichenleiste bearbeiten ihn. Löschen betrifft nur diesen Ton. | Alle acht vollständigen Tonhöhen müssen in Reihenfolge, Stammton, Alteration und Oktave stimmen. |
| `SCALE_IDENTIFY` | Vollständige Tonfolge mit Grundton und Richtung im Auftrag; Auswahl aus den erlaubten Tonleiterarten. | Die Engine bestimmt die passende Art aus der Tonfolge und den angebotenen Arten. |
| `KEYSIG_IDENTIFY` | Vorzeichnung im Violin- oder Bassschlüssel lesen. Das Tongeschlecht steht im Auftrag. | Vorzeichnung und vorgegebenes Dur/Moll bestimmen die Tonart eindeutig. |
| `KEYSIG_BUILD` | Für eine benannte Tonart Kreuz- oder b-Töne in der üblichen Reihenfolge hinzufügen. Letzten Ton entfernen oder ausdrücklich „Keine Vorzeichen“ wählen. | Die vollständige geordnete Vorzeichenfolge muss stimmen. |

„Prüfen“ ist bei einer unvollständigen Tonleiter gesperrt. Eine noch nicht begonnene Vorzeichnung ist keine Antwort; die leere Folge wird ausdrücklich bestätigt. Vertauschte, doppelte oder gemischte Vorzeichen sind auswertbare Fehler und werden in der tatsächlich eingegebenen Reihenfolge angezeigt. Das System ersetzt sie nicht durch eine korrigierte Vorzeichnung.

Die erste geprüfte Antwort bleibt gewertet und sperrt Eingaben. Tonleitern markieren jeden Antwortton mit Symbol, Text und Farbe; beide Schreibtypen zeigen zusätzlich das richtige Notenbild. Hinweis 1 erklärt das Vorgehen, Hinweis 2 unterstützt mit Abständen beziehungsweise Vorzeichenzahl, Hinweis 3 erklärt und zeigt die vollständige Lösung. Hilfen bleiben in der Statistik getrennt. Die nächste Aufgabe beginnt leer.

## Schnittstelle und Parameter

`@harmonia/exercises` exportiert `scaleBuildExercise`, `scaleIdentifyExercise`, `keySignatureBuildExercise` und `keySignatureIdentifyExercise`, jeweils mit `generate`, `evaluate`, `feedback` und `hints`. `generateScale` und `generateKeySignature` nehmen Parameter, einen RNG und den jeweiligen Typ entgegen. `generateExercise` und das strenge Inhaltsschema unterstützen alle vier Typen.

`ScaleParams` erweitert `NoteParams`:

- `types`: nicht leere Liste aus `major`, `naturalMinor`, `harmonicMinor`, `melodicMinor`.
- `fifths`: Vorzeichnung der zugrunde liegenden Dur- beziehungsweise natürlichen Molltonart, ganze Zahlen von −7 bis +7; Standard −3 bis +3.
- `direction`: `ascending`, `descending`, `both`; Standard aufwärts. Acht Töne einschließlich Oktavton.
- `clefs`, `range`, `maxAccidentals`: wie bei freien Noteneingaben. Standard C4–C6 im Violin- beziehungsweise C2–C4 im Bassschlüssel, bis zu ein Vorzeichen. Mit Vorzeichentiefe 2 sind auch benötigte Doppelvorzeichen möglich.

Jeder erlaubte Typ, jede zugrunde liegende Vorzeichnung und jede Richtung muss wenigstens ein vollständig erreichbares Beispiel haben. Alle acht Töne müssen in den MIDI-Bereich A0–C8, den gewählten Aufgabenbereich und die vier Hilfslinien der Eingabe passen. Unmögliche Parameter scheitern vor der Zufallsauswahl, nicht erst bei einem bestimmten Seed. Die Auswahl gewichtet diese Parametergruppen gleich und wählt danach einen erreichbaren Grundton und Schlüssel.

`KeySignatureParams` erlaubt `clefs`, `modes` (`major`, `minor`, standardmäßig beide) und `fifths` (−7 bis +7, standardmäßig −3 bis +3). Bereich, Intervall- und Wiedergabeparameter werden hier abgewiesen. Erkennungsfragen bieten bis zu vier verschiedene Tonarten desselben vorgegebenen Tongeschlechts aus der erlaubten Vorzeichnungsliste an.

Sprachneutrale Antworten:

| Aufgabe | Antwortbeispiel |
| --- | --- |
| Tonleiter schreiben | `notes:G4,A4,B4,C5,D5,E5,F#5,G5` |
| Tonleiter erkennen | `scale:major` |
| Vorzeichnung erkennen | `tonality:major:D` |
| Vorzeichnung aufbauen | `signature:F#,C#`; ohne Vorzeichen `signature:` |

Tonleiter-Zwischenstände sind ebenfalls serialisierbare `notes:`-Strings mit acht Positionen; leere Positionen bleiben leer. Sie erzeugen keinen Antwortdatensatz, solange ein Ton fehlt. IDs werden streng geprüft: ASCII-Schreibweise, Anzahl, Oktav-/Eingabegrenzen und vollständige Zeichenfolge. Unicode-Vorzeichen, zusätzliche Leerzeichen, Zeilenumbrüche und fremde IDs zählen nicht als Antworten. Cis und Des sind beim Schreiben verschieden; gleiche klingende Höhe genügt nicht.

`scaleSlot`, `scaleAnswerPitches`, `scaleAnswerScore` und `scaleSolutionScore` bilden die schrittweise Noteneingabe ab. `signatureAnswerNotes`, `signatureInputNotes`, `signatureNoteLabel` und `signatureSolutionScore` bilden Vorzeichenfolgen und deren lokalisierten Text ab. Die Fragebilder der Schreibtypen enthalten keine Lösung: bei Tonleitern nur den Grundton, bei Vorzeichnungen keine vorweggenommene Signatur.

## Fachliche Konventionen

Melodisches Moll folgt der klassischen Konvention: aufwärts erhöhte sechste und siebte Stufe, abwärts dieselbe Tonfolge wie natürliches Moll. Absteigende Erkennungsfragen dürfen deshalb natürliches und melodisches Moll nicht gleichzeitig als unterschiedliche Antworten anbieten; dies gilt auch für `direction: both`. Schreibaufgaben können beide Richtungen verlangen. Die absteigende melodische Form bekommt eine eigene Erklärung dieser Konvention.

Eine Vorzeichnung allein unterscheidet Dur und die zugehörige natürliche Molltonart nicht. Daher gibt jede Erkennungsfrage Dur oder Moll ausdrücklich vor. Die Engine liest die Vorzeichenzahl aus dem dargestellten System und kombiniert sie mit diesem Tongeschlecht. Beim Aufbau gehören die kanonischen Reihenfolgen Fis–Cis–Gis–Dis–Ais–Eis–His beziehungsweise B–Es–As–Des–Ges–Ces–Fes zur Antwort. Null Vorzeichen sind eine gültige ausdrückliche Eingabe.

Die festen Beispiele prüfen unter anderem G-/F-Dur, harmonisches und melodisches a-Moll sowie Vorzeichnungen von C-/D-/Cis-/Ces-Dur und a-/c-Moll. Ein zusätzlicher Test vergleicht 200 Tonleitern mit `tonal`, einschließlich Schreibweise, Oktave und klassischer Abwärtsform. `tonal` bleibt ausschließlich ein Test-Orakel.

## Ablauf, Klang, Speicherung und Gestaltung

`ScaleAnswerInput` und `SignatureAnswerInput` verwenden denselben `ExerciseTask` wie freie Übungen und versionierte Lektionen. Fehlerwiederholungen wechseln die musikalische Variante; ein bloßer Wechsel zwischen Violin- und Bassschlüssel genügt nicht. Parameter einer Lektion müssen wie bisher mindestens zwei musikalische Varianten zulassen. Die bestehende erste Lektion behält ihre zehn Aufgaben und Inhaltsversion 1.

Tonleitern lassen sich nach der Auswertung ausdrücklich anhören. Die acht Töne werden auf der Audio-Uhr in ihrer tatsächlichen Reihenfolge geplant. Bewerten, Aufgabenwechsel, Hintergrund und Verlassen stoppen ausschließlich die eigenen Stimmen; bei teilweise fehlgeschlagener Planung werden bereits angelegte Stimmen ebenfalls beendet. Ein verspätetes `resume()` startet nach dem Verlassen nichts. Vorzeichnungsfragen bieten keine Wiedergabe, weil eine Signatur allein keine Tonfolge festlegt.

Die SQLite-Ablage speichert neue Aufgaben, Antwortstrings, Hilfen, Erstwertung und Wiederholung ohne Migration im vorhandenen JSON-Payload. Der Integrationstest prüft die gespeicherten Daten und die Ergebniszeile mit echter SQLite.

Alle sieben freien Tonleiterplätze sind per Tab/Pfeiltasten und Screenreader-Aktionen bedienbar. Die Tonknöpfe und Kreuz/b-Auswahl unterstützen die Radio-Bedienung mit Pfeiltasten, Home/End sowie Leertaste/Enter. Die Auswahl bringt den gewählten Tonleiterplatz in den horizontalen Ausschnitt. Vorzeichen, Löschen und Rückmeldung verwenden die vorhandenen Bausteine und Fokusregeln.

Deutsch, US-Englisch und UK-Englisch sind vollständig vorhanden. Begriffe wie „half steps“ beziehungsweise „semitones“ kommen aus dem Glossar. Farben, Schrift, Abstände, Radien, Haptik und reduzierte Bewegung kommen aus dem vorhandenen Design-System. Neue Abhängigkeiten oder native Projektdateien waren nicht erforderlich.

## Prüfstand und Übergabe

- 50 zusätzliche Tests: 26 im Übungskern, 15 Schemafälle, acht App-Bedienungstests und ein SQLite-Test. Die Generatorprüfungen verwenden je 150 deterministische Seeds in sechs Parametersätzen.
- Gesamtprüfung: **1.472 Tests bestanden**. Lint, Typen, Formatierung, Übersetzungen, Inhaltskatalog, Fähigkeitsplan und Installation mit unverändertem Lockfile bestanden.
- Deno: Typprüfung und **34 Laufzeitprüfungen**, einschließlich der vier neuen Typen.
- Interner und öffentlicher Web-Export bestanden; öffentliche Artefakte enthalten keine unveröffentlichten Katalogdaten oder Inhaltstexte.
- Chromium: je zwölf Aufgaben mit Tastatur, Touch und Maus; Desktop 1280 × 1000 und Telefonformat 390 × 844, Hell/Dunkel und reduzierte Bewegung. Eingaben, gesperrte Erstwertung, Wiedergabe und öffentliche Inhaltsgrenze geprüft; keine Browserfehler.

Claudes separate fachliche Abnahme nach [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md), GitHub-CI vor dem Merge sowie VoiceOver/TalkBack und Bedien-/Hörproben auf echten iOS-/Android-Geräten bleiben offen. Diese technische Erweiterung gibt keine Kursinhalte frei.

Anschließend wurden [Akkordübungen](akkorduebungen.md), [Rhythmus und Takt](rhythmus-und-takt.md) sowie [Wissensfragen, Zuordnen und Ordnen](wissensaufgaben.md) ergänzt. Stand 08.10.2026 sind alle 14 zusätzlichen P2.06-Typen technisch vorhanden; fachliche Abnahme und echte Plattformtests bleiben offen. Der obige Prüfstand dokumentiert die Tonleiter-/Vorzeichnungsumsetzung. Vollständige Stufen-1–2-Lektionen und Bestehens-/Freischaltlogik folgen in den dafür geplanten Schritten.
