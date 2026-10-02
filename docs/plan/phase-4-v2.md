# Phase 4 – V2 (Coaching, Schule, Profi-Features)

**Ziel:**

- Harmonia verbindet KI und Menschen: Coach-Marktplatz mit Provision, KI-Live-Calls.
- Profi-Funktionen für Fortgeschrittene: Tonsatz-Korrektor, Chor-Trainer, Zeitreise.
- Angebote für Schulen und Zertifikate.
- Inhalte bis Stufe 5.

**Voraussetzungen:**

- Alle Punkte „Vor Phase 4“ aus [recht-und-compliance.md](recht-und-compliance.md) sind geklärt.
- Die Nutzerbasis ist groß genug, um Coaches Buchungen zu versprechen.

**Blöcke:**

- A: Coach-Marktplatz
- B: KI-Live
- C: Profi-Features
- D: Schule
- E: Zertifikate und Inhalte

---

## Block A – Coach-Marktplatz

### P4.01 – Coach-Dashboard (Web) und Onboarding

- **Ziel:** Coaches registrieren sich, werden geprüft und erhalten Auszahlungen.
- **Abhängig von:** Phase 3, F14
- **Umfang:** XL
- **Aufgaben:**
  - [ ] `apps/dashboard` (Web), gemeinsame Pakete mit der App
  - [ ] Registrierung, Profil DE/EN (Bio, Sprachen, Schwerpunkte, Stundensatz), Profilbild
  - [ ] Stripe Connect (Express): Onboarding und Identitätsprüfung bei Stripe
  - [ ] Eigene Prüfung (z. B. Nachweis der Qualifikation, Probegespräch), Verhaltenskodex
  - [ ] Coach-AGB, Erhebung der Daten für DAC7
- **Fertig, wenn:** Ein Test-Coach durchläuft den gesamten Prozess im Stripe-Testmodus.

### P4.02 – Coach-Pro-Abo

- **Ziel:** Zusätzliche Einnahmequelle von Coaches.
- **Abhängig von:** P4.01
- **Umfang:** M
- **Aufgaben:**
  - [ ] Abo über Web-Dashboard (Stripe Billing); Leistungen nach [monetarisierung.md](monetarisierung.md)
  - [ ] Abgleich mit den aktuellen Store-Regeln, bevor Coach-Funktionen in der iOS-App sichtbar werden
- **Fertig, wenn:** Abschluss, Verlängerung und Kündigung funktionieren; Pro-Vorteile wirken in Suche und Dashboard.

### P4.03 – Suche, Verfügbarkeit und Buchung

- **Ziel:** Schüler finden einen passenden Coach und buchen einen Termin.
- **Abhängig von:** P4.01
- **Umfang:** L
- **Aufgaben:**
  - [ ] Coach-Suche in der App (Filter: Sprache, Schwerpunkt, Preis, Bewertung); offengelegte Ranking-Kriterien
  - [ ] Verfügbarkeiten mit Zeitzonen, Pufferzeiten, Sperrzeiten
  - [ ] Buchungsablauf mit Erinnerungen (Push, E-Mail)
  - [ ] Stornierungsregeln, Nichterscheinen
- **Fertig, wenn:** Buchungen über Zeitzonen hinweg sind korrekt; Doppelbuchungen sind ausgeschlossen (Datenbank-Sperre).

### P4.04 – Zahlung, Provision, Auszahlung

- **Ziel:** 15 % Provision automatisch einbehalten.
- **Abhängig von:** P4.03, F13
- **Umfang:** L
- **Aufgaben:**
  - [ ] Zahlung mit Stripe (PaymentSheet in der App, Checkout im Web), Plattformgebühr 15 %
  - [ ] Webhooks: Zahlung, Erstattung, Streitfall, Auszahlung
  - [ ] Erstattungslogik nach Stornoregeln
  - [ ] Belege für Schüler, Übersicht für Coaches
  - [ ] Jahresmeldung für DAC7 vorbereiten
- **Fertig, wenn:** Alle Zahlungsfälle im Testmodus durchgespielt, inkl. Teil-Erstattung und Streitfall.

### P4.05 – Video-Calls mit gemeinsamem Notenblatt

- **Ziel:** Unterricht direkt in Harmonia.
- **Abhängig von:** P4.03
- **Umfang:** XL
- **Aufgaben:**
  - [ ] LiveKit (React-Native-SDK mit Expo-Plugin, Development Builds), Raum pro Buchung, Zugang nur für die Beteiligten
  - [ ] **Keine Aufzeichnung** (Bedingung für die Abrechnung außerhalb von Google Play Billing)
  - [ ] **Gemeinsames interaktives Notensystem und Klaviatur** im Call (eigene Idee): Beide sehen und hören dasselbe Beispiel, synchronisiert über Realtime.
  - [ ] Verbindungsqualität, Wiederverbinden, Geräteauswahl
- **Fertig, wenn:** 60-minütige Testcalls zwischen allen Plattform-Kombinationen sind stabil.

### P4.06 – Lernstand teilen und Hausaufgaben

- **Ziel:** Coaches unterrichten gezielter.
- **Abhängig von:** P4.03
- **Umfang:** M
- **Aufgaben:**
  - [ ] Freigabe des Lernstands durch den Schüler (widerrufbar)
  - [ ] Coach-Ansicht: Stärken, Schwächen, letzte Ergebnisse
  - [ ] Hausaufgaben aus Übungsbausteinen zuweisen; erscheinen im Lernpfad des Schülers
- **Fertig, wenn:** Ohne Freigabe sieht ein Coach nichts (pgTAP-Test).

### P4.07 – Bewertungen und Meldewege

- **Ziel:** Vertrauen im Marktplatz.
- **Abhängig von:** P4.04
- **Umfang:** M
- **Aufgaben:**
  - [ ] Bewertung nur nach stattgefundenem Termin
  - [ ] Moderation, Melden von Profilen und Bewertungen (DSA), Beschwerdeweg für Coaches (P2B)
- **Fertig, wenn:** Melde- und Beschwerdeprozess dokumentiert und getestet.

## Block B – KI-Live

### P4.08 – KI-Live-Calls (Sprache)

- **Ziel:** Gespräch mit dem Tutor per Stimme im Max-Abo.
- **Abhängig von:** P4.05, P3.18
- **Umfang:** XL
- **Aufgaben:**
  - [ ] LiveKit Agents: Spracherkennung → Sprachmodell (mit Engine-Werkzeugen) → Sprachausgabe; Anbieter für Sprache evaluieren (DE/EN, Datenschutz)
  - [ ] Musikbeispiele über die App-Audio-Engine während des Gesprächs
  - [ ] Minutenkontingent, Kostenmessung, KI-Kennzeichnung
  - [ ] Testkatalog für gesprochene Interaktion
- **Fertig, wenn:**
  - Die Antwortzeit im Gespräch fühlt sich natürlich an (Ziel festlegen und messen).
  - Die Kosten pro Minute passen in die Preisgestaltung des Max-Abos.

## Block C – Profi-Features

### P4.09 – Engine: Stimmführungsprüfung

- **Ziel:** Regelwerk für den vierstimmigen Satz.
- **Abhängig von:** P3.13, F05
- **Umfang:** XL
- **Aufgaben:**
  - [ ] Regeln aus [theorie-engine.md](theorie-engine.md), jede mit Quelle, Schweregrad, Konfiguration
  - [ ] Testkorpus mit eigenen fehlerhaften und fehlerfreien Sätzen
- **Fertig, wenn:**
  - Der Korpus wird vollständig korrekt beurteilt.
  - Jede Regel ist mit ihrer Quelle belegt und fachlich geprüft.

### P4.10 – Tonsatz-Korrektor

- **Ziel:** Sätze schreiben, Fehler sehen, verstehen.
- **Abhängig von:** P4.09
- **Umfang:** L
- **Aufgaben:**
  - [ ] Eingabe von vier Stimmen (Klaviersystem, Stimmen-Umschaltung)
  - [ ] Aufgaben: Bass oder Sopran gegeben, Rest ergänzen; Funktionen vorgegeben
  - [ ] Fehler markieren; Tutor erklärt mit `check_voice_leading`
- **Fertig, wenn:** Übungstyp `VOICE_LEADING` in Stufe 4–5 eingebunden.

### P4.11 – Chor-Trainer

- **Ziel:** Mehrstimmig singen üben.
- **Abhängig von:** P3.09
- **Umfang:** L
- **Aufgaben:**
  - [ ] Chorklang („Ah“) im Sampler
  - [ ] Drei Stimmen spielen, eine Stimme singen; Bewertung pro Note
  - [ ] Eigene Chorsätze (selbst geschrieben oder gemeinfrei in eigenem Satz)
- **Fertig, wenn:** Übungstyp `CHOIR_PART` funktioniert mit Kopfhörern zuverlässig.

### P4.12 – Zeitreise durch die Musikgeschichte

- **Ziel:** Geschichte erleben statt auswendig lernen.
- **Abhängig von:** P3.19
- **Umfang:** L
- **Aufgaben:**
  - [ ] Story-Modus durch die Epochen mit Klangbeispielen (eigene Einspielungen oder MIDI-Wiedergabe)
  - [ ] „Interview“ mit historischen Personas. Deutlich als KI-Fiktion gekennzeichnet, nur auf Basis der Wissensbasis, mit Quellen
  - [ ] Wissensfragen und Hörquiz je Epoche
- **Fertig, wenn:** Mindestens vier Epochen sind fachlich freigegeben.

## Block D – Schule

### P4.13 – Organisationen, Klassen, Lehrer-Dashboard

- **Ziel:** Lehrkräfte arbeiten mit ihren Klassen.
- **Abhängig von:** P4.01 (Dashboard-Basis)
- **Umfang:** XL
- **Aufgaben:**
  - [ ] Organisationen, Rollen, Klassen, Einladung per Code
  - [ ] Dashboard: Fortschritt der Klasse, Schwächen, Einzelansicht
  - [ ] Datenschutz Schule: Datensparsamkeit, Einwilligungen, AVV-Vorlage
- **Fertig, wenn:** pgTAP-Tests belegen, dass Lehrkräfte nur ihre Klassen sehen.

### P4.14 – Aufgaben zuweisen

- **Ziel:** Hausaufgaben für Klassen.
- **Abhängig von:** P4.13
- **Umfang:** M
- **Aufgaben:**
  - [ ] Aufgaben aus Lektionen und Übungsbausteinen zusammenstellen, Fälligkeit, Auswertung
  - [ ] Teilen per Link (Vorbild Tenuto)
- **Fertig, wenn:** Ein vollständiger Zyklus (zuweisen → bearbeiten → auswerten) funktioniert.

### P4.15 – Klassen-Live-Quiz

- **Ziel:** Gemeinsames Quiz im Unterricht.
- **Abhängig von:** P4.13
- **Umfang:** L
- **Aufgaben:**
  - [ ] Lehrkraft startet Quiz (Beamer-Ansicht im Web), Klasse tritt per Code bei
  - [ ] Realtime-Synchronisation, Rangliste, Auswertung
- **Fertig, wenn:** Test mit 30 gleichzeitigen Geräten läuft stabil.

### P4.16 – Schul-Lizenz

- **Ziel:** Verkauf an Organisationen.
- **Abhängig von:** P4.13
- **Umfang:** M
- **Aufgaben:**
  - [ ] Lizenzmodell (Plätze, Laufzeit), Rechnung oder Stripe Invoicing
  - [ ] Freischaltung der Premium-Funktionen für Lizenznutzer
- **Fertig, wenn:** Eine Pilotschule ist eingerichtet.

## Block E – Zertifikate und Inhalte

### P4.17 – Prüfung der KI-Verordnung

- **Ziel:** Rechtssichere Einordnung vor Schule und Zertifikaten.
- **Abhängig von:** –
- **Umfang:** M
- **Aufgaben:**
  - [ ] Rechtliche Prüfung nach [recht-und-compliance.md](recht-und-compliance.md)
  - [ ] Ggf. Maßnahmen umsetzen
- **Fertig, wenn:** Schriftliche Einschätzung liegt vor; Maßnahmen sind eingeplant.

### P4.18 – Zertifikate

- **Ziel:** Bezahlte, verifizierbare Abschlussprüfungen je Stufe.
- **Abhängig von:** P3.17, P4.17
- **Umfang:** L
- **Aufgaben:**
  - [ ] Prüfungsinhalte je Stufe (fest, fachlich freigegeben), Bestehensregeln
  - [ ] Option: externes Fachgutachten der Prüfungsinhalte ([ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md))
  - [ ] Bezahlung (In-App-Kauf bzw. Web), Wiederholungsregeln
  - [ ] Zertifikat (PDF und Prüfseite mit Code)
- **Fertig, wenn:** Zertifikate für Stufe 1–2 sind verfügbar.

### P4.19 – Stufe 5 (DE + EN)

- **Ziel:** Hochschulniveau: Kontrapunkt, Formenlehre, Werkanalyse, Musik des 20. und 21. Jahrhunderts.
- **Abhängig von:** P4.09
- **Umfang:** XL
- **Aufgaben und Abnahme:** wie P2.07. Zusätzlich Engine-Module `counterpoint` (Grundlagen) und Analyse-Übungen.

---

**Phase 4 abgeschlossen, wenn:**

- [ ] P4.01–P4.19 fertig
- [ ] Marktplatz mit ersten Coaches live
- [ ] Mindestens eine Pilotschule
- [ ] Rückblick durchgeführt
