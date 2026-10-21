> Rohbericht des unabhängigen Prüfers (ADR 0005), Stand 21.10.2026 **vor** den Korrekturen. Lesender Durchgang; Literatur nur über Suchauszüge, keine Primärtexte, keine Geräte-, Stimmen- oder Screenreader-Prüfung. Behobenes und Offenes: [fachpruefung-phase-4-entwuerfe.md](../../plan/fachpruefung-phase-4-entwuerfe.md). Die erwähnten Skripte lagen im flüchtigen Arbeitsordner.

# Fachprüfung PR #100 – P4.09 Satzwerkstatt / SATB-Stimmführung (ADR 0005, unabhängiger Durchgang)

Stand 21.10.2026, Arbeitsbaum `/home/user/wt-p100` (HEAD `bb02442`), ausschließlich lesend. Eigene Proben liegen unter
`/tmp/claude-0/-home-user-harmonia/d8012a17-7bc8-5e99-a1ac-05669fee1add/scratchpad/p100/` (`probe1.ts`–`probe4.ts`, `fuzz.ts`, `fuzz2.ts`, `omt/`).

## Fehler

### F1 – Falsch-Negativ: Quint-/Oktavparallelen zwischen gekreuzten Stimmen werden verschwiegen
- Stelle: `packages/theory/src/voice-leading.ts:255-258` (`continue`, sobald eine Stimme in einem der beiden Schnitte gekreuzt ist); `perfectClass` (`:292-303`) gibt bei negativer Richtung `undefined` zurück.
- Gegenbeispiel (`probe1.ts`, Fall C): Bass G3→A3, Tenor C3→D3 (Bass in beiden Schnitten über dem Tenor). Beide Stimmen bewegen sich gleichgerichtet in reinen Quinten (C3–G3 → D3–A3). Ergebnis mit `parallel-fifth` eingeschaltet: nur `voice-crossing`, keine Parallele. Ist `voice-crossing` nicht eingeschaltet, bleibt der Befund vollständig stumm. Analog bei Gegenquinten mit Stimmtausch (Fall R: Bass C3→A3, Tenor G3→D3).
- Beleg: OMT R1 (Commit a907aa0, `bassoContinuo.md`, Schlussliste, direkt gelesen): „No parallel fifths or octaves between any pair of voices.“ Die Kreuzung hebt die Parallelführung zweier bestimmter Stimmen nicht auf; das ist auch die mir bekannte Lehrbuchauffassung (Aldwell/Schachter, Kostka/Payne – nur aus Fachkenntnis, kein Primärtextabgleich). Die Ausnahme ist weder in `docs/plan/stimmfuehrung-entwurf.md` noch im Quellenentwurf dokumentiert und durch keinen Test begründet (nur der Codekommentar „scheinbare Parallelen“).
- Korrektur: Intervallklasse für das Stimmpaar richtungsunabhängig bestimmen (tiefere/höhere klingende bzw. diatonisch tiefere Note zuerst; bei gleicher MIDI-Höhe nach `diatonicIndex`) und die `continue`-Zeile entfernen. Bewegungsrichtung weiter je Stimme. Testfälle: konsequent gekreuzte Parallelquinten/-oktaven → Befund; Stimmtausch P5 → P4 (Umkehrung) → kein Befund. Alternativ, falls die Ausnahme gewollt ist: als Stilentscheidung dokumentieren und im Bericht ausweisen.

### F2 – Quellenentwurf gibt R1 zu verdeckten Quinten ungenau wieder
- Stelle: `docs/quality/p4-09-quellenentwurf.md`, Zeile `hidden-fifth`, `hidden-octave`: „R1 erlaubt verdeckte Quinten und Oktaven mit schrittweisem Sopran“.
- Beleg (R1 wörtlich): „Do not approach an octave between the outer voices by similar motion unless the melody moves by step. (All other direct/hidden fifths and octaves are permissible.)“ R1 beschränkt also nur verdeckte **Oktaven** in den Außenstimmen; verdeckte Quinten sind dort auch bei Sopransprung erlaubt. Der Test in `voice-leading-motion.test.ts` bildet das richtig ab, der Tabellensatz nicht.
- Korrektur: „R1 beschränkt nur verdeckte Oktaven der Außenstimmen (bei Sopransprung); alle übrigen verdeckten Quinten/Oktaven erlaubt R1 ausdrücklich. `hidden-fifth` mit `soprano-leap` ist daher eine strengere, nicht durch R1 belegte Variante (Kostka/Payne-Konvention noch nicht im Primärtext abgeglichen).“

### F3 – Fehlerart bei unvollständigen Stimmumfängen
- Stelle: `packages/theory/src/voice-leading.ts:320-325`. Fehlt in `options.ranges` eine Stimme, entsteht `TypeError: Cannot read properties of undefined (reading 'min')` statt des dokumentierten `RangeError` (Plan: „Fehlende erforderliche Parameter … lösen RangeError aus“). Probe: `probe2.ts`, „ranges partial“. Der Bericht-CLI ist über sein Zod-Schema nur teilweise geschützt; die Engine-API selbst nicht (TypeScript-Typ verhindert es nur statisch).
- Korrektur: `if (!range) throw new RangeError(\`Stimmumfang fehlt: ${voice}\`)` vor dem Zugriff; Test ergänzen. Kein fachlicher, aber ein Vertragsfehler.

## Zweifel / nicht blockierend
1. **Überschreitung nach Unisono:** Tenor/Alt C4=C4 → D4=D4 meldet `voice-overlap` (zusätzlich zu `parallel-unison`); ebenso bei gleichgerichtetem Unisono in punktierten Rhythmen (`probe4.ts`). R2 definiert Überschreitung als „one voice leaps past the previous note of the other voice“. Formal erfüllt, aber didaktisch doppelt; F05 entscheiden.
2. **Mehrfachmeldungen bei Verdopplung:** Eine Oktavverdopplung in drei Stimmen erzeugt drei Paarbefunde je Schritt (`probe4.ts`, Auftaktfall). Paarweise korrekt, im Bericht aber laut.
3. **Auftakt im Bericht:** `tools/voice-leading/report.ts:202` zählt den Auftakttakt als „Takt 1 · Position 0“. Übliche Zählung: Auftakt = Takt 0, metrische Position z. B. 3/4 im 4/4-Takt. Die Hilfe „ab 1 gezählt“ ist konsistent, aber für Fachleser missverständlich.
4. **Weitere übermäßige Melodieschritte (A4 u. a.)** werden nicht als eigene Regel erfasst; nur `augmented-second`. Als Falsch-Negativ gegenüber verbreiteten SATB-Lehrbüchern möglich (nicht im Primärtext belegt) – F05.
5. **`soprano-leap`** zählt eine übermäßige Sekunde als Schritt (diatonisch 1). Vertretbar, sollte F05 festhalten.
6. **Leitton nur nach Schreibweise:** In cis-Moll wird ein enharmonisch falsch notiertes C (statt His) nicht als Leitton geprüft. Konsistent mit „geschrieben“, aber Lernende mit falscher Schreibweise bekommen dann keinen Auflösungsbefund.
7. **`doubled-leading-tone`** meldet auch in iii/III-Kontexten; OMT R1 („Generally, do not double … ti“) trägt das, viele SATB-Texte erlauben Ausnahmen – F05.
8. **Versetzte/über Pausen hinweg gesetzte Parallelen, Akzentparallelen, Dissonanzübertragung, V4/3–I6 mit aufsteigender Septime, schrittweise absteigender Leitton** werden nicht erkannt bzw. dürfen vom Aufrufer nicht markiert werden. Im Plan überwiegend dokumentiert; die V4/3-Ausnahme fehlt in der Liste.
9. **`upper-voice-spacing` (S–A, A–T ≤ Oktave)** entspricht nach meiner Fachkenntnis der verbreiteten SATB-Lehrbuchkonvention (Kostka/Payne, Aldwell/Schachter); im Repo zu Recht als „SATB-Quelle offen“ markiert, da kein Primärtext abgeglichen ist.
10. **Begriffe:** „Gegenquinte/Gegenoktave“ ist verständlich; üblich sind auch „Antiparallelen“/„Quinten/Oktaven in Gegenbewegung“. Für F05/Glossar festlegen.

## Geprüft (womit)
- Code gelesen: `packages/theory/src/voice-leading.ts`, `packages/notation/src/voice-leading.ts`, `tools/voice-leading/messages.ts`, Teile von `report.ts`, `workbench-messages.ts`, `example.json`, Plan und Quellenentwurf.
- Bestehende Tests: theory 65/65, notation 11/11 grün.
- Fuzz gegen `tonal` (`fuzz2.ts`): 69 731 konstruierte Zweistimmenfälle mit Doppelvorzeichen, P1/P8/P15/P5/P12/P19, d5/A4, d6, d2, A7, d8/A8, A1 → Klassifikation parallel/gegen × Quinte/Oktave/Prime 0 Abweichungen (bei nicht gekreuzten Lagen). Enharmonik (Cis/Des, P5 vs. d6, d5→P5, P5→d5) korrekt nach Stammton+Halbton.
- Gegenbeispiele (`probe1.ts`, `probe2.ts`): d5→P5 und P5→d5 kein Befund ✓; Tonwiederholung/Halten kein Befund ✓; Doppel-/Mehrfachoktaven ✓; Unisono→Oktave (gleich/gegen) ✓; verdeckte Oktave Sopranschritt/-sprung ✓; Überschreitung strikt > ✓; Abstand 13 Halbtöne ✓; übermäßige Sekunde auf/ab, enharmonische kleine Terz ausgenommen, doppelt übermäßige Sekunde nicht gemeldet ✓; Leitton His in cis-Moll ✓, Ces-Dur (Leitton B) ✓, Sopran-Ausweichen gemeldet / Alt-Ausweichen erlaubt ✓; Septime Halbton/Ganzton abwärts ✓, übermäßige Prime/Pause gemeldet ✓; Stimmumfang inklusive und enharmonisch (Fes2=E2) ✓; Sprunggrenze nach geschriebenem Intervall (His2→C2 = Septime) ✓.
- Partituradapter (`probe3.ts`, `probe4.ts`): Triolen (1/12-Schritte), Punktierung (3/8), Haltebogen über Taktstrich (Takt/Offset/Ursprungsnote korrekt), Auftakt + Taktwechsel 4/4→3/4 (Positionen 0, 1/4, 3/4, 5/4 korrekt), Pausen, Neu-Meldung nach Neuanschlag. Befundreihenfolge deterministisch (Schnitt, dann feste Paar-/Regelreihenfolge; Brüche normalisiert).
- Berichtstexte DE/EN-US/EN-GB: Bezeichnungen fachlich korrekt; US/UK konsistent (leading tone/note, measure/bar, neighbor/neighbour, half step/semitone, fulfill/fulfil, license/licence, whole note/semibreve); H/B-Lokalisierung in Tabellen; kein Gesamturteil („beurteilt nicht die vollständige Richtigkeit“, leere Befundliste ≠ Freigabe) ✓.
- Quellen: OMT R1, R2, R3, R6 (und Auszug R4) am gepinnten Commit über raw.githubusercontent.com selbst gelesen. Bestätigt: Parallelen zwischen allen Paaren, Gegenquinten/-oktaven nur Außenstimmen, Kreuzungs-/Überschreitungsdefinition (R2), Oberstimmen-Oktavspanne (R1), Leitton inkl. Frustrated Leading Tone und schrittweisem Abstieg (R3), Septime abwärts in derselben Stimme und Übertragung (R3), übermäßige Sekunde le–ti (R4). Abweichung: F2.

## Nicht prüfbar
- Aldwell/Schachter, Kostka/Payne, Laitz, de la Motte, „Schule des Tonsatzes“: kein Primärtextzugang; Aussagen dazu oben nur aus Fachkenntnis und ausdrücklich so gekennzeichnet.
- F05 (Stimmumfänge, Schweregrade, Stilprofil) – bewusst offen.
- Browser-/Workbench-E2E (inkl. bekanntem Überlauf `e2e/voice-leading/workbench.spec.mjs:284` bei 390 px) und Wiedergabe: nicht ausgeführt, kein eigener Befund.
- R5 (`intervals.md`) nicht gelesen.
