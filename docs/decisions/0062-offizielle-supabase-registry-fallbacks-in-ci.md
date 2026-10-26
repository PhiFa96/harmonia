# ADR 0062 – Offizielle Supabase-Registry-Fallbacks in CI

Datum: 26.10.2026. Status: technische CI-Korrektur; neuer GitHub-Nachweis erforderlich.

## Anlass und Beleg

Entwurfs-PR #129 / Head `b736acf792e4a5efd8cf200e7ed38fcd9a608133` hat vier erfolgreiche Jobs. Im Supabase-Job von [Lauf 242](https://github.com/PhiFa96/harmonia/actions/runs/40363804119) scheitert bereits `db:start` mit der geschützten Diagnose `registry_rate_limit`. Ein einmaliger Neustart scheitert ebenso. Die Datenbankprüfungen wurden übersprungen und gelten nicht als bestanden.

Der erste Korrekturversuch in PR #130 setzt nur den festen Docker-Hub-Override leer. Auch [Lauf 243](https://github.com/PhiFa96/harmonia/actions/runs/40371164423) scheitert beim Download. Damit ist die Freigabe der Standard-Fallbacks allein unzureichend; der private Startlog lässt keine gesicherte Zuordnung des Downloadlimits zu einem einzelnen Image zu.

Gelesen wurde der tatsächliche TypeScript-Startpfad der im Lockfile gepinnten Supabase-CLI 2.121.0 am Release-Commit `8a549dffa6bc5c88069c61c1f55ef55ad9b82ae2`:

- [`docker-registry.ts`](https://github.com/supabase/cli/blob/8a549dffa6bc5c88069c61c1f55ef55ad9b82ae2/apps/cli/src/command-internal/docker-registry.ts): `getRegistryImageUrlCandidates` liefert für Standard-Images ohne Override ECR-, GHCR- und Docker-Hub-Kandidaten; für Slim-Referenzen ausdrücklich nur die eine GHCR-Referenz. Ein nicht leerer Override begrenzt Standard-Images ebenfalls auf eine Registry.
- [`image-prepull.ts`](https://github.com/supabase/cli/blob/8a549dffa6bc5c88069c61c1f55ef55ad9b82ae2/apps/cli/src/command-internal/db-bootstrap/image-prepull.ts) und [`docker-image-resolve.ts`](https://github.com/supabase/cli/blob/8a549dffa6bc5c88069c61c1f55ef55ad9b82ae2/apps/cli/src/command-internal/docker-image-resolve.ts): Start lädt alle erforderlichen Images über diese Kandidaten, nutzt den lokalen Cache und begrenzte Wiederholungen. Scheitern alle Kandidaten, schlägt der Start fehl.

Der zuvor gelesene gleichnamige Go-Helfer allein belegt das Verhalten des heutigen TypeScript-Startpfads nicht. Auch das im Stack-Paket vorhandene `slimImageMirrors` ist hier nicht eingebunden.

## Entscheidung

- Ausschließlich im GitHub-CI-Job: `SUPABASE_INTERNAL_IMAGE_REGISTRY=''` und `SUPABASE_USE_SLIM_IMAGES=0`. Reguläre, von der gepinnten CLI ausgewählte offizielle Images nutzen die eingebauten Registry-Kandidaten. Keine eigene Tag-/Digest-Umschreibung, kein fremder Mirror und kein Download- oder Anmeldetoken.
- Die regulären Images benötigen mehr Speicher als Slim-Images; der tatsächliche Runnerlauf muss Start und vollständige DB-Prüfung nachweisen. Die eingeschränkte Cloud-Arbeitsumgebung behält ihre konfigurierte Docker-Hub-/Slim-Zuordnung sowie Proxy-/CA-Einstellungen. Keine Änderung an lokalen Netzwerkregeln, Docker-Anmeldung oder Credentials.
- Healthchecks, Fehlerbehandlung und alle Migration-/RLS-/API-/Tutorprüfungen bleiben erforderlich. Kein `--ignore-health-check`, `continue-on-error` oder Auslassen von Diensten. Scheitert Download oder Start, bleibt der Job rot.
- Startausgabe bleibt in der privaten temporären Runnerdatei und wird nicht hochgeladen. Diagnosen nennen ausschließlich feste Fehlerklassen und feste Namen der im Log referenzierten Registry-Familien. Diese Referenzen beweisen nicht, welcher einzelne Pull letztlich scheiterte. Keine URLs, Tags, Digests, Kontodaten oder rohen Fehlertexte im CI-Protokoll.

## Prüfung und Grenzen

Acht Setup-/Diagnosetests einschließlich eines echten CLI-Aufrufs mit synthetischem privatem Log prüfen Wrapperverhalten und ausschließlich erlaubte Diagnoseausgaben. YAML-/JavaScript-Formatprüfung und gezielter Lint ergänzen dies. Der neue GitHub-Lauf muss den tatsächlichen Start und die zuvor übersprungenen Datenbanktests nachweisen. Die roten Vorgängerläufe werden nicht nachträglich als bestanden bezeichnet.

Dies ist technische Vorbereitung für die bestehenden internen P4-Entwürfe **vor der formalen Phase-4-Freigabe**. Keine Musik-/Bewertungs-/Inhaltsänderung, Produktionsmigration, Veröffentlichung oder Merge. Alle Fach-/Rechts-/Geräteabnahmen bleiben offen; P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.
