# ADR 0051 – Vierstimmige Einführung für Satzaufgaben

Datum: 26.10.2026. Status: technische Entwurfsentscheidung; Fach-/Produktfreigabe offen.

## Anlass

Die sechs P4.10-Einführungskarten zeigten bisher zwei einzelne Töne im Violinschlüssel. Der interne Einstieg unter `/part-writing` öffnete direkt die Aufgaben. Die Nacharbeitsliste verlangt ein vierstimmiges Einführungsbeispiel.

## Entscheidung

- Zwei eigene Akkordbeispiele mit vier Stimmen auf zwei verbundenen Notensystemen werden in den sechs Einführungskarten verwendet. Stufe 4: C-Dur mit den klingenden MIDI-Tönen 48/55/60/64. Stufe 5: G7 innerhalb des bestehenden Entwurfsprofils, 43/55/59/65. Die Stimmen halten gleichzeitig je eine ganze Note. Sopran/Alt stehen oben, Tenor/Bass unten.
- Eigene DE/en-US/en-GB-Beschriftungen benennen Stimmenanordnung und Dauer. Notensystem und Notenwert kommen aus dem Glossar; britische Bezeichnungen werden dadurch aufgelöst.
- Der interne Einstieg zeigt dieselben versionierten Karten über `LessonIntroduction` wie der reguläre Lernpfad. Ablauf: Auswahl → Einführung mit Klangbeispiel → drei Aufgaben → Abschluss. Verlassen und erneutes Öffnen beginnen bei der Einführung; der Modus bleibt flüchtig und ohne Lernnachweise oder Belohnungen.
- Einführung und Artikelbeispiele verwenden bei mehreren Stimmen den allgemeinen `ScoreView`. Das bestehende einfache Lernbild mit einem Zielton behält seine begrenzte Darstellung. Die Inhaltspipeline prüft die Darstellbarkeit der neuen mehrstimmigen Beispiele; Klaviaturbeispiele mit zwei Systemen behalten ihren bisherigen Ein-Zielton-Vertrag.
- Die sechs Karten und Lektionen erhalten Version 23, ebenso Katalog/Fähigkeitsplan. Übungssätze und deren Ratingquellen behalten Version 22; Parameter und Regelprofil werden durch diesen Schritt nicht geändert.

## Nachweise und Folgen

Feste MIDI-/Zeit-/Stimmtabellen prüfen alle sechs Karten. App-Tests rendern die tatsächlichen vier Notenbeschreibungen, prüfen die Einführung vor dem Aufgabenaufruf, Klangsteuerung, Verlassen und die kanonische Aufgabenquelle. Das einfache frühere Lernbild wird zusätzlich geprüft. Browserproben prüfen DE/en-US/en-GB mit echtem lokalem Klangbeispiel, regionalen Begriffen, Axe und anschließendem Editor. Alle drei Tonarten des Stufe-5-Durchgangs bleiben bearbeitbar.

Quellen mit alter Lektionsversion 19 oder 22 werden abgewiesen. Gemischte Altpläne mit ersetzten Quellversionen und lokale Stufe-5-Vorschauentwürfe mit Katalogversion 22 benötigen einen neuen Start. Alte Antworten werden nicht umgedeutet. Quellengebundene KI-/Zertifikatsprüfstände müssen neu erzeugt und unabhängig geprüft werden.

Diese Arbeit ist ausdrücklich **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe**. Alle Inhalte bleiben `entwurf`; öffentlich sind null Lektionen freigegeben. Unabhängige Prüfung der neuen Beispiele/Beschriftungen, F03/F05 sowie echte Geräte-/Screenreader-/Audioabnahmen bleiben offen. Keine Veröffentlichung oder Bereitstellung. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.
