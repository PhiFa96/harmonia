# Intervallgröße und Richtung – siebter Teil von P2.07

Stand: 12.10.2026. `intervals.l1.size` ergänzt drei interne Lektionen mit 8/10/12 Aufgaben, neun Wissenskarten, 15 Noten-/Hörbeispielen und einem neunabschnittigen Artikel in DE/US/UK. Alle neuen Datensätze bleiben `entwurf`; Claudes separate fachliche Abnahme steht aus.

## Lernfolge

| Lektion | Aufgaben | Einführung |
| --- | --- | --- |
| `intervals.l1.size.numbers` | 4 Nummernfragen zu Prime bis Quarte, 4 zu Quinte bis Oktave: 8 | Beide Endpositionen zählen, gleiche Tonhöhe, Nummern 1–8 |
| `intervals.l1.size.direction` | 4 Nummernfragen, 6 Richtungsfragen: 10 | Aufwärts, abwärts und gleiche Tonhöhe; Notenköpfe statt Halsrichtung |
| `intervals.l1.size.motion` | 4 Richtungsfragen, 8 Bewegungsfragen: 12 | Tonwiederholung, Tonschritt und Tonsprung |

Die Aufgaben verwenden ausschließlich natürliche Töne im Violinschlüssel von E4 bis F5, ohne Hilfslinien. Die erste Lektion beginnt aufwärts; die beiden folgenden mischen aufwärts und abwärts. Zwei gleiche Tonhöhen werden als Prime mit Nummer 1 beziehungsweise als gleiche Tonhöhe und Tonwiederholung bewertet. Eine Sekunde bildet einen Tonschritt, ab der Terz einen Tonsprung. E–F und F–G sind beide Schritte trotz unterschiedlicher Halbtonabstände. Dies ist eine Einteilung nach benachbarten Stammtonpositionen, keine feste Zahl von Klaviertasten.

Intervallqualität, Vorzeichen, Schreiben und reine Hörintervallerkennung werden in dieser Einheit nicht geprüft. Die Nummernantwort zeigt nur die Zahl und den allgemeinen Namen, zum Beispiel „3 · Terz“. Rückmeldung und Hinweise verlangen keine Kenntnis der Qualitätsnamen klein/groß/rein. Die Karten ordnen die spätere Qualitätsbestimmung ausdrücklich in die Folgeeinheit ein.

Jede Aufgabe zeigt zwei Halben in einem vollständigen 4/4-Takt. Deren Dauer wird nicht bewertet. Die selbst verfassten Einführungsbeispiele spielen genau den notierten Score bei Viertel = 90, auf Wunsch und ohne automatische Wiedergabe. Die drei Lektionen sind vollständig visuell bearbeitbar. Screenreader beschreiben die Positionen der Notenköpfe ohne Antwortnamen; Rückmeldungen zur Nummer und Bewegung zeigen die gezählte Stammtonfolge einschließlich der Oktavgrenze H–C beziehungsweise B–C.

## Schnittstellen und Daten

- `VisualIntervalParams.question` erlaubt `number`, `direction` und `motion` am vorhandenen `INTERVAL_IDENTIFY_VISUAL`. Es gibt weiterhin 17 Übungstypen und sechs freie Sätze. Ohne den Parameter bleiben Generierung, Qualitätsantworten und alte Seeds bestehen.
- Neue Grundlagenfragen unterstützen nur natürliche Töne und einfache Intervalle bis zur Oktave. Die Parameter müssen mindestens zwei verschiedene fachliche Antworten erlauben. Die Schreib- und Hörschemas übernehmen `question` nicht; der Generator weist es auch bei Schreibaufgaben zurück.
- `intervalReadingPitches` prüft zwei natürliche ungebundene Halben in einem vollständigen einstimmigen 4/4-Score. `intervalReadingAnswer` berechnet Nummer, Richtung oder Bewegung aus diesem sichtbaren Score. Abweichende gespeicherte `from/to`-Metadaten ändern die Antwort nicht. Richtungs- und Bewegungstexte werden nicht aus einer gespeicherten Lösung abgelesen.
- Antwort-IDs sind `interval-number:1` bis `:8`, `interval-direction:up/down/same` und `interval-motion:repeat/step/leap`. Fehlerwiederholungen ändern die fachliche Antwort; ein neuer Schlüssel, eine neue Tonlage oder anders gemischte Auswahl allein genügen nicht. Erstversuch und Wiederholung bleiben getrennt gespeichert.
- Zehn neue Glossarbegriffe ergänzen Prime bis Septime sowie Tonwiederholung, Tonschritt und Tonsprung. Die vorhandene Oktave wird wiederverwendet. US/UK verwenden die üblichen englischen Nummernnamen und den jeweiligen Halb-/Ganztonwortschatz.
- Katalog und Plan steigen auf Version 9. Neue Lektionen/Sätze, Karten und Artikel tragen Version 9; alle älteren Datensätze behalten ihre Fassungen. Intern gibt es 22 Lektionen mit 220 Aufgaben im vollständigen Erstversuch, 61 Karten einschließlich der drei Prototypkarten und sieben Artikel. Schema- und SQLite-Version bleiben 1. Öffentlich werden weiterhin null Entwurfslektionen, Karten oder Artikel ausgeliefert.

Die Artikel sind Inhaltsdatensätze für die spätere Wissensbasis; eine Leseroute und Tutorverknüpfung stehen aus. Bestehensschwelle und Freischaltung bleiben Folgearbeit in P2.11/P2.12. Es gibt keine neue Abhängigkeit, native Bibliothek oder direkte Theorie-Engine-Abhängigkeit der App.

## Prüfung und Übergabe

- **1.889 Tests bestanden:** UI 14, Theorie 717, Audio 29, i18n 290, Notation 215, Übungen 217, Inhalte 139, App 212 und Node-Werkzeuge 56. Typprüfung, Lint/Paketgraph, Formatierung, Übersetzungen, Inhalte, Fähigkeitsplan und Produktions-Bundlecheck sind grün.
- **Fachtabellen:** alle natürlichen Tonpaare aus neun Positionen E4–F5 bis zur Oktave gegen eine unabhängige Positionstabelle geprüft. 150 Generator-Seeds je Frageform erreichen alle acht Nummern beziehungsweise alle drei Richtungs-/Bewegungsantworten. 150 vollständige Fehlerdurchgänge je Lektion wechseln die fachliche Antwort und bewahren die Erstwertung. Quellnoten und Beschreibungen folgen dem Score auch bei abweichenden Metadaten; ungültige Quellen werden zurückgewiesen.
- **Regression:** 1.800 alte visuelle, auditive und Schreibgenerierungen stimmen mit dem Basiszweig überein. Alle älteren Katalog-, Plan- und Inhaltstextdatensätze sind erhalten.
- **Deno:** Typprüfung und 63 Laufzeitchecks bestanden, einschließlich neuer Lektionen, Oktavzählung und der beiden Sekundschritte E–F/F–G.
- **Web:** Vorschau und Produktion exportiert; Produktions-Bundle ohne Entwurfs-IDs oder -Texte. Vier Chromium-Durchgänge mit je 30 Aufgaben, 15 Hörbeispielen und drei gespeicherten Ergebnissen nach Neuladen: DE-Tastatur, DE-Telefon-Touch/dunkel/reduzierte Bewegung, US-Maus und UK-Telefon-Touch. Alle Aufgabenbilder passen in die Telefonbreite. Eine falsche Richtung ergab 9/10 im Erstversuch und eine andere Richtung mit 1/1 in der Wiederholung. Drei öffentliche Direktlinks blieben gesperrt. Keine JavaScript- oder React-Fehler; nur das bekannte Favicon-404 wurde genau für diese Datei ignoriert.

Für Claude Code: Nummernzählung einschließlich Prime und Oktavgrenze, die Definitionen Schritt/Sprung, den Unterschied zwischen Tonschritt und Halb-/Ganzton, Richtungsbeschreibung über Notenköpfe sowie DE/US/UK-Terminologie und Progression separat nach ADR 0005 prüfen. Die technischen Tabellen ersetzen keine Literaturprüfung. GitHub-CI, VoiceOver/TalkBack und echte iOS-/Android-Geräteproben bleiben offen.

Review-Zweig: `codex/p2-07-interval-size-direction`, gegen `codex/p2-07-simple-meter-count-in` vergleichen. `main` bleibt unverändert. Nächste Einheit: `intervals.l1.first-qualities` mit Halbtonabstand, kleinen/großen Terzen und reinen Quarten, Quinten und Oktaven. P2.07 ist weiterhin offen.

Der [Vergleich für Claude Code](https://github.com/PhiFa96/harmonia/compare/codex/p2-07-simple-meter-count-in...codex/p2-07-interval-size-direction) enthält ausschließlich diesen Ausbau.
