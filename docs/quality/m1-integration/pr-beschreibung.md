# M1: acht technische Entwürfe gemeinsam integrieren und Befundregister aufbauen

## Arbeitsschritt

M1 und Beginn von M2 aus `docs/plan/fertigstellung.md`, Basis `main@ab157e81`.

## Was ändert sich?

Die bisher unabhängig geprüften Entwürfe #151 und #156–#162 liegen erstmals gemeinsam vor: Schul-Auth/Widerruf, Tutor-Signatur/Replays/Budget, transitive Prüfwertbindung, reine Zertifikatsansichten, ausdrücklich lokale Zahlungssimulation, Chor-Zeitzuordnung, Cantus-Erklärung und Zeitreise-Hilfen. Die Konfliktauflösung erhält insbesondere #158s schreibgeschützte Lesesnapshots zusammen mit #159s Zahlungssperre und ausdrücklicher Simulation. Lese-/Importtests verwenden die neue explizite Testfähigkeit und ausschließlich die Simulationsroute.

Sechs zusätzliche Änderungsproben entwerten KI-Prüfblätter bei Änderungen an den neu zusammengeführten Schul-, Tutor-, Zahlungs-, Chor-, Kontrapunkt- und Zeitreisemodulen. Alle ursprünglichen Testgruppen bleiben registriert; der eigene Zertifikatstest führt jetzt ebenfalls die Leseprüfungen aus. Der Fertigstellungsplan, ein Befundregister mit 65 Arbeitsgruppen und das hashgebundene Verzeichnis aller 33 Rohberichte sind verlinkt. Historische Befunde bleiben bis zu ihrer aktuellen Einzeltriage offen; bereits enthaltene Korrekturen werden mit Commit-/Code-/Testbezug ausgewiesen.

Abhängigkeiten #152–#155 bleiben begründet außerhalb dieses Kandidaten. Vollständige Herkunft, Konfliktauflösung, Entscheidungen, lokale Nachweise und Grenzen: `docs/plan/integration-m1.md`; API-Stand der ursprünglichen PRs: `docs/quality/m1-integration/pr-status.json`.

## Wie wurde es geprüft?

Aktuelle maschinenlesbare lokale Ergebnisse: `docs/quality/m1-integration/validation.json`. Die ursprünglichen acht Heads haben je fünf grüne Jobs; es liegen dort keine abgegebenen Reviews vor. Das ist kein CI- oder Reviewnachweis des gemeinsamen Kandidaten.

Lokal bestanden: vollständiges Lint/Typen/Format und die Inhalts-/Sprach-/Vorbereitungsprüfungen, 3.863 Pakettests, 809 App-Tests in 107 Suites, 365 Werkzeugtests plus elf abschließende Importbindungstests (sechs zusätzliche Fälle; 371 unterschiedliche Fälle), 603 allgemeine und 150 Schul-pgTAP-Prüfungen, 87 Schultests, die vollständigen öffentlichen/internen CI-HTTP-Abläufe, Deno und 1.470 simulierte Batchdialoge. 160 Browserfälle bestehen; der tatsächliche Produktions-Export enthält elf JavaScript-Dateien ohne Entwurfstexte/-IDs und hält die Größenbudgets ein. Die privaten Prüfmappen sind nach der letzten Änderung der gebundenen Zweckbeschreibung neu erzeugt; Releasegates bleiben geschlossen.

- [ ] Alle fünf erforderlichen GitHub-Jobs am endgültigen gemeinsamen PR-Head erfolgreich
- [ ] Vorgesehene unabhängige Reviews abgeschlossen
- [ ] Reale iOS-/Android-/Audio-/Screenreaderabnahmen für den vorgesehenen Releaseumfang

Keine Testassertions, Pflichtjobs oder Zeitgrenzen abgeschwächt. Zeitüberschreitungen unter paralleler Cloudlast werden im lokalen Nachweis getrennt von seriellen Nachtests ausgewiesen. Lokale Browserproben nutzen ausdrücklich `/usr/bin/chromium`. Die lokale Docker-Aufrufhilfe betrifft ausschließlich den Proxy für unveränderte Loopback-Healthchecks und ist nicht Bestandteil des PRs.

Die Standard-Web-Suite behält neun vorhandene bedingte Auslassungen: sechs optionale Liga-/Rush-Auth-UI-Fälle und drei Chor-Produktionsfälle. Die sechs optionalen Auth-UI-Fälle bleiben ohne Browsernachweis; Chor/Zeitreise werden zusätzlich in sechs Produktionsfällen geprüft.

## Definition of Done und Grenzen

- [x] Eigener Arbeitsbranch; Dokumentation und vorhandene ADRs erhalten
- [x] Gemeinsame Konfliktauflösung mit erhaltenen Regressionsprüfungen
- [x] Alle neuen Oberflächentexte aus den Einzelentwürfen DE/en-US/en-GB vorhanden
- [ ] M1 formal abgeschlossen: Gesamt-CI und unabhängige Reviews fehlen bis zur PR-Abnahme
- [ ] M2 abgeschlossen: vollständige Einzeltriage und bestätigte Restkorrekturen fehlen
- [ ] Produkt-/Releaseabnahmen abgeschlossen

Alle Inhalte bleiben `entwurf`; öffentlich null freigegebene Lektionen. Kein Deployment, keine echte Zahlung, keine gültigen Zertifikate und keine neue Rechts- oder Anbieterfreigabe. P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt. Frische private Prüfmappen sind technische Arbeitsunterlagen; Dokumenthashes beweisen keine Echtheit einer unabhängigen Rechtsprüfung.

## Fachliche Prüfung

Die bisherigen Fachprüfungen bleiben erhalten. #161 verwendet vorhandene Modell-/`tonal`-Gegenrechnungen und liest die tatsächlichen Cantus-Schlussnoten; Generator und Regeln bleiben unverändert. #162s neue Hinweise benötigen einen getrennten didaktischen/Fach-/Sprachdurchgang. Diese Integration behauptet weder neue Primärliteraturlektüre noch die unabhängige Freigabe nach ADR 0005. Reale Stimmen, Geräte, Live-Modellqualität und schriftliche rechtliche Einordnungen bleiben offen.
