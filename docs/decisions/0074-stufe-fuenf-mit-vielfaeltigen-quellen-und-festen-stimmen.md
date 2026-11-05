# ADR 0074: Stufe 5 mit vielfältigen Quellen und festen Stimmen

Datum: 03.11.2026 · Status: angenommen für den internen technischen Gesamtentwurf; Fachfreigabe offen.

## Anlass

Der Nutzer beauftragt die zusammenhängende Vervollständigung von P4.19. Der vorhandene Entwurf hat acht Einheiten mit 24 Lektionen. Die fachliche Nacharbeitsliste A7–A12/A15 nennt Begriffsüberschneidungen, uneinheitliche Texte, Entwicklerhinweise, schwer lesbare Notation, geringe Aufgabenvielfalt, nicht erkennbare Stimmen und identische Fähigkeitszuordnung.

## Entscheidung

- Der Neun-Regeln-Prüfer selbst bleibt unverändert. Neue Quellen verwenden 24 eigene unter diesen Regeln fehlerfreie Kurzmodelle mit vier, fünf oder sechs Klängen und gezielte Veränderungen. Transposition allein ist nicht mehr die einzige Variation korrekter Beispiele. Diese Quellen bestätigen keine vollständige Stil- oder Singbarkeitsprüfung.
- Neue Kontrapunktquellen haben zwei Systeme: zuerst Gegenstimme, dann Cantus. Die Zuordnung bleibt bei Kreuzungen bestehen. Ein-System-Altquellen behalten ihre bisherige Tief-/Hoch-Konvention; sie werden nicht als neue Aufgaben erzeugt. Alte gespeicherte Vorschauen werden gesperrt.
- Rollenhinweis, Notationsbeschreibung und gleichzeitige Wiedergabe beziehen sich auf beide Systeme. In der Beschreibung werden auch implizite System-/Stimmindizes des Renderers berücksichtigt. Die Darstellung eigener Lehrbeispiele wird mit `staffPresentation: parts` ausdrücklich ausgewählt; das bestehende Klaviatur-Zielbild behält seine gesonderte Prüfung.
- Mengenaufgaben enthalten alle Mächtigkeiten 1–4 mit unterschiedlichen Lagen und Wiederholungen. Reihen werden aus eigenen permutierten Tonklassenfolgen gebildet; Fehler betreffen wechselnde Positionen und unterschiedliche Häufigkeiten. Mehrdeutige Reihenoperationen werden begrenzt neu erzeugt, danach mit einer geprüften eigenen asymmetrischen Ausgangsreihe aufgelöst.
- Jede der 24 Lektionen und ihr Übungssatz verwenden genau ihre aktuelle Zielfähigkeit. Vorherige Fähigkeiten bleiben Voraussetzungen. Die Musikkulturen-Lektionen verbinden die vorhandenen Themen zu Praxisgrenzen, Quellenkontext und Belegen und mischen Auswahl- und Zuordnungsaufgaben. Es wird keine traditionsspezifische Darbietung vorgetäuscht oder algorithmisch bewertet.
- DE/en-US/en-GB erhalten gleiche fachliche Reichweite. „Intervallklasse“ bleibt im posttonalen Kontext ic1–6; Kontrapunkttexte nennen die tatsächlich geprüften reinen Intervalle. Die Fugenfrage macht keine Häufigkeitsbehauptung und nennt ihren gesuchten Begriff nicht im Fragetext. Entwickler-/spätere Abnahmehinweise stehen in der Übergabe.
- Katalog/Fähigkeitsplan sowie die betroffenen acht Einheiten und ihre Quellen erhalten Version 31; die getrennten offenen Chor-/Zeitreiseentwürfe verwenden 29/30. Bei gemeinsamer Integration bleibt der höchste Katalogstand erhalten. Die Vorschau-Engine erhält Version 2. Keine stille Neubewertung alter Durchgänge und keine produktive Datenbankmigration.

## Folgen

Die Inhalte bleiben `entwurf`; öffentlich null Lektionen. Die technische Vorarbeit erfolgt ausdrücklich **vor der formalen Phase-4-Freigabe**. Keine Veröffentlichung, Fernsynchronisierung oder Main-Integration. Unabhängige Fach-/Primärquellen-/Sprachprüfung, F03/F05 soweit betroffen und reale Geräte-/Audio-/Screenreaderabnahmen bleiben offen. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt. [Gesamtstand](../plan/stufe-5-gesamtstand.md).
