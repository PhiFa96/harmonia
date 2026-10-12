# Notenwerte und Pausen – fünfter Teil von P2.07

Stand: 12.10.2026. `rhythm.l1.values` ergänzt drei interne Lektionen mit 8/10/12 Aufgaben, neun Wissenskarten, 15 Noten-/Hörbeispiele und einen neunabschnittigen Artikel in DE/US/UK. Alle Datensätze bleiben `entwurf`; Claudes separate fachliche Abnahme ist offen.

## Inhalt und Bedienung

| ID | Aufgaben | Einführung |
| --- | --- | --- |
| `rhythm.l1.values.notes` | Vier Zeichenfragen, zwei Dauerfragen, zwei Reihenfolgen: 8 | Ganze bis Sechzehntel, Köpfe/Hälse/Fähnchen/Balken, Halbieren: 3 Karten |
| `rhythm.l1.values.rests` | Sechs Zeichenfragen, vier Zuordnungen mit je drei Paaren: 10 | Ganze/halbe Pause, kurze Pausenzeichen, Stille mitzählen: 3 Karten |
| `rhythm.l1.values.fill` | Vier Fragen zu Takt-/Schlussstrichen, vier Noten- und vier Pausenlücken: 12 | Vier-Viertel-Kapazität, Grenzen, vollständige Rechnungen: 3 Karten |

Die Einheit setzt den Puls voraus. Sämtliche neuen Noten- und Pausenwerte bleiben unpunktiert, von ganz bis Sechzehntel. Eine erkennbare Einzelnote benötigt keinen Notenschlüssel und keine benannte Tonhöhe. Ganze und halbe Pausen behalten die kurze Bezugslinie, sodass Hängen und Sitzen unterscheidbar sind. Die Karten erklären daneben die Lage im Notensystem und die gesonderte Funktion des ganzen Pausenzeichens als Ganztaktpause; alle Beispiele dieser Einheit stehen ausdrücklich in 4/4.

Einführungen enthalten vollständige, eigenständig verfasste Scores und spielen bei Viertel = 90. Die 15 Beispiele zeigen gleich lange Unterteilungen, gemischte Noten-/Pausenfolgen, zwei vollständige Takte samt Grenze/Schlussstrich und komplett stille Zeit. Ganze und halbe Pausen dauern vier beziehungsweise zwei Viertelwerte; beim komplett stillen Takt wird kein Ersatzton erzeugt. Tonhöhe G4 dient nur dem Klangbeispiel. In Aufgaben gibt es keine Hörpflicht.

Taktlücken zeigen bis zu sechs vorhandene Dauerzeichen und ein abschließendes Fragezeichen. Nummern sichern die Lesereihenfolge auch nach einem Zeilenumbruch auf schmalen Bildschirmen. Die Vorgabe ist stets genau vier Viertelwerte; Noten und Pausen zählen beide. Die Antwort bezeichnet ausdrücklich eine Note oder Pause. Feedback erklärt die vorhandene Summe und `4 − Summe = fehlender Wert`. Diese Aufgaben prüfen die Gesamtdauer. Metrische Gruppierung, Synkopen, Haltebögen, Punktierungen und die Schreibweise komplexerer Rhythmen werden hier noch nicht bewertet.

Zuordnungen und Reihenfolgen verwenden die bestehenden editierbaren Eingaben. Geprüfte Antworten bleiben gesperrt. Fehler erhalten andere Zeichen/Wertemengen oder andere Taktquellen; Erstversuch, Hinweise und Wiederholung werden getrennt gespeichert. Die vorhandene Wiederholung ist noch keine verbindliche Bestehens-/Freischaltlogik; diese gehört weiterhin zu P2.11/P2.12.

## Schnittstellen und Daten

- `DurationLimits.maxDots` akzeptiert 0 oder 1. Ohne Angabe behalten `KNOWLEDGE_MC`, `MATCH` und `ORDER` ihre bisherigen punktierten Varianten. Begrenzungen gelten auch für Antwortmöglichkeiten; fachfremde Themen oder zu große Mengen werden zurückgewiesen.
- `KnowledgeMcParams.presentation` erlaubt `symbol` und `measure-gap` nur für `noteValues`/`rests` mit `maxDots: 0`. MATCH übernimmt diese Darstellungsparameter nicht. Alle 17 Übungstypen und sechs freien Sätze bleiben bestehen.
- `MeasureGap` enthält die tatsächlichen Ereignisse und die verlangte Art des fehlenden Zeichens. `measureGapFact` addiert die sichtbaren Dauern und subtrahiert sie mit exakten Brüchen von einer ganzen Note. Die Bewertung leitet ihre Lösung daraus ab, auch wenn die gespeicherte `fact`-Angabe abweicht. Leere, volle, übervolle, punktierte/triolische oder nicht durch genau einen erlaubten Wert ergänzbare Quellen werden zurückgewiesen.
- `itemVariantKey` berücksichtigt bei Taktlücken die Quelle; bloß anders sortierte Antwortmöglichkeiten zählen nicht als neue Aufgabe.
- `durationSymbolLayout` gewinnt Köpfe, Hälse, Fähnchen und Pausen aus dem vorhandenen Notensatz. `DurationSymbol` nutzt denselben SVG-Zeichenweg wie `ScoreView`. Erkennungsfragen beschreiben für Screenreader nur Formen; bei Summenaufgaben dürfen vorhandene Werte benannt werden. Die App importiert weiterhin keine Theorie-Engine direkt. Neue Komponenten stehen in der Entwicklungsgalerie und verwenden UI-Tokens.
- Die Wissensbank ergänzt zehn Pausenwerte einschließlich der bereits unterstützten Punktierung sowie zwei Taktstrichbegriffe: insgesamt 73 Begriffe in zwölf Themen. Die neue Einheit beschränkt Pausen auf die fünf unpunktierten Werte. Zwei Taktstrichbegriffe erlauben MC-Fragen; MATCH würde keine andere Begriffsauswahl für Wiederholungen erlauben und wird zurückgewiesen. Der freie Wissenssatz behält seine sechs bisherigen Themen mit 45 Begriffen.
- Neuer Glossarbegriff: `finalBarline`. Noten-/Pausennamen kommen weiterhin aus der Engine beziehungsweise dem Glossar, einschließlich US/UK-Unterschieden.

Katalog, Plan und neue Datensätze haben Version 7. Ältere Lektionen behalten Version 1/3/4/5/6; Schemaformat und SQLite-Datenbank bleiben Version 1. Intern gibt es 16 Lektionen mit insgesamt 160 Erstversuchsaufgaben, 43 Karten einschließlich der drei Prototypkarten und fünf Artikel. Der neue Artikel ist ein Datensatz für die spätere Wissensbasis; eine Leseroute und Tutor-Verknüpfung stehen aus. Öffentliche Katalogdaten und Inhaltstexte enthalten weiterhin keine Entwürfe. Keine neuen Abhängigkeiten, Lockfile- oder nativen Projektänderungen.

## Prüfung und Übergabe

- **1.822 Tests bestanden:** UI 14, Theorie 717, Audio 29, i18n 257, Notation 215, Übungen 202, Inhalte 129, App 203 und Node-Werkzeuge 56. Im Gesamtlauf scheiterte zunächst ein neuer UI-Test an einem falschen Test-Selektor; nach dessen Korrektur bestanden alle fünf neuen App-Fälle gezielt. Keine Produktfunktion war betroffen. Lint, Typen, Formatierung, Übersetzungen, Inhaltskatalog und Fähigkeitsplan bestanden.
- **Unabhängige Fach-/Regressionsprüfungen:** 1.000 Taktlücken gegen eine eigene Tabelle in Sechzehnteln; 300 Zeichenfragen pro Art über alle fünf Werte; 150 Seeds je Lektion einschließlich vollständiger Fehlerwiederholung; 15 Klangbeispiele gegen eine eigene Zeit-/Stille-Tabelle. Alle alten Datensätze und Inhaltsübersetzungen stimmen mit dem Basiszweig überein; 2.200 ältere Wissens-/Zuordnungs-/Reihenfolge-Generierungen sind identisch.
- **Deno:** Typprüfung und 57 Laufzeitprüfungen bestanden, darunter vier neue Prüfungen für Zeichen und Taktlücken.
- **Web:** preview und production exportiert, öffentliches Bundle ohne Entwurfsdaten/-texte. Vier Chromium-Durchgänge mit jeweils allen 30 Aufgaben und 15 Hörbeispielen: DE-Tastatur, DE-Telefon-Touch/dunkel/reduzierte Bewegung, US-Maus, UK-Telefon-Touch. Drei Ergebnisse je Durchgang nach Neuladen, neue Taktlücken-Wiederholung mit 11/12 Erstversuch und 1/1 Wiederholung sowie drei öffentliche Direktlinks geprüft. Keine JavaScriptfehler oder React-Warnungen; nur das bekannte `favicon.ico` (404) wurde genau für diese Datei ignoriert.

Review-Zweig: `codex/p2-07-note-values-rests`, auf dem gepushten Pulsstand `2bcec91` aufgebaut. `main` bleibt unverändert. Ein Review muss gegen `codex/p2-07-pulse-tempo` erfolgen, damit ausschließlich dieser Ausbau sichtbar ist.

Für Claude Code: Form- und Dauerdefinitionen, Bezugslinien der ganzen/halben Pause, Ganztaktpausen-Sonderfall, Grenzen/Schlussstrich, DE/US/UK-Terminologie sowie die didaktische Einführung von 4/4 vor der allgemeinen Taktarten-Einheit separat nach ADR 0005 prüfen. Die technischen Tabellen ersetzen keine Literaturprüfung. GitHub-CI vor dem Merge sowie VoiceOver/TalkBack und echte iOS-/Android-Geräteproben bleiben offen.

Nächste Einheit: `rhythm.l1.simple-meter` mit `rhythm.meter-simple`, `rhythm.count-in` und `rhythm.read-basic`. Danach folgen weitere Stufe-1-Einheiten gemäß Fähigkeitsplan. P2.07 bleibt offen; Stufe 2, Lernerlebnis mit Bestehensregeln sowie Chor-/Orchester- und mehrstimmiger Tonsatz sind weitere Arbeitsschritte.
