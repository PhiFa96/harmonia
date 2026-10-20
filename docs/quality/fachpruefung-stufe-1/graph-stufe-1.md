# Fachlicher Prüfdurchgang: Fähigkeitsgraph Stufe 1 (ADR 0005)

Stand: 19.10.2026. Prüfer: unabhängiger Durchgang (nur lesend am Repo). Prüfobjekt: 40 Fähigkeiten der Stufe 1 (`skills-stufe1.json`), Gesamtgraph mit 90 Fähigkeiten (`skills-dump.json`), Abgleich mit `catalogue.json` und `curriculum-plan.json`. Alle Skripte liegen unter `/tmp/claude-0/-home-user-harmonia/763a011a-e3ca-5aed-92b9-052bb92f7083/scratchpad/g1/` (nicht im Repo).

## 0. Ergebnis in Kürze

- 40 von 40 Fähigkeiten geprüft. **Fehler: 4** (`notation.treble-natural`, `rhythm.note-values`, `rhythm.rests`, `rhythm.barlines`). **Zweifel: 18**. **ok: 18** (8 mit mindestens zwei Mitteln belegt, 10 nur mit einem inhaltlichen Mittel). 4 + 18 + 18 = 40.
- Graph strukturell einwandfrei: azyklisch, 40 eindeutige IDs, 44 Kanten, größte Tiefe 6, sieben Wurzeln, **keine** Kante von Stufe 1 auf Stufe 2, Planreihenfolge topologisch ohne Verstoß, Dump = Katalog = Plan. Keine versteckten Zyklen.
- Die Fehler betreffen Titel gegen tatsächliche Lektionsinhalte (Tonumfang, Sechzehntel, Wiederholungszeichen). Die Voraussetzungen sind überwiegend tragfähig; drei fehlende Kanten sind auf Lektionsebene verdeckt (siehe G2), eine nicht (`aural.third-fourth-fifth`).
- Grenze: Primärliteratur blieb unzugänglich (WebFetch gesperrt). Der Literaturabgleich beruht ausschließlich auf Suchauszügen und zählt nur dort als Mittel, wo mehrere Auszüge übereinstimmen. Nichts davon ist ein Abgleich mit Originalseiten.

### Prüfmittel (Kürzel)

| Kürzel | Mittel | Datei/Quelle |
| --- | --- | --- |
| A | Graph-/Katalogskript: Zyklen, Vorfahren, Tiefe, Redundanz, Planreihenfolge, Lektions-Closure | `g1/topo.py`, `g1/order.py`, `g1/lessons.py` |
| B | Generator-/Aufgabenlauf mit echten Seeds und Auswertung der Aufgabenparameter | `g1/gen-values.mjs`, `g1/pitches.mjs`, Parameter aus `catalogue.json` |
| C | Gerenderte Titel und Kartentexte über die echte i18n-Instanz (DE/US/UK) | `g1/render.mjs`, `g1/cards.mjs` |
| D | Orakel/Rechnung: eigene Intervalltabelle gegen `tonal` (44 Natürlichton-Paare, 0 Abweichungen), Notenliniengeometrie | `g1/intervals.mjs` |
| E | Literatur-Auszüge per Websuche (nur Ergebnis, kein Wortlaut übernommen) | Quellen am Ende |

Ein Befund gilt als „≥ 2 Mittel“, wenn mindestens zwei inhaltlich verschiedene Mittel ihn stützen. A allein ist die strukturelle Grundprüfung für alle Fähigkeiten und zählt nur mit, wenn die Aussage selbst graphbezogen ist.

---

## 1. Befunde je Fähigkeit mit mindestens zwei Mitteln

| ID | Befund | Beleg (Mittel) | Korrekturvorschlag |
| --- | --- | --- | --- |
| `notation.note-name` | Zweifel | B: Fundament-Lektion zeigt C4 bis H4, also C4 mit Hilfslinie, vor der Fähigkeit Hilfslinien. D: C4 liegt zwei Schritte unter der untersten Linie, also eine Hilfslinie. Titel selbst korrekt. A: Prototyp hat keine Kante zu den feineren Fähigkeiten. | Als Prototyp kennzeichnen; Umfang im Planungstext nennen. Keine Titeländerung nötig. |
| `interval.identify.visual` | Zweifel | B: 433 von 600 Seeds zeigen ein ♯/♭ im Notenbild, obwohl die einzige Voraussetzung `notation.note-name` ist (nur Stammtöne). C: Karte erklärt Kreuz/b, Halbtonzählung und Intervallnamen selbst. Titel „Abstände lesen“ benennt die Aufgabe (m3, M3, P4, P5 bestimmen) nicht. | Kante nicht ergänzbar, weil Fundament in der Planreihenfolge zuerst steht. Stattdessen Titel schärfen („Terzen, Quarte und Quinte im Notenbild erkennen“; EN „Identify written thirds, fourths and fifths“) und den Prototyp als geschlossenes Kurz-Einführungspaket dokumentieren. |
| `interval.identify.aural` | Zweifel | B: Aufgabenparameter (m3, M3, P4, P5, melodisch aufwärts) decken sich mit `aural.third-fourth-fifth`, nur der Tonraum differiert (60–79 gegen 64–77). A: Sackgasse, in keiner Fähigkeit des Gesamtgraphen Voraussetzung. | Duplikat kennzeichnen; bei der geplanten Fortschrittszuordnung auf `aural.third-fourth-fifth` abbilden. |
| `notation.staff` | Zweifel | B: alle drei Lektionen verwenden ausschließlich NOTE_NAME; keine Aufgabe fragt „Linie oder Zwischenraum“. C: Karte erklärt fünf Linien/vier Zwischenräume. DE „zuordnen“ ohne Ziel mehrdeutig. | Titel: „Notenköpfe auf Linien und in Zwischenräumen lokalisieren“ (EN „Locate noteheads on lines and in spaces“). Abdeckung: Aufgabe „Linie oder Zwischenraum“ ergänzen oder als durch Notennamen mit abgedeckt dokumentieren. |
| `notation.treble-clef` | Zweifel (Terminologie) | C: Karte beschreibt g¹ auf der zweiten Linie als Orientierung; EN-Lektion nennt dieselbe Rolle „reference note“, der Titel „reference pitch“. E: „reference pitch“ bezeichnet üblich den Stimmton (A4 = 440 Hz). DE „Bezugston“ kollidiert mit dem Bezugston der Akkordhörfragen (gespielter Grundton). Sachlich richtig: g¹ auf der zweiten Linie, daher G-Schlüssel (C, E). | Titel DE: „Im Violinschlüssel g¹ auf der zweiten Linie als Orientierung nutzen“; EN: „Use G4 on the second line as the anchor note in the treble clef“. |
| `notation.treble-natural` | **Fehler** | B: Staff-Lektionen erzeugen nur F4–H4 beziehungsweise E4–F5; C4 und D4 erscheinen nie (600 Seeds je Parameter). D: C4 braucht eine Hilfslinie, die Fähigkeit dazu (`notation.ledger-lines`) folgt erst später. E: Mittleres C liegt auf einer Hilfslinie unter dem Violinsystem. Titel verspricht „c¹ bis c²“. | DE: „Stammtöne von e¹ bis f² im Violinschlüssel lesen“; EN: „Read natural notes from E4 to F5 in the treble clef“ (Planungsdiagramme neu erzeugen). |
| `notation.semitone` | Zweifel | B: Wissensthema `keyboard` hat nur vier Begriffe (Halbton, Ganzton, zwei und drei schwarze Tasten); die Lektion fragt sechs Begriffsfragen und vier Stammton-Tastenaufgaben, aber nie „E–F: Halb- oder Ganzton?“. C: Karte erklärt Zählen der Übergänge korrekt. Titel DE/US/UK korrekt (half step/semitone). | Aufgabentyp ergänzen, der den Abstand zweier markierter Tasten abfragt, oder in der Übergabe festhalten, dass die Prüfung bis `interval.semitone-distance` nur begrifflich ist. |
| `notation.accidentals` | Zweifel | B: NOTE_NAME erzeugt nur ♯/♭ oder Stammton; kein Notenbild zeigt ein Auflösungszeichen (Layout kann es, Generator setzt es nicht), nur Karte und Begriffsfrage. C: Karte zeigt G♯ gefolgt von G♮. E: Kreuz erhöht, b erniedrigt, Auflösungszeichen hebt auf; Begriffe stimmen. Voraussetzungen (`treble-natural`, `semitone`) richtig. | Aufgabe „Auflösungszeichen lesen“ ergänzen oder Titel auf „Einfaches Kreuz und b lesen; Auflösungszeichen kennenlernen“ begrenzen. |
| `notation.ledger-lines` | ok | D: A3 bis C6 braucht höchstens zwei Hilfslinien (gerechnet: A3 zwei, C6 zwei). E: B3 und A3 liegen unter dem System mit Hilfslinien. A: Kante `→ notation.staff` ist über `octave-register` impliziert (redundant, unschädlich). | Redundante Kante entscheiden (G6). |
| `rhythm.note-values` | **Fehler** | B: 400 Seeds mit `maxDots: 0` liefern Sechzehntelnoten in 313 Antwortlisten (alle fünf Formen). C: Karten und Taktlücken-Texte behandeln Sechzehntel ausdrücklich. E: Standard-Grundstufenlehrplan führt Semibreve bis Semiquaver. Titel nennt nur Ganze bis Achtel. Zusätzlich DE-Titel mit Kleinbuchstaben am Satzanfang und ohne Ziel von „zuordnen“. | DE: „Ganze, halbe, Viertel-, Achtel- und Sechzehntelnoten erkennen und nach Dauer ordnen“; EN: „Recognize and order whole, half, quarter, eighth and sixteenth notes by duration“ (UK: semibreve bis semiquaver). Alternativ Sechzehntel aus den Stufe-1-Generatoren entfernen und in Stufe 2 einführen. |
| `rhythm.rests` | **Fehler** | B: `rest:sixteenth` in 313 von 400 Seeds. C: Karte „Pausen“ behandelt die Sechzehntelpause. E: Pausen von Semibreve bis Semiquaver im Standardlehrplan. Titel: „Ganze bis Achtelpausen“. | DE „Ganze bis Sechzehntelpausen den Notenwerten zuordnen“; EN/UK analog; gleiche Entscheidung wie bei `rhythm.note-values`. |
| `rhythm.measure-fill` | ok | B: `measure-gap`, 4/4, ein fehlender Wert am Ende. C: Karte rechnet 2+1+1 = 4 korrekt und führt 4/4 selbst ein. A: Kante `note-values` redundant (über `rests` impliziert). | Redundanz entscheiden (G6). |
| `rhythm.barlines` | **Fehler** | B: Wissensthema `barlines` kennt nur `single` und `final`; die Lektion `values.fill` hat vier Fragen mit zwei Begriffen. C: Karte behandelt Taktstrich und Schlussstrich; im gesamten Inhaltskorpus findet die Suche in `authored-content.json` und den Messages kein Wiederholungszeichen. E: Wiederholungszeichen gehören zu den üblichen Grundsymbolen neben Taktstrich und Schlussstrich. Titel verspricht „Schluss und Wiederholung“. | Titel auf „Taktstriche und Schlussstrich lesen“ kürzen (EN „Read bar lines and the final bar line“) oder Wiederholungszeichen als dritten Begriff samt Karte/Aufgaben ergänzen. Zwei-Begriffe-Fragen haben 50 % Ratequote. |
| `rhythm.meter-simple` | Zweifel | A: Vorfahren sind nur `beat-group`, `note-values`, `pulse`; das Taktkonzept (`measure-fill`/`barlines`) fehlt als Kante. Auf Lektionsebene verdeckt, weil alle Lektionen von `note-values` (auch `values.fill`) mitzählen. C: Taktkarte setzt Taktbegriff und Viertel als Einheit voraus und erklärt sie in der Vor-Einheit. | Kante `rhythm.measure-fill → rhythm.meter-simple` ergänzen (Planreihenfolge erlaubt sie). |
| `rhythm.count-in` | Zweifel | A: Vorfahren ohne `barlines`/`measure-fill`; Lektionsebene verdeckt (siehe oben). C: Auftaktkarte arbeitet mit „vor dem ersten Taktstrich“ und Addition der Werte. Titel bündelt zwei Ziele (Einzählen und Auftakt). E: Auftakt als unvollständiger Anfangstakt bestätigt, aber nur eine Quelle; ob er zum Einsteigerumfang gehört, ist mit den Auszügen nicht belegt. US-Titel „upbeat“ ist doppeldeutig (auch schwache Zählzeit), die Lektion sagt „pickup“. | Kante `rhythm.barlines → rhythm.count-in` ergänzen; Titel US „pickup“; optional in zwei Fähigkeiten teilen. |
| `interval.generic-size` | ok | B: Fragetyp `number`, natürliche Töne E4–F5, P1 bis P8. D: eigene Tabelle und `tonal` stimmen in allen Natürlichton-Intervallen überein; Nummern 1 bis 8. E: Zählregel (Stammtöne, beide Enden) und deutsche Bezeichnung Intervallnummer bestätigt. Kante `treble-natural` richtig. | keine |
| `interval.steps-leaps` | Zweifel (Konvention) | B: Fragetyp `motion`; Prime = Wiederholung, Sekunde = Schritt, ab Terz Sprung (Projektkonvention). E: Auszüge zeigen zwei Konventionen; manche US-Texte nennen die Terz „skip“ und reservieren „leap“ für größere Sprünge. | Konvention in Karte und Titel ausdrücklich nennen („Sprung = Terz oder größer“); EN-US-Hinweis auf die „skip/leap“-Variante. Kein Sachfehler. |
| `interval.semitone-distance` | Zweifel | A: Vorfahren nur `notation.semitone`, `keyboard-layout`; die Aufgaben sind Notenbild-Aufgaben (Violinschlüssel, E4–F5), `treble-natural` fehlt. Lektionsebene deckt es verdeckt (die Lektionen von `semitone` ziehen `accidentals` und damit Notenlesen nach). B: Parameter bestätigen das Notenbild. EN „sounding distances“ unklar. | Kante `notation.treble-natural → interval.semitone-distance`; EN „Count the half steps between two written notes“, UK „semitones“. |
| `interval.thirds` | ok | D: Alle natürlichen Terzen sind m3 (3 Halbtöne) oder M3 (4); eigene Tabelle und `tonal` identisch. B: Fragetypen `semitones` und `quality` mit m3/M3. Voraussetzungen richtig (Nummer und Halbtonabstand). | keine |
| `interval.perfect-fourth-fifth-octave` | ok | D: natürliche Quarten sind P4 (5) oder A4 (6), Quinten P5 (7) oder d5 (6), Oktave 12; beide Mittel identisch. B: Aufgaben enthalten A4/d5 als Gegenprobe, Frage `perfect` verlangt Nummer und Halbtöne zusammen. Hinweis: in keiner Stufe-2-Fähigkeit Voraussetzung (G5). | keine für Stufe 1; Stufe 2: Kante zu `interval.simple-qualities` (G5). |
| `aural.pulse` | Zweifel | B: Aufgabe `pulse` fragt die Gruppengröße 2/3/4, nicht den Puls. C: Karten sprechen von Gruppenanfängen und Zählen bis 2/3/4; Lektionstitel „Pulsgruppen“. Inhalt überschneidet `rhythm.beat-group` (hören statt tippen). | Titel: „Gruppen aus zwei, drei oder vier Schlägen im Hörbeispiel erkennen“ (EN „Identify groups of two, three or four beats by ear“). Voraussetzung `rhythm.beat-group` erwägen; als unabhängige Startfähigkeit ist die jetzige Lösung vertretbar. |
| `aural.same-different-rhythm` | ok | B: `rhythm-compare`, gleiche Tonhöhe, Rhythmen mit Achtelpaaren und Pausen, Trennpause. C: Karten erklären Gleichheit über Einsätze, Dauern und Pausen. A: Kante `aural.pulse` plausibel. | keine |
| `aural.rhythm-choice-basic` | Zweifel (gering) | B: `LISTENING_RHYTHMS` enthalten Viertel- und Achtelpausen (`r/4`, `r/8`). C: Karte „Stille im passenden Bild“. Titel nennt keine Pausen. Kanten (`same-different-rhythm`, `rhythm.read-basic`) richtig. | DE „Gehörten Rhythmus aus Vierteln, Achteln und Pausen einem Notenbild zuordnen“. |
| `aural.third-fourth-fifth` | Zweifel | A: einzige Voraussetzung `aural.pitch-direction`; die Lektions-Closure (`lessons.py`) enthält weder `intervals.l1.size.numbers` noch `keyboard.steps` noch `first-qualities.thirds`. B: Antwortoptionen sind benannte Intervalle (m3, M3, P4, P5). C: Karte nennt Terz und Halbtonzahlen (3/4/5/7) als bekannt. E: Auszüge ordnen Größen vor Qualitäten und Terzen vor reinen Intervallen; das passt zur Reihenfolge, belegt aber keine Einzelkante. Vergleich: `aural.rhythm-choice-basic` hat die analoge Kante zu `rhythm.read-basic`. | Kanten `interval.generic-size` und `interval.semitone-distance` ergänzen (Planreihenfolge erlaubt das, die Einheit steht nach den Intervall-Einheiten). Alternativ Karte so umschreiben, dass Namen und Halbtonzahl ohne Vorwissen eingeführt werden. |
| `history.sound-source` | Zweifel (Terminologie) | C: Karte „Aufnahme ist ein Wiedergabemedium“ trennt Erzeugung und Wiedergabe, der Titel nennt die Aufnahme dagegen Klangquelle. E: in deutschen Hochschulfolien bezeichnet „Schallquellen“ gerade Aufnahmen als Primärquellenart; der Begriff kollidiert mit „Quelle“ in `history.source-types`. B: Wissensthema hat vier Begriffe (auch elektronisch), der Titel nennt drei. | DE: „Klangerzeuger (Stimme, Instrument, Elektronik) von der Aufnahme als Wiedergabemedium unterscheiden“; EN: „Tell sound producers (voice, instruments, electronics) from recordings as a playback medium“. Abhängigkeit zu `source-types` danach als Reihenfolge, nicht als Wissensvoraussetzung beschreiben. |
| `history.source-types` | Zweifel (gering) | B: vier Begriffe (Notentext, Aufnahme, Bericht, Programmzettel); Titel nennt drei. E: Primärquellen (Schall-, Text-, Bild-, Notenquellen) in Fachfolien bestätigen die Aufteilung als Auswahl. Kante `sound-source` fachlich schwach (siehe dort). | Titel um Programmzettel ergänzen („Notentext, Aufnahme, Bericht und Programmzettel“). |
| `history.context` | ok | C: Karten trennen Ort, Zeit, Anlass, Urheberschaft sauber (Komposition, Aufführung und Aufnahme datieren). B: vier Begriffe passen zum Titel (Urheberschaft fehlt im Titel, geringfügig). Kante `source-types` plausibel. | Optional Urheberschaft im Titel ergänzen. |
| `history.european-timeline` | ok | C: Karte nennt sechs Epochen mit 500–1400, 1400–1600, 1600–1750, 1750–1820 und „seit 1900“. E: Standardperiodisierung übereinstimmend (Grenzen schwanken je Quelle, die Karte benennt das). B: ORDER-Fakten haben genau diese sechs. Kante `source-types` fachlich nicht nötig (G4). | Voraussetzung auf `history.context` ändern oder entfernen. |
| `history.genre-function` | Zweifel (gering) | B: Fakten Gattung, Besetzung, Anlass, Funktion; „Anlass“ steht auch in `history.context`. C: Karte trennt Anlass (Ereignis) und Funktion (Zweck). Titel nennt die Funktion nicht. | Titel: „Gattung, Besetzung und Funktion der Musik unterscheiden“ (Anlass bleibt in `context`). |
| `history.listening-observation` | Zweifel (gering) | C: Karten stützen die Unterscheidung auf Ort, Zeit, Urheberschaft (also `context`), nicht auf Gattung oder Besetzung. A: Kante `source-types` redundant (über `genre-function` impliziert); Kante `genre-function` fachlich schwach. | Voraussetzungen auf `history.context` und `history.source-types` setzen; Tiefe sinkt von 5 auf 3. |

## 2. Befunde je Fähigkeit mit nur einem inhaltlichen Mittel

Hier prüfte ich Graphstruktur (A) und Aufgabenparameter/Generator (B), las aber keine Karten und fand keinen Literatur- oder Orakelbeleg. Ein ok gilt deshalb nur vorläufig.

| ID | Befund | Beleg (Mittel) | Korrekturvorschlag |
| --- | --- | --- | --- |
| `notation.keyboard-layout` | ok | B: KEY_FIND, C4–H4, nur Stammtöne. A: Wurzel, plausibel. | Zweites Mittel (Kartentexte) nachholen. |
| `notation.octave-register` | ok | B: NOTE_NAME mit Oktavangabe, E4–F5; Kante `treble-natural` plausibel. | Zweites Mittel nachholen (Literatur zur Oktavnamengebung). |
| `notation.pitch-match` | ok | B: KEY_FIND `score`, A3–C6; A: Kante `octave-register` redundant (über `ledger-lines` impliziert). | Zweites Mittel nachholen; Redundanz entscheiden (G6). |
| `rhythm.pulse` | ok | B: RHYTHM_TAP Stufe `pulse`, 3/4 und 4/4, Tempo 72. | Zweites Mittel nachholen. |
| `rhythm.tempo` | ok | B: Tempi 60/90/120, Lektion enthält zusätzlich BPM-Begriffe. A: Sackgasse (nirgends Voraussetzung), unschädlich. | Zweites Mittel nachholen. |
| `rhythm.beat-group` | ok | B: Begriffe erste Zählzeit, Zweier-, Dreier-, Vierergruppe; Tippen in 2/4 bis 4/4. Betonung von Zählzeit 3 in 4/4 wurde nicht geprüft. | Zweites Mittel (Betonungsliteratur) nachholen. |
| `rhythm.read-basic` | ok | B: RHYTHM_TAP `basic` mit Pausen, 2/4 bis 4/4, ohne Punktierung. A: Kanten `meter-simple`, `rests` plausibel. | Zweites Mittel nachholen. |
| `interval.direction` | ok | B: Fragetyp `direction`, beide Richtungen, gleiche Tonhöhe als Sonderfall. A: Kette `generic-size → direction`. | Zweites Mittel nachholen. |
| `aural.pitch-direction` | ok | B: `pitch-direction` mit halben Noten E4–D5; Wurzel ohne Notenkenntnis. DE-Titel „gleicher Ton“ grammatisch holprig. | DE „Höher, tiefer oder gleich: Tonrichtung nach Gehör unterscheiden“. Zweites Mittel nachholen. |
| `aural.same-different-melody` | ok | B: vier Viertelnoten E4–C5, höchstens eine Änderung. | Zweites Mittel nachholen; Hörschwierigkeit kleiner Änderungen ist offen (die Vorprüfung nennt sie bereits). |

---

## 3. Graphweite Befunde

**G1 Struktur (A).** Azyklisch (DFS über alle 90), 44 Kanten in Stufe 1, größte Tiefe 6 (`notation.pitch-match`, `interval.steps-leaps`), sieben Wurzeln (`notation.note-name`, `notation.staff`, `notation.keyboard-layout`, `rhythm.pulse`, `aural.pulse`, `aural.pitch-direction`, `history.sound-source`). Alle Vorfahren aller Stufe-1-Fähigkeiten liegen in Stufe 1. Sieben Stufe-1-Fähigkeiten sind im Gesamtgraphen nirgends Voraussetzung (`rhythm.tempo`, `rhythm.count-in`, `interval.perfect-fourth-fifth-octave`, `interval.identify.aural`, `notation.pitch-match`, `history.listening-observation`, `interval.steps-leaps`).

**G2 Lektionsebene maskiert drei Graphlücken (A).** Die Freischaltung nimmt für Fremdvoraussetzungen alle Lektionen, die die Voraussetzungsfähigkeit nennen. Da `values.fill` auch `rhythm.note-values` nennt, hängen `meter-simple` und `count-in` faktisch an der Taktfüll-Lektion; die Notenlese-Voraussetzung für `semitone-distance` kommt über die Lektion `keyboard.accidentals`. Im Lernpfad entsteht deshalb kein Fehlverhalten, aber der Graph allein (Einstufung nach Fähigkeiten, Anzeige „Voraussetzungen“) bleibt unvollständig. Anders bei `aural.third-fourth-fifth`: Dort fehlt die Kante auch auf Lektionsebene.

**G3 Gleiche Lektionsmengen (A).** Diese Fähigkeiten tragen exakt dieselben Lektionen: (`notation.note-name`, `interval.identify.visual`, `interval.identify.aural`), (`notation.staff`, `notation.treble-clef`, `notation.treble-natural`) und (`rhythm.measure-fill`, `rhythm.barlines`). Der Fähigkeitsstand lässt sich dort nicht trennen.

**G4 Schwache Kante Geschichte (A, C).** `history.european-timeline ← source-types` ist fachlich nicht nötig; `listening-observation` hängt über `genre-function` an Gattungswissen, das es nicht braucht.

**G5 Stufe-2-Beifang (nicht Prüfgegenstand).** `interval.simple-qualities` (Stufe 2) hat weder `interval.thirds` noch `interval.perfect-fourth-fifth-octave` als Voraussetzung, obwohl es beide verallgemeinert. Der DE-Titel von `notation.accidental-scope` enthält „innerhalb des Takt“ (Fall). Beides beim Stufe-2-Durchgang prüfen.

**G6 Redundante Kanten (A).** Vier in Stufe 1: `ledger-lines → staff`, `pitch-match → octave-register`, `measure-fill → note-values`, `listening-observation → source-types` (je über einen anderen Pfad impliziert). Unschädlich; entweder mit Absicht dokumentieren (sichtbare direkte Voraussetzung) oder entfernen.

**G7 Fundament-Prototyp (A, B).** Drei Prototypfähigkeiten sind nicht mit den 37 feineren verbunden, in Teilen Duplikate (G3) und setzen intern mehr voraus, als ihre Kanten sagen (Kreuz/b, Halbtonzählen). Laut Plan erwartbar („getrennte Prototyp-IDs“); nur dokumentieren.

**G8 Sprachfehler Einheitentitel (C).** `notation.l1.register` hat in US und UK den Titel „octaves and ledger lines“ mit kleinem Anfangsbuchstaben. Auch der DE-Titel von `rhythm.note-values` beginnt klein (siehe Tabelle).

## 4. Zuordnung Fähigkeit → Einheit → Lektion → Stufe (Prüfpunkt 3)

- 40 von 40 Fähigkeiten haben genau eine Einheit; alle 13 Stufe-1-Einheiten sind belegt, keine Einheit nennt fremde Fähigkeiten oder lässt eigene aus (`order.py`).
- Stufe: alle Einheiten gehören zu Ebenen mit `number: 1`; keine Stufe-1-Fähigkeit hängt an Stufe 2 (A).
- Einheitenreihenfolge (Fundament, Notation ×3, Rhythmus ×3, Intervalle ×2, Gehörbildung ×2, Geschichte ×2) ist topologisch zulässig. Einheitenkanten: `simple-meter ← values, pulse`; `first-qualities ← size, keyboard`; `aural.pulse-rhythm ← simple-meter`; `aural.pitch-intervals` ohne Kante (siehe `aural.third-fourth-fifth`).
- Bereichsstufe: Intervalle mit Qualitäten (Terzen, reine Intervalle) in Stufe 1 ist laut `curriculum.md` („Intervalle ab Stufe 1“) gedeckt. Der Standard-Grundstufenlehrplan zählt zunächst nur Nummern (E, nur Auszüge); die Qualitäten sind hier ein bewusstes Vorziehen und kein Fehler.
- Keine Stufe-2-Vorgriffe auf Graphebene. Auf Inhaltsebene ist die Sechzehntelnote der einzige gefundene Überhang (und zugleich Voraussetzung für Stufe 2: eine punktierte Achtel besteht aus Achtel plus Sechzehntel). Hinweistexte mit Punktierung oder 6/8, die die Vorprüfung nennt, habe ich nicht erneut geprüft.

## 5. Abdeckung durch Lektionen (Prüfpunkt 4)

Stichprobe über alle 37 Lektionstitel und Aufgabenparameter (B, C): jede der 40 Fähigkeiten kommt in mindestens einer Lektion vor. Tatsächlich durch eigene Aufgaben getestet sind:

- passend: `keyboard-layout`, `octave-register`, `ledger-lines`, `pitch-match`, `pulse`, `tempo`, `beat-group`, `note-values`, `rests`, `measure-fill`, `meter-simple`, `read-basic`, alle Intervall- und Hörfähigkeiten sowie die Geschichtsfähigkeiten (dort nur Begriffsaufgaben).
- nur indirekt: `notation.staff`, `notation.treble-clef` (über NOTE_NAME), `notation.semitone` (nur Begriffsfragen), `notation.accidentals` (Auflösungszeichen nur als Begriff).
- laut Titel nicht abgedeckt: `rhythm.barlines` (Wiederholung), `notation.treble-natural` (c¹ und d¹).
- über den Titel hinaus abgedeckt: Sechzehntel (zwei Fähigkeiten), Programmzettel, elektronische Klangquelle, Urheberschaft.

## 6. Kompakte Liste

Fehler (4): `notation.treble-natural`, `rhythm.note-values`, `rhythm.rests`, `rhythm.barlines`.

Zweifel (18): `notation.note-name`, `interval.identify.visual`, `interval.identify.aural`, `notation.staff`, `notation.treble-clef`, `notation.semitone`, `notation.accidentals`, `rhythm.meter-simple`, `rhythm.count-in`, `interval.steps-leaps`, `interval.semitone-distance`, `aural.pulse`, `aural.rhythm-choice-basic`, `aural.third-fourth-fifth`, `history.sound-source`, `history.source-types`, `history.genre-function`, `history.listening-observation`.

ok mit mindestens zwei Mitteln (8): `notation.ledger-lines`, `rhythm.measure-fill`, `interval.generic-size`, `interval.thirds`, `interval.perfect-fourth-fifth-octave`, `aural.same-different-rhythm`, `history.context`, `history.european-timeline`.

ok mit nur einem inhaltlichen Mittel (10): `notation.keyboard-layout`, `notation.octave-register`, `notation.pitch-match`, `rhythm.pulse`, `rhythm.tempo`, `rhythm.beat-group`, `rhythm.read-basic`, `interval.direction`, `aural.pitch-direction`, `aural.same-different-melody`.

## 7. Freigabefähigkeit (Graph und Titel, nicht Lektionsfreigabe)

Freigabefähig, mit zwei Mitteln belegt und vorbehaltlich der Literaturgrenze: die 8 ok-Fähigkeiten aus Abschnitt 6.

Vorläufig freigabefähig, aber nur mit einem inhaltlichen Mittel: die 10 Fähigkeiten aus Abschnitt 2; vor der Freigabe ein zweites Mittel nachholen.

Nicht freigabefähig vor Korrektur: die 4 Fehler. Für die 18 Zweifel genügt meist eine Titel- oder Kantenänderung; danach neu bewerten. Die Kette Fähigkeit → Einheit → Lektion → Stufe → Bereich bleibt geschlossen, solange eine Fähigkeit nicht freigegeben ist.

## 8. Quellen (Suchauszüge, kein Wortlaut übernommen)

- Notensystem, G-Schlüssel, mittleres C und Hilfslinien: musictheory.net „The Staff, Clefs, and Ledger Lines“ sowie weitere Suchergebnisse (mehrere Treffer teils von geringer Qualität; nur übereinstimmende Aussagen verwendet).
- Schritt/Sprung-Konventionen: Wikipedia „Steps and skips“ und Lehrseiten; zwei Konventionen laut Auszug.
- Grundstufen-Lehrplan (Notenwerte bis Semiquaver, 2/4 3/4 4/4, Zählen von Intervallen): Kursseiten zu ABRSM Grade 1 (Drittzusammenfassungen, nicht das offizielle Dokument).
- Wiederholungszeichen und Schlussstrich: deutschsprachige Notationsübersichten (LANDR-Glossar, Notationsblätter).
- Versetzungszeichen und Vorzeichen: deutschsprachige Lehrseiten (bonedo, MuseScore-Handbuch, lernhelfer).
- „reference pitch“ = Stimmton: Wikipedia „A440 (pitch standard)“.
- Quellenarten: Folien der HfM Nürnberg (Primärquellen), USC-Leitfaden zu musikbezogenen Primärquellen.
- Auftakt: Songtive-Glossar (eine Quelle, nicht unabhängig bestätigt).
- Epochen: Wikipedia „Dates of classical music eras“ und Lehrseiten.
- Hörintervalle: Musical-U-Seiten (nur Didaktikhinweis, kein Beleg für Einzelkanten).
- Intervallnummer und Zählregel: bonedo, schule-bw.de. Ein Auszug nannte die Oktave als 11 Halbtöne; als Fehler der Quelle verworfen (eigene Tabelle und `tonal`: 12).

## 9. Nicht geprüft

Hörbarkeit und Klang der Beispiele, Geräteabnahme, Kartentexte außerhalb der gelesenen, Stufe-2-Fähigkeiten (nur Beifang G5), Hinweis- und Rückmeldetexte, Übersetzungsqualität über Titel hinaus, Primärliteratur.
