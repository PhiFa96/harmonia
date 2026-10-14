# ADR 0016 – Wissensbasis vorab einbinden und native Zitate prüfen

**Status:** Angenommen für die technische Umsetzung; fachliche Artikelabnahme und echte Modellabnahme ausstehend.  
**Datum:** 14.10.2026  
**Planpunkt:** P2.16

## Anlass

P2.15 kann Engine-Werkzeuge aufrufen, hatte aber keine überprüfbaren Bibliotheksquellen. Die vorhandenen 29 Artikel für Stufe 1–2 sollen als Quellen dienen. Alle warten weiterhin auf Claudes getrennte Prüfung nach ADR 0005. Eine Vorschau darf keine öffentliche Freigabe ersetzen.

## Entscheidung

Die Edge Function sucht vor dem ersten Modellaufruf mit Postgres-Volltextsuche. Sie liefert höchstens sechs relevante Abschnitte, höchstens drei aus demselben Artikel, als native Plaintext-Dokumente mit `citations.enabled`. Dafür stehen insgesamt 6000 UTF-8-Bytes an Abschnittsdatensätzen zur Verfügung. Der bestehende konservative Eingabegrenzwert für den vollständigen SDK-Aufruf gilt zusätzlich. Zuerst entfallen alte vollständige Verlaufspaare, danach niedriger gerankte Quellen. Die Dokumentliste bleibt während anschließender Engine-Werkzeugrunden stabil.

Keine Embeddings, keine zweite KI für die Suche und kein neues Modellwerkzeug für Retrieval. Die acht Engine-Werkzeuge bleiben unverändert.

## Spike und Abwägung

| Kriterium | Vorab einbinden | Suche als Modellwerkzeug |
|---|---|---|
| Mindestzahl Modellaufrufe bis zur Antwort | 1 | 2: Suchaufruf anfordern, dann Ergebnis erklären |
| Suchauftrag | Benutzerfrage und kanonische Aufgabenfähigkeiten | Vom Modell formuliert; kann neue Suchbegriffe wählen |
| Quelleneingabe | Begrenzt vor dem ersten Aufruf | Ergebnis erst in einer weiteren Runde; zusätzliches Werkzeug-/Dialogprotokoll |
| Native Zuordnung | Dokumentindex und Zeichenbereich | Zusätzliche Zuordnung für Werkzeugergebnisse oder nachträglich eingefügte Dokumente |
| Fehlende Suche | Expliziter Zustand vor dem Modellaufruf | Weiterer Fehler-/Rundenpfad innerhalb des Tool-Loops |

Der Spike prüft den realen Parser des gepinnten Anthropic-SDK 0.133.0 mit ersetztem Transport: Plaintext-Dokumente bereits im ersten Request, native `citations_delta`, exakte Quellenzuordnung, dieselben Dokumente nach einer Engine-Werkzeugrunde, Stream-/Final-Message-Deduplizierung und Abwerfen von Quellen vor dem ersten Aufruf bei zu kleiner Eingabegrenze. Das belegt die Integration. Die Mindestzahlen in der Tabelle folgen aus der Aufrufstruktur; sie sind keine Messung eines echten Sprachmodells.

Die echte deutsche/englische Postgres-Suche findet für eine kleine feste Abnahme mit 29 Themenfragen je Sprachfassung in allen 87 Fällen den erwarteten Artikel innerhalb des Dokumentbudgets. Diese Fragen liegen bewusst nahe am Artikelwortschatz. Synonyme, mehrdeutige Fragen, fachliche Unterstützung der Antwort und Hinweisqualität brauchen den getrennten Tutor-Testkatalog aus P2.18. Echte Token-/Kosten-/Antwortqualitätsvergleiche waren ohne Schlüssel-, Modell- und Tarifbindung nicht möglich. Sollte dieser Testkatalog mangelnde Suchabdeckung zeigen, sind Query-Expansion, ein Retrieval-Werkzeug oder später Vektorsuche neu abzuwägen.

## Quellenidentität und Zugriff

`knowledge_indexes` verwaltet je Auslieferung einen aktiven Snapshot. `knowledge_chunks` enthält Artikel-ID und -Version, Sprache, Stufe, Abschnitt/Teil, Unicode-Zeichenbereich, Titel, Überschrift, Körper, Fähigkeiten und einen gespeicherten deutschen bzw. englischen Volltextvektor mit GIN-Index. Ein SHA-256 identifiziert die kanonischen Quelldaten einschließlich Status und Text. Eine Änderung ohne Versionsanhebung verändert trotzdem den Quellenlink.

`published` und `preview` sind getrennte Auslieferungen. Nur freigegebene Artikel mit geschlossenen Freigabeabhängigkeiten gelangen in den öffentlichen Index. Die abgeleitete Stufenzuordnung wird ausschließlich für veröffentlichte Artikel mitgeliefert; ein freigegebener Artikel kann dadurch vor seinen Lektionen erscheinen. Vorschau wird nur bei ausdrücklicher lokaler Vorschau und lokalem Supabase-Ziel aktiviert. RLS verbirgt sie auch vor angemeldeten Konten. Suchen und Ersetzen des Index sind private Service-RPCs.

Ein expliziter Abgleich ersetzt einen gesamten Index transaktional und pro Auslieferung serialisiert. Ungültige Daten lassen den bisherigen Stand stehen. Rückzüge entfernen alte Abschnitte. Eine Function sucht ausschließlich gegen ihren eigenen erwarteten Snapshot; ein fehlender oder anderer DB-Stand liefert keine Quellen. Die Modelltexte werden nach der Suche aus dem kompilierten Katalog anhand bekannter IDs gelesen, nicht aus ungeprüften Datenbanktexten.

## Native Zitate und App

Nur native `char_location`-Referenzen auf gelieferte Plaintext-Dokumente werden akzeptiert. Index, Ganzzahligkeit, Grenzen und der genaue Originaltext müssen stimmen. UTF-16-Adapter werden nur bei ebenfalls exakt passendem Zitat auf Unicode-Codepunkte normalisiert. Titel, Artikel-ID, Version, Sprache und Link kommen aus dem serverseitigen Datensatz; Modell-URLs und Modell-Titel sind keine Quelle.

`citation`-SSE und privater Verlauf speichern denselben geprüften Quellenverweis einschließlich Snapshot, Abschnitt, Teil und Textbereich. `round` und `blockIndex` benennen den Modelltextblock, keinen Zeichenbereich der gefilterten Antwort. Die Artikelroute prüft Version und Abschnittshash erneut, bewahrt die Quellensprache und zeigt ursprüngliche Beispiele mit ausdrücklich gestarteter Wiedergabe. Geänderte, zurückgezogene oder im App-Build nicht enthaltene Quellen öffnen einen verständlichen Nichtverfügbarkeitszustand. Vorschauen sind sichtbar gekennzeichnet. Die Ansicht prüft den installierten App-Katalog offline; ältere Builds können lokal enthaltene frühere Artikel noch anzeigen. Ein Rückzug verhindert sofort die Suche alter Indexabschnitte, für die lokale Ansicht gehört ein App-Update zum Rollout.

Ohne belegbare Quelle wird `no_library_source` gemeldet; bei fehlendem Index zusätzlich `knowledge_unavailable`. Der Prompt verlangt eine entsprechende Erklärung in der Antwort. Eine genaue Textübereinstimmung beweist nicht, dass die Modellbehauptung fachlich durch das Zitat gestützt wird; dafür bleiben Claude-Abnahme und P2.18 erforderlich.
