# P3.17 – Prüfungsmodus als interne Übungssimulation

Stand 19.10.2026 auf `codex/p3-17-exam-mode`, aufbauend auf P3.16. Zwei eigenständige Vorlagen kombinieren vorhandene, versionierte Harmonia-Aufgabentypen. Sie übernehmen keine fremden Prüfungsfragen und bilden keine konkrete Hochschulprüfung oder Bestehensgrenze nach.

## Öffentliche Formatquellen

- Die [mdw, Prüfungsteil Musiktheorie und Hörfähigkeit](https://www.mdw.ac.at/abi/zulassungspruefungen/pruefungsteil-allgemeinemusiklehre-und-hoeren/) beschreibt schriftliche Teile mit Theorie sowie Hörfragen zu Intervallen, Akkorden, Melodie- und Rhythmusdiktat. Die Anforderungen unterscheiden sich bereits zwischen den dort genannten Studiengängen.
- Die [HMTM, Komposition für Film und Medien](https://hmtm.de/studiengaenge/komposition-fuer-film-und-medien-bm-ks/) veröffentlicht getrennte Musterklausuren für Gehörbildung und Musiktheorie. Wir verwenden nur diese grobe Fachtrennung, keine Klausuraufgaben.

Diese Quellen wurden am 19.10.2026 abgerufen. **Inferenz für das Produkt:** Zwei getrennt ausgewertete Bereiche sind ein sinnvoller gemeinsamer Nenner. Zeitgrenzen und fünf Punkte pro Aufgabe sind Harmonia-Entscheidungen, keine Aussage über die genannten Hochschulen.

## Vorlagen und Ablauf

| Vorlage | Theorie | Gehörbildung | Zeit | Maximum |
|---|---:|---:|---:|---:|
| Grundlagen und Gehör | 6 | 6 | 20 Minuten | 60 Punkte |
| Vertiefte Studienvorbereitung | 8 | 8 | 30 Minuten | 80 Punkte |

Die Vorlagen referenzieren exakt die Aufgabenquellen der internen Lektionen; die Engine erzeugt aus einem Seed neue, eigene Varianten. Während des Laufs sind Hinweise und Sofortfeedback ausgeschaltet. Jede richtige Antwort gibt fünf Punkte, falsche, übersprungene und nach Frist unbeantwortete Aufgaben null Punkte. Die Frist wird bei jedem Antwortversuch geprüft. Bei fehlender Hörmöglichkeit können die offenen Hörfragen ohne Punkte übersprungen werden. Es gibt keine XP, Belohnung oder Aussage „bestanden“.

Die Auswertung zeigt Theorie und Gehörbildung getrennt. Aus Fehlern und Auslassungen werden bis zu drei passende Quelllektionen empfohlen. Erreichte Lektionen lassen sich direkt öffnen; gesperrte erscheinen entsprechend markiert. Ein neuer Durchgang erhält einen neuen Seed.

## Freigabe und Grenzen

Die Vorlagenreferenzen werden nur über den internen Autoreneinstieg importiert. Der öffentliche Katalog liefert derzeit eine leere Vorlagenliste; damit zeigt die Produktions-App keinen Prüfungszugang und enthält keine unveröffentlichten Lektions-IDs. Erst nach der Inhaltsfreigabe können freigegebene Vorlagen in die öffentliche Projektion aufgenommen werden.

Das Geschäftsmodell ordnet den Prüfungsmodus Premium zu. Vor der ersten öffentlichen Vorlage muss deshalb auch die Zugangsentscheidung in den bestehenden Access-Dienst eingebunden werden; die interne Vorschau ist noch kein bezahltes Angebot.

**P3.17 ist fachlich nicht abgeschlossen.** Die unabhängige Prüfung beider Vorlagen und ihrer erzeugten Aufgaben nach [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md), der Literaturabgleich und echte Web-/iOS-/Android-Audioabnahme stehen aus. Dies ist ein kurzer automatisierter Theorie-/Gehörtest. Künstlerische Hauptfachteile, freie Tonsatzarbeiten, die genaue Dramaturgie einer Präsenzprüfung und offizielle Zulassungsbedingungen werden nicht simuliert. Lauf und Ergebnis werden noch nicht über einen App-Neustart gespeichert; das ist vor einem öffentlichen Release zu entscheiden.

## Technische Prüfung

Die Domänentests prüfen beide Vorlagen, deterministische Generierung, korrekte Vollpunktwertung, Fristgrenze, Auslassungen, Empfehlungen und die leere öffentliche Projektion. Die vollständige Inhaltssuite bestand mit 1.156 Tests; der bisherige 30-Sekunden-Sammeltest für Inhaltsmeldungen wurde bei inzwischen 160 Lektionen in einzelne Lektionsfälle aufgeteilt. Zwei gezielte App-Suiten bestanden mit 24 Tests. TypeScript, Übersetzungen, Format, Lint mit 4-GB-Node-Heap, Inhalts-/Curriculum-Checks und der Produktions-Webexport bestanden lokal. Das neue Produktions-Bundle enthält in fünf JavaScript-Dateien keine unveröffentlichten Katalog-IDs oder Inhaltstexte. GitHub-CI und Geräteabnahme bleiben für Claudes Integrationsablauf offen.
