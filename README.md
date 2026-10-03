# Harmonia

Musiktheorie lernen – hörbar, spielerisch und so tief, wie du willst. Vom ersten Notenschlüssel bis zum Hochschulniveau, mit KI-Tutor und echten Coaches. Im Browser und als App für iOS und Android.

> **Status: Phase 1 – technisches Fundament.** Theorie-Engine, Notenbild, Klavierklang, Klaviatur und drei Übungstypen sind implementiert. Im Tab „Üben“ läuft ein gemischter Übungssatz mit Bewertung und Hinweisen; die vollständige Lektion mit lokaler Speicherung folgt in P1.20. Geräteprüfungen und fachliche Inhaltsabnahme sind noch offen. Details: [Übungs-Framework P1.19](docs/plan/uebungs-framework.md) und [Phase 1](docs/plan/phase-1-fundament.md).

## Konzept

| Dokument | Inhalt |
|---|---|
| [Vision](docs/vision.md) | Leitbild, Zielgruppe, Anspruch, Prinzipien |
| [Features](docs/features.md) | Alle Feature-Ideen mit Inspiration und Phasen-Vorschlag |
| [Lerninhalte](docs/curriculum.md) | Stufen 1–6 und alle Themenbereiche |
| [Geschäftsmodell](docs/business-model.md) | Abo-Stufen, Coach-Marktplatz, App-Store-Regeln |
| [Marktrecherche](docs/research/marktrecherche.md) | Was andere Apps machen und was wir übernehmen |
| [Roadmap](docs/roadmap.md) | Phasen vom Prototyp bis zur Vision im Überblick |
| [Umsetzungsplan](docs/plan/README.md) | Detaillierte Arbeitsschritte je Phase, Architektur, Datenmodell, KI-Tutor, Qualität, Recht, Risiken |
| [Entscheidungen](docs/decisions/) | Architekturentscheidungen (ADRs) |

## Tech-Stack

Expo (React Native, TypeScript) für iOS, Android und Web, dazu Supabase als Backend. Details und Bausteine: [ADR 0001](docs/decisions/0001-plattform-und-tech-stack.md).

## Entwickeln

Voraussetzungen: Node.js 22 (siehe `.nvmrc`) und pnpm 10. pnpm lässt sich über Corepack aktivieren:

```sh
corepack enable
pnpm install
```

| Befehl | Zweck |
|---|---|
| `pnpm lint` | ESLint (mit Typinformationen) und Prüfung der erlaubten Paket-Abhängigkeiten |
| `pnpm typecheck` | TypeScript-Prüfung aller Pakete |
| `pnpm test` | Tests aller Pakete (Vitest, in der App Jest mit jest-expo) |
| `pnpm format` / `pnpm format:check` | Formatierung mit Prettier anwenden bzw. prüfen |
| `pnpm check:deno` | Theorie-Engine unter Deno prüfen (Laufzeit der Supabase Edge Functions) |
| `pnpm check:i18n` | Übersetzungen prüfen (Schlüssel DE/EN, leere Texte, Pluralformen, Platzhalter) |
| `pnpm --filter @harmonia/mobile web` | App im Browser starten |
| `pnpm --filter @harmonia/mobile start` | Expo-Entwicklungsserver für Development Builds auf iOS und Android |
| `pnpm --filter @harmonia/mobile build:web` | Web-Bundle bauen (`apps/mobile/dist`) |

Aufbau des Monorepos: [docs/plan/architektur.md](docs/plan/architektur.md).

## Lizenz

Noch nicht festgelegt. Bis dahin gilt: alle Rechte vorbehalten.
