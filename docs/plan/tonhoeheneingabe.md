# Tonhöheneingaben – erster Teil von P2.06

Stand: 06.10.2026. `NOTE_PLACE`, `KEY_FIND` und `INTERVAL_BUILD` sind technisch umgesetzt. Sie verwenden Generatoren und Bewertung der Theorie-Engine, denselben Aufgabenablauf wie die erste Lektion und die vorhandenen Eingabebausteine. P2.06 bleibt offen: elf weitere Typen sowie fachliche Abnahme und echte Gerätetests fehlen noch.

Fortsetzung vom 07.10.2026: Vier weitere Typen sind in [Tonleitern und Vorzeichnungen](tonleitern-und-vorzeichnungen.md) dokumentiert. Der aktuelle P2.06-Stand umfasst damit sieben technisch umgesetzte und sieben noch fehlende Typen. Die folgenden Prüfzahlen beschreiben den ersten Teil vom 06.10.

## Bedienbarer Stand

Im Tab „Üben“ führt „Noten und Intervalle selbst eingeben“ zu neun Aufgaben, je drei pro Typ. Der bisherige Satz zum Lesen und Hören bleibt ebenfalls erreichbar. Ein neuer Durchgang behält die gewählte Art; nach dem Ergebnis führt „Übungssatz auswählen“ zurück zur Auswahl.

- **Noten setzen:** Der Auftrag nennt die vollständige Tonhöhe. Das System beginnt mit einer ganzen Pause. Tippen setzt die Note, Ziehen verschiebt sie, die Vorzeichenleiste wählt die Alteration. Löschen entfernt die Antwort und sperrt „Prüfen“ wieder.
- **Tasten finden:** Auftrag und Notenbild geben den gesuchten Ton vor. Die spielbare Klaviatur nimmt die klingende Tonhöhe entgegen. Für Ziele außerhalb des kurzen Übungsausschnitts startet sie mit dem mittleren oder vollständigen Ausschnitt; Paging und Einstellungen erschließen alle 88 Tasten.
- **Intervalle aufbauen:** Der erste Takt enthält den Ausgangston. Der Auftrag nennt Intervallqualität und Richtung. Nur im leeren zweiten Takt wird die Antwort gesetzt; der Ausgangston bleibt fest.

Die erste geprüfte Antwort bleibt gewertet. Note beziehungsweise Taste wird mit Text, Symbol und Farbe markiert; bei Schreibaufgaben erscheint zusätzlich das Lösungsnotenbild. Bewertete Eingaben, Löschen und Vorzeichen sind gesperrt. Die nächste Aufgabe beginnt ohne Antwort. Hinweise 1–2 unterstützen den Lösungsweg, Hinweis 3 erklärt und zeigt die Lösung und zählt als Hilfe. Statistik und Aufgabenwechsel kommen aus dem bestehenden Übungsablauf; Freischaltung und Bestehensschwellen gehören zu P2.11–P2.12, XP zu P2.14.

## Schnittstelle und Bewertungsregeln

`@harmonia/exercises` exportiert `notePlaceExercise`, `keyFindExercise` und `intervalBuildExercise` mit `generate`, `evaluate`, `feedback` und `hints`. `generateExercise` und das strenge Inhaltsschema unterstützen alle drei Typen. Sie lassen sich damit auch in versionierten Lektionen verwenden; die bestehende erste Lektion behält ihre zehn Aufgaben und Inhaltsversion 1.

| Typ | Parameter | Sprachneutrale Antwort | Korrekt, wenn |
| --- | --- | --- | --- |
| `NOTE_PLACE` | `NoteParams`: Schlüssel, MIDI-Bereich, 0–2 Vorzeichen | ASCII-Tonhöhe, z. B. `C#4`, `B3`, `Bb3` | Stammton, Vorzeichen und Oktave stimmen |
| `KEY_FIND` | `NoteParams`; Standardbereich C4–E5, ohne Vorzeichen | `key:61` | MIDI-Tonhöhe einschließlich Oktave stimmt |
| `INTERVAL_BUILD` | `VisualIntervalParams`: zusätzlich Intervallliste und `up`, `down`, `both` | vollständige Zieltonhöhe, z. B. `Fb4` | die durch Transposition erzeugte Zielschreibweise einschließlich Oktave stimmt |

Die Schreibtypen verwenden standardmäßig die bisherigen Bereiche C4–C6 im Violin- und C2–C4 im Bassschlüssel. Der Intervallgenerator verwendet standardmäßig ein Vorzeichen; die beiden Einzelton-Typen keines. Im freien Eingabesatz ist die Vorzeichentiefe jeweils 1, bei Intervallen sind kleine/große Terz, reine Quarte und Quinte in beiden Richtungen erlaubt.

Schreibaufgaben berücksichtigen die vier Hilfslinien ober- und unterhalb des interaktiven Systems. Jeder erzeugte Ton muss dort erreichbar und innerhalb A0–C8 sein. Leere Tonbereiche und nicht darstellbare erlaubte Intervalle scheitern vor der Zufallsauswahl. Die Vorzeichentiefe beschränkt die Aufgaben, nicht die falschen Antwortmöglichkeiten: Die Leiste erlaubt bis zu zwei Vorzeichen. Tastenaufgaben erlauben den gesamten Klavierbereich. Antwort-IDs werden streng geprüft; Leerzeichen, alternative Unicode-Codierungen, ungültige Oktaven und fremde IDs erzeugen keinen Antwortdatensatz.

Cis4 und Des4 werden beim Schreiben verschieden bewertet, auf der Klaviatur führen beide zur Taste 61. Auch His3 und C4 führen zur selben Taste 60; ein Oktavwechsel bleibt falsch. Beim Aufbau C4 → Fes4 ist E4 trotz gleichen Klangs falsch, weil eine verminderte Quarte geschrieben werden soll. Abwärtsintervalle erhalten ihren tatsächlichen Zielton und die Richtung im Auftrag.

`inputSlot`, `inputTarget`, `answerPitch` und `inputSolutionScore` bilden die Eingabe ab. Das Fragebild enthält bei `NOTE_PLACE` keine Note, bei `INTERVAL_BUILD` nur den Ausgangston; beide haben keine Auswahlantworten. Das Lösungsbild wird erst nach Prüfung oder ausdrücklich gewählter Hinweisstufe 3 dargestellt. Bei `KEY_FIND` ist der gesuchte Ton bereits Teil des Auftrags.

## Ablauf, Speicherung und Barrierefreiheit

`PitchAnswerInput` ist in `ExerciseTask` eingebunden und dadurch für freies Üben und Lektionen nutzbar. Die freien Antwort-IDs bleiben Strings im bestehenden Sitzungsmodell. Fehlerwiederholung erzeugt neue Tonhöhenvarianten; bei Tastenaufgaben genügt weder ein Schlüsselwechsel noch eine enharmonische Umbenennung derselben Taste. Erstwertung, Hilfen und Wiederholung bleiben getrennt. Die SQLite-Ablage speichert Aufgaben und Antworten ohne Schemaänderung; der Test prüft den tatsächlichen JSON-Datensatz und die Ergebniszeile in SQLite.

Das Notensystem bleibt per Tab und Pfeiltasten sowie über Screenreader-Aktionen anpassbar. Vorzeichen sind beschriftete Radiobuttons. Klaviertasten funktionieren über Touch, Maus, fokussierte Taste mit Leertaste/Enter und die vorhandenen physischen Klaviertasten. Aufgabenwechsel und Rückmeldung erhalten den bestehenden Fokusablauf. Bewerten, Hintergrund und Verlassen beenden die eigenen Klänge; die Lösung wird nie automatisch abgespielt. Deutsch und US-/UK-Englisch sind vollständig vorhanden, einschließlich „measure“ beziehungsweise „bar“ und der vorhandenen Glossarbegriffe.

Farben, Abstände, Schrift, Haptik und reduzierte Bewegung kommen aus dem bestehenden Design-System. Die neue Eingabe verwendet die vorhandenen `ScoreView`, `PianoKeyboard` und `AccidentalBar`; neue Abhängigkeiten oder native Projektdateien sind nicht erforderlich.

## Prüfstand und Übergabe

- 22 neue Engine-Tests, darunter je 150 deterministische Seeds in zehn Parametersätzen; spielbare Bereiche, Taktfüllung, freie Bewertung, Enharmonik, Oktaven, Abwärtsintervalle, ungültige IDs, Hilfe und Wiederholung.
- Sieben neue Schemafälle und ein SQLite-Test; vier neue App-Tests prüfen den kompletten Neun-Aufgaben-Satz, Sperren, Löschen, Hinweise, Screenreader-Eingabe und UK-Texte.
- Gesamtprüfung: 1.422 Tests; Lint, Typprüfung, Übersetzungen, Inhalts-/Fähigkeitsplan und Installation mit unverändertem Lockfile. Deno prüft die drei neuen Generatoren und Antworten zusätzlich zu den vorhandenen Fällen.
- Interner und öffentlicher Web-Export; der öffentliche Export besteht die Prüfung gegen unveröffentlichte Katalog-IDs und Inhaltstexte.
- Chromium: vollständige Eingabesätze mit physischer Tastatur, Maus und Touch, Desktop 1280 × 1000 und Telefonformat 390 × 844, Hell/Dunkel und reduzierte Bewegung. Keine Browserfehler; der öffentliche Export hält die Entwurfslektion gesperrt und bietet die freien Übungen an.

Die Erklärungstexte benötigen Claudes getrennte fachliche Abnahme gemäß [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md). Diese technische Umsetzung gibt keine versionierten Kursinhalte frei. VoiceOver/TalkBack und Bedien-/Hörproben auf echten iOS-/Android-Geräten sowie GitHub-CI vor dem Merge bleiben offen.

Die Tonleiter- und Vorzeichnungstypen sind inzwischen technisch umgesetzt. Als Nächstes in P2.06 folgen Akkorde, Rhythmus/Takt und Wissens-/Zuordnungs-/Reihenfolgeaufgaben. Die vollständigen Stufen-1–2-Lektionen folgen in P2.07–P2.08 auf Basis des Fähigkeitsgraphen.
