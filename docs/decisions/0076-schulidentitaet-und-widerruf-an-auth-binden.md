# ADR 0076: Schulidentität und Sitzungswiderruf an Auth binden

Datum: 06.11.2026 · Status: angenommen für den internen technischen Entwurf; Produkt-/Rechts-/Anbieterabnahmen offen.

## Anlass

Der Nutzer beauftragt die drei Schul-Nacharbeiten aus der Fachprüfung Phase 4 v3 als Gesamtpaket: Auth-Fremdschlüssel, Widerruf laufender Sitzungen und Supabase-Berechtigungen der Grader-Rolle. Der integrierte Stand prüfte das JWT nur beim Einstieg und verwendete danach eine lokale Cookie-Sitzung bis zu deren Ablauf.

## Entscheidung

- `school_draft.actors.id` referenziert `auth.users.id` mit `ON DELETE CASCADE`. Die lokale Fixture enthält ausschließlich die benötigten Auth-Spalten; die Supabase-Prüfung verwendet die echten Auth-Tabellen. Eine Registrierung als Lehrkraft oder Betreiber bleibt eine getrennte, vertrauenswürdige Provisionierung.
- Geprüfte JWTs brauchen neben Signatur, Issuer, Audience und Zeitgrenzen eine UUID `session_id` sowie `role: authenticated`. Ein fremdes Sitzungskonto, ein gesperrtes/gelöschtes Konto oder eine abgelaufene/entfernte Auth-Sitzung erhält keinen Zugang.
- Die Signatur wird beim Einstieg geprüft. Die verifizierte Konto-/Sitzungsbindung liegt unveränderlich im Serverspeicher, der Browser erhält nur ein zufälliges HttpOnly-Cookie. Jede geschützte Anfrage prüft den aktuellen Zustand in `auth.users` und `auth.sessions` neu; nach Empfang eines POST-Bodys wird vor einer Änderung erneut geprüft. Eine Sitzung wird bei beobachtetem Widerruf geschlossen; andere Auth-Sitzungen desselben Kontos bleiben unabhängig.
- Laufende SSE-Verbindungen prüfen die gleiche Bindung vor und nach jeder Snapshot-Ermittlung. Auch ruhige Räume werden im bestehenden Sekundentakt geprüft. Ein Widerruf oder Prüffehler beendet den Stream ohne weiteren Snapshot. Datenbankausfälle ergeben HTTP 503 und verwenden keinen zwischengespeicherten Berechtigungsentscheid.
- `harmonia_school_backend` ist eine private NOLOGIN-/NOINHERIT-Capability ohne Superuser-, Rollenverwaltungs- oder RLS-Umgehungsrechte. Nur sie darf die begrenzte SECURITY-DEFINER-Funktion `resolve_identity` ausführen und ausdrücklich Actor/Grader auswählen. Auth-Tabellen werden der Capability nicht direkt zum Lesen freigegeben.
- Ein separater privater Server-Login erhält vom Betreiber ausdrücklich SET-Mitgliedschaft in dieser Capability. Er setzt pro Transaktion die passende Rolle und den geprüften Kontobezug mit `SET LOCAL`; Browser, öffentliche API-Rollen und JWT-Rollen erhalten diese Mitgliedschaft nicht. Ein tatsächlicher eingeschränkter PostgreSQL-Login wird im HTTP-Test verwendet.

## Folgen und Grenzen

Das Paket bleibt **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe**. Der Server bleibt eine lokale Werkstatt. Kein Remote-Schema, echter Anbieter, Live-Login oder Schulbetrieb wird eingerichtet. Die neue lokale Schemafassung erfordert einen Neustart der flüchtigen Vorschau; Katalog-/Lektionsstände bleiben unverändert.

Die Löschkaskade entfernt kontogebundene Schuldatensätze. Sie entscheidet keine Rechnungs-/Aufbewahrungsfrage und löscht nicht zusätzlich sämtliche Organisationen ohne Verwaltung. Produktmigration, Betreiber-/Kontenprovisionierung, Schlüsselrotation, Löschablauf für verwaiste Organisationen und rechtlich erforderliche Aufbewahrung müssen vor echter Nutzung geklärt werden. Literatur-, Geräte-, Schulrechts-/AVV- und Pilotabnahmen bleiben offen. P4.01 bleibt bis F14/Rechtsklärung zurückgestellt.

Details, Einrichtung und Nachweise: [Schul-Authentifizierung](../plan/schule-authentifizierung.md).
