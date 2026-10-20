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
- **P3.15/16:** Begriffsdefinitionen verraten den Begriff (Lösungsleck, ca. 600 Aufgaben), Tp/Sp ungeklärt, EN-US ≙ EN-GB ohne Glossar, Entwicklerhinweise als Lerntext, fehlende Voraussetzungskanten Stufe 4, Beispiel „Gemeinsame Töne halten“ zeigt Quintparallelen, Stufe-4-Aufgaben decken Ziele nicht ab.

## Fähigkeiten und Graph

Stufe 1: 4 Fehler, 18 Zweifel; Stufe 2: 8 Fehler, 15 Zweifel; Graph ohne Zyklen und ohne Stufenverstoß (Berichte unter [`docs/quality/fachpruefung-stufe-1/`](../quality/fachpruefung-stufe-1/)). Korrekturen folgen in einem eigenen PR.
