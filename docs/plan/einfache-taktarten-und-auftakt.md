# Einfache Taktarten und Auftakt – sechster Teil von P2.07

Stand: 12.10.2026. `rhythm.l1.simple-meter` ergänzt drei interne Lektionen mit 8/10/12 Aufgaben, neun Wissenskarten, 15 Noten- und Hörbeispielen sowie einem Artikel mit neun Abschnitten in DE/US/UK. Alle neuen Datensätze bleiben `entwurf`. Die separate fachliche Abnahme durch Claude Code steht aus.

## Lernfolge

| Lektion | Aufgaben | Inhalt |
| --- | --- | --- |
| `rhythm.l1.simple-meter.meter` | 4 Taktfragen, 4 Mittippaufgaben: 8 | 2/4, 3/4, 4/4; Zähler/Nenner, neue 1, Viertelnoten auf jedem Schlag |
| `rhythm.l1.simple-meter.count-in` | 2 Taktfragen, 2 Auftaktfragen, 6 Mittippaufgaben: 10 | Voller Einzähltakt, erster Takt kurz oder voll, Viertel und Achtel ohne Pausen |
| `rhythm.l1.simple-meter.read` | 2 Auftaktfragen, 10 Mittippaufgaben: 12 | Notenanfänge bei Vierteln, Achteln und Viertel-/Achtelpausen |

Die Einheit setzt Puls, Notenwerte und Pausen voraus. Sie führt nur 2/4, 3/4 und 4/4 ein. `RHYTHM_TAP.level: quarters` erzeugt einen sichtbaren vollständigen Takt mit einem Viertelnotenanfang pro Schlag. Danach erzeugt `basic` je Schlag eine Viertelnote oder zwei Achtel; im letzten Schritt dürfen Viertel- und Achtelpausen hinzukommen. Punktierung, Haltebögen, Synkopen, zusammengesetzte Takte und mehrstimmige Notation werden hier nicht gelehrt oder bewertet.

Eine Auftaktfrage zeigt genau zwei notierte Takte: Der zweite ist vollständig; die Notendauer vor dem ersten Taktstrich ist kürzer oder genau so lang wie ein voller Takt. Die Antwort folgt aus dem Score mit exakten Brüchen, nicht aus einer gespeicherten `hasPickup`-Angabe. Es gibt explizite Ja- und Nein-Beispiele. Die Screenreader-Beschreibung nennt die Werte vor dem ersten Taktstrich und verrät das Urteil erst nach der Bewertung. Fehlerwiederholungen wechseln die fachliche Antwort. Der Glossarbegriff lautet DE „Auftakt“, US „pickup“, UK „upbeat“.

Wenn die zwei Takte auf einem schmalen Display nicht vollständig Platz haben, weist die Aufgabe auf horizontales Scrollen zum Folgetakt hin. Die erste Notengruppe und der erste Taktstrich bleiben unmittelbar sichtbar.

Bei Mittippaufgaben ertönt wie zuvor ein ganzer Einzähltakt; auf der nächsten 1 beginnt die Aufnahme. Diese Aufgaben enthalten selbst keinen Auftakt. Der Einführungstext trennt diese beiden Situationen ausdrücklich. Die Notenbeispiele sind eigene kurze Übungsmuster bei Viertel = 90. Einige zeigen einen notierten Auftakt als ersten unvollständigen Takt; sie sind ausdrücklich Beispiele für das Lesen, nicht für eine Auftaktaufnahme. Wiedergabe und Score beziehen sich auf dieselben notierten Ereignisse. Tonhöhe G4 dient nur als neutrale Klangquelle.

Die Timingwertung nutzt die bestehende Audio-Uhr und die Grenze aus konfigurierter Toleranz und 40 % des kürzesten Notenabstands. Bei Pausen läuft der Puls weiter, aber ein zusätzlicher Anschlag zählt als Fehler. Erste Wertung, Hinweise und Wiederholung bleiben getrennt gespeichert. Eine Bestehensschwelle mit Freischaltung gehört erst zu P2.11/P2.12.

## Schnittstellen und Grenzen

- `MeterIdentifyParams.presentation: pickup` kennzeichnet die neue Frage, ohne einen achtzehnten Übungstyp einzuführen. Die Antwort-IDs `pickup:yes/no` werden aus der Dauer vor dem ersten Taktstrich abgeleitet. Der Generator akzeptiert nur einfache Vierteltakte und notiert nur unpunktierte Viertel und Achtel. Die alte Taktfrage und alte Seeds behalten ihr Verhalten.
- `RHYTHM_TAP.level: quarters` ist auf 2/4, 3/4 und 4/4 ohne Pausen begrenzt. Es bleibt eine echte Notenbild-/Audio-Aufgabe, anders als `level: pulse` mit Zahlendarstellung.
- Katalog und Fähigkeitsplan steigen auf Version 8. Die drei neuen Lektionen/Sätze, neun Karten und der Artikel tragen Version 8; ältere Datensätze behalten ihre Fassungen. Es gibt intern 19 Lektionen mit 190 Aufgaben beim vollständigen Erstversuch, 52 Karten einschließlich der drei Prototypkarten und sechs Artikel. Schema- und SQLite-Version bleiben 1. Der Freigabefilter liefert weiterhin null Lektionen/Karten/Artikel und keine Entwurfstexte aus.
- Die App erhält keine direkte Theorie-Engine-Abhängigkeit und keine neue native Bibliothek.

## Prüfstand und Übergabe

- **1.837 Tests bestanden:** UI 14, Theorie 717, Audio 29, i18n 260, Notation 215, Übungen 205, Inhalte 134, App 207 und Node-Werkzeuge 56. Typprüfung, Lint/Paketgraph, Formatierung, Übersetzungen, Inhaltskatalog, Fähigkeitsplan und Produktions-Bundlecheck sind grün.
- **Fach- und Regressionstabellen:** 150 Seeds für Auftaktgenerierung mit unabhängiger Addition der Werte vor dem ersten Taktstrich, 150 Vierteltakte, 150 vollständige Fehlerdurchgänge je neuer Lektion, gültige Scores und Einzähltakte, richtige/falsche Antworten und Texte in drei Sprachen. Alle älteren Katalog-, Plan- und Inhaltstextdatensätze stimmen mit dem Basiszweig überein.
- **Deno:** Typprüfung und 60 Laufzeitchecks bestanden, einschließlich drei neuer Prüfungen für Lektionen, Viertelmodus und Auftaktbewertung.
- **Web:** Vorschau und Produktion exportiert; öffentliches Bundle ohne Entwurfs-IDs oder -Texte. Vier Chromium-Durchgänge mit je 30 Aufgaben, 15 Hörbeispielen und drei gespeicherten Ergebnissen nach Neuladen: DE-Tastatur, DE-Telefon-Touch/dunkel/reduzierte Bewegung, US-Maus, UK-Telefon-Touch. Ein falscher Auftakt führte zu 9/10 im Erstversuch und einer neuen Gegenantwort mit 1/1 in der Wiederholung. Drei öffentliche Direktlinks blieben gesperrt. Keine JavaScript- oder React-Fehler. Nach einem schmalen Notenbild wurde die Breitenmessung korrigiert; DE- und UK-Telefon zeigen nun den Scrollhinweis und erlauben den Folgetakt seitlich vollständig zu erreichen.

Für Claude Code: bitte die Definition und Darstellung von Auftakt gegenüber einem vollständigen ersten Takt, die Verwendung von Viertel-/Achtelpausen auf Zählzeiten, die Formulierung „Zähler zählt Viertelwerte“ in diesen drei Taktarten, die DE/US/UK-Terminologie und die didaktische Trennung zwischen Auftaktfrage und Einzähltakt fachlich nach ADR 0005 prüfen. Technische Tabellen ersetzen keine Literaturprüfung. GitHub-CI und echte VoiceOver-/TalkBack- sowie iOS-/Android-Geräteproben bleiben offen.

Review-Zweig: `codex/p2-07-simple-meter-count-in`, gegen `codex/p2-07-note-values-rests` vergleichen. `main` wurde nicht verändert.

Nächstes geplantes Ziel im Stufe-1-Graphen: `intervals.l1.size` mit allgemeiner Intervallgröße, Richtung und Schritt/Sprung. P2.07 bleibt offen; weitere Stufe-1-Einheiten, Stufe 2, Bestehenslogik und spätere Chor-/Orchesterstufen sind Folgearbeit.
