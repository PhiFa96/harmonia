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
- Neue Texte zuerst in `packages/i18n/src/messages/de.ts`, dann `en-us.ts`; `en-gb.ts` nur für britische Schreibweise. Fachbegriffe nicht in Texte schreiben, sondern aus dem Glossar einsetzen (`$t(glossary:measure)`), damit US/UK stimmt. Details: `docs/plan/i18n-und-glossar.md`
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
- `node tools/prepare-samples.mjs <Quelle>` / `node tools/check-samples.mjs` – Klavierproben aufbereiten bzw. prüfen (ffmpeg nötig; Details in `docs/plan/notation-audio-eingabe.md`)
- `python3 tools/make-accidental-font.py <BravuraText.otf>` – Vorzeichen-Schrift für Fließtext neu erzeugen (fonttools nötig; Details in `docs/plan/design-richtung.md`)
- App: `pnpm --filter @harmonia/mobile web` (Browser), `… start` (Development Build), `… build:web` (Web-Bundle)
- CI: `.github/workflows/ci.yml` (Jobs „Lint, Typen, Tests“, „Web-Build der App“ und „Deno-Kompatibilität“) muss vor dem Merge grün sein

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
- **Expo (SDK 57):** APIs ändern sich je SDK. Neue Pakete mit `npx expo install` (kompatible Versionen), APIs an den installierten Typen prüfen (z. B. `Tabs` aus `expo-router/js-tabs`, nicht mehr aus `expo-router`). `ios/` und `android/` entstehen per Continuous Native Generation und werden nie von Hand bearbeitet.
