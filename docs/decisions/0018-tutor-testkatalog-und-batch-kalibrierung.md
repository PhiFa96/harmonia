# ADR 0018 – Tutor-Testkatalog und wiederaufnehmbare Batch-Kalibrierung

**Status:** Angenommen für die technische Umsetzung. Getrennter fachlicher Durchgang und echte Modellkalibrierung ausstehend.

**Datum:** 14.10.2026

**Planpunkt:** P2.18

## Anlass

Der Tutor kann erklären, Werkzeuge aufrufen, Quellen zitieren und Hinweise geben. Ein funktionierender Transport belegt keine fachliche Qualität. P2.18 verlangt mindestens 200 geprüfte Fragen, 98 % Korrektheit, keinen Rückschritt und Kontingente aus gemessenen Kosten. Anthropic-Schlüssel, aktuelles Modell/Tarif und Claudes getrennte Quellen-/Katalogprüfung sind noch nicht vorhanden.

## Katalog und Urteile

245 eigene kanonische Fälle haben jeweils DE-, US- und UK-Fassungen: 120 Werkzeug-/Faktenfragen, 76 Aufgabenfälle (19 Typen mit Erklärung, Hinweis 1/2 und Lösung), 29 Bibliotheksfragen, zwölf Fangfragen und acht fachfremde Anfragen. Der eingecheckte JSON-Katalog wird deterministisch aus expliziten Eingaben und versionierten Aufgabenquellen erzeugt. Fragen, Soll-Aufrufe und technische Sollwerte gehören zur selben Inhaltsversion; Seed, Antwort und Durchgang bleiben erhalten. Gültige falsche Antworten kommen aus denselben Eingabeverträgen wie die App. Alle Fälle bleiben `entwurf`.

Eigene Tabellen, Parser-/Engineprüfung und sechs unabhängige `tonal`-Vergleichstests sichern die rechnerischen Sollwerte ab. Dies ersetzt weder Standardliteratur noch Claudes zweiten Durchgang in frischem Kontext nach ADR 0005. Die Reviewdatei benennt pro Fall und Sprache Hash, Freigabe, Prüfer, frischen Kontext, mindestens zwei verschiedene Prüfmittel und Referenzen. Das Programm erzeugt ausschließlich leere Reviewdateien und Belege, keine Prüferidentität oder Freigabe.

Eine Engine-Werkzeugantwort kann korrekt sein, während die Modellprosa ihr widerspricht. Automatische Checks prüfen deshalb nur Abschluss, tatsächlich ausgeführte Soll-Werkzeuge mit passenden Argumenten, native Quellen/Originaltext, Beispiele und Laufzeitfehler. Factual, tools, sources, hints und languageTone werden zusätzlich von Claude getrennt beurteilt. Hinweise benötigen semantische Prüfung: Auch eine eindeutige Umschreibung der Lösung ist ein Leck. Worttreffer oder ein zweites Sprachmodell zählen nicht automatisch als Fachabnahme.

## Batch-Dialog statt einzelner isolierter Requests

Der Lauf verwendet das gepinnte Anthropic-SDK und dieselbe `runTutor`-Laufzeit wie Streaming. Jede Welle enthält den nächsten fehlenden Modellschritt jedes Dialogs. Erst nach einer geprüften Quittung werden Engine-Werkzeuge ausgeführt und die nächste Welle mit Werkzeugresultaten geplant. Ein Replay-Provider rekonstruiert den Dialog deterministisch aus gespeicherten Modellnachrichten. Laufzeitgrenzen, Textfilter, native Zitatzuteilung und Parser bleiben identisch. Die Simulation ersetzt ausschließlich Modellquittungen und ist dauerhaft gekennzeichnet.

`custom_id` bindet Episode, Runde und genaue Parameter per SHA-256. Antworten dürfen unsortiert ankommen. Unbekannte, doppelte oder fehlende Quittungen werden zurückgewiesen; errored/canceled/expired bleiben terminale Fehler mit konservativer Kostenschätzung. Maximal erlaubte Runden und ein vorab festgelegtes Nano-USD-Budget begrenzen den Lauf. Eingabe-Bytegrenze und alle möglichen Eingabe-/Cachepreise gehen in die Reservierung ein; Ausgabe hat ein festes Tokenmaximum.

Vor einem kostenpflichtigen Create wird die geplante Welle atomar gespeichert. Es gibt keine automatische Neuübermittlung. Ist der Abschluss unklar, bleibt die Übermittlung `uncertain` und muss über eine explizite Batch-ID abgeglichen werden. `collect` liest einmal, wartet nicht stundenlang und sendet keine Folgefrage. Eine Folgefrage erfordert ein neues ausdrückliches `submit`. Dateisperren verhindern parallele Mutationen, Dateien haben Modus 0600; geheime Schlüssel werden nicht in Journal oder Parameter geschrieben.

## Recherche, Provenienz und Freigabe

Die normale Vorbereitung nutzt dieselbe lokale Postgres-Suche, denselben Snapshot, dieselben Aufgabenfähigkeiten und dieselbe Dokumentauswahl wie die Function. Der CLI akzeptiert dafür nur lokale Supabase-Ziele und hält den Service-Schlüssel im Arbeitsspeicher. `sourceMode: supplied` ist eine ausdrücklich synthetische CI-Alternative mit bekannten Quellen; sie kann keine Produktionsfreigabe liefern.

Hashes binden Katalog, Konfiguration, Engine-/Prompt-/Werkzeugstand, Dokumentvorbereitung, Modellquittungen und beantwortete Episode. Geänderte Antworten, Quittungen, Reviews oder Laufzeitdateien sind nicht still wiederverwendbar. Zusammenfassung und ausgewählte Rollenvariante werden versioniert archiviert; Rohjournale, Modelltexte und Arbeitsreviews bleiben aus Git ausgeschlossen. Der erste echte akzeptierte Lauf bildet die Vergleichsbasis; nachfolgende Läufe müssen die ausgewählte Basis ohne fachliche Regression bestehen. Ein anderer Katalog verlangt eine neue passende Basis und deren Abnahme.

Der Nenner enthält jeden Fall in jeder Sprache und Variante, einschließlich fehlender/fehlgeschlagener/ungeprüfter Antworten. Rollenvarianten werden einzeln betrachtet; ein schlechtes Experiment verhindert nicht die Wahl eines vollständig geprüften besseren Kandidaten. Für die gewählte Kombination gelten mindestens 98 % fachlich korrekt und bestanden, je Sprache und Rolle, vollständige Reviews/Kostenbelege und keine Hinweis-/Quellenverletzung. Simulationsmarker, Vorschauinhalte, mitgelieferte statt tatsächlich gesuchte Quellen, alte/unverifizierte Bindung und unfertige Reviews schließen das Release-Gate.

## Kosten und Grenzen der Kontingentempfehlung

Eine gemeinsame, SDK-unabhängige Kostenfunktion berechnet Eingabe, Ausgabe, Cache-Lesen und beide Cache-TTLs. Der Batch-Tarif wird ausdrücklich konfiguriert, nicht aus einem angenommenen Rabatt abgeleitet. Dieselben gemeldeten Token werden zusätzlich mit dem Streaming-Tarif bepreist; dies ist eine Projektion, keine Live-Streaming-Kostenmessung. Cacheverhalten und Parallelität eines Batchlaufs können vom Appbetrieb abweichen.

Erst ein akzeptierter echter Kandidat darf eine Empfehlung erhalten. Das Geschäftsbudget für Premium/Max ist ein separater Eingabewert. Der Vorschlag verwendet das größere Maß aus P95-Kosten und Kosten pro akzeptierter Antwort (einschließlich Fehlerkosten), einen Sicherheitsfaktor und aktive Lerntage. Tageslimits sind Vorschläge und werden nicht in Supabase geschrieben. Vor dem Launch bleiben reale Streaming-/Cacheprüfung, Budget-/Preisentscheidung, globale Kapazitätsplanung und produktive Bindung erforderlich. Keine Testpreise oder technischen Startlimits werden als Launchentscheidung ausgegeben.
