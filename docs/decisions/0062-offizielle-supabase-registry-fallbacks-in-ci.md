# ADR 0062 – Offizielle Supabase-Registry-Fallbacks in CI

Datum: 26.10.2026. Status: technische CI-Korrektur; neuer GitHub-Nachweis erforderlich.

## Anlass und Beleg

Entwurfs-PR #129 / Head `b736acf792e4a5efd8cf200e7ed38fcd9a608133` hat vier erfolgreiche Jobs. Im Supabase-Job von [Lauf 242](https://github.com/PhiFa96/harmonia/actions/runs/40363804119) scheitert bereits `db:start` mit der geschützten Diagnose `registry_rate_limit`. Ein einmaliger Neustart der fehlgeschlagenen Prüfung scheitert mit derselben Diagnose. Die eigentlichen Datenbankprüfungen wurden dabei übersprungen; sie gelten nicht als bestanden.

Der Quelltext der im Lockfile gepinnten Supabase-CLI 2.121.0 wurde am zugehörigen Commit [`8a549dffa6bc5c88069c61c1f55ef55ad9b82ae2`](https://github.com/supabase/cli/blob/8a549dffa6bc5c88069c61c1f55ef55ad9b82ae2/apps/cli-go/internal/utils/docker.go) gelesen. `GetRegistryImageUrls` bietet ohne Override offizielle ECR-, GHCR- und Docker-Hub-Kandidaten an; ein nicht leerer Override begrenzt die Auswahl dagegen auf genau eine Registry. Die bisherige CI-Einstellung `docker.io` verhinderte damit die eingebauten Fallbacks. `DockerResolveImageIfNotCached` verwendet vorhandene Images bzw. die Kandidaten mit den vorgesehenen begrenzten Downloadversuchen.

## Entscheidung

- Ausschließlich der GitHub-CI-Job setzt `SUPABASE_INTERNAL_IMAGE_REGISTRY` ausdrücklich leer. Die gepinnte CLI verwendet ihre eigenen offiziellen Registry-Kandidaten und Versionen. `SUPABASE_USE_SLIM_IMAGES=1` bleibt gesetzt.
- Die eingeschränkte Cloud-Arbeitsumgebung behält ihre konfigurierte Docker-Hub-Zuordnung und Proxy-/CA-Einstellungen. Keine Änderung an Netzwerkregeln, Docker-Anmeldung oder Credentials, kein Ausweichen auf eine in dieser Umgebung gesperrte Registry.
- Supabase-Healthchecks, Fehlerbehandlung und alle nachfolgenden Migration-/RLS-/API-/Tutorprüfungen bleiben erforderlich. Kein `--ignore-health-check`, `continue-on-error` oder Auslassen von Diensten. Scheitern alle vorgesehenen Downloads oder der Start, bleibt der Job rot.
- Die Startausgabe bleibt in der privaten temporären Datei des Runners. Nur die bereits vorhandene statische Diagnose gelangt in das CI-Protokoll; keine lokalen Schlüssel oder rohen Fehlertexte werden veröffentlicht.

## Prüfung und Grenzen

Für die kleine Workflow-Konfiguration werden die vorhandenen Setup-/Diagnosetests und die YAML-Formatprüfung verwendet. Kein neuer Test spiegelt lediglich den geänderten Konfigurationswert. Der tatsächliche Start und die Datenbankprüfungen müssen im neuen GitHub-Lauf nachgewiesen werden; ein erfolgreicher Parser- oder Werkzeugtest ersetzt sie nicht. Die alte rote Prüfung wird nicht nachträglich als grün bezeichnet.

Dies ist technische Vorbereitung für die bestehenden internen P4-Entwürfe **vor der formalen Phase-4-Freigabe**. Keine Musik-/Bewertungs-/Inhaltsänderung, Produktionsmigration, Veröffentlichung oder Merge. Alle Fach-/Rechts-/Geräteabnahmen bleiben offen; P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.
