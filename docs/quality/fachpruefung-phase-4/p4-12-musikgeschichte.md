> Rohbericht des unabhängigen Prüfers (ADR 0005), Stand 21.10.2026 **vor** den Korrekturen. Lesender Durchgang; Literatur nur über Suchauszüge, keine Primärtexte, keine Geräte-, Stimmen- oder Screenreader-Prüfung. Behobenes und Offenes: [fachpruefung-phase-4-entwuerfe.md](../../plan/fachpruefung-phase-4-entwuerfe.md). Die erwähnten Skripte lagen im flüchtigen Arbeitsordner.

# Fachprüfung PR #99 – P4.12 Zeitreise durch die Musikgeschichte

Prüfer: Claude (unabhängig, ADR 0005, frischer Kontext), 21.10.2026. Nur lesend; Worktree `/home/user/wt-p99`, Commit `2a26f51`.
Literaturgrenze: nur Suchauszüge (Websuche), kein Primärtextabgleich.

## Fehler (Blocker vor fachlicher Freigabe)

1. **Parallele Quinten im Renaissance-Szenenmodell.** `packages/content/src/history-journey-draft.ts:18`
   `C4/4 D4/4 E4/4 F4/4 & G4/4 A4/4 B4/4 C5/4`. Mit der Engine (`intervalBetween`) geprüft: viermal P5 hintereinander.
   Die Station stellt dieses Modell neben „imitierende Vokalpolyphonie“ (JSON:19). Parallele reine Quinten sind genau das, was der Renaissance-Kontrapunkt ab etwa 1450 vermeidet (Suchauszug: Wikipedia „Consecutive fifths“). Gleichzeitig zeigt das Modell keine Imitation. Die Beschriftung „kein historisches Werk“ hebt den stilistischen Widerspruch nicht auf.
   *Korrektur:* ein kurzes Modell mit Imitation und imperfekten Konsonanzen, z. B. Unterstimme bringt das Motiv um zwei Viertel versetzt nach (`C5/4 D5/4 E5/4 C5/4 & r/2 C4/4 D4/4`), oder wenigstens Terzen/Sexten ohne Parallelen perfekter Konsonanzen. Danach mit der Engine erneut auf Parallelen prüfen.

2. **Parallele Quinten im Barock- bzw. Generalbassmodell.** `history-journey-draft.ts:27-28`. Szene: (C4 G4)(D4 A4)(E4 B4)(F4 C5), das sind 4× P5. Hören: (G3 D4)(A3 E4)(B3 F4)(C4 G4), also P5 P5 d5 P5.
   Die Szene nennt das ein „Bass-und-Oberstimmen-Modell“ zum Generalbass (JSON:41-42). Leere Quintklänge in Parallelbewegung widersprechen der Satzlehre, aus der Generalbass ausgesetzt wird, und sind nicht „akkordisch“. Das Hörmerkmal „tiefer und höherer Ton zugleich“ bleibt zwar richtig. Das Szenenmodell veranschaulicht die Aussage aber falsch.
   *Korrektur:* Bass im Bassschlüssel mit vollständigen Dreiklängen bzw. Terz/Sext darüber, z. B. `bass | 4/4 | C3/4 F2/4 G2/4 C3/4` mit einer zweiten Zeile `treble | 4/4 | (E4 G4 C5)/4 (F4 A4 C5)/4 (D4 G4 B4)/4 (E4 G4 C5)/4`. Wird das große System benutzt, die Grenzen von `GrandStaffView` beachten. Ohne zweites System genügen Dyaden in Terzen/Sexten. Hörfrage beibehalten.

3. **Klassik-Hörfrage: Gliederung ist akustisch nicht markiert.** `history-journey-draft.ts:37` (`E4 F4 G4 E4 | A4 G4 F4 E4`). `scoreTimeline` liefert acht gleich lange Töne zu je 0,667 s. Bei 2,667 s gibt es weder Pause noch längere Note noch Betonung (`play-example.ts` spielt ohne Dynamik). Die richtige Antwort „Zwei kurze Vierergruppen“ (JSON:73/151) folgt deshalb vor allem aus dem Ausschluss absurder Ablenker, nicht aus dem Gehörten.
   *Korrektur:* die Gruppen hörbar abschließen, z. B. `E4/4 F4/4 G4/4 E4/4 | A4/4 G4/4 F4/4 E4/4 | ` mit der letzten Note jeder Gruppe als Halbe und einer Pause (`… G4/4 E4/4 r/2 |`) oder klassisch als Vorder- und Nachsatz mit Halbschluss bzw. Ganzschluss (`C4/4 E4/4 D4/4 G4/4 | B3/4 D4/4 C4/2`). Ablenker sollten plausibel sein (z. B. „Drei Gruppen“, „Keine erkennbare Gliederung“).

4. **Auswahlzustand nur visuell (Barrierefreiheit).** `apps/mobile/src/app/history-journey.tsx:251-259`. Die Antwortknöpfe zeigen die Auswahl nur über `variant` primary/secondary. `Button` kennt `selected` (`packages/ui/src/native/button.tsx:30,104-108`, setzt `aria-pressed`/`accessibilityState`), es wird aber nicht übergeben. Screenreader melden die getroffene Wahl deshalb nicht. Das verstößt gegen „Feedback nie nur über Farbe“.
   *Korrektur:* `selected={choice === index}` an den Optionsknöpfen setzen und im Test prüfen.

## Zweifel / nicht blockierend

- **Quellenbezeichnung „P3.19“ ist ungenau.** `docs/plan/phase-4-v2.md` (+165) spricht vom „P3.19-Quellenabschnitt“, `zeitreise-musikgeschichte.md` vom „P3-Wissensartikel“. Tatsächlich ist `history.l2.period-contexts.article` ein P2.08-Artikel (`contentVersion 13`, Code-Kommentar draft.ts:3 sagt richtig „P2 period article“). Nur Fingerabdruck und Link-Mechanik stammen aus P3.19. Die Ziel-IDs und -Abschnitte existieren: 0 Mittelalter, 1 Renaissance, 3 Generalbass/Barock, 4 Klassik. Sie passen inhaltlich, und der Test öffnet sie. Die Dokumente sollten korrigiert werden.
- **Klassik-Szene zitiert Abschnitt 4,** behauptet aber „warnt vor starren Epochenschubladen“ (JSON:63/141). Diese Aussage steht in Abschnitt 5 (`baroqueClassical`: „Begriffe sind keine starren Schubladen“). Abschnitt 4 sagt nur „keine ausschließlichen Kennzeichen“. Entweder umformulieren oder Abschnitt 5 zusätzlich verlinken.
- **Mittelalter um 1250:** Die Szene (JSON:5/83) übernimmt „einstimmiger liturgischer Gesang … mögliches Merkmal“, lässt aber den Vorbehalt des Quellabschnitts weg („auch weltliche Traditionen und mehrstimmige Praktiken“). Gerade um 1250 sind Notre-Dame-Organum und Motette prägend (Suchauszüge: Notre-Dame-Schule ca. 1160–1250, die Motette wird um 1250 zur wichtigsten mehrstimmigen Form). Zusammen mit dem einstimmigen Modell und der Hörfrage „Eine“ verstärkt das das Klischee „Mittelalter = einstimmig“. Empfehlung: den Vorbehaltssatz aus Abschnitt 0 übernehmen.
- **Fakten geprüft und korrekt:** 1250 Mittelalter, 1550 Renaissance, 1720 Barock, 1780 Klassik in der groben europäischen Übersicht. Generalbass als Bassgrundlage mit akkordischer Ausführung entspricht dem Glossar (`glossary.ts:295-299`). Komponisten, Instrumente und Gattungen werden nicht genannt, Anachronismen in den Aussagen habe ich nicht gefunden.
- **Wissensfragen:** Jede hat genau eine richtige Antwort, aber die Lösung steht wörtlich in der vorher gezeigten Szene bzw. im Interview (z. B. Renaissance-Persona: „Werkjahr 1550 und den Quellenkontext“ gegenüber Option 3). Das ist eher Leseverständnis als Wissensprüfung. Viele Ablenker sind offensichtlich absurd („Ein Schlagzeugsolo“, „Nur eine Pause“, „Werkjahr und Aufnahmedatum“).
- **Lösungsleck nach Fehlversuch:** `history-journey.tsx:269-277` zeigt auch bei „Noch nicht richtig.“ die vollständige Erklärung (z. B. „Das Dossier nennt 1250“). Der erlaubte zweite Versuch ist damit trivial. Vorschlag: Erklärung erst nach richtiger Antwort oder neutralen Hinweis bei Fehler.
- **Interview:** Die Fiktion ist in DE und EN klar gekennzeichnet (`historyJourney.fictional`, Überschrift „Fiktives Interview“, Personennamen „Fiktive …/Fictional …“, „Kein Live-Gespräch“). Es werden keine realen Personen genannt und keine Zitate erfunden. Die Formulierung „KI-Fiktion als redaktionelles Rollenspiel“ ist etwas widersprüchlich, weil die Texte statisch sind. Inhaltlich sprechen die Personas meta („Im Lehrdossier steht …“) statt aus ihrer Zeit. Das ist fachlich sicher, erfüllt das Ziel „Geschichte erleben“ aber nur schwach.
- **Glossar:** Die Stationstexte schreiben „Generalbass/basso continuo“, „Vokalpolyphonie“ und „einstimmig“ direkt, statt `$t(glossary:…)` zu verwenden. Sie werden als Roh-JSON gerendert (nicht über i18next) und `check:i18n` deckt die Datei nicht ab. Die Begriffe stimmen derzeit mit dem Glossar überein und brauchen keine US/UK-Variante. Konventionsabweichung, kein inhaltlicher Fehler.
- **en-GB nutzt die en-US-Fassung:** vertretbar. Es kommen keine US/UK-abweichenden Fachbegriffe vor, „realization“ ist auch im bestehenden en-GB-Artikel so geschrieben. DE und EN sind inhaltlich gleichwertig, Rechtschreibfehler habe ich keine gefunden. „Tonlinien“ ist unüblich, „Stimmen“ wäre fachsprachlicher.
- **Bundle-Guard lückenhaft:** `tools/check-public-bundle.mjs` (+38-43) prüft nur Strings mit mehr als 24 Zeichen. Kurze Texte (Personennamen, Optionen) und Score-Kurzschriften werden nicht geprüft. Die Metro-Sperre `metro.config.js:29` für `@harmonia/content/history-journey-draft` ist toter Code, weil es diesen Export nicht gibt. Eine gleichwertige Sperre für den i18n-Entwurf fehlt. Die Isolation funktioniert trotzdem über die Exportzuordnung (siehe unten).

## Geprüft (womit)

- Diff `origin/main...HEAD` (22 Dateien) gelesen, ebenso Plan-, Artikel- und Glossartexte (DE, en-US, en-GB).
- Theorie-Engine bzw. Notation per `node --experimental-strip-types`: alle 8 Scores mit `parseScore` geparst, Intervalle mit `intervalBetween`, Timeline mit `scoreTimeline` (bpm 90). Ergebnisse siehe Fehler 1–3. Renaissance-Hören: m6/M6-Parallelen (zulässig), Mittelalter und Klassik einstimmig.
- `pnpm --filter @harmonia/mobile exec jest --runInBand __tests__/history-journey.test.tsx`: 3/3 bestanden.
- Produktions-Web-Export mit `APP_VARIANT=production npx expo export --platform web` in den Scratchpad, danach `node tools/check-public-bundle.mjs <export>`: bestanden. Grep im Export: keine Stationstexte, Scores, Personennamen oder Artikel-ID. Enthalten sind nur die UI-Rahmentexte (`historyJourney.*`, inkl. „unavailable“), was erwartet ist. Kein XP und kein Lernnachweis: Die Route schreibt nichts, der Test prüft das.
- Wiedergabe: `useExercisePlayback` stoppt bei Fokusverlust bzw. Navigation (`useFocusEffect`), im Hintergrund (`AppState`), beim Unmount und beim Wechsel des Items. Die Frage-Komponente ist pro Schritt neu verschlüsselt (`key`). Hörfragen lassen sich erst nach `heard` prüfen.
- Websuche (nur Suchauszüge) zu Ars antiqua/Notre-Dame und zum Quintenverbot.

## Nicht prüfbar

- Kein Primärtextabgleich (Literatur nur als Suchauszüge). Datierungen und Merkmalsaussagen sind nur gegen Standardwissen und Suchauszüge geprüft.
- Echte Audioausgabe, Screenreader (VoiceOver/TalkBack/Web), native Geräte: nicht ausgeführt. Der Jest-Test ersetzt Playback und ArticleExample durch Attrappen, die Notendarstellung wurde nicht visuell geprüft.
- GitHub-CI-Status von PR #99 nicht abgefragt.
