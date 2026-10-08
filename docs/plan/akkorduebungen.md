# Akkordübungen – dritter Teil von P2.06

Stand: 07.10.2026. `CHORD_BUILD` und `CHORD_IDENTIFY` sind technisch umgesetzt. Damit sind neun der 14 zusätzlich geplanten P2.06-Typen vorhanden. Die Umsetzung nutzt die bestehende Dreiklang-Engine und die sechs Akkordfähigkeiten des Entwurfs für Stufen 1–2. Septakkorde, erweiterte Akkorde und mehrstimmiger Tonsatz gehören zu späteren Erweiterungen; dieser Schritt setzt sie nicht um. P2.06 bleibt bis zu den fünf weiteren Typen, Claudes fachlicher Abnahme und den Gerätetests offen.

## Bedienbarer Stand

Im Tab „Üben“ startet „Akkorde erkennen und schreiben“ neun Aufgaben: je drei zum Schreiben, visuellen Erkennen und Erkennen nach Gehör. Die bisherigen drei Übungssätze bleiben erreichbar. Neustart beginnt einen neuen Akkordsatz; „Übungssatz auswählen“ führt zur Auswahl zurück.

| Aufgabe | Vorgabe und Eingabe | Bewertung |
| --- | --- | --- |
| `CHORD_BUILD` | Akkordart, Grundton und Umkehrung werden benannt; vollständiger Basston ist vorgegeben. Zwei weitere Töne in enger Lage ergänzen. | Alle drei geschriebenen Tonhöhen mit Stammton, Vorzeichen und Oktave müssen stimmen. Der Basston bleibt an erster Position. |
| `CHORD_IDENTIFY`, visuell | Simultaner Dreiklang im Violin- oder Bassschlüssel; bis zu vier Akkordnamen zur Wahl. | Engine bestimmt Grundton, Art und Umkehrung aus der geschriebenen Tonfolge. |
| `CHORD_IDENTIFY`, auditiv | Grundton wird benannt und vor dem Akkord einzeln gespielt; alle Antwortmöglichkeiten haben diesen Grundton. | Engine bestimmt Art und Umkehrung aus den MIDI-Tönen relativ zum vorgegebenen Grundton. |

Alle vier Arten sind enthalten: Dur, Moll, vermindert und übermäßig, jeweils in Grundstellung, erster und zweiter Umkehrung. Der freie Satz nutzt die Grundtöne C, D, F, G und A, beide Schlüssel sowie einfache Vorzeichen. Parameter können andere Grundtöne und Doppelvorzeichen zulassen.

Beim Schreiben wählen „Ton 2“ und „Ton 3“ den Bearbeitungsplatz. Im linken Takt steht der feste Basston, im rechten die gewählte Note oder eine ganze Pause. Tippen, Ziehen, Pfeiltasten beziehungsweise Screenreader-Aktionen setzen die Note; die Vorzeichenleiste ändert ihre Alteration. Löschen betrifft nur den ausgewählten Platz. Oberhalb zeigt ein gemeinsames Notenbild die tatsächlich eingegebenen Töne als gleichzeitigen Akkord.

Die oberen Töne dürfen in beliebiger Eingabereihenfolge stehen: `chord-notes:C4,G4,E4` ist derselbe richtig geschriebene C-Dur-Dreiklang wie `chord-notes:C4,E4,G4`. Falsche Oktaven, enharmonisch falsche Schreibweisen, doppelte Töne und ein ausgetauschter Basston sind auswertbare Fehler. „Prüfen“ bleibt gesperrt, solange ein Ton fehlt.

Die erste Bewertung bleibt bestehen und sperrt Bearbeitung, Tonwahl und Löschen. Jeder eingegebene obere Ton bekommt Text und Symbol für richtig/falsch; ein weiteres Notenbild zeigt die Lösung. Bei einer Doppeleingabe wird der erste passende Ton als richtig und sein Duplikat als falsch markiert. Identische Notenköpfe werden im gemeinsamen Bild nur einmal gezeichnet, weil das Notationsmodell identische Doppeltöne ausschließt. Beide Eingabewerte bleiben in den Tonknöpfen, der Antwort und ihrer Bewertung erhalten.

Hinweis 1 erläutert Terzschichtung beziehungsweise den klingenden Grundtonbezug. Hinweis 2 nennt Grundton, Terz- und Quintintervall sowie den Basston. Erst Hinweis 3 zeigt und erklärt die vollständige Lösung. Unterstützte Antworten bleiben in der Statistik getrennt. Jede neue Aufgabe beginnt mit leeren Antwortplätzen.

## Schnittstelle und Grenzen

`@harmonia/exercises` exportiert `chordBuildExercise` und `chordIdentifyExercise` mit `generate`, `evaluate`, `feedback` und `hints`. `generateChord(params, rng, type)` ist der gemeinsame Generator. `generateExercise` und das strenge Inhaltsschema unterstützen beide Typen.

`ChordParams` erweitert `NoteParams`:

- `types`: nicht leere Liste aus `major`, `minor`, `diminished`, `augmented`.
- `roots`: optionale nicht leere Liste kanonischer ASCII-Grundtöne ohne Oktave, beispielsweise `C`, `F#`, `Bb`. Ohne Vorgabe werden alle erreichbaren Grundtöne innerhalb der Vorzeichentiefe berücksichtigt.
- `inversions`: optionale nicht leere Liste aus 0, 1, 2; Standard alle drei.
- `clefs`, `range`, `maxAccidentals`: wie bei freien Noteneingaben. Standard C4–C6 im Violin- beziehungsweise C2–C4 im Bassschlüssel, Vorzeichentiefe 1.

`ChordIdentifyParams` ergänzt `presentation: 'visual' | 'aural'`, standardmäßig visuell. Schreibaufgaben erlauben diesen Parameter nicht. Alle vollständigen Dreiklangtöne müssen innerhalb A0–C8, des Aufgabenbereichs, der Vorzeichentiefe und der vier Hilfslinien der Eingabe liegen. Ein ausdrücklich angegebener Grundton muss mit jeder erlaubten Art und Umkehrung erreichbar sein. Unmögliche Gruppen scheitern vor der Zufallsauswahl; die Auswahl gewichtet die erlaubten Gruppen gleich.

Die Engine konstruiert zunächst den Akkord und setzt ihn mit dem Basston als Oktavbezug in enge Lage. Beispielsweise braucht ein übermäßiger Dreiklang auf H/englisch B ein Fisis: Vorzeichentiefe 1 reicht für diese ausdrückliche Gruppe nicht aus. Vorzeichentiefe 2 erlaubt sie. Bestehende Notations- und Theoriegrenzen werden nicht erweitert.

Sprachneutrale Antwort-IDs:

| Aufgabe | Beispiel |
| --- | --- |
| Schreiben | `chord-notes:C4,E4,G4` |
| Zwischenstand | `chord-notes:C4,E4,` |
| Erkennen | `chord:C:major:0` |
| Erste Umkehrung | `chord:Bb:minor:1` |

IDs werden streng geprüft, einschließlich vollständiger Zeichenfolge, Anzahl, ASCII-Schreibweise, Oktave und Eingabegrenzen. Unvollständige beziehungsweise ungültige Strings erzeugen keinen Antwortdatensatz. `chordAnswerPitches`, `chordAnswerId`, `chordEditScore`, `chordAnswerScore`, `chordAnswerStatuses` und `chordSolutionScore` bilden Eingabe und Rückmeldung ab. Das erste Fragebild einer Schreibaufgabe enthält ausschließlich den Basston.

## Hörfragen und Wiederholung

Ein übermäßiger Dreiklang teilt die Oktave in drei große Terzen. Derselbe Klang kann daher mehrere Grundton- und Umkehrungsdeutungen haben. Ein bloß genannter Grundton wäre ohne absolutes Gehör kein ausreichender Bezug. Jede Akkordhörfrage spielt deshalb zuerst den Grundton als einzelnen Bezugston aus dem Register des Beispiels und danach den Dreiklang. Die Hörantworten verwenden ausschließlich diesen Grundton; enharmonische Grundtonnamen werden nicht als getrennte Höroptionen angeboten.

`chordReferencePitch` findet den klingenden Grundton im vollständigen Beispiel. `playChordExercise` plant 0,65 Sekunden Bezugston und, 0,9 Sekunden nach dessen Beginn, 1,2 Sekunden simultanen Akkord auf der Audio-Uhr. Visuelle und Schreibaufgaben spielen nach der Bewertung nur den Akkord. Klang startet stets ausdrücklich. Vor einer Hörwertung muss Wiedergabe gestartet oder Hinweis 3 gewählt werden; das Notenbild bleibt bis Bewertung oder Hinweis 3 verborgen.

Bewerten, Hör-Pause, Aufgabenwechsel, Hintergrund und Tabwechsel stoppen ausschließlich die eigenen Stimmen. Eine verspätete Audio-Freigabe startet nach dem Verlassen oder Überspringen nichts. Scheitert die Akkordplanung nach dem Bezugston, wird auch der bereits geplante Bezugston gestoppt und die Hörwertung bleibt gesperrt. Der bestehende Audiofehler und die Hör-Pause bleiben bedienbar.

`isAuralExercise` umfasst Intervall- und Akkordhörfragen. Hör-Pause überspringt alle noch unbeantworteten Hörfragen des Satzes, zählt sie gesondert und nimmt bereits gewertete Hörfehler aus der Wiederholung. Der Abschlussknopf berücksichtigt auch übersprungene letzte Aufgaben.

Fehlerwiederholungen verändern das Musikbeispiel. Für visuelle Aufgaben und Schreibaufgaben zählt die vollständige geschriebene Tonfolge; ein Schlüsselwechsel reicht nicht. Für Hörfragen zählen die MIDI-Höhe des Bezugstons und die sortierten MIDI-Höhen des Akkords. Enharmonisch umbenannte Beispiele mit gleichem Bezugston und Klang gelten nicht als neue Variante. Ein anderer klingender Bezugston verändert dagegen die Hörfrage, auch wenn der simultane Akkord gleich bleibt.

Die SQLite-Ablage speichert Aufgaben, Antwortstrings, Hilfen, Erstwertung und Wiederholung verlustfrei im vorhandenen JSON-Payload; die Datenbankversion bleibt 1. Die interne erste Lektion behält ihre zehn Aufgaben und Inhaltsversion 1. Dieser Schritt gibt keine neuen Kursinhalte frei.

## Gestaltung und Prüfstand

`ChordAnswerInput` verwendet die bestehenden Notendarstellung, Vorzeichenleiste, Karten, Buttons und Feedbackbausteine. Schrift, Farben, Abstände, Radien, Bewegung und Fokus folgen dem vorhandenen Design-System. Tonwahl unterstützt Radio-Bedienung mit Pfeiltasten, Home/End und Leertaste/Enter. Die aktuelle Note unterstützt Tastatur und Screenreader. Deutsch, US- und UK-Englisch sind vollständig vorhanden, einschließlich „Recognize/Recognise“ und „measure/bar“. Neue Abhängigkeiten oder native Projektdateien sind nicht nötig.

- 59 zusätzliche Tests: 31 im Übungskern, 17 Schemafälle, zehn App-Bedienungstests und ein SQLite-Test. Sechs Parametersätze werden mit je 150 deterministischen Seeds geprüft; 200 weitere Beispiele werden mit `tonal` in vollständiger Schreibweise und Oktavlage verglichen.
- Gesamtprüfung: **1.531 Tests bestanden**; Lint, Typen, Formatierung, Übersetzungen, Inhaltskatalog, Fähigkeitsplan und Installation mit unverändertem Lockfile bestanden.
- Deno: Typprüfung und **37 Laufzeitprüfungen**, einschließlich Schreiben sowie visueller und auditiver Akkorderkennung.
- Interner und öffentlicher Web-Export bestanden; der tatsächliche öffentliche Export enthält keine Entwurfs-Katalogdaten oder Inhaltstexte.
- Chromium: je neun Aufgaben per Desktop-Tastatur, Telefon-Touch und Maus im öffentlichen US-Export; Hell/Dunkel, 390 × 844 und 1280 × 1000, reduzierte Bewegung, Wiedergabe, Hörsperre und gesperrte Erstwertung. Zusätzlich Doppeleingabe und öffentliche UK-Fassung geprüft.

Claudes getrennte fachliche Abnahme nach [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md), GitHub-CI vor dem Merge, VoiceOver/TalkBack und echte iOS-/Android-Geräteproben bleiben offen. Diese technische Prüfung ersetzt keine Hör- oder Bedienprobe durch Testpersonen.

Fortsetzung 08.10.2026: `RHYTHM_TAP` und `METER_IDENTIFY` sind im [vierten Teil von P2.06](rhythmus-und-takt.md), `KNOWLEDGE_MC`, `MATCH` und `ORDER` im [fünften Teil](wissensaufgaben.md) technisch umgesetzt. Alle 14 zusätzlichen Typen sind vorhanden; fachliche Abnahme und echte Plattformtests bleiben offen. Vollständige Stufen-1–2-Lektionen und Bestehens-/Freischaltlogik bleiben die anschließenden geplanten Schritte. Der obige Prüfstand dokumentiert die Akkordumsetzung vom 07.10.2026.
