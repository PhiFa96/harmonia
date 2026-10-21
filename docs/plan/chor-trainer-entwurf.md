# P4.11 – Chor-Trainer: interner technischer Entwurf

Stand: 21.10.2026. Auf ausdrücklichen Nutzerauftrag erfolgt diese technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**. Keine Veröffentlichung, kein Deployment und keine fachliche oder Geräteabnahme. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt.

## Implementierter Ablauf

- Interner Einstieg unter Üben → Chor-Trainer; vier Entwurfslektionen für Sopran, Alt, Tenor und Bass. Der Einstieg und die direkte Route sind über den Build-Katalog gesperrt, sobald nur freigegebene Inhalte verwendet werden.
- Zwei eigene vierstimmige Miniaturen, „Heimweg“ / “Homeward” und „Kleiner Bogen“ / “A small arch”, je vier Takte in C-Dur und acht halbe Noten pro Stimme. Neu für Harmonia geschrieben; keine Übernahme oder Bearbeitung fremder Partituren. DE, en-US und en-GB einschließlich Einführungen und Notenbeschreibungen.
- Eigener synthetischer „Ah“-Probenklang im bestehenden Sampler, sieben deterministisch erzeugte Mono-Proben mit Vokalformanten. Keine Sprachaufnahme, kein fremdes Sample und kein Stimmenmodell. Separate Audio-Engine verhindert Überschreiben durch nachladende Klavierproben.
- Einzelstimme und Gesamtsatz vorhörbar; vor der Wertung zählt Vorhören als Hilfe. Kopfhörerbestätigung vor dem Start. Vier Zählschläge, danach genau die drei anderen Stimmen; die gewählte Stimme fehlt in der Begleitung.
- Markierte aktuelle Note und pro Note Tonabweichung, Erkennungsanteil sowie Ergebnis in Textform. Abbrechen, erneuter Durchlauf, nächste Miniatur und Mikrofonaufgabe überspringen sind möglich.
- Mikrofon und Klang stoppen bei Abbruch, Navigation, Hintergrund, ausgeschaltetem Ton oder unterbrochenem Audiokontext. Eine verspätete Berechtigung startet keinen verlassenen Durchlauf. Teilaufnahmen werden nicht abgegeben.
- Der interne Direkteinstieg speichert keinen Lernfortschritt und vergibt keine XP. Der normale Lektionenablauf verwendet dieselbe Engine einschließlich serverseitiger Rekonstruktion und korrekt ausgenommener Mikrofon-Skips. Ein vollständig übersprungener Durchlauf besteht keine Lektion.

## Bewertungsprofil v1

`CHOIR_PART` liefert keinen gespeicherten Wahrheitswert. Die Engine bewertet begrenzte, ganzzahlige Tonhöhenmessungen erneut. Acht Noten besitzen jeweils zwölf gleich große Zeitfenster innerhalb der mittleren 70 Prozent ihrer Dauer. Pro Zeitfenster werden höchstens acht stabile Tonhöhenwerte gesammelt und zum Median verdichtet. Viele Rückrufe innerhalb eines Fensters erhöhen die zeitliche Abdeckung nicht.

Eine Note besteht bei mindestens acht erkannten Fenstern und mindestens 75 Prozent passenden Fenstern innerhalb ±50 Cent. Eine konstante Oktavverschiebung gilt für den **gesamten** Durchlauf; wechselnde Oktaven werden nicht pro Note zurechtgerückt. Stille und instabile Erkennung bestehen nicht. Das Profil bewertet Tonhöhe innerhalb der Notenfenster, weder Einsatzpräzision noch Aussprache oder Stimmqualität. Die Schwellen sind ein technischer Entwurf, keine fachlich validierte Gesangsdiagnostik.

Zeitbasis ist die Audio-Uhr der Begleitung, korrigiert um die Mitte des Mikrofonfensters, gemeldete Ausgabelatenz und einen optionalen zusätzlichen Zeitversatz von 0–300 ms. Native Aufnahmezeitstempel werden nur zur Stabilitätsprüfung verwendet, nicht als gleichzeitige Uhr zur Wiedergabe vorausgesetzt. Gemeldete Latenz ersetzt keine gemessene Kalibrierung; Bluetooth und Rückrufverzögerungen bleiben reale Abnahmethemen.

## Daten und Veröffentlichungsschutz

PCM bleibt im lokalen Pitch-Tracker und wird weder gespeichert noch hochgeladen. Antworten bestehen nur aus begrenzten Tonhöhenmessungen pro Fenster. Im normalen synchronisierten Lektionenablauf gelten diese als Übungsantwort; der Tutor erhält die Engine-Auswertung, keine Audioaufnahme. Alle vier neuen Lektionen und ihre Abhängigkeiten tragen `entwurf`. Katalog und Fähigkeitsplan Version 20 enthalten insgesamt 175 Fähigkeiten, 57 Einheiten, 170 Lektionen und 1626 Aufgaben. Der öffentliche Katalog enthält weiterhin **null Lektionen**.

## Prüfung und offene Abnahmen

Automatisierte Prüfungen decken Partituren, ausgeschlossene Singstimme, Antwortvalidierung, Zeitfenster, Stille, Oktavwechsel, Sampler-Tonhöhe, Aufnahme-Lebenszyklus und Skip-Fortschritt ab. Browserprüfungen verwenden künstliche Mikrofonsignale; sie sind ausdrücklich keine Tests mit menschlichen Sänger:innen oder physischen Kopfhörern.

Offen bleiben die unabhängige Fachprüfung der Kompositionen und Schwellen sowie iOS-/Android-/Web-Tests mit echten Mikrofonen und kabelgebundenen/Bluetooth-Kopfhörern: unterschiedliche Stimmlagen, Kammertöne, leise Stimmen, Nebengeräusche, Übersprechen, Routenwechsel, Latenz, Berechtigungen und Unterbrechungen. P4.11 ist technisch als Entwurf umgesetzt; das Plankriterium „mit Kopfhörern zuverlässig“ ist noch nicht abgenommen.

## Lokaler technischer Prüfstand (21.10.2026)

- Übungen: 491 Tests; der aktualisierte Aufgabentyp-Zähler wurde nach dem Gesamtlauf gezielt erneut geprüft. Audio: 41 Tests. Inhalte: 1212 Tests über Gesamt- und gezielten Nachlauf nach Aktualisierung der Katalogzählwerte. i18n: 474 Tests.
- App-Lebenszyklus: fünf Chor-Tests plus zwei bestehende Mikrofon-Tests. Vier Browserfälle mit DE/en-US/en-GB, axe, schmaler Ansicht und künstlichem Gesang durch die echte Web-Audio-/Pitch-Erkennung; acht von acht Sollnoten erkannt, 24 Begleitstimmen-Ereignisse, nachgewiesenes Stoppen bei Abbruch und Navigation.
- 54 Inhalts-Pipeline-Tests; 312 Tutor-/SDK-/Engine-Prüfungen mit simulierter API. Deno durchspielt alle 170 internen Lektionen und 1626 Aufgaben. Übersetzungen, Inhalts- und Fähigkeitsgraph sowie Tutor-Testkatalog v2 geprüft.
- Typprüfung und Lint einschließlich Paketgraph geprüft. Vorschau- und Produktions-Webexport lokal erstellt; der öffentliche Export enthält keine unveröffentlichten Katalog-IDs oder Inhaltstexte. Größenbudget eingehalten (rund 5,86 MB JavaScript, 1,40 MB gzip).
- Die CI der P4.10-Basis meldete bereits veraltete Deno-Zählwerte, einen veralteten Tutor-v2-Snapshot, die alte Prompt-Default-Erwartung im SQL-Test und einen schmalen Satzwerkstatt-Titel. Diese Vorbedingungen wurden im Arbeitsbranch korrigiert; neun Satzwerkstatt-Browserfälle bestanden. Der SQL-Test erwartet nun den bereits durch P4.10 migrierten Default 5. Kein lokaler Supabase-Datenbanklauf in diesem Arbeitsschritt; der neue PR muss seine eigene CI bestehen.

Automatisierte Ergebnisse ersetzen keine unabhängige Fachprüfung, keinen echten Anbieter-/Gerätetest und keine Veröffentlichungserlaubnis.
