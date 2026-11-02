# ADR 0072 – Zusammenhängender Schulentwurf mit Identitätsbindung und Datenrechten

Datum: 02.11.2026. Status: technische Entwurfsentscheidung auf ausdrücklichen Nutzerauftrag; Produkt-, Rechts-, Anbieter- und Pilotabnahmen offen.

## Anlass

P4.13–P4.16 sind als lokale Werkstatt integriert. Der Nutzer beauftragt ihre gemeinsame Vervollständigung. Die Befunde D-F1–D-F13 betreffen übergreifend Klassen, Aufgaben, Quiz und Lizenzen. Sie werden gemeinsam bearbeitet, ohne das lokale Schema in eine Produktionsmigration zu überführen.

Dies bleibt **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe**. Inhalte, Texte, Freigabe- und Aufbewahrungsregeln bleiben Entwurf. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt. Kein Merge, Deployment, öffentlicher Schulbetrieb, echte Rechnung oder Zahlung.

## Entscheidung

### Identität und Rollen

- `school_draft.actor()` verwendet `auth.uid()`. Das alte `school_draft.actor`-GUC ist für Rechte wirkungslos. Der isolierte PostgreSQL-Container erhält einen ausschließlich lokalen Auth-Fixture-Helfer; der Supabase-pgTAP-Lauf verwendet die vorhandene echte `auth.uid()`-Funktion.
- Der lokale HTTP-Server hat zwei klar getrennte Modi: die sichtbar synthetische Kontenauswahl für die Werkstatt und einen Integrationstestmodus mit geprüften signierten JWTs. Letzterer verlangt ausdrücklich konfigurierte vertrauenswürdige Ausstellerkennung, Audience und öffentliche JWKS. ES256/P-256 und RS256 mit mindestens 2048 Bit, Signatur, `kid`, Aussteller, Audience, UUID-Subjekt, Ablauf und optionale Zeitgrenzen werden geprüft. Schlüsseladressen aus Tokens werden nicht abgerufen. Kontoart und Betreiberrechte werden nicht aus Token-Metadaten übernommen.
- Eine Tokenidentität muss bereits im lokalen Kontenbestand registriert sein. Im geprüften Modus gibt es keinen Wechsel zu frei wählbaren Fixture-Konten; die Oberfläche zeigt diese Auswahl nicht an. Die Betreiberberechtigung stammt aus einer eigenen, für Anwendungsrollen nicht schreibbaren Registrierung. Keine fest verdrahtete Betreiber-UUID oder Ableitung aus dem Kontonamen.
- Sitzungen enden nach 15 Minuten ohne HTTP-Aktivität, nach höchstens acht Stunden und im geprüften Modus spätestens mit dem Tokenablauf. SSE-Abfragen verlängern die Lebensdauer nicht. Abgelaufene Einträge geben die begrenzte Kapazität frei. Logout und Kontolöschung beenden betroffene Sitzungen und Streams. Jeder Request behält die vor dem ersten Datenbank-Await erfasste Identität.

### Freigaben und minimale Berichte

- Freigabeversion `school-draft-sharing-v2` nennt Lernbereiche, Quoten, abgeschlossene Beispiellektionen, Zeitpunkte, abgeschlossene Klassenaufgaben und finale Quizergebnisse. Eine eigene ausdrückliche Bestätigung ist nötig. Eine alte Freigabe wird nie still auf diesen Umfang erweitert; RLS und alle drei Berichtspfade prüfen die aktuelle Version. Auch der Freigabe-Prüfhelfer gibt fremden Lernkonten keinen Freigabestatus preis; er ist auf das eigene Konto und zugewiesene Klassen begrenzt. Die freiwillige Quizrangliste bleibt getrennt.
- Klassenmitgliedschaften erhalten zufällige Kürzel und eigene zufällige Handles. Lehrkraftberichte enthalten Mitgliedschaftshandles statt Lernkonto-UUIDs. Verlassen und Wiederbeitritt erzeugen eine neue Mitgliedschaft; ein altes Handle kann sie nicht entfernen. Privat gespeicherte Kontenreferenzen bleiben für Zuordnungen und die autorisierte serverseitige Bewertung nötig.
- Die öffentliche Anwendungsrolle kann keine Zuordnung von Quizkürzeln zu fremden Konten lesen. Die getrennte Serverrolle benötigt diese Zuordnungen zur Bewertung und erstellt daraus minimale Berichte. Betreiberhistorien liefern nur Rechnung, Art und Zeitpunkt; `actor_id` und `target` sind nicht freigegeben.
- Die Verwaltung kann sich einer bestehenden Klasse nicht selbst als Lehrkraft zuweisen. Der ausdrücklich eine Klasse erstellende Account bleibt deren anfängliche Lehrkraft. Jede Hinzufügung/Entfernung wird protokolliert und ist für Klassenmitglieder einsehbar. Eine Verwaltung kann ihre Organisationsrolle an ein vorhandenes Personalmitglied übertragen; ein letztes Verwaltungskonto mit anderen Beteiligten muss dies vor der Kontolöschung tun.
- Lernende erscheinen erst nach einer eigenen Platzanfrage in der Lizenzvergabe. Sichtbar ist ein organisationsbezogenes Lizenzkürzel und ein entsprechendes Handle. Die Anfrage gibt keine Lernstände frei. Ihre Rücknahme entfernt zugewiesene Plätze; nach Ende der letzten Mitgliedschaft oder Wiederbeitritt braucht es eine neue Anfrage. Personal bleibt über organisationsbezogene Mitgliedschaftshandles zuweisbar.

### Datenbankgrenzen und Fehlerfälle

- Datenbanktrigger weisen neue oder nachträglich geänderte Aufgabenantworten nach Frist, Schließung oder Abschluss zurück. Antworten wachsen nur um einen Eintrag, bestehende Antworten und abgeschlossene Bewertungen bleiben unverändert. Die Datenbank bestimmt Abschlusszeiten; der Server bleibt das Bewertungsorakel. Quizantworten benötigen auch auf Datenbankebene die aktuelle offene Runde und deren Zeitfenster.
- Die zuvor exklusiv gesperrten Aufgaben-/Quiz-Snapshot-Abfragen verwenden gemeinsame Klassen-/Mitgliedschaftssperren. Änderungen bleiben exklusiv; unabhängige Streams warten nicht mehr auf eine exklusive Sperre jedes anderen Lesers. Autorisierung wird weiterhin bei jedem Snapshot geprüft.
- Einladungs- und Quizcodeversuche haben getrennte Budgets von zehn Versuchen je Konto und Minute. Die Reservierung wird separat bestätigt, damit ein fehlgeschlagener Lookup sein Budget nicht zurückrollt. Der HTTP-Server antwortet bei Erschöpfung mit 429 und `Retry-After`.
- Eindeutigkeitskollisionen bei Codes und Spielkürzeln werden höchstens fünfmal mit neuen Zufallswerten wiederholt. Savepoints stellen PostgreSQL-Transaktionen nach einer Kollision wieder her. Erschöpfung wird als wiederholbarer Konflikt statt als interner Fehler ausgegeben. Klassenkürzel verwenden ebenfalls begrenzte Wiederholungen.

### Export, Löschung und Aufbewahrung

- Ein eigener Schulvorschau-Export enthält nur Daten des angemeldeten Testkontos: Mitgliedschaften, Freigabe-/Zuordnungsdaten, eigene Antworten, Teilnahme und eigene Lizenzdaten. Einladungshashes, fremde Konten und zukünftiges Aufgabenmaterial werden nicht ausgegeben. Bewertungen laufender Quizrunden und noch offener Aufgaben werden im Export zurückgehalten.
- Die Löschung entfernt Konto, Mitgliedschaften, eigene Antworten, Platzanfragen, Plätze, Testlernstände und ausgestellte Einladungen. Die fehlenden Fremdschlüsselkaskaden werden ergänzt. Minimale Auditverweise werden gelöst; ihre zeitliche Grenze bleibt bestehen. Bereits außerhalb der Vorschau heruntergeladene Exporte lassen sich dadurch nicht zurückholen.
- Freigabeereignisse bleiben beim Verlassen einer Klasse für den eigenen Export erhalten. Klassenlöschung löst den Klassenverweis; Kontolöschung löst den Kontoverweis. Dies ist keine Behauptung vollständiger Anonymität oder einer rechtlich abgenommenen Beweisaufbewahrung.
- Der ausschließlich lokale Betreiberlauf entfernt Aufgaben 30 Tage nach Frist/Schließung, Quizdaten sieben Tage nach Raumablauf, Testlernstände nach 30 Tagen, Übungsantworten nach einem Tag, Einladungen einen Tag nach Ablauf, Versuchszähler nach einem Tag sowie Auditdaten nach 180 Tagen. Archivierte Klassen enden nach 30 Tagen, ungültige Rechnungsproben 180 Tage nach Laufzeitende. Aktive Mitgliedschaften bleiben bis Verlassen, Konto-/Klassenlöschung oder Ende einer archivierten Klasse bestehen. **Das sind technische Entwurfswerte, keine juristisch freigegebenen Fristen.** Es wird kein Remote-Cron eingerichtet.

### Isolation und Übergabe

`codex/school-complete-draft` basiert unabhängig auf `main` bei `f7bc15d`. Die offenen PRs #143/#144 und #136 sind keine Voraussetzungen dieses Branches. Katalog, musikalische Inhalte und Lektionsversionen werden durch das Schulpaket nicht geändert; bei späterer gemeinsamer Integration bleiben deren neuere Versionen erhalten.

Die Werkstatt verwendet weiterhin ausschließlich eine eigene flüchtige PostgreSQL-Datenbank und Loopback-HTTP. Das revidierte Schema besteht aus 26 RLS-Tabellen. `complete.sql` wird beim internen Neuaufbau nach den vier Grundlagen geladen; es ist keine freigegebene Produktmigration. Der öffentliche Bundlewächter erfasst nun alle separaten Schultexte, soweit sie keine bereits öffentlichen gemeinsamen Sprachwerte sind. Keine Schulroute oder Schulressource gelangt in den öffentlichen App-Einstieg.

## Nachweise und Grenzen

Die ersten sieben Regressionen waren ohne Korrektur rot. Geprüft werden insbesondere Rechte unter echten Datenbankrollen, alte Freigaben, Frist-/Abschlussschutz, Export ohne vorzeitige Quizbewertung, Löschkaskaden, Betreiberbindung, Codebudgets, Kollisionen, parallele Lesesperren sowie ablaufende HTTP-Sitzungen. Ein zusätzlicher Browserbefund zum Erhalt der Datenschutzansicht beim Sprachwechsel wurde zuerst rot abgesichert und behoben. DE/en-US/en-GB prüfen vollständige Abläufe mit tatsächlichem HTTP-Server und PostgreSQL, einschließlich eigener Tokens, Download und Löschung.

Konkrete lokale Ergebnisse und alle fünf GitHub-CI-Jobs am finalen Head stehen im Entwurfs-PR. Echte Anbieteridentitäten und Schlüsselrotation, Produktmigration/Einbindung in die bestehenden Konto-Datenrechte, freigegebene Lernquellen, Schulrecht/AVV und Einwilligungsgrundlage, P4.17, Steuer-/Rechnungsprüfung, Pilotbetrieb, reale Screenreader-/Geräteabnahmen und 30 tatsächliche Quizgeräte bleiben vor Produktbetrieb erforderlich. Keine dieser Abnahmen folgt aus synthetischen Tests.
