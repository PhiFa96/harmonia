# Harmonia

Musiktheorie lernen – interaktiv, mit Klang und sofortigem Feedback. Im Browser und als App für iOS und Android.

> **Status: Konzeptphase.** Es gibt noch keinen App-Code. Plattform und Tech-Stack werden gerade entschieden – siehe [ADR 0001](docs/decisions/0001-plattform-und-tech-stack.md).

## Idee

Harmonia verbindet Theorie mit Hören: Noten lesen, Intervalle, Tonleitern, Akkorde, Harmonielehre und Gehörbildung werden in kurzen Übungen trainiert. Jede Übung ist hörbar und gibt direkt Rückmeldung.

## Zielplattformen

- Web (Browser)
- iOS
- Android

## Repository-Struktur

```
harmonia/
├── docs/
│   ├── vision.md          Vision, Zielgruppe, Abgrenzung
│   ├── curriculum.md      Lerninhalte und Reihenfolge
│   ├── roadmap.md         Phasen und Meilensteine
│   └── decisions/         Architekturentscheidungen (ADRs)
├── CLAUDE.md              Arbeitsregeln für Claude Code
└── README.md
```

Der App-Code kommt hinzu, sobald ADR 0001 entschieden ist.

## Nächste Schritte

1. Vision und Zielgruppe schärfen → [docs/vision.md](docs/vision.md)
2. Lerninhalte für das MVP auswählen → [docs/curriculum.md](docs/curriculum.md)
3. Plattform und Tech-Stack entscheiden → [ADR 0001](docs/decisions/0001-plattform-und-tech-stack.md)
4. Projekt aufsetzen (Build, Lint, Tests, CI) → [docs/roadmap.md](docs/roadmap.md)

## Lizenz

Noch nicht festgelegt. Bis dahin gilt: alle Rechte vorbehalten.
