# ADR 0010 – Einstufung mit getrennter Evidenz je Bereich

**Status:** angenommen für die technische MVP-Umsetzung; Inhaltsfreigabe nach ADR 0005 bleibt erforderlich.
**Datum:** 13.10.2026

## Anlass

P2.10 verlangt 15–25 adaptive Aufgaben, einen Startpunkt, getrennte Bereichsniveaus und jederzeitige Wiederholung. Selbsteinschätzung, Hilfen und ausgelassene Hörfragen dürfen keine bestandenen Lektionen erzeugen. Ein Gesamtmittelwert würde Lücken in Voraussetzungen verdecken.

## Entscheidung

Die portable Steuerung liegt in `packages/exercises/src/placement.ts`. `packages/content/src/placement.ts` leitet vier geordnete Stichproben je Fachbereich aus dem injizierten, tatsächlich ausgelieferten Stufe-1/2-Katalog ab. Die vorhandenen Generatoren und Engine-Bewertungen erzeugen Aufgaben und bewerten Antworten. Es kommen keine neuen fachlichen Inhalte hinzu. Die vorhandene Katalogreihenfolge bestimmt die Reihenfolge innerhalb einer Stufe. Bereiche mit weniger als vier verfügbaren Lektionen werden nicht eingeschätzt; die Prototyp-Einführung bleibt damit außerhalb der sieben Fachbereiche. Produktionscode lädt keinen Authoring-Katalog oder internen Planungsindex.

Je Bereich beginnt der Test bei Stichprobe 1 von 0–3, im mittleren Bereich des verfügbaren Stufe-1/2-Stoffs. Selbstständig richtig verschiebt die nächste Frage eine Stichprobe aufwärts, falsch oder mit Hilfe eine abwärts. Grenzen bleiben 0 und 3. Drei Aufgaben je Bereich ergeben im vollständigen MVP 21 Aufgaben. Unklare Bereiche erhalten zusätzliche Kontrollfragen, maximal 25 Aufgaben insgesamt. Ein kleinerer ausgelieferter Katalog behält die Untergrenze 15. Hör-Pause lässt künftige Hörfragen ohne Schwierigkeitsabzug aus; beantwortete Aufgaben werden gesondert gezählt.

Eine Stichprobe ist gestützt, wenn mindestens zwei unterschiedliche Quellen auf oder oberhalb ihrer Schwierigkeit selbstständig richtig beantwortet wurden und kein unabhängiger Fehler auf oder unterhalb dieser Schwierigkeit vorliegt. Identische Quellen erhöhen die Evidenz nicht. Zwei unabhängige Fehler an Stichprobe 0 führen zur Grundlagenempfehlung; sonst bleibt fehlende Evidenz ausdrücklich unbekannt. Hinweise erzeugen weder Richtig-Evidenz noch unabhängige Fehler. Ein Fehler unterhalb eines richtigen schwierigeren Beispiels gilt als uneinheitlich. Die obere Schätzung bleibt Stufe 2.

Empfohlen wird die erste Lektion der nächsten passenden Einheit. Geschätzt übersprungene Einheiten heißen „getestet“, bleiben freiwillig erreichbar und müssen eine geschlossene Voraussetzungskette haben. Fehlende Voraussetzungen aus anderen Bereichen erhalten Links und beeinflussen den empfohlenen ersten Schritt. Die Schätzung weist weder alle Skills nach noch schließt sie Lektionen ab. Ein vorzeitig beendeter Test zeigt vorläufige Ergebnisse, setzt keine getesteten Einheiten und empfiehlt Grundlagen.

Die separate Singleton-Tabelle `placement_state` liegt in `harmonia-device.db`. Datenbankversion 2 migriert Version 1 additiv; Onboarding-Payloadschema 1 und die Lektionsdatenbank bleiben erhalten. Einstufungs-Payloadschema 1 speichert Seed, Bankkennung, Zeitpunkte, Eingabe und Aktionen. Wiederaufnahme reproduziert Aufgaben und Bewertungen; gespeicherte Richtig-/Rating-Flags sind kein Orakel. Katalog-/Parameteränderungen invalidieren das Replay ausdrücklich. Defekte oder unbekannte Daten werden beim Laden nicht überschrieben. Temporärer Betrieb schreibt keine Tests auf das Gerät.

Ein neuer Test hält das letzte Ergebnis bis zum eigenen Abschluss. Zurückgehen pausiert; „Test jetzt beenden“ erzeugt ein vorläufiges Ergebnis. Geprüfte Antworten bleiben gesperrt. Writes laufen geordnet mit sichtbarer Wiederholmöglichkeit. Gast und E-Mail-Konto verwenden denselben lokalen Ablauf; Sync bleibt P2.03.

## Folgen und Grenzen

- Nachvollziehbare Stichprobenheuristik im MVP; empirische Kalibrierung und Glicko-2 folgen später.
- Keine Zeitgrenze, XP, Lektionsversuche oder Skill-Mastery-Gutschriften aus dem Test.
- P2.11 übernimmt Empfehlungen in den vollständigen Pfad; Bestehensregeln bleiben P2.12.
- Fachliche Inhaltsfreigabe, echte Geräte und reale Lernende werden gesondert abgenommen.
