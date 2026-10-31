# ADR 0043 – Schullizenz mit getrennter Betreiberfreigabe

- Datum: 24.10.2026
- Status: angenommen für den internen Entwurf, keine Verkaufs-/Schulfreigabe
- Bezug: P4.16, ADR 0040–0042

## Kontext

Die lokale Schulwerkstatt braucht einen prüfbaren Ablauf für Plätze, Laufzeiten und Premium-Freischaltung. Echte Verträge, Zahlungsanbieter, Rechnungsanforderungen und Pilotschule sind nicht abgenommen. Bestehende persönliche Abos verwenden kontogebundene Zugriffsrechte und dürfen nicht durch die Schulverwaltung überschrieben werden.

## Entscheidung

Ein separates, festes synthetisches Betreiberkonto erzeugt unveränderliche Rechnungsproben und bestätigt eine ausdrücklich simulierte Zahlung. Organisationsverwaltung darf diese Freigabe nicht selbst erzeugen; sie verteilt anschließend Plätze an eigene aktuelle Mitglieder. Centbeträge werden serverseitig berechnet, Vorgangskennungen sichern Wiederholungen ab. Aufheben ist endgültig; neue Konditionen erfordern eine neue Probe.

Rechnungen, Plätze, Verlauf und Übungen liegen in vier zusätzlichen lokalen RLS-Tabellen. Datenbankfunktionen mit festen Suchpfaden prüfen jede Mutation. Sperren je Rechnung schützen den letzten Platz; Mitgliedschaftssperren und Trigger verhindern einen alten Platz nach Austritt/Wiederbeitritt. Die zusätzliche Betreiberrolle erhält keine Klassen-/Lernstandrechte. Premium und Lernstandfreigabe bleiben unabhängig.

Aktive Rechte ergeben sich aus mindestens einer bezahlten, aktuell gültigen Rechnung mit eigenem Platz und aktueller Organisationsmitgliedschaft. Die Zeitgrenze lautet Beginn inklusive, Ende exklusiv. Überlappende Quellen bleiben unabhängig. Der lokale Adapter verwendet das bestehende `AccessStatus`-Schema und schaltet eine tatsächliche servergesperrte Übungswerkstatt ohne Energielimit frei. Er schreibt keine persönlichen Abos und aktiviert keine echte KI-Nutzung.

Rechnungsdownload ist eine eigenständige, maskierte HTML-Probe mit deutlich sichtbarem Hinweis „nicht zahlbar“. Es wird nichts versendet oder belastet. Produktive App-/Anbieterintegration bleibt eine spätere gesonderte Umsetzung.

## Folgen

- Der vollständige lokale DE/EN-Ablauf kann einschließlich Konkurrenz, Ablauf, Entzug und Browser geprüft werden.
- Das neunte frei wählbare Testkonto ist keine produktive Betreiberidentität. Journal, Rechnung und Testpreis sind keine kaufmännische oder rechtliche Abnahme.
- Keine Produktivmigration, externe Zahlung, automatische Verlängerung oder Steuerentscheidung. Alle Quellen bleiben Entwurf.
- Technische P4-Vorarbeit erfolgt vor der formalen P4-Freigabe. P4.01 bleibt bis F14/Recht zurückgestellt; P4.17, AVV/Schulrecht und echte Pilotschule bleiben offen.
