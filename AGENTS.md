# Arbeitsweise

Projektkonventionen und fachliche Vorgaben stehen in `CLAUDE.md` und `docs/plan/README.md`.

- Änderungen auf einem eigenen Arbeitsbranch vorbereiten und als Pull Request gegen `main` zur Prüfung stellen.
- Keine direkten Pushes nach `main`. Eine allgemeine Erlaubnis zum Mergen ersetzt den Pull Request und dessen Prüfungen nicht.
- Erst nach erfolgreicher erforderlicher CI und den vorgesehenen Reviews über den Pull Request mergen. Lokale Testergebnisse ersetzen den GitHub-Prüfstatus nicht.
- Ist der GitHub-API-Zugriff oder der Prüfstatus nicht verfügbar, den Branch und die PR-Beschreibung vorbereiten und den Blocker offen nennen. Den PR-Ablauf nicht durch direkten Merge umgehen.
- Arbeitsbranches nach erfolgreichem PR-Merge durch GitHubs automatische Branch-Löschung aufräumen lassen.

Claude Code bleibt Hauptprogrammierer. Offene fachliche, rechtliche, Geräte- und Anbieterabnahmen ausdrücklich offen halten.

Aktuelle Nutzeranweisung vom 16.10.2026: Codex lässt getestete Änderungen auf normalen Arbeitsbranches und erstellt selbst keine PRs oder Merges. Claude Code übernimmt anschließend den beschriebenen PR-/CI-/Integrationsablauf.
