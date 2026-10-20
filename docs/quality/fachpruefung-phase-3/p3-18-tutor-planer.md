# Review P3.18 (Tutor-Lernplaner), Commits 28d5a20 + a5d8cd0, geprüft am Stand 55f3874 (main-Merge)

Hinweis: Der Bericht sollte nach `/tmp/claude-0/-home-user-harmonia/763a011a-e3ca-5aed-92b9-052bb92f7083/scratchpad/review-p3-18.md`. Plan Mode erlaubte dort kein Schreiben. Inhalt daher hier und in der Antwort. Repo unverändert, kein Commit.

## Blocker

B1. pgTAP-Test passt nicht mehr zum Prompt-Standard (CI-Job "Supabase", `pnpm db:test`).
- `supabase/tests/database/knowledge.test.sql:10` erwartet `column_default = '3'` für `tutor_requests.prompt_version`.
- `supabase/migrations/20261020010000_tutor_learner_snapshot.sql:2` setzt den Default auf 4. Spätere Migrationen ändern ihn nicht.
- Der Vitest `packages/content/src/tutor-version.test.ts` ist grün (1/1), weil er nur die Migrationen prüft. Der SQL-Test wurde nicht angepasst.
- Reproduktion: `grep -n "column_default" supabase/tests/database/knowledge.test.sql`. Lokal nicht ausführbar (kein Docker). Der Fehler folgt statisch.
- Fix: `'4'` und Text "Prompt version 4 …".

B2. `tools/tutor-benchmark/catalogue-v2.json` ist nach dem Merge veraltet.
- `node tools/check-tutor-catalogue-v2.mjs` bricht ab: "Tutor v2 catalogue is stale".
- Ursache: Die Helmholtz-Anzeigenamen aus dem Tutor-Review (a2e2d18) ändern Werkzeugausgaben, die die Fälle als `expectedFacts` einfrieren. Beispiel `transpose_01`: Datei `"name":"E4"`, aktuell `"e¹"`.
- Betroffen: 64 Fälle bei `expectedFacts`, 2 bei `questions`, 8 bei `scope` (transpose, scale, triad, task_scale_build_*, task_chord_build_*).
- Folge: Ein echter Benchmarklauf würde Antworten gegen falsche Sollnamen (E4/H4) bewerten.
- Fix: `node tools/check-tutor-catalogue-v2.mjs --write`, danach `pnpm format`.
- `check:tutor:catalogue-v2` steht weder in `.github/workflows/ci.yml` (nur v1, Zeile 81) noch in `check:deno`. Der Drift fiel deshalb unbemerkt durch. In CI aufnehmen.
- `pnpm check:tutor:catalogue` (v1) ist grün.

## Nicht-blockierend (nach Gewicht)

N1. Erfundene Stärken/Schwächen bei Gleichstand (`tutor-learner.ts:80-82`).
- Ab 2 gemessenen Fähigkeiten gibt es `comparisonSize = floor(n/2)`, also mindestens je 1 "Stärke" und 1 "Übungsfeld". Es gibt keinen Mindestabstand.
- Gemessen: Ratings [1500, 1500] ergeben Stärke 1500 und Übungsfeld 1500. [1501, 1500] ergibt dasselbe Muster. [1650, 1649, 1648] ergibt Stärke 1650 und Übungsfeld 1648.
- Das widerspricht der Übergabe ("keine erfundene Schwäche") und dem Prompt ("avoid invented assessments"). `limits` schwächt es nur ab.
- Empfehlung: Mindestabstand (z. B. ≥ 1 kombinierte Abweichung oder ≥ 75 Punkte) oder leere Einstufung.

N2. Aktualität und Schwellen.
- Es wird `last_practiced_at` nicht gelesen und `decayGlicko2` nicht angewandt. Ein altes Rating zählt als sicher, und `limits` sagt nichts über Aktualität.
- Das Dokument sagt "ab drei Versuchen". Praktisch bindet RD ≤ 150. Eine Simulation mit `updateGlicko2` erreicht RD ≤ 150 erst nach etwa 5 Einzelperioden-Versuchen. Doku präzisieren.
- Der Wochenplan (`:100-104`) nimmt nur die ersten offenen Lektionen in Pfadreihenfolge und ignoriert `needsPractice`. "15 Minuten" ist ein fester Platzhalter. Dokumentieren, dass der Plan keine Schwächenorientierung hat, oder die Verknüpfung ergänzen.

N3. Datenschutzdokumente nicht nachgezogen. Der Commit enthält keine Änderung unter `docs/legal`, `docs/plan/recht-und-datenschutz.md` oder in App-Texten.
- Neu fließen Skill-Titel, gerundete Ratings, Versuchszahlen, Abschlusszähler und offene Lektionen als Tool-Ergebnis an Anthropic.
- `docs/legal/verarbeitungsverzeichnis.md:17` nennt als Tutor-Eingaben nur "Fragen, Aufgaben-/Erstantwortkontext, KI-Antworten, Quellen". Ebenso unvollständig: `dsfa-vorpruefung.md`, `store-datenschutz.md` und der Tutor-Hinweis in `de.ts` ("Du sprichst mit einer KI").
- Es gibt keinen modusabhängigen Zugriff: Das Modell kann beide Werkzeuge in jedem Modus (hint, explain, solution, chat) selbst aufrufen.
- Empfehlung: Verzeichnis, DSFA und Textbausteine ergänzen. Lernstand-Werkzeuge ggf. nur im Chatmodus oder bei ausdrücklicher Frage anbieten.
- Antworttext mit abgeleitetem Lernstand landet im privaten Tutor-Verlauf. Das ist durch bestehende Aufbewahrung (12 Monate), Export und Kontolöschung gedeckt. Es gibt keine neuen Tabellen oder Spalten, und Tool-Ergebnisse werden nicht persistiert (`result` enthält nur Text, Beispiele, Fehler, Zitate).

N4. Eager-Laden bei jeder Anfrage (`supabase/functions/tutor/index.ts:488`).
- `loadLearnerContext` läuft nach der Reservierung und vor dem Stream, auch wenn kein Werkzeug aufgerufen wird.
- Die RPC `tutor_learner_snapshot` liest per `coalesce(retained_summary, event)` alle `learning_events` des Kontos, inklusive voller Rohereignisse. Das verzögert den ersten Byte-Zeitpunkt und kostet DB-Last bei langer Historie.
- Empfehlung: Lazy-Laden beim ersten Werkzeugaufruf (Runtime-Callback) oder ein verdichtetes Zielschema.
- Fehlerpfad ist sauber: Ein Throw vor dem Stream geht in den äußeren catch. Dort wird `finish_tutor_request` mit Kosten 0 gerufen. Ein DB-Fehler ergibt `{available:false}` und `learner_unavailable`.

N5. Testlücken.
- Der echte Pfad (`skill_progress`-Select, RPC, Zod) ist nie ausgeführt worden. `db:test:tutor` prüft nur die RPC direkt (Konto-Isolation, 403 für Konto-Token). Der lokale Fixture-Modellclient (`tutor-local-fixture.ts`) ruft die neuen Werkzeuge nie auf.
- Es fehlen Tests für `loadLearnerContext` mit Fake-Client (Fehlerzweig), für Strength-Zweige (Smoke und Fixtures nutzen nur 1 gemessene Fähigkeit, also immer `strengths: []`) und für Tool-Fehlerpfade.
- Die Benchmark-Fixtures (`catalogue-v2.ts`) sind einsprachig Deutsch gebaut (`request.locale='de'`) und werden für en-US/en-GB-Fragen wiederverwendet (`tutor-benchmark-worker.ts:84`). Der Lernstand erscheint dort in deutschen Titeln.
- `tools/tutor-live.ts` und Doku sprechen weiter von 8 Werkzeugen (`check-tutor-catalogue.mjs` meldet "8 Werkzeuge"). Tatsächlich sind es 10 (`TUTOR_TOOLS.length === 10`).

N6. Stufe-3/4-Testfälle sind weniger breit als behauptet.
- "18 Aufgabenfälle" sind nur 4 verschiedene Aufgaben (Lektion 1 und 3 liefern mit Seed `tutor-catalogue-v2` identische erste Items), je 3 Modi: 3 Stufen-Aufgaben Modi (KNOWLEDGE_MC mixolydisch, MATCH Modi) und 2 Stufe 4 (KNOWLEDGE_MC Altschlüssel, MATCH Ausrichtung). Es gibt keine Fälle zu Quintparallelen, Bezifferung, Transposition oder Tenorschlüssel-Notation.
- Doku und README zählen sie als "18 Fälle". Auf echte Vielfalt (andere Seeds oder `items[n]`) erweitern.
- Fachlich korrekt: "Mixolydisch = Dur mit erniedrigter 7. Stufe". "c¹ im Altschlüssel auf der mittleren (3.) Linie, im Tenorschlüssel auf der 4. Linie". Falschantworten (Ionisch bzw. `voices` statt `clefs`) sind plausibel gültige Distraktoren. DE/US/UK-Texte sind identisch englisch (keine US/UK-Streitwörter).

N7. Prompt-Zeile (Punkt 6 des Auftrags): `tutor-prompt.ts:26`.
- Text: "No network, external URLs or user profiles are available to tools. Only get_learner_summary and analyze_progression may provide aggregate learning evidence for this authenticated learner."
- Wegen "Only … may" nicht widersprüchlich, aber leicht missverständlich: "user profiles" vs. Lernstandsprofil. Das Modell könnte die Lernstandswerkzeuge für "Profile" halten und ablehnen, oder umgekehrt.
- Eindeutiger: "No network, external URLs, account fields or raw answers are available to tools. Only get_learner_summary and analyze_progression …". Ursprünglich in 28d5a20: "No network or external URLs are available to tools". Der Merge hat "user profiles" ergänzt.
- Prompt-Injection über Lerndaten: Die Tool-Daten enthalten nur Katalogtitel (kein freier Nutzertext), Zahlen und feste Strings. Der Prompt behandelt Tool-Daten ohnehin als untrusted DATA.

N8. Doku-/Statuskonsistenz.
- `docs/plan/phase-3-v1.md:244` hakt die drei Punkte als `[x]` ab. Die Übergabe sagt selbst, das Fertig-Kriterium sei nicht erfüllt (Fachreview, echte Modell-/Kostenabnahme, reale Konten offen). Auf "technisch" relativieren.
- Prompt v4 / Tools v2 verlangen laut Projektregel neue echte Kalibrierung. `p2-abschluss.md:26` nennt noch "Prompt v3". `tutor-lernplaner.md` und CLAUDE.md sagen nicht ausdrücklich, dass v3-Kalibrierung hinfällig ist. `tutor-backend.md` ("acht Werkzeuge") ist nicht aktualisiert.
- Zahlen veraltet nach Merge: 260 Prüfungen sind jetzt 266. 265 Fälle sind 315 (P3.19 plus 50).
- `skill_progress` hat RLS (Policy `skill_progress_select_own`), aber der Tutor liest via service-role. Das ist korrekt wegen des expliziten `.eq('user_id', actor)` aus dem per `auth.getUser` verifizierten JWT. Es verlässt sich allein auf diese Filterzeile. Ein Test wäre sinnvoll.

## Geprüft ohne Befund

1. Version/Cache.
   - `TUTOR_PROMPT_VERSION` 3→4 und `TUTOR_TOOL_VERSION` 1→2 in `packages/content/src/tutor.ts:4-5`. Der Prompt-Header nutzt beide Konstanten. Migration setzt DB-Defaults 4/2. `tutor-version.test.ts` grün.
   - `cache_control` ist weiter am Systemblock und am letzten Werkzeug (`render_example`, Reihenfolge unverändert, die neuen Tools stehen davor). Lernstanddaten stehen nicht im gecachten Prefix.
   - Keine Behauptung "live gemessen/kalibriert" gefunden. Die Übergabe nennt ausdrücklich nur simulierte Läufe und `releaseEligible: false`.
2. Werkzeuge: Eingabeschema `z.object({}).strict()`, daher keine Nutzer-ID wählbar (Smoke bestätigt `{userId:'other'}` wird abgewiesen). Ohne Server-Kontext `learner_unavailable`. Akteur ist die per `getUser` verifizierte ID, das Modell sieht nur Titel, gerundete Ratings, Zähler, offene Lektionen. Keine E-Mail, Namen, Rohantworten oder IDs im Modellkontext (Smoke-Check "No account identifier"). RPC `tutor_learner_snapshot` ist `security definer`, `set search_path`, nur an `service_role` freigegeben; `authenticated`/`anon` haben keinen Execute (Test erwartet 403). Keine neuen Tabellen, daher keine Export-/Löschlücke.
3. Kosten/Schleifen: `tutorReservation` ist Worst-Case (`maxRounds × (maxInputTokens × Max-Tarif + maxOutput × Output)`), unabhängig von der Werkzeuganzahl. `maxRounds` 4 und `maxToolsPerRound` 4 gelten unverändert, die Tool-Ergebnisse sind klein (≤ 3+3+5+3 Einträge). Eingabe-Trimming läuft in Runde 0. Fehlerpfade geben die Reservierung frei oder rechnen sie ab.
4. Engine-Bindung: Ratings aus `skill_progress` (kanonische Glicko-2-Projektion), Lektionsstand aus `learning_events`-Retained-Summaries (Schema in `learning-evidence.ts:86-115` passt zu SQL: `progress.passed`, `testedUnitIds`, `sourceKind`). Die Vorschläge nutzen `learningPath()`-Status `open`, ändern also weder Zugriff noch XP. Alte Inhaltsversionen zählen nicht als bestanden (konsistent mit der App). Alte, nicht-retained Rohereignisse ohne `retained_summary` werden nicht gezählt (Altdaten-Untererfassung, vor Start unkritisch).
5. Läufe (alle grün, außer B2):
   - `pnpm check:i18n`: "Übersetzungen vollständig".
   - `pnpm check:tutor:catalogue` (v1): 245 Fälle OK.
   - `pnpm check:tutor` (Deno-Typcheck und Smoke): 266 Prüfungen bestanden.
   - `pnpm check:tutor:benchmark`: 49 bestanden.
   - `pnpm check:knowledge`: 1055 bestanden.
   - vitest `tutor-version.test.ts` 1/1.
   - Nicht ausgeführt: vollständiges `pnpm check:deno` (nur die tutor-relevanten Teile). Nicht ausgeführt wurden `db:test:*` und pgTAP (kein Docker, kein Postgres-Server). Das SQL der Migration wurde nur gelesen, nicht ausgeführt.
