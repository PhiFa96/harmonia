# Recht und Compliance – Checkliste

> **Keine Rechtsberatung.** Diese Liste sammelt Themen, die wir mit Fachleuten (Anwaltskanzlei, Steuerberatung, Datenschutz) klären müssen. Stand der Angaben: 02.10.2026.

## Vor Phase 2 (vor dem ersten öffentlichen Release)

**Unternehmen und Konten**

- [ ] Rechtsform und Gewerbeanmeldung klären (Einzelunternehmen, UG, GmbH)
- [ ] Apple Developer Program als Organisation (benötigt D-U-N-S-Nummer) oder als Einzelperson
- [ ] Google Play Console, Stripe, RevenueCat, Supabase, Anthropic, Expo – Konten auf das Unternehmen
- [ ] Markenrecherche „Harmonia“ (DPMA, EUIPO, App Stores) und ggf. Markenanmeldung; Domain

**Pflichtangaben und Verträge**

- [ ] Impressum (§ 5 Digitale-Dienste-Gesetz) in App und Web
- [ ] Datenschutzerklärung DE/EN
- [ ] Nutzungsbedingungen (AGB) DE/EN inkl. Abo-Bedingungen
- [ ] Widerrufsbelehrung für digitale Inhalte und Dienste; Zustimmung zum vorzeitigen Beginn
- [ ] Kündigungsbutton (§ 312k BGB) für im Web abgeschlossene Abos
- [ ] Abo-Laufzeiten verbraucherrechtskonform (Gesetz für faire Verbraucherverträge)

**Datenschutz (DSGVO)**

- [ ] Verzeichnis der Verarbeitungstätigkeiten (Art. 30)
- [ ] Verträge zur Auftragsverarbeitung mit allen Dienstleistern (Supabase, Anthropic, RevenueCat, Stripe, Expo, Sentry, Analytics)
- [ ] Drittlandübermittlung prüfen (z. B. Zertifizierung nach EU-US Data Privacy Framework, Standardvertragsklauseln)
- [ ] Datenschutz-Folgenabschätzung (Art. 35) prüfen – wahrscheinlich nötig wegen KI, Profilbildung (Ratings) und möglicher Minderjähriger
- [ ] Löschkonzept und Aufbewahrungsfristen
- [ ] Konto-Löschung in der App (auch Apple-Pflicht, Richtlinie 5.1.1(v)) und Datenexport (Art. 20)
- [ ] Einwilligungen: Analytics, Push, Marketing – getrennt und widerrufbar

**Minderjährige**

- [ ] **Mindestalter ab 16** (vorläufig entschieden am 02.10.2026) rechtlich bestätigen lassen. Hintergrund: Bei einwilligungsbasierter Verarbeitung gilt in Deutschland ab 16 Jahren die eigene Einwilligung, darunter die der Eltern (Art. 8 DSGVO; Deutschland hat die Altersgrenze nicht gesenkt).
- [ ] Geschäftsfähigkeit bei Abos für Minderjährige klären
- [ ] Keine freie Kommunikation zwischen Nutzern (siehe [motivation-und-social.md](motivation-und-social.md))
- [ ] Altersfreigabe-Fragebögen der Stores

**KI-Verordnung (EU AI Act)**

- [ ] **Transparenzpflicht (Art. 50)** gilt seit 02.08.2026: Nutzer klar informieren, dass sie mit einer KI interagieren; KI-generierte Audio- und Bildinhalte kennzeichnen.
- [ ] Einordnung prüfen: Hochrisiko-Bereich Bildung (Anhang III Nr. 3), z. B. KI-Systeme zur Bewertung von Lernergebnissen in Bildungseinrichtungen. Die Pflichten dafür gelten nach der Verschiebung durch den „Digital Omnibus“ ab **02.12.2027**. Unsere Architektur (Bewertung durch deterministische Engine, KI nur erklärend) ist hier hilfreich. Die Einordnung muss trotzdem rechtlich geprüft werden, besonders vor Schul-Lizenzen und Zertifikaten (Phase 4).

**App Stores**

- [ ] Apple 4.8: Wer Google-Login anbietet, braucht zusätzlich eine datensparsame Login-Option (z. B. „Mit Apple anmelden“).
- [ ] Apple 3.1.x und Google-Zahlungsrichtlinien (siehe [business-model.md](../business-model.md))
- [ ] Datenschutzangaben: Apple App Privacy und Google Data Safety

**Urheberrecht und Lizenzen**

- [ ] Liste aller Drittinhalte mit Lizenz (Fonts, Samples, Bibliotheken) und Credits-Screen (z. B. Bravura OFL, Salamander Grand Piano CC BY 3.0). Stand: Bravura-Hinweis steht seit P1.14 im Profil.
- [ ] Nur eigene Texte, Übungen, Notensätze und Aufnahmen; gemeinfreie Werke in eigenem Satz
- [ ] Musikbeispiele aus geschützten Werken nur mit Lizenz

**Steuern**

- [ ] Umsatzsteuer für Web-Verkäufe an Verbraucher in der EU (One-Stop-Shop). Bei In-App-Käufen die Rolle der Stores klären.

## Vor Phase 4 (Marktplatz, Schule, Zertifikate)

**Coach-Marktplatz**

- [ ] Plattform-AGB und Coach-Vertrag: Wer ist Vertragspartner des Schülers? Haftung, Storno, Erstattung
- [ ] P2B-Verordnung (EU 2019/1150): Transparenz gegenüber Coaches als gewerblichen Nutzern (z. B. Ranking-Kriterien, Beschwerdeweg)
- [ ] Verbraucherrecht: Ranking-Transparenz, echte Bewertungen (keine gekauften oder gefälschten)
- [ ] **DAC7 / Plattformen-Steuertransparenzgesetz:** Meldepflicht für Plattformen, die persönliche Dienstleistungen vermitteln. Erhebung von Stammdaten der Coaches (u. a. Steuer-ID) und jährliche Meldung an das BZSt.
- [ ] Umsatzsteuerliche Einordnung der Provision und der Coaching-Leistung
- [ ] Digital Services Act: Meldeverfahren für Inhalte (Profile, Bewertungen), Kontaktstelle; Erleichterungen für Klein- und Kleinstunternehmen prüfen
- [ ] Coaching mit Minderjährigen: nur mit Eltern-Einwilligung oder erst ab 18 (offene Frage); Schutzkonzept für Coaches (z. B. Verhaltenskodex)
- [ ] Calls ohne Aufzeichnung (Google-Bedingung für Abrechnung außerhalb von Play Billing). Auch KI-Zusammenfassungen von Calls vorher prüfen.

**Schule**

- [ ] AVV-Vorlage für Schulen; Anforderungen der Bundesländer an digitale Lernmittel prüfen
- [ ] Einordnung nach KI-Verordnung (siehe oben)

**Zertifikate**

- [ ] Rechtliche Bezeichnung (kein staatlicher Abschluss), Prüfungsbedingungen, Einordnung nach KI-Verordnung

## Vor Phase 5

- [ ] Song-Analyse: Nutzungsbedingungen für hochgeladene Dateien (nur eigene oder berechtigte Inhalte), Verarbeitung, Speicherdauer
- [ ] Creator-Kurse: Rechteeinräumung durch Creators, Prüfprozess, DSA-Pflichten

## Barrierefreiheit

- [ ] Barrierefreiheitsstärkungsgesetz (BFSG) prüfen: Ausnahmen für Kleinstunternehmen bei Dienstleistungen. Unabhängig davon bauen wir barrierearm (siehe [qualitaet-und-betrieb.md](qualitaet-und-betrieb.md)).
