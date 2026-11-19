# M2-Nacharbeit nach dem Merge von M1

Stand 19.11.2026. Basis `main@688de50`, Arbeitsbranch `codex/programmierarbeiten-nach-m1`. Der Einzelstand und die übrigen Prüfaufträge stehen im [Befundregister](../../plan/befundregister.md).

## Änderungen

| Bereich | Ergebnis |
| --- | --- |
| Lern-Sync | Neue Clients senden `deferFuture: true`. Der Server bestätigt gültige Einträge und kennzeichnet Einträge außerhalb des vorhandenen Zeitfensters von fünf Minuten. Die App behält sie lokal und verarbeitet weitere Einträge. Altclients behalten bei einer unzulässigen Abschlusszeit HTTP 422. |
| FSRS und Lernhilfen | Der Worker hält die Verarbeitung pro Konto in Empfangsreihenfolge und verarbeitet bei Konkurrenz für ein Konto weitere Konten im selben Batch. Der Lern-Sync protokolliert Zurückstellungen ohne Kontodaten. Die Übungsansicht beschreibt relative Bewertungen. Hörintervall-Hinweise 1–2 enthalten keine Zieldistanz. |
| Übungsprüfung und Aufnahme | Antworten, Überspringen und Abgabe verwenden dieselbe fortlaufende Prüfungszeit. Aufnahme-Startfehler geben Ressourcen frei und stellen den Wiedergabemodus her. iOS erhält Mikrofontexte auf DE und EN. Der letzte Verbraucher schließt einen gemeinsam genutzten MIDI-Port. |
| Freunde und Rätsel | Freundschaftslinks lassen sich widerrufen. Wochenquests benötigen Zustimmung für Wochenplätze und sichtbare XP. Beziehungsbezogene Kennungen gelten in UI und Export. PostgreSQL begrenzt Einladungsversuche und schnelle Mehrfachteilnahme über Zeitzonenwechsel. [ADR 0084](../../decisions/0084-quest-zustimmung-und-social-schutz.md) |
| Schule und Zertifikate | Ein erfolgreicher Schul-POST prüft die Anmeldung nach dem begrenzten Body einmal maßgeblich. Parameter im Schul-Resolver sind qualifiziert. Bestehende synthetische Prüfcodes haben eine eigene Leseprüfung anhand der gespeicherten Bindung und des Widerrufsstatus. |
| Tutor | Der Integrationstest protokolliert die Behandlung älterer Reservierungen ohne Versuchsnachweis. Laufende Leases melden `busy`, abgelaufene werden als fehlgeschlagen abgeschlossen. Ein wiederholter Abruf belastet das Kontingent einmal. |

## Lokale Prüfnachweise

- PostgreSQL-Schema-Lint und 633 allgemeine pgTAP-Prüfungen bestanden. 150 Schul-pgTAP-Prüfungen mit Supabase-Auth und 13 HTTP-Fälle für die Schul-Identität bestanden.
- Lern-Sync-Integration mit lokaler Supabase-Auth, 226 Offline-Versuchen, Paging, XP und gezieltem Zukunftsfall bestanden. Der öffentliche Modus weist Entwurfsaufgaben auch im neuen Protokoll zurück. Dazu 306 lokale Tutor-API-Prüfungen mit simuliertem Modell und 154 Datenschutz-API-Prüfungen mit echten lokalen Testkonten.
- Neun Playwright-Fälle bestanden. Darunter alle sechs zuvor ausgelassenen Tests mit authentifizierten lokalen Konten für Liga und Rush sowie drei Gästeabläufe für gezieltes Üben. Browser war System-Chromium.
- Alle 373 Werkzeugtests bestanden, darunter 66 Zertifikatsprüfungen. Die Musterprüfung, der Widerruf und der Zugriffsschutz laufen über dieselben SQLite- und Serverpfade wie die Vorschau.
- Acht gezielte App-Suites mit 73 Tests am Implementierungscommit `de42f0c` bestanden. Der breite App-Lauf zeigte einen verzögerten MIDI-Portschluss beim Verlassen. Nach dessen Korrektur bestanden beide MIDI-Suites mit vier Tests. Die zuvor unter paralleler Last betroffene Lektionsnavigation bestand im gesonderten Nachlauf.
- Insgesamt 3.864 Pakettests bestanden. Beide unter paralleler Last ausgelaufenen Akkordsuites bestanden im gezielten Nachlauf mit 31/31 Tests innerhalb der regulären Zeitgrenzen. Deno-Prüfung und die Vorbereitungsprüfungen für Übersetzungen, Katalog, Curriculum, Tutor, Rechtstexte und Store-Auftritt waren erfolgreich.
- Der Produktions-Webexport enthält elf JavaScript-Dateien. Der öffentliche Katalogfilter und die Größenbudgets bestanden. P2 meldet weiterhin 151 offene Voraussetzungen. Für die Beta meldet der Stand 135 auf iOS, 135 auf Android und 131 im Web.
- Die privaten Prüfmappen wurden neu erzeugt. KI-Snapshot `4fbfa93111d7095b53a22e48c377bb2e68a6be6ab981a81bc063df4cd79ede6c` bindet 459 Dateien. Zertifikate binden 209 Dateien mit `bb85e496c8acb86780a94a868bb5529c678a610819c1484aacb7588cee719668`. Die vier KI- und Zertifikatsfreigabeprüfungen melden weiter offene Abnahmen.
- SHA-256-Abgleich aller 33 historischen Rohberichte erfolgreich.

## Reihenfolge und Abnahme

Zuerst die beiden neuen Migrationen einspielen, danach `friends`, `daily-puzzle`, `privacy`, `privacy-retention` und `learning-sync` aktualisieren, anschließend die App bauen. Der neue Client sendet die zusätzlichen Sync- und Questparameter. Die bestehenden SQL-Aufrufe der Freundschaftsfunktionen akzeptieren auch zwischengespeicherte Konto-IDs der eigenen Beziehung.

Die technische Abnahme auf GitHub und die Fachprüfung der neuen Hörhinweise stehen aus. Produktive Geräte- und Anbieterabnahmen, echte Modellqualität, F14, Rechtsprüfung und Freigabe der Inhalte liegen in den Zuständigkeiten des [Fertigstellungsplans](../../plan/fertigstellung.md).
