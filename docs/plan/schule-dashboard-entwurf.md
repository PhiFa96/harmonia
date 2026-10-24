# P4.13 – Organisationen, Klassen und Lehrer-Dashboard als interner Entwurf

Stand: 23.10.2026 · Arbeitsbranch `codex/p4-13-school-draft`

**Technische P4-Vorarbeit auf ausdrücklichen Nutzerauftrag, vor der formalen Phase-4-Freigabe.** P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt. Die dafür im Plan vorausgesetzte Dashboard-Basis wird für diesen Entwurf durch eine eigene lokale Web-Werkstatt ersetzt. Das ist keine Abnahme von P4.01 oder P4.13 als Schulprodukt. P4.17, AVV, Landesrecht, Rollen-/Identitätsprüfung, reale Konten und Geräte bleiben offen. Keine Veröffentlichung oder Bereitstellung.

## Ausprobieren

```sh
corepack pnpm school:preview
```

Voraussetzungen: Projektabhängigkeiten, Node gemäß `.nvmrc`, Docker am lokalen Unix-Socket. Das Werkzeug startet einen eigenen PostgreSQL-17-Container mit zufälligem Passwort, zufälligem Loopback-Port und flüchtigem Datenträger; keine bestehende Datenbank, kein Host-Volume und keine konfigurierbare Remote-URL. Die Oberfläche läuft auf `http://127.0.0.1:8238` (anderer lokaler Port über `HARMONIA_SCHOOL_PORT`). Beim regulären Stoppen werden Server und eigener Container beendet, damit dessen Daten gelöscht werden. Nach einem harten Prozessabbruch kann der eigene Container mit Präfix `harmonia-school-` bis zum manuellen Entfernen bestehen bleiben. Keine echten Personen oder Daten eingeben.

Die Oberfläche bietet DE, en-US und en-GB. Acht ausdrücklich synthetische Konten sind frei wählbar; diese Auswahl ist **keine Authentifizierung**. Es gibt keine Schüleranmeldung, E-Mail, echte Einladung oder Supabase-Verbindung. Ein Schulbetrieb ist damit nicht möglich.

1. Mit Verwaltung A eine erfundene Organisation anlegen. Das erstellende Testkonto wird deren Verwaltung.
2. Eine Lehrkraft per Code aufnehmen; mit Lehrkraft A den Code einlösen. Lehrkräfte können in ihren Organisationen Klassen anlegen und sind dieser Klasse dann zugewiesen.
3. Verwaltung weist weitere bestehende Lehrkräfte einer Klasse zu oder entzieht die Zuordnung. Organisationsverwaltung allein gewährt keinen Zugriff auf Lernstände.
4. Lehrkraft erzeugt einen Klassencode; ein Lernkonto tritt bei. Die Mitgliedschaft beginnt ohne Lernstandfreigabe. Codes werden nur einmal angezeigt, gelten 24 Stunden und erlauben 1–30 neue Beitritte. Neue Codes ersetzen vorherige desselben Bereichs; Widerruf ist möglich. Nur SHA-256-Hashes werden gespeichert.
5. Lernkonto gibt den synthetischen Lernstand ausdrücklich für eine bestimmte Klasse frei. Die Lehrkraft sieht Klassenübersicht, einzelne Lernkonten, Lernbereiche und Testquoten. Andere Lehrkräfte derselben Organisation und andere Klassen bleiben ausgeschlossen.
6. Freigabe widerrufen, Klasse verlassen, Mitgliedschaft oder Lehrerrecht entfernen. Der nächste Datenabruf berücksichtigt den Entzug. Geöffnete Berichte werden alle zehn Sekunden und nach Rückkehr in das Browserfenster neu abgerufen; bei verborgenem Fenster oder fehlgeschlagenem Berichtabruf wird die alte Darstellung entfernt. Bereits gesehene Angaben lassen sich nicht zurückholen.
7. Archivieren sperrt Einladungen und Lernstandzugriff und hebt alle Freigaben auf. Verwaltung kann eine Klasse samt Mitgliedschaften, Freigabeprotokoll und Einladungen löschen.

Beim Entfernen einer Lehrkraft werden ihre Klassenzuordnungen und ausgegebenen Codes ungültig; bestehende Organisations-Einladungscodes werden ebenfalls widerrufen. Beim Entfernen eines Lernkontos wird der Klassencode widerrufen, damit ein bekannter alter Code die Entfernung nicht rückgängig macht. Freiwilliges Verlassen erlaubt erneuten Beitritt mit einem noch gültigen Code, immer ohne neue Freigabe.

## Daten und Berechtigungen

- Getrenntes Schema `school_draft` in `tools/school/schema.sql`; **keine Supabase-Migration**, keine Aufnahme in öffentlich exponierte Schemas. Organisationen, Rollen, Klassen, Lehrerzuordnungen, pseudonyme Lernmitgliedschaften, Einladungen, Freigabeereignisse und synthetische Nachweise.
- Alle neun Tabellen haben PostgreSQL-RLS. Die Anwendungsrolle kann weder direkt schreiben noch RLS umgehen oder sich anmelden. Änderungen laufen über Funktionen mit festem leerem Suchpfad, ausdrücklichen Rechten und fachunabhängigen Zugriffsprüfungen. `PUBLIC` hat weder Schema- noch Funktionsrechte.
- Der lokale Server bestimmt die Testidentität aus einem HttpOnly-/SameSite-Strict-Cookie. Jede Datenbanktransaktion setzt Rolle und Identität ausschließlich mit `SET LOCAL`; Pool-Verbindungen tragen keine Identität in die nächste Anfrage. Die Produktionsauthentifizierung ist ausdrücklich noch nicht implementiert.
- Klassen dürfen nur von Organisationsmitgliedern angelegt werden. Eine klassenübergreifende Lehrerzuordnung scheitert bereits an zusammengesetzten Fremdschlüsseln. Nur Verwaltung kann Lehrerrechte vergeben und entfernen; Lernkonten können sich keine Personalrolle geben.
- Lernstandfreigabe gilt je Klasse für deren zugewiesene Lehrkräfte, auch spätere Neuzuweisungen; die Oberfläche erläutert das. Ein neues Klassenziel oder erneuter Beitritt übernimmt keine Freigabe. Änderungen werden mit Zeitpunkt und Textversion protokolliert. Dieses Testprotokoll ist kein Nachweis einer rechtlich wirksamen Einwilligung.
- Ergebnisdaten sind feste, lesbare **synthetische Fixtures**, keine importierten persönlichen Lernhistorien. Lehrkräfte und Lernende können keine Punkte hochladen. RLS beschränkt sie auf die eigene Person oder freigegebene Klassenbezüge und die letzten 30 Tage. Ein Bericht liest Zuordnungen, Freigaben und Nachweise in einem gemeinsamen SQL-Snapshot.
- Klassenquoten summieren richtige und gesamte Antworten. Fehlende und nicht freigegebene Daten werden nicht als null Punkte gezählt; die Freigabeabdeckung bleibt sichtbar. Die 80-%-Markierung ist ausschließlich ein Übungshinweis aus Testdaten, keine Note, Einstufung oder fachliche Freigabe.
- Exakter Host, gleiche Origin für JSON-Schreibzugriffe, 8-KiB-Anfragelimit, restriktive CSP und `no-store`. Codes werden per POST eingelöst, nicht in URLs oder Logs geschrieben. Fremde Organisations-/Klassen-IDs und mitgesendete Rollen/Identitäten ändern keine Berechtigung.

## Prüfungen

```sh
corepack pnpm school:test
corepack pnpm school:test:db
corepack pnpm school:test:web
```

`school:test` prüft den tatsächlichen HTTP-Server und PostgreSQL, einschließlich paralleler letzter Codeeinlösungen, idempotenter Wiederholung, Ablauf/Widerruf, Rollen-/Klassentrennung, Klassenfreigabe, Rechteentzug, Archivierung/Löschung, Manipulationen und Pool-Isolation. Ein separater Teil prüft gewichtete Aggregation, Übersetzungen und die Produktions-Bundle-Sperre.

`school:test:db` führt pgTAP gegen denselben Schemaentwurf aus. Lokal nutzt es einen eigenen Container und die unveränderte SQL-Quelle von pgTAP 1.3.4 mit fest geprüftem SHA-256 und den beiden üblichen Versions-/Plattformersetzungen; dafür sind `curl` und Zugriff auf `raw.githubusercontent.com` nötig. In der bestehenden Supabase-CI verwendet `school:test:db --supabase` ausschließlich die lokale Datenbank auf Port 54322 und deren pgTAP-Erweiterung. Sämtliche Schul-DDL und Testdaten werden dort zurückgerollt.

Die lokale pgTAP-Einrichtung wechselt vor dem Schemaaufbau ausdrücklich in eine Rolle ohne Superuserrechte. Wie bei Supabase muss der Testeinrichtung die neu erzeugte Anwendungsrolle mit `SET`-Recht zugeordnet werden; PostgreSQL 16+ erteilt das beim Anlegen nicht automatisch. Diese ausschließlich für den Test nötige Mitgliedschaft wird mit zurückgerollt. Der erste Supabase-CI-Lauf deckte diese Abweichung auf; der ergänzte lokale Lauf unter eingeschränkten Rechten besteht ebenfalls alle 39 Prüfungen.

Browserprüfungen verwenden echte lokale Server-/Datenbankzustände, keine API-Attrappe: Organisations-/Klassenzyklus, DE/US/UK, getrennte Browserkonten für Widerruf, Reload, schmale Ansicht, Tastatur, Axe und Anzeige beliebiger Bezeichnungen als Text. Nur synthetische Browserbelege werden als kurzlebige CI-Artefakte gespeichert, keine Datenbank oder Sitzungstoken. App-Produktionsbundle und Standardübersetzungen enthalten keinen Schulentwurf.

Lokaler Nachweis am 23.10.2026: **39/39 pgTAP-Prüfungen**, **12/12 Server-/Werkzeugtests**, **4/4 Chromium-Abläufe**, vollständiger Lint, Typcheck und Formatprüfung erfolgreich. Produktions-Webexport mit fünf JavaScript-Dateien und Entwurfs-Bundle-Prüfung bestanden. Der pgTAP-Lauf fand während der Entwicklung eine zu weit gefasste Standard-Funktionsberechtigung; ein ausdrücklicher `PUBLIC`-Entzug ist implementiert und durch den erfolgreichen Wiederholungslauf belegt. Der zusätzliche Supabase-CI-Lauf prüft denselben Entwurf mit der dort installierten Erweiterung; lokale PostgreSQL-Prüfungen ersetzen dessen Status nicht.

## Nächste technische Schritte und offene Produktabnahmen

- P4.14 ergänzt auf einem Folgebranch die Klassenrechte und Mitgliedschaften um [Aufgaben zusammenstellen, zuweisen, bearbeiten und auswerten](schulaufgaben-entwurf.md). Diese Erweiterung verwendet tatsächlich im synthetischen Probelauf bewertete Antworten; der allgemeine P4.13-Lernstandbericht bleibt auf seinen Fixtures. [P4.15 ergänzt auf einem weiteren Folgebranch ein internes Live-Quiz](klassen-live-quiz-entwurf.md); die Schullizenz ist noch nicht implementiert.
- Vor echten Daten: P4.17, Rechtsgrundlage je Schulkontext/Land, Verantwortlichkeiten/AVV, Identitäts- und Rollenprüfung, Minderjährigenkonzept, Vertrag, Datenschutzinformation und genehmigte Löschfristen.
- Vor Betrieb: produktive Migration/Auth-Bindung, verifizierte Lernnachweise statt Fixtures, Kontenexport/-löschung, Audit-/Betriebskonzept und reale Pilotabnahme. Keine der vorhandenen Simulationen ersetzt diese Prüfungen.

Technische Datenschutzanlage: [P4.13 Datenschutzentwurf](../quality/p4-13-datenschutz-entwurf.md). Architekturentscheidung: [ADR 0040](../decisions/0040-schule-als-isolierter-datenbankentwurf.md).
