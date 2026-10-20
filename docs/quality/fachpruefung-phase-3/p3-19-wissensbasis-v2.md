# Prüfbericht P3.19 (Wissensbasis v2) – Commit b8fee07, Stand HEAD 55f3874

Hinweis zum Ablageort: Der Auftrag nannte `.../scratchpad/review-p3-19.md`. Beim Schreiben war der Plan-Modus aktiv (nur diese Plan-Datei beschreibbar), deshalb liegt der Bericht hier und im Rückgabetext. Repo unverändert (`git status` leer). Die lokale Postgres-Attrappe wurde wegen Plan-Modus NICHT gestartet; SQL wurde statisch geprüft.

## Blocker mit Reproduktion

Keine harten Blocker für die Integration als interner Entwurf (alles `entwurf`, öffentlicher Index leer, Migration additiv). Vor dem Merge zu beheben (kleiner Fix, kein CI-Gate, aber ein Gate-Skript schlägt fehl):

B1. `pnpm check:tutor:catalogue-v2` scheitert im gemergten HEAD mit "Tutor v2 catalogue is stale".
- Ursache: Der Merge-Fix `tutor-tools.ts` lokalisiert Tonnamen (`E4` wird `e¹`) und regenerierte `tools/tutor-benchmark/catalogue.json` (v1, `check:tutor:catalogue` grün), nicht aber `catalogue-v2.json`.
- Reproduktion: `pnpm check:tutor:catalogue-v2`. Ein In-Memory-Vergleich mit `buildBenchmarkCatalogueV2()` zeigt 64 abweichende Fälle (erster `transpose_01`: `expectedFacts.pitch.name` `e¹` gegen `E4`). Die 50 neuen `p3_library_*`-Fälle und alle 20 `p3_*`-Fälle sind unverändert.
- Fix: `node tools/check-tutor-catalogue-v2.mjs --write`, danach committen. Sonst vergleicht `tutor:benchmark` (Version 2) gegen veraltete Erwartungswerte.

## Nicht-blockierend (Nacharbeit, nach Dringlichkeit)

N1. Trigramm-Ranking erzeugt Treffer ohne thematischen Bezug (Migration `20261020020000_knowledge_search_v2.sql`, Zeilen 29–38).
- Die Kandidatenklausel `word_similarity(title|heading, left(question,512)) > 0.25` liefert auch Abschnitte, die weder FTS- noch Skill-Treffer sind.
- Mit einer Python-Nachbildung von `word_similarity` (Wortbereiche, also eine Untergrenze; nicht gegen Postgres ausgeführt) liegen für fachfremde Fragen Titel und Überschriften über 0,25:
  - "Wie programmiere ich Code in Python?" trifft "Coda", 0,43.
  - "Wie bleibe ich motiviert beim Lernen?" trifft "Motiv", 0,45.
  - "Wie funktioniert ein Rondo beim Pferderennen?" trifft "Rondo-Grundidee", 0,38.
  - EN: "How do I write code in Python?" trifft "Coda" mit 0,43 und "II–V–I" mit 0,33 (der Ein-Zeichen-Titel "I" matcht das Pronomen).
- Der Score 4·sim (rund 1,7) macht diese Abschnitte zu Quellen, die der Tutor im Dokumentbudget mitgeliefert bekommt und in der UI als Quelle erscheinen können. Das widerspricht dem Anspruch "ohne geeignete Quelle muss der Tutor die Lücke benennen".
- Die einzige Negativprobe (`Galaxienantriebsleistung` in `tools/test-knowledge.mjs`, Zeile 148 ff.) ist ein Nonsense-Wort und deckt das nicht ab.
- Empfehlung: Mindestscore bzw. Schwelle (etwa sim ≥ 0,5, oder Trigramm nur als Rang-Bonus bei FTS-Treffer), und ein Negativkorpus mit echten Off-Topic-Fragen in `db:test:knowledge:v2`.

N2. Der neue 150-Fragen-Test läuft nicht in der CI.
- `.github/workflows/ci.yml` Zeile 299 führt nur `pnpm db:test:knowledge` aus (alte 87 Fragen, nutzt aber die neue Migration und die neue Auswahl). `db:test:knowledge:v2` und `check:knowledge:v2` fehlen in der CI. `db:test:knowledge:v2` als CI-Schritt nach `db:test:knowledge` aufnehmen. `check:knowledge:v2` und `check:tutor:catalogue-v2` laufen in keinem Workflow.
- Die 150 Fragen wurden nach "130/150 gefunden" gegen die Suche nachjustiert. Direkte Fragen echoen Titel und Überschriften, auf die der Trigramm-Term gerade zielt, also Überanpassungsgefahr. Das Dokument benennt die Grenze ehrlich ("keine Aussage über unbegrenzte freie Fragen").

N3. en-GB ist für die 25 Artikel eine 1:1-Kopie von en-US, und die Schreibung ist gemischt (DE/US/UK-Vollständigkeit nur formal).
- `diff` der aufgelösten en-US- und en-GB-Texte aller 25 Artikel: 0 Unterschiede. `check:i18n` prüft nur Schlüssel und Platzhalter, deshalb grün. In den 25 Artikeln steht kein `$t(glossary:…)`, obwohl CLAUDE.md das für Fachbegriffe verlangt (`authored-content.json` nutzt es sonst vielfach).
- Britisch geschrieben, aber in der US-Fassung: "centred", "neighbouring", "Idealised", "favour", "Realisation", "metre" ("quadruple metre", "does not change metre"), "leading note", "bar" (statt measure), "uncentred".
- Amerikanisch, aber in der UK-Fassung: "recognizable", "emphasizes", "tonicization", "quarters, halves", "whole step", "eighth notes".
- Die Suchfragen haben nie `uk`/`ukAlternate` gesetzt. Die 150 Fragen bestehen aus nur 100 verschiedenen Texten, die UK-Suche wird nie mit UK-Wortschatz geprüft.
- Behebung: Glossar-Platzhalter (measure/bar, quarter note/crotchet, half step/semitone, leading tone/note) und echte UK-Fassung, dann UK-Fragen ergänzen.

N4. Artikelbildunterschriften und Texte enthalten Entwicklerhinweise, die Lernende lesen würden.
- "Eigenes schematisches Notenbeispiel; Text und Ton getrennt prüfen" und "Original schematic score; check text and sound separately" (alle L4-Beispiele) sind Reviewer-Anweisungen.
- Im Text der Diktat- und Vorbereitungsartikel steht: "Eingabegenauigkeit und Latenz müssen auf echten Geräten geprüft werden" und "Device pitch detection needs a quiet setting and separate validation". Ein Satz in `aural.l3.dictation` erklärt "Fehlerwiederholungen verwenden neue Varianten", also App-Interna.
- Vor einer Freigabe entfernen. Bis dahin unkritisch, weil `entwurf`.

N5. Fachliche Präzisierungen (keine Sachfehler, nach ADR 0005 im Fachdurchgang zu entscheiden).
- `satz.l4.voice-leading` "Parallele Quinten und Oktaven": "vermeidet direkte parallele reine Quinten und Oktaven" ist missverständlich. In der deutschen Satzlehre bedeuten "direkte" (verdeckte) Quinten/Oktaven etwas anderes als Parallelen. Die EN-Fassung "direct parallel perfect fifths" hat dasselbe Problem. Besser: "Quint- und Oktavparallelen (aufeinanderfolgende reine Quinten/Oktaven in Parallelbewegung)". Das Beispiel (C–G → D–A) ist korrekt.
- `rhythm.l4.complex` "Hemiolen-Eindruck": Die Definition ist allgemein. Die klassische Hemiole (zwei 3/4-Takte als drei Zweiergruppen, 3:2) fehlt als Merkmal. Das Beispiel (3/4: C4/2 E4/4~ | E4/4 G4/2) zeigt sie korrekt.
- `forms.l3.designs` "Rondo-Grundidee": Das Beispiel ist Takt für Takt identisch mit "Dreiteilige Form" (A–B–A) und zeigt kein A–B–A–C–A.
- Weitere Beispiele zeigen den behaupteten Punkt nicht: `notation.l4.multivoice` "Selbstständige Stimmen" (einstimmig), "Mehrere Systeme" (ein System), `jazzpop.l3` "Backbeat" (nur C–E–G–E ohne Betonung).
- Quartsextakkord "etwa als Vorhalt in einer Kadenz": vertretbar (kadenzierender Quartsextakkord), im Fachdurchgang gegen F03-Konvention und Literatur bestätigen.

N6. Dokumentation/ADR.
- Die Einführung von `pg_trgm`, die Vielfalts-Auswahl in `selectKnowledgeChunks` und die Entscheidung gegen `pgvector` stehen nur in `docs/plan/wissensbasis-v2.md`. ADR 0016 (FTS-only, "höchstens drei aus demselben Artikel", "niedriger gerankte Quellen entfallen zuerst") wurde nicht ergänzt, und es gibt keinen neuen ADR (letzter ist 0037). Die Reihenfolge der Chunks entspricht nun nicht mehr strikt dem Rang (erste Runde: bis zu 3 verschiedene Artikel). Das ist relevant für die Kürzung nach Rang. Kurzer Nachtrag zu ADR 0016 empfohlen.
- `selectKnowledgeChunks` hat keinen eigenen Unit-Test. Die Absicherung läuft nur über Postgres-Integrationstests (`check:knowledge` bestand mit 1055 Prüfungen).

N7. Latenz und Skalierung (informativ).
- Die `OR`-Klausel mit `word_similarity` macht einen Seq-Scan über alle Abschnitte der Sprache. Bei 338 Abschnitten je Sprache unkritisch. Bei Katalogwachstum (CHECK-Grenze 5000) neu messen oder einen GIN-Trigramm-Index auf `title`/`heading` ergänzen.

## Geprüft ohne Befund

1. Freigabegrenze und Index
- `pnpm check:content` grün: "165 Fähigkeiten in 54 Einheiten; 160 interne, 0 freigegebene Lektionen; öffentliche Daten stimmen". `packages/content/src/published.json`: 0 Artikel, 0 Lektionen, 0 Fähigkeiten. `published-knowledge-stages.json`: `{}`.
- `currentKnowledgeSnapshot('published')`: 0 Abschnitte, 0 Artikel. Vorschau: 1014 Abschnitte (338 je de/en-US/en-GB), 54 Artikel, alle `entwurf`.
- Die 25 Artikel der Stufen 3–4 haben Stufe 3 (12 Artikel) bzw. 4 (13 Artikel), je vier Abschnitte pro Sprache (`check:knowledge:v2`: "25 upper-level articles, 75 language versions and 50 search questions checked").
- Preview-Lane nur lokal: `knowledgeLane()` verlangt `HARMONIA_LOCAL_PREVIEW=true` und eine lokale `SUPABASE_URL`. RLS-Policy `knowledge_chunks_published` erlaubt anon/authenticated nur `lane='published' and status='freigegeben'`. `search_knowledge` ist weiter service_role-only (per `create or replace` bleiben die ACLs erhalten).
- Keine Freigabe behauptet: Übergabe, CLAUDE.md und Rückblick nennen Fach-, Modell- und CI-Abnahme offen, `reviewed: 0`, `releaseEligible: false`.
- Plagiat: Die Texte enthalten keine Zitate und keine Quellenverweise auf Fremdwerke. Die Beispiele sind eigene Notenfolgen mit Hinweis "Eigenes … ; keine Transkription/historische Quelle". Der Review-Korpus (150 Fragen, 50 Quellenfälle) besteht aus eigenen Formulierungen. Es wurde kein übernommener Fremdtext gefunden. Die Literaturhinweise der Stufe-3/4-Übergaben sind ausdrücklich "Prüfansätze".

2. Migration `20261020020000_knowledge_search_v2.sql`
- Version eindeutig und aufsteigend (nach 20261020010000 und 20261019110000), kein doppelter Zeitstempel in `supabase/migrations`. Additiv (`create or replace` mit identischer Signatur, Parameternamen, Default und Rückgabetyp). `pg_trgm` in Schema `extensions`, Aufruf qualifiziert (`extensions.word_similarity`), `search_path=public,pg_catalog` passt.
- plpgsql: alle deklarierten Variablen (`active`, `config`, `exact`, `broad`, `lexemes`, `hits`) werden verwendet, also kein Lint-Warnungsgrund. `eslint` und `prettier --check` auf den geänderten TS/MJS-Dateien: sauber.
- Nicht ausgeführt: `db:lint --fail-on warning`, `db:test` und `db:test:knowledge:v2` (kein Docker/Supabase, Attrappe im Plan-Modus nicht gestartet). pgTAP-Datei `knowledge.test.sql` deckt weiter Rechte, RLS, Sprachtrennung und Stale-Zustand ab, aber nicht den Trigramm-Pfad.
- `word_similarity(title, question)` mit Titel als erstem Argument (Titel ist "Nadel") ist semantisch richtig. `left(question,512)` begrenzt den Aufwand.

3. Fachliche Korrektheit der 25 Artikel (alle drei Sprachen gelesen)
- Mit der eigenen Engine nachgerechnet: Cmaj7 C–E–G–H, G7 G–H–D–F, Dm7 D–F–A–C, Halbvermindert H–D–F–A (`chordTones`). D-dorisch D E F G A H C (Halbtonschritte 2-1-2-2-2-1), G-mixolydisch, A-natürlich-Moll (äolisch) und C-Dur bestätigt (`buildScale`). B-Klarinette: C5 notiert klingt B♭4, M2 abwärts (`intervalBetween`). Reine Quinte 3:2 ist 701,955 Cent gegen 700 gleichstufig, Halbtonverhältnis 2^(1/12).
- Deutsche Tonnamen: H–D–F–A, "B-Klarinette … klingt als B"; die DE-Fassung verwendet H/B konsequent. In EN steht B–D–F–A bzw. B-flat. Enharmonik: Ges/Fis- oder Des/Cis-Verwechslungen kommen nicht vor. Alterierter Akkord (G B D♭ F) ist korrekt als G7(♭5) gesetzt.
- Aussagen zu Funktionen (I/IV/V, Stufe und Kontext C-Dur I = G-Dur IV), Kadenzen (V–I, IV–I, I–V, Trugschluss V–VI in C-Dur G–H–D → a-Moll), Zwischendominante (A–Cis–E → d-Moll als V/ii), gemeinsamer Akkord (a-Moll als vi in C und ii in G, dann D-Dur), Alt-/Tenorschlüssel (c¹ auf mittlerer bzw. vierter Linie), Septakkord-Umkehrung (H–D–F–G = G7 im Sextakkord), Generalbass 6 und 6/4, Terz/Septime-Leitlinien (F–C → F–H bei Dm7 → G7), Obertonreihe, reine/gleichstufige/mitteltönige Stimmung und Sonatenform-Modell sind korrekt und im Ton vorsichtig ("Modell", "Stilregel, kein Gesetz").
- Rhythmus: die Beispiele summieren sich auf volle Takte (4/4: C/8. D/16 E/4 F/2 = 1; Triole 1/4 + F/2. = 1; 3/4-Hemiole zweimal 3/4).
- Keine Sachfehler gefunden; nur die Präzisierungen unter N5.

4. DE/US/UK und Suche
- `pnpm check:i18n`: "Übersetzungen vollständig". `pnpm check:content` grün. `pnpm check:knowledge:v2` grün. `pnpm check:knowledge` (Deno): "1055 Wissensbasis-/SDK-Prüfungen bestanden". `pnpm --filter @harmonia/content exec vitest run src/knowledge.test.ts src/knowledge-schema.test.ts`: 31 Tests grün. `pnpm check:tutor:catalogue` (v1, 245 Fälle) grün.
- 25 Suchfragen-Paare decken alle 25 Artikel ab, jeweils de/us/deAlternate/usAlternate nicht leer. `uk` nie gesetzt (siehe N3).
- Die behauptete Trefferquote 150/150 und 87/87 wurde NICHT unabhängig reproduziert (DB-Lauf offen), nur die Test- und Selektionslogik gelesen. Das Dokument kennzeichnet sie selbst als isolierte PostgreSQL-Messung ohne Supabase-/RLS-Test.
- Katalog v2: 315 Fälle (245 + 2 + 18 + 50), 50 `p3_library_*`-Fälle stimmen mit dem Generator überein.

5. Blocker oder Nacharbeit: siehe oben. Für den PR vor Merge B1 beheben, N2 (CI-Schritt) erwägen. N1 und N3 vor jeder Inhalts- oder Index-Freigabe, aber nicht vor dem Entwurfsmerge.
