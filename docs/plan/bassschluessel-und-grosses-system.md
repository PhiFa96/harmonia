# P2.08 – Bassschlüssel, großes System und Oktavnamen

Stand 13.10.2026: Die erste der 16 geplanten Stufe-2-Einheiten ist intern umgesetzt. `notation.l2.clefs-registers` deckt `notation.bass-natural`, `notation.grand-staff` und `notation.octave-systems` mit drei Lektionen ab. **Alle neuen Datensätze bleiben `entwurf`.** P2.08 ist damit begonnen, nicht vollständig. Die getrennte fachliche Claude-Abnahme nach [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md) steht aus; die vorherige Stufe 1 ist technisch vollständig, ihre fachliche Freigabe bleibt ebenfalls offen.

## Inhalt und Lernfolge

| Lektion | Aufgaben | Lernziel |
|---|---:|---|
| `notation.l2.clefs-registers.bass` | 8 | Vier natürliche Tonnamen c–h/B3, dann vier vollständige Tonhöhen c/C3–c¹/C4 im Bassschlüssel |
| `notation.l2.clefs-registers.grand` | 10 | Vier Tastenfragen h/B3–c¹/C4, dann sechs a/A3–e¹/E4 in Violin- oder Basssystem |
| `notation.l2.clefs-registers.names` | 12 | Sechs Helmholtz-Namen in wissenschaftliche Namen übersetzen, dann sechs in Gegenrichtung; natürliche Quelltöne C3–F5 |

Jede Lektion beginnt mit drei Wissenskarten. Die neun Karten enthalten 15 eigene vollständige Noten-/Klangbeispiele samt festem Klaviaturdiagramm und Oktavbeschriftung. Der neue Wissensartikel hat neun Abschnitte und bewahrt die Beispiele; eine eigene Artikel-Leseroute gehört weiterhin zur späteren Wissensbasis.

Die Basskarten erklären F3 auf der vierten Linie von unten, die natürliche Tonfolge und C4 auf der ersten Hilfslinie oberhalb. Die Karten zum großen System verbinden die zwei Schlüssel, vergleichen C4 in beiden Schreibweisen und üben die Zuordnung zur gleichen Taste. Zwei Systeme bedeuten weder genau zwei Stimmen noch eine zwingende Handverteilung. Die verfügbaren Tonbereiche überlappen.

Bei den Oktavnamen gelten C2 = C, C3 = c, C4 = c¹, C5 = c². Wissenschaftliche Namen verwenden in dieser Einheit immer die internationale Buchstabenfolge C–B, auch in der deutschen Oberfläche: deutsches h = B3, h¹ = B4. Die Zahl wechselt bei C. Deutsches B/international B♭ gehört nicht zu diesen Aufgaben ohne Vorzeichen. Helmholtz-Antworten verwenden deutsch h beziehungsweise international b. Ein gleicher Buchstabe in einer anderen Lage bleibt eine garantiert falsche Antwortoption. Die drei neuen Glossarbegriffe sind großes Notensystem (US grand staff/UK grand stave), Helmholtz-Oktavbezeichnung und wissenschaftliche Oktavbezeichnung.

## Darstellung und technische Grenzen

Es bleiben 18 Übungstypen und sechs freie Sätze. `KEY_FIND.presentation: grand-staff` und `NOTE_NAME.presentation: octave-name` erweitern bestehende Typen. Neue Schemaparameter bleiben in der Inhaltsauflösung erhalten; unpassende Parameterkombinationen werden abgewiesen.

`grandStaffExample`/`grandStaffTarget` unterstützen genau zwei Systeme in der Reihenfolge Violin/Bass: keine Vorzeichnung, 4/4, ein Takt mit einer Stimme und einem unpunktierten ganzen Ereignis je System, genau eine natürliche Note und eine ganze Pause. Der Übungsgenerator begrenzt die Quelle auf A3–E4. Weitere Stimmen, mehrere Zielnoten, Vorzeichen, Wechsel oder außerhalb des lesbaren Bereichs liegende Quellen werden nicht als dieses Lernbild interpretiert. Allgemeiner mehrstimmiger Notensatz bleibt Phase 3; `layoutScore` behält seine bisherigen Grenzen.

`layoutGrandStaff` richtet Taktangaben und Taktstriche beider Systeme aus, verbindet sie links und setzt die ganze Taktpause mittig. `GrandStaffView` verwendet denselben SVG-Renderer und Bravura-Font wie bisher, ist in Einführung, Aufgaben und Bausteingalerie integriert und erhält die Themenfarbe. Die App stellt lokalisierte Bildbeschreibungen bereit; vor der Wertung nennen Aufgaben Position und Schlüssel statt des Lösungsnamens. Überbreite Einführungsbeispiele verwenden weiterhin den vorhandenen horizontalen Scrollhinweis. Tasteneingaben behalten ihre vorgegebenen Ausschnitte und die bisherige Bedienung per Tastatur, Maus und Touch.

Der Quellscore bestimmt beim großen System die richtige Taste, die Erklärung, die Markierung und die Variante für eine Fehlerwiederholung. Das Notenbeispiel spielt nur seinen einen tatsächlichen Zielton; die Pause erzeugt keinen zweiten Klang. Bei Oktavnamen bestimmt die geprüfte einzelne Quellnote den gedruckten Ausgangsnamen und die Lösung. Die Notengrafik wird für Namensübersetzungen ausgeblendet. Ein Wechsel des Benennungssystems allein zählt nicht als neue Quellhöhe.

Katalog und Fähigkeitsplan haben Inhaltsversion **12**, Inhalts-Schema und SQLite-Schema weiterhin **1**. Frühere Datensätze behalten ihre Versionen. Gesamtstand: **40 Lektionen, 400 Aufgaben, 115 Karten mit 172 Beispielen und 14 Artikel**. Die bisherigen 37 Stufe-1-Lektionen mit 370 Aufgaben, 106 Karten und 13 Artikeln werden weiterhin separat auf vollständige Abdeckung geprüft. Der Graph bleibt bei 90 Fähigkeiten und 29 Einheiten.

## Prüfung und Übergabe

- Gesamtsuite: **2.096 Tests** (UI 14, Theorie 717, Audio 29, i18n 380, Notation 229, Übungen 265, Inhalt 169, App 237, Werkzeuge 56). Unabhängige Tabellen prüfen die Positionen A3–E4 in beiden Schlüsseln und die C/H/B-Oktavnamen. Quellenmutationen prüfen, dass veraltete Metadaten nicht als Bewertungsorakel dienen; beschädigte oder mehrdeutige Quellen werden abgewiesen.
- Drei neue Lektionen durchlaufen je 100 vollständige Fehler-/Wiederholungsdurchgänge. App-Tests prüfen sämtliche 30 Aufgaben, Version-12-Speicherung, neue Quellhöhe nach einem Fehler und denselben einmal gespielten C4-Ton aus beiden Systemen.
- Typen, Lint, Format, Übersetzungen, Inhalts-/Planprüfung und Deno-Typprüfung mit 75 Smokechecks sind erfolgreich. Deno spielt alle 400 Aufgaben durch und prüft zusätzlich Zehn-Linien-Layout, einzelnen Klang, deutsches h für B3 und die Quelle der Oktavlösung.
- Produktions- und Preview-Webexport sind geprüft. Der öffentliche Bundlecheck findet zwei JavaScript-Dateien ohne unveröffentlichte Inhalts-IDs oder Texte. Alle drei neuen direkten Lektionsaufrufe sind öffentlich gesperrt.
- Chromium: je 30 Aufgaben und 15 Klangbeispiele mit deutscher Tastatur, deutschem Touch bei 390 × 844 im Dunkelmodus mit reduzierter Bewegung, US-Maus und UK-Touch. Frage-/Antwortbeschriftungen und tatsächliche Audioeinsätze stimmen. Alle drei Ergebnisse bleiben nach Neuladen erhalten; keine JS-/React-Fehler. Ein falscher Erstversuch speichert 11/12 und anschließend 1/1 in der Wiederholung.
- Basisvergleich gegen `341ab396500a3db6f46ad843172e0720400b8a65`: 333 alte Katalogdatensätze und sämtliche bisherigen DE/US/UK-Inhaltstexte identisch; 3.700 alte Lektionsdurchgänge mit 37.000 Aufgaben unverändert.

Diese Prüfungen ersetzen keine fachliche Freigabe. Für Claudes getrennten Durchgang sind insbesondere F3-Bezugslinie, C3–C4 im Basssystem, die beiden C4-Hilfslinien, überlappende Systembereiche, die Sprachsysteme H/B und der Wechsel der Oktavnummer bei C zu prüfen. Prüfbibliografie: *Open Music Theory* (Pitch and Pitch Class, Clefs), Ulrich Michels, *dtv-Atlas Musik*, Band 1 (Notation und Tonhöhen), sowie eine Standardreferenz zur Helmholtz- und wissenschaftlichen Tonhöhenbezeichnung. Es wurde kein Literaturabgleich behauptet: Literaturabrufe waren zuletzt vom Cloud-Proxy gesperrt, Claude CLI und zugehörige Zugangsdaten stehen in dieser Umgebung nicht bereit. Echte iOS-/Android-, VoiceOver-/TalkBack- und GitHub-CI-Abnahmen bleiben offen.

Review-Zweig `codex/p2-08-clefs-registers`, Basis `codex/p2-07-complete-level-one`: [GitHub-Vergleich](https://github.com/PhiFa96/harmonia/compare/codex/p2-07-complete-level-one...codex/p2-08-clefs-registers). Kein Merge und kein öffentlicher Inhalts-Release.

**Nächster Schritt:** `notation.l2.spelling` mit Geltungsbereich von Versetzungszeichen, enharmonischer Schreibweise und vollständigen Notenschreibaufgaben. Danach bleiben weitere 14 Stufe-2-Einheiten. Bestehens-/Freischaltregeln gehören zu P2.11/P2.12; sie sind noch nicht implementiert.
