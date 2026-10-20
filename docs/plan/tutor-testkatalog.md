# P2.18 – Tutor-Testkatalog und Kalibrierung

## Stand

Das technische Prüfsystem ist umgesetzt: 245 eigene Fälle in DE/US/UK (735 Sprachfassungen), Katalogprüfung, getrennte Katalog-/Antwortreviews, wiederaufnehmbarer SDK-Batchdialog, automatische Belegprüfung, Rollen-/Modell-/Effort-/Promptvergleich, Regression und kostenbasierte Kontingentvorschläge. Entscheidung: [ADR 0018](../decisions/0018-tutor-testkatalog-und-batch-kalibrierung.md).

**Die fachliche und echte Definition-of-Done bleibt offen.** Alle Fälle und Bibliotheksartikel sind Entwürfe. Claude Code muss sie in einem getrennten frischen Kontext prüfen. Der aktuellen Cloud fehlen weiterhin sichere Anthropic-Bindung sowie offiziell geprüftes aktuelles Modell und Streaming-/Batchtarif. Kein echtes Modell wurde bezahlt, keine fachliche 98-%-Quote gemessen und keine Launch-Kontingente festgelegt. P2.15–P2.17 behalten dieselben offenen Live-Abnahmen.

## Katalog und fachlicher Durchgang

`tools/tutor-benchmark/catalogue.ts` erzeugt den eingecheckten `catalogue.json`. 120 Fälle prüfen die acht Werkzeugbereiche, 76 Fälle alle 19 Aufgabentypen in vier Abläufen, 29 fragen nach Bibliotheksquellen, zwölf prüfen falsche Prämissen/Enharmonik/Rollengrenzen und acht die Rückführung auf Musik. Soll-Aufrufe haben strenge Schemas und korrekte Engine-Ergebnisse; Aufgaben verwenden ursprüngliche IDs, Versionen, Seeds und gültige falsche Antworten. US/UK-Fassungen unterscheiden Fachbegriffe wie measure/bar, quarter note/crotchet und half step/semitone. Generator und Nodeprüfung erhöhen keine Freigabestatus.

Die späteren Mikrofontypen `SING_INTERVAL`, `SIGHT_SING` und `PLAY_BACK` sind nicht Teil dieses eingefrorenen P2.18-Katalogs. Der Generator überspringt sie ausdrücklich; neue Tutor-Benchmarkfälle brauchen eine eigene Katalogversion und fachliche Kalibrierung. So bleiben die 245 Fälle und ihre bisherigen Nenner bei weiteren Lektionen stabil.

```bash
pnpm check:tutor:catalogue
pnpm tutor:catalogue:write       # nur nach bewusst geändertem Autoreneinstieg; Diff prüfen
pnpm --filter @harmonia/theory test src/tutor-benchmark.tonal.test.ts
```

Die sechs unabhängigen Vergleichstests prüfen 124 rechnerische Fälle: 36 Intervall-/Fangfragen, 16 Transpositionen, 24 Tonleitern, 16 Vorzeichnungen, 16 gebaute und 16 erkannte Dreiklänge. Chromatische Schreibweise folgt weiter der dokumentierten Enginekonvention; dort werden Tonhöhenklassen verglichen. Dreiklangserkennung prüft eine unabhängig bestätigte Grundtonlesart, nicht alle denkbaren enharmonischen Interpretationen. Notationsfälle werden mit Parser, Takt-/Timelineprüfung und Tempo geprüft. Quellenentailment, historische Aussagen, vollständige Mehrdeutigkeit und verständliche Prosa bleiben Claude-Aufgaben nach ADR 0005.

Pro Katalogfall/Sprachfassung braucht `catalogue-review.json` `caseId`, `locale`, `caseHash`, `reviewer: claude-code`, `freshContext: true`, `approved`, Datum, zwei verschiedene `methods` (table/tonal/literature/score-engine), Referenzen und Notizen. Die Prüfmittel müssen zur Behauptung passen. Für historische Quellen ist etwa ein Engine-Notentest kein unabhängiges Geschichtsorakel. Die Software prüft Hash, Vollständigkeit und verschiedene Methoden; sie kann einen tatsächlich frischen menschlichen/Claude-Kontext oder gelesene Literatur nicht beweisen.

## Lokaler Ablauf ohne Modellkosten

Node 22, pnpm 10, Deno 2.9.6 und lokales Supabase sind die vorhandenen Voraussetzungen. Kein Reset der Datenbank. Der Katalog/Run benötigt keine neuen Tabellen, Konten, Abos oder Lernversuche.

```bash
pnpm db:start
pnpm knowledge:sync --preview
pnpm tutor:benchmark prepare --simulate --run /tmp/harmonia-tutor/run.json
pnpm tutor:benchmark simulate --run /tmp/harmonia-tutor/run.json
pnpm tutor:benchmark inspect --run /tmp/harmonia-tutor/run.json
pnpm tutor:benchmark evaluate --run /tmp/harmonia-tutor/run.json --output /tmp/harmonia-tutor/summary.json
node tools/assert-tutor-benchmark.mjs /tmp/harmonia-tutor/summary.json
pnpm tutor:benchmark review-template --run /tmp/harmonia-tutor/run.json --output /tmp/harmonia-tutor/review
```

Die Beispielkonfiguration enthält zwei Varianten (baseline und hints-medium) und **ausschließlich synthetische Modelle/Tarife**. 1470 Dialoge prüfen die Mechanik, keine Modellqualität. Der Simulator verwendet Soll-Aufrufe absichtlich; damit kann er nicht die Werkzeugwahl eines Sprachmodells abnehmen. Auch 100 % technisch bestandene Dialoge oder künstlich gefüllte Testurteile lassen Simulationen, Vorschauquellen und ungeprüfte Antworten nicht durch das Release-Gate.

Ohne Datenbank kann eine Kopie der Beispielkonfiguration `sourceMode: supplied` verwenden. Das entspricht der CI-Simulation mit fest mitgelieferten Quellen; es prüft keine echte Suche und wird gesondert vom Release ausgeschlossen. Die normale `postgres`-Vorbereitung nutzt echte lokale `search_knowledge`-RPCs gegen genau denselben Snapshot und dieselben Aufgabenfähigkeiten wie das Backend. Aktuell ist `published` leer und vorhandene Entwurfs-Lektionskontexte sind dort nicht verfügbar; eine öffentliche Vorbereitung kann erst nach tatsächlicher Inhaltsfreigabe erfolgreich werden.

## Echte Batch-Abnahme

Den bestehenden Cloud-Konfigurationsentwurf für Anthropic sicher binden/veröffentlichen; Schlüssel ausschließlich als `ANTHROPIC_API_KEY` in der Umgebung. `config.example.json` außerhalb des Repositorys kopieren und durch aktuell offiziell geprüfte, feste Modell-ID(s), eigene Rollen-Effortwerte, Streamingtarif und effektiven Batchtarif ersetzen. Quellen für Modell/Tarife müssen offiziell, HTTPS und höchstens 30 Tage alt sein. Preise sind ganzzahlige Nano-USD pro Token; der Batchrabatt wird nicht vorausgesetzt. Für jede Promptvariante können eigene DE/US/UK-`instructions` hinzugefügt werden. Baseline ist leer und verwendet den unveränderten Prompt aus der Function. Modellunterstützung für Effort muss beim Live-Lauf geprüft werden.

```bash
# Erst vollständige Katalogfreigabe; explorativer Entwurf ausschließlich explizit mit --allow-draft.
pnpm tutor:benchmark prepare --config /sicherer/pfad/config.json --catalogue-review /sicherer/pfad/catalogue-review.json --budget-nano-usd <konservative-Gesamtobergrenze> --run /sicherer/pfad/run.json
pnpm tutor:benchmark submit --run /sicherer/pfad/run.json
pnpm tutor:benchmark collect --run /sicherer/pfad/run.json
# Bei noch laufendem Batch collect später erneut; bei geplanter Werkzeugfolge submit ausdrücklich wiederholen.
pnpm tutor:benchmark inspect --run /sicherer/pfad/run.json
pnpm tutor:benchmark review-template --run /sicherer/pfad/run.json --output /sicherer/pfad/review
```

Die CLI wartet nicht auf einen bis zu einem Tag laufenden Batch. Lesen/Abgleich/Abbruch bereits gestarteter Batches benötigen weiterhin den sicheren Schlüssel, aber keine erneut frischen Preis-/Modellnachweise; eine später abgelaufene Tarifprüfung darf den Abruf bezahlter Ergebnisse nicht verhindern. Neue Übermittlungen und Releaseempfehlungen bleiben an frische Nachweise gebunden. Jeder Aufruf erledigt einen begrenzten Schritt. SDK-Retries sind deaktiviert. Bei unklarer Übermittlung keine zweite Create-Anfrage senden: im Anbieter-Workspace anhand der gespeicherten `custom_id` abgleichen und `reconcile --batch-id <bestätigte-ID>` verwenden. Eine Batch-ID mit gleicher Zeilenanzahl reicht nicht als Beweis; `collect` prüft jede ID. `cancel` betrifft ausschließlich die eigene im Journal gespeicherte laufende Batch-ID. Fehlende, fremde oder doppelte Resultate stoppen den Import; providerseitige errored/canceled/expired werden mit konservativer Kostenreserve aufgenommen.

Journal/Cache und Reviews bleiben in `artifacts/tutor-benchmark/` oder einem eigenen lokalen Pfad, aus Git ausgeschlossen und mit Dateimodus 0600. Dateien enthalten eigene Testfragen und Modellnachrichten, keine Benutzerprofile oder Auth-/Anbieterschlüssel. Unterschiedliche Prozesse bekommen eine Dateisperre. Nach Absturz eine Sperre nur nach Prüfung des noch laufenden eigenen Prozesses entfernen. Keine bestehenden Läufe überschreiben; ein geänderter Engine-/Prompt-/Werkzeugstand benötigt einen neuen Lauf. Ein bekanntes älteres Ergebnis lässt sich auf seinem passenden Gitstand wieder bewerten.

## Bewertung, Regression und Auswahl

Nach vollständigem Dialoglauf füllt Claude im frischen Kontext `answer-grades.json`. Pro Episode: `episodeId`, `answerHash`, Prüfer, frischer Kontext, Datum, fünf boolesche `verdicts` (factual/tools/sources/hints/languageTone), Notizen und Referenzen. `review-pack.json` enthält Originalfrage, Sollwerte, Quelle, Beispiel und Antwortbeleg. Nicht nur Toolnamen prüfen: falsche Argumente zählen nicht, und die Prosa darf richtigen Werkzeugresultaten nicht widersprechen. Ein mathematischer Worttreffer oder ein vorhandener Zitatlink belegt kein bestandenes fachliches Urteil.

```bash
pnpm tutor:benchmark evaluate --run /sicherer/pfad/run.json --catalogue-review /sicherer/pfad/review/catalogue-review.json --grades /sicherer/pfad/review/answer-grades.json --output /sicherer/pfad/summary.json --release
# Nach erster echter Freigabe zusätzlich --baseline <vorheriger-akzeptierter-Bericht>.
```

`--release` beendet sich mit Fehler, wenn Freigabe fehlt. Das ist im Simulationslauf ein **erwarteter negativer Check**. Die CI prüft den geschlossenen Zustand direkt; sie führt keine bezahlten Läufe aus. Ein fehlendes Ergebnis bleibt im Nenner, ein fehlendes Urteil bleibt ungeprüft. Rohquoten beschreiben bestätigte Urteile im vollständigen Nenner, nicht eine gemessene Modellkorrektheit bei null Reviews. Rollenwahl und ihre Quoten sind separat von allen Experimenten ausgewiesen. Eine günstige schlechte Variante wird verworfen; ein geprüfter besserer Kandidat kann gewählt werden. Quellenverletzungen und Hinweislecks disqualifizieren den betreffenden Kandidaten. Frühere fachlich richtige Fälle der ausgewählten Basis dürfen nicht schlechter werden. Jede Rolle und Sprache braucht mindestens 98 % fachlich und insgesamt bestanden.

Die Zusammenfassung bindet Konfiguration, Katalog, Runtime, Vorbereitung und Quittungen per Hash und enthält die konkrete Auswahl je Rolle. Akzeptierte echte Zusammenfassungen unter `docs/quality/tutor/<version-oder-runHash>.json` ausdrücklich versionieren; Rohjournale bleiben separat. Der hier versionierte Simulationsnachweis ist keine echte Basis und wird als Baseline zurückgewiesen.

## Kontingente und verbleibende Entscheidungen

Ein optionales Budget-JSON enthält `premiumMonthlyModelBudgetNanoUsd`, `maxMonthlyModelBudgetNanoUsd`, `activeDaysPerMonth` und `safetyMultiplier` (mindestens 1). `evaluate --budget <Datei>` erzeugt erst für eine akzeptierte echte Rollenwahl einen Vorschlag. Batch-Kosten werden mit eigenem Tarif gemessen; Streamingkosten sind eine Projektion aus denselben gemeldeten Eingabe-/Ausgabe-/Cachetoken. Der Vorschlag nimmt das größere Maß von P95 und Kosten je akzeptierter Antwort einschließlich Fehlerkosten, multipliziert Sicherheit und verteilt das Monatsbudget auf aktive Lerntage. Er ist auf die bestehende technische Policygrenze von 1000 Fragen/Tag begrenzt.

Keine Policy, kein Abo und kein Kontingent wird automatisch geändert. Tatsächliche Streaming-/Cachekosten, Produktpreise/Margen, aktive Nutzer, globale Tageskapazität und Store-Billing aus P2.19/P2.20 bleiben zu entscheiden und live abzunehmen. Die bisherigen 30/60-Fragenwerte bleiben ausdrücklich technische Startgrenzen.

## Prüfung und Übergabe

Lokal am 14.10.2026 bestanden: Gesamtlauf mit **2818 Paket-/App-/Tooltests**, darunter sechs unabhängige Tonal-Katalogtests und 23 neue Benchmark-/SDK-/Bewertungsprüfungen; gezielter Nachlauf derselben 23 Prüfungen nach der letzten Baseline-Härtung. Deno: 170 Grundlagen-, 15 Push-, 206 Tutor-, 755 Wissensbasis- und **49 Batch-/Runtime-/Quellenprüfungen**. Beide vollständigen Simulationswege bestehen mit jeweils **1470 Dialogen**: echte lokale Postgres-Suche sowie der CI-Weg mit mitgelieferten Quellen. Leere Reviewdateien werden erfolgreich erzeugt; das Release-Gate schließt erwartet, der Live-Vorabbruch findet vor jeder Such-/Modellanfrage statt. 146 lokale Tutor-API-Prüfungen bestehen jeweils mit öffentlicher/interner Inhaltsbindung. Lint, Typen, Format, Übersetzungen, Katalog, Inhalte und Fähigkeitsplan sind geprüft. Öffentlicher Web-Export und Inhaltsgrenze sind geprüft; kein Testkatalog, Anthropic-SDK oder Backend-Testadapter gelangt in die App. Der [versionierte Simulationsnachweis](../quality/tutor/simulation-v1.json) dokumentiert null fachliche Antwortreviews und keine Kontingentempfehlung. Keine erfolgreiche GitHub-CI oder echte Modell-/Kosten-/Geräteabnahme wird behauptet. Der Code liegt auf `codex/p2-18-tutor-calibration` über P2.17 (`de7449e`). [Review P2.17 → P2.18](https://github.com/PhiFa96/harmonia/compare/codex/p2-17-tutor-ui...codex/p2-18-tutor-calibration?expand=1). Claude Code übernimmt fachlichen Durchgang, Review und Merge; `main` bleibt unverändert.

Nach den offenen P2.18-Abnahmen folgt **P2.19 – Abos mit RevenueCat** als nächster technischer Planpunkt.
