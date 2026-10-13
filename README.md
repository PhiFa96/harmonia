# Harmonia

Musiktheorie lernen – hörbar, spielerisch und so tief, wie du willst. Vom ersten Notenschlüssel bis zum Hochschulniveau, mit KI-Tutor und echten Coaches. Im Browser und als App für iOS und Android.

> **Status: Technisches Fundament und erster MVP-Ausbau.** 17 Übungstypen und sechs freie Sätze sind implementiert. Intern gibt es 19 auswählbare Lektionen mit 190 Aufgaben: den Prototyp und sechs Stufe-1-Einheiten zu Notation, Klaviatur, Register, Puls, Notenwerten sowie einfachen Takten/Auftakt. Die sechs Einheiten besitzen 49 neue Wissenskarten und sechs Artikelentwürfe. Alle neuen Inhalte bleiben Entwurf, bis Claude Code sie separat fachlich geprüft hat. Ergebnisse werden lokal pro Lektion gespeichert; Bestehens- und Freischaltregeln sowie weitere Stufen fehlen noch. Geräteprüfungen und Testpersonen sind offen. Aktueller Stand: [Einfache Taktarten und Auftakt P2.07](docs/plan/einfache-taktarten-und-auftakt.md) und [Phase 2](docs/plan/phase-2-mvp.md).

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
| `pnpm check:deno` | Theorie, Übungen, erste Lektion und Fähigkeitsplan unter Deno prüfen |
| `pnpm check:i18n` | Übersetzungen prüfen (Schlüssel DE/EN, leere Texte, Pluralformen, Platzhalter) |
| `pnpm check:content` | Inhaltsschemas, Referenzen, Voraussetzungen, Sprach-/Notenbeispiele und öffentliche Dateien prüfen |
| `pnpm check:curriculum` / `pnpm curriculum:render` | Fähigkeitszuordnung und Lernreihenfolge prüfen; Planungsdiagramme abgleichen bzw. lokal erzeugen |
| `pnpm content:publish` | Geprüfte öffentliche Katalog-/Textdateien lokal erzeugen (kein Deployment) |
| `pnpm check:content:bundle [Verzeichnis]` | Produktions-Export auf Entwurfsdaten und -texte prüfen |
| `pnpm --filter @harmonia/mobile web` | App im Browser starten |
| `pnpm --filter @harmonia/mobile start` | Expo-Entwicklungsserver für Development Builds auf iOS und Android |
| `pnpm --filter @harmonia/mobile build:web` | Web-Bundle bauen (`apps/mobile/dist`) |
| `pnpm preview:web` | Web-Export auf localhost mit SQLite-Headern starten |
| `pnpm db:start` / `pnpm db:stop` | Lokales Supabase starten/stoppen (Docker erforderlich) |
| `pnpm db:lint` / `pnpm db:test` | SQL-Funktionen und Profil-Zugriffsrechte prüfen |
| `pnpm db:test:api` | Lokale Auth-/REST-Integration mit zwei Testkonten prüfen |

Aufbau des Monorepos: [docs/plan/architektur.md](docs/plan/architektur.md).

Lokales Backend, Profilmigration und offene staging/production-Einrichtung: [Supabase-Grundlage P1.04](docs/plan/supabase-grundlage.md).

Inhaltsproduktion, interne Vorschau, öffentliche Freigaben und EAS-Übergabe: [Inhalts-Pipeline P2.04](docs/plan/inhalts-pipeline.md). `APP_VARIANT=production` baut nur freigegebene Inhalte; ohne separate fachliche Abnahme bleiben die zehn Lektionen intern.

Entwurf für Stufen 1–2 mit 90 Fähigkeiten, Voraussetzungen und Einheitenreihenfolge: [Fähigkeitsgraph P2.05](docs/plan/faehigkeitsgraph.md). Fachliche Abnahme und die vollständigen Lektionen folgen.

Neue Aufgaben: [Tonhöheneingaben](docs/plan/tonhoeheneingabe.md), [Tonleitern und Vorzeichnungen](docs/plan/tonleitern-und-vorzeichnungen.md), [Akkorde](docs/plan/akkorduebungen.md), [Rhythmus und Taktgliederung](docs/plan/rhythmus-und-takt.md) sowie [Wissensfragen, Zuordnen und Ordnen](docs/plan/wissensaufgaben.md). Alle 14 zusätzlich geplanten MVP-Typen sind technisch umgesetzt. P2.06 bleibt bis zur fachlichen Abnahme und den echten Plattformtests offen; vollständige Kurse und Bestehens-/Freischaltlogik sind die Folgearbeit.

Der [erste Teil von P2.07](docs/plan/notationseinstieg.md) beginnt beim Notensystem. Danach folgen [Klaviatur und Vorzeichen](docs/plan/klaviatur-und-vorzeichen.md), [Oktavlagen und Hilfslinien](docs/plan/oktavlagen-und-hilfslinien.md), [Puls und Zählgruppen](docs/plan/puls-tempo-und-zaehlgruppen.md), [Notenwerte und Pausen](docs/plan/notenwerte-und-pausen.md) sowie [einfache Takte und Auftakt](docs/plan/einfache-taktarten-und-auftakt.md). Sechs Artikel sind für die spätere Tutor-Wissensbasis vorbereitet; danach folgen Intervalle und weitere Stufe-1-Einheiten.

## Lizenz

Noch nicht festgelegt. Bis dahin gilt: alle Rechte vorbehalten.
