# P3.02 – Adaptive Aufgabenauswahl

Stand 16.10.2026. Technische Umsetzung auf `codex/p3-02-adaptive-selection`. PR-Erstellung, CI-Prüfung und Integration übernimmt auf Phillips Wunsch Claude Code. [ADR 0029](../decisions/0029-adaptive-auswahl-mit-nachpruefbaren-quellen.md) erläutert Protokoll und Modellannahmen.

## Verhalten

- Innerhalb einer Lektion: ratingabhängige Reihenfolge aller Pflichtaufgaben und passende Wiederholungen aus dem erlaubten früheren Stoff. Bevorzugte Erfolgswahrscheinlichkeit 70–85 %, wenn passende Kandidaten vorliegen. Kein Weglassen oder Ersetzen von Pflichtaufgaben.
- Die Auswahl wird bei Beginn festgehalten. Nachladen neuer Ratings verändert keinen laufenden oder pausierten Durchgang. Ohne Daten bleibt der bisherige Ablauf erhalten; unpassende Kandidaten werden nicht als angeblich kalibriert dargestellt.
- Einstufung: 15–25 Aufgaben, Glicko-Schätzung je Bereich, konservative graphgerechte Empfehlung. Alte Testergebnisse und aktive Tests bleiben kompatibel. Hilfen, doppelte tatsächliche Beispiele und ausgelassene Hörfragen zählen nicht als unabhängige Rating-Evidenz.
- Üben → „Schwächen trainieren“: zehn Fragen zu bis zu drei schwächsten bekannten Fähigkeiten aus bereits erreichtem Stoff, mit Hinweisen und Fehlerwiederholung. Unter zwei selbstständigen Antworten je Fähigkeit bleibt der Einstieg deaktiviert. Schwerpunkte werden benannt. Keine Freischaltung, XP, Münzen oder Serienqualifikation; die Antworten fließen in Ratings ein.
- DE/US/UK, bestehende Notation, Energieprüfung, Inhaltsmeldungen, Offline-Wiederaufnahme und Kontentrennung verwenden dieselben Grenzen.

## Dateien und Betrieb

Reine Auswahl: `packages/exercises/src/adaptive.ts`; Diagnose: `placement.ts`. Quellenplan und seine Prüfung: `packages/content/src/lesson-flow.ts`. Kanonische Antworten und lokale Schätzungen: `learning-ratings.ts` / `local-ratings.ts`. App: `use-learning-ratings.ts`, `use-lesson-flow.ts`, `WeaknessEntry` und der bestehende Lektionsspieler.

Die additive Migration `20261016040000_adaptive_selection.sql` ergänzt den ausschließlich eigenen Rating-Leseweg und den privaten Beta-Bericht. Sie löscht keine Antworten und verändert keine XP. Bei einem späteren Remote-Deployment zuerst die aktualisierten Functions/Worker mit dem passenden freigegebenen Katalog bereitstellen und alte Worker auslaufen lassen, dann die Migration anwenden und nachrechnen. Sonst könnte ein alter Worker die erneut eingereihten Einstufungen noch einmal ausschließen. Die neue App erst danach ausrollen. Vor Freigabe alter Roh-Einstufungen mit dem vorhandenen resumierbaren Worker nachrechnen:

```sh
pnpm ratings:backfill --local --preview
pnpm ratings:backfill --local --check
```

Remote-Betrieb bleibt eine getrennte Betreiberaktion mit sicheren Umgebungsbindungen. `--remote` des bestehenden Workers ist ausdrücklich erforderlich; in diesem Schritt wurde ausschließlich lokal gearbeitet. Der neue Leseweg verweigert einen vollständigen Snapshot, solange eigene Rating-Nachweise ausstehen. Lernen bleibt über den lokalen Nachweisweg verfügbar.

SQLite speichert den Snapshot unter `ratings:<Konto>` mit dem bestätigten Sequenzstand. Neuere bzw. ausstehende lokale Nachweise ergänzen nur die Schätzung. Kontolöschung entfernt auch diesen Cache. Nach zwölf Monaten werden Schwächen-Durchgänge als `retained/sourceKind: practice` ohne Einzelantworten aufbewahrt; sie bestätigen weiterhin keinen Kursfortschritt. Eigene dauerhafte Fähigkeitsratings sind im vorhandenen Datenschutzexport enthalten.

Die neue App fordert `rowFormat: 3` an. Alte Clients mit Format 2 erhalten bei einer kompakten Schwächen-Zeile ausdrücklich `426 upgrade_required`, statt an einer unbekannten Variante zu scheitern. Format 1/2 und alte Nachweise bleiben für Seiten ohne solche Zeilen unterstützt. Functions deshalb vor der neuen App ausrollen.

## A/B-Vorbereitung

`EXPO_PUBLIC_ADAPTIVE_LESSONS=control` erzwingt feste Lektionen, `adaptive` die neue Auswahl, `beta` eine stabile 50/50-Zuteilung angemeldeter Konten. Gruppe und Experimentkennung `p302-beta-v1` werden mit dem Durchgang gespeichert; erzwungene Modi und Gäste erhalten diese Kennung nicht. Fehlende Ratings können auch im adaptiven Arm tatsächlich einen festen Plan ergeben; die Messung hält Gruppe und verwendete Auswahl getrennt. Ein gestarteter Durchgang wechselt nicht nachträglich den Arm.

Keine dieser Einstellungen aktiviert Analytics oder hebt rechtliche Sperren auf. Nach entsprechender Freigabe können Betreiber über die Service-Rolle `adaptive_beta_report(first_day,last_day,as_of)` lesen. Der Bericht enthält nur aggregierte Anzahlen von Lernenden, Starts und innerhalb von 24 Stunden empfangenen Abschlüssen, getrennt nach Arm, verwendeter Auswahl und Lektionsversion. Nur die ausdrücklich gekennzeichnete Beta gehört zum Vergleich, keine erzwungenen Modi oder alten Starts. Starts ohne Abschluss bleiben im Nenner; noch nicht 24 Stunden beobachtete Starts fehlen bewusst.

Für die Abnahme vorab Kohorte, Dauer, Konten als Zuteilungseinheit, Nichtunterlegenheitsmarge und Auswertung festlegen. Wiederholte Versuche pro Konto sind abhängig. Der beschreibende Bericht ersetzt keine dafür geeignete statistische Analyse. Offline-Empfang und Einwilligungsauswahl können die beobachtete Gruppe verzerren.

## Prüfung und offene Abnahme

Automatisierte Prüfung umfasst den Zielbereich und Fallbacks, alle 85 aktuellen Lektionspläne, Manipulationen, Nachweis-Replay, Energie/Quellversionen, Schwächen ohne Kursprämie, neue und alte Einstufung, Konto-/Offline-Snapshots und echte lokale JWT-/Postgres-Integration. Der private Beta-Bericht wird mit synthetischen Daten geprüft, einschließlich abgebrochener und zu junger Starts.

Lokal am 16.10.2026 geprüft: vollständiger Paket-/App-/Tool-Durchgang plus gezielte Regressionen nach den letzten Änderungen; 380 pgTAP-Prüfungen; 75 echte lokale Rating-/Auswahl-API-Prüfungen; bestehende Lern-Sync- und Datenschutz-Integration (226 Offline-Versuche bzw. 105 Prüfungen); Deno, Übersetzungen, Typen, ESLint und Formatierung. Alle 20 Browserprüfungen bestehen, einschließlich drei neuer DE/US/UK-Durchgänge vom unabhängigen Gast-Nachweis bis zum gespeicherten Schwächentraining, dunkler Darstellung, reduzierter Bewegung und axe. Gemessen ausschließlich im lokalen Chromium: Start-P95 rund 1,405 s, Lektionsöffnung-P95 rund 280 ms. Keine akustischen oder physischen Gerätebelege. Der Produktions-Export enthält keine unveröffentlichten Inhalte und besteht die Größenbudgets. GitHub-CI und Reviews folgen erst über Claudes späteren PR.

Offen bleiben der reale Beta-A/B-Vergleich ohne verschlechterte Abschlussquote, die empirische Kalibrierung der Aufgabenprofile und Diagnose-Anker sowie echte iOS-/Android-Geräteabnahme. Es gibt weiterhin keine fachliche Freigabe von Entwurfsinhalten oder öffentliche P2-Launch-Abnahme. Automatische Tests ersetzen diese Nachweise nicht.
