# Phase 4 – V2 (Coaching, Schule, Profi-Features)

**Ziel:**

- Harmonia verbindet KI und Menschen: Coach-Marktplatz mit Provision, KI-Live-Calls.
- Profi-Funktionen für Fortgeschrittene: Tonsatz-Korrektor, Chor-Trainer, Zeitreise.
- Angebote für Schulen und Zertifikate.
- Inhalte bis Stufe 5.

**Voraussetzungen:**

- Alle Punkte „Vor Phase 4“ aus [recht-und-compliance.md](recht-und-compliance.md) sind geklärt.
- Die Nutzerbasis ist groß genug, um Coaches Buchungen zu versprechen.
- Die offenen Phase-3-Abnahmen aus dem [technischen Rückblick](phase-3-rueckblick.md) sind abgeschlossen: Stufen 3–4 fachlich freigegeben und live, echte Geräte-/Realtime-/DB-Tests sowie Tutor-Quellenreview bestanden. P4.06 braucht zusätzlich eine eigene widerrufbare Lernstand-Freigabe; Harmonik-Korrekturen warten auf F03.

**Interne technische Vorarbeit (22.10.2026):** Auf ausdrücklichen Nutzerauftrag entstehen Entwürfe vor der formalen Phase-4-Freigabe. Dazu zählen die gesonderte P4.12-Zeitreise, der P4.11-Chor-Trainer, die P4.09-Satzprüfung und P4.10 sowie jetzt der [P4.19-Stufe-5-Entwurf](stufe-5-entwurf.md). Diese Arbeit hebt keine Start-, Fach- oder Veröffentlichungsvoraussetzung auf. Der Produktions-Build enthält keine P4.12-Entwurfstexte oder Stationen und keine neuen P4.19-Lerntexte/Aufgabenstellungen. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt.

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
- **Technische Vorarbeit vor formaler Phase-4-Freigabe:** [SATB-Musterdetektor mit 16 Regelkennungen, Partituradapter und eigenem Testkorpus](stimmfuehrung-entwurf.md) auf einem Arbeitsbranch, ohne Anbindung an Lern- oder Tutorabläufe. Der Adapter liefert exakte Zeit- und Notenbezüge bei unterschiedlichen Dauern, Haltebögen und Pausen. Der [Primärtextabgleich](../quality/p4-09-quellenentwurf.md) nennt direkt gelesene OMT-Abschnitte und offene SATB-Übertragungen. F05, passende Quellen für Stimmumfänge/Abstände und unabhängige Fachprüfung stehen aus. P4.09 ist nicht abgenommen; die Phase-4-Start- und Veröffentlichungsvoraussetzungen gelten weiter. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.
- **Aufgaben:**
  - [ ] Regeln aus [theorie-engine.md](theorie-engine.md), jede mit Quelle, Schweregrad, Konfiguration
  - [ ] Testkorpus mit eigenen fehlerhaften und fehlerfreien Sätzen (technische Fixture und lokaler DE/EN-Review-Bericht vorhanden; unabhängige Abnahme offen)
- **Fertig, wenn:**
  - Der Korpus wird vollständig korrekt beurteilt.
  - Jede Regel ist mit ihrer Quelle belegt und fachlich geprüft.

### P4.10 – Tonsatz-Korrektor

**Technischer Weiterbau der Einführung (26.10.2026):** Sechs Einführungskarten mit zwei eigenen vierstimmigen Akkordbeispielen, DE/en-US/en-GB-Beschriftungen und Klang. Die interne Satzwerkstatt zeigt vor den Aufgaben dieselbe Einführung wie der reguläre Lernpfad. Allgemeiner Notensatz unterstützt die mehrstimmigen Karten; einfache Lernbilder bleiben geprüft. Karten/Lektionen und Katalog/Fähigkeitsplan Version 23, Übungssätze/Ratingquellen weiter 22. [ADR 0051](../decisions/0051-vierstimmige-einfuehrung-fuer-satzaufgaben.md). Technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**; Inhalte Entwurf, unabhängige Fach-/Geräteabnahmen offen, keine Veröffentlichung. P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt.

- **Ziel:** Sätze schreiben, Fehler sehen, verstehen.
- **Abhängig von:** P4.09
- **Umfang:** L
- **Aufgaben:**
  - [x] Eingabe von vier Stimmen (Klaviersystem, Stimmen-Umschaltung)
  - [x] Aufgaben: Bass oder Sopran gegeben, Rest ergänzen; Funktionen vorgegeben
  - [x] Fehler markieren; Tutor erklärt mit `check_voice_leading`
- **Fertig, wenn:** Übungstyp `VOICE_LEADING` in Stufe 4–5 eingebunden.

**Technisch als interner Entwurf implementiert, keine Produktabnahme:** [Umsetzung, Aufgabenprofil und offene Abnahmen](tonsatz-korrektor-entwurf.md). Auf ausdrücklichen Nutzerauftrag findet technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe** statt. Der grafische Editor, sechs eigene DE/EN-Entwurfslektionen in Stufe 4–5 und das serverseitig gebundene Tutor-Werkzeug sind implementiert. Die Häkchen kennzeichnen ausschließlich diese technische Umsetzung. F03/F05, unabhängige Fachprüfung, reales Tutor-Modell und Geräteabnahmen bleiben offen. Keine Veröffentlichung. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.

**Technischer Aufgaben-Weiterbau (26.10.2026):** Die sechs P4.10-Erstversuche enthalten C-, F- und G-Dur jeweils einmal; Fehlerwiederholungen wechseln kanonisch die Tonart. Übungssätze und Lektionen sind mit Version 22 gegen die alte Aufgabenfassung abgegrenzt. [ADR 0048](../decisions/0048-tonsatz-aufgaben-mit-drei-festen-tonarten.md). Dies ist technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**; Regel-/Fachabnahmen bleiben offen, Inhalte `entwurf`, keine Veröffentlichung. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.

### P4.11 – Chor-Trainer

**Technischer Aufnahme-Weiterbau (26.10.2026), vor formaler Phase-4-Freigabe:** [Datenflussprüfung und offene Geräteabnahme](chor-trainer-entwurf.md) auf eigenem Branch: Begleitung erst nach PCM-Eingang, Abbruch ohne Antwort bei erkannten Datenlücken, vollständige PCM-Abdeckung der Bewertungsfenster, Web-/native Bereinigung und sicher abgewarteter Neustart. Stille bleibt gültiges PCM; musikalische Bestehensregeln und Antwortformat ändern sich nicht. Synthetische Tests ersetzen keine echten Mikrofon-/Kopfhörerprüfungen. Kein Veröffentlichungsangebot. P4.01 bleibt bis F14/Rechtsklärung zurückgestellt.

- **Ziel:** Mehrstimmig singen üben.
- **Abhängig von:** P3.09
- **Umfang:** L
- **Aufgaben:**
  - [x] Chorklang („Ah“) im Sampler
  - [x] Drei Stimmen spielen, eine Stimme singen; Bewertung pro Note
  - [x] Eigene Chorsätze (selbst geschrieben oder gemeinfrei in eigenem Satz)
- **Fertig, wenn:** Übungstyp `CHOIR_PART` funktioniert mit Kopfhörern zuverlässig.

**Technisch als interner Entwurf implementiert, keine Produktabnahme:** [Ablauf, Originalmaterial, Auswertungsprofil und offene Abnahmen](chor-trainer-entwurf.md). Technische P4-Vorarbeit findet auf Nutzerauftrag **vor der formalen Phase-4-Freigabe** statt. Die Häkchen bezeichnen die technische Umsetzung. Unabhängige Fachprüfung und reale Kopfhörer-/Gerätetests bleiben offen; keine Veröffentlichung. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.

### P4.12 – Zeitreise durch die Musikgeschichte

**Technischer Weiterbau des Quiz (26.10.2026):** Flüchtiger Fragezustand mit Hinweis nach Fehler und vollständiger Erklärung nach Korrektur, eigene DE/EN-Transferfragen und Ablenker, wahrheitsgemäße Rollenspiel-Kennzeichnung und britische Schreibweisen. [ADR 0050](../decisions/0050-zeitreise-fragen-mit-hinweisen-und-erklaerungen.md). Technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**; sämtliche neuen Inhalte bleiben Entwurf bis zur unabhängigen Fach-/Sprachprüfung. Keine Veröffentlichung, P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt.

**Technischer Weiterbau der Prüfungen (26.10.2026):** Die gesonderten Stations- und Antworttexte sind in `check:i18n` einbezogen. Metro sperrt tatsächlich aufgelöste interne TS-/JSON-Dateien einschließlich Symlinks; der Bundleguard prüft kurze Entwurfstexte und alle acht Partituren. DE/en-US/en-GB-Browserproben prüfen interne Vorschau und leere öffentliche Deep-Links; die Produktionsprobe ist in CI verankert. [ADR 0049](../decisions/0049-zeitreise-entwuerfe-an-den-buildgrenzen-pruefen.md). Dies bleibt ausdrücklich technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**. Fach-/Quellenprüfung, redaktionelle Nacharbeit und Geräteabnahmen bleiben offen, alle Inhalte `entwurf`, keine Veröffentlichung. P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt.

**Technischer Entwurf:** Vier europäische Stationen mit eigenen Klangmodellen, redaktionell geschriebenen fiktiven Interviews, Wissens- und Hörfrage und präzisem Link auf den versionierten Abschnitt des P2.08-Wissensartikels (Linkmechanismus aus P3.19). Der Ablauf ist intern spielbar; es werden keine XP oder Fortschritte vergeben. Details und offene Freigaben: [Zeitreise P4.12](zeitreise-musikgeschichte.md).

- **Ziel:** Geschichte erleben statt auswendig lernen.
- **Abhängig von:** P3.19
- **Umfang:** L
- **Aufgaben:**
  - [x] Story-Modus als interne Vorschau durch vier Epochen mit eigenen, synthetisch gespielten Klangmodellen
  - [x] Redaktionell geschriebenes fiktives Interview je Station, als erfundenes, vorab geschriebenes Rollenspiel gekennzeichnet, mit Quellenabschnitt
  - [x] Wissensfrage und Hörquiz je Station als Entwurf
  - [ ] Unabhängige Fach- und Quellenprüfung; echte Geräte-/Audioabnahme und Freigabe von mindestens vier Epochen
- **Fertig, wenn:** Mindestens vier Epochen sind fachlich freigegeben.

## Block D – Schule

### P4.13 – Organisationen, Klassen, Lehrer-Dashboard

**Interne technische Vorarbeit auf Nutzerauftrag (23.10.2026), vor der formalen Phase-4-Freigabe:** [Lokaler Schul-Dashboard-Entwurf](schule-dashboard-entwurf.md) mit Organisationen, Rollen, Klassen, befristeten Einladungscodes, Klassen-/Einzelübersichten und widerrufbarer klassenbezogener Freigabe. Echte PostgreSQL-RLS, pgTAP, HTTP- und DE/EN-Browserprüfungen; ausschließlich synthetische Konten und Lerndaten. Die Dashboard-Basis aus P4.01 wird nur für diesen lokalen Entwurf durch eine eigene Werkstatt ersetzt. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt. Keine Veröffentlichung, produktive Authentifizierung oder Schulabnahme. P4.17, AVV/Schulrecht, echte Lernnachweise und Pilotbetrieb bleiben offen; die Produkt-Checkliste bleibt unverändert offen.

- **Ziel:** Lehrkräfte arbeiten mit ihren Klassen.
- **Abhängig von:** P4.01 (Dashboard-Basis)
- **Umfang:** XL
- **Aufgaben:**
  - [ ] Organisationen, Rollen, Klassen, Einladung per Code
  - [ ] Dashboard: Fortschritt der Klasse, Schwächen, Einzelansicht
  - [ ] Datenschutz Schule: Datensparsamkeit, Einwilligungen, AVV-Vorlage
- **Fertig, wenn:** pgTAP-Tests belegen, dass Lehrkräfte nur ihre Klassen sehen.

### P4.14 – Aufgaben zuweisen

**Interne technische Vorarbeit auf Nutzerauftrag (24.10.2026), vor der formalen Phase-4-Freigabe:** [Klassenaufgaben-Entwurf](schulaufgaben-entwurf.md) auf der lokalen P4.13-Werkstatt: Lektionen/Übungsbausteine zusammenstellen, Empfänger und Aufgaben einfrieren, Fälligkeit, geschützter lokaler Link, Bearbeitung/Wiederaufnahme, serverseitige Engine-Bewertung und widerrufbar freigegebene Auswertung in DE/en-US/en-GB. Ausschließlich synthetische Konten; echte PostgreSQL-RLS-, HTTP- und Browserprüfungen. P4.13 ist die technische PR-Abhängigkeit. Quellen bleiben Entwurf bis zur unabhängigen Fachprüfung; keine Veröffentlichung. Die Produkt-Checkliste bleibt bis zu den Fach-, Rechts-, Identitäts- und Pilotabnahmen offen. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt.

- **Ziel:** Hausaufgaben für Klassen.
- **Abhängig von:** P4.13
- **Umfang:** M
- **Aufgaben:**
  - [ ] Aufgaben aus Lektionen und Übungsbausteinen zusammenstellen, Fälligkeit, Auswertung
  - [ ] Teilen per Link (Vorbild Tenuto)
- **Fertig, wenn:** Ein vollständiger Zyklus (zuweisen → bearbeiten → auswerten) funktioniert.

### P4.15 – Klassen-Live-Quiz

**Interne technische Vorarbeit auf Nutzerauftrag (24.10.2026), vor der formalen Phase-4-Freigabe:** [Lokaler Live-Quiz-Entwurf](klassen-live-quiz-entwurf.md) mit Lobbycode, Beameransicht, synchronisierten Runden, serverseitiger Bewertung, freiwilliger Rangliste mit Spielkürzeln und freigabegebundener Endauswertung in DE/en-US/en-GB. Aufbau auf P4.13/P4.14, ausschließlich synthetische Konten und Entwurfsquellen. Ein Lasttest prüft 30 gleichzeitige HTTP-/SSE-Clients; **die verlangte Abnahme mit 30 echten Geräten ist weiterhin offen**. Keine Veröffentlichung oder produktive Authentifizierung. Fachprüfung, P4.17, Schulrecht/AVV und Pilot bleiben offen; die Produkt-Checkliste ist deshalb nicht abgenommen. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.

- **Ziel:** Gemeinsames Quiz im Unterricht.
- **Abhängig von:** P4.13
- **Umfang:** L
- **Aufgaben:**
  - [ ] Lehrkraft startet Quiz (Beamer-Ansicht im Web), Klasse tritt per Code bei
  - [ ] Realtime-Synchronisation, Rangliste, Auswertung
- **Fertig, wenn:** Test mit 30 gleichzeitigen Geräten läuft stabil.

### P4.16 – Schul-Lizenz

**Interne technische Vorarbeit auf Nutzerauftrag (24.10.2026), vor der formalen Phase-4-Freigabe:** [Lokaler Schullizenz-Entwurf](schul-lizenz-entwurf.md) mit Rechnungsproben, simuliertem Zahlungseingang über ein getrenntes synthetisches Betreiberkonto, Platzvergabe, Laufzeiten und widerrufbaren Premium-Übungen in DE/en-US/en-GB. Datenbankzeit, RLS, Sperren und Mitgliedschaftstrigger schützen Freischaltungen. Ausschließlich Testdaten; keine echte Rechnung, Zahlung oder produktive App-Freischaltung. Die Bedingung **„Eine Pilotschule ist eingerichtet“ bleibt offen**, ebenso P4.17, Schulrecht/AVV, Identität, Rechnungs-/Steuerprüfung und Fachabnahmen. Keine Veröffentlichung. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt; die Produkt-Checkliste ist nicht abgenommen.

- **Ziel:** Verkauf an Organisationen.
- **Abhängig von:** P4.13
- **Umfang:** M
- **Aufgaben:**
  - [ ] Lizenzmodell (Plätze, Laufzeit), Rechnung oder Stripe Invoicing
  - [ ] Freischaltung der Premium-Funktionen für Lizenznutzer
- **Fertig, wenn:** Eine Pilotschule ist eingerichtet.

## Block E – Zertifikate und Inhalte

### P4.17 – Prüfung der KI-Verordnung

**Technische Prüfvorbereitung auf Nutzerauftrag (24.10.2026), vor der formalen Phase-4-Freigabe:** [Quellenbezogene Voreinschätzung](../legal/ai-act/vorpruefung.md) und [programmierte Übergabe](ki-verordnung-pruefvorbereitung.md) mit neun Funktionsbereichen, acht Maßnahmenpaketen, DE/EN-Prüfberichten, Code-/Zweckbindung und getrennten Freigabeprüfungen für allgemeines Produkt, Schule und Zertifikate. Aktuelle amtliche Explorer-/Kommissionsquellen bestätigen die Friständerung und benennen insbesondere Lernsteuerung/Profiling als Prüfpunkte. Der direkte konsolidierte EUR-Lex-Abruf und die unabhängige schriftliche Rechtsprüfung bleiben offen. Alle juristischen Häkchen bleiben unerledigt; keine Rechts-, Schul- oder Veröffentlichungsfreigabe. P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt.

- **Ziel:** Rechtssichere Einordnung vor Schule und Zertifikaten.
- **Abhängig von:** –
- **Umfang:** M
- **Aufgaben:**
  - [ ] Rechtliche Prüfung nach [recht-und-compliance.md](recht-und-compliance.md)
  - [ ] Ggf. Maßnahmen umsetzen
- **Fertig, wenn:** Schriftliche Einschätzung liegt vor; Maßnahmen sind eingeplant.

### P4.18 – Zertifikate

**Technischer Entwurf und Weiterbau (25.10.2026), vor der formalen Phase-4-Freigabe:** [Lokale Zertifikatswerkstatt](zertifikate-entwurf.md) mit zwei serverbewerteten Testprofilen, Wiederaufnahme, ungültigen Muster-PDFs, Widerruf und Datenlöschung. Der Weiterbau verbindet die Entwurfsstände #104 und #109: Code-/Inhaltsbindung für Durchgänge und PDFs, eigener Zustand für veraltete Durchgänge, private DE/EN-Prüfmappe mit 72 reproduzierbaren Aufgabenbeispielen und ausdrücklich ausgewiesenen Themenlücken. `check:certificates:release` sperrt zusammen mit den offenen P4.17-Zertifikatsnachweisen. Testgrenze und Engine-Lösungen sind keine fachliche Abnahme. Keine Zahlung, gültige Urkunde, Veröffentlichung oder Integration auf main. Schriftliche Rechtsprüfung, unabhängige Fachprüfung und sämtliche Produkt-Häkchen bleiben offen. P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt.

**Interne technische Vorarbeit auf ausdrücklichen Nutzerauftrag (23.10.2026), vor der formalen Phase-4-Freigabe:** [Lokaler Zertifikats-Prototyp](zertifikate-entwurf.md) mit zwei Testprofilen, servergeprüfter Auswertung, ungültigem Muster-PDF und interner Codeprüfung einschließlich Widerruf. DE/EN, SQLite-Wiederaufnahme und Tests. P4.17, feste fachlich freigegebene Prüfungsinhalte, verbindliche Bestehensregeln und Zahlungsberechtigung bleiben Voraussetzungen eines Produktangebots. Keine Veröffentlichung, keine gültigen Zertifikate. Die folgenden Produkt-Abnahmefelder bleiben offen. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.

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

**Weiterbau der internen technischen Vorarbeit (25.10.2026), vor formaler Phase-4-Freigabe:** Der [Stufe-5-Entwurf](stufe-5-entwurf.md) aus #103 wird auf `codex/p4-19-preview-resume-draft` mit #110 lokal zusammengeführt und um getrennte, quellengebundene Wiederaufnahme erweitert. Ein eigener Vorschau-Durchgang je Konto/Gast, bestätigte SQLite-Speicherung, Konfliktschutz, lokale Siebentagesgrenze, Export und Löschung; ohne dauerhaften Speicher nur RAM. Einführung, Auswahl, Hinweise und Wiederholung bleiben erhalten; keine Lernnachweise, Ratings, XP, Gastübernahme oder Synchronisation. P4.17 inventarisiert Analyse und Vorschau zusätzlich, ohne Einstufungsfreigabe. Keine Integration auf main oder Veröffentlichung. Fach-/Quellen-/Geräteabnahmen und formale P4-Freigabe bleiben offen. P4.01 bleibt bis F14/Rechtsklärung zurückgestellt.

- **Ziel:** Hochschulniveau: Kontrapunkt, Formenlehre, Werkanalyse, Musik des 20. und 21. Jahrhunderts.
- **Abhängig von:** P4.09
- **Umfang:** XL
- **Aufgaben und Abnahme:** wie P2.07. Zusätzlich Engine-Module `counterpoint` (Grundlagen) und Analyse-Übungen.

**Technisch als interner Entwurf implementiert, keine Produktabnahme:** [Umsetzung und offene Abnahmen](stufe-5-entwurf.md), [Quellenentwurf](../quality/p4-19-quellenentwurf.md), [ADR 0038](../decisions/0038-stufe-fuenf-als-begrenzter-analyseentwurf.md). Technische P4-Vorarbeit findet ausdrücklich **vor der formalen Phase-4-Freigabe** statt.

- [x] Begrenzte Kontrapunkt-Engine (erste Gattung, neun Regeln) und zehn quellbasierte Analysethemen mit Tests.
- [x] Acht neue Einheiten, 24 DE/EN-Lektionen, 240 Aufgaben, 32 eigene Karten/Notenbeispiele und acht Artikel als `entwurf`.
- [x] Interner Prüfablauf mit Einführung, Bewertung und veränderter Fehlerwiederholung; keine XP oder gespeicherten Lernereignisse.
- [x] Wissensindex für Stufe 5 und Produktionsausschluss der neuen Entwurfstexte vorbereitet.
- [ ] Unabhängige Fachprüfung, vollständige Quellen-/Didaktikabnahme, reale Geräte-/Audioprüfungen und formale Freigabe.

Die Häkchen kennzeichnen ausschließlich die technische Umsetzung. Keine Veröffentlichung. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.

---

**Phase 4 abgeschlossen, wenn:**

- [ ] P4.01–P4.19 fertig
- [ ] Marktplatz mit ersten Coaches live
- [ ] Mindestens eine Pilotschule
- [ ] Rückblick durchgeführt
