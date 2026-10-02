# Phase 0 – Konzept abschließen

**Ziel:** Alle Grundsatzentscheidungen sind getroffen, die Konten stehen, die Design-Richtung ist klar. Danach kann ohne Unterbrechung gebaut werden.

**Bereits erledigt:** Repository, Vision, Feature-Katalog, Lerninhalte, Geschäftsmodell, Marktrecherche, ADR 0001–0003, dieser Plan.

---

### P0.01 – Offene Grundsatzfragen klären

- **Ziel:** Die Fragen F01–F04, F15, F16 und F18 aus [offene-fragen.md](offene-fragen.md) sind entschieden.
- **Abhängig von:** –
- **Umfang:** S
- **Aufgaben:**
  - [ ] Fragen mit Antwortoptionen durchgehen
  - [ ] Entscheidungen in `offene-fragen.md` und den betroffenen Dokumenten eintragen
- **Fertig, wenn:** Keine offene Frage blockiert Phase 1.

### P0.02 – Unternehmen und rechtlicher Rahmen

- **Ziel:** Es ist klar, unter welcher Rechtsform Harmonia veröffentlicht wird und welches Mindestalter gilt.
- **Abhängig von:** –
- **Umfang:** M
- **Aufgaben:**
  - [ ] Beratung zu Rechtsform, Steuern und Mindestalter (siehe [recht-und-compliance.md](recht-und-compliance.md))
  - [ ] Entscheidung F15 (Rechtsform) und F01 (Mindestalter)
  - [ ] Ggf. D-U-N-S-Nummer beantragen (für Apple-Organisationskonto)
- **Fertig, wenn:** Rechtsform und Mindestalter sind dokumentiert.

### P0.03 – Name, Marke, Domain

- **Ziel:** Der Name ist geprüft und gesichert.
- **Abhängig von:** –
- **Umfang:** S
- **Aufgaben:**
  - [ ] Recherche: DPMA, EUIPO, App Store, Google Play, Domains
  - [ ] Bei Konflikt: Liste mit Alternativen und erneute Prüfung
  - [ ] Domain sichern; Markenanmeldung entscheiden
- **Fertig, wenn:** Name entschieden (F16) und Domain registriert.

### P0.04 – Konten und Dienste

- **Ziel:** Alle Dienste für Phase 1 und 2 sind eingerichtet.
- **Abhängig von:** P0.02
- **Umfang:** S
- **Aufgaben:**
  - [ ] Expo-Konto (EAS), Supabase-Organisation (Projekte staging und production in EU-Region)
  - [ ] Apple Developer Program, Google Play Console
  - [ ] Anthropic-API-Konto mit Ausgabenlimit
  - [ ] RevenueCat, Stripe (zunächst Testmodus)
  - [ ] Sentry
  - [ ] Zugangsdaten sicher ablegen (Passwortmanager), Zwei-Faktor-Anmeldung überall
  - [ ] Kostenübersicht anlegen (monatliche Fixkosten, nutzungsabhängige Kosten)
- **Fertig, wenn:** Alle Konten existieren. Phillip ist Eigentümer, Claude erhält Zugriff nur über Secrets, wo nötig.

### P0.05 – Fachkonventionen und Glossar

- **Ziel:** Fachliche Schreibweisen sind festgelegt, bevor Engine und Inhalte entstehen.
- **Abhängig von:** –
- **Umfang:** M
- **Aufgaben:**
  - [ ] Entscheidungen F02 (US/UK-Englisch), F03 (Funktionssymbole), F04 (Akkordsymbole)
  - [ ] Glossar v1 DE ↔ EN mit etwa 150 Kernbegriffen (Noten, Intervalle, Tonleitern, Akkorde, Rhythmus, Harmonik)
  - [ ] Referenzliteratur festlegen, gegen die die Engine geprüft wird
- **Fertig, wenn:** Glossar liegt in `docs/` (später `packages/i18n`) und ist von Phillip freigegeben.

### P0.06 – Arbeitsweise und Tracking

- **Ziel:** Der Ablauf von der Aufgabe bis zum Merge ist eingerichtet.
- **Abhängig von:** –
- **Umfang:** S
- **Aufgaben:**
  - [ ] Entscheidung F18
  - [ ] GitHub-Issues für alle Schritte aus Phase 1 anlegen (ID im Titel), Labels (Phase, Bereich, Größe)
  - [ ] GitHub-Projekt-Board (Spalten: Backlog, In Arbeit, Review, Fertig)
  - [ ] Vorlagen für Pull Requests und Issues
- **Fertig, wenn:** Das Board zeigt Phase 1 vollständig.

### P0.07 – Design-Richtung

- **Ziel:** Look & Feel und die wichtigsten Abläufe sind skizziert.
- **Abhängig von:** P0.03
- **Umfang:** M
- **Aufgaben:**
  - [ ] Moodboard und Designprinzipien (z. B. ruhig, musikalisch, freundlich; Hell- und Dunkelmodus)
  - [ ] Logo-Entwurf, Farbpalette (barrierearm geprüft), Schriften
  - [ ] Wireframes der Kern-Screens:
    - Onboarding
    - Lernpfad
    - Übung (alle Eingabearten)
    - Feedback
    - Lektionsergebnis
    - Profil und Einstellungen
    - Paywall
    - Tutor-Chat
  - [ ] Klickbarer Prototyp für die Lektion (optional)
- **Fertig, wenn:** Phillip hat Richtung und Wireframes freigegeben.

**Phase 0 abgeschlossen, wenn:** P0.01–P0.07 fertig sind.
