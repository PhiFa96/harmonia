# ADR 0013: Inhaltsmeldungen mit lokaler Gastwarteschlange

- Datum: 13.10.2026
- Status: angenommen
- Bezug: P2.13, ADR 0011/0012; Gastregel ausdrücklich vom Nutzer entschieden

## Entscheidung

Jede Aufgabenansicht bietet „Fehler melden“, auch vor einer Bewertung und nach einem Hinweis. Das Formular öffnet eine eigene Route. Es hält Frage, Quelle, Variante, gewählte Eingabe, Hinweisstufe, Bewertungszustand und Sprache zum Öffnungszeitpunkt fest. Der Aufgabenstand bleibt beim Zurückkehren erhalten; eigene Wiedergabe und laufende Rhythmusaufnahme stoppen beim Verlassen. Die Meldung verändert keine Bewertung, XP, Lernserie oder Freischaltung.

Die sieben Bereiche sind Frage, Antwort/Bewertung, Erklärung/Hinweis, Notenbild, Hörbeispiel, Sprache/Übersetzung und sonstiger Fehler. Eine Beschreibung bis 2000 Zeichen ist optional. Eine stabile UUID macht Speichern und Senden idempotent. Ein begonnener Speicherversuch wird mit derselben unveränderten Eingabe wiederholt; ungewisse Schreibbestätigungen erzeugen keine zweite Meldung.

Gastmeldungen werden lokal gespeichert und bei der nächsten Anmeldung dem ersten angemeldeten Konto zugeordnet und gesendet. Es gibt keinen anonymen Versand. `harmonia-reports.db` enthält eine separate SQLite-Outbox mit Besitzerscope und Zustand `pending`, `sent` oder `unavailable`. Gastübernahme und Bestätigungen sind Transaktionen. Ein Kontowechsel verbirgt fremde Meldungen und Formulare sofort. Verspätete Bestätigungen gehören weiterhin zum ursprünglich sendenden Konto. Die explizite vorübergehende Sitzung speichert nur im Arbeitsspeicher und sendet nicht; die Oberfläche nennt diese Einschränkung.

Die Quellen sind versionierte Lektionen einschließlich Mischplan und ursprünglichem Aufgabenindex für die Fehlerwiederholung, adaptive Einstufungen einschließlich Replay-Aktionen und versionierte freie Sätze einschließlich Mini-Aufgabe. Die bisherigen sechs freien Generatoren und der Mini-Generator liegen gemeinsam in `@harmonia/exercises`; Reihenfolge und Seeds bleiben erhalten. App und Server können dieselbe Frage erneut erzeugen. Bei veränderten Parametern der freien Sätze muss deren Inhaltsversion erhöht werden.

Die Edge Function `content-reports` verifiziert die Kontositzung mit Auth und rekonstruiert jede Quelle mit dem tatsächlich ausgelieferten Katalog. Ein Client kann keine Items, Sollantworten, Kontozuordnung oder Bearbeitungsstatus vorgeben. Der Server speichert den kanonischen Aufgaben-Snapshot und, soweit eine Bewertung gemeldet wurde, die Engine-Bewertung neben der ursprünglichen Anfrage. Dies ist Kontext für die Fehlerprüfung, kein Lernnachweis. Ungültige Eingaben können selbst der Meldegrund sein.

Die private Service-RPC `append_content_reports` schreibt unter einer Kontosperre atomar. Gleiche Konto-/Client-ID mit identischer Anfrage ist eine Wiederholung; eine andere Anfrage mit derselben ID weist den gesamten Schreibbatch zurück. `content_reports` erlaubt Konten ausschließlich eigene Lesezugriffe. Schreiben erfolgt über die prüfende Function; Bearbeitungsstatus `new`, `reviewing`, `resolved` und `dismissed` sind dem vertrauenswürdigen Review vorbehalten.

Die Function bestätigt jede eingereichte ID als angenommen oder nicht verfügbare Quelle. Andere gültige Meldungen werden weiterhin gesendet. Nicht verfügbare Quellen bleiben lokal und sind ausdrücklich erneut versuchbar; Netzfehler lassen die Outbox unverändert. Anmeldung, Rückkehr in die App, wiederhergestellte Verbindung und periodische Versuche stoßen Versand an. Ein Profilabschnitt zeigt ausstehende und gesendete Meldungen sowie Fehler und Wiederholen.

## Folgen

Feste Hinweise und Engine-Erklärungen bleiben für DE/US/UK gleichberechtigt. Zusätzliche Lösungsbilder ergänzen verborgene Quellnotation bei Namensaufgaben. Musikalische Kontextfragen spielen ihre tatsächliche Quelle; Vorzeichnungen und Tonartquellen erhalten ein ausdrücklich als Beispiel benanntes Dur-/Natürlich-Moll-Tonleiterbeispiel. Wissen und Dokumentfragen haben lesbare Textlösungen. Die Unterscheidung zwischen Quellenklang und Lösung bewahrt etwa enharmonische Schreibweise und die Aufgabe mit unvollständiger Rhythmuskontur.

Meldungen erhalten keine Versandgarantie in einer vorübergehenden Sitzung und werden nicht auf ein neues Gerät heruntergeladen. Der bestätigte lokale Versandzustand ist keine fachliche Bearbeitungsbestätigung. Claudes wöchentlicher Inhaltsreview, produktive Bereitstellung, Geräteabnahme und fachliche Kursfreigabe bleiben getrennte Schritte. Die lokale Entwurfsvorschau ist weiterhin ausdrücklich begrenzt; entfernte und öffentliche Funktionen verwenden nur freigegebene Kursinhalte.
