# Fachlicher Prüfbericht Stufe 1, Grundlagen + Notation (ADR 0005, getrennter Durchgang)

Prüfobjekt: `scratchpad/dump-notation.txt` (Einheiten `fundament.reading-and-listening`, `notation.l1.staff`, `notation.l1.keyboard`, `notation.l1.register`).
Repo nur gelesen. Alle Skripte und Ausgaben liegen in `scratchpad/rv/` (`facts.mjs`, `verify-examples.mjs`, `bulk.mjs`, `exsample.mjs`, `resolve.mjs`, Ausgaben `*.out`, `resolved.txt`).

## 1. Umfang und Methode

Geprüft wurden 26 Karten, 10 Lektionen, 4 Artikel, 46 Notenbeispiele und 10 Übungssätze, jeweils in DE, US und UK.

Die Glossarverweise `$t(glossary:…)` wurden mit der echten i18n-Instanz aufgelöst (`resolved.txt`). Der Dump zeigt sie nur als Platzhalter, deshalb habe ich die tatsächlich angezeigten Texte geprüft.

Prüfmittel:

- **M1 – Engine**: `packages/theory` und `packages/notation`. Dazu gehören `parseScore`, `validateScore`, `layoutScore` (Notenkopf-y, Hilfslinien, Vorzeichen-Glyphen), `staffY`, `keyboardLayout`, `pitchName` (Helmholtz/wissenschaftlich/deutsch) und `intervalBetween`.
- **M2 – eigene Tabelle** im Skript, unabhängig von der Engine: Stammton→Halbtonzahl, Linien-/Zwischenraumfolge E G B D F / F A C E, Hilfslinienzahl, Helmholtz-Namen, deutsche Namen, Intervalle m3/M3/P4/P5.
- **M3 – `tonal` 6.4.3** als Orakel für MIDI, wissenschaftliche Namen, Intervalle und Halbtonabstände.
- **M4 – Literatur (WebSearch, nur Suchauszüge)**:
  - Helmholtz/wissenschaftlich (Wikipedia „Helmholtz pitch notation“, learnmusictheory.net),
  - Stammtöne / H–B / Endungen -is und -es / Versetzungszeichen (de.wikibooks „Musiklehre: Die Stammtöne“, bonedo, lernhelfer),
  - Geltungsdauer von Vorzeichen (Wikipedia „Accidental“, Kent-State-Rudiments),
  - US/UK-Begriffe (hellomusictheory, Steinberg-Dorico-Doku).
- **M5 – Rendering und Dauerläufe**: je Übungsspec 400 Seeds. Die Lösung wurde aus der gezeichneten Notenposition und dem gezeichneten Vorzeichen neu abgeleitet und mit `expectedAnswer` verglichen. Zusätzlich wurden Prompts, Antwortoptionen, Hinweise und Rückmeldungen in den drei Sprachen ausgegeben.

**Ergebnis der Sachprüfung:** Ich habe keinen musiktheoretischen Fehler gefunden. Alle Töne, Oktavlagen, Intervalle, Halbtonzahlen, Tastenpositionen und Schlüsselpositionen stimmen. Die Fehler unten sind Sprach-/Glossar-Fehler (Deutsch, UK-Terminologie). Dazu kommen didaktische Zweifel.

## 2. Belegt mit ≥ 2 unabhängigen Mitteln

Ausgabe: `facts.out` (95 Einzelprüfungen, 0 Abweichungen), `verify-examples.out`, `bulk.out`.

| Aussage | Belege |
|---|---|
| G4 = g¹ liegt auf der 2. Linie von unten | M1 `staffY` y=3 + M2 Tabelle; M4 nur indirekt (Uni Bamberg: Violinschlüssel-Referenzton g¹; der Suchauszug nennt die Linie nicht ausdrücklich) |
| Linientöne E G B(H) D F = e¹ g¹ h¹ d² f²; Zwischenräume F A C E = f¹ a¹ c² e² | M1 `staffY` + M2 |
| D4 im Zwischenraum unter der unteren Linie, G5 im Zwischenraum über der oberen, beide ohne Hilfslinie | M1 + M2 |
| C4 auf der 1. unteren Hilfslinie, B3 im Zwischenraum, A3 auf der 2.; G5, A5 (1. Hilfslinie), B5, C6 (2.) | M1 + M2; Layout zählt 1/2 Hilfslinienzeilen |
| Neun Positionen im System; Reihenfolge E F G A H C D E F | M1 + M2 |
| Intervalle C–Es = kleine Terz (3 Halbtöne), C–E = große Terz (4), C–F = reine Quarte (4 Stammtöne, 5 Halbtöne), C–G = reine Quinte (5 Stammtöne, 7 Halbtöne) | M1 + M2 + M3 (tonal) |
| C→Cis→D je 1 Halbton, C→D = Ganzton (2 Halbtöne, genau eine Taste dazwischen), E→F und H→C je 1 Halbton | M1 + M2 + M3 |
| Cis = Des, Eis = F, Fes = E sind dieselbe Taste (gleichstufig); Oktave = 12 Halbtöne (P8) | M1 + M2 + M3 |
| Deutsche Namen Cis, Des, Es, As, Gis, Eis, Fes, Ces, His; H = intl. B, B = B♭ | M1 `germanName` + M2 + M4 (de.wikibooks, bonedo) |
| Helmholtz: a, h (kleine Oktave), c¹–h¹, c²–h², c³; Zuordnung A3=a, B3=h, C4=c¹, C5=c², C6=c³; C4 = c¹ = Eingestrichene Oktave | M1 `pitchName` + M2 + M4 (Wikipedia Helmholtz, learnmusictheory) |
| Tastatur 60–72: schwarze Tasten 61, 63 | 66, 68, 70; C links der Zweier-, F links der Dreiergruppe; 8 weiße Tasten bis zum nächsten C; zwischen E–F und H–C keine Taste | M1 `keyboardLayout` + M2/M3 |
| `G#4/2 G4/2` zeichnet ♯ und danach ♮ (Beispiel „Gis–G mit Auflösungszeichen im selben Takt“); `B4/2 Bb4/2` zeichnet ♭ | M1 `layoutScore` (Glyphen Sharp+Natural), M2 Regel; M4 (Natural hebt Vorzeichen im selben Takt auf) |
| Alle 46 Notenbeispiele: Score parst, Takte voll, Tonhöhen = Kurzschrift (eigene Tabelle), Tastenausschnitt enthält alle Töne, Bildunterschriften (DE/US/UK) nennen genau diese Töne in richtiger Schreibweise | M1 + M2 (`verify-examples.out`: nur OK; die Kennzeichnung „LEDGER?“ bei A3/C6 ist ein Zählartefakt, 2 unten + 2 oben = 4 Zeilen) |
| Alle Übungssätze: 400 Seeds je Spec, 0 Abweichungen zwischen sichtbarer Note und Lösung (NOTE_NAME, KEY_FIND, INTERVAL visuell/auditiv); Aufgabenbereiche passen zu den Kartenaussagen (F–B = vier Töne, E4–F5 = neun Positionen, höchstens 2 Hilfslinien, Tastenfenster C4–B4 mit jedem Namen einmal, Hörfragen spielen den tieferen Ton zuerst) | M1 + M5 + M2-Ableitung aus dem Notenbild |
| Geltungsregel „bis zum Taktende“ ist als Vereinfachung vertretbar; „genaue Regeln später“ ist ehrlich | M4 (Wikipedia, Kent State, de.wikibooks: nur Takt und Oktavbereich); Engine setzt ♮ im selben Takt |

## 3. Befunde je Karte / Lektion / Übungssatz

Legende: ok = freigabefähig; Fehler = vor Freigabe ändern; Zweifel = Empfehlung. Belegzeile: gilt als „2 Mittel“, wenn sie zwei verschiedene M-Nummern nennt. Den Befund selbst belegen bei Sprachfehlern die Rendering-Ausgabe und die Sprachnorm, siehe Abschnitt 4.

### Unit `fundament.reading-and-listening`

| ID | Befund | Beleg | Korrekturvorschlag |
|---|---|---|---|
| …card-1 (Notennamen im Violinschlüssel) | ok; Zweifel gering: „ein b erniedrigt“ und im nächsten Satz „heißt auf Deutsch B“ mischen Zeichen b und Ton B | M1+M2 (g¹, C D E F G A H); Text: Z-9 | optional „das ♭-Zeichen“ oder „Be“ schreiben, siehe Z-9 |
| …card-2 (Abstände lesen) | ok fachlich (kleine Terz c¹–es¹, große Terz c¹–e¹). Zweifel: DE „Zähle die Stammtöne“ benutzt einen Begriff, der erst in `notation.l1.staff` erklärt wird (EN sagt „letter names“) | M1+M2+M3; Z-10 | DE: „Zähle die Buchstabennamen (C, D, E …)“ oder Stammton erklären; „Halbtöne“ vor der Definition in card-3 |
| …card-3 (Abstände hören) | ok (C–F 4 Stammtöne/5 Halbtöne, C–G 5/7; Hörfragen tiefer Ton zuerst) | M1+M2+M3+M5 | – |
| …Lektion 1 / Artikel | ok fachlich. Zweifel Z-5: visuelle Intervallaufgaben mit `maxAccidentals:1` erzeugen oft E♯/F♭/B♯/C♭ | M5 | siehe Z-5 |
| …exercises (Übungssatz) | Zweifel Z-5 (Überforderung); Antworten alle richtig | M5 (400 Seeds, 0 Fehler), 87 von 400 visuellen Aufgaben (22 %) mit E♯/F♭/B♯/C♭, 74 verschiedene Schreibweisen | `maxAccidentals:0` oder Paare ohne E♯/F♭/B♯/C♭ |

### Unit `notation.l1.staff`

| ID | Befund | Beleg | Korrekturvorschlag |
|---|---|---|---|
| card-staff | ok (5 Linien, 4 Zwischenräume, 2. Linie von unten) | M1+M2 | – |
| card-anchor | ok (G-Schlüssel, g¹, Stammtöne C–H, „keine Versetzungszeichen“) | M1+M2+M4 | – |
| card-neighbors | fachlich ok (f¹ im 1. Zwischenraum, a¹ im 2., h¹ auf der 3. Linie; Aufgabenbereich F4–B4 = 4 Töne). Zweifel Z-7: „Im Englischen heißt der deutsche Ton H B.“ ist missverständlich | M1+M2+M5; Z-7 | „Das H heißt international B.“ |
| card-lines | ok | M1+M2 | – |
| card-spaces | ok („Mitte des Notenkopfs“ zeigt die Position) | M1+M2 | – |
| card-names | ok (E und F zweimal in der 9er-Folge) | M1+M2 | – |
| card-reading | ok (Folge G A H C D C H A = Beispiel = Bildunterschrift) | M1+M2 | – |
| Lektionen anchor / positions / reading | ok (Bereiche 65–71 / 64–77 / 64–77, nur Stammtöne, nur Namen ohne Oktave) | M5 | – |
| Artikel (staffArticle, anchorArticle, readingArticle) | ok | M1+M2+M4 | – |
| Artikel namesArticle | Zweifel Z-8: „Dieser Übungssatz fragt allein den Tonnamen E“ liest sich, als gäbe es nur E-Fragen | Text | „…fragt nur den Buchstaben (zum Beispiel E), noch nicht die Oktavlage.“ |

### Unit `notation.l1.keyboard`

| ID | Befund | Beleg | Korrekturvorschlag |
|---|---|---|---|
| card-groups | ok (C links der Zweier-, F links der Dreiergruppe; Punkte C4/F4). Beispiel nutzt C4 mit Hilfslinie im Notenbild, schadet hier nicht | M1+M2 | – |
| card-white | fachlich ok (8 weiße Tasten bis zum nächsten C, Tastenfragen C–H). Zweifel Z-7: „Auf Englisch heißt das deutsche H B.“ | M1+M2+M5; Z-7 | wie Z-7 |
| card-find | ok | M1+M5 | – |
| card-steps | **Fehler F-1:** DE „Ein Ganzton besteht aus zwei Halbtöne“ (Dativ Plural „Halbtönen“). Fachlich ok. | M1+M2+M3 für Inhalt; Rendering `resolved.txt` Zeile 266 | siehe F-1 |
| card-neighbors | ok fachlich (E–F, H–C je Halbton, C–D Ganzton). Kleinigkeit: „keine schwarze Taste“ vs. „keine Taste“ | M1+M2+M3 | optional beide Male „keine Taste dazwischen“ |
| card-signs | ok fachlich (♯ rechts, ♭ links, ♮ nach ♯ im selben Takt, Gis/As). Zweifel Z-9 (Begriff „Vorzeichen“ für Versetzungszeichen; „b ♭“) | M1+M2+M4; Z-9 | „Versetzungszeichen“ durchgehend; „das b-Zeichen ♭“ |
| card-names | fachlich ok (Cis/Des/Es, H/B, B–B♭ eine Taste links). Zweifel Z-7 („Im Englischen heißt H dagegen B“) und Z-11 (Meta-Satz „Die Daten und die Bewertung verwenden dieselben Tonhöhen…“ ohne Lernwert); „mit Be“ weicht vom Glossarbegriff „b“ ab (Z-9) | M1+M2+M4; Z-7, Z-9, Z-11 | Satz umformulieren, Meta-Satz streichen |
| card-same | ok (Cis=Des, Eis klingt auf F, Fes auf E, Schreibweise zählt bei Notennamen) | M1+M2+M3+M5 | – |
| Lektion keys / Übungssatz | ok (KEY_FIND, Fenster C4–B4, jeder Name genau einmal) | M5 | – |
| Lektion steps / Übungssatz | Inhalt ok (6 Wissensfragen Tastatur + 4 Tastenfragen); **Fehler F-1** in der Definition `knowledgeKeyboardDefinition_wholeTone`: „Abstand von zwei Halbtöne.“ | `exsample.mjs`-Ausgabe; Sprachnorm | siehe F-1 |
| Lektion accidentals / Übungssatz | Fachlich ok, Auflösung stimmt (400 Seeds). Zweifel Z-5: 25 % der Notennamen-Aufgaben sind E♯/F♭/B♯/C♭ (F♭ ist die häufigste Schreibweise); B♯ (His) und C♭ (Ces) sind 9 % und kommen in keiner Karte vor (nur E♯/F♭). Die Antwortoptionen enthalten oft gleichzeitig Ces, Fes, Eis. | M5 | Karte card-same um His/Ces ergänzen oder diese beiden Schreibweisen ausschließen |
| Artikel (layout/steps/signs/names/same) | ok fachlich; gleiche Sprachbefunde wie die Karten | M1+M2+M4 | – |

### Unit `notation.l1.register`

| ID | Befund | Beleg | Korrekturvorschlag |
|---|---|---|---|
| card-repetition | fachlich ok (E4/E5 = e¹/e², G4/G5 = g¹/g²). **Fehler F-2:** DE „den vollständigen Tonname“ | M1+M2+M4; Rendering Zeile 410 | siehe F-2 |
| card-boundary | ok (h¹→c², B4→C5, Halbton) | M1+M2+M3 | – |
| card-names | fachlich ok. Zweifel Z-6: Text „Die erste Lektion bleibt bei e¹ bis f² innerhalb der fünf Linien“, aber das Beispiel zeigt C4 (c¹) auf einer Hilfslinie, die erst in Lektion 2 erklärt wird | M1 (Hilfslinienzeile=1); Text | Beispiel mit F4/F5 und E4/E5 statt C4/C5, oder Satz auf „Übungen“ beschränken |
| card-extend | fachlich ok (D4 und G5 ohne Hilfslinie). **Fehler F-3:** en-GB Titel „Continue the staff…“ (muss stave) | M1+M2; M4 (UK: stave) | siehe F-3 |
| card-lower | ok (C4 1. Hilfslinie, B3 Zwischenraum, A3 2. Hilfslinie; a und h kleine Oktave ohne Zahl) | M1+M2+M4 | – |
| card-upper | ok fachlich (G5, A5, B5, C6; c³ dreigestrichen). Artikel-UK siehe F-3 | M1+M2+M4 | – |
| card-match | fachlich ok. **Fehler F-2:** DE „Lies den vollständigen Tonname“ | wie oben | siehe F-2 |
| card-strategy | ok | M1+M2 | – |
| Lektionen octaves / ledger / match / Übungssätze | ok (E4–F5 mit Oktave, A3–C6 höchstens 2 Hilfslinien, KEY_FIND score; Distraktoren gleicher Name in Nachbaroktave) | M5 | – |
| Artikel octavesArticle, namesArticle, lowerArticle | ok (12 Halbtöne, Helmholtz-/wiss. Zuordnung) | M1+M2+M3+M4 | – |
| Artikel upperArticle (en-GB), matchArticle (en-GB) | **Fehler F-3:** hartes „staff“ statt „stave“ | M4; `resolved.txt` | siehe F-3 |

## 4. Fehler (vor Freigabe ändern)

Bei F-1 bis F-4 liegt der Befund in der Rendering-Ausgabe der echten i18n-Instanz (`resolved.txt`, `exsample.mjs`) und folgt aus Sprachnormen: deutsche Kasus, britische Fachsprache nach hellomusictheory und Steinberg. Das ist nur 1 Mittel plus Norm. Der Sprachbefund selbst ist aber eindeutig.

- **F-1 (DE, Dativ „Halbtönen“).** Der Glossarbegriff `semitone_other` liefert nur „Halbtöne“. An diesen Stellen ist der Dativ falsch:
  - Karte `notation.l1.keyboard.card-steps` (stepsBody): „besteht aus zwei Halbtöne“.
  - `exercise.knowledgeKeyboardDefinition_wholeTone`: „Abstand von zwei Halbtöne.“ (Wissensaufgabe und Erklärung).
  - `exercise.intervalExplanation`, DE (alle visuellen und auditiven Intervallrückmeldungen): „mit einem Klangabstand von 3 Halbtöne“.
  - Vorschlag: Formulierung umbauen statt Dativform zu erwarten. Beispiele: „Ein Ganzton sind zwei Halbtonschritte“, „Klangabstand: 3 Halbtonschritte“, „Abstand von zwei Halbtonschritten“. Alternativ dem Glossar eine Dativ-Mehrzahl `semitone_dative` hinzufügen.
- **F-2 (DE, Akkusativ „Tonnamen“).** `noteName_one` ist maskulin und wird im Akkusativ ohne -n eingesetzt:
  - Karte `register.card-repetition`: „den vollständigen Tonname mit Oktavlage“.
  - Karte `register.card-match`: „Lies den vollständigen Tonname aus dem Violinschlüssel“.
  - Übungshinweis `KEY_FIND` (score): „Bestimme dann den vollständigen Tonname.“
  - Prompt `KEY_FIND` (score): „Achte auf Tonname und Oktave“ (ohne Artikel/Plural).
  - Vorschlag: „den vollständigen Tonnamen“ beziehungsweise „Achte auf Tonnamen und Oktavlage“.
- **F-3 (UK, „staff“ statt „stave“).** Das Glossar gibt UK „stave“ vor. Hartcodiert stehen aber:
  - `registerStart.extendTitle`: „Continue the staff beyond its edges“,
  - `registerStart.upperArticle`: „from the staff edge“,
  - `registerStart.matchArticle`: „Writing notes on a staff“.
  - Vorschlag: überall `$t(glossary:staff_one)` verwenden.
- **F-4 (EN, Kleinigkeiten in Übungstexten).**
  - Satzanfang klein: Hinweis „…cancelling an alteration. sharps and flats change…“ (Glossarbegriff am Satzanfang, US und UK). Ebenso Screenreader-Beschreibung „treble clef. Note 1: …“.
  - US-Hinweis 2 der Tastenaufgaben: „…is one semitone, including between E and F…“, hartcodiert, in US müsste „half step“ (Glossar) stehen, sonst bricht die US-Terminologie.
  - US „cancelling“ (US meist „canceling“).
  - Vorschlag: Sätze umstellen und Glossarverweise nutzen.

## 5. Zweifel (didaktisch/Terminologie, nicht falsch)

- **Z-5 (Überforderung durch seltene Schreibweisen).** M5 zeigt:
  - **Fundament-Lektion 1, `INTERVAL_IDENTIFY_VISUAL`** mit `maxAccidentals:1`: 74 verschiedene Schreibweisen, 22 % der Aufgaben enthalten E♯, F♭, B♯ oder C♭ (zum Beispiel C♯–E♯, D♭–F♭). Die Karten der Lektion erklären weder diese Schreibweisen noch Terzen mit Vorzeichen außer C–E♭.
  - **Tasten-Lektion 3, `NOTE_NAME` mit `maxAccidentals:1`:** 25 % E♯/F♭/B♯/C♭; His und Ces (9 %) sind nirgends eingeführt.
  - **`KEY_FIND` (name) mit `maxAccidentals:1`:** 9 % E♯/F♭.
  - Die Aufgaben sind korrekt und eindeutig bewertet. Es ist aber ein Stufe-1-Einstieg.
  - Empfehlung: erste Lektion mit `maxAccidentals:0`, in Lektion 3 entweder B♯/C♭ in `card-same` aufnehmen oder diese Schreibweisen ausnehmen.
- **Z-6.** `register.card-names` (Lektion „Oktavlagen unterscheiden“): Das Beispiel „c¹ und c²“ zeigt C4 auf der Hilfslinie, obwohl die Karte sagt, die Lektion bleibe innerhalb der fünf Linien. Entschärfen wie in der Tabelle.
- **Z-7.** Sätze der Form „Im Englischen heißt der deutsche Ton H B.“ (`staff.card-neighbors`, `keyboard.card-white`) und „Im Englischen heißt H dagegen B“ (`keyboard.card-names`). Das englische System kennt kein „H“. Besser: „International heißt dieser Ton B.“
- **Z-8.** `staff.namesArticle`: „Dieser Übungssatz fragt allein den Tonnamen E“ missverständlich (siehe Tabelle).
- **Z-9 (Begriffe b / Be / Vorzeichen).**
  - Das Glossar nennt das Zeichen „b“. Karten und Hinweise sagen „ein b erniedrigt“, „Kreuze und b“, aber auch „aus D mit Be“ und „Be-Namen“. Das deutsche B (= B♭) und das Zeichen b werden in einem Satz gemischt („Ein b … Das erniedrigte H heißt B“).
  - Karten benutzen „Vorzeichen“ (`signsBody`: „doppelte Vorzeichen“, „wie lange ein Vorzeichen gilt“; `sameBody`: „Ein Vorzeichen bedeutet außerdem nicht immer eine schwarze Taste“). Das Glossar warnt selbst, dass „Vorzeichen“ meist die Tonartvorzeichnung meint. Die Einheit heißt „Versetzungszeichen“. In Stufe 2 kommt die Vorzeichnung, dann kollidiert der Begriff.
  - Empfehlung: durchgehend „Versetzungszeichen“, Zeichenname einheitlich „♭ (Be)“ im Fließtext.
- **Z-10.** Reihenfolge in `fundament` Lektion 1: „Halbtöne“ und „Stammtöne“ werden in card-1/2 genutzt, bevor card-3 beziehungsweise die Notationseinheit sie erklärt (DE). EN umgeht das teilweise mit „letter names“.
- **Z-11.** Meta-Sätze mit geringem Lernwert: „Die Daten und die Bewertung verwenden dieselben Tonhöhen…“ (`keyboard.card-names`), „Namen und Erklärungen werden aus derselben sprachneutralen Tonhöhe erzeugt…“ (Artikel). Für Lernende eher streichen.
- **Z-12 (gering).** US/UK-Terminologie sonst konsistent: half step / whole step (US), semitone / tone (UK), measure / bar, staff / stave über das Glossar. M4 bestätigt die Begriffe, UK „staff“ gilt dort als veraltet. EN „international B“ und „alteration“ sind Germanismen, aber verständlich. Der Begriff „natural note“ ist für US akzeptabel.

## 6. Nicht geprüft / Grenzen

- Klang (Audio der Beispiele und Hörfragen) nicht geprüft; geprüft wurde nur, dass Spielreihenfolge und Intervallzuordnung der Aufgaben stimmen.
- Nicht geprüft:
  - Pixelgenauigkeit der Zeichnung (nur Layoutdaten: y-Position, Hilfslinien, Vorzeichen-Glyphen),
  - Barrierefreiheitstexte jenseits der ausgegebenen Stichproben,
  - Wiederholungsvarianten nach Fehlern,
  - Wiederholungs-Mischaufgaben aus früheren Lektionen.
- Hinweis- und Rückmeldetexte wurden nur für NOTE_NAME, KEY_FIND, INTERVAL_IDENTIFY_* und die Wissensthemen keyboard/accidentals gesichtet, nicht für alle 19 Typen.
- Literatur nur über Suchauszüge (kein Volltext). Die Lage von g¹ auf der zweiten Linie ist durch M1+M2 belegt, im Suchauszug nicht ausdrücklich genannt.

## 7. Freigabefähigkeit (nach Korrektur von F-1…F-4, soweit betroffen)

- **Sofort freigabefähig (≥2 Mittel, ohne Befund):**
  - `fundament.card-3`;
  - `staff`: card-staff, card-anchor, card-lines, card-spaces, card-names, card-reading; Lektionen anchor/positions/reading mit Übungssätzen; Artikel staffArticle, anchorArticle, readingArticle;
  - `keyboard`: card-groups, card-find, card-neighbors, card-same; Lektion keys mit Übungssatz;
  - `register`: card-boundary, card-lower, card-upper (DE/US; UK-Artikel erst nach F-3), card-strategy; Lektionen octaves/ledger/match mit Übungssätzen; Artikel octavesArticle, lowerArticle, namesArticle.
- **Freigabefähig nach Textkorrektur (Fehler):**
  - `keyboard.card-steps` und Lektion steps (F-1);
  - `register.card-repetition`, `register.card-match` (F-2);
  - `register.card-extend` (Titel, UK), UK-Artikel upperArticle und matchArticle (F-3);
  - alle DE-Intervallrückmeldungen (F-1), KEY_FIND-score-Texte (F-2), EN-Hinweise (F-4).
- **Freigabefähig mit empfohlener, aber nicht zwingender Änderung (Zweifel):**
  - `fundament.card-1`, `fundament.card-2`, fundament-Lektion/-Übungssatz (Z-5, Z-9, Z-10; Übungssatz am besten vor Freigabe auf `maxAccidentals:0`);
  - `staff.card-neighbors`, `staff.namesArticle` (Z-7, Z-8);
  - `keyboard.card-white`, `card-signs`, `card-names`, Lektion accidentals mit Übungssatz und Artikel (Z-5, Z-7, Z-9, Z-11);
  - `register.card-names` (Z-6).
- Die musiktheoretische Korrektheit aller geprüften Aussagen und Beispiele ist belegt (≥2 Mittel). Die Freigabe von Inhalt und Beispielen steht nicht an der Fachlichkeit, sondern an den Sprachfehlern F-1 bis F-4.
