# ADR 0065: Anthropic-SDK 1.x (1.3.0) und API-Version 2026-10-21

Status: angenommen (31.10.2026)

## Kontext

Der Tutor (`supabase/functions/_shared/tutor-*.ts`) und die Werkzeuge (`tools/tutor-benchmark*`, `tools/knowledge-smoke.ts`) waren auf `@anthropic-ai/sdk` 0.133.0 gepinnt. Eine neuere Version durfte nur mit eigener Abnahme kommen (CLAUDE.md, ADR 0015). Dependabot schlug mit PhiFa96/harmonia#114 die Version 1.1.0 vor, änderte aber nur `package.json`. Die Deno-Importe `npm:@anthropic-ai/sdk@0.133.0` und die `paths` in den beiden tsconfig-Dateien wären unverändert geblieben, Node und Deno hätten danach verschiedene SDKs verwendet.

Ab 1.0.0 sendet das TypeScript-SDK die API-Version `2026-10-21` statt `2023-06-01`. Laut offiziellem Migrationsleitfaden (`platform.claude.com/docs/en/api/migration-2026-10-21`) bringt das diese Bruchstellen:

1. Sampling-Parameter (`temperature`, `top_p`, `top_k`) führen zu einem 400-Fehler.
2. `document`-Blöcke in `assistant`-Nachrichten führen zu einem 400-Fehler.
3. `text`-Blöcke mit `citations` in `user`-Nachrichten führen zu einem 400-Fehler.
4. In der Admin- und Analytics-API entfallen Felder.
5. Das SDK selbst ändert sich: `MessageParam` ist eine Union nach Rolle, API-Schlüssel gehen als `Authorization: Bearer`, ein Client hält genau ein Credential, und die Lizenz ist Apache 2.0.

## Entscheidung

- **Umstellung:** Root-`package.json`, alle `npm:`-Specifier und die tsconfig-`paths` stehen einheitlich auf 1.3.0. Abgenommen wurde zuerst 1.1.0; laut offiziellem Changelog bringen 1.2.0 und 1.3.0 nur neue Endpunkte (Message Threads, Nutzungsberichte, Claude Tag) und Bugfixes ohne Breaking Changes. Alle Prüfungen sind mit 1.3.0 wiederholt.
- **Bestandsaufnahme zu den Punkten 1–4:**
  - keine Sampling-Parameter;
  - Wissensdokumente nur in `user`-Nachrichten;
  - der gespeicherte Verlauf wird als reiner Text ohne `citations` zurückgegeben;
  - keine Admin- oder Analytics-API.
  Es war keine Codeänderung nötig.
- **Punkt 5:**
  - Die lokale Modellattrappe verengt Nachrichten ausdrücklich auf `UserMessageParam` und setzt das neue Pflichtfeld `Usage.speed`.
  - Der Client übergibt weiterhin nur `apiKey`. `authToken: null` und `webhookKey: null` zählen nicht als zweites Credential.
  - Der Host bleibt fest `https://api.anthropic.com`, ohne Proxy. Der Wechsel von `X-Api-Key` zu `Authorization: Bearer` braucht deshalb keine Anpassung; das Repo enthält keine Stelle, die `X-Api-Key` liest oder setzt.
- **Kein Tracing:** SDK 1.x schaltet OpenTelemetry-Spans und die Weitergabe des Trace-Kontexts (`traceparent`) standardmäßig ein und liest dafür `ANTHROPIC_OPEN_TELEMETRY*` aus der Umgebung. Tutor und Kalibrierwerkzeug setzen deshalb ausdrücklich `openTelemetry: { propagation: false, traces: false }`. Die Kurzform `false` würde nur die Spans abschalten. Damit bleibt der bisherige Grundsatz bestehen: keine SDK-Protokollierung und keine zusätzlichen Kopfzeilen. Unter den eng gesetzten Deno-Rechten der Proben hätte das SDK ohne diese Option beim Erzeugen des Clients mit `NotCapable` abgebrochen.
- **Lizenz:** Das SDK steht ab 1.0.0 unter Apache 2.0. Das Repo führt keine Lizenzliste der Abhängigkeiten, deshalb ist kein Eintrag anzupassen.

## Folgen

- **Lokal grün:**
  - `typecheck` für Functions und Tools;
  - `check:tutor` (1266 simulierte Prüfungen), `check:knowledge` (1157), `check:tutor:benchmark` (49) und `check:tutor:catalogue`;
  - `test:tools` (236 + 38).
  Alle laufen mit ersetztem Transport.
- **Nicht geprüft:**
  - kein echter API-Aufruf unter `2026-10-21`, weil eine sichere Schlüsselbindung fehlt;
  - keine Kosten- und Qualitätsmessung;
  - `db:test:tutor` läuft nur in der CI.
- **Offen:** Vor dem ersten Produktiveinsatz `pnpm check:tutor:live` ausschließlich manuell mit sicherer Bindung ausführen. Die echte Kalibrierung des Prompts v5 ist ohnehin offen.
- **Künftige Upgrades:** Ein weiteres Major-Upgrade braucht wieder eine eigene Abnahme. Dabei sind alle drei Orte (package.json, `npm:`-Specifier, tsconfig-`paths`) gemeinsam zu ändern.
