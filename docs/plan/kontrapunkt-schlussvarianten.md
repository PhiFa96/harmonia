# P4.19 – Cantus-Schlussvarianten im Aufgabenablauf

Stand: 14.11.2026 · Branch `codex/counterpoint-cadence-context-draft` · eigenständig auf `main@ab157e8`.

Der Weiterbau bearbeitet [Stufe-5-Befund 2 der v3-Fachprüfung](../quality/fachpruefung-phase-4-v3/stufe-5.md): Cantus-Schlüsse 7→1 werden im begrenzten Kurzmodell als Variante gegenüber der dort verglichenen Fux-Konvention mit 2→1 kenntlich gemacht. **Technische P4-Vorarbeit vor der formalen Phase-4-Freigabe.** Inhalte und neue Erklärungen bleiben Entwurf, keine Veröffentlichung oder Main-Integration. P4.01 bleibt bis F14/Rechtsklärung zurückgestellt. [ADR 0082](../decisions/0082-cantus-schlussvarianten-aus-noten-erklaeren.md).

## Tatsächlicher Korpus und Anzeige

Die aktuelle Basis enthält 24 korrekte Kurzmodelle: **11** mit diatonischem Halbton aufwärts im Cantus zum Schlusston und **13** mit Ganzton abwärts. Der Rohbericht nennt zwölf Varianten. Eine eigene Zählung der Modelltexte und eine davon unabhängige `tonal`-Gegenrechnung der tatsächlich generierten Quellen bestätigen 11/13; der historische Rohbericht wird nicht nachträglich geändert.

Im Lernablauf erhalten alle neuen zweisystemigen `counterpoint-check`-Quellen denselben allgemeinen Konventionshinweis. Vor dem Prüfen werden weder die konkrete Schlussbewegung noch ein vorweggenommenes Richtig/Falsch gezeigt. Hinweise 1 und 2 sowie die Frage behalten ihren bisherigen Inhalt.

Nach der Antwort oder beim bewusst angeforderten Lösungshinweis nennt die bestehende Erklärungsfunktion die beiden letzten Cantus-Töne und unterscheidet:

| Notierte Cantus-Bewegung | Erläuterung im Kurzmodell |
|---|---|
| Diatonischer Halbton aufwärts, etwa H3→C4 / englisch B3→C4 | 7→1-Schlussvariante und Vergleich mit dem abwärts geführten Cantus der hier verglichenen Fux-Konvention |
| Ganzton abwärts, etwa D4→C4 | 2→1-Vergleich, mit den tatsächlichen Tönen des Modells |
| Andere Bewegung, etwa chromatischer Halbton, Sprung oder Liegeton | Neutrale Beschreibung ohne Zuschreibung einer der beiden Konventionen |

Die Beschreibung bezieht sich auf den Cantus im **zweiten System**, auch bei einer Stimmkreuzung oder tiefer transponiertem Cantus. Geschriebener und klingender Abstand müssen beide passen. Die letzte Bewegung allein bestimmt weder den Modus noch die Tonikafunktion oder das Bestehen der neun Regeln. Auch ein fehlerhafter Satz kann dieselbe Cantus-Bewegung besitzen; seine bisherigen Befunde bleiben erhalten.

Historische Ein-System-Dyaden erhalten keine erfundene feste Stimmidentität. `counterpoint-consonance` und `counterpoint-motion` bleiben unverändert. Alle neuen Texte sind eigene DE/en-US/en-GB-Entwürfe; Halb-/Ganztonbegriffe kommen aus dem Glossar. Notennamen verwenden die tatsächlich gewählte deutsche oder internationale Darstellung, unabhängig von der Oberflächensprache.

## Nachweise

- Vier neue Regressionen reproduzierten zunächst die fehlende Unterscheidung und den fehlenden allgemeinen Konventionshinweis.
- 21 gezielte Übungsprüfungen einschließlich `tonal`-Gegenrechnung an 1.000 generierten Quellen: beide Schlussbewegungen mit korrekten und fehlerhaften Gegenstimmen, der vollständige Korpus mit 11/13 Modellen, Transpositionen, Vorzeichen, enharmonische Gegenbeispiele, Stimmkreuzung, Altquellen und Notennamen-Einstellungen.
- Sechs neue App-Prüfungen: beide Bewegungen in DE/en-US/en-GB, keine genaue Schlussbeschreibung vor dem Prüfen und quellengerechte Erklärung auch nach einer falschen Nutzerantwort.
- Drei neue Browserabläufe: private Stufe-5-Lektion mit allgemeinem Hinweis, Wertung, tatsächlicher Cantus-Erklärung, Speichern, Reload und Wiederaufnahme; schmale Darstellung, Axe und regionale Begriffe. Keine neuen versteckten Antwort- oder Testendpunkte.
- 3.000 Partituren aus den drei Kontrapunktthemen mit denselben Seeds gegen den unveränderten Generator aus `main@ab157e8` verglichen: identische Noten, Stimmen, Transpositionen und Notation. Die neun Wertungsregeln werden nicht verändert.

Konkrete lokale Gesamtergebnisse, endgültiger Commit und alle fünf Pflichtjobs stehen im eigenen Entwurfs-PR. Die Browser-Fixture wartet auf die sichtbare Einführung; keine Zeitgrenze oder Produktfreigabe wurde gelockert.

## Versionen und offene Abnahmen

Katalog/Fähigkeitsplan bleiben 31, Vorschau-Engine 2. Es gibt keine neue Aufgabenquelle, musikalische Änderung, gespeicherte Klassifikation oder neue Antwort-/Speicher-/Sync-Struktur. Die Ergänzung ist aus dem jeweiligen unveränderten Score berechnete Darstellung und Erklärung. Bestehende private Durchgänge behalten ihre Wertung und Quellenidentität; Codebindungen und private Prüfmappen müssen nach Integration neu erzeugt werden.

Die bisher dokumentierten Fachprüfungen vom 31.10. und 05.11.2026 bleiben Vorarbeiten. Die neue Formulierung stützt sich auf den vorhandenen v3-Hinweis, nicht auf eine neu behauptete Fux-/Jeppesen-Primärlektüre. Unabhängige Fach-/Quellen-/Sprachprüfung sowie reale Geräte-/Audio-/Screenreaderabnahme bleiben offen. Kein Fall wird aus grünen Tests fachlich oder rechtlich freigegeben.

Offene Entwurfs-PRs #151/#156/#157/#158/#159/#160 sind nicht enthalten; insbesondere sind Schul-/Tutor-/Importbindungs-/Zertifikats-/Chorzeit-Nacharbeiten getrennt zu integrieren. Keine Veröffentlichung, produktive Migration, Fernsynchronisierung oder Main-Integration. Öffentlich bleiben null Lektionen; P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt.
