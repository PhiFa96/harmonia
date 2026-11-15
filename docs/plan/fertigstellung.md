# Harmonia – Plan bis zur vollständigen Fertigstellung

Stand: **14.11.2026**. Grundlage: `main@ab157e81`, die bestehenden Phasenpläne, Prüfberichte, aktuellen Freigabeprüfungen und offenen GitHub-PRs. Dies ist ein Arbeitsplan; Inhalte und Produktfreigaben werden dadurch nicht geändert.

Umsetzungsnachweise zum unmittelbar beauftragten Paket: [gemeinsamer M1-Integrationskandidat](integration-m1.md) und [Befundregister M2](befundregister.md). Die nachstehenden Bestandsangaben und der abschließende Quellenvermerk beschreiben den Ausgangsstand dieses Plans; aktuelle lokale Prüfergebnisse und noch offene Gesamt-CI/Reviews stehen in der M1-Übergabe.

## 1. Was bereits vorhanden ist

- Eine umfangreiche technische Grundlage und interne Entwürfe für die Lernstufen 1–5, Tutor, Tonsatz, Chor, Zeitreise, Schule und Zertifikate.
- **195 interne Lektionen, 200 Fähigkeiten und 66 geplante Einheiten; null öffentlich freigegebene Lektionen.**
- Fachliche Prüfdurchgänge haben bereits stattgefunden, unter anderem am 16.10., 20.10., 31.10. und 05.11.2026. Offene Quellen-, Konventions-, Sprach- und Produktabnahmen bleiben bestehen; neuere Änderungen brauchen ihre eigene Nachprüfung.
- **Acht technische Entwurfs-PRs sind einzeln CI-grün, aber noch nicht integriert.** Ihre Ergebnisse gelten jeweils für ihren eigenen Commit, nicht für einen bereits gemeinsam geprüften Gesamtstand.
- Coach-Marktplatz und KI-Live-Calls sind noch größere ausstehende Entwicklungsblöcke. Schul- und Zertifikatswerkstätten benötigen zusätzlich eine produktive Integration.

Die aktuellen Prüfungen melden **151 offene P2-Releasevoraussetzungen**, für Beta iOS/Android jeweils **135**, Web **131**, für die KI-Bereiche allgemein/Schule/Zertifikate **21/22/18** offene Nachweisfelder sowie **26** offene Zertifikatsanforderungen. Diese Zahlen überlappen und enthalten Konfiguration, Nachweise und Laufzeitbedingungen; sie sind keine addierbare Zahl fehlender Programmieraufgaben.

## 2. Drei klare Fertigstellungsziele

| Ziel | Wann erreicht? |
|---|---|
| **A – Erste veröffentlichbare App** | Freigegebene Stufen 1–2, funktionierender Produktbetrieb, echte Geräte- und Anbieterabnahmen, ausgewertete Beta und abgeschlossener Launch einschließlich 72 Stunden Beobachtung. |
| **B – Vollständiger bisheriger Phase-4-Umfang** | Zusätzlich Stufen 3–5, alle P4.01–P4.19 als tatsächlich abgenommene Produktfunktionen, erste Coaches, mindestens eine Pilotschule und Phase-4-Rückblick. |
| **C – Gesamte langfristige Vision** | Zusätzlich die zuvor konkretisierten P5.01–P5.05: Song-Analyse, Creator-Kurse, Stufe 6, weitere Sprachen und Instrumente/Besetzungen. |

Die erste App kann vor Ziel B und C erscheinen. Für jeden Meilenstein zählen ein prüfbares Ergebnis und die zugehörigen Nachweise.

## 3. Reihenfolge und Arbeitspakete

### M1 – Vorhandene Arbeit integrieren

- [ ] Die acht offenen technischen Entwürfe prüfen und gemeinsam integrieren:

| PR | Inhalt |
|---|---|
| [#151](https://github.com/PhiFa96/harmonia/pull/151) | Schul-Kontobindung, Sitzungswiderruf, private Grader-Rolle |
| [#156](https://github.com/PhiFa96/harmonia/pull/156) | Tutor-Signatursecret, sichere Wiederholungsanfragen, Prüfbudget |
| [#157](https://github.com/PhiFa96/harmonia/pull/157) | Vollständige Importbindung der KI-/Zertifikatsprüfwerte |
| [#158](https://github.com/PhiFa96/harmonia/pull/158) | Zertifikatsansichten und Export ohne versteckte Schreibvorgänge |
| [#159](https://github.com/PhiFa96/harmonia/pull/159) | Ausdrücklich aktivierte lokale Zahlungssimulation |
| [#160](https://github.com/PhiFa96/harmonia/pull/160) | Zeitzuordnung und Fehlerbehandlung bei Chor-Aufnahmen |
| [#161](https://github.com/PhiFa96/harmonia/pull/161) | Erklärung der tatsächlich notierten Cantus-Schlussvarianten |
| [#162](https://github.com/PhiFa96/harmonia/pull/162) | Zeitreise-Hinweise und gesondert angeforderte Auflösung |

- [ ] Überschneidungen in Code, Tests und Dokumentation zusammenführen. Besonders #158/#159 gemeinsam prüfen und die Importbindung aus #157 am endgültigen Gesamtstand verifizieren.
- [ ] Neue private KI-/Zertifikatsprüfmappen erst auf dem zusammengeführten Stand erzeugen; alte Prüfwerte nicht als aktuelle Abnahme übernehmen.
- [ ] Abhängigkeiten gesondert entscheiden: #152 prüfen; #153 ist trotz grüner CI ein SDK-58-Update bei Expo SDK 57; #154 und #155 haben fehlgeschlagene CI. Unpassende Upgrades begründet zurückstellen oder schließen, nötige Migrationen separat umsetzen.
- [ ] Auf dem endgültigen Integrationskandidaten alle fünf Pflichtjobs und die vorgesehenen Reviews abschließen; danach regulärer PR-/Merge-Ablauf.

**Fertig, wenn:** Ein gemeinsamer, geprüfter Stand vorliegt und jeder Entwurf samt Tests erhalten oder begründet ersetzt wurde. Einzelne grüne PRs reichen dafür nicht.

### M2 – Verbliebene Programmierbefunde systematisch schließen

- [ ] Ein gemeinsames Befundregister aus den Prüfungen von Stufen 1–2 sowie Phase 3 und Phase 4 erstellen. Jeden Altbefund gegen aktuellen Code prüfen und als offen, nachweislich behoben, überholt oder begründet zurückgestellt führen.
- [ ] Bestätigte Probleme bei adaptiver Auswahl, FSRS-Wiederholungen, Bewertungszuordnung und Rückmeldungen beheben.
- [ ] Wettbewerb und Social prüfen: Liga-XP, Teilnahmebedingungen, Missbrauchsschutz, Einladungstoken, Alters-/Datenschutzgrenzen und Zeitzonen.
- [ ] Audio-/Mikrofon-/MIDI-Randfälle, Gerätewechsel, Eingabebereiche und Rhythmus-Texte schließen.
- [ ] Harmonik- und Prüfungsaufgaben auf eindeutigen Kontext, sinnvolle Fehlerwiederholung, barrierefreie Bedienung und passende Fähigkeitsziele prüfen; bestätigte Lücken implementieren.
- [ ] Lernziele der Stufen 3–4 mit den tatsächlichen Aufgaben abgleichen, insbesondere Modi, Formverlauf, Zwischendominanten, Voicings und Hörtraining.
- [ ] Die verbliebenen P4-Fragen prüfen: Chor-Kadenz V→iii, Grenzen nativer Zeitzuordnung, Cantus-Konventionen und die neuen Zeitreise-Hilfen. Musikalische Änderungen erst auf begründeter Fachentscheidung aufbauen.

**Fertig, wenn:** Alle bestätigten Fehler behoben und getestet sind; verbleibende Einschränkungen sind ausdrücklich entschieden und für den vorgesehenen Release vertretbar. Historische Berichte werden nicht ungeprüft als aktuelle Fehlerliste übernommen.

### M3 – Geschäftsentscheidungen und Rechtsgrundlagen abschließen

- [ ] Rechtsform, Betreiberangaben, Name/Marke, Domain und Supportkontakt abschließen: insbesondere F15/F16.
- [ ] Premium-/Max-Preise F08, Gebührenverteilung F13 und Coaching-Minderjährigenregel F14 entscheiden. Den allgemeinen Altersrahmen rechtlich bestätigen.
- [ ] F03/F04/F05 nach Recherche dokumentieren: Funktionssymbole, erweiterte Akkordsymbole und Tonsatz-Konvention. Bereits umgesetzte Entscheidungen wie Gastmodus und Bestehensregeln mit den älteren Entscheidungstabellen abgleichen.
- [ ] Rechtstexte DE/EN, Datenschutz, Aufbewahrung/Löschung, Anbieter-Verträge, Übermittlungen, Lizenzen, Storeangaben und Barrierefreiheit prüfen lassen.
- [ ] Für P4.17 schriftliche KI-Verordnungsprüfung der tatsächlichen Funktionen und Zwecke einholen; allgemeines Produkt, Schule und Zertifikate getrennt beurteilen. Daraus erforderliche Maßnahmen implementieren.
- [ ] Für Marktplatz, Schule und Zertifikate die jeweiligen Vertrags-, Steuer-, Schutz- und Prüfungsbedingungen abschließen.

**Fertig, wenn:** Tatsächliche Entscheidungen und passende schriftliche Nachweise vorliegen und erforderliche technische Maßnahmen umgesetzt sind. Eine ausgefüllte Vorlage oder ein Dateihash ersetzt keine Prüfung.

M3 kann parallel zu M1/M2 beginnen. **P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt.**

### M4 – Echten Produktbetrieb herstellen

- [ ] Unternehmensgebundene Anbieter- und Entwicklerkonten, endgültige App-IDs, EAS-Projekt sowie getrennte Staging-/Produktionsumgebungen einrichten.
- [ ] Supabase-Migrationen, Functions, RLS, sichere Secrets, Schlüsselrotation, Scheduler und Realtime in der tatsächlichen Umgebung prüfen.
- [ ] E-Mail-/Apple-/Google-Anmeldung, Weiterleitungen, Kontowechsel, Export, Löschung und externe Anbieter-Löschungen vollständig abnehmen.
- [ ] RevenueCat-/Store-/Web-Produkte mit echten Sandbox-Abläufen verbinden: Kauf, ausstehende Zahlung, Restore, Kündigung, Ablauf, Erstattung, Webhooks und Gerätewechsel.
- [ ] Tutor mit echtem freigegebenem Modell auf dem endgültigen Prompt-/Werkzeug-/Quellenstand testen: Fachqualität, Quellen, Missbrauch, Latenz und Kosten. Kontingente und Alarmgrenzen festlegen.
- [ ] Hosting, HTTPS, Monitoring, Support, Kostenalarme, Backup-Wiederherstellung und Rollback tatsächlich proben.

**Fertig, wenn:** Die ausgewählten Produktfunktionen Ende zu Ende gegen die vorgesehenen Anbieter funktionieren und Betrieb sowie Wiederherstellung belegt sind.

### M5 – Inhalte tatsächlich freigeben

- [ ] Stufen **1–2 zuerst**, danach **3–4**, danach **5** fachlich und sprachlich abschließen.
- [ ] Offene Literatur-/Quellenfragen, Konventionen und Zweifel aus früheren Prüfungen nachvollziehbar entscheiden.
- [ ] Lernziele, Aufgaben, Antworten, Hinweise, Notenbilder, Hörbeispiele und DE/en-US/en-GB gemeinsam prüfen.
- [ ] Den getrennten zweiten Fachprüfdurchgang nach ADR 0005 abschließen. Neue Hinweise oder Regeln benötigen ihre eigene Nachprüfung.
- [ ] Nur tatsächlich abgenommene Inhalte samt ihrer Abhängigkeiten freigeben und daraus den öffentlichen Katalog erzeugen.

**Fertig, wenn:** Der jeweils vorgesehene Umfang fachlich freigegeben und im Produktionskatalog enthalten ist. Für das erste vollständige MVP sind Stufen 1–2 erforderlich; eine zuvor freigegebene geschlossene Beta kann enger begrenzt sein.

### M6 – Echte Geräte prüfen und geschlossene Beta durchführen

- [ ] Die vier vorgesehenen Geräteplätze abnehmen: kleines und aktuelles iOS-Gerät, Android-Mittelklasse und aktuelles Android-Gerät; Web zusätzlich prüfen.
- [ ] Hörbare Latenz, Mikrofon, Kopfhörer/Bluetooth, Hintergrundwechsel, Offline-Wiederaufnahme, MIDI und Konto-/Kaufwechsel auf den unterstützten Kombinationen testen.
- [ ] VoiceOver/TalkBack, Web-Screenreader, Tastatur, große Schrift und reduzierte Bewegung praktisch prüfen.
- [ ] Leistungsziele messen: App-Start unter 3 s, Lektionsöffnung unter 1 s und angestrebte hörbare Eingabelatenz unter 50 ms.
- [ ] Nach tatsächlicher Startfreigabe TestFlight, Play-Testverteilung und geschützte Web-Beta einrichten.
- [ ] **30–100 tatsächlich testende Personen** betreuen, Meldungen wöchentlich auswerten, Fehler beheben und nachtesten. Kritische Fehler vor Abschluss schließen.
- [ ] Echte Lern-, Nutzungs- und Kostenkennzahlen mit belastbaren Beobachtungsfenstern auswerten; vereinbarte Zielwerte beurteilen.

**Fertig, wenn:** Gerätebelege, Beta-Bericht und Nachtests den freizugebenden Umfang tragen und keine offenen kritischen Fehler bestehen.

### M7 – Erste App veröffentlichen und Launch abschließen

- [ ] Den Releasekandidaten mit Stufen 1–2 einfrieren; Rechts-, Inhalts-, Anbieter-, Geräte-, Beta- und Storebelege auf genau diesen Stand binden.
- [ ] Storetexte, native Screenshots, Datenschutzangaben, Website und Supportzugänge finalisieren.
- [ ] Den konkreten Kandidaten zur Veröffentlichung freigeben, signierte Builds einreichen und gestaffelt ausrollen.
- [ ] Mindestens **72 tatsächliche Stunden** Abstürze, Synchronisation, Käufe, Tutor-Kosten und Support beobachten; Störungen beheben und Rückblick abschließen.

**Fertig, wenn:** Die App verfügbar ist und die Launch-Beobachtung bestanden hat. **Ziel A ist erreicht.**

### M8 – Phase 3 als Produkt abschließen

- [ ] Die freigegebenen Stufen 3–4 und ihre Wissensbasis ausrollen.
- [ ] Adaptive Lernlogik, Ligen, Rush, Duelle, Rätsel, Freunde, Mikrofon, MIDI, Rhythmus, Prüfungsmodus und Lernplaner unter echten Mehrgeräte-/Netzbedingungen abnehmen.
- [ ] Realtime, Scheduler, Synchronisation, Datenschutz und Lernwirkung/Plausibilität mit realen Nachweisen prüfen.
- [ ] Die formalen Phase-3-Abschluss- und Phase-4-Startbedingungen erfüllen, einschließlich rechtlicher Voraussetzungen und tragfähiger Nutzerbasis für Coaching.

**Fertig, wenn:** Phase 3 tatsächlich freigegeben und betrieben wird und eine formale Phase-4-Startentscheidung vorliegt. Die bisher ausdrücklich erlaubte interne P4-Vorarbeit bleibt davon getrennt dokumentiert.

### M9 – Coach-Marktplatz P4.01–P4.07 programmieren und abnehmen

Nach F14, den rechtlichen Voraussetzungen und der formalen Startentscheidung:

- [ ] **P4.01:** Dashboard, Coachprofile, Prüfung, Stripe-Connect-Onboarding und erforderliche Steuerdaten.
- [ ] **P4.02:** Coach-Pro-Abo einschließlich Verlängerung und Kündigung.
- [ ] **P4.03:** Suche, Verfügbarkeit, Zeitzonen, Buchung, Erinnerungen und Stornierung; Doppelbuchungen ausschließen.
- [ ] **P4.04:** Zahlungen, 15-%-Provision, Auszahlung, Belege, Erstattung und Streitfälle.
- [ ] **P4.05:** Zugangsgebundene LiveKit-Calls ohne Aufzeichnung, gemeinsames Notenblatt/Klaviatur und Wiederverbindung; 60-Minuten-Calls zwischen den Plattformen prüfen.
- [ ] **P4.06:** Separate widerrufbare Lernstand-Freigabe und Hausaufgaben; ohne Freigabe kein Coachzugriff.
- [ ] **P4.07:** Terminbezogene Bewertungen, Melden, Moderation und Beschwerdewege.

**Fertig, wenn:** Der komplette Ablauf von Coach-Onboarding bis Unterricht und Abrechnung funktioniert und erste Coaches tatsächlich live sind.

### M10 – KI-Live-Calls P4.08 bauen

- [ ] Auf den geprüften Call-/Audiopfaden Spracherkennung, Tutor mit Engine-Werkzeugen und Sprachausgabe integrieren.
- [ ] DE/EN, Unterbrechungen, Wiederverbindung und Musikbeispiele prüfen.
- [ ] Datenschutz, KI-Kennzeichnung, Minutenkontingente und serverseitige Kostenbegrenzung umsetzen.
- [ ] Gesprächsqualität, Antwortzeit und Kosten mit einem echten Sprachtestkatalog abnehmen; Max-Angebot darauf abstimmen.

**Fertig, wenn:** Der sprachliche Tutor zuverlässig funktioniert und die tatsächlichen Kosten zum freigegebenen Angebot passen.

### M11 – Vorhandene P4-Entwürfe als Produkt vervollständigen

- [ ] **P4.09/P4.10:** Freigegebenes Tonsatz-Regelprofil, nachvollziehbare DE/EN-Erklärungen und geprüfte Einbindung in Stufen 4–5.
- [ ] **P4.11:** Chor-Trainer mit realen Kopfhörer-/Mikrofonbelegen; Zeitzuordnung, Intonation und die bereits entschiedene Gesangs-Abschlussregel zuverlässig erfüllen.
- [ ] **P4.12:** Mindestens vier fachlich freigegebene Epochen einschließlich Quellen, eigener Modelle und didaktisch geprüfter Hilfen.
- [ ] **P4.13–P4.16:** Schulwerkstatt in die geschützte Produkt-Dashboard-/Kontenbasis überführen; echte Identitäten, Einwilligungs-/Berechtigungsabläufe, Lernnachweise, Lizenzen/Rechnungen und Datenschutzrechte anbinden. Einen tatsächlichen 30-Geräte-Quiztest und mindestens eine Pilotschule abschließen.
- [ ] **P4.17:** Schriftliche Einordnung und geforderte Maßnahmen für die finalen Funktionen abschließen; Nachweise bei Code-/Zweckänderungen aktualisieren.
- [ ] **P4.18:** Vollständige fachlich freigegebene Abschlussprüfungen zunächst für Stufen 1–2 erstellen; echte Identitäts-/Zahlungsanbindung, verbindliche Bestehens-/Wiederholungsregeln, PDF, Prüfseite und Widerruf fertigstellen. Die derzeitigen zwei Zwölf-Fragen-Profile bleiben technische Proben.
- [ ] **P4.19:** Stufe 5 vollständig fachlich, sprachlich und auf Geräten abnehmen und veröffentlichen.
- [ ] Den gesamten Phase-4-Umfang gemeinsam abnehmen, ausrollen und einen Rückblick durchführen.

**Fertig, wenn:** P4.01–P4.19 ihre Produkt-Abnahmekriterien erfüllen, erste Coaches live und mindestens eine Pilotschule eingerichtet sind. **Ziel B ist erreicht.**

### M12 – Langfristige Vision P5.01–P5.05 umsetzen

Vor dem Start den Umfang, Zielsprachen, unterstützte Instrumente, Qualitätsmaßstäbe und Abhängigkeiten konkretisieren:

| Paket | Noch zu bauen und abzunehmen |
|---|---|
| **P5.01 Song-Analyse** | Zuerst MIDI/MusicXML mit Tonart, Akkorden, Form und daraus erzeugten Übungen; anschließend Audioanalyse mit festgelegter Genauigkeit, Lizenz-/Kosten- und Datenschutzprüfung. |
| **P5.02 Creator-Kurse** | Kurseditor, fachlicher/rechtlicher Prüfprozess, Verkauf, Umsatzbeteiligung und Meldewege; erste geprüfte Creator-Kurse live. |
| **P5.03 Stufe 6** | Erweiterter Kontrapunkt, Stilkopien, Komposition/Fuge, Werkstattfeedback und DE/EN-Inhalte; mehrstimmige Aufgaben bis acht Stimmen und fachlich begründete Chorbesetzungen. |
| **P5.04 Weitere Sprachen** | Zielsprachen auswählen; jeweils Benennungssystem, Glossar, Oberfläche, Lerninhalte und Tutor-Katalog vollständig prüfen und freigeben. |
| **P5.05 Instrumente/Besetzungen** | Gitarren-Griffbrett, weitere Klänge, transponierende Instrumente und Orchesterpartituren; Chorwiedergabe mit mischbaren Stimmen sowie gesonderte Prüfung gesungenen Texts. Mindestens ein weiteres Instrument vollständig integrieren. |

**Fertig, wenn:** Der vorab festgelegte Phase-5-Umfang implementiert, fachlich/rechtlich abgenommen und tatsächlich verfügbar ist. **Ziel C ist erreicht.**

## 4. Zuständigkeiten und parallele Arbeit

| Arbeit | Zuständigkeit |
|---|---|
| Implementierung, Integration, Tests und technische Betriebsunterstützung | Entwicklung: Claude/Codex im bestehenden PR-Verfahren |
| Fachkonventionen, Quellenabgleich und getrennter Fachprüfdurchgang | Claude gemäß ADR 0005; externe Fachbegutachtung für Schule/Zertifikate bei Bedarf |
| Preise, Rechtsform, Marke, Anbieter-/Storekonten, Merge-/Releaseentscheidungen und echte Gerätetests | Phillip, unterstützt durch Entwicklung/Testpersonen |
| Rechtliche Einordnung, Verträge und Steuerfragen | Qualifizierte Rechts-/Datenschutz-/Steuerberatung mit dem Betreiber |
| Beta und Pilotbetrieb | Betreiber, Testpersonen, Coaches und Pilotschule mit technischer Begleitung |

**Parallel möglich:** M1/M2, Recherche/Fachprüfung aus M5, Entscheidungen aus M3 und vorbereitende Anbieterarbeit aus M4. Externe Beta und Veröffentlichung folgen erst nach ihren tatsächlichen Freigaben. Interne technische P4-Vorarbeit bleibt ausdrücklich vor der formalen Phase-4-Freigabe gekennzeichnet.

Ein belastbarer Gesamttermin folgt nach M1/M2 aus dem verbleibenden Befundumfang, verfügbaren Prüfern, Konten/Anbietern und der Geräte-/Beta-Besetzung. Beobachtungsfenster und die 72-h-Launchphase müssen tatsächlich verstreichen.

## 5. Der unmittelbar nächste Auftrag

**M1: Die acht grünen technischen Entwurfs-PRs zu einem gemeinsam geprüften Integrationsstand zusammenführen und daneben das aktuelle Befundregister aus M2 aufbauen.** Danach werden konkrete Programmierpakete aus bestätigten Restbefunden und Produktintegrationen abgearbeitet. Jede erledigte Aufgabe erhält einen Nachweis; unerfüllte Abnahmekriterien bleiben sichtbar offen.

## Quellen des Plans

- [Phasenübersicht](README.md), [Phase 4](phase-4-v2.md), [Phase 5](phase-5-vision.md)
- [Fachprüfung Phase 3](fachpruefung-phase-3.md), [Phase 4 v2](fachpruefung-phase-4-v2.md), [Phase 4 v3](fachpruefung-phase-4-v3.md)
- [Offene Entscheidungen](offene-fragen.md), [Fachprüfungszuständigkeit ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md)
- [Recht und Compliance](recht-und-compliance.md), [geschlossene Beta](geschlossene-beta.md), [Launch und Betrieb](launch-betrieb.md)
- [P2-Abschluss und Einzelabnahmen](p2-abschluss.md), [Abo-/Anbieterabnahmen](abos-revenuecat.md). Die verlinkten Einzelchecklisten bleiben für ihren jeweiligen Umfang maßgeblich.
- Reproduzierbarer Status: `pnpm p2:status`, `pnpm check:beta`, `pnpm check:ai --scope general` (zusätzlich mit `--scope school` und `--scope certificates`), `pnpm check:certificates`, `pnpm check:content`.

Die Bestandsprüfungen wurden für diesen Plan erneut ausgeführt; PR- und CI-Status wurden über GitHub gelesen. Es wurden keine Inhalte freigegeben, PRs integriert, Anbieter eingerichtet, Personen kontaktiert oder Veröffentlichungen gestartet.
