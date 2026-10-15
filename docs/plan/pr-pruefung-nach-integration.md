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
