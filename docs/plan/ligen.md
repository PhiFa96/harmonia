# P3.04 – Ligen

Technischer Stand: 16.10.2026 auf `codex/p3-04-leagues`, aufbauend auf `codex/p3-03-fsrs-review` und dessen P3.02-Basis. Keine PR und kein Merge durch Codex; Claude Code übernimmt die Integration. Architektur: [ADR 0031](../decisions/0031-ligen-aus-bestaetigten-xp.md).

## Verhalten

- Eigener Tab „Ligen“ / „Leagues“, Gast-Einstieg mit Kontoanmeldung, echte wöchentliche Rangliste, vorläufige Auf-/Abstiegsplätze, Wochenresultat mit gespeichertem Lesemarker, Fehler-/Ladezustand und erkennbar veralteter letzter Abruf.
- pp bis fff, standardmäßig 30 Personen, je fünf Bewegungsplätze. Kleinere Gruppen haben höchstens halb so viele Plätze je Richtung. Einzelpersonen bleiben; in pp kein Abstieg, in fff kein Aufstieg. Gleichstand: frühere Aufnahme, dann Gruppenplatz.
- Montag 00:00 UTC; zusätzlich lokales Ende. Erste serverbestätigte XP nehmen automatisch auf. Keine nachträgliche Verteilung alter XP. Offline-Uploads zählen bei Serverbestätigung. Keine XP für Kartenselbsteinschätzungen oder bestehende reine Wiederholungsmodi.
- Keine veröffentlichten Profilnamen oder Konto-IDs; nur gruppeninterne Kennungen. Keine nachträgliche Änderung abgeschlossener Resultate durch Löschung anderer Konten. Wochen ohne neue XP verursachen keinen zusätzlichen Abstieg; offene Vorwochenresultate werden weiterhin abgerechnet.
- Globaler Mitteilungsschalter unter Datenschutz mit Widerruf beider Kategorien; Ergebnis innerhalb der App; eigenes freiwilliges Push-Opt-in für iOS/Android, getrennt von Lern-Erinnerungen. Gemeinsames Tagesbudget, gewählte Ortszeit, Ruhezeit, frischer ungelesener Abschluss und gültige Gerätebindung. Im Web wird kein Systemversand behauptet.
- Italienische Namen im zentralen Glossar, Erklärungen in DE/US/UK, keine neue fachliche Inhaltsfreigabe. Musikdynamik und Ligaaktivität werden ausdrücklich unterschieden.

## Integration und Betrieb

1. Zuerst P3.02 und P3.03 samt deren Migrationen/Functions integrieren.
2. Additive Migrationen `20261016060000_leagues.sql`, `20261016061000_league_notification_queue.sql` und `20261016062000_league_push_withdrawal.sql` anwenden. Bestehende Daten werden nicht zurückgesetzt und alte XP werden nicht importiert.
3. Aktualisierte Functions `motivation`, `reminder-dispatch` und `privacy` bereitstellen; `learning-sync` nutzt den neuen XP-Trigger ohne neuen Client-Schreibweg.
4. Als Datenbankbetreiber [schedule-leagues.sql](../../supabase/ops/schedule-leagues.sql) prüfen und anwenden. `harmonia-weekly-leagues` arbeitet minütlich in begrenzten Chargen. `remaining=true` bedeutet weitere Arbeit; bei großer Rücklage wiederholt ausführen. `cron.job_run_details` und letzte erfolgreiche Aufrufe überwachen. Abschaltung steht im Skript.
5. Systemversand benötigt weiterhin den getrennten Reminder-Scheduler, EAS-/Expo-Bindung, gültige Tokens und `HARMONIA_PUSH_ENABLED=true`. Keine dieser externen Bindungen wurde hier aktiviert. Kategorie bleibt standardmäßig aus; die Kontoanzeige braucht keinen Pushbetrieb.
6. Erst danach den Client verteilen. Liga-Daten werden nur im Arbeitsspeicher gecacht; offline ist nur der letzte Abruf der laufenden Sitzung verfügbar. Nach kaltem Offline-Start wird keine erfundene Rangliste angezeigt.

Aufbewahrung: laufende und letzte 52 abgeschlossene Wochen, bereinigt durch den Liga-Job; aktuelle Stufe und Kategorieentscheidung bis Kontolöschung. `leagueAccount` und `leagueMemberships` im eigenen Export. Alle eigenen Mitgliedschaften, Ergebnisse und Marker werden bei Kontolöschung kaskadierend entfernt. Leere Gruppen haben keine privaten Mitgliederdaten und werden mit der Wochenbereinigung entfernt.

Die Liga-Transaktionen verwenden eine gemeinsame kurze Sperre für Aufnahme und Abschluss. Der Leseweg `learner_league` nimmt diese Sperre nur noch, wenn tatsächlich eine alte Gruppe abzuschließen ist (Migration `20261020030200_league_read_lock.sql`). Die Simulation belegt das definierte Verhalten bei mehreren Tausend Konten; höhere produktive Schreiblast muss mit dem tatsächlichen Betriebsprofil gemessen werden. Eine Regeländerung betrifft neu angelegte Gruppen; bestehende Gruppen behalten ihre gespeicherten Werte.

## Reproduzierbare Prüfung

```sh
pnpm db:test
pnpm db:lint
pnpm db:test:leagues
pnpm db:test:motivation
pnpm db:test:privacy
pnpm --filter @harmonia/content test
pnpm --filter @harmonia/i18n test
pnpm --filter @harmonia/mobile exec jest --maxWorkers=2
pnpm lint
pnpm typecheck
pnpm format:check
pnpm check:i18n
```

Die SQL-Simulationen laufen transaktional mit Rollback: 4.200 aktive und 200 inaktive Konten über zwei Wochen, sieben Stufen, Regeln, fehlende Jobs, Grenzzeiten und Privatheit. Die Versandwarteschlange prüft zusätzlich 3.750 Konten mit 1.250 ausstehenden Ergebnissen hinter bereits verarbeiteten oder heute übenden Konten. API-/Versandtests verwenden ausschließlich eigene lokale Testkonten und löschen sie anschließend; Pushtransport ist ersetzt.

Gast-Browserprüfung mit dem isolierten Preview-Export:

```sh
pnpm qa:build --output /workspace/p304-preview
HARMONIA_QA_DIR=/workspace/p304-preview pnpm qa:web leagues.spec.mjs
```

Angemeldete Prüfung gegen den laufenden lokalen Supabase-Stack:

```sh
node tools/qa/export-local-auth.mjs --output /workspace/p304-auth-preview
HARMONIA_QA_LOCAL_AUTH=1 HARMONIA_QA_DIR=/workspace/p304-auth-preview pnpm qa:web leagues-auth.spec.mjs
```

Der zweite Export ist ausdrücklich ein lokaler Integrationsexport mit öffentlichem Anon-Schlüssel, kein veröffentlichbarer Kandidat. Er prüft echte serverbestätigte Lektions-XP, eigene/fremde Darstellung, Offline-Fehler, Wiederherstellung und Reload in DE/US/UK. Ohne explizites Flag wird dieser Test übersprungen; Gasttests benötigen keine Backend-Konfiguration. Umgebung mit eigenem Chromium gegebenenfalls über `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` binden.

## Abnahme

Lokale Abschlussprüfungen:

| Bereich | Ergebnis |
|---|---|
| Wochen-Simulation und SQL/RLS | 460 pgTAP-Prüfungen insgesamt; 4.200 aktive / 200 inaktive Konten über zwei Wochen; weitere 3.750 Konten für die begrenzte Versandwarteschlange |
| Echte lokale APIs | 75 Liga-Prüfungen, 54 Ergebnis-Versandprüfungen mit Ersatztransport, 108 Datenschutzprüfungen; bestehende Motivation-/Reminder-Integration und 17 allgemeine Versandprüfungen bestanden |
| App | 585 Tests in 75 Dateien im vollständigen Lauf; zwei anschließend ergänzte Tests für getrennte Kategorien und globalen Widerruf, zuletzt 28 betroffene Tests zusammen bestanden |
| Inhalte und Sprache | 662 Inhaltsprüfungen; 441 i18n-Prüfungen; Schlüssel-/Platzhalterprüfung DE/US/UK bestanden |
| Tools / Typen | 157 Tools-Prüfungen; vollständige Typprüfung und erneute App-/Tools-/Functions-Typprüfung nach der letzten Änderung, ESLint, Deno, Format und Schema-Lint bestanden |
| Browser | Drei angemeldete und drei Gast-Liga-Szenarien in DE/US/UK bestanden, mit Axe und Überlaufprüfung. Die 23 bestehenden Szenarien bestanden ebenfalls; der britische FSRS-Neuladelauf wurde nach Abschluss des Fixture-Exports erneut einzeln bestätigt |
| Produktionsausgabe | Web und iOS-/Android-Hermes exportiert; zusätzliche native JavaScript-Ausgabe: sieben Dateien ohne unveröffentlichte Katalog-IDs/-Texte; isolierte Builds ohne lokale Auth-Adresse |
| Größenbudgets | Web 5.506.058 Bytes, gzip 1.315.388 Bytes, Audio 686.098 Bytes; Android-Hermes 9.275.541 Bytes, iOS-Hermes 9.059.562 Bytes; alle Grenzen eingehalten |
| Lokale Zeitprobe | Chromium-Start-P95 1.448,09 ms; Lektionsaufruf-P95 284,55 ms. Keine physische oder akustische Geräteabnahme |

Belege dieser Cloud-Sitzung: Protokolle `/workspace/p304-*.log`; Screenshots unter `artifacts/quality/p304-auth-final` und `artifacts/quality/p304-league-ui`. Exporte während einer laufenden Browserprüfung nicht überschreiben: Ein geräumtes Exportverzeichnis kann einen Neuladeaufruf mit HTTP 404 abbrechen. Die finalen Liga-Läufe verwenden fertig exportierte, getrennte Fixtures. Offen bleiben Claudes PR-/CI-/Integrationsablauf, Remote-Bereitstellung und Schedulerbetrieb, rechtliche Abnahme der ergänzten Arbeitsentwürfe, separate fachliche Prüfung sowie echte iOS-/Android- und Pushanbieter-Abnahme. Die bereits bekannten P2-Launchblocker bleiben bestehen.
