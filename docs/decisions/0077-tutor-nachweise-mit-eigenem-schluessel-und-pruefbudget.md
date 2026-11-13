# ADR 0077: Tutor-Nachweise mit eigenem Schlüssel und Prüfbudget

Datum: 13.11.2026 · Status: angenommen für die technische Nacharbeit; keine Veröffentlichung.

## Anlass

Der Nutzer beauftragt den nächsten Programmierblock. Die Fachprüfung Phase 4 v3 dokumentiert für den Tutor N1–N4 und H3: gemeinsam verwendeter Service-Role-/Signaturschlüssel, falsche Fehlerklasse bei fehlender Signaturkonfiguration, vor der Idempotenzprüfung abgewiesene Altanfragen, ungedrosselte Nachweisausgabe und fehlende Uhrentoleranz. Die bestehenden fachlichen und funktionalen Prüfdurchgänge bleiben als Nachweise erhalten.

## Entscheidung

- `TUTOR_ATTEMPT_SECRET` ist ein eigenes serverseitiges Secret. Kein Rückgriff auf den Service-Role-Key; Gleichheit wird abgewiesen. Format: 32–4096 Zeichen aus Base64-/Base64url-Zeichen, empfohlen mindestens 32 zufällige Bytes. Fehlende/ungültige Konfiguration ist HTTP 503 `server`, keine fehlerhafte Lernaufgabe.
- Die gemeinsame Ausgabefunktion trennt Protokollfehler (400), ungültige Inhalte/Antworten (422), Speicher-/Konfigurationsfehler (503) und Ratenlimit (429 mit `Retry-After`). Ohne gültige Konfiguration oder Budget erfolgt keine Bewertung. Der Antwortvertrag enthält weiter nur den Nachweis.
- Bestehende gespeicherte Anfragen werden zuerst über Eigentümer und vollständigen kanonischen Anfragehash geprüft. Passende Datensätze werden ausschließlich wiedergegeben oder nach der bisherigen Lease-Regel abgeschlossen. Sie lösen kein neues Modell aus und funktionieren auch im Altformat oder nach Wechsel des Signaturschlüssels. Abweichender Hash ist ein Konflikt. Neue Erklär-/Lösungsanfragen benötigen weiter einen gültigen passenden Nachweis.
- Eine um höchstens fünf Sekunden vorausgehende Ausstellungsuhr ist zulässig. Die feste Dauer von 30 Minuten und der exklusive Ablaufzeitpunkt bleiben erhalten. Ein gespeicherter Replay wird durch die Datenbankidentität autorisiert; die Kryptoprüfung für neue Anfragen enthält keinen Ablauf-Bypass mehr.
- Das separate PostgreSQL-Prüfbudget gewährt je Konto höchstens 30 schemafähige Bewertungsaufrufe pro 60-Sekunden-Fenster. Ein kontobezogener Transaktionslock serialisiert mehrere Function-Instanzen. Datenbankzeit ist maßgeblich; abgewiesene Aufrufe vergrößern den Zähler nicht.
- Der Zähler enthält nur Konto-ID, Fensterbeginn und einen auf 30 begrenzten Wert. Keine Antworten, Nachweissignaturen oder zusätzlichen Lernereignisse. RLS und RPC-Rechte erlauben ausschließlich den vertrauenswürdigen Servicepfad. Eigener Datenschutzexport, Auth-Löschkaskade und der vorhandene Retentionlauf decken den Zähler ab; Fenster älter als ein Tag werden in Batches bis 100 entfernt.
- Lokale Testserver erhalten ein ausdrücklich synthetisches Testsecret aus einer nur von Testwerkzeugen importierten Fixture. Live-Konfiguration wird nur über eine private temporäre Function-Env-Datei weitergegeben; deren Verzeichnis wird beim Stoppen entfernt. Kein Secret wird in Modellkontext, Client oder Bericht übernommen.

## Folgen

Neue additive Migration, unveränderter Nachweis-/Clientvertrag, Prompt/Werkzeuge weiterhin 5/3 und keine Änderung an Katalog-/Lektionsständen. Migration und eigenes Secret sind vor dem aktualisierten Function-Betrieb bereitzustellen. Bereits ausgestellte Service-Role-signierte Nachweise autorisieren keine neuen Anfragen mehr; der Client kann einen neuen Nachweis anfordern. Exakte bereits gespeicherte Antworten bleiben abrufbar.

Dies bleibt technische P4-Vorarbeit vor der formalen Phase-4-Freigabe. Kein Remote-Deployment, kein Live-Modell und keine Veröffentlichung. Der Nachweis belegt weiterhin nur die serverseitige Bewertung einer eingesandten Antwort, keine menschliche Erstbearbeitung. Produkt-/Anbieter-/Geräte-/Rechtsabnahmen bleiben getrennt; P4.01 bleibt bis F14/Recht zurückgestellt.

ADR 0076 ist für den separaten Schul-PR #151 reserviert und in diesem Branch nicht enthalten. [Ablauf und Nachweise](../plan/tutor-sicherheitsnacharbeit.md).
