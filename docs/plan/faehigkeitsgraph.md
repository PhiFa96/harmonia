# Fähigkeitsgraph P2.05

Stand: 05.10.2026. Der Entwurf für Stufen 1–2 liegt als geprüfte Daten mit Planungsdiagrammen vor. Claudes separate fachliche Abnahme bleibt offen; alle neuen Datensätze sind `entwurf`.

Fortsetzung 09.10.2026: Katalog und Plan stehen auf Version 3. Die erste Notationseinheit `notation.l1.staff` besitzt nun drei interne Lektionen mit 8/10/12 Aufgaben, sieben Karten und einen vorbereiteten Artikel. Alle 90 Fähigkeiten und 29 Einheiten bleiben erhalten. Der folgende Prüfstand beschreibt die ursprüngliche Graph-Umsetzung; aktueller Inhalt und Übergabe stehen in [notationseinstieg.md](notationseinstieg.md).

## Umfang

Der Katalog enthält 90 Fähigkeiten in 29 Einheiten und acht Bereichen. 40 Fähigkeiten gehören zu Stufe 1, 50 zu Stufe 2. Der Bereich `fundament` enthält die drei bestehenden Einführungsfähigkeiten aus P1.20; dazu kommen die sieben MVP-Fachbereiche aus [Phase 2](phase-2-mvp.md). Die vollständige Reihenfolge, alle Lernziele in Deutsch und Englisch (US/UK), stabile IDs und direkte Voraussetzungen stehen in den [erzeugten Diagrammen und Tabellen](faehigkeitsgraph-diagramme.md).

| Bereich | Stufe 1 | Stufe 2 |
|---|---|---|
| Einführung | Bestehende Noten-/Intervalllektion | — |
| Notation | Notensystem, Violinschlüssel, Stammtöne, Klaviatur, einfache Versetzungszeichen, Oktavlagen, Hilfslinien | Bassschlüssel, Klaviersystem, Oktavbezeichnungen, Geltung von Versetzungszeichen, Enharmonik, Töne setzen |
| Rhythmus | Puls, Tempo, Betonung, Ganze bis Achtel samt Pausen, Taktfüllung, 2/4–4/4, Auftakt, Rhythmuslesen | Punktierung, Haltebogen, einfache Synkopen, Achteltriole, Zwei-/Dreiteilung der Zählzeit, 6/8-Gruppierung |
| Intervalle | Nummer, Richtung, Tonschritt/Sprung, Halbtonabstand, Terzen, reine Quarte/Quinte/Oktave | Qualitäten bis zur Oktave, Bilden, Enharmonik, Umkehrung, abwärts und zusammengesetzte Intervalle |
| Tonleitern und Tonarten | — | Dur, natürliches/harmonisches/melodisches Moll, Grundton und Stufen, Vorzeichnung bis drei Kreuze/b, Nachbarschaft im Quintenzirkel, Paralleltonarten |
| Dreiklänge | — | Aufbau, Dur/Moll/vermindert/übermäßig, Grundton/Bass, Umkehrungen, leitereigene Dreiklänge |
| Gehörbildung | Puls, Gleich/Verschieden bei Rhythmus und Tonfolgen, Tonrichtung, erste Intervalle | Punktierte Rhythmen, Zählzeitteilung, Rhythmusergänzung, einfache Intervalle, Dur/Moll, Melodiegedächtnis, Dreiklänge und Umkehrungen |
| Musikgeschichte | Quellenarten und Kontext, europäische Epochenübersicht, Gattung/Besetzung/Anlass, Beobachtung und Schlussfolgerung | Europäische Kunstmusik vom Mittelalter bis zur Gegenwart, Jazzanfänge, Pop und Medien, Quellenvergleich |

Dur/Moll und Dreiklänge beginnen entsprechend [curriculum.md](../curriculum.md) in Stufe 2. Musikgeschichte benennt die europäische Kunstmusik ausdrücklich als einen Kontext; Jazz und Pop erhalten einen eigenen Zweig. Epochen sind keine allgemeingültige Chronologie aller Musikkulturen.

Elementare Gehörbildung hat unabhängige Startfähigkeiten: `aural.pulse` und `aural.pitch-direction` setzen keine Notenkenntnisse voraus. Notierte Rhythmuszuordnung und spätere Dreiklangsumkehrungen verbinden Hören mit passenden anderen Fähigkeiten. Die lineare Planungsreihenfolge führt alle Voraussetzungen vor ihrem Lernziel auf; sie fügt keine zusätzlichen Abhängigkeiten zwischen unabhängigen Bereichen hinzu.

## Daten und Prüfungen

- `packages/content/src/catalogue.json`: Bereiche, Bereichsstufen, Einheiten und Fähigkeiten einschließlich ihrer Voraussetzungen.
- `packages/content/src/curriculum-plan.json`: interner Index mit Stufenumfang, Einheitenreihenfolge und Zuordnung der Fähigkeiten.
- `packages/i18n/src/authored-content.json`: alle Ziele und Titel in DE, EN-US und EN-GB; vorhandene Fachbegriffe und Notenwertnamen über das Glossar.

Das Katalogformat bleibt bei `schemaVersion: 1`. Die Katalogversion und der dazu passende Plan steigen auf `contentVersion: 2`; die vorhandene erste Lektion, ihre Aufgaben und ihre stabile Inhaltsversion 1 bleiben erhalten. Neue Einheiten enthalten noch keine erfundenen Lektionsdateien oder Fortschritte. Die bisherigen drei Einführungsfähigkeiten bleiben getrennte Prototyp-IDs; eine automatische Übertragung auf die feineren Ziele braucht später eine geprüfte Fortschrittszuordnung.

Neue Bereiche verwenden eindeutige IDs wie `area.rhythm`; dadurch kollidieren sie nicht mit allgemein verwendeten Bibliotheksbegriffen. Die Bundleprüfung berücksichtigt bereits öffentliche UI-/Glossartexte bei identischen Entwurfstiteln (etwa „Dreiklänge“), prüft aber weiterhin jede unveröffentlichte Katalog-ID und jeden eigenständigen Entwurfstext.

`parseCurriculum` prüft zusätzlich zur P2.04-Pipeline: vollständige und eindeutige Zuordnung aller Fähigkeiten und Einheiten, passende Bereiche, belegte Stufen, gleiche Plan-/Katalogversion, den Stufenumfang, eine mögliche Reihenfolge ohne Rücksprung der Stufe und alle Voraussetzungen vor ihrem Lernziel. Eine Fähigkeit aus Stufe 1 kann keine Fähigkeit aus Stufe 2 voraussetzen. `curriculumSkills` liefert die geprüfte Reihenfolge an reine Planungswerkzeuge; es lädt selbst keine internen Daten.

```sh
pnpm check:content
pnpm check:curriculum
pnpm curriculum:render
pnpm test
pnpm check:deno
```

`curriculum:render` erzeugt die lokale Markdown-Ansicht mit einem Einheitendiagramm und Detaildiagrammen für jeden Bereich. Die Tabellen enthalten jeden Skill und alle direkten Voraussetzungen; gestrichelte Pfeile verbinden Voraussetzungen aus anderen Bereichen. `check:curriculum` vergleicht die erzeugte Ansicht mit dem eingecheckten Stand. Veraltete Diagramme lassen die CI fehlschlagen. Auch eine andere lokale Datei lässt sich mit `node tools/check-curriculum.mjs --write <Datei>` erzeugen.

Der Planungsindex liegt im internen Authoring-Einstieg. Produktionsdaten und Inhaltsübersetzungen folgen weiterhin ausschließlich dem P2.04-Freigabefilter. Die neuen Entwürfe werden nicht ausgeliefert. In der internen App-Vorschau läuft weiterhin die erste Lektion; P2.05 ergänzt die Planungsdaten.

Lokal bestanden: 1.388 Tests einschließlich 20 neuer Fähigkeitsplan-Tests, Diagramm-/CI-Prüfungen und Freigabe-Regressionen; Formatierung, Lint, Typen, Übersetzungs-/Inhaltsprüfung und Frozen-Lockfile-Installation. Alle 27 Deno-Prüfungen bestanden. preview und production wurden als Web-Export gebaut und im Browser geprüft: Einführung und erste Aufgabe intern, leerer freigegebener Katalog mit Rückweg und freiem Üben öffentlich. Der tatsächliche Produktions-Export besteht die Bundleprüfung; der interne Export wird erwartungsgemäß zurückgewiesen. GitHub-CI und native Geräte wurden hier nicht geprüft.

## Fachliche Übergabe und Folgearbeit

Ausgangsbasis sind [curriculum.md](../curriculum.md), [Inhalte und Didaktik](inhalte-und-didaktik.md) und die dokumentierten Engine-Konventionen. Die technische Abdeckung und Reihenfolge wurden geprüft. Für die fachliche Abnahme nach [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md) muss Claude die Lernziele und Voraussetzungen in einem getrennten Kontext gegen Literatur und eigene fachliche Prüfmittel prüfen. Besonders zu prüfen sind die Zuordnung zur Stufe, Umfang und Hörvoraussetzungen, Begrenzung der Tonarten, die genaue Reichweite der Intervallqualitäten sowie Terminologie und Quellenwahl für Musikgeschichte. P0.05 (vollständiges Glossar und weitere Fachkonventionen) bleibt ebenfalls offen.

P2.05 bleibt bis zu dieser Abnahme offen. P2.06 ergänzt die fehlenden Übungstypen; P2.07–P2.08 erstellen die eigentlichen Lektionen, Wissenskarten und Artikel. Freischaltung anhand von Fortschritt gehört zu P2.11, Bestehensschwelle zu P2.12. Chor-/Orchesteraufgaben, Stimmlagen und mehrstimmiger Tonsatz werden in späteren Stufen ausgearbeitet.
