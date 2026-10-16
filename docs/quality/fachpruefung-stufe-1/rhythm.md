# Fachlicher Prüfdurchgang Stufe 1 – Bereich Rhythmus (ADR 0005)

Datum: 2026-10-16. Prüfer: unabhängiger Durchgang (nur lesend, keine Repo-Dateien geändert).
Prüfobjekt: `scratchpad/dump-rhythm.txt` (Einheiten `rhythm.l1.pulse`, `rhythm.l1.values`, `rhythm.l1.simple-meter`).
Umfang: 3 Einheiten, 9 Lektionen, 26 Karten, 3 Artikel, 43 Beispiel-Scores (47 Takte), 22 Aufgaben-Spezifikationen (9 Übungssätze).
Hinweis: Der Dump enthält die Glossarverweise `$t(glossary:…)` unaufgelöst. Ich habe sie mit dem echten Glossar (`packages/i18n/src/glossary.ts`) für DE/US/UK aufgelöst und zusätzlich die tatsächlich erzeugten Aufgabentexte (Frage, Rückmeldung, Hinweise) aller Spezifikationen gerendert.

## Prüfmittel (Kürzel)

| Kürzel | Mittel | Unabhängig von |
|---|---|---|
| M1 | Repo-Engine: `parseScore`, `totalDuration`, `checkMeasure`, `measureLength`, `rhythmOnsets` (packages/notation, packages/theory) | M2–M4 |
| M2 | `tonal` (`DurationValue`: Brüche und US/UK-Namen) als Orakel | M1, M3 |
| M3 | Eigene Bruchrechnung (Python `fractions`, eigener Score-Parser, Onset-Positionen) im Scratchpad | M1, M2 |
| M4 | Standardliteratur/Lehrmaterial per WebSearch (nur Suchauszüge, kein Wortlaut übernommen) | M1–M3 |
| M5 | Generator-Stichprobe: 22 Spezifikationen × 400 Seeds = 8800 Aufgaben, Invarianten mit eigener Bruchrechnung nachgerechnet | M1 (Generatoren) |
| M6 | Gerenderte Texte (DE/US/UK) über `exercisePrompt/Feedback/Hints` | – |
| M7 | Layout-Elemente der Notation (`layoutScore`: Pausenhöhe, Balken/Fähnchen, Taktstriche) | M1–M3 |
| M8 | Code-/Textlesung (Audio-Wiedergabe, Hinweisschlüssel) | – |

Zusätzlich liefen die vorhandenen Repo-Tests grün (theory rhythm/rhythm-naming/rhythm.tonal: 96 Tests; exercises rhythm/duration-questions/pulse: 38 Tests). Das ersetzt keine eigene Prüfung.

Empirische Kernergebnisse:
- **Taktfüllung und Dauern:** 43 Beispiel-Scores / 47 Takte: M1, M2 und M3 stimmen in Summe und Status (complete/incomplete) überein, 0 Abweichungen. 45 Takte sind exakt voll; die beiden Auftakte (3/4: 1/4; 4/4: 2×1/8 = 1/4) sind korrekt unvollständig.
- **Namen US/UK:** whole/semibreve, half/minim, quarter/crotchet, eighth/quaver, sixteenth/semiquaver (M2 + Glossar + Rendering); `measure` (US) / `bar` (UK) korrekt aufgelöst; alle literal geschriebenen en-GB-Wörter sind britisch (crotchet, quaver, upbeat, metre, practise, cancelling).
- **Generatoren (M5):** 0 Verletzungen in 8800 Aufgaben: Taktfüllung (Tippaufgaben, Taktlücken, Auftaktfragen), Onset-Zeiten gegen eigene Rechnung, Auftakt-Antwort, Ordnung nach Dauer, keine Punktierung bei `maxDots: 0`, Antwort immer unter den Optionen, keine doppelten Optionen.
- Zeit: 60/BPM-Werte (60→1 s, 90→2/3 s, 120→0,5 s, 72→833 ms) mit M1 (rhythmOnsets), M3 und M4 (Formel) bestätigt.

## Befunde

Legende Befund: ok / Fehler / Zweifel. Beleg: „≥2“ = mindestens zwei unabhängige Mittel; „1“ = nur ein Mittel.

### Einheit rhythm.l1.pulse (Puls, Tempo, Zählgruppen)

| ID | Befund | Beleg | Korrekturvorschlag |
|---|---|---|---|
| card-pulse | ok | ≥2: M1+M3 (Beispiel 4/4, vier Viertel, Zahlen-Darstellung), M4 (Puls = gleichmäßiger Grundschlag, Tempo = Geschwindigkeit). Betonte 1 und Klick-Abstand: M8 (`playRhythm`: erste Position höherer Ton, lauter, gleiche Dauer) | – |
| card-rhythm | ok | ≥2: M4 (Rhythmus = Folge von Klängen und Pausen), M1+M3 (Score = vier Viertel auf den Klicks) | – |
| card-count-in | ok | ≥2: M1+M3 (3/4, drei Viertel = „Dreiergruppe“); „spielt zwei Gruppen“: nur M8 (`count*2` Klicks) | Zähler-Aussage „zwei Gruppen“ nur über Code belegt (1 Mittel) |
| card-tempo | ok | ≥2: M3 (60/60 = 1 s, 60/120 = 0,5 s) + M1 (rhythmOnsets) + M4 | – |
| card-bpm | ok | ≥2: M3 (60/90 = 2/3 s) + M1/M5 + M4 (BPM = Schläge pro Minute) | – |
| card-compare | ok | ≥2: M1+M3 (3/4-Gruppe, gleiches Muster bei 72/108) | – |
| card-groups | ok (Sprache siehe F1) | ≥2: M1+M3 (2/4, 3/4, 4/4 mit 2/3/4 Vierteln); „Taktangaben später“ stimmt mit Einheitenfolge | – |
| card-strategy | ok | ≥2: M1+M3 (Vierergruppe); Aussagen zur Wertung (fehlende/zusätzliche Schläge, Gedrückthalten) nur M8/M6 | – |
| Lektion pulse.steady/tempo/groups (Übungssätze) | ok, aber F1 | M5: 400×6 Seeds ohne Verstoß; Anzahl 4+4 / 4+6 / 4+8 passt zum Artikeltext „vier, sechs oder acht“ (M6) | F1 beheben |
| Artikel rhythm.l1.pulse.article | ok | ≥2: M3 (60/BPM s), M4; Gruppentexte wie Karten | – |

### Einheit rhythm.l1.values (Notenwerte, Pausen, Takte)

| ID | Befund | Beleg | Korrekturvorschlag |
|---|---|---|---|
| card-long | ok | ≥2: M1+M2+M3 (1 = 2×1/2 = 4×1/4; alle drei Takte voll; Onsets 1 / 1,3 / 1–4), M4 | – |
| card-shapes | ok (Hinweis) | ≥2: M1+M2+M3 (1/2+1/4+1/8+1/16+1/16 = 1), M4 (Balkenzahl = Fähnchenzahl), M7 (im Beispiel Achtel+2 Sechzehntel als Balkengruppe, 0 Fähnchen, 2 Balken) | Im Beispiel sind keine Fähnchen sichtbar; Text sagt ausdrücklich „Erkennungsaufgaben zeigen Zeichen einzeln“. Kein Fehler. |
| card-short | ok (Hinweis Z7) | ≥2: M1+M2+M3 (8×1/8 = 16×1/16 = 1; Onsets 1-und…), M4 | „Viertel-Viertel“ siehe Z7 |
| card-long-rests | ok | ≥2: M1+M3 (r/1 = 1; r/2+G/2 = 1), M7 (Layout: Ganze Pause y=1 = 4. Linie von unten hängend, Halbe y=2 = 3. Linie sitzend, ganze Pause im Takt zentriert) + M4 (Lage der Pausen; Ganzpause = ganzer Takt Stille in jeder Taktart) | – |
| card-short-rests | ok | ≥2: M1+M2+M3 (Summe 1; jede Pause gefolgt von gleich langem Ton), M4 (Pausen selbst tragen keine Balken, Balken über Pausen sind in moderner Praxis möglich), M7 (Pausen ohne Balken, Beispiel nutzt keine Balken über Pausen) | Satz „Pausen werden nicht durch Balken verbunden“ besser „Pausenzeichen tragen selbst keine Balken“ (Z7) |
| card-silence | ok | ≥2: M1+M3 (G r G r = 1; G/2 r/2 = 1), M6 (Zuordnung als Bruch einer ganzen Note) | Karte nennt 1/2…1/16, die MATCH-Aufgabe kann auch „1/1“ (ganze Pause) enthalten (Z7) |
| card-capacity | ok | ≥2: M1+M3 (2+1+1 = 4) | – |
| card-barlines | ok (Z6) | ≥2: M1+M3 (zwei volle Takte), M7 (2 Taktstriche + Schlussstrich), M4 (Schlussstrich dünn+dick) | Z6: „oder abgeschlossenen Abschnitts“ präzisieren |
| card-complete | ok | ≥2: M1+M3 (2+1+1/2 = 3 1/2; +1/2 = 4; zweites Beispiel 2+1+1/2+1/4 = 3 3/4, Rest 1/4 = Sechzehntel), M5 (Lückenaufgaben 800 Stück ohne Fehler) | – |
| Lektion values.notes (Übungssatz) | ok, F3/Z1 | M5 + M6 (Reihenfolge und Symbolfragen korrekt) | F3, Z1 |
| Lektion values.rests (Übungssatz) | ok, Z7 | M5 + M6 | „1/1 ×“ glätten |
| Lektion values.fill (Übungssatz) | ok, Z5 | M5: 800 Lückenaufgaben, Summe + Antwort = 1, Antwort eindeutig; 4 Barlines-Fragen korrekt | Z5 |
| Artikel rhythm.l1.values.article | ok mit Auflage Z6 | wie Karten | Z6 |

### Einheit rhythm.l1.simple-meter (einfache Taktarten, Einzählen, Auftakt)

| ID | Befund | Beleg | Korrekturvorschlag |
|---|---|---|---|
| card-two | ok (Z4) | ≥2: M1+M3 (2/4 = 1/2; G/8 G/8 G/4 = 1/2; zwei Notenanfänge im 1. Schlag), M4 | Z4 (Beschriftung „auf 1 und,“) |
| card-three | Zweifel (Z2) | M4 (Zählzeit 1 ist metrisch am stärksten, 3/4 stark–schwach–schwach) vs. Text „schreibt keine zusätzliche Betonung vor“; Arithmetik ≥2: M1+M3 | Z2 |
| card-four | ok | ≥2: M1+M3 (vier Viertel = 1); „untere 4 = Viertelwert, nicht Tempo“ korrekt (M4) | – |
| card-count | ok | ≥2: M1+M3 (3/4 und 2/4 mit 3 bzw. 2 Vierteln); „Einzähltakt ertönt erst in der Aufgabe, Beispiel spielt den notierten Takt“ nur M8 (`playExample` bei 90, `playRhythm`) | – |
| card-pickup | ok mit Zweifel Z3 | ≥2: M1+M2+M3 (3/4: 1/4 vor erstem Strich, danach 3/4 voll; 4/4: 2×1/8 = 1/4, danach 1 voll), M4 (Auftakt = unvollständiger erster Takt; US pickup / UK upbeat / anacrusis) | Z3: Schlusstakt-Ergänzung fehlt |
| card-complete (Auftakt) | ok | ≥2: M1+M3 (3 Viertel = 3/4 voll, Folgetakt voll), M5 (Auftaktfragen 800 Stück, Antwort = Dauer < Taktlänge) | – |
| card-eighth | ok | ≥2: M1+M3 (2/4: 1/8+1/8+1/4 = 1/2; 4/4: 1/4, 1/8+1/8 auf Schlag 2, 1/4, 1/4 = 1) | – |
| card-rests | ok | ≥2: M1+M3 (3/4: G r G; 2/4: r/8 G/8 G/4 = 1/2; Onsets 2/4: bei 1/2 und 1), M5 (Tippen nur auf Noten) | – |
| card-read | **Fehler (F2)** | ≥2: M1+M3 (erstes Achtel liegt auf dem Schlag, Position 0) widerspricht „die Achtel liegen genau dazwischen“ | F2 |
| Lektion meter / count-in / read (Übungssätze) | ok, Z1, Z4 | M5: 400×7 Seeds ohne Verstoß; Antwort in Optionen; Tippen-Onsets gegen eigene Rechnung; Auftakt-Antwort korrekt | Z1 |
| Artikel rhythm.l1.simple-meter.article | ok mit Auflage F2/Z2/Z3/Z4 | enthält dieselben Texte wie die Karten | siehe dort |

## Einzelbefunde

**F1 – Fehler (Sprache): „Zählgruppe aus zwei Schläge“.** Betrifft `knowledge_beatGroup_duple/triple/quadruple` (DE) und damit Antwortoptionen, Rückmeldung und Hinweis 2 der Lektion `rhythm.l1.pulse.groups`. „aus“ verlangt den Dativ: richtig „Zählgruppe aus zwei Schlägen“. Ursache: `$t(glossary:beat_other)` liefert den Nominativ Plural. Beleg: M6 (gerenderte Texte DE: „Zählgruppe aus zwei Schläge / drei Schläge / vier Schläge“). Vorschlag: „Schlägen“ in den drei DE-Schlüsseln (de.ts) ausschreiben (kein Dativ im Glossar). Fachlich ist die Aussage richtig.

**F2 – Fehler (sachlich, gering): `simpleMeterStart.readBody` (DE/US/UK).** „…die Achtel liegen genau dazwischen“ / „eighths fall halfway between beats“. Nur das zweite Achtel eines Paares liegt zwischen zwei Schlägen; das erste Achtel fällt auf den Schlag (eigene Beschriftung: „Achtelanfänge auf 1 und“; card-eighth: „1 und“). Beleg ≥2: M1 und M3 (Onset-Positionen 0 und 1/2 Schlag). Vorschlag: „das zweite Achtel jedes Paares liegt genau zwischen zwei Schlägen“.

**F3 – Fehler (Sprache, gering): fehlender Artikel in Hinweis 2 der ORDER-Aufgabe.** DE „An erster Stelle steht Achtelnote.“, EN „The first item is eighth note.“ / UK „The first item is quaver.“ Richtig etwa „…steht die Achtelnote“ / „The first item is the eighth note / the quaver“. Gleiches Muster bei `knowledgeHint2_MATCH` („Begin with this pair: half rest – Silence …“, Großbuchstabe nach Gedankenstrich). Beleg: M6. Betrifft Lektionen `values.notes` und `values.rests`.

**Z1 – Zweifel (didaktisch): Hinweise nennen nicht eingeführte Begriffe.**
- `knowledgeHint_noteValues` („Eine Punktierung verlängert …“ / „A dot adds half …“) und `orderRule_noteValues` („…einschließlich Punktierung“ / „including its dot“) erscheinen in Aufgaben mit `maxDots: 0`, obwohl die Einheit ausdrücklich „unpunktiert“ lehrt.
- `meterHint1` nennt 6/8, 9/8, 12/8 in einer Lektion, die nur 2/4–4/4 verwendet (zusammengesetzte Takte sind laut Artikel erst später).
- Nicht falsch, aber unnötige Vorgriffe. Beleg: M6 (Hinweistexte für die Lektionsparameter gerendert). Vorschlag: bei `maxDots: 0` Hinweis ohne Punktierung; Taktart-Hinweis auf 2/4–4/4 beschränken.

**Z2 – Zweifel (Betonung): card-three, `threeBody`.** „Die 1 dient als Orientierung am Taktanfang; das hier gezeigte Notenbild schreibt keine zusätzliche Betonung vor.“ Die Aussage ist für geschriebene Akzentzeichen richtig, die Literatur (M4, mehrere Lehrmaterialien: Zählzeit 1 metrisch am stärksten; 3/4 stark–schwach–schwach; 2/4 stark–schwach; 4/4 stark–schwach–mittel–schwach) beschreibt aber eine übliche metrische Gewichtung, die die Taktangabe mitbringt. Die Pulseinheit lehrt zudem schon „betonte 1“ (Audio, M8). Der Text kann als „es gibt keine Betonung“ gelesen werden. Beleg: M4 (nur Suchauszüge, Quellen leicht uneinheitlich bei der mittleren Zählzeit in 3/4) plus M8. Vorschlag: „Die 1 ist der metrische Schwerpunkt des Takts; dafür steht kein eigenes Zeichen.“ Die Betonung von 4/4 (Zählzeit 3 mittelstark) ist ausdrücklich später vorgesehen und muss hier nicht stehen.

**Z3 – Zweifel (Lücke): Auftakt ohne Schlusstakt-Ergänzung.** Keine Karte nennt, dass der letzte Takt eines Stücks mit Auftakt traditionell um die Dauer des Auftakts verkürzt ist (Auftakt + Schlusstakt = ein voller Takt). Literatur (M4: Schülerlexikon, Notensatz-Dokumentationen; heute nicht mehr überall befolgt) stützt die Aussage. Die Beispiele enthalten keinen Schlusstakt, daher kein Widerspruch. Zusätzlich: US „pickup“ und UK „upbeat“ sind beide gebräuchlich (M4 + Glossar), „anacrusis“ ist der Fachbegriff; „upbeat“ bezeichnet im Englischen auch allgemein die unbetonte Zählzeit. Vorschlag: einen Satz zur Schlusstakt-Ergänzung ergänzen oder bewusst als „spätere Einheit“ vermerken; im Glossar-Hinweis „anacrusis“ nennen.

**Z4 – Zweifel (Verständlichkeit): „auf 1 und,“.** `twoEighthCaption`, `readCaption`, `readThreeCaption` (DE/US/UK): „Zwei Achtel auf 1 und, dann …“ liest sich wie die Konjunktion „und“. Die Zählsilbe sollte in Anführungszeichen stehen, wie in `eighthCaption` bereits geschehen: „auf 1 und „und““ bzw. „on “1” and “and”“. Beleg: M6/Textlesung (1 Mittel, rein sprachlich).

**Z5 – Zweifel (Satzkonvention, gering): Taktlücken-Generator.** Arithmetik ist in 800 Stichproben fehlerfrei (M5, eigene Bruchrechnung), aber die erzeugten Takte sind nicht immer konventionell notierbar: halbe Noten/Pausen auf Sechzehntel- oder Achtelpositionen (21 % der Lücken enthalten eine Halbe auf einer Nicht-Schlagposition), benachbarte Pausen statt zusammengefasster Pausen (54 %), Takte, deren sichtbare Zeichen nur Pausen sind (6 %; bei fehlender Pause ergäbe das konventionell eine ganze Pause). Beispiel: „r/16 r/2 r/16 r/8 r/16 ? (Sechzehntelpause)“. Da die Aufgabe nummerierte Einzelzeichen zeigt (kein gesetzter Takt), ist das Risiko gering; es lehrt aber unübliche Schreibweisen. Beleg: nur 1 Mittel (M5 + Code-Lektüre; keine Literaturstelle gesucht). Vorschlag: Generator pro Schlag Zellen bilden (wie `cells()` in `rhythm.ts`), Halbe nur auf Schlag 1 oder 3, benachbarte Pausen je Schlag zusammenfassen.

**Z6 – Zweifel (Präzisierung): Schlussstrich „Ende eines Stücks oder abgeschlossenen Abschnitts“** (card-barlines, `knowledgeDefinition_barlines_final`, Artikel DE/US/UK). Literatur (M4): dünn+dick = Ende eines Stücks (oder Satzes); der Doppelstrich (dünn+dünn) markiert Abschnitte. „abgeschlossener Abschnitt“ könnte deshalb zum Doppelstrich führen. Der Doppelstrich wird in der Einheit nicht gelehrt. Vorschlag: „das Ende eines Stücks oder Satzes“.

**Z7 – Zweifel (Sprache/Terminologie, gering).**
- „Zählgruppe“ / „beat group“ sind keine verbreiteten Fachbegriffe (Takt, Zählzeit); als Lernbegriff der Pulseinheit in sich konsistent und mit Glossar-Eintrag, aber nicht aus Standardliteratur belegt (1 Mittel).
- „eine Viertel-Viertel“ (Sechzehntel) ist eine Wortneuschöpfung; besser „ein Viertel einer Viertel“.
- MATCH-Erklärung der ganzen Pause: „Stille für 1/1 × die Dauer einer ganzen Note“; einfacher „genau die Dauer einer ganzen Note“. card-silence nennt außerdem nur 1/2–1/16.
- „Pausen werden nicht durch Balken verbunden“: richtig für das Pausenzeichen; in moderner Praxis dürfen Balken über Pausen laufen (M4). Besser „Pausenzeichen tragen selbst keine Balken“.
- „Einfache Takte“ umfasst hier 4/4. Das entspricht der englischen Einteilung (simple meter) und vielen deutschen Quellen (M4), manche deutsche Lehrwerke nennen 4/4 aber „zusammengesetzt“ (2+2); die Engine dokumentiert das (`meterType`-Kommentar). Kein Fehler.

## Nicht geprüft / Grenzen

- Visuelle Darstellung im Browser/Gerät (nur Layout-Elemente geprüft); Audioqualität, Latenz, Sperrung der Tippfläche beim Einzählen.
- Beispiel-Audio („zwei Gruppen“, Klick-Betonung) nur durch Codelektüre belegt.
- Literaturabgleich nur über Suchauszüge (WebFetch gesperrt); keine Primärlektüre von Lehrbüchern. Für Z2, Z3, Z6 deshalb Belegstärke „Suchauszüge, mehrere Lehrmaterialien“, nicht „Lehrbuch geprüft“.
- Nichtrhythmische Teile des Katalogs wurden nicht geprüft.

## Zusammenfassung

- Geprüft: 3 Einheiten, 9 Lektionen/Übungssätze (22 Spezifikationen, 8800 Stichprobenaufgaben), 26 Karten, 3 Artikel, 43 Beispiel-Scores (47 Takte), US/UK/DE-Texte.
- Arithmetik und Notenbeispiele: 0 Abweichungen (Repo-Engine, tonal, eigene Bruchrechnung stimmen überein).
- Fehler: 3 (F1 Dativ „Schläge“ in Zählgruppen-Optionen; F2 „Achtel liegen genau dazwischen“ in card-read/Artikel; F3 fehlender Artikel in ORDER-/MATCH-Hinweisen).
- Zweifel: 7 (Z1 Vorgriffe in Hinweisen, Z2 Betonung 3/4, Z3 Schlusstakt/„upbeat“, Z4 „auf 1 und,“, Z5 Taktlücken-Satzbild, Z6 Schlussstrich-Formulierung, Z7 Terminologie/Wortwahl).
- Freigabefähig ohne Auflage: pulse.card-pulse, card-rhythm, card-count-in, card-tempo, card-bpm, card-compare, card-strategy, pulse.article, pulse.steady, pulse.tempo; values.card-long, card-shapes, card-long-rests, card-capacity, card-complete, values.fill; simple-meter.card-four, card-count, card-complete, card-eighth, card-rests.
- Freigabefähig nach kleiner Textkorrektur: pulse.card-groups und pulse.groups (F1); values.notes (F3, Z1), values.rests (F3, Z7), card-short, card-short-rests, card-silence, card-barlines, values.article (Z6/Z7); simple-meter.card-two (Z4), card-three (Z2), card-pickup (Z3), card-read (F2, Z4), simple-meter.meter/count-in/read (Z1), simple-meter.article (F2, Z2–Z4).
- Nicht freigeben bis zur Korrektur: nur card-read (F2) und die Lektion pulse.groups (F1).
- Belegstärke: Arithmetik, Dauern, Namen: ≥2 unabhängige Mittel. Literaturaussagen: Suchauszüge. Nur 1 Mittel: Audio-Aussagen, Z5, Z7 (Terminologie).
