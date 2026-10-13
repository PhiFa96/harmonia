# Puls, Tempo und Zählgruppen – vierter Teil von P2.07

Stand: 12.10.2026. Die erste Rhythmuseinheit `rhythm.l1.pulse` ergänzt drei interne Lektionen mit 8/10/12 Aufgaben, acht Wissenskarten, dreizehn Klickbeispiele und einen fünfteiligen Artikelentwurf in DE/US/UK. Alle neuen Inhalte bleiben `entwurf`; Claudes separate fachliche Abnahme ist offen.

## Bedienbarer Inhalt

Im Tab „Lernen“ sind die drei Lektionen unter „Puls, Tempo und Zählzeiten“ auswählbar. Jede beginnt mit eigenen Einführungskarten und stillen Zahlengruppen. Das Klangbeispiel startet ausdrücklich und spielt zwei Gruppen mit betonter 1. Beispiele derselben Gruppe mit unterschiedlichem Tempo lassen sich umschalten. Anschließend folgen vier Begriffsfragen und die eigentlichen Tippaufgaben.

| ID | Lernziel | Aufgaben | Einführung | Vorgaben für das Mittippen |
| --- | --- | --- | --- | --- |
| `rhythm.l1.pulse.steady` | Gleichmäßigen Puls halten, Rhythmus, Metronom und Einzählen unterscheiden | 4 `KNOWLEDGE_MC` + 4 `RHYTHM_TAP` | 3 Karten | Drei oder vier Schläge, 72 BPM |
| `rhythm.l1.pulse.tempo` | Tempo, BPM sowie kürzere und längere Klickabstände verstehen | 4 `KNOWLEDGE_MC` + 6 `RHYTHM_TAP` | 3 Karten | Zwei, drei oder vier Schläge, 60/90/120 BPM |
| `rhythm.l1.pulse.groups` | Zweier-, Dreier- und Vierergruppen mit betonter 1 zählen | 4 `KNOWLEDGE_MC` + 8 `RHYTHM_TAP` | 2 Karten | Zwei, drei oder vier Schläge, 72/96/108 BPM |

`rhythm.pulse` hat keine Voraussetzung. `rhythm.tempo` und `rhythm.beat-group` setzen ausschließlich den Puls voraus. Deshalb zeigt dieser Einstieg keine Taktangaben oder Notenwerte. Die Zahlen sind Zählpositionen; sie verlangen kein Notenlesen. Klangbeispiele und Aufnahmen halten innerhalb eines Durchgangs gleiche Abstände. Die Betonung verändert die Schlagdauer nicht.

Puls und Rhythmus werden begrifflich unterschieden: der gleichmäßige Grundschlag ist der Bezug, eine Klang-/Pausenfolge kann andere Dauern haben. Diese Einheit übt ausschließlich einen Anschlag pro Klick. Unterteilungen, Notenwerte und Pausenmuster werden hier noch nicht bewertet. Der Tempowert zählt die tatsächlichen Klicks pro Minute; ein Abstand dauert `60/BPM` Sekunden. Zahlen wie 60 und 120 werden durch hörbare Beispiele mit einer beziehungsweise einer halben Sekunde Abstand erklärt.

## Aufnahme, Rückmeldung und Wiederholung

„Einzählen und aufnehmen“ plant eine vollständige Einzählgruppe und eine ebenso lange Aufnahmegruppe. Ab der nächsten betonten 1 wird jeder Klick einmal getippt. Die große Tippfläche ist beim Einzählen gesperrt, während der Aufnahme aktiv und nach einer Erstwertung wieder gesperrt. Eingabe erfolgt beim Anschlagbeginn über Pointer-Down, native Press-In, Leertaste/Enter oder assistive Aktivierung. Gedrückthalten zählt einmal.

Prüfen wird erst nach dem vollständigen Take freigegeben. „Neu aufnehmen“ verwirft einen ungewerteten Take; Abbruch erzeugt keine Antwort. Fehlende und zusätzliche Anschläge sowie Abweichungen außerhalb des inklusiven Fensters von ±160 ms sind falsch. Rückmeldung zeigt Sollzeiten und rohe Abweichungen pro Schlag. Der bestehende Abgleich, die Audio-Uhr und Berücksichtigung gemeldeter Latenz werden weiterverwendet; die Statusanzeige ist kein präziser Timing-Zeiger.

Die Texte sprechen hier von Klicks und Schlägen, einschließlich eigener Hinweise, zugänglicher Bildbeschreibung, Toleranztext und Trefferrückmeldung. Sie verlangen keine Kenntnisse über Viertel, Notenanfänge oder Pausen. Lösungsvorschau und Karten spielen im Pulsmodus nur zwei Klickgruppen; der zusätzliche Lösungston des bestehenden Notenrhythmus entfällt.

Fehler erhalten eine andere Gruppengröße in der Wiederholung. Ein bloßer Tempowechsel zählt weiterhin nicht als neue fachliche Variante. Erstversuch, Hinweise, Wiederholung und ungelöste Fehler bleiben getrennt. „Gerade nicht hören“ überspringt die noch offenen Tippaufgaben; Begriffsfragen bleiben beantwortbar. Unterstützung oder Überspringen gilt nicht als nachgewiesenes selbstständiges Rhythmuslösen. Eine verbindliche Bestehens- und Freischaltlogik ist weiter als P2.11/P2.12 geplant.

## Daten, Schnittstelle und Gestaltung

- `RhythmParams.level` akzeptiert zusätzlich `'pulse'`. Dieser Modus ist auf `RHYTHM_TAP` in 2/4, 3/4 und 4/4 begrenzt; `rests: true` und dreigeteilte Grundschläge werden zurückgewiesen. Intern bleibt der tatsächliche Score die Quelle der Anschlagzeiten. Generierte Aufgaben tragen `presentation: 'pulse'`; bisherige Standard-/Punktierungsaufgaben behalten ihr Verhalten.
- `pulseExample(score, bpm)` prüft ein System, einen vollständigen Takt und eine Stimme mit gleichmäßigen Vierteln in einer Zwei-/Drei-/Vierergruppe. Pausen, Akkorde, Haltebögen, Wechsel am Taktanfang, zusätzliche Takte oder BPM außerhalb 60–120 sind ausgeschlossen. Die Oberfläche zeigt nur die Zahlen. Der Parser und die Inhaltspipeline prüfen daneben die tatsächliche Score-Struktur.
- Optionales `example.pulse: { bpm }` legt das Beispieltempo fest und schließt `keyboard` aus. Die injizierte `ContentChecks.validateScore` erhält Pulsmetadaten als drittes Argument. Derselbe Prüfer wird in Inhaltsproduktion und Pipeline-Tests verwendet. Bestehende Beispiele ohne Metadaten bleiben gültig.
- `PulseExample` verwendet vorhandene Schrift-, Abstand-, Radius-, Farb- und Touch-Tokens. Nummern zeigen alle Positionen; die erste ist zusätzlich durch Rand und Hervorhebung kenntlich. Es gibt keine Timing-Animation. Der Baustein steht in der Entwicklungsgalerie; Zahlen, Gruppengröße und BPM sind für Screenreader beschrieben.
- Die Wissensbank ergänzt zwölf Begriffe in den Themen `pulse`, `tempo` und `beatGroup`: insgesamt 61 Begriffe in zehn Themen. Der freie Wissenssatz behält seine bisherigen sechs Themen mit 45 Begriffen. Neue Glossareinträge sind `pulse`, `metronome`, `countIn`, `beatsPerMinute` und `beatGroup`; US-/UK-Fachbegriffe verwenden weiterhin Glossar-Fallbacks.

`rhythm.l1.pulse.article` enthält fünf Abschnitte über Grundschlag, Klangfolge, Tempo, Einzählen und Zählgruppen. Er bleibt ein Datensatz für die spätere Wissensbasis; Leseroute und Tutor-Anbindung sind noch offen. Texte und Beispiele sind eigenständig verfasst. Die getrennte Prüfung gegen Fachliteratur steht aus; technische Tabellen sind kein Ersatz dafür.

Katalog und Fähigkeitsplan haben Version 6; die neuen Karten, Sätze, Lektionen und der Artikel ebenfalls. Die bisherigen Lektionen behalten Version 1, 3, 4 und 5. Schemaformat und SQLite-Datenbank bleiben Version 1. Sprachneutrale Antworten bleiben `taps:<Millisekunden>` beziehungsweise Wissens-IDs; die komplette Aufgabe samt Pulsdarstellung, Rohzeiten und Hilfen wird gespeichert.

Intern sind jetzt 13 Lektionen mit insgesamt 130 Aufgaben pro vollständigem Erstversuch auswählbar. Die vier Einheiten besitzen 31 neue Karten und vier Artikel; mit den Prototypkarten sind es 34 Karten insgesamt. Der öffentliche Katalog enthält weiterhin keine ungeprüfte Lektion, Karte oder Artikel. Es gibt keine neuen Abhängigkeiten oder nativen Projektdateien.

## Prüfstand und nächste Arbeit

- **49 zusätzliche Tests:** 13 im Übungskern einschließlich der drei neuen Wissensbanken, 15 Glossarprüfungen, sechs Inhaltsfälle, 13 App-/SQLite-/Freigabefälle und zwei Pipelineprüfungen. Pulsaufgaben durchlaufen 150 Seeds mit voller Taktfüllung und anderer Gruppengröße bei Fehlern; jede neue Lektion durchläuft weitere 150 Seeds mit allen falsch beantworteten Aufgaben und vollständiger neuer Wiederholung. Feste Tabellen prüfen 2/3/4 Schläge bei 60/90/120 BPM und die dreizehn verfassten Beispiele unabhängig. Fehlende/zusätzliche Anschläge, inklusive Timing-Grenzen, Pausen-/Haltebogen-/Taktwechselverbote und strenge Metadaten werden geprüft.
- **Gesamtprüfung: 1.791 Tests bestanden:** UI 14, Theorie 717, Audio 29, i18n 254, Notation 211, Übungen 193, Inhalte 124, App 194 und Node-Werkzeuge 55. Lint, Typen, Formatierung, Übersetzungen, Inhaltskatalog und Fähigkeitsplan bestanden. Keine Abhängigkeit und kein Lockfile geändert.
- **Deno:** Typprüfung und 53 Laufzeitprüfungen bestanden, einschließlich Pulsbeispiel, Generator und neuer Lektionslängen.
- **Interner und öffentlicher Web-Export:** bestanden. Der tatsächliche öffentliche Export enthält keine Entwurfs-Katalogdaten oder Inhaltstexte; drei neue direkte Lektions-IDs sind zurückgewiesen. Der vorhandene freie Rhythmussatz bleibt mit seinem Notenbild erreichbar.
- **Chromium-Bedienprüfung:** vier Durchgänge mit jeweils allen 30 Aufgaben und dreizehn Klickbeispielen: DE-Desktop-Tastatur, DE-Telefon-Touch/dunkel/reduzierte Bewegung, US-Maus und UK-Telefon-Touch. Tatsächliche Audio-Uhr, gleichmäßige Klickabstände, Tastaturwiederholungsunterdrückung, gesperrtes Einzählen/Prüfen bis Aufnahmeende, zusätzliche Anschläge und Audio-Stoppen geprüft. Alle drei Ergebnisse sind nach Neuladen separat vorhanden. Zusätzliche Touch-Fehlerprobe: Erstversuch 7/8 und richtige Wiederholung 1/1 mit anderer Zählgruppe. Der finale Telefonexport wurde außerdem mit beiden Pulshinweisen, Abbruch ohne Antwort, vollständig leerem Take als Fehler, der Lösungsvorschau mit exakt zwei Klickgruppen und bisherigen Klaviatur-/Prototypkarten geprüft. Keine JavaScriptfehler oder React-Warnungen; ausschließlich das bekannte fehlende `favicon.ico` (404) wird separat erfasst.

Claudes getrennte fachliche Abnahme nach [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md), GitHub-CI vor dem Merge, VoiceOver/TalkBack und echte iOS-/Android-Geräteproben bleiben offen. Browser-Automation und gemeldete Latenz ersetzen keine körperliche Bedien- und Hörprobe durch Testpersonen.

Review-Zweig: `codex/p2-07-pulse-tempo`, auf dem gepushten Registerstand `213a2ea` aufgebaut. Feature-Commit `808699b` ist gepusht. `main` bleibt unverändert; der fachliche Review erfolgt gesondert.

Die Draft-PR-Erstellung gegen `codex/p2-07-register-ledger-lines` wurde versucht und ist am GitHub-API-Zugriff gescheitert: `Post "https://api.github.com/graphql": Forbidden`. HTTPS-Git-Zugriff und Push funktionieren; es wurde kein PR angelegt. Der [Vergleich für Claude Code](https://github.com/PhiFa96/harmonia/compare/codex/p2-07-register-ledger-lines...codex/p2-07-pulse-tempo) zeigt ausschließlich diesen Ausbau gegenüber dem vorherigen Review-Zweig.

Für Claude Code: Definitionen von Puls/Rhythmus, BPM-Bezug, betonte 1 und den Einstieg ohne Notenlese-Voraussetzung fachlich prüfen. Danach folgt gemäß Fähigkeitsplan `rhythm.l1.values` mit Notenwerten, Pausen, Taktfüllung und Taktstrichen. Alle vier Einheiten brauchen vor `freigegeben` den separaten fachlichen Prüfdurchgang. Vollständige Stufe 1, Stufe 2, Bestehens-/Freischaltlogik sowie spätere Chor-, Orchester- und mehrstimmige Tonsatzstufen bleiben Folgearbeit; P2.07 ist nicht abgeschlossen.

Fortsetzung 12.10.2026: [Notenwerte und Pausen](notenwerte-und-pausen.md) ergänzt die fünfte Einheit mit drei Lektionen, neun Karten und 15 vollständigen Hörbeispielen. Katalog/Plan Version 7, 16 interne Lektionen; alle bleiben Entwurf. Die obigen Prüfzahlen dokumentieren den vorherigen Stand.
