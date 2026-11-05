# Rohbericht Chor-Trainer (PR #143, `codex/choir-complete-draft`) – Fach- und Funktionsprüfung

Datum: 05.11.2026. Prüfgegenstand: `git diff origin/main...origin/codex/choir-complete-draft` (6 Commits). Nur Lesen und Tests, keine Codeänderung.

## Ergebnis

Keine Blocker gefunden. 1 Nacharbeit, 5 Hinweise.

## Eigene musikalische Nachrechnung (Edition 2, `packages/exercises/src/choir.ts:49-62`)

Alle 16 Klänge beider Miniaturen in C von Hand bestimmt (MIDI-Abstände aller sechs Stimmpaare je Übergang):

- „Heimweg“: I – vi – IV – ii – V – iii – V – I; „Kleiner Bogen“: I – IV – vi – iii – ii – IV – V – I. Das stimmt mit den erwarteten Tonklassen in `choir-edition.test.ts:43-63` überein.
- Keine offenen oder verdeckten Quint-/Oktavparallelen zwischen irgendwelchen Stimmpaaren. Konträre Folgen verbinden nur unterschiedliche reine Intervalle (z. B. Bogen 1→2 Alt/Bass Duodezime→Oktave). Verdeckte Oktaven Sopran/Bass gibt es nur mit Schritt im Sopran (Heimweg 5→6 und 7→8). Das ist im Profil `soprano-leap` zulässig.
- Abstände S–A und A–T sind überall ≤ Oktave (höchstens 9 Halbtöne). Der Leitton steht im Schluss V–I im Sopran (H4→C5) und löst sich auf. In den V-Klängen ist der Leitton nicht verdoppelt.
- Umfänge in C/D/B-Dur (international Bb): Sopran B4–F♯5, Alt C4–A4, Tenor F3–D4, Bass F2–A3 (Bb-Fassung tiefster Ton F2 ≈ 87 Hz). Das liegt innerhalb der getesteten Grenzen und des Tracker-Bereichs 75–1200 Hz.
- Schlüssel: Sopran/Alt im Violin-, Tenor/Bass im Bassschlüssel. Der neue Hinweis „Tenor im Bassschlüssel, klingt wie notiert“ (`packages/i18n/src/messages/choir-exercise.json:62/124/186`) ist sachlich korrekt. Ein oktavierter Violinschlüssel wäre im Chor üblicher, das hat aber ADR 0053 entschieden.
- Die Einführungskarten (`packages/content/src/catalogue.json:13660-13730`) entsprechen notengetreu den neuen Stimmen.
- Lesevoraussetzung Vorzeichen (ADR 0067): Die Texte zu G/D/F/B-Dur (international Bb) sind korrekt, ebenso H→B und E→Es sowie die Gleichsetzung DE H = en B und DE B = en B♭ (`authored-content.json`, `signatureReading`). Die Voraussetzung deckt die tatsächlich verwendeten Tonarten C/D/B ab.

## Befunde

1. **Nacharbeit** – `packages/exercises/src/choir.ts:60` („Kleiner Bogen“, Bass `F3 → G2`, Klang 6→7, IV→V): Der Bass springt eine kleine Septime abwärts, und gleichzeitig fallen alle vier Stimmen. Die Engine meldet das nicht, weil `maxMelodicInterval: 8` diatonisch zählt (`packages/theory/src/voice-leading.ts:235-236`, Septime = 7). Im vierstimmigen Choralsatz meidet man Septimsprünge im Bass. Für Laien ist der Sprung zudem schwer zu treffen. Vorschlag: `G3` (Quart-/Sekundanschluss) mit anschließend `C3`. Alternativ den Sprung bewusst begründen und im Fachreview vorlegen.
2. **Hinweis** – `choir.ts:51` („Heimweg“ V→iii, Klang 5→6): Diese Harmoniefolge ist im Dur-Choralsatz ungewöhnlich, regelwidrig ist sie nicht. Dazu kommt eine verdeckte Oktave S/B (D5/G2 → E5/E3) mit Sopranschritt, die nach dem Profil zulässig ist. Literaturabgleich offen.
3. **Hinweis** – `choir-edition.test.ts:84-91`: Die automatische Analyse schaltet `leading-tone-resolution`, `seventh-resolution` und `doubled-leading-tone` aus. Manuell geprüft (siehe oben) ist das für diese Stücke unkritisch. Der Test belegt diese drei Regeln aber nicht.
4. **Hinweis** – `apps/mobile/src/choir/runner.ts:136-151` (zeitgestempelte Aufnahme): Der Takt-Offset wird während Bereitschaft und Vorzähler als Minimum bestimmt und danach eingefroren. Gegen Uhrendrift während des Takes gibt es keine Korrektur. Bei 8 Halben ≈ wenige Sekunden ist das vermutlich unkritisch, auf Geräten aber nicht belegt (C13 offen).
5. **Hinweis** – Funktionslogik geprüft und konsistent mit ADR 0068/0069:
   - Vorhörfehler setzen keine Antwort mehr auf `null` (`runner.ts:67-71`).
   - Ein Take ohne Tonhöhe erzeugt keine Antwort und meldet `no-pitch`. Es gibt keinen Auto-Skip (`runner.ts:96-99`).
   - Ein fortgesetzter, vollständig leerer, ungeprüfter Take wird vor „Prüfen“ geleert. Geprüfte Takes bleiben erhalten (`choir-answer-input.tsx:60-70`).
   - Die Wertungskonstanten sind unverändert: Toleranz exklusiv < 50 Cent, 8/12 Fenster, 75 %, Oktavkorrektur ±2 (`CHOIR_PROFILE`, `choir.ts:130-140`). Die Profiltexte werden daraus interpoliert.
   - `minimumChoirCorrect: 1` steht nur in den vier Chor-Lektionen (`catalogue.json:21543-21576`).
   - Fehlerwiederholungen wechseln Stück und Tonart und duplizieren keine Erstaufgabe (`lesson.ts:179-213`).
   - Ratingquellen der Edition 2 sind getrennt (`rating-buckets.ts`).
6. **Hinweis** – Testinfrastruktur: `pnpm --filter @harmonia/exercises test -- choir` filtert nicht, sondern startet die komplette Suite. Im ersten Lauf schlug 1 von 637 Tests fehl (die Ausgabe nannte den Test nicht). Der sofortige Neulauf war 637/637 grün. Das deutet auf eine lastabhängige Zeitüberschreitung hin, der Test ist nicht identifiziert.

## Ausgeführte Tests

| Befehl | Ergebnis |
| --- | --- |
| `pnpm --filter @harmonia/exercises test -- choir` (vollständige Suite) | 1. Lauf 636/637 (1 nicht identifiziert rot), Neulauf `npx vitest run` 637/637, 40 Dateien |
| `npx vitest run choir` (packages/exercises, inkl. `choir-edition.tonal.test.ts`) | 86/86, 3 Dateien |
| `npx vitest run choir key-reading` (packages/content) | 78/78, 4 Dateien |
| `npx jest choir` (apps/mobile) | 56/56, 7 Suites |
| `pnpm check:i18n` | vollständig |

## Grenzen

Nicht ausgeführt: Browser- und Playwright-Proben (`e2e/web/choir*.spec.mjs`), Deno, DB/Sync (`tools/test-learning-sync.mjs`), CI. Keine Literatur- oder Primärquellenabnahme, keine echten Stimmen-, Mikrofon-, Kopfhörer- oder Geräteabnahme, kein Sprach-Native-Review. Die Musikprüfung beschränkt sich auf eigene Rechnung, Engine-Test und `tonal`-Transpositionsorakel. Alle Inhalte bleiben `entwurf`.
