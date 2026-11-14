# P4.18 – Zahlungsgrenze für den internen Zertifikatsentwurf

Stand: 14.11.2026 · Branch `codex/certificate-payment-boundary-draft` · eigenständige Basis `main` bei `ab157e8`.

Befund **N5** aus der [v3-Prüfung](../quality/fachpruefung-phase-4-v3/ki-zertifikate.md) wird als technischer Entwurf bearbeitet: Der Client kann außerhalb einer ausdrücklich aktivierten lokalen Simulation keine Zahlungsfreigabe erteilen. **Technische P4-Vorarbeit vor der formalen Phase-4-Freigabe.** Keine Veröffentlichung, echte Zahlung, gültigen Zertifikate oder Main-Integration. P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt. [ADR 0080](../decisions/0080-zertifikatszahlungen-nur-explizit-lokal-simulieren.md).

## Bedienung

```sh
corepack pnpm certificates:preview
```

Dieser Standardmodus öffnet nur die interne Werkstatt auf Loopback (`http://127.0.0.1:8237`). Zahlungen sind `unavailable`: keine neuen Bestellungen, keine Testfreischaltung, keine Aufgaben oder Muster-PDFs aus gespeicherten simulierten Zahlungen. Vorhandene eigene Durchgänge bleiben als nicht verfügbare Testdaten sichtbar. Export und Löschung bleiben mit gültiger Testsitzung möglich.

Für den ausdrücklich beauftragten synthetischen Gesamtablauf:

```sh
corepack pnpm certificates:preview:simulation
```

Nur dieser getrennte Aufruf setzt `--simulate-payments`. Er erzeugt beim Serverstart eine nicht serialisierbare lokale Fähigkeit. Der Service-/Server-Standard bleibt gesperrt; ein `true`, JSON-Objekt, Requestheader oder `paymentMode` aus dem Browser genügt nicht. `APP_VARIANT=production`, unbekannte App-Varianten und `NODE_ENV=production` verhindern die Simulation, auch bei einem Kontextwechsel nach dem Start. Der Standardmodus ist dadurch weiterhin keine freigegebene Produktionsbereitstellung. Andere Konfigurationsfelder oder CLI-Flags, auch vermeintliche Live-/Anbieteroptionen, werden vor dem Öffnen der Datenbank abgewiesen.

Im Simulator bleibt der [Gesamtablauf](ki-und-zertifikate-gesamtstand.md#p418-vollständiger-lokaler-ablauf) mit Bestellung, Abbruch, Testzahlung, Prüfung, Muster-PDF, Wiederholung und Testerstattung erhalten. Die Oberfläche kennzeichnet die Simulation in DE/en-US/en-GB; keine Preise, externen Zahlungsaufrufe oder gültigen Qualifikationsnachweise.

## Vertrauensgrenze und Altdaten

| Vorgang | Standardmodus | Ausdrückliche lokale Simulation |
|---|---|---|
| `/api/order`, `/api/start` | keine Freischaltung, HTTP 503 | eigene passende Testbestellung erforderlich |
| `/api/settle`, `/api/refund` | HTTP 404 | ebenfalls HTTP 404 |
| `/api/simulation/settle`, `/api/simulation/refund` | HTTP 404 | synthetische, sitzungsgebundene Vorgänge |
| gespeicherte simulierte Zahlung | keine Berechtigung | nur aktuelle v2-Policy, eigenes Profil und passende Bindung |
| Muster-PDF und Codeprüfung | keine neue PDF, Code nicht als aktuelles Muster bestätigt | bestehende Prüfung von Quelle, Ergebnis, Eigentum und Widerruf |
| eigene Testdaten | exportierbar und löschbar | exportierbar und löschbar |

Die Policy lautet jetzt `certificate-local-simulation-v2`. v1-Bestellungen können weder nachbezahlt noch zur neuen Testprüfung verwendet werden; sie bleiben exportierbar und löschbar. Die Oberfläche bietet für sie keine Zahlungs-/Erstattungsaktionen an und legt für einen neuen Testdurchgang eine neue Bestellung an. Die geänderte Codebindung sperrt alte Durchgänge wie bisher; Prüfmappen und schriftliche Übergaben müssen zum neuen Stand neu erzeugt werden.

Ein reiner Moduswechsel bei unverändertem Code und v2-Bindung ist davon getrennt: `unavailable` liefert keine Aufgaben oder Auswertung und schreibt allein deshalb keine dauerhafte Invalidierung. Nach erneutem ausdrücklichem Aktivieren kann ein weiterhin gültiger Testdurchgang wieder aufgenommen werden. Serverfrist, Aufbewahrung, Sitzungsablauf und echte veraltete/beschädigte Daten gelten weiterhin. Export im gesperrten Modus enthält eigene abgegebene Antworten und Bestellungen, aber kein erneut bestätigtes Ergebnis.

## Prüfung und Integrationsgrenzen

- Sechs neue Regressionstests reproduzierten zuerst die bisherige Clientfreigabe. Insgesamt 14 neue Node-Prüfungen decken gesperrte Standardfabriken, entfernte allgemeine Endpunkte, manipulierte Payloads/Header, gefälschte Fähigkeiten, nicht implementierte Anbieter, Eigentum, gleichzeitige Wiederholungen, v1-Altdaten, Moduswechsel sowie CLI-/Produktionskontexte ab.
- Die 38 vorhandenen Zertifikatsprüfungen verwenden ausdrücklich benannte Testfabriken. Die Erstattung während einer laufenden PDF-Erzeugung wird zusätzlich auf erfolgreiche Erstattung geprüft. Ergebnis lokal: 52/52 Node-Prüfungen.
- Sechs zusätzliche Browserabläufe prüfen Standardmodus, Datenrechte, alte Bestellungen und die ausdrücklich aktivierte Simulation in allen drei Sprachfassungen mit schmalem Layout und Axe. Zusammen mit den vorhandenen Prüfungen umfasst die private Browser-Suite 22 Abläufe. Konkrete Ergebnisse sowie die fünf erforderlichen CI-Jobs am endgültigen Commit stehen im Entwurfs-PR.
- Kein Merge anderer offener Entwürfe: Schulnacharbeit #151, Tutor #156, Importbindung #157 und lesende Zertifikatsansichten #158 sind separate PRs. Insbesondere ist N4s Trennung der Leser-/Schreibtransaktionen hier nicht enthalten. Bei gemeinsamer Integration die neue Zahlungs-Policy, Modusprüfung und die separate Lesearchitektur erhalten, gebundene Prüfmappen danach neu erzeugen.

Die Fachprüfungen vom 31.10. und 05.11.2026 bleiben dokumentierte Vorarbeiten. Diese technische Änderung ersetzt keine neue unabhängige Fach-/Quellen-/Sprachprüfung, Rechts-/Anbieterprüfung oder reale Geräte-/Screenreaderabnahme. N3 bleibt unverändert: Ein Dateihash bestätigt weder Echtheit noch juristische Richtigkeit. Echte Identität, Zahlungsdienst und authentifizierte serverseitige Zahlungsbestätigung sind weiterhin offen. Alle tatsächlichen KI-/Zertifikatsfreigaben bleiben gesperrt, alle Inhalte Entwurf und der öffentliche Katalog leer.
