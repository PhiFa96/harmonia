# 0008 – Stufe-2-Quellenaufgaben und Achteltriolen

- **Status:** vorgeschlagen, im Review-Zweig umgesetzt; fachliche Claude-Abnahme offen
- **Datum:** 2026-10-13

## Problem

Die restlichen Stufe-2-Fähigkeiten benötigen konkrete Fragen zu Notationsregeln, Dauern, Intervallbeziehungen, Tonarten, Akkordrollen und Quellenkritik. Reine Begriffsdefinitionen reichen dafür nicht. Triolen müssen im Notenbild erkennbar und als tatsächliche Einsätze spiel- und bewertbar sein. Die Hörziele erfordern mehr Details als die sechs Stufe-1-Formen.

## Umsetzung

`CONTEXT_CHOICE` ergänzt den Spieler als 19. Typ. Seine 21 Themen verwenden strukturierte Noten-, Tonart- oder Dokumentquellen statt einer gespeicherten Zielantwort. `contextAnswer` berechnet die Lösung aus der Quelle. Figuren beschreiben Positionen und gedruckte Vorzeichen für Screenreader, ohne Zieltonnamen vorwegzunehmen. Varianten vergleichen nur die sichtbare beziehungsweise fachlich relevante Quelle; nicht sichtbare Dokumentfelder genügen nicht. Fehlerwiederholungen ändern zusätzlich die Antwort, außer bei den absichtlich konstanten Durmustern und der Gesamtdauer einer Achteltriole.

Notation, Dauerrechnung, Umkehrung, Intervallvereinfachung, Paralleltonarten und Dreiklänge verwenden die vorhandene Theorie-Engine. Die Umkehrung folgt der bestehenden Lehrbuchregel Prime ↔ Oktave; die Vereinfachung einer Doppeloktave endet bei der einfachen Oktave. `tonal` verwendet bei diesen Randfällen eine andere Konvention. Die Abweichung ist bereits in `packages/theory/src/interval.tonal.test.ts` dokumentiert und wird hier beibehalten; es entsteht keine zweite Konvention im Übungsmodul.

`CHORD_BUILD.diatonic: true` ergänzt Schreibaufgaben mit Tonart und Stufe 1–7. Die Quelle verwendet Dur oder natürliches Moll, höchstens drei Vorzeichen und Grundstellung. Zielklang und Schreibweise werden aus der leitereigenen Terzschichtung abgeleitet. Harmonisches Moll, weitere Akkordgrößen und mehrstimmiger Tonsatz gehören nicht zu dieser Ergänzung.

Kurzschrift und Notensatz unterstützen vollständige Gruppen aus drei unpunktierten Achteln im Verhältnis 3:2 (`/8{3:2}`) innerhalb einer Viertel. Bravuras tatsächliche Glyphe `tuplet3` (U+E883) bezeichnet die Gruppe. Unvollständige Gruppen, Triolenpausen, andere Werte und N-tolenverhältnisse bleiben ausgeschlossen. `RHYTHM_TAP.level: triplets` nutzt dieselben exakten Quellwerte für Klang und Aufnahme. Das erweitert die notwendige Stufe-2-Darstellung, nicht den allgemeinen Notensatz für Phase 3.

`LISTENING_CHOICE` ergänzt punktierte Rhythmusauswahl, hörbare zwei-/dreiteilige Unterteilung, Rhythmusergänzung, Dur/natürliches Moll und eine geänderte Position in einer Vier-Ton-Melodie. Die Klangquellen bleiben vollständige Takte. Nur das ausdrücklich beschriftete Gerüst und die Viertel-Bausteine der Ergänzungsfrage sind Ausschnitte; ihre Antwortgrafiken zeigen keine eigene Taktangabe oder Schlusslinie. Hörbare Unterteilungsfragen liefern einen markierten Grundschlaganfang und fragen die Unterteilung, nicht eine aus Klang allein mehrdeutige Taktart.

Historische Lehrdossiers sind ausdrücklich fiktiv. Ihre datierten Werk-/Medien-/Aufführungsaussagen stehen im Text; die eigenen Klaviermodelle dienen nicht als Herkunftsnachweis. Periodenzuordnung bleibt eine grobe europäische Orientierung mit Beispielen fern von Übergängen. Medienbeispiele vermeiden technische Anachronismen und Datierungen nach 2026. Quellenvergleiche trennen Werk/ Aufnahme, Ankündigung/Aufführung, ungelöste Datumswidersprüche und bloße Übereinstimmung unbekannter Unabhängigkeit.

## Abnahme

Alle Inhalte bleiben `entwurf`. Tabellen, `tonal`, Schema-/Darstellungsprüfungen, vollständige Fehlerrunden und App-/Browserdurchgänge prüfen die technische Umsetzung. Claudes separater Durchgang nach ADR 0005 und ein zugänglicher Literaturabgleich bleiben Voraussetzung der fachlichen Freigabe. Prüfung und Übergabe: [Stufe 2 vollständig intern](../plan/stufe-2-vollstaendig.md).
