# P4.13–P4.16 – Zusammenhängender technischer Schulentwurf

Stand: 02.11.2026 · Branch `codex/school-complete-draft` · Basis `main` bei `f7bc15d`.

Auf ausdrücklichen Nutzerauftrag wird der vorhandene Schulbereich als Gesamtpaket vervollständigt. Dies ist **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe**. Alle Inhalte, Freigabe- und Aufbewahrungstexte bleiben Entwurf. Keine Veröffentlichung, Migration auf eine echte Instanz, echte Rechnung/Zahlung oder Main-Integration. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt. [ADR 0072](../decisions/0072-schulbereich-mit-gebundener-identitaet-und-datenrechten.md).

## Umfang

| Teil | Aktueller technischer Stand |
|---|---|
| P4.13 | Organisationen, Verwaltung/Lehrkräfte, Klassen, Einladungen, aktuelle klassenbezogene Freigaben, Klassen-/Einzelübersicht, sichtbare Zuordnungsereignisse, Verwaltungsübergabe und Kontodatenrechte |
| P4.14 | Zusammenstellen, Einfrieren und Zuweisen eigener Aufgaben, geschützte Links, Antworten/Wiederaufnahme, serverseitige Engine-Bewertung, Fristen/Abschluss zusätzlich in der Datenbank geschützt |
| P4.15 | Lobby, Codes, Lehrer-/Lernenden-/Beameransicht, synchronisierte Runden, freiwillige Rangliste, freigabegebundene Endergebnisse, gemeinsame Lesesperren und begrenzte Codeversuche |
| P4.16 | Ungültige Rechnungsproben, simulierte Zahlung, atomare Platzvergabe, Laufzeiten, freiwillige Platzanfragen, organisationsbezogene Handles, widerrufbare lokale Premium-Übungen |

Alle Oberflächen und neuen Texte sind DE/en-US/en-GB verfügbar. Es entstehen keine regulären Lernnachweise, Ratings, XP oder gültigen Zertifikate. Die allgemeinen Lernstandsproben bleiben ausdrücklich erfunden; Aufgaben-/Quizantworten entstehen im tatsächlichen lokalen Durchlauf und werden von der vorhandenen Engine bewertet.

## Befunde D-F1–D-F13

| Befund | Umsetzung im Gesamtentwurf |
|---|---|
| F1 | `auth.uid()` statt eigenem Actor-GUC; separat konfigurierbarer Modus mit geprüften signierten JWTs; registrierte Identitäten und eigene Betreiberregistrierung |
| F2 | Freigabeversion 2 nennt Aufgaben und finale Quizergebnisse; alte Freigabe genügt keinem Berichtspfad |
| F3 | Zufällige Kürzel je Klassenmitgliedschaft und Mitgliedschaftshandles; Lernkonto-UUIDs fehlen in Lehrkraftberichten |
| F4 | Eigener Export, Kontolöschung/Kaskaden, begrenzte Auditverweise und tatsächlicher lokaler Bereinigungslauf |
| F5 | Datenbanktrigger schützen Frist, Schließung, Antwortfolge und fertige Bewertung; Quizantworten benötigen eine offene aktuelle Runde |
| F6 | Anwendungsrolle ohne fremde Quizzuordnungen; Betreiber ohne lesbare Lizenzziel-/Akteurspalten |
| F7 | Keine Selbstzuweisung der Verwaltung zu bestehenden Klassen; sichtbares Zuordnungsprotokoll und ausdrückliche Verwaltungsübergabe |
| F8 | Gemeinsame Sperren für Snapshots; parallele Leser geprüft, Änderungen weiterhin geschützt |
| F9 | Zehn Einladungs-/Quizcodeversuche pro Konto und Minute, getrennt gebucht und nicht mit Fehlversuchen zurückgerollt |
| F10 | Begrenzte Kollisionswiederholung mit Savepoints und verständlichem Konfliktzustand |
| F11 | Leerlauf-/Maximal-/Tokenablauf, Kapazitätsfreigabe, Logout und Widerruf aller Sitzungen eines gelöschten Kontos |
| F12 | Lernende erscheinen erst nach eigener Platzanfrage mit einem organisationsbezogenen Kürzel in der Vergabe; Rücknahme entfernt Plätze |
| F13 | Zusätzliche echte Rollen-, HTTP-, Konkurrenz-, Export-/Lösch-, Sitzungs- und Browserprüfungen für die neuen Grenzen |

Der ursprüngliche Rohbericht bleibt als Prüfverlauf erhalten. Dies ist eine technische Bearbeitung seiner Befunde und keine unabhängige Rechts-/Fachfreigabe.

## Ausprobieren

```sh
corepack pnpm school:preview
```

Die Vorschau startet nur ihren eigenen flüchtigen PostgreSQL-17-Container, ohne Remote-URL oder Host-Datenverzeichnis. HTTP bindet ausschließlich an `127.0.0.1` (standardmäßig Port 8238). Beim regulären Stoppen wird der eigene Container entfernt. Die neue Schemafassung erfordert einen Neustart der Vorschau; alte Containerstände werden nicht als produktive Migration übernommen.

1. Mit den neun deutlich synthetischen Konten Organisation, Lehrkräfte, Klasse und Lernkonten einrichten. Die freie Auswahl ist keine Anmeldung.
2. Als Lernkonto die vollständige Freigabeversion 2 lesen und ausdrücklich bestätigen. Ältere Freigaben werden als nicht aktuell behandelt. Lehrkraftwechsel sind über das Zuordnungsprotokoll einsehbar; die Freigabe umfasst die jeweils zugewiesenen Lehrkräfte.
3. Aufgaben zuweisen/bearbeiten und Quizrunden durchlaufen. Die Rangliste ist freiwillig. Lehrkräfte erhalten nur die nach der aktuellen Version freigegebenen fertigen Ergebnisse.
4. Für einen Lizenzplatz als Lernkonto eine eigene Platzanfrage stellen. Die Verwaltung sieht das entsprechende organisationsbezogene Kürzel und weist einen verfügbaren simulierten Platz zu. Zurücknehmen oder Beenden der letzten Mitgliedschaft entfernt den Platz; ein Wiederbeitritt stellt ihn nicht wieder her.
5. Über **Meine Schulvorschau-Daten** eigene Daten herunterladen oder das Testkonto löschen. Ein letztes Verwaltungskonto überträgt zuvor die Rolle; eine allein eigene leere Organisation kann mitgelöscht werden. Löschung beendet alle zugehörigen Vorschau-Sitzungen. Heruntergeladene Dateien bleiben außerhalb der Vorschau in eigener Verantwortung.
6. Das gesonderte Betreiberkonto kann dort abgelaufene Testdaten nach der ausdrücklich vorläufigen Regel bereinigen.

Für Integrationstests nimmt `createSchoolServer({ authentication: { issuer, audience, jwks } })` ausschließlich passende, gültig signierte ES256-/RS256-Tokenidentitäten an. Ein Bearer-Token beim initialen `GET /` bindet die anschließende private Cookie-Sitzung an ein registriertes Konto. Die Fixture-Auswahl ist dann gesperrt und ausgeblendet. Die mitgelieferten privaten Signierschlüssel werden nur von den Tests frisch erzeugt; die Serverkonfiguration enthält öffentliche Schlüssel. Eine echte Anbieteranmeldung, echte Kontenprovisionierung und deren Abnahme sind davon getrennt.

## Vorläufige Aufbewahrung

| Daten | Lokale Entwurfsgrenze |
|---|---|
| Beispiel-Lernstände | 30 Tage |
| Aufgaben und Antworten | 30 Tage nach Frist/Schließung |
| Quizräume und Antworten | 7 Tage nach Raumablauf |
| Lizenz-Übungsantworten | 1 Tag |
| Einladungshashes | 1 Tag nach Ablauf |
| Codeversuchszähler | 1 Tag |
| Freigabe-/Zuordnungs-/Verwaltungs-/Lizenzereignisse | 180 Tage |
| Archivierte Klassen einschließlich Mitgliedschaften | 30 Tage nach Archivierung |
| Ungültige Rechnungsproben | 180 Tage nach Laufzeitende |

Der Lauf ist im lokalen Entwurf ausdrücklich vom Betreiber auslösbar. Diese Werte sind keine juristisch abgenommenen Schul-/Rechnungsfristen; es wird kein externer Aufbewahrungsjob eingerichtet. Aktive Mitgliedschaften, Rollen und Platzanfragen enden durch ihren jeweiligen Entzug, Verlassen oder Konto-/Klassenlöschung. Die gesamte Fixture-Datenbank endet bereits mit der Vorschau.

## Prüfungen und Übergabe

```sh
corepack pnpm school:test
corepack pnpm school:test:db
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium corepack pnpm school:test:web
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm format:check
```

Die Datenbankprüfungen laufen sowohl gegen eigene flüchtige PostgreSQL-Fixtures als auch rollbackgebunden gegen das lokale Supabase der CI. Die letzte Instanz verwendet ihre reale `auth.uid()`-Funktion. PostgreSQL-Rollen können sich nicht selbst zum Grader oder Betreiber machen. Browserprüfungen verwenden tatsächlichen HTTP-Server, PostgreSQL, Audio und Downloads, einschließlich neuer Freigaben, Platzanfragen, Sprache, Datenexport/-löschung und ablaufender Identität.

Der Produktions-Bundlewächter erfasst auch die neuen separaten Schultexte. Standardübersetzungen und öffentliche App-Routen importieren diese Werkstatt weiterhin nicht. Konkrete Testzahlen und die fünf erforderlichen CI-Jobs am finalen Commit stehen im Entwurfs-PR.

Die offenen Chor-/Zeitreise-PRs #143/#144 und Tutor-PR #136 bleiben eigenständig. Der Schulpaket-Branch ändert keine Katalog-/Lektionsversion; bei späterer gemeinsamer Integration bleiben deren neuere Inhaltsstände erhalten.

**Vor Produktbetrieb weiterhin erforderlich:** unabhängige Fach-/Quellen-/Sprachprüfung, tatsächliche Anbieteridentitäten/Betreiberprovisionierung und Schlüsselbetrieb, Produktmigration und Einbindung in die vorhandenen Konto-Datenrechte, P4.17, Schulrecht/AVV und Einwilligungsgrundlage, Rechnung/Steuer, Pilotschule, reale Screenreader-/Geräte-/Audioabnahme sowie 30 tatsächliche gleichzeitige Quizgeräte. Keine Freigabe aus synthetischen Zahlen.
