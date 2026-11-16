# Zertifikate: lesende Ansichten und Export ohne Datenänderung

Stand: 14.11.2026 · Branch `codex/certificate-readonly-views-draft` · Basis `main@ab157e8`.

Auf Nutzerauftrag wird N4 aus dem [v3-Rohbericht KI/Zertifikate](../quality/fachpruefung-phase-4-v3/ki-zertifikate.md) als zusammenhängendes Paket bearbeitet. Technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**. Die vorhandenen Fachprüfungen bleiben dokumentiert; dies ist keine neue unabhängige Fach-/Rechts- oder Produktabnahme. Keine Veröffentlichung, entfernte Bereitstellung oder Main-Integration. Inhalte und Zertifikate bleiben Entwurf; P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt. [ADR 0079](../decisions/0079-zertifikatsansichten-ohne-schreibeffekte.md).

## Verhalten

| Vorgang | Wirkung |
|---|---|
| Status, eigener Export, Codeprüfung, Belegabruf | Ein konsistenter Lesesnapshot; kein Abschluss, Invalidierungsdatum oder Bereinigungs-DELETE |
| Frist während einer Ansicht abgelaufen | Berechnetes Timeout-Ergebnis mit Fristzeit, ohne neuen Mustercode; keine Speicherung |
| Beschädigter oder fremder Prüfstand | Als veraltet erkannt; andere Datensätze bleiben sichtbar, kein Invalidierungs-UPDATE beim Lesen |
| Antwort/Abgabe | Die bisherigen expliziten Abschluss- und Idempotenzregeln gelten weiter |
| Neuer Start nach Timeout/veraltetem aktivem Datensatz | Vorherigen aktiven Platz in derselben Schreibtransaktion freigeben; kein zweiter aktiver Durchgang oder zweiter Verbrauch einer Bestellung |
| Siebentagesgrenze | Lesen blendet alte Zeilen aus; physische Löschung nur durch Schreibtransaktion oder Wartung |

Alle vier lesenden Servicemethoden verwenden `BEGIN` statt `BEGIN IMMEDIATE` und schützen die Verbindung vorübergehend mit `query_only`. Der Schutz wird auch nach einem Fehler wieder entfernt. Ein reservierter anderer Schreiber verhindert deshalb nicht bereits die Lesetransaktion. Exklusive Datenbanksperren können weiterhin einen tatsächlichen Lesezugriff scheitern lassen; es wird keine unbegrenzte Verfügbarkeit behauptet.

Der Serverzeitpunkt wird einmal je Snapshot erfasst. Bei einem Timeout enthält Exportversion 1 nun übereinstimmende Werte für `phase`, `reason`, `finishedAt` und `result.issuedAt`. Die Abschlusszeit ist die vorhandene Frist, die Engine-Wertung unverändert. Ein nur dargestellter Timeout erzeugt weder einen gespeicherten Abschluss noch einen PDF-Code. Spätere ausdrückliche Abgabe/Antwort oder ein neuer Start persistieren die erforderlichen Übergänge nach den bestehenden Regeln.

## Aufbewahrung und Wartung

Leser berücksichtigen den Stichtag durch SQL-Filter. Die Grenze ist unverändert exklusiv: genau sieben Tage alte Zeilen bleiben enthalten, ältere werden ausgeblendet. Auch alte Testbestellungen bleiben enthalten, solange sie zu einem noch aufbewahrten eigenen Durchgang gehören. Ein eigener Export oder eine Codeprüfung kann keine alten Zertifikatsdaten anderer Konten entfernen.

`maintain()` ist eine private Serviceoperation und liefert nur Löschzahlen. Der bestehende lokale Server ruft sie beim Start und anschließend alle 60 Sekunden auf. Neue Schreibvorgänge führen dieselbe Bereinigung ebenfalls in ihrer eigenen Transaktion aus. Ein gesperrter Wartungslauf wird ohne Rohfehler/Kontokennungen protokolliert und beim nächsten Intervall erneut versucht. Beim Serverstopp wird der Timer gelöscht. Während der Server nicht läuft, wird keine Hintergrundbereinigung behauptet; der nächste Start beziehungsweise Schreibvorgang holt sie nach. Es gibt keine produktive Scheduler-Einrichtung oder öffentliche Wartungsroute.

**Die Authentifizierungsbuchhaltung ist ein eigener Zweck:** Die bestehende Testsitzungsprüfung aktualisiert weiterhin `seen` und bereinigt abgelaufene Sitzungen. HTTP-Ansichten sind deshalb keine Aussage, dass in sämtlichen Tabellen des Servers nichts geschrieben wird. Rein lesend sind hier die Zertifikats-/Kaufansichten. Die Service-Dateibyteprüfungen und die HTTP-Prüfungen der Zertifikatstabellen sind entsprechend getrennt.

## Prüfungen

Neun Regressionen wurden vor der Implementierung rot beobachtet. Die neuen Fälle verwenden eigene temporäre SQLite-Dateien, simulierte Testbestellungen und den echten lokalen HTTP-Server. Kein bestehender Nutzerdatenbestand wird für Tests geöffnet.

- Alle vier Leser müssen trotz abgelaufener fremder Datensätze die gesamten SQLite-Dateibytes unverändert lassen.
- Veraltete/beschädigte Zeilen bleiben isoliert; ihre Anzeige schreibt kein `invalidated`.
- Timeout-Export bleibt konsistent, berechnet die vorhandenen Punkte und liefert keinen Code. Erst eine ausdrückliche Abgabe speichert den Abschluss.
- Eine zweite Verbindung hält `BEGIN IMMEDIATE`, während der Service erfolgreich liest; nach einem fehlgeschlagenen Belegabruf sind reguläre Schreibvorgänge weiterhin möglich.
- Fristgrenzen, ein während der Snapshotbildung fortschreitender Zeitgeber, alleinstehende alte Bestellungen und ein alter Auftrag mit aktuellem Durchgang sind abgedeckt.
- Echte HTTP-Anfragen prüfen Status, parallele Exporte, minimale Codeprüfung und private PDF-Ausgabe ohne Änderung von Prüfungs-/Kaufdaten. Sitzungsaktivität bleibt ausdrücklich schreibend.
- Die minütliche Wartung wird mit kontrolliertem Timer geprüft: Sperrfehler, Wiederholung nach Freigabe und kein Aufruf nach Serverstopp.
- Drei Browserfälle prüfen DE/en-US/en-GB auf schmalem Bildschirm: Fristende, Reload, Ergebnis ohne PDF-Code, echter JSON-Download, konsistente Fristmetadaten, unveränderte Daten und Axe.

```sh
node --test tools/certificates/read-only.test.mjs tools/certificates/certificates.test.mjs tools/certificates/review.test.mjs tools/certificates/complete.test.mjs
corepack pnpm certificates:test:web
corepack pnpm test:tools
corepack pnpm typecheck
NODE_OPTIONS=--max-old-space-size=8192 corepack pnpm lint
corepack pnpm format:check
corepack pnpm check:ai
corepack pnpm check:certificates
```

Konkrete lokale Zahlen und alle fünf erforderlichen GitHub-Jobs am finalen Commit stehen im Entwurfs-PR. KI- und Zertifikatsfreigaben bleiben geschlossen. Keine neue Fragenbank, Bewertung, Bestehensgrenze, Inhaltsversion oder SQL-Migration. Katalog 31, Tutor-Prompt/Werkzeuge 5/3 bleiben bestehen.

## Getrennte offene Punkte

Die separaten Schul-/Tutor-/Importbindungs-PRs #151/#156/#157 sind nicht enthalten. Insbesondere die stärkere Importbindung aus #157 ist auf diesem eigenständigen Arbeitsbranch nicht als integriert ausgegeben. Eine spätere gemeinsame Integration verändert Prüfwerte; Prüfmappen neu erzeugen und lokale Server neu starten.

N3 bleibt die Grenze der technischen Dateihashprüfung gegenüber Dokumentechtheit und unabhängiger Beurteilung. N5 bleibt die ausdrücklich lokale, vom Sitzungsinhaber bedienbare Zahlungssimulation; keine echte Anbieter-/Identitäts-/Zahlungsberechtigung wird behauptet. Unabhängige Fach-/Quellen-/Sprachprüfung sowie reale Geräte-/Screenreader-/Anbieter-/Rechtsabnahmen bleiben offen.
