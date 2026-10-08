# CLAUDE.md

Hinweise für Claude Code in diesem Repository.

## Projekt

Harmonia ist eine Musiktheorie-Lern-App für Web, iOS und Android. Aktueller Stand: Phase 1 (Fundament): Theorie-Engine, Notation, App-Grundgerüst, Übersetzungen. Konzept und Entscheidungen liegen in `docs/` (Überblick in der README).

- **Tech-Stack:** Expo (React Native, TypeScript) + Supabase – siehe `docs/decisions/0001-plattform-und-tech-stack.md`
- **Grundsatz KI:** Eine getestete Musiktheorie-Engine bewertet, die KI erklärt – siehe `docs/decisions/0002-ki-tutor-und-fachliche-korrektheit.md`
- **Umsetzungsplan:** `docs/plan/` – Arbeitsschritte mit IDs (z. B. P1.07), Definition of Done in `docs/plan/README.md`

## Sprache

- Gespräche und Dokumentation: Deutsch
- UI-Texte und Lerninhalte: Deutsch **und** Englisch, gleichberechtigt (ADR 0003) – nie hartkodieren, immer über `packages/i18n` (`t('…')`; ESLint-Regel `harmonia/no-hardcoded-text`)
- Neue Oberflächentexte zuerst in `packages/i18n/src/messages/de.ts`, dann `en-us.ts`; `en-gb.ts` nur für britische Schreibweise. Inhaltstexte für Katalogdaten in `packages/i18n/src/authored-content.json` in allen drei Sprachfassungen pflegen. Fachbegriffe nicht in Texte schreiben, sondern aus dem Glossar einsetzen (`$t(glossary:measure)`), damit US/UK stimmt. Details: `docs/plan/i18n-und-glossar.md`, `docs/plan/inhalts-pipeline.md`
- Code und Bezeichner: Englisch

## Fachliche Konventionen (Musiktheorie)

- **Deutsche Tonnamen:** H statt englisch B; B steht für englisch B♭. Im Datenmodell Tonhöhen sprachneutral speichern (Stammton + Vorzeichen + Oktave, z. B. wissenschaftliche Notation: C4 = c¹) und erst in der Anzeige lokalisieren.
- **Enharmonik beachten:** Cis und Des klingen im gleichstufigen System gleich, sind in der Notation aber verschieden. Intervalle immer aus Stammtonabstand *und* Halbtonabstand bestimmen, nie nur aus Halbtönen (große Terz C–E ≠ verminderte Quarte C–Fes).
- **Fachliche Prüfung macht Claude selbst** (ADR 0005): Phillip nicht um fachliche Stichproben oder Konventionsentscheidungen bitten. Fachliche Aussagen (Definitionen, Regeln) gegen Standardliteratur prüfen, wo möglich mit mindestens zwei unabhängigen Mitteln (eigene Tabellen, `tonal`, Literatur). Ist die Literatur uneinheitlich, recherchieren, die verbreitetste Konvention wählen und Begründung samt Alternativen dokumentieren. Nicht raten.

## Arbeitsweise

- Vor größeren Änderungen klärende Fragen stellen.
- Entscheidungen mit Tragweite als ADR in `docs/decisions/` festhalten (fortlaufend nummeriert).
- Keine fremden Texte, Übungen oder Notenbeispiele übernehmen. Eigene Inhalte erstellen oder nur gemeinfreie bzw. passend lizenzierte Werke mit Quellenangabe verwenden.

## Befehle

- `pnpm install` – Abhängigkeiten (pnpm 10 über Corepack, Node 22)
- `pnpm lint` – ESLint mit Typinformationen + `tools/check-package-graph.mjs` (erlaubte Paket-Abhängigkeiten)
- `pnpm typecheck` – TypeScript in allen Paketen
- `pnpm test` – Vitest in allen Paketen; einzeln: `pnpm --filter @harmonia/theory test`
- `pnpm format` / `pnpm format:check` – Prettier (Markdown ist ausgenommen)
- `pnpm check:deno` – Theorie-Engine unter Deno prüfen und ausführen (`tools/deno-smoke.ts`)
- `pnpm check:i18n` – Übersetzungen prüfen: gleiche Schlüssel DE/EN, keine leeren Texte, Pluralformen, Platzhalter, Glossar-Verweise
- `pnpm check:content` – Katalog, Graph, Noten-/Textreferenzen und eingecheckte öffentliche Artefakte prüfen; `pnpm content:publish` erzeugt diese Dateien lokal. `pnpm check:content:bundle [Verzeichnis]` prüft den tatsächlichen Produktions-Export auf Entwürfe. Details: `docs/plan/inhalts-pipeline.md`.
- `pnpm check:curriculum` / `pnpm curriculum:render` – interne Fähigkeitszuordnung, Lernreihenfolge und eingecheckte Planungsdiagramme prüfen bzw. lokal erzeugen. Bei Katalogänderungen den versionierten Index `packages/content/src/curriculum-plan.json` aktualisieren. Details und offene fachliche Abnahme: `docs/plan/faehigkeitsgraph.md`.
- `pnpm db:start` / `pnpm db:stop` – lokales Supabase (Docker erforderlich); `pnpm db:lint`, `pnpm db:test`, `pnpm db:test:api` prüfen Funktionen und Profilrechte. `pnpm db:reset` löscht ausschließlich die lokale DB und spielt Migrationen neu ein. Details und offene EU-Projekte: `docs/plan/supabase-grundlage.md`.
- `node tools/prepare-samples.mjs <Quelle>` / `node tools/check-samples.mjs` – Klavierproben aufbereiten bzw. prüfen (ffmpeg nötig; Details in `docs/plan/notation-audio-eingabe.md`)
- `python3 tools/make-accidental-font.py <BravuraText.otf>` – Vorzeichen-Schrift für Fließtext neu erzeugen (fonttools nötig; Details in `docs/plan/design-richtung.md`)
- App: `pnpm --filter @harmonia/mobile web` (Browser), `… start` (Development Build), `… build:web` (Web-Bundle)
- CI: `.github/workflows/ci.yml` (Jobs „Lint, Typen, Tests“, „Web-Build der App“, „Deno-Kompatibilität“ und „Supabase und Profil-Zugriffsschutz“) muss vor dem Merge grün sein

## Design

- Richtung, Farben, Schrift und Bewegung: `docs/plan/design-richtung.md`. Farben, Abstände, Radien und Bewegungswerte nur über die Tokens (`@harmonia/ui`), nie als Einzelwerte in Screens.
- Bausteine aus `@harmonia/ui/native`: `AppText` statt `Text` (Schriftstufe, Farbrolle), `MusicText` für Text mit ♯ ♭ ♮, `Button`, `Card`, `ListItem`, `FeedbackBanner`, `BottomSheet`, `Icon` (eigene Symbole), Farben über `useUiTheme()`. Neue Bausteine in die Galerie (`apps/mobile/src/app/gallery.tsx`, nur Entwicklung) aufnehmen.
- Neue Farbpaare in `CONTRAST_PAIRS` eintragen; der Test prüft sie (Text 4,5 : 1, Bedienelemente 3 : 1). Feedback nie nur über Farbe.
- Jede Animation braucht eine Fassung für „Bewegung reduzieren“ (nur Überblenden, keine Schleifen); Werte aus `moveTo`/`fadeTo`. Die Systemeinstellung kommt aus `AccessibilityInfo`, nicht aus Reanimated (die Test-Bibliothek von expo-router ersetzt Reanimated durch eine Attrappe ohne `useReducedMotion`).
- Barrierefreiheit am `<Svg>` nicht über Props am Svg (landen im Web als ungültige DOM-Attribute), sondern über eine umschließende `View aria-hidden`.

## Code-Konventionen

- Pakete werden als TypeScript-Quellcode exportiert (kein Build-Schritt). Relative Importe immer mit Dateiendung `.ts`, damit derselbe Code auch in Deno (Supabase Edge Functions) läuft.
- Gemeinsame Versionen über den pnpm-Katalog (`catalog:` in `pnpm-workspace.yaml`).
- Neue interne Pakete in `tools/check-package-graph.mjs` eintragen (Regeln aus `docs/plan/architektur.md`).
- Theorie-Engine: eigene Implementierung (ADR 0004). `tonal` nur als Test-Orakel in `*.tonal.test.ts`, nie im Produktionscode.
- Fast-check-Generatoren für Tests liegen in `packages/theory/src/testing/` (nicht exportiert).
- **Klang** über `packages/audio` (plattformneutral, Web-Audio-Teilmenge); die App erzeugt den Kontext in `apps/mobile/src/audio` (react-native-audio-api). Timer und andere Browser-APIs nur als Pfeilfunktion weiterreichen (`this`!). Tests mit der Attrappe in `packages/audio/src/testing/`; Plattformfehler zusätzlich im Browser prüfen (ADR 0006).
- **Übungen** über `packages/exercises` (P1.19): Generatoren bekommen einen RNG, Antworten bleiben sprachneutrale IDs, Bewertung kommt aus der Theorie-Engine. Gleich klingende Intervalle nicht als getrennte Hör-Antworten anbieten. Hinweis 3 erklärt die Lösung; Hilfen und übersprungene Hörfragen gesondert zählen. Schnittstelle und Parameter: `docs/plan/uebungs-framework.md`. Die Lektion aus P1.20 verwendet denselben `ExerciseTask`-Baustein, neue Tonhöhenvarianten für Fehler und getrennte Erstversuchs-/Wiederholungsstatistik.
- **Lektionen und Speicherung (P1.20/P2.04):** `packages/content` enthält den normalisierten Katalog mit Zod-Schemas und `content.…`-Textreferenzen. Fachliche Texte bleiben bis zur separaten Abnahme `entwurf`; die öffentliche Auslieferung enthält nur `freigegeben` und vollständig freigegebene Abhängigkeiten. `@harmonia/content/catalogue` und `@harmonia/i18n/content-messages` sind standardmäßig öffentlich; Metro wählt für development/preview interne Daten. Reine Übergänge in `packages/exercises/src/lesson.ts`; Ergebnisse über `src/storage/lesson-repository.ts` mit stabiler Client-ID idempotent in SQLite. Seeds behalten ihren Zahlen-/Texttyp. Web braucht WASM und COOP/COEP-Header; Export mit `pnpm preview:web` prüfen. Details und offene Personen-/Gerätetests: `docs/plan/erste-lektion.md`, `docs/plan/inhalts-pipeline.md`.
- **Deno:** `tools/deno.json` bildet Workspace-Importe auf die TS-Quellen ab, pinnt i18next sowie zod und übernimmt die strengen Optionen der Pakete. Für direkte Aufrufe `--config tools/deno.json` verwenden; `pnpm check:deno` prüft Theorie, Übungen und die erste Inhaltsdatei ohne installierte Node-Abhängigkeiten.
- **Tonhöheneingaben (P2.06, erster Teil):** `NOTE_PLACE` und `INTERVAL_BUILD` verwenden vollständige ASCII-Tonhöhen-IDs einschließlich Oktave und bewerten die Schreibweise; `KEY_FIND` verwendet `key:<MIDI>` und akzeptiert enharmonisch gleiche Tasten. Fragebilder enthalten keine Zielnote bei Schreibaufgaben. `PitchAnswerInput` übernimmt freie Eingaben in `ExerciseTask`; nach der ersten Bewertung bleibt alles gesperrt. `KEY_FIND`-Wiederholungen müssen eine andere MIDI-Höhe haben. Parametergrenzen und weitere offene Typen: `docs/plan/tonhoeheneingabe.md`.
- **Tonleitern/Vorzeichnungen (P2.06, zweiter Teil):** Vier weitere Typen verwenden `ScaleParams` beziehungsweise `KeySignatureParams`. Tonleiterantworten enthalten acht vollständige Tonhöhen; Grundton bleibt fest, sieben Plätze sind frei. Vorzeichnungsantworten bewahren die eingegebene Reihenfolge; eine leere Folge ist ausdrücklich zu bestätigen. Erkennungsfragen geben Dur/Moll vor. Klassisch melodisches Moll abwärts ist natürliches Moll; beide Arten dürfen dort nicht getrennt angeboten werden. Tonleiter-Klang stoppt nur eigene Stimmen. Bedienung, Grenzen, Tests und noch offene Abnahme: `docs/plan/tonleitern-und-vorzeichnungen.md`.
- **Akkorde (P2.06, dritter Teil):** `CHORD_BUILD` und `CHORD_IDENTIFY` unterstützen die vier Dreiklangarten und drei Lagen. Basston bleibt beim Schreiben fest, zwei weitere vollständige Tonhöhen werden einzeln bearbeitet und gemeinsam notiert; ihre Eingabereihenfolge ist frei. Visuelle Erkennung bewertet Schreibweise, auditive Erkennung MIDI-Töne relativ zum vorgegebenen Grundton. Hörfragen spielen zuerst den Grundton als Bezugston, dann den Akkord; ein bloß genannter Grundton löst die Symmetrie übermäßiger Dreiklänge ohne absolutes Gehör nicht. Bezugston und Akkord stoppen nur eigene Stimmen. Hörwiederholungen müssen Bezugston oder Akkordklang ändern, nicht nur enharmonische Namen oder Schlüssel. Septakkorde und Tonsatz sind hier noch nicht enthalten. Grenzen, Speicherung und Abnahme: `docs/plan/akkorduebungen.md`.
- **Rhythmus/Takt (P2.06, vierter Teil):** `RHYTHM_TAP` bewertet Notenanfänge aus dem tatsächlichen Notenbild auf der Audio-Uhr; rohe Millisekunden bleiben in `taps:<…>` erhalten. Fehlende und zusätzliche Anschläge sind falsch, Abbrüche erzeugen keine Antwort. Ein abgeschlossener leerer Take ist auswertbar. Einzähltakt und Aufnahme haben einen festen Grundschlag; 6/8 verwendet die punktierte Viertel. `METER_IDENTIFY` fragt die Gliederung der sichtbaren Taktangabe mit Zahl und Wert der Grundschläge ab. Keine auditive Takterkennung aus mehrdeutigen Rhythmen. Timing-Toleranz ist inklusiv und auf 40 % des kleinsten Einsatzabstands begrenzt. `playRhythm` stoppt nur seine eigenen Stimmen; keine global stoppende Sequenz verwenden. Gemeldete Audio-Latenz wird berücksichtigt, echte Geräte-Kalibrierung bleibt offen. Bedienung, Parameter, Speicherung, Wiederholung und Abnahme: `docs/plan/rhythmus-und-takt.md`.
- **Expo (SDK 57):** APIs ändern sich je SDK. Neue Pakete mit `npx expo install` (kompatible Versionen), APIs an den installierten Typen prüfen (z. B. `Tabs` aus `expo-router/js-tabs`, nicht mehr aus `expo-router`). `ios/` und `android/` entstehen per Continuous Native Generation und werden nie von Hand bearbeitet.
