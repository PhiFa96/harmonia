# Gemeinsames Befundregister M2

Stand 19.11.2026 auf `codex/programmierarbeiten-nach-m1`, Basis `main@688de50`. M1 ist seit PR #165 integriert. Das Register hält die geprüften Einzelbefunde und die ausstehende Triage fest. [Integrationsnachweis](integration-m1.md) · [M2-Übergabe](../quality/m2-befunde/uebergabe.md)

## Status und Nachweise

- **Behoben:** aktueller Code und eine benannte Regression decken den konkreten technischen Befund ab. Fach-, Sprach-, Anbieter- und Geräteabnahmen werden dadurch nicht ersetzt.
- **Offen, bestätigt:** die beschriebene Grenze besteht im aktuellen Code; die genannte Prüfung ist angegeben.
- **Offen, nachprüfen:** historischer Hinweis; noch kein bestätigter aktueller Fehler. Vor Implementierung reproduzieren und gegen die aktuellen Tests prüfen.
- **Überholt:** die frühere Aussage oder Version passt nicht mehr zum aktuellen Gegenstand; der ersetzende Nachweis ist angegeben.
- **Zurückgestellt:** ausdrückliche Entscheidung samt Bedingung; kein erledigter Fehler.

Die IDs dieses Registers bleiben stabil. Mehrere historische Belege desselben Problems sind zusammengeführt. Einzelpunkte in einer Gruppe können unterschiedliche Nacharbeit benötigen; dann vor der Umsetzung unter einer eigenen Unter-ID trennen. Die vollständige Einzeltriage aller Rohberichtspassagen ist noch offen. Die [Quellenliste](../quality/m2-befunde/quellen.json) bindet alle 33 Rohberichte mit SHA-256; sie ist keine Liste von 33 Fehlern. Automatische Übernahme aller Tabellenzeilen würde auch bestandene Kontrollen und mehrfach beschriebene Zweifel als Fehler zählen.

## Stufen 1–2

Quellen: [Zusammenfassung einschließlich Graphkorrekturen](fachpruefung-stufe-1.md), [Notation](../quality/fachpruefung-stufe-1/notation.md), [Rhythmus](../quality/fachpruefung-stufe-1/rhythm.md), [Intervalle](../quality/fachpruefung-stufe-1/intervals.md), [Gehör](../quality/fachpruefung-stufe-1/aural.md), [Geschichte](../quality/fachpruefung-stufe-1/history.md), [Graph 1](../quality/fachpruefung-stufe-1/graph-stufe-1.md), [Graph 2](../quality/fachpruefung-stufe-1/graph-stufe-2.md).

| ID | Altbefund / Arbeit | Aktueller Status und nächster Nachweis |
|---|---|---|
| S12-01 | Hörhinweis `NaN`, Kasus-/UK-Fehler, Achtelposition, Operndefinition | Offen, nachprüfen: historisch als behoben dokumentiert; konkrete Text-/Generatorregressionen gegen den jetzigen Katalog zuordnen. Kein erneuter Fachdurchgang behauptet. |
| S12-02 | Graph-Fehler: 4 in Stufe 1, 8 in Stufe 2; Titel und Voraussetzungskanten | Offen, nachprüfen: Korrekturcommit `a769d2a` ist enthalten. Einzelbefunde gegen jetzige Titel, Kanten und `curriculum.test.ts` abgleichen; Titelkorrektur und noch fehlende Aufgabe getrennt bewerten. |
| S12-03 | Gehör-Intervallkarte ohne Notationsvoraussetzung (`aural.third-fourth-fifth`) | Ziel A, bestätigt: Der Katalog führt nur `aural.pitch-direction` als Voraussetzung. Der Notations-unabhängige Einstieg ist als Test geschützt. Claude entscheidet über eine selbsterklärende Einführung oder eine neue fachliche Voraussetzung. |
| S12-04 | Abdeckung für Linie/Zwischenraum, Tastenabstand, Auflösungszeichen, Umkehrungsbau | Ziel A, am Katalog nachgezählt: Die drei Staff-Lektionen bewerten Notennamen, Keyboard Steps prüft Begriffe und Tonziele, die Vorzeichenlektion fragt Begriffe und geschriebene Tonnamen ab. Die Umkehrungslektion hat zehn `CHORD_IDENTIFY`-Aufgaben mit 0/1/2 und beschreibt im Titel das Bestimmen. Eigene Bauaufgaben und erweiterte Lernziele brauchen eine fachliche Entscheidung. |
| S12-05 | Seltene Schreibweisen im Einstieg; Vorzeichen/Versetzungszeichen; Hilfebegriffe vor Einführung | Offen, nachprüfen: Notations-F/Z und Rhythmus Z1; didaktische Entscheidung mit eigener Nachprüfung erforderlich. |
| S12-06 | Auftakt/Schlusstakt, Betonung 3/4, Zählsilben, Schlussstrich | Offen, nachprüfen: Rhythmus Z2–Z7, aktuelle Texte/Notenbilder und Quellen gemeinsam lesen. |
| S12-07 | Gehör-Hinweise, Ausklang/Pausen und kleine Melodieunterschiede | Ziel A: Der zweite Hörintervall-Hinweis enthält keine Halbtöne mehr. Dieselben Hinweise erscheinen bei unterschiedlichen Zielintervallen, die Auflösung bleibt auf Stufe 3. `feedback.test.ts` prüft DE/en-US/en-GB. Ausklang, Hörbarkeit und die unabhängige didaktische Prüfung der neuen Hilfen stehen aus. |
| S12-08 | Aufnahme als Quelle, Ort/Zeit, Klaviermodelle, historische Aussagen | Offen, nachprüfen: Geschichtsbericht; ursprüngliche Korrekturen und verbleibende Zweifel einzeln trennen. |
| S12-09 | Screenreader-Satzanfang und weitere Terminologie-/Redundanzzweifel | Offen, nachprüfen: Notation F/Z sowie Graph-Einzelmittel/G6; echte Ausgabe und aktuelle Sprachressourcen prüfen. |
| S12-10 | Kein vollständiger getrennter Inhaltsdurchgang Stufe 2 / Primärquellen | Offen: Graphprüfung vom 20.10. ist keine Freigabe aller Stufe-2-Lerntexte. M5 und ADR 0005 bleiben erforderlich. |

## Adaptive Auswahl, FSRS, Wettbewerb und Social

Quellen: [P3.02/03](../quality/fachpruefung-phase-3/p3-02-03-auswahl-fsrs.md), [P3.04–06](../quality/fachpruefung-phase-3/p3-04-06-ligen-rush-duelle.md), [P3.07/08](../quality/fachpruefung-phase-3/p3-07-08-raetsel-freunde.md).

| ID | Altbefund / Arbeit | Aktueller Status und Nachweis |
|---|---|---|
| P3-01 | Adaptive Wiederholungen beim Erststart praktisch inaktiv | Behoben: `lesson-flow.ts` prüft eigene **und** Wiederholungskandidaten; `adaptive.test.ts` prüft Erststart mit Ratings früheren Stoffs (`a660a01`). |
| P3-02 | Doppelte Quellen im FSRS-Wiederholungsplan | Behoben: `reviewSkillPlan` führt `used` und bevorzugt auf fällige Fähigkeiten begrenzte Quellen; `review.test.ts` prüft Duplikate und Quellenwahl (`a660a01`). |
| P3-03 | Ein Fehler setzt alle beteiligten Fähigkeiten auf Again | Offen, bestätigt durch Codelesung: `reviewEvidence` verwendet weiter `Math.min`; konservative Modellannahme mit echter Lern-/Kalibrierungsevidenz beurteilen, keine ungeprüfte neue Bewertungsregel einsetzen. |
| P3-04 | Minuten-Lernschritte, Sofortfälligkeit und Rückstand | Offen, bestätigt durch Codelesung: `REVIEW_PARAMETERS` enthält `1m/10m`, neue Karten sind sofort fällig. Tagesgrenzen und Produkttext mit empirischem Ziel prüfen. |
| P3-05 | Kartenbewertung verlangt Bewertung vor dem Aufdecken | Behoben: `review.ratingHelp` fragt jetzt nach der zuvor erinnerten Antwort; Beschriftungen nennen Erinnerung. Plurale werden je Anzahl verschachtelt aufgelöst (`367a98c`). |
| P3-06 | Relative Übungsauswahl, Einstufungs-FSRS, lokale Zukunftsuhr, Zeitgrenze ganzer Sync-Chargen | Ziel A: Die Oberfläche beschreibt niedrigere Bewertungen. Neue Sync-Clients stellen einzelne zukünftige Nachweise lokal zurück und synchronisieren gültige Nachweise weiter. App- und lokaler HTTP-Test belegen ACK, Folgeverarbeitung und Wiederholung. Einstufungs-FSRS und bereits lokal berechnete Zukunftstermine bleiben in der Prüfung. |
| P3-07 | FSRS-Version, Tagesgrenzen und blockierte Backfills | Die Versionsangabe FSRS 5 ist durch ADR 0075 überholt. Bei konkurrierenden Schreibvorgängen hält der Worker die Reihenfolge je Konto ein und verarbeitet im selben Stapel weitere Konten. Bei Lern-Sync wird eine zurückgestellte Projektion ohne Kontodaten gemeldet. Empirische Eignung, Referenzwerte und die Planung über lokale Tagesgrenzen stehen aus. |
| P3-08 | Globale Schreibsperre beim Liga-Lesen | Behoben im Code: Folgemigration aus `f195067` ersetzt den sperrenden Leseweg. Aktuelle Supabase-Gesamtprüfung am Integrationsstand bleibt separat erforderlich. |
| P3-09 | Duell-XP ohne Mindestbeteiligung | Behoben im Code: `7b15c29` ergänzt Teilnahmebedingungen, `657885e` liefert Duell-XP auch an passende alte Clients. DB-/Mehrgeräteabnahme bleibt gesondert. |
| P3-10 | Premium-Liga-XP, Rush-Bots, Ghost-Datenschutz | Sechs authentifizierte Browserfälle für Liga und Rush bestanden mit lokalen Supabase-Konten. Wettbewerbsregeln, Schutzbedarf für Ghosts und Mehrgerätebetrieb bleiben gesonderte Produkt-, Rechts- und Betriebsaufgaben. |
| P3-11 | Einladungstoken vom Client gewählt | Behoben im Code: spätere Migration `20261020030100_friends_followups.sql` erzeugt `gen_random_uuid()` auf dem Server (`81a93a9`). Die frühere Migration ist Verlauf. |
| P3-12 | Rätseltage, Questzustimmung, Konto-UUIDs, Altersschutz, Einladungslimits | Questzustimmung, Widerruf, beziehungsbezogene Kennungen, Rätsel-Zeitzonenwechsel und Einladungsbudget sind technisch geprüft. Altersrahmen und Betriebsfreigabe bleiben offen. [ADR 0084](../decisions/0084-quest-zustimmung-und-social-schutz.md) |
| P3-13 | Freundesplural, unbenannte Aktionen, Entfernen hebt Block auf | Behoben im Code durch `367a98c`, `3dd1b87`, `81a93a9`; vorhandene App-/DB-Regressionsprüfungen bei der Einzeltriage zuordnen. |

## Audio, Harmonik, Prüfungen, Stufen 3–4 und Tutor

Quellen: [Mikrofon](../quality/fachpruefung-phase-3/p3-09-10-mikrofon.md), [MIDI/Rhythmus](../quality/fachpruefung-phase-3/p3-11-12-midi-rhythmus.md), [Harmonik](../quality/fachpruefung-phase-3/p3-13-14-notation-harmonie.md), [Stufe 3](../quality/fachpruefung-phase-3/p3-15-stufe-3.md), [Stufe 4](../quality/fachpruefung-phase-3/p3-16-stufe-4.md), [Prüfungsmodus](../quality/fachpruefung-phase-3/p3-17-pruefungsmodus.md), [Tutor/Planer](../quality/fachpruefung-phase-3/p3-18-tutor-planer.md), [Wissensbasis](../quality/fachpruefung-phase-3/p3-19-wissensbasis-v2.md).

| ID | Altbefund / Arbeit | Aktueller Status und Nachweis |
|---|---|---|
| P3-14 | Gesangs-Skip verhindert Bestehen; absolute Oktave; Rohcode P4; Cent-Feedback | Technische Korrekturen enthalten: `d4c73a7`, `1ac1b0b`, aktuelle Voice-Tests. Offen, nachprüfen: jeden Altbefund samt Toleranz-/Rückmeldungstest einzeln zuordnen; physische Stimmen sind nicht geprüft. |
| P3-15 | Mikrofon-Konstruktorfehler, lokale Clientmesswerte, iOS-Dialogsprache, Testabdeckung | Ziel A: Native Startfehler stellen die Wiedergabe wieder her. Im Web werden bereits geöffnete Mikrofonspuren geschlossen. Die iOS-Konfiguration beschreibt Stimmen und Aufnahmeübungen auf DE/EN. Adaptertests und Konfigurationstests belegen die Korrekturen. Reale Aufnahme- und Dialogabnahmen stehen aus. |
| P3-16 | MIDI-Port-ID-Wechsel und Umgehen von `fixedRange` | Behoben: `successorOf` ordnet das wiederverbundene Gerät zu; `midi-hotplug.test.tsx` prüft neue ID und Töne außerhalb des festen Ausschnitts (`31588f9`). |
| P3-17 | Rhythmus-Plurale, UK-Texte, fehlende Tempoansage | Korrekturen aus `6e4f8bb` sind enthalten. `rhythm.test.tsx` deckt Einzählen, Metronommodi, Aufnahmewertung und das Beenden beim Hintergrundwechsel ab. Physische Latenz und Screenreader-Ausgabe brauchen reale Gerätebelege. |
| P3-18 | iOS-BLE-MIDI, Port-Schließen, echte Routen-/Gerätewechsel | Mehrere Klaviaturen teilen sich einen Port. Die letzte Abmeldung schließt ihn, eine erneute Anmeldung wartet auf das Schließen. `midi-hotplug.test.tsx` prüft diesen Ablauf. iOS-BLE und physische Routenwechsel gehören in die Geräteabnahme. |
| P3-19 | Melodisches Moll und nicht diatonische Pivotmodulation | Behoben: `98985b3`; `harmony.test.ts` prüft melodisches Moll und Pivotklassifikation. Fachliche Konventionsfreigabe bleibt offen. |
| P3-20 | Funktionskürzel/gleiche Antwortlabels und fehlender Tonika-Hörkontext | Technische Korrekturen enthalten: `94fa60b`, `02a3f78`. F03 bleibt offen; Übungskontext und Auswahlbeschriftungen in allen Sprachen nachprüfen. |
| P3-21 | Kadenz-/Funktions-Fehlerwiederholung mit gleicher fachlicher Antwort | Behoben: `d02d2ec`; `lesson.test.ts` prüft geänderte fachliche Antwort. Zeitüberschreitung unter Last ist im Integrationsnachweis separat dokumentiert. |
| P3-22 | Funktions-Screenreader und Abspielstatus von Kadenz/Diktat | Technische Korrekturen enthalten: `32908bb`, `38aa4c3`; aktuelle Komponenten-/Browserprüfungen zuordnen. Echte Screenreader bleiben offen. |
| P3-23 | Lösungslecks, interne QA-Texte, falsche Beispiele und Stufe-3/4-Sprache | Korrekturen `e5d6f89`, `1d61801`, `1665f77`, `3cc6b18`, `d2339ae`, `9274081` enthalten. Offen, nachprüfen: sämtliche G-/A-/B-Einzelfunde gegen aktuelle Texte, Beispiele und Voraussetzungen zuordnen; keine pauschale Fachfreigabe. |
| P3-24 | Lernzielabdeckung Modi, Formverlauf, Zwischendominanten, Voicings und Hörstufe 4 | Offen, nachprüfen: tatsächliche Aufgaben pro Fähigkeit und Lektionsstruktur messen. Weitere Begriffe, Sing-/Instrumentenumfänge, Bezifferungs-/Mehrstimmigkeitsbeispiele und Quellen bleiben Teil dieser Triage. |
| P3-25 | Prüfungsmodus: Bereiche, doppelte Aufgaben, Skiptext, Abbruch, Fokus und Frist | Korrekturen `08d79b9`, `26b2bf5`, `f04699a` sind enthalten. Die lokale Übungsprüfung verwendet monotone Zeit für Frist, Antwort, Überspringen und Abgabe. `exam.test.tsx` prüft auch zurückgestellte Geräteuhren. Eine serverseitige Frist wird erforderlich, sobald ein Produktformat Ergebnisse speichert oder weitergibt. Die Vorlagen-Fachprüfung steht aus. |
| P3-26 | Tutor behauptet Stärken bei gleichen Ratings | Technische Korrektur `bdcb871` mit Mindestabstand und Fehlerzweigtests enthalten. Offen, nachprüfen: neue Momentaufnahme, Alterszerfall, Wochenplanbezug und echte Modellwirkung. |
| P3-27 | Tutor: VVT/DSFA/Store, frühes Laden des Lernstands, Werkzeug-/Fallabdeckung | Offen, nachprüfen: aktuellen Datenfluss, Datenschutztexte, Lazy-Laden und mehrsprachige Benchmarkfälle einzeln belegen. Aktuelle Prompt-/Werkzeugfassung benötigt echte Kalibrierung. |
| P3-28 | Veralteter Tutor-v2-Katalog / fehlender CI-Schritt | Behoben im Code: `a8215e0`, `638fbc9`; CI enthält `check:tutor:catalogue-v2`. Aktuelle Katalogprüfung ist Teil der Integrationschecks. |
| P3-29 | Wissenssuche liefert themenfremde Trigrammtreffer / fehlende CI-Prüfung | Technische Korrektur `c4405fa` enthalten; CI führt `db:test:knowledge:v2` aus. Offen, nachprüfen: aktuelle Sprach-/Quellenpräzisierungen und reale Suchqualität. |

## Phase 4

Quellen: [ursprünglicher P4-Durchgang](fachpruefung-phase-4-entwuerfe.md), [P4 v2](fachpruefung-phase-4-v2.md), [P4 v3](fachpruefung-phase-4-v3.md). Alle neun P4/v2-Rohberichte und alle sechs v3-Rohberichte sind in der Quellenliste einzeln erfasst.

| ID | Altbefund / Arbeit | Aktueller Status und Nachweis |
|---|---|---|
| P4-01 | SATB-Parallelen bei Kreuzung, fehlende Stimmumfänge, V7–I-Auflösung | Korrekturen `9fe73ee`, `ea3a808`, `c7c766a` enthalten. Offen, nachprüfen: ursprüngliche F- und v2-Befunde einzeln gegen Profil, Theorie-/Übungstests und Quellen abgleichen. |
| P4-02 | Satzwerkstatt: Lösung als Orakel, Varianten, Antiparallelen, Melodik, Terzverdopplung, Umfänge | Offen, nachprüfen: spätere technische Ausbauten sind keine pauschale Erledigung der stilabhängigen Altbefunde. Profil/F05 und Priorität mit begründetem Fachentscheid klären. |
| P4-03 | Chor: frühere Parallelen, Septsprung, fehlende Einführung/Datentransparenz | Historische Korrekturen `4a2b21a`, `1faf31d`, `f94c084` enthalten; `choir-edition.test.ts` prüft revidierte Stimmen und Sangbarkeit. Offen, nachprüfen: Original-F1/F2/F4/F5 und v2-C5/C6 einzeln zuordnen. |
| P4-04 | Chor besteht ohne Gesang; Gleichheit der Alt-Wiederholung; inklusive 50-Cent-Grenze und unbegrenzte Oktavkorrektur | Technisch ersetzt durch Mindest-Gesang, Edition 2 und `8b9169f`; vorhandene Abschluss-/Lernpfad-/Editiontests. Offen, nachprüfen: ursprüngliche Einzelbefunde genau zuordnen; Gerätewirkung separat. |
| P4-05 | Chor v3 Hinweis 4 / v2 C13: Zeitzuordnung und Fehlerfreigabe | Technisch auf diesem Branch bearbeitet durch #160: `clock.ts`, native Fenster-Endzeiten, Fehlerpfade in Runner/Audio und drei Sprach-Browserfälle. Reale native Drift-/Latenzabnahme bleibt offen. |
| P4-06 | Chor V→iii, Leittonregel deaktiviert, Toleranz gegenüber Stufe 2/3 | Offen: v3-Chor Hinweise 2/3 und v2 C3. Musikalische Entscheidung mit Literatur und Stilprofil nötig; M1 ändert weder Musik noch Toleranz. |
| P4-07 | Zeitreise: Quellenbindung, Klangmodelle, Wiederholungen, Lern-/Sprachtexte, Bundlegrenzen | Spätere Entwürfe und `4da1edf` enthalten technische Nacharbeit. Offen, nachprüfen: ursprüngliche P4.12- und v2 C14–C20-Einzelbefunde gegen heutigen Stand; Fach-/Quellenfreigabe bleibt offen. |
| P4-08 | Zeitreise v3 Nacharbeit 1: Hinweis 2 verrät fast die Lösung | Technisch auf diesem Branch bearbeitet durch #162: acht neue Prüfhinweise und expliziter `revealed`-Zustand; portable/App-/Browser-/Deno-Prüfungen. Neue Texte benötigen getrennte didaktische und Sprachabnahme. |
| P4-09 | Zeitreise v3 Nacharbeit 2: Hinweis 2 bereits nach erstem Fehler | Zurückgestellt als gewünschter Ablauf: ADR 0071/0083 behalten den ausdrücklichen Abruf nach Hinweis 1 bei. Das ist eine dokumentierte Hilferegel; didaktische Abnahme bleibt offen. |
| P4-10 | Schul-Gesamtentwurf v2 D-F1–D-F13 | Offen, nachprüfen: späterer Gesamtentwurf/ADR 0072 bearbeitet Identität, Einwilligung v2, Rechte, Export/Löschung, Kapazität und Prüfpfade. Die heutige v3-Sicherheit ist in P4-11–13 getrennt erfasst; Produktintegration und alle ursprünglichen Restgrenzen bleiben offen. |
| P4-11 | Schule v3 N1: fehlender Auth-FK | Auf diesem Branch durch #151 bearbeitet: `schema.sql`, Auth-Löschkaskade, `identity-access.test.mjs/.sql`; echte Supabase-Auth-Probe am Gesamtstand separat erforderlich. |
| P4-12 | Schule v3 N2: Cookie überlebt Sitzungswiderruf/Sperre | Auf diesem Branch durch #151 bearbeitet: frische Auth-Prüfung vor Änderungen und während ruhigem SSE, mehrere Server und unabhängige Sitzung in der Regression. |
| P4-13 | Schule v3 N3: Grader-/Backendrollen unter Supabase ungeklärt | Auf diesem Branch durch #151 bearbeitet: private NOLOGIN/NOINHERIT-Capability und eingeschränkter realer PostgreSQL-Login; kein Grader-JWT im Client. Produktprovisionierung bleibt offen. |
| P4-14 | Schule v3 Hinweise 4–7: Rechnungsaufbewahrung, pseudonyme Reste, Scheduler, Lehrkraftkennungen | Offen: getrennte Rechts-/Steuerprüfung und Produktintegration nötig. Kein manuell ausgeführter Purge als produktiver Scheduler-Nachweis. |
| P4-15 | Tutor v3 N1–N4/H3: Secret, Fehlercode, Replay, Budget, Uhr | Auf diesem Branch durch #156 bearbeitet: eigener Signaturschlüssel, sichere Eigentümer-/Inhaltsprüfung vor Nachweispflicht, atomare 30/60-s-Begrenzung und Uhrentoleranz; portable/Deno/DB-Regressionen. Produkt-Secret und echte Modellabnahme offen. |
| P4-16 | Tutor v3 H1/H2: Nachweis garantiert keine menschliche Bearbeitung, mehrfach nutzbar | Offen als ausdrücklich dokumentierte Garantiegrenze: Serverwertung einer eingesandten Antwort, kein Beweis des menschlichen Erstversuchs. Kein Kontingent-Bypass aus Mehrfachnutzung ableiten. |
| P4-17 | KI/Zertifikate v3 N1/N2: transitive Quellen und KI-Prüflogik fehlen | Auf diesem Branch durch #157 bearbeitet: gemeinsamer Importgraph; Regressionen verändern isolierte echte Quellbäume und entwerten Arbeitsblatt/Zertifikatsmuster nach Neustart. Nach Gesamtintegration private Mappen neu erzeugen. |
| P4-18 | KI/Zertifikate v3 N3: Dokumenthash beweist keine Echtheit | Offen als Nachweisgrenze: `evidence.mjs` prüft Existenz/Hash/Dateischutz; tatsächliche schriftliche unabhängige Prüfung bleibt erforderlich. |
| P4-19 | Zertifikate v3 N4: Ansichten/Export schreiben und löschen fremde Altbestände | Auf diesem Branch durch #158 + Konfliktauflösung mit #159 bearbeitet: `query_only`-Lesesnapshot, ein Zeitpunkt, reine Filter, getrennte Schreib-/Wartungspfade; Datei-/HTTP-/Browserregressionen. |
| P4-20 | Zertifikate v3 N5: Sitzungsinhaber setzt eigene Zahlung | Auf diesem Branch durch #159 bearbeitet: Standardsperre, nicht serialisierbare lokale Fähigkeit, getrennte Simulationsrouten und v2-Policy. Keine echte Zahlungsintegration. |
| P4-21 | Zertifikate v2 E1–E6 / v3 Hinweise: Lesezugriff, Antwortbindung, Integrität, Identität, Zahlungen, Aufbewahrung | Offen, nachprüfen: alte Befunde gegen Gesamtentwurf/ADR 0073 und P4-17–20 zuordnen; technische Proben bleiben ungültige Muster mit zwei Zwölf-Fragen-Profilen. |
| P4-22 | Stufe 5: Dezimenschluss, Kreuzungen, Dissonanztext, falscher Durchgang, Voraussetzungen, US/UK | Korrekturen `ca66446`, `9d71a94`, `7676dcb`, `f2b7495`, `5afd381`, `a6a129f` enthalten. Offen, nachprüfen: gesamte v2-A1–A19-Liste samt späterem Gesamtentwurf einzeln prüfen; positive Kontrollen nicht als Fehler übernehmen. |
| P4-23 | Stufe 5 v3 N2: Cantus 7→1 ohne Variantenhinweis | Auf diesem Branch durch #161 bearbeitet: tatsächliche Schlussnoten aus fester Stimme, gleicher Vorabhinweis, Lösung nach Wertung/Anforderung. Neue Fach-/Quellen-/Sprachabnahme offen. |
| P4-24 | Stufe 5: historische Angabe 12 Cantus-Leittonschlüsse | Überholt: aktuelle unabhängige Modellzählung in #161 ergibt 11 Halbtonschlüsse aufwärts und 13 Ganztonschlüsse abwärts. Rohbericht wird nicht umgeschrieben; Generator bleibt gleich. |
| P4-25 | Texte, Primärliteratur, reale Stimmen/Screenreader und Geräte | Offen für alle betroffenen P4-Funktionen. Frühere interne Durchgänge und grüne Techniktests ersetzen keine aktuelle unabhängige Abnahme. |
| P4-26 | Marktplatz P4.01 | Zurückgestellt bis F14 und Rechtsklärung sowie formaler Startentscheidung; kein Teil dieses Integrationspakets. |

## Neue Befunde aus dem M1-Integrationsreview (16.11.2026)

Code-Review des gemeinsamen Kandidaten durch Claude Code; Einzelheiten in [integration-m1.md](integration-m1.md#fachliche-und-funktionale-prüfung-durch-claude-code-16112026). Keiner blockiert den Entwurfsstand.

| ID | Befund | Status und nächster Nachweis |
|---|---|---|
| M1-R1 | Prüfcode nach vorübergehend deaktivierter Zahlungssimulation | Ziel B, technisch behoben: Eine abgeschlossene Musterprüfung wird anhand ihrer gebundenen Prüfung, der gespeicherten Zuordnung und des Widerrufsstatus geprüft. Start, Fortsetzung und PDF erfordern weiter aktive Simulation. `payment-boundary.test.mjs`. |
| M1-R2 | Eigene gespeicherte Tutor-Reservierung aus der Zeit vor dem Versuchsnachweis | Ziel A, Verhalten geprüft: Eine laufende Lease meldet `busy`. Eine abgelaufene Lease liefert einen fehlgeschlagenen Abschluss und wird einmal abgerechnet. `test-tutor.mjs` prüft, dass dabei keine Modellantwort entsteht. |
| M1-R3 | `school_draft.resolve_identity` mit unqualifizierten Parameternamen | Ziel B, technisch behoben: Beide Parameter sind in SQL qualifiziert. Schul-pgTAP prüft die echten Auth-Tabellen und die Rollengrenzen. |
| M1-R4 | Doppelte Identitätsauflösung je gültiger schreibender Schulanfrage | Ziel B, technisch behoben: Nach Empfang des begrenzten Bodys folgt die maßgebliche Auth-Prüfung. Der HTTP-Test prüft einen Datenbankaufruf und Widerruf während des Uploads. Die School-Produktintegration steht aus. |
| M1-R5 | Tutor-Prüfbudget wird auch für inhaltlich ungültige Anfragen verbraucht | Ziel A, implementierte Regel aus ADR 0077: schemafähige Aufrufe zählen vor der Engine-Prüfung. `test-tutor.mjs` prüft ungültige Quellen und die Trennung vom Modellverbrauch. Die Produktionskalibrierung bleibt offen. |
| M1-R6 | Abhängigkeiten #164 (Sammelupdate mit Anthropic SDK 1.8.0 nur im Manifest), #153 (Metro 58 bei Expo SDK 57), #154 (Supabase-CLI 3, DB-Job rot), #155 (Audio API 1.0, Lint rot) | Zurückgestellt auf Nutzerentscheidung vom 16.11.2026; eigenes Abhängigkeitspaket T7 im [Fertigstellungsplan](fertigstellung.md). |

## Nächste ausführbare Pakete

1. FSRS: Einstufung und lokal berechnete Zukunftstermine nachprüfen. Auswirkungen von Lernschritten und Bewertungen mit geeigneten Lerndaten beurteilen.
2. Stufen 1–2: S12-01–10 je Aufgabe, Karte und Fähigkeit vervollständigen und die fachlichen Entscheidungen mit Claude dokumentieren.
3. Audio und Wettbewerb: Offene reale Routen, Gerätewechsel, Mehrgeräteverhalten und die Produktentscheidungen zu Sicherheit und Teilnahme klären.
4. Stufen 3–5: P3-23/24 und die P4-Einzelfunde mit aktuellen Aufgaben und Regressionen vervollständigen.

M2 ist mit diesem Register begonnen, nicht abgeschlossen. Kein offener Fach-, Rechts-, Anbieter-, Geräte-, Beta- oder Veröffentlichungsnachweis wird hier als erledigt markiert.
