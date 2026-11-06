# Schule: Auth-Konten, Sitzungswiderruf und privater Grader

Stand: 06.11.2026 · Branch `codex/school-auth-revocation-draft` · Basis `main@ab157e8`.

Auf Nutzerauftrag bearbeitet dieses Paket die Schul-Befunde 1–3 aus dem [Prüfdurchgang v3](fachpruefung-phase-4-v3.md). Es bleibt **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe**. Alle Inhalte bleiben Entwurf, öffentlich null Lektionen. Keine Veröffentlichung, produktive Migration oder Main-Integration. P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt. [ADR 0076](../decisions/0076-schulidentitaet-und-widerruf-an-auth-binden.md).

## Implementierte Bindung

`actors.id → auth.users.id ON DELETE CASCADE` verhindert frei erfundene Schulidentitäten. Ein gültiges Auth-Konto erzeugt nicht automatisch ein Schulprofil, eine Lehrkraft- oder Betreiberrolle. Die kontrollierte Provisionierung muss das passende Konto ausdrücklich registrieren. Ein Auth-Konto kann ohne Schulprofil weiterhin andere Harmonia-Funktionen verwenden.

Der JWT-Einstieg verlangt ES256/RS256 mit vorkonfigurierten öffentlichen Schlüsseln, festem Issuer/Audience, UUID-Konto und UUID-`session_id`, `role: authenticated` sowie gültigen Zeitgrenzen. Rollen aus Nutzermetadaten vergeben keine Rechte. Das verifizierte Paar wird unveränderlich an das lokale Cookie gebunden; Token und private Signierschlüssel werden nicht an den Browser zurückgegeben.

`resolve_identity` gleicht dieses Paar frisch mit dem registrierten Schulprofil, `auth.users` und `auth.sessions` ab. `banned_until`, `deleted_at`, `not_after`, Kontozuordnung und das Vorhandensein der Sitzung werden geprüft. Ein entfernter Auth-Sitzungsdatensatz widerruft damit auch bereits geöffnete Cookie-Sitzungen auf mehreren Serverinstanzen. Eine andere aktive Auth-Sitzung desselben Kontos bleibt gültig. Eine einmal als widerrufen erkannte lokale Sitzung wird nicht wiederbelebt.

Die Prüfung läuft vor geschützten HTTP-Anfragen und erneut nach dem Empfang eines POST-Bodys. Quiz-SSE prüft vor und nach der Snapshot-Ermittlung und im bestehenden Sekundentakt bei ruhigen Räumen. Widerruf schließt den Stream mit `unavailable`; kein weiterer Snapshot wird ausgegeben. Ein Ausfall der Datenbankprüfung liefert HTTP 503 statt einer Zulassung aus alten Daten. Nach rein vorübergehendem Ausfall kann ein weiterhin gültiges Cookie erneut geprüft werden.

Die synthetische freie Kontenauswahl bleibt nur im expliziten Fixture-Modus. Im JWT-Modus sind Auswahl und Umschalt-Endpunkt gesperrt. Beide Modi bleiben an den Loopback-Server gebunden.

## Supabase-Rollenmodell

Die SQL-Reihenfolge lautet `schema.sql`, `assignments.sql`, `quiz.sql`, `licenses.sql`, `complete.sql`, `server-role.sql`. Die lokale Test-Fixture legt vorher einen kleinen Auth-Shim an; Supabase verwendet seine eigenen Auth-Tabellen und `auth.uid()`.

| Rolle | Aufgabe und Grenze |
|---|---|
| `harmonia_school_actor` | Aktuelles Konto über `SET LOCAL request.jwt.claims`; vorhandene RLS-/Einwilligungsregeln; kein Rollenwechsel zum Backend/Grader |
| `harmonia_school_grader` | Explizit ausgewählte serverseitige Engine-Schreibrechte, weiterhin RLS und Frist-/Antworttrigger |
| `harmonia_school_backend` | NOLOGIN, NOINHERIT, kein Superuser/CREATEROLE/BYPASSRLS; nur Identitätsauflösung und ausdrückliches SET zu Actor/Grader; kein direkter Auth-Tabellenzugriff |
| Separater Server-Login | Privates Backend, ausdrücklich vom Betreiber mit SET-Mitgliedschaft ausgestattet; nicht Teil der PostgREST-Clientrollen |

Für eine spätere Produktübernahme richtet ein berechtigter Betreiber einen separaten privaten Datenbank-Login mit NOINHERIT/NOSUPERUSER/NOBYPASSRLS ein und vergibt ausschließlich diese Mitgliedschaft:

```sql
GRANT harmonia_school_backend TO harmonia_school_worker
  WITH INHERIT FALSE, SET TRUE;
```

Login, Secret, TLS-Verbindung und Netzfreigabe werden über den Betreiberbetrieb eingerichtet, nicht über ein Browser-JWT und nicht mit einem eingecheckten Passwort. Das private Node-Backend erhält diesen Pool über `createSchoolServer({ pool, authentication })`; jeder Rollen-/Claimwechsel ist transaktionslokal. `anon`, `authenticated`, `authenticator` und `service_role` bekommen keine Backend-/Grader-Mitgliedschaft. Der Client erhält keinen Grader-JWT. Dieses Konzept benutzt eine private Datenbankverbindung; es behauptet keine Rollenumschaltung in einer öffentlichen Supabase-REST-Anfrage.

Das Paket installiert nichts auf einer produktiven Instanz. Die Supabase-pgTAP-Prüfung baut das Schulmodell mit echten Auth-Tabellen nur in einer zurückgerollten Transaktion der lokalen CI-Datenbank auf. Der tatsächliche Produkt-Migrations-/Login-/Geheimnisbetrieb bleibt abzunehmen.

## Nachweise

Vor der Implementierung rot: verwaistes Schulprofil möglich; bestehendes Cookie trotz widerrufener Provider-Sitzung zugelassen. Der unveränderte Ausgangsstand bestand 75 Schulprüfungen. Neue echte PostgreSQL-/HTTP-Prüfungen decken kontoübergreifende Sitzungen, mehrere Server, unabhängige Zweitsitzungen, Sperre, Soft-/Hard-Delete, Ablauf, 503 ohne Datenleck, POST-Widerruf, ruhige SSE und einen tatsächlichen eingeschränkten Datenbank-Login ab. pgTAP prüft dieselben Rollen und Auth-Beziehungen unter lokaler PostgreSQL-Fixture und Supabase. DE/en-US/en-GB-Browserprüfungen entfernen nach Widerruf die bereits geöffnete Ansicht.

```sh
corepack pnpm school:test
corepack pnpm school:test:db
# Nur gegen die eigene lokale CI-Supabase-Instanz:
corepack pnpm school:test:db --supabase
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium corepack pnpm school:test:web
corepack pnpm typecheck
NODE_OPTIONS=--max-old-space-size=8192 corepack pnpm lint
corepack pnpm format:check
```

Konkrete Zahlen und alle fünf GitHub-CI-Jobs am finalen Commit werden im eigenen Entwurfs-PR belegt. Lokale grüne Prüfungen ersetzen diesen Nachweis nicht.

## Offen

Unabhängige Prüfung, echte Anbieter-/Betreiberprovisionierung und Schlüsselbetrieb, Produktmigration und Einbindung der Konto-Datenrechte, rechtlich geprüfte Löschung/Aufbewahrung einschließlich Rechnungen und Organisationen ohne Verwaltung, Schulrecht/AVV, P4.17, reale Geräte-/Screenreader-/30-Geräte- und Pilotabnahmen. Weitere v3-Befunde zu Tutor, KI-Bindung, Zertifikaten und musikalischen Erläuterungen sind separate Arbeitspakete.
