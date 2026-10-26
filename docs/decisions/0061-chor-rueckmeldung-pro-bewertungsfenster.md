# ADR 0061 – Chor-Rückmeldung pro Bewertungsfenster

Datum: 26.10.2026. Status: technischer Entwurf; unabhängige Fach-/Sprach-/Geräteabnahmen offen.

## Anlass

Der Chor-Trainer zeigte bisher pro Note die Median-Abweichung, die Erkennungsquote und den Trefferstatus. Ein Median von null Cent kann einzelne stark abweichende Fenster verdecken. Die bestehenden zwölf Antwortwerte erlauben eine nachvollziehbare Detailansicht, ohne neue Messdaten oder ein anderes Bewertungsprofil einzuführen.

## Entscheidung

- `assessChoir` ergänzt pro Note zwölf geordnete Fenster mit korrigierter Cent-Abweichung und Status `missing`, `in-tune`, `low` oder `high`. Hinzu kommen die Zahlen erkannter und passender Fenster. Die bisherige Note-Wertung, Erkennungsquote und Median-Abweichung bleiben unverändert.
- Anzeige und Wertung verwenden dieselbe globale Oktavkorrektur. Passend bedeutet weiterhin einschließlich ±50 Cent; eine Note verlangt weiterhin mindestens acht erkannte Fenster und 75 Prozent passende unter den erkannten Fenstern. Die Detailansicht entscheidet nicht über die fachliche Eignung dieser Schwellen.
- Nach der Wertung zeigt die lokale App pro Note Symbole für alle zwölf Fenster sowie getrennte Erkennungs-/Trefferzahlen. Bei keiner Erkennung steht eine ausdrückliche Meldung anstelle von „0 von 0“. DE/en-US/en-GB, eindeutige Screenreader-Beschriftungen mit Note/Fenster/Status/Abweichung, Symbole zusätzlich zur Farbe und Umbruch bei schmaler Darstellung.
- Die Fenster verwenden die bestehenden zwölf Antwortwerte im mittleren Notenbereich. Sie sind keine durchgehende Tonhöhenkurve, keine neue PCM-Abdeckungsmessung und keine Aussage über Einsatzpräzision oder Stimmqualität. Die bisherige Datenflussprüfung bleibt bestehen.
- Fensterdetails erscheinen erst aus der geprüften Antwort und verschwinden beim Aufgabenwechsel. Kein neues Audio, Antwort-/Speicher-/Synchronisationsformat oder Datenbankfeld. Katalog und Chorquellen bleiben Version 25, Einführungskarten Version 24; Gesangs-/Hilfe-/Skip-/Oktavregeln und bestehende Wiederaufnahme ändern sich nicht.
- Der Tutor erhält weiterhin seine bisherige knappe Notenzusammenfassung mit `index`, `coverage`, `deviation`, `passed`. Die abgeleiteten Fenster und Zähler werden nicht zusätzlich an das Modell übergeben. Prompt-/Toolversionen bleiben 5/3; identische Request-ID-Replays und bestehende Gespräche werden nicht nachträglich verändert.
- Der neue Renderer liegt im überwachten Chor-Verzeichnis und ist automatisch in die P4.17-Quellbindung eingeschlossen. Das ist keine rechtliche Freigabe.

## Nachweise und Grenzen

63 Chor-Übungsprüfungen und 21 App-Tests sind erfolgreich. Neue Fälle prüfen die exakten ±50-Cent-Grenzen, erkannte gegenüber passenden Fenstern, null Eingabe/ungültige Antworten, alle fünf bisher möglichen Oktavkorrekturen und das unveränderte 75-%-Grenzverhalten. Ein Beispiel mit neun passenden und drei um 700 Cent abweichenden Fenstern behält seine bisherige Note-Wertung, zeigt aber die drei Abweichungen. Die App prüft alle vier Statusarten, Zähler, korrigierte Centwerte und zugängliche Beschriftungen in drei Sprachen.

1.170 Tutor-/SDK-/Engine-Prüfungen unter Deno sind erfolgreich, ausschließlich mit simulierter API und Testtarif. Alle 16 Chor-Erst-/Wiederholungsquellen werden in DE/en-US/en-GB geprüft; jede Tutor-Notenzusammenfassung behält ihre bisherigen vier Felder.

Die Browserprobe umfasst zehn Vorschau- und drei Produktionsabläufe. Echte Browser-Audioverarbeitung mit synthetischem C-/D-Dur-Gesang prüft jeweils acht getroffene Noten und 96 Fenster, deren Fehlen vor der Wertung und Rücksetzung beim Aufgabenwechsel, Abbruch/Neustart/Navigation sowie Axe. Die Detailansicht wird zusätzlich in 390 Pixel Breite geprüft. Der öffentliche Export enthält weiterhin keine Chorlektionen oder unveröffentlichten Katalogtexte. Diese Prüfmittel ersetzen keine echte Gesangs-, Mikrofon-, Screenreader- oder Geräteabnahme.

Typecheck einschließlich abschließender App-/Werkzeug-/Funktionsprüfung, Lint/Paketgraph, Formatierung und Sprach-/Inhaltsprüfung sind erfolgreich. Der zusätzliche Browserlauf in 390 Pixel Breite ist erfolgreich und anhand eines lokalen Bildschirmbilds kontrolliert. KI-/Zertifikatsvorbereitung bleibt mit zehn ungeprüften Funktionsbereichen und nun 245 gebundenen Dateien gültig; 20 allgemeine KI-Nachweise und 25 Zertifikatsanforderungen bleiben offen. Der öffentliche Katalog enthält weiterhin null Lektionen.

Dies ist ausdrücklich **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe** auf Nutzerauftrag. Neue Rückmeldungstexte bleiben Entwurf; bestehende Fach-/Rechts-/Sprach-/Geräteabnahmen bleiben offen. Keine Veröffentlichung oder Bereitstellung. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.
