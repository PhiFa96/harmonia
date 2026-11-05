# Rohbericht Fachprüfung Stufe 5 – Entwurfs-PR #147 (05.11.2026)

Geprüft: `git diff origin/main...origin/codex/level-five-complete-draft` (2 Commits), Schwerpunkt `packages/exercises/src/counterpoint-context.ts` und `advanced-context.ts`. Inhaltstexte (`authored-content.json`, `level-five-exercise.json`) nur stichprobenartig über das Diff gesichtet, nicht vollständig gelesen.

## Befunde

1. **Hinweis** – `packages/exercises/src/counterpoint-context.ts:16-41`: Alle 24 fehlerfreien Modelle selbst nachgerechnet und zusätzlich mit `analyzeFirstSpecies` geprüft: 0 Befunde je Modell. Beginn auf Oktave/Quinte, nur konsonante Zusammenklänge, Schluss in Gegenbewegung auf die Oktave (Gegenstimme 2→1 bzw. Leitton, Unterstimme 2→1 oder 7→1), keine verdeckten/offenen Parallelen gefunden. Keine fachlich falsche Lösung festgestellt.
2. **Nacharbeit** – `counterpoint-context.ts:20-22,24-26,30,32,35,37,38` (12 von 24 Modellen): Der Cantus schließt mit B3→C4 (7→1, Gegenstimme D5→C5 über kleine Dezime). Satztechnisch zulässig und von der Engine akzeptiert, entspricht aber nicht der Fux-Konvention, nach der der Cantus firmus mit 2→1 schließt und der Leitton in der Gegenstimme liegt. Für Lernende kann das als „Cantus-Muster“ missverstanden werden; entweder im Erklärtext als Variante (Cantus in der Unterstimme mit Leittonklausel) kennzeichnen oder Anteil reduzieren.
3. **Hinweis** – `counterpoint-context.ts` Konsonanzliste: C–E (gr. Terz), C–Es (kl. Terz), D–F (kl. Terz), E–H (r. Quinte), C–G, C–A, C–C → ja; C–F (r. Quarte, zweistimmig dissonant), C–Dis (übermäßige Sekunde, enharmonisch ≠ kl. Terz), C–Ges (verm. Quinte), C–H (gr. Septime), F–H (übermäßige Quarte) → nein. Stammton- und Halbtonabstand jeweils korrekt unterschieden.
4. **Hinweis** – Bewegungsmodelle nachgerechnet: E4/C5→D4/H4 parallel (similar), D4/A4→C4/H4 Gegenbewegung, D4/H4→D4/A4 Seitenbewegung, E4/G4→E4/G4 statisch – korrekt.
5. **Hinweis** – `counterpointDyads`: Bei zwei Systemen gilt erstes System = Gegenstimme, zweites = Cantus, auch bei Stimmkreuzung; der Fehlerfall 2 (Gegenstimme eine Terz unter dem Cantus) wird damit als Kreuzung erkannt und am klingenden Intervall bewertet. Einsystemige Altquellen behalten die tief/hoch-Konvention (dort ist Kreuzung prinzipiell nicht darstellbar) – als Grenze dokumentiert, kein Fehler.
6. **Hinweis** – Mengenlehre/Reihen (`advanced-context.ts`): Zufällige Mengen der Kardinalität 1–4 erzeugen Intervallklassenvektoren außerhalb der vier festen Ablenker; korrekt nur, weil `options(answer, …)` die berechnete Antwort einfügt (Engine ist Orakel, durch neue `*.tonal.test.ts` gegengeprüft). Reihen-Transformation erzwingt genau eine passende Operation, Fallback auf eigene asymmetrische Reihe nach 15 Versuchen.

Keine Blocker gefunden.

## Ausgeführte Tests

- `node --test tools/level-five-complete.test.mjs`: 3/3 bestanden.
- `pnpm --filter @harmonia/theory test`: 31 Dateien, 892/892 bestanden.
- `pnpm --filter @harmonia/content test`: 52 Dateien, 1479/1479 bestanden.
- Zusätzlich `vitest run src/advanced-context-complete` (exercises): 2 Dateien, 10/10; temporäre Modellprüfung aller 24 Modelle mit `analyzeFirstSpecies` (Datei danach entfernt).

## Grenzen

Kein Primärliteraturabgleich (Fux/Jeppesen) im Volltext, keine vollständige Lesung der DE/en-US/en-GB-Texte und Glossarverweise, keine Browser-/E2E-Läufe (`e2e/web/level-five-complete.spec.mjs` nicht ausgeführt), kein `pnpm check:i18n`/`check:content`. Analyse-/Imitationsthemen (form-sections, minimal-phase, Motivtransformation) nur am Code, nicht an Beispielausgaben geprüft.
