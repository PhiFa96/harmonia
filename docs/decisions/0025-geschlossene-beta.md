# ADR 0025 – Geschlossene Beta mit getrennten Start- und Auswertungsbelegen

- Datum: 15.10.2026
- Status: technische Vorbereitung; tatsächliche Beta und Freigaben offen
- Plan: P2.25

## Kontext

Die vorhandene interne Vorschau liefert Entwurfsinhalte aus. Sie darf deshalb nicht als externe Beta verteilt werden. Der öffentliche Katalog enthält derzeit keine freigegebene Lektion. Recht, Betreiberkontakt, Anbieterbetrieb und vier echte Geräteprüfungen sind ebenfalls noch offen. Die Beta soll 30–100 tatsächlich testende Personen aus unterschiedlichen Zielgruppen erreichen und wöchentlich ausgewertet werden.

## Entscheidung

Das EAS-Profil `beta` verwendet `APP_VARIANT=production`, Store-Distribution und einen eigenen Update-Kanal. Seine EAS-Umgebung `preview` bezeichnet die getrennten Betreiberbindungen, nicht den internen Inhaltskatalog. Die freigegebenen Supabase-/EAS-Projekte werden ausdrücklich im Beta-Manifest gebunden und mit den tatsächlichen Laufzeitwerten verglichen. Ein Post-install-Hook stoppt den Beta-Build vor der nativen Kompilierung bei fehlenden Startbelegen. Android-Einreichungen sind als Entwurf im Internal-Track vorbereitet; es gibt keine automatische Einreichung.

Die Web-Beta wird separat aus einem sauberen Commit gebaut. Öffentlicher Inhaltscheck, Größenprüfung und ein vollständiges Datei-/Inhalts-/Commit-Manifest gehören zum Kandidaten. QA-Fixtures und nachträglich geänderte Dateien werden als Kandidat zurückgewiesen. Berichte und Kandidaten verwenden getrennte private Ausgabeordner.

Ein Gateway auf Loopback prüft individuelle, zufällig erzeugte 256-Bit-Zugänge vor jedem HTML-, Datei-, HEAD- und Deep-Link-Aufruf. Die Prüfliste enthält nur Pseudonym, SHA-256 des hochentropischen Geheimnisses, Ablauf und Widerruf. Sie wird je Request neu gelesen. Fehlt sie oder ist sie ungültig, bleibt der Zugriff gesperrt. Ausschließlich Dateien aus dem beim Start geprüften Manifest werden ausgeliefert. Für externe Nutzung ist ein eigener HTTPS-Proxy ohne öffentliche Dateiauslieferung oder Cache vor diesem Gateway erforderlich; das wird vor Freigabe separat geprüft. App-Konto und optionale Analytics-Einwilligung bleiben eigene Vorgänge.

DE/US/UK-Testhinweise verwenden vorhandene Website-Tokens und lokale Schriften. Allgemeines Feedback erreicht nach Einrichtung den geprüften Betreiberkontakt. Aufgaben-/Tutor-Meldungen behalten die vorhandenen Meldewege. Es wird keine Nachricht automatisch gesendet und kein neuer Analytics-Dienst eingebunden.

Ein privates manuelles Journal ordnet Rückmeldungen Arbeitspaketen zu und unterscheidet Zugänge, bestätigte erste Nutzung, Meldungen und eindeutige Fehler. Wochenberichte verwenden geschlossene UTC-Tage und nennen den aktuellen Bearbeitungsstand. Sie rekonstruieren keine historischen Statuswerte und ersetzen keine einwilligungsgebundenen Aktivierungs-/Bindungskennzahlen. Synthetische Testdaten sind sichtbar gekennzeichnet und können die Beta nicht abschließen.

Die Abschlussprüfung verlangt 30–100 bestätigte Tester, Zielgruppen-/Plattformabdeckung, ausgewertete Meldungen, geplante Arbeitspakete, keine offenen kritischen Fehler, zeitlich passende Wochenreviews sowie erst nach der Beta dokumentierte Zielwerte mit nichtleerem Basisnenner und Freigabereferenz. Ein als behoben markierter Fehler benötigt Commit und datierten Prüfbeleg. Ausgefüllte Felder beweisen weder echte Personen noch die Echtheit eines Belegs; Claude und Phillip prüfen diese weiterhin getrennt.

## Folgen

Kein zusätzlicher App-/Backend-Datenspeicher und keine neuen Abhängigkeiten. Persönliche Zugänge und Journaldateien bleiben außerhalb von Git, öffentlichen Exports und CI-Artefakten. Echte Store-/Hosting-/E-Mail-/Anbieterbindungen, Testpersonen, Auswertung, Fehlerbehebung und Freigaben werden durch die technische Vorbereitung nicht ersetzt. P2.26 bleibt davon abhängig.
