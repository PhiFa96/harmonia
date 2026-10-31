# ADR 0066 – Tutor-Erklärungen mit serverseitigem Versuchsnachweis

Datum: 31.10.2026. Status: technisch umgesetzt, zur Prüfung. Nutzerauftrag: nach der integrierten P4-Entwurfskette den offenen Befund E2 bearbeiten. Keine Veröffentlichung oder formale Phase-4-Freigabe.

## Ausgangspunkt

Die Tutor-Modi `explain` und `solution` lieferten Lösungen und Rückmeldungen zu einer vom Client genannten Aufgabe ohne Nachweis einer vorherigen Serverwertung. Das historische `checked`-Flag ist UI-Metadatum und kann diese Berechtigung nicht belegen. Die Engine muss Quelle und Antwort selbst prüfen.

## Entscheidung

1. `POST /tutor?view=attempt` verlangt ein angemeldetes, nicht anonymes Konto, eine kanonische versionierte Aufgabenquelle und eine nicht leere Antwort. Der Server rekonstruiert die Aufgabe mit seinem eigenen Katalog und wertet die Antwort mit der Engine. Auch eine gültige falsche Antwort ist ein Versuch; ungültige Antwortformate erhalten keinen Nachweis.
2. Der Server gibt ausschließlich einen 30 Minuten gültigen HMAC-SHA-256-Nachweis aus. Signiert werden Zweckkennung, authentifizierte Konto-ID, kanonische Quelle, genaue Antwort, zufällige Nachweis-ID und Ausstellungs-/Ablaufzeit. Als serverseitiges Signaturgeheimnis wird der vorhandene Service-Schlüssel verwendet; er verlässt den Server nicht. Die Antwort enthält weder Konto-ID noch Quelle, Antwort oder Lösung.
3. Neue `explain`-/`solution`-Anfragen verlangen diesen Nachweis und die gebundene Antwort. Prüfung vor Modell-/Budgetreservierung, unabhängig von `checked`. Fehlend, verändert, fremd oder abgelaufen führt zu einem eigenen HTTP-409-Fehler. Die normalen Inhaltsfilter werden weiterhin vor dem Modellaufruf angewendet.
4. Identische, bereits gespeicherte eigene Anfragen dürfen nach Ablauf wiederholt werden: Besitz, vollständiger Anfragehash und Signatur müssen passen. Ein neuer Aufruf mit altem Nachweis ist gesperrt. Ein Schlüsselwechsel macht bisherige Signaturen ungültig. Bereits gespeicherte Gespräche bleiben über ihre bestehenden Eigentumsprüfungen lesbar.
5. Der Client lässt beim Anfordern einer Erklärung/Lösung zuerst die übernommene Aufgabenantwort serverseitig prüfen. Erst nach erfolgreicher Nachweisausgabe startet der Modellaufruf. Wiederholungen verwenden dieselbe Anfrage und denselben Nachweis; Kontowechsel und Abbruch verhindern einen späteren Aufruf. Die Signatur wird weder als Gesprächskontext gespeichert noch an das Modell gegeben.
6. Im Aufgabenablauf werden KI-Erklärung und KI-Lösung nach „Prüfen“ angeboten. Feste Hinweise und die feste Lösung bleiben verfügbar. KI-Hinweise 1/2 und freier Chat verlangen keinen Versuchsnachweis und erhalten weiterhin keinen Lösungskontext.

## Grenzen und Daten

Das ist ein Nachweis einer tatsächlich ausgeführten **Serverwertung einer eingesandten Antwort**. Er belegt weder eine menschliche Bearbeitung noch einen früheren Offline-Tastendruck. Der Client kann eine gültige Antwort unmittelbar zur Serverwertung einsenden. Der Nachweis ist kein Kursabschluss und verändert keine Lernereignisse, Ratings, XP, Münzen oder Freischaltungen.

Keine neue Tabelle, Migration oder dauerhafte Kopie von Rohantworten. Die vorhandene Antwort geht für die Prüfung an denselben eigenen Tutor-Dienst. Der signierte Nachweis bleibt flüchtig im laufenden Anfrage-/Wiederholungszustand; der gespeicherte Anfragehash bindet ihn, der gespeicherte Gesprächskontext enthält ihn nicht. Ausgabe mit `Cache-Control: no-store`. Offline bleibt das feste Aufgabenfeedback nutzbar; neue KI-Erklärungen benötigen eine Verbindung. Alte Clients ohne Nachweis können neue Erklärungen/Lösungen nicht anfordern und müssen aktualisiert werden.

Prompt 5, Werkzeuge 3 und Inhaltsversion 27 bleiben unverändert. Echte Modellkalibrierung sowie Literatur-, Geräte-, Stimmen- und Rechtsabnahmen bleiben offen. P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt.

## Nachweise

Signatur-/Bindungs-/Ablauftests mit echter Web-Crypto, Protokolltests, Tutor-Zustands- und Aufgabenroutentests sowie die erweiterte lokale Auth-/HTTP-/Datenbankintegration in `tools/test-tutor.mjs`. Ausführungsstand und Grenzen: [Tutor-Versuchsnachweise](../plan/tutor-versuchsnachweise.md).
