# Stufe 1 – vollständige interne Umsetzung von P2.07

Stand: 12.10.2026. Alle 13 geplanten Stufe-1-Einheiten einschließlich des Prototyps sind intern mit Lektionen, Wissenskarten und Artikeln abgedeckt. Die zwölf eigentlichen Stufe-1-Einheiten haben jeweils drei Lektionen mit 8/10/12 Aufgaben. Zusammen mit dem Prototyp gibt es **37 Lektionen, 370 Aufgaben pro vollständigem Erstversuch, 106 Karten mit 157 Noten-/Klangbeispielen und 13 Artikel**. Alle 40 geplanten Stufe-1-Fähigkeiten besitzen Lern- und Wissensinhalte. Katalog und Plan haben Inhaltsversion 11; Schema- und SQLite-Version bleiben 1.

Die technische Umsetzung ist vollständig. **P2.07 ist nach seiner Definition of Done noch nicht fachlich abgeschlossen:** [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md) verlangt „für Lerninhalte und den Testkatalog: ein zweiter, getrennter Prüfdurchgang in frischem Kontext, bevor ein Inhalt `freigegeben` wird“. Claude Code ist in dieser Umgebung weder als Kommando noch als Dienst verfügbar. Es gibt keine erfundene Abnahme oder öffentliche Freigabe; alle Inhalte bleiben `entwurf`.

## Abdeckung

| Einheit | Lektionen | Aufgaben | Artikel |
| --- | ---: | ---: | --- |
| `fundament.reading-and-listening` | 1 | 10 | Grundlagen aus den bestehenden drei Einführungskarten |
| `notation.l1.staff` | 3 | 30 | Notensystem und Violinschlüssel |
| `notation.l1.keyboard` | 3 | 30 | Klaviatur, Halb-/Ganzton und Vorzeichen |
| `notation.l1.register` | 3 | 30 | Oktavlagen und Hilfslinien |
| `rhythm.l1.pulse` | 3 | 30 | Puls, Tempo und Zählgruppen |
| `rhythm.l1.values` | 3 | 30 | Notenwerte, Pausen und Taktfüllung |
| `rhythm.l1.simple-meter` | 3 | 30 | Einfache Takte, Einzählen und Auftakt |
| `intervals.l1.size` | 3 | 30 | Nummer, Richtung, Wiederholung/Schritt/Sprung |
| `intervals.l1.first-qualities` | 3 | 30 | Halbtonabstände, Terzen und reine Intervalle |
| `aural.l1.pulse-rhythm` | 3 | 30 | Pulsgruppen, Rhythmusvergleich und Notenbildauswahl |
| `aural.l1.pitch-intervals` | 3 | 30 | Tonrichtung, Tonfolgen und erste Hörintervalle |
| `history.l1.sources` | 3 | 30 | Klangquellen, Dokumenttypen und Kontext |
| `history.l1.overview` | 3 | 30 | Europäische Epochen, Besetzung und Hörbeobachtung |

Die letzten vier Einheiten ergänzen zwölf Lektionen mit 120 Aufgaben, 36 Karten, 46 eigenen vollständigen Beispielen und vier Artikeln in DE/US/UK. Ein fünfter neuer Artikeldatensatz fasst die vorhandenen Prototypkarten zusammen. Ältere Datensätze und Inhaltstexte behalten ihre Fassungen.

## Gehörbildung

`aural.l1.pulse-rhythm.pulse/compare/choice` übt gleichmäßige, eindeutig markierte Pulsgruppen, gleiche/verschiedene Rhythmen und die Zuordnung eines gehörten Viertel-Achtel-Rhythmus zu drei Notenbildern. Tondauern und Pausen zählen zum Vergleich; eine gleiche Anzahl von Tonanfängen allein genügt nicht. Die Rhythmuskandidaten verwenden dieselbe Tonhöhe und werden auf die tatsächliche Kartenbreite angepasst.

`aural.l1.pitch-intervals.direction/melodies/intervals` fragt höher/tiefer/gleich, genaue viergliedrige Tonfolgen und aufwärts gespielte kleine/große Terzen sowie reine Quarten/Quinten. Die letzte Lektion nutzt den bisherigen Intervallgenerator. Alle Tonhöhen sind natürlich; absolutes Gehör und Hörintervallerkennung abwärts werden nicht vorausgesetzt.

`LISTENING_CHOICE` ist der 18. Übungstyp. Quellen sind vollständige Scores, Antworten sprachneutrale IDs; gespeicherte Zielantworten ersetzen keine Berechnung. `listeningAnswer` wertet die Klangquellen aus, `listeningTimeline` erhält Einsätze, Pausen und Dauern. A/B-Beispiele werden gemeinsam mit 0,75 Sekunden Trennpause geplant; Pulsgruppen schließen direkt aneinander an. Die App spielt erst auf Anforderung, prüft Hörfragen erst nach begonnenem Audio oder einem Lösungshinweis und stoppt ihre eigenen Stimmen beim Prüfen, Wechseln oder Verlassen. Hörpause erzeugt übersprungene Aufgaben und keine erfundenen Erfolge.

Vor der Wertung bleiben die Klangquellen verborgen, außer den ausdrücklich angebotenen Rhythmus-Notenbildern. Nach der Wertung oder Hinweis 3 dienen die Quellen als Kontrolle. Screenreader erhalten die Frage und bei sichtbaren Kandidaten Beschreibungen der tatsächlichen Notation. Wiederholungen ändern bei den neuen Hörfragen Quelle und fachliche Antwort.

## Musikkunde und Geschichte

`history.l1.sources.sound/documents/context` trennt Klangerzeugung durch Stimme, Instrument und elektronische Mittel vom Wiedergabemedium Aufnahme. Eine Aufnahme kann mehrere Quellen enthalten. Notentext, Aufnahme, Bericht und Programmzettel werden nach ihren verschiedenen Aussagen und Grenzen eingeordnet. Ort, Zeit, Anlass und Urheberschaft beantworten eigene Fragen; Kompositions-, Aufführungs- und Aufnahmedatum dürfen verschieden sein.

`history.l1.overview.periods/genre/observation` ordnet die grobe europäische Kunstmusikfolge Mittelalter–Renaissance–Barock–Klassik–Romantik–Musik seit 1900. Die Zeitspannen sind Orientierungen mit Überschneidungen, keine universalen oder starren Grenzen. Diese Übersicht repräsentiert nicht die gesamte Musikgeschichte der Welt. Gattung, Besetzung, Anlass und Funktion werden unterschieden. Hörbeobachtungen beziehen sich auf direkt hörbare Klänge; Datums- und Ortsbehauptungen brauchen zusätzliche Quellen.

Sechs Wissensgebiete ergänzen 26 Begriffe: `soundSources`, `sourceTypes`, `context`, `periods`, `genreContext`, `evidence`. `ORDER` kann die sechs Epochen in der üblichen groben Folge ordnen. `KNOWLEDGE_MC` und `MATCH` verwenden dieselben Fachdaten und eindeutigen Definitionen. Mit den bisherigen Daten gibt es 99 Wissensbegriffe in 18 Themen; die sechs freien Sätze behalten ihre bisherige Auswahl. 25 Glossareinträge ergänzen die Fachbegriffe, einschließlich program (US)/programme (UK) und der üblichen Großschreibung englischer Epochennamen.

Alle Klangbeispiele sind eigene Klavier-Lehrmodelle. Fiktive Programme und Kontextangaben sind als fiktiv bezeichnet. Aus den Modellen werden weder historische Herkunft noch eine echte Singstimme, ein Chor oder eine Instrumentenbesetzung abgeleitet. Die Modelle dienen zum Noten-/Klangvergleich und zur Quellenkritik. Echte historische Hörquellen, umfangreiche Werkgeschichten und weiterführende Musiktraditionen bleiben späteren Inhalten vorbehalten.

## Prüfstand

- `pnpm test`: 2.053 Tests erfolgreich (UI 14, Theorie 717, Audio 29, i18n 371, Notation 215, Übungen 255, Inhalt 164, App 232, Werkzeuge 56). Der App-Test für alle zwölf neuen Lektionen bestand nach der Größenkorrektur nochmals mit 15 Fällen. Die erste i18n-Prüfung erwartete die neue US/UK-Glossarabweichung noch nicht; die explizite Erwartungsliste wurde um `programmeSource` (US program/UK programme) ergänzt.
- Typprüfung, Lint, Format-, Übersetzungs-, Inhalts- und Planprüfung erfolgreich. Deno-Typprüfung und 71 Smokechecks erfolgreich, einschließlich aller 370 Aufgaben in einem vollständigen Stufe-1-Durchlauf.
- Produktions- und Preview-Webexport erfolgreich. Der öffentliche Bundlecheck bestätigt zwei JavaScript-Dateien ohne unveröffentlichte Katalog-IDs oder Inhaltstexte. Alle zwölf neuen direkten Lektionsaufrufe im Produktions-Export zeigen keine Entwurfsaufgaben.
- Chromium: je 120 Aufgaben und 46 Klangbeispiele mit deutscher Tastatur, deutschem Touch bei 390 × 844 im Dunkelmodus mit reduzierter Bewegung, US-Maus und UK-Touch. Alle zwölf Ergebnisse bleiben nach Neuladen erhalten; Fragen, Antwort-/Notationslabels und tatsächliche Audioeinsätze stimmen. Keine JS-/React-Fehler in den vollständigen Durchläufen.
- Falsche Tonrichtung: 7/8 im Erstversuch und 1/1 mit einer anderen Richtungsantwort in der Wiederholung gespeichert. Hörpause speichert acht übersprungene Aufgaben ohne erfundene Wertungen. Ein im Browser gefundener Beschnitt der Rhythmuskandidaten wurde durch Anpassung an die Kartenbreite behoben und auf dem Handy visuell geprüft. Die Touch-Automation wartet auf stabile, sichtbar positionierte Bedienelemente, damit Tab-Leiste und laufende Scrollbewegung keinen falschen Testklick erzeugen.

Bereits geprüft: alle 40 geplanten Stufe-1-Fähigkeiten besitzen Lektionen/Karten/Artikel; zwölf neue Lektionen bestehen je 100 vollständige Fehler- und Wiederholungsdurchgänge; sechs Hörformen bestehen je 200 reproduzierbare Seeds sowie unabhängige Quellen-/Zeittabellen. Hörpause, Speicherung, Audio-Stopp und Gegenantworten in Wiederholungen sind im App-Spieler geprüft. Deno spielt alle 370 Aufgaben durch.

Der Basisvergleich gegen `e05af8d3f3e99f9413b36d01106eb54767d8a246` bestätigt 268 identische alte Katalogdatensätze, unveränderte bisherige DE/US/UK-Inhaltstexte und 2.500 identische alte Lektionsdurchgänge mit 25.000 Aufgaben. Die öffentlichen Daten bleiben leer; Artikel sind Datensätze für die spätere Wissensbasis, noch keine separate Leseroute.

## Fachliche Abnahme und Quellen

Für den getrennten Claude-Durchgang sind besonders zu prüfen: eindeutige Pulsgrenzen, Rhythmusgleichheit mit Dauern/Pausen, exakte Melodiegleichheit, Tonrichtung und vier Hörintervalle; anschließend Klangerzeugung versus Medium, Aussagegrenzen der vier Dokumenttypen, Kontextkategorien, ungefähre Epochenbereiche, Gattung/Besetzung/Funktion und die Trennung von Beobachtung und Schlussfolgerung. Die bisherigen acht Einheiten müssen ebenfalls nach ihren Übergaben fachlich abgenommen werden. Technische Tabellen ersetzen diesen Durchgang nicht.

Literatur für diese Abnahme, ohne übernommenen Originaltext:

- [Open Music Theory](https://viva.pressbooks.pub/openmusictheory/): Notenwerte, Puls/Rhythmus, Intervalle und Gehörbildung.
- J. Peter Burkholder, Donald J. Grout, Claude V. Palisca: *A History of Western Music*, W. W. Norton: Epochenübersicht und historische Kontexte.
- Ulrich Michels: *dtv-Atlas Musik*, Band 2: *Geschichtlicher Teil*: zusätzliche Perspektive auf europäische Epochen und ihre Grenzen.
- *Grove Music Online*, Oxford Music: Begriffe, Gattungen und quellenbezogene Werk-/Aufführungsgeschichte.

Diese Liste ist eine Prüfbibliografie, kein behaupteter Literaturabgleich dieser Sitzung. Die Abrufe von Open Music Theory und der Norton-Verlagsseite wurden vom Umgebungsproxy mit 403 zurückgewiesen. Dafür sind die vorgesehenen Literaturzugänge oder eine zugängliche Ausgabe erforderlich. Claude Code wurde als Prüfer nicht ausgeführt. GitHub-CI und echte iOS-/Android-/VoiceOver-/TalkBack-Prüfungen bleiben zusätzlich offen; Browseremulation und native Jest-Tests ersetzen keine Geräteabnahme.

Review-Zweig: `codex/p2-07-complete-level-one`, Basis `codex/p2-07-first-interval-qualities`: [GitHub-Vergleich](https://github.com/PhiFa96/harmonia/compare/codex/p2-07-first-interval-qualities...codex/p2-07-complete-level-one). Git-HTTPS-Push ist erfolgreich. Die Erstellung eines Draft-PR über `gh pr create` scheitert am GraphQL-POST mit `Forbidden`; es wurde kein PR erstellt. Kein Merge oder öffentlicher Inhalts-Release. Bestehens-/Freischaltregeln gehören weiterhin zu P2.11/P2.12; sie sind kein bereits umgesetzter Bestandteil der Stufe-1-Inhalte.
