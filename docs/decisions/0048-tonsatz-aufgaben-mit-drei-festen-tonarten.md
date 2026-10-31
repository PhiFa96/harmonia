# ADR 0048 – Tonsatzaufgaben mit drei festen Tonarten

Datum: 26.10.2026. Status: technische Entwurfsentscheidung, keine Fach- oder Produktfreigabe.

## Anlass

Die sechs P4.10-Lektionen erzeugten jeweils drei Aufgaben aus nur drei zufällig gezogenen Tonarten. Identische Aufgaben innerhalb eines Erstversuchs waren dadurch häufig. Die Nacharbeitsliste der Phase-4-Entwürfe nennt diesen Befund ausdrücklich.

## Entscheidung

- `VOICE_LEADING` erlaubt optional `fifths: -1 | 0 | 1`. Die Inhaltsprüfung und der Generator verweigern andere Werte. Das begrenzte Aufgaben- und Regelprofil bleibt gleich.
- Jede der sechs Lektionen enthält drei einzeln verfasste Aufgabenspezifikationen: zuerst C-Dur, dann F-Dur, dann G-Dur. Jede Tonart kommt im Erstversuch genau einmal vor. Es gibt weiterhin 18 Kernaufgaben insgesamt; keine neuen musikalischen Vorlagen oder Regeln.
- Die kanonische Fehlerwiederholung wählt mit ihrem bisherigen Wiederholungsseed eine der beiden anderen Tonarten. Diese Auswahl wird von App, Lernnachweisprüfung, Inhaltsmeldung und Tutor gleich rekonstruiert. Die Wiederholung unterscheidet sich vom zugehörigen Erstversuch; verschiedene Fehlerwiederholungen dürfen dieselbe Tonart verwenden.
- Spezifikationen ohne `fifths` behalten ihre bisherige Zufallsauswahl einschließlich RNG-Verbrauch. Das ist mit festen numerischen und textlichen Seeds abgesichert.
- Die sechs Übungssätze und Lektionen erhalten Inhaltsversion 22; Katalog und Fähigkeitsplan ebenfalls. Alte P4.10-Quellen mit Version 19 werden als geändert abgewiesen. Es gibt keine Umdeutung alter Antworten. Die übrigen Datensatzversionen und die öffentliche Freigabe bleiben erhalten.
- Die Ratingprofile berücksichtigen die festgelegte Tonart; C-Dur (`0`) wird dabei ebenso ausdrücklich gebunden wie F- und G-Dur. Historische Profile ohne feste Tonart bleiben unverändert. Gemischte Altpläne, die eine ersetzte P4.10-Quellversion enthalten, müssen ebenfalls neu gestartet werden.

## Folgen und Grenzen

Die drei Kernaufgaben sind in jedem Durchgang gleich angeordnet. Eine größere musikalische Vielfalt braucht weitere unabhängig geprüfte Vorlagen. Die Einführungskarten, F03/F05, Regelwahl und fachlichen Befunde der übrigen Nacharbeitsliste bleiben offen.

Die Katalogänderung macht bestehende lokale Stufe-5-Vorschauentwürfe mit Katalogversion 21 absichtlich veraltet; der vorhandene Wiederaufnahmeablauf bietet einen neuen Start. Quellengebundene Zertifikats- und KI-Prüfstände müssen neu erzeugt und unabhängig geprüft werden. Daraus folgt keine Freigabe.

Dies ist ausdrücklich **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe** auf Nutzerauftrag. Alle Inhalte bleiben `entwurf`, öffentlich sind weiterhin null Lektionen. Keine Veröffentlichung, kein Deployment. P4.01 bleibt bis zur Klärung von F14 und der rechtlichen Voraussetzungen zurückgestellt.
