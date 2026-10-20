# Fachlicher Prüfdurchgang Stufe 1 (ADR 0005)

Stand: 16.10.2026. **Ergebnis: Prüfung durchgeführt, Fehler behoben, aber noch nichts auf `freigegeben` gesetzt.** Alle 568 Katalogdatensätze bleiben `entwurf`; öffentlich bleiben null Lektionen.

## Umfang und Vorgehen

Geprüft wurden die 13 Einheiten der Stufe 1 (37 Lektionen, 106 Karten, 13 Artikel, 37 Übungssätze) in DE/US/UK. Fünf voneinander unabhängige Prüfer mit frischem Kontext (Notation, Rhythmus, Intervalle, Gehörbildung, Geschichte) haben je einen Bereich geprüft; sie kannten keine Schlussfolgerungen der Autorenseite. Rohberichte: [`docs/quality/fachpruefung-stufe-1/`](../quality/fachpruefung-stufe-1/). Die darin genannten Skripte lagen im flüchtigen Arbeitsordner und sind nicht eingecheckt; die Berichte beschreiben den Stand **vor** den hier genannten Korrekturen.

Prüfmittel: Theorie-Engine und Notationsprüfung, `tonal` als Orakel, eigene Tabellen/Bruchrechnung, Generatorläufe (mehrere tausend Seeds je Übungsform, Antwort aus den sichtbaren Noten neu berechnet), gerenderte Texte über die echte i18n-Instanz und Literatur über Websuche-Auszüge.

## Ergebnis nach Bereich

| Bereich | Fachliche Fehler | Sprach-/Codefehler | Zweifel |
| --- | --- | --- | --- |
| Notation (4 Einheiten) | 0 | 4 Gruppen (behoben; offen nur der kleingeschriebene Satzanfang im Screenreader-Text) | 8 |
| Rhythmus (3) | 1 (Achtelposition, behoben) | 2 Gruppen (behoben) | 7 |
| Intervalle (2) | 0 | 0 | 3 (2 behoben) |
| Gehörbildung (2) | 0 | 2 (Hinweis „NaN“ im Code, deutscher Dativ; beide behoben) | 7 |
| Geschichte (2) | 1 (Opern-Definition, behoben) | 0 | mehrere (2 behoben) |

Rechnerisch geprüfte Dauern, Taktfüllungen, Intervallnummern/-halbtöne, Notenbeispiele und Bildunterschriften zeigten keine Abweichung.

## Behobene Befunde

- **Code:** Hinweis 2 aller `LISTENING_CHOICE`-Fragen fiel in die Intervall-Rückfallregel und zeigte in allen Sprachen „NaN Halbtöne“. Eigener Zweig in `hintText` und Regressionstest für alle elf Hörformen und drei Sprachen (der Test schlägt ohne Korrektur fehl).
- **Deutsch:** Dativ „Halbtönen“/„Schlägen“ (Ganzton-Karte und -Definition, Intervallrückmeldung, Zählgruppen), „Tonnamen“ statt „Tonname“, Aufzählung in der Reihenfolge-Aufgabe.
- **UK:** „stave“ statt „staff“ in drei Texten; US: „half step“ aus dem Glossar, „removing“ statt „cancelling“, Satzanfang nicht mehr kleingeschrieben; EN „Both are thirds“.
- **Fachlich:** Terz-Karte nennt die Halbtonzahl nur für natürliche Töne; Tritonus-Karte vergleicht Halbtonabstand statt „klingt wie“; Taktlesen-Karte (zweites Achtel liegt zwischen den Schlägen); Opern-Definition mit „überwiegend gesungen“; „Vier Noten“ statt „Vier Töne“ (drei Tonhöhen).
- **Begriffe:** Glossar „Quellenangabe“ → „Herkunftsangabe“ (EN „source label“); Hörbeobachtung bezieht sich auf Einsätze („beginnen nacheinander/zugleich“), weil der Sampler Töne nachklingen lässt.

## Bewusst offen gelassene Zweifel

Didaktische oder terminologische Zweifel ohne Sachfehler stehen in den Rohberichten. Wichtigste: seltene Schreibweisen (E♯, F♭, His, Ces) bei `maxAccidentals: 1` in Fundament-Lektion 1 und Tasten-Lektion 3; „Vorzeichen“ statt „Versetzungszeichen“; Hinweise nennen noch nicht eingeführte Begriffe (Punktierung, 6/8); Betonung der Zählzeit 1 in 3/4; fehlende Ergänzung im Schlusstakt beim Auftakt; Satzzeichen bei Zählsilben; Doppelstrich/Schlussstrich; mehrere Geschichtsformulierungen (Aufnahme als Quelle, Ort/Zeit, Klavier-Modelle mit Sampler); Hörschwierigkeit kleiner Melodieunterschiede. Der Screenreader-Text „treble clef. Note 1 …“ beginnt klein.

## Warum nichts freigegeben wurde

1. **Literatur:** Der Cloud-Proxy sperrt die Literaturseiten, `WebFetch` scheitert bereits an der Namensauflösung. Es gibt nur Suchauszüge, keinen Abgleich mit Primärtexten. ADR 0005 verlangt den Abgleich mit Standardliteratur; das ist mit Auszügen nicht belegt.
2. **Geschlossene Kette:** Eine freigegebene Lektion setzt freigegebene Fähigkeiten, Einheiten, Stufen, Bereiche, Übungssätze, Karten und Texte voraus (`catalogue.ts`). Fähigkeiten, Graph und Einheitenstruktur wurden in diesem Durchgang nicht fachlich geprüft.
3. **Hörbarkeit/Klang** (z. B. Lücken bei Pausen, Wiederholungsklang, kleine Melodieunterschiede) und Geräteabnahme sind nicht belegt.

Freigabefähig nach Kartenstand (Prüferempfehlung, vorbehaltlich 1 und 2): die Mehrheit der Karten, Lektionen und Übungssätze aller fünf Bereiche; nicht freigeben bis zur Korrektur oder Entscheidung waren nur noch die oben als offen geführten Zweifel mit Gewicht (Geschichte: `card-hear`, `card-evidence` sind korrigiert, `card-recorded-source`, `card-place`, `card-forces`, Lektion `sources.sound` bleiben offen; Rhythmus: `card-three`, `card-pickup`, `card-barlines`, `values.notes/rests` mit Hinweisbegriffen).

## Nächste Schritte

- Fähigkeiten, Graph, Einheiten und Stufen von Stufe 1 fachlich prüfen (P2.05-Durchgang).
- Literaturzugang oder zugängliche Ausgaben beschaffen; danach Literaturabgleich der Kernaussagen.
- Verbleibende Zweifel entscheiden und einarbeiten; dann Status setzen, `pnpm content:publish` und alle Tests.
- Stufe 2 getrennt prüfen.

## Graphkorrekturen (20.10.2026, Katalogversion 17)

Berichte: [Stufe 1](../quality/fachpruefung-stufe-1/graph-stufe-1.md), [Stufe 2](../quality/fachpruefung-stufe-1/graph-stufe-2.md). Alle Inhalte bleiben `entwurf`; geändert wurden Titel, Voraussetzungen und Versionen (26 Fähigkeiten, Katalog und Plan Version 17), `published.json` und Planungsdiagramme sind neu erzeugt.

**Behoben (Fehler):**
- Stufe 1: Titel von `notation.treble-natural` (e¹–f² statt c¹–c²), `rhythm.note-values` und `rhythm.rests` (mit Sechzehnteln), `rhythm.barlines` (Taktstriche und Schlussstrich; Wiederholungszeichen sind nicht Inhalt).
- Stufe 2: Kanten `notation.bass-natural` (+ Hilfslinien, Oktavlage), `notation.grand-staff` (+ `pitch-match`), `interval.simple-qualities` (+ `thirds`, `perfect-fourth-fifth-octave`; statt `accidental-scope` nun `accidentals`), `chord.diatonic-triads` (+ `diminished-augmented`); Titel `notation.accidental-scope` (DE-Grammatik, Oktavlage), `scale.major-build` (DE), `rhythm.triplet` (US-Artikel), `chord.inversions` (nur „bestimmen“, da keine Umkehrungs-Bauaufgabe existiert); Kanten `notation.accidental-scope` (+ Oktavlage) und `rhythm.triplet` (+ `read-basic`).

**Behoben (Zweifel mit klarer Lösung):** Titel von `notation.staff`, `notation.treble-clef`, `rhythm.count-in` (US „pickup“), `interval.semitone-distance`, `aural.pulse`, `aural.rhythm-choice-basic`, `aural.pitch-direction`, `history.sound-source`, `history.source-types`, `history.genre-function`; Kanten `rhythm.measure-fill → meter-simple`, `rhythm.barlines → count-in`, `notation.treble-natural → semitone-distance`; Geschichte: `european-timeline` und `listening-observation` hängen an `history.context`.

**Bewusst nicht geändert (offen):**
- `aural.third-fourth-fifth` ← Intervallnummer/Halbtonabstand: Der Test `curriculum.test.ts` hält fest, dass elementare Gehörbildung ohne Notationsvoraussetzungen beginnt. Entscheidung offen: Kante ergänzen und Test anpassen oder Karte so umschreiben, dass sie Namen und Halbtonzahl selbst einführt.
- Fehlende Aufgaben: „Linie oder Zwischenraum“ (`notation.staff`), Abstand zweier Tasten (`notation.semitone`), Auflösungszeichen im Notenbild (`notation.accidentals`), Wiederholungszeichen als Inhalt (`rhythm.barlines`), `CHORD_BUILD` mit Umkehrungen (`chord.inversions`).
- `interval.identify.visual`/`interval.identify.aural` (Prototyp, Duplikat von `aural.third-fourth-fifth`), 18 Zweifel mit nur einem Mittel, Redundanzen (G6), zweites Mittel für 10 Fähigkeiten, Literaturabgleich mit Primärtexten.
