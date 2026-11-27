# Harmonia – Plan bis zur vollständigen Fertigstellung

Stand **27.11.2026** (M1 abgeschlossen mit PR #165, M2/T1-Triage durch Codex und Review durch Claude); zuvor fortgeschrieben am 16.11.2026 nach Claudes fachlicher und funktionaler Prüfung des Integrationskandidaten (Codex-Stand `84200b8`, Arbeitsbranch `claude/zen-volta-59qear`); Ausgangsplan vom 14.11.2026 (früher Entwurfs-PR #163, durch diese Datei ersetzt). Dieser Plan umfasst die verbleibende Entwicklung, Inhalte, Entscheidungen, Anbieteranbindung, reale Abnahmen und Veröffentlichung bis einschließlich der heutigen Phase-5-Vision.

Technische Nachweise: [M1-Übergabe](integration-m1.md), [lokaler Prüfbericht](../quality/m1-integration/validation.json) und [Befundregister M2](befundregister.md). Der Plan ändert keine Inhalts-, Fach-, Rechts- oder Produktfreigabe.

## 1. Was bereits vorhanden ist

- Eine umfangreiche technische Grundlage und interne Entwürfe für die Lernstufen 1–5, Tutor, Tonsatz, Chor, Zeitreise, Schule und Zertifikate.
- **195 interne Lektionen, 200 Fähigkeiten und 66 geplante Einheiten; null öffentlich freigegebene Lektionen.**
- Fachliche Prüfdurchgänge haben bereits stattgefunden, unter anderem am 16.10., 20.10., 31.10. und 05.11.2026. Offene Quellen-, Konventions-, Sprach- und Produktabnahmen bleiben bestehen; neuere Änderungen brauchen ihre eigene Nachprüfung.
- **Die acht technischen Entwürfe #151 und #156–#162 sind gemeinsam integriert und von Claude fachlich und per Code-Review geprüft** ([Prüfabschnitt](integration-m1.md#fachliche-und-funktionale-prüfung-durch-claude-code-16112026)); am 16.11.2026 über PR #165 mit allen fünf grünen Pflichtjobs nach `main` übernommen (`688de50`). Sechs optionale Liga-/Rush-Auth-UI-Fälle wurden weiterhin nicht ausgeführt.
- **M2/T1 ist abgeschlossen:** Die [Einzeltriage](../quality/m2-befunde/triage.md) löst die 71 Registergruppen aus 33 unveränderten Rohberichten und M1-R1–R6 in 454 Einzelfunde und 30 Kontrollhinweise auf. Für Ziel A sind 157 Einträge offen oder noch zu messen (11 S1, 29 S2, 110 S3, 7 S4), dazu 51 Regressionslücken. Die Restkorrekturen T2–T7 stehen aus.
- Coach-Marktplatz und KI-Live-Calls sind noch größere ausstehende Entwicklungsblöcke. Schul- und Zertifikatswerkstätten benötigen zusätzlich eine produktive Integration.

Der zuletzt geprüfte Integrationsstand meldet **151 offene P2-Releasevoraussetzungen**, für Beta iOS/Android jeweils **135**, Web **131**, für die KI-Bereiche allgemein/Schule/Zertifikate **21/22/18** offene Nachweisfelder sowie **26** offene Zertifikatsanforderungen. Diese Zahlen überlappen und enthalten Konfiguration, Nachweise und Laufzeitbedingungen; sie sind keine addierbare Zahl fehlender Programmieraufgaben. Lokale Prüfungen ersetzen die noch fehlenden realen Abnahmen nicht.

## 2. Drei klare Fertigstellungsziele

| Ziel | Wann erreicht? |
|---|---|
| **A – Erste veröffentlichte App** | Freigegebene Stufen 1–2, funktionierender Produktbetrieb, echte Geräte- und Anbieterabnahmen, ausgewertete Beta und abgeschlossener Launch einschließlich 72 Stunden Beobachtung. |
| **B – Vollständiger bisheriger Phase-4-Umfang** | Zusätzlich Stufen 3–5, alle P4.01–P4.19 als tatsächlich abgenommene Produktfunktionen, erste Coaches, mindestens eine Pilotschule und Phase-4-Rückblick. |
| **C – Gesamte langfristige Vision** | Zusätzlich die zuvor konkretisierten P5.01–P5.05: Song-Analyse, Creator-Kurse, Stufe 6, weitere Sprachen und Instrumente/Besetzungen. |

Die erste App kann vor Ziel B und C erscheinen. Für jeden Meilenstein zählen ein prüfbares Ergebnis und die zugehörigen Nachweise.

## 3. Reihenfolge und Arbeitspakete

Die Reihenfolge beschreibt die Abhängigkeiten. M3, die Facharbeit aus M5 und vorbereitende Betriebs-/Gerätearbeit können bereits parallel zu M1/M2 laufen. Für jeden Release wird festgelegt, welche Funktionen dazugehören; weitere Funktionen brauchen vor ihrer Aktivierung dieselben passenden Abnahmen.

| Meilenstein | Noch zu erreichen | Voraussetzung / Hauptzuständigkeit |
|---|---|---|
| M1 | Erledigt am 16.11.2026: gemeinsamer Kandidat über PR #165 nach `main` übernommen | Claude Code im bestehenden Freigabeverfahren |
| M2 | Einzeltriage abschließen und bestätigte technische Restfehler beheben | Aktueller Gesamtstand; Entwicklung, Fachentscheidungen durch Claude |
| M3 | Betreiber-, Preis-, Rechts- und Fachentscheidungen mit Nachweisen abschließen | Parallel starten; Phillip, Claude und qualifizierte Beratung nach Bereich |
| M4 | Echte Anbieter und belastbaren Produktbetrieb herstellen | Betreiber-/Kontenentscheidungen aus M3; Entwicklung und Phillip |
| M5 | Inhalte erst Stufe 1–2, später 3–5 tatsächlich freigeben | Fach-/Quellen-/Sprachprüfung und entschiedene Konventionen; Claude |
| M6 | Geräteabnahme und geschlossene Beta mit echten Testpersonen bestehen | Freigegebener Betaumfang aus M2–M5; Phillip und Testpersonen |
| M7 | Erste App veröffentlichen und 72 Stunden Launch beobachten | M1–M6 für den konkreten Kandidaten erfüllt; Releaseentscheidung durch Phillip |
| M8 | Phase 3 einschließlich Stufe 3–4 im Betrieb abnehmen und Phase 4 formal starten | Ziel A, passende Freigaben und belastbare Nutzungsnachweise |
| M9 | Coach-Marktplatz vollständig bauen und erste Coaches live bringen | F14/Recht und formale Phase-4-Startentscheidung |
| M10 | Sprachlichen KI-Tutor mit tragfähigen Kosten fertigstellen | Geprüfte Call-/Audiopfade sowie passende Anbieter-/Rechtsabnahmen |
| M11 | Tonsatz, Chor, Zeitreise, Schule, Zertifikate und Stufe 5 als Produkte abschließen | Inhalte, Produktkonten und reale Abnahmen; nach M8 teilweise parallel zu M9/M10 |
| M12 | Song-Analyse, Creator-Kurse, Stufe 6, weitere Sprachen und Instrumente umsetzen | Ziel B und zuvor konkretisierter Phase-5-Umfang |

### M1 – Vorbereitete Integration formal abschließen

- [x] Die acht technischen Entwürfe auf dem gemeinsamen Arbeitsbranch zusammenführen und lokal prüfen:

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

- [x] Überschneidungen in Code, Tests und Dokumentation zusammenführen; #158/#159 gemeinsam und die Importbindung aus #157 einschließlich sechs zusätzlicher Änderungsproben prüfen.
- [x] Private KI-/Zertifikatsprüfmappen auf dem endgültigen gebundenen Stand neu erzeugen. Die geschlossenen Releasegates bleiben erhalten.
- [x] Abhängigkeiten #152–#155 prüfen und für diesen Kandidaten begründet zurückstellen. SDK-/Deno-Abgleich, Expo-SDK-Migration, Supabase-CLI 3 und Audio API 1 bleiben eigene Pakete; bei neuen Sicherheits- oder Kompatibilitätsbefunden erneut priorisieren.
- [x] Fachliche Prüfung (#160–#162) und Code-Review des Gesamt-Diffs durch Claude; kein Blocker, Restbefunde als M1-R1–R6 im Befundregister.
- [x] Abhängigkeiten erneut entschieden (16.11.2026, Nutzerentscheidung): #152 ist geschlossen und durch das Sammelupdate #164 ersetzt; #164, #153, #154 und #155 bleiben zurückgestellt (T7).
- [x] Claude Code erstellt den Integrations-PR mit der [vorbereiteten Beschreibung](../quality/m1-integration/pr-beschreibung.md) (PR #165).
- [x] Alle fünf Pflichtjobs am endgültigen gemeinsamen PR-Head abschließen (Lauf 302, Head `998db34`).
- [x] Den geprüften Kandidaten regulär nach `main` übernehmen (16.11.2026, `688de50`); #151/#156–#162 und #163 sind geschlossen. Arbeitsbranches räumt GitHubs automatische Löschung auf.
- [ ] Bei weiteren Änderungen an Code oder gebundener Zweckbeschreibung die betroffenen Prüfmappen und Abnahmen aktualisieren.

**Fertig, wenn:** Der gemeinsame Kandidat nach erfolgreicher erforderlicher GitHub-CI und den vorgesehenen Reviews über den regulären PR nach `main` übernommen ist; jeder Entwurf samt Tests ist erhalten oder begründet ersetzt. Codex übergibt gemäß `AGENTS.md` den Arbeitsbranch; Claude Code übernimmt den PR-/CI-/Integrationsablauf.

### M2 – Verbliebene Programmierbefunde systematisch schließen

- [x] Ein gemeinsames [Befundregister](befundregister.md) mit 71 ursprünglichen Arbeitsgruppen und einem Verzeichnis der 33 historischen Rohberichte anlegen.
- [x] Jeden Altbefund gegen aktuellen Code und die vorhandenen Regressionen prüfen. Einzelfunde als offen, nachweislich behoben, überholt oder begründet zurückgestellt führen; bloße Vermutungen bleiben als solche erkennbar. [T1-Einzeltriage](../quality/m2-befunde/triage.md).
- [x] Für jeden bestätigten Restbefund Umfang, Zuständigkeit, Abhängigkeiten und betroffenen Zielumfang A/B/C festlegen. Eine Erledigung erhält einen Test-/Codebeleg oder eine ausdrückliche Entscheidung mit Begründung. [T1-Einzeltriage](../quality/m2-befunde/triage.md).
- [ ] Bestätigte Probleme bei adaptiver Auswahl, FSRS-Wiederholungen, Bewertungszuordnung und Rückmeldungen beheben.
- [ ] Wettbewerb und Social prüfen: Liga-XP, Teilnahmebedingungen, Missbrauchsschutz, Einladungstoken, Alters-/Datenschutzgrenzen und Zeitzonen.
- [ ] Die sechs optionalen authentifizierten Browserfälle für Liga und Rush mit der dafür vorgesehenen lokalen Anbieter-Fixture ausführen; vor Aktivierung dieser Funktionen zusätzlich reale Konto-/Mehrgeräteabläufe abnehmen.
- [ ] Die ausstehenden Audio-/MIDI-Nachweise abschließen. Die technische Umsetzung für Mikrofon, MIDI und Rhythmus steht in der [Triage](../quality/m2-befunde/triage.md#t2t6-umsetzung-27112026). P3-15.02 dokumentiert die wirksamen Klarheitsgrenzen. Reale Geräteabnahme folgt in M6.
- [ ] Harmonik- und Prüfungsaufgaben auf eindeutigen Kontext, sinnvolle Fehlerwiederholung, barrierefreie Bedienung und passende Fähigkeitsziele prüfen; bestätigte Lücken implementieren.
- [ ] Lernziele der Stufen 3–4 mit den tatsächlichen Aufgaben abgleichen, insbesondere Modi, Formverlauf, Zwischendominanten, Voicings und Hörtraining.
- [ ] Abhängigkeitspaket T7 umsetzen (zurückgestellte Dependabot-PRs #153/#154/#155/#166).
- [ ] Die verbliebenen P4-Fragen prüfen: Chor-Kadenz V→iii, Grenzen nativer Zeitzuordnung, Cantus-Konventionen (Kennzeichnung am Korpus nachgerechnet; Quellenbeleg und phrygische Schlüsse offen) und die neuen Zeitreise-Hilfen (verraten die Lösung nicht; didaktische Abnahme offen). Musikalische Änderungen erst auf begründeter Fachentscheidung aufbauen.

**Fertig, wenn:** Alle bestätigten Fehler behoben und getestet sind; verbleibende Einschränkungen sind ausdrücklich entschieden und für den vorgesehenen Release vertretbar. Historische Berichte werden nicht ungeprüft als aktuelle Fehlerliste übernommen.

Technischer Arbeitsstand innerhalb von M2. Die Ziel-A-Spalte zählt die 82 Aufgaben aus dem Technikauftrag. Die geplanten Produkt-, Betriebs-, Fach- und Geräteprüfungen stehen in den jeweiligen Meilensteinen.

| Paket | Arbeit | Ziel-A-Technik | Abschlussnachweis |
|---|---|---|---|
| T1 | Erledigt am 27.11.2026. 454 Einzelfunde und 30 Kontroll- und Stilhinweise in 77 Gruppen. | – | Ziel A offen oder noch zu messen: 11 S1, 29 S2, 110 S3, 7 S4. Zusätzlich 51 Ziel-A-Regressionslücken. [Einzeltriage](../quality/m2-befunde/triage.md). |
| T2 | Lernablauf, FSRS, Fähigkeits-/Bewertungszuordnung und Zeitgrenzen prüfen | 10 von 12 geschlossen | Reproduktionen und Regressionen; konservative Bewertungsregeln und Lernschritte begründet beurteilt, statt ungeprüft ersetzt |
| T3 | Lernziel-/Aufgabenabdeckung, Voraussetzungen und Rückmeldungen der Stufen 1–2 schließen | 37 von 38 geschlossen | Abgleich je Fähigkeit/Lektion; technische Lücken behoben, Fachfragen an M5 gebunden |
| T4 | Wettbewerb/Social und die sechs offenen Auth-UI-Fälle abnehmen | 5 von 15 geschlossen | Konto-, Rechte-, Teilnahme-, Missbrauchs- und Zeitzonentests; erforderliche Produkt-/Datenschutzentscheidungen dokumentiert |
| T5 | Audio, Mikrofon, MIDI, Wiederaufnahme und barrierefreie Eingaben prüfen | 14 von 15 geschlossen | Regressionsbelege für Fehlerpfade; reale Nachweise anschließend in M6 |
| T6 | Stufen 3–5 und P4-Restfragen gegen tatsächliche Aufgaben prüfen | 2 von 2 geschlossen | Lernzielabgleich, begründetes Regelprofil und eigene Nachprüfung neuer Hinweise/Erklärungen |
| T7 | Abhängigkeiten und Plattform aktuell halten: Sammelupdate #166 mit Anthropic SDK an allen drei Orten gemeinsam (ADR 0065), Expo-SDK-58-Migration statt Einzelpaket #153, Supabase-CLI 3 (#154) und Audio API 1.0 (#155) als eigene Migrationen | – | Je Paket eigener PR mit fünf grünen Pflichtjobs; nativer Build/Gerätetest für SDK- und Audioänderungen; echter Tutor-API-Aufruf nach SDK-Wechsel. Vor der Storeeinreichung (M7) prüfen, ob das verwendete Expo SDK noch die geforderten iOS-/Android-Zielversionen erfüllt |

### M3 – Geschäftsentscheidungen und Rechtsgrundlagen abschließen

**Vorläufige Nutzerangabe vom 27.11.2026 für Ziel A:** Zur ersten App zählen Stufen 1–2, Kernlernablauf, Tutor und Wissensbasis für diese Stufen sowie Ligen, Rush, Duelle, tägliches Rätsel, Freunde/Quests, Mikrofon, Stimmgerät, Singaufgaben, MIDI und Rhythmus-Übungsmodus. Die formale Umfangsentscheidung folgt in M3.

- [ ] Rechtsform, Betreiberangaben, Name/Marke, Domain und Supportkontakt abschließen: insbesondere F15/F16.
- [ ] Premium-/Max-Angebotsumfang und Preise F08, Übernahme der Stripe-Gebühren F13 und Coaching-Minderjährigenregel F14 entscheiden. Den allgemeinen Altersrahmen rechtlich bestätigen. Die 15-%-Marktplatzprovision ist bereits beschlossen; F13 betrifft die zusätzlichen Zahlungsgebühren.
- [ ] Den konkreten Umfang der ersten App festlegen, einschließlich aktivierter Funktionen, unterstützter Geräte/Routen und Vertriebsplattformen. Max bleibt bis zur passenden Angebots-/Preis-/Kostenfreigabe im vorhandenen gesperrten Zustand; KI-Live-Calls müssen den ersten App-Release nicht aufhalten.
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

Die Leistungsgrenzen werden je unterstütztem Gerät und Audioweg festgelegt und gemessen. Die synthetischen Browser-/PCM- und 30-HTTP-Client-Belege aus M1 ersetzen weder eine reale Mikrofon-/Bluetooth-/MIDI-Abnahme noch den späteren 30-Geräte-Schultest. Die Beta beginnt nach ihrer tatsächlichen Startfreigabe; eine bloße Zahl angelegter Konten genügt nicht als Testpersonen-Nachweis.

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

Soweit Phase-3-Funktionen bereits in Ziel A aktiviert werden sollen, müssen ihre passenden technischen, rechtlichen und realen Abnahmen schon vor diesem ersten Release vorliegen.

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

Die Entwicklung baut auf den geprüften Call-/Audiopfaden auf. Ein bereits veröffentlichter Coach-Marktplatz allein belegt noch keine Sprachqualität oder tragfähigen KI-Minutenkosten.

- [ ] Auf den geprüften Call-/Audiopfaden Spracherkennung, Tutor mit Engine-Werkzeugen und Sprachausgabe integrieren.
- [ ] DE/EN, Unterbrechungen, Wiederverbindung und Musikbeispiele prüfen.
- [ ] Datenschutz, KI-Kennzeichnung, Minutenkontingente und serverseitige Kostenbegrenzung umsetzen.
- [ ] Gesprächsqualität, Antwortzeit und Kosten mit einem echten Sprachtestkatalog abnehmen; Max-Angebot darauf abstimmen.

**Fertig, wenn:** Der sprachliche Tutor zuverlässig funktioniert und die tatsächlichen Kosten zum freigegebenen Angebot passen.

### M11 – Vorhandene P4-Entwürfe als Produkt vervollständigen

Inhalts-/Quellenrecherche und ausdrücklich erlaubte interne Vorarbeit können vorher erfolgen. Die formale Produktfreigabe folgt den Phase-4-Startbedingungen. Schul-/Zertifikatsintegration und fachliche Abnahmen lassen sich nach Freigabe teilweise parallel zum Marktplatz und zu KI-Live-Calls bearbeiten.

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
| **P5.03 Stufe 6** | Erweiterter Kontrapunkt, Stilkopien, Komposition/Fuge, Werkstattfeedback und DE/EN-Inhalte; Aufgaben bis acht selbständige Stimmen. Gemischten Chor, Kinder-, Männer- und Frauenchor mit begründeten Umfängen, Teilungen, Textunterlegung, Atemstellen und Chornotation abdecken. |
| **P5.04 Weitere Sprachen** | Zielsprachen auswählen; jeweils Benennungssystem, Glossar, Oberfläche, Lerninhalte und Tutor-Katalog vollständig prüfen und freigeben. |
| **P5.05 Instrumente/Besetzungen** | Gitarren-Griffbrett, weitere Klänge, transponierende Instrumente und Orchesterpartituren einschließlich notierter/klingender Tonhöhe, Umfängen, Artikulation und Stimmenauszügen; Chorwiedergabe mit einzeln hörbaren/mischbaren Stimmen sowie gesonderte Prüfung gesungenen Texts. Mindestens ein weiteres Instrument vollständig integrieren. |

**Fertig, wenn:** Der vorab festgelegte Phase-5-Umfang implementiert, fachlich/rechtlich abgenommen und tatsächlich verfügbar ist. **Ziel C ist erreicht.**

## 4. Zuständigkeiten und parallele Arbeit

| Arbeit | Zuständigkeit |
|---|---|
| Implementierung, Integration, Tests und technische Betriebsunterstützung | Entwicklung: Claude/Codex im bestehenden PR-Verfahren |
| PR-Erstellung, erforderliche GitHub-CI, vorgesehene Reviews und reguläre Main-Integration | Claude Code gemäß `AGENTS.md` und dem bestehenden Freigabeverfahren; Codex übergibt getestete Arbeitsbranches |
| Fachkonventionen, Quellenabgleich und getrennter Fachprüfdurchgang | Claude gemäß ADR 0005; externe Fachbegutachtung für Schule/Zertifikate bei Bedarf |
| Preise, Rechtsform, Marke, Anbieter-/Storekonten, Merge-/Releaseentscheidungen und echte Gerätetests | Phillip, unterstützt durch Entwicklung/Testpersonen |
| Rechtliche Einordnung, Verträge und Steuerfragen | Qualifizierte Rechts-/Datenschutz-/Steuerberatung mit dem Betreiber |
| Beta und Pilotbetrieb | Betreiber, Testpersonen, Coaches und Pilotschule mit technischer Begleitung |

**Drei parallele Arbeitsstränge bis Ziel A:**

1. **Technik:** T2–T6 aus der T1-Triage aufnehmen, T7-Abhängigkeiten einplanen, notwendige A-Korrekturen aus M2 umsetzen und Anbieter-/Betriebsintegration aus M4 abnehmen.
2. **Inhalte:** Stufen 1–2 samt Voraussetzungen, Quellen, Fachkonventionen und DE/US/UK-Texten nach M5 abschließen; danach Stufen 3–5 vorbereiten.
3. **Betreiber und Abnahmen:** M3-Entscheidungen/Rechtsprüfung, Anbieter-/Storekonten, Gerätebesetzung und Testpersonen für M6 organisieren; Store/Support/Betrieb vorbereiten.

Diese Stränge treffen vor der geschlossenen Beta zusammen. Nach bestandener Beta folgen Kandidatenfreigabe, Storeprüfung, Veröffentlichung und tatsächliche 72-h-Beobachtung. Erst dann ist Ziel A erreicht. Nach M8 können Marktplatz und bestehende P4-Produktintegrationen teilweise parallel laufen; KI-Live-Calls brauchen zuvor die passenden geprüften Audiopfade. Ziel B setzt den gemeinsamen Abschluss aller P4-Pakete voraus; anschließend folgt die konkretisierte Phase 5 für Ziel C.

Ein belastbarer Kalenderplan entsteht nach T1 aus dem bestätigten Restumfang, dem festgelegten Releaseumfang A, verfügbarer Entwicklung/Fachprüfung, Betreiberentscheidungen, Konten/Anbietern und der Geräte-/Beta-Besetzung. Danach erhält jedes Paket Aufwand, verantwortliche Person, Abhängigkeiten und Terminfenster. Beta-Beobachtungsfenster und die 72-h-Launchphase müssen tatsächlich verstreichen.

## 5. Der unmittelbar nächste Auftrag

1. **Erledigt:** M1-Integration über PR #165 (16.11.2026) und T1-Einzeltriage samt Review (27.11.2026).
2. **Entwicklung:** T2–T6 aus der [priorisierten Einzeltriage](../quality/m2-befunde/triage.md#folgepakete) aufnehmen. T2 beginnt mit P3-06.03/.04, T3 mit S12-01.02 und S12-09.01, T4 mit P3-12.03/.04 und T5 mit P3-15.07 sowie P3-17.02. T6 startet mit P3-24.05 für geteilte Notation und P4-02.18 für die Satzwiederholung. Die sechs Liga-/Rush-Auth-UI-Fälle bleiben eigenständig.
3. **Claude:** Parallel mit Quellen-/Konventions-/Fachprüfung der Stufen 1–2 beginnen und den getrennten zweiten Durchgang einplanen.
4. **Phillip mit Beratung:** Betreiber-/Namens-/Preis-/Gebühren-/Altersentscheidungen abschließen, rechtliche Prüfungen beauftragen sowie Anbieter-/Storekonten und die Geräte-/Testpersonenbesetzung vorbereiten.
5. **Gemeinsam:** Ziel-A-Umfang festhalten und nach T1 daraus den ersten belastbaren Umsetzungs- und Abnahmezeitplan ableiten.

Für jedes erledigte Paket werden Code-/Inhaltsstand, durchgeführte Prüfungen, Ergebnis, verantwortliche Abnahme und verbleibende Grenzen festgehalten. Offene Abnahmen bleiben offen. M2-Arbeitsgruppen, Releasevoraussetzungen und Nachweisfelder werden nicht zu einer gemeinsamen Fehlerzahl addiert.

## Quellen des Plans

- [Phasenübersicht](README.md), [Phase 4](phase-4-v2.md), [Phase 5](phase-5-vision.md)
- [Gemeinsamer M1-Stand](integration-m1.md), [Prüfnachweise des Kandidaten](../quality/m1-integration/validation.json), [M2-Befundregister](befundregister.md)
- [Fachprüfung Phase 3](fachpruefung-phase-3.md), [Phase 4 v2](fachpruefung-phase-4-v2.md), [Phase 4 v3](fachpruefung-phase-4-v3.md)
- [Offene Entscheidungen](offene-fragen.md), [Fachprüfungszuständigkeit ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md)
- [Recht und Compliance](recht-und-compliance.md), [geschlossene Beta](geschlossene-beta.md), [Launch und Betrieb](launch-betrieb.md)
- [P2-Abschluss und Einzelabnahmen](p2-abschluss.md), [Abo-/Anbieterabnahmen](abos-revenuecat.md). Die verlinkten Einzelchecklisten bleiben für ihren jeweiligen Umfang maßgeblich.
- Reproduzierbarer Status: `pnpm p2:status`, `pnpm check:beta`, `pnpm check:ai --scope general` (zusätzlich mit `--scope school` und `--scope certificates`), `pnpm check:certificates`, `pnpm check:content`.

Die technischen Messwerte stammen aus dem nachgewiesenen M1-Kandidaten `f2472a3`. Für diese Fortschreibung wurden dessen Nachweise, das Befundregister, die Phasen-/Entscheidungspläne und der aktuelle GitHub-Stand gelesen; es wurden keine neuen Laufzeitabnahmen behauptet. Stand 16.11.2026; seit dem Merge von PR #165 steht `main` auf `688de50`. Diese Fortschreibung ändert ausschließlich die Planung; sie implementiert keine weiteren Produktfunktionen und erteilt keine Inhalts- oder Veröffentlichungsfreigabe.
