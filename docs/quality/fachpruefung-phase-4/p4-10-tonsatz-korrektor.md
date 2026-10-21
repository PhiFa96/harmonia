> Rohbericht des unabhängigen Prüfers (ADR 0005), Stand 21.10.2026 **vor** den Korrekturen. Lesender Durchgang; Literatur nur über Suchauszüge, keine Primärtexte, keine Geräte-, Stimmen- oder Screenreader-Prüfung. Behobenes und Offenes: [fachpruefung-phase-4-entwuerfe.md](../../plan/fachpruefung-phase-4-entwuerfe.md). Die erwähnten Skripte lagen im flüchtigen Arbeitsordner.

# Fachprüfung P4.10 (Commit d9a1c15, PR #101) – unabhängiger Durchgang nach ADR 0005

Stand 21.10.2026, Arbeitsbaum `/home/user/wt-p101`. Geprüft wurde nur lesend. Literatur stand nur über Suchauszüge zur Verfügung; ein Abgleich mit Primärtexten hat nicht stattgefunden.

## Kurzurteil

Die Engine setzt das erklärte Profil `p4.10-root-position-v1` technisch exakt um. Ein unabhängig geschriebener Prüfer kam für alle 18 Aufgabenvarianten zu identischen Urteilen. Alle Musterlösungen sind korrekt, und jede Aufgabe ist lösbar. Die Lösung wird vor der Wertung nicht verraten.

Fachlich ist das Profil an zwei Stellen strenger als die Standardliteratur zu V7–I. An anderen Stellen ist es lockerer, weil es weder warnt noch Fehler meldet. Hinzu kommen Mängel im Graphen, in der Lokalisierung und in den Texten. Für eine fachliche Freigabe muss nachgearbeitet werden. Als interner Entwurf ist der Stand technisch konsistent.

## Fehler

1. **Lehrbuchlösungen für V7–I werden abgelehnt** (`packages/exercises/src/voice-leading.ts`, Z. 81–86 `leadingTone: 'up'` und Z. 207 Vollständigkeitspflicht für Dreiklänge). In C-Dur, Stufe 5, Funktionen (Reihenfolge S, A, T, B):
   - Vollständiges V7 mit anschließend unvollständigem I: `[[C5,E4,G3,C3],[C5,F4,A3,F2],[B4,F4,D4,G2],[C5,E4,C4,C3]]` ergibt `chord-incomplete` (Takt 4) und fällt durch.
   - Vollständiges V7 mit vollständigem I, der Leitton fällt im Tenor zur Quinte: `[[G4,E4,C4,C3],[A4,F4,C4,F2],[F4,D4,B3,G2],[E4,C4,G3,C3]]` ergibt `leading-tone-resolution` (Takt 4) und fällt durch.
   - Stufe 4, V–I mit gleicher Leittonführung im Tenor: `[[G4,E4,C4,C3],[A4,F4,C4,F2],[G4,D4,B3,G2],[E4,C4,G3,C3]]` fällt ebenfalls durch.

   In Stufe 5 ist damit nur der Weg „unvollständiges V7, dann vollständiges I“ zulässig. Laut den Suchauszügen (Open Music Theory, Iowa State, Kent State) sind beide abgelehnten Wege dort Standard.

   **Vorschlag:** `leadingTone: 'up-or-frustrated-inner'` verwenden; die Engine bietet das bereits. Für I nach V7 die fehlende Quinte erlauben, mindestens als Warnung. Alternativ diese Einschränkung ausdrücklich als Profilentscheidung in Lerntext und Hinweisen nennen.

2. **Voraussetzungen im Graphen fehlen** (`packages/content/src/catalogue.json`, Skills `satz.l5.writing.*`). Die transitive Hülle der Voraussetzungen enthält keinen Skill aus `chords.l3.sevenths.*`, also weder „Septakkordtypen erkennen“ noch „Septakkorde schreiben“. Die V7-Satzaufgaben setzen aber Septakkorde voraus.

   **Vorschlag:** `chords.l3.sevenths.s2` (mindestens s1) als zusätzliche Voraussetzung eintragen.

3. **Britische Schreibweise und Begriffe in en-US** (`packages/i18n/src/messages/part-writing-exercise.json`):
   - Z. 71 „Realise“ und Z. 97 „realisation“
   - Z. 111/112 „neighbour“
   - Z. 80/100 „Bar {{bar}}“: Projektkonvention für en-US ist „Measure“ (siehe `en-us.ts:1108` `contextEvent`).
   - `authored-content.json` Z. 3433 „four bars … The bars are labeled“

   **Vorschlag:** Für en-US „Realize“, „realization“, „neighbor“ und „Measure“ verwenden. Für Fachbegriffe Glossarverweise wie `$t(glossary:measure_other)` und `$t(glossary:notes.whole…)` einsetzen statt fester Wörter (betrifft auch „whole notes“/„semibreves“).

4. **Entwicklerhinweise im Lerntext** (`authored-content.json` Z. 1715 und 3433 sowie en-GB entsprechend): „er legt F03 und F05 nicht fest“ / „does not settle F03 or F05“. Dazu Sätze wie „Auch Stufe 5 bleibt ein interner Entwurf …“ und „Entwurf“ in Level- und Unit-Titeln.

   **Vorschlag:** Vor jeder Freigabe entfernen. Interne Vorbehalte gehören in die Dokumentation, nicht in den Lerninhalt.

## Zweifel und nicht blockierende Punkte

- **Die Vorprüfung wirkt als vollständiges Bewertungsorakel.** In `exercise-task.tsx` löst `onInspect` nur bei `hintLevel === 0` einen Hinweis aus. Danach ist die Vorprüfung beliebig oft wiederholbar, und `satbPass` bestätigt die Wertung vorab. Nach F11 bleibt die Antwort mit Hinweis 1 für Bestehen und Freischaltung anrechenbar (XP-Gewicht 0,9). Probieren bis zum Bestehen ist also zum Preis von Hinweis 1 möglich. Ratings sind nicht betroffen, weil nur Antworten ohne Hinweise zählen. intro5 fordert ausdrücklich zum Vorprüfen auf, sagt aber nicht, dass das als Hilfe zählt.
  **Vorschlag:** Vorprüfung als Hinweis 2 werten oder begrenzen, und den Text anpassen.
- **Identische Aufgaben innerhalb einer Lektion.** Es gibt nur drei Varianten pro Lektion (Tonart; `itemVariantKey` enthält nur Typ, Parameter und Quintenzahl), aber drei Aufgaben. 9 588 von 12 000 Sitzungen (ca. 80 %) enthalten dieselbe Aufgabe zweimal. Die zweite Aufgabe lässt sich so durch Abschreiben lösen.
  **Vorschlag:** Tonarten ohne Zurücklegen ziehen oder mehr Vorlagen anbieten, etwa andere Sopranlinien oder Lagen.
- **Antiparallelen bleiben unbemerkt.** Quinten und Oktaven der Außenstimmen in Gegenbewegung bestehen ohne jede Warnung (z. B. C-Dur `I: C3 E3 G3 C4 → IV: F2 C3 A3 F4`). In den Funktionsvarianten betrifft das 300 bis 600 gültige Lösungen je Tonart. Die Engine-Regeln `contrary-fifth` und `contrary-octave` mit `contraryPerfectScope: 'outer'` sollten mindestens als Warnung aktiv sein.
- **Verdoppelte Terz in Dur-Dreiklängen in Grundstellung** bleibt unkommentiert (z. B. IV `F2 C3 A3 A4`). Das betrifft rund 40 % der gültigen Lösungen. Die Literatur bevorzugt die Grundtonverdopplung; eine beratende Warnung wäre angemessen.
- **Melodik wird kaum geprüft.** Erfasst werden nur Sprünge über eine Oktave (Warnung) und die übermäßige Sekunde. Übermäßige Quarte, Septimsprung und Sprünge in den Oberstimmen bleiben ohne Befund. Für ein Einführungsprofil ist das vertretbar, sollte aber dokumentiert sein.
- **Die Einführungskarte** zeigt nur zwei ganze Noten auf einem System (`C4/1 | D4/1`). Ein vierstimmiges Musterbeispiel fehlt.
- **Funktionskürzel im Englischen:** T/S/D erscheinen auch in en-US/en-GB. Die Kürzel sind mit römischen Ziffern ergänzt und als Aufgabenbezeichnung erklärt; F03 bleibt offen.
- **Stimmumfänge** (B E2–C4, T C3–G4, A G3–D5, S C4–G5) liegen im üblichen Lehrbuchrahmen. Die Angaben variieren je nach Quelle (Alt-Obergrenze C5 oder D5); das ist nicht primärgeprüft.
- **Erklärmodus im Tutor:** `explain` vertraut auf das vom Client gesetzte `checked`. Das ist vorbestehend und gilt für alle Typen; die Musterlösung ist dort erst nach der Wertung im Kontext enthalten.

## Geprüft (womit)

- **Unabhängiger Prüfer:** eigener TypeScript-Prüfer mit eigener Tonhöhen- und Akkordtabelle je Tonart, als Vitest-Test (`scratchpad/p101/vt/enum.test.ts`). Er hat für alle 18 Varianten (Stufe 4/5 × Bass/Sopran/Funktionen × F/C/G) alle profilgültigen Aussetzungen aus Akkordtönen innerhalb der Umfänge vollständig aufgezählt.
  - Ergebnis: 13 609 gültige Sätze; das kleinste Lösungsfeld hat 10 Sätze (Sopran in C). Die Engine lehnte keinen davon ab.
  - Bei rund 12 700 zufälligen Einzelnotenmutationen (falsche Akkordtöne, Enharmonik, Umfang, Kreuzung, Parallelen) wichen die Urteile 0-mal ab, die Zahl der Warnungen ebenfalls 0-mal.
  - Ergebnisse: `scratchpad/p101/enum-report.json`, `enum-examples.json`.
- **Musterlösungen** (manuell und durch die Engine): Grundtonverdopplung, Leitton im Alt aufwärts, D7 als unvollständiges V7 mit vorbereiteter Septime im Sopran, die abwärts aufgelöst wird. Keine Parallelen, Kreuzungen oder Überschreitungen; die Umfänge stimmen in allen drei Tonarten.
- **Fehler und Warnungen:** Fehler verhindern die Wertung, Warnungen (verdeckte Quinte/Oktave mit Sopransprung, Sprung über die Oktave) nicht. Das stimmt mit Profil und Texten überein.
- **Lösungsleck:**
  - Hinweise 1/2 sind generische Texte; Hinweis 3 ist die Lösung.
  - Tutor: Im Hint- und Chat-Kontext stehen nur Aufgabentext, Beschreibung und Funktionen. `check_voice_leading` gibt es nur in `explain`/`solution`, und `toolsForTutorContext` filtert es aus. `taskTutorScore` liefert bei Hint/Chat `undefined`.
  - Die Musterlösung im Editor erscheint erst bei `result` oder `hintLevel === 3`.
- **Determinismus:** 12 000 Sitzungen wurden je zweimal erzeugt und waren identisch. Hinzu kommen der vorhandene Test `part-writing.test.ts` (Rekonstruktion über `resolveReportSource`), `learning-evidence` (generischer Pfad) und der Rating-Bucket `['mode','level']`. Einstufung ist ausgeschlossen (Stufen ≤ 2).
- **Läufe:**
  - `pnpm check:curriculum`, `pnpm check:content` (166 interne, 0 freigegebene Lektionen) und `pnpm check:i18n` bestanden.
  - Vitest `src/voice-leading.test.ts` (10/10) und `src/part-writing.test.ts` (2/2) bestanden.
- **Barrierefreiheit (nur Code gelesen):**
  - Stimmen und Takte sind als Buttons mit Ton im Label umgesetzt; die Auswahl ist über `selected` gekennzeichnet.
  - Tonhöhen lassen sich per Pfeiltasten über `onAdjustNote` ändern, auch in leeren Takten (Startton C3/C4); Vorzeichen über `AccidentalBar` (Radio).
  - Befunde erscheinen als beschriftete Buttons mit Takt, Stimme, Schweregrad und Grund; `aria-live` ist gesetzt. Markierungen haben Textlabels, sind also nicht nur über Farbe erkennbar.
  - Horizontale Scrollbereiche sind im Web per `tabIndex` erreichbar.
- **Literatur:** WebSearch-Auszüge (Open Music Theory/Nebraska, Iowa State Comprehensive Musicianship 10.5, Kent State) zu den zwei üblichen Auflösungsarten von V7 nach I und zum fallenden Leitton in Mittelstimmen.

## Nicht prüfbar

- Primärliteratur (z. B. Kostka/Payne, Aldwell/Schachter, deutsche Tonsatzlehren)
- echte Geräte, Screenreader (VoiceOver/TalkBack) und Audio
- reales Tutor-Modell
- GitHub-CI
- Wirkung der Migration auf eine entfernte Datenbank
- `e2e/web/part-writing.spec.mjs` und axe-Lauf (nicht ausgeführt)
