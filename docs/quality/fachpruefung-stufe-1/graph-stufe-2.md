# Fachlicher Prüfdurchgang Fähigkeitsgraph Stufe 2 (ADR 0005)

Prüfer: unabhängiger Durchgang, 19.10.2026. Repo nur gelesen. Alle Skripte liegen im Scratchpad unter `rg/`.
Geprüft: 50 Stufe-2-Fähigkeiten (Voraussetzungen, Titel DE/US/UK, Einheit, Lektion, Stufe), dazu 16 Einheiten, 48 Lektionen, Karten und Aufgabenparameter.

## 0. Prüfmittel (nummeriert, in den Tabellen als M1–M6 zitiert)

- **M1 Topologie-Skript** (`rg/topo.py`): Zyklen, fehlende IDs, Tiefe, Ahnenmengen, redundante Kanten, Stufe-1-nach-Stufe-2-Kanten, Vergleich Dump gegen Katalog und Plan, Lektionszuordnung.
- **M2 Katalog- und Aufgabenparameter** (`rg/dump2.py`, `rg/coverage.py`): Karten, Beispiele und `exerciseSets` je Lektion, Generatorcode `packages/exercises/src/context.ts` und `chords.ts`.
- **M3 Theorie-Engine** (`rg/verify1.mjs`, `rg/verify2.mjs`): Tonarten, Vorzeichen, Tonleitermuster, leitereigene Dreiklänge, Intervalle, Oktavnamen. Dazu 6000 generierte Kontextaufgaben je Tonart-Thema.
- **M4 `tonal` als Orakel** (selbe Skripte, `rg/verify3.mjs`): 172 plus 82 200 Einzelprüfungen, 0 Abweichungen außer den unten genannten Randfällen.
- **M5 Literatur und Lehrmaterial per WebSearch** (nur Ergebnisse, kein Originaltext):
  - Geltung von Versetzungszeichen: Wikipedia „Accidental (music)“, MuseScore-Handbuch.
  - Intervallreduktion und -umkehrung: teoria.com „comp simp“, dummies.com „compound intervals“, Karteikartensätze.
  - Epochengrenzen: Wikipedia „Dates of classical music eras“, MasterClass, Skoove, Good Music Guide.
  - Synkope: Lehrbuchdefinitionen (Verschiebung der Betonung; regulär und irregulär).
  - Parallel- und Varianttonart: Wikipedia „Parallel and counter parallel“, Duden, snl.no.
  - Melodisches Moll: Sweetwater, LibreTexts, Hoffman Academy (Minderheitenmeinung).
  - Reihenfolge der Vorzeichen: music-theory-practice.com, flat.io.
- **M6 gerenderte Titel** (`rg/render.mjs` mit `packages/i18n/src/glossary.ts`; Ergebnis `rg/titles.txt`): tatsächlich ausgegebene DE/US/UK-Titel.

Grenzen:

- Didaktische Urteile über Voraussetzungen sind meine Bewertung. Belegt sind sie durch Ahnenanalyse (M1) und Aufgabenparameter (M2), nicht durch Literatur.
- Das Hörurteil, ob Aufgaben nach Gehör lösbar sind (z. B. `aural.triad-inversions`), habe ich nicht empirisch geprüft.
- Die Epochengrenzen sind nur über M3-Code und M5 belegt.

## 1. Graph-Befunde (M1)

| Prüfung | Ergebnis |
|---|---|
| Zyklen | keine |
| Fehlende Voraussetzungs-IDs | keine |
| Dump gleich Stufe 1 plus Stufe 2; Katalog-IDs und -Voraussetzungen gleich Dump | ja |
| Stufe 1 setzt Stufe 2 voraus | nie |
| Planreihenfolge: jede Voraussetzung vor ihrem Ziel | erfüllt, 0 Verstöße |
| Zuordnung Fähigkeit → Einheit → Lektion → Stufe (50 von 50) | konsistent mit Katalog und `curriculum-plan.json` |
| Maximale Tiefe | 11 (`scale.melodic-minor`, `key.relative`, `aural.triad-inversions`) |
| Blätter in Stufe 2 | 19 (erwartbar für Endpunkte; keine verwaiste Fähigkeit) |
| Vorgriffe auf Phase 3 | keine. Textsuche in allen Stufe-2-Texten: kein Septakkord, keine Kirchentonart, keine Modulation, keine Kadenz oder Funktionstheorie. Nur „spätere Akkordfunktion“ als Hinweis, „Generalbass“ im Historiktitel und `Blues` als Kulturbegriff. Die Aufgabentypen erlauben nur vier Dreiklangarten. |
| Redundante direkte Kanten (transitiv schon impliziert) | 15, harmlos: u. a. `scale.natural-minor→scale.major-pattern`, `scale.harmonic-minor→notation.write-pitch`, `key.signature-major→notation.accidental-scope`, `key.relative→scale.natural-minor`, `chord.diatonic-triads→scale.major-build`. Kein Fehler; optional bereinigen. |
| Fehlende Kanten | siehe Tabelle 2 (8 Fehler, mehrere Zweifel) |

## 2. Tabelle je Fähigkeit

Status: **ok** = freigabefähig, **Zweifel** = Anpassung empfohlen, **Fehler** = vor Freigabe ändern.

### 2a. Befunde mit mindestens zwei unabhängigen Mitteln

| ID | Befund | Beleg (Mittel) | Korrekturvorschlag |
|---|---|---|---|
| notation.bass-natural | **Fehler** (fehlende Voraussetzungen) | M1: `notation.ledger-lines`, `notation.octave-register`, `notation.pitch-match` und `notation.keyboard-layout` sind keine Vorfahren. M2: Aufgaben `NOTE_NAME` 48–60, `includeOctave:true`, und `KEY_FIND` (Klaviatur). C4 liegt auf der 1. Hilfslinie über dem Bassschlüssel (M3: diatonische Position 28 = 2 Schritte über der oberen Linie A3; `tonal` bestätigt C4 = 60). Das Fachliche der Karten ist korrekt: F3 auf der 4. Linie, C3 im 2. Zwischenraum, h über der obersten Linie. Titel in DE und US stimmen überein (c bis c¹ gleich C3 bis C4). | Voraussetzungen ergänzen: `notation.ledger-lines`, `notation.octave-register`. |
| notation.grand-staff | **Fehler** (fehlende Voraussetzung) | M1: `notation.pitch-match`, `notation.keyboard-layout` und `notation.ledger-lines` fehlen. M2: `KEY_FIND` mit `presentation: grand-staff`, Bereich 57–64, ist derselbe Aufgabentyp wie `notation.pitch-match`. C4 braucht Hilfslinien in beiden Systemen (M3). | `notation.pitch-match` ergänzen. Das zieht Klaviatur, Oktavlage und Hilfslinien mit. |
| notation.accidental-scope | **Fehler** (Titel DE) plus **Zweifel** (Voraussetzung) | M6: DE-Titel lautet „… innerhalb des Takt beachten“ (Glossar `measure_one` = „Takt“, Dativ fehlt). M2: die Karte lehrt „gleicher Stammton in derselben Oktavlage bis zum Taktstrich“ und Aufhebung bei Oktavwechsel, M1 zeigt aber `notation.octave-register` nicht als Vorfahren. M5 (Wikipedia, MuseScore): Regel korrekt, Oktavwechsel ausgenommen, gebundener Ton behält das Zeichen über den Taktstrich. | DE: „Geltung von $t(glossary:accidental_other) im selben $t(glossary:measure_one) beachten“. Titel um „(gleicher Ton, gleiche Oktavlage)“ ergänzen. Voraussetzung `notation.octave-register` ergänzen. |
| scale.major-build | **Fehler** (Titel DE) | M6: „Dur-Tonleitern mit bis zu drei Kreuze oder b schreiben“. Ein Dativ fehlt, und „b“ allein ist missverständlich (Glossar `sharp_other` = „Kreuze“, `flat_other` = „b“). US/UK-Titel korrekt. M3/M4: sieben Tonarten C, G, D, A, F, B, Es mit dem Muster 2‑2‑1‑2‑2‑2‑1 und Vorzeichen stimmen mit `tonal` überein (172 Prüfungen, 0 Abweichungen). | DE: „… mit bis zu drei Vorzeichen (Kreuzen oder b) schreiben“ oder wie bei `key.signature-major`. |
| rhythm.triplet | **Fehler** (Titel US) plus **Zweifel** (Voraussetzung) | M6: US „Count three notes in a eighth note triplet“ (falscher Artikel). UK „a quaver triplet“ ist korrekt. M2: Aufgaben `RHYTHM_TAP triplets` in 2/4, 3/4 und 4/4 mit Einzähltakt, aber `rhythm.meter-simple`, `rhythm.read-basic` und `rhythm.count-in` sind keine Vorfahren (M1). Inhaltlich korrekt: Dauer der Triole = 1 Viertel (M3 plus M2-Generator). | EN: „Count triplet $t(glossary:notes.eighth_other)“. Voraussetzung `rhythm.read-basic` ergänzen. |
| interval.simple-qualities | **Fehler** (fehlende Voraussetzungen) plus **Zweifel** (überflüssige Kante) | M1: `interval.thirds` und `interval.perfect-fourth-fifth-octave` (Stufe 1, gleiche Inhalte: m/M-Terz, P4/P5/P8) sind keine Vorfahren; sie werden auch nicht über `interval.semitone-distance` oder `generic-size` erreicht. M2: Aufgaben `INTERVAL_IDENTIFY_VISUAL` mit m2…M7, P1/P4/P5/P8, A4, d5. Die Kante `notation.accidental-scope` (Taktgeltung) wird für Zweitonintervalle nicht gebraucht; `notation.accidentals` reicht und ist schon Vorfahre. Reichweite der Qualitäten: nur P, m, M plus A4/d5. Der Titel „Qualität bis zur Oktave“ verspricht mehr. | `interval.thirds` und `interval.perfect-fourth-fifth-octave` als Voraussetzungen; `notation.accidental-scope` durch `notation.accidentals` ersetzen. Titel: „… (rein, klein, groß; Tritonus)“. |
| chord.diatonic-triads | **Fehler** (fehlende Voraussetzung) | M1: `chord.major-minor` und `chord.diminished-augmented` sind keine Vorfahren. M2: `CONTEXT_CHOICE diatonic-triad` (Antwort Qualität inkl. vermindert) und `CHORD_BUILD` mit `types: major, minor, diminished`. M3/M4: Folge Dur, Moll, Moll, Dur, Dur, Moll, vermindert in allen Dur-Tonarten bis ±3 und Moll, vermindert, Dur, Moll, Moll, Dur, Dur in natürlichem Moll stimmt mit `tonal` überein; 6000 generierte Aufgaben ohne Abweichung. | Voraussetzung `chord.diminished-augmented` ergänzt (bringt `chord.major-minor` mit). |
| chord.inversions | **Fehler** (Titel/Abdeckung) | M2: Titel „bestimmen und bauen“. Im ganzen Katalog hat kein `CHORD_BUILD` Umkehrungen: alle `inversions: [0]`. Die Lektion `inversions.practice` hat nur `CHORD_IDENTIFY` (10). M2-Generator `chords.ts` kann Umkehrungen bauen; es fehlt die Aufgabe. Fachlich korrekt: Sextakkord = Terz im Bass (E‑G‑C), Quartsextakkord = Quinte im Bass. | Entweder Titel auf „bestimmen“ kürzen oder `CHORD_BUILD` mit `inversions: [1,2]` ergänzen. |
| interval.simple-compound | **Zweifel** (Konvention) | M3: Engine `simplify(P15)` ergibt P8, `tonal` ergibt P1. M5: Literatur uneinheitlich; Subtraktion „−7“ mehrfach ergibt P1. Die Karte nennt die Wahl und stoppt bei der einfachen Oktave. Alle übrigen Reduktionen M9…M14 stimmen überein (M3 und M4). Eine Aufgabe mit P15 ist fachlich vertretbar. | Konvention in einem ADR-Hinweis festhalten (nicht nur auf der Karte). Eventuell P15 aus den Aufgaben nehmen. Für die Umkehrung gilt ebenso: P1↔P8 nach „Summe 9“ (M5), `tonal` weicht ab (M3). |
| key.signature-minor | **Zweifel** (Inhalt/Abdeckung) | M2: Karte `minorKeysBody` nennt a, e, h, d, g, c, aber nicht fis-Moll (3 Kreuze); die Aufgaben `KEYSIG_IDENTIFY` ±3 schließen fis-Moll ein (M3: fis-Moll = F♯ C♯ G♯, `tonal` ebenso). Nur 4 Aufgaben gehören direkt zu dieser Fähigkeit; die 8 `relative-key`-Aufgaben stehen im selben Satz mit zwei `skillIds`. | Karte um fis-Moll ergänzen. Aufgabenzahl oder Satz trennen. |
| key.fifths | **Zweifel** (Titel/Reichweite) | M2: Aufgaben `fifth-neighbour` nur `modes: ["major"]`, nur sieben Durtonarten Es…A. Der Titel nennt weder Dur noch die Grenze. M3/M4: Nachbarn, Vorzeichenzahl und `tonal`-Transposition ±5P stimmen (6000 Fälle). | Titel: „Benachbarte Durtonarten im Quintenzirkel (bis drei Vorzeichen) finden“. Optional `interval.perfect-fourth-fifth-octave` als Voraussetzung. |
| key.relative | **Zweifel** (Titel) | M2/M6: Titel „unterscheiden und zuordnen“; die Karte erklärt Parallel- gegenüber Varianttonart, aber Aufgaben prüfen nur die Parallele. M3/M4: Parallele und Variante stimmen mit `tonal` überein (6000 Fälle). M5: DE „Paralleltonart“ = EN „relative key“, DE „Varianttonart“ = EN „parallel key“; Duden und Wikipedia bestätigen. Terminologie in Text und Glossar korrekt. | Titel auf „zuordnen“ kürzen oder eine Aufgabe zur Varianttonart ergänzen. |
| rhythm.syncopation-basic | **Zweifel** (Titel/Definition/Abdeckung) | M2: Titel „lesen und zählen“; die Lektion hat nur Ja/Nein-Aufgaben (`syncopation`, 8) und 4 Taktgrenzenaufgaben, kein Zählen/Tippen. Es gibt nur 3 feste Quellvarianten. M3 Probe: Viertel–Halbe–Viertel in 4/4 (klassische Synkope) wird als „nein“ gewertet, weil nur Einsätze zwischen den Schlägen zählen. M5: Lehrbuchdefinition ist weiter (Betonungsverschiebung, regulär/irregulär). Die Karte benennt die Einschränkung ausdrücklich (gut). | Titel: „Einfache Synkopen (Einsatz zwischen den Schlägen, über den nächsten Schlag gehalten) erkennen“. Weitere Quellvarianten ergänzen. |
| rhythm.dotted-and-tied | **Zweifel** (Titel/Evidenz/Voraussetzung) | M2: „vergleichen“ wird nicht geprüft; es sind nur 4 `crossbar-duration`-Aufgaben (Gesamtdauer). Der Satz führt auch die 8 Synkopenaufgaben mit beiden `skillIds` (das zählt als Evidenz für beide). Die Karte nennt „Fis, Veränderung wird durch die Bindung weitergetragen“ (fachlich richtig, M5: Wikipedia, MuseScore), aber M1 zeigt weder `notation.accidentals` noch `notation.accidental-scope` als Vorfahren. | Titel: „… Gesamtdauer über Taktstriche bestimmen“. Sätze je Fähigkeit trennen. Entweder Voraussetzung `notation.accidental-scope` oder Fis-Beispiel entfernen. |
| rhythm.dotted-values | **Zweifel** (Titel) | M2: Aufgaben `dotted-duration` fragen die Dauer ab; Titel „zusammensetzen“ (US „Construct“). M3: 3/2, 3/4 usw. exakt (Engine-Brüche). Karte korrekt: Punkt = +½ Wert, genau ein Punkt. | Titel: „Dauer einfach punktierter Notenwerte bestimmen“ / „Determine the duration of single-dotted notes“. |
| rhythm.group-6-8 | **Zweifel** (Titel) | M2: Aufgaben `RHYTHM_TAP` in 6/8 (12), kein Gruppieren. Karten korrekt (3+3, punktierte Viertel als Grundschlag). | Titel: „Rhythmen in 6/8 nach den zwei Zählzeiten (3+3) lesen und tippen“. |
| notation.write-pitch | **Zweifel** (Reichweite) | M2: `NOTE_PLACE` nur 57–64 (A3–E4), maximal 1 Vorzeichen. Der Titel nennt Violin- und Bassschlüssel ohne Umfangsgrenze; die gelesenen Bereiche (c¹–c² und c–c¹) werden nur bei A3–E4 geschrieben. Fachlich korrekt (M3: Hilfslinie, C4 in beiden Systemen). | Titel mit Umfang, oder den Bereich erweitern. |
| aural.triad-major-minor | **Zweifel** (Voraussetzung) | M1: `chord.major-minor` und `chord.triad-structure` sind keine Vorfahren, obwohl die Karten „Grundtonbezug“ und „Terz“ voraussetzen. Vergleichsfall: `aural.rhythm-choice-dotted` und `aural.triad-inversions` setzen ihr Notationspendant voraus. Inkonsistent. | `chord.major-minor` ergänzen (und bei `aural.triad-quality` `chord.diminished-augmented`). |
| aural.triad-quality | **Zweifel** (Voraussetzung) | wie oben (M1, M2). | `chord.diminished-augmented` ergänzen. |
| aural.simple-intervals | **Zweifel** (Voraussetzung/Titel) | M1: keine Kante zu `interval.generic-size` oder `interval.simple-qualities`; Antworttexte wie „große Sexte“ setzen Nummer und Qualität voraus. M2: nur `melodic-up`, ohne Tritonus; Karten nennen die Halbtonzahlen richtig (M3/M4). | `interval.generic-size` ergänzen. Titel „melodisch aufwärts“ präzisieren. |
| aural.major-minor-scale | **Zweifel** (Titel) | M2: Quellen sind 8-tönige Tonleitern aufwärts, keine Melodien. Titel „in Tonfolgen/melodies“ ist ungenau. | „in aufsteigenden Tonleitern“ / „in ascending scales“. |
| chord.major-minor | **Zweifel** (Titel/Abdeckung) | M2: „bestimmen und bauen“; die Lektion hat nur `CHORD_BUILD`. Das Bestimmen (`CHORD_IDENTIFY`) kommt erst in `chord.inversions`. Aufbau 4+3 und 3+4 korrekt (M3/M4: Terzschichtung, 0 Abweichungen). | Titel nur „bauen“ oder eine Bestimmen-Aufgabe ergänzen. |
| chord.diminished-augmented | **Zweifel** (Titel/Abdeckung) | M2: wie oben (nur `CHORD_BUILD`). Fachlich korrekt: 3+3 mit d5, 4+4 mit A5; Hör-Randbedingung (Grundtonbezug) richtig dargestellt (M3). Die Voraussetzung `interval.simple-qualities` übt A5 nicht. | Titel nur „bauen“, oder `CHORD_IDENTIFY` ergänzen. |
| notation.octave-systems | **ok** | M3/M4: MIDI C2=36, C3=48, C4=60, C5=72; deutsches h = B3. M2: Karten nennen „C = C2, c = C3, c¹ = C4“. Beide stimmen. | — |
| notation.enharmonic-spelling | **ok** | M3/M4: B♯3 = C4 = 60, E♯4 = 65, Fb4 = 64 (Engine und `tonal`). M2: Karten richtig (Cis/Des, Eis/F, His/c¹). | — |
| rhythm.ties | **ok** | M2: Definition „gleiche geschriebene Tonhöhe, Dauern addieren“; Bogen verschiedener Töne = Phrasierung. M3: Brüche exakt. M5: Wikipedia und MuseScore. | — |
| rhythm.compound-meter | **ok** | M2: 3/4 = drei Viertel, 6/8 = zwei punktierte Viertel; Aufgabe fragt Anzahl und Wert zusammen. M3: Engine-Brüche; Hörfall ausgeklammert. Titel in DE/US korrekt. | — |
| interval.build | **ok** | M3/M4: C–E M3, C–Fes d4, C–Fis A4, C–Ges d5 (Halbtöne 4/4/6/6); `tonal` 3M, 4d, 4A, 5d. M2: Aufgaben aufwärts bis P8. | — |
| interval.enharmonic-distinction | **ok** | wie `interval.build` (M3/M4); M2: Aufgaben nur A4, d5, M3, d4; Karten richtig (Tritonus und Fes). | — |
| interval.inversion | **ok** | M3/M4: Umkehrtabelle stimmt mit `tonal` für 2…7, A4↔d5, A5↔d4, A2↔d7 überein. M5: Summe 9, rein bleibt rein, Quartenpaare. Randfall P1↔P8 nach der Summenregel 1+8=9; `tonal` gibt P1/P8, nur dort Abweichung. | — |
| interval.descending | **ok** | M3: C4→A♭3 = −M3 (−4 Halbtöne) usw.; Karten richtig. | — |
| scale.major-pattern | **ok** | M3/M4: 2‑2‑1‑2‑2‑2‑1 in allen sieben Tonarten, Noten gleich `tonal`. | — |
| scale.tonic | **ok** | M2/M3. Reihenfolge nach `scale.major-build` etwas ungewöhnlich, aber stimmig. | — |
| scale.natural-minor | **ok** | M3/M4: 2‑1‑2‑2‑1‑2‑2, Noten gleich `tonal` (`minor`). | — |
| scale.harmonic-minor | **ok** | M3/M4: 7. Stufe erhöht (Muster 2‑1‑2‑2‑1‑3‑1, Noten gleich `tonal`); übermäßige Sekunde F–Gis richtig. | — |
| scale.melodic-minor | **ok** | M3/M4: aufwärts 6. und 7. erhöht (Muster 2‑1‑2‑2‑2‑2‑1, Noten gleich `tonal`). M5: klassische Konvention bestätigt; Jazz-/Hoffman-Variante als Minderheit, Karte benennt die Konvention ausdrücklich. | — |
| key.signature-major | **ok** | M3/M4: sieben Dur-Tonarten ±3 mit Vorzeichen Fis/Cis/Gis und B/Es/As gleich `tonal`. M5: Reihenfolge F‑C‑G und B‑E‑A, Leitton-Regel. M1: Bassschlüssel über `notation.bass-natural` abgedeckt. | — |
| chord.triad-structure | **ok** | M3/M4: Terzschichtung; M2: Aufgaben `chord-member` in Grundstellung. | — |
| chord.root-and-bass | **ok** | M2: E–G–C hat Bass E, Grundton C. Aufgaben `chord-root` (alle Umkehrungen). | — |
| history.medieval-renaissance, history.baroque-classical, history.romantic-modern | **ok** (mit Hinweis) | M3 (Code): Schwellen 1400/1600/1750/1820/1900, Aufgabenjahre 1250/1550/1720/1780/1850/1950 weit von den Grenzen. M5: übliche Datierungen (Renaissance ~1400–1600, Barock 1600–1750, Klassik 1750–1820, Romantik 1820–1900) bestätigt, mit Streuung der Grenzen. Kartentexte hedgen angemessen (europäische Kunstmusik, Lehrdossiers, kein Anspruch auf Allgemeingültigkeit). `romantic-modern` bündelt 1900 bis heute und sollte „seit 1900“ heißen. | `history.romantic-modern`: „Romantik und Musik seit 1900“ (wie Lektionstitel). Kette ohne fachliche Notwendigkeit linear (Barock verlangt Mittelalter); optional lockern. |

### 2b. Befunde mit nur einem Mittel (kein zweiter unabhängiger Beleg gelungen)

| ID | Befund | Beleg (Mittel) | Korrekturvorschlag |
|---|---|---|---|
| aural.rhythm-choice-dotted | ok (Struktur), Hörbarkeit ungeprüft | M2 (Karten, Parameter) und M1 (Kante `rhythm.dotted-values`). Keine Hörprobe. | Hörprobe bei Gerätetests. |
| aural.simple-compound-pulse | ok (Struktur) | M2: 2/4 gegenüber 6/8, Grundschlag als Tempomaß; M1. Keine Hörprobe. | wie oben. |
| aural.rhythm-completion | ok (Struktur) | M2/M1. | wie oben. |
| aural.melodic-memory | ok (Struktur) | M2/M1. Voraussetzung `aural.simple-intervals` fachlich nicht zwingend. | optional lockern. |
| aural.triad-inversions | ok (Struktur), Zweifel Hörbarkeit | M2: nur Dur/Moll, eng, mit Bezugston; M1. Ob Zuordnung der Umkehrung allein nach Gehör zuverlässig lösbar ist, nicht geprüft. | Hörprobe; ggf. Hinweis in Lektion. |
| history.jazz-roots | ok | M2: Quellenkontextfragen, Karten hedgen richtig. Keine Literaturprüfung (nur Kartenlektüre). | Quellen im Plan nennen. |
| history.popular-contexts | ok | M2 wie oben. | wie oben. |
| history.compare-sources | ok | M2: Datum gegen Rolle, Programm gegen Bericht, Unabhängigkeit der Quellen. | wie oben. |

## 3. Zusammenfassung der Korrekturen (nach Priorität)

1. **Fehlende Kanten** (wirken auf Freischaltung, M1 plus M2):
   - `notation.bass-natural` ← `notation.ledger-lines`, `notation.octave-register`
   - `notation.grand-staff` ← `notation.pitch-match`
   - `notation.accidental-scope` ← `notation.octave-register`
   - `interval.simple-qualities` ← `interval.thirds`, `interval.perfect-fourth-fifth-octave`; dort `notation.accidental-scope` durch `notation.accidentals` ersetzen
   - `chord.diatonic-triads` ← `chord.diminished-augmented`
   - `rhythm.triplet` ← `rhythm.read-basic`
   - `aural.triad-major-minor` ← `chord.major-minor`
   - `aural.triad-quality` ← `chord.diminished-augmented`
   - `aural.simple-intervals` ← `interval.generic-size`
2. **Titel** (M6): `notation.accidental-scope` DE (Dativ), `scale.major-build` DE (Dativ, „b“), `rhythm.triplet` US (Artikel); Mismatch Titel gegen Aufgaben: `chord.inversions`, `chord.major-minor`, `chord.diminished-augmented`, `rhythm.syncopation-basic`, `rhythm.dotted-and-tied`, `rhythm.dotted-values`, `rhythm.group-6-8`, `key.relative`, `key.fifths`, `aural.major-minor-scale`.
3. **Inhalt** (M2 plus M3): Karte `minorKeysBody` ohne fis-Moll.
4. **Sätze mit zwei Fähigkeiten** (`rhythm.dotted-and-tied`/`syncopation-basic`, `key.signature-minor`/`key.relative`) zählen alle Aufgaben für beide; Evidenz kann sich verzerren.
5. **Konventionsdokumentation**: Prime/Oktave in Umkehrung und P15-Reduktion als ADR festhalten (Literatur und `tonal` uneinheitlich).

## 4. Ergebnis

- 50 Fähigkeiten geprüft.
- 8 Fehler: `notation.bass-natural`, `notation.grand-staff`, `notation.accidental-scope`, `scale.major-build`, `rhythm.triplet`, `interval.simple-qualities`, `chord.diatonic-triads`, `chord.inversions`.
- 15 Zweifel: `interval.simple-compound`, `key.signature-minor`, `key.fifths`, `key.relative`, `rhythm.syncopation-basic`, `rhythm.dotted-and-tied`, `rhythm.dotted-values`, `rhythm.group-6-8`, `notation.write-pitch`, `aural.triad-major-minor`, `aural.triad-quality`, `aural.simple-intervals`, `aural.major-minor-scale`, `chord.major-minor`, `chord.diminished-augmented`.
- 27 ok. Davon 16 mit mindestens zwei Mitteln: `notation.octave-systems`, `notation.enharmonic-spelling`, `rhythm.ties`, `rhythm.compound-meter`, `interval.build`, `interval.enharmonic-distinction`, `interval.inversion`, `interval.descending`, `scale.major-pattern`, `scale.tonic`, `scale.natural-minor`, `scale.harmonic-minor`, `scale.melodic-minor`, `key.signature-major`, `chord.triad-structure`, `chord.root-and-bass`. Dazu 3 Historik-IDs (Epochen) mit Hinweis. 8 weitere ok-Befunde stützen sich nur auf ein Mittel (Tabelle 2b).
- Graph insgesamt: keine Zyklen, Planreihenfolge erfüllt, keine Vorgriffe auf Phase 3. Die vorhandene Struktur trägt, die Kantenlücken sind lokal korrigierbar.
- Freigabe nach ADR 0005 ist erst nach Korrektur der 8 Fehler und erneuter Prüfung der Zweifel zu empfehlen. Freigabefähig jetzt: die 16 IDs mit zwei Mitteln plus die 3 Epochen-IDs.
