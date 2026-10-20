# Prüfbericht P3.17 Aufnahmeprüfungs-Übungsmodus (Commit 957a54f)

Hinweis zum Umfang: Während der Prüfung wurde der Plan-Modus aktiv (nur lesen, nur diese Datei beschreibbar). Der Bericht liegt deshalb hier und nicht im Scratchpad (`.../scratchpad/review-p3-17.md`). Es wurden keine Tests oder Skripte ausgeführt (`vitest`, `pnpm check:i18n`, `pnpm check:content`). Alle Befunde stammen aus statischer Analyse von Code, Katalogdaten (`packages/content/src/catalogue.json`, per Lesen/Auswerten der Quellen) und Übergabe. Die Befehle zum Nachholen stehen am Ende.

## Blocker (vor Merge)

Kein Blocker für einen Merge als interner, ungepublizierter Entwurf. Der Produktionsbundle enthält keine Vorlagen (`packages/content/src/published.ts:5` exportiert `[]`), der Modus erzeugt weder Evidenz noch XP. Der Merge ist vertretbar, sofern die Punkte unter "Vor erster öffentlicher Vorlage" als offen geführt werden. Wenn der Merge strikt "fachlich korrekt beschriftet" verlangt, ist Befund N1 der einzige Kandidat, der vorher behoben werden sollte, weil er die Kernaussage "Bereichsauswertung Theorie/Gehör" verfälscht.

## Nicht-blockierend

**N1 (am wichtigsten) – Kadenzaufgabe ist als `theory` etikettiert, ist aber eine Hörfrage.**
`exam-templates.ts`, Vorlage `foundation`, Eintrag `harmony.l3.cadences.lesson1` Index 0 mit `area: 'theory'`. Die Quelle ist `CADENCE_IDENTIFY` (Katalogspec `{"types":["authentic","plagal"]}`), und `isAuralExercise` zählt diesen Typ als Hörübung (`packages/exercises/src/chords.ts:63`). Das Notenbild wird nicht vor der Antwort gezeigt (`feedback-media.ts:28` liefert nur Audio). Folgen:
- Der Theorie-Bereich der Auswertung enthält eine Hörfrage, der Gehör-Bereich hat dadurch effektiv nur 6 von 7 Hörfragen. Die Bereichspunkte sind fachlich verzerrt.
- Der Button "Ohne Hören weiter" erscheint bei dieser angeblichen Theoriefrage (`exercise-task.tsx:343-356`). `skipAuralExercises` überspringt sie samt allen folgenden Hörfragen; die Frage steht aber mitten im Theorieblock (Index 4 von 0–11). Die verbleibende Theoriefrage Index 5 wird danach noch gestellt.
- Der Test `exam.test.ts` ("überspringt bei Hörproblemen…") beantwortet zuerst alle Theoriefragen der Reihe nach. Er deckt den Fall, dass der Skip mitten im Theorieblock ausgelöst wird, nicht ab, und prüft `area`-Etiketten nicht gegen `isAuralExercise`.
Behebung: Kadenz durch eine visuelle Aufgabe ersetzen oder als `aural` etikettieren und hinter die Theoriefragen stellen; Test ergänzen, der für jede Frage `area === (isAuralExercise(item) ? 'aural' : 'theory')` fordert.

**N2 – Abschlusstext lügt bei übersprungenen Hörfragen.**
`skipExamAural` beendet den Lauf mit `endReason: 'completed'` (`exam.ts`, `finishExam`: kein offenes Item). `exam.tsx:119-124` zeigt dann `exam.end_completed` = "Alle Aufgaben wurden bearbeitet." / "You completed every question.". Bei sechs übersprungenen Hörfragen stimmt das nicht. Es gibt weder einen Skip-Grund noch eine Anzahl übersprungener Aufgaben in der Auswertung (`examResult` kennt nur `answered`, nicht `skipped`). Empfehlung: eigener Endgrund `'skipped-aural'` oder Anzeige "n übersprungen".

**N3 – Zeitmessung ist rein clientseitig, ohne Persistenz; das ist für einen Übungsmodus ohne Folgen akzeptabel, sollte aber festgeschrieben werden.**
- Uhr: `Date.now()` bei Start (`exam.tsx:70`, `exam.ts` `deadlineAt = now + minutes*60_000`). Eine zurückgestellte Systemuhr verlängert die Frist; es gibt keine monotone Uhr (z. B. `performance.now()`) und keinen Serverbezug. Da Ergebnis und Punkte nirgends gespeichert oder verglichen werden, ist das kein Missbrauchsweg.
- Frist im Hintergrund: Der 1-Sekunden-Intervall wird im Hintergrund gedrosselt, aber jede Antwort/Abgabe prüft `now >= deadlineAt` erneut (`answerExam`, `skipExamAural`, `finishExam`), und der nächste Tick beendet den Lauf. Das ist korrekt. Eine nach Fristablauf gegebene Antwort wird verworfen, nicht gewertet (`answerExam` Zeile "now >= deadlineAt → finishExam", Test deckt das ab).
- Idempotenz: `finishExam`/`answerExam`/`skipExamAural` geben bei `endedAt !== undefined` denselben Lauf zurück; `endedAt` wird auf `[startedAt, deadlineAt]` geklemmt. Ergebnisse werden nicht überschrieben. In Ordnung.
- Kein Wiederaufnehmen und keine Abbruchsicherung: Lauf lebt nur im React-State. `lesson.tsx:204` verwendet `usePreventRemove`, `exam.tsx` nicht. Zurück-Geste, Android-Zurücktaste oder Browser-Zurück verwirft einen laufenden Durchgang ohne Rückfrage. Die Übergabe nennt fehlende Persistenz als offene Entscheidung; das Fehlen der Abbruchbestätigung ist dort nicht erwähnt.
- Vor einem öffentlichen Release (nicht jetzt): Falls Ergebnisse je gespeichert, geteilt oder für Rankings genutzt werden, braucht es serverseitige Startzeit/Frist wie bei Rush (`rush` ist servergeprüft).

**N4 – Barrierefreiheit (Fokus, Screenreader).**
- Nach Fristablauf, vorzeitiger Abgabe oder Ende wird der Inhalt durch die Ergebnisansicht ersetzt. `useFocusEffect` (`exam.tsx:57-66`) fokussiert nur, wenn `active && item`. Auf Web geht der Fokus damit verloren (fokussiertes Element verschwindet), auf iOS gibt es keine Ansage. Kein Fokus auf die Überschrift `exam.result`, keine Live-Ansage "Zeit ist abgelaufen". Gerade der automatische Abbruch mitten in der Antwort ist für Screenreader-Nutzer überraschend.
- Keine Zeitwarnungen (z. B. 5 Minuten/1 Minute) und kein zugänglicher Zeitstand außer dem Text "Restzeit" (`exam.remaining`), der sich sekündlich ändert und nicht als Live-Region gesetzt ist (das ist für den Sekundentakt richtig, es fehlt aber eine grobe Warnung).
- Android bekommt keine Fragenansage (nur Web-Fokus und iOS-`announceForAccessibility`); das entspricht dem Muster in `lesson.tsx:309-310`, ist also konsistent.
- Reduzierte Bewegung: `exam.tsx` hat keine eigenen Animationen, Scrollen ist `animated: false`; `scrollAfterCheck={false}` unterdrückt das `scrollToEnd` im `ExerciseTask`. Kein Befund.
- Kontrast/Tokens: nur `AppText`/`Button`/`Card` und `useUiTheme`-konforme Bausteine, keine Einzelwerte. Kein Befund. Feedback über Farbe entfällt (kein Sofortfeedback).
- `exam.tsx` rendert `{t('exam.area_…')}:{' '}{t(…)}` mit festem Doppelpunkt im JSX; das ist kein Fachtext, kann aber in Sprachen mit anderer Interpunktion abweichen. Geringfügig.

**N5 – Inhaltliche Qualität der Vorlagen.**
- `foundation` ("Grundlagen und Gehör") nutzt ausschließlich Quellen aus Stufe 3 und 4 (Mehrstimmigkeit, komplexe Rhythmen, Septakkorde, Funktionsanalyse, Kadenzen, Phrasen). Der Name verspricht Grundlagen, der Inhalt ist mittleres bis fortgeschrittenes Niveau; Lernende vor Stufe 3 sehen unbekannten Stoff. Die Empfehlungen können dann auf gesperrte Lektionen zeigen (die UI behandelt das, `exam.lockedLesson`).
- Die Gehörteile beider Vorlagen sind nahezu identisch: `advanced` hat dieselben Hörquellen (Intervall, Septakkord, Melodie-/Rhythmusdiktat Level 2), nur drei- statt zweimal Dikat. Es gibt keine Schwierigkeitssteigerung im Gehörbereich; `advanced` ist nur theorieseitig anspruchsvoller. Die gleiche Spezifikation (`MELODY_DICTATION` Level 2, `RHYTHM_DICTATION` Level 2) kommt dreimal je Vorlage vor; der RNG ergibt verschiedene Items, Duplikate sind aber nicht ausgeschlossen und nicht getestet.
- Theoriefragen sind überwiegend `KNOWLEDGE_MC`/`CONTEXT_CHOICE` (Mehrfachauswahl, Ratewahrscheinlichkeit 1/n, keine Abzüge) und je 5 Punkte; Diktate zählen alles oder nichts je 5 Punkte, ohne Teilpunkte. Das ist eine bewusste Harmonia-Entscheidung (Doku), gilt aber als Gewichtungsproblem: eine ganze Melodie wiegt gleich viel wie eine ratbare Begriffsfrage.
- Positionskopplung: Die Vorlagen referenzieren Quellen über `lessonId` + `sourceIndex` (`exam-templates.ts`). Reihenfolge im Lektionssatz bestimmt, welche Aufgabe gemeint ist. Kein Test prüft Typ/Parameter pro Index. Eine Umsortierung der Lektionsaufgaben ändert die Prüfung stillschweigend. Empfehlung: Test, der pro Frage den erwarteten `spec.type` festschreibt.
- Wiederholungen derselben Lektion in `foundation` (`aural.l4.preparation.lesson2` Index 0 und 5) sind gewollt; Empfehlungen aggregieren nach `lessonId` und sind auf drei begrenzt. In Ordnung.

**N6 – Test- und Prüflücken.**
- Keine App-Tests für `exam.tsx`/`exam-entry.tsx` (Timer, Ende, Ergebnisansicht, Skip). Die Übergabe nennt "zwei gezielte App-Suiten" mit 24 Tests, diese betreffen jedoch nicht die neuen Dateien (Suche nach `exam` in `apps/mobile/src/**/*.test.*` ohne Treffer).
- Keine automatische Fachprüfung der erzeugten Aufgaben im Prüfungskontext (nur `expectedAnswer`-Durchläufe). Die Fachkorrektheit der Einzelaufgaben liegt bei den vorherigen Schritten P3.13–P3.16 (Engine als Orakel). P3.17 fügt keine neue Fachlogik hinzu außer Vorlagenzusammensetzung. `pnpm check:content` kennt `examTemplates` nicht (keine Referenz in `tools/`), prüft also nicht, ob Vorlagenverweise gültig sind; das übernimmt nur `availableExamTemplates` zur Laufzeit und der Test.
- Der Test `content-reports.test.ts` wurde in Einzelfälle pro Lektion aufgeteilt. Die Typabdeckung (`types.size === 26`) wird jetzt aus Spezifikationstypen der Übungssätze statt aus erzeugten Items gebildet; das ist gleichwertig, aber eine stille Änderung der Prüfbedeutung. Unproblematisch, nur erwähnenswert.

**N7 – Dokumentation/Backlog.**
- `docs/plan/phase-3-v1.md` hakt drei Aufgaben ab, lässt "Fertig, wenn: fachlich geprüft" offen und nennt das ausdrücklich. Konsistent mit CLAUDE.md ("nichts als freigegeben behaupten").
- Die Doku nennt die Zugangsentscheidung (Premium) und fehlende Persistenz als offen. Zusätzlich offen (siehe N3): Abbruchbestätigung, Skip-Kennzeichnung (N2), Etikettierung (N1).

## Vor erster öffentlicher Vorlage (laut Doku und eigener Prüfung offen)
1. Fachliche Prüfung nach ADR 0005 beider Vorlagen samt erzeugter Aufgaben, Literaturabgleich.
2. Premium-Zugang über den Access-Dienst (Entscheidung im Geschäftsmodell), heute nicht eingebunden.
3. Entscheidung zu Persistenz/Wiederaufnahme und, falls Ergebnisse gespeichert werden, serverseitiger Frist.
4. Echte Audio-/Geräteabnahme (Web/iOS/Android) für Hör- und Diktataufgaben im Zeitlimit.
5. Behebung N1, N2, N4.

## Geprüft ohne Befund
- **Keine XP/Münzen/Serien/Freischaltungen/Ratings/FSRS/Meldungen:** `exam.tsx` liest nur `useLearningState((s) => s.path)` (Zeile 32) und ruft nirgends `lesson-repository`, Sync, Motivation, Ratings oder Retention auf. `ExerciseTask` bekommt weder `reportSource` (kein Inhaltsmeldungs- und kein Tutor-Pfad, `exercise-task.tsx:524-545` setzt `reportSource` voraus) noch `onSkipVoice`. Hinweise sind abgeschaltet (`hintsAllowed={false}`, `onHint` ist leer), also `hintLevel` immer 0 und keine Hinweisauswertung. Der Modus erzeugt keinen Nachweis.
- **Kein Sofortfeedback:** `onCheck` ruft `answerExam` auf, das `answerSession` und `nextExercise` in einem Schritt ausführt; die Ergebnisansicht erscheint erst am Ende.
- **Entwurf bleibt verborgen:** Produktionsprojektion `examTemplates = []` (`published.ts:5`); `ExamEntry` gibt `null` zurück, wenn `availableExamTemplates` leer ist (`exam-entry.tsx:7`); `/exam` direkt aufgerufen zeigt `exam.unavailable`. `authoring.ts` re-exportiert `EXAM_TEMPLATES`; `index.ts` exportiert nur `exam.ts` (Typen und Funktionen, nicht die Vorlagenliste). Es gelangen also keine Lektions-IDs in den Produktionsbundle. Test `exam.test.ts` deckt den leeren öffentlichen Fall und das Werfen von `createExamRun` ab.
- **Punktelogik:** `examResult` zählt pro Frage höchstens einen korrekten Datensatz; falsche, übersprungene und nicht beantwortete Fragen ergeben 0; `maxPoints = Fragen × 5` (60 bzw. 80 Punkte, Bereichsmaxima 30/30 bzw. 40/40, durch Test bestätigt). Empfehlungen: höchstens drei, nach Fehlerzahl sortiert, nur aus Quelllektionen.
- **Determinismus:** Seed + Vorlage + `contentVersion` ergeben denselben Satz (Test); der App-Start verwendet `Date.now()` als Seed.
- **Frist/Idempotenz:** siehe N3; keine Rennbedingung gefunden. Bei doppeltem Tippen auf "Prüfen" wäre theoretisch eine veraltete Antwort auf die Folgeaufgabe möglich, `answerSession` verwirft aber ungültige Antwort-IDs, und die Schaltfläche ist nach dem ersten Druck deaktiviert (Antwort wird `null`).
- **i18n:** `exam.*` mit 30 Schlüsseln liegt in `de.ts` und `en-us.ts` vollständig und deckungsgleich vor; `en-gb.ts` erbt (keine britische Abweichung nötig; Text enthält keine Fachbegriffe, die das Glossar benötigt). Platzhalter `{{time}}`, `{{points}}`, `{{maximum}}`, `{{correct}}`, `{{count}}`, `{{minutes}}` werden in `exam.tsx` alle übergeben. Keine hartkodierten Fachtexte; `README`-Hinweis auf "Entwurf" fehlt im UI-Text bewusst (nicht öffentlich). Lektionstitel kommen über `contentText(lesson.titleKey)`. Deutsche Tonnamen (H/B) kommen in den Prüfungstexten nicht vor; Notation/Tonnamen stammen aus den wiederverwendeten Aufgaben.
- **Fachlich (Vorlagenzusammensetzung):** `CHORD_IDENTIFY` visuell/aural mit `major7`, `dominant7`, `minor7`, `halfDiminished7` auf C/D/G/A, `INTERVAL_IDENTIFY_AURAL` mit m3/M3/P4/P5/m6/M6 (keine enharmonischen Doppelnamen angeboten), `CADENCE_IDENTIFY` authentisch `[5,1]`, plagal `[4,1]`, `FUNCTION_ANALYSIS` Stufen I/IV/V in Dur. Diese Aufgabentypen sind als Einzelschritte vorhanden und sind nicht neu. Die Kadenz-Antwortmenge enthält auch halbe und Trugschluss-Kadenz (`CADENCE_TYPES`), obwohl die Spezifikation nur zwei Arten erzeugt; das ist eine Ablenkermenge, kein Fehler. Es wurden keine eigenen musiktheoretischen Aussagen in den Prüfungstexten gefunden außer der Abgrenzung "Anforderungen und Bestehensgrenzen einzelner Hochschulen können abweichen", die vorsichtig und korrekt formuliert ist. Eine Prüfung der erzeugten Items mit der Engine im Lauf wurde nicht ausgeführt (siehe unten).
- **Quellenangaben der Doku:** mdw- und HMTM-Beschreibungen dienen nur der Bereichswahl; keine fremden Aufgaben übernommen. Die Links konnten offline nicht abgerufen werden; dies bleibt Teil des offenen Literaturabgleichs.

## Nicht ausgeführt (nachzuholen, jeweils einzeln)
- `pnpm --filter @harmonia/content exec vitest run src/exam.test.ts`
- `pnpm --filter @harmonia/content exec vitest run src/content-reports.test.ts`
- `pnpm check:i18n`
- `pnpm check:content`
- Zusätzlich vorgeschlagener Test: für beide Vorlagen alle Fragen über viele Seeds erzeugen und prüfen, dass `area` zu `isAuralExercise` passt (löst N1 reproduzierbar aus: `foundation`, Frage Index 4), dass keine zwei Items eines Laufs identisch sind und dass jede Quelle den erwarteten `spec.type` hat.

## Reproduktion N1
Vorlage `foundation` starten, bis Frage 5 (Kadenz, angezeigt als "Musiktheorie") durchlaufen; die Frage zeigt keine Noten, verlangt zuerst Abspielen (`audio.heard`) und bietet "Ohne Hören weiter". Nach Betätigung werden diese und alle späteren Hörfragen als übersprungen gezählt, die Frage Index 5 (Phrasen) bleibt als Theoriefrage übrig. Im Ergebnis stehen die Kadenzpunkte unter "Musiktheorie".
