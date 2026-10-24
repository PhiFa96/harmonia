# Recht und Compliance – Checkliste

> **Keine Rechtsberatung.** Diese Liste sammelt Themen, die wir mit Fachleuten (Anwaltskanzlei, Steuerberatung, Datenschutz) klären müssen. Stand der technischen Arbeitsunterlagen: 14.10.2026; aktuelle amtliche Fassungen und juristische Abnahme offen. Siehe [P2.21](recht-und-datenschutz.md) und [Abnahmepaket](../legal/README.md).

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

- [ ] **Transparenz nach Art. 50:** KI-Interaktionshinweis, maschinenlesbare Markierung synthetischer Ausgaben und Offenlegung bestimmter Inhalte je Rolle, Medium und Ausnahmen prüfen. Der allgemeine Geltungsbeginn ist der 02.08.2026; ein UI-Hinweis allein belegt nicht alle Pflichten.
- [ ] **Einordnung Bildung/Profiling:** Anhang III Nr. 3 umfasst unter anderem Lernergebnisbewertung und darauf gestützte Lernsteuerung in Bildungseinrichtungen. KI-Definition, Profiling und Voraussetzungen einer Ausnahme nach Art. 6(3) schriftlich prüfen. Die Trennung von Engine-Bewertung und KI-Erklärung erteilt keine pauschale Niedrigrisiko-Einstufung.
- [ ] **KI-Kompetenzmaßnahmen nach geändertem Art. 4:** Rollenbezogene Unterstützung der Kompetenzentwicklung dokumentieren und prüfen lassen.
- [ ] **Aktueller Rechtsstand:** Amtlicher AI Act Explorer und Kommissionsmitteilung am 24.10.2026 gelesen: für die bezeichneten Hochrisiko-Regeln nach Anhang III gilt 02.12.2027, nach Anhang I 02.08.2028. Die frühere unbestätigte Omnibus-Angabe wird durch diese dokumentierten Quellen ersetzt. Direkter konsolidierter EUR-Lex-Text und unabhängige Einschätzung bleiben offen. [Voreinschätzung mit amtlichen Belegen](../legal/ai-act/vorpruefung.md).

[P4.17-Prüfvorbereitung](ki-verordnung-pruefvorbereitung.md) und `pnpm check:ai:release` prüfen Nachweise, Scope und Code-/Zweckbindung. Alle rechtlichen Abnahmen bleiben offen; keine Frist und kein grüner Testlauf schaltet Schule oder Zertifikate frei.

**App Stores**

- [ ] Apple 4.8: Wer Google-Login anbietet, braucht zusätzlich eine datensparsame Login-Option (z. B. „Mit Apple anmelden“).
- [ ] Apple 3.1.x und Google-Zahlungsrichtlinien (siehe [business-model.md](../business-model.md))
- [ ] Datenschutzangaben: Apple App Privacy und Google Data Safety

**Urheberrecht und Lizenzen**

- [ ] Liste aller Drittinhalte mit Lizenz (Fonts, Samples, Bibliotheken) und Credits-Screen (z. B. Bravura OFL, Salamander Grand Piano CC BY 3.0). Stand: Hinweise zu Bravura (seit P1.14), Salamander Grand Piano (Autor, Lizenz mit Link, Art der Bearbeitung; seit P1.17), Figtree und der Vorzeichen-Schrift (Teilmenge von Bravura Text, wegen des reservierten Namens „Bravura“ umbenannt; Lizenztext in `apps/mobile/assets/fonts/OFL.txt`; seit P1.06) stehen im Profil.
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
