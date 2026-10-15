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

- **Ziel:** Aufgaben treffen die Leistungsgrenze (Erfolgswahrscheinlichkeit etwa 70–85 %).
- **Abhängig von:** P3.01
- **Umfang:** M
- **Aufgaben:**
  - [ ] Auswahl innerhalb einer Lektion nach Rating
  - [ ] Einstufungstest auf Ratings umstellen
  - [ ] „Schwächen trainieren“: Übungsmodus aus den schwächsten Fähigkeiten
- **Fertig, wenn:** A/B-Vergleich in der Beta-Gruppe zeigt keine Verschlechterung der Abschlussquote.

### P3.03 – Wiederholung mit FSRS

- **Ziel:** Gelerntes bleibt hängen.
- **Abhängig von:** P3.01
- **Umfang:** M
- **Aufgaben:**
  - [ ] `ts-fsrs` (MIT) einbinden; FSRS-Felder in `skill_progress`
  - [ ] Bereich „Wiederholen“ mit fälligen Wissenskarten und Fähigkeiten
  - [ ] Erinnerung bei vielen fälligen Wiederholungen (optional)
- **Fertig, wenn:** Fälligkeiten stimmen mit dem Algorithmus überein; Wiederholung ist in den Tagesablauf integriert.

## Block B – Wettbewerb und Gemeinschaft

### P3.04 – Ligen

- **Ziel:** Wöchentliche Ligen nach [motivation-und-social.md](motivation-und-social.md).
- **Abhängig von:** Phase 2
- **Umfang:** L
- **Aufgaben:**
  - [ ] Migrationen `league_cohorts`, `league_members`
  - [ ] Einteilung bei erster XP der Woche; Wochengrenze festlegen
  - [ ] Wochenabschluss als geplanter Job (Auf- und Abstieg)
  - [ ] Liga-Screen, Ergebnis-Benachrichtigung
- **Fertig, wenn:** Simulierte Wochen mit Tausenden Testnutzern laufen korrekt durch.

### P3.05 – Theorie-Rush

- **Ziel:** Schneller Spielmodus mit Bestenlisten.
- **Abhängig von:** P3.01
- **Umfang:** M
- **Aufgaben:**
  - [ ] Modi 3 / 5 Minuten / Überleben; steigende Schwierigkeit
  - [ ] Seed vom Server, Prüfung des Laufs per Engine in Edge Function
  - [ ] Bestenlisten (Tag, Woche, Allzeit, Freunde) über Funktion mit minimalen Feldern
  - [ ] Gratis-Kontingent
- **Fertig, wenn:** Manipulierte Läufe werden abgelehnt; Bestenlisten aktualisieren sich korrekt.

### P3.06 – Live-Duelle und Ghost-Duelle

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

- **Ziel:** Ein Grund, jeden Tag vorbeizuschauen.
- **Abhängig von:** Phase 2
- **Umfang:** M
- **Aufgaben:**
  - [ ] Rätselgenerator plus Kuratierung (Vorrat für mehrere Wochen), Schwierigkeit Montag → Sonntag
  - [ ] Ergebnis teilen (ohne Lösung), eigene Rätsel-Serie
- **Fertig, wenn:** Rätsel erscheinen zuverlässig um Mitternacht in der Zeitzone des Nutzers.

### P3.08 – Freunde und Freundes-Quests

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
  - [ ] Spike `pitchy` gegen native Alternative (Genauigkeit, Latenz, Akku)
  - [ ] Verarbeitungskette nach [notation-audio-eingabe.md](notation-audio-eingabe.md)
  - [ ] Stimmgerät-Ansicht (Cent-Anzeige) als Testwerkzeug und Feature
  - [ ] Berechtigungen und Datenschutzhinweis
- **Fertig, wenn:** Gesungene Töne werden in ruhiger Umgebung bei mindestens 95 % der Versuche richtig erkannt (Testreihe mit mehreren Stimmen und Geräten).

### P3.10 – Übungen mit Mikrofon

- **Ziel:** Singübungen im Lernpfad.
- **Abhängig von:** P3.09
- **Umfang:** M
- **Aufgaben:**
  - [ ] `SING_INTERVAL`, `SIGHT_SING` (einfach), `PLAY_BACK` per Mikrofon
  - [ ] Toleranzen je Stufe, Oktavfehler-Behandlung, Hilfeton
- **Fertig, wenn:** Übungen sind in Lektionen der Stufen 1–3 eingebunden.

### P3.11 – MIDI-Eingabe

- **Ziel:** Externes Keyboard als genaue Eingabe.
- **Abhängig von:** P1.18
- **Umfang:** L
- **Aufgaben:**
  - [ ] Web MIDI (unterstützte Browser), natives Modul für iOS/Android (Bibliothek oder eigenes Expo-Modul)
  - [ ] Geräteauswahl, Anschlagstärke, Sustain
  - [ ] Alle Klaviatur-Übungen auch per MIDI
- **Fertig, wenn:** USB- und Bluetooth-Keyboards funktionieren auf allen Plattformen, auf denen MIDI verfügbar ist.

### P3.12 – Übungsmodus Rhythmus

- **Ziel:** Langsam üben, dann prüfen (Vorbild Melodics).
- **Abhängig von:** P2.06
- **Umfang:** S
- **Aufgaben:**
  - [ ] Tempo-Regler, Schleifen, Metronom-Optionen für `RHYTHM_TAP`
- **Fertig, wenn:** Übungs- und Prüfungsdurchlauf sind klar getrennt.

## Block D – Inhalte und Prüfungen

### P3.13 – Engine und Notation v2

- **Ziel:** Fachliche und grafische Grundlage für Stufen 3–4.
- **Abhängig von:** Phase 1
- **Umfang:** XL
- **Aufgaben:**
  - [ ] Engine:
    - Septakkorde und erweiterte Akkorde
    - Harmonik (Stufen und Funktionen vollständig nach Konvention F03)
    - Kadenzen
    - Modulation (Grundlagen)
  - [ ] Notation:
    - Klaviersystem
    - Mehrstimmigkeit
    - Bindebögen, Triolen
    - Alt- und Tenorschlüssel
    - Akkord- und Funktionssymbole
- **Fertig, wenn:** Referenzbeispiele für Stufe 3–4 werden korrekt analysiert und dargestellt (geprüft gegen Literatur).

### P3.14 – Übungstypen Stufe 3–4

- **Ziel:** Übungstypen für Harmonik und Diktat.
- **Abhängig von:** P3.13
- **Umfang:** L
- **Aufgaben:**
  - [ ] `CADENCE_IDENTIFY`, `FUNCTION_ANALYSIS`, `MELODY_DICTATION`, `RHYTHM_DICTATION`
  - [ ] Septakkorde in `CHORD_IDENTIFY` und `CHORD_BUILD`
- **Fertig, wenn:** Wie P2.06.

### P3.15 – Inhalte Stufe 3 (DE + EN)

- **Ziel:** Vollständige Stufe 3 inkl. Formenlehre-Einstieg, Instrumentenkunde, Jazz-/Pop-Grundlagen, Musikgeschichte.
- **Abhängig von:** P3.14
- **Umfang:** XL
- **Aufgaben und Abnahme:** wie P2.07.

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
