# ADR 0060 – Chor-Wiederholungen mit anderen Zieltönen

Datum: 26.10.2026. Status: technischer und musikalischer Entwurf; unabhängige Fach-/Sprach-/Geräteabnahmen offen.

## Anlass

Die Nacharbeitsliste für P4.11 nennt Wiederholungen, die nur das Tempo ändern. Zudem sind die beiden ursprünglichen Alt-Stimmen in C-Dur identisch. Eine neue Aufgabe soll für jede gewählte Stimme tatsächlich andere Zieltöne verlangen und auf dem Server aus derselben Quelle rekonstruierbar sein.

## Entscheidung

- `CHOIR_PART` erhält ein optionales `fifths: -2 | 0 | 2`. Die zwei eigenen C-Dur-Miniaturen werden gemeinsam in allen vier Stimmen um eine große Sekunde abwärts nach B-Dur (international Bb), unverändert in C-Dur oder eine große Sekunde aufwärts nach D-Dur übertragen. Rhythmus, Intervalle zwischen den Stimmen und Verteilung bleiben erhalten. Die begrenzten Transpositionen passen in die bisher getesteten technischen SATB-Umfänge; das ist keine fachliche oder individuelle Stimmumfangsfreigabe.
- Alle vier aktuellen Chorlektionen beginnen unabhängig vom Seed mit „Heimweg“ in C-Dur und „Kleiner Bogen“ in D-Dur. Damit unterscheiden sich auch beide Alt-Aufgaben. Die Fehlerwiederholung wählt kanonisch eine der zwei anderen Tonarten und behält Stimme/Stück bei. Ihre Variantenkennung verwendet die tatsächlichen Zielhöhen; ein Tempowechsel genügt nicht.
- Spezifikationen ohne `fifths` behalten den ursprünglichen C-Dur-Pfad einschließlich Tempo-Zufallsverbrauch und historischer Variantenkennung. Die Erweiterung des Wiederholungsgenerators verändert keine anderen Aufgabentypen. Die neuen expliziten Tonarten erhalten getrennte Ratingprofile, alte Profile bleiben unverändert.
- Partitur, Einzelstimme, drei Begleitstimmen, Vorhören und Bewertung verwenden dieselben transponierten Tonhöhen. Die aktuelle Tonart steht in Frage und Traineranzeige in DE/en-US/en-GB. Die App erhält den lokalisierten Tonartnamen über das Übungspaket gemäß bestehendem Paketgraph.
- Übungssätze und Chorlektionen sowie Katalog/Fähigkeitsplan wechseln auf Version 25. Quellen 20 und 24 werden abgewiesen. Die Einführungskarten behalten Version 24 und die C-Dur-Ausgangsbeispiele. Alte laufende Chor-Entwürfe benötigen einen neuen Start; die globale Katalogbindung verlangt dies auch für lokale Stufe-5-Vorschauen mit Version 24. Deren Aufgabensätze werden nicht geändert.
- Gesangsprofil, Oktavkorrektur, Hilfe-/Skip-Regeln, Mikrofon-Lebenszyklus und PCM-Abdeckung bleiben unverändert. Keine neue Speicherung, Datenbankmigration oder Audioübertragung. Tutor-Prompt/-Toolversionen bleiben 5/3; der Tutor rekonstruiert die neue Aufgabenquelle vor der Wertung.

## Quellen und Prüfmittel

Die Intervalltabelle in Open Music Theory [Intervals](https://github.com/openmusictheory/openmusictheory.github.io/blob/a907aa015f7ec54b925ddb070d2d36aecd0dc705/intervals.md) wurde im Autorendurchgang erneut gelesen: eine große Sekunde verbindet benachbarte Stammtöne bei zwei Halbtönen Abstand. Die vorhandene Transpositionsfunktion setzt das um. Für alle 24 Kombinationen aus vier Stimmen, zwei Stücken und drei Tonarten werden geschriebene Töne zusätzlich gegen `tonal` und MIDI-Abstände gegen feste ±2/0-Halbtonerwartungen geprüft. Die früheren Befunde zur C-Dur-Ausgangsfassung sind keine unabhängige Freigabe dieser neuen Fassungen.

96 gezielte Übungs-/Rating-/Wiederholungstests, 140 Inhaltsprüfungen, 20 App-Tests und 61 Inhaltswerkzeugtests sind erfolgreich. Die Tests prüfen beide Erstaufgaben je Stimme, vollständige Fehlerwiederholungen, Seed-Replay, Ablehnung alter Quellen, gleichbleibende Erstversuchsquote und korrekte Rekonstruktion. Die perfekte Antwort des Erstversuchs besteht die transponierte Wiederholung nicht. Alle sechs Fassungen bleiben ohne Befund im bisherigen technischen und strengeren SATB-Testprofil, innerhalb derselben technischen Umfänge.

1.122 Tutor-/SDK-/Engine-Prüfungen unter Deno sind erfolgreich, ausschließlich mit simuliertem Anbieter/Testtarif. Darin werden alle 16 Chor-Erst-/Wiederholungsquellen in DE/en-US/en-GB korrekt bewertet und die alten Quellen abgewiesen. Die Browserprobe umfasst zehn Vorschauabläufe, darunter echte Browser-Audioverarbeitung mit synthetischem Gesang in C- und D-Dur und jeweils acht getroffenen Noten, sowie drei erfolgreiche Produktionsproben ohne Chorentwürfe. Der tatsächliche öffentliche Export hat fünf JavaScript-Dateien ohne unveröffentlichte Katalogdaten/-texte. Keine reale Stimme oder echtes Mikrofon wurde damit abgenommen.

Ein älterer Kadenz-Wiederholungstest überschritt unter paralleler Last sein Fünfsekundenlimit; die betroffene Datei bestand anschließend isoliert vollständig, ohne Logik- oder Timeoutänderung. Die genannten Nachweise bleiben technische Autorentests und ersetzen keine unabhängige Fach-, Sprach-, didaktische oder reale Geräteabnahme.

Typecheck, abschließender Lint/Paketgraph, Formatierung, Sprach-/Inhalts-/Fähigkeitsplanprüfung und beide Tutor-Testkataloge sind erfolgreich. KI-/Zertifikatsvorbereitung bleibt technisch gültig mit zehn ungeprüften Funktionsbereichen, 244 gebundenen Dateien, 20 offenen allgemeinen KI-Nachweisen und 25 offenen Zertifikatsanforderungen. Der öffentliche Katalog enthält weiterhin null Lektionen.

Dies ist ausdrücklich **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe** auf Nutzerauftrag. Alle neuen Fassungen und Texte bleiben Entwurf. Keine Veröffentlichung oder Bereitstellung. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.
