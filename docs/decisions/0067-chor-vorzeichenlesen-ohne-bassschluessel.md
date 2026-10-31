# ADR 0067 – Vorzeichenlesen als eigene Chor-Voraussetzung

Datum: 31.10.2026. Status: interner technischer Entwurf auf Nutzerauftrag; keine Fach- oder Gerätefreigabe.

## Anlass

Befund C8 aus der [Prüfung der integrierten P4-Entwürfe](../plan/fachpruefung-phase-4-v2.md): Die Choraufgaben und ihre Wiederholungen verwenden C-, D- und B-Dur (international Bb), verlangen aber bisher keine Vorzeichnungsfähigkeit. `key.signature-major` führt über `scale.major-build` und `notation.write-pitch` zum Bassschlüssel. Diese Voraussetzung würde die in ADR 0063 gewollte unabhängige Wahl von Sopran/Alt einschränken.

## Entscheidung

- Die neue Stufe-2-Einheit `scales.l2.key-reading` vermittelt `key.signature-read-treble`: Dur-Vorzeichnungen mit null, einem oder zwei Kreuzen bzw. b im Violinschlüssel zuordnen. Voraussetzungen sind nur `notation.treble-natural`, `notation.accidentals` und `notation.octave-register` aus Stufe 1. Weder Basslesen noch Töne-/Tonleiterschreiben werden verlangt.
- Eine eigene Lektion mit zehn `KEYSIG_IDENTIFY`-Aufgaben verwendet ausschließlich Violinschlüssel, vorgegebenes Dur und fünf Vorzeichnungen: C, G, D, F und B (international Bb). Drei eigene DE/en-US/en-GB-Karten, fünf spielbare Beispiele und ein Artikel begleiten die Aufgaben. Es gibt keinen neuen Aufgabentyp und keine Änderung an Generator, Bewertung, Tonarten oder Antwortformaten vorhandener Aufgaben.
- Alle vier Chor-Fähigkeiten verlangen zusätzlich diese Lesefähigkeit. Sopran/Alt behalten ihre bisherigen Violinschlüsselvoraussetzungen; Tenor/Bass behalten zusätzlich Basslesen. Die Stimmen bleiben unabhängig. Der Grundlagenlink führt zur neuen Einheit; direkte gesperrte Lektionslinks bleiben gesperrt.
- Die Lesefähigkeit wird durch Bestehen der eigenen Lektion oder eine regulär vorausgesetzte Einstufung erworben. Ein isoliertes Einstufungsergebnis nur für Chor ersetzt sie nicht. Alte Abschlüsse der umfangreicheren Vorzeichnungslektion werden nicht stillschweigend auf das neue Lernziel übertragen.
- Das Lernziel ist ausdrücklich auf die Zuordnung dieser Dur-Vorzeichnungen im Violinschlüssel begrenzt. Allgemeines Tonartbestimmen aus Musik, Moll, größere Vorzeichnungen und das Schreiben einer Vorzeichnung gehören weiter zu den bestehenden Lernwegen. Die didaktische Auswahl bleibt bis zum unabhängigen Fachreview Entwurf.

## Versionierung und Daten

Katalog/Fähigkeitsplan, Chor-Einheit, vier Chor-Fähigkeiten und vier Chor-Lektionen erhalten Version **28**. Neue Einheit, Fähigkeit, Übungssatz, Karten, Artikel und Leselektion ebenfalls 28. Chor-Übungssätze/Ratingquellen bleiben 25, Einführungskarten 24. Andere bestehende Lektions- und Inhaltsversionen bleiben erhalten.

Alte Chor-Durchläufe 27 benötigen einen Neustart; ihre Antworten und Abschlüsse werden nicht umgedeutet. Kataloggebundene freie/adaptive Pläne und Stufe-5-Vorschauen unter der alten globalen Version benötigen ebenfalls einen Neustart. Die bestehende Abschlussregel (80 % plus eine eigene bestandene Gesangsaufgabe), musikalische Toleranzen, Oktavregel und Antwort-/Synchronisationsformat bleiben unverändert. Keine Migration oder neue Rohantwortablage.

Die allgemeine Reihenfolge und Zuordnung bestehender Einheiten wird nicht verändert. Die neue Einheit hat einen eigenen Zugang und wird ausdrücklich vor den bisherigen Tonarten-Einheiten in den Plan aufgenommen. Der frühere Schreibweg wird nicht abgeschwächt.

## Nachweise und Freigabegrenze

Regression: ohne Lesefähigkeit bleiben alle Chor-Stimmen gesperrt, auch bei isolierter Chor-Einstufung. Mit geprüftem Leseabschluss öffnen Sopran/Alt ohne Basslesen; Tenor/Bass bleiben gesperrt. Tests prüfen erreichbaren Einstieg mit Stufe-1-Grundlagen, feste Antworten für alle fünf Vorzeichnungen, kanonische Serverwertung, veraltete Nachweise, DE/US/UK-Links und Direktzugriffe, Beispiele und Produktionsausschluss. Prüfstand: [Übergabe](../plan/chor-vorzeichenlesen.md).

Dies ist technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**. Sämtliche neuen Inhalte bleiben `entwurf`. Fach-/Literatur-, Sprach-, Geräte-/Kopfhörer-/Stimmen- und Rechtsabnahmen bleiben offen. Keine Veröffentlichung, entfernte Migration oder Bereitstellung. P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt.
