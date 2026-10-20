# P3.05 – Theorie-Rush

Technische Übergabe auf `codex/p3-05-theory-rush`, aufbauend auf P3.04. Entscheidung: [ADR 0032](../decisions/0032-theorie-rush-mit-servergeprueften-schritten.md).

## Funktionsstand

- Einstieg unter Übungen; Konto nötig, Gast erhält einen verständlichen Kontoeinstieg.
- 3 Minuten, 5 Minuten, Überleben ohne Spieltimer; dritter Fehler beendet den Lauf.
- Eingefrorene Serveraufgaben, schrittweise steigende didaktische Schwierigkeit, gemeinsame Wettbewerbsbank statt persönlicher leichterer Aufgaben. Schnelle visuelle Auswahlaufgaben, Hinweise aus; nach jeder bestätigten Antwort normale Engine-Erklärung. Keine neue fachliche Behauptung aus einem Sprachmodell.
- Timer läuft bei Navigation, Hintergrund und Verbindungsfehler weiter. Serverstand nach Reload/Anmeldung wieder laden; gescheiterte Übertragung nicht als Punkt/XP darstellen. Freiwilliger Abbruch benötigt eine ausdrückliche Bestätigung und verbraucht weiterhin den Start.
- Serverseitige Wertung und Deadline, fortlaufende Indizes, Mindestantwortzeit, idempotente Bestätigung und atomare Startgrenze. Clientwerte für Seed, Richtigkeit, Ergebnis oder Zeit werden nicht akzeptiert. Dies ist kein Bot-Schutzversprechen.
- Punkte: 10–50 je richtiger Antwort. XP: zunächst 1 je richtiger Antwort, maximal 30 pro natürlich beendetem Lauf; keine Münzen, Serienqualifikation, Ratings, Freischaltungen oder FSRS-Termine. Kanonisches `xp_ledger` mit eigener Rush-Herkunft, bestehende Liga und Tagesziel-/Gesamt-XP-Zusammenfassung.
- Gratis ein Start täglich, Premium/Max zunächst 100 als Betriebsgrenze, gemeinsam über alle Modi und nach UTC-Tageswechsel. Werte serverseitig konfigurierbar. Keine zusätzliche Lernenergie abbuchen, keine neuen Preise oder Checkout-Freigaben.
- Bestenlisten Tag/Woche/Allzeit/Freunde, getrennt nach Modus und aktueller Aufgaben-/Regelbank. Nur bester Lauf je Konto; UTC-Fenster, Montag als Wochenbeginn. Rang, Punkte und eigenes Kennzeichen, keine Profilnamen, E-Mails, Kontokennungen oder fremden Laufdetails.
- Freundesfilter funktioniert ausschließlich für gegenseitig bestätigte Beziehungen. Ausstehende, einseitige, entfernte und blockierte Beziehungen zählen nicht. Ohne bestätigte Freundschaften bleibt nur der eigene beste Lauf. Die private minimale `friendships`-Tabelle bereitet P3.08 vor; Einladungs-/Verwaltungs-/Questoberfläche folgt dort.
- Eigener Datenschutzexport, Kontolöschkaskade und zwölfmonatige Rohdatenkürzung; bestätigte Ergebnisse und XP bleiben erhalten. Kontogetrennter flüchtiger Spielcache, Lösch-/Besitzerprüfung auch nach verzögerten Antworten. Bestätigte Rush-Aggregate werden im vorhandenen Motivationsspeicher für Offline-Schätzungen aufbewahrt.
- UI in DE/US/UK, vorhandene Tokens, Tastatur, Antwort- und Notenbausteine. Fachliche Begriffe kommen weiter aus den bestehenden Engine-/Glossartexten. Keine Rechts-/Anbieter-/Inhaltsfreigabe behaupten.

## Bereitstellung und Schnittstellen

Vier additive Migrationen zuerst:

1. `20261016070000_theory_rush.sql`
2. `20261016071000_rush_evidence_namespace.sql`
3. `20261016072000_rush_friends.sql`
4. `20261016073000_rush_retention_age.sql`

Danach `rush`, `motivation`, `privacy`, `privacy-retention` und den aktualisierten Client bereitstellen. Supabase-Konfiguration verwendet bei `rush` eigene JWT-Prüfung über `getUser`. Preview importiert Entwürfe nur mit bestehendem `HARMONIA_LOCAL_PREVIEW=true` auf einer lokalen Supabase-Adresse; Remote verwendet ausschließlich `published.ts`. Keine Produktionskonfiguration geändert, keine Remote-Migration ausgeführt.

API `rush`:

- `GET`: eigenes Kontingent und letzter bestätigter/aktiver Lauf.
- `POST { action: "start", id: UUID, mode: "three" | "five" | "survival" }`: serverseitiger Seed, eingefrorene Bank und Regeln.
- `POST { action: "answer", id, index, answer }`: genau der nächste Index; identische verlorene Bestätigung darf wiederholt werden.
- `POST { action: "finish", id }`: natürlich beendeten Lauf bestätigen; vorzeitig bleibt er aktiv.
- `POST { action: "abandon", id }`: vorzeitig abbrechen; eine bereits erreichte Deadline zählt als natürliches Ende.
- `GET ?board=day|week|all|friends&mode=three|five|survival`: aktuelle minimale Bestenliste, erste 50 plus eigener Rang.

`close_expired_rush(100)` ist Service-only und schließt auch nicht wieder geöffnete Zeitläufe aus bereits geprüften Schritten ab. `supabase/ops/schedule-rush.sql` **erst nach Prüfung im Zielbetrieb aktivieren**; bei Rückstand wiederholt ausführen. Mehrkonto-Jobs überspringen bereits gesperrte Konten und warten nicht in umgekehrter Sperrreihenfolge. `retain_rush()` hängt am bestehenden privaten Retentionjob. Zwölf Monate alte aktive Läufe werden bei der Rohdatenkürzung geschlossen/abgebrochen; Überleben besitzt ansonsten keinen Timer.

Geänderte `xp_ledger`-Quellstruktur: `source_kind=lesson` hält den originalen Lernereignis-FK über `learning_client_id`; der Before-Insert-Trigger setzt ihn für bestehende Lektionsschreiber. `source_kind=rush` benötigt einen eigenen Lauf-FK, leeren Lektionsbezug und reservierte Beleg-ID, keine Münzen/Serienqualifikation. Kein künstlicher Lektionsnachweis und keine zweite XP-Buchung. Alte Lektions-/Review-Syncformate bleiben unverändert. `motivation` erweitert Antworten nur bei `rushFormat:1`, damit ältere strenge Clients keine unbekannten Felder erhalten.

## Prüfung

```sh
pnpm db:test
pnpm db:lint
pnpm db:test:rush
pnpm db:test:learning
pnpm db:test:motivation
pnpm db:test:privacy
pnpm --filter @harmonia/content exec vitest run --maxWorkers=1
pnpm --filter @harmonia/mobile exec jest --maxWorkers=2
pnpm check:i18n
pnpm lint
pnpm typecheck
pnpm format:check
```

Gast- und echte lokale Konto-Browserabläufe getrennt exportieren. Nicht während laufender Prüfungen deren Exportverzeichnis überschreiben:

```sh
pnpm qa:build --output /workspace/p305-preview
HARMONIA_QA_DIR=/workspace/p305-preview pnpm qa:web rush.spec.mjs
node tools/qa/export-local-auth.mjs --output /workspace/p305-local-auth
HARMONIA_QA_LOCAL_AUTH=1 HARMONIA_QA_DIR=/workspace/p305-local-auth pnpm qa:web rush-auth.spec.mjs
```

Für diese Cloud gegebenenfalls `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` setzen. Der Kontoexport enthält ausschließlich einen öffentlichen lokalen Anon-Schlüssel und ist **kein Veröffentlichungskandidat**. API-/Browserprüfungen erstellen eigene lokale Konten und entfernen sie anschließend; keine echten E-Mails, Käufe oder Push-Nachrichten.

Lokale Abschlussprüfungen:

| Bereich | Ergebnis |
|---|---|
| App | 601 Tests in 78 Dateien bestanden, einschließlich geschützter Antwortauswahl, Konto-/Löschgrenze und Offline-XP-Aggregaten |
| Inhalte / Sprache | 666 Inhaltsprüfungen im vollständigen Lauf; nach der abschließenden Wettbewerbskennung zusätzlich alle fünf Rush-Protokollprüfungen bestanden. 441 i18n-Prüfungen und DE/US/UK-Schlüsselprüfung bestanden |
| SQL / echte lokale APIs | 492 pgTAP-Prüfungen in 18 Dateien und Schema-Lint bestanden; 110 Rush-API-Prüfungen einschließlich zwölfmonatiger Grenze auch bei weitergespieltem Überleben. Lern-Sync mit 226 Offline-Versuchen, Motivation samt 17 ersetzten Push-Prüfungen, 112 Datenschutzprüfungen, 75 Liga- und 54 Liga-Versandprüfungen bestanden |
| Browser | Drei echte angemeldete Rush-Szenarien (DE 3 Minuten, US 5 Minuten, UK Überleben) mit Reload, Verbindungsfehler, Bestätigung, Bestenliste, Axe und Überlaufprüfung bestanden. Gesamter isolierter Gast-Weblauf: 29 bestanden, sechs ausdrücklich getrennte Konto-Szenarien ohne Auth-Flag übersprungen |
| Tools / Typen / Stil | 157 Tools-Prüfungen, vollständige Typ-/Lintprüfung und erneute Prüfung der zuletzt betroffenen App-/Content-/Functions-Dateien, Deno und Prettier bestanden |
| Produktionsausgabe | Web sowie Android-/iOS-Hermes exportiert. Weitere native JavaScript-Ausgabe: sieben Dateien ohne unveröffentlichte Katalog-IDs/-Texte; lokale Auth-Adresse fehlt in Gast- und Produktionsbundles |
| Größenbudgets | Web 5.529.091 Bytes, gzip 1.321.971 Bytes, Audio 686.098 Bytes; Android-Hermes 9.314.921 Bytes, iOS-Hermes 9.101.682 Bytes; alle Grenzen eingehalten |
| Lokale Zeitprobe | Chromium-Start-P95 1.437,65 ms, Lektionsaufruf-P95 281,60 ms; keine physische oder akustische Geräteabnahme |

Protokolle dieser Cloud-Sitzung unter `/workspace/p305-*.log`; Screenshots unter `artifacts/quality/p305-auth-verified` und Gast-/Regressionsbelege unter `artifacts/quality/p305-web-final`. Ein erster Kontostart deckte den fehlenden Nachabruf nach asynchron geladener Anmeldung auf; die erste komplette Browserprüfung zeigte eine nicht erkennbar gesperrte Auswahl während eines Abrufs. Beide Fehler wurden behoben und in allen drei endgültigen Kontoszenarien bestätigt; die gesperrte Auswahl ist zusätzlich in der App-Suite geprüft. SQL-Gesamttests und echte Konto-Browserfixtures nacheinander ausführen: bestehende ältere SQL-Fixtures setzen in einzelnen Prüfungen leere fremde Präferenztabellen voraus.

 Offen bleiben Claudes PR/CI/Integration, Remote-/Schedulerbetrieb, getrennte fachliche Freigabe und echte iOS-/Android-Abnahme sowie die bekannten P2-Launchblocker. Der derzeit öffentliche Katalog enthält weiterhin null freigegebene Lektionen; Rush startet dort absichtlich nicht mit Entwürfen.

Die Wettbewerbskennung enthält Aufgabenbank, Engineversion, Stufenabstand und Mindestantwortzeit. Änderungen ausschließlich am Tageskontingent oder XP-Deckel setzen vergleichbare Allzeitrekorde nicht zurück; die vollständige Regelkonfiguration bleibt trotzdem pro Lauf eingefroren.

F17 begrenzt Rohdaten anhand des Laufbeginns, auch bei weitergespielten Überlebensläufen. Weitere Antworten verlängern die zwölfmonatige Frist nicht. Ein dann noch aktiver Überlebenslauf wird bei der Kürzung ohne Spielbelohnung abgebrochen; kürzere abgeschlossene Läufe werden spätestens zwölf Monate nach Start auf bestätigte Summen reduziert.
