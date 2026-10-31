# ADR 0058 – Optionale übermäßige Melodieintervalle

Datum: 26.10.2026. Status: technischer Entwurf; unabhängige Fachprüfung und F05 offen.

## Anlass

Die Nacharbeitsliste für P4.09 nennt fehlende übermäßige Melodieintervalle außerhalb der Sekunde. Die bisherige Regel `augmented-second` untersucht nur geschriebene Sekunden mit drei Halbtönen. Ein allgemeines SATB-Stilverbot oder dessen Schweregrade sind durch F05 noch nicht entschieden.

## Entscheidung

- Die zusätzliche Regel `augmented-melodic-interval` wird ausschließlich auf ausdrückliche Konfiguration aktiv. Der Aufrufer wählt `error`, `warning` oder `hint`; die Engine gibt keinen Standard vor.
- Zwei aufeinanderfolgende Tonhöhen derselben Stimme werden nach ihrer geschriebenen Größe mit dem großen/reinen Referenzintervall verglichen. Die Halbtondistanz folgt der geschriebenen Richtung, bei chromatischen Primen der klingenden Richtung. Mehrfache Übermäßigkeit und zusammengesetzte Intervalle sind eingeschlossen. Ein enharmonisch gleich klingendes vermindertes Intervall fällt nicht unter diese Kennung.
- Pausen unterbrechen die Bewegung. Wiederholte oder gebundene gleiche Tonhöhen erzeugen keinen neuen Befund. Der bestehende Partituradapter überträgt Ausgangs-/Zielnoten und exakte Zeitpunkte über die Regelphase `motion`.
- Die Sekundenregel bleibt unverändert und unabhängig. Bei gemeinsamer Aktivierung erzeugt eine einfach übermäßige Sekunde beide Kennungen mit den jeweils gewählten Schweregraden. `soprano-leap` behält seine bisherige Bedeutung.
- Die private Satzwerkstatt akzeptiert die Regel in den JSON-Einstellungen; Bericht, Belegtabellen und skriptfreie Downloads haben DE/en-US/en-GB-Texte. Das Startprofil wird nicht erweitert. Der zusätzliche gemeinsame Rückmeldungstext aktiviert die Regel nicht in Lernaufgaben.
- `SATB_DRAFT_RULES` für P4.10 und Tutor bleibt unverändert. Vorhandene Bewertungen, Zufallsfolgen, Wiederaufnahme und Quellen-/Engine-Versionen ändern sich nicht. Katalog/Fähigkeitsplan bleiben Version 24.

## Quellen und Nachweise

Open Music Theory R5 wurde am festen Commit erneut direkt gelesen; Fundstelle und Grenzen stehen im [Quellenentwurf](../quality/p4-09-quellenentwurf.md). Die Intervallbegriffe belegen kein allgemeines Stilurteil. Die technische Ableitung mehrfacher Übermäßigkeit und die spätere Profilwahl brauchen weiterhin unabhängige Kontrolle.

Der Vergleich untersucht 19.600 gerichtete Tonpaare (sieben Stammtöne, fünf Alterationen, vier Oktaven). 19.312 stimmen mit `tonal` überein. 288 Orakelwerte sind ungeeignet: 14 leer, 274 mit einer Intervallgröße/Halbtondistanz, die nicht zu den eigenen Notenkoordinaten der Bibliothek passt. Diese Zahlen sind fest geprüft. Zum Beispiel gibt `tonal` für Ceses3 → Ais2 `-1AAA` aus, obwohl es eine geschriebene absteigende Terz ohne klingenden Abstand ist. Eigene Handbeispiele prüfen solche Fälle und mehrfache Übermäßigkeit zusätzlich; falsche Orakelwerte werden nicht übernommen.

107 gezielte Theorieprüfungen, 251 Notationstests, 33 gezielte Übungs-/Wiederholungs-/Akkordprüfungen, 31 Werkstatt-/Bericht-/Audiotests und 18 Chromium-Abläufe sind erfolgreich. Die Browserproben prüfen DE/en-US/en-GB, Ausgangs-/Zielbelege, enharmonische Bearbeitung, erneute Prüfung, skriptfreien Download, Axe und schmale Ansicht sowie die vorhandenen Audio-/Auftaktabläufe. Der neue Detektor und sein enharmonisches Gegenbeispiel laufen auch unter Deno. Diese synthetischen Prüfungen ersetzen keine Fach-, Geräte- oder Screenreader-Abnahme.

Ein versehentlich breit gestarteter Übungstestlauf hatte zwei Zeitüberschreitungen bei fünf Sekunden (555 Tests bestanden). Die beiden betroffenen Dateien und die P4.10-Tests bestanden im anschließenden Lauf mit einem Worker vollständig, ohne Anhebung des Zeitlimits oder Änderung ihrer Logik.

Typecheck, Lint/Paketgraph, Formatierung, Sprach-/Inhaltsprüfung sowie KI-/Zertifikatsvorbereitung sind erfolgreich. Der öffentliche Katalog enthält weiterhin null Lektionen; 20 allgemeine KI-Nachweise und 25 Zertifikatsanforderungen bleiben offen.

Dies ist ausdrücklich **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe** auf Nutzerauftrag. Neue Regel und Texte bleiben Entwurf; F03/F05, unabhängige Fach-/Sprach-/Rechts-/Geräteabnahmen bleiben offen. Keine Veröffentlichung oder Bereitstellung. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.
