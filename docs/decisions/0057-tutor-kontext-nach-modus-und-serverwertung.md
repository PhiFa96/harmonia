# ADR 0057 – Tutor-Kontext nach Modus und Serverwertung

Datum: 26.10.2026. Status: technische Entwurfsentscheidung; Fach-/Modell-/Produktfreigabe offen.

## Anlass

Die P4.10-Nacharbeitsliste nennt das vom Client gesetzte `checked`-Feld als Vertrauensproblem. Das Requestschema verlangte es für Erklärungen; im Hinweis-/Chatmodus konnte `checked: true` zudem die Beschreibung einer eigentlich versteckten Höraufgabe freigeben. Der Server berechnete die Antwortbewertung bereits selbst, konnte aber keinen früheren lokalen Klick beweisen.

## Entscheidung

- `checked` bleibt als boolesche UI-Metadaten im bestehenden Request-/Gesprächsformat erhalten. Es ist weder Bewertungsnachweis noch Freigabe für Aufgabeninformationen. `explain` verlangt eine übergebene Antwort und eine kanonische Aufgabenquelle; beide Flagwerte sind zulässig. Fehlende Antworten und vom Client erfundene Bewertungsfelder bleiben abgewiesen.
- Bei Erzeugung eines neuen Erklärkontexts rekonstruiert der Server die Aufgabe aus Quelle, Version und Seed und wertet die übergebene Antwort mit der Engine aus. Ungültiger freier Antworttext bleibt wie bisher außerhalb des vertrauenswürdigen Aufgabenblocks; die Engine liefert ihre bestehende Ungültigkeitsrückmeldung. Der Modus bestätigt keine frühere lokale Wertung und schreibt keine Lernnachweise oder Belohnungen.
- Hinweis-/Chatkontexte enthalten unabhängig von `checked` keine Antwort-, Lösungs-, Bewertungs- oder Feedbackfelder. Versteckte Hörquellen erhalten keine Beschreibung. Die bisherigen Ausnahmen für das bereits als Frage sichtbare Material von `RHYTHM_TAP` und `LISTENING_CHOICE` bleiben erhalten.
- Die App wendet ihre bisherige konservative Auswahl eines Hinweis-Notenbilds auch im begleitenden Chat an. Erklärungen und ausdrücklich verlangte Lösungen können weiterhin ihre bisherigen Rückmeldungsmedien zeigen. Der lokale „Warum?“-Einstieg nach einer Wertung bleibt erhalten.
- Das SATB-Werkzeug bleibt an den serverrekonstruierten Kontext und den Erklärungs-/Lösungsmodus gebunden. Ein alter Bewertungskontext aktiviert es nicht in Hinweis/Chat. Toolargumente, fachliches Regelprofil, Prompttext und bestehende Prompt-/Toolversionen 5/3 bleiben unverändert; eine Datenbankmigration ist nicht erforderlich.
- Katalog/Fähigkeitsplan bleiben Version 24. Vorhandene Gesprächsantworten und identische Request-ID-Replays werden nicht nachträglich neu bewertet oder bereinigt. Die bestehenden Identitäts-, Quota-, Kosten- und Replayregeln gelten weiter. Diese Änderung ist kein Nachweis eines abgelegten Versuchs oder einer Prüfungsaufsicht.

## Nachweise und Grenzen

Sieben gezielte Request-/Scope-/Versionsprüfungen und zwölf App-Tests sind erfolgreich. Sie prüfen beide Flagwerte, fehlende Antworten, strenge Felder, versteckte Hörbilder in Hinweis/Chat und das Senden einer Antwort zur Serverwertung mit `checked: false`.

930 Tutor-/SDK-/Engine-Prüfungen sind unter Deno erfolgreich, ausschließlich mit simuliertem Anbieter und Testtarif. Alle 28 aktuellen Aufgabentypen werden in DE/en-US/en-GB verglichen: Erklärkontexte sind für beide Flagwerte identisch, Hinweis-/Chatkontexte bleiben frei von Bewertungsfeldern und versteckte Hörquellen bleiben verborgen. Alle 36 P4.10-Erst-/Wiederholungsquellen werden mit `checked: false` serverseitig rekonstruiert; veraltete Quellen bleiben gesperrt. Die 265 Werkzeugtests sind erfolgreich.

Vollständiger Typecheck, Lint/Paketgraph, Formatierung sowie Sprach-/Inhaltsprüfung sind erfolgreich. Der bestehende authentifizierte Supabase-HTTP-Test wurde auf eine Erkläranfrage mit `checked: false` erweitert. Dieser echte HTTP-Durchlauf wurde in diesem Schritt lokal nicht erneut ausgeführt; er bleibt Bestandteil der neuen GitHub-CI. Die simulierten SDK-Prüfungen ersetzen keine echte Modell-/Kosten- oder Geräteabnahme.

Dies ist ausdrücklich **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe** auf Nutzerauftrag. Fach-, reale Modell-, Datenschutz-/Rechts- und Geräteabnahmen bleiben offen. Keine Veröffentlichung oder Bereitstellung. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.
