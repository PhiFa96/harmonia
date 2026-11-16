# Tutor-Sicherheitsnacharbeit: Signatur, Prüfbudget und alte Anfragen

Stand: 13.11.2026 · Branch `codex/tutor-attempt-security-draft` · Basis `main@ab157e8`.

Auf Nutzerauftrag werden die Tutor-Befunde N1–N4 und H3 aus der [Fachprüfung v3](../quality/fachpruefung-phase-4-v3/tutor.md) umgesetzt. Die Fachprüfungen vom 31.10./05.11. sind dokumentiert; diese Nacharbeit ersetzt sie nicht. Technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**. Alle Inhalte bleiben Entwurf. Keine Veröffentlichung, Main-Integration oder entfernte Bereitstellung. P4.01 bleibt bis F14/Recht zurückgestellt. [ADR 0077](../decisions/0077-tutor-nachweise-mit-eigenem-schluessel-und-pruefbudget.md).

## Bearbeitete Befunde

| Befund | Umsetzung |
|---|---|
| N1 | Eigenes `TUTOR_ATTEMPT_SECRET`, ohne Fallback; identisches Administrationssecret wird abgewiesen. Service-Role-Rotation ändert nicht mehr automatisch das HMAC-Material. |
| N2 | Gemeinsamer Ausgabepfad mit unterscheidbaren Konfigurations-/Speicher-/Inhaltsfehlern. 503 für fehlenden Schlüssel, 422 ausschließlich für ungültige Inhalte; malformed Kontext ergibt `attempt_invalid` statt ungefangenem Parsefehler. |
| N3 | Zuerst Eigentümer und vollständiger Anfragehash des gespeicherten Datensatzes. Altanfragen ohne Nachweis sowie passende gespeicherte Anfragen mit abgelaufenem/altem Signaturschlüssel sind ohne neuen Modellaufruf abrufbar. |
| N4 | Eigenes atomares PostgreSQL-Prüfbudget: 30 Aufrufe pro Konto/60 Sekunden, danach 429 `rate` und `Retry-After` zwischen 1 und 60 Sekunden. |
| H3 | Bis fünf Sekunden Toleranz für eine vorausgehende Ausstellungsuhr, Ablauf weiter exklusiv bei `expiresAt`. |

## Anfrageablauf und Grenzen

`POST /tutor?view=attempt` authentifiziert weiterhin ein echtes nicht anonymes Konto und begrenzt den Körper. Das strikte Schema akzeptiert nur Quelle und Antwort. Der gemeinsame Ausgabepfad prüft danach das separate Signatursecret und das Datenbankbudget. Erst dann werden Aufgabe und Antwort mit der Engine geprüft und ein Nachweis ausgegeben. Konfigurationsausfall oder Budgetüberschreitung liefern weder Nachweis noch Lösung. Auch ungültige Antworten/Quellen nach erfolgreicher Schema-/Budgetprüfung verbrauchen einen Prüfschritt. Hinweise und Chat benötigen weiterhin kein Signatursecret.

Bei einer Tutor-Anfrage prüft der Server zunächst die Kombination aus Anfrage-ID, Eigentümer und Hash des vollständig kanonisch geparsten Inputs. Ein Treffer darf nur bestehende Arbeit wiedergeben beziehungsweise nach der bisherigen Regel eine verwaiste Reservierung abschließen. Inhaltliche Änderungen erzeugen `conflict`; fremde Konten bekommen keinen Replay. Gelöschte Antworten bleiben gelöscht. Für jede neue Erklärung/Lösung folgt die frische kryptografische Bindungs-/Ablaufprüfung vor jeder Modellreservierung.

Ein passender alter Nachweis kann innerhalb seiner Gültigkeit weiterhin mehrere kostenpflichtig reservierte Erklär-/Lösungsanfragen ermöglichen. Das Prüfbudget ersetzt keine Abo-, Kosten- oder Modellkontingente. Der Nachweis bestätigt keine menschliche Erstbearbeitung, ausgeschöpften Hinweise oder abgeschlossene Offline-Lektion. Neue Lernnachweise, XP oder Rohantworttabellen werden nicht angelegt.

## Daten und Aufbewahrung

`tutor_attempt_limits` enthält höchstens einen Datensatz je Auth-Konto: `user_id`, `window_started_at`, `requests` (1–30). Die Tabelle hat RLS und keine Client-Lese-/Schreibrechte. Die Service-RPC serialisiert pro Konto, begrenzt abgewiesene Aufrufe ohne weitere Zählererhöhung und eröffnet nach Ablauf ein neues Fenster. Ein zweites Konto besitzt sein eigenes Budget.

Eigener Export: Abschnitt `tutorAttemptLimits`. Auth-Kontolöschung entfernt den Datensatz per Fremdschlüssel. `retain_tutor_attempt_limits()` entfernt Fenster älter als einen Tag, höchstens 100 je Aufruf, und wird vom bestehenden `privacy-retention`-Pfad aufgerufen. Der tatsächliche Schedulerbetrieb bleibt Teil der Betriebsabnahme; keine neue produktive Zeitplanung wird eingerichtet. Die Privatsphäreprüfung umfasst weiterhin Kontentrennung und Bereinigung.

## Konfiguration und Ausrollreihenfolge

1. Nach Review die additive Migration `20261113090000_tutor_attempt_security.sql` auf die vorgesehene Instanz anwenden. Im Auftrag wird sie nur auf eigenen lokalen/CI-Fixtures ausgeführt.
2. Ein unabhängiges, kryptografisch zufälliges `TUTOR_ATTEMPT_SECRET` über die serverseitige Secretverwaltung bereitstellen. Empfohlen: mindestens 32 zufällige Bytes als Base64url; 32–4096 Base64-/Base64url-Zeichen werden akzeptiert. Weder Administrationsschlüssel wiederverwenden noch Secretwerte in Chat, Logs oder Dokumentation eintragen.
3. Aktualisierte Function bereitstellen und Authentifizierung, Neuprüfung, Replay, 429 und Datenschutz prüfen. Der vorhandene Clientvertrag bleibt gültig; Prompt/Werkzeuge bleiben 5/3.
4. Alte noch nicht verwendete Service-Role-signierte Nachweise neu anfordern. Der bestehende Client verwirft einen abgewiesenen Nachweis vor einer neuen Anfrage. Bereits gespeicherte passende Anfragen bleiben unabhängig vom aktuellen Signatursecret lesbar, solange Authentifizierung und Datenbank verfügbar sind.

Fehlt die Migration, wird die Ausgabe mit Speicherfehler 503 gesperrt. Fehlt das Secret, sind neue Nachweise/geschützte Modellanfragen mit 503 gesperrt. Es gibt keinen Fallback zum Administrationsschlüssel und keine kostenpflichtige Wiederholung beim Lesen alter Antworten. Die lokale Option `--tutor-test` stellt ausschließlich ein bekanntes synthetisches Testsecret bereit. Der produktive Function-/App-Code importiert diese Fixture nicht. Echte Modellaufrufe werden weiterhin nur ausdrücklich und mit sicherer Anbieterbindung gestartet.

## Nachweise

Drei vor der Implementierung rot beobachtete Regressionen: frischer Nachweis bei kleiner Uhrenabweichung abgewiesen; Signaturkonfigurationsfehler nicht von Inhalt getrennt; beschädigter Quellkontext wirft einen Serverfehler. Neue Prüfungen verwenden echte Web-Crypto und tatsächliche PostgreSQL-Verbindungen.

```sh
node --test tools/tutor-attempts.test.mjs tools/tutor-attempt-service.test.mjs tools/tutor-interface.test.mjs
corepack pnpm db:test:tutor:attempts
corepack pnpm check:tutor
# Gegen die eigene lokale Supabase-Instanz mit --tutor-test:
corepack pnpm db:test:tutor
corepack pnpm db:test
corepack pnpm db:test:privacy
corepack pnpm typecheck
NODE_OPTIONS=--max-old-space-size=8192 corepack pnpm lint
corepack pnpm format:check
```

Die SQL-Prüfung startet nur ihren eigenen Loopback-/tmpfs-PostgreSQL-17-Container. 60 parallele Verbindungen müssen genau 30 Zulassungen ergeben; Clientrechte, Kontentrennung, Fensterneustart, Retention und Kontolöschung sind eingeschlossen. Weitere 15 pgTAP-Prüfungen und echte HTTP-/Auth-/REST-Fälle decken Altanfragen, Schlüsselwechsel, gleichzeitige Nachweisausgabe, Grenzen des Modellkontingents und Datenschutz ab.

Ein lokaler vollständiger Supabase-Start wurde versucht und scheiterte beim Entpacken großer Images an der 8-GB-Dateisystemgrenze. Die neu für diesen Versuch geladenen unbenutzten Images wurden entfernt. Der kleinere PostgreSQL-Lauf ist erfolgreich; vollständige Supabase-/HTTP-/Browserprüfungen laufen zusätzlich in der erforderlichen CI. Konkrete Zahlen und alle fünf Jobs am finalen Commit stehen im Entwurfs-PR.

Keine Live-Modellqualität oder Produktfreigabe aus simuliertem Modelltransport ableiten. Der separate Schul-PR #151 ist nicht in diesem Branch enthalten. Weitere v3-Nacharbeiten zu KI/Zertifikaten und musikalischen Erläuterungen bleiben eigene Arbeitspakete.
