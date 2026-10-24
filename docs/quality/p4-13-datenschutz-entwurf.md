# P4.13/P4.14/P4.15 – Technische Datenschutzanlage zur späteren Rechts-/AVV-Prüfung

Stand 24.10.2026 · **Entwurf, ausschließlich synthetische Vorschau. Kein unterschriftsreifer AVV und keine Rechtsfreigabe.**

## Implementierter Datenfluss

Browser → lokaler HTTP-Server → isoliertes PostgreSQL. Kein externer Versand, keine KI-Anfrage, keine Analyse-, Zahlungs- oder Mailanbieter. Docker lädt gegebenenfalls sein Standard-PostgreSQL-Image; dabei werden keine Schul-/Lerndaten übermittelt. Standardübersetzungen und öffentliche App-Bundles enthalten keine Schuloberfläche.

| Kategorie | Technischer Zweck | Sichtbarkeit im Entwurf | Löschung |
|---|---|---|---|
| Feste Testkennung und Testrolle | Synthetische Personalauswahl | Ausdrücklich öffentliche Demo-Auswahl, keine Identitätsprüfung | Eigener Container beim regulären Stoppen |
| Erfundene Organisations-/Klassenbezeichnung | Verwaltung und Navigation | Mitglieder/zugewiesene Lehrkräfte bzw. eigene Klassen | Klassenlöschung / Container |
| Pseudonym und Klassenmitgliedschaft | Roster und eigene Mitgliedschaften | Zugewiesene Lehrkräfte; Lernkonto sieht nur sich selbst | Verlassen, Entfernen, Klassenlöschung / Container |
| Klassenbezogene Freigabe, Textversion, Zeit | Erprobung von Freigabe/Widerruf | Eigene Freigabeereignisse; aktueller Zustand bei berechtigter Lehrkraft | Mitgliedschaft oder Klasse löschen / Container |
| Synthetische Lernbereichs-Summen | Test von Übersicht und Einzelansicht | Eigene Person oder ausdrücklich freigegebene Klasse; höchstens letzte 30 Tage | Container; keine echten Lernnachweise gespeichert |
| Aufgabentitel, Quellen, konkrete Fragen, Frist und Empfängerliste | Eingefrorene lokale Klassenaufgabe | Metadaten für zugewiesene Lehrkräfte und jeweilige Empfänger; vollständiges Material nur im Server | Aufgaben/Material bei Klassenlöschung oder Containerende; Empfänger bei Mitgliedschaftsende |
| Antworten, Engine-Bewertung, Beginn und Abschluss | Lokale Bearbeitung, Wiederaufnahme und Auswertung | Rohantworten nur im Server; eigenes Ergebnis bzw. abgeschlossenes Ergebnis mit aktueller Klassenfreigabe für zugewiesene Lehrkräfte | Mitgliedschaftsende oder Klassenlöschung kaskadierend; ansonsten Containerende |
| Hash eines zufälligen Codes, Restnutzungen, Ablauf | Begrenzter Klassen-/Lehrerbeitritt | Keine Dashboard-Leseabfrage; Code nur einmal beim Erstellen | Klassenlöschung / Container; Widerruf/Ablauf sperren Nutzung |
| Quizstatus, Aufgabenmaterial, Codehash und Fristen | Lokale Quiz-Lobby und gemeinsame Runden | Aktuelle Frage für berechtigte Teilnehmer/Lehrkräfte; vollständiges Material und Codehash nur im Server | Klassenlöschung / Containerende |
| Quizteilnahme, zufälliges Spielkürzel und freiwillige Ranglistenfreigabe | Beitritt und optionale Rangliste | Eigenes Kürzel; freigegebene Spielkürzel/Punkte nach Rundenende für Teilnehmer und Beamer | Mitgliedschaftsende, Klassenlöschung / Containerende; Widerruf entfernt Ranglistenanzeige |
| Quizantworten, Richtigkeit und Zeit | Einmalwertung und Endauswertung | Rohantworten nur im Server; eigene Ergebnisse bzw. nach Ende mit aktueller Klassenfreigabe für Lehrkräfte | Mitgliedschaftsende, Klassenlöschung / Containerende |
| Zufälliger Sitzungscookie | Lokale Trennung gleichzeitig geöffneter Demo-Konten | HttpOnly, SameSite Strict, nur lokaler Server | Browser-Sitzung bzw. Serverende |

Die Klassenfreigabe ist standardmäßig aus. Sie darf nicht mit der Mitgliedschaft, einem Kauf oder einer pauschalen Zustimmung gekoppelt werden. Ihre technische Erprobung entscheidet nicht, ob Einwilligung im tatsächlichen Schulkontext die passende Rechtsgrundlage ist. Verwaltung erbt keinen Lernstandzugriff; eine ausdrückliche Klassenzuweisung ist erforderlich. Personenbezogene Freitexte, E-Mails, Geburtsdaten, Adressen, Sprachaufnahmen und Tutorverläufe sind nicht vorgesehen.

P4.14 speichert tatsächlich eingegebene Übungsantworten ausschließlich unter synthetischen Testkonten. Diese Aufgabe kann ohne Lernstandfreigabe bearbeitet werden; die Lehrkraft erhält dann kein Ergebnis. Laufende Ergebnisse werden auch bei Freigabe nicht angezeigt, bis Abgabe, Fristablauf oder Beenden erfolgt. Der neue lokale Aufgabenlink enthält nur eine Kennung, keine Zugangsdaten und keine zusätzliche Berechtigung. Es erfolgt kein automatischer Versand. Verlassen/Entfernen löscht Antworten und Ergebnis der Mitgliedschaft; ein Wiederbeitritt stellt sie nicht wieder her. Anders als die 30-Tage-Begrenzung der P4.13-Fixtures besteht für Aufgaben keine zusätzliche zeitgesteuerte Aufbewahrung; der gesamte Vorschaucontainer ist flüchtig. Für echten Betrieb sind verbindliche Fristen und Löschverfahren weiterhin festzulegen.

P4.15 trennt die freiwillige Ranglistenanzeige von der klassenbezogenen Ergebnisfreigabe. Die Rangliste ist standardmäßig aus; Teilnahme ist ohne sie möglich. Spielkürzel garantieren keine Anonymität, insbesondere im gemeinsamen Unterricht. Die Beamerprojektion erhält keine personenbezogene Ergebnistabelle. Laufende Lösungen und Punkte werden bis zur Rundenauflösung zurückgehalten. Streams prüfen Rechte auch ohne neue Ereignisse jede Sekunde; Browser entfernen Ansichten bei Verbindungsabbruch, Hintergrundwechsel und ausbleibendem Heartbeat. Die Zweistundenfrist beendet eine Quizsitzung, löscht ihre Daten aber nicht vor Mitgliedschafts-/Klassen- oder Containerende. Für einen echten Einsatz sind auch diese Kategorien, Öffentlichkeit der Rangliste und Löschfristen rechtlich abzustimmen.

## Vor einer AVV-/Produktfreigabe konkret auszufüllen und prüfen zu lassen

- Schule/Träger, verantwortliche Stelle, tatsächlicher Anbieter/Auftragsverarbeiter, Ansprechpartner und Weisungsbefugte.
- Rechtsgrundlage, zuständiges Landesrecht und zulässige Zwecke; Umgang mit Minderjährigen und eventuellen gesetzlichen Vertretungen.
- Verbindlicher Gegenstand, Dauer, Kategorien betroffener Personen und Daten; genaue zulässige Auswertungen, ohne aus Testquoten unzulässige Noten oder Entscheidungen abzuleiten.
- Datenstandorte, Unterauftragsverarbeiter, Zugriffs-/Supportwege und mögliche Drittlandübermittlungen des späteren Zielbetriebs. Die lokale Vorschau ist dafür kein Nachweis.
- Verbindliche Fristen für Mitgliedschaften, Nachweise, Einladungen, Audit, Backups und Support; Widerruf, Schulwechsel und Vertragsende getrennt berücksichtigen.
- Technische/organisatorische Maßnahmen für echte Authentifizierung, Rollenprüfung, Personalwechsel, Datenexport/-löschung, Wiederherstellung, Vorfälle und Betroffenenrechte.
- P4.17: Einordnung nach KI-Verordnung und ggf. Maßnahmen; ein deterministischer Testbericht entscheidet diese Rechtsfrage nicht.
- Verfahren für Vertragsabschluss, Freigabe der Informationen, Kontrollrechte, Meldungen und dokumentierte Abnahme durch Schule und Rechtsprüfung.

Keine dieser offenen Angaben wird durch die lokale Auswahl eines Testkontos oder den Freigabeknopf bestätigt. Die formale Phase-4-Freigabe bleibt offen; P4.01 bleibt bis F14/Rechtsklärung zurückgestellt.
