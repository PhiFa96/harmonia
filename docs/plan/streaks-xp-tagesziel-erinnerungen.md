# P2.14 – Streaks, XP, Tagesziel und Erinnerungen

Stand: 14.10.2026. Technisch umgesetzt auf dem Review-Branch `codex/p2-14-motivation-reminders`. Claude Code bleibt für Review und Merge zuständig. Ausgangspunkt ist `50ab7fff` (P2.13); Vergleich: [P2.13 → P2.14](https://github.com/PhiFa96/harmonia/compare/codex/p2-13-feedback-reports...codex/p2-14-motivation-reminders?expand=1). Die GitHub-REST-/GraphQL-API dieser Cloud antwortet mit `Forbidden`; ein Pull Request wurde hier deshalb nicht angelegt. F07: zusätzliche Spielwährung eingeführt. Entscheidung und Randfälle: [ADR 0014](../decisions/0014-motivation-mit-muenzen-und-erinnerungen.md).

## Funktion und Design

Die Lernseite zeigt das Tagesziel kompakt mit lesbarem XP-Wert, begrenztem Fortschrittsbalken, Serie und Münzen. „Serie und Streak-Schutz ansehen“ öffnet das Profil. Dort stehen Rest-XP beziehungsweise Zielerfolg, längste Serie, Vorrat, nächster kostenloser Schutz und der Kauf mit sichtbarem Preis. Erklärungen nennen Verdienst und Schutzwirkung. Nicht genügend Münzen und voller Vorrat sperren den Kauf. Fehler, lokale Berechnung und abgelehnte Käufe sind sichtbar; ein Ladefehler wird nicht als erfolgreicher Nullstand dargestellt.

Das Ergebnis einer Lektion verwendet die gültige Regelversion und zeigt XP, Münzen, Serie und Tagesfortschritt. Die Ziele 10/20/30/50 XP bleiben in den Lernzielen änderbar. Bestehen und Freischalten behalten F11 (80 % der gesamten Erstaufgaben; Hinweise 1–2 erlaubt). Inhaltsversion 13 und der gesamte Kursgraph bleiben unverändert. Öffentliche Auslieferung enthält weiterhin keine ungeprüften Lektionen; sechs freie Sätze bleiben verfügbar.

Münzen starten mit 3 für erstmals bestandene Lektionen/Inhaltsversionen und 1 für bestandene Wiederholungen. Schutz kostet 10; kostenloser Schutz wird weiterhin alle sieben erfolgreichen Lerntage verdient. Maximal zwei Schutzvorräte insgesamt. Kauf, Offline-Nachladen, Erstattung, Doppeltippen und parallele Anfragen erhalten eindeutige IDs und serverseitige Prüfung. Es gibt keine Echtgeldzahlung.

Erinnerungen sind freiwillig. Ein Opt-in fragt erst dann nach der Systemberechtigung. Systemablehnung hat einen Link zu den Geräteeinstellungen. Uhrzeit, Sprache, heutiges Üben, Widerruf, Konto- und Gerätewechsel werden berücksichtigt. Web erklärt seine Einschränkung und speichert Wünsche. Eine Speicherfehlermeldung bestätigt keine Änderung, die nicht dauerhaft geschrieben wurde.

## Umsetzung

- Portable Kalender-/Regel-/Serien-/Kauf-/Erinnerungslogik in `packages/content` für App und Deno; generische Nachrichtentexte in DE/US/UK.
- Vier additive Migrationen `20261014000000` bis `20261014003000`: versionierte Wirtschaft, XP-Erweiterung, Wünsche, Schutzkäufe, abgeleitete Serie, Geräte-/Ticketverwaltung und atomare Erstübernahme. Keine lokale oder entfernte Datenbank zurückgesetzt.
- `learning-sync` prüft wie zuvor Engine-Nachweise; `motivation` prüft Sitzung, Gerät und Käufe. XP/Münzen kommen ausschließlich aus geprüften Lektionsnachweisen. Konten lesen nur eigene private Daten, Wirtschaft und private RPCs bleiben schreibgeschützt.
- Web-SQLite-Pool über einen pnpm-Patch für SDK 57 von mindestens sechs auf 32 Dateiplätze erweitert, auch in bestehenden Installationen. Damit passen alle fünf Datenbanken einschließlich gleichzeitiger Rollback-Journale; keine Datenlöschung oder Abschaltung der Journale.
- Separate SQLite-Datenbank mit Serialisierung, genau einmaliger Gastübernahme, Installation/Revision und sieben einmaligen Plänen. Konten, verspätete Antworten, Kaufablehnungen und lokale Schreibfehler bleiben getrennt.
- `expo-notifications`/`expo-device` passend zu SDK 57. Lokale Planung arbeitet auch ohne Konto. Aktiver Konto-Push verdrängt lokale Planung nach erfolgreichem Abgleich.
- `reminder-dispatch` mit Service-Authentifizierung, ausdrücklichem Aktivierungsflag, Tages-Claim, Lease, Ruhezeit-TTL, Tickets und Receipts. Native Token-Rotation aktualisiert die Bindung. Alte Receipts löschen kein inzwischen ersetztes Token.

## Prüfung

Der vollständige Repository-Testlauf und die anschließenden betroffenen Randfall-/App-Prüfungen ergeben **2741 bestandene Tests**: UI 14, Theorie 717, Audio 29, i18n 419, Notation 234, Übungen 341, Inhalt 509, App 420 in 47 Suiten und Werkzeuge 58. Zusätzlich bestehen **123 pgTAP-Prüfungen**, die bisherigen 170 Deno-Smoke-Checks, 15 ersetzte Push-Transportprüfungen und 17 Push-Job-Prüfungen mit echter lokaler Datenbank. Lint, Typen, Format, Übersetzungen, Inhalts-/Curriculum-Prüfung und Datenbank-Lint sind bestanden.

Der reale Chromium-Durchgang mit 390-px-Touch, dunklem Profil und Tastatur zeigt acht bestandene Lektionen (109 XP, 10 Münzen), geändertes Tagesziel, Web-Erinnerungswunsch, Gast-Schutzkauf, SQLite-Cold-Reload, echte lokale E-Mail-Anmeldung, Offline-/Nachsync und ein zweites Gerät mit erhaltenem 50-XP-Kontoziel. Logout trennt Guthaben und Schutz wieder vom Gast. Ein eigener Upgrade-Durchgang lädt den bisherigen P2.13-Export, speichert eine echte Lektion, wechselt bei derselben Origin zu P2.14 und prüft den vorhandenen Pool **6 → 32**, erhaltene 18 XP/3 Münzen, geändertes Ziel und erneuten Neustart.

Vorschau und Produktion sind jeweils für **Web, iOS und Android exportiert**. Der Produktions-Webexport besteht den Filter für ungeprüfte Katalog-IDs/Texte sowie Gaststart und direkte Entwurfslink-Sperre im Browser. Exporte und Adaptertests sind keine echte native Geräteabnahme.

Geprüft werden Mitternacht, fünf Zeitzonen/DST, Reisen über die Datumsgrenze in beide Richtungen, nachgeladene Offline-Tage, automatische Schutzverwendung, Vorratsgrenze, Kauf-Erstattung und Schutz während einer bereits unterbrochenen Pause. SQLite-Neustart, Kontowechsel, erste Kontowünsche auf einem zweiten Gerät, Doppeltippen, Netzfehler, fremde/fehlende Bestätigungen, Kaufablehnung und Datenträgerfehler haben eigene Prüfungen.

Native Adapterprüfungen ersetzen das Betriebssystem: keine automatische Berechtigungsanfrage, einmalige Planung, heutiges Üben, Widerruf, Ablehnung, verspätete Berechtigung/Planung, Token-Rotation, Remote-/Web-/Sitzungsmodus und Vordergrundfilter. Push-Transportprüfungen ersetzen HTTPS. Die lokale Jobprüfung verwendet eine echte Datenbank mit eigenen Testkonten und ersetzt nur den Versand; sie prüft parallele Jobs, aktuelle Gerätezeitzone, Ruhezeit, Opt-out, Praxis, Leases, ungültige Tokens und alte Receipts. Es wurde keine echte Push-Nachricht gesendet.

## Lokale Einrichtung und Remote-Übergabe

Lokal: `pnpm db:start`, `pnpm exec supabase migration up --local`, `pnpm db:serve:learning`. Danach `pnpm db:lint`, `pnpm db:test`, `pnpm db:test:learning`, `pnpm db:test:reports` und `pnpm db:test:motivation`. Die Motivation-/Job-Prüfer akzeptieren ausschließlich lokale APIs und entfernen nur ihre eigenen Testkonten und Regeln. `pnpm check:deno` prüft alle vier Functions und den ersetzten Push-Transport. CI enthält diese Schritte.

Nach Review für Staging beziehungsweise Produktion:

1. Die vier Migrationen und `learning-sync`, `motivation`, `reminder-dispatch` bereitstellen; vorhandene Auth-/Projektbindung beibehalten.
2. Öffentliche `EAS_PROJECT_ID` und richtige native Bundle-/Package-IDs verwenden; APNs/FCM im EAS-Projekt konfigurieren und einen Development-/Preview-Build installieren. Expo Go ist keine Push-Abnahme.
3. Serverflag `HARMONIA_PUSH_ENABLED=true` erst nach dieser Bindung setzen. Bei aktivierter Expo-Push-Zugriffssicherung `EXPO_ACCESS_TOKEN` ausschließlich als Function-Secret hinterlegen. Service-Key und Expo-Zugriffstoken kommen nie in das App-Bundle.
4. Vault-Secrets `harmonia_project_url` und `harmonia_service_role_key` im Dashboard setzen. [Scheduler-Vorlage](../../supabase/ops/schedule-reminders.sql) prüfen und einmal ausführen; Cron ruft die Function minütlich auf. Zum Stoppen Flag deaktivieren und `cron.unschedule('harmonia-learning-reminders')` verwenden. Keine Secrets in SQL/Git eintragen.
5. Auf echten iOS-/Android-Geräten Opt-in/Ablehnung, Vorder-/Hintergrund, Ruhezeit, heutiges Üben, Logout, Offline-Widerruf, Reisen und Token-Rotation abnehmen. Nach einem Offline-Widerruf kann Remote-Abschaltung bis zur Verbindung warten; UI nennt das. Lokale Planung umfasst sieben Tage und wird beim Öffnen erneuert. Systembedingt verzögerte lokale Alarme und bereits eingereichte Remote-Nachrichten lassen sich nicht zurückholen.

Remote-Projektbindung, Functions/Vault/Cron-Bereitstellung und echte native Zustellung sind hier **nicht durchgeführt**. Diese Infrastruktur-/Geräteabnahme ist von der technischen Implementierung getrennt. Ebenso bleiben Claudes fachliche Kursfreigabe, P2.03 als allgemeine Synchronisationsaufgabe und die Echtgeld-Abos offen. Nächster Planpunkt: **P2.15 – Tutor-Backend**.
