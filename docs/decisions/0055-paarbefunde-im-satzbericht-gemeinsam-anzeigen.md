# ADR 0055 – Paarbefunde im Satzbericht gemeinsam anzeigen

Datum: 26.10.2026. Status: technische Entwurfsentscheidung; Fach-/Produktfreigabe offen.

## Anlass

Die P4.09-Nacharbeitsliste nennt drei Paarbefunde, wenn drei Stimmen parallel in Oktaven geführt werden. Der lokale Bericht wiederholte dazu dieselbe Regelerklärung, Position und Teile der Belege in drei Blöcken. Für die Prüfung müssen alle Stimmenpaare und Einzelbefunde nachvollziehbar bleiben.

## Entscheidung

- Der private Renderer fasst Paarbefunde derselben Regel, desselben Schweregrads und desselben Schnitts mit identischen Ausgangs-/Zielpositionen in einem Anzeigeblock zusammen. Unterschiedliche Regeln, Schweregrade, Zeitpunkte oder Ausgangspositionen bleiben getrennt. Befunde zu einer einzelnen Stimme oder mehr als zwei Stimmen werden nicht zusammengefasst.
- Die Gruppe nennt jedes enthaltene Stimmenpaar und dessen ursprüngliche Befundnummer. Jeder Einzelbefund behält seinen HTML-Verweis `finding-N`; gemeinsame Blöcke erhalten eigene `group-N`-Kennungen. Bestehende einzelne Blöcke behalten ihre bisherigen Kennungen.
- Notenmarkierung und Ausgangs-/Zieltabellen zeigen jede betroffene Stimme einmal in der Reihenfolge Bass, Tenor, Alt, Sopran. Auch zwei getrennte Paare am selben Zeitpunkt behalten dadurch die Belege aller vier Stimmen. Die Originalbefunde und ihre Objekte werden nicht verändert oder entfernt.
- Der Bericht nennt weiterhin die Zahl der einzelnen Engine-Befunde. Sobald mehrere Paarbefunde gemeinsam angezeigt werden, nennt er zusätzlich die Zahl der Anzeigegruppen und erklärt die Darstellung in DE/en-US/en-GB. Die lokale Werkstatt übernimmt beide Zahlen. Nach einer Eingabeänderung werden alter Bericht und Download weiterhin gesperrt; die nächste Prüfung berechnet die Gruppen neu.
- Heruntergeladene HTML-Berichte verwenden denselben Renderer und bleiben skriptfrei. Katalog/Fähigkeitsplan bleiben Version 24; musikalische Regeln, Bewertung, Aufgabenquellen, Notenreferenzen und Wiederaufnahmegrenzen ändern sich nicht.

## Nachweise und Grenzen

30 gezielte Werkzeugtests prüfen Bericht, Werkstattmodell und Wiedergabe. Die neuen Fälle prüfen drei Oktavpaare, zwei getrennte Paare, Gruppengrenzen, erhaltene Einzelbefunde/Indizes/Verweise, vollständige Belegtabellen und unveränderte Engine-Ausgabe. Bestehende Auftakt-, Eingabe-, HTML-, Schrift-/CSP-, Datei- und Audioprüfungen bleiben erfolgreich.

15 Chromium-Abläufe prüfen alle drei Sprachen einschließlich gemeinsamer Anzeige, Paarliste, Belegen, skriptfreiem Download, schmaler Ansicht, Axe und erneuter Gruppierung nach einer Notenkorrektur. Die bisherigen Auftakt-, Tastatur-, Import-/Export- und Web-Audio-Abläufe bleiben enthalten. Diese synthetischen Prüfungen ersetzen keine echte Screenreader-/Geräteabnahme.

Dies ist ausdrücklich **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe** auf Nutzerauftrag. Die fachliche Bedeutung der Paarzählung, weitere Satzregeln, F03/F05 sowie unabhängige Primärliteratur-/Fach- und Produktfreigaben bleiben offen. Keine Veröffentlichung oder Bereitstellung. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.
