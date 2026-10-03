# Offene Fragen und Entscheidungen

## Bereits entschieden

| Datum | Entscheidung | Wo festgehalten |
|---|---|---|
| 02.10.2026 | Zielgruppe: alle, Stufen wie bei Duolingo, bis Hochschulniveau | [vision.md](../vision.md) |
| 02.10.2026 | Tech-Stack: Expo + Supabase | [ADR 0001](../decisions/0001-plattform-und-tech-stack.md) |
| 02.10.2026 | Engine entscheidet, KI erklärt | [ADR 0002](../decisions/0002-ki-tutor-und-fachliche-korrektheit.md) |
| 02.10.2026 | Deutsch und Englisch ab Start | [ADR 0003](../decisions/0003-zweisprachigkeit-de-en.md) |
| 02.10.2026 | Marktplatz: 15 % Provision + Coach-Pro-Abo | [business-model.md](../business-model.md) |
| 02.10.2026 | Alle Feature-Ideen bleiben im Plan; Aufbau Schritt für Schritt | dieser Plan |
| 02.10.2026 | F01: Mindestalter vorläufig ab 16 (Bestätigung durch Rechtsberatung in P0.02) | [recht-und-compliance.md](recht-und-compliance.md) |
| 02.10.2026 | F02: Englische Terminologie umschaltbar zwischen US und UK | [ADR 0003](../decisions/0003-zweisprachigkeit-de-en.md) |
| 02.10.2026 | F18: Arbeitsweise mit GitHub-Issues und einem Pull Request pro Schritt | [README.md](README.md) |
| 02.10.2026 | Helmholtz-Oktaven mit Hochzahlen (c¹, c², c³ …), Kontra- und Subkontraoktave tiefgestellt (C₁, C₂) | [theorie-engine.md](theorie-engine.md) |
| 02.10.2026 | Deutsche Intervall-Kurzform „gr. 3, kl. 3, r. 5, üb. 4, verm. 5“; Tonnamen-Tabelle und Intervall-Konventionen (keine verminderte Prime, Richtung folgt dem Stammton) fachlich bestätigt | [theorie-engine.md](theorie-engine.md) |
| 02.10.2026 | Chromatische Tonleiter aufwärts mit Kreuzen, abwärts mit b; Blues- und Ganztonleiter nach Recherche eingeführt (P1.09) | [theorie-engine.md](theorie-engine.md) |
| 02.10.2026 | Fachliche Prüfung und Fachkonventionen übernimmt Claude; Phillip wird dazu nicht mehr gefragt | [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md) |
| 03.10.2026 | Englisch-Standard nach Region: UK-Begriffe in GB, IE, AU, NZ, ZA, IN; sonst US | [i18n-und-glossar.md](i18n-und-glossar.md) |
| 02.10.2026 | F04 für Dreiklänge: C, Cm, C°, C+, Umkehrung als C/E; Tonbuchstaben international, deutsch (H, B) wählbar | [theorie-engine.md](theorie-engine.md) |

## Offen

| # | Frage | Optionen | Entscheidet | Bis |
|---|---|---|---|---|
| F03 | Schreibweise der Funktionssymbole | Konvention festlegen (z. B. nach verbreitetem Hochschul-Lehrbuch) | Claude (nach Recherche, ADR 0005) | P0.05 |
| F04 | Schreibweise der Akkordsymbole für Septakkorde und erweiterte Akkorde (Dreiklänge entschieden) | z. B. Cmaj7 / CΔ7 / CM7; umschaltbar? | Claude (nach Recherche, ADR 0005) | mit den Septakkorden (Phase 2) |
| F05 | Stimmumfänge und Regelwerk für den Tonsatz | Lehrbuchkonvention wählen | Claude (nach Recherche, ADR 0005) | vor P4.09 |
| F06 | Gratis-Limit-Modell | Energie / feste Tageskontingente / nur Inhaltsgrenze | gemeinsam | P2.20 |
| F07 | Spielwährung (z. B. für Streak-Schutz) | ja / nein | gemeinsam | P2.14 |
| F08 | Preise Premium und Max | nach Marktvergleich | Phillip | P2.19 |
| F09 | Werbung im Gratis-Bereich | ja / nein | Phillip | P2.20 |
| F10 | Gastmodus ohne Konto | ja (Fortschritt lokal, später verknüpfen) / nein | gemeinsam | P2.01 |
| F11 | Bestehensschwelle einer Lektion | 80 % / anderer Wert | gemeinsam | P2.12 |
| F12 | Verhalten beim iOS-Stummschalter | Ton trotzdem abspielen / stumm bleiben mit Hinweis | gemeinsam | P1.16 |
| F13 | Wer trägt Stripe-Gebühren im Marktplatz | Plattform / Coach | Phillip | P4.04 |
| F14 | Coaching für Minderjährige | ab 18 / mit Eltern-Einwilligung | Phillip (nach Rechtsberatung) | P4.01 |
| F15 | Rechtsform | Einzelunternehmen / UG / GmbH | Phillip (nach Beratung) | P0.02 |
| F16 | Name und Marke „Harmonia“ | behalten / Alternativen nach Recherche | Phillip | P0.03 |
| F17 | Aufbewahrungsfrist für Einzelaufgaben | 12 Monate / anderer Wert | gemeinsam (Löschkonzept) | P2.21 |
