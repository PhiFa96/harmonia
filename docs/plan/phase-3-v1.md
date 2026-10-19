# Phase 3 – V1 (Ausbau)

**Ziel:** Harmonia wird zur App, die man täglich öffnet:

- Wettbewerb und Gemeinschaft (Ligen, Rush, Duelle, tägliches Rätsel, Freunde)
- Lernlogik, die sich anpasst (Ratings, Wiederholung)
- Singen und Spielen als Eingabe (Mikrofon, MIDI)
- Stufen 3–4 bis zur Studienvorbereitung, mit Prüfungsmodus

**Blöcke:**

- A: Adaptive Lernlogik
- B: Wettbewerb und Gemeinschaft
- C: Eingabe
- D: Inhalte und Prüfungen
- E: Tutor

---

## Block A – Adaptive Lernlogik

### P3.01 – Ratings mit Glicko-2

**Technischer Stand (15.10.2026):** Berechnung, Parameterprofile, Migration, kanonische Sync-Projektion und wiederaufnehmbare Rückrechnung implementiert; [Umsetzung und Abnahme](ratings-glicko2.md), [ADR 0028](../decisions/0028-glicko-aus-kanonischen-lernversuchen.md). Tatsächlicher P2-Launch und Plausibilität mit echten Lernenden bleiben offen.

- **Ziel:** Fähigkeiten der Nutzer und Schwierigkeit der Aufgaben werden geschätzt.
- **Abhängig von:** Phase 2
- **Umfang:** L
- **Aufgaben:**
  - [x] Glicko-2-Implementierung in `packages/exercises` (reines TypeScript, testbar, auch serverseitig)
  - [x] Migration: Rating-Felder in `skill_progress`, Tabelle `item_difficulty`
  - [x] Parameter-Gruppen je Übungstyp definieren (Schwierigkeits-Buckets)
  - [x] Serverseitige Aktualisierung beim Sync
  - [x] Rückrechnung aus vorhandenen kanonischen `learning_events` (idempotent; `item_attempts` wurde in P2 nicht angelegt)
- **Fertig, wenn:** Ratings konvergieren in Simulationen; Werte für echte Nutzer sind plausibel.
- **Tests:** Glicko-2 gegen die Rechenbeispiele aus Glickmans Beschreibung des Verfahrens.

### P3.02 – Adaptive Aufgabenauswahl

**Technischer Stand (16.10.2026):** Rating-Auswahl mit vollständigem Pflichtstoff, versionierte Glicko-Einstufung und gezielter Übungsmodus implementiert. [Umsetzung und offene Abnahme](adaptive-aufgabenauswahl.md), [ADR 0029](../decisions/0029-adaptive-auswahl-mit-nachpruefbaren-quellen.md). Reale Beta-Nichtunterlegenheit bleibt offen; Branch-Übergabe an Claude Code ohne PR/Integration.

- **Ziel:** Aufgaben treffen die Leistungsgrenze (Erfolgswahrscheinlichkeit etwa 70–85 %).
- **Abhängig von:** P3.01
- **Umfang:** M
- **Aufgaben:**
  - [x] Auswahl innerhalb einer Lektion nach Rating
  - [x] Einstufungstest auf Ratings umstellen
  - [x] „Schwächen trainieren“: Übungsmodus aus den schwächsten Fähigkeiten
- **Fertig, wenn:** A/B-Vergleich in der Beta-Gruppe zeigt keine Verschlechterung der Abschlussquote.

### P3.03 – Wiederholung mit FSRS

- **Ziel:** Gelerntes bleibt hängen.
- **Abhängig von:** P3.01
- **Umfang:** M
- **Aufgaben:**
  - [x] `ts-fsrs` 5.4.2 (MIT) einbinden; FSRS-Zustand in `skill_progress` und versionierte Karten-Termine
  - [x] Bereich „Wiederholen“ mit fälligen Wissenskarten und Fähigkeiten, Offline-Sync und pausierbarem Aufgabenablauf
  - [x] Hinweis bei vielen fälligen Wiederholungen innerhalb der App; freiwillige Tageserinnerungen bleiben verfügbar (kein zusätzlicher Push-Versand)
- **Fertig, wenn:** Fälligkeiten stimmen mit dem Algorithmus überein; Wiederholung ist in den Tagesablauf integriert.
- Technische Umsetzung und Übergabe: [fsrs-wiederholung.md](fsrs-wiederholung.md), [ADR 0030](../decisions/0030-fsrs-aus-kanonischen-lernnachweisen.md). Auf normalem Branch für Claudes PR-/CI-Ablauf; keine eigene Integration. Physische Geräte und längerfristige Behaltenswirkung bleiben offen.

## Block B – Wettbewerb und Gemeinschaft

### P3.04 – Ligen

**Technischer Stand (16.10.2026):** Wöchentliche Gruppen, kanonische XP, atomarer Auf-/Abstieg, Liga-Tab und getrennte Ergebnis-Mitteilungen implementiert. [Umsetzung und Betriebsabnahme](ligen.md), [ADR 0031](../decisions/0031-ligen-aus-bestaetigten-xp.md). Remote-Scheduler, Anbieter-/Geräteabnahme und Claudes Integration bleiben offen.

- **Ziel:** Wöchentliche Ligen nach [motivation-und-social.md](motivation-und-social.md).
- **Abhängig von:** Phase 2
- **Umfang:** L
- **Aufgaben:**
  - [x] Migrationen `league_cohorts`, `league_members`
  - [x] Einteilung bei erster XP der Woche; Wochengrenze festlegen
  - [x] Wochenabschluss als geplanter Job (Auf- und Abstieg)
  - [x] Liga-Screen, Ergebnis-Benachrichtigung
- **Fertig, wenn:** Simulierte Wochen mit Tausenden Testnutzern laufen korrekt durch.

### P3.05 – Theorie-Rush

- **Ziel:** Schneller Spielmodus mit Bestenlisten.
- **Abhängig von:** P3.01
- **Umfang:** M
- **Aufgaben:**
  - [x] Modi 3 / 5 Minuten / Überleben; steigende Schwierigkeit
  - [x] Seed vom Server, Prüfung des Laufs per Engine in Edge Function
  - [x] Bestenlisten (Tag, Woche, Allzeit, Freunde) über Funktion mit minimalen Feldern
  - [x] Gratis-Kontingent
- **Fertig, wenn:** Manipulierte Läufe werden abgelehnt; Bestenlisten aktualisieren sich korrekt.

Technische Übergabe: `theorie-rush.md`, ADR 0032. Freundesfilter auf gegenseitig bestätigten privaten Beziehungen; Verwaltung folgt P3.08. Remote-/Scheduler-, Geräte- und Inhaltsfreigaben bleiben offen.

### P3.06 – Live-Duelle und Ghost-Duelle

**Technischer Stand (16.10.2026):** Implementierung auf `codex/p3-06-duels` mit Rush-Bank, Service-Matchmaking, privatem Broadcast, Ghosts, Einladungen und Glicko-2 vorbereitet; [Umsetzung und offene Abnahme](duelle.md), [ADR 0033](../decisions/0033-duelle-aus-geprueften-rush-aufgaben.md). Datenbank-/Realtime-Integration und Plattformkombinationen sind wegen gesperrtem Container-Download beziehungsweise fehlender Geräte noch nicht bestätigt.

- **Ziel:** 1:1-Wettbewerb in Echtzeit.
- **Abhängig von:** P3.05
- **Umfang:** XL
- **Aufgaben:**
  - [ ] Matchmaking (Edge Function + Warteschlange), Paarung nach Duell-Rating
  - [ ] Supabase Realtime (Broadcast) für Fortschritt; Umgang mit Verbindungsabbrüchen
  - [ ] Serverseitige Auswertung, Glicko-2 für `duel_ratings`
  - [ ] Ghost-Duelle aus aufgezeichneten Läufen; klare Kennzeichnung
  - [ ] Freundes-Duelle per Link
- **Fertig, wenn:** Duelle funktionieren zwischen allen Plattform-Kombinationen und bei schwachem Netz.

### P3.07 – Tägliches Rätsel

**Technischer Stand (16.10.2026):** Auf `codex/p3-07-daily-puzzle` vorbereitet: 42 datierte Aufgaben aus freigegebenem Katalog, lokaler Mitternachtswechsel, servergeprüfte Einmalantwort, eigene Serie und lösungsfreier Teiltext. [Umsetzung und offene Abnahme](taegliches-raetsel.md), [ADR 0034](../decisions/0034-tagesraetsel-aus-freigegebenem-katalog.md). Produktiver Katalog und Datenbank-/Geräteabnahmen bleiben offen.

- **Ziel:** Ein Grund, jeden Tag vorbeizuschauen.
- **Abhängig von:** Phase 2
- **Umfang:** M
- **Aufgaben:**
  - [ ] Rätselgenerator plus Kuratierung (Vorrat für mehrere Wochen), Schwierigkeit Montag → Sonntag
  - [ ] Ergebnis teilen (ohne Lösung), eigene Rätsel-Serie
- **Fertig, wenn:** Rätsel erscheinen zuverlässig um Mitternacht in der Zeitzone des Nutzers.

### P3.08 – Freunde und Freundes-Quests

Technische Übergabe: `freunde-und-quests.md`, ADR 0035. Einmal-Einladungen, beidseitige Freundschaft, Blockieren/Entfernen und eine Quest pro UTC-Woche mit 300 neuen bestätigten XP und je einem Abzeichen sind vorbereitet. Datenbank-, Geräte-, Scheduler- und Rechtsabnahme bleiben offen.

- **Ziel:** Gemeinsam lernen, ohne Chat-Risiken.
- **Abhängig von:** Phase 2
- **Umfang:** M
- **Aufgaben:**
  - [ ] Freundschaft per Einladungslink oder Code; Freundesliste mit Streak und Liga
  - [ ] Wöchentliche Freundes-Quest (Paarung, Ziel, Belohnung)
  - [ ] Blockieren und Entfernen
- **Fertig, wenn:** Datenschutz geprüft (keine Kontaktabgleiche, keine Suche nach Klarnamen).

## Block C – Eingabe

### P3.09 – Mikrofon: Tonhöhenerkennung

- **Ziel:** Singen und Spielen werden erkannt.
- **Abhängig von:** P1.16
- **Umfang:** L
- **Aufgaben:**
  - [ ] Spike `pitchy` gegen native Alternative: statische Bewertung dokumentiert, Messung auf Geräten offen ([Mikrofon und Stimmgerät](mikrofon-und-stimmgeraet.md))
  - [x] Verarbeitungskette nach [notation-audio-eingabe.md](notation-audio-eingabe.md) technisch umgesetzt; Geräteabnahme offen
  - [x] Stimmgerät-Ansicht mit Cent-Anzeige technisch umgesetzt; Geräteabnahme offen
  - [x] Berechtigungen und Datenschutzhinweis technisch umgesetzt; rechtliche Abnahme offen
- **Fertig, wenn:** Gesungene Töne werden in ruhiger Umgebung bei mindestens 95 % der Versuche richtig erkannt (Testreihe mit mehreren Stimmen und Geräten).

### P3.10 – Übungen mit Mikrofon

- **Ziel:** Singübungen im Lernpfad.
- **Abhängig von:** P3.09
- **Umfang:** M
- **Aufgaben:**
  - [x] `SING_INTERVAL`, `SIGHT_SING` (einfach), `PLAY_BACK` per Mikrofon technisch umgesetzt; Geräteabnahme offen ([Mikrofonübungen](mikrofon-uebungen.md))
  - [x] Toleranzen je Stufe, Oktavfehler-Behandlung, Hilfeton technisch umgesetzt
- **Fertig, wenn:** Übungen sind in Lektionen der Stufen 1–3 eingebunden.

### P3.11 – MIDI-Eingabe

- **Ziel:** Externes Keyboard als genaue Eingabe.
- **Abhängig von:** P1.18
- **Umfang:** L
- **Aufgaben:**
  - [x] Web MIDI (unterstützte Browser), natives Modul für iOS/Android technisch eingebunden; native Geräteabnahme offen ([MIDI-Eingabe](midi-eingabe.md))
  - [x] Geräteauswahl, Anschlagstärke, Sustain technisch umgesetzt
  - [x] Alle vorhandenen Klaviatur-Übungen auch per MIDI-Eingang
- **Fertig, wenn:** USB- und Bluetooth-Keyboards funktionieren auf allen Plattformen, auf denen MIDI verfügbar ist.

### P3.12 – Übungsmodus Rhythmus

- **Ziel:** Langsam üben, dann prüfen (Vorbild Melodics).
- **Abhängig von:** P2.06
- **Umfang:** S
- **Aufgaben:**
  - [x] Tempo-Regler, Schleifen, Metronom-Optionen für `RHYTHM_TAP` technisch umgesetzt ([Rhythmus-Übungsmodus](rhythmus-uebungsmodus.md))
- **Fertig, wenn:** Übungs- und Prüfungsdurchlauf sind klar getrennt.

## Block D – Inhalte und Prüfungen

### P3.13 – Engine und Notation v2

- **Ziel:** Fachliche und grafische Grundlage für Stufen 3–4.
- **Abhängig von:** Phase 1
- **Umfang:** XL
- **Aufgaben:**
  - [x] Engine-Grundlage: Septakkorde, Non-/Undezim-/Tredezimakkorde, diatonische Stufen, vorläufige Funktionen, einfache Kadenzen und Pivotmodulation ([Übergabe](engine-und-notation-v2.md))
  - [x] Notationsgrundlage: Klaviersystem, zwei Stimmen je System, Phrasierungsbögen, Triolen, Alt-/Tenorschlüssel und Harmoniklabels
  - [ ] Vollständige Funktionstheorie und Symbolschreibweise nach der noch offenen Konvention F03 fachlich festlegen und prüfen
  - [ ] Referenzbeispiele gegen Literatur und durch Claude nach ADR 0005 abnehmen
- **Fertig, wenn:** Referenzbeispiele für Stufe 3–4 werden korrekt analysiert und dargestellt (geprüft gegen Literatur).

### P3.14 – Übungstypen Stufe 3–4

- **Ziel:** Übungstypen für Harmonik und Diktat.
- **Abhängig von:** P3.13
- **Umfang:** L
- **Aufgaben:**
  - [x] `CADENCE_IDENTIFY`, `FUNCTION_ANALYSIS`, `MELODY_DICTATION`, `RHYTHM_DICTATION` technisch integriert ([Übergabe](harmonik-und-diktat-uebungen.md))
  - [x] Septakkorde in `CHORD_IDENTIFY` und `CHORD_BUILD` technisch integriert
- **Fertig, wenn:** Wie P2.06.

Die fachliche Prüfung nach ADR 0005, F03 und echte Geräteabnahme bleiben offen; P3.14 ist noch nicht fachlich abgeschlossen.

### P3.15 – Inhalte Stufe 3 (DE + EN)

- **Ziel:** Vollständige Stufe 3 inkl. Formenlehre-Einstieg, Instrumentenkunde, Jazz-/Pop-Grundlagen, Musikgeschichte.
- **Abhängig von:** P3.14
- **Umfang:** XL
- **Aufgaben und Abnahme:** wie P2.07.

**Stand 19.10.2026:** Zwölf Stufe-3-Einheiten, 36 Fähigkeiten und Lektionen, 360 Aufgaben, 48 Karten/Beispiele und zwölf Artikel liegen als DE/EN-Entwurf auf `codex/p3-15-level-three-content`. Formenlehre, Instrumentenkunde, Jazz/Pop, Musikgeschichte sowie modale Tonleitern, Septakkorde, Harmonik und Diktat sind intern zugeordnet; [Übergabe und Grenzen](stufe-3-vollstaendig.md). Öffentliche Freigabe, getrennte fachliche Prüfung nach ADR 0005 und Geräteabnahme sind offen. **P3.15 ist fachlich nicht abgeschlossen.**

### P3.16 – Inhalte Stufe 4 (DE + EN)

- **Ziel:** Vollständige Stufe 4 (Studienvorbereitung).
- **Abhängig von:** P3.15
- **Umfang:** XL
- **Aufgaben und Abnahme:** wie P2.07.

### P3.17 – Prüfungsmodus

- **Ziel:** Simulation von Aufnahmeprüfungen (Theorie und Gehörbildung).
- **Abhängig von:** P3.14
- **Umfang:** L
- **Aufgaben:**
  - [ ] Recherche zu typischen Prüfungsformaten (öffentliche Informationen der Hochschulen; keine Übernahme fremder Prüfungsaufgaben)
  - [ ] Prüfungsvorlagen mit Zeitlimit, Punktewertung, Auswertung je Bereich
  - [ ] Empfehlungen nach der Prüfung (verknüpft mit Lernpfad)
- **Fertig, wenn:** Mindestens zwei Prüfungsvorlagen sind fachlich geprüft.

## Block E – Tutor

### P3.18 – Tutor v2: Lernplaner und Gedächtnis

- **Ziel:** Der Tutor kennt Stärken und Schwächen und plant mit.
- **Abhängig von:** P3.01
- **Umfang:** M
- **Aufgaben:**
  - [ ] Werkzeuge `get_learner_summary`, `analyze_progression`
  - [ ] Wochenplan-Vorschlag; Zusammenfassung von Stärken und Schwächen (ohne personenbezogene Daten)
  - [ ] Testkatalog erweitern (Stufen 3–4)
- **Fertig, wenn:** Testkatalog erfüllt; Lernpläne stichprobenartig fachlich geprüft.

### P3.19 – Wissensbasis v2

- **Ziel:** Artikel für Stufen 3–4 und Musikgeschichte.
- **Abhängig von:** P3.15
- **Umfang:** L
- **Aufgaben:**
  - [ ] Artikel nach Inhaltsprozess
  - [ ] Semantische Suche (`pgvector`) evaluieren, falls die Volltextsuche nicht reicht
- **Fertig, wenn:** Antworten zu Stufe-3–4-Themen sind quellenbasiert.

---

**Phase 3 abgeschlossen, wenn:**

- [ ] P3.01–P3.19 fertig
- [ ] Stufen 3–4 live in DE und EN
- [ ] Rückblick durchgeführt, Plan für Phase 4 angepasst
