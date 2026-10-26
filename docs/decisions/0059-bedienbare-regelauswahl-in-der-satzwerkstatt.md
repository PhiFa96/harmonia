# ADR 0059 – Bedienbare Regelauswahl in der Satzwerkstatt

Datum: 26.10.2026. Status: technischer Entwurf; Fach-/Sprach-/Geräteabnahmen offen.

## Anlass

Alle 17 P4.09-Kennungen ließen sich bisher ausschließlich über den JSON-Text einstellen. Auch die zuletzt ergänzte optionale Melodieregel verlangte eine manuelle Eingabe ihres technischen Namens und Schweregrads. Die private Werkstatt braucht eine ausdrückliche, übersetzte Auswahl, die mit dem gespeicherten Entwurf und dem tatsächlich geprüften JSON übereinstimmt.

## Entscheidung

- Ein aufklappbarer Bereich zeigt für jede Regel die vorhandene DE/en-US/en-GB-Bezeichnung und Beschreibung sowie ein natives Auswahlfeld. Aus entfernt genau diese Kennung; Fehler/Warnung/Hinweis setzen ausschließlich den gewählten Schweregrad. Es wird kein Schweregrad hinzugeraten, das Startprofil bleibt unverändert.
- Regelsteuerung und Bericht verwenden dieselbe strenge Regelvalidierung. Unbekannte Kennungen, auch besondere Objektschlüssel wie `__proto__`, werden vor einer möglichen Auslassung durch den Record-Parser abgewiesen. Das gilt auch für den Bericht-CLI.
- Der JSON-Text bleibt die gemeinsame Konfiguration und das bisherige Speicherformat. Einzelne Änderungen erhalten andere Regeln und alle vorhandenen Optionen. Bei Änderungen darf das JSON neu formatiert werden; unveränderte Auswahlen erhalten den ursprünglichen Text. Die Grenze von 30.000 Zeichen wird auch auf die erzeugte Ausgabe angewendet, bevor sie eine Eingabe ersetzt.
- Ungültiges JSON oder ungültige Regeln sperren die Auswahl und zeigen einen übersetzten Hinweis. Der Originaltext bleibt editierbar und speicherbar. Nach einer Korrektur, einem Entwurfsimport oder einem Sprachwechsel synchronisieren sich alle Felder. Unlesbare Einstellungen werden nicht als ausgeschaltete Regeln dargestellt.
- Eine gültige Regelauswahl verlangt keine vollständige Partitur oder vollständige Fachparameter. Stimmumfänge, Harmonieangaben, Geltungsbereiche und Grenzen werden weiterhin ausdrücklich im JSON eingetragen. Der bestehende Bericht weist fehlende oder ungültige Angaben weiterhin zurück.
- Erfolgreiche Regeländerungen verwenden denselben bisherigen Invalidierungsweg wie Notenänderungen: Klang stoppen, alte Befunde entfernen, Berichtsdownload und Wiedergabe bis zur neuen Prüfung sperren. Speichern des unfertigen Entwurfs bleibt möglich.
- Detektor, P4.10-Lern-/Tutorprofil, Bewertungs-/Quellen-/Engine-Versionen und Wiederaufnahme bleiben unverändert; Katalog/Fähigkeitsplan weiter Version 24. Das Werkzeug wird nicht in die öffentliche App eingebunden.

## Nachweise und Grenzen

Die gezielten Modell-/Bericht-/Audiotests prüfen alle Kennungen und Schweregrade, Erhalt fremder Regel- und Harmonieangaben, Deaktivieren, unveränderten Text, unfertige Notation/Parameter, unbekannte Schlüssel sowie Größenbegrenzungen. Die Browserfälle prüfen DE/en-US/en-GB, Ausgangseinstellungen, JSON-Synchronisierung, Schweregrade, Tastatur, Speichern/Laden, Sprachwechsel, Abbruch der Wiedergabe, ungültige Einstellungen und fehlende Fachparameter. Axe und schmale Darstellung werden mit geöffnetem Auswahlbereich geprüft.

37 gezielte und insgesamt 272 Werkzeugtests sowie 24 Chromium-Abläufe sind erfolgreich. Typecheck, abschließender Lint/Paketgraph, Formatierung, Sprach-/Inhaltsprüfung und KI-/Zertifikatsvorbereitung sind erfolgreich. Der öffentliche Katalog enthält weiterhin null Lektionen; 20 allgemeine KI-Nachweise und 25 Zertifikatsanforderungen bleiben offen. Desktop- und schmale Darstellung wurden zusätzlich anhand lokaler Bildschirmbilder kontrolliert.

Diese synthetischen Prüfungen ersetzen keine echte Screenreader-/Geräte- oder unabhängige Fach-/Sprachprüfung. Die Oberfläche wählt keine F05-Konvention und bestätigt keinen vollständig richtigen Satz. Dies ist ausdrücklich **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe** auf Nutzerauftrag. Neue Texte bleiben Entwurf, keine Veröffentlichung oder Bereitstellung. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.
