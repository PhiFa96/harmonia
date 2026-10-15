# Phase 2 – MVP (erste öffentliche Version)

**Ziel:** Harmonia ist in den Stores und im Web verfügbar. Enthalten sind die Stufen 1–2, ein Einstufungstest, Streaks und XP, der KI-Tutor (Text), Gratis und Premium, alles in Deutsch und Englisch.

**Blöcke:**

- A: Konten und Daten
- B: Inhalte
- C: Lernerlebnis
- D: KI-Tutor
- E: Monetarisierung
- F: Launch

Die Blöcke B, C und D können teilweise parallel laufen.

---

## Block A – Konten und Daten

### P2.01 – Anmeldung und Konto

- **Ziel:** Sichere Konten auf allen Plattformen, Fortschritt geräteübergreifend.
- **Abhängig von:** P1.04, F10
- **Umfang:** L
- **Aufgaben:**
  - [ ] Supabase Auth: E-Mail (Magic Link oder Passwort), „Mit Apple anmelden“, Google
  - [ ] Gastmodus (falls F10 = ja): lokaler Fortschritt, späteres Verknüpfen mit einem Konto ohne Datenverlust
  - [ ] Altersbestätigung (ab 16, F01) im Onboarding
  - [ ] Konto löschen in der App (vollständige Löschung aller Daten, auch bei RevenueCat und Analytics)
  - [ ] Datenexport (JSON) auf Anfrage
- **Fertig, wenn:**
  - Anmeldung funktioniert auf allen Plattformen.
  - Die Löschung entfernt nachweislich alle Daten.
  - Die Apple-Richtlinien 4.8 und 5.1.1(v) sind erfüllt.
- **Tests:** E2E Anmeldung (Web), pgTAP für Löschkaskade.

- **Vorarbeit 13.10.2026:** P2.09 zieht die E-Mail-Code-Anmeldung vor; lokaler Gaststart, Bestätigung, Sitzung und Abmeldung sind implementiert. Apple/Google, Kontolöschung, Export und geräteübergreifende Daten bleiben offen. [Onboarding](onboarding.md).

### P2.02 – Profil und Einstellungen

- **Ziel:** Nutzer steuern Sprache, Benennung und Lernziele.
- **Abhängig von:** P2.01
- **Umfang:** M
- **Aufgaben:**
  - [ ] Einstellungen:
    - App-Sprache
    - Tonnamen (deutsch/international)
    - Harmonik-System (Funktionen/Stufen/beides)
    - Englische Terminologie (US/UK)
    - Tagesziel
    - Erinnerungszeit
    - Ton und Haptik
    - Kammerton
  - [ ] Profil: Anzeigename, Statistik (Streak, XP, Lektionen)
  - [ ] Rechtliches: Impressum, Datenschutz, AGB, Credits, Lizenzen
- **Fertig, wenn:** Alle Einstellungen wirken sofort und bleiben nach Neustart und auf anderen Geräten erhalten.

### P2.03 – Fortschritt speichern und synchronisieren

- **Ziel:** Offline lernen, später ohne Verlust synchronisieren.
- **Abhängig von:** P2.01, P1.20
- **Umfang:** L
- **Aufgaben:**
  - [ ] Migrationen für `lesson_attempts`, `item_attempts`, `skill_progress`, `xp_ledger`, `streaks` mit RLS
  - [ ] Lokale Warteschlange (SQLite) mit Client-IDs
  - [ ] Edge Function `sync` nach dem Ablauf in [datenmodell.md](datenmodell.md); XP und Streak serverseitig
  - [ ] Verhalten bei Konflikten und Zeitzonen
- **Fertig, wenn:** 50 Lektionen offline, dann Netz an → alles korrekt synchronisiert, keine Duplikate.
- **Tests:** Edge-Function-Tests (Duplikate, Zeitzonen, Manipulationsversuche), pgTAP für RLS.
- **Vorarbeit P1.20:** lokale SQLite-Versuche mit Client-ID, Inhaltsversion und vollständigen Antwort-/Wiederholungssnapshots existieren. Übernahme in Konten, Migrationen und Sync-Warteschlange ergänzen; Duplikatschutz erhalten. SQLite-Web-Header mit Auth-Rückleitungen prüfen.

## Block B – Inhalte

### P2.04 – Inhalts-Pipeline

- **Ziel:** Inhalte als geprüfte Daten mit Versionierung und Auslieferung.
- **Abhängig von:** P1.19
- **Umfang:** M
- **Aufgaben:**
  - [x] Schemas (zod) für Bereich, Stufe, Einheit, Lektion, Übungssatz, Wissenskarte, Wissensartikel
  - [x] Prüfskript in der CI:
    - beide Sprachen vorhanden
    - Notenbeispiele gültig (Engine)
    - IDs eindeutig
    - Fähigkeitsgraph ohne Zyklen
  - [x] Freigabestatus (`entwurf`, `in_pruefung`, `freigegeben`); Produktions-Bundle enthält nur freigegebene Katalogdaten und Inhaltsübersetzungen
  - [ ] `contentVersion` und Auslieferung per EAS Update — Versionen, SDK, Projekt-ID-Konfiguration und Kanäle vorbereitet; echte Projektbindung und OTA-Nachweis fehlen
- **Fertig, wenn:** Eine fehlerhafte Inhaltsdatei lässt die CI fehlschlagen; eine Inhaltsänderung erreicht die App ohne Store-Release.
- **Stand 05.10.2026:** P1.20 in den allgemeinen Katalog überführt, IDs/Versionen und zehn Aufgaben erhalten. Interne Vorschau und öffentliche Auslieferung sind getrennt; aktuelle Inhalte bleiben Entwurf bis zur getrennten fachlichen Abnahme. Lokale Prüfungen und offene EAS-Übergabe: [inhalts-pipeline.md](inhalts-pipeline.md). P2.04 bleibt bis zum tatsächlichen OTA-Nachweis offen.

### P2.05 – Fähigkeitsgraph Stufen 1–2

- **Ziel:** Alle Fähigkeiten der Stufen 1–2 mit Voraussetzungen.
- **Abhängig von:** P2.04, P0.05
- **Umfang:** M
- **Aufgaben:**
  - [x] Fähigkeiten für Notation, Rhythmus, Intervalle, Tonleitern und Tonarten, Dreiklänge, Gehörbildung Grundlagen, Musikgeschichte Überblick als Entwurf im Katalog
  - [x] Voraussetzungen und technisch geprüfte Reihenfolge der Einheiten
  - [x] Erzeugte Visualisierung des Graphen (für die Planung, nicht in der App), in CI gegen den Datenstand geprüft
- **Fertig, wenn:** Der Graph ist fachlich geprüft ([ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md)).
- **Stand 05.10.2026:** 90 Fähigkeiten, 29 Einheiten, 40 Ziele in Stufe 1 und 50 in Stufe 2. Alle neuen Datensätze bleiben Entwurf; Claudes separate fachliche Abnahme ist offen. Zuordnung, Datenmodell, Diagramme und Folgearbeit: [faehigkeitsgraph.md](faehigkeitsgraph.md). P2.05 ist noch nicht fachlich abgeschlossen.

### P2.06 – Übungstypen für das MVP

- **Ziel:** Alle Übungstypen für die Stufen 1–2.
- **Abhängig von:** P1.19
- **Umfang:** XL
- **Aufgaben:**
  - [ ] `NOTE_PLACE`, `KEY_FIND`, `INTERVAL_BUILD`
  - [ ] `SCALE_BUILD`, `SCALE_IDENTIFY`, `KEYSIG_IDENTIFY`, `KEYSIG_BUILD`
  - [ ] `CHORD_IDENTIFY`, `CHORD_BUILD`
  - [ ] `RHYTHM_TAP` (Timing-Auswertung mit Toleranzfenster), `METER_IDENTIFY`
  - [ ] `KNOWLEDGE_MC`, `MATCH`, `ORDER`
  - [ ] Je Typ: Parameter, Hinweise, Erklärtexte DE/EN, Barrierefreiheit
- **Fertig, wenn:** Jeder Typ besteht Generator- und Bewertungstests und ist auf allen Plattformen bedienbar.
- **Stand 08.10.2026:** Alle 14 zusätzlichen Typen technisch umgesetzt: `NOTE_PLACE`, `KEY_FIND`, `INTERVAL_BUILD`, `SCALE_BUILD`, `SCALE_IDENTIFY`, `KEYSIG_IDENTIFY`, `KEYSIG_BUILD`, `CHORD_IDENTIFY`, `CHORD_BUILD`, `RHYTHM_TAP`, `METER_IDENTIFY`, `KNOWLEDGE_MC`, `MATCH` und `ORDER`. Mit den drei bisherigen Typen gibt es 17 Typen und sechs freie Sätze mit sechs, neun beziehungsweise zwölf Aufgaben. Freie Schreib-/Tasten-/Timing-/Zuordnungs-/Reihenfolgeeingaben, Hinweise, DE/US/UK-Texte und neue Fehlerwiederholungen sind vorhanden. Akkorde umfassen die vier Dreiklangarten in allen Umkehrungen; Hörfragen geben einen klingenden Grundtonbezug. Rhythmusaufgaben bewerten Notenanfänge nach einem Einzähltakt auf der Audio-Uhr; Taktaufgaben fragen die Gliederung der sichtbaren Taktangabe ab. Wissensaufgaben verwenden 45 Grundlagenbegriffe, Reihenfolgen tatsächliche Dauern oder Tonhöhen. Prüfstand und Folgearbeit: [Tonhöheneingaben](tonhoeheneingabe.md), [Tonleitern und Vorzeichnungen](tonleitern-und-vorzeichnungen.md), [Akkordübungen](akkorduebungen.md), [Rhythmus und Takt](rhythmus-und-takt.md) und [Wissensaufgaben](wissensaufgaben.md). Claudes fachliche Abnahme und echte Gerätetests bleiben offen; P2.06 ist nicht abgeschlossen. Die erste interne Lektion und die Kursfreigaben bleiben unverändert; vollständige Lektionen und Bestehens-/Freischaltlogik folgen.

### P2.07 – Inhalte Stufe 1 (DE + EN)

- **Ziel:** Vollständige Stufe 1.
- **Abhängig von:** P2.05, P2.06
- **Umfang:** XL
- **Aufgaben:**
  - [x] Einheiten und Lektionen nach Graph
  - [x] Wissenskarten mit Notenbild und Klang
  - [ ] Entwürfe durch Claude, getrennter Prüfdurchgang durch Claude, Status `freigegeben`
  - [x] Wissensartikel für die Tutor-Wissensbasis zu allen Themen der Stufe
- **Fertig, wenn:** Stufe 1 ist durchspielbar, fachlich freigegeben und in beiden Sprachen vollständig.
- **Stand 12.10.2026:** Alle 13 geplanten Stufe-1-Einheiten einschließlich Prototyp und alle 40 Fähigkeiten sind intern durchspielbar: 37 Lektionen mit 370 Aufgaben, 106 Karten mit 157 Beispielen, 13 Artikel in DE/US/UK. Die vier letzten Einheiten ergänzen Puls-/Rhythmushören, Tonrichtung/Melodievergleich/erste Hörintervalle sowie Klangquellen, Quellenkritik und die grobe europäische Epochenfolge. 18 Übungstypen, Inhaltsversion 11. Technische Umsetzung vollständig; alle Inhalte bleiben `entwurf`. Die getrennte Claude-Abnahme nach ADR 0005 samt Literaturabgleich ist mangels Claude-Ausführung und zugänglicher Literatur in dieser Umgebung offen. **P2.07 ist deshalb noch nicht fachlich abgeschlossen.** Prüfstand und vollständige Abnahmeunterlagen: [stufe-1-vollstaendig.md](stufe-1-vollstaendig.md).

### P2.08 – Inhalte Stufe 2 (DE + EN)

- **Ziel:** Vollständige Stufe 2.
- **Abhängig von:** P2.07
- **Umfang:** XL
- **Aufgaben und Abnahme:** wie P2.07.
- **Stand 13.10.2026:** Alle 16 geplanten Stufe-2-Einheiten und alle 50 Fähigkeiten sind intern umgesetzt: 48 Lektionen mit 480 Aufgaben, 144 Wissenskarten mit 150 eigenen Beispielen und 16 Artikel in DE/US/UK. Version 13 ergänzt die 15 restlichen Einheiten, die erste Einheit bleibt Version 12. Insgesamt 85 Lektionen und 850 Aufgaben; 19 Übungstypen. Lektionen, Karten, Artikel und technische Prüfungen sind vollständig; alle Datensätze bleiben `entwurf`. **P2.08 bleibt bis zu Claudes getrenntem fachlichem Durchgang und Literaturabgleich fachlich offen.** Vollständiger Prüfstand, Quellen und Übergabe: [stufe-2-vollstaendig.md](stufe-2-vollstaendig.md).

## Block C – Lernerlebnis

### P2.09 – Onboarding

- **Ziel:** In unter zwei Minuten vom ersten Start zur ersten Aufgabe.
- **Abhängig von:** P2.02
- **Umfang:** M
- **Aufgaben:**
  - [x] Ablauf:
    1. Sprache
    2. Ziel (z. B. Hobby, Schule, Aufnahmeprüfung)
    3. Selbsteinschätzung
    4. Angebot Einstufungstest
    5. Tagesziel
    6. Erinnerungen (Einwilligung)
    7. Konto oder Gast
  - [x] Audio-Start (Web: Tippen zum Starten)
  - [x] Erste Mini-Aufgabe vor der Kontoerstellung
- **Fertig, wenn:** Testpersonen erreichen die erste Aufgabe ohne Hilfe; Dauer gemessen.

- **Stand 13.10.2026:** Ablauf vollständig technisch implementiert, als acht Ansichten mit eingeschobener Mini-Aufgabe. Lokale wiederaufnehmbare Speicherung, DE/US/UK, Gaststart und ausdrücklich vorgezogene E-Mail-Code-Anmeldung einschließlich Bestätigung/Sitzung/Abmeldung. Einstufung und Erinnerungszustellung bleiben P2.10/P2.14; gespeichert werden Wunsch und Einwilligung. App-/Browser-/echte lokale Auth-Prüfungen sind bestanden. Der Durchgang mit echten Testpersonen ohne Hilfe, native Geräte und produktive Projekt-/SMTP-Bindung bleiben offen; **P2.09 hat noch keine vollständige Usability-/Launch-Abnahme.** Übergabe und Zeiten: [onboarding.md](onboarding.md).

### P2.10 – Einstufungstest

- **Ziel:** Fortgeschrittene starten nicht bei null.
- **Abhängig von:** P2.06, P2.05
- **Umfang:** M
- **Aufgaben:**
  - [x] Adaptiver Ablauf nach [inhalte-und-didaktik.md](inhalte-und-didaktik.md)
  - [x] Ergebnis-Screen: Startpunkt und Niveau je Bereich
  - [x] Jederzeit wiederholbar
- **Fertig, wenn:** Simulierte Profile (Anfänger, Mittel, Fortgeschritten) landen an plausiblen Stellen.

- **Stand 13.10.2026:** Technisch vollständig implementiert: sieben Bereiche, 15–25 adaptive Aufgaben, Engine-Bewertung, Startpunkte mit Voraussetzungen, freiwillig zugängliche getestete Einheiten, Hinweise/Hör-Pause, frühes Ende, Wiederholung und lokale Wiederaufnahme. Profilsimulationen bestanden. Produktionsfilter bleiben wirksam; Kursaufgaben bleiben Entwurf bis zur Claude-Abnahme. Echte Geräte-/Lernendenabnahme offen. Verfahren und Prüfstand: [Einstufungstest](einstufungstest.md), [ADR 0010](../decisions/0010-einstufung-mit-getrennter-evidenz.md). Nächster Schritt: P2.11 Lernpfad.

### P2.11 – Lernpfad

- **Ziel:** Übersicht über Stufen, Einheiten und Fortschritt.
- **Abhängig von:** P2.03, P2.05
- **Umfang:** L
- **Aufgaben:**
  - [x] Pfad mit Einheiten, Lektionen, Status (gesperrt, offen, abgeschlossen, getestet)
  - [x] Freischalten nach Graph; Wiederholen jederzeit
  - [x] Bereichswechsel (z. B. Gehörbildung, Theorie, Geschichte)
- **Fertig, wenn:** Der Pfad spiegelt den Fortschritt korrekt nach Sync und auf allen Geräten.

- **Stand 13.10.2026:** Technisch umgesetzt: Einheiten-/Lektionsstatus, Graphvoraussetzungen, Bereichs-/Stufenwechsel, freiwillige Wiederholung und gesicherte direkte Zugänge. F11 (80 % im Erstversuch) ist entschieden und vorgezogen. Additive SQLite-Nachweise und die Engine-geprüfte Kontosynchronisation bilden den notwendigen Teil aus P2.03 ab; Offline-Warteschlange und Kontowechsel bleiben getrennt. Produktionsfilter und fachliche Freigabe bleiben wirksam. Details und Prüfnachweise: [Lernpfad](lernpfad.md), [ADR 0011](../decisions/0011-lernfortschritt-aus-geprueften-versuchen.md). Nächster Schritt: P2.12 Lektionsablauf.

### P2.12 – Lektionsablauf

- **Ziel:** Fertiger Ablauf nach [inhalte-und-didaktik.md](inhalte-und-didaktik.md).
- **Abhängig von:** P2.11, P1.20
- **Umfang:** M
- **Aufgaben:**
  - [x] Mischung aus neuem Stoff und Wiederholung
  - [x] Falsche Aufgaben am Ende in neuer Variante
  - [x] Bestehensschwelle (F11, in P2.11 umgesetzt)
  - [x] Ergebnis-Screen mit XP, Genauigkeit, Streak
  - [x] Abbrechen und Fortsetzen
- **Fertig, wenn:** Alle Fälle (bestanden, nicht bestanden, abgebrochen, offline) funktionieren.
- **Vorarbeit P1.20:** Einführung, Aufgaben, neue Varianten für Fehler, getrennte Rundenergebnisse und lokale Speicherung wiederverwenden. Die Bestehensregel wurde in P2.11 umgesetzt; P2.12 ergänzt XP-/Serienergebnis und Abbrechen/Fortsetzen. Erstversuch, Hinweise und ausgelassene Hörfragen in Statistik und Bewertung getrennt halten.

- **Stand 13.10.2026:** Technisch umgesetzt: versionierte Voraussetzungsmischung, Fehlerwiederholung, 80-%-Erstversuchsregel, XP-/Genauigkeits-/Serienergebnis, lokale Wiederaufnahme und ausdrückliches Verwerfen. Engine-geprüfte XP-Buchungen und lokale Tageszählung ziehen die notwendige Grundlage aus P2.14 vor; Konfiguration, Schutz/Reisen, Tagesziel und Erinnerungen bleiben dort. Details und Prüfvertrag: [Lektionsablauf](lektionsablauf.md), [ADR 0012](../decisions/0012-lektionsablauf-mit-wiederaufnahme-und-xp.md). Nächster Schritt P2.13.

### P2.13 – Feedback, Erklärungen, „Fehler melden“

- **Ziel:** Jede Antwort erklärt sich; Inhaltsfehler können gemeldet werden.
- **Abhängig von:** P2.12
- **Umfang:** M
- **Aufgaben:**
  - [x] Feedback mit Erklärtext aus der Engine, Notenbild der Lösung, Hörbeispiel
  - [x] Hinweisleiter (feste Hinweise; ergänzende KI-Hinweise seit P2.17)
  - [x] „Fehler melden“ → `content_reports`
- **Fertig, wenn:** Jeder Übungstyp liefert verständliches Feedback in beiden Sprachen.

- **Stand 13.10.2026:** Technisch umgesetzt: Engine-Feedback und feste Hinweisleiter für alle 19 Typen in DE/US/UK, passende ergänzende Lösungsnotation/Quellenklänge und Inhaltsmeldungen mit Kontext. Gastmeldungen bleiben gemäß Nutzerentscheidung lokal und werden bei Anmeldung gesendet; Kontoübertragung, Wiederholung und RLS sind getrennt vom Lernstand. Übergabe: [Feedback und Inhaltsmeldungen](feedback-und-inhaltsmeldungen.md), [ADR 0013](../decisions/0013-inhaltsmeldungen-mit-gastwarteschlange.md). Nächster Schritt P2.14.

### P2.14 – Streaks, XP, Tagesziel, Erinnerungen

- **Ziel:** Motivationsgrundlage nach [motivation-und-social.md](motivation-und-social.md).
- **Abhängig von:** P2.03
- **Umfang:** M
- **Aufgaben:**
  - [x] XP-Regeln serverseitig konfigurierbar
  - [x] Streak mit Zeitzonenlogik und Streak-Schutz (F07 beachten)
  - [x] Tagesziel-Anzeige
  - [x] Push-Erinnerungen (`expo-notifications`, Token-Verwaltung, Zeitplanung, Opt-in)
- **Fertig, wenn:** Streak-Randfälle (Mitternacht, Zeitzonenwechsel, Offline-Tage, Streak-Schutz) sind getestet.

- **Stand 14.10.2026:** Technisch umgesetzt: versionierte serverseitige XP-/Münzregeln, reisegerechte Serie, kostenloser und gekaufter Schutz gemäß F07, Tagesziel und Erinnerungen mit Opt-in, lokaler Planung, Tokens, Leases, Tickets/Receipts und vorbereitetem Scheduler. Mitternacht, DST, Reisen, Offline-Tage, Käufe und Konten sind getestet. Echte iOS-/Android-Zustellung und Remote-Projekt-/Cron-Bereitstellung bleiben getrennt abzunehmen. Übergabe: [P2.14](streaks-xp-tagesziel-erinnerungen.md), [ADR 0014](../decisions/0014-motivation-mit-muenzen-und-erinnerungen.md). Nächster Schritt P2.15.

## Block D – KI-Tutor

### P2.15 – Tutor-Backend

- **Ziel:** Edge Function für den Tutor nach [ki-tutor.md](ki-tutor.md).
- **Abhängig von:** P2.01, P1.10
- **Umfang:** L
- **Aufgaben:**
  - [x] Edge Function `tutor` mit Anthropic-SDK, Streaming (Server-Sent Events)
  - [x] Werkzeuge der Phase 2 als Engine-Aufrufe (strenge Schemas)
  - [x] Systemprompt (Pädagogik-Regeln, Glossar, Sprache) mit Prompt-Caching
  - [x] Abo- und Kontingentprüfung, Ratenbegrenzung
  - [x] Protokoll in `ai_usage` (Tokens, Cache-Treffer, Kosten)
  - [x] Behandlung von Ablehnungen und Fehlern
- **Fertig, wenn:** Der Tutor beantwortet Testfragen mit korrekten Werkzeugaufrufen; Kosten pro Antwort sind gemessen.
- **Tests:** Deno-Tests mit Attrappe der API; Integrationstest gegen die echte API (manuell ausgelöst).

- **Stand 14.10.2026:** Technische Aufgaben umgesetzt und lokal geprüft: SDK-SSE, acht strenge Werkzeuge, Prompt-/Glossarcache, serverseitige Abo-/Quota-/Budgetprüfung, Verlauf mit Löschung und Kostenprotokoll. 206 Deno-Tutorprüfungen, 122 lokale API-Prüfungen je interner/öffentlicher Auslieferung und 181 pgTAP-Prüfungen insgesamt bestehen. **Live-Definition-of-Done noch offen:** sichere Anthropic-Schlüsselbindung, offiziell geprüftes aktuelles Modell und Tarif sowie echte Antworten/Kosten pro Antwort fehlen. Policy bleibt standardmäßig deaktiviert; Testtarife sind ausschließlich simuliert. Übergabe: [P2.15](tutor-backend.md), [ADR 0015](../decisions/0015-tutor-backend-und-kostenreservierung.md). Nächster technischer Schritt P2.16.

### P2.16 – Wissensbasis v1

- **Ziel:** Quellenbasierte Antworten zu Stufe 1–2.
- **Abhängig von:** P2.07, P2.15
- **Umfang:** M
- **Aufgaben:**
  - [x] Artikel in Abschnitte teilen, `knowledge_chunks` mit Volltextindex (DE, EN)
  - [x] Spike: Abschnitte vorab einbinden oder als Werkzeug – Entscheidung dokumentieren
  - [x] Zitate in der Antwort → Links auf Artikel in der App
- **Fertig, wenn:** Fragen zu Stufe-1–2-Themen werden mit passenden Quellen beantwortet.

- **Stand 14.10.2026:** Technische Aufgaben umgesetzt: 714 interne Abschnitte in DE/US/UK, getrennte RLS-geschützte Auslieferungen, atomarer Snapshot-Abgleich, PostgreSQL-Volltextsuche, vorab eingebundene native Dokumente, exakt geprüfte Zitate mit Links und verifizierte Artikelroute. 87/87 feste Themenfragen finden passende Artikel, 755 Wissensbasis-/SDK-Prüfungen, 244 interne und 214 öffentliche lokale API-Prüfungen bestehen. **Fachliche/Live-Definition-of-Done offen:** Alle 29 Artikel warten auf Claude nach ADR 0005; öffentliche Quellen sind daher leer. Ohne sichere Schlüssel-/Modell-/Tarifbindung wurden keine echten KI-Antworten oder deren Kosten gemessen. Übergabe: [P2.16](wissensbasis.md), [ADR 0016](../decisions/0016-wissensbasis-vorab-und-native-zitate.md). Nächster technischer Schritt P2.17.

### P2.17 – Tutor-Oberfläche

- **Ziel:** Chat und „Warum?“ in der App.
- **Abhängig von:** P2.15
- **Umfang:** M
- **Aufgaben:**
  - [x] Chat-Screen mit gestreamter Antwort, Quellen, Notenbeispielen (rendern und abspielen)
  - [x] „Warum?“ nach einer Aufgabe mit Kontext; KI-Hinweise in der Hinweisleiter
  - [x] KI-Kennzeichnung (Art. 50), Hinweis auf mögliche Fehler, Melde-Knopf pro Antwort
  - [x] Verlauf ansehen und löschen
  - [x] Kontingent-Anzeige und Hinweis auf Premium
- **Fertig, wenn:** Ein Nutzer kann nach einer falschen Antwort nachfragen und erhält eine korrekte, verständliche Erklärung mit Beispiel.

- **Stand 14.10.2026:** Technische Aufgaben umgesetzt in DE/US/UK: eigener Tutor-Tab, nativer/Web-SSE-Transport, Originalaufgabe/Erstantwort, KI-Hinweise ohne zusätzliche Bewertung, geprüfte Beispiele und Quellen, private Sitzungsdaten, eigener Verlauf mit Pagination/Löschung, Antwortmeldungen und Serverkontingent. **Echte Definition-of-Done offen:** Lokale API-/Browserabnahme verwendet ausschließlich ein sichtbar simuliertes Modell. Sichere Anthropic-Bindung, echte fachliche Erklärungen und native Geräteabnahme fehlen weiterhin. Übergabe: [P2.17](tutor-oberflaeche.md), [ADR 0017](../decisions/0017-tutor-oberflaeche-und-private-sitzung.md). Nächster technischer Schritt P2.18.

### P2.18 – Tutor-Testkatalog und Kalibrierung

- **Ziel:** Messbare Tutor-Qualität vor dem Launch.
- **Abhängig von:** P2.16, P2.17
- **Umfang:** L
- **Aufgaben:**
  - [x] Katalog mit mindestens 200 Fragen (DE/EN): 245 Fälle in DE/US/UK als Entwurf, 735 Sprachfassungen
  - [ ] Getrennter fachlicher Durchgang und Freigabe des Katalogs durch Claude nach ADR 0005
  - [x] Bewertungsskript (Kriterien aus [ki-tutor.md](ki-tutor.md)), wiederaufnehmbarer Lauf über die SDK-Batch-Schnittstelle
  - [x] Kalibrierungsverfahren für Prompt, Effort-Stufe, Modellwahl je Rolle und Kosten mit geprüftem Variantenvergleich
  - [ ] Echte Modellkalibrierung und Kostenmessung mit sicherer Schlüssel-/Modell-/Stream-/Batchtarifbindung
  - [x] Vorschlagsrechner für Kontingente je Abo-Stufe aus akzeptierten Kosten und separatem Geschäftsbudget
  - [ ] Produktive Kontingente nach tatsächlicher Streaming-/Cache- und Geschäftsabnahme festlegen
- **Fertig, wenn:** Die fachliche Korrektheit liegt im Testkatalog bei mindestens 98 % (Zielwert, von Phillip bestätigt); die Kontingente sind festgelegt.

- **Stand 14.10.2026:** Technisches Prüfsystem umgesetzt: versionierter Katalog, tatsächlicher Tutor-Werkzeugdialog über asynchrone SDK-Batchwellen, explizite Wiederaufnahme/Kostenobergrenze, feste vollständige Nenner, getrennte fachliche Urteile, Rollen-/Sprachschwellen, Regression und konditionale Kosten-/Kontingentvorschläge. **Definition-of-Done offen:** Alle Fälle/Quellen bleiben Entwurf; 1470 Dialoge sind ausschließlich simuliert, kein echtes Modell oder Tarif ist kalibriert. Ohne Claudes getrennte Freigabe und sichere Live-Bindung gibt es keine gemessene 98-%-Quote oder Launch-Kontingente. Übergabe: [P2.18](tutor-testkatalog.md), [ADR 0018](../decisions/0018-tutor-testkatalog-und-batch-kalibrierung.md). Nächster technischer Schritt P2.19.

## Block E – Monetarisierung

### P2.19 – Abos mit RevenueCat

- **Ziel:** Premium kaufen, wiederherstellen und kündigen auf allen Plattformen.
- **Abhängig von:** P2.01, F08
- **Umfang:** L
- **Aufgaben:**
  - [ ] Produkte in App Store Connect, Google Play, RevenueCat (inkl. Web Billing)
  - [x] SDK-Einbindung, User-ID = Supabase-ID (native und Web; echte Geräteabnahme offen)
  - [x] Authentifizierter Webhook → `billing_events` → aktuelle serverseitige `entitlements`-Projektion; lokale Anbieterantworten simuliert
  - [x] Käufe wiederherstellen; Abo-Verwaltung verlinken (technisch; echte Sandbox offen)
  - [ ] Apple Small Business Program beantragen
- **Stand 14.10.2026:** Technische Anbindung umgesetzt; Phillip entscheidet Monats-/Jahresabos vorzubereiten, Preise später. Kein echtes Anbieterprojekt oder Produkt wurde angelegt; keine Zahlung ausgelöst. Unternehmens-/Store-/RevenueCat-Bindung, Small-Business-Antrag und tatsächliche Sandbox-Käufe/Abnahme bleiben offen. Übergabe: [P2.19](abos-revenuecat.md), [ADR 0019](../decisions/0019-revenuecat-abos-und-berechtigungen.md). Nächster technischer Schritt P2.20.
- **Fertig, wenn:** Sandbox-Kauf auf iOS, Android und Web schaltet Premium frei; Kündigung und Ablauf werden korrekt übernommen. **Noch nicht erfüllt.**

### P2.20 – Paywall und Gratis-Limits

- **Ziel:** Klare Angebote, faire Limits.
- **Abhängig von:** P2.19, F06, F09
- **Umfang:** M
- **Aufgaben:**
  - [x] Paywall DE/US/UK mit Vergleichsansicht, Store-Preisen und gesperrtem Checkout bis zur geprüften Rechtstextbindung
  - [x] Wiederauffüllbare Energie serverseitig konfigurierbar, Anzeige des verbleibenden Vorrats
  - [x] Öffentlicher Web-Kündigungsbutton mit Prüfschritt und dauerhaftem Eingangsbeleg; Anbieterabwicklung/Bestätigungsversand und juristische §312k-Abnahme offen
- **Stand 14.10.2026:** Technisch umgesetzt und lokal geprüft. F06: regenerierende Energie; F09: Werbung später vorbereiten. Checkout bleibt aus; echte Käufe und die vollständige Kündigungs-/Rechtsabnahme sind offen. Übergabe: [P2.20](paywall-und-gratis-limits.md), [ADR 0020](../decisions/0020-lernenergie-paywall-und-kuendigungseingang.md).
- **Fertig, wenn:** Limits greifen korrekt; Paywall erscheint nur an den definierten Stellen. Technische Prüfungen umgesetzt; echte Verkaufs-/Rechtsabnahme noch nicht erfüllt.

## Block F – Launch

### P2.21 – Recht und Datenschutz umsetzen

- **Ziel:** Alle Punkte „Vor Phase 2“ aus [recht-und-compliance.md](recht-und-compliance.md) erledigt.
- **Abhängig von:** P0.02
- **Umfang:** L
- **Aufgaben:**
  - [ ] Rechtstexte DE/EN erstellen lassen und einbinden
  - [ ] AV-Verträge, Verarbeitungsverzeichnis, Löschkonzept (F17), ggf. DSFA
  - [x] Technische Einwilligungsverwaltung (Analytics/Marketing derzeit inaktiv, Push separat); juristische Abnahme offen
  - [ ] Store-Datenschutzangaben, Altersfreigabe
- **Stand 14.10.2026:** Technische Rechtstextbindung, Consent, Export, Kontolöschung, F17-Kürzung, Freigabecheck und Arbeitsunterlagen umgesetzt. Betreiberangaben und juristische/Anbieter-/Storeabnahmen offen; Veröffentlichung und Checkout bleiben gesperrt. [Übergabe P2.21](recht-und-datenschutz.md), [Abnahmepaket](../legal/README.md).
- **Fertig, wenn:** Die Checkliste für Phase 2 ist vollständig abgehakt und juristisch geprüft.

### P2.22 – Analytics und Kennzahlen

- **Ziel:** Wir sehen, ob Harmonia funktioniert – datensparsam.
- **Abhängig von:** P2.21
- **Umfang:** M
- **Aufgaben:**
  - [x] Event-Schema (z. B. `onboarding_completed`, `lesson_completed`, `paywall_viewed`, `purchase_completed`, `tutor_question_asked`)
  - [x] Einbindung nur mit Einwilligung (konkrete Zweckversion, standardmäßig aus)
  - [x] Privates Supabase-Dashboard technisch umgesetzt (echte Beta offen):
    - Aktivierung
    - Bindung (Tag 1 / 7 / 30)
    - Abschlussquote je Lektion
    - Umwandlung zu Premium
    - KI-Kosten
- **Stand 15.10.2026:** Technisch umgesetzt; Supabase/eigenes Dashboard ausdrücklich gewählt. Erfassung und Rechtsfreigabe aus, Kennzahlen mit eigenen lokalen Fixtures geprüft. [Übergabe P2.22](analytics-und-kennzahlen.md), [ADR 0022](../decisions/0022-eigene-consentgebundene-analytics.md).
- **Fertig, wenn:** Dashboard zeigt Daten der Beta. Noch offen: Rechts-/Betriebsfreigabe und echte Beta-Daten.

### P2.23 – Qualitäts-Durchgang

- **Ziel:** Barrierefreiheit, Leistung und Stabilität auf Launch-Niveau.
- **Abhängig von:** Block A–E
- **Umfang:** L
- **Aufgaben:**
  - [ ] Barrierefreiheit nach [qualitaet-und-betrieb.md](qualitaet-und-betrieb.md) (inkl. automatischer Web-Prüfung)
  - [ ] Leistungsbudgets messen und einhalten
  - [ ] E2E-Tests (Playwright, Maestro) für Kernabläufe
  - [ ] Gerätetest-Checkliste auf mindestens 4 Geräten
- **Fertig, wenn:** Alle Budgets eingehalten, keine bekannten kritischen Fehler.

### P2.24 – Store-Auftritt und Website

- **Ziel:** Überzeugende Präsentation in beiden Sprachen.
- **Abhängig von:** P0.07
- **Umfang:** M
- **Aufgaben:**
  - [ ] Store-Texte, Schlüsselwörter, Screenshots, Vorschauvideo (DE/EN)
  - [ ] Website mit Web-App, Impressum, Datenschutz, Support-Kontakt
- **Fertig, wenn:** Store-Einträge vollständig und von Phillip freigegeben.

### P2.25 – Geschlossene Beta

- **Ziel:** Echte Nutzung vor dem Launch.
- **Abhängig von:** P2.01–P2.24
- **Umfang:** L
- **Aufgaben:**
  - [ ] TestFlight, Google Play Internal/Closed Testing, Web-Beta
  - [ ] 30–100 Testpersonen aus verschiedenen Zielgruppen (Einsteiger bis Studierende)
  - [ ] Feedback-Kanal, wöchentliche Auswertung, Fehlerbehebung
  - [ ] Zielwerte für Kennzahlen nach der Beta festlegen
- **Fertig, wenn:** Keine kritischen Fehler offen; Rückmeldungen ausgewertet und eingeplant.

### P2.26 – Launch

- **Ziel:** Öffentliche Veröffentlichung.
- **Abhängig von:** P2.25
- **Umfang:** M
- **Aufgaben:**
  - [ ] Store-Einreichung, gestaffelte Veröffentlichung
  - [ ] Produktions-Supabase, Monitoring, Alarme aktiv
  - [ ] Support-Ablauf, Antwortvorlagen DE/EN
  - [ ] Beobachtung in den ersten 72 Stunden
  - [ ] Rückblick Phase 2, Plan für Phase 3 anpassen
- **Fertig, wenn:** Harmonia ist im App Store, bei Google Play und im Web verfügbar.

---

**Phase 2 abgeschlossen, wenn:**

- [ ] P2.01–P2.26 fertig
- [ ] Stufen 1–2 vollständig in DE und EN
- [ ] Tutor-Testkatalog erfüllt
- [ ] Abos funktionieren auf allen Plattformen
