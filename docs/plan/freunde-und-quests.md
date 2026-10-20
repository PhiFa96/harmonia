# P3.08 – Freunde und Freundes-Quests

Technischer Branch `codex/p3-08-friends`, aufbauend auf `codex/p3-07-daily-puzzle`. Entscheidung: [ADR 0035](../decisions/0035-freundschaften-und-wochenquests.md).

Die Übungsseite führt zur Freundesverwaltung. Angemeldete Konten erstellen einen sieben Tage gültigen Einmal-Link oder Code. Bei Annahme sind beide Seiten sofort bestätigt. Die Freundesliste zeigt eine anonyme Kennung, gespeicherte Lernserie und Liga-Stufe. Entfernen und Blockieren verlangen in der App eine Bestätigung. Blockieren verhindert neue Einladungen dieser Paarung und entfernt den gegenseitigen Rush-Freundesfilter. Aufheben stellt keine Freundschaft wieder her. Einladungscodes erzeugt allein der Server (`gen_random_uuid()`); ein vom Client mitgesandter Wert wird nicht gespeichert (Migration `20261020030100_friends_followups.sql`). Einfaches Entfernen hebt eine bestehende Blockierung nicht auf.

Eine gemeinsame Quest kann pro Person und UTC-Woche genau einmal begonnen werden, auch wenn die Freundschaft später endet. Beide Seiten sammeln ab Start zusammen 300 kanonisch bestätigte XP. Der Server zeigt beide Beiträge und vergibt bei Erreichen je ein Abzeichen ohne zusätzliche XP. Die Wochenquest endet mit dem UTC-Wochenwechsel; Entfernen oder Blockieren beendet sie sofort. Bereits erworbene Abzeichen bleiben erhalten.

## Bereitstellung und Abnahme

Nach P3.05–P3.07 die Migration `20261016093000_friends_quests.sql` anwenden, die Function `friends` und den aktualisierten `privacy-retention`-Endpoint bereitstellen. Der bestehende Retention-Scheduler muss aktiviert sein. `supabase/tests/database/friends.test.sql` deckt Einmalcodes, gegenseitige Beziehung, Questgutschrift, Blockierung, Berechtigungen und Retention ab. Die Supabase-Container sind in dieser Cloud nicht verfügbar (`public.ecr.aws` gesperrt); Migration und API müssen gegen echtes Postgres, iOS/Android und bei UTC-Wochenwechsel getestet werden. Die rechtliche Prüfung von Sichtbarkeit und Fristen bleibt offen.
