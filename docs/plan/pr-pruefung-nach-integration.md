# PR-Ablauf und Nachprüfung des integrierten Stands

Stand 15.10.2026. Phillip hat den vorgesehenen Ablauf nochmals ausdrücklich klargestellt: Arbeitsbranch, Pull Request, erfolgreiche erforderliche CI und Reviews, danach Merge über GitHub. Die Erlaubnis zum Mergen ist keine Erlaubnis, diesen Ablauf zu überspringen.

## Bereits ausgeführte Integration

P2.09–P2.23 wurden direkt nach `main` integriert. Letzter Stand vor dieser Korrektur: `ed0aa558a66d3c8d2676d2b25cd3a548ef633fbb`. Die CI-Konfiguration reagiert auch auf Pushes nach `main`; der tatsächliche Remote-Status wurde hier jedoch nicht eingesehen und vor der Integration nicht als Bedingung geprüft. Lokale Prüfergebnisse aus den Übergaben sind keine nachgewiesene grüne GitHub-CI.

Die 15 Arbeitsbranches P2.09–P2.23 wurden danach lokal und auf GitHub gelöscht. Zuvor war für jede Spitze geprüft worden, dass kein Commit gegenüber `main` fehlt. Die Löschung war bereits abgeschlossen, als Phillips Korrektur zum PR-Ablauf eintraf. Alle Commits sind weiterhin in `main` enthalten; die Branch-Spitzen stehen zusätzlich in den früheren Übergaben bzw. der Git-Historie. Die lokale Wiederherstellungsliste liegt unter `/workspace/p223-merged-branch-cleanup.json`.

Der aktuelle Korrekturbranch verändert ausschließlich Arbeitsanweisungen, PR-Checkliste und diese Dokumentation. Er wird nicht direkt nach `main` gepusht. Ein PR dieses Branches kann die vollständige vorhandene CI erneut für den aktuellen App-Stand ausführen. Er ersetzt keine rückwirkende PR-Review der bereits integrierten Änderungen.

## Nachprüfung

- Gesamten nach PR #78 hinzugekommenen Code prüfen: `git diff 421ff184e8e9d47c3e1777e52a9eddde9a938930..ed0aa558a66d3c8d2676d2b25cd3a548ef633fbb`.
- P2.23 getrennt prüfen: `git diff 328ef484b00ec1b0bd270aee10d5f83054e1c6eb..cc3cb7de617858a19738841a99534a29a0b19595`; lokale Nachweise und offene Abnahmen stehen in `qualitaets-durchgang.md`.
- Nach Öffnen des Korrektur-PRs alle erforderlichen CI-Jobs und Reviews am aktuellen Head prüfen. Fehler auf einem Arbeitsbranch beheben, vor Merge erneut prüfen.
- Musikfachliche Prüfung durch Claude, vier tatsächliche Geräte-/Akustik-/Storeabnahmen und die zuvor dokumentierten Rechts-/Anbieterfreigaben bleiben offen. Ein erfolgreicher CI-Lauf erfüllt diese Abnahmen nicht.

## Zugriffslimit

Git-Transport funktioniert. Der konfigurierte GitHub-CLI-Zugriff meldet dagegen eine fehlgeschlagene Anmeldung; `gh api repos/PhiFa96/harmonia` liefert `Forbidden`. Hier ist damit weder die automatische PR-Erstellung noch das Auslesen des CI-Status bestätigt. Keine Tokens aus Dateien auslesen, keinen Ersatzschlüssel verlangen und keinen erfolgreichen PR-/CI-Status behaupten.

## Ergebnis der Nachprüfung (15.10.2026, Claude)

Geprüft wurde der aktuelle Stand `main` = `a8ff0807572d2d9965613c3ba0d2dad2c02a9499` (nach PR #80, #81 und #79). CI-Status über die GitHub-API abgerufen.

- **Damalige Push-Läufe der direkten Integration:** `328ef48` und `ed0aa55` waren rot („Lint und Paket-Abhängigkeiten“ sowie „Lokales Supabase starten“), `46fe9fa` und `cc3cb7d` wurden abgebrochen. Der direkt integrierte Stand war also nicht grün.
- **Behoben über PRs:** PR #80, #81 und #79 mit grüner PR-CI. Der Push-Lauf auf `a8ff080` ist in allen fünf Jobs grün („Lint, Typen, Tests“, „Web-Build der App“, „Deno-Kompatibilität“, „Supabase und Profil-Zugriffsschutz“, „Tutor-Batchmechanik ohne Modellkosten“). Kein Schritt wurde übersprungen.
- **Keine abgeschwächten Prüfungen zwischen `ed0aa55` und `a8ff080`:** keine neuen `eslint-disable`, kein `.skip`/`.only`/`.todo`, keine gelöschten Testdateien, keine ignorierten Testpfade. ESLint ignoriert zusätzlich nur das erzeugte `artifacts/beta/**`; `if: always()` steht nur bei Artefakt-Uploads. Neu sind Speichergrenzen (`max-old-space-size`, `workerIdleMemoryLimit`) und ein Zeitlimit von 60 s in `level-two-complete.test.tsx`.
- **Lokal auf `a8ff080` grün:** `format:check`, `lint`, `typecheck`, `check:i18n`, `check:content`, `check:curriculum`, `check:legal`, `check:tutor:catalogue`, `test` (alle Pakete, 552 App-Tests, 143 Werkzeugtests) und `check:deno`. Supabase- und Playwright-Prüfungen nur in der CI (kein Docker in dieser Umgebung).

Nicht abgedeckt und weiter offen: eine inhaltliche Code-Review des Diffs P2.09–P2.23, die musikfachliche Prüfung nach ADR 0005, Geräte-/Akustik-/Storeabnahmen sowie Rechts- und Anbieterfreigaben.
