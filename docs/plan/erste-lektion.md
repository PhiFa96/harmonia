# Erste vollständige Lektion – P1.20

Stand: 04.10.2026. Die technische Umsetzung läuft im Web. Echte iOS-/Android-Geräte und der Test mit 3–5 Personen stehen noch aus; Phase 1 ist damit nicht vollständig abgeschlossen.

## Ablauf und Inhalt

Im Tab „Lernen“ öffnet „Lektion ansehen“ drei Einführungskarten: Notennamen im Violinschlüssel, kleine/große Terz und reine Quarte/Quinte. Jede Karte enthält eigenen Erklärungstext, ein maschinenlesbares Notenbeispiel und ausdrücklich startbaren Klavierklang. Bei mehreren Beispielen kann man wechseln. Karten- und Routenwechsel beenden die Wiedergabe.

Danach folgen zehn gemischte Aufgaben: vier Notennamen, drei visuelle und drei gehörte Intervalle. Notennamen bleiben ohne Vorzeichen im Bereich c¹–h¹. Intervalle gehen aufwärts und umfassen kleine/große Terz, reine Quarte und reine Quinte. Visuelle Intervalle erlauben einfache Versetzungszeichen; Hörintervalle verwenden Stammtöne. Auswahl, Hinweisleiter und Engine-Rückmeldung verwenden denselben Aufgabenbaustein wie das freie Üben aus P1.19. Die Klaviatur-Demo bleibt unter `/note-input` erreichbar.

Jeder falsch beantwortete Aufgabenslot kommt am Ende genau einmal mit einem anderen Notenbeispiel zurück. Parameter und Übungstyp bleiben erhalten. Eine erneut falsche Antwort führt zum Ergebnis mit einer Empfehlung für einen neuen Durchgang; es gibt keine endlose Pflichtschleife.

Erstversuch und Wiederholung werden getrennt gezählt: Bei zunächst 8/10 und zwei richtigen Wiederholungen bleibt die ursprüngliche Genauigkeit 80 %. Hinweise werden für beide Runden ausgewiesen. „Gerade nicht hören“ gilt für den Durchgang einschließlich Wiederholung. Auch ein früherer Hörfehler wird dann in der Wiederholung ausgelassen. Ausgelassene Aufgaben zählen nicht als falsche Antworten; ungeklärte frühere Fehler bleiben sichtbar. Ein neuer Durchgang setzt die Hör-Pause zurück.

`packages/content/src/lessons/reading-and-listening.json` enthält die stabile ID `fundament.reading-and-listening.1`, `contentVersion: 1`, Status `entwurf`, Einführungskarten und zehn Übungsparameter. Eigene Texte liegen in `packages/i18n` und werden über typisierte Schlüssel referenziert. Damit gelten die bestehenden Sprach-, Platzhalter- und Glossarprüfungen auch für Lerntexte; US/UK verwenden ihre jeweilige Terminologie.

Das erste Zod-Schema prüft Umfang, Referenzschlüssel, Status und Parameter. Der Generator prüft zusätzlich tatsächlich mögliche Intervalle/Tonbereiche und eindeutige Hör-Antworten. Dieses Schema ist gezielt für den Durchstich angelegt. P2.04 erweitert es für mehrere Lektionen, Einheiten, Skills und Wissensartikel.

## Reine Ablaufsteuerung

`packages/exercises/src/lesson.ts` bleibt unabhängig von App, Audio und Datenbank:

```ts
const lesson = createLessonSession(firstLesson, seed);
activeLessonSession(lesson);
answerLesson(lesson, answerId);
revealLessonHint(lesson);
nextLessonExercise(lesson);
startLessonReview(lesson);
skipLessonAural(lesson);
lessonSummary(lesson);
```

Ein gespeicherter Seed behält seinen Typ: Zahlen und Text erzeugen in der Engine unterschiedliche Zufallsfolgen. Die Wiederholung erhält einen eigenen reproduzierbaren RNG je ursprünglichem Aufgabenindex. Sie vergleicht Tonhöhen, Schlüssel und Spielrichtung; bloßes Mischen der Antworten reicht nicht als neue Variante. Die Parameter müssen mindestens zwei Notenbeispiele ermöglichen. 300 Seeds prüfen dies für alle zehn Slots der Inhaltsdatei.

## Lokale Ergebnisse und Web-Vorschau

`expo-sqlite` und `expo-crypto` sind SDK-57-kompatibel installiert. Crypto erzeugt die Client-ID des Durchgangs; SQLite speichert in `harmonia-lessons.db`. Neue native Development Builds müssen beide Module enthalten.

`src/storage/lesson-repository.ts` legt Schema-Version 1 an. Ein fertiger Durchgang enthält Client-ID, Lektions-ID, Inhaltsversion, Zeit, Seed, ursprüngliche Aufgaben/Parameter, Antworten, Hinweise, ausgelassene Aufgaben und beide Runden als versionierten JSON-Snapshot. Indizierte Zusammenfassungsfelder ermöglichen die Anzeige des letzten Durchgangs. Dieselbe Client-ID wird nur einmal gespeichert; ein erneuter Schreibversuch überschreibt nichts. Bei gleicher Endzeit entscheidet die Einfügereihenfolge.

Der Ergebnis-Screen zeigt „gespeichert“ erst nach erfolgreichem Schreiben. Bei Fehler bleibt der Versuch sichtbar und kann mit derselben ID erneut gespeichert werden. Neustart und Zurück-Knopf warten darauf. Ein Lesefehler blockiert dagegen keine neue Lektion. „Lernen“ lädt beim erneuten Fokussieren den letzten Durchgang; eine ältere Inhaltsversion wird genannt.

SQLite im Web lädt WASM und einen Worker. Der Server muss `Cross-Origin-Opener-Policy: same-origin` und `Cross-Origin-Embedder-Policy: require-corp` senden. Metro ist konfiguriert; `apps/mobile/public/_headers` wird für kompatible statische Hosts exportiert. Andere Hosts müssen dieselben Header setzen. Ohne sie zeigt die App einen Lade-/Speicherfehler. Extern ist außerdem HTTPS nötig.

```sh
pnpm --filter @harmonia/mobile build:web
pnpm preview:web
# Standard: http://localhost:8084
# anderer Port: HARMONIA_PREVIEW_PORT=8086 pnpm preview:web
```

Die Vorschau bindet nur localhost, liefert WASM mit passendem MIME-Typ und App-Routen über den SPA-Einstieg. Keine externe Bereitstellung ist Teil von P1.20.

Die Daten bleiben auf diesem Gerät beziehungsweise Browserprofil. Noch laufende Durchgänge werden nicht gespeichert. Konten, Synchronisation, Fortsetzen abgebrochener Lektionen, Bestehensschwelle, XP, Serien und Lernpfad-Freischaltungen folgen in Phase 2.

## Prüfstand und Abnahme

- Zustandsübergänge: unveränderliche erste Antwort, neue Varianten, genau eine Wiederholungsrunde, Hilfen, Hör-Pause und ungeklärte Fehler.
- Inhaltsdatei: feste Mischung, Parameterprüfung und 300 Seeds mit kompletter Wiederholung. Referenzintervalle C–Es, C–E, C–F und C–G gegen eigene Tabellen und Engine; das unabhängige bestehende `tonal`-Orakel prüft die verwendeten Generatoren.
- Echte SQLite unter Node: Schema, Version, vollständiger Snapshot, Duplikatschutz, gebundene SQL-Werte, Sortierung, Auslassen und Schließen/Öffnen einer Datei.
- App: Einführung mit Klang, zehn Aufgaben, Hinweise, neue Wiederholungen, Hör-Pause, Schreibfehler mit identischem Wiederholungsversuch, Laden und DE/EN-UK.
- Gebauter Web-Export in Chromium: echte Audioquellen, vollständige Lektion, zwei Fehler und Wiederholungen, zweiter Durchgang ohne Hören, Reload und kompletter Browserneustart mit erhaltenem SQLite-Ergebnis; ohne Hosting-Header ein sichtbarer Speicherfehler mit erneutem Versuch. Telefon 390 × 844 und Desktop 1280 × 1000, Hell/Dunkel, reduzierte Bewegung und Tastatur; keine Laufzeitfehler.

Lokaler Stand: **1317 Tests** (717 Theorie, 209 Notation, 218 Übersetzungen, 29 Audio, 42 Übungen, 4 Inhalte, 14 UI, 84 App). Lint, Typprüfung, Formatierung, Übersetzungen, Deno, eingefrorene Installation und Web-Build erfolgreich. Deno lädt auch die JSON-Lektion und ihr Schema ohne installierte Node-Workspace-Abhängigkeiten.

Aufnahmen: [Einführung](bilder/p1-20-einfuehrung.png), [Wiederholungskarte](bilder/p1-20-wiederholung.png), [Ergebnis](bilder/p1-20-ergebnis.png), [Dunkelmodus](bilder/p1-20-dunkel.png), [gespeicherter Durchgang](bilder/p1-20-gespeichert.png).

Alle Lerntexte bleiben **Entwurf** bis zu Claudes getrenntem fachlichen Prüfdurchgang gegen Engine und Standardliteratur gemäß [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md). Offen: neue Development Builds und echte iOS-/Android-Geräte, VoiceOver/TalkBack, Audio-Latenzmessungen, andere Browser, 3–5 Testpersonen und grüne GitHub-CI vor einem Merge.

## Test mit 3–5 Personen

Noch nicht durchgeführt. Jede Person beginnt ohne Bedienerklärung auf „Lernen“, bearbeitet die Einführung und einen vollständigen Durchgang. Mindestens eine Person probiert Hinweise, mindestens eine „Gerade nicht hören“. Anschließend App/Browser schließen und den gespeicherten Durchgang prüfen.

| Beobachtung | Notiz |
|---|---|
| Gerät, Betriebssystem, Browser/Build | |
| Kopfhörer/Lautsprecher/Bluetooth; Klang und Verzögerung | |
| Einstieg ohne Hilfe gefunden? | |
| Einführung und Tonnamen verstanden? | |
| Prüfen, Weiter und Hinweise verständlich? | |
| Neue Variante und getrennte Erstversuchswertung verstanden? | |
| Hör-Pause und Ergebnis nach Neustart verständlich? | |
| Gefühl: zu leicht/schwer, motivierend/anstrengend; freie Rückmeldung | |

Nur reale Notizen erfüllen diese Abnahme. Der vorläufige technische Rückblick steht in [phase-1-rueckblick.md](phase-1-rueckblick.md).
