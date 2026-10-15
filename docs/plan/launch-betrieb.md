# Launch und Betrieb – P2.26

Stand: 15.10.2026. Technische Vorbereitung, kein Produktivstart. [ADR 0027](../decisions/0027-release-mit-pruefbelegen.md).

## Kandidat und Startprüfung

`pnpm p2:status` zählt die fehlenden Voraussetzungen; `pnpm p2:status --json` listet sie einzeln, ohne Freigabe zu behaupten. `tools/release/readiness.json` enthält absichtlich keine erfundenen Produktions-IDs, Kostenbudgets oder Genehmigungen. Belegreferenzen müssen auf tatsächlich geprüfte Protokolle zeigen; ein gesetztes Flag allein ist keine menschliche Abnahme.

Vor dem Start müssen die Store-/Rechts-/Gerätegates, alle Inhalte der Stufen 1–2, die echte Beta, aktuelle echte Tutor-Kalibrierung mit mindestens 98 %, Anbieter-/Kündigungsabnahme, Push/OTA, Backup/Restore, Crashmonitoring, Support und Rückrollprobe nachgewiesen sein. Nach Promptänderungen zählt eine ältere Kalibrierung nicht mehr. Betreiber, geprüfte Rechtstexte, Name/Domain und reale Preise fehlen noch. „Harmonia“ ist Phillips gewünschter Name unter dem Vorbehalt der Verfügbarkeit; Marken-/Store-/Domainprüfung ist nicht erfolgt.

Nach geprüftem PR-Merge den sauberen `main`-Commit auschecken. In der bestätigten Produktionsumgebung:

```sh
APP_VARIANT=production pnpm p2:release --pr <gemergter-PR> --study <echtes-Beta-Journal> --tutor-evaluation <echte-Auswertung> --media <native-Medienbelege>
```

Argumente mit den tatsächlichen privaten Nachweisen befüllen. Der Befehl liest GitHub-PR und erforderliche Check-Runs des exakten Commits; fehlende API-Verbindung, unerfüllte GitHub-Reviewregeln oder Checks blockieren. Ist im Repository kein Review vorgeschrieben, wird dafür keine zusätzliche Genehmigung verlangt. Er führt weder Build noch Deployment, Einreichung, Merge oder Kauf aus. P2.24 und P2.25 sind noch ungemergte Vorgänger; diese Branch-Kette zuerst über ihre PRs integrieren. Keine direkte Main-Integration und keine Löschung fremder Branches.

## Produktionsbereitstellung und Rollout

1. Verantwortlichen Betreiber, Supportdienst und Vertretung festlegen; rechtlich freigegebene Datenverarbeitung/Verträge, Domain und reale Providerbindungen vervollständigen. Preise ausschließlich aus bestätigten Store-Angeboten übernehmen. Max bleibt bis zur tatsächlichen Kalibrierung und Kostenfreigabe geschlossen.
2. Supabase-Backup sichern und eine Wiederherstellung auf einem getrennten Testprojekt tatsächlich proben. Die drei neuen Migrationen erst nach Review additiv bereitstellen; Functions samt gebundenen Secrets zuerst in Staging prüfen. Keine Produktionsdatenbank zurücksetzen. Vault-Geheimnisse, Löschfristen, Providersecrets und Schlüsselrotation gesondert berücksichtigen.
3. Produktionskatalog und öffentliche Übersetzungen bauen; interne Entwürfe bleiben draußen. Website/Expo-Export mit passenden COOP/COEP-, Cache- und Sicherheitsheadern auf dem bestätigten HTTPS-Host bereitstellen. `/auth/callback` zum App-Entry routen und ohne Query-Logs/Tracking ausliefern. Keine QA-Fixture oder Beta-Zugangsdatei öffentlich hochladen.
4. Signierte EAS-Produktionsbuilds auf dem freigegebenen Commit erstellen und auf Geräten prüfen. Das Android-Submitprofil wählt `production` mit `releaseStatus: draft`; es startet keinen automatischen Rollout. iOS-App-ID/ASC-Bindung und reale Unterlagen ergänzen. Einreichung und gestaffelte Veröffentlichung in den Konsolen nach Review manuell steuern. Erst begrenzte Auslieferung, bei gesunden echten Messungen ausweiten. Keine ungetestete native Änderung per OTA übertragen.
5. Reale Store- und Web-URLs, Commit, Zeitpunkt und diensthabende Person ins private Launchjournal aufnehmen. Kein aktuell vorhandener Bericht beweist diese Schritte.

## Monitoring und Alarme

`OPS_METRICS_ENABLED` ist standardmäßig aus. Nach Rechts-/Betriebsprüfung aktiviert der Betreiber es in den Functions für `learning-sync`, `tutor` und `billing-webhook`. Aggregation: feste Service-ID, HTTP-Klasse, Anzahl und Header-Antwortdauer pro UTC-Minute; rollierende Löschung nach 30 Tagen beim nächsten Write. Keine Konten, Texte, Header oder URLs. Die Dauer eines SSE-Headers ist keine vollständige Tutor-Latenz. Messfehler dürfen die Originalantwort nicht verändern; fehlende Samples bleiben möglich.

`pnpm operations:monitor --local --check` liest nur die lokale Supabase. Für einen privaten Produktionslauf `HARMONIA_OPERATIONS_URL` und `HARMONIA_OPERATIONS_SERVICE_ROLE_KEY` ausschließlich serverseitig binden und `--remote --check` verwenden; der Ursprung muss der bestätigten Produktionskonfiguration entsprechen. Das JSON bleibt privat. Der Service-Schlüssel gehört niemals in Browser, App oder öffentliche CI-Artefakte.

| Signal | Verhalten |
| --- | --- |
| Sync-5xx | Alarm oberhalb 1 % bei mindestens 100 beobachteten 2xx/3xx/5xx; 4xx separat, kleine Stichprobe unbekannt |
| Tutor-Kosten | Tageskosten plus Reservierungen mit exakten Nano-USD gegen das vom Betreiber festgelegte Budget |
| Tutor-Fehler | Warnung für fehlgeschlagene Requests in der letzten Stunde |
| Billing | Alarm für unbearbeitete Ereignisse älter als eine Stunde |
| Externe Löschung | Alarm für offene Bearbeitung älter als einen Tag |
| Native Crashes | Durch diesen Bericht nicht gemessen; separate reale Crash-/Store-Belege und Drill nötig |

Exitcodes: 0 keine gemeldeten Serverprobleme, 1 kritisches Signal, 2 unbekannte Messlage. Ein Nullwert ohne Beobachtungen ist kein Gesundheitsnachweis. Der Runner versendet keine Benachrichtigungen. Vor Start muss der Betreiber den privaten Scheduler und einen realen Alarmkanal anbinden und Empfang/Vertretung testen; Credentials/Empfänger fehlen derzeit. Der bestehende datenschutzgebundene Analytics-Dienst bleibt separat standardmäßig aus.

## Support und Störungen

`packages/i18n/src/support.json` enthält DE/EN-Vorlagen für Eingang, Reproduktion, Abonnement, Datenschutz, Störung und bestätigte Lösung. `supportReply` in `tools/release/support.mjs` rendert begrenzte Platzhalter und verlangt für „gelöst“ einen tatsächlichen Build-/Prüfbeleg. Kein automatischer Versand. Betreiber und Supportadresse müssen die Texte vor Einsatz prüfen.

Bei Eingang ein privates Ticket und eine ID anlegen; nur notwendige Plattform-/Build-/Reproduktionsdaten erfragen. Keine Passwörter, OTPs, Zahlungsdetails oder vollständigen Lern-/Chatverläufe anfordern. Zugang und Datenlöschung separat authentifizieren. Abofragen an die bestätigten Anbieterwege führen; keine erfolgte Erstattung/Kündigung oder externe Löschung ohne tatsächlichen Nachweis versprechen. Bei Störungen Schwere, Auswirkung, Zuständigkeit, Tracking und nächsten Prüfzeitpunkt festhalten. Kritische offene Störungen blockieren Abschluss und weitere Ausrollung.

Bei Fehlern Rollout pausieren, echte betroffene Version identifizieren und zuvor geprüften Web-/OTA-Kandidaten wiederherstellen. Backend-Abwärtskompatibilität erhalten; Schema-Rollback nie durch destruktiven Reset ersetzen. Bei Kosten-/Kauf-/Push-Störungen entsprechende Serverflags und Kontingente kontrolliert sperren. Wiederherstellung und Kundenwirkung nachweisen, dann gestuft fortsetzen. Das konkrete Staging-Rollback und Restore sind noch nicht abgenommen.

## Tatsächliche 72 Stunden und Rückblick

`tools/release/observation.example.json` in einen privaten, nicht veröffentlichten Arbeitsbereich kopieren. Echte Zeitpunkte, Store/Web-Belege und Beobachtungen nach 0/1/6/12/24/48/72 Stunden eintragen. Jeweils Serverbericht, native Crashes, Käufe/Kündigungen, Zustellung und Supportlage prüfen; Beobachtungen dürfen nicht vor ihrem Zeitpunkt oder nachträglich als zeitgerecht erfunden werden. Incidents erhalten Verantwortliche, Tracking und bei Lösung einen echten Prüfbeleg.

```sh
pnpm release:observe --journal <privates-echtes-Launchjournal>
```

Vor 72 tatsächlich verstrichenen Stunden kann dieser Abschluss nicht bestehen. Anschließend reale Beta-/Launch-Kennzahlen mit Nennern, Kosten, Fehlern und Nutzerfeedback auswerten; Rückblick schreiben und `phase-3-ausbau.md` begründet anpassen. Die Vorlage lässt beides offen. Die echte Freigabe und der tatsächliche Betrieb sind keine durch lokale Tests erfüllbaren Schritte.
