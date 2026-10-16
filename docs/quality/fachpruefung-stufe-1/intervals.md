# Fachlicher Prüfdurchgang Stufe 1 – Intervalle (ADR 0005)

Prüfer: unabhängiger Durchgang, frischer Kontext. Repo nur gelesen, keine Repo-Dateien geändert.
Prüfobjekt: `scratchpad/dump-intervals.txt` (Einheiten `intervals.l1.size`, `intervals.l1.first-qualities`; 6 Lektionen, 18 Karten, 2 Artikel, 6 Übungssätze mit 14 Parameterblöcken; DE/US/UK).
Zusätzlich gelesen (nicht im Dump, aber Teil der Intervall-Lernstrecke): Rückmeldetexte `exercise.intervalReading*`, `question_interval_*`, Glossareinträge Intervall/Prime/…/Halbton/Ganzton/Tritonus/Tonschritt/Tonsprung.

## Prüfmittel (Skripte nur im Scratchpad: `scratchpad/rev-intervals/*.mts`)

- **M1 Engine** (`packages/theory`: `intervalBetween`, `semitones`, `invert`, Generator/Bewertung aus `packages/exercises`).
- **M2 tonal 6.4.3** (unabhängiges Orakel, `Interval.distance/get/invert`).
- **M3 eigene Tabelle** (nur Buchstabenposition + Tonklasse, ohne Engine-Code).
- **M4 Literatur** (WebSearch-Auszüge; Wikipedia „Interval (music)“, „Tritone“, „Steps and skips“; musictheory.net; earmaster; Univ. Wien Tonsatz-Propädeutikum als Listenquelle für „ü4/v5“; Oxford/Collins-Wörterbucheinträge zu half step/semitone). Nur Suchauszüge, keine Volltexte.
- **M5 Bestehende Repo-Tests**: `interval.test.ts`, `interval.tonal.test.ts`, `interval-naming.test.ts` laufen grün (158 Tests).

Durchgeführte Läufe:

1. `check-examples.mts`: alle 30 Beispiel-Scores der Karten. Jedes Paar wurde mit M1, M2 und M3 auf Nummer, Halbtöne und Qualität verglichen und gegen die in der Bildunterschrift behauptete Nummer, Halbtonzahl und Qualität geprüft. Ebenso geprüft: Tastaturausschnitt `keyboard.first/last` gegen die MIDI-Werte, Helmholtz-Namen (e¹, h¹, d², f² …) und US-Namen (E4 …) in den Bildunterschriften. Ergebnis: 30/30 ohne Abweichung.
2. `check-claims.mts`: alle natürlichen Paare C3–C6 bis zur Oktave (364). M1 = M2 = M3, 0 Abweichungen. Dazu die Zähl- und Tastenbehauptungen aus den Fließtexten (Stammtonfolgen, schwarze Tasten, Übergänge, Tritonus, Umkehrung, Enharmonik).
3. `check-exsets.mts`: für jeden der 14 Parameterblöcke 3000 Seeds über den echten Generator `generateVisualInterval`. Die erwartete Antwort wurde aus den zwei sichtbaren Noten mit M3 plus M2 neu berechnet und mit `intervalReadingAnswer` verglichen. Zusätzlich geprüft: genau eine Antwortoption ist laut `evaluateExercise` richtig, mindestens zwei Optionen, Tonbereich 64–77, keine Vorzeichen. Ergebnis: 42 000 Items, 0 Fehler.
4. `third-range.mts`: Stichprobe außerhalb des Lehrumfangs (Terzen mit Vorzeichen, Enharmonik).

## Bewertungsschlüssel

- ok (≥2) = mindestens zwei unabhängige Mittel stimmen mit der Aussage überein.
- ok (1) = nur ein Mittel (hier: Aussage ist Didaktik, Sprache oder Terminologie).
- Zweifel = nicht falsch, aber missverständlich oder unvollständig.
- Fehler = sachlich falsch. **Es wurde kein Fehler gefunden.**

---

## A. Einheit `intervals.l1.size` (Abstand und Richtung)

| ID | Befund | Beleg | Korrekturvorschlag |
|---|---|---|---|
| `intervals.l1.size.card-count` (E4–G4, Terz, Zählen inkl. beider Enden) | ok (≥2) | M1+M2+M3: E–F–G = Nr. 3 (zusätzlich 3 HT = kleine Terz, Text sagt nur „Terz“, korrekt); M4: Zählregel (musictheory.net: C–E Terz, C–G Quinte) | – |
| `…card-small` (Prime, Sekunde, Terz; G4–G4, E4–F4) | ok (≥2) | M1+M2+M3; Zählung 1–2–3; „Startton zählt als 1“ | – |
| `…card-large` (Quarte–Oktave; E4–A4, E4–D5, E4–E5) | ok (≥2) | M1+M2+M3: 4/7/8 Positionen, Pfade EFGA / EFGABCD / EFGABCDE; „nach H folgt C der nächsten Lage“ (B4→C5) | – |
| `…card-up` (G4–B4 aufwärts) | ok (≥2) | M1+M3: Richtung +1; Nr. 3; Helmholtz g¹/h¹ = G4/B4 | – |
| `…card-down` (B4–G4 abwärts) | ok (≥2) | M1+M3+M2: Richtung −1, Nr. 3; „Terz bleibt Terz bei umgekehrter Reihenfolge“ | – |
| `…card-same` (A4–A4) | ok (≥2) | M1+M2+M3: Nr. 1, 0 HT, Richtung „gleich“; im Generator ergibt P1 stets `interval-direction:same` | – |
| `…card-repeat` (F4–F4) | ok (≥2) für Notation/Nummer; **Klangaussage „zwei getrennte Einsätze“ nicht akustisch geprüft** | M1+M2+M3 (Prime); Partitur hat zwei getrennte Halbe ohne Haltebogen | Hör-Eindruck bei der Geräteabnahme prüfen (nicht Teil der fachlichen Theorie). |
| `…card-step` (E4–F4 Halbton, F4–G4 Ganzton, beide Sekunde) | ok (≥2) | M1+M2+M3: m2/1 HT und M2/2 HT; US „half step/whole step“, UK „semitone/tone“ gemäß Glossar; M4 (Steps and skips: Schritt = kleine/große Sekunde) | – (UK-Bildunterschrift „a step with a tone distance“ ist holprig, aber korrekt). |
| `…card-leap` (G4–B4 über A, E4–B4, F4–D5; „ab der Terz Sprung“) | Zweifel (gering, nur Terminologie) | Zahlen/Pfade ok (≥2: M1+M3, M2). Die Einteilung „ab Terz = Sprung“ ist durch „in dieser Einheit“ eingeschränkt. M4: Quellen uneinheitlich. Manche Quellen nennen eine Terz „skip“ und reservieren „leap“ für Quarte und größer, AP-Material nennt alles über der Sekunde „leap“. Deutsch („Terzsprung“, Schritt = Sekunde) ist unstrittig. | Nur EN: einen Halbsatz ergänzen, z. B. „some textbooks call a third a ‘skip’ and reserve ‘leap’ for fourths and wider; here both are called leaps“. Optionaler Hinweis, kein Fehler. Siehe auch ADR-/Glossarnotiz zu `melodicLeap`. |
| `intervals.l1.size.numbers` (Lektion, `EXSET`, 2 Blöcke `number`, up) | ok (≥2) | 6000 Items: Antwort aus Score (M3+M2) = Generator; genau eine richtige Option; Nummern 1–4 bzw. 5–8 vollständig abgedeckt | – |
| `intervals.l1.size.direction` (2 Blöcke `number`/`direction`, both) | ok (≥2) | 6000 Items: dito; Antworten up/down/same alle vorhanden; `same` nur bei Prime | – |
| `intervals.l1.size.motion` (2 Blöcke `direction`/`motion`) | ok (≥2) | 6000 Items: dito; Verteilung repeat/step/leap = 1/2/3–8 | – |
| `intervals.l1.size.article` (Zusammenstellung der 9 Karten) | ok (≥2) | identische Texte wie die Karten, siehe oben | – |

## B. Einheit `intervals.l1.first-qualities` (erste Intervallqualitäten)

| ID | Befund | Beleg | Korrekturvorschlag |
|---|---|---|---|
| `…card-transitions` (Zählung ab 0, E4–F4 = 1, G4–G4 = 0; Klaviaturausschnitt 64–65 / 67–67) | ok (≥2) | M1+M2+M3: 1 bzw. 0 HT; Tastenbereiche = MIDI-Werte; Abgrenzung zur Intervallnummer (ab 1) korrekt | – |
| `…card-black-keys` (F–Fis–G = 2, G–Gis–A–Ais–H = 4; „zwischen E–F und H–C keine schwarze Taste“) | ok (≥2) | M1+M3: 2 bzw. 4 HT; schwarze Tasten laut MIDI-Mod-12 = 66 bzw. 68,70; E–F und H–C ohne schwarze Taste | – |
| `…card-larger` (E4–A4 = 5, E4–E5 = 12; abwärts positive Abstandszahl) | ok (≥2) | M1+M2+M3 | – |
| `…card-third-number` (A–H–C, E–F–G, F–G–A = Terz; „kann bei Terzen drei oder vier betragen“) | Zweifel (gering) | Für natürliche Töne korrekt: Terzen haben ausschließlich 3 oder 4 HT (M1+M3, M2 über alle 364 Paare). Allgemein aber unvollständig: d3 = 2 HT (C♯–E♭; M1+M2), übermäßige Terz = 5 HT (C–E♯, nur konstruiert, nicht geprüft). M4: Qualitäten verminderte/übermäßige existieren auch bei Terzen. | DE/US/UK ergänzen: „Bei den natürlichen Tönen dieser Einheit beträgt der Abstand drei oder vier Halbtöne.“ So entsteht später kein Widerspruch zu verminderten/übermäßigen Terzen. |
| `…card-minor` (E4–G4 = kleine Terz, 3 HT; e–f–fis–g; abwärts gleich groß) | ok (≥2) | M1+M2+M3: m3/3 HT; schwarze Taste Fis; Qualität unabhängig von Richtung (Generator liefert für Abwärts-Terzen ebenfalls m3/M3) | – |
| `…card-major` (F4–A4, G4–B4 = große Terz, 4 HT) | ok (≥2) für alle Zahlen. Hinweis zu Satz 4 (s. rechts) | M1+M2+M3: M3/4 HT. Satz „Zwei Terzen sehen daher nicht zwangsläufig unterschiedlich weit auseinander aus“ ist wahr (kleine und große Terz belegen im Notenbild gleich viele Positionen), steht aber nach dem Beispiel G–H, das ebenfalls groß ist. Der Gedankengang wirkt dadurch unklar. Die Überschrift „Große Terz: 4 Halbtöne“ allein wäre ohne Nummer 3 nicht eindeutig (C–Fes ist ebenfalls 4 HT, aber verminderte Quarte; M1+M2 geprüft). Der Fließtext sagt jedoch „Nummer 3 und 4 Halbtöne“. | Optional: Satz umformulieren zu „Eine kleine und eine große Terz sehen im Notenbild gleich weit auseinander aus; erst der Halbtonabstand unterscheidet sie.“ Optional: Einen Satz zur Enharmonik ergänzen (C–E große Terz, C–Fes verminderte Quarte, gleicher Klang), falls die Karte das Thema berühren soll. Kein Fehler. |
| `…card-perfect` (rein: 4 = 5 HT, 5 = 7 HT; E–A, E–H) | ok (≥2) | M1+M2+M3; M4 (mehrere Lehrseiten: P4 = 5, P5 = 7 HT; Quarten/Quinten/Oktaven/Primen sind „rein“, nie groß/klein) | Optional: Die Prime ist ebenfalls rein, wird hier nicht geprüft (kein Fehler, keine Aussage dazu). |
| `…card-octave` (E–E = 8 Positionen, 12 HT, rein; gleichnamige Töne in verschiedenen Lagen ≠ Prime) | ok (≥2) | M1+M2+M3; natürliche Oktaven haben ausschließlich 12 HT | – |
| `…card-tritone` (6 HT, drei Ganztöne; im engeren Sinn F–H; F–H Nr. 4 ≠ rein; H–F Nr. 5 ≠ rein; „beide Nein“) | ok (≥2) für Zahlen, Definition und Abfrage; **ein Satz Zweifel** | Zahlen: M1+M2+M3: F4–B4 = A4/6 HT, B4–F5 = d5/6 HT. Einzige natürliche Quarte mit 6 HT ist F–H, einzige natürliche Quinte mit 6 HT ist H–F. Definition: M4 (Wikipedia „Tritone“: Tritonus im engeren Sinn = übermäßige Quarte aus drei Ganztönen, im weiteren Sinn auch verminderte Quinte; Univ.-Wien-Skript: ü4/v5). Generator: A4/d5 → `interval-perfect:no`. **Zweifel:** Der Satz „H–F klingt wie F–H“ ist ungenau. Beide Intervalle sind Umkehrungen voneinander (M1 `invert(A4)=d5`, M2 `Interval.invert('4A')='5d'`; M4) und gleich groß, aber nicht dasselbe Tonpaar. „Klingt wie“ wäre nur bei Enharmonie wahr (F–H und F–Ces, Nr. 4 vs. 5 auf demselben Ton). | DE: „H–F hat denselben Halbtonabstand wie F–H und wird im weiteren Sinn ebenfalls Tritonus genannt.“ US/UK: „B–F spans the same number of half steps/semitones as F–B and is often also called a tritone.“ Die Folgesätze („denselben Halbtonabstand und verschiedene Intervallnummern“) sind bereits korrekt. |
| `intervals.l1.first-qualities.distance` (Lektion, 2 Blöcke `semitones`) | ok (≥2) | 6000 Items: Antwort = M3 + M2; genau eine richtige Option; Antworten 0–4 bzw. 5–12 (inkl. 6 durch A4) | – |
| `intervals.l1.first-qualities.thirds` (Lektion, `semitones` und `quality`) | ok (≥2) | 6000 Items: nur m3/M3, Qualitäten identisch mit M2; Optionen genau {m3, M3}, bzw. {3, 4}; Abwärts-Terzen korrekt | – |
| `intervals.l1.first-qualities.perfect` (Lektion, 3 Blöcke `quality`, `semitones`, `perfect`) | ok (≥2) | 9000 Items: `quality` {P4,P5,P8}; `semitones` {5,6,7,12}; `perfect` ja/nein: A4/d5 (6 HT) → „Nein“, 4/5/8 mit 5/7/12 → „Ja“; Reinheitsfrage nur bei Nr. 4/5/8 (Generator und Auswertung werfen sonst RangeError) | – |
| `intervals.l1.first-qualities.article` (Zusammenstellung der 9 Karten) | Zweifel wie bei `card-third-number` und `card-tritone` | identisch mit den Karten | Korrektur wie dort. |

## C. Terminologie (DE / US / UK) und Rückmeldetexte

| Gegenstand | Befund | Beleg | Korrekturvorschlag |
|---|---|---|---|
| Glossar: Halbton = half step (US) / semitone (UK); Ganzton = whole step (US) / tone (UK); Prime = unison; Tonschritt = step; Tonsprung = leap; Tritonus (Pl. „Tritoni“) | ok (≥2) | Glossar-Quellcode, Texte rendern in UK konsequent „semitone/tone/stave/colour“ (Dump geprüft), US „half step/whole step/staff/color“. M4: Oxford- und Collins-Einträge (half step = nordamerikanisch, semitone = britisch) | – |
| `exercise.intervalReadingExplanation_*`, `…Hint_*`, `question_interval_*` (DE/US) | ok (≥2) | gleiche Regeln wie Karten (inkl. „E–F, H–C ein Halbton, sonst zwei“, „Abstand 6 erfüllt keine Bedingung“); Antworten kommen aus M1, geprüft mit M2/M3 (Lauf 3). UK nur stichprobenartig gelesen (en-gb.ts überschreibt nur Abweichungen). | – |
| Intervallnamen der Antwortoptionen (`intervalName`: reine/kleine/große …, perfect/minor/major …, Prime/unison, Oktave/octave) | ok (≥2) | `interval-naming.ts` gelesen + `interval-naming.test.ts` grün; Zuordnung der Qualitäten zu Nummern (rein nur 1/4/5/8) durch M1 und M2 bestätigt | – |
| Enharmonik-Anforderung (C–E ≠ C–Fes) | ok (≥2) für die Engine, **nicht Gegenstand der Karten** | M1: C4–E4 = M3/4 HT; C4–Fes4 = d4/4 HT; M2: `3M` vs. `4d` | Karten behaupten nichts Falsches. Optional siehe `card-major`. |

## Nicht geprüft / Grenzen

- Klang („zwei getrennte Einsätze“, Hörbeispiele in den Karten): nur Partituren geprüft, nicht der Audioeindruck.
- UK-Rückmeldetexte nur stichprobenartig. Die UK-Fassung der Karten wurde vollständig gelesen.
- Literatur nur über Suchauszüge. Die Auszüge stützen die Standardregeln (Zählung, Halbtonzahlen, rein/groß/klein, Tritonus-Doppelbedeutung). Eine Seite im Treffer (Q&A-Portal) war schwach, die Aussagen stützen sich auf Wikipedia/Lehrseiten/Univ.-Wien-Skript.
- Layout und Darstellung des Klaviaturbilds nicht geprüft, nur die übergebenen `keyboard.first/last`-Werte.

## Zusammenfassung

- Geprüft: 6 Lektionen, 18 Karten, 2 Artikel, 14 Übungsblöcke (42 000 generierte Items), 30 Beispiel-Scores, 364 natürliche Paare, Glossar/Rückmeldetexte (DE/US, UK stichprobenartig).
- Fehler: **0**.
- Zweifel: **3** (alle sprachlich, keine falschen Zahlen):
  1. `card-tritone`: „H–F klingt wie F–H“ (richtig: gleicher Halbtonabstand, Umkehrung).
  2. `card-third-number`: „drei oder vier Halbtöne“ nur für natürliche Töne vollständig (ergänzen).
  3. `card-leap`: EN-Terminologie skip/leap uneinheitlich (optionaler Hinweis). Die Formulierung „in dieser Einheit“ ist bereits eine Absicherung.
- Hinweise ohne Zweifelsstatus: `card-major` (Satz zu „nicht unterschiedlich weit“, Enharmonik-Hinweis optional); `card-repeat` (Klang nicht geprüft).
- Alle Aussagen mit ≥2 unabhängigen Mitteln belegt (Engine + tonal + eigene Tabelle, Terminologie zusätzlich Literatur), außer Terminologie-Hinweis `card-leap` (Literatur uneinheitlich, nur 1 Mittel-Art) und Klang bei `card-repeat` (ungeprüft).
- Freigabefähig (fachlich, ohne Änderung): `intervals.l1.size.numbers`, `.direction`, `.motion` samt Karten `card-count`, `card-small`, `card-large`, `card-up`, `card-down`, `card-same`, `card-step`; `intervals.l1.first-qualities.distance` und `.thirds` samt Karten `card-transitions`, `card-black-keys`, `card-larger`, `card-minor`; `…perfect` samt Karten `card-perfect`, `card-octave`; alle 6 Übungssätze (Parameter und Bewertung).
- Freigabefähig nach kleiner Textkorrektur: `card-tritone`, `card-third-number` (und damit `first-qualities.article`). Mit optionalem Hinweis freigabefähig: `card-leap`, `card-major`. `card-repeat` nach Hörprobe (Gerätetest).
- `intervals.l1.size.article`: freigabefähig, aber `card-leap` gleicher EN-Hinweis möglich.
