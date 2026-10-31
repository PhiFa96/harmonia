# ADR 0053 – Chor-Einführungen für jede Stimmlage

Datum: 26.10.2026. Status: technische Entwurfsentscheidung; Fach-/Gerätefreigabe offen.

## Anlass

Alle vier P4.11-Einführungskarten zeigten denselben zweitäktigen Sopranbeginn im Violinschlüssel. Der interne Direkteinstieg öffnete sofort die Mikrofonaufgabe und übersprang die Einführung. Die Nacharbeitsliste verlangt Beispiele passend zur gewählten Stimme.

## Entscheidung

- Jede Karte zeigt die vollständige Einzelstimme aus beiden vorhandenen eigenen Miniaturen „Heimweg“ und „Kleiner Bogen“. Acht Beispiele mit je acht halben Noten in vier 4/4-Takten verwenden dieselben klingenden Tonhöhen wie die Aufgaben. Sopran und Alt stehen im Violinschlüssel, Tenor und Bass wie im vorhandenen Trainer im Bassschlüssel. Es werden keine neuen Kompositionen oder Stimmumfänge festgelegt.
- Eigene DE/en-US/en-GB-Beschriftungen benennen Stück, Einzelstimme, Schlüssel und Notenwert. Schlüssel und Dauern kommen aus dem Glossar; en-US verwendet „half notes“/„measures“, en-GB „minims“/„bars“. Die Einführung beschreibt die vorhandene Oktavregel ohne Änderung des Bewertungsprofils.
- Der interne Einstieg verwendet dieselbe `LessonIntroduction` wie der reguläre Lernpfad. Ablauf: Stimmlage wählen → Einführung mit zwei wählbaren Noten-/Klangbeispielen → zwei bestehende Aufgaben → Abschluss. Der gemeinsame Beispielspieler verwendet sein bisheriges Tempo von 90 Viertelschlägen pro Minute und seinen bestehenden Synthesizer-/Klavierpfad. Die Einführung startet kein Mikrofon. Beispielwechsel und Start stoppen die Wiedergabe; Verlassen und erneutes Öffnen beginnen bei der ersten Miniatur.
- Die vier Karten und Lektionen erhalten Version 24, ebenso Katalog/Fähigkeitsplan und öffentliche Projektion. Die Übungssätze und Ratingquellen behalten Version 20. Aufgabenparameter, Partituren der Übungen, Tempoauswahl, Cent-/Oktavregeln, Skip-Verhalten und Mindestzahl gesungener Aufgaben ändern sich nicht.
- Quellen mit alter Chor-Lektionsversion 20 werden abgewiesen. Gemischte Altpläne mit ersetzten Chor-Quellversionen benötigen einen neuen Start. Die getrennte Stufe-5-Vorschau bindet weiterhin die globale Katalogversion; gespeicherte Entwürfe mit Version 23 benötigen nach diesem Wechsel ebenfalls einen neuen Start. Alte Antworten werden nicht umgedeutet.
- Der Produktionskatalog bleibt ohne Lektionen. Die öffentliche Chor-Route wird zusätzlich in DE/en-US/en-GB im Browser auf fehlende Entwurfslektionen, Einführung und Mikrofontrainer geprüft; diese Probe ergänzt die bestehende öffentliche Zeitreise-Prüfung in CI. Das KI-Inventar bindet auch die Chor-Route und die gemeinsame Einführung an den Prüfstand.

## Nachweise und Grenzen

Feste MIDI-Tabellen prüfen alle acht Einzelstimmen zusätzlich gegen die erzeugten Aufgaben, Schlüssel, vier Takte, Notenlängen, Einsätze und acht sichtbare Notenköpfe. App-Tests prüfen beide Beispiele vor der Aufgabenansicht, Klangsteuerung, Verlassen, neue Auswahl und die kanonische Aufgabenquelle. Sprachtests prüfen alle Beschriftungen samt regionalen Begriffen. Browserproben prüfen alle vier Stimmlagen, Beispielwechsel und tatsächlichen lokalen Audiostart ohne Mikrofon; die vorhandenen Mikrofon-/Skip-Proben bleiben bestehen.

Diese Arbeit ist ausdrücklich **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe** auf Nutzerauftrag. Inhalte bleiben `entwurf`, öffentlich null Lektionen; keine Veröffentlichung oder Bereitstellung. Die neuen Beschriftungen sowie die vorhandenen Kompositionen und Bewertungsregeln benötigen weiterhin unabhängige Fach-/Sprachprüfung. Echte Geräte-, Kopfhörer-, Stimmen-, Latenz- und Screenreader-Abnahmen bleiben offen. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.
