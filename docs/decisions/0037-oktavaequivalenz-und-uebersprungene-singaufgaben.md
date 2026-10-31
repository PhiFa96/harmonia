# ADR 0037 – Oktaväquivalenz beim Singen und übersprungene Mikrofonaufgaben

**Status:** Entscheidung am 20.10.2026 nach der fachlichen Prüfung von P3.10 (getrennter Prüfer, Bericht unter `docs/quality/fachpruefung-phase-3/`). Gerätemessungen mit echten Stimmen stehen weiterhin aus.

## Kontext

Die Mikrofonübungen (P3.10) bewerteten die Oktavlage absolut: Eine Männerstimme, die eine notierte Aufgabe eine Oktave tiefer singt, galt als falsch. Das widerspricht der üblichen Gesangspraxis, in der Stimmlagen die Oktave bestimmen. Außerdem zählten übersprungene Singaufgaben im Nenner der 80-%-Bestehensregel (F11). Wer kein Mikrofon nutzen kann, erreichte bei `aural.l1.pitch-intervals.intervals` höchstens 8/12 (67 %) und bei `aural.l2.melody.foundation` 6/8 (75 %) und konnte die Lektion nicht bestehen – im Widerspruch zur Zusage „ohne Fehlerwertung überspringen“.

## Entscheidung

1. **Oktaväquivalenz.** Eine gesungene Folge ist richtig, wenn alle Töne innerhalb der Toleranz (±50 Cent in Stufe 1, ±25 Cent in Stufen 2–3) um **dieselbe ganze Zahl von Oktaven** vom Ziel abweichen (`voiceOctaveShift` in `packages/exercises/src/voice.ts`). Einzelne Töne in verschiedenen Oktaven, falsche Tonklassen und Abweichungen jenseits der Toleranz bleiben falsch. Bei einer Verschiebung erscheint ein freundlicher Hinweis („andere Oktavlage, das zählt“).
2. **Übersprungene Mikrofonaufgaben** zählen weder als richtig noch im Nenner der Bestehensquote. `lessonProgress` meldet sie als `voiceSkipped`; `countedTotal` liefert den Nenner. Die Bestehensquote von 80 % bleibt unverändert, verlangt aber mindestens eine gezählte Aufgabe. Der Wert ist im Lernnachweis optional und wird serverseitig begrenzt (höchstens so viele wie Mikrofonaufgaben in der Lektion). Die allgemeine Hörpause für Hörfragen bleibt unverändert.
3. Der Intervallname im Aufgabentext der Singaufgabe wird lokalisiert (Engine-Name statt Kurzcode).

## Konsequenzen

- Lektionen ohne Mikrofon bleiben bestehbar; die Freischaltung wird nicht blockiert. Lernende mit Mikrofon sind unverändert.
- Bei Oktavversetzung gibt die Rückmeldung keine Fehlerbotschaft mehr. Die Erkennung selbst (P3.09) bleibt unverändert; der Detektor liefert weiterhin absolute Tonhöhen.
- Reine Gesangsaufgaben liefern damit weniger Evidenz für die Skill-Berechnung; sie fließen wie bisher über die Engine-Bewertung ein, übersprungene Aufgaben nicht.
- Alte Lernnachweise ohne `voiceSkipped` bleiben gültig (Standard 0).

## Ergänzung für Chor-Lektionen vom 28.10.2026

Auf ausdrückliche Nutzerentscheidung verlangt die neue Chor-Version zusätzlich mindestens eine anrechenbar bestandene eigene Gesangsaufgabe im Erstversuch ([ADR 0064](0064-chorabschluss-verlangt-bestandenen-gesangsversuch.md)). Das Überspringen und der Quotennenner bleiben wie hier beschrieben. Die zusätzliche Abschlussanforderung betrifft ausschließlich die neu versionierten Chor-Lektionen; andere mikrofonfreie Lernwege bleiben erhalten.
