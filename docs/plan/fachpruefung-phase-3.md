# Fachlicher Prüfdurchgang Phase 3 (P3.02–P3.16)

Stand: 20.10.2026. **Ergebnis: geprüft, Blocker behoben, nichts freigegeben.** Alle Inhalte der Stufen 3–4 bleiben `entwurf`; öffentlich null Lektionen. Phase 3 ist nicht öffentlich abgeschlossen (Fachreviews mit echten Quellen, echte Modellantworten, Geräte- und Live-Supabase-Prüfung sowie Freigabe der Stufen 3–4 fehlen; die Simulationsauswertung meldet `releaseEligible: false`).

## Vorgehen

Acht unabhängige Prüfer mit frischem Kontext (ADR 0005), je Themenblock, nur lesend: Auswahl/FSRS, Ligen/Rush/Duelle, Rätsel/Freunde, Mikrofon, MIDI/Rhythmus, Notation v2/Harmonie, Stufe 3, Stufe 4. Prüfmittel: Theorie-Engine, `tonal` als Orakel, eigene Tabellen und Generatorläufe (mehrere tausend Seeds), Signaltests, lokales Postgres 16 mit Auth-/pgTAP-Attrappen für die DB-Funktionen, gerenderte DE/US/UK-Texte und Websuche-Auszüge. Rohberichte: [`docs/quality/fachpruefung-phase-3/`](../quality/fachpruefung-phase-3/) (Stand vor den Korrekturen; die erwähnten Skripte lagen im flüchtigen Arbeitsordner).

Grenzen: Literatur nur über Suchauszüge, kein Primärtext. DB-Prüfung mit Attrappen statt echtem Supabase (die CI prüft mit echtem Supabase). Keine Geräte-, Mikrofon-, MIDI-, Latenz- und Screenreader-Prüfung. Echte Stimmen und Akustik sind nicht geprüft.

## Behoben (mit Tests)

- **Tenorschlüssel** lag auf dem Mezzosopran-Platz; c¹ steht jetzt auf der vierten Linie von unten (`layout.ts`).
- **Hinweis 2** der Gesangs-/Nachspielaufgaben zeigte „NaN Halbtöne“.
- **P3.06 Duelle:** `duel_invite_create` scheiterte immer (mehrdeutiges `ON CONFLICT`, SQLSTATE 42702), Test-JSON ohne schließende Klammer, kein Fehlerlimit (jetzt wie Rush nach 3 Fehlern Ende), ungenutzte Variablen (`db:lint`).
- **Doppelte Migrationsversion** `20261016040000` (Tutor-Prompt v3 aus #84 und adaptive Auswahl): Letztere heißt jetzt `20261016040500`.
- **P3.10 Mikrofon:** übersprungene Singaufgaben zählen nicht im Nenner der 80-%-Quote, Oktaväquivalenz beim Singen, lokalisierter Intervallname statt „P4“ ([ADR 0037](../decisions/0037-oktavaequivalenz-und-uebersprungene-singaufgaben.md)).

## Nacharbeitsliste (nicht blockierend, noch offen)

- **P3.02/03:** adaptive Auswahl greift beim Erststart nur in 2 von 85 Lektionen (Gate `authored.some(...)` in `lesson-flow.ts`), doppelte Aufgaben im Wiederholungsplan, ein Fehler bei 8 Aufgaben setzt alle drei Fähigkeiten auf „Again“, Lernschritte 1/10 Minuten, `review.ratingHelp` widerspricht der Bedienung, Zeitprüfung in `learning-sync`; nur 5 von 21 FSRS-Gewichten extern belegt.
- **P3.04–06:** globale Sperre in `learner_league`, Premium-Liga-XP (3000/Tag), XP ohne Mindestbeteiligung in Duellen, Rush-Bot-Anfälligkeit, Datenschutztext zu Ghost-Läufen.
- **P3.07/08:** freie Zeitzone beim Tagesrätsel, einseitiger Quest-Start ohne Ablehnung, Konto-UUID statt anonymer Kennung, kein Altersschutz, client-gewählter Einladungstoken, fehlende Drosselung, Pluralfehler.
- **P3.09/10:** Cent-Abweichung in der Rückmeldung (Stufen 2/3), Testlücken Mikrofonweg, Web/Native-Randfälle, Client meldet Messwert ungeprüft.
- **P3.11/12:** MIDI-Port-ID-Wechsel, `fixedRange` wird von MIDI umgangen, UK-Texte und Plural im Rhythmusmodus, iOS-Bluetooth ohne In-App-Kopplung.
- **P3.13/14:** `analyzeHarmony` ohne melodisches Moll, Funktionskürzel mehrdeutig (iii/vii°), Kadenzaufgabe ohne Tonika-Kontext mehrdeutig, Fehlerwiederholung ohne neue fachliche Antwort, Screenreader-Bedienung der Funktionsaufgabe, britische Kadenznamen/Glossar.
- **P3.15/16 (Stand Katalogversion 18):** behoben sind das Lösungsleck der Begriffsdefinitionen (84 Texte, Wache `knowledge-leak.test.ts`), Entwicklerhinweise und gleichlautende Captions, die Beispiele Rondo und „Gemeinsame Töne halten“, Tp/Sp, einheitliche Kadenz-/Stufenzeichen, Sprachfehler, US/UK-Schreibweisen samt Glossarverweisen und die Voraussetzungskanten (Einzelheiten und Zurückgestelltes in [Stufe 3](stufe-3-vollstaendig.md) und [Stufe 4](stufe-4-vollstaendig.md)). Offen bleiben die Lektionsstruktur (alle drei Fähigkeiten je Lektion, Karten nach Index), fehlende Aufgaben für die Fähigkeitsziele (Modi, Formverlauf, Zwischendominanten, Voicings, Hörstufe 4), Septakkord-Umkehrungsterminologie in Stufe 3, Singumfang, Stimm-/Instrumentenumfänge, tragende Beispiele für Mehrstimmigkeit und Bezifferung, UK-Kadenzterminologie sowie der Primärliteratur-Abgleich; alles bleibt `entwurf`.

## Fähigkeiten und Graph

Stufe 1: 4 Fehler, 18 Zweifel; Stufe 2: 8 Fehler, 15 Zweifel; Graph ohne Zyklen und ohne Stufenverstoß (Berichte unter [`docs/quality/fachpruefung-stufe-1/`](../quality/fachpruefung-stufe-1/)). Korrekturen folgen in einem eigenen PR.

## P3.17–P3.19 (zweite Runde, 20.10.2026)

Berichte: [`P3.17`](../quality/fachpruefung-phase-3/p3-17-pruefungsmodus.md), [`P3.18`](../quality/fachpruefung-phase-3/p3-18-tutor-planer.md), [`P3.19`](../quality/fachpruefung-phase-3/p3-19-wissensbasis-v2.md). Die Prüfer konnten keine Datenbank-/pgTAP-Läufe ausführen (kein Docker); diese Abnahme bleibt offen. Nichts wird freigegeben, der öffentliche Index bleibt leer.

**Behoben:**
- P3.17: Kadenzfrage der Vorlage `foundation` war als Theorie etikettiert, ist aber immer eine Hörfrage (`CADENCE_IDENTIFY`); ersetzt durch eine Modulationsfrage, neuer Test prüft den Bereich gegen `isAuralExercise`.
- P3.18: `knowledge.test.sql` erwartete Prompt-Version 3 (Migration setzt 4); Testkatalog v2 nach den Helmholtz-Namen neu erzeugt und als CI-Schritt ergänzt (`check:tutor:catalogue-v2`); Prompt-Zeile „user profiles“ zu „account fields or raw answers“ präzisiert. **Prompt v4 verlangt eine neue echte Kalibrierung; es wird nichts als live gemessen behauptet.**

**Nacharbeit (nicht blockierend):**
- **P3.17:** Abschlusstext bei übersprungenen Hörfragen, keine Abbruchbestätigung, keine Fokus-/Zeitansage am Ende, keine App-Tests für `exam.tsx`, serverseitige Frist bei gespeicherten Ergebnissen, Fachprüfung der Vorlagen.
- **P3.18:** Stärken/Übungsfeld ohne Mindestabstand (Ratings 1500/1500 ergeben beides), kein Alterszerfall, Wochenplan ignoriert Übungsfelder, Datenschutzdokumente (VVT, DSFA-Vorprüfung, Store) ergänzen, Lernstand erst beim Werkzeugaufruf laden, Testlücken (DB-Pfad, Stärken-Zweig, Fixture ruft Werkzeuge nicht auf), Stufe-3/4-Fälle sind nur 4 verschiedene Aufgaben, Doku „8 statt 10 Werkzeuge“, `p2-abschluss.md` nennt noch Prompt v3.
- **P3.19:** Trigramm-Schwelle 0,25 liefert themenfremde Treffer („Coda“, „Motiv“), `db:test:knowledge:v2` läuft nicht in der CI, en-GB ist Kopie von en-US mit gemischter Schreibung, Entwicklerhinweise als Lerntext, „direkte parallele Quinten“ und Hemiole-Definition fachlich unscharf, ADR-0016-Nachtrag zu `pg_trgm`.
