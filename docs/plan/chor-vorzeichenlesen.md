# P4.11 – Vorzeichenlesen ohne zusätzlichen Bassschlüssel (C8)

Stand: 31.10.2026. Arbeitsbranch `codex/choir-key-signature-prerequisites`, unabhängig von Tutor-PR #136 auf `main` bei `f7bc15d`. [ADR 0067](../decisions/0067-chor-vorzeichenlesen-ohne-bassschluessel.md). Technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**; alles Entwurf, keine Veröffentlichung.

## Implementiert

- Eigenständige Stufe-2-Einheit `scales.l2.key-reading` mit Fähigkeit `key.signature-read-treble`. Benötigt nur das Lesen natürlicher Töne im Violinschlüssel, einfache Versetzungszeichen und Oktavlagen aus Stufe 1. Keine indirekte Bassschlüssel- oder Schreibvoraussetzung.
- Zehn eigene Auswahlfragen unter den vorhandenen, unveränderten `KEYSIG_IDENTIFY`-Parametern: nur Violinschlüssel und ausdrücklich vorgegebenes Dur, null bis zwei Kreuze/b. Antworten C/G/D/F/B-Dur (international Bb). Die Beispiele erklären die Geltung für alle Oktavlagen und unterscheiden Vorzeichnung und einzelne Versetzungszeichen.
- Drei eigene DE/en-US/en-GB-Einführungskarten mit fünf vollständigen, spielbaren Beispielen; eigener Artikel mit drei Abschnitten. Der reguläre Lektionenablauf ergänzt Wiederholungen aus bereits vorausgesetztem Wissen. Die Einführung zeigt die tatsächliche Gesamtzahl.
- Alle vier Chorstimmen verlangen die neue Fähigkeit. Der Lernpfad verlinkt die fehlende Grundlage. Sopran/Alt bleiben ohne zusätzlichen Bassschlüssel erreichbar; Tenor/Bass behalten ihre eigene Basslesevoraussetzung. Fehlende Grundlagen werden nicht durch einen direkten Link oder eine isolierte Chor-Einstufung ersetzt.
- Ein echter kanonisch bewerteter Leseabschluss verwendet dieselbe Lernnachweis-/Rating-/Belohnungspipeline wie vorhandene Lektionen. Ein fehlgeschlagener oder veralteter Durchlauf erfüllt die Chor-Voraussetzung nicht.

Das Lernziel umfasst die begrenzte Zuordnung vorgegebener Dur-Vorzeichnungen. Es ersetzt weder allgemeines Tonartbestimmen noch Basslesen, Moll, größere Vorzeichnungen oder den bisherigen Schreibweg. Die fachliche/didaktische Eignung bleibt unabhängig zu prüfen.

## Versionen und Kompatibilität

Katalog/Fähigkeitsplan und betroffene Chor-Einheit/-Fähigkeiten/-Lektionen **28**, neue Datensätze ebenfalls 28. Bestehende Chor-Übungssätze/Ratingquellen bleiben 25, Einführungskarten 24. Andere bestehende Lektionen behalten ihre Versionen.

Neue Gesamtzahlen: **200 Fähigkeiten, 66 Einheiten, 195 Lektionen, 1.876 Aufgaben, 395 Karten mit 458 Beispielen und 63 Artikel mit 373 Abschnitten**. Die öffentlichen Artefakte wurden ausschließlich lokal neu erzeugt: weiterhin null freigegebene Lektionen und keine neuen öffentlichen Texte.

Alte Chor-Durchläufe 27 sowie kataloggebundene freie/adaptive Pläne und Stufe-5-Vorschauen unter Katalog 27 brauchen einen Neustart. Antworten und historische Abschlüsse werden nicht umgedeutet. Keine Migration, SQL-Spalte, neue Rohantwortkopie oder Änderung an musikalischer Bewertung, Abschlussquote, Mindestgesang oder Tutor-Prompt/Werkzeugen.

## Prüfstand

Aktueller lokaler Stand: 28 App-Tests in drei Dateien, sieben neue Inhalts-/Freischaltungsfälle, ein zusätzlicher Notations-/Klangfall in der Werkzeugpipeline, 275 Werkzeugtests und der vollständige Deno-Gesamtlauf einschließlich aller 1876 Aufgaben sowie 1314 simulierten Tutor-/SDK-/Engine-Prüfungen sind erfolgreich. Vollständige Typprüfung, Lint/Paketgraph, Formatierung, Übersetzungs-/Inhalts-/Fähigkeitsgraphprüfung und `git diff --check` bestehen.

Ein Gesamtlauf der Inhaltssuite bestand zunächst mit 1461 Fällen. Nach Verlagerung des Klangtests in die erlaubte Werkzeugschicht und Erweiterung der Mischplanprüfung bestanden 1460 Fälle; die neue Rating-Fixture wählte mangels bekannter eigener Fähigkeit noch den festen Fallback. Mit ausdrücklich bekanntem Leseprofil prüft derselbe Test nun tatsächlich `flow:2`; alle sieben betroffenen Fälle und deren Typprüfung bestehen. Keine Assertion oder Zeitgrenze gelockert. Die komplette Suite wird im GitHub-Lauf erneut geprüft.

Die Tutor-Fixture verwendet jetzt Chor-Version 28 und weist 27 zusätzlich als veraltet ab. Der deterministisch neu erzeugte Tutor-v2-Katalog ändert ausschließlich vier `totalLessons`-Werte von 194 auf 195; Prompt, Werkzeuge und Fragen bleiben erhalten. Die Inhalts-/Planungsdiagramme sind neu erzeugt. Es wurden keine zusätzlichen Paketabhängigkeiten eingeführt.

Neue HTTP-/DB-Fälle wurden hier nicht lokal ausgeführt; der tatsächliche Nachweis erfolgt im GitHub-Job. Der konkrete CI-Status wird im Entwurfs-PR festgehalten.

- Die zwei Regressionen „ohne Vorzeichenlesen noch zugänglich“ und „kein eigenständiger Leseweg“ waren am alten Stand rot und nach der Implementierung grün.
- Weitere Inhaltsfälle prüfen Erreichbarkeit mit Stufe-1-Grundlagen, die vollständige Voraussetzungshülle, 100 deterministische Sitzungen mit unabhängiger Tabelle für C/G/D/F/B, erfolgreiche und fehlgeschlagene Serverrekonstruktion sowie veraltete und öffentliche Quellen.
- App-Prüfungen öffnen Einführung und Fragen über den neuen Grundlagenlink in DE/en-US/en-GB. Der direkte Sopran-Link bleibt gesperrt. Bestehende Tests für unabhängige Stimmen, Bassgrundlagen, Einführung und Abschluss bleiben erhalten.
- Browserprüfungen kontrollieren den neuen Grundlagenhinweis je Stimme und gesperrte direkte Zugänge. Die Produktionsprüfungen bleiben aktiv.
- Die echte lokale Auth-/DB-/API-Prüfung in CI ist um den neuen Leseabschluss, geprüfte Belohnung, Konto-Isolation, veraltete Quellen und öffentlichen Ausschluss ergänzt. Ausführungsstatus und konkrete Testergebnisse werden im PR dokumentiert; reine Engine-Tests gelten nicht als HTTP-Nachweis.

Die Einführung enthält Originalmaterial. Automatische Tests sind keine unabhängige Fach-/Literatur-/Sprachprüfung oder reale Geräte-/Mikrofon-/Kopfhörer-/Stimmenabnahme. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt. Kein Merge oder Deployment.
