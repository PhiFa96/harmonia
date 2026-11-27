# P3.07 – Tägliches Rätsel

Technischer Branch `codex/p3-07-daily-puzzle`, aufbauend auf `codex/p3-06-duels`. Entscheidung: [ADR 0034](../decisions/0034-tagesraetsel-aus-freigegebenem-katalog.md).

Die Function `daily-puzzle` stellt für angemeldete Konten das Rätsel des lokalen Kalendertags bereit. Aus veröffentlichten, bereits redaktionell ausgewählten Aufgaben werden 42 Tage im Voraus materialisiert. Eine Tagesaufgabe bleibt nach einer neuen Inhaltsfreigabe gleich. Der lokale Vorschaumodus nutzt redaktionelle Entwürfe. Montag bis Sonntag werden zunehmend schwere verfügbare Stufen gewählt. Die Aufgabe erscheint ab lokaler Mitternacht; Vordergrundwechsel und ein kurzer Intervall prüfen den Tageswechsel. Eine Antwort pro Tag wird von der Engine und einer Datenbanktransaktion bestätigt. Die eigene Serie zählt aufeinanderfolgende richtige Tage, einschließlich gestern bis zum heutigen Versuch. Falsche Antworten beenden die Serie. Der Teiltext enthält Datum, 🟩/⬜, den ausgeschriebenen Status und die Serienlänge.

## Bereitstellung und Abnahme

Nach den vorangehenden Migrationen `20261016090000_daily_puzzles.sql` anwenden, `daily-puzzle` und den erweiterten Privacy-/Retention-Endpoint bereitstellen. Es ist kein zusätzlicher Puzzle-Cron nötig: ein Abruf ergänzt den Vorrat atomar bis Tag 42. Der produktive veröffentlichte Katalog ist derzeit leer; bis zur redaktionellen Freigabe antwortet die Funktion für unbesetzte Tage ohne Rätsel. Kein Entwurfsinhalt wird ungeprüft produktiv ausgegeben.

Rätsel-Rohantwort, genaue Antwortzeit und Zeitzone verschwinden nach zwölf Monaten über den bestehenden, noch zu aktivierenden Retention-Job. Eigene Resultate werden exportiert und bei Kontolöschung entfernt. Eine juristische Freigabe ist ausstehend.

Reine Auswahl-, Zeit- und Schema-Tests, TypeScript, Deno, Web-Build, Übersetzungen, Lint und SQL-Syntax können lokal geprüft werden. `supabase/tests/database/daily_puzzles.test.sql` prüft Einmaligkeit, eingefrorene Tage, Serie, Retention und Berechtigungen. Die Supabase-Container konnten in dieser Cloud bislang nicht heruntergeladen werden (`public.ecr.aws` gesperrt). Daher sind die Migration und API gegen echtes Postgres, iOS/Android sowie Mitternacht auf Geräten noch separat zu testen. Auch fachliche Prüfung der veröffentlichten Aufgaben bleibt vor dem Release nötig.

M2 ergänzt die kontogebundene Zeitzone, ihre 20-Stunden-Sperre und die Drosselung der Abrufe. Der kanonische Bank-Hash gilt für neu eingefrorene Tage. Siehe [ADR 0084](../decisions/0084-zeitgrenzen-und-drosselung.md).
