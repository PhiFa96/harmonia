# Rohbericht Fachprüfung Phase 4 v3: PR #146 KI-Prüfungsübergabe und Zertifikatsablauf

Stand 05.11.2026. Prüfgegenstand: `git diff origin/main...origin/codex/ai-certificates-complete-draft`, im lokalen Branch `claude/stoic-pascal-eaoojx` mit #136 zusammengeführt. Nichts committet, keine Quelldateien geändert.

## Ergebnis

Keine Blocker. Alle Release-Gates bleiben gesperrt (Exitcode 1), die Muster bleiben ausdrücklich ungültig, es wird keine Rechtsfreigabe behauptet. Hashbindungen werden zur Laufzeit berechnet. Im Repository stehen keine gespeicherten Prüfwerte, die durch die Zusammenführung veralten könnten. Es bleiben fünf Nacharbeiten und fünf Hinweise.

## Zusammenführungsstand (Hashbindung)

- `pnpm check:ai`: "10 features, 277 bound files; general: 21 open evidence fields" (Exit 0). #136 allein hatte 251 gebundene Dateien, #146 bindet mehr Verzeichnisse. 277 ist der Wert im gemeinsamen Stand.
- `pnpm check:certificates`: "2 draft profiles, 26 open requirements. Invalid samples only." (Exit 0).
- Die Prüfwerte `snapshotHash` (KI) und `sourceHash` (Zertifikate) werden bei jedem Lauf frisch berechnet. `inventory.json` führt für alle drei Reviews `snapshotHash: null`. Es gibt daher keine veraltete eingecheckte Bindung.
- Veraltet sind nur lokale private Erzeugnisse, die vor der Zusammenführung entstanden sind. Nötige Regeneration:
  1. `corepack pnpm ai:review` erzeugt `artifacts/ai-act/{snapshot.json,de,en-US,en-GB}.html` neu.
  2. `corepack pnpm ai:handoff` (ohne oder mit `--scope general|school|certificates`) erzeugt neue Arbeitsblätter unter `artifacts/ai-act/handoff/<neuer Wert>/<Bereich>/`. Ein Arbeitsblatt mit altem `baseSnapshotHash` wird von `--inspect` mit "Outdated AI assessment worksheet" abgewiesen. Menschliche Notizen müssen in das neue Blatt übertragen werden.
  3. `corepack pnpm certificates:review` für die Prüfmappe der Zertifikate.
  4. Zertifikats-Server neu starten. Lokale Durchgänge mit altem `source_hash` werden als `outdated` markiert und liefern weder Aufgaben noch PDFs.
- Es ist keine Neuerzeugung von `inventory.json`, Plänen oder Content-Artefakten erforderlich.
- Die Dokumentation in #146 sagt dasselbe ("Spätere Integration ändert die Prüfwerte und erfordert neue Prüfvorlagen").

## Befunde

### Nacharbeit

**N1. Importe außerhalb der Wurzelverzeichnisse sind nicht gebunden.**
`tools/ai-act/model.mjs:222-262` bindet vollständige Verzeichnisse. Ein eigener Importgraph-Lauf über die 277 gebundenen Dateien findet relative Importe in nicht gebundene Dateien:
- `apps/mobile/src/components/*` (22 Dateien, importiert von `exercise-task.tsx` und `tutor-screen.tsx`), darunter `tutor-answer.tsx`, `tutor-report.tsx`, die Antwort-Eingaben und `use-exercise-playback.ts`.
- `apps/mobile/src/state/settings.ts` (importiert von `tutor/state.ts`), `apps/mobile/src/state/learning.ts`-Kette.
- `supabase/functions/_shared/tutor-local-fixture.ts` (importiert von `tutor/index.ts:33` und `knowledge.ts:23`). Sie fällt durch die Ausschlussregel `-fixture\.` (`model.mjs:256`). Die Datei ist produktiv importiert, wird aber nur über `HARMONIA_TUTOR_LOCAL_TEST=true` plus lokale URL aktiv.
- `tools/beta/study.mjs`, `tools/release/monitor.mjs`, `tools/storefront/model.mjs`, `tools/qa/release.mjs`, `tools/tutor-benchmark.mjs` (importiert von `tools/release/check.mjs`).
- `packages/ui/src/tokens.ts` (von `tools/certificates/server.mjs`, nur im Zertifikatsbereich der KI-Bindung).
Empfehlung: Ausschlussregel `-fixture.` auf Testwerkzeuge begrenzen (z. B. nur `test-fixture.`) und einen Test ergänzen, der die relativen Importe aller gebundenen Dateien transitiv auf Bindung prüft. Der Test "komplette Wiedergabeimporte" in `complete.test.mjs` deckt nur die Wiedergabe ab.

**N2. Zertifikatsbindung kennt `tools/ai-act/model.mjs` nicht.**
`tools/certificates/review.mjs` importiert `tools/ai-act/model.mjs`, das nicht in `certificateDigests()` (`binding.mjs:30-48`) liegt. Eine Änderung der Rechtsprüfungslogik ändert den Zertifikatsprüfwert nicht. Wegen der bestehenden Rechtssperre über `aiAct.certificates.*` nur Nacharbeit.

**N3. Nachweisdokument beweist nur Existenz und Hash.**
`tools/ai-act/evidence.mjs` prüft Pfad, Modus 0600, Größe, kein Symlink, SHA-256. Jede selbst geschriebene `.md`-Datei erfüllt `review.private-written-document`. Die Gates bleiben trotzdem durch `real-written-assessment`, `reviewer-and-reference`, `validity`, Klassifikationen und Maßnahmen gesperrt. Kein Fehler, aber der Hash ist keine Echtheitsprüfung. Das steht so in `ki-und-zertifikate-gesamtstand.md` ("Unabhängigkeit bleibt erforderlich").

**N4. Lesen verändert Daten.**
`service.mjs` `view()` setzt beim Lesen `invalidated` und kann über `expire()` einen Durchgang abschließen. Das passiert in `state()`, `start()`, `exportData()` und `receipt()`. Der Export (Zeilen 450-480) schreibt dadurch in der Lesetransaktion. Es bleibt innerhalb der Transaktion, ist aber überraschend. Zumindest `exportData` sollte nur lesen.

**N5. Simulierte Zahlung ist Client-bedienbar.**
`/api/settle` setzt `paid` auf Zuruf desselben Sitzungsinhabers (`purchases.mjs`, `settle`). Dies ist als "simulated: true" gekennzeichnet und nur Loopback. Vor jeder echten Bindung darf kein Pfad übrig bleiben, über den ein Client seine Berechtigung selbst setzt. Der Test-Fixture `startFixture` bestellt und bezahlt direkt am Service.

### Hinweis

**H1. Sitzungen.** `sessions.mjs`: 30 Minuten Leerlauf, 7 Tage absolut, Obergrenze 5.000 Sitzungen ohne Bereinigung nach Nutzung. Kein Cookie-Secure (Loopback-HTTP). Die Bereinigung läuft bei `issue` und `resolve`. Daten abgelaufener Sitzungen bleiben unlesbar bis zur Siebentagesgrenze. Das ist dokumentiert. Das Zeitlimit (30 Minuten) liegt oberhalb der Prüfungsdauer (20 Minuten).

**H2. Widerruf während laufender Anfrage.** `server.mjs` prüft die Sitzung nach dem Lesen des Körpers und nach der PDF-Erzeugung erneut und ruft `service.receipt` nochmals auf. Dadurch werden Logout, Löschung, Widerruf oder Erstattung während der asynchronen PDF-Erzeugung berücksichtigt. Getestet in `complete.test.mjs`.

**H3. Rekonstruktion.** `reconstruct()` validiert Profil, Seed (Länge), Fingerprint, Antwortreihenfolge, Antwortzeiten (monoton, vor Frist), Auswahlwerte, Abschlusszeit und das gespeicherte Ergebnis (`isDeepStrictEqual` gegen neu berechnetes Ergebnis inklusive Code-Format). Beschädigte JSON-Felder führen zu `outdated`. Alte Zeilen ohne `purchase_id` sind nicht autorisiert und werden ebenfalls `outdated`. Einzelne Zeilen blockieren weder `state()` noch Neustart (Tests "stale receipt is isolated").

**H4. Prüfcode.** `verify` gibt für widerrufene Codes nur noch `revoked` zurück (kein Ergebnisinhalt mehr) und `outdatedCode` für nicht rekonstruierbare Zeilen. Der Endpunkt ist ohne Sitzung erreichbar und ohne Ratenlimit. Bei 128 Bit Zufall unkritisch.

**H5. Docs-Zahlen.** `ki-und-zertifikate-gesamtstand.md` nennt weder 251 noch 277 und bleibt zahlenneutral. Die Tutor-Doku (#136) nennt noch 251 gebundene Dateien. Nach dem Merge 277.

## Löschung, Export, Sitzungswiderruf

| Eigenschaft | Ergebnis |
|---|---|
| Gesamtlöschung `erase` | entfernt Durchgänge, Bestellungen, widerruft Sitzung, löscht Cookie. `secure_delete=on`. |
| Einzellöschung `remove` | prüft Besitz, entfernt Durchgang samt Muster-Code. Bestellung bleibt als verbraucht. |
| Export | JSON mit Antworten, Ergebnis, Widerrufsstatus, Bestellungen. Ohne Seed, Token, Zukunftsfragen oder Lösungsschlüssel. Beschädigte Zeilen führen nicht zum Gesamtabbruch. |
| Logout | widerruft Sitzung serverseitig, löscht Cookie. |
| Erstattung | widerruft Muster-Code, auch bei abgeschlossenen Durchgängen, und sperrt unfertige. |
| Fremder Zugriff | Besitzprüfung in allen Pfaden. Fremde Bestellungen und Durchgänge liefern 404. |

## Muster, Gates, Rechtsaussagen

- PDFs bleiben "harmonia-DRAFT-INVALID.pdf". Code-Präfix `DRAFT-`, `DRAFT_CODE` wird in der Rekonstruktion geprüft.
- `check:certificates:release`: Exit 1 mit u. a. `certificate.draftOnly`, `certificate.content`, `certificate.rules`, `certificate.identity`, `certificate.payments` und 18 `aiAct.certificates.*`.
- `check:ai:release --scope general|school|certificates`: je Exit 1 (21, 22 und 18 offene Punkte), alle drei Reviews `pending`/`draft`.
- Keine Formulierung in `CLAUDE.md`, `vorpruefung.md` oder `ki-und-zertifikate-gesamtstand.md` behauptet Rechtsfreigabe, gültige Zertifikate oder neu gelesene Quellen. `legalApprovalInferred: false` wird in allen Ausgaben geführt.
- `ai:handoff --inspect --write` ändert nur `artifacts/ai-act/proposals/...`, nicht `inventory.json`. `writePrivate` erzwingt 0700/0600, kein Symlink, Pfadmuster.

## Tests

| Befehl | Ergebnis |
|---|---|
| `node --test tools/ai-act/*.test.mjs tools/certificates/*.test.mjs` | 65 Tests, 65 bestanden, 0 fehlgeschlagen |
| `pnpm certificates:test:web` (Playwright mit `/usr/bin/google-chrome`) | 16 von 16 bestanden (drei Sprachen, Zahlung, Export, Erstattung, Löschung, Logout, Axe, Berichte offline) |
| `pnpm check:ai` | bestanden, 277 gebundene Dateien |
| `pnpm check:certificates` | bestanden, 2 Profile, 26 offene Anforderungen |
| `pnpm check:certificates:release` | erwartet gesperrt, Exit 1 |
| `pnpm check:ai:release --scope general|school|certificates` | erwartet gesperrt, jeweils Exit 1 |
| Importgraph-Skript (einmalig, im Scratchpad) | Befund N1, N2 |

## Grenzen

- Kein vollständiger `pnpm test:tools`, kein `typecheck`, `lint`, `format:check` im gemeinsamen Stand. Nur die genannten Pakete.
- Keine Rechtsbewertung. Keine neue Lektüre amtlicher Quellen.
- Importgraph-Lauf ist eine Heuristik (reguläre Ausdrücke auf relative Importe), ohne Workspace-Paketimporte.
- Echte Zertifikatsprüfung, Zahlungs- und Identitätsbindung, Fach- und Geräteabnahme bleiben offen.
