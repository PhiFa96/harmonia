# Notationseinstieg – erster Teil von P2.07

Stand: 09.10.2026. Die erste Notationseinheit aus dem Fähigkeitsgraphen besitzt drei spielbare interne Lektionen, sieben Wissenskarten und einen vierteiligen Grundlagenartikel in Deutsch sowie US-/UK-Englisch. Alle neuen Inhalte bleiben `entwurf`. P2.07 verlangt die vollständige, fachlich freigegebene Stufe 1 und ist mit diesem Einstieg noch nicht abgeschlossen.

## Lektionen und Lernziele

Im Tab „Lernen“ erscheinen nur Einheiten mit tatsächlich ausgelieferten Lektionen. Die Einheit `notation.l1.staff` („Das Notensystem lesen“) hat drei zunehmend längere Durchgänge:

| Lektions-ID | Deutscher Titel | Aufgaben | Einführung | Tonraum |
| --- | --- | --- | --- | --- |
| `notation.l1.staff.anchor` | Den Violinschlüssel lesen | 8 | 3 Karten | F4–H4, international F4–B4 |
| `notation.l1.staff.positions` | Linien und Zwischenräume | 10 | 2 Karten | E4–F5 |
| `notation.l1.staff.reading` | Stammtöne sicher lesen | 12 | 2 Karten | E4–F5 |

Alle 30 Aufgaben sind `NOTE_NAME` im Violinschlüssel ohne Alterationen. Zuerst dient g¹/G4 auf der zweiten Linie von unten als Bezug für F, G, A, H/B. Danach kommen alle fünf Linien und vier Zwischenräume hinzu; zum Schluss werden diese Positionen gemischt gelesen. Gefragt ist der Tonname, noch nicht seine Oktavlage. Hilfslinien, andere Schlüssel, Vorzeichen, Schreib- und Tastaturaufgaben folgen in ihren eigenen Einheiten.

Die Lektionen gehören zu den drei vorhandenen Fähigkeiten `notation.staff`, `notation.treble-clef` und `notation.treble-natural`. Die 90 Fähigkeiten, 29 Einheiten und ihre Voraussetzungen bleiben erhalten. Die neue Auswahl zeigt diese drei Lektionen und den bisherigen Prototyp; sie berechnet noch keinen Fortschritt und keine Freischaltung. Bestehensschwelle und Lernpfad gehören zu P2.12 beziehungsweise P2.11.

## Karten, Artikel und Sprache

Die sieben Karten erklären Systemaufbau, G als Orientierung, Nachbartöne, Linientöne, Zwischenräume, wiederkehrende Buchstabennamen und eine Leseroutine. Jede besitzt ein eigenes validiertes Notenbeispiel und ausdrücklich gestarteten Klang. Die Beispiele enthalten ein, vier, fünf, acht oder neun Töne. Deutsche Namen verwenden H; die englischen Fassungen verwenden B und wissenschaftliche Oktavzahlen. Fachbegriffe kommen aus dem Glossar, einschließlich des neuen Eintrags `naturalNote` („Stammton“/„natural note“).

`notation.l1.staff.article` bereitet vier Abschnitte mit Notenbeispielen für die spätere Tutor-Wissensbasis vor. Er erläutert System, Schlüsselreferenz, Tonfolge und Lesen. Der Artikel ist als Inhaltsdatensatz vorhanden; eine Artikel-Leseansicht und die Tutor-Anbindung werden hier noch nicht implementiert. Texte und Beispiele sind selbst verfasst.

Katalog, öffentlicher Katalog und Fähigkeitsplan steigen auf `contentVersion: 3`; das Format bleibt `schemaVersion: 1`. Neue Karten, Sätze, Lektionen und Artikel haben Version 3. `fundament.reading-and-listening.1` behält Version 1 und zehn Aufgaben. Die öffentlichen Dateien enthalten weiterhin keine freigegebene Lektion, Karte oder Artikel. Technische Prüfungen setzen keine fachliche Freigabe.

## Auswahl, Ablauf und Ergebnisse

Die Auswahl übergibt die stabile Lektions-ID an `/lesson?id=…`; der Spieler löst sie ausschließlich aus dem für seine Build-Variante ausgelieferten Katalog auf. Ein unbekannter, leerer oder mehrfach angegebener Wert startet keine Ersatzlektion. Ein Aufruf ohne ID erhält den bisherigen Einstieg. Ein ID-/Versionswechsel setzt Einführung, Antwort und Sitzung zurück und beendet laufende Beispielklänge.

Jede Lektion nutzt den vorhandenen Aufgabenablauf mit Hinweisen, gesperrter Erstwertung, neuen Notenbildern für Fehler und getrennter Wiederholungsstatistik. Drei unterschiedlich lange Versuche lassen sich unabhängig abschließen. Unter jeder Lektion erscheint ausschließlich ihr eigener letzter Durchgang. Der SQLite-Payload bewahrt ID, Version, Parameter, generierte Aufgaben, Antworten und beide Runden; Datenbankversion bleibt 1. Paket-Abhängigkeiten und Lockfile bleiben unverändert.

Die Auswahl und Einführung verwenden die vorhandenen Karten, Schriftstufen, Farben und Knöpfe. Längere Notenbilder lassen sich horizontal lesen; ein Hinweis erscheint nur bei tatsächlich überbreitem Inhalt. Im Web ist dieser Ausschnitt dann per Tastatur erreichbar. Neue Karten beginnen beim linken Rand. Klang wird weder beim Öffnen noch automatisch während Aufgaben gestartet.

## Vollständige Klangbeispiele

Die bisherige Einführung entnahm einem Beispiel höchstens zwei Töne und spielte dafür einen kurzen Ton beziehungsweise ein Intervall. Das hätte längere Kartenbeispiele abgeschnitten und Notenwerte ignoriert. Die Einführung zeichnet und spielt jetzt dieselbe vollständige Partitur bei angezeigten ♩ = 90.

Die reine Funktion `scoreTimeline` in `@harmonia/notation` prüft den Score und berechnet Einsätze und Dauern mit exakten Brüchen. Pausen, Punktierung, Triolen, Akkorde, Stimmen und fortgesetzte Haltebögen bleiben in der Zeitfolge erhalten. Parallele Stimmen beginnen am selben Taktanfang; Haltebögen erzeugen keinen neuen Anschlag. Erst am Audio-Rand werden Sekunden verwendet. Das ist eine Wiedergabehilfe; es ergänzt keinen mehrstimmigen Tonsatz-Bewerter oder zusätzlichen Notationsrenderer.

`playExample` in der App plant alle Töne auf der Audio-Uhr, berücksichtigt Stille am Ende und die Ausklingzeiten und stoppt ausschließlich die eigenen Stimmen. Fehler bei der Planung räumen bereits angelegte Stimmen auf. Karten-/Routenwechsel, Aufgabenstart und App-Hintergrund verwenden den vorhandenen Abbruchschutz; eine verspätete Audio-Freigabe startet dann keinen Klang.

## Prüfstand

- **35 zusätzliche Tests:** sechs Inhaltsfälle, zwei reine Zeitfolgenfälle, acht Audiofälle, elf App-Abläufe, ein echter SQLite-Fall, drei öffentliche Direktlinkfälle, eine unabhängige Notenbeispieltabelle und drei Glossarfälle.
- Jede der drei Lektionen durchläuft 150 Seeds: reproduzierbarer Umfang und Tonraum, keine Alteration, zunächst falsche Antworten mit Hinweis und anschließend richtige neue Wiederholungen. Die sieben Beispiele werden gegen fest ausgeschriebene Tonfolgen und die Engine-Prüfung abgeglichen.
- Audiofälle prüfen sämtliche Töne, echte Dauern, Pausen, gebundene Noten/Akkorde, parallele Stimmen, Auftakt, Taktwechsel, Triolen, eigenen Stopp und Aufräumen nach Fehlern. App-Fälle prüfen alle 30 Antworten, einen ID-Wechsel in derselben Route und verspätete Audio-Freigabe nach Kartenwechsel.
- **1.671 Tests bestanden**; nach der Ergänzung des Scrollhinweises die App-Suite erneut geprüft. Lint, Typen, Formatierung, Übersetzungen, Inhaltsdaten und Fähigkeitsplan bestanden. Frozen-Lockfile-Installation erfolgreich; keine neue Abhängigkeit. Deno-Typprüfung und **44 Laufzeitprüfungen** bestanden.
- Preview und Production als Web-Export gebaut. Der tatsächliche öffentliche Export besteht die Bundleprüfung auf unveröffentlichte IDs und Texte.
- Chromium: alle drei Lektionen mit insgesamt 30 Aufgaben je Durchgang auf deutscher Desktop-Tastatur, deutschem Telefon-Touch im Dunkelmodus mit reduzierter Bewegung, US-Maus und UK-Telefon-Touch. Gespeicherte Ergebnisse bleiben nach Neuladen getrennt erhalten. Vollständige Kartenklänge samt Einsätzen und Stopp geprüft, außerdem der Scrollhinweis und die letzten Noten per Tastatur erreichbar. Eine zusätzliche Fehlerprobe bewahrt 7/8 im Erstversuch und 1/1 in der Wiederholung. Alle drei Entwurfs-Direktlinks bleiben im Produktions-Export gesperrt; Rückweg und freies Üben sind erreichbar. Auswahl und Notenbeispiele visuell kontrolliert; keine Browserfehler.

Der vorhandene Engine-Vergleich gegen `tonal` läuft in der Gesamtprüfung mit. Claudes zweiter Prüfdurchgang in frischem Kontext und Literaturabgleich nach [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md) bleiben offen, ebenso GitHub-CI und echte iOS-/Android-Prüfungen mit VoiceOver/TalkBack. Browserprüfungen ersetzen diese Abnahmen nicht.

## Übergabe und Fortsetzung

Review-Zweig: `codex/p2-07-notation-start`, Basis `codex/p2-06-knowledge` bei `ff3d896`. Dieser Vorgänger und die davorliegenden Akkord-/Rhythmuszweige waren zum Prüfzeitpunkt noch nicht in `main`. Gegen den Wissenszweig prüfen; ein Merge nach `main` ist nicht Teil dieser Umsetzung.

Der Review-Zweig ist gepusht; Implementierungscommit `c22732a`. Die automatische Draft-PR-Erstellung scheitert am Cloud-Zugriff auf `https://api.github.com/graphql` mit `Forbidden`; es wurde kein PR angelegt. [Änderungen gegen den Wissens-Vorgänger vergleichen](https://github.com/PhiFa96/harmonia/compare/codex/p2-06-knowledge...codex/p2-07-notation-start).

Für Claude Code: zuerst die neue erste Einheit und vollständigen Beispielklänge prüfen, dann die nächste Notationseinheit `notation.l1.keyboard` mit Tastenordnung, Halb-/Ganzton und einfachen Vorzeichen ausarbeiten. Anschließend folgen Register/Hilfslinien, weitere Notation und die übrigen Stufe-1-Bereiche. Alle neuen Inhalte brauchen den getrennten fachlichen Prüfdurchgang vor `freigegeben`. Die vollständige Stufe 1, Stufe 2, Bestehenslogik und spätere Chor-/Orchester- und Tonsatzstufen bleiben weitere Arbeitsschritte.
