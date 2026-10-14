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
| 03.10.2026 | F12: Ton klingt auch bei iOS-Stummschalter. Wer gerade nicht hören kann, überspringt mit „Gerade nicht hören“ alle Hörübungen der laufenden Lektion, mit Hinweis auf Kopfhörer (wie bei Duolingo) | [ADR 0006](../decisions/0006-audio-grundlage.md), P1.19 |
| 03.10.2026 | Englisch-Standard nach Region: UK-Begriffe in GB, IE, AU, NZ, ZA, IN; sonst US | [i18n-und-glossar.md](i18n-und-glossar.md) |
| 03.10.2026 | Design-Richtung entscheidet Claude (Phillip: „Du machst alles. Sehr schön modern und animiert.“): Prinzipien, Farben, Schrift Figtree, Bewegung, Logo-Entwurf, Kern-Screens | [design-richtung.md](design-richtung.md) |
| 02.10.2026 | F04 für Dreiklänge: C, Cm, C°, C+, Umkehrung als C/E; Tonbuchstaben international, deutsch (H, B) wählbar | [theorie-engine.md](theorie-engine.md) |
| 13.10.2026 | F11: mindestens 80 % anrechenbare richtige Erstversuchsantworten einer Lektion; Hinweise 1–2 erlaubt, Lösungen und ausgelassene Aufgaben liefern keine Richtig-Gutschrift; frühere Erfolge bleiben gültig | [ADR 0011](../decisions/0011-lernfortschritt-aus-geprueften-versuchen.md), [Lernpfad](lernpfad.md) |
| 14.10.2026 | F07: zusätzliche Spielwährung für Streak-Schutz; Startwerte 3/1 verdiente Münzen und 10 pro Schutz, weiterhin kostenlos nach sieben erfolgreichen Lerntagen, höchstens zwei insgesamt | [ADR 0014](../decisions/0014-motivation-mit-muenzen-und-erinnerungen.md), [P2.14](streaks-xp-tagesziel-erinnerungen.md) |
| 14.10.2026 | P2.19/F08: Monats- und Jahresabos vorbereiten; Preise später festlegen. Keine Preisfreigabe durch technische Integration. | [ADR 0019](../decisions/0019-revenuecat-abos-und-berechtigungen.md), [P2.19](abos-revenuecat.md) |

| 14.10.2026 | F06: wiederauffüllbare Energie/Herzen; 30 Punkte und ein Punkt je zehn Minuten als serverseitig änderbare Startwerte. | [ADR 0020](../decisions/0020-lernenergie-paywall-und-kuendigungseingang.md), [P2.20](paywall-und-gratis-limits.md) |
| 14.10.2026 | F09: Werbung später vorbereiten; aktuell kein SDK und keine Werbung. | [P2.20](paywall-und-gratis-limits.md) |

## Offen

| # | Frage | Optionen | Entscheidet | Bis |
|---|---|---|---|---|
| F03 | Schreibweise der Funktionssymbole | Konvention festlegen (z. B. nach verbreitetem Hochschul-Lehrbuch) | Claude (nach Recherche, ADR 0005) | P0.05 |
| F04 | Schreibweise der Akkordsymbole für Septakkorde und erweiterte Akkorde (Dreiklänge entschieden) | z. B. Cmaj7 / CΔ7 / CM7; umschaltbar? | Claude (nach Recherche, ADR 0005) | mit den Septakkorden (Phase 2) |
| F05 | Stimmumfänge und Regelwerk für den Tonsatz | Lehrbuchkonvention wählen | Claude (nach Recherche, ADR 0005) | vor P4.09 |
| F08 | Preise Premium und Max | nach Marktvergleich | Phillip | P2.19 |
| F10 | Gastmodus ohne Konto | ja (Fortschritt lokal, später verknüpfen) / nein | gemeinsam | P2.01 |
| F13 | Wer trägt Stripe-Gebühren im Marktplatz | Plattform / Coach | Phillip | P4.04 |
| F14 | Coaching für Minderjährige | ab 18 / mit Eltern-Einwilligung | Phillip (nach Rechtsberatung) | P4.01 |
| F15 | Rechtsform | Einzelunternehmen / UG / GmbH | Phillip (nach Beratung) | P0.02 |
| F16 | Name und Marke „Harmonia“ | behalten / Alternativen nach Recherche | Phillip | P0.03 |
| F17 | Aufbewahrungsfrist für Einzelaufgaben | 12 Monate / anderer Wert | gemeinsam (Löschkonzept) | P2.21 |
