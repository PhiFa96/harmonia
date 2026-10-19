# P3.13 – Engine und Notation v2

Technischer Stand vom 19.10.2026. Die Pakete `@harmonia/theory` und `@harmonia/notation` liefern eine erste gemeinsame Grundlage für Beispiele der Stufen 3–4. Die getrennte fachliche Prüfung und die Festlegung F03 stehen noch aus.

## Theorie

- `chord`, `chordPitches`, `chordTones`, `chordName` und `chordSymbol` unterstützen die gebräuchlichen Dur-, Moll-, halbverminderten, verminderten und übermäßigen Septakkorde sowie Nonakkorde und vollständige Dominantundezim- und Dominanttredezimakkorde. Die Intervalle bleiben buchstabiert; bei Tönen mit mehr als zwei Vorzeichen wird abgebrochen. Umkehrungen reichen bis zum höchsten Akkordton. Der Standardaufruf von `identifyChord` und `identifyChordFromMidi` bleibt für vorhandene Stufe-1/2-Übungen auf Dreiklänge begrenzt; `{ extended: true }` aktiviert die neuen Typen.
- `diatonicSevenths` schichtet die Tonleiter für alle 30 gebräuchlichen Tonarten. In Moll sind natürliche, harmonische und melodische Form ausdrücklich auswählbar.
- `analyzeHarmony` liefert diatonische Stufen, ein römisches Zeichen, ein vorläufiges Funktionskürzel sowie Zwischendominanten und den Neapolitaner als getrennte Kandidaten. Die interne Analyse behält Mehrdeutigkeiten; sie trifft keine kontextlose Entscheidung zwischen mehreren Deutungen.
- `classifyCadence` prüft authentischen, plagalen, Halb- und Trugschluss anhand der letzten Akkorde. `findPivotModulation` verlangt einen in beiden Tonarten diatonischen Pivotakkord und danach V(7)–I der Zieltonart. Das ist eine ausdrücklich enge Grundlage und keine automatische Tonarterkennung aus beliebiger Musik.

## Notation

- `layoutScore` setzt Violin-, Bass-, Alt- und Tenorschlüssel, bis zu zwei Stimmen pro System und mehrere Systeme mit verbundenen, ausgerichteten Taktstrichen. Der `Score` erlaubt mehr Stimmen; der Renderer weist mehr als zwei je System derzeit zurück. Noten und Trefferbereiche tragen für mehrstimmige Beispiele System- und Stimmindizes.
- Vollständige unpunktierte Achteltriolen, Haltebögen und Phrasierungsbögen werden unabhängig dargestellt. Phrasierungsbögen werden in der Kurzschreibweise durch `[` und `]` am Notenereignis angegeben; die Prüfung meldet offene Bögen.
- Akkord- und Funktionszeichen stehen mit `@ch:` und `@fn:` am Notenereignis. Beispielsweise `treble | (C4 E4 G4 B4)/2@ch:Cmaj7@fn:T7 G4/2@ch:G7@fn:D7`. SVG und nativer Renderer zeigen dieselben Zeichen; SVG maskiert den Text.

## Referenzfälle und Grenzen

Automatisierte Beispiele prüfen unter anderem C-Dur (`Imaj7–ii7–iii7–IVmaj7–V7–vi7–viiø7`), harmonisches a-Moll, G7/F als dritten Umkehrungsbass, V7–I in C-Dur und die Pivotfolge a-Moll–D7–G-Dur beim Wechsel C→G. Notationsfälle prüfen ein Violin-/Basssystem, beide C-Schlüssel, zwei gleichzeitige Stimmen, Triolen, Halte- und Phrasierungsbögen und Harmoniklabels. `tonal` bleibt nur ein unabhängiges Testorakel für die älteren Dreiklangfälle.

**Offene Abnahme:** F03 ist in `docs/plan/offene-fragen.md` weiterhin Claude nach Literaturrecherche zugewiesen. Die Funktionskürzel sind deshalb vorläufige Ausgaben, keine freigegebene F03-Konvention; die strukturierten Befunde zu Rolle, Stufe und Zielstufe können nach der Entscheidung neu formatiert werden. Ein Literaturabgleich der neuen Referenzfälle und Claudes Fachurteil nach ADR 0005 fehlen. Der Renderer unterstützt noch keine Schlüssel-/Vorzeichnungs-/Taktwechsel am Taktanfang, mehr als zwei Stimmen auf einem System, automatisch kollisionsfreie dichte Partituren oder ineinander geschachtelte Phrasierungsbögen. Diese Fälle dürfen nicht als bereits gesetzt oder fachlich abgenommen gelten.
