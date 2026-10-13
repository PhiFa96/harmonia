# Rhythmus und Takt – vierter Teil von P2.06

Stand: 08.10.2026. `RHYTHM_TAP` und `METER_IDENTIFY` sind technisch umgesetzt. Damit sind elf der 14 zusätzlich geplanten P2.06-Typen vorhanden; zusammen mit den drei bisherigen Typen gibt es 14 Aufgabentypen. Die Umsetzung verwendet das bestehende Bruch-, Notations- und Audio-Modell. Fachliche Abnahme, tatsächliche Geräteproben und die drei Wissens-/Zuordnungstypen bleiben offen. P2.06 ist noch nicht abgeschlossen.

## Bedienbarer Stand

Im Tab „Üben“ startet „Rhythmus und Taktgliederung üben“ sechs Aufgaben: drei Paare aus Mittippen und Taktgliederung. Dieser fünfte freie Satz verwendet 2/4, 3/4, 4/4 und 6/8, Tempi 72 und 96, punktierte Muster und Pausen. Die übrigen vier Übungssätze bleiben erreichbar. Neustart erzeugt einen neuen Satz.

| Aufgabe | Vorgabe und Eingabe | Bewertung |
| --- | --- | --- |
| `RHYTHM_TAP` | Ein vollständig notierter Takt, Tempo und Grundschlag. Nach einem Einzähltakt jeden Notenanfang tippen; bei Pausen nicht tippen. | Alle Notenanfänge innerhalb des angezeigten Toleranzfensters treffen. Fehlende oder zusätzliche Anschläge sind falsch. |
| `METER_IDENTIFY` | Sichtbare Taktangabe im Notenbild. Zahl und Notenwert der Grundschläge als gemeinsam formulierte Antwort auswählen. | Tatsächliche Taktangabe und ihre klassische Gliederung aus dem Notenbild bestimmen. |

Die Taktaufgabe fragt die Bedeutung der gedruckten Taktangabe ab: 3/4 hat drei Viertelschläge, 6/8 zwei punktierte Viertelschläge. Antworttexte nennen Zahl und Wert der Grundschläge; die Rückmeldung erläutert zusätzlich Unterteilung und Gruppierung in Nenner-Einheiten. Die zugrunde liegenden Antwort-IDs bleiben sprachneutral. Das Notenbild beschreibt für Screenreader Taktangabe, Noten-/Pausenfolge und Werte. Diese visuelle Interpretationsaufgabe versucht keine eindeutige Takterkennung allein aus Klang oder Gesamtdauer: dieselbe Dauer beziehungsweise Ereignisfolge kann unterschiedlich gegliedert sein.

## Aufnahme und Rückmeldung

„Einzählen und aufnehmen“ startet ausdrücklich die Audio-Freigabe und plant einen Einzähltakt sowie einen Aufnahmetakt mit gleichbleibendem Puls. Der erste Grundschlag ist betont. Während der Aufnahme klingt ausschließlich das Metronom; das Lösungsmuster wird erst mit Hinweis 3 oder nach der Wertung als Beispiel angeboten. Das Notenbild bleibt beim Mittippen sichtbar.

Die Eingabe verwendet Anschlagbeginn: Pointer-Down im Web, Press-In auf nativen Plattformen sowie Leertaste oder Enter. Das Halten einer Taste zählt einmal; automatisch wiederholte Keydown-Ereignisse werden verworfen. Assistive Klicks ohne Pointer und die native Screenreader-Aktion „activate“ sind angeschlossen. Anschläge vor dem zulässigen Aufnahmefenster oder nach Ende des Takts zählen nicht. Es werden ausschließlich Notenanfänge bewertet; wie lange eine Taste gehalten wird, ist kein Prüfkriterium.

„Prüfen“ wird erst nach einem vollständig durchlaufenen Aufnahmetakt freigegeben. Bis dahin sind Einzählen, Aufnahmephase und Anzahl der Anschläge sichtbar. Ein vollständig aufgenommener leerer Take kann geprüft werden und ist falsch. „Neu aufnehmen“ verwirft den ungewerteten Take. Abbruch, Tabwechsel, Hintergrund, Audio-Unterbrechung oder Verlassen der Aufgabe verwerfen laufende Aufnahmen ohne Antwortdatensatz. Ein bereits vollständig aufgenommener Take bleibt beim Tabwechsel erhalten. Die erste Bewertung sperrt weitere Eingaben und erneute Aufnahmen.

Die Rückmeldung zeigt pro erwartetem Notenanfang Sollzeit, Treffer beziehungsweise fehlenden Einsatz und bei Treffern die rohe Abweichung in Millisekunden. Zusätzliche Anschläge werden separat benannt. Die Auswertung ordnet Einsätze in Reihenfolge zu, maximiert zunächst die Zahl gültiger Treffer und minimiert danach die gesamte absolute Abweichung. Ein zusätzlicher früher Anschlag verschiebt dadurch nicht alle späteren Zuordnungen. Toleranzgrenzen sind einschließlich ihrer Randwerte gültig. Richtig ist eine Antwort nur, wenn alle Soll-Einsätze getroffen sind und kein Anschlag übrig bleibt.

Hinweis 1 erläutert den Grundschlag, Hinweis 2 das Zählen von Noten und Pausen. Erst Hinweis 3 erklärt die Sollzeiten und erlaubt das hörbare Beispiel. Unterstützte Wertungen bleiben in der Statistik getrennt. „Gerade nicht hören“ überspringt die noch unbeantworteten Rhythmusaufgaben und behält die visuellen Taktaufgaben; übersprungene Aufgaben zählen separat.

## Schnittstelle und Generatorgrenzen

`@harmonia/exercises` exportiert `rhythmTapExercise` und `meterIdentifyExercise` mit `generate`, `evaluate`, `feedback` und `hints`. `generateRhythm(params, rng, type)` ist der gemeinsame Generator. Beide Typen sind in `generateExercise`, Antwortauswertung, Lektionsablauf und strengem Inhaltsschema enthalten.

| Parameter | Erlaubter Bereich und Standard |
| --- | --- |
| `meters` | Nicht leere Liste aus `2/2`, `2/4`, `3/4`, `4/4`, `3/8`, `6/8`, `9/8`, `12/8` |
| `clefs` | Optional Violin- und/oder Bassschlüssel; Standard Violinschlüssel |
| `tempos` | Für Mittippen: nicht leere Liste ganzer Werte von 60 bis 120; Standard 72 und 96 |
| `level` | Für Mittippen: `basic` oder `dotted`; Standard `basic` |
| `rests` | Für Mittippen: boolesch; Standard `true` |
| `toleranceMs` | Für Mittippen: ganze Zahl von 40 bis 180; Standard 120 |

`MeterParams` enthält ausschließlich Taktarten und Schlüssel; das Inhaltsschema weist Rhythmusparameter an Taktaufgaben zurück. `RhythmParams` ergänzt die vier Timing-/Musterparameter. Tempo bezieht sich immer auf den tatsächlichen Grundschlag: in 2/2 auf die Halbe, in 3/8 auf die Achtel und in 6/8, 9/8 und 12/8 auf die punktierte Viertel.

Der Generator füllt jeden Grundschlag mit einer exakt passenden Zelle. Einfache Takte verwenden ganze und halbierte Grundschläge; `dotted` ergänzt das Verhältnis 3:1, soweit die Notenwerte unterstützt sind. Zusammengesetzte Takte enthalten punktierte Viertel, drei Achtel sowie Viertel–Achtel und Achtel–Viertel. Pausen können einen ganzen Grundschlag oder Teile einer Zelle belegen. Ununterbrochene Pausentakte werden vermieden. Kleinster Notenwert ist die Sechzehntel. Haltebögen, Synkopen über Zellgrenzen, Tuplets, asymmetrische Takte und mehrtaktige Rhythmen sind noch nicht enthalten. Die drei Achtel in 6/8 sind normale Unterteilungen eines zusammengesetzten Grundschlags, keine Triole.

Notenanfänge und Gesamtdauer werden mit exakten Brüchen aus dem tatsächlichen `Score` berechnet und erst zuletzt in Millisekunden umgerechnet. Die zusätzliche `item.meter`-Metainformation bestimmt keine Lösung. Das effektive Toleranzfenster ist das kleinere aus `toleranceMs` und 40 % des kleinsten Abstands aufeinanderfolgender Notenanfänge; damit überschneiden sich benachbarte Trefferfenster nicht. Bei nur einem Notenanfang begrenzt die Taktdauer diesen Wert.

Sprachneutrale Antworten:

| Antwort | Bedeutung |
| --- | --- |
| `taps:0,625,1250` | Rohe Anschlagzeiten relativ zum Beginn des Aufnahmetakts |
| `taps:-25,633` | Ein leicht früher erster Anschlag bleibt als negativer Wert erhalten |
| `taps:` | Vollständig abgeschlossene Aufnahme ohne Anschläge |
| `meter:6/8` | Ausgewählte Gliederung eines 6/8-Takts |

Timing-IDs enthalten ausschließlich kanonische ganze Millisekunden in aufsteigender Reihenfolge, maximal 128 Anschläge und maximal 1.000 Zeichen. Doppelte Zeiten sind auswertbare zusätzliche Anschläge. Grenzen reichen von `-toleranceMs` bis zur aufgerundeten Taktdauer plus `toleranceMs`. Ungültige Zahlen, Umstellungen, Leerzeichen, Dezimalwerte, fremde Präfixe und nachgestellte Zeichen erzeugen keine Antwort. Das ID-Format selbst bestätigt keine Aufnahmezeit; die App gibt eine Antwort erst nach dem vollständigen Aufnahmeablauf frei.

## Audio-Uhr, Latenz und Speicherung

`playRhythm` plant alle Metronomstimmen mit absoluten Zeiten auf `AudioContext.currentTime`. Der Einzähltakt beginnt 0,35 Sekunden nach der Planung; nach genau einem Takt beginnt die Aufnahme. Das Beispiel ergänzt die notierten Einsätze als eigenen Klang. Jeder Ablauf besitzt ausschließlich seine eigenen Stimmen. Abbruch, Teilfehler bei der Planung und Aufgabenwechsel stoppen diese Stimmen, ohne andere Klänge global zu stoppen. Die vorhandene `AudioEngine.playSequence` wird dafür nicht verwendet, weil ihr Stoppen globale Stimmen betrifft.

`useRhythmRecording` verwendet dieselbe Audio-Uhr für Anschläge und Aufnahmeende. Der 25-ms-Timer aktualisiert Phase und Zählanzeige; er misst keine Anschlagzeiten. Ein Anforderungstoken verhindert, dass eine spät abgeschlossene Audio-Freigabe nach Abbruch oder Verlassen wieder Klang startet.

Gemeldete `baseLatency` und `outputLatency` werden addiert und bei plausiblen Werten von 0 bis 250 ms von der Eingabezeit abgezogen. Der berücksichtigte Wert wird nach Aufnahme angezeigt. Das ist keine gemessene Geräte-Kalibrierung: ungemeldete Lautsprecher-/Bluetooth-Verzögerung, Eingabelatenz und tatsächlicher Klangbeginn müssen auf realen Geräten geprüft werden. Messanleitung: [Audio-Latenz messen](audio-latenz-messen.md). Das Toleranzfenster wird deshalb nicht automatisch als Nachweis einer bestimmten Gerätegenauigkeit dargestellt.

Fehlerwiederholungen verändern Noten-/Pausenfolge, Werte oder Taktgliederung. Bloßer Schlüssel-, Tonhöhen- oder Tempowechsel zählt nicht als neue Rhythmusvariante. Rohe Antwortzeiten, Aufgabe, Hilfen, Erstwertung und Wiederholungen werden im bestehenden SQLite-JSON-Payload verlustfrei gespeichert; Datenbankversion bleibt 1. Abgebrochene Aufnahmen werden nicht gespeichert. Die erste interne Lektion und ihre Inhaltsversion bleiben unverändert. Es werden keine Kursinhalte freigegeben.

## Gestaltung und Prüfstand

Die Oberfläche verwendet die bestehende Notendarstellung, Buttons, Karten, Feedbackbausteine und Design-Tokens. Der Rhythmustakt passt seine Notengröße an die verfügbare Kartenbreite an; dadurch ist er auf dem Telefon beim Mittippen vollständig ohne seitliches Scrollen sichtbar. Die große Tippfläche besitzt Status, Tastatur-/Screenreader-Beschriftung und einen klaren aktiven beziehungsweise gesperrten Zustand. Trefferrückmeldung verwendet Text und Symbol zusätzlich zur Farbe. Deutsch sowie US-/UK-Englisch sind vollständig vorhanden, einschließlich „meter/metre“, „measure/bar“ und der jeweiligen Notenwertnamen. Neue Abhängigkeiten oder native Projektdateien sind nicht nötig.

- 50 zusätzliche Tests: 22 im Übungskern, 16 Schemafälle, elf App-Ablauftests und ein SQLite-Test. Vier Parametersätze durchlaufen je 150 Seeds; alle acht Taktarten werden geprüft. Eine unabhängige exhaustive Zuordnung prüft 150 Timing-Beispiele gegen die Auswertung. Fest ausgeschriebene Beispiele prüfen Einsatzzeiten, Grundschlag, Pausen und inklusive Toleranzgrenzen.
- Gesamtprüfung: **1.581 Tests bestanden**; Lint, Typen, Formatierung, Übersetzungen, Inhaltskatalog, Fähigkeitsplan und Installation mit unverändertem Lockfile bestanden.
- Deno: Typprüfung und **39 Laufzeitprüfungen**, einschließlich Rhythmus-Mittippen und Taktgliederung.
- Interner und öffentlicher Web-Export bestanden; der tatsächliche öffentliche Export enthält keine Entwurfs-Katalogdaten oder Inhaltstexte.
- Chromium-Bedienprüfung: Desktop-Tastatur, Telefon-Touch und Maus im öffentlichen US-Export; echte Audio-Uhr, sechs Aufgaben je Satz, Hell/Dunkel, 390 × 844 und 1280 × 1000 sowie reduzierte Bewegung. Zusätzlich Abbruch, assistiver Klick, zusätzlicher Anschlag, gesperrte Erstwertung und öffentliche UK-Terminologie.

Claudes getrennte fachliche Abnahme nach [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md), GitHub-CI vor dem Merge, VoiceOver/TalkBack und echte iOS-/Android-Geräteproben bleiben offen. Browser-Automation und gemeldete Latenz ersetzen keine körperliche Bedien- und Hörprobe durch Testpersonen.

Als Nächstes folgen `KNOWLEDGE_MC`, `MATCH` und `ORDER`. Vollständige Stufen-1–2-Lektionen, Bestehens- und Freischaltlogik bleiben die anschließenden geplanten Schritte.
