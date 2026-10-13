# Erste Intervallqualitäten – achter Teil von P2.07

Stand: 12.10.2026. `intervals.l1.first-qualities` ergänzt drei interne Lektionen mit 8/10/12 Aufgaben, neun Wissenskarten, 15 Noten-/Klaviatur-/Hörbeispielen und einem neunabschnittigen Artikel in DE/US/UK. Alle neuen Datensätze bleiben `entwurf`; Claudes separate fachliche Abnahme steht aus.

## Lernfolge

| Lektion | Aufgaben | Einführung |
| --- | --- | --- |
| `intervals.l1.first-qualities.distance` | 4 kurze und 4 größere Halbtonabstände: 8 | Start bei 0, jede Taste mitzählen, größere/abwärts gerichtete Abstände |
| `intervals.l1.first-qualities.thirds` | 4 Abstandsfragen, 6 Qualitätsfragen: 10 | Terznummer 3, kleine Terz mit 3 und große Terz mit 4 Halbtönen |
| `intervals.l1.first-qualities.perfect` | 4 Qualitäts-, 4 Abstands- und 4 Reinheitsfragen: 12 | Reine Quarte/Quinte/Oktave mit 5/7/12 Halbtönen, Tritonus als Kontrast |

Die Aufgaben verwenden natürliche Töne im Violinschlüssel von E4 bis F5 ohne Hilfslinien. In der Abstandszählung beginnt die Starttaste bei 0, und jeder Übergang zur nächsten Klaviertaste zählt 1. Schwarze und weiße Tasten gehören gleichermaßen dazu. Zwei gleiche Tonhöhen haben Abstand 0; abwärts wird der Betrag des Abstands gefragt. Die Intervallnummer zählt dagegen Stammtonpositionen mit Start bei 1. Diese beiden Zählungen werden ausdrücklich getrennt eingeführt.

Halbtonfragen zeigen den tatsächlichen Score und einen statischen Klaviaturausschnitt mit denselben beiden Endtasten und allen Tasten dazwischen. Die Endtasten sind markiert, die Antwortzahl wird nicht angezeigt. Auch bei Abstand 0 bleiben zwei notierte Einsätze und eine markierte Taste korrekt. Die Klaviatur benutzt den vorhandenen `KeyboardExample`-Baustein; es gibt keinen neuen Baustein oder native Bibliothek. Andere Intervallfragen zeigen weiterhin das Notenbild. Screenreader erhalten Positionen beziehungsweise Endtonnamen statt einer Abstandszahl.

Die Qualitätsfrage bewertet Stammtonnummer und Klangabstand zusammen: kleine Terz 3/3, große Terz 3/4, reine Quarte 4/5, reine Quinte 5/7 und reine Oktave 8/12. „Rein“ ist der Qualitätsname, nicht eine allgemeine Bezeichnung für jede Quarte oder Quinte. F–H bildet eine vierte und H–F der nächsten Lage eine fünfte Stammtonspanne; beide haben sechs Halbtöne und erfüllen die Reinheitsprüfung nicht. Die Karten definieren den Tritonus als sechs Halbtöne beziehungsweise drei Ganztöne. Die weiteren Qualitätsnamen dieser beiden Schreibweisen werden hier noch nicht abgefragt.

Alle 15 Beispiele sind eigenständig verfasste vollständige 4/4-Takte mit zwei Halben und passendem Klaviaturausschnitt. Wiedergabe erfolgt auf Wunsch bei Viertel = 90 mit genau den notierten Tönen. Die Aufgaben bleiben visuell ohne Hörpflicht lösbar. Vorzeichen, Versetzungszeichengeltung, enharmonische Benennung, Schreibaufgaben und reine Hörintervallerkennung sind spätere Lernschritte.

## Schnittstellen und Versionen

- `VisualIntervalParams.question` ergänzt `semitones`, `quality` und `perfect`. `intervalReadingAnswer` leitet alle Antworten aus dem geprüften Score ab. `from/to`-Metadaten bestimmen die Lösung nicht. Die Frageformen bleiben auf natürliche Töne und einfache Intervalle bis zur Oktave begrenzt. `perfect` unterstützt nur die Nummern 4, 5 und 8.
- IDs für Abstände sind `interval-semitones:0` bis `:12`; Qualitätsfragen verwenden die bisherigen Intervall-IDs m3/M3/P4/P5/P8. Reinheitsfragen verwenden `interval-perfect:yes/no`. Mindestens zwei verschiedene fachliche Antworten müssen möglich sein. Die neuen Formen gehören ausschließlich zum bestehenden visuellen Typ; Schreib- und Hörschemas übernehmen sie nicht.
- `intervalReadingKeyboardRange` gewinnt die Grenzen aus den sichtbaren Tonhöhen. Schwarze Zwischentasten bleiben enthalten. Die App importiert weiterhin keine Theorie-Engine direkt. Neue Glossarbegriffe: `intervalQuality` und `tritone`; US/UK unterscheiden half steps und semitones.
- Wiederholungen wechseln Abstand, Qualität oder Ja/Nein-Antwort. Erstversuch, Hinweise und Wiederholung werden getrennt gespeichert. Bestehensschwelle und Freischaltung bleiben P2.11/P2.12.
- Katalog und Plan steigen auf Version 10. Neue Lektionen/Sätze, Karten und Artikel tragen Version 10; ältere Datensätze behalten ihre Fassungen. Intern gibt es 25 Lektionen mit 250 Aufgaben pro vollständigem Erstversuch, 70 Karten einschließlich der drei Prototypkarten und acht Artikel. Schema- und SQLite-Version bleiben 1. Der öffentliche Freigabefilter liefert weiterhin keine Entwürfe oder deren Inhaltstexte aus.

Die Artikel sind Datensätze für die spätere Wissensbasis; eine Leseroute und Tutorverknüpfung bleiben Folgearbeit.

## Prüfung und Übergabe

Die Prüfungen vergleichen natürliche Tonpaare mit einer unabhängigen MIDI-/Qualitätstabelle und prüfen 150 Seeds je neuer Frageform, 150 vollständige Fehlerdurchgänge je Lektion, die Klaviaturgrenzen einschließlich schwarzer Tasten sowie Speicherung und Einführungsaudio.

- `pnpm test`: 1.916 Tests erfolgreich (UI 14, Theorie 717, Audio 29, i18n 296, Notation 215, Übungen 228, Inhalt 144, App 217, Werkzeuge 56). Im ersten parallelen Prüf-/Exportlauf überschritt ein bestehender Akkordtest sein 15-Sekunden-Limit; der vollständige Wiederholungslauf bestand ohne Änderung des Tests.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm check:i18n`, `pnpm check:content` und `pnpm check:curriculum` erfolgreich; Deno-Typprüfung und alle 67 Smokechecks erfolgreich.
- Produktions- und Preview-Webexport erfolgreich. `pnpm check:content:bundle` bestätigt zwei öffentliche JavaScript-Dateien ohne unveröffentlichte Katalog-IDs oder Inhaltstexte; direkte öffentliche Aufrufe aller drei neuen Lektions-IDs zeigen keine Entwurfsaufgaben.
- Chromium: jeweils alle 30 Aufgaben und 15 Hörbeispiele auf Deutsch mit Tastatur sowie Touch bei 390 × 844, US-Englisch mit Maus und UK-Englisch mit Touch. Fragen, Antwortlabels und die Zahl der dargestellten Klaviertasten geprüft; drei Ergebnisse nach Neuladen erhalten. Deutsches Handy-Layout zusätzlich im Dunkelmodus mit reduzierter Bewegung. Nach einem Timeout beim britischen Beispielwechsel bestand der erneute vollständige UK-Durchlauf ohne App-Änderung und ohne JS-/React-Fehler.
- Falsche Terzqualität: 9/10 im Erstversuch, andere Qualitätsantwort und 1/1 in der Wiederholung gespeichert. Zusätzlich Abstand 0 mit zwei Notenköpfen/einer markierten Taste und Abstand 12 mit 13 Tasten auf einem 390-Pixel-Display geprüft und visuell angesehen.
- 2.250 bisherige Intervallgenerierungen sind identisch zum Basiscommit `0d1ae2a463d4e01c90d34f86d428a0321dd5d46c`: 1.800 visuelle/Hör-/Schreibvarianten und 450 Nummer-/Richtungs-/Bewegungsfragen. Alle 252 bisherigen Katalogdatensätze, die bisherige Einheitenplanung und sämtliche bisherigen DE/US/UK-Inhaltstexte bleiben identisch; nur die globalen Inhaltsversionen steigen.

Für Claude Code: beide Zählsysteme (Start 0 beziehungsweise 1), Qualitätsdefinitionen 3/4/5/7/12, Tritonus-Kontrast bei verschiedenen Stammtonnummern, natürliche Beispielpaare, DE/US/UK-Terminologie und die Progression separat nach ADR 0005 prüfen. Technische Tabellen ersetzen keine Literaturprüfung. GitHub-CI und echte VoiceOver-/TalkBack- sowie iOS-/Android-Geräteprüfungen bleiben offen.

Review-Zweig: `codex/p2-07-first-interval-qualities`, gegen `codex/p2-07-interval-size-direction` vergleichen: [GitHub-Vergleich](https://github.com/PhiFa96/harmonia/compare/codex/p2-07-interval-size-direction...codex/p2-07-first-interval-qualities). Git-HTTPS-Push ist erfolgreich. Die Erstellung eines Draft-PR über `gh pr create` scheitert am GitHub-GraphQL-POST mit `Forbidden`; es wurde kein PR erstellt. `main` bleibt unverändert. Nächstes geplantes Ziel: `aural.l1.pulse-rhythm` mit Puls hören, gleiche/verschiedene Rhythmen und einfachen Rhythmus-Hörentscheidungen. P2.07 bleibt offen.
