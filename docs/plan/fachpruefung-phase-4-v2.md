# Fachlicher und funktionaler Prüfdurchgang der Phase-4-Entwurfskette (#103–#132)

Stand: 31.10.2026. **Ergebnis: geprüft, Blocker behoben, nichts freigegeben.** Geprüft wurde die gestapelte Codex-Kette von 27 Entwurfs-PRs (#103–#111, #115–#132; Spitze `a8738ff`, 41 Commits) vor ihrer Integration nach `main`: Schulwerkstatt P4.13–P4.16, KI-Prüfstand P4.17, Zertifikatsprototyp P4.18, Stufe 5 P4.19 sowie Nacharbeit an Satzwerkstatt P4.09, Tonsatz-Korrektor P4.10, Chor-Trainer P4.11 und Zeitreise P4.12. Alle Inhalte bleiben `entwurf`. Der öffentliche Katalog enthält null Lektionen (Inhaltsversion 27). Der Tutor-Prompt ist Version 5 mit Werkzeugversion 3, eine echte Kalibrierung steht weiter aus. P4.01 bleibt wegen F14 und der Rechtslage zurückgestellt; F03 und F05 sind nicht entschieden. Dieser Durchgang ist technische Vorarbeit und keine Startentscheidung für Phase 4.

## Vorgehen

Nach ADR 0005 haben fünf unabhängige Prüfer mit frischem Kontext je einen eng begrenzten Commitbereich nur lesend geprüft:

- **A:** Stufe 5 (#103, #111)
- **B:** Tonsatz-Nacharbeit (#116, #119, #122, #123, #126, #127)
- **C:** Chor und Zeitreise (#115, #117, #118, #120, #121, #124, #128, #129, #131, #132)
- **D:** Schule (#105–#108)
- **E:** KI-VO, Zertifikat, Tutor-Kontext und CI (#104, #109, #110, #125, #130)

Prüfmittel:

- **Theorie-Engine und Generatoren:** `tonal` als Orakel, unter anderem für alle 4095 Tonklassenmengen und je 3000 Seeds der zehn Stufe-5-Analysethemen.
- **Vollständige Aufzählung:** 60.811 profilgültige Sätze der 18 P4.10-Varianten, mit `tonal`-Gegenprobe und 360.000 Zufallskandidaten.
- **Gerenderte Texte** in DE/US/UK.
- **Proben** gegen den Zertifikatsdienst und die Chorbewertung.
- **Quellen:** OMT firstSpecies.md am festen Commit und der amtliche Explorer der KI-Verordnung für Art. 113.

Jeden als behoben geführten Befund habe ich vor der Korrektur selbst nachvollzogen, per Handrechnung, Engine-Gegenbeispiel, Probe oder Code-/Quellenlesung. Jede Korrektur hat einen Regressionstest, der ohne die Korrektur rot ist. Die Punkte der Nacharbeitsliste sind Aussagen der Prüfer und nicht alle einzeln von mir nachgerechnet. Rohberichte (Stand vor den Korrekturen): [`docs/quality/fachpruefung-phase-4-v2/`](../quality/fachpruefung-phase-4-v2/).

**Funktionsprüfung lokal**, auf der Spitze und erneut nach allen Korrekturen: Format, Lint und Paketgraph, Typen, Vitest aller Pakete, Jest der App, `test:tools`, `certificates:test`, `check:i18n`, `check:content`, `check:curriculum`, `check:knowledge`, `check:tutor:catalogue`, `check:legal`, `check:ai`, `check:certificates` und `check:reviews`. Lint und Jest brauchen wie in der CI `NODE_OPTIONS=--max-old-space-size=4096`.

**Grenzen:**

- Die Schul-Datenbanktests (39 von 52 in `school:test`), pgTAP, Supabase/RLS, Deno und die Playwright-Proben liefen lokal nicht, weil Docker Hub das Postgres-Image mit 429 abgewiesen hat und Deno nicht installiert ist. Diese Prüfungen übernimmt die GitHub-CI (alle fünf Jobs waren an #132 grün).
- Als Primärliteratur lagen nur OMT firstSpecies.md und Art. 113 der KI-Verordnung vor, keine weiteren Lehrbücher.
- Keine Geräte-, Mikrofon-, Stimmen-, Kopfhörer- oder Screenreader-Abnahme.
- Kein reales Tutor-Modell und keine Rechtsprüfung.

## Behoben (mit Tests)

| PR | Befund | Korrektur / Nachweis |
|---|---|---|
| #104/#110 | Die Zertifikats-Prüfungsansicht gab mit jeder Notenbild-Frage `describeScore` aus („Ganze Note, eingestrichenes e“, „chord: G 4, C 5, E 5“). Damit waren Notennamen-, Intervall- und Dreiklangsfragen allein aus dem Screenreadertext lösbar, in Probe bei rund 10 von 12 Fragen je Prüfung. Bei Vorzeichnungsfragen fehlte die Vorzeichnung in der Beschreibung ganz. | `exerciseDescription` wie in der App (Positionen statt Tonnamen). Der Durchlauf aller Stufen und Sprachen prüft, dass keine Beschreibung eine Tonhöhe nennt (vorher 6 Läufe rot). |
| #103 | `closing-motion` wies den regulären Schluss Cantus ti–do unten, Gegenstimme re–do oben in die Oktave ab (H3/D5 → C4/C5, kleine Dezime). | Vergleich über das einfache Intervall; die große Dezime bleibt Fehler. `counterpoint.test.ts`. |
| #103 | Gekreuzte Stimmen: Unten G4 / oben E4 meldete zusätzlich „Dissonanz“, Quintparallelen zwischen gekreuzten Stimmen (A4/D4 → H4/E4) blieben unerkannt. ADR 0038 sagt die Prüfung fest zugewiesener Stimmen zu. | Konsonanz und vollkommene Klassen werden am klingenden Intervall gemessen, die Kreuzung wird getrennt gemeldet, wie im SATB-Profil. Test ohne Korrektur rot. |
| #103 | Rückmeldung „nicht zugelassene Konsonanz“ / „not an allowed consonance“ für Quarten, Sekunden und übermäßige Intervalle, also für Dissonanzen. Deutsche Regeltexte mit Anglizismen („perfekte Intervallklasse“, „direkte Perfektionen“). | „Dissonanz: kein zugelassener konsonanter Zusammenklang“ / „dissonance: not an allowed consonant interval“. Im Deutschen „vollkommene Konsonanz“ und „verdeckte Quinten und Oktaven“; der Schlusstext nennt die kleine Dezime. |
| #103 | Bildunterschrift „Durchgang“ / „passing note“ für C–D–G: D wird per Quartsprung verlassen. | „fügt einen weiteren Ton ein und ändert den Rhythmus“; Englisch über das Glossar (`measure`). |
| #103 | `analysis.l5.methods` fragt `motif-transform` (gelehrt in `counterpoint.l5.imitation`) und `set-cardinality` (gelehrt in `contemporary.l5.sets`) ab, ohne beide Einheiten vorauszusetzen. | Voraussetzungen ergänzt, die Analyse-Einheit im Plan hinter die Mengenlehre gesetzt, Diagramme neu erzeugt. Neuer Test: Stufe-5-Lektionen fragen nur Kontextthemen aus vorausgesetzten Einheiten ab (ohne Korrektur zwei Treffer). |
| #103/#119 | en-US der Stufe 5 war eine Kopie des en-GB („bar“, „semitone“, „organise“), ohne einen einzigen Glossarverweis. Die Satzwerkstatt-Einführung schrieb „bars“ in en-US und „leading tone“ in en-GB. | 68 Texte: `bar`/`semitone` über das Glossar, am Satzanfang „Measure“ in en-US und „Bar“ in en-GB, -ize in en-US, „leading note“ in en-GB. Gerendert in beiden Varianten geprüft; ein Test, der „Bar 2“ für en-US erwartete, ist angepasst. |
| #116/#119 | Tonika ohne Quinte war nach jedem D7 erlaubt; Lerntext und Lehrbuchregel erlauben sie nur nach vollständigem D7 (unvollständiger D7 → vollständige Tonika). | Prüfung der Vollständigkeit des vorangehenden Septakkords. Neuer Test für den unvollständigen D7; der bestehende Test „vollständiger D7 → unvollständige Tonika“ bleibt grün. |
| #128/#129/#132 | Chor: Mit der inklusiven Grenze ±50 Cent bestand ein einziger gehaltener Ton genau zwischen den beiden Zieltönen der Altstimme (ein Halbton Umfang) alle Fenster; die Oktavkorrektur war unbegrenzt (−3 bis +4 Oktaven). | Grenze exklusiv (genau 50 Cent liegt mittig zwischen zwei Halbtönen); Oktavkorrektur höchstens ±2. Tests für konstanten Ton, ±49/±50 und ±2/±3 Oktaven. Profiltext DE/US/UK, Plan und Nachtrag in ADR 0061. Keine echten Lernnachweise betroffen: Der Chor-Inhalt war nie veröffentlicht. |
| #109 | ADR 0044 nannte neun Funktionsbereiche, Inventar und `check:ai` haben zehn. Die Vorprüfung behauptete einen „technischen“ Ausschluss der emotionalen Inferenz. | Zehn Bereiche; der Ausschluss ist als Zweckfestlegung im Inventar und Prompt beschrieben, nicht als Codesperre. |

## Geprüft ohne Befund (Auszug)

- **Zertifikat:**
  - Nur der Server bewertet, Payload-Schlüssel sind exakt.
  - Zeit kommt vom Server, die Frist ist exakt (20 Minuten); Wiederholungen sind idempotent.
  - Ein Code entsteht nur bei 80 % und 128 Bit Zufall; die Prüfung liefert nur Minimaldaten.
  - Das Muster-PDF ist ohne Personendaten und als ENTWURF/UNGÜLTIG markiert; die Release-Sperre greift.
  - Der DST-Fix 74f6449 stimmt (29.03./25.10.2026).
- **KI-VO:**
  - Alle Scopes scheitern mit `--release`; eine juristische Freigabe wird nirgends behauptet.
  - Art. 113 ist gegen den amtlichen Explorer geprüft.
- **CI-Fallback #130:** nur offizielle Registries, keine Zugangsdaten, `contents: read`.
- **Stufe 5:**
  - 0 Abweichungen gegen `tonal`; Intervallvektor und T/I/R/RI korrekt.
  - Alle Inhalte stehen auf `entwurf`, `published.json` ist leer.
  - Die Wissens-Migrationen sind rückwärtskompatibel, RLS ist unverändert.
  - Die Vorschau-Wiederaufnahme prüft Besitzer, Quelle und Version.
- **P4.10:**
  - Musterlösungen sind in allen drei Tonarten profilgültig, Stimmumfänge auch nach Transposition eingehalten.
  - Übermäßige Melodieintervalle werden nach Stammton- und Halbtonabstand getrennt erkannt.
  - Gruppierung und Regelauswahl verlieren keine Befunde.
- **Chor:**
  - Die Bestehensregel aus ADR 0064 ist in Client und Server konsistent; ohne gelieferten Ton ist kein Bestehen möglich.
  - Keine Parallelen in den Miniaturen; Schlüssel und Stimmumfänge liegen im üblichen Rahmen.
- **Zeitreise:**
  - Epochenaussagen sind vorsichtig und richtig; die Interviews sind als fiktiv gekennzeichnet, ohne erfundene Zitate realer Personen.
  - Die Produktionssperre greift (Metro, Bundle-Wächter, alle 8 Partituren).
- **Schule:**
  - RLS auf allen 21 Tabellen; Definer-Funktionen mit `search_path=''`.
  - Keine Rollenerhöhung möglich; Fremdklassen sind isoliert.
  - Quizlösungen erst nach der Runde; Platzvergabe atomar; Fristen sind serverseitig in SQL.
  - Keine Supabase-Migration, keine App-Route.

## Nacharbeitsliste (nicht blockierend, offen)

Harte Vorbedingungen vor jeder echten Nutzung:

- **Schule D-F1:** Identität über `school_draft.actor` und eine fest einkodierte Betreiber-UUID; vor einer Übernahme an `auth.uid()` und eine echte Betreiberbindung binden.
- **Schule D-F2:** Die Einwilligung `school-draft-sharing-v1` nennt nur Lernbereiche, Quoten und Beispiellektionen, deckt seit P4.14/P4.15 aber auch Aufgaben- und Quizergebnisse ab. Vor echter Nutzung braucht es einen neuen Einwilligungstext mit neuer Version; eine stille Textänderung genügt nicht.

**Schule:**
- **D-F3:** Das Pseudonym ist aus der Konto-UUID abgeleitet und klassenübergreifend gleich; Berichte enthalten die volle UUID.
- **D-F4:** Export, Löschkaskade und Retention fehlen (dokumentiert); `ON DELETE` fehlt bei `invites.issuer` und `license_events.actor_id`.
- **D-F5:** Frist und Abschluss werden nur im Servicecode erzwungen, nicht per `WITH CHECK`.
- **D-F6:** Betreiber- und Lehrerrechte auf `license_events.target` und `quiz_players` sind breiter als die Doku.
- **D-F7:** Selbstzuweisung der Verwaltung ohne Protokoll.
- **D-F8:** `FOR UPDATE` in jedem 1-s-Stream (Last).
- **D-F9:** Quiz-/Klassencodes ohne Drossel.
- **D-F10:** `23505` liefert im Quiz 500.
- **D-F11:** Sitzungen ohne Ablauf.
- **D-F12:** Die Lizenz-Kandidatenliste zeigt der Verwaltung alle Lernenden.
- **D-F13:** Testlücken zu F4–F7 und F9.

**Zertifikat/KI:**
- **E2:** Tutor-Modi `explain`/`solution` enthalten Lösung und Rückmeldung ohne serverseitigen Versuchsnachweis. Das war mit `checked:true` schon vorher möglich; #125 entfernt nur das wirkungslose Flag und behebt das Vertrauensproblem nicht.
- **E3:** Die Prüfbindung hasht `playback.ts`, aber nicht dessen Importe.
- **E4:** Ein veralteter Datensatz blockiert alle Durchgänge des Besitzers (409).

**Stufe 5:**
- **A7 (Rest):** „Intervallklasse“ steht zugleich für ic1–6.
- **A8:** Fugenantwort DE „häufig“ / EN „sometimes“; „serielle Darstellung“ meint „nacheinander“.
- **A9:** Entwicklerhinweise im Lerntext (`modelBoundaryBody`, `motifInversionBody`).
- **A10:** Spektralmodell im Bassschlüssel mit 3–4 Hilfslinien.
- **A11:** Geringe Aufgabenvielfalt (ein auswendig lernbares korrektes Kontrapunktmodell, `row-validity` verdoppelt immer die erste Tonklasse, `set-cardinality` nie 2).
- **A12:** Cantus und Gegenstimme sind nicht unterscheidbar notiert.
- **A15:** Jede Lektion trägt alle drei Fähigkeiten, deshalb laufen die Ratings gleich.
- „directed half step intervals“ im en-US klingt holprig.

**P4.09/P4.10:**
- **B1:** Jede Fehlerwiederholung gleicht einer anderen Erstaufgabe (reine Transposition); die Lösungszahl schwankt je Tonart (36/211/179).
- **B3:** `soprano-leap` wertet die übermäßige Sekunde als Schritt (ADR 0058, bewusst).
- **B4:** Die chromatische Prime C–Cis zählt als übermäßiges Melodieintervall; stilistisch üblich, als `error` problematisch.
- **B7:** „Entwurfsprofil“ in `caption5`.
- **B8:** Die Einführung zeigt keine Akkordverbindung.
- **B9:** Verdoppelte Terz in I/IV sowie Außenstimmen in Gegenbewegung in Quinte/Oktave bleiben ohne Befund.
- **B10:** Abstände im Auftakt zählen ab der ersten notierten Note.
- **B11:** „judgment“ in en-GB.

**Chor:**
- **C3:** ±50 Cent / 75 % gegenüber ±25 Cent in Stufe 2–3 ist weiter nicht begründet.
- **C4:** Die Altstimme ist in beiden Stücken identisch; eine Wiederholung kann exakt die andere Erstaufgabe sein.
- **C6:** Sehr enge und tiefe Stimmumfänge.
- **C7:** Tenor im Bassschlüssel statt oktaviertem Violinschlüssel (nicht dokumentiert).
- **C8:** Die Aufgaben in B- und D-Dur setzen keine Vorzeichnungs-Fähigkeit voraus. `key.signature-major` verlangt im Graphen über `notation.write-pitch` den Bassschlüssel und würde ADR 0063 (Oberstimmen ohne Bassschlüssel) aufheben. Nötig ist eine eigene Lese-Fähigkeit für Vorzeichnungen oder eine Entscheidung zum Graphen; die Änderung wurde deshalb geprüft und zurückgenommen.
- **C9:** Ein stummes Mikrofon mit Null-PCM zählt als Fehlversuch statt als Skip.
- **C11:** „Erstversuch“ meint „erste geprüfte Antwort“, das steht nicht in ADR 0064.
- **C12:** `fail()` verwirft beim Vorhören einen ungeprüften Durchlauf.
- **C13:** Zeitzuordnung über den Callback-Zeitpunkt statt `atMs`; das ist nur mit Gerätetest zu klären.
- **C14:** „Singe Tenor“ ohne Artikel; „Viertelschläge“ nicht aus dem Glossar; Entwicklerhinweise in `choir`-Texten.
- Der Kommentar in `choir.test.ts:404` widerspricht `soprano-leap`.

**Zeitreise:**
- **C15:** Alle vier Wissensfragen folgen demselben quellenkritischen Muster; Ablenker mit absoluten Signalwörtern.
- **C16:** Hinweise sind nicht gestuft.
- **C17:** Die Klassik-Szene spricht von „Phrasen“ bei zwei Viertonmotiven; ein logisch schiefer Satz.
- **C18:** „Continuo-Spielerin“ gegenüber Glossar „Generalbass“.

**Katalog (vorbestehend, außerhalb dieser Kette):** `history.l3.methods.lesson2/3` und `history.l4.survey.lesson2/3` fragen `source-comparison` ab, ohne `history.l2.jazz-pop-sources` vorauszusetzen. Der neue Stufe-5-Test deckt das bewusst nicht ab.

## Weiterhin offen

- Unabhängige Literaturprüfung gegen Primärtexte (F05) und Entscheidung F03.
- Geräte-, Mikrofon-, Kopfhörer-, Latenz-, Stimmen- und Screenreader-Abnahme.
- Echte Tutor-Modell- und Kostenabnahme (Prompt v5).
- Supabase-/RLS-Prüfung gegen echte Instanzen.
- Rechtsprüfung von Verarbeitungsverzeichnis, KI-VO-Einordnung und Schul-Einwilligung.
- Freigabe und Startentscheidung für Phase 4.

Nichts davon ist durch diesen Durchgang erledigt.
