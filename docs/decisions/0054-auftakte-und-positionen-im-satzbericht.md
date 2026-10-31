# ADR 0054 – Auftakte und Positionen im Satzbericht

Datum: 26.10.2026. Status: technische Entwurfsentscheidung; Fach-/Produktfreigabe offen.

## Anlass

Die P4.09-Nacharbeitsliste nennt den Auftakt als „Takt 1 · Position 0“. Berichtüberschrift, Belegtabellen und zugängliche Notenbeschreibungen addierten unabhängig voneinander eins zum internen Taktindex. Ein unvollständiger erster Takt wurde dadurch wie ein voller Takt gezählt. Die Bezeichnung „Position“ erklärte die Brüche nicht unmittelbar.

## Entscheidung

- Der private Bericht verwendet eine gemeinsame Darstellung der Taktangaben. Ein unvollständiger erster notierter Takt erhält die Nummer 0 mit Auftaktkennzeichnung; der folgende vollständige Takt die Nummer 1. Ohne Auftakt beginnt die Nummerierung bei 1. Dies setzt die bestehende Nacharbeitsanforderung um und erteilt keine neue Fachfreigabe.
- Die Erkennung verwendet die vorhandene exakte Taktprüfung einschließlich Pausen, Punktierungen und N-tolen sowie der am ersten Takt wirksamen Taktart. Die Befundposition folgt der ausdrücklich zugeordneten Bassstimme. Belegtabellen und Notenbeschreibungen zeigen die Nummer der jeweiligen notierten Stimme; zusätzliche, nicht zugeordnete Stimmen werden nicht umnummeriert, nur weil die SATB-Stimmen einen Auftakt haben. Beginnt eine zusätzliche Stimme erst in einem späteren Takt, übernimmt sie die Zählung der ersten Stimme ihres Notensystems.
- Am Anfang steht „Notierter Taktbeginn“ beziehungsweise „Written measure start“/„Written bar start“. Spätere Positionen zeigen ausdrücklich den Abstand als Bruch einer ganzen Note beziehungsweise whole note/semibreve. Diese Abstände beginnen bei der ersten notierten Note oder Pause des Takts, auch im Auftakt. Sie sind keine metrischen Zählzeiten.
- Dieselbe Darstellung gilt für Befundüberschriften, Ausgangs-/Zielbelege und die zugängliche Notenliste. Die lokale Satzwerkstatt und heruntergeladene skriptfreie HTML-Berichte verwenden denselben Renderer.
- Engine-Zeitpunkte, Taktindizes, Notenreferenzen, Notenmarkierungen und musikalische Regeln bleiben unverändert. Der Katalog/Fähigkeitsplan bleibt Version 24. Es entstehen keine neuen Lerntexte, Aufgabenquellen, gespeicherten Antworten oder Wiederaufnahmegrenzen.

## Nachweise und Grenzen

Werkzeugtests prüfen Auftakt und vollen Beginn in allen drei Sprachen, Nummerierung über die Taktgrenze, Bruchabstände, Belegzeilen, Notenbeschreibungen, abweichende SATB-Zuordnung, Pausen, Punktierungen, N-tolen und anfängliche Taktartänderung. Die vollständige Analyse wird zusätzlich direkt mit der unveränderten Engine-Ausgabe verglichen. Vorhandene Prüfungen für Eingabevalidierung, HTML-Maskierung, private Ausgabepfade, Schrift/CSP und Wiedergabe bleiben erfolgreich.

Zwölf Chromium-Abläufe prüfen DE/en-US/en-GB einschließlich Auftaktbearbeitung, zugänglicher Belegtabellen, Berichtdownload ohne Skript, Tastatur, Axe, schmaler Darstellung und vorhandener lokaler Audiowiedergabe. Diese synthetischen Prüfungen ersetzen keine echte Screenreader-/Geräteabnahme.

Dies ist ausdrücklich **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe** auf Nutzerauftrag. Die Satzregeln, F03/F05, unabhängige Primärliteratur-/Fachprüfung und Produktfreigabe bleiben offen. Keine Veröffentlichung oder Bereitstellung. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.
