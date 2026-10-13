# P2.10 – Einstufungstest

**Stand:** 13.10.2026. Technisch vollständig implementiert auf Basis von P2.09, Branch `codex/p2-10-placement-test`. Fachliche Freigabe der bestehenden Aufgaben nach ADR 0005 und echte Geräteabnahme bleiben offen. Verfahren: [ADR 0010](../decisions/0010-einstufung-mit-getrennter-evidenz.md).

## Funktionen und Design

Der Test ist über Lernen, Profil und Lernziele jederzeit erreichbar. Der Wunsch aus dem Onboarding führt jetzt zum tatsächlichen Angebot nach der Einrichtung. Mini-Aufgabe und Kontoentscheidung bleiben im kurzen Erststart. Alle Texte sind in DE, US und UK verfügbar.

Sieben Bereiche werden getrennt eingeschätzt: Notation, Rhythmus, Intervalle, Tonleitern/Tonarten, Dreiklänge, Gehörbildung und Musikgeschichte. Vier Stichproben je Bereich verwenden bestehende Aufgabenparameter, freie Schreib-/Tasteneingaben und Hörbeispiele. Die Schwierigkeit passt sich nach jeder Antwort an. Im vollständigen internen Katalog sind es üblicherweise 21 Aufgaben, bei unklarer Evidenz bis zu 25. Keine Zeitbegrenzung. Hinweise, selbstständige Antworten und ausgelassene Fragen werden getrennt gezählt. Identische Quellen zählen nicht mehrfach als Evidenz.

Das Ergebnis zeigt den empfohlenen ersten Schritt und je Bereich Niveau, Evidenz, passende Einheit und deren erste Lektion. Fehlende Voraussetzungen haben eigene Links. „Getestete“ Einheiten bleiben freiwillig erreichbar und zählen nicht als bestandene Lektionen. Die Schätzung liegt innerhalb Stufe 1–2; wenige Stichproben prüfen nicht sämtliche Fähigkeiten.

Zurückgehen pausiert. Ein App-Neustart erhält Quelle, Auswahl, Hinweise und geprüfte Antwort. Frühes Beenden zeigt ein vorläufiges Ergebnis ohne übersprungene Einheiten. Wiederholen startet frisch und hält das vorherige Ergebnis bis zum nächsten Abschluss. Hör-Pause erzeugt keine Hörfehler oder erfundene Hörkompetenz und senkt die Schwierigkeit nicht. Audio beginnt durch eine Geste und stoppt beim Verlassen.

Oberfläche und Übungen verwenden vorhandene Design-Tokens, Tastatur-/Touchwege, zugängliche Notenbeschreibungen und Fokusführung. Dunkelmodus und reduzierte Bewegung folgen den Einstellungen.

## Speicherung und Auslieferung

- `packages/exercises/src/placement.ts`: adaptive Übergänge, getrennte Evidenz und Replay.
- `packages/content/src/placement.ts`: Stichproben, echte Lektionsreferenzen, Voraussetzungen und Empfehlungen.
- `apps/mobile/src/placement/model.ts`: validierter Verlauf; Quelle/Bewertungen werden neu erzeugt.
- `apps/mobile/src/state/placement.ts`: geordnete Writes, Wiederholung, Fehlerzustände und temporärer Betrieb.
- `apps/mobile/src/app/placement.tsx`: Einstieg, Aufgabe, Pause, vorläufiges Ergebnis, Ergebnis und Wiederholung.

Gerätedatenbankversion 2 ergänzt `placement_state`. Bestehende Geräteeinstellungen, Onboarding-Payloadschema 1 und Lektionsdaten bleiben erhalten. Einstufungs-Payloadschema 1 speichert aktuellen Test und letztes Ergebnis. Lokale Einstufung bleibt beim An-/Abmelden erhalten; Sync ist P2.03. Keine E-Mail-Adressen, Codes oder Tokens im Verlauf.

Produktion bekommt ausschließlich den freigegebenen Katalog. Aktuell bleiben Kursinhalte Entwurf; deshalb zeigt der öffentliche Test Verfügbarkeit statt Entwurfsaufgaben oder erfundener Ergebnisse. Development/Preview enthält den vollständigen internen Test. Nach Inhaltsfreigabe entstehen Stichproben aus den ausgelieferten Daten. Inhalts-/Parameteränderungen verlangen einen neuen Test; alte Werte werden nicht still umgedeutet.

## Abnahme

Automatisiert geprüft: 30 Seeds mit je Anfänger-, Mittel- und Fortgeschrittenenprofil, Hilfen, Hör-Pause, frühes Ende, zweite Antworten, identische Quellen, öffentliche Filterung, echte SQLite-Dateineustarts und additive Migration. App-Tests prüfen echte Tasteneingabe, Routen, Wiederaufruf, Übersetzungswechsel, Ergebnislinks, Wiederholung, Schreibfehler, geordnete Writes und temporären Betrieb. Die portable Steuerung läuft auch unter Deno.

Abschließender lokaler Prüfstand:

| Prüfung | Ergebnis |
|---|---|
| Gesamte Paket-/App-/Werkzeugtests einschließlich gezielter Wiederholungen nach den Korrekturen | 2.394 bestanden: UI 14, Theorie 717, Audio 29, i18n 419, Notation 234, Übungen 318, Inhalt 266, App 340, Werkzeuge 57 |
| Profilsimulation und Graphfälle | 39 Tests, darunter 30 Seeds mit je drei Profilen und ein Profil mit fehlender Notation trotz guter Theorie |
| Einstufung in App/SQLite/Store | 22 gezielte Tests; vollständige App-Regression 340 Tests |
| Deno | 82 Prüfungen bestanden |
| Lint, Paketgraph, Typen, Format, Übersetzungen, Inhalts-/Curriculumprüfung | bestanden |
| Preview-Export | Web, iOS und Android erfolgreich; native JavaScript-/Hermes-Exporte, keine Geräteinstallation |
| Produktions-Webexport und Bundlefilter | erfolgreich, keine unveröffentlichten IDs oder Inhaltstexte |

Browserprüfung der tatsächlichen Exporte: je 21 Aufgaben mit einem fortgeschrittenen Profil in DE auf einem dunklen 390×844-Touchbildschirm, mittlerem Profil in US per Tastatur und Anfängerprofil in UK per Touch. Reale Tasten-/Schreib-/Hör-/Timing-Eingaben, sieben Bereichsergebnisse, Speichern/Reload, Pause/Fortsetzung, Wiederholung, frühes Ende und Profileinstieg bestehen ohne JavaScript-Fehler. Ein eigener Durchgang erzwingt einen tatsächlichen Audiostartfehler und nutzt anschließend Hör-Pause; ausgelassene Aufgaben erhalten weder Fehler noch Niveau-Evidenz. Produktion erlaubt nach dem Gast-Onboarding keinen Teststart aus dem aktuellen leeren Freigabekatalog.

Die Browserprüfung fand einen Integrationsfehler, den reine Profilsimulationen nicht abdecken: vollständiges Replay bei einer Eingabe erzeugte neue Item-Objekte und brach die Vorbereitung einer Rhythmusaufnahme ab. `resumePlacement` wendet neue Aktionen jetzt inkrementell an und erhält die laufende Quelle. Ein zusätzlicher Aufnahmetest und der reale Browserdurchgang bestätigen die Korrektur. Ladefehler bieten ausschließlich erneutes Laden oder ausdrücklich temporären Betrieb; ein Speicher-Retry kann keinen ungeladenen/defekten Verlauf mit einem leeren Test überschreiben.

Die Nachweise sind lokale Prüfungen. GitHub-CI, Claude-Fachabnahme, menschliche Kalibrierung, VoiceOver/TalkBack und physische Geräte bleiben separate Abnahmen.

## Weiterarbeit

P2.11 baut den Lernpfad auf tatsächlich ausgelieferten Einheiten und `placementRecommendations` auf. `testedUnitIds` ist eine geschätzte Überspringempfehlung, kein abgeschlossener Versuch. Alle Grundlagen bleiben zugänglich. P2.03 übernimmt später die Einstufung in die Kontosynchronisation; Diagnose ist keine serverseitige Berechtigung oder XP-Gutschrift.

Claudes getrennter fachlicher Durchgang soll auch die gewählten Stichproben und ihre Reihenfolge einschließen. Reale Lernende müssen die groben Empfehlungen bestätigen; VoiceOver/TalkBack und physische iOS-/Android-Geräte bleiben eigenständige Abnahmen.
