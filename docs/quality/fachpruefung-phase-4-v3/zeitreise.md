# Fachliche und funktionale Prüfung – PR #144 „P4.12 Zeitreise mit gestuften Hinweisen“ (Rohbericht)

Prüfstand: `git diff origin/main...origin/codex/history-journey-complete-draft`, lokal in `claude/stoic-pascal-eaoojx` gemergt. Datum 05.11.2026. Prüfer: Claude (Sonnet 5.5). Keine Dateien außer diesem Bericht geändert.

## Ergebnis

Keine Blocker. Vier Stationen (Mittelalter 1250, Renaissance 1550, Barock 1720, Klassik 1780) sind epochal korrekt eingeordnet und als europäischer Überblick/fiktives Dossier gekennzeichnet. Jede Wissens- und Hörfrage hat genau eine richtige Antwort. Rollen sind als „Fiktive/Fiktiver …“ und durch redaktionelle Rollenspiel-Kennzeichnung erkennbar.

## Befunde

1. **Nacharbeit** – `packages/i18n/src/history-journey-draft.json` (de/en: `renaissance.knowledgeHints[1]`, `baroque.listeningHints[1]`, `medieval.listeningHints[1]`): Hinweis 2 nennt praktisch die Lösung (z. B. „Wiederaufgreifen eines Melodieanfangs“, „ob die höhere Tonhöhe erst nach der tieferen beginnt oder beide vom selben Beginn an“). Als Stufe „Lösung eingrenzen“ vertretbar, laut ADR 0071 gewollt; ein didaktischer Prüfer sollte entscheiden, ob Stufe 2 weniger direkt formuliert wird.
2. **Nacharbeit** – `packages/content/src/history-journey.ts:86-92` (`revealHistoryHint`) und `apps/mobile/src/app/history-journey.tsx` (Button „Weiteren Hinweis anzeigen“): Hinweis 2 ist schon nach dem ersten Fehler ohne zweiten Versuch abrufbar. Das ist in ADR 0071 ausdrücklich so entschieden und getestet; Hinweis auf die Wirkung (Lernende erreichen die fast verratende Stufe sofort).
3. **Hinweis** – `history-journey-draft.json` (`medieval.scene`, `baroque.scene`): Die Szenentexte nennen Jahr 1250 bzw. „Bassgrundlage mit akkordischer Ausführung“ bereits wörtlich; die Wissensfragen prüfen damit überwiegend Quellenlesen statt Transfer. Passt zur Quellenbindung (Artikelabschnitt), keine Korrektur nötig.
4. **Hinweis** – `history-journey-draft.ts` (classical `sceneScore`/`listeningScore`): Je vier Achtel plus halbe Pause füllen genau einen 4/4-Takt; Text „füllen jeweils nur einen Teil eines Takts“ und „Pause dazwischen“ stimmen, das Modell hat aber auch eine Schlusspause nach Gruppe 2 (Erklärung „durch eine Pause getrennt“ ist nicht falsch, aber unvollständig). Zudem ist „Motiv“ für eine Viertongruppe konventionsabhängig (mancher Lehrtext spräche von kurzer Phrase). Die falschen Optionen sind trotzdem eindeutig falsch (vier Takte, ausgearbeitete Periode).
5. **Hinweis** – `history-journey-draft.ts` (baroque): Das „Bass“-Modell liegt im Violinschlüssel (C4/A4, G3/E4), parallele Sexten; Beschriftung „Bass-und-Oberstimmen-Modell“ ist eine Vereinfachung. ADR 0071 benennt sie als nicht idiomatisch; kein Sachfehler.
6. **Hinweis** – Verifiziert: Klassik-Satz in `authored-content.json` (de/en-US/en-GB, drei Stellen) korrigiert („nicht in allen Werken der Klassik … auch in anderen Epochen“), Glossar `motif`/`phrase_other` gebunden, Rollenname „Generalbass“ über Glossar.
7. **Hinweis** – en-GB: Überschreibungen vorhanden für realisation, practise, labelling (Barock-Titel/Szene/Erklärung/Antworten/Hinweise, Klassik-Frage). Keine übrigen US-Schreibweisen in den von en-US geerbten Texten gefunden (Stichprobe aller 202 Zeilen). `measure` kommt über das Glossar als „bar“.
8. **Hinweis** – Keine fremden Texte erkennbar; Texte, Noten und Szenen wirken eigen formuliert. Primärliteratur-/Quellenabgleich und unabhängige Sprachprüfung bleiben offen (Status `entwurf`).
9. **Hinweis** – Logik `checkHistoryQuestion`: Stufe 1 nach erstem Fehler, danach Stufe 2; richtige Antwort sperrt und blendet Hinweise aus; ungültige Indizes werden verworfen. Quellenaufruf mit Anfragezähler verwirft späte Antworten. Keine Fehler gefunden.

## Ausgeführte Tests (nacheinander)

- `pnpm check:i18n`: bestanden („Übersetzungen vollständig“).
- `pnpm --filter @harmonia/content exec vitest run history`: 2 Dateien, 15 Tests bestanden.
- `pnpm --filter @harmonia/i18n exec vitest run history`: 2 Dateien, 25 Tests bestanden.
- `pnpm --filter @harmonia/mobile test -- history`: 1 Suite, 16 Tests bestanden.

## Grenzen

Nicht ausgeführt: Playwright/Browserproben (`e2e/web/history-journey.spec.mjs`), Deno-Prüfungen, Typecheck/Lint, Bundleguard/Produktions-Export, CI. Keine Primärliteratur gelesen; Bewertung nach Fachwissen und Abgleich mit dem Artikeltext `levelTwoPeriodContexts`. Audio nur über Notenkurzschrift inspiziert, nicht gehört. Keine reale Geräte-/Screenreader-Prüfung.
