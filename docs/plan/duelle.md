# P3.06 – Live-Duelle und Ghost-Duelle

Technische Umsetzung auf `codex/p3-06-duels`, aufbauend auf `codex/p3-05-theory-rush`. Entscheidung: [ADR 0033](../decisions/0033-duelle-aus-geprueften-rush-aufgaben.md).

## Ablauf

- Im Übungsbereich öffnet „Duelle“ eine eigene Ansicht. Ein bestätigtes Konto ist erforderlich.
- Live-Suche legt eine private Warteschlange an. Ein zweiter passender Suchender startet dasselbe drei Minuten lange Spiel; das Ratingfenster weitet sich mit der Wartezeit. Nach etwa zehn Sekunden kann ein bestätigter dreiminütiger Rush-Lauf als klar markierter Ghost dienen. Ohne geeigneten Lauf wird kein Ghost erfunden.
- Einladungsduelle starten über einen zehn Minuten gültigen Link oder einen manuell eingegebenen UUID-Code. Link und Code enthalten keine Profilnamen oder E-Mail-Adressen.
- Alle Antworten werden gegen die eingefrorene Rush-Bank serverseitig bewertet. Die Antwortzeit, Deadline, Reihenfolge und Idempotenz liegen in Postgres. Ein nicht bestätigter Offline-Schritt zählt nicht. Beim Wiederöffnen wird der bestätigte Spielstand geladen. Broadcast löst nur einen erneuten Abruf aus; Polling deckt Realtime-Ausfall ab.
- Nur Live-Duelle verändern Glicko-2 und buchen bis zu 10/3 XP bei Sieg/Niederlage oder Unentschieden, mit 50 XP Tagesdeckel. Ghosts und Einladungen sind ohne Rating und XP. Seit `20261020030000_duel_participation_xp.sql` erhält nur XP, wer mindestens eine richtige Antwort gegeben hat; ein Unentschieden ohne Antworten bringt niemandem XP. Rating und Paarung sind unverändert (Mindestbeteiligung fürs Rating und Gegnerwiederholungssperre bleiben offen, Fachprüfung Phase 3, P3.06 Befund 4).

## Bereitstellung

Nach allen P3.05-Migrationen die additive Migration `20261016080000_duels.sql` anwenden. Anschließend die `duel` Edge Function, den aktualisierten Datenschutz-/Retention-Endpoint und die App bereitstellen. Realtime ist in der lokalen Supabase-Konfiguration eingeschaltet; das Zielprojekt benötigt private Broadcast-Kanäle mit den Teilnehmer-Policies. Der Service-only Abschlussaufruf `POST /functions/v1/duel` mit `{"action":"sweep"}` verarbeitet höchstens 100 abgelaufene Spiele. `supabase/ops/schedule-duels.sql` ist nur eine Vorlage. Vault, URL, Job, Monitoring und Wiederanlauf im Zielbetrieb ausdrücklich einrichten; sie wurden hier nicht aktiviert. Eine produktive Null-Aufgabenbank antwortet mit `source`, bis Inhalte fachlich freigegeben sind.

Der Export umfasst eigene `duelRatings`, `duelGames`, `duelPlayers`, `duelSteps`, `duelQueue` und Einladungen. Retention entfernt Rohantworten und Aufgabenbank nach zwölf Monaten; die bestätigten eigenen Ergebnisse und XP-Belege bleiben bis Kontolöschung. Rechtliche Zweck- und Fristenabnahme bleibt offen.

Wenn der Abschlussjob zwölf Monate lang nicht lief, schließt die Retention solche längst abgelaufenen Spiele anhand gespeicherter Punkte ohne nachträglich erfundenes Rating oder XP, bevor sie die Rohdaten entfernt. Dieser Betriebsfehler muss im Monitoring sichtbar werden.

## Prüfstand und offene Abnahme

Reine Glicko-/Schema-Prüfungen, App-Zustands- und Oberflächentests, TypeScript, Deno, Übersetzungen, Lint und SQL-Syntax sind lokal prüfbar. `supabase/tests/database/duels.test.sql` enthält Matchmaking-, Wiederholungs-, Ergebnis-, Ghost-, Einladungs- und Berechtigungsprüfungen. In dieser Cloud konnte Supabase nicht gestartet werden: der konfigurierte Netzfilter verweigert `public.ecr.aws`, von dem die Supabase-CLI die nötigen Container bezieht. Daher wurden Migration, pgTAP, echte Edge-/Realtime-API und Mehrgerätefälle hier **nicht** als bestanden ausgegeben.

Nach verfügbarer lokaler Supabase-Umgebung prüfen:

```sh
pnpm db:start
pnpm exec supabase migration up --local
pnpm db:test
pnpm db:lint
pnpm check:deno
```

Zusätzlich zwei echte Konto-Clients auf iOS, Android und Web paarweise verbinden; Matching, Countdown, Deadline, Broadcast/Polling, Hintergrund, Verbindungsabbruch, erneute Antwort, Ghost-Quelle, Einladung sowie gleichzeitige Abschlussaufrufe prüfen. Die öffentliche Bank, Datenschutztexte, Scheduler und Anbieter-/Geräteabnahmen bleiben separat offen. Die P3.05-Branchabhängigkeit vor dem PR-/CI-Ablauf durch Claude Code integrieren.
