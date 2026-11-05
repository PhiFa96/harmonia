# Rohbericht Schule (PR #145, P4.13–P4.16) – Sicherheit/Datenschutz/Funktion

Stand 05.11.2026, Diff `origin/main...origin/codex/school-complete-draft`, gemergt in `claude/stoic-pascal-eaoojx`. Statische Prüfung der SQL-Dateien; DB-/pgTAP-Proben liefen hier nicht (kein Docker).

## Ergebnis

Keine Blocker gefunden. Was statisch geprüft wurde und in Ordnung ist:

- `school_draft.actor()` liefert `auth.uid()` (SECURITY DEFINER, `search_path=''`). Der Fixture-Shim liest nur `request.jwt.claims` mit `SET LOCAL` (`tools/school/complete.sql:3`, `identity-fixture.sql`, `database.mjs:136-143`).
- Der JWT-Prüfer arbeitet mit festem Issuer, fester Audience und vorkonfiguriertem JWKS (ES256/RS256). Er erkennt keine Schlüssel-URLs aus dem Token an, `sub` muss eine UUID sein, `exp`/`nbf`/`iat` werden geprüft (`auth.mjs`). Der Server sucht das Actor-Konto nur über `identity.subject`. Die Fixture-Umschaltung `/api/session` ist bei aktiver Authentifizierung gesperrt (`server.mjs:84-90,181`).
- Der Betreiber ist an die Tabelle `operators` gebunden, nicht mehr an eine feste UUID oder einen festen Schlüssel. Actors haben keinen Zugriff auf die Tabelle (`complete.sql:5-7`, `licenses.sql:2`).
- Einwilligungsversion: Freigabe gilt nur mit `sharing_policy = 'school-draft-sharing-v2'`. Alte Flags werden auf v1 gesetzt und geben nichts frei (`complete.sql:11-16,32-41`). Aufgabenergebnisse (`assignment_result_visible`) und Quizergebnisse (`quiz_answer_read`) hängen an `sharing_current` (`complete.sql:42-47`).
- Die Verwaltung erbt keinen Lernstand. `can_read_evidence` verlangt `teaches()`. `set_teacher` verbietet die Selbstzuweisung. Der FK `class_teachers(org_id,actor_id) → org_members` verhindert Lehrkräfte aus fremden Organisationen (`schema.sql:33-39`, `complete.sql:70-82`).
- Lizenzen: Zuweisung über organisationsgebundene Handles, Lernende nur nach eigener Anfrage. Kapazität unter `FOR UPDATE` auf der Rechnung, Zustand `paid` und `ends_at` werden geprüft. Bei Austritt oder Rücknahme der Anfrage wird der Platz entzogen (`licenses.sql` license_assign, `complete.sql:179-196`). Für `license_events` dürfen Actors nur bestimmte Spalten lesen, `actor_id`/`target` nicht (`complete.sql:50-51`).
- Alle SECURITY-DEFINER-Funktionen im Diff setzen `search_path=''`. `revoke all … from public` steht jeweils nach den Neuanlagen (`complete.sql:154,279,286`). Schreibende Policies auf Aufgaben-/Quizantworten haben `WITH CHECK` und gelten nur für die Serverrolle `harmonia_school_grader` (`assignments.sql:75-83`, `quiz.sql:74-77`). Trigger erzwingen Fristen, Anhängen ohne Umschreiben und Endgültigkeit (`complete.sql:115-152`).
- Export und Löschung: Der Export enthält nur Daten des eigenen Kontos. Ergebnisse unfertiger Aufgaben und Quizrunden bleiben darin verborgen. Die Löschung erfolgt kaskadierend, wer letzte:r Admin ist, muss die Rolle vorher übertragen. Server-Sitzungen werden bei Löschung beendet (`complete.sql:228-259`, `server.mjs:159-161`). Es gibt nur eine lokale Fixture und keine Supabase-Migration im Diff.

## Befunde

1. **Nacharbeit** – `tools/school/schema.sql:7-10`: `actors.id` hat keinen FK auf `auth.users` (on delete cascade). Für Supabase ist offen, wie Actors angelegt werden und was mit ihnen passiert, wenn ein Auth-Konto gelöscht oder gesperrt wird. In der Fixture legt der Server das Konto separat an.
2. **Nacharbeit** – `tools/school/server.mjs:82-99`: Das Bearer-Token wird nur beim ersten `GET /` geprüft, danach gilt das Cookie. Ein Widerruf oder eine Sperre in Auth wirkt erst bei `exp`, nach höchstens 8 h bzw. nach 15 min Leerlauf. Vor einer echten Nutzung braucht es eine erneute Prüfung oder kurze Lebensdauern.
3. **Nacharbeit** – `assignments.sql:75-83`, `quiz.sql:74-77`: Die Serverrolle `harmonia_school_grader` arbeitet mit demselben JWT-Claim des Lernenden. Wie das in Supabase umgesetzt wird (Edge Function, Rollenwechsel, kein Client-Zugriff), ist nicht beschrieben.
4. **Hinweis** – `complete.sql:255`: `delete_actor` löscht die Organisation einer allein verbliebenen Admin-Person samt bezahlter `license_invoices` (Kaskade). Ob Rechnungsdaten aufbewahrt werden müssen, ist eine Rechts- und Steuerfrage.
5. **Hinweis** – `complete.sql:17-21`: `sharing_events` bleiben nach der Löschung mit `actor_id=null` und `class_id` bis zu 180 Tage erhalten. Das ist ein pseudonymer Rest, der in der Datenschutzanlage zu nennen ist.
6. **Hinweis** – `complete.sql:261-278`: `purge_expired` läuft nur manuell durch den Betreiber, ohne Zeitplan. Die Fristen sind ausdrücklich keine Rechtsfreigabe.
7. **Hinweis** – `complete.sql:83-87`: `teacher_history` zeigt Lernenden die Konto-`key` der Lehrkräfte. Das ist für synthetische Konten unkritisch, bei echten Identitäten aber zu prüfen.

## Ausgeführte Tests

- `node --test tools/school/*.test.mjs`: 75 Tests, 17 bestanden, 58 fehlgeschlagen. **Alle 58 Fehlschläge** kommen daher, dass `docker run postgres:17-alpine` nicht verfügbar ist (`database.mjs:97`). Es sind keine Logikfehler, ein Ergebnis gibt es für diese Tests trotzdem nicht.
- `node --test tools/school/auth.test.mjs`: 4/4 bestanden.
- `pnpm check:i18n`: vollständig.
- Nicht ausgeführt (nur CI): pgTAP (`*-access.test.sql`), PostgreSQL-Integration, Playwright-Browserproben.

## Grenzen

Die RLS- und Triggerlogik ist hier nur statisch gelesen und nicht gegen eine Datenbank geprüft. Supabase-Integration, echte Identitäten, AVV/Schulrecht und Pilot bleiben offen.
