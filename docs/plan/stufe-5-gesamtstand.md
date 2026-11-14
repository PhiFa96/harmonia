# P4.19 – Stufe 5 als zusammenhängender interner Gesamtentwurf

**Technischer Nachtrag vom 14.11.2026 (noch nicht integriert):** [Cantus-Schlussvarianten](kontrapunkt-schlussvarianten.md), ADR 0082, ergänzt einen neutralen Konventionshinweis und konkrete Schluss-Erklärungen aus dem zweiten System in DE/en-US/en-GB. Aktuell 11 aufsteigende und 13 absteigende Cantus-Schlüsse; der Rohbericht nennt zwölf Varianten. Generator/Musik/Wertung bleiben identisch, Katalog 31 und Vorschau-Engine 2 erhalten. Der folgende Abschnitt beschreibt den Vorgängerstand. Technische P4-Vorarbeit vor formaler Freigabe, alles Entwurf; keine neue Fach-/Primärquellenfreigabe, Veröffentlichung oder Main-Integration. P4.01 bis F14/Recht zurückgestellt.

Stand: 03.11.2026 · Branch `codex/level-five-complete-draft` · eigenständige Basis `main` bei `f7bc15d`.

Auf ausdrücklichen Nutzerauftrag wird der bestehende Stufe-5-Entwurf vervollständigt. **Technische P4-Vorarbeit vor der formalen Phase-4-Freigabe.** Alle Lehrinhalte bleiben Entwurf, öffentlich weiterhin null Lektionen. Keine Veröffentlichung, produktive Migration, Fernsynchronisierung oder Main-Integration. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt. [ADR 0074](../decisions/0074-stufe-fuenf-mit-vielfaeltigen-quellen-und-festen-stimmen.md).

## Umfang und bearbeitete Befunde

Die acht Einheiten, 24 Lektionen, 240 Aufgabenplätze, 32 Einführungskarten und acht Artikel bleiben erhalten. Die drei vorhandenen P4.10-Lektionen sind unverändert. Der Gesamtstand umfasst weiter Kontrapunkt, Imitation, Formen, Analysemethoden, Reihen, Mengen, Prozessmodelle und quellenkritische Musikkulturen-Einführung.

| Befund | Umsetzung |
|---|---|
| A7 (Rest) | Kontrapunkttexte nennen reine Quinten bzw. Primen/Oktaven einschließlich Oktavierungen. „Intervallklasse“ bezeichnet dort nicht mehr zugleich die posttonalen Klassen ic1–6. Die neun tatsächlichen Prüfbedingungen bleiben unverändert. |
| A8 | Fugenbegriffe in DE/US/UK ohne widersprüchliche Häufigkeitsangaben; nacheinander gezeigte Kanonmotive heißen nicht mehr „serielle Darstellung“. Die Wissensfrage verrät den gesuchten Begriff nicht. |
| A9 | Entwickler-/spätere Freigabehinweise aus den Lerntexten entfernt. Musikalisch relevante Modellgrenzen bleiben ausdrücklich erklärt. |
| A10 | Spektralmodell auf zwei passende Schlüssel verteilt, ohne seine vier klingenden Tonhöhen zu ändern. Höchstens zwei Hilfslinien; Darstellung, Inhalteprüfung und Wiedergabe verwenden dieselbe Quelle. |
| A11 | 24 eigene korrekte Kurzmodelle mit 4/5/6 Klängen statt eines korrekten Modells; gezielte Fehlerquellen und mehrere Transpositionen. Neue Reihenpermutationen, wechselnde Fehlstellen und mehrfach vorkommende Tonklassen; Mächtigkeiten 1–4 einschließlich 2. Musikkulturen-Lektionen mit Auswahl-/Zuordnungsmischung und zwölf vorhandenen Begriffen aus Praxisgrenzen, Kontext und Belegen. |
| A12 | Neue Kontrapunktaufgaben und die vier Einführungsbeispiele haben getrennte Systeme mit festem Cantus/Gegenstimmenbezug. Bei einer Kreuzung werden die Noten nicht nach Höhe umsortiert. Beschreibungen und Audio berücksichtigen beide Stimmen. |
| A15 | Jede Lektion und ihre tatsächlichen Aufgabenquellen schreiben nur ihre passende Zielfähigkeit fort. Vorherige Fähigkeiten bleiben Voraussetzungen; die drei Stände laufen dadurch nicht allein wegen identischer Quellenzuordnung gleich. |
| en-US-Formulierung | Gerichtete Tonhöhenabstände werden verständlich als Größe und Richtung von in Halbtonschritten gemessenen Intervallen beschrieben; US/UK über das Glossar. |

## Notation und Bewertung

Neue Kontrapunktquellen bestehen aus genau zwei ausgerichteten Systemen mit je einem ungebundenen Ganznotenereignis pro Takt. Das obere System ist die Gegenstimme, das untere der Cantus. „Oben/unten“ beschreibt die Systemzuordnung, nicht eine nachträgliche Sortierung klingender Tonhöhen. Eine Pause, ungeeignete Dauern oder unvollständige Paarung wird nicht als korrekter Satz gewertet.

Der historische Ein-System-Dyadenadapter bleibt für alte direkte Quellenvergleiche erhalten. Dessen frühere Konvention war „tieferer Ton = Cantus“; er kann keine eigenständige Stimmidentität einer Kreuzung ausdrücken. Neue Aufgaben nutzen ihn nicht. Alte gespeicherte Vorschauen werden durch den Versionswechsel gesperrt und brauchen einen Neustart.

Die 24 neuen Kurzmodelle sind eigene Rechenmodelle. Eine leere Befundliste bestätigt weiterhin ausschließlich die neun benannten Regeln, keine vollständige Modalität, melodische Qualität, Singbarkeit oder Hochschulabschlussleistung. Gezielte Veränderungen erzeugen Gegenbeispiele. Die Lösung wird immer aus dem tatsächlich dargestellten Material berechnet; kein gespeichertes Richtig/Falsch-Merkmal im Aufgabenobjekt.

`staffPresentation: parts` unterscheidet getrennte Lehrstimmen vom bisherigen einzelnen Klaviatur-Zielbild. Letzteres behält seine strikte Prüfung. Notenbeschreibungen verwenden System- und Stimmbezug einschließlich der vom Renderer ausgelassenen Nullindizes; Vorzeichen werden keiner fremden Stimme zugeordnet. Das Spektralbeispiel behält C3, C4, G4 und C5 und verteilt sie lesbar auf Violin-/Bassschlüssel.

## Lernziele und Ablauf

Die drei Lektionen jeder Einheit haben eigene, konkrete Titel und Zielfähigkeiten: zunächst Begriffe/Material erkennen, danach Beziehungen untersuchen, schließlich Aussagen und Grenzen anwenden. Die Aufgabenquellen übernehmen denselben einzelnen Fähigkeitsbezug; Artikel können weiterhin mehrere Fähigkeiten abdecken. Bestehende Graphvoraussetzungen, einschließlich der Imitations-/Mengenlehre-Voraussetzungen für Analyse, bleiben erhalten.

Die Musikkulturen-Einführung verwendet weiterhin ausschließlich quellenkritische Aussagen und ausdrücklich westliche Vergleichsmodelle. Die späteren Lektionen beziehen zusätzlich die bereits vorhandenen Grundlagen zu Ort/Zeit/Anlass/Urheberschaft sowie Beobachtung/Metadaten/Deutung/Unsicherheit ein. Es werden keine neuen traditionellen Skalen oder vermeintlichen Originalaufnahmen eingeführt.

Lokal in einer Preview: **Üben → Stufe-5-Entwurf öffnen** oder `/level-five`. Alle 24 Lektionen sind für die interne Vorschau wählbar. Einführung, Beispiele, Aufgaben, Hinweise, veränderte Fehlerwiederholung, Abschluss, bestätigte Speicherung, Reload und gezieltes Verwerfen bleiben verbunden. Teilweise ausgefüllte Zuordnungen werden ebenfalls wiederaufgenommen und sind im eigenen Datenschutzexport enthalten. Der Vorschauablauf erzeugt keine Lernnachweise, Ratings, XP oder Synchronisierung. Der reguläre Lernpfad behält seine eigenen Freischaltregeln.

### Versionswechsel

- Katalog und Fähigkeitsplan: **31**. Die betroffenen Stufe-5-Einheiten, Fähigkeiten, Karten, Artikel, Übungssätze und Lektionen: ebenfalls **31**.
- Bestehende Tests der früheren Stufen erwarten ebenfalls den neuen gemeinsamen Katalogstand 31. Ihre Lektions-/Quellversionen und inhaltlichen Erwartungen bleiben erhalten.
- Vorschau-Engine: **2**, Speicherformat weiterhin 1. Alte Engine-/Quellstände bleiben gesperrt, löschbar und werden nicht stillschweigend neu berechnet.
- Die offenen PRs #136/#143/#144/#145/#146 sind nicht in diesem Branch enthalten. Bei Integration die neuen Quellenstände und den höchsten Katalogstand erhalten und die abgeleiteten Inhalts-/Planungsartefakte neu prüfen. Rechtsprüfungs-Snapshots müssen nach Code-/Inhaltsänderungen neu erstellt werden.
- `tools/complete-level-five.py` kann den bekannten unveröffentlichten Ausgangsstand reproduzierbar materialisieren; unbekannte Katalogstände oder bereits anders freigegebene P4.19-Datensätze werden abgewiesen. Es ersetzt nicht das historische `author-level-five.py` und schreibt keine anderen Kursdatensätze neu.

## Nachweise

Zunächst rot ausgeführte Regressionen: fehlende Mächtigkeit 2, verräterisch stets erste doppelte Tonklasse, nur ein korrektes Kontrapunktmodell, verlorene Stimmidentität, identische Fähigkeitszuordnung, einseitige Weltquellen und zu viele Hilfslinien. Bei der Integration zusätzlich gefunden und korrigiert: die bisherige Zielbild-Annahme bei zwei Systemen, ausgelassene Nullindizes in Vorzeichenbeschreibungen und ein vom überarbeiteten Definitionstext verratener Begriff. Die bestehenden Sperrprüfungen werden nicht abgeschwächt.

Die ergänzten unabhängigen `tonal`-Prüfungen vergleichen 400 Kontrapunktquellen, 240 Reihen und je 200 Mengen-/Vektorquellen mit eigener Intervall-/Tonhöhenrechnung. Sie bestätigen nicht die vollständige Stilsicherheit der Modelle. Quellennachweise und verbleibende Fachfragen: [Quellenentwurf](../quality/p4-19-quellenentwurf.md).

```sh
corepack pnpm --filter @harmonia/exercises exec vitest run src/advanced-context-complete.test.ts src/advanced-context-complete.tonal.test.ts
corepack pnpm --filter @harmonia/content exec vitest run src/level-five-package.test.ts src/level-five-complete.test.ts src/level-five-preview.test.ts
node --test tools/level-five-complete.test.mjs
corepack pnpm check:content
corepack pnpm check:curriculum
corepack pnpm check:i18n
corepack pnpm typecheck
NODE_OPTIONS=--max-old-space-size=4096 corepack pnpm lint
```

Browserprüfungen laufen auf einem eigenen tatsächlichen Preview-Export: DE/en-US/en-GB, getrennte Stimmen, Spektralbild und Klang, echte Fehlerwiederholung, Reload/Abschluss, teilweise gespeicherte Quellenzuordnung, schmale Darstellung, Axe und Export ohne Lernnachweise. Separater Produktions-Export und öffentlicher Routen-/Bundle-Schutz bleiben erforderlich. Konkrete Zahlen, lokale Nachweise und alle fünf CI-Jobs am finalen Commit stehen im Entwurfs-PR. Lokale grüne Tests ersetzen keine erforderliche CI.

## Weiterhin offene Abnahmen

Unabhängige Fach-/Primärquellen-/Didaktik-/Sprachprüfung, Fachliteratur zu den noch nicht belegten Spezialthemen, reale Mikrofon-/Audio-/Geräte-/Screenreaderprüfung, F03/F05 soweit betroffen sowie formale Phase-4- und Veröffentlichungsfreigabe. Keine Einstufungs-, Rechts- oder Produktfreigabe aus diesen technischen Proben. P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt.
