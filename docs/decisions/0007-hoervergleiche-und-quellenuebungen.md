# 0007 – Hörvergleiche und quellenbezogene Übungen

- **Status:** technisch umgesetzt; fachliche Inhaltsabnahme nach ADR 0005 offen
- **Datum:** 2026-10-12

## Problem

Die letzten Stufe-1-Einheiten benötigen Rhythmus- und Melodievergleiche, die Zuordnung eines gehörten Rhythmus zu Notenbildern und belegte Hörbeobachtungen. Die bisherigen Intervallfragen haben genau zwei Tonhöhen und Intervallantworten. Rhythmustippen prüft Anschläge; Wissensfragen besitzen keine Klangquelle. Keiner dieser Verträge bildet die neuen Aufgaben vollständig ab.

## Entscheidung

`LISTENING_CHOICE` ergänzt als 18. Typ den vorhandenen Spieler. Er verwendet vollständige `Score`-Quellen und dieselbe Audio-Uhr wie andere Beispiele. Die sechs Frageformen sind Pulsgruppe, Rhythmusvergleich, Rhythmusauswahl, Tonrichtung, Melodievergleich und Hörbeobachtung. Drei Kandidatenscores erscheinen ausschließlich bei der Rhythmusauswahl vor der Wertung. Andere Quellen werden nach der Wertung oder mit Lösungshinweis sichtbar.

Die Bewertung berechnet Antworten aus den tatsächlichen Tonanfängen, Dauern, Pausen und bei Bedarf MIDI-Tonhöhen. Für Rhythmusvergleiche bleibt die Tonhöhe unberücksichtigt. Melodievergleiche verlangen dieselben Tonhöhen in derselben Reihenfolge und mit denselben Dauern; transponierte Ähnlichkeit gilt hier nicht als Gleichheit. Gleichzeitige verschiedene Tonhöhen werden anhand überlappender Klangzeiträume erkannt. Historische Herkunft wird niemals aus einem Klangmodell abgeleitet.

Pulsaufgaben verwenden zwei gleiche, ausdrücklich markierte Gruppen. Der höhere Startklang und gleichmäßige Folgeschläge machen den Puls eindeutig; eine bestimmte Taktart wird nicht aus unbetonter Musik erraten. A/B-Vergleiche erhalten eine Trennpause von 0,75 Sekunden, die nicht Teil der Beispieltakte ist. Wiedergabe plant alle eigenen Stimmen gemeinsam und stoppt ausschließlich diese Stimmen. Hörpause, Hinweisleiter und getrennte Erstversuchs-/Wiederholungsstatistik bleiben erhalten. Wiederholungen der neuen Hörfragen ändern Klangquelle und fachliche Antwort.

Musikkunde und Geschichte ergänzen sechs Themen im vorhandenen Wissensframework. Die Epochenordnung erweitert `ORDER` um die feste grobe europäische Folge. Alle fachlichen Namen werden im Glossar geführt; die Texte unterscheiden US/UK. Bestehende freie Sätze behalten ihre Themen und Parameter.

## Konsequenzen

Es werden keine nativen Bibliotheken oder Pakete ergänzt. App, Node und Deno verwenden dieselbe Bewertung. Kurze Rhythmus-Kandidaten passen sich an die Kartenbreite an, sodass ihr vollständiger Takt auf dem Handy sichtbar ist. Die bestehende Schema- und SQLite-Version bleibt 1; Inhaltsversion 11 bezeichnet die Ergänzung.

Die Modelle sind eigene Klavierbeispiele. Sie sind weder historische Aufnahmen noch Nachbildungen von Singstimmen oder bestimmten Ensembles. Klangquellen-Aufgaben fragen eindeutige Begriffsbeschreibungen; Instrumenten- und Stimmenidentifikation aus echten Aufnahmen ist hier kein Prüfziel. Fachliche Freigabe, Literaturabgleich und echte Geräte-/Screenreader-Abnahme folgen den bestehenden Zuständigkeiten. Vollständige Übergabe: [Stufe 1](../plan/stufe-1-vollstaendig.md).
