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

- **Deutsche Tonnamen:** H statt englisch B; B steht für englisch B♭. Im Datenmodell Tonhöhen sprachneutral speichern (Stammton + Vorzeichen + Oktave, z. B. wissenschaftliche Notation: C4 = c′) und erst in der Anzeige lokalisieren.
- **Enharmonik beachten:** Cis und Des klingen im gleichstufigen System gleich, sind in der Notation aber verschieden. Intervalle immer aus Stammtonabstand *und* Halbtonabstand bestimmen, nie nur aus Halbtönen (große Terz C–E ≠ verminderte Quarte C–Fes).
- Fachliche Aussagen (Definitionen, Regeln) gegen Standardliteratur prüfen. Bei Unklarheit nachfragen statt raten.

## Arbeitsweise

- Vor größeren Änderungen klärende Fragen stellen.
- Entscheidungen mit Tragweite als ADR in `docs/decisions/` festhalten (fortlaufend nummeriert).
- Keine fremden Texte, Übungen oder Notenbeispiele übernehmen. Eigene Inhalte erstellen oder nur gemeinfreie bzw. passend lizenzierte Werke mit Quellenangabe verwenden.

## Befehle

Noch keine. Wird ergänzt, sobald das Projekt aufgesetzt ist (Build, Lint, Tests).
