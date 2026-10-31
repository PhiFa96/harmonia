# ADR 0052 – Zeitreise-Texte mit isolierter Glossarbindung

Datum: 26.10.2026. Status: technische Entwurfsentscheidung; Fach-/Sprachfreigabe offen.

## Anlass

P4.12 las die gesonderten Stationstexte direkt aus den Entwurfsdaten. Fachbegriffe waren dadurch fest eingetragen; `$t(glossary:…)` wurde in diesem Ablauf nicht aufgelöst. Die Nacharbeitsliste verlangt die Anbindung an das gemeinsame Glossar. Die Entwurfstexte müssen dabei weiterhin aus dem Produktionsbuild ausgeschlossen bleiben.

## Entscheidung

- `createHistoryJourneyText(locale, messages)` erhält die Texte ausdrücklich als Argument. Der öffentliche Helfer importiert keine Entwurfsdaten zur Laufzeit. Er bindet eigene Kopien an eine isolierte Inhalts-i18next-Instanz mit dem vorhandenen Glossar. Globale Laufzeitressourcen und übergebene Daten werden nicht verändert; spätere Änderungen an der Eingabe verändern bestehende Bindungen nicht.
- Die interne Route löst alle 14 Textfelder einschließlich der beiden Antwortgruppen über diesen Helfer auf. Einstimmigkeit, Mehrstimmigkeit, Imitation, Generalbass, Stimme und Phrase verwenden Glossarschlüssel. Neu ist nur die Bezeichnung „Phrase“ mit ihren DE/EN-Pluralformen im gemeinsamen Glossar, ohne historische Definition. Regionale englische Begriffe kommen aus der gewählten Sprache; die bestehenden britischen Textabweichungen bleiben erhalten.
- Fehlende Stationen in der gewählten Sprache werden abgewiesen, auch wenn eine andere Sprache Entwurfstexte enthält. Unbekannte oder unvollständige Glossarverweise, Verweise auf andere Geschichten, unaufgelöste Platzhalter und leere Texte führen zu Fehlern. Jede Antwortgruppe muss nach der Auflösung genau drei unterschiedliche Antworten enthalten.
- Die gesonderte Sprachprüfung verwendet zusätzlich dieselbe Auflösung wie die Route. Der Bundleguard prüft sowohl rohe Vorlagen als auch vollständig aufgelöste Entwurfstexte für DE/en-US/en-GB. Bereits öffentliche gemeinsame Glossarwerte bleiben zulässig; die vollständigen privaten Geschichten und alle acht Partituren bleiben gesperrt.
- Katalog und Fähigkeitsplan bleiben auf Version 23. Aufgabenparameter, Lösungen, Quellenabschnitte, Klangmodelle, Bewertung und flüchtiger Fragezustand ändern sich nicht. Es entstehen keine gespeicherten Lernnachweise oder XP.

## Nachweise und Grenzen

495 Sprachtests, vier gezielte App-Tests und 253 Werkzeugtests sind erfolgreich. Die Tests prüfen alle Texte in zwölf Sprach-/Stationskombinationen, US-/UK-Begriffswahl, isolierte Daten, leere öffentliche Ressourcen, fehlerhafte Verweise und erst nach Auflösung identische Antworten. Die neue Bindung ist zusätzlich unter Deno typgeprüft und in allen zwölf Kombinationen ausgeführt.

Sechs Chromium-Abläufe auf tatsächlichen Vorschau-/Produktions-Webexports sind erfolgreich. Die Vorschau zeigt aufgelöste Begriffe, Hinweise, Korrektur und Erklärungen mit lokalem Wiedergabestart. Die öffentlichen Deep-Links zeigen in allen drei Sprachen keine freigegebenen Stationen. Der Bundleguard bestätigt fünf JavaScript-Dateien ohne unveröffentlichte Katalog-IDs oder Inhaltstexte. Typecheck, Lint und Sprach-/Inhaltsprüfungen sind erfolgreich. Quellengebundene KI-/Zertifikatsprüfmappen wurden lokal neu erzeugt; sie erteilen keine Freigabe.

Dies ist ausdrücklich **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe** auf Nutzerauftrag. Die sprachliche Einbettung der Begriffe, neue redaktionelle Texte, Fragen und Ablenker brauchen unabhängige Fach-/Sprachprüfung. Primärquellen-, Hör-, Screenreader- und Geräteabnahmen bleiben offen; sämtliche Stationen bleiben `entwurf`. Keine Veröffentlichung oder Bereitstellung. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.
