> Rohbericht des unabhängigen Prüfers (ADR 0005), Stand 21.10.2026 **vor** den Korrekturen. Lesender Durchgang; Literatur nur über Suchauszüge, keine Primärtexte, keine Geräte-, Stimmen- oder Screenreader-Prüfung. Behobenes und Offenes: [fachpruefung-phase-4-entwuerfe.md](../../plan/fachpruefung-phase-4-entwuerfe.md). Die erwähnten Skripte lagen im flüchtigen Arbeitsordner.

# Fachprüfung P4.11 Chor-Trainer (PR #102, Commit c40edc8) – unabhängiger Prüfer, ADR 0005

Stand 21.10.2026, rein lesend. Skripte: `satb.mts`, `fix.mts` (Satzanalyse Engine + tonal), `grade.mts` (Grenzfälle/Property-Test Bewertung), `mix2.mts`/`mix3.mts` (Lektionsmischung/Skip) im selben Ordner.

## Fehler

### F1 (Blocker, fachlich) – Offene Oktavparallele Außenstimmen in „Kleiner Bogen“
- `packages/exercises/src/choir.ts:31-35` (`arch`): Schnitt 3→4 (Takt 2) F-Dur → C/E: Bass F3→E3, Sopran F4→E4 = Oktave→Oktave in gleicher Richtung (offene Oktavparallele Bass/Sopran).
- Belege: `analyzeVoiceLeading` (Projektprofil wie `SATB_DRAFT_RULES`, P4.10) meldet `parallel-octave` at 3 [bass, soprano] (dort Schweregrad `error`); `tonal` `Interval.distance` bestätigt 8P→8P.
- Gleichzeitig ergibt sich in Takt 2 ein I6 mit verdoppelter Terz im Bass/Sopran – Folge derselben Stelle.
- Korrekturvorschlag (mit Engine geprüft, 0 Befunde): Bass `C3 C3 F3 C3 G2 G2 C3 C3` (IV–I–V–V7–I) oder Sopran Note 4 ändern. Zusätzlich einen Test ergänzen, der beide Miniaturen mit `analyzeVoiceLeading` und dem P4.10-Profil prüft (fehlt bisher; `packages/exercises/src/choir.test.ts` prüft nur Notationsgültigkeit).

### F2 (Blocker, fachlich) – „Heimweg“ IV→V: Septsprung im Bass, verdeckte Quinte Außenstimmen mit Sopransprung, alle vier Stimmen gleichgerichtet
- `packages/exercises/src/choir.ts:25-29` (`home`): Schnitt 3→4 (Takt 2→3) Bass F3→G2 (kleine Septime abwärts, dissonanter Sprung), Sopran F4→D4 (Terzsprung), Alt C4→B3, Tenor A3→G3: alle Stimmen abwärts; Bass/Sopran Oktave → Duodezime (verdeckte Quinte) mit Sprung im Sopran.
- Engine: `hidden-fifth` at 4 [bass, soprano] mit `hiddenPerfectMotion: 'soprano-leap'` (Projektprofil: warning); `melodic-leap` bei Grenze Sexte. Lehrbuchnorm (Gegenbewegung zum Bass bei IV–V, keine Septsprünge im Bass) verletzt; das Plankriterium „regelkonformer vierstimmiger Satz“ ist damit nicht erfüllt. Als Lernmaterial zum Mitsingen ist der Septsprung zusätzlich unnötig schwer.
- Korrektur (geprüft, 0 Befunde): Bass `C3 E3 F3 F3 G3 G3 C3 C3` (Gegenbewegung, Einklang mit Tenor zulässig).

### F3 (mittel, Bewertung/Lernpfad) – Chor-Lektion besteht ohne einen gesungenen Ton
- Plan `docs/plan/chor-trainer-entwurf.md` behauptet „Ein vollständig übersprungener Durchlauf besteht keine Lektion“. Der Test `packages/content/src/choir.test.ts:21-35` prüft nur `resolveLesson` (ohne Mischung). Im echten Ablauf mischt `lessonPlan` Wiederholungsfragen ein:
  - Sopran: CHOIR, MELODY_DICTATION, CHOIR, RHYTHM_DICTATION → beide Chor-Aufgaben überspringen, Diktate richtig: `passed: true, eligibleCorrect 2, total 4, voiceSkipped 2` (Skript `mix2.mts`).
  - Alt: 3 CHOIR + 1 MELODY_DICTATION → alles Singen überspringen besteht (1/1).
  - Tenor/Bass: nur CHOIR → Überspringen besteht nicht. Verhalten zwischen den vier Lektionen inkonsistent; die Fähigkeit `aural.l4.choir.soprano` gilt dann als erreicht, ohne Gesangsnachweis.
- Formal ADR-0037-konform (≥1 gezählte Aufgabe), aber für eine Lektion, deren gesamter neuer Stoff Mikrofonaufgaben sind, ist das eine Freischaltung ohne Evidenz. Vorschlag: mindestens eine gezählte Aufgabe des **neuen** Lektionsstoffs verlangen (oder Chor-Lektionen von der Mischung ausnehmen/Freischaltung ohne Mastery) und den Test auf `lessonPlan` umstellen; Plantext korrigieren.

### F4 (mittel, Datenschutz-Transparenz) – Datenschutzhinweis unvollständig
- `packages/i18n/src/messages/choir-exercise.json` `choirPrivacy` (DE „Nach dem Durchlauf bleiben hier zeitlich zugeordnete Tonhöhen…“, EN „This session retains timed pitch readings…“). Im normalen Lektionsablauf werden die bis zu 96 Tonhöhenwerte als Antwort in `learning_events` synchronisiert (`learning-evidence.ts:337-339`), und der Tutor erhält `assessChoir` (Abweichungen je Note, `supabase/functions/_shared/tutor-tools.ts:140-149`). „bleiben hier“/„this session“ suggeriert reine Lokalität. PCM selbst wird korrekt nicht gespeichert/übertragen.
- `docs/legal/verarbeitungsverzeichnis.md` nennt nur P3.09/P3.10, nicht P4.11 (neue, dichtere Zeitreihe je Take, Tutor-Weitergabe). Vorschlag: Text um „bei Kontonutzung als Übungsantwort synchronisiert“ ergänzen, Verzeichnis nachziehen.

### F5 (niedrig, Inhalt) – Entwicklerhinweise in Lerntexten
- `authored-content.json` `choir.intro` (alle 3 Sprachen): „Interner Entwurf; unabhängige Fachprüfung und Geräteabnahme stehen aus.“; `choirDraft`, `type_CHOIR_PART` „· Entwurf“, `choirProfile`/`choirSummary` „Entwurfsprofil“. Für einen internen Entwurf vertretbar (Vorbild P4.10), muss aber vor jeder Freigabe entfernt werden.
- Alle vier Einführungskarten (`catalogue.json`, `aural.l4.choir.{soprano,alto,tenor,bass}.card`) zeigen dasselbe Sopran-Beispiel im Violinschlüssel; für Tenor/Bass wäre der Bassschlüssel mit der eigenen Stimme didaktisch passender. Beschriftung („im Sopran“) ist korrekt, kein Lösungsleck.

## Zweifel / nicht blockierend
- Toleranz: ADR 0037 legt ±50 Cent nur für Stufe 1, ±25 für Stufen 2–3 fest; Stufe 4 (Chor) verwendet ±50 + 75-%-Fensterregel. Nicht widersprüchlich (ADR regelt Stufe 4 nicht), aber lockerer als Stufe 2–3; im ADR/Plan begründen.
- Oktaväquivalenz: Verschiebung = `round(median(aller Differenzen)/1200)`, unbeschränkt (±2 Oktaven akzeptiert, z. B. Bass zwei Oktaven höher). Mit ADR 0037 („dieselbe ganze Zahl“) konsistent; einzelne Oktavfehler scheitern korrekt an der Note. Bei 4:4-Aufteilung entscheidet der obere Median (Shift 0, erste Hälfte falsch) – unkritisch, da die Probe dann ohnehin nicht besteht.
- 75-%-Regel: Eine Note mit 9/12 korrekten und 3/12 Fenstern eine Quinte daneben besteht – bewusst tolerant, aber „Abweichung“ kann dann irreführend sein.
- Vollständig stille Probe = gültige, falsche Antwort (zählt im Nenner). Mikrofon, das stumm „funktioniert“ (falsche Route), erzeugt so Fehlversuche statt Skip.
- Wiederholungsvariante unterscheidet sich nur im Tempo (`itemVariantKey` = Stimme/Stück/bpm); vgl. CLAUDE.md-Konvention beim Puls „nur Tempowechsel reicht nicht“.
- Lernpfad sequentiell: Bass-Lektion setzt bestandene Sopran-/Alt-/Tenor-Lektion voraus; gemischte Wiederholungen verlangen in der Bass-Lektion Tenor-/Alt-Stimmen. Mit Oktaväquivalenz singbar, didaktisch fraglich.
- Fähigkeitsgraph: Vorfahren enthalten Hör-/Singfähigkeiten (`aural.simple-intervals`, `aural.melodic-memory`, …), aber keine Notenlese-Fähigkeit (`notation.treble-clef`, `notation.bass-natural`), obwohl Partitur und Bassschlüssel gezeigt werden.
- Vorhören zählt nur als Hilfe, wenn `hintsAllowed` (`exercise-task.tsx`), sonst kostenfrei; Wiederholungs-Takes vor dem Prüfen unbegrenzt.
- Fachbegriffe „half notes/minims/quarter-note/crotchet“ in `authored-content.json` direkt statt über Glossar (Varianten sind korrekt).
- Umfänge/Lage: S D4–G4, A B3–C4, T G3–A3, B G2–F3 – alle im Standardumfang (Engine-Range-Prüfung ohne Befund), sehr eng und tief für Sopran/Alt; Tenor in Bassschlüssel klingend notiert (keine Violin-8-Transposition nötig, korrekt). Schlusswendungen: „Heimweg“ unvollkommener Ganzschluss (Sopran Terz), „Bogen“ V7 (unvollständig, Grundton verdoppelt) → I mit korrekter Leitton-/Septauflösung.
- Zeitbasis: Mikrofon-Eingangslatenz/Callback-Verzögerung wird nicht kompensiert (nur Ausgabelatenz + manueller Versatz); durch 15-%-Ränder teilweise abgefedert (bei 80 BPM ±225 ms).

## Geprüft (womit)
- Satz: eigene Skripte mit `analyzeVoiceLeading` (packages/theory, P4.09) inkl. Projektprofil `SATB_DRAFT_RULES`/Umfänge und `tonal` (`Interval.distance`, `Chord.detect`) als Orakel; Korrekturen gegengeprüft.
- Bewertung: Grenzfälle ±50/±51 Cent, Oktave ±1/±2, Stille, 7/8 Fenster, Teiloktavierung, Halbton-/Quintversatz; fast-check-Property (2000 Läufe, globaler Oktavshift −2..2, Rauschen ±50 → immer bestanden); Collector-Ränder (0,15/0,85, Einzähler, Flut); maximale Antwortlänge 599 < 1400.
- Skip: `skipVoiceExercise`/`skipLessonVoice`, `lessonProgress`, serverseitige Grenze `voiceSkipped ≤ Mikrofonaufgaben` (nutzt bei planKey den gemischten Plan – korrekt).
- Kammerton: `PitchTracker(referenceHz)` und Sampler-Engine mit gleichem `referenceHz` → konsistent.
- Code-Durchsicht Lebenszyklus: Mikrofon nur über `start('backing')` nach Kopfhörerbestätigung; Stop bei Fokusverlust, Unmount, AppState≠active, `visibilitychange`, Ton aus, `disabled/result`, Audiokontext≠running; verspätete Berechtigung schließt Session; Teilaufnahmen ohne Antwort.
- Sampler: rein synthetische additive Wellentabelle (`packages/audio/src/choir.ts`), keine Dateien/Downloads → keine Lizenzfrage.
- Läufe: `pnpm check:curriculum`, `pnpm check:content`, `pnpm check:i18n` grün; vitest choir-Tests (exercises 14, audio 2, content 2) grün.

## CI-Timeout `apps/mobile/__tests__/keyboard-lessons.test.tsx:78`
- Lokal: Einzeltest 33 s kalt, 23 s warm – also bereits lokal über dem `jest.setTimeout(20_000)`; er besteht nur, weil die Zeit fast vollständig synchron in `renderRouter('./src/app', { initialUrl: '/' })` (Import aller Routen + Rendern des vollständigen Lernpfads) verbraucht wird und der Timeout-Timer erst danach feuern kann. Auf langsamerer CI läuft das anschließende `waitFor` in den bereits fälligen Timer.
- P4.11 verstärkt das plausibel (eine weitere Einheit/vier Lektionen im Lernpfad, neue Route `choir.tsx` samt Audio-/Mikrofonmodulen im Route-Import), ist aber nicht die alleinige Ursache: der Test skaliert mit Katalogumfang. Ohne Vergleichslauf auf der Basis nicht quantifiziert. Nichts geändert.

## Nicht prüfbar
- Echte Stimmen, Kopfhörer (kabelgebunden/Bluetooth), Übersprechen, Latenz, iOS-/Android-Audiosession, Berechtigungsdialoge, Unterbrechungen; tatsächliche Erkennungsrate des Pitch-Trackers bei Gesang; Browser-E2E (`e2e/web/choir.spec.mjs`) nicht ausgeführt; kein Supabase-/RLS-Lauf; keine Literatur-Primärtexte (Satzregeln nach gängiger Lehrbuchkonvention).
