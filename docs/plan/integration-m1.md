# M1 – gemeinsamer technischer Integrationskandidat

Auftrag: die acht unabhängig grünen Entwürfe aus dem [Fertigstellungsplan](fertigstellung.md) zusammenführen und das [Befundregister M2](befundregister.md) beginnen. Basis ist `main@ab157e81afd4ee158573d38302247b681029b24c`. Arbeitsbranch: `codex/m1-integration-m2-register`.

**Status:** gemeinsamer Arbeitsstand, noch keine Main-Integration. Codex erstellt gemäß `AGENTS.md` selbst keinen PR und keinen Merge. Claude Code übernimmt PR, fünf erforderliche GitHub-Jobs und die vorgesehenen unabhängigen Reviews. Die bisherigen grünen Einzeljobs sind keine CI-Abnahme dieses Kandidaten. Alle Inhalte bleiben Entwurf; keine Anbieter-/Rechts-/Geräte-/Produktfreigabe. P4.01 bleibt bis F14/Rechtsklärung zurückgestellt.

## Übernommene Originalstände

Alle acht Originaländerungen wurden einzeln per Cherry-pick auf den normalen Arbeitsbranch übernommen; die Zuordnung Original-Head → Arbeitscommit steht im JSON-Nachweis. Dadurch wurden keine Original-PRs gemergt oder geschlossen. Deren Abschluss als integriert beziehungsweise ersetzt gehört zu Claudes anschließendem PR-Ablauf. Additive Verlaufsnotizen bleiben erhalten; Aussagen zu „separaten, nicht enthaltenen PRs“ in den Einzelübergaben beschreiben deren damaligen Stand. Dieses Dokument beschreibt den gemeinsamen Kandidaten.

| PR | Original-Head | Umfang |
|---|---|---|
| [#151](https://github.com/PhiFa96/harmonia/pull/151) | `0e2b525a0e2a7a45578658a5ba4560049e12242e` | Schul-Kontobindung, frischer Auth-/Sitzungswiderruf und private Backend-/Graderrolle |
| [#156](https://github.com/PhiFa96/harmonia/pull/156) | `fe3f2452efadbb5bcd67b9664084cedc8f5f11b3` | Tutor-Signatursecret, sicheres Replay und Prüfbudget |
| [#157](https://github.com/PhiFa96/harmonia/pull/157) | `d89cea1e2f50dd482daa23825113be338fcd5076` | Transitive Importbindung der KI-/Zertifikatsprüfwerte |
| [#158](https://github.com/PhiFa96/harmonia/pull/158) | `8a4edd3d95b65f7f842641a83ab318a58cd8b977` | Reine Zertifikats-Leseansichten mit getrennten Lebenszyklus-Schreibvorgängen |
| [#159](https://github.com/PhiFa96/harmonia/pull/159) | `40e1a194f5167c2b7593987ea759f5e13db3119e` | Zahlungssperre als Standard, ausdrücklich aktivierte lokale Simulation |
| [#160](https://github.com/PhiFa96/harmonia/pull/160) | `b036cf8fa474f500dd9cf41420097c563c758643` | Zeitzuordnung und sicherer Abbruch von Chor-Aufnahmen |
| [#161](https://github.com/PhiFa96/harmonia/pull/161) | `c3c4f59ce11a4df90976a5bca611de5608c192c9` | Erklärung tatsächlich notierter Cantus-Schlussvarianten |
| [#162](https://github.com/PhiFa96/harmonia/pull/162) | `13f9961c3a55d67f623c6e897c368440ec28f794` | Zeitreise-Hinweise und getrennt angeforderte Auflösung |

GitHub wurde über die API gelesen: jeder dieser Heads hat fünf erfolgreiche Pflichtjobs, keine abgegebenen PR-Reviews und keine Reviewthreads. Der [gespeicherte API-Nachweis](../quality/m1-integration/pr-status.json) nennt exakte SHAs, Job-URLs und Abrufzeit. Leere Reviewlisten sind keine Zustimmung.

## Konfliktauflösung und gemeinsame Regressionen

- Dokumentation: alle eigenständigen Nachträge, ADRs und Einträge im Plan bleiben erhalten. Die Liste der Werkzeugtests ist die Vereinigung der ursprünglichen Listen, einschließlich `source-binding`, `import-binding`, `tutor-attempt-service`, `read-only` und `payment-boundary`.
- `service.mjs`: #158s `readTransaction` mit `pragma query_only=on`, einem Serverzeitpunkt und reinen Siebentagesfiltern bleibt bestehen. Gleichzeitig liefern Ansichten und Export #159s Zahlungsmodus/Policy; sie erzeugen dadurch keine Schreibvorgänge. Bestellen, simuliertes Bezahlen/Erstatten und Wartung verwenden ausdrücklich `writeTransaction`.
- `purchases.mjs`: Modus-/Fähigkeitsprüfung aus #159 und reine Sichtbarkeitsfilter aus #158 sind gemeinsam erhalten. Alte allgemeine `settle`-/`refund`-Routen und Servicefunktionen werden nicht wieder eingeführt.
- Regressionsanpassung: #158s neue Datei-/HTTP-/Browserprüfungen und #157s Neustart-/Importbindungstest müssen #159s explizite Testfabriken verwenden. Der Lese-HTTP-Test bezahlt ausschließlich über `/api/simulation/settle`. Die bisherigen Assertions zu unveränderten DB-Bytes, Timeouts, fremden Altbeständen und geschlossenen Zahlungsgrenzen bleiben erhalten.
- Tatsächlich beobachtete Integrationsfehler vor Anpassung: vier Leseprüfungen scheiterten an `paymentsUnavailable`; danach drei HTTP-Fälle an HTTP 404 für die abgeschaffte allgemeine Zahlungsroute. Die aktuelle gemeinsame Werkzeugsuite besteht mit 365/365 Prüfungen; alle 25 Zertifikats-Browserfälle bestehen in DE/en-US/en-GB einschließlich beider neuer Testgruppen.

## Abhängigkeiten getrennt entschieden

| PR | Geprüfter Stand | Entscheidung für diesen Kandidaten |
|---|---|---|
| [#152](https://github.com/PhiFa96/harmonia/pull/152) | `4a3ca851`, 19 Minor-/Patchupdates; fünf Jobs grün | Separat zurückgestellt. Das Rootmanifest wechselt auf Anthropic SDK 1.6.0, während die produktiven `npm:`-Importe in `tutor-provider.ts`, `tutor-runtime.ts`, `tutor-usage.ts` und `tutor-citations.ts` auf 1.3.0 bleiben. Node-/Deno-Stände, Expo-Patch und übrige Bibliotheken vor einer eigenen Abhängigkeitsintegration gemeinsam beurteilen. Die acht Fehlerkorrekturen benötigen diese Updates nicht. |
| [#153](https://github.com/PhiFa96/harmonia/pull/153) | `527b0bd6`, Metro Runtime 57.0.18 → 58.0.17; fünf Jobs grün | Zurückgestellt: Expo bleibt SDK 57, im Paketkatalog ausdrücklich so gebunden. SDK-58-Migration als eigenes Paket planen; grüne Web-CI ersetzt keine native Kompatibilität. |
| [#154](https://github.com/PhiFa96/harmonia/pull/154) | `6d5d6073`, Supabase 2.122.0 → 3.0.0; Datenbankjob rot | Zurückgestellt: Fehler im Schritt „Lokales Supabase starten“, Diagnose `unclassified_startup_failure`; Folgeprüfungen übersprungen. Ursache ist damit noch nicht geklärt. Eigene CLI-Migration mit vollständigem Start-/DB-/HTTP-Nachweis erforderlich. |
| [#155](https://github.com/PhiFa96/harmonia/pull/155) | `a640e429`, Audio API 0.13.6 → 1.0.0; Lint rot | Zurückgestellt: vier `no-unsafe-call`-Befunde wegen nicht auflösbarer Typen; Typprüfung/Tests danach übersprungen. Native API-/Zeitstempel-Migration gesondert prüfen. #160 verwendet ausdrücklich die Semantik der gepinnten 0.13.6. |

Keiner dieser PRs wurde geschlossen oder verändert. Die Entscheidungen betreffen die Zusammensetzung dieses Arbeitsbranches.

## Gemeinsame Prüfung

Der abschließende lokale Prüfbericht wird in [validation.json](../quality/m1-integration/validation.json) festgehalten. Reproduzierbar mit Node 22.23.3, pnpm 10.34.6 und `pnpm install --frozen-lockfile`; lokale Browserproben verwenden `/usr/bin/chromium` über `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

| Bereich | Lokaler Nachweis |
|---|---|
| Installation / statische Prüfungen | Eingefrorene Installation, vollständiges Lint/Paketgraph, Typprüfung, Format-, Sprach-, Inhalts-, Curriculum- und beide Tutor-Katalogprüfungen bestanden |
| Pakete | 3.863 bestandene Prüfungen: Theorie 892, Übungen 670, Inhalt 1.483, i18n 509, Notation 251, Audio 44, UI 14; Übungen/Inhalt seriell mit einem Worker |
| App | 809/809 Tests in 107/107 Suites im vollständigen seriellen Jest-Lauf bestanden |
| Node-Werkzeuge | Vollständiger Lauf 365/365, danach abschließende Importbindung 11/11 mit sechs zusätzlichen Änderungsproben: 371 unterschiedliche bestandene Fälle |
| Deno / Tutor-Batch | Vollständiges `check:deno` und 1.470 technisch bestandene simulierte Dialoge; null fachlich bewertete echte Antworten, `releaseEligible: false`, keine Kontingentempfehlung |
| Datenbank | Neuaufsetzen/Lint erfolgreich, 603 allgemeine und 150 Schul-pgTAP-Prüfungen mit echtem Supabase-Auth; komplette Schul-Suite 87/87 |
| HTTP / Rechte / Datenschutz | Alle CI-Abläufe für Auth/Profil/E-Mail, öffentliche und interne Lern-/Tutor-/Wissenspfade, Ratings/FSRS, Meldungen, Motivation, Käufe/Zugriff, Datenschutz und Analytics bestanden; Tutor jeweils 295, Datenschutz 131 Fälle |
| Browser / öffentlicher Export | 160 bestanden: Web-Kern 77, Satzwerkstatt 24, Schule 23, Zertifikate 25, Beta 5, Produktion 6; neun vorhandene bedingte Auslassungen wie unten beschrieben. Produktions-Export: elf JavaScript-Dateien ohne unveröffentlichte Katalog-IDs oder Inhaltstexte; Größenbudgets bestanden |

Die vier KI-/Zertifikats-Releasegates bleiben mit Exit 1 geschlossen. Die Vorbereitungsprüfungen führen weiterhin 151 P2-Voraussetzungen, KI-Nachweise 21/22/18 und 26 Zertifikatsanforderungen offen. Technische Prüfung ist keine Erfüllung dieser Abnahmen.

Die reguläre Web-Suite behält ihre neun vorhandenen bedingten Auslassungen: je drei optionale authentifizierte Liga-/Rush-UI-Fälle und drei Chor-Produktionsfälle. Die sechs optionalen Auth-UI-Fälle wurden hier nicht ausgeführt; daraus folgt keine Browserabnahme dieser Kontenabläufe. Chor und Zeitreise erhalten anschließend den eigenen Produktionsdurchgang mit sechs Fällen. Keine Auslassungsbedingung wurde für diese Integration hinzugefügt oder gelockert.

Die ersten parallelen Läufe überlasteten die Zwei-Kern-Cloud: drei beziehungsweise vier reine Zeitüberschreitungen in der Übungssuite und ein HTTP-500 im 30-Client-Schultest. Sie werden einzeln beziehungsweise seriell nachgeprüft; ursprüngliche Fehlschläge bleiben dokumentiert. Keine Assertions, Zeitgrenzen oder Pflichtjobs wurden abgeschwächt. Ein anfänglicher Browserlauf ohne Chromium-Pfad konnte den Browser nicht starten; der korrekt konfigurierte vollständige Zertifikatslauf besteht mit 25/25.

Die lokale Supabase-CLI benötigt ausdrücklich `SUPABASE_HOME=/workspace/.harmonia-cache/supabase-cli`; die vorhandene Umgebungsdatei setzt das nicht mehr. Der lokale Slim-Start mit zulässiger Docker-Hub-Registry spielte alle Migrationen bis einschließlich `20261113090000_tutor_attempt_security.sql` ein, scheiterte zunächst aber an Auth-/Realtime-Healthchecks. Die konkrete Diagnose war HTTP 403: BusyBox-`wget` verwendete für den unveränderten Loopback-Endpunkt den Cloud-Proxy. Eine ausschließlich temporäre Docker-Aufrufhilfe ergänzt dort `wget -Y off`; externe Proxy-/CA-Einstellungen, Healthcheck-Endpunkte, Intervalle und Wiederholungen bleiben erhalten. Damit startet Supabase mit gesunden Diensten. Die Hilfe liegt außerhalb des Repositories und ist keine produktive Codeänderung. Die unabhängige GitHub-Gesamt-CI bleibt weiterhin erforderlich.

Für Wiederholungen in **diesem Workspace**:

```sh
source /workspace/harmonia-env.sh
export SUPABASE_HOME=/workspace/.harmonia-cache/supabase-cli
export SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io
export SUPABASE_USE_SLIM_IMAGES=1
export PATH="/tmp/harmonia-health-bin:$PATH"
export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
```

Die temporäre Hilfe `/tmp/harmonia-health-bin/docker` ist im aktuellen Workspace vorhanden. Sie ist nur für dessen Cloud-Proxy erforderlich; die reguläre GitHub-CI-Konfiguration und ihre Standard-Images bleiben unverändert.

## Private Prüfmappen und Übergabe

Erst auf dem endgültigen Quellenstand ausführen:

```sh
pnpm ai:review
pnpm ai:handoff
pnpm certificates:review
pnpm check:ai:release --scope general
pnpm check:ai:release --scope school
pnpm check:ai:release --scope certificates
pnpm check:certificates:release
```

Die vier Releaseprüfungen müssen im aktuellen Entwurfsstand gesperrt bleiben (Exit 1). Die privaten Berichte/Arbeitsblätter bleiben unter dem ignorierten `artifacts/`; keine aktive Klassifikation oder Freigabe wird aus einer erzeugten Mappe abgeleitet. Bestehende Zertifikatsserver nach Änderungen neu starten; alte lokale Muster nicht als aktuelle Abnahme übernehmen.

Neu erzeugt wurden `artifacts/ai-act/snapshot.json` samt DE/US/UK-Berichten, alle drei Bereichsarbeitsblätter unter `artifacts/ai-act/handoff/954db408f5c545052b4ee470bd01833de59d69b4a43ff3614bae46f242177095/` und `artifacts/certificates/review/`. Die gemeinsame KI-Bindung umfasst 459 Dateien; die Zertifikatsbindung 209. Die abschließende Prüfung erkannte, dass der neue M1-Verweis in der gebundenen Zweckbeschreibung `phase-4-v2.md` die frühere Mappe entwertet hatte; sämtliche Mappen wurden deshalb nach dieser letzten Änderung erneut erzeugt. Vollständige aktuelle Prüfwerte stehen in `validation.json`. Die Dateien bleiben private lokale Arbeitsunterlagen und sind nicht eingecheckt.

M1 ist erst formal fertig, wenn Claude Code den finalen Branch mit Beschreibung und Nachweisen in einen regulären PR überführt hat, **alle fünf Pflichtjobs am endgültigen Kandidaten** erfolgreich sind und die vorgesehenen Reviews vorliegen. [Vorbereitete PR-Beschreibung](../quality/m1-integration/pr-beschreibung.md). Dieser Arbeitsstand veröffentlicht keine Inhalte und richtet keine externen Anbieter ein.

## Fachliche und funktionale Prüfung durch Claude Code (16.11.2026)

Durchgeführt auf `claude/zen-volta-59qear` (Fast-forward auf `84200b8`, Codex-Commits unverändert). Grundlage ADR 0005; keine Primärliteraturlektüre in dieser Sitzung, Inhalte bleiben `entwurf`.

**Musikfachlich geprüft**

- **#161 Cantus-Schluss:** 2.000 erzeugte `counterpoint-check`-Aufgaben unabhängig ausgezählt. Alle Schlusstöne Bb/C/D/E/F; jede Kennzeichnung stimmt mit Stammton- **und** Halbtonabstand überein (kleine Sekunde aufwärts = diatonischer Halbton, große Sekunde abwärts = Ganzton). Enharmonische Grenzfälle (Ces→C übermäßige Prime, His→C verminderte Sekunde, Dis→C übermäßige Sekunde abwärts) fallen korrekt unter „andere Bewegung“. Die Standardfassung (Cantus 2→1 unten, Oberstimme große Sexte → Oktave) und die Variante (Cantus 7→1, Oberstimme 2→1, Dezime → Oktave) sind musikalisch stimmig; die Bezeichnung „Schlussvariante dieses Modells“ behauptet keine Fux-Herkunft. Phrygische Schlüsse (2→1 als Halbton abwärts) kommen im Korpus nicht vor; bei künftigen phrygischen Modellen wäre die Kategorie „Ganzton abwärts“ zu eng und müsste erweitert werden. Die neun Kontrapunktregeln und der Generator sind unverändert.
- **#162 Zeitreise-Hinweise:** Alle acht zweiten Hinweise in DE/en-US gelesen; keiner nennt die richtige Option oder das Beobachtungsergebnis. Auflösung erst nach Hinweis 2, Zustand `revealed` ≠ `correct`. Neue englische Texte ohne -ize/-ise-Konflikt für en-GB. Die didaktische Eignung bleibt wie in ADR 0083 beschrieben offen.
- **#160 Chor:** Bewertungs-, Toleranz- und Oktavregeln in `packages/exercises` unverändert (Diff berührt nur Aufnahme-/Zeitpfad und Audio-Stopp).

**Code-Review des Gesamt-Diffs** (Korrektheit, entfernte Schutzregeln, Aufrufer): kein Blocker. Festgehaltene Restbefunde für das [Befundregister](befundregister.md):

1. Zertifikats-Prüfseite: Ohne `--simulate-payments` meldet `verify` für zuvor simuliert ausgestellte Mustercodes `outdatedCode`, weil die Gültigkeit an die Zahlungsfähigkeit gebunden ist. Für reine Entwurfsmuster vertretbar; vor einer produktiven Prüfseite Code-Gültigkeit und Zahlungsmodus trennen.
2. Tutor: Gespeicherte eigene Anfragen im Zustand `reserved` werden ohne erneute Versuchsprüfung fortgesetzt (beabsichtigtes Replay, ADR 0077). Vor Liveschaltung prüfen, ob Altzeilen ohne Nachweis noch fortgesetzt werden dürfen.
3. Schule: `school_draft.resolve_identity` verwendet unqualifizierte Parameternamen in einer SQL-Funktion; vor produktiver Übernahme als `resolve_identity.session_id` qualifizieren.
4. Schule: Schreibende Anfragen lösen die Identität zweimal gegen die Datenbank auf (vor und nach dem Body). Für den Entwurf korrekt, für Produktion bündeln.
5. Tutor-Prüfbudget wird vor der Inhaltsprüfung verbraucht; ungültige Quellen zählen mit. Als Missbrauchsschutz plausibel, Produktentscheidung offen.

Lokale Wiederholung in dieser Sitzung (seriell): Format, Typen, Lint, `check:i18n`, `check:content`, `check:curriculum`, Tutor-Katalog, Deno, Werkzeug- und Pakettests – Ergebnisse im PR. Datenbank-, Supabase- und Browserproben laufen in der erforderlichen GitHub-CI.
