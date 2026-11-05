# Rohbericht Fachprüfung Phase 4 v3: PR #136 Tutor-Servernachweis

Stand 05.11.2026. Prüfgegenstand: `git diff origin/main...origin/codex/tutor-verified-attempts`, im lokalen Branch `claude/stoic-pascal-eaoojx` bereits mit #146 zusammengeführt. Nichts committet, keine Quelldateien geändert.

## Ergebnis

Keine Blocker. Die Bindung an Konto, Quelle und Antwort, die Ablaufprüfung und die Umgehungssperre über Clientfelder sind korrekt umgesetzt und durch Tests belegt. Es bleiben vier Nacharbeiten und vier Hinweise.

## Befunde

### Nacharbeit

**N1. Signaturschlüssel ist der Service-Role-Key.**
`supabase/functions/tutor/index.ts:396` und `:448` übergeben `SUPABASE_SERVICE_ROLE_KEY` als HMAC-Geheimnis an `supabase/functions/_shared/tutor-attempt.ts:17`.
- Der Schlüssel bleibt serverseitig. Er kommt aus der Function-Umgebung und taucht weder in Antwort noch Modellkontext auf. Die Mindestlänge 32 wird erzwungen.
- Eine Rotation des Service-Role-Keys macht laufende Nachweise unbemerkt ungültig. Der Schlüssel erfüllt zwei Zwecke. Die Domänentrennung steckt nur im Nachrichtenpräfix `harmonia:tutor-graded-attempt:v1`, nicht im Schlüssel.
- Empfehlung: eigenes Function-Secret (z. B. `TUTOR_ATTEMPT_SECRET`) oder HKDF-Ableitung mit festem Kontext. Das Secret kommt nie in die Umgebung der Dokumentation oder des Clients.

**N2. Fehlende Signaturkonfiguration führt zu irreführenden Fehlern.**
- `index.ts:394-402`: `issueTutorAttempt` wirft bei fehlendem oder kurzem Geheimnis und liefert `422 content`. Das ist ein Konfigurationsfehler und sollte als 503 `server` erscheinen.
- `index.ts:445-452`: `tutorAttemptError` wirft im selben Fall, der äußere `catch` liefert 503. Das ist korrekt (fail closed), aber der Aufrufer sieht keine Ursache.
- Eigenschaften von `tutorAttemptError` (Zeilen 64-95): ein Zod-`parse`-Fehler (statt `safeParse`) wirft ebenfalls 503 und nicht 409. Das ist durch das Request-Schema heute nicht erreichbar, aber fragil.

**N3. Gespeicherte ältere Anfragen ohne Nachweis sind nicht mehr abrufbar.**
`index.ts:417-422` liefert `409 attempt_required` für explain/solution ohne Nachweis, und zwar vor der Idempotenzabfrage (`prior`). Eine vor dem Update gespeicherte oder bereits abgeschlossene Anfrage (ohne `attemptProof`) kann ein alter Client daher nicht mehr per Wiederholung abholen. Der Verlauf selbst bleibt über GET lesbar. Das ist konsequent zur Sicherheitsabsicht und im Plan teilweise genannt ("alte Texte/Replays"). Ausrollreihenfolge dokumentieren: Function und Client gemeinsam.

**N4. Ausgabe von Nachweisen ist ungedrosselt.**
`index.ts:377-404` prüft nur Authentifizierung (kein anonymes Konto) und Körpergröße (`boundedBody`). Es gibt kein Ratenlimit und keine Abo-Prüfung. Jeder Aufruf löst `resolveReportSource` und `evaluateExercise` aus (CPU, begrenzt durch 4096 Zeichen). Das ist akzeptabel für einen Entwurf. Vor echter Nutzung ein einfaches Limit je Konto ergänzen.

### Hinweis

**H1. Umfang der Garantie.**
Der Nachweis belegt nur: "Der Server hat eine formal gültige Antwort für genau diese Quelle gesehen". Er belegt nicht, dass die Antwort in der App als Erstversuch gewertet wurde, dass Hinweise ausgeschöpft wurden oder dass die Aufgabe nicht Teil einer laufenden Einstufung ist (Quellenart `placement` ist zulässig). Ein Nutzer kann mit direktem Aufruf eine beliebige gültige Antwort einreichen und danach die KI-Lösung anfordern. Das deckt sich mit `docs/plan/tutor-versuchsnachweise.md` ("Serverwertung einer eingesandten Antwort") und mit der offenen Grenze in `CLAUDE.md`. Ein echter Versuchsnachweis bräuchte serverseitig gezählte Versuche. Dafür fehlen Persistenz und Migration.

**H2. Wiederverwendung.**
Der Nachweis ist nicht an Anfrage-ID, Gespräch oder Modus gebunden (`binding()` Zeilen 22-34 enthält Akteur, Quelle, Antwort, Nachweis-ID und beide Zeitstempel). Innerhalb von 30 Minuten kann derselbe Nachweis mehrere Erklär- oder Lösungsanfragen autorisieren. Jede Anfrage reserviert dabei weiterhin das Kontingent und die Kosten. Das ist kein Kontingent-Bypass. Replay einer identischen gespeicherten Anfrage nach Ablauf ist nur bei Treffer von `request_hash` und `user_id` möglich (`index.ts:445-452`, Hash enthält den Nachweis). Dann gilt die Signaturprüfung weiterhin, nur der Ablauf entfällt.

**H3. Uhrenabweichung.**
`tutor-attempt.ts:91` verwirft Nachweise mit `issuedAt > now` ohne Toleranz. Bei mehreren Function-Instanzen mit leicht abweichender Uhr kann ein frisch ausgestellter Nachweis als `attempt_invalid` erscheinen. Üblich sind einige Sekunden Toleranz.

**H4. Vertragsstand.**
Prompt 5 und Tools 3 bleiben unverändert. Das ist richtig, weil nur ein optionales Request-Feld hinzukommt. Die Dokumentation nennt "251 gebundene Dateien" im KI-Inventar. Im zusammengeführten Stand sind es 277 (mit #146). Die Zahl in `docs/plan/tutor-versuchsnachweise.md:27` ist nach dem Merge überholt. Die neuen Dateien `tutor-attempt.ts`, `apps/mobile/src/tutor/client.ts`, `state.ts` und `exercise-task.tsx` stehen im Inventar (`tools/ai-act/inventory.json:108-111`).

## Geprüfte Eigenschaften

| Eigenschaft | Ergebnis | Beleg |
|---|---|---|
| Bindung an Konto | ja | Akteur im signierten Binding. Test "binds actor ..." mit `base.id` als fremdem Akteur ergibt `attempt_invalid`. |
| Bindung an Quelle und Antwort | ja | Test verändert Antwort, Seed und Index. Alle ergeben `attempt_invalid`. |
| Serverwertung vor Ausstellung | ja | `evaluateExercise(...).validAnswer` und `resolveReportSource` (veraltete Version, falscher Index, leere und unzulässige Antwort werden abgewiesen). Client-Felder `correct` oder `checked` werden vom strikten Schema abgelehnt. |
| Ablauf | ja | TTL 30 Minuten, exklusiv bei `expiresAt`. Dauer wird gegen die Konstante geprüft, damit kein verlängerter Nachweis signierbar ist. |
| Erneuerung | ja | Client holt vor jedem neuen Senden einen neuen Nachweis. Bei `attempt_*` wird Retry-Zustand verworfen (`state.ts`). Eine Wiederholung bereits vorbereiteter Anfrage behält ID und Nachweis. |
| Umgehung über `checked` | nein | Die Server-Prüfung ignoriert `checked`. Test "legacy checked flag ..." beweist `attempt_required` für `checked: true`. |
| Replay | siehe H2 | Nur identische gespeicherte Anfrage desselben Kontos nach Ablauf. |
| Schlüsselhandhabung | siehe N1 | Nur serverseitig, nicht im Client oder Prompt. Nicht rotations- oder zweckgetrennt. |
| Signaturvergleich | ja | `crypto.subtle.verify` (konstante Zeit). Das Signaturformat ist per Regex auf 64 Hex-Zeichen begrenzt. |
| Speicherung | ja | Gesprächskontext speichert keinen Nachweis (Test in `test-tutor.mjs`). Der Hash der Anfrage enthält ihn. |
| Prompt-/Tool-Version | unverändert 5/3 | `packages/content/src/tutor.ts`. |
| UI | ja | Feste Lösung bleibt ohne KI. Die KI-Lösung erscheint erst nach Prüfen. Hint 3 öffnet kein Lösungs-Tutorfenster mehr. |

## Tests

| Befehl | Ergebnis |
|---|---|
| `node --test tools/tutor-attempts.test.mjs tools/tutor-interface.test.mjs` | 26 Tests, 26 bestanden, 0 fehlgeschlagen |
| `pnpm check:tutor` (Deno 2.9.6) | Typprüfung bestanden, 1.362 simulierte Tutor-/SDK-/Engine-Prüfungen bestanden |
| `vitest run src/tutor-context.test.ts src/tutor.test.ts` in `packages/content` | 8 Tests bestanden (eine Datei lief, die zweite existiert unter diesem Namen nicht) |
| `jest __tests__/tutor.test.tsx` in `apps/mobile` | 17 von 17 bestanden (Ablehnung, Wiederholung, Ablauf, Kontowechsel und Stop während der Prüfung, alte Lösungsdialoge) |
| `node --test tools/ai-act/*.test.mjs tools/certificates/*.test.mjs` | siehe `ki-zertifikate.md` (65 von 65) |

## Grenzen

- `tools/test-tutor.mjs` (echte lokale Authentifizierung und Datenbank, HTTP-Fälle `?view=attempt`) wurde hier nicht ausgeführt: kein Supabase-Stack in dieser Umgebung. Nachweis bleibt der GitHub-CI-Lauf.
- Kein Live-Modellaufruf. Keine Geräte- und Fachabnahme.
- Kein ausführlicher App-Gesamtlauf (`lesson.test.tsx`, `exercises.test.tsx` nicht erneut ausgeführt).
- Zeitverhalten über mehrere Edge-Instanzen nicht geprüft (H3).
