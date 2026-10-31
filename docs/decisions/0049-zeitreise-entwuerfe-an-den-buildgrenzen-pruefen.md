# ADR 0049 – Zeitreise-Entwürfe an den Buildgrenzen prüfen

Datum: 26.10.2026. Status: technische Entwurfsentscheidung; unabhängige Fach- und Produktfreigabe offen.

## Anlass

Die P4.12-Nacharbeitsliste nennt drei technische Lücken: `check:i18n` erfasste die gesonderten Stationstexte nicht, die Metro-Sperre prüfte einen unbenutzten Modulnamen, und der Bundleguard übersah kurze Texte sowie die Notenmodelle.

## Entscheidung

- Ein ausschließlich für die Inhaltsarbeit verwendeter Prüfeinstieg bindet die aufgelösten DE/en-US/en-GB-Zeitreisetexte in `check:i18n` ein. Arrays werden in einzelne Textschlüssel überführt. Leere Texte, Schlüssel, Platzhalter, Glossarverweise und genau drei Zeichenketten je Antwortgruppe werden geprüft. En-GB verwendet weiter die bestehenden englischen Entwurfstexte als Rückfallfassung.
- Der Prüfeinstieg wird direkt vom CLI geladen. Er gehört nicht zum öffentlichen i18n-Index oder zu den Laufzeitressourcen der App. Metro sperrt auch seinen versehentlichen Produktionsimport.
- Die allgemeine Sprachprüfung bereitet jeden Textbaum einmal pro Aufruf und Sprache/Namensraum auf. Dieser Cache wird bei jedem Prüflauf neu angelegt; Änderungen zwischen Prüfläufen werden neu eingelesen.
- Metro prüft die tatsächlich aufgelösten, über `realpath` normalisierten Dateien. Die internen Zeitreise-TS-/JSON-Dateien und der bestehende Authoring-Einstieg sind in Produktion gesperrt, auch bei relativen Importen und Symlinks. Die regulären Zeitreise-Aliase wählen weiterhin die leeren öffentlichen Module. Expos NUL-markierte virtuelle Shims werden als Modulkennungen behandelt.
- Der Bundleguard prüft auch kurze Zeitreise-Texte und alle acht Szenen-/Hörpartituren. JavaScript-Stringliterale werden einschließlich Escapes aus dem tatsächlichen Export gelesen. Bereits öffentliche UI-/Glossarwerte sowie freigegebene Notenbeispiele dürfen gleichlautende Werte verwenden.
- Browserprüfungen laufen auf Vorschau- und Produktions-Webexports in DE/en-US/en-GB. Vorschau: vier Stationen und ein vollständiger Durchgang einschließlich explizit übersprungener Hörfrage. Produktion: Deep-Link mit Unverfügbarkeitsmeldung und ohne Stations-/Abspielknöpfe. Die öffentliche Prüfung wird nach dem Produktionsexport in CI ausgeführt; synthetische Nachweise werden sieben Tage aufbewahrt.

## Prüfung und Grenzen

Die Resolver-Prüfungen verwenden die tatsächliche Metro-Konfiguration mit ersetzter Expo-Grundkonfiguration und delegierter Dateiauflösung. Die Webexport- und Browserprüfungen verwenden anschließend den echten Expo-Build. Die drei Plattformkennungen werden im Resolver geprüft; echte native Paket- und Geräteabnahmen bleiben offen.

Die erste Produktionsprobe zeigte, dass Expo auch virtuelle Modulkennungen liefert. Die endgültige Pfadprüfung berücksichtigt diese; ein Regressionstest und der erfolgreiche tatsächliche Export sichern den Fall ab. Die erweiterten Sprachtests zeigten außerdem die wiederholte Aufbereitung großer Textbäume; der auf einen Aufruf begrenzte Cache behebt die dabei beobachteten Testzeitüberschreitungen.

Der Bundleguard ist eine Prüfung bekannter Text-/Partiturwerte in Stringliteralen, keine allgemeine Analyse beliebig zusammengesetzter Daten. Importsperre und tatsächlicher Export werden deshalb zusammen geprüft. Redaktionelle Fragen, Glossararbeit, bessere Quiz-Ablenker, unabhängige Quellenprüfung, Hör- und Geräteabnahmen bleiben offen.

Diese Arbeit ist ausdrücklich **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe**. Alle Inhalte bleiben `entwurf`; öffentlich sind null Lektionen freigegeben. Keine Veröffentlichung oder Bereitstellung. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt.
