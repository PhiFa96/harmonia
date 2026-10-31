# P2.17 – Tutor-Oberfläche

## Stand und Bedienung

Technisch umgesetzt: eigener Tutor-Tab und Aufgabenroute in DE/US/UK, schrittweise gestreamter Chat, geprüfte Notenbeispiele mit ausdrücklich gestarteter Wiedergabe im angegebenen Tempo, Quellenlinks, „Warum?“, ergänzende KI-Hinweise, Kontingent und verständliche Fehlerzustände, privater Verlauf mit Löschung und Meldungen pro gespeicherter Antwort. Entscheidung: [ADR 0017](../decisions/0017-tutor-oberflaeche-und-private-sitzung.md).

Nach „Prüfen“ führen „Warum? Mit KI erklären“ und die KI-Lösung zur Originalaufgabe. Die bewertete Erstantwort, Quelle, Version, Seed und Wiederholungsrunde bleiben erhalten. Beim Anfordern prüft der Server zuerst die eingesandte Antwort und stellt einen kurzlebigen Nachweis aus; erst danach beginnt die Modellanfrage. Zurück führt zum unveränderten Feedback. KI-Hinweise sind nach festem Hinweis 1/2 verfügbar und ergänzen dieselbe Stufe. Die feste Lösung bleibt nach Hinweis 3 verfügbar; die zusätzliche KI-Lösung setzt eine geprüfte Antwort voraus. Diese Übergänge verändern weder Bewertung noch Hilfezählung, XP oder Lektionsfreischaltung. Technische Nacharbeit vom 31.10.2026: [Tutor-Versuchsnachweise](tutor-versuchsnachweise.md).

Freie Fragen beginnen einen eigenen Dialog. Die Sprache und Tonnamen-Konvention des Dialogs bleiben beim Wiederöffnen erhalten; ein neuer Dialog verwendet die aktuelle App-Sprache. Originalbilder werden bei Hinweisen verborgen, wenn sie die Hör- oder Schreibantwort verraten würden. Notenbeispiele in Antworten kommen ausschließlich aus erfolgreich geprüften Werkzeugdaten. Artikellinks prüfen weiterhin Quellenversion und Abschnittshash. In der öffentlichen App werden keine internen Kursartikel ausgeliefert.

## Konto, Kontingent und Fehler

Gäste bekommen Kontoanmeldung und freies Üben angeboten; es wird keine anonyme Modellanfrage verschickt. Angemeldete Konten sehen das serverseitige Tageskontingent und dessen nächsten UTC-Tageswechsel in ihrer Ortszeit. Premium/Max werden erklärt, ein Kauf wird hier noch nicht angeboten: RevenueCat und Paywall sind P2.19/P2.20.

Kontingent, Ratenlimit, Gesamtbudget, fehlende Konfiguration, Inhalt-/Kontextkonflikt, Unterbrechung und nicht bestätigte Speicherung haben eigene Zustände. „Antwort stoppen“ beendet den aktuellen Stream. Eine Teilantwort bleibt als unvollständig sichtbar. Die ausdrückliche Wiederholung verwendet dieselbe ID und denselben Körper und löst keine neue reservierte Anfrage aus. Ein laufender Serverauftrag kann noch `busy` liefern; später lässt sich derselbe Beleg erneut abrufen. Der Status kann unabhängig aktualisiert werden.

Antworten sind als KI gekennzeichnet, mögliche Fehler werden dauerhaft erklärt. Eine bestätigte gespeicherte Assistentenantwort kann mit Kategorie und optionaler Beschreibung gemeldet werden. Meldung und Löschung erfordern eine ausdrückliche Aktion; eine Meldung wird per fester ID wiederholt. E-Mail-Adressen im Meldungstext werden serverseitig redigiert. Meldeverarbeitung durch Support/Administration und vollständiges Kontolöschungsprodukt bleiben eigene Planaufgaben.

## Daten und Betrieb

Die additive Migration `20261014030000_tutor_interface.sql` ergänzt `tutor_reports` samt eigenen Leserechten, Service-RPC und Löschkaskaden. Bestehende Konten, Lernnachweise und Motivation wurden nicht zurückgesetzt. `POST /tutor?view=report` akzeptiert Meldungen ohne Modellaufruf. `GET /tutor?conversationId=…&tail=true` lädt die letzten 100 Nachrichten; `beforeMessage` lädt davor, bestehendes `after` bleibt unverändert. Status und neu gespeicherte simulierte Antworten tragen die lokale Simulationskennzeichnung, ältere Belege bleiben lesbar.

Der Client nutzt `expo/fetch`, eigene AbortController und einen schema-geprüften SSE-Decoder. Nur öffentliche Supabase-URL/Publishable- bzw. Anon-Schlüssel gehören in den App-Build. Anthropic- und Service-Schlüssel bleiben auf dem Server. App-Sitzungen persistieren keinen Chat und verwerfen verspätete Daten nach Kontowechsel.

Lokale Prüfung:

```bash
pnpm db:start
# Neue Migration additiv anwenden, vorhandene Daten nicht zurücksetzen.
pnpm exec supabase migration up --local
pnpm db:lint
pnpm db:test
pnpm knowledge:sync --preview
pnpm db:serve:learning --tutor-test
# In einer zweiten Shell:
pnpm db:test:tutor
pnpm db:test:knowledge
pnpm test
pnpm check:deno
```

Für die Browserprüfung die öffentlichen lokalen Authwerte aus `supabase status` in die Export-Umgebung setzen; `APP_VARIANT=preview pnpm --filter @harmonia/mobile build:web`. Der Export in der Cloud ohne Authwerte prüft nur den Gastzustand. Modelltests erstellen eigene Konten, aktivieren vorübergehend eine ausdrücklich synthetische Testpolicy und stellen sie danach wieder her. Simulationsmarker gehören ausschließlich zum lokalen Backendadapter. Kein Testtarif ist ein Produktpreis.

## Validierung und offene Abnahme

Transporttests prüfen echte Byte-/Zeilengrenzen, Metadaten, Replay, fehlendes Ende, Abbruch, HTTP-Fehler und Grenzen. App-Tests prüfen Gast/Premium, gestreamte Antworten, Kontoisolation, identische Wiederholung, Quellen/Beispiele, Meldungen, bestätigte Löschung, britische UI und Originalaufgabe/Erstantwort samt Hinweisstufe. PostgreSQL/API prüfen zusätzlich Rollen, RLS, fremde Nachrichten, E-Mail-Redaktion, Duplikate, Löschkaskaden und Verlauf mit mehr als 100 Nachrichten.

Lokal am 14.10.2026 bestanden:

- Gesamtlauf mit 2789 Paket-/App-/Tooltests, darunter 437 App-Tests und 19 neue Transport-/Notationsprüfungen; nach den Browserkorrekturen zusätzlich die betroffenen 15 Tutor-/Lektions- und 19 Transporttests. Erfasst werden auch PostgreSQL-Zeitoffsets, JSONB-Schlüsselreihenfolge und das Löschen ungesendeter Texte beim Gesprächswechsel.
- Lint, Paketgrenzen, Typen, Format, Übersetzungen, Inhalts-/Fähigkeitsplan und Deno: 170 Grundlagen-, 15 Push-, 206 Tutor-/SDK-/Engine- und 755 Wissensbasisprüfungen. Keine neuen Paketabhängigkeiten.
- Datenbank-Lint, 241 pgTAP-Prüfungen, 146 echte lokale Tutor-API-Prüfungen jeweils mit interner und öffentlicher Inhaltsbindung sowie 244 interne / 214 öffentliche Wissensbasis-/Tutor-API-Prüfungen. Modelltransport und Tarif ausschließlich synthetisch.
- Browser: 390-px-Touch/dunkel und Desktop-Tastatur, Gast/Premium, inkrementelle Antwort, geprüfte Quellenroute, tatsächlich gestarteter Notenklang mit 0,5 Sekunden Viertelabstand bei 120 BPM, Meldung, „Warum?“ nach falscher Erstantwort samt ursprünglichem Seed/Antwort, Abbruch mit identischem Replay ohne zusätzliche Anfrage, Verlauf/Löschung und private Daten beim Logout. Öffentlicher Browser zusätzlich hell, echter deaktivierter Serverzustand, verweigerter gültiger Entwurfsquellenlink und Sprachwechsel zu en-GB ohne Modellaufruf.
- Vorschau-Exporte für Web/iOS/Android einschließlich Hermes-Bytecode; öffentliche Exporte aller drei Plattformen mit prüfbarem JavaScript. Alle fünf öffentlichen JavaScript-Dateien enthalten keine Entwurfs-Katalogdaten/-texte. Anbieter-Schlüssel, Anthropic-SDK und Backend-Testadapter sind nicht im App-JavaScript enthalten. Ein nativer Export belegt keinen Gerätebetrieb.

Keine produktive Bereitstellung, keine echte Anthropic-Antwort und keine Live-Kostenmessung wurden vorgenommen. Die fachlich korrekte, verständliche echte Erklärung nach einer falschen Antwort bleibt bis zur sicheren Modellbindung und fachlichen Prüfung offen; die Browserprüfung mit ersetztem Modell kann nur den technischen Ablauf bestätigen. Reale iOS-/Android-SSE-/Audio-/Bildschirmleserabnahme sowie GitHub-CI gehören ebenfalls zur Übergabe an Claude Code. Alle 29 Artikel bleiben Entwurf; der öffentliche Quellenindex bleibt leer.

Review-Zweig: `codex/p2-17-tutor-ui`, aufbauend auf P2.16 (`c553667`). [Vergleich P2.16 → P2.17](https://github.com/PhiFa96/harmonia/compare/codex/p2-16-knowledge-base...codex/p2-17-tutor-ui?expand=1). Claude Code übernimmt Review und Merge; `main` wird hier nicht verändert.

P2.18 ist anschließend technisch umgesetzt: [Tutor-Testkatalog und Kalibrierung](tutor-testkatalog.md) mit 245 Fällen und ausdrücklich getrennten fachlichen/echten Abnahmen. Als nächster technischer Planpunkt folgt P2.19.
