# Theorie-Engine

Paket `packages/theory`. Fachlicher Kern von Harmonia: erzeugt und bewertet alles, was musiktheoretisch richtig oder falsch sein kann ([ADR 0002](../decisions/0002-ki-tutor-und-fachliche-korrektheit.md)).

## Anforderungen

- Reines TypeScript, keine Abhängigkeiten zu UI oder Plattform. Läuft in App, Web und Edge Functions (Deno).
- **Rechtschreibung der Musik:** Tonhöhen werden immer mit Stammton *und* Vorzeichen geführt (Cis ≠ Des).
- **Sprachneutral im Kern:** Benennung (Deutsch, Englisch, später Solmisation) ist eine eigene Schicht.
- Deterministisch und reproduzierbar: Generatoren nehmen einen Seed.
- Sehr hohe Testabdeckung (Ziel: 100 % der Zweige in `theory`), dazu eigenschaftsbasierte Tests.

## Eigene Engine oder Bibliothek?

**Entschieden in [ADR 0004](../decisions/0004-eigene-theorie-engine.md):** eigene Engine; `tonal` (MIT) dient nur als Test-Orakel in Vergleichstests. Grundlage war ein Spike mit diesen Kriterien:

| Kriterium | Prüffrage |
|---|---|
| Korrektheit | Doppelte Vorzeichen, Enharmonik und übermäßige/verminderte Intervalle korrekt? |
| Erweiterbarkeit | Lassen sich Funktionstheorie und Stimmführung sauber ergänzen? |
| Benennung | Lässt sich die deutsche Benennung (H, B, -is, -es) darüber legen? |
| Größe und Wartung | Aktiv gepflegt, kleine Bündelgröße? |

Ausschlaggebend: Die Akkorderkennung von `tonal` ignoriert die Schreibweise (E–G–C → „Em♯5“), deutsche Benennung fehlt, und Version 6.5.0 ist fehlerhaft paketiert.

## Datenmodell

### Tonhöhe (`Pitch`)

```ts
type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';   // intern englische Stammtöne
interface Pitch {
  letter: Letter;
  alter: number;   // -2 = Doppel-b, -1 = b, 0, +1 = Kreuz, +2 = Doppelkreuz
  octave: number;  // wissenschaftliche Notation: C4 = eingestrichenes c (c¹)
}
```

Abgeleitete Werte:

- **Diatonischer Index:** `octave * 7 + letterIndex` (C = 0 … B = 6)
- **Halbtonzahl / MIDI-Nummer:** `12 * (octave + 1) + pitchClass(letter) + alter` (C4 = 60, A4 = 69)
- **Frequenz:** `refHz * 2^((midi - 69) / 12)` mit `refHz` = 440 Hz (einstellbar)

### Ton ohne Oktave (`NoteName`)

```ts
interface NoteName {
  letter: Letter;
  alter: number;
}
interface Pitch extends NoteName { octave: number }
```

Für alles, was keine Oktave hat: Grundton einer Tonart, Vorzeichnung, Akkordtöne. Jede `Pitch` ist auch ein `NoteName`. Lesen und Schreiben: `parseNoteName('F#')`, `formatNoteName(n)`.

### Intervall (`Interval`)

```ts
interface Interval {
  number: number;        // generisch: 1 = Prime, 2 = Sekunde, … 8 = Oktave, 9 = None …
  quality: Quality;      // 'P' | 'M' | 'm' | 'A' | 'd' | 'AA' | 'dd'
  direction: 1 | -1;
}
```

**Bestimmung zwischen zwei Tonhöhen:**

1. Generische Größe aus der Differenz der diatonischen Indizes: `n = |Δdiatonisch| + 1`
2. Einfache Größe: `s = ((n − 1) mod 7) + 1`; Oktaven: `o = floor((n − 1) / 7)`
3. Erwartete Halbtöne für rein/groß: `[0, 2, 4, 5, 7, 9, 11][s − 1] + 12·o`
4. Abweichung `Δ = tatsächliche Halbtöne − erwartete`
5. Qualität:
   - Reine Klasse (1, 4, 5): 0 → rein, +1 → übermäßig, −1 → vermindert, ±2 → doppelt übermäßig/vermindert
   - Andere Klasse (2, 3, 6, 7): 0 → groß, −1 → klein, +1 → übermäßig, −2 → vermindert, +2/−3 → doppelt übermäßig/vermindert

Beispiel: C4 → Fes4: generisch 4 (Quarte), erwartet 5 Halbtöne, tatsächlich 4 → verminderte Quarte. C4 → E4: Terz, 4 Halbtöne → große Terz. Gleicher Klang, verschiedene Intervalle.

**Festgelegte Konventionen (umgesetzt in P1.08):**

- **Richtung folgt dem Stammton,** nicht dem Klang. C♯3 → D♭♭3 ist eine doppelt verminderte Sekunde *aufwärts*, obwohl der Ton tiefer klingt. C4 → H♯3 ist eine verminderte Sekunde *abwärts*. Nur bei gleichem Stammton entscheidet der Klang: C → Ces ist eine übermäßige Prime abwärts.
- **Keine verminderte Prime.** Derselbe Fall heißt „übermäßige Prime abwärts“.
- **Umkehrung:** Prime ↔ Oktave, Terz ↔ Sexte, groß ↔ klein, übermäßig ↔ vermindert. Zusammengesetzte Intervalle werden vorher vereinfacht. Die übermäßige Oktave hat keine Umkehrung.
- **Vereinfachen:** None → Sekunde, Doppeloktave → Oktave (nicht zur Prime).
- **Darstellbar** sind Intervalle bis doppelt übermäßig/vermindert, wie bei den Vorzeichen (höchstens zwei).

### Tonleitern und Tonarten

**Festgelegte Konventionen (umgesetzt in P1.09):**

- **Tonleitertypen:** Dur, natürliches, harmonisches und melodisches Moll, die sieben Kirchentonarten, Dur- und Moll-Pentatonik, Blues- und Dur-Bluestonleiter, Ganztonleiter, chromatisch. Gebildet werden sie aus Intervallen vom Grundton, deshalb immer korrekt buchstabiert: Jede siebenstufige Tonleiter enthält jeden Stammton genau einmal.
- **Höchstens zwei Vorzeichen pro Ton.** His-Dur geht (His, Cisis, Disis, Eis, Fisis, Gisis, Aisis), Gisis-Dur nicht (bräuchte Fisisis) – dann wirft die Engine einen Fehler.
- **Abwärts** beginnt die Tonleiter beim Grundton und läuft nach unten. Melodisches Moll abwärts = natürliches Moll (klassische Lehre).
- **Chromatische Tonleiter** in vereinfachter Schreibweise: aufwärts mit Kreuzen, abwärts mit b, bei jedem Halbtonschritt die Schreibweise mit den wenigsten Vorzeichen. C aufwärts: C Cis D Dis E F Fis G Gis A Ais H; abwärts: C H B A As G Ges F E Es D Des. Eine tonartbezogene Schreibweise kann später als zweite Variante dazukommen.
- **Tonart** = Grundton (ohne Oktave) + Tongeschlecht. Vorzeichenzahl über die Quintenreihe: Lage des Stammtons (F = −1, C = 0, G = 1 … H = 5) plus 7 je Kreuz bzw. minus 7 je b; bei Moll minus 3. Beispiele: Fis-Dur = −1 + 7 = 6 Kreuze, es-Moll = 4 − 7 − 3 = −6 (sechs b).
- **30 Tonarten** mit höchstens sieben Vorzeichen (15 Dur, 15 Moll). Theoretische Tonarten wie Gis-Dur (8 Kreuze) lehnt die Engine ab. Deshalb haben Ces-, Ges- und Des-Dur sowie gis-, dis- und ais-Moll keine darstellbare Varianttonart (ces-Moll hätte zehn b).
- **Reihenfolge der Vorzeichen:** Kreuze Fis, Cis, Gis, Dis, Ais, Eis, His; b: B, Es, As, Des, Ges, Ces, Fes.
- **Quintenzirkel:** zwölf Positionen im Uhrzeigersinn ab C-Dur bzw. a-Moll. Enharmonisch gleiche Tonarten teilen sich eine Position (H/Ces, Fis/Ges, Cis/Des); die Tonart mit weniger Vorzeichen steht zuerst, bei Gleichstand die Kreuz-Tonart.
- **Falsche Freunde:** deutsche *Paralleltonart* (C-Dur ↔ a-Moll) = englisch *relative key*, im Code `relativeKey`. Deutsche *Varianttonart* (C-Dur ↔ c-Moll) = englisch *parallel key*, im Code `parallelKey`.
- **Leitereigene Dreiklänge** werden aus Terzen der Tonleiter geschichtet. Dur: Dur, Moll, Moll, Dur, Dur, Moll, vermindert. Moll natürlich, harmonisch oder melodisch (aufwärts) wählbar, z. B. a-Moll harmonisch: a, h°, C+, d, E, F, gis°.
- **Namen:** Deutsch mit großem Grundton für Dur und kleinem für Moll („Fis-Dur“, „es-Moll“, „h-Moll“), Englisch „F♯ major“, „E♭ minor“, „B minor“.
- **Bluestonleiter** = Moll-Pentatonik plus verminderte Quinte als Blue Note: 1 ♭3 4 ♭5 5 ♭7, auf C: C Es F Ges G B. Die Blue Note steht als ♭5 (Ges), auch abwärts; die Schreibweise als ♯4 (Fis) ist in Lehrmaterial ebenfalls verbreitet, aber nicht Standard der Engine.
- **Dur-Bluestonleiter** = Dur-Pentatonik plus kleine Terz: 1 2 ♭3 3 5 6, auf C: C D Es E G A.
- **Ganztonleiter** = 1 2 3 ♯4 ♯5 ♯6: auf C: C D E Fis Gis Ais, auf Des: Des Es F G A H. Weil sechs Töne auf sieben Stammtöne verteilt werden, ist ein Schritt eine verminderte Terz; sie liegt vor der Oktave (Ais–C). So ergeben sich die beiden üblichen Schreibweisen der zwei Ganztonreihen.
- **Abgleich:** Blues-, Dur-Blues- und Ganztonleiter stimmen auf allen 35 Grundtönen mit tonal überein und entsprechen der verbreiteten Schreibweise in Lehrmaterial (z. B. Ganztonleiter c d e fis gis ais mit verminderter Terz ais–c).

### Akkorde

**Festgelegte Konventionen (umgesetzt in P1.10):**

- **Datenmodell:** Akkord = Grundton (`NoteName`) + Akkordtyp + Umkehrung. Die Akkordtöne entstehen aus Intervallen vom Grundton (Dur: r. 1, gr. 3, r. 5; Moll: r. 1, kl. 3, r. 5; vermindert: r. 1, kl. 3, verm. 5; übermäßig: r. 1, gr. 3, üb. 5). Septakkorde kommen als weitere Typen mit vier Tönen dazu (Akkordton `seventh`, dritte Umkehrung); Namen der Vierklang-Umkehrungen sind schon vorhanden.
- **Höchstens zwei Vorzeichen pro Akkordton.** Ceses-Moll (bräuchte Eseses) und His-übermäßig (bräuchte Fisisis) sind nicht darstellbar.
- **Enge Lage** vom Basston aufwärts: C-Dur-Sextakkord = E4 G4 C5.
- **Bestimmen aus geschriebenen Tönen:** beliebige Lage und Verdopplung, der tiefste Ton ist der Bass und bestimmt die Umkehrung. Die Schreibweise zählt: E–G–C ist ein C-Dur-Sextakkord, E–G–His ist kein Dreiklang.
- **Fehlende Quinte** ist erlaubt (üblich im vierstimmigen Satz), Grundton und Terz nicht. Ohne Quinte ist das Ergebnis mehrdeutig. Die Kandidatenliste nennt dann Dur vor übermäßig und Moll vor vermindert.
- **Bestimmen aus MIDI-Nummern** (Eingabe ohne Schreibweise, z. B. Klaviatur): Jede passende Schreibweise ist ein Kandidat. Akkordtöne haben standardmäßig höchstens ein Vorzeichen. Sortiert wird nach fehlenden Tönen, dann nach der Zahl der Vorzeichen der vorhandenen Töne, dann nach Akkordtyp, Umkehrung und Stammton. Beispiel C–E–Gis: C+, As+ (Sextakkord), E+ (Quartsextakkord), Fes+ (Quartsextakkord).
- **Namen Deutsch:** „C-Dur-Dreiklang“, „a-Moll-Sextakkord“, „C-Dur-Quartsextakkord“. Bei vermindert und übermäßig: „verminderter Dreiklang auf H als Sextakkord“. Bewusst nicht „übermäßiger Sextakkord“, denn so heißt ein anderer Akkord (mit übermäßiger Sexte).
- **Namen Englisch:** „C major triad“, „A minor triad, first inversion“, „B diminished triad, second inversion“.
- **Akkordsymbole (F04, Stand Dreiklänge):** C, Cm, C°, C+; Umkehrungen mit Schrägstrich (C/E). Diese Zeichen sind in Leadsheets am weitesten verbreitet. Als Alternative gibt es den Textstil Cdim und Caug. Tonbuchstaben stehen standardmäßig international (B, B♭), wahlweise deutsch (H, B). Die Symbole für Septakkorde (z. B. Cmaj7, CΔ7, CM7) werden mit den Septakkorden festgelegt.

### Rhythmus

- Dauern als **Brüche** (`{num, den}`), nie als Gleitkommazahlen: Viertel = 1/4, punktierte Achtel = 3/16, Triolen-Achtel = 1/12.
- Taktart: Zähler und Nenner plus Gruppierung (z. B. 6/8 = 3+3, 7/8 = 2+2+3).
- Prüfung: Takt vollständig gefüllt, Gruppierung für Balkensetzung.

**Festgelegte Konventionen (umgesetzt in P1.11):**

- **Notenwerte** von der doppelganzen Note (Brevis, 2) bis zur Vierundsechzigstel (1/64), mit 0–3 Punkten: Wert · (2 − 1/2^Punkte). N-tolen als Verhältnis „actual : normal“: Triole 3:2 (Triolenachtel = 1/12), Quintole 5:4, Duole 2:3.
- **Gruppierung** in Einheiten des Nenners. Ohne Angabe gilt: 6, 9, 12 in Dreiergruppen; 1–4 sowie alle Taktarten mit Halben oder Vierteln als Nenner Zählzeit für Zählzeit (5/4 = fünf Viertel); 5/8 = 2+3 und 7/8 = 2+2+3. Für alle anderen (z. B. 8/8, 11/8) ist die Gruppierung Pflicht, weil die Praxis keinen einheitlichen Standard hat (8/8 oft 3+3+2).
- **Einteilung nach der Teilung der Zählzeit** (`meterType`, wie in englischsprachigen Lehrbüchern): *simple* = 2, 3 oder 4 zweigeteilte Zählzeiten (2/4, 3/4, 4/4, 2/2, 3/8); *compound* = 2, 3 oder 4 dreigeteilte Zählzeiten (6/8, 9/8, 12/8, 6/4); sonst *irregular* (5/8, 7/8, 5/4). `tonal` weicht hier ab (3/8 „compound“, 6/4 „simple“) und dient deshalb nicht als Orakel.
- **Falscher Freund:** In der deutschen Musiklehre heißt „zusammengesetzter Takt“ ein Takt aus mehreren einfachen (4/4 = 2+2, 6/8 = 3+3). Englisch „compound meter“ meint dagegen die Dreiteilung der Zählzeit; 4/4 ist dort „simple“. Deutsche Lerninhalte müssen den Begriff deshalb eigens erklären und dürfen „compound“ nicht einfach mit „zusammengesetzt“ übersetzen.
- **Takt voll:** Noten und Pausen zählen gleich; Ergebnis `complete`, `incomplete` (mit fehlender Dauer) oder `overfull` (mit Überschuss). Auftakte erscheinen als `incomplete`.
- **Sekunden:** Tempo als Schläge pro Minute mit wählbarem Schlagwert (Standard Viertel, im 6/8-Takt z. B. punktierte Viertel). Nur die Ausgabe ist eine Gleitkommazahl.
- **Namen:** Deutsch „punktierte Viertelnote“, „halbe Pause“, „Achtelnote (Triole)“; Englisch US „dotted quarter note“, „triplet eighth note“, UK „dotted crotchet“, „triplet quaver“ (F02). Namen und Werte stimmen mit `tonal` überein.

## Funktionsumfang nach Phasen

| Modul | Funktionen | Phase |
|---|---|---|
| `pitch` | Parsen, Formatieren, Transponieren, Enharmonik, MIDI, Frequenz | 1 |
| `interval` | Bestimmen, Bilden (von Ton aus nach oben/unten), Umkehren, Komplementär, zusammengesetzte Intervalle | 1 |
| `scale` | Dur, Moll (natürlich, harmonisch, melodisch), Kirchentonarten, Pentatonik, Blues, Ganzton, chromatisch – jeweils korrekt buchstabiert | 1 |
| `key` | Vorzeichnung, Quintenzirkel, Paralleltonart, Varianttonart, Leitereigene Akkorde | 1 |
| `chord` | Bauen und Bestimmen: Drei- und Vierklänge, Umkehrungen, sus, erweiterte Akkorde; mehrdeutige Fälle als sortierte Kandidatenliste | 1 (Dreiklänge), 2 (Septakkorde), 3 (erweitert) |
| `rhythm` | Dauern, Taktfüllung, Gruppierung, Triolen | 1 |
| `naming` | Benennung DE/EN, später feste Solmisation (Do, Re, Mi) | 1 |
| `harmony` | Stufen (römische Ziffern) und Funktionen (T, S, D, Parallelen, Gegenklänge, Zwischendominanten, Doppeldominante, Neapolitaner), Kadenzen, Modulation | 2 (Grundlagen), 3 (vollständig) |
| `voiceLeading` | Stimmführungsprüfung im vierstimmigen Satz (siehe unten) | 4 |
| `counterpoint` | Gattungskontrapunkt-Regeln | 4–5 |
| `analysis` | Tonart- und Akkorderkennung aus Notenfolgen (für Song-Analyse aus MIDI) | 5 |

## Benennung (`naming`)

| | Deutsch | Englisch |
|---|---|---|
| Stammtöne | C D E F G A **H** | C D E F G A **B** |
| Kreuz | Cis, Dis, Eis, Fis, Gis, Ais, His | C♯ … |
| b | Ces, Des, **Es**, Fes, Ges, **As**, **B** | C♭ … B♭ |
| Doppelkreuz | Cisis, Disis, … Hisis | C𝄪 … |
| Doppel-b | Ceses, Deses, Eses, Feses, Geses, Asas, Heses | C𝄫 … |
| Oktavlage | Helmholtz mit Hoch- und Tiefzahlen: C₂, C₁, C, c, c¹, c² … | Wissenschaftlich: C0, C1, C2, C3, C4, C5 … |
| Intervalle | reine Prime … große Septime, None, Dezime … | perfect unison … major seventh, ninth, tenth … |

- Die Benennung folgt der UI-Sprache, ist aber unabhängig umschaltbar (Einstellung „Tonnamen: deutsch / international“).
- Die Schicht ist so gebaut, dass später weitere Systeme dazukommen können (z. B. feste Solmisation für romanische Sprachen).

## Harmonik

- **Zwei Analysesysteme**, beide vollständig: Stufentheorie (römische Ziffern) und Funktionstheorie. Nutzer wählen in den Einstellungen (Standard: DE → Funktionen + Stufen, EN → römische Ziffern).
- **Konventionen festlegen** (offene Frage, entscheidet Claude nach Recherche, siehe [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md)): Schreibweise der Funktionssymbole und Akkordsymbole. Die Engine bildet jede Konvention als Formatierer ab, das interne Modell bleibt gleich.

## Stimmführung (`voiceLeading`, Phase 4)

Regeln für den vierstimmigen Satz, jede einzeln aktivierbar, mit Schweregrad (Fehler / Warnung / Hinweis) je Stufe und Stilkonvention:

- Offene Parallelen (Quinten, Oktaven, Primen), Antiparallelen
- Verdeckte Quinten und Oktaven in den Außenstimmen
- Stimmkreuzung und Stimmüberschreitung
- Abstände benachbarter Stimmen (Sopran–Alt, Alt–Tenor höchstens eine Oktave)
- Stimmumfänge (nach gewählter Lehrbuchkonvention)
- Leittonbehandlung, Auflösung der Septime abwärts
- Verdopplung (z. B. kein verdoppelter Leitton)
- Melodische Schritte (z. B. übermäßige Sekunde)

Jede Regel bekommt eine Quelle (Lehrbuch, Seite) in der internen Dokumentation.

## Generatoren

- Schnittstelle: `generate(params, rng) → item`. `rng` ist ein seedbarer Zufallsgenerator.
- Parameter steuern die Schwierigkeit: erlaubte Intervalle, Vorzeichen-Tiefe, Schlüssel, Tonumfang, Umkehrungen usw.
- Ausschlussregeln: keine unsinnigen Aufgaben (z. B. Doppelkreuze auf Stufe 1).
- Gleicher Seed → gleiche Aufgabe auf Client und Server. So kann der Server Duelle und Rush prüfen.

## Teststrategie

- **Beispieltests:** feste Tabellen mit erwarteten Ergebnissen, z. B. alle Intervalle von C aus, alle Dur- und Molltonleitern, alle Vorzeichnungen.
- **Eigenschaftsbasierte Tests (fast-check):**
  - `interval(p, transpose(p, i)) == i` für alle gültigen `p`, `i`
  - Umkehrung der Umkehrung ergibt das Ausgangsintervall
  - Intervall + Umkehrung = Oktave (generisch 9, Halbtöne 12)
  - Jede heptatonische Tonleiter enthält jeden Stammton genau einmal
  - Enharmonisch gleiche Töne: gleiche MIDI-Nummer, aber verschiedene Schreibweise
- **Literaturabgleich:** Claude stellt pro Modul Referenzbeispiele aus Standardwerken und Lehrmaterial zusammen (Ergebnis, nicht Originaltext, mit Quelle). Wir prüfen die Engine dagegen.
- **Vergleichstests:** Ergebnisse gegen `tonal` als unabhängiges Orakel (z. B. `src/pitch.tonal.test.ts`).
- **Gleiches Verhalten in Deno:** `pnpm check:deno` prüft und startet `tools/deno-smoke.ts` unter Deno; ab P1.02 als CI-Job.
