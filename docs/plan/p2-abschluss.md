# Phase 2 – Abschlussstand und konkrete Restarbeit

Stand: 15.10.2026. **P2 ist noch nicht als öffentliche Version abgeschlossen.** Der Auftrag, alles fertigzubauen, umfasst hier die verbleibenden technischen Funktionen und überprüfbare Start-/Betriebswerkzeuge. Tatsächliche Rechtsfreigaben, Fachprüfung, Anbieterbindungen, Geräte, Menschen und verstrichene Betriebszeit werden nicht simuliert als erledigt markiert.

Phillip möchte den Namen **Harmonia**, wenn verfügbar. Betreiber/Rechtsform, Adresse, Support-E-Mail, Domain und geprüfte Rechtstexte sind weiterhin offen. Der Name bleibt Arbeitsname; keine bestätigte Marken-/Store-/Domainverfügbarkeit. Die bisherigen Entscheidungen zu 80 % Erstversuch, Gastmeldungen, Münzen, regenerierenden Herzen, zwölf Monaten Detaildaten, Supabase-Analytics und späteren realen Monat-/Jahrespreisen gelten weiter.

| Punkt | Vorhandene technische Arbeit | Tatsächlicher Abschluss noch erforderlich |
| --- | --- | --- |
| P2.01 | E-Mail/Gast, Alter, PKCE Apple/Google, Apple-Grant/Widerruf, Export/Löschung | Auth/SMTP/Relay/Provider und alle Plattformen, Apple-Policy, externe Löschung |
| P2.02 | Musik-/UI-Präferenzen, Name, lokale Warteschlange, kontogebundene Feldsynchronisation | Echte Gerätewechsel/Audio/Neustarts |
| P2.03 | Kanonische Lern-Outbox, RLS, Serverprüfung, XP/Streak, Duplikatschutz | 50 vollständige Offline-Lektionen auf echten Geräten |
| P2.04 | Versionierte Pipeline und öffentliche Filter, OTA-Konfiguration | Gebundenes EAS-Projekt und echter OTA-Nachweis |
| P2.05 | 90 Fähigkeiten, 29 Einheiten und geprüfter Graph | Separater fachlicher Claude-Durchgang |
| P2.06 | 19 Übungstypen mit Engine-Auswertung | Fachliche und native Geräteabnahme |
| P2.07 | Stufe 1 vollständig als Entwurf DE/US/UK | Getrennte fachliche Freigabe |
| P2.08 | Stufe 2 vollständig als Entwurf DE/US/UK | Getrennte fachliche Freigabe |
| P2.09 | Acht Onboardingansichten, Gast und Konto | Echte Erstnutzer-/Geräteprüfung |
| P2.10 | Adaptive Einstufung, Replay und Wiederaufnahme | Fachliche/empirische Einstufungsabnahme |
| P2.11 | Lernpfad, Voraussetzungen und 80-%-Regel | Freigegebene Inhalte und Geräteprüfung |
| P2.12 | Einführung, Lektion, Wiederholung, Wiederaufnahme | Reale Lern-/Offline-Abnahme |
| P2.13 | Feedback/Erklärungen, Meldungen und Gastübernahme | Fachlicher Durchgang und betreuter Meldeeingang |
| P2.14 | Streak, XP, Münzen, Tagesziel, Reminderadapter | Tatsächliche native Push-Zustellung und Scheduler |
| P2.15 | Tutor-Backend, Engine-Werkzeuge, reservierte Kosten | Modell-/Tarif-/Secretbindung und tatsächliche Kosten |
| P2.16 | 714 interne Abschnitte, Quellen und getrennte Indexe | Fachfreigabe und echte Quellenantworten |
| P2.17 | Streaming-Tutor und Aufgaben-/Musikpräferenzen | Echtes Modell und native Streaming-/Audioprüfung |
| P2.18 | 245 Fälle/735 Sprachfassungen, technische Simulation | Getrennte Claude-Urteile, aktueller echter Lauf ≥98 %, Prompt v3 |
| P2.19 | RevenueCat-SDK/Webhook und Pakete | Produkte/Preise, reale Sandboxkäufe/-wiederherstellung, Small-Business-Antrag |
| P2.20 | Lernenergie, Paywall und Kündigungseingang | Reale Käufe/Kündigungsbearbeitung, Rechtsfreigabe |
| P2.21 | Consent, Export/Löschung und zwölfmonatige Kürzung | Betreiber, geprüfte Texte, Verträge und Storeformulare |
| P2.22 | Privates Supabase-Dashboard, Erfassung aus | Rechtsfreigabe, tatsächliche Daten und Kennzahlen |
| P2.23 | Web-axe/Tastatur/Build-/Timingwachen | Vier physische Geräte, VoiceOver/TalkBack, Akustik <50 ms |
| P2.24 | Website, Storetexte, echte Web-Referenzmedien | Name/Domain/Betreiber, native Storemedien, Freigabe |
| P2.25 | Geschützter Kandidat, Studienjournal und Auswertung | 30–100 echte Testpersonen und abgeschlossene echte Beta |
| P2.26 | Zentraler Preflight, Betriebsbericht, Supportvorlagen, 72-h-Journal | Produktivbereitstellung, Alarmkanal, Rollout, 72 echte Stunden und Rückblick |

Die 85 Lektionen mit 850 Aufgaben bleiben Entwurf, öffentlich sind weiterhin **null Lektionen** freigegeben. Nach ADR 0005 muss Claude Code die fachliche Prüfung in getrenntem Kontext mit Literatur durchführen. Diese Arbeit ist nicht durch lokale Engine- oder Browserprüfungen ersetzt. Phase 3/4 enthalten weitere Besetzungen, Chor-/Orchesterarbeit und anspruchsvolle Mehrstimmigkeit; diese gehören nicht automatisch zum MVP.

## Reihenfolge zum tatsächlichen Abschluss

1. **Phillip/Betreiber:** Angaben und Name/Domain klären; geprüfte Rechtstexte/Verträge, Anbieter-/Storekonten, reale Produktpreise und Betriebsbudget bereitstellen. Secrets ausschließlich in Umgebung/Providerkonsole.
2. **Claude Code/Fachprüfung:** alle Inhalte und Tutor-Katalog getrennt prüfen, tatsächliche Urteile dokumentieren, erst dann fachlich freigeben. Produktionskatalog/Index neu erzeugen.
3. **Technische Integration:** P2.24 → P2.25 → P2-Abschluss über konkrete PRs, erforderliche grüne CI und Reviews. `main` nicht direkt pushen. Die PRs sind erstellt: [P2.24 #80](https://github.com/PhiFa96/harmonia/pull/80), [P2.25 #81](https://github.com/PhiFa96/harmonia/pull/81), [P2-Abschluss #79](https://github.com/PhiFa96/harmonia/pull/79). CI/Review-Status ist dort maßgeblich; ausschließlich mit erfolgreichen erforderlichen Checks integrieren. Ausführliche CI-Logs über `productionresultssa10.blob.core.windows.net` waren noch gesperrt; der zusätzliche Host ist im Umgebungsentwurf gespeichert und muss geprüft/gespeichert/veröffentlicht werden.
4. **Betreiber/Entwicklung:** Staging mit realen Auth-, Apple-Grant-, RevenueCat-, Modell-/Tarif-, EAS-, SMTP-/Push- und Betriebsbindungen aufsetzen. Vier Geräte, Backup/Restore, Rollback und Alarmempfang tatsächlich prüfen. Kein Live-Aufruf erfolgte in dieser Umsetzung.
5. **Betreiber/Testleitung:** geschützte echte Beta starten, Feedback und Kennzahlen erheben, Fehler beheben und Abschlussbedingungen nachweisen. Niemand wurde automatisch eingeladen.
6. **Releaseverantwortliche:** Preflight nach [Launch und Betrieb](launch-betrieb.md), Store-/Web-Veröffentlichung und tatsächliche 72-h-Beobachtung, danach Rückblick und begründete Phase-3-Anpassung.

## Lokale Nachweise

Die wiederholbaren Befehle stehen in [Konten und Einstellungen](konten-und-einstellungen.md) und [Launch und Betrieb](launch-betrieb.md). `p2:status` zeigt offene Voraussetzungen; `p2:release`, echte Beta-/Store-/Rechtsgates und 72-h-Abschluss müssen im aktuellen Stand geschlossen bleiben. Tests mit HTTP-Attrappen und synthetischen Journaleinträgen belegen ausschließlich die Mechanik.

Prüfstand dieses Arbeitsbranches:

- `pnpm test`: 2.998 bestandene Tests (davon 552 App-Tests in 71 Dateien; Werkzeuggruppen 101 und 38). Die 552 App-Tests bestehen zusätzlich mit auf 2 GB begrenztem Heap und 1 GB Worker-Neustartgrenze. Der Testrunner meldet GitHub Fehler direkt als Annotationen. Danach zwei zusätzliche CI-Diagnoseprüfungen bestanden; der diagnostische Runner gibt ausschließlich feste Fehlerklassen und Containerzustände aus, niemals Startup-Logzeilen oder Schlüssel.
- `pnpm db:test`: 328 bestandene pgTAP-Prüfungen, einschließlich Apple-Vault/Rotation/Kaskade und privater Betriebsmetriken. Zusätzlich kompletter Neuaufbau aus allen Migrationen und dieselben 328 Prüfungen auf einer getrennten frischen Testdatenbank bestanden. Eine alte Retentionsmigration wurde für beide PostgreSQL-Constraintnamen korrigiert. Die beiden temporären Test-Stacks sind anschließend entfernt; die bestehende Entwicklungsdatenbank wurde nicht zurückgesetzt.
- Lokale Auth-/Profil-/Datenschutz-/Lern-API bestanden: echter lokaler E-Mail-Code für neue und bestehende Konten, atomare Profiländerungen/Kontentrennung, 104 Datenschutzprüfungen und 226 Offline-Lernversuche mit zwei Clients. Eigene Testdaten bereinigt, keine externen E-Mails/Provideraktionen.
- 17 Web-E2E/axe-Prüfungen und fünf geschützte Beta-Web-Prüfungen bestanden. Auch Codeentfernung aus fehlerhafter Rückleitung und bestätigte SQLite-Speicherung vor Neustart geprüft. Lokales Chromium-Start-P95 etwa 1,42 s, Lektionsöffnung-P95 etwa 0,26 s; kein physisches Gerät und keine akustische Messung.
- ESLint, Typen, Prettier, Deno-/SDK-Prüfungen sowie Übersetzungen, Inhalte, Fähigkeitsgraph, Tutor-Katalog und geschlossene Rechts-/Store-/Beta-Vorbereitung geprüft. Beim letzten lokalen Preflight 129 offene Startvoraussetzungen; Release- und 72-h-Gate scheitern erwartungsgemäß.

Die frühere überlastete Parallelprüfung überschritt Zeitbudgets; eine Wiederholung ohne parallele Builds besteht mit unveränderten Grenzen. Während der Prüfung gefundene Rückleitungs-/Speicherfehler sind korrigiert und nachgeprüft. Diese lokalen Ergebnisse sind keine GitHub-CI-/Review- oder echte Anbieter-/Geräte-/Launchfreigabe. Branch `codex/p2-completion` baut auf P2.25-Commit `067e56f994d230d0d3cec9e90d4dce9db135afb5` auf; Integration ist ausschließlich über tatsächliche PRs mit erfolgreicher erforderlicher CI und Reviews vorgesehen.
