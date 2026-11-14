# ADR 0082: Cantus-Schlussvarianten aus den notierten Stimmen erklären

Datum: 14.11.2026 · Status: angenommen für den beauftragten internen technischen Entwurf; unabhängige Fach-/Quellen-/Sprachprüfung offen.

## Ausgangslage

Die [Stufe-5-Fachprüfung v3, Befund 2](../quality/fachpruefung-phase-4-v3/stufe-5.md) weist auf Cantus-Schlüsse 7→1 hin. Sie bestehen die neun begrenzten Prüfregeln, sollen aber nicht als Cantus-Muster der dort zum Vergleich genannten Fux-Konvention mit 2→1 missverstanden werden. Die erneute Zählung der aktuell integrierten 24 Modelle ergibt **11 aufsteigende Halbtonschlüsse und 13 absteigende Ganztonschlüsse**; die Angabe zwölf im Rohbericht bleibt als damaliger Befund unverändert dokumentiert.

## Entscheidung

- Vor der Antwort erklärt ein bei allen zweisystemigen `counterpoint-check`-Aufgaben gleicher Konventionshinweis die 7→1-Variante und den Vergleich mit 2→1. Er verrät weder, welche Variante gerade vorliegt, noch das Ergebnis der neun Regeln.
- Die Lösung nach der Wertung beziehungsweise der ausdrücklich angeforderte Lösungshinweis nennt die beiden tatsächlichen letzten Cantus-Töne und ihre Bewegung. Ein diatonischer Halbton aufwärts wird im Kontext dieser Kurzmodelle als 7→1-Variante erklärt, ein Ganzton abwärts als 2→1-Vergleich. Andere Bewegungen erhalten eine neutrale Beschreibung.
- Die Erkennung verwendet ausschließlich das zweite, fest zugeordnete System sowie geschriebenen und klingenden Abstand. Sie sortiert Stimmen auch bei einer Kreuzung nicht nach Tonhöhe. Enharmonisch gleich klingende Töne ersetzen keine diatonische Bewegung. Der Helfer beschreibt eine Bewegung; er ermittelt keinen Modus, keine Tonikafunktion und kein neues Bestehensurteil.
- Historische Ein-System-Dyaden erhalten keine nachträgliche feste Cantus-Zuordnung. Andere Kontrapunktthemen behalten ihre bisherigen Texte. Die neun Prüfregeln bleiben allein für die bisherige Bewertung verantwortlich; dieselbe Cantus-Bewegung erscheint bei korrekten und fehlerhaften Gegenstimmen.
- Eigene Texte in DE/en-US/en-GB. Halb-/Ganztonbegriffe kommen aus dem vorhandenen Glossar, Notennamen samt Oktave/Vorzeichen aus der Engine mit der gewählten Notennamen-Einstellung. Es entstehen keine neuen Lösungsschlüssel, Aufgabenfelder oder Antwortformate.

## Versionen und Grenzen

Generator, RNG-Aufrufe, alle 24 Modelle, ihre Transpositionen und Gegenbeispiele bleiben unverändert. Ein Vergleich gegen `main@ab157e8` bestätigt 3.000 identische erzeugte Partituren über alle drei Kontrapunktthemen. Diese Änderung ergänzt die Darstellung und Erklärung; sie ändert keine Aufgabenquelle oder Wertungsregel. Katalog/Fähigkeitsplan 31 und Vorschau-Engine 2 bleiben erhalten, gespeicherte Antworten werden unverändert rekonstruiert. Neue private KI-/Zertifikatsprüfmappen sind wegen der geänderten Codebindung erforderlich.

Die Konventionsunterscheidung folgt dem vorhandenen v3-Befund. Es wird keine neue Fux-/Jeppesen-Volltextlesung oder unabhängige Fachfreigabe behauptet. Tests und `tonal` kontrollieren Noten-/Intervallarithmetik und Abläufe, keine vollständige historische Stilbewertung.

Technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**. Alles bleibt Entwurf, keine Veröffentlichung, Fernsynchronisierung oder Main-Integration. Unabhängige Fach-/Primärquellen-/Sprachprüfung und reale Geräte-/Audio-/Screenreaderabnahmen bleiben offen; P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt. [Übergabe](../plan/kontrapunkt-schlussvarianten.md).
