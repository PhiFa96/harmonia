# 0003 – Zweisprachigkeit Deutsch und Englisch ab Start

- **Status:** angenommen
- **Datum:** 2026-10-02

## Kontext

Harmonia richtet sich an alle Lernenden. Deutsch ist die Sprache des Teams und eines klar umrissenen Startmarkts. Englisch öffnet den größten Markt. Musiktheorie unterscheidet sich zwischen den Sprachräumen nicht nur in Wörtern, sondern in Konventionen:

- Tonnamen: H/B gegenüber B/B♭
- Oktavbezeichnung: Helmholtz gegenüber wissenschaftlicher Notation
- Harmonik: Funktionstheorie gegenüber römischen Ziffern

## Entscheidung

Harmonia startet gleichzeitig auf **Deutsch und Englisch**. Beide Sprachen sind gleichberechtigt: Kein Release ohne vollständige Inhalte in beiden Sprachen.

## Konsequenzen

- **Architektur:** Benennung ist eine eigene Schicht der Engine. Tonnamen-System und Harmonik-System sind unabhängig von der App-Sprache einstellbar.
- **Inhalte:** Inhalte werden an die jeweilige Tradition angepasst, nicht nur übersetzt. Jeder Inhalt hat beide Sprachen; die CI prüft das.
- **Glossar:** Ein zentrales Fachglossar DE ↔ EN ist die einzige Quelle für Terminologie.
- **Aufwand:** Inhaltsproduktion, Tutor-Testkatalog, Store-Auftritt und Support verdoppeln sich in Teilen. Gegenmaßnahmen: parametrische Übungen, KI-Entwürfe mit fachlicher Abnahme (siehe [Risiken](../plan/risiken.md), R1).
- **Englische Terminologie (entschieden 02.10.2026):** umschaltbar zwischen amerikanisch (whole, half, quarter note) und britisch (semibreve, minim, crotchet). Vorschlag für den Standard: nach Gerätesprache (en-GB → britisch, sonst amerikanisch). Texte verwenden für solche Begriffe Platzhalter aus dem Glossar statt fester Wörter.
