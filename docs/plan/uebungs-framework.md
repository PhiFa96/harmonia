# Übungs-Framework (P1.19)

Stand: 03.10.2026. P1.19 baut auf der Theorie-Engine, dem Notenbild, dem Sampler, der Klaviatur aus P1.18 und dem Design-System P1.06 auf.

## Was jetzt läuft

Im Tab „Üben“ startet ein gemischter Satz mit neun Aufgaben: je drei Notennamen, visuelle Intervalle und Hörintervalle. Jede Aufgabe bietet eine Auswahl, Prüfen, Rückmeldung, drei Hinweisstufen und Weiter. Die Rückmeldung nennt die Lösung und erklärt sie aus den Tönen; sie verwendet keine KI-Bewertung.

Die erste geprüfte Antwort bleibt gewertet. Nach der Rückmeldung sind die Antwortmöglichkeiten gesperrt und markieren sowohl die gewählte falsche Antwort als auch die Lösung mit Text, Symbol und Farbe. Hinweise bleiben ohne Sperre zugänglich; Stufe 3 erklärt die Lösung. Das Ergebnis unterscheidet richtige Antworten, ohne Hilfe richtige Antworten, mit Hilfe beantwortete Aufgaben und übersprungene Hörfragen. Es vergibt noch keine XP, Bestehensentscheidung oder Freischaltung.

Die Neun-Aufgaben-Vorschau ist in `apps/mobile/src/exercises/practice.ts` definiert. Sie ist noch keine versionierte Inhaltsdatei. P1.20 ist technisch implementiert: [erste-lektion.md](erste-lektion.md) beschreibt die versionierte Zehn-Aufgaben-Lektion, Einführung, neue Wiederholungsvarianten und SQLite-Speicherung. Die Eingabe-Demo aus P1.15/P1.18 liegt jetzt unter `/note-input`, erreichbar über „Noten und Klaviatur ausprobieren“.

Erweiterung vom 06.10.2026: Drei weitere Definitionen und ein zweiter Neun-Aufgaben-Satz erlauben freie Tonhöheneingaben. `NOTE_PLACE` und `INTERVAL_BUILD` bewerten vollständige Schreibweisen einschließlich Oktave, `KEY_FIND` die physische Taste. Die folgende Beschreibung hält den ursprünglichen P1.19-Stand fest; neue Schnittstelle, Parameter, Bedienung und Prüfstand stehen in [Tonhöheneingaben P2.06](tonhoeheneingabe.md).

## Paket und Schnittstelle

`packages/exercises` exportiert die drei Definitionen `noteNameExercise`, `visualIntervalExercise` und `auralIntervalExercise`. Jede hat dieselbe Schnittstelle:

```ts
generate(params, rng)                 // Aufgabe samt Notenbild und Antwort-IDs
evaluate(item, answer)                // gültige Antwort? richtig? erwartete ID?
feedback(item, result, locale)        // lokalisierte Überschrift und Engine-Erklärung
hints(item, level)                    // sprachneutraler Hinweis, Level 1–3
```

`generateExercise(spec, rng)` wählt anhand des Typs die Definition. `hintText(item, hint, locale)` löst den Hinweis in Deutsch, US- oder UK-Englisch auf. `choiceLabel` übersetzt Antwort-IDs zur Anzeige, `exercisePrompt` die Frage. Beispiel:

```ts
import { createRng, generateExercise, evaluateExercise, exerciseFeedback } from '@harmonia/exercises';

const item = generateExercise({
  type: 'INTERVAL_IDENTIFY_VISUAL',
  params: {
    clefs: ['treble', 'bass'],
    intervals: ['m3', 'M3', 'P4', 'P5'],
    maxAccidentals: 1,
    direction: 'both',
  },
}, createRng('lesson-1-attempt-2'));
const result = evaluateExercise(item, item.choices[0]!);
const feedback = exerciseFeedback(item, result, 'de');
```

Gleicher Parametersatz und Seed erzeugen dieselbe Aufgabe einschließlich der gemischten Antwortreihenfolge. Tonnamen-IDs bestehen aus Stammton und Vorzeichen (`B:0` = deutsches H, `B:-1` = deutsches B). Die Oktave wird bei `NOTE_NAME` ausdrücklich nicht abgefragt. Intervall-IDs wie `M3` bleiben sprachneutral; die Richtung ist beim Bestimmen der Intervallart kein zusätzliches Antwortmerkmal. Die tatsächliche Tonreihenfolge bleibt in der Aufgabe und Wiedergabe erhalten.

Die Bewertung berechnet den Notennamen beziehungsweise `intervalBetween(from, to)` neu aus den Tönen. Sichtbarer Text und zuvor angezeigte Lösung sind keine Bewertungsquelle. Cis und Des sind verschiedene Notennamen; C–Fes ist eine verminderte Quarte, auch wenn es wie C–E klingt.

## Parameter und Ausschlussregeln

| Parameter | Bedeutung / Grenze |
|---|---|
| `clefs` | nicht leere Liste aus `treble` und `bass`; Standard Violinschlüssel |
| `range` | MIDI-Bereich einschließlich beider Grenzen, innerhalb A0–C8 (21–108); Standard c¹–c³ im Violin-, C–c¹ im Bassschlüssel |
| `maxAccidentals` | 0, 1 oder 2; Notennamen standardmäßig 0, Intervalle 1; Notenbild ohne Tonartvorzeichnung |
| `intervals` | nicht leere Liste gültiger positiver Engine-Kurzformen, höchstens Doppeloktave; die Richtung steht separat |
| `direction` | visuell: `up`, `down` oder `both` |
| `playback` | auditiv: `melodic-up`, `melodic-down` oder `harmonic` |

Für jeden erlaubten Intervalltyp werden vor der Zufallsauswahl passende Tonpaare ermittelt. Ein unmöglicher Parametersatz scheitert mit `RangeError`, statt nur bei manchen Seeds auszufallen. Beide Töne bleiben im Tonumfang und innerhalb der erlaubten Vorzeichentiefe. Der Intervalltyp wird zuerst gewählt, danach ein passendes Paar: Intervalltypen mit vielen möglichen Grundtönen verdrängen dadurch nicht die anderen.

Antworten enthalten die Lösung und höchstens drei unterschiedliche Ablenker. Bei Intervallen stammen diese aus den erlaubten Intervallen; ein Satz mit nur zwei erlaubten Intervallen hat zwei Antworten. Mehrfach genannte Intervall-IDs werden dedupliziert. Bei Notennamen kommen die Ablenker aus den sieben Stammtönen mit der erlaubten Vorzeichentiefe.

In Hörfragen werden Intervalltypen mit demselben Halbtonabstand im selben Parametersatz abgewiesen. Beispiele: übermäßige Quarte / verminderte Quinte, große Terz / verminderte Quarte. Ihr Notenbild lässt sich unterscheiden, ihre Schreibweise ist am gleichstufig gespielten Klang allein nicht erkennbar. Visuelle Aufgaben dürfen diese Fälle ausdrücklich enthalten.

## Ablauf und Hör-Pause

Der reine Sitzungszustand liegt in `session.ts`: `createSession`, `currentItem`, `answerSession`, `revealHint`, `nextExercise`, `skipAuralExercises` und `sessionSummary`. Übergänge liefern einen neuen Zustand. Unbekannte Antwort-IDs und erneutes Prüfen einer bereits bewerteten Aufgabe verändern ihn nicht. Weiter ist erst nach einer Bewertung möglich.

„Gerade nicht hören“ beendet den aktuellen Klang und markiert die aktuelle unbeantwortete sowie alle weiteren Hörfragen als übersprungen. Bereits beantwortete Hörfragen bleiben gewertet. Übersprungene Fragen zählen weder als richtig noch als falsch. Der Hinweis empfiehlt Kopfhörer für einen späteren Satz. Die Pause gilt für den laufenden Satz und wird bei einem neuen Satz zurückgesetzt. Derselbe Übergang kann in P1.20 auf die Lektion angewendet werden.

Die Audio-Wiedergabe beginnt ausschließlich durch eine Nutzeraktion. `use-exercise-playback.ts` wartet auf `resume()` und verwirft verspätete Antworten nach Überspringen, Aufgabenwechsel, Tabwechsel oder Hintergrund. Ein Hörintervall muss vor dem Prüfen angespielt worden sein; alternativ kann die erklärte Lösung mit Hinweisstufe 3 betrachtet werden, was als Hilfe zählt. Stoppen, Prüfen und Weiter beenden die eigenen Stimmen. `playInterval(..., 'melodic')` hat dafür wie `playPitch`/`playChord` einen eigenen Stopp-Handle; andere Stimmen und Metronome bleiben erhalten.

## Darstellung und Barrierefreiheit

Die Oberfläche verwendet Figtree, `MusicText`, das bestehende Feedback-Banner, Fortschrittsbalken und P1.06-Tokens. Auswahl und Rückmeldung haben Symbole und Screenreader-Zustände; Hell/Dunkel, Haptik-Einstellung und reduzierte Bewegung werden übernommen. Die Auswahlflächen sind mindestens 56 pt hoch. Die Auswahl ist auch in der Entwicklungsgalerie sichtbar.

Vor der Bewertung beschreibt `exerciseDescription` Schlüssel, Positionen relativ zur untersten Linie und Vorzeichen. Die Namensansagen des darunterliegenden Notenbilds sind ausgeblendet, damit sie die Notennamenfrage nicht beantworten. Hörfragen enthalten vor Bewertung oder expliziter Lösungshilfe überhaupt kein Notenbild. Auf dem Web erhält die neue Frage den Fokus; nach Prüfen wird die Rückmeldung angesagt und „Weiter“ fokussiert, am Ende das Ergebnis. Tab erreicht die Antwortgruppe, Pfeiltasten wechseln die Antwort, Leertaste/Enter wählen sie. Home/End erreichen die erste/letzte Option. Auf iOS werden neue Fragen und Rückmeldungen angesagt. Echte Geräte-Screenreader sind noch zu prüfen.

Aufnahmen aus Chromium: [Notenfrage](bilder/p1-19-notenfrage.png), [Rückmeldung](bilder/p1-19-feedback.png), [Hörfrage](bilder/p1-19-hoerfrage.png), [Dunkelmodus](bilder/p1-19-dunkel.png).

## Prüfstand und Übergabe

- Eigenschaftstests mit 300 Seeds in jedem von sieben Parametersätzen: gültige Taktfüllung, deterministische Aufgaben, MIDI-/Vorzeichengrenzen, eindeutige Auswahl und genau eine richtige Antwort. Zusätzlich 500 erzeugte Intervalle gegen `tonal` als unabhängiges Test-Orakel.
- Eigene Tabellenfälle: H/B, Heses, Cis/Des, C–Fes, Referenzlinien g¹ im Violinschlüssel und f im Bassschlüssel, US/UK-Halbtöne und Singularformen.
- Ablauf-/App-Tests: falsche Antwort bleibt gewertet, Hinweise, vollständiger Satz, Hör-Pause, Audiofehler, verspätetes `resume()`, Hintergrund/Tabwechsel und erreichbare Klaviatur-Demo.
- Browser: vollständiger gemischter Satz mit echten Web-Audio-Quellen; Wiederholung mit Hinweisen und Hör-Pause; Telefonformat 390 × 844 und Desktop 1280 × 1000, Hell/Dunkel und reduzierte Bewegung.
- `pnpm check:deno` prüft und startet jetzt auch Generator, Bewertung und Erklärung. `tools/deno.json` bildet die Workspace-Importe auf die TS-Quellen ab und pinnt i18next. Der CI-Job braucht dafür keine pnpm-Installation.

Lokaler Testnachweis: 1291 Tests insgesamt (717 Theorie, 209 Notation, 218 Übersetzungen, 29 Audio, 36 Übungen, 14 UI und 68 App). `pnpm lint`, `pnpm typecheck`, `pnpm check:i18n`, `pnpm format:check`, `pnpm check:deno`, `pnpm --filter @harmonia/mobile build:web` und die Installation mit `--frozen-lockfile` erfolgreich. Der Browserdurchlauf wurde zusätzlich mit dem gebauten Web-Export geprüft.

Die Erklärungstexte sind eigene Formulierungen, durch die Engine-Beispiele und automatischen Prüfungen gestützt. Ihr Inhaltsstatus bleibt **Entwurf** bis zu Claudes separater fachlicher Abnahme gemäß ADR 0005; diese Implementierung gibt keine Kursinhalte für Produktion frei. Noch offen sind Hör-/Bedienproben und Screenreader auf echten iOS-/Android-Geräten sowie die Latenzmessungen aus P1.16. GitHub-CI muss vor dem Merge laufen.
