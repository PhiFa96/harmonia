# Prüfbericht P3.07 (3e7f905) und P3.08 (ce1f322)

Prüfer: Claude (unabhängiger fachlicher und Code-/Sicherheits-Review). Datum: 19./20.10.2026.
Geprüfte Diffs: `git diff dea183e 3e7f905` und `git diff 3e7f905 ce1f322`. Im Repo wurde nichts verändert und nichts gepusht. Das Worktree und der Postgres-Testcluster liegen im Scratchpad und sind wieder entfernt.

## Methode und Grenzen

- **Echtes Postgres 16, aber ohne Supabase.** Ein privater Cluster mit Rollen-, `auth`- und `extensions`-Attrappen. Alle 35 Migrationen liefen, außer `apple_grants` (braucht supabase_vault) und `duels` (braucht das Schema `realtime`). Beide sind für P3.07/P3.08 nicht erforderlich.
- **pgTAP durch eine kleine eigene Attrappe ersetzt.** Die beiden Repo-Tests `daily_puzzles.test.sql` (13 Prüfungen) und `friends.test.sql` (27 Prüfungen) laufen darauf ohne Fehler. Die Docs sagen ausdrücklich, dass die Supabase-Container in der Cloud fehlten. Das hier ist also der erste Lauf gegen echtes Postgres, ersetzt aber keinen Lauf gegen Supabase mit GoTrue, PostgREST und Edge Runtime.
- **Nicht ausgeführt:** Edge Functions (kein Deno vorhanden, `pnpm check:deno` nicht gelaufen). Edge-Function-Aussagen beruhen auf Quellcode-Lektüre, sofern nichts anderes dabeisteht.
- **Weitere Läufe im Worktree auf ce1f322:**
  - vitest `packages/content` (daily-puzzle, friends, privacy): 12 Tests grün.
  - jest `daily-puzzle*`: 4 Tests grün.
  - `pnpm check:i18n`: vollständig.
  - eslint auf den geänderten Dateien: sauber.
  - `prettier --check`: schlägt an (siehe Befund 3).
  - Eigene Audit-Skripte (nicht eingecheckt): 21 300 erzeugte Aufgaben aus dem Rätselpool (71 Spezifikationen × 300 Seeds), plus Postgres-Szenarien und ein jest-Rendertest.

## Fachliche Prüfung des täglichen Rätsels (1)

**Ergebnis: keine fachlichen Fehler gefunden, mit begrenzter Abdeckung.**

Prüfumfang: der Rush-Pool aus dem redaktionellen Katalog (Entwurf), den das Rätsel verwendet. Der Produktionskatalog ist leer, `rushPool(published) == []`, getestet. Es wird also derzeit keine Aufgabe ausgeliefert.

Mittel 1 (Engine, 21 300 Aufgaben):
- Auswahlmöglichkeiten sind eindeutig.
- Die erwartete Antwort kommt genau einmal vor.
- `evaluateExercise` wertet genau eine Auswahl als richtig, andere Strings werden als ungültig verworfen.
- `gradeRush(expected)` ist immer richtig.

Mittel 2 (unabhängige Orakel, `tonal` bzw. eigene Arithmetik). Alle ohne Abweichung:
- Intervallfragen (klassisch, Nummer, Halbtöne, Richtung, Bewegung, rein/nicht rein, Qualität): `tonal`.
- Tonnamen: Notenbild gleich `item.pitch`, erwartete ID gleich Tonhöhe.
- Vorzeichnungserkennung: `Key.majorKey(..).alteration` gleich gezeigte Vorzeichnung; keine zwei Optionen mit gleicher Vorzeichnung; keine gemischten Tongeschlechter.
- Akkorderkennung: `tonal Chord.get`; genau eine Option passt zu den gezeigten Tönen in Schreibweise und Umkehrung.
- Taktart und Auftakt: Taktsumme gleich Taktangabe.
- Taktlücken: Summe der Dauern gleich 4.
- Kontextfragen mit `tonal` oder Arithmetik: Enharmonik-Schreibweise (genau eine Option mit gleicher MIDI-Höhe wie die gezeigte Note), Intervall-Umkehrung und -Reduktion, diatonische Dreiklänge, Paralleltonart, Quintnachbar, Skalenmuster.
- Epochenzuordnung: 1250 Mittelalter, 1550 Renaissance, 1720 Barock, 1780 Klassik, 1850 Romantik, 1950 seit 1900. Alle plausibel.

**Nicht geprüft** (kein Orakel, nur die generischen Prüfungen oben):
- Kontextthemen `accidental-scope`, `dotted/tied/crossbar/triplet-duration`, `syncopation`, `scale-degree`, `chord-member`/`chord-root`, die Dossier-Themen (`jazz-*`, `popular-source`, `source-comparison`) sowie `period-context` jenseits der sechs Stichjahre.
- Helmholtz-Aufgaben (`octave-name`, 600 Fälle).
- Die fachliche Wahrheit der Texte. Sie bleiben Entwurf bis zum Durchgang nach ADR 0005.

**Reproduzierbarkeit je Datum und Zeitzone.**
- `dailyPuzzleForDay(pool, bank, day)` hängt nur von Pool, Bank und Datumsstring ab, nicht von der Zeitzone. Über 366 Tage ist das Ergebnis deterministisch.
- Die Wochentagsstufen sind Mo 1, Di 1, Mi 2, Do 3, Fr 3, Sa 4, So 4. Der Text "Die Schwierigkeit steigt bis Sonntag" stimmt also nur mit Plateaus. Gering, rein inhaltlich.
- 366 Tage nutzen 71 verschiedene Aufgaben, 7-mal gibt es zwei gleiche Aufgaben an aufeinanderfolgenden Tagen. Gering, Hinweis.
- `nextPuzzleReset` ist an Berliner Zeitumstellungstagen getestet (23 und 25 Stunden).

---

## Befunde, belegt (≥ 2 unabhängige Mittel)

| # | Datei:Zeile | Schwere | Befund | Beleg | Korrekturvorschlag |
|---|---|---|---|---|---|
| 1 | `supabase/migrations/20261016093000_friends_quests.sql` `friend_quest_start` (ca. Z. 129–143); `apps/mobile/src/app/friends.tsx` "startQuest" | **mittel** | **Einseitiger Questbeginn ohne Zustimmung.** Eine Person kann mit jedem bestätigten Freund sofort eine Quest starten. Der Freund wird nicht gefragt, kann nicht ablehnen, sieht sofort Fortschritt und XP der anderen Person und verliert seinen eigenen Wochenplatz. Auch nach dem Entfernen des Initiators bleibt der Platz verbraucht (Beleg: `friend_quest_active`). Das ist Griefing und eine Einwilligungslücke bei Daten Dritter. | Quellcode: kein Annahmezustand. SQL-Szenario auf Postgres 16: A startet mit B, B sieht `friendId=A, questUsed=true`. B+C wird mit `friend_quest_active` abgelehnt. Auch nach "B entfernt A" bleibt `friend_quest_active`. Der Rendertest zeigt "Wochenquest zusammen starten" ohne Rückfrage. | Zustand `pending` mit Annahme/Ablehnung durch den Partner, Ablauf nach wenigen Tagen. Claim (`friend_quest_claims`) erst bei Annahme setzen oder bei Ablehnung/Entfernen freigeben. Partner-XP erst nach Annahme anzeigen. |
| 2 | `supabase/functions/privacy`-Kontext: `friend_status` (Migration Z. ~75–95); `docs/legal/drafts/privacy-de.md` (+4), ADR 0035 | **mittel** | **"Anonyme Kennung" stimmt nicht.** `friend_status` liefert dem Gerät die echte `auth.users`-UUID jedes Freundes (`friends[].id`, `quest.friendId`, `blocked[]`). Die UI zeigt nur "Freund N", die Kennung ist aber global und stabil. Zwei gemeinsame Freunde können eine Person wiedererkennen. Der Datenschutz-Entwurf und ADR 0035 behaupten "anonyme/fortlaufende Kennung". Das muss entweder korrigiert oder technisch eingelöst werden. | SQL-Lauf: `friend_status(A)->'friends'` gibt `c0000000-…-00b` usw. aus, die Konto-IDs. Schema `friendsViewSchema.friends[].id = z.uuid()`. Die Formulierung steht in `privacy-de.md`/`privacy-en.md` und ADR 0035. | Beziehungsbezogene Pseudonyme (z. B. `friendships.id` oder ein HMAC aus `(actor,peer)`) statt Konto-UUID, oder die Datenschutztexte ehrlich anpassen. |
| 3 | `supabase/functions/friends/index.ts` Z. 36–37 | gering, aber CI-blockierend | Datei verstößt gegen Prettier (`if (…)` mit umgebrochenem `return`). Der Pflicht-Check `pnpm format:check` in der CI schlägt für P3.08 fehl. | `prettier --check` über alle geänderten .ts/.tsx/.json-Dateien: nur diese Datei meldet [warn]. Das Diff zeigt den unnötigen Umbruch. | `npx prettier --write supabase/functions/friends/index.ts`. |
| 4 | `supabase/migrations/20261016090000_daily_puzzles.sql` `puzzle_answer`; `supabase/functions/daily-puzzle/index.ts` (`lessonDay(now, timeZone)`) | gering | **Serien-Inflation über die Zeitzone.** Die Zeitzone kommt frei vom Client. Edge Function und DB prüfen nur "Datum gleich lokales Datum in dieser Zone". Dasselbe Konto kann im selben Augenblick den Tag D (UTC) und D−1 (UTC−12) beantworten. Bis zu 3 Tage in einem Moment sind möglich (UTC−12 bis UTC+14). Es hängen keine XP oder Bestenlisten an der Serie, daher nur gering. Die Serie ist aber teilbar. | SQL-Lauf (06:10 UTC): Antwort für D mit `UTC`, dann für D−1 mit `Etc/GMT+12` erlaubt, `puzzle_streak` am Tag D+1 gleich 2 trotz einem Zeitpunkt. Quellcode: `timeZone` aus `puzzleRequestSchema`, keine Kontobindung. | Zeitzone pro Konto speichern (wie bei Motivation) und Wechsel begrenzen. Alternativ höchstens eine Antwort pro 20 Stunden, oder Serie nur nach UTC-Tag zählen. |
| 5 | `supabase/migrations/20261016093000_friends_quests.sql` `friend_invite_create(actor, new_token)` | gering | **Token vom Client gewählt.** Der Server prüft nur `uuid`, nicht Zufälligkeit oder Version. Ein Client mit schwachem Zufall oder ein Absender kann `0000…` verwenden, und der Link funktioniert. Die App nutzt `expo-crypto.randomUUID` (v4), das ist in Ordnung. Betroffen ist nur der eigene Einladungsschutz, aber die Sicherheit hängt an Clientdisziplin. | SQL: Einladung mit `00000000-0000-0000-0000-000000000000` angelegt, von A angenommen, Freundschaft entstand. Quellcode: `friendsRequestSchema` `token: z.uuid()`, Aufruf mit `body.token`. | Token serverseitig mit `gen_random_uuid()` erzeugen. Das Request-Feld `token` bei `invite` entfällt. |
| 6 | `supabase/functions/friends/index.ts` (keine Drosselung); `friend_invite_accept` | gering | **Kein Versuchslimit beim Annehmen.** 3000 Fehlversuche wurden in 29 ms alle mit `friend_missing` abgelehnt. Bei 122 Bit Token-Entropie ist Enumerieren praktisch ausgeschlossen. Fehlendes Limit trifft aber auch alle anderen Edge Functions und ein künftig schwächeres Format, und macht Missbrauch (Last) billig. | SQL-Lauf (3000 Versuche, keine Sperre). Quellcode: Function ohne Zähler, nur Bearer-Prüfung. Antworten sind für unbekannt, abgelaufen, benutzt, eigenes oder blockiert gleich (`friend_missing`), kein Orakel. | Versuchszähler pro Konto und Stunde (z. B. 20 Fehlversuche), analog zu Rush-Kontingenten. |
| 7 | `friendsRequestSchema`; Migration `friend_*`-Funktionen | gering | **Offene Einladung kann nicht widerrufen werden.** Eine falsch geteilte oder öffentlich gepostete Einladung gilt 7 Tage und kann genau einmal von der ersten Person eingelöst werden. Der Host hat keine Aktion "widerrufen". | Schema: nur die sechs Aktionen invite/accept/remove/block/unblock/quest. SQL: keine Funktion, die `friend_invites` des Hosts löscht (`friend_invite_create` löscht nur abgelaufene). | Aktion `revoke` ergänzen, dazu Löschung bei `friend_remove(…, block)`. |
| 8 | `friend_remove(.., block_peer=false)` | gering | **"Entfernen" auf eine blockierte Person hebt die Blockierung auf.** Der `else`-Zweig löscht die eigene Zeile unabhängig vom Status. Die UI bietet das nicht an, die API schon. Blockieren ist außerdem nur bei bestehender Freundschaft möglich. | SQL: B blockiert C (`blocked=[C]`), danach `friend_remove(B,C,false)` liefert `blocked=[]`. `friend_remove(D,A,true)` ohne Freundschaft liefert `friend_missing`. | Beim Entfernen `status='blocked'` ausnehmen. Optional Blockieren ohne vorhandene Beziehung zulassen (Zeile einfügen). |
| 9 | `friend_quest_progress` / `xp_ledger.created_at` | gering | **Fortschritt ist serverseitig und client-unmanipulierbar, aber zeitlich "bankbar".** Gezählt wird nach `xp_ledger.created_at` (Servereinfügezeit), nicht nach Lern- oder Abschlussdatum. Offline erledigte und erst nach Questbeginn synchronisierte XP zählen mit. Das ist kein Fälschen (`xp_ledger` ist für Clients schreibgeschützt), aber eine Umgehung von "ab Start neue XP". Der Preis ist nur ein Abzeichen. | SQL: nach Questbeginn 10 Rush-Zeilen mit `local_date = heute−30` gebucht, `ownXp=300, completed=true`. Schema `\d xp_ledger`: `created_at default now()`, die Einfügungen in `lesson_rewards`/`motivation` setzen `created_at` nicht. | Entweder dokumentieren, oder nach `local_date >= Quest-Start-Datum` zusätzlich filtern. |
| 10 | `apps/mobile/src/app/friends.tsx` (Buttons "Entfernen", "Blockieren", "Wochenquest zusammen starten", "Blockierung aufheben") | gering–mittel (Barrierefreiheit) | **Mehrfach identische Schaltflächennamen ohne Bezug.** Bei zwei Freunden gibt es zweimal "Entfernen"/"Blockieren"/"Quest starten", bei zwei Blockierten zweimal "Blockierung aufheben". Screenreader-Nutzer können nicht erkennen, auf wen sich die Aktion bezieht. Es gibt außerdem keine Statusmeldung nach dem Kopieren des Links. | Jest-Rendertest mit zwei Freunden und zwei Blockierten: je 2 Buttons mit gleichem Namen in DE und EN-US. Quellcode: kein `accessibilityLabel` an diesen Buttons. Das Teilen schluckt Fehler (`.catch(() => undefined)`) ohne Rückmeldung. | `accessibilityLabel` mit Bezug ("Freund 2 entfernen") und eine `role="status"`-Meldung nach dem Kopieren. |
| 11 | `packages/i18n/src/messages/de.ts`, `en-us.ts` (`friends.stats`) | gering | **Plural fehlt:** "Lernserie: 1 Tage" und "Learning streak: 1 days". Der Schlüssel nutzt `{{streak}}` ohne `_one`/`_other`, i18next kann so keinen Plural wählen. `puzzle.streak` macht es richtig. Außerdem verwendet `friends.inviteExpiry` `toLocaleDateString()` mit Gerätesprache statt App-Sprache. | Rendertest-Ausgabe: `"Lernserie: 1 Tage · Liga-Stufe: 0"` und `"Learning streak: 1 days …"`. Schlüsseltext in beiden Dateien. | Parameter `count` verwenden und `stats_one/_other` anlegen. Datum mit der i18n-Sprache formatieren. `check:i18n` meldet dies nicht. |
| 12 | `apps/mobile/` (fehlend); `supabase/tests/database/friends.test.sql`, `daily_puzzles.test.sql`; `packages/content/src/daily-puzzle.test.ts` | gering–mittel (Testlücken) | **Tests zu schwach.** Für P3.08 gibt es keine Mobile-Tests (Zustand und Screen: Kontowechsel, veraltete Antworten, Fehlercodes). Das SQL-Testset deckt nicht ab: abgelaufene Einladung, Selbstannahme, 50er-Limit, Gegenrichtungs-Block, Quest ohne Zustimmung, `friend_retry`/Parallelität. Der Puzzle-Test prüft nur `generateExercise(...)` `toBeDefined()`, nicht "genau eine richtige Antwort", außerdem keine Falschantwort, keine Zeitzonen-Fälle, keinen Retention-Pfad mit anschließendem Abruf. | `git diff --stat 3e7f905 ce1f322`: keine Datei unter `apps/mobile/__tests__`. Lektüre der Testdateien. Mein Audit (21 300 Aufgaben) fand keine Fehler. Der Test selbst hätte sie nicht gefunden. | Mobile-Tests für `state/friends` und `friends.tsx` ergänzen, SQL-Szenarien aus diesem Bericht übernehmen, eine Eigenschaftsprüfung "genau eine korrekte Auswahl" über den Pool einführen. |
| 13 | `apps/mobile/src` (kein Altersfeld); `docs/legal/drafts/privacy-*.md` | **mittel** (Freigabe-Gate) | **Minderjährigenschutz offen, Funktion nicht gesperrt.** Ein Social-Feature (Freunde, sichtbare Serie und Liga-Stufe, gegenseitiges XP, Link-Einladung mit Fremden möglich) hängt nur an Konto-Login. Es gibt keine Alterserfassung, Eltern-Einwilligung oder Voreinstellung für Minderjährige. Die Entwürfe verweisen nur auf "juristisch prüfen". Das ist kein Defekt der Mechanik, aber vor Veröffentlichung ein Muss. Analytics bleibt aus (siehe unten). | `grep -rn` nach Mindestalter/Altersgrenze/age gate/birth in `apps/mobile/src`: keine Treffer. Platzhalter "[… Minderjährigenschutz … prüfen]" in `privacy-de.md`/`-en.md`/`verarbeitungsverzeichnis.md`. | Vor Release: Altersgate und Voreinstellung (z. B. Freundesfunktion aus für unter 16, oder nur mit Einwilligung der Eltern), Rechtsprüfung. In Release-Preflight als offener Punkt führen. |
| 14 | `supabase/migrations/…_daily_puzzles.sql`, `…_friends_quests.sql` | gering (Hinweis) | **Migrationen sind additiv, aber nicht idempotent** (`create table/function/trigger/index` ohne `if not exists`/`or replace`). Das entspricht der Repo-Konvention (`duels` hat 2 Stellen `if not exists`, `rush_friends` keine). `create index xp_ledger_friend_week` sperrt Schreibzugriffe auf `xp_ledger` während des Aufbaus. | Zweites Einspielen auf Postgres: `relation "daily_puzzles" already exists` und `relation "friend_invites" already exists`. Quellcode. | Für produktive Rollouts `create index concurrently` in eigener Migration erwägen. Konvention beibehalten oder bewusst entscheiden. |

### Bestätigt in Ordnung (ebenfalls ≥ 2 Mittel)

- **RLS und Rechte.**
  - Alle neuen Tabellen: RLS an, `revoke all` für `public/anon/authenticated`, nur `service_role`.
  - Alle `puzzle_*`/`friend_*`/`retain_*`-Funktionen: `security definer`, `search_path=''`, `execute` ausschließlich für `service_role`. `pg_proc.proconfig` bestätigt das Setting, `has_function_privilege` bestätigt die Rechte.
  - pgTAP-Test (42501-Fälle) bestätigt die Rechte für anon und authenticated.
  - Quellcode: die Edge Functions prüfen das JWT mit `auth.getUser` und lehnen anonyme Konten ab. Die `verify_jwt=false`-Konfiguration entspricht dem Muster von `duel`.
- **Kontolöschung.** In Postgres (B gelöscht): `friendships` 2→0 (beide Richtungen), `friend_quests`/`members`/`daily_puzzle_results` des Gelöschten weg, die benutzte Einladung behält `host_id`, `guest_id` wird NULL. A verliert Quest, Abzeichen und Claim nicht widerrechtlich (Abzeichen von A bleibt, wie in ADR 0035 beschrieben). FK-Quellcode stimmt überein.
- **Datenexport.** `PRIVACY_EXPORT_SECTIONS` enthält alle fünf neuen Abschnitte, `privacy/index.ts` bildet sie ab (`friend_quests` über `friend_quest_members!inner`, gleiches Muster wie `duel_games`). `privacy.test.ts` ist grün. Gegen Postgres/PostgREST nicht gelaufen (kein Supabase). Der Export enthält fremde Konto-UUIDs (`friend_id`, `host_id`, `guest_id`, `user_a/b`), siehe Befund 2.
- **Quest-Fortschritt manipulationssicher.**
  - `xp_ledger` ist für Clients schreibgeschützt.
  - Der Trigger bucht unter Zeilensperre. Die Fortschrittsfunktion ist `volatile` und sieht nach dem Sperrwarten bereits festgeschriebene Fremdzeilen.
  - pgTAP: 270 XP schließen nicht ab, 300 verleihen beiden genau ein Abzeichen, keine Bonus-XP.
  - Einschränkung: Befund 9.
- **Blockieren und Entfernen** (pgTAP und eigene SQL-Läufe):
  - Entfernen/Blockieren beendet die gemeinsame Quest sofort.
  - Die Gegenrichtung verschwindet.
  - Wiedereinladen eines Blockierten scheitert mit `friend_missing`.
  - Ein neuer Wochenstart ist nach dem Entfernen nicht möglich (Wochenbeleg).
  - Einladungs-Existenz ist nicht erkennbar: unbekannt, abgelaufen, benutzt, eigen und blockiert liefern dieselbe Antwort.
- **Einwilligung.** Im gesamten Diff fehlt jeder Analytics-Aufruf (`grep` über `dea183e..ce1f322`: Treffer nur in `check:deno`-Skript und in der Retention-Antwort). Es wird also nichts erfasst, Analytics bleibt aus.
- **Lösungslecks.** Die Antwort enthält vor dem Beantworten nur `spec` + `seed`, nach dem Beantworten keine Frage mehr (`puzzleViewSchema.superRefine`, Test). Texte und Share-Text enthalten keine Lösung.

---

## Befunde, nur 1 Mittel (Quellcode-Lektüre ohne unabhängige Gegenprobe)

| # | Datei:Zeile | Schwere | Befund | Beleg | Korrekturvorschlag |
|---|---|---|---|---|---|
| A | `supabase/functions/daily-puzzle/index.ts`, `packages/content/src/daily-puzzle.ts` | gering | **Lösung clientseitig ableitbar.** `spec`+`seed` genügen, um die richtige Antwort mit der öffentlichen Engine zu berechnen (mein Skript tat das). Das ist bei clientgerenderten Aufgaben unvermeidlich und passt zu "keine XP, keine Bestenliste" (ADR 0034). Es wird aber falsch, sobald Serie oder Rätsel einen Wert bekommen. | Quellcode, dazu der Audit (Antwort aus `spec`+`seed` rekonstruiert). | In ADR 0034 festhalten: Bei Belohnung oder Rangliste muss die Prüfung ohne Offenlegung des Seeds erfolgen. |
| B | `daily-puzzle/index.ts` (Bank-Hash `puzzleEngine: 1`) | gering–mittel | **Generator-Drift.** Eingefroren werden nur `spec`+`seed`, nicht die erzeugte Aufgabe. Eine geänderte Aufgaben-Engine (neuer Server oder alte App) kann für denselben Tag eine andere Aufgabe erzeugen. Dann beantwortet ein alter Client eine andere Frage, als der Server wertet. Ein Versionsfeld wie bei Rush (`engine`) existiert, ist aber konstant 1. | Quellcode (kein Test für Versionsdrift). | Engine-Version im Bank-Hash an eine echte Versionskonstante koppeln, zusätzlich Frage-Fingerprint mitgeben und serverseitig prüfen. |
| C | `puzzle_fill` / ADR 0034 | gering | **Eingefrorene Tage lassen sich fachlich nicht zurückziehen.** Wird eine Aufgabe nach der Freigabe als fehlerhaft erkannt, bleibt sie bis zu 41 Tage in `daily_puzzles`. Es gibt keinen dokumentierten Korrekturpfad (nur manuelles Löschen als service_role). | Quellcode und ADR 0034 ("neue Katalogversion überschreibt bestehende Tage nicht"). | Betriebsanleitung oder RPC zum Austauschen noch unbeantworteter Tage. |
| D | `friend_status` | gering | **Lesepfad schreibt.** `friend_status` ist `volatile`, nimmt eine Zeilensperre und vergibt Abzeichen. Die App ruft es alle 30 s per GET ab. Funktional korrekt (der Trigger vergibt dasselbe), aber ein GET mit Seiteneffekt. Zusätzlich serialisiert `pg_advisory_xact_lock(308,1)` alle Questbeginne global. | Quellcode (`pg_proc.provolatile='v'` bestätigt nur die Eigenschaft). | Abzeichenvergabe ausschließlich im Trigger, `friend_status` lesend. Globale Sperre durch Wochen-/Paar-Sperre ersetzen. |
| E | `daily-puzzle/index.ts` | gering | **Kein Rate-Limit und teurer Lesepfad.** Jeder GET berechnet `rushPool` plus SHA-256 und fragt 42 Tage ab. Betroffen sind nur angemeldete Konten, die DoS-Fläche ist klein. | Quellcode. | Pool/Hash pro Instanz cachen, einfaches Limit pro Konto. |
| F | `puzzle_answer` | gering | **Zeitzonen-Diskrepanz JS gegenüber Postgres.** `timeZoneSchema` akzeptiert alles, was `Intl` kennt. Postgres kennt manche Namen/Offsets anders (POSIX-Vorzeichen). Bei Abweichung antwortet die Function mit `409 unavailable` statt klarer Fehlermeldung, der Nutzer kann dann nicht antworten. Ich habe nur `UTC+14` gegen Postgres geprüft, es wird abgelehnt (`puzzle_day`). | Teilweise empirisch (ein Fall), die allgemeine Aussage ist Quellcode. | Zonen serverseitig gegen `pg_timezone_names` prüfen, Fehlercode "zone" zuordnen. |
| G | `apps/mobile/src/app/friends.tsx` | gering | **Einladungslink über eigenes Schema.** `harmonia://friends?invite=…` kann von einer anderen App abgefangen werden (Custom-Scheme-Hijack). Das Annehmen verlangt zwar einen Tastendruck (kein Auto-Accept), aber der Token wäre mitgelesen. Der Webvariante-Link enthält den Token in der URL (Verlauf, Referrer). | Quellcode (`app.config.ts: scheme: 'harmonia'`). | Universal Links/App Links und `Referrer-Policy: no-referrer` für die Webseite. |
| H | `friends.tsx` | gering | **Ohne Namen schwer zuordenbar.** "Freund N"/"Blockierte Person N" sind Listenindizes. Beim Entfernen einer Person ändern sich die Nummern der anderen. Die Bestätigungsabfrage ist richtig an die ID gebunden, aber Nutzer erkennen nicht, wen sie blockiert haben. | Quellcode (Index aus Listenposition, `pending` per `id`). | Lokaler Spitzname pro Freund (nur auf dem Gerät) oder Datum der Verbindung anzeigen. |
| I | `puzzle.shareText` | gering | Der geteilte Text enthält nur 🟩/⬜ plus Serie, kein Wort wie "gelöst". Für Empfänger mit Screenreader nur eingeschränkt verständlich. Im Fenster selbst steht der Text "Richtig gelöst!". | Quellcode und i18n-Schlüssel. | Wort "gelöst/nicht gelöst" im Text ergänzen. |

---

## Zusammenfassung der Schwere

- **Blockierend (nach Korrektur):** Befund 3 (Prettier, CI schlägt fehl).
- **Mittel, vor Veröffentlichung zu klären:** 1 (einseitige Quest), 2 (UUID-Offenlegung gegen "anonyme Kennung"), 13 (Minderjährigenschutz).
- **Gering:** alle übrigen.
- Die Kernmechanik ist solide: RLS, Rechte und `search_path` stimmen, die Parallelität ist über Sperren abgedeckt, Kontolöschung kaskadiert, Fortschritt ist serverseitig.

## Merge-Empfehlung

| Commit | Empfehlung | Begründung |
|---|---|---|
| **3e7f905 (P3.07 tägliches Rätsel)** | **ja** (mit Nacharbeit nach dem Merge) | Der Katalogpool ist fachlich geprüft (21 300 Aufgaben, zwei Mittel). Keine Lösungslecks im Antwortobjekt, RLS/Rechte/Kaskade in Ordnung, Tests grün. Der Produktionskatalog ist leer, es wird also nichts Ungeprüftes ausgeliefert. Offen und nicht blockierend: Zeitzonen-Serieninflation (4), Generator-Drift (B), Testschärfe (12). |
| **ce1f322 (P3.08 Freunde und Quests)** | **nach Korrektur** | Pflicht: Prettier-Fix (3), damit die CI grün wird. Vor jeder Veröffentlichung: Quest nur mit Zustimmung (1), echte Pseudonyme oder ehrliche Datenschutztexte (2), Altersgate (13). Empfohlen vor dem Merge: serverseitig erzeugter Token (5), Widerruf (7), Barrierefreiheit der Mehrfachbuttons (10), Plural (11), Mobile-Tests (12). Die Datenbankebene ist ansonsten sauber. |
