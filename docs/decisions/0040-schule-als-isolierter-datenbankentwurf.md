# ADR 0040 – Schul-Dashboard als isolierter Datenbankentwurf

- Datum: 23.10.2026
- Status: entschieden für interne technische Vorarbeit; Produkt-/Rechtsfreigabe offen

## Anlass

Nach den P4.09–P4.12-, P4.19- und P4.18-Entwürfen ist die nächste technische Grundlage P4.13. Der Nutzer beauftragt weiteres Programmieren. P4.01 bleibt ausdrücklich zurückgestellt; echte Schule setzt Rechtsprüfung, P4.17 und eine freigegebene Identitäts-/Betriebslösung voraus.

## Entscheidung

Eine getrennte lokale Web-Werkstatt liefert Organisationen, Lehrerrollen, Klassen, Einladungscodes, klassenbezogene Freigaben und Klassen-/Einzelübersichten. Sie verwendet echte PostgreSQL-RLS und transaktionale Änderungen, aber ausschließlich feste synthetische Konten und Lernnachweise. Der Server startet nur eine eigene flüchtige Datenbank und bindet an Loopback. Die Oberfläche enthält eine deutliche Entwurfskennzeichnung in DE/en-US/en-GB.

Das Schema liegt unter `tools/school/`, außerhalb produktiver Supabase-Migrationen. Keine App-Route, kein Coach-Marktplatz, keine Auth-/Rechtsfreigabe und kein Deployment. Verwaltung und Lehrkraftrechte sind getrennt; Lernstand erfordert sowohl Klassenzuweisung als auch eine klassenbezogene Freigabe. Organisationserstellung und Mitgliedschaftsänderungen werden server-/datenbankseitig begrenzt. Codes sind gehasht, befristet, widerrufbar und unter Sperre begrenzt einlösbar. RLS und Ablauf werden mit pgTAP, tatsächlichen PostgreSQL-/HTTP-Tests und Browserläufen geprüft.

## Folgen

P4.14 erhält eine prüfbare Grundlage, ohne P4.01 umzusetzen. Die Dashboard-Abhängigkeit wird für den internen Entwurf ersetzt; der Produktplan bleibt inhaltlich offen. Ein späterer Produktbetrieb benötigt separate Migrationen, verifizierte Auth-/Rollenbindung, reale Lernnachweise, Datenschutz-/AVV-Verfahren, P4.17 und Pilotabnahme. Die frei wählbaren Testkonten können niemals als Produktionsauthentifizierung übernommen werden.

Umsetzung: [P4.13-Übergabe](../plan/schule-dashboard-entwurf.md).
