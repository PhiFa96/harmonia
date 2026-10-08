# Wissensfragen, Zuordnen und Ordnen – fünfter Teil von P2.06

Stand: 08.10.2026. `KNOWLEDGE_MC`, `MATCH` und `ORDER` sind technisch umgesetzt. Damit sind alle 14 zusätzlich geplanten MVP-Typen vorhanden; zusammen mit den drei Typen aus P1.19 gibt es 17 Aufgabentypen. P2.06 bleibt bis zu Claudes getrennter fachlicher Abnahme und echten iOS-/Android- und Screenreader-Prüfungen offen.

## Bedienbarer Stand

Im Tab „Üben“ startet „Wissen, Zuordnen und Reihenfolgen üben“ neun Aufgaben: dreimal je eine Wissensfrage, eine Zuordnung und eine Reihenfolge. Dieser sechste freie Satz ergänzt Lesen/Hören, Tonhöheneingaben, Tonleitern/Vorzeichnungen, Akkorde und Rhythmus/Takt. Neustart erzeugt einen neuen Satz.

| Typ | Vorgabe und Eingabe | Bewertung |
| --- | --- | --- |
| `KNOWLEDGE_MC` | Eine Erklärung, vier Begriffe zur Auswahl. | Der gewählte Begriff entspricht den strukturierten Fachdaten der Frage. |
| `MATCH` | Zwei bis vier Begriffe und unabhängig gemischte Erklärungen desselben Themengebiets. | Jeder Begriff erhält genau die zugehörige Erklärung; jede Erklärung ist einmal verwendbar. |
| `ORDER` | Drei bis sechs Notenwerte oder natürliche Tonhöhen, gewünschte Richtung. | Alle Werte müssen vollständig in der richtigen Folge stehen. Dauern werden als exakte Brüche, Tonhöhen als MIDI-Höhen verglichen. |

Diese Aufgaben besitzen kein künstliches Notenbild und keinen Klang. Frage, Antwort, Erklärung und Hinweise verwenden denselben `ExerciseTask` wie die bisherigen Typen. Die erste interne Lektion behält ihre zehn Aufgaben und Inhaltsversion 1; dieser Schritt veröffentlicht keine Kursinhalte.

## Fachdaten und Umfang

Die sechs Themenbanken enthalten insgesamt **45 Begriffe**. Die Daten bewahren ihre fachliche Struktur; sichtbare Namen und Erklärungen entstehen erst für Deutsch, US- oder UK-Englisch.

| Thema | Datenbank | Definition |
| --- | --- | --- |
| `accidentals` | Fünf Alterationen −2, −1, 0, +1, +2 | Erniedrigen/Erhöhen eines Stammtons um einen beziehungsweise zwei Halbtöne; Auflösung hebt eine geltende Alteration auf. |
| `noteValues` | Ganze bis Sechzehntel, jeweils unpunktiert und einfach punktiert: zehn Werte | Exakter Anteil der ganzen Note; eine Punktierung verlängert um die Hälfte des unpunktierten Werts. |
| `intervals` | 14 Intervalle: P1, m2, M2, m3, M3, P4, A4, d5, P5, m6, M6, m7, M7, P8 | Zahl der Stammtonpositionen einschließlich beider Endpunkte und tatsächlicher Halbtonabstand. |
| `triads` | Dur, Moll, vermindert, übermäßig | In Terzschichtung: Halbtonabstände aller drei Töne vom Grundton. |
| `scales` | Dur, natürliches, harmonisches und klassisch melodisches Moll | Aufeinanderfolgende Halbtonschritte über eine Oktave, ausdrücklich aufwärts. |
| `meters` | 2/2, 2/4, 3/4, 4/4, 3/8, 6/8, 9/8, 12/8 | Zahl und Wert der Grundschläge sowie Gruppierung in Nenner-Einheiten. |

Übermäßige Quarte und verminderte Quinte haben beide sechs Halbtöne, aber vier beziehungsweise fünf Stammtonpositionen. Ihre Erklärungen bleiben dadurch verschieden. Klassisch melodisches Moll wird ausdrücklich aufwärts beschrieben, damit es nicht mit seiner natürlichen Abwärtsform vermischt wird. Zusammengesetzte Takte zählen Grundschläge statt bloßer Nenner-Einheiten: 6/8 hat zwei punktierte Viertelschläge.

Notenwert-Reihenfolgen verwenden dieselben zehn Dauerwerte; zum Beispiel ist eine punktierte Halbe 3/4 einer ganzen Note. Tonhöhen-Reihenfolgen wählen aus 14 natürlichen Tönen von C4 bis H5/englisch B5. Die Oktave gehört zur Antwort. Deutsche Namen erscheinen mit H, internationale mit B; die Daten bleiben sprachneutral. Vorzeichen, Enharmonik, Tuplets und gleich hohe beziehungsweise gleich lange Werte sind in diesen Reihenfolgen noch nicht enthalten.

Die Begriffsbänke sind berechenbare Grundlagenaufgaben. Frei verfasste Fragen, Epochen-/Komponistenwissen, Orchesterbesetzung, Chorgattungen und höherstufiger Tonsatz benötigen später eigene fachlich geprüfte Inhaltsdaten. Der vorhandene Typname bedeutet keine bereits fertige vollständige Themenbibliothek.

## Eingabe, Rückmeldung und Hilfen

Bei Zuordnungen zuerst einen Begriff wählen, danach seine Erklärung. Wird eine schon verwendete Erklärung einem anderen Begriff zugewiesen, löst sich die vorherige Zuordnung; zwei Begriffe können sie nicht zugleich belegen. „Zuordnung löschen“ betrifft ausschließlich den ausgewählten Begriff. Die Oberfläche zeigt die Anzahl vollständiger Paare. Die Begriffsauswahl und die Erklärungsauswahl besitzen getrennte, beschriftete Radiogruppen. Im Web funktionieren Pfeiltasten, Home/End, Leertaste und Enter; auf Touchgeräten das direkte Antippen.

Reihenfolgen beginnen leer. Werte werden in der gewünschten Folge hinzugefügt; bereits verwendete Werte sind gesperrt. Mit „Nach oben“, „Nach unten“ und „Entfernen“ lassen sich Einträge überarbeiten. Jeder Knopf trägt für Screenreader den vollständigen Wert, beispielsweise „punktierte Sechzehntelnote nach oben“; die sichtbare kurze Beschriftung passt auch auf das Telefon. Keine Drag-Geste ist erforderlich. Grenzpositionen sperren die jeweils unmögliche Bewegung. Anzahl gefüllter Plätze und Positionen sind ausgeschrieben.

„Prüfen“ ist erst bei vollständigen, eindeutigen Antworten aktiv. Teilantworten erzeugen keine Wertung und keinen Antwortdatensatz. Nach der ersten Bewertung bleiben alle Eingaben gesperrt. Bei Zuordnungen zeigt jedes Paar ein Richtig-/Falsch-Symbol und eine entsprechende assistive Beschriftung; bei Reihenfolgen steht die Wertung an jeder Position als Text. Die gemeinsame Rückmeldung erklärt die vollständige Lösung. Fehler werden nicht nur durch Farbe dargestellt.

- Hinweis 1 erläutert die fachliche Vergleichsregel des Themengebiets.
- Hinweis 2 grenzt Wissensfragen auf zwei Begriffe ein, nennt bei Zuordnungen das erste richtige Paar oder bei Reihenfolgen den ersten Wert.
- Hinweis 3 erklärt die vollständige Lösung. Unterstützte Antworten bleiben gesondert gezählt.

Die Aufgabe erfordert kein zeitliches Limit und lässt sich vertikal scrollen. Farben, Abstände, Karten, Schriften und Knöpfe stammen aus den vorhandenen Design-Tokens und UI-Bausteinen. Neue Animationen sind nicht nötig; die bestehenden Knöpfe berücksichtigen reduzierte Bewegung. `Button.accessibilityLabel` ist optional und verwendet ohne ausdrückliche Angabe weiterhin die sichtbare Beschriftung.

## Parameter und Schnittstelle

`@harmonia/exercises` exportiert `knowledgeExercise`, `matchExercise` und `orderExercise` mit `generate`, `evaluate`, `feedback` und `hints`; zusätzlich `generateKnowledge`, `generateMatch` und `generateOrder`. Alle drei Typen sind in `ExerciseSpec`, Generator, Antwortauswertung, Lektionsablauf und strengem Inhaltsschema enthalten.

| Parameter | Bereich und Standard |
| --- | --- |
| `KnowledgeParams.topics` | Nicht leere Liste aus den sechs Themenbanken oben. Doppelte Themen werden für die Auswahl dedupliziert. |
| `MatchParams.topics` | Gleiche sechs Themen; jedes aufgeführte Thema muss eine weitere Begriffsauswahl zulassen. |
| `MatchParams.count` | Ganze Zahl 2–4, Standard 3. Muss kleiner als die Größe jeder erlaubten Themenbank sein. Bei Dreiklängen und Tonleitern sind daher höchstens drei Paare erlaubt. |
| `OrderParams.topics` | Nicht leere Liste aus `noteValues` und `pitches`. |
| `OrderParams.count` | Ganze Zahl 3–6, Standard 4. |
| `OrderParams.direction` | `ascending`, `descending` oder `both`; Standard `both`. |

Generatoren validieren alle erlaubten Themen, auch wenn ein einzelner Seed nur eines davon auswählt. Ungültige Größen, unbekannte Themen oder Richtungen und zusätzliche Schemafelder werden zurückgewiesen. Ein MATCH mit allen vier Dreiklangarten wäre nur ummischbar und erlaubte keine neue fachliche Wiederholung; deshalb ist diese Parametrisierung absichtlich ungültig.

| Antwort-ID | Bedeutung |
| --- | --- |
| `interval:A4`, `duration:half:1`, `scale:major`, `meter:6/8` | Gewählter fachlicher Begriff einer Wissensfrage. |
| `match:triad:minor,triad:major,triad:augmented` | IDs der gewählten Erklärungen in der Reihenfolge der vorgegebenen Begriffe. |
| `match:triad:minor,,` | Editierbare Teilzuordnung mit zwei freien Plätzen; nicht wertbar. |
| `order:duration:sixteenth:0,duration:quarter:0,duration:half:1` | Tatsächlich eingegebene Reihenfolge. |
| `order:pitch:C4,pitch:G4,pitch:B4` | Tonhöhen einschließlich Oktave; die letzte Anzeige ist deutsch H4, englisch B4. |
| `order:` | Leere editierbare Folge; nicht wertbar. |

Antworten sind kanonisch, höchstens 1.000 Zeichen lang und enthalten ausschließlich Werte der aktuellen Aufgabe. MATCH verlangt exakt so viele Stellen wie Begriffe; freie Stellen bleiben leer. ORDER darf höchstens die Zahl vorgegebener Werte enthalten. Doppelte belegte IDs, fremde Werte, zusätzliche Stellen, Leerzeichen, Zeilenumbrüche und falsche Präfixe sind ungültig. Bewertung kommt aus den ursprünglichen Fachdaten, nicht aus lokalisierten Namen oder zwischengespeicherten Antworttexten.

## Wiederholung und Speicherung

Fehlerwiederholungen ändern bei Wissensfragen den Begriff, bei Zuordnungen die Begriffsmenge und bei Reihenfolgen die Wertemenge beziehungsweise Ordnungsrichtung. Bloßes Umstellen der Begriffe oder Antwortmöglichkeiten ist keine neue Aufgabe. `itemVariantKey` ignoriert dazu die gemischte Darstellung und bewahrt die fachlich relevante Menge. Der erste Aufgaben- und Antwortsnapshot bleibt unverändert erhalten.

Vollständige Fachdaten, rohe Antwort-IDs, Hilfen, Erstversuch und neue Wiederholungen passen in den vorhandenen SQLite-JSON-Payload. Ein zusätzlicher echter SQLite-Test speichert einen gemischten Drei-Typen-Versuch mit erst falschen, unterstützten Antworten und anschließend richtigen neuen Wiederholungen und liest ihn verlustfrei zurück. Datenbankversion bleibt 1; keine Migration oder neue Abhängigkeit ist erforderlich. Die freie Übungsauswahl verwendet den bestehenden Sitzungsablauf; die versionierte erste Lektion wird durch diesen Ausbau nicht verändert.

## Prüfstand

- **55 zusätzliche Tests:** 24 im Übungskern, 21 Schemafälle, neun App-Ablauftests und ein SQLite-Test. Sechs Wissens- und sechs Zuordnungsthemen sowie vier Reihenfolge-Parametersätze durchlaufen jeweils 150 Seeds. Die Reihenfolge-Erwartungen verwenden unabhängig ausgeschriebene Dauer- und MIDI-Tabellen.
- Feste Beispiele prüfen A4/d5, Punktierung, alle vier Dreiklang- und Tonleiterformeln, 6/8-Gliederung und doppelte Vorzeichen. Alle 45 Erklärungen bleiben je Thema und Sprache eindeutig; Namen, Fragen, Hinweise und Rückmeldungen werden in DE/US/UK geprüft.
- Gesamtprüfung: **1.636 Tests bestanden**. Lint, Typen, Formatierung, Übersetzungen, Inhaltskatalog und Fähigkeitsplan bestanden. Nach der Anpassung der kurzen Verschiebeknöpfe wurde die App-Suite erneut geprüft; nach Singular-/Plural-Korrekturen die vollständige Übungskern-Suite.
- Deno: Typprüfung und **42 Laufzeitprüfungen**, einschließlich aller drei neuen Generatoren.
- Interner und öffentlicher Web-Export; Prüfung des tatsächlichen öffentlichen Bundles auf unveröffentlichte Katalogdaten und Inhaltstexte.
- Chromium: alle neun Aufgaben mit Desktop-Tastatur, Telefon-Touch und Maus im öffentlichen US-Export bestanden. Hell/Dunkel, 1280 × 1000 und 390 × 844 sowie reduzierte Bewegung geprüft. Zusätzlich Umhängen/Löschen von Paaren, Verschieben/Entfernen von Werten, Teilantwortsperre, gesperrte falsche Erstwertungen und öffentliche UK-Terminologie. Alle Telefonknöpfe bleiben innerhalb der verfügbaren Breite; keine Klänge oder Browserfehler. Screenshots der Zuordnungs- und Reihenfolgeansichten visuell kontrolliert.

Automatisierte Fachprüfungen verwenden die vorhandene Theorie-Engine, fest ausgeschriebene Formeln und unabhängige Dauer-/MIDI-Tabellen. Die bestehenden Engine-Vergleiche gegen `tonal` laufen in der Gesamtprüfung mit. Claudes getrennter Prüfdurchgang nach [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md) einschließlich Literaturabgleich ist damit nicht abgeschlossen.

## Übergabe und Folgearbeit

Review-Zweig: `codex/p2-06-knowledge`, aufbauend auf `codex/p2-06-rhythm-meter` (Basis `8a75a45`). Der Rhythmus-/Takt- und der davorliegende Akkordzweig sind zum Prüfzeitpunkt noch nicht in `main` enthalten; den Wissensausbau daher gegen seinen Rhythmus-/Takt-Vorgänger prüfen. Kein Merge nach `main` ist Teil dieses Schritts.

Für Claude Code: Die neuen Typen sind technisch vorhanden und im sechsten freien Satz bedienbar. Fachliche Abnahme, GitHub-CI vor dem Merge und echte iOS-/Android-Proben mit VoiceOver/TalkBack bleiben offen. Deshalb bleiben die Abnahme-Checkboxen für P2.06 offen; Browser-Automation ersetzt keine native Geräteprüfung.

Anschließend folgen vollständige Lektionen und Wissensinhalte für Stufe 1 in P2.07 und Stufe 2 in P2.08 auf Grundlage des [Fähigkeitsgraphen](faehigkeitsgraph.md), jeweils mit separater fachlicher Freigabe. Bestehens-/Freischaltlogik, vollständige Lernpfade und spätere Chor-/Orchester- und Tonsatzstufen sind weiterhin eigene Arbeitsschritte.
