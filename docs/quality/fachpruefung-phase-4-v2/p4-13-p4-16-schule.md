# Prüfbericht D – Schulfunktionen P4.13–P4.16 (Stand a8738ff, nur lesend)

Gesamtbild: Alles liegt als lokales, flüchtiges Entwurfsschema `school_draft` unter `tools/school/`. Es gibt keine Supabase-Migration, keine App-Route und keinen Import in Standardübersetzungen. Ich habe keinen BLOCKER gefunden, der den Entwurf selbst betrifft. Die Befunde betreffen die Übernahme in den Betrieb und Lücken bei Datenschutz und Tiefenverteidigung.

## Gesichert (durch Lesen, ohne DB-Lauf)
- Gating: `git ls-files supabase` enthält nichts zu Schule. Es gibt keine Verweise aus `apps/` oder `packages/i18n/src/index.ts`. `tools/check-public-bundle.mjs` sperrt Schulstrings und `school_draft`. Die 13 Inhalts-/Berichtstests liefen lokal grün.
- RLS: Alle 21 Tabellen haben RLS. `invites` und `quiz_material` sind für Browserrollen nicht lesbar. Definer-Funktionen haben `search_path=''`, `PUBLIC` ist entzogen und die Rechte werden pro Funktion geprüft. Die Rollenerhöhung (Lernender zu Personal, Lehrkraft zu Admin) ist ausgeschlossen.
- Fremde Klassen: Teilnehmer fremder Klassen und Lehrkräfte derselben Organisation sehen weder Aufgaben noch Quiz oder Ergebnisse. Fremdklassen-Zielzeilen scheitern an zusammengesetzten Fremdschlüsseln.
- Quiz: Lösung und Punkte erscheinen erst in `review`/`finished`. Das Material der Folgerunden verlässt den Server nie. Die Streams prüfen die Rechte jede Sekunde neu.
- Lizenz: Platzvergabe unter `FOR UPDATE` auf die Rechnung (atomar). `license_access()` prüft Zeit und Berechtigung bei jedem Lesen. Nur der Betreiber kann `paid` setzen.
- Frist: Bei Versuchsstart prüft das `INSERT ... WHERE clock_timestamp() < due_at` die Frist (Fix c9b685d). Antworten werden mit derselben Bedingung gespeichert. Abschluss und Schließen laufen unter dem Klassenlock.

## Befunde
**F1 NACHARBEIT (BLOCKER bei Produktivübernahme)** – `schema.sql:84`, `licenses.sql:2`, `server.mjs:65-67`
- Aussage: Die Identität ist die Sitzungsvariable `school_draft.actor`. Der Betreiber ist die fest einkodierte UUID `…0009`. Jeder Prozess auf Loopback bekommt per `POST /api/session` jedes der 9 Konten.
- Szenario: Würde das Schema mit Supabase/PostgREST übernommen, könnte jede SQL-Ausführung `set_config('school_draft.actor', <fremde UUID>)` setzen und damit Identität und Betreiberrolle übernehmen. Das lokale `SET ROLE` lässt sich vom Superuser-Session-User per `RESET ROLE` aufheben.
- Prüfweg: Im Entwurf folgenlos, weil nur parametrisierte Festabfragen laufen. Die Docs benennen das (ADR 0040), sollten aber `auth.uid()`-Bindung und Betreiberrolle als harte Übernahmebedingung nennen.

**F2 NACHARBEIT (Datenschutz)** – `schema.sql:64`, `assignments.sql:71`, `quiz.sql` (`quiz_answer_read`), `packages/i18n/src/school-draft.ts` (`shareInfo`)
- Aussage: Ein einziges `class_members.sharing` gilt jetzt auch für Aufgabenergebnisse (P4.14) und Quiz-Endergebnisse (P4.15). Der Einwilligungstext nennt nur Lernbereiche, Quoten und Beispiellektionen. Die protokollierte Textversion bleibt `school-draft-sharing-v1`.
- Szenario: Ein Lernender (möglicherweise minderjährig) stimmt dem P4.13-Text zu, und die Lehrkraft sieht danach pro-Person-Ergebnisse von Aufgaben und Quiz. Das ist Zweckerweiterung ohne neue Einwilligung und ohne Versionssprung.
- Prüfweg: `sharing_events.policy` und die Texte in `school-assignments.ts`/`school-quiz.ts` vergleichen. Das Datenschutzdokument beschreibt die Kopplung, die Lernendenoberfläche nicht.

**F3 NACHARBEIT (Datenminimierung)** – `schema.sql:201`, `service.mjs` (`report`), `assignment-service.mjs` (`report`)
- Aussage: Das „Pseudonym“ `P-<letzte 8 Hexstellen der Konto-UUID>` ist vom Konto abgeleitet und in allen Klassen gleich. Berichte liefern zusätzlich die volle `actor`-UUID an die Lehrkraft.
- Szenario: Lehrkräfte verschiedener Klassen oder Organisationen können dieselbe Person über den Alias verknüpfen. Bei echten Supabase-IDs wäre die „Pseudonymisierung“ nur eine Kürzung. Zufallsalias pro Mitgliedschaft und keine Konto-UUID im Lehrerbericht wären besser.

**F4 NACHARBEIT (Löschung/Export/Retention)** – `schema.sql:52`, `licenses.sql:25`, `quiz.sql`
- Aussage: Weder Datenexport noch Konto-Löschkaskade noch Retention-Job existieren. Das ist für den Entwurf zulässig und dokumentiert („vor Betrieb“). Innerhalb des Schemas fehlt aber `ON DELETE` bei `invites.issuer` und `license_events.actor_id`.
- Szenario: Das Löschen eines `actors`-Eintrags einer Lehrkraft oder des Betreibers schlägt mit FK-Verletzung fehl. Die Quizfrist (2 h) sperrt nur den Zugriff, Antworten und Teilnahme bleiben bis zur Klassenlöschung. Beim Verlassen der Klasse wird auch das Einwilligungsprotokoll (`sharing_events`) kaskadierend gelöscht.
- Prüfweg: Beim Produktivschema Export und Löschung in `privacy-export`/Löschfunktion ergänzen und `ON DELETE`-Regeln festlegen.

**F5 NACHARBEIT (Tiefenverteidigung)** – `assignments.sql:75-76`, Grants Z. 82-84
- Aussage: Die Frist, `closed_at` und `finished_at` werden nur im Servicecode erzwungen. Die Grader-Policies `attempt_create`/`attempt_update` prüfen sie nicht. Der Grader darf `answers`, `correct`, `finished_at` und `reason` frei schreiben.
- Szenario: Ein künftiger Servicefehler oder SQL-Injection erlaubt Antworten nach der Frist oder nachträglich geänderte Punkte, ohne dass die DB widerspricht. Der c9b685d-Fehler zeigt das Muster, weil die Fristprüfung erst nachträglich im SQL ergänzt wurde. Ein `WITH CHECK (... finished_at is null and now() < due_at)` oder ein Trigger wäre robuster.

**F6 NACHARBEIT (Rechte breiter als dokumentiert)** – `licenses.sql:108,112`, `quiz.sql:69,75`
- Aussage: Der Betreiber sieht über `license_events` per RLS auch `actor_id` und `target` (die Sitzinhaber), obwohl die Doku „keine Teilnehmerliste“ sagt. Lehrkräfte sehen über `quiz_players` die Zuordnung Spielkürzel zu Konto-UUID und die Ranking-Wahl, obwohl die Doku nur „zufälliges Kürzel“ nennt.
- Szenario: Heute verhindert die HTTP-Schicht die Ausgabe. Bei jedem direkten Zugriff (PostgREST, Fehler im Service) werden die Aussagen der Doku verletzt. Spaltenweise `GRANT` wäre sinnvoll, wie bei `assignment_attempts`.

**F7 NACHARBEIT** – `schema.sql:135-146` (`set_teacher`)
- Aussage: Die Verwaltung kann sich selbst einer Klasse zuweisen, weil sie Organisationsmitglied ist, und sieht dann freigegebene Lernstände. Es gibt kein Audit-Ereignis und keine Benachrichtigung der Lernenden.
- Szenario: „Verwaltung erbt keinen Lernstandzugriff“ stimmt nur bis zur Selbstzuweisung. Der pgTAP-Test deckt nur den Fall ohne Zuweisung ab. Empfehlung: Zuweisungsprotokoll, sichtbar für Lernende, und eine Regel für Selbstzuweisung. Ein Testfall fehlt.

**F8 NACHARBEIT (Vermutung, Last)** – `quiz-service.mjs:38-41`, `assignments.sql:85`, `quiz-streams.mjs`
- Aussage: Jeder Lesezugriff (`view`, auch im 1-s-Takt jedes SSE-Streams) nimmt über `assignment_class_lock` einen exklusiven `FOR UPDATE` auf Klassenzeile und eigene Mitgliedszeile.
- Szenario: Bei 30 Streams plus Lehrkraft wird die Klasse serialisiert. `set_sharing(false)`, Beitritt und Archivierung warten dahinter, ein Widerruf wird verzögert. Die 244-ms-Probe belegt das nicht für Last im Unterricht. Prüfweg: Lastprobe mit gleichzeitigem Widerruf, oder Leselock als `FOR SHARE`.

**F9 NACHARBEIT (gering)** – `quiz-service.mjs:7`, `schema.sql:179`
- Aussage: Der Quizcode hat 40 Bit, ist unsalted gehasht und hat kein Versuchslimit. Er ist nur für eingeschriebene Mitglieder prüfbar und zwei Stunden gültig. Der Klassencode hat 96 Bit und uniforme Fehler, aber ebenfalls kein Limit.
- Szenario: Ein Mitglied kann ohne Lehrercode Quizräume erraten (Aufwand realistisch hoch, aber nicht gedrosselt). Eine Drossel pro Konto ist für den Betrieb zu ergänzen.

**F10 NACHARBEIT (gering, Funktion)** – `quiz-service.mjs` (`run`-Fehlerabbildung), `service.mjs:run`
- Aussage: `23505` wird im Quizdienst nicht abgebildet. Spielkürzel- oder Quizcode-Kollision (32/40 Bit) liefert 500. Beim Klassenbeitritt wird eine Alias-Kollision zu „invalid“ und der Lernende kann nie beitreten (F3).

**F11 NACHARBEIT (lokal)** – `server.mjs:65`
- Aussage: Die Sitzungstabelle hat keinen Ablauf. Nach 128 Cookies liefert die Vorschau dauerhaft 503. Kein Sicherheitsproblem, nur Robustheit.

**F12 Hinweis, dokumentiert** – `licenses.sql:43` (`license_candidates`)
- Aussage: Die Verwaltung erhält eine Liste aller Lernenden in nicht archivierten Klassen der Organisation (Konto-Schlüssel). Das widerspricht P4.13 (Roster nur für zugewiesene Lehrkräfte) und steht im Lizenzdokument als „Mitglieder dafür sehen“. Im Produktivbetrieb Zweck und Rechtsgrundlage prüfen.

**F13 Testlücken** (Prüfweg: Testnamen in `school.test.mjs`, `*-access.test.sql`)
- Es gibt keine Tests für Selbstzuweisung der Verwaltung (F7), Versuchslimit/Brute-Force auf Codes (F9), Leserechte des Betreibers auf `license_events.target` und Lehrer-Leserechte auf `quiz_players` (F6), FK-Löschung eines Staff-Kontos (F4) oder Schreibsperre des Graders nach der Frist auf DB-Ebene (F5).
- Positiv: Es gibt Tests für Rennen der letzten Platz-Einlösung, Mitgliedschaftsende gegen Platzvergabe, Idempotenz und Rechteentzug in laufenden Streams.

Randnotizen: Der Playwright-Trace (`retain-on-failure`) enthält das zufällige, synthetische Sitzungscookie. Er geht als 7-Tage-Artefakt in die CI und ist unkritisch. 9de61ea (CI-Diagnose) gibt nur Whitelist-Dateinamen und SQLSTATE aus und ist unauffällig.

Grenzen der Prüfung: Ich konnte die DB-Tests (pgTAP, `school:test`, Playwright) nicht ausführen, weil Docker und Supabase fehlen. Ein Ersatz-PostgreSQL-16-Start scheiterte an Dateirechten. Alle SQL-Aussagen beruhen auf Lesen, die Lockreihenfolge und Deadlockfreiheit sind nicht bewiesen. Nur die vier DB-freien Testdateien liefen (13/13 grün).
