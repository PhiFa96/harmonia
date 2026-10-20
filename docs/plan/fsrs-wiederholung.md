# P3.03 – Wiederholung mit FSRS

Stand 16.10.2026. Branch `codex/p3-03-fsrs-review`, auf dem noch nicht integrierten P3.02-Branch aufgebaut. Claude Code übernimmt PR, CI und Integration nach P3.02. [ADR 0030](../decisions/0030-fsrs-aus-kanonischen-lernnachweisen.md) beschreibt Bewertung, Parameter und Vertrauensgrenzen.

## Verhalten

- Einstieg „Wiederholen“ auf Lernen und Üben, mit fälligen Fähigkeiten und Wissenskarten sowie nächster Fälligkeit bzw. leerem Zustand.
- Fähigkeiten: bis zu zehn Fragen aus erreichtem Stoff, mit bestehendem Notenbild, Klang, Hinweisen, Fehlerkorrektur, Meldung und dauerhafter Pause/Wiederaufnahme. Die Ergebnisse ändern FSRS und gegebenenfalls Glicko, aber keinen Kursabschluss oder dessen 80-%-Erstversuchsquote.
- Wissenskarten: erst selbst erinnern, dann Erklärung/Notenbild/Klang aufdecken und Erinnerung bewerten. Aufdecken allein speichert keine Wiederholung. Selbsteinschätzung gewährt keine XP oder Freischaltung. Fehlgeschlagenes Speichern kann mit derselben ID und unveränderter Einschätzung wiederholt werden.
- Termine verwenden echte UTC-Zeitpunkte; Anzeige folgt Gerätesprache und Zeitzone. Ein sichtbarer Bereich aktualisiert Fälligkeiten spätestens nach 30 Sekunden.
- Gäste, temporäres Lernen, Offline-Warteschlange, Anmeldung und Kontowechsel bleiben unterstützt. Temporäre Termine gelten nur für die Sitzung. Alte, vor Anmeldung verdichtete Gastdetails können nur noch als lokaler Geräte-Fallback erhalten bleiben.
- Bei vielen offenen Wiederholungen erscheint ein ruhiger Hinweis in der App. Allgemeine freiwillige Lernerinnerungen bleiben erhalten; kein zusätzlicher Push-Versand wird eingerichtet.
- Lizenzhinweis im Profil und vollständiger MIT-Text unter Recht & Informationen.

## Integration für Claude

1. P3.02 über dessen PR-/CI-Ablauf integrieren; anschließend diesen normalen Branch prüfen.
2. Abhängigkeiten mit `pnpm install --frozen-lockfile` installieren.
3. Migration `20261016050000_fsrs_review.sql` additiv anwenden. Sie benennt zunächst Spalten im alten Rating-Writer, damit neue FSRS-Felder alte Writes nicht beschädigen. Bestehende Ratings werden nicht zurückgesetzt.
4. Aktualisierte Functions und Worker ausrollen; ältere Worker drainieren. `learning-sync` verarbeitet anschließend beide Projektionen. Der neue Client verwendet `rowFormat: 4`; ältere Clients erhalten bei nicht lesbaren Rohkarten- oder neuen Wiederholplänen `426 upgrade_required`.
5. Bestehende Rohbelege einmal über `pnpm reviews:backfill --remote` nachholen; Bindungen ausschließlich über sichere Server-Umgebung. `--check` meldet verbleibende Arbeit. Kein Remote-Lauf wurde hier durchgeführt.
6. Worker regelmäßig vor dem bestehenden Aufbewahrungsjob ausführen. Auch der Aufbewahrungsjob arbeitet selbst eine begrenzte FSRS-Seite ab und verdichtet ausschließlich bereits projizierte Nachweise. Er verarbeitet maximal 10.000 Nachweise pro Aufruf und setzt bei erneuter Ausführung anhand atomarer Receipts fort. `--actor <uuid>` begrenzt einen Lauf auf ein Konto.

Lokale Entsprechungen: `pnpm reviews:backfill --local --preview` und `pnpm reviews:backfill --local --check`. Kein Datenbankreset nötig. Die bereitgestellte Cloud-Umgebung benötigt keine zusätzlichen Secrets, Hosts oder Dienste.

## Prüfungen

Die Prüfprogramme umfassen direkten Abgleich mit `ts-fsrs` für vier Anfangsbewertungen und längere Verläufe mit Rückfällen/Zeitumstellung; konservative Hinweise/Fehler, fehlende und veraltete Belege, Quelle/Version, doppelte Offline-Nachweise, Transaktions-/CAS-Konflikte und getrennte Besitzer. Der Deno-Lauf prüft alle 850 verfassten Aufgaben und ihre Quellenpläne.

Echte lokale Postgres-/JWT-/Function-Prüfungen: RLS, nicht fälschbare Termine, Idempotenz, zukünftige Abschlüsse, eigene Snapshots, Energie, fehlende Kursqualifikation, F17 und Kaskadenlöschung. SQLite prüft Dateineustart, Verdichtung, Gastübernahme und beschädigte optionale Caches. Browserprüfungen bedienen sichtbare Noten, Karten und Wiederaufnahme in DE/US/UK, bei 375 bzw. 1280 Pixeln, hell/dunkel und reduzierter Bewegung, einschließlich Axe und Überlaufprüfung.

Lokal bestanden (16.10.2026):

- 659 Content-Tests, darunter 16 FSRS-Prüfungen; 157 Werkzeugtests.
- Vollständiger App-Bestand: 572 Tests in 73 Dateien, einschließlich neuer Karten-/Fehler-/Wiederaufnahme-, SQLite- und Kontoübergangsprüfungen.
- 406 pgTAP-Prüfungen, Schema-Lint ohne Befund; 40 FSRS-, 76 Rating- und 106 Datenschutz-API-Prüfungen mit echten lokalen Konten. Bestehender Lern-Sync mit 226 Offline-Versuchen/Paging/zwei Geräten ebenfalls bestanden.
- Deno: alle 850 verfassten Aufgaben und Quellenpläne, vier Anfangsbewertungen sowie aktualisierte Learning-/Privacy-/Retention-Functions geprüft. Lokaler Backfill ist wiederholbar; Warteschlange leer.
- 23 Browserprüfungen vollständig bestanden. Lokal gemessener Start-P95 1.396 ms, Lektionsaufruf-P95 271 ms; ausdrücklich keine physische Audio-/Gerätemessung.
- Vorschau-Webexport sowie Produktions-Web/iOS/Android-Hermes gebaut. Web-JavaScript 5.485.318 Bytes roh / 1.310.024 Bytes gzip; Android-Hermes 9.240.144, iOS-Hermes 9.024.240 Bytes, jeweils innerhalb der Budgetgrenzen. Zusätzlicher nativer JavaScript-Export: sieben Dateien ohne unveröffentlichte Katalog-IDs oder Inhaltstexte.
- Repositoryweite Typprüfung, Lint/Paketgraph, Formatierung und Übersetzungsprüfung grün. Diese lokalen Ergebnisse ersetzen nicht Claudes spätere PR-/CI-Prüfung. Reale Geräte, langfristige Behaltenswirkung und fachliche Freigabe sind damit nicht behauptet. Es wurden keine echten Teilnehmenden eingeladen, Push-Nachrichten versandt oder öffentliche Inhalte freigegeben.
