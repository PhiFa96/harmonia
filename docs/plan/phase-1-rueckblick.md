# Technischer Rückblick Phase 1

Stand: 04.10.2026, nach der Implementierung von P1.20. Vorläufiger technischer Rückblick; echte Geräte und 3–5 Testpersonen fehlen noch.

Theorie-Engine, Notation, Klavierklang, Klaviatur, Übersetzungen und UI-Bausteine funktionieren gemeinsam in einer vollständigen Lektion. Sie führt von eigenen Einführungstexten mit Klang über zehn Aufgaben und eine Wiederholungsrunde zu einem lokal gespeicherten Ergebnis. Der Web-Export bewahrt SQLite-Daten auch nach einem Browserneustart.

Die Pakettrennung hat sich bewährt: Generierung, Bewertung und Lektionsübergänge bleiben reines TypeScript und laufen unter Deno. Die App übernimmt Darstellung, Audio-Lebenszyklus und Speicherung. Parametrische Aufgaben liefern neue Notenbeispiele; Antwort-IDs bleiben unabhängig von Übersetzungen. Ein gemeinsamer Aufgabenbaustein verhindert auseinanderlaufende Bedienung zwischen freiem Üben und Lektion.

Plattformprüfungen sind zusätzlich zu Unit-Tests nötig. Web-Audio muss ausdrücklich starten, verspätete Freigaben dürfen nach einem Routenwechsel nicht klingen. Web-SQLite benötigt Worker, WASM und Server-Header. Fokus muss beim Feedback erhalten bleiben. Der gebaute Web-Export prüft diese Fälle, ersetzt aber keine echten nativen Geräte.

Erstversuch, Wiederholungsleistung, Hinweise und ausgelassene Hörfragen müssen getrennt bleiben. Eine gelungene Wiederholung darf den ursprünglichen Lernstand nicht rückwirkend verbessern. Die Client-ID schützt lokale Schreibwiederholungen vor Duplikaten; Synchronisation und serverseitige Validierung folgen später.

## Offene Fundament-Arbeit

- Claudes getrennte fachliche Abnahme der eigenen Einführung und Erklärungstexte; Status bleibt `entwurf`.
- Native Development Builds mit SQLite/Crypto, Bedienung und Screenreader auf iOS/Android, Audio-Spike mit echten Latenzmessungen.
- Test mit 3–5 Personen und tatsächlichen Notizen; Anleitung in [erste-lektion.md](erste-lektion.md).
- Supabase-/EAS-Grundlage und offene formale Abnahmen aus P1.03/P1.04 prüfen. Vorhandener Code allein schließt offene Checklisten nicht.
- GitHub-CI und Prüfung der aufeinander aufbauenden Codex-Branches durch Claude; kein Merge in dieser Umsetzung.

## Konsequenzen für Phase 2

1. **P2.01/P2.03:** Lokale Versuche und Client-IDs erhalten. Kontenverknüpfung, Migrationsstrategie, Warteschlange, Synchronisation und serverseitige Bewertung ergänzen. SQLite-Web-Header und Auth-Rückleitungen gemeinsam prüfen.
2. **P2.04:** Das erste Schema zur Inhalts-Pipeline ausbauen: weitere stabile IDs, Versionsregeln, Skills und Übersetzungen. Nur fachlich freigegebene Inhalte öffentlich ausliefern.
3. **P2.12:** Lektionszustand und Aufgabenbaustein wiederverwenden. Bestehensschwelle, XP, Serien, Lernpfad und Abbrechen/Fortsetzen ergänzen. Die unterschiedliche Aussage von Erstversuch, Hilfen und Wiederholung erhalten.
4. **Geräte und Menschen früh prüfen:** Vor weiterem Inhaltsausbau die native Klang-/Bedienprüfung und Rückmeldungen der Testpersonen abarbeiten. Schwierigkeit und Einführungsumfang anhand dieser Ergebnisse anpassen.

Der langfristige Umfang mit vielen Übungsformen, Chor-/Orchesterbesetzungen und bis zu acht Stimmen bleibt im Curriculum und in Phase 5 verankert. P1.20 beweist Ablauf und Speicherung einer Lektion; vollständige Kurse entstehen danach.
