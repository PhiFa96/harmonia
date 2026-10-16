# Fachlicher Prüfdurchgang Stufe 1 – Gehörbildung (ADR 0005)

Prüfobjekt: `scratchpad/dump-aural.txt` (Einheiten `aural.l1.pulse-rhythm`, `aural.l1.pitch-intervals`, je v2, Inhaltsversion 11).
Geprüft am 16.10.2026. Es wurde nichts im Repo geändert. Eigene Skripte liegen in `scratchpad/aural/`.
Die Prüfung ist unabhängig vom Autor, aber ohne Geräte und ohne Hören. Hörbarkeit am echten Klavierklang, Release der Samples und Latenz konnte ich nicht prüfen.

## Prüfmittel

| Kürzel | Mittel |
|---|---|
| M1 | Eigene Bruchrechnung mit BigInt-Brüchen. Sie parst die Rhythmus-Strings selbst und kommt ohne Engine-Dauerlogik aus (`aural/rhythm.mjs`). |
| M2 | Theorie-/Notations-Engine: `scoreTimeline`, `validateScore`, `listeningAnswer`, `evaluateExercise`, `midi`. |
| M3 | `tonal` 6.4.3 als Orakel für Intervallname, Halbtöne und MIDI (`aural/cards.mjs`, `aural/intervals.mjs`). |
| M4 | Eigene Tabelle (Stammtonabstand : Halbtonabstand zu Intervallname) und eigene Neuberechnung der Antworten. |
| M5 | Generator-Läufe mit 4000 bis 6000 Seeds je Frage (`aural/gen.mjs`, `aural/intervals.mjs`, `aural/texts.mjs`). |
| M6 | Quellcode-Lektüre: `listening.ts`, `generate.ts`, `lesson.ts`, `feedback.ts`, `exercise-task.tsx`, `play-listening.ts`, `play-rhythm.ts`, `de.ts`. |
| M7 | Literatur über WebSearch, nur Suchauszüge, kein Volltext (Quellen am Ende). |
| M8 | Gerenderter Text über die echte i18next-Instanz in DE, US und UK (`aural/render.mjs`). 65 Schlüssel, 0 offene `$t(...)`-Verweise. |

Vorhandene Tests: `listening.test.ts` und `pulse.test.ts` laufen grün (27 Tests). Sie fangen den Fehler F1 nicht ab.

## Fehler (müssen vor Freigabe behoben werden)

| ID | Befund | Beleg | Korrekturvorschlag |
|---|---|---|---|
| F1 | **Hinweis 2 zeigt in allen Hörfragen (LISTENING_CHOICE) „Der Klangabstand beträgt NaN Halbtöne“.** Das betrifft Pulsgruppen, Rhythmus gleich/verschieden, Rhythmusauswahl, Tonrichtung und Melodievergleich, außerdem `history.l1.overview.observation` und alle Level-2-Hörformen. In DE, US und UK steht überall NaN. Der vorgesehene Text `exercise.listeningHint2` wird nie angezeigt. | M5, M6, **≥2 Mittel**. `texts.mjs` liefert für alle 5 Fragen H2 = „… NaN Halbtöne“. `feedback.ts` Z. 722–731: `hintText` hat keinen LISTENING_CHOICE-Zweig und fällt auf die Intervall-Rückfallregel `hint.level === 2 && !('pitch' in item)`. Mit `semitones: undefined` ergibt das `Number(undefined)` = NaN. Der Test prüft nur „nicht leer / keine `$t(`“. | In `hintText` vor der Rückfallregel einen Zweig `if (item.type === 'LISTENING_CHOICE') return translate(locale, hint.key, hint.values);` einfügen. Einen Test ergänzen: Hinweis 2 enthält weder „NaN“ noch „undefined“ und gleicht dem Text von `exercise.listeningHint2`. |
| F2 | **Deutsche Kasusfehler im Lösungshinweis und in der Rückmeldung der Hörintervalle.** „…mit einem Klangabstand von 5 Halbtöne.“ muss „von 5 Halbtönen“ heißen. Der Fehler betrifft Hinweis 3 und die Rückmeldung aller Intervallaufgaben, also auch `aural.l1.pitch-intervals.intervals`. | M5, M8, M6. `de.ts` Z. 1559 `intervalExplanation` verwendet `{{distance}}` im Nominativ, aus `halfSteps_other`. | Den Satz umstellen, etwa „Klangabstand: {{distance}}.“ oder „…, der Klangabstand beträgt {{distance}}.“. Alternativ einen eigenen Dativ-Schlüssel `halfSteps_dative_other` anlegen. In EN gibt es das Problem nicht. |

Die beiden Fehler betreffen Programm bzw. i18n-Oberflächentexte, nicht die Fachaussagen der Karten. Die Karten selbst sind fachlich korrekt (siehe unten).

## Tabelle je Lektion und Karte

Legende: ok = fachlich korrekt. Zweifel = kein Sachfehler, aber Präzisierung oder Risiko. „≥2“ heißt mindestens zwei unabhängige Mittel. „1“ heißt nur ein Mittel.

### Einheit aural.l1.pulse-rhythm

| ID | Befund | Beleg (Mittel) | Korrekturvorschlag |
|---|---|---|---|
| aural.l1.pulse-rhythm.pulse (Lektion, 8 × `pulse`) | **ok** (Fachlogik). Gruppen eindeutig: Der Generator spielt 2 × n Viertel mit C6 (MIDI 84) als Gruppenstart und G5 (79) sonst. Es gibt keine Pause zwischen den Gruppen, die hohen Töne liegen genau n Schläge auseinander. Die Antwort n ∈ {2,3,4} war in 6000 Seeds 0 × falsch (1975/2078/1947 je n) und das Tempo ist gleichverteilt (72/90/108). Der Vorspann „höherer Startklang = 1“ löst die bekannte subjektive Rhythmisierung (gleiche Klänge werden vom Hörer in 2er, 3er, 4er gruppiert) eindeutig auf. | ≥2 (M5 eigene Neuberechnung der Onsets und Töne + M7 Literatur zur subjektiven Rhythmisierung) | Zweifel Z2 beachten. Nach Behebung F1 freigabefähig. |
| aural.l1.pulse-rhythm.card-steady | **ok**. 2/4 und 3/4 mit je zwei gespielten Gruppen sind zählbar richtig. Der Text „Klicks“ stimmt für die Karten-Pulsbeispiele (`play-rhythm.ts`: 70 ms kurze C6/G5-Töne mit Velocity 0,3/0,18, also Höhe und Lautstärke). | ≥2 (M6 `play-rhythm.ts` + M8) | – |
| aural.l1.pulse-rhythm.card-pulse-rhythm | **ok**. Vier Viertel und die Variante mit zwei Achteln im ersten Schlag sind richtig beschrieben. 1. Beispiel: 4 Einsätze bei 0,1,2,3. 2. Beispiel: Einsätze bei 0, ½, 1, 2, 3. | ≥2 (M1 + M2) | – |
| aural.l1.pulse-rhythm.card-group-start | **ok** / **Zweifel Z2**. Die Zählregel ist richtig. „Lautstärke und Klanghöhe helfen“ gilt für das Kartenbeispiel (Velocity + Höhe), aber nicht in der Übungsaufgabe. | ≥2 (M6, M5) | Siehe Z2. |
| aural.l1.pulse-rhythm.compare (Lektion, 10 × `rhythm-compare`) | **ok**. Gleich/verschieden wird exakt nach Einsatz und Dauer entschieden. Die 6 Rhythmen sind exakt je 1 ganze Note lang, 15 von 15 Paaren sind sowohl nach Einsatzmuster als auch nach Dauern verschieden. Es gibt keine Paare mit gleichen Einsätzen und verschiedenen Dauern. Antwortverteilung 2994 same : 3006 different, Tonhöhe konstant G4. Der Variantenschlüssel erzwingt bei Wiederholung einen anderen Klang und eine andere Antwort. | ≥2 (M1 Brüche + M2 Engine-Timeline, vollständige Übereinstimmung der Onsets und Dauern; M5) | – |
| aural.l1.pulse-rhythm.card-compare | **ok**. A und B sind identisch (`G4/4 G4/8 G4/8 G4/4 G4/4`). Die zweite Zählzeit (Intervall 1 bis 2 Viertel) ist geteilt. Die Bildunterschriften stimmen. | ≥2 (M1 + M2) | – |
| aural.l1.pulse-rhythm.card-changed | **ok**. Beide Takte haben 5 Einsätze und 4/4 insgesamt. A: ½-Einsatz in Zählzeit 1, B: Einsatz bei 1½, also Zählzeit 2. | ≥2 (M1 + M2) | – |
| aural.l1.pulse-rhythm.card-silence | **ok**. `G4/8 G4/8 G4/4 r/4 G4/4`: Die Viertelpause liegt von 2 bis 3 Viertel, also auf Zählzeit 3. Das 2. Beispiel ersetzt sie durch eine Viertel. Beide Takte sind 1 ganze Note lang. | ≥2 (M1 + M2) | – |
| aural.l1.pulse-rhythm.choice (Lektion, 12 × `rhythm-choice`) | **ok**. 3 Kandidaten sind in 6000 Seeds immer paarweise nach Einsatzmuster verschieden (0 Kollisionen), genau 1 Kandidat entspricht dem Klang, Tonhöhe konstant. Die richtige Antwortnummer ist gleichverteilt (1996/2012/1992). Kein Hinweis aus der Nummer. | ≥2 (M5, M1) | Zweifel Z4 für die Lücken-Hörbarkeit. |
| aural.l1.pulse-rhythm.card-match | **ok**. `G4/4 G4/4 G4/8 G4/8 G4/4`: Zwei Achtel bilden die 3. Zählzeit (Einsätze 2 und 2½). | ≥2 (M1 + M2) | – |
| aural.l1.pulse-rhythm.card-values | **ok**. Viertel, zwei Achtel, Viertel, Viertel. Summe = 1/1. Eine Viertel dauert 1 Pulsschlag, zwei Achtel teilen ihn gleich. US „quarter note / eighth notes“ und UK „crotchet / quavers“ stimmen. | ≥2 (M1 + M8 Glossarauflösung) | – |
| aural.l1.pulse-rhythm.card-rest-choice | **ok**. `G4/4 r/8 G4/8 G4/4 G4/4`: Achtelpause nach der ersten Viertel (Pause von 1 bis 1½). Die Aussage „beginnen mit einem Ton, keine Vorzeichen oder Punktierungen“ gilt für alle 6 Rhythmen (geprüft). | ≥2 (M1 + M2) | Zweifel Z4 („Lücke“). |
| aural.l1.pulse-rhythm.article | **ok**. Der Artikel ist textgleich mit den 9 Karten, 99 Schlüssel je Sprache bis auf den Titel (programmatischer Vergleich). | 1 (M8-Diff) – nichts Eigenes zu prüfen | – |
| Einheit: Beobachtung Rhythmus allgemein | **ok**. Rhythmen enthalten nur Viertel, Achtel und Pausen ohne Punktierung. Das passt zum Kartentext „Viertel-Achtel-Folgen“. Die Pause R4 (`r/4`) und R5 (`r/8`) tauchen im Text als Pausen auf. | ≥2 (M1 + M2) | – |

### Einheit aural.l1.pitch-intervals

| ID | Befund | Beleg (Mittel) | Korrekturvorschlag |
|---|---|---|---|
| aural.l1.pitch-intervals.direction (Lektion, 8 × `pitch-direction`) | **ok**. 2 Töne als Halbe nacheinander. Start ∈ {F4,G4,A4,B4}, Ziel ∈ {E4..D5}. Antwort 0 × falsch in 6000 Seeds (up 3010, down 2133, repeat 857). Der kleinste von null verschiedene Abstand beträgt 1 Halbton (E4–F4, B4–C5, je ca. 3,5 %). Das ist klar hörbar (Z6). | ≥2 (M2 Auswertung + M4 eigene Vorzeichenrechnung auf MIDI; M5) | Z6 beachten. Nach Behebung F1 freigabefähig. |
| aural.l1.pitch-intervals.card-higher | **ok**. f¹ = F4 (MIDI 65), a¹ = A4 (69), also zweiter Ton höher. | ≥2 (M3 tonal + M4 Helmholtz-Tabelle) | – |
| aural.l1.pitch-intervals.card-lower | **ok**. a¹–f¹ = A4–F4 abwärts. „Notenbild bleibt in Hörfragen verborgen“ ist im UI belegt (`exercise-task.tsx` zeigt es erst nach Wertung oder bei Hinweis 3, bei `rhythm-choice` sind die Kandidaten per Design sichtbar). Der Satz „Stelle dir keine leisere Lautstärke …“ ist holprig. | ≥2 (M3 + M6) | Redaktionell: „Verwechsle ‚leiser‘ nicht mit ‚tiefer‘.“ Optional ergänzen: „außer bei Hinweis 3“. |
| aural.l1.pitch-intervals.card-repeat | **ok**. Zwei getrennte Einsätze `F4/2 F4/2`, ohne Haltebogen. | ≥2 (M2 + M6) | – |
| aural.l1.pitch-intervals.melodies (Lektion, 10 × `melody-compare`) | **ok**. 4 Viertel aus E4..C5. „Gleich“ gilt nur bei identischer Tonhöhenfolge. 0 × falsche Antwort in 6000 Seeds (same 2986 / different 3014). Bei „verschieden“ weicht genau 1 Position ab (Position 1 bis 4 je ca. 25 %). Es gibt keine Transpositionen. Der Text „ähnlicher Verlauf oder Transposition ist nicht gleich“ ist damit konsistent. Siehe Z3 und Z6. | ≥2 (M2 + M4 eigene Tonhöhenfolgen-Vergleiche; M5) | Z3 und Z6 beachten. |
| aural.l1.pitch-intervals.card-same | **ok**. F4 G4 A4 G4 (65 67 69 67) in A und B identisch. | ≥2 (M3 + M2) | – |
| aural.l1.pitch-intervals.card-changed-note | **ok** / **Zweifel Z3**. A = F G A G, B = F A A G (MIDI 65 67 69 67 gegen 65 69 69 67), nur Platz 2 weicht ab, Dauern gleich. | ≥2 (M3 + M4) | Siehe Z3. |
| aural.l1.pitch-intervals.card-memory | **ok**. G4 E4 F4 G4 = 67 64 65 67, also Anfang g¹, Mitte e¹–f¹, Ende g¹. | ≥2 (M3 + M4) | – |
| aural.l1.pitch-intervals.intervals (Lektion, 3 × 4 × `INTERVAL_IDENTIFY_AURAL`) | **ok**. 4000 Seeds je Teilsatz. Alle Paare sind aufwärts, natürlich, im Bereich MIDI 64–77, und jedes ist 0 × anders benannt als M3/m3/P4/P5 nach **eigener Tabelle UND tonal UND Engine** (drei Quellen gleich). Es sind nie zwei Antworten mit gleichem Halbtonabstand wählbar (4/3/5/4 Tonpaare, je Intervall gleichverteilt). Beschriftungen: DE „kleine Terz, große Terz, reine Quarte, reine Quinte“, US/UK „minor third“ usw. Wiederholung bei Fehler = neues Tonpaar (Variantenschlüssel enthält from/to). | ≥3 (M3 tonal + M4 eigene Tabelle + M2 Engine; M5) | F2 und Z1 beachten. |
| aural.l1.pitch-intervals.card-thirds | **ok**. E4–G4 = 3 Halbtöne = m3. F4–A4 = 4 = M3. „Kleine Terz drei Halbtöne, große vier“ ist richtig. US „half steps“, UK „semitones“ wird korrekt aus dem Glossar eingesetzt. Z5 (Grammatik EN). | ≥2 (M3 + M4; M8) | Z5. |
| aural.l1.pitch-intervals.card-fourth-fifth | **ok**. E4–A4 = P4 = 5 Halbtöne. E4–B4 = P5 = 7. DE `h¹` und international `B4` sind richtig lokalisiert. Die Behauptung, dass die Aufgabe „auch in anderer Tonlage“ beginnt, trifft zu (Starttöne E4 bis C5). | ≥2 (M3 + M4) | – |
| aural.l1.pitch-intervals.card-interval-choice | **ok**. G4–B4 = M3. Die Aussage „aufwärts, natürliche Töne“ stimmt (0 Verstöße in 12000 Aufgaben). Die Aussage „Fehlerwiederholung erhält neuen Klang“ stimmt (`itemVariantKey`). | ≥2 (M3 + M6/M5) | Z1 (Hörhinweis). |
| aural.l1.pitch-intervals.article | **ok**. Der Artikel ist textgleich mit den 9 Karten (96 Schlüssel je Sprache bis auf den Titel). | 1 (M8-Diff) | – |

## Zweifel (kein Sachfehler, aber nachbessern empfohlen)

| ID | Befund | Beleg | Vorschlag |
|---|---|---|---|
| Z1 | **Hinweis 2 verrät bei Hörintervallen faktisch die Lösung.** „Der Klangabstand beträgt 5 Halbtöne“ plus die Karte „Quarte = 5 Halbtöne“ löst die Aufgabe ohne Hören. Hinweise 1–2 sind nach F11 erlaubt, mindern nur die XP-Gewichtung (0,9/0,8) und zählen für 80 % mit. Eine Lektion ist so ohne Hörleistung bestehbar. Ähnlich: Die Karte enthält keinen realistischen Hörhinweis. Nach Literatur sind P4 und P5 für Anfänger untereinander schwer zu trennen (Strategie: abwechselnd hören), Terzen dagegen leicht zu den anderen. M3 gegenüber m3 erkennt man oft am Dur- bzw. Moll-Dreiklangsklang. | **1 Mittel** (M6 Code + M7 Literatur nur als Suchauszug) | Hinweis 2 für `INTERVAL_IDENTIFY_AURAL` ersetzen, z. B. durch einen Hörhinweis („Terzen klingen eng, Quinten weit; hör erst den Ausgangston, dann den Zielton“). Die Halbtonangabe nur in Hinweis 3. Alternativ Hörintervall-Hilfe 2 als „Hörhilfe“ für F11 zählen. Das ist eine Produktentscheidung, nicht fachlich zwingend. |
| Z2 | **Karte „Pulsgruppen“ passt nur zum Kartenbeispiel, nicht zur Übungsaufgabe.** Die Karte spricht von „Klicks“ und „Lautstärke und Klanghöhe“. Die Übung `pulse` spielt dagegen volle Klaviertöne C6/G5 mit gleicher Standard-Velocity, also nur Tonhöhenakzent (`play-listening.ts`, `listening.ts`). Der Gruppenanfang ist trotzdem eindeutig, aber die Lernenden hören keine Lautstärkeakzente. | M6 + M5 (**≥2**) | In `card-group-start` / `card-steady` ergänzen: „In den Aufgaben ist der Gruppenanfang nur durch die höhere Tonhöhe markiert.“ Oder die Übung mit Velocity-Akzent spielen. |
| Z3 | **Karte „Die erste abweichende Tonhöhe finden“ suggeriert Änderungen nur in der Mitte.** Titel und Text sagen, dass Anfang und Ende gleich bleiben und „in diesen Beispielen“ nur die zweite Tonhöhe abweicht. Der Generator ändert jede der 4 Positionen gleich oft (ca. 25 % Position 1, 25 % Position 4). | M5 + M6 (**≥2**) | Ergänzen: „In den Aufgaben kann jeder der vier Töne abweichen, auch der erste oder letzte.“ Titel eventuell „Eine abweichende Tonhöhe finden“. |
| Z4 | **„Lücke“ in Karte `card-rest-choice` hängt vom Ausklang des Klaviersamples ab.** Der Code spielt Noten mit ihrer notierten Dauer (`playPitch(..., {duration})`) und Pausen als echte Stille. Ob eine Achtelpause bei 72 bis 108 BPM als Lücke gehört wird oder nur als „fehlender Einsatz“, ist ohne Geräte nicht prüfbar. Die Rhythmusauswahl bleibt aber immer an den **Einsatzzeiten** entscheidbar. Alle 15 Paare haben verschiedene Onset-Muster. | **1 Mittel** (M6 Code; Hören nicht geprüft) | Beim Gerätetest gezielt R4 (Pause Zählzeit 3) und R5 (Achtelpause nach der Viertel) anhören. Den Kartentext vorsichtshalber auf „fehlender Einsatz an der Pausenstelle“ umformulieren. |
| Z5 | **EN-Grammatik in `card7Body` (US und UK):** „Both are a third“ muss „Both are thirds“ heißen. Der Verweis `$t(glossary:third_one)` ist hier im Singular. DE ist korrekt („Beide heißen Terz“). | M8 (**1 Mittel**, reine Sprachprüfung) | `$t(glossary:third_other)` verwenden: „Both are thirds“. |
| Z6 | **Schwierigkeit der Melodie- und Richtungsfragen für Anfänger.** Im Melodievergleich unterscheiden sich 13,5 % der „verschieden“-Aufgaben (408 von 3014) nur um 1 Halbton an einer Stelle, und 35 % der Abweichungen lassen die Kontur unverändert. 71 % der Melodien enthalten Tonwiederholungen. Beim Richtungsvergleich liegt der kleinste Abstand bei 1 Halbton. Das ist fachlich korrekt und im Text offen gemacht („ähnlicher Verlauf ist nicht gleich“). Laut Literatur-Suchauszügen erreichen Nichtmusiker die Halbtonschwelle bei Intervallen nicht zuverlässig, die Quellen widersprechen sich hier. | **1 Mittel** (M5 für Zahlen; M7 mit unklarer Lage) | Kein Fehler. Beim Beta-Test beobachten. Optional einen leichteren Einstieg (kleinste Änderung mindestens 2 Halbtöne) für die ersten Wiederholungen. |
| Z7 | **`listeningHint2` ist inhaltlich allgemein.** Die Hilfe nennt „historische Aussagen brauchen zusätzliche Quellen“, was in Puls- und Tonrichtungsaufgaben deplatziert wirkt. Wird mit F1 sichtbar. | M6 (**1 Mittel**) | Hinweis 2 nach Fragetyp aufteilen (Rhythmus, Tonhöhe, Beobachtung). |

## Weitere geprüfte Punkte

| Prüfpunkt | Ergebnis | Beleg |
|---|---|---|
| Hörfragen mehrdeutig? | Nein. Pulsgruppen, Rhythmusvergleich, Rhythmusauswahl, Tonrichtung, Melodievergleich und Hörintervalle haben nach Bewertungs- und Antwortlogik genau eine richtige Antwort (6000 Seeds je Frage, 0 Abweichungen; `listening.test.ts` 200 Seeds grün). | M2, M4, M5 (≥2) |
| Verraten Fragetexte, Labels oder Beschreibungen die Lösung? | Nein. Fragetexte, Antwortlabels („Notenbild n“, „Pulsgruppe mit n Schlägen“), Barrierefreiheitsbeschreibung (`exerciseDescription` = Fragetext) und die versteckte Notenansicht verraten vor der Wertung nichts. Erst Hinweis 3 und die Rückmeldung nennen die Antwort, das ist so gewollt. Z1 siehe oben. | M5, M6 (≥2) |
| Text und Beispiel-Score passen zusammen | Ja, alle 18 Kartenbeispiele (Unterschriften gegen Einsätze und Tonhöhen). | M1+M2 (Rhythmus), M3+M4 (Tonhöhen) |
| US/UK/DE-Terminologie | quarter/eighth note, measure, practice, half step gegen crotchet, quaver, bar, practise, semitone: korrekt. Pause/rest, Takt/measure/bar, Puls/pulse: korrekt. Der Rest ist in Z5 und F2 vermerkt. | M8 |
| Hörbeobachtung (`observation`) | **Nicht im Prüfobjekt**: Sie steckt in `history.l1.overview.observation`. Der Generator liefert 6000 Seeds mit konsistenter Antwort (3005 einzeln, 2995 zugleich). Die zwei Ablenker (Jahr, Ort) sind nicht hörbar belegbar. Karten und Texte dieser Lektion wurden **nicht fachlich geprüft** (in dump-history.txt). | M5 (**1 Mittel**, nur Generatorlogik) |
| Hörintervalle ohne absolutes Gehör unterscheidbar | Technisch ja: Es wird nur das Verhältnis der Töne gefragt, kein Tonname. Auf Natürliche Töne E4–F5 beschränkt, aufwärts melodisch. Die Unterscheidbarkeit für echte Lernende ist ohne Hörtest nicht belegbar (Z1, Z6). | M7 nur Suchauszug + M6 (**1 Mittel**) |

## Zusammenfassung

- Geprüft: 2 Einheiten, 6 Lektionen (davon eine mit 3 Teilsätzen), 18 Karten je in DE, US und UK, 2 Artikel (textgleich mit den Karten), 6 Übungssätze und 5 Generatoren mit zusammen mehr als 40000 Seeds, 65 Textschlüssel in 3 Sprachen.
- Fehler: **2**. F1: Hinweis 2 „NaN Halbtöne“ in jeder Hörfrage (Code, i18n-Zweig fehlt). F2: DE-Dativ „von 5 Halbtöne“ in der Intervallerklärung.
- Zweifel: **7** (Z1 bis Z7). Davon sind Z2, Z3 und Z5 reine Textpräzisierungen und Z4 und Z6 offene Hörbarkeitsfragen, die nur am Gerät beantwortbar sind.
- Fachliche Aussagen der Karten, die Rhythmen (Bruchrechnung), die Intervalle (Engine, tonal, eigene Tabelle) und die Bewertungslogik sind alle ohne Befund.
- Mit **≥2 unabhängigen Mitteln** geprüft: alle Rhythmen und Karten, alle Intervall- und Tonhöhenangaben, Antwortlogik aller Hörfragen, Variantenwechsel. Nur **1 Mittel**: Z1, Z4, Z5, Z6, Z7, die Hörbeobachtung (nur Generator) und die wahrnehmungsbezogene Unterscheidbarkeit (Literatur nur als Suchauszug).
- Freigabefähig nach Korrektur F1 und F2 (Texte der Karten selbst sind unverändert fachlich in Ordnung): `aural.l1.pulse-rhythm` mit pulse, compare, choice und `aural.l1.pitch-intervals` mit direction, melodies, intervals, alle 18 Karten und beide Artikel. Z2 und Z3 sollten vorher als Textzusatz eingearbeitet werden.
- **Heute nicht freigeben**, bis F1 und F2 behoben sind. F1 trifft auch `history.l1.overview.observation` und die Hörformen der Stufe 2.
- Nicht geprüft: Hören am Gerät, Klavier-Release, Latenz, App-seitiger Audio-Skip, Tempo-Hörbarkeit. Außerdem Unterricht-/Stufe-2-Hörformen (`rhythm-choice-dotted` usw.), nur Generatorcode dazu gelesen.

## Quellen (nur Suchauszüge)

- Halbtonmaße der Intervalle sowie Hörtipps zu Terzen und Quarte/Quinte: Suchtreffer von musical-u.com („interval ear training tips and tricks“), trainer.thetamusic.com und Wikiversity „Ear training“. Das Ergebnis bestätigt nur Größen und Hörhilfen, keinen Text übernommen.
- Subjektive Rhythmisierung (Bolton 1894; Bååth 2015, Music Perception): sumsar.net/papers und lu.se/lup. Das Ergebnis: gleiche, isochrone Klänge werden vom Hörer meist in 2er-, 3er- oder 4er-Gruppen gehört. Dies begründet den Tonhöhenakzent am Gruppenanfang.
- Tonhöhenunterscheidung Musiker gegenüber Nichtmusikern (PMC3774646, PMC3131151): Quellenlage zur Halbtonschwelle bei Nichtmusikern widersprüchlich in den Auszügen. Volltext wurde nicht gelesen.
