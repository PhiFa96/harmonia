# Oktavlagen und Hilfslinien – dritter Teil von P2.07

Stand: 12.10.2026. Die dritte Notationseinheit `notation.l1.register` ergänzt drei interne Lektionen mit 8/10/12 Aufgaben, acht Wissenskarten, dreizehn Noten-/Klaviaturbeispiele und einen fünfteiligen Artikelentwurf in DE/US/UK. Alle neuen Inhalte bleiben `entwurf`; Claudes separate fachliche Abnahme ist offen.

## Lektionen und Voraussetzungen

| Lektions-ID | Titel | Aufgaben | Einführung | Bereich |
| --- | --- | --- | --- | --- |
| `notation.l1.register.octaves` | Oktavlagen unterscheiden | 8 Notennamenfragen mit Oktave | 3 Karten | E4–F5, ohne Hilfslinien |
| `notation.l1.register.ledger` | Mit Hilfslinien weiterlesen | 10 Notennamenfragen mit Oktave | 3 Karten | A3–C6, höchstens zwei Hilfslinien |
| `notation.l1.register.match` | Die notierte Note auf der Klaviatur spielen | 12 Tastenfragen aus dem Notenbild | 2 Karten | Fester Ausschnitt A3–C6 |

Alle Aufgaben verwenden natürliche Töne im Violinschlüssel. Die drei vorhandenen Fähigkeiten sind `notation.octave-register`, `notation.ledger-lines` und `notation.pitch-match`; ihre Voraussetzungen bleiben erhalten. Die erste Lektion unterscheidet vollständige Namen innerhalb des bekannten Systems. Die zweite setzt Linien und Zwischenräume nach außen fort. Erst danach wird eine geschriebene Tonhöhe der klingenden Taste einschließlich Oktavlage zugeordnet. Vorzeichen werden in dieser Einheit nicht mitgeprüft; Schreiben auf dem System gehört zur vorgesehenen Stufe-2-Einheit.

Die bisherigen Namenfragen bewerten Buchstabe und Alteration. Mit `includeOctave: true` bewerten sie zusätzlich die Oktave. Jede neue Frage bietet garantiert eine Antwort mit demselben Buchstaben und Vorzeichen in der nächstliegenden anderen Lage; diese Antwort ist falsch. Die anderen Möglichkeiten stammen aus den im Parameterbereich vorkommenden Registern und können außerhalb des abgefragten Tonraums liegen. Es werden keine weiteren Notenbilder für diese Antwortnamen gezeigt. Ohne Parameter oder mit `false` bleiben bisherige IDs, Namen und Seeds erhalten.

Neue Antworten sind vollständige ASCII-Tonhöhen wie `B4` und `C5`. Die Oberfläche lokalisiert dieselben IDs als h¹/c² beziehungsweise B4/C5. Die genaue Helmholtz-/wissenschaftliche Systemzuordnung ist später ein eigenes Lernziel in Stufe 2; hier wird die jeweils gewählte Sprache verwendet. Als Glossareintrag kommt `octaveRegister` hinzu.

## Karten, Beispiele und Artikel

| Karte | Selbst verfasste Beispiele |
| --- | --- |
| `card-repetition` | E4–E5 und G4–G5: gleicher Buchstabe in anderer Lage |
| `card-boundary` | B4–C5: eine neue Lage beginnt bei C; deutsch h¹–c² |
| `card-names` | C4–C5 und F4–F5: vollständige Antwortnamen |
| `card-extend` | D4 und G5: äußere Zwischenräume ohne Hilfslinie |
| `card-lower` | C4/A3 auf einer/zwei unteren Linien; D4–C4–B3–A3 schrittweise |
| `card-upper` | A5/C6 auf einer/zwei oberen Linien; F5–G5–A5–B5–C6 schrittweise |
| `card-match` | C4/C5 und die Ausschnittsgrenzen A3/C6 auf der Klaviatur |
| `card-strategy` | G4, G5 und C5 lesen und zuordnen |

Die vollständigen IDs beginnen mit `notation.l1.register.`. Untere Hilfslinien: C4 eine, B3 im Zwischenraum ebenfalls eine sichtbar, A3 zwei. Obere Hilfslinien: A5 eine, B5 im Zwischenraum ebenfalls eine sichtbar, C6 zwei. D4/G5 stehen direkt außerhalb des Systems ohne Zusatzlinie. Der Aufgabenbereich endet jeweils auf der zweiten Linie; weiter entfernte äußere Zwischenräume werden noch nicht abgefragt.

Das bestehende Beispielmodell erhält optionales `keyboard.showOctaves: true`. Diese Diagramme beschriften weiße Tasten mit vollständigen Namen, etwa c¹/c² oder C4/C5. Sichtbare weiße Tasten bleiben mindestens 48 Punkte breit. Auf kleinen Displays wird das Bild dadurch seitlich verschiebbar; ein Hinweis erscheint bei tatsächlichem Überlauf. Im Web ist der Ausschnitt dann mit Tab und Pfeiltasten erreichbar. Beispielwechsel setzt den Ausschnitt über den vorhandenen Schlüssel auf den Anfang zurück. Frühere Beispiele ohne Flag behalten ihre Buchstabenbeschriftung und passen sich weiterhin an die Kartenbreite an.

Punkte und Farbe markieren dieselben klingenden Tasten wie im vollständigen Score. Der zugängliche Bildname nennt die geschriebenen Töne. Der Renderer ist in beiden Fassungen in der Entwicklungsgalerie vorhanden. Klang startet ausdrücklich bei 90 Viertelnoten pro Minute; Score, Einsätze und eigener Stopp verwenden die bestehende Zeitfolge. Es werden keine Beispiele gekürzt.

`notation.l1.register.article` enthält fünf Abschnitte zu wiederkehrenden Registern, vollständigen Namen, unteren und oberen Hilfslinien sowie dem Lese-/Tastenablauf. Er bleibt ein Datensatz für die spätere Wissensbasis; Leseroute und Tutor-Anbindung sind noch offen.

## Tastenfragen und Bewertung

`KEY_FIND` erhält zusätzlich `presentation: 'score'`. Die Oberfläche zeigt die geschriebene Note; der Fragetext nennt deren Zielnamen nicht. Hinweis 1 beschreibt das Lesen vor der Tastensuche. Hinweis 2 und die erklärte Lösung können den vollständigen Namen nennen und zählen als Hilfe. Die bisherigen Formen `notation` und `name` behalten ihr bisheriges Verhalten.

Die neue Form leitet den festen Klaviaturausschnitt aus `params.range` ab. A3–C6 umfasst 28 Tasten, einschließlich mehrfach vorkommender Buchstaben in verschiedenen Oktavlagen. Einstellungen erlauben Beschriftung und Zoom; der Tonumfang-Wechsel ist ausgeblendet. Höher, Tiefer und Verschieben bewegen den Ausschnitt. Ein Paging-Schritt ist höchstens eine Oktave breit und überschreitet die tatsächlich sichtbare Breite nicht. Der bisherige volle Oktavsprung konnte auf schmalen Displays bei größeren Bereichen Tasten zwischen zwei Ansichten überspringen; diese Lücke ist behoben. Individuelle Tasten bleiben über Tab und Leertaste/Enter erreichbar; die bestehende Buchstabentastatur spielt ihren verfügbaren C4–E5-Teilbereich.

Tastenantworten bleiben `key:<MIDI>`. Ein um zwölf Halbtöne versetzter gleichnamiger Ton ist falsch. Fehlerwiederholungen verwenden eine andere tatsächliche Tonhöhe. Namenfragen bewahren die genaue Schreibweise zusätzlich zur Oktave. Die Hinweise und gesperrte Erstwertung gelten weiter; beide Runden werden getrennt gespeichert.

## Versionen und Auslieferung

Katalog, öffentlicher Katalog und Fähigkeitsplan haben `contentVersion: 5`; Format bleibt `schemaVersion: 1`. Neue Karten, Sätze, Lektionen und Artikel haben Version 5. Prototyp, Notensystem- und Klaviatureinheit behalten ihre Versionen 1, 3 und 4. SQLite speichert vollständige Parameter, generierte Fragen, Antworten und Runden; Datenbankversion bleibt 1. Abhängigkeiten und Lockfile bleiben unverändert.

Intern sind jetzt zehn Lektionen mit insgesamt 100 Aufgaben pro vollständigem Erstversuch auswählbar. Die drei Notationseinheiten besitzen 23 neue Karten und drei Artikel; mit den Prototypkarten sind es 26 Karten insgesamt. Der öffentliche Katalog enthält weiterhin keine ungeprüfte Lektion, Karte oder Artikel. Es gibt noch keine Bestehens-/Freischaltlogik.

## Prüfstand

- **29 zusätzliche Tests:** sechs Generator-/Bewertungsfälle, sechs Inhaltsfälle, neun App-Abläufe, drei öffentliche Direktlinkfälle, ein echter SQLite-Fall, eine unabhängige Beispiel-/Hilfslinientabelle und drei Glossarfälle.
- Jede Lektion durchläuft 150 Seeds mit reproduzierbaren Fragen, bewusst falschen Oktavantworten, Hinweisnutzung und anschließend richtigen neuen Wiederholungen. Namenfragen durchlaufen weitere 450 Seeds in zwei Lernbereichen und über den gesamten Klavierbereich einschließlich Doppelzeichen. 150 Tasten-Seeds prüfen feste Grenzen und die falsche Nachbaroktave. Alte Namens-IDs und Seeds sowie deutsche h/h¹/h²/c³-Namen werden separat geprüft.
- Alle dreizehn Beispiele werden gegen unabhängig ausgeschriebene Tonfolgen, MIDI-Zahlen und die tatsächlich gezeichnete Gesamtzahl der Hilfslinien geprüft. Die App prüft alle 30 Antworten und ihre eigenen Versions-/Lektions-IDs. Echte SQLite prüft unveränderte vollständige Payloads und getrennte Version-4-/Version-5-Ergebnisse bei Datenbankversion 1.
- **1.742 Tests bestanden**, einschließlich 181 App-Tests; Lint, Paketgraph, Typen, Formatierung, Übersetzungen, Inhaltsartefakte und Fähigkeitsplan bestanden. Deno-Typprüfung und **50 Laufzeitprüfungen** bestanden. Nach der Paging-Korrektur alle 181 App-Tests, App-Typprüfung und der betroffene Lint erneut bestanden. Keine neue Abhängigkeit.
- Preview und Production als Web-Export gebaut, nach der Paging-Korrektur beide erneut exportiert. Die tatsächlichen Produktionsdateien bestehen die Prüfung auf unveröffentlichte Inhalts-IDs und Texte.
- Chromium: alle drei Lektionen mit 30 Aufgaben pro Durchgang auf deutscher Desktop-Tastatur, deutschem Telefon-Touch im Dunkelmodus mit reduzierter Bewegung, US-Maus und UK-Telefon-Touch. Alle dreizehn Diagramme mit vollständigen Namen, mindestens 48 Punkten pro weißer Taste und bedarfsabhängigem Scrollhinweis geprüft; die letzte Beschriftung ist per Pfeiltasten erreichbar. Beide deutschen Durchläufe prüfen sämtliche Töne und Einsätze der dreizehn Beispiele sowie eigenen Stopp. Drei gespeicherte Ergebnisse bleiben nach Neuladen getrennt erhalten. Die drei Entwurfs-Direktlinks bleiben in Production gesperrt; freies Üben und Rückweg sind erreichbar.
- Eine falsche Namenoktave bewahrt 7/8 im Erstversuch und 1/1 mit neuem Notenbild in der Wiederholung. Eine zusätzliche Telefonprobe erreicht alle zwölf Tastenaufgaben und eine neue Wiederholung über echte Höher-/Tiefer-Knöpfe ohne automatische horizontale Scrollhilfe, mit 11/12 plus 1/1 nach einer falschen Nachbaroktave. Die vorige Klaviaturkarte behält Buchstabenbeschriftung und responsive Breite. Auswahl, Diagramme und Aufgaben wurden in beiden Themes visuell geprüft.
- Keine JavaScriptfehler oder React-Warnungen; die lokale Vorschau meldet lediglich ihre bereits fehlende `favicon.ico` mit HTTP 404. Diese Icon-Anfrage wurde getrennt erfasst.

Claudes getrennter Prüfdurchgang in frischem Kontext und Literaturabgleich nach [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md) bleiben offen. Ebenso fehlen GitHub-CI und echte iOS-/Android-Prüfungen mit VoiceOver/TalkBack und vergrößerter Schrift. Technische Tests ersetzen diese Abnahmen nicht.

## Übergabe und Fortsetzung

Review-Zweig: `codex/p2-07-register-ledger-lines`, Basis `codex/p2-07-keyboard-accidentals` bei `594e29e`. Gegen diesen Vorgänger prüfen. Die vorherigen Notations-, Wissens-, Rhythmus- und Akkordzweige waren zu Beginn weiterhin separat; `main` bleibt unverändert.

Der Review-Zweig ist gepusht; Implementierungscommit `9b81e2e`. `main` blieb beim abschließenden Fetch auf `ea48230`. Die automatische Draft-PR-Erstellung scheitert am Cloud-Zugriff auf `https://api.github.com/graphql` mit `Forbidden`; es wurde kein PR angelegt. [Änderungen gegen die Klaviatureinheit vergleichen](https://github.com/PhiFa96/harmonia/compare/codex/p2-07-keyboard-accidentals...codex/p2-07-register-ledger-lines).

Für Claude Code: zuerst die vollständigen Namensantworten, die Registergrenze H/B–C, die Hilfslinienpositionen und die schriftbasierte Tastenfrage prüfen. Danach folgt gemäß Fähigkeitsplan `rhythm.l1.pulse` mit Puls, Tempo und Zählzeiten. Alle drei Notationseinheiten brauchen vor `freigegeben` den separaten fachlichen Prüfdurchgang. Die vollständige Stufe 1, Stufe 2, Bestehens-/Freischaltlogik und spätere Chor-, Orchester- und mehrstimmige Tonsatzstufen bleiben Folgearbeit; P2.07 ist nicht abgeschlossen.

Fortsetzung 12.10.2026: Die nächste Einheit `rhythm.l1.pulse` ist technisch ausgebaut. Der aktuelle Stand mit Katalogversion 6, 13 internen Lektionen und der Folgearbeit `rhythm.l1.values` steht in [Puls, Tempo und Zählgruppen](puls-tempo-und-zaehlgruppen.md). Der obige Prüfstand bleibt die Dokumentation der Registereinheit vor dieser Fortsetzung.
