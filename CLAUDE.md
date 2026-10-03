# CLAUDE.md

Hinweise für Claude Code in diesem Repository.

## Projekt

Harmonia ist eine Musiktheorie-Lern-App für Web, iOS und Android. Aktueller Stand: Konzeptphase, noch kein App-Code. Konzept und Entscheidungen liegen in `docs/` (Überblick in der README).

- **Tech-Stack:** Expo (React Native, TypeScript) + Supabase – siehe `docs/decisions/0001-plattform-und-tech-stack.md`
- **Grundsatz KI:** Eine getestete Musiktheorie-Engine bewertet, die KI erklärt – siehe `docs/decisions/0002-ki-tutor-und-fachliche-korrektheit.md`
- **Umsetzungsplan:** `docs/plan/` – Arbeitsschritte mit IDs (z. B. P1.07), Definition of Done in `docs/plan/README.md`

## Sprache

- Gespräche und Dokumentation: Deutsch
- UI-Texte und Lerninhalte: Deutsch **und** Englisch, gleichberechtigt (ADR 0003) – nie hartkodieren, immer über `packages/i18n`
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
- App: `pnpm --filter @harmonia/mobile web` (Browser), `… start` (Development Build), `… build:web` (Web-Bundle)
- CI: `.github/workflows/ci.yml` (Jobs „Lint, Typen, Tests“, „Web-Build der App“ und „Deno-Kompatibilität“) muss vor dem Merge grün sein

## Code-Konventionen

- Pakete werden als TypeScript-Quellcode exportiert (kein Build-Schritt). Relative Importe immer mit Dateiendung `.ts`, damit derselbe Code auch in Deno (Supabase Edge Functions) läuft.
- Gemeinsame Versionen über den pnpm-Katalog (`catalog:` in `pnpm-workspace.yaml`).
- Neue interne Pakete in `tools/check-package-graph.mjs` eintragen (Regeln aus `docs/plan/architektur.md`).
- Theorie-Engine: eigene Implementierung (ADR 0004). `tonal` nur als Test-Orakel in `*.tonal.test.ts`, nie im Produktionscode.
- Fast-check-Generatoren für Tests liegen in `packages/theory/src/testing/` (nicht exportiert).
- **Expo (SDK 57):** APIs ändern sich je SDK. Neue Pakete mit `npx expo install` (kompatible Versionen), APIs an den installierten Typen prüfen (z. B. `Tabs` aus `expo-router/js-tabs`, nicht mehr aus `expo-router`). `ios/` und `android/` entstehen per Continuous Native Generation und werden nie von Hand bearbeitet.
