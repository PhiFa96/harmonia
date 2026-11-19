# ADR 0084: Zustimmung zu Wochenquests und Schutz der Sozialfunktionen

Stand 19.11.2026. Technische Umsetzung zu P3-12. Die Produkt- und Rechtsabnahmen stehen aus.

## Entscheidung

- Eine Person kann pro UTC-Woche einen laufenden Questvorschlag senden. Die empfangende Person kann ihn annehmen oder ablehnen. Die absendende Person kann ihn zurückziehen. Der Wochenwechsel beendet ausstehende Vorschläge. Erst die Annahme belegt beide Wochenplätze, startet die XP-Zählung und macht Beiträge sichtbar.
- Bestehende Wochenbelege, Historien und verdiente Abzeichen bleiben erhalten. Die aktive Anzeige und neue Questgutschriften setzen einen bestätigten Startzeitpunkt voraus. Ältere Wochenbelege laufen regulär aus.
- Jede gerichtete Freundschaft erhält eine separate zufällige Kennung. Liste, Questvorschläge, Questfortschritt und App-Export verwenden diese Kennung. Für Aktionen akzeptiert die Datenbank ältere zwischengespeicherte Konto-IDs innerhalb der eigenen Beziehung.
- Der ausstellende Account kann einen unbenutzten Link anhand seines Codes widerrufen. Die Annahme eines Einladungslinks ist auf 20 schemafähige Versuche je Konto und rollender Stunde begrenzt. Der vorhandene Retentionlauf entfernt Zähler nach einem Tag.
- Bei stabiler Zeitzone gilt für das Rätsel der lokale Kalendertag. Nach einem Zonenwechsel muss seit einer Antwort in einer anderen Zone ein Abstand von 20 Stunden verstrichen sein. Der Server prüft Datum und Abstand nach der Kontosperre in derselben Transaktion.

Die Grenzwerte sind technische Startwerte. Minderjährigenschutz, Wettbewerb, Produktionsbetrieb und tatsächlich unterstützte Mehrgeräteabläufe stehen zur Abnahme. [Befundregister](../plan/befundregister.md) · [ADR 0035](0035-freundschaften-und-wochenquests.md)

## Bereitstellung

Die Migrationen `20261119090000_friend_quest_consent.sql` und `20261119091000_social_request_limits.sql` gehen vor den Funktionen `friends`, `daily-puzzle`, `privacy` und `privacy-retention`. Neue Clients fordern mit `questOffers=1` die Vorschläge zusätzlich zum bisherigen View an. Kontoexport und Kontolöschung umfassen die neuen Datensätze. Der reguläre Retentionlauf bearbeitet alte Vorschläge und Zähler in begrenzten Stapeln.
