# P4.19 – Quellen und fachliche Grenzen des Entwurfs

**Entwurf, keine unabhängige Fachfreigabe.** Autorendurchgang vom 22.10.2026. Eigene DE/EN-Texte und Notenmodelle; keine Übernahme fremder Formulierungen, Notenbeispiele oder Aufnahmen. Automatisierte Tests und `tonal` prüfen Berechnungen, nicht die unabhängige musikpädagogische Abnahme.

**Technischer Autorennachtrag vom 03.11.2026:** [Zusammenhängender Gesamtstand](../plan/stufe-5-gesamtstand.md), ADR 0074. R1 und R5 wurden am unten genannten festen Commit erneut direkt gelesen. Zusätzlich direkt gelesen: [Music Theory for the 21st-Century Classroom, University of Puget Sound, §30.8 Fugue Analysis](https://musictheory.pugetsound.edu/mt21c/FugueAnalysis.html), Definitionen zu Thema und realer/tonaler Antwort (R7). Die eigene Wissensfrage verwendet gleichlautende Möglichkeit statt einer unterschiedlichen Häufigkeitsangabe in DE/EN. Keine fremden Notenbeispiele übernommen. Vollständige zusätzliche Literatur- und unabhängige Fachprüfung bleiben offen.

## Direkt gelesene Grundlage

Die nachstehenden Texte von *Open Music Theory*, erste Onlinefassung, wurden aus dem öffentlichen Repository am festen Commit `a907aa015f7ec54b925ddb070d2d36aecd0dc705` gelesen.

| Kennung | Fundstelle | Verwendung und Grenze |
| --- | --- | --- |
| R1 | [Composing a first-species counterpoint](https://github.com/openmusictheory/openmusictheory.github.io/blob/a907aa015f7ec54b925ddb070d2d36aecd0dc705/firstSpecies.md), „Beginning“, „Ending“, „Independence“, „Intervals and motion“ | Neun unten aufgeführte Regeln, beschränkt auf Cantus unten / Gegenstimme oben. Weitere Empfehlungen der Quelle werden nicht als geprüft ausgegeben. |
| R2 | [Twelve-Tone Theory — Basics](https://github.com/openmusictheory/openmusictheory.github.io/blob/a907aa015f7ec54b925ddb070d2d36aecd0dc705/twelveToneBasics.md) | Zwölf verschiedene Tonklassen in geordneter Reihe; Unterscheidung von Zwölftontechnik und weiter gefasstem Serialismus. Eigene Reihe statt des dortigen Webern-Beispiels. |
| R3 | [Twelve-Tone Music — Operations](https://github.com/openmusictheory/openmusictheory.github.io/blob/a907aa015f7ec54b925ddb070d2d36aecd0dc705/twelveToneOperations.md) | T/I/R/RI modulo zwölf, zusätzliche Transposition erlaubt. Die Aufgaben verlangen keine Bezeichnung eines historischen Reihenindex. |
| R4 | [Pitch (class)](https://github.com/openmusictheory/openmusictheory.github.io/blob/a907aa015f7ec54b925ddb070d2d36aecd0dc705/pitch%28Class%29.md), „Integer notation“, „Disclaimer“ | Oktav-/enharmonische Äquivalenz als ausdrücklich gewählte Abstraktion. Keine Universalbehauptung über musikalische Tonhöhen. |
| R5 | [Interval (class)](https://github.com/openmusictheory/openmusictheory.github.io/blob/a907aa015f7ec54b925ddb070d2d36aecd0dc705/interval%28Class%29.md) | Gerichtete Halbtonintervalle gegenüber ungeordneten Intervallklassen. Die Vektorzählung wird zusätzlich mit unabhängig ausgeschriebenen Paarlisten und der Summe n(n−1)/2 geprüft. |
| R6 | [Sonata form – the recapitulation](https://github.com/openmusictheory/openmusictheory.github.io/blob/a907aa015f7ec54b925ddb070d2d36aecd0dc705/sonataRecap.md), Beginn bis „Recomposition“; [Sonata Rondo](https://github.com/openmusictheory/openmusictheory.github.io/blob/a907aa015f7ec54b925ddb070d2d36aecd0dc705/sonataRondo.md) | Themenwiederkehr allein genügt keiner Sonatenanalyse; tonale Funktion und größerer Verlauf sind wesentlich. Die berechnete Taktbuchstabenfolge ist ausdrücklich nur ein Vergleichsmodell. |

## Implementiertes Kontrapunktprofil

`analyzeFirstSpecies` erhält mindestens zwei Paare fest zugewiesener Unter-/Oberstimmen. Es kennt keine impliziten Pausen oder Dauern. Der Aufgabenadapter akzeptiert ausschließlich vollständige, ungebundene Ganznotenpaare; unvollständige oder rhythmisch ungeeignete Eingaben werden abgewiesen.

| Regelkennung | Konkret geprüfte Bedingung aus R1 |
| --- | --- |
| `consonance` | Geschriebene reine Prim-/Quintfamilie bzw. kleine/große Terz-/Sextfamilie, aufwärts; keine bloße enharmonische Ersetzung. |
| `crossing` | Gegenstimme klingt nicht unter dem Cantus. Neue Aufgaben haben zwei fest zugeordnete Systeme; bei einer Kreuzung bleibt der Cantus im zweiten System. Nur historische Ein-System-Dyaden behalten die frühere Tief-/Hoch-Konvention. |
| `interior-unison` | Keine reine Prime zwischen Anfang und Ende. |
| `spacing` | Abstand höchstens reine Duodezime. Die Empfehlung, die Oktave möglichst einzuhalten, ist kein zusätzlicher Fehler. |
| `consecutive-perfect` | Keine zwei reinen Quinten bzw. zwei reinen Primen/Oktaven in Folge, auch oktavversetzt und bei Gegenbewegung. Wiederholung derselben Dyade fällt im strengen Lehrprofil ebenfalls darunter; nicht mit einer allgemeinen SATB-Parallelregel gleichsetzen. Keine posttonale ic1–6-Bezeichnung. |
| `direct-perfect` | Keine perfekte Prim-/Quintfamilie durch gleichgerichtete Bewegung erreichen. |
| `overlap` | Keine Stimme überschreitet die vorige Position der anderen. |
| `boundary` | Anfang P1/P5/P8, Ende P1/P8, mit Cantus unten. |
| `closing-motion` | Schluss aus kleiner Terz oder großer Sexte durch entgegengesetzte kleine/große Sekundschritte. |

Nicht geprüft: Cantus-Qualität, Modus/Tonikafunktion, melodischer Höhepunkt, alle Sprung-/Wiederholungsregeln, vollständige Singbarkeit, zweite bis fünfte Gattung. Die 24 eigenen Kurzmodelle mit vier bis sechs Klängen sind Rechenbeispiele und werden nicht als vollständige Mustersätze bezeichnet. Die unabhängig ausgeschriebene `tonal`-Gegenrechnung bestätigt diese neun Bedingungen an 400 erzeugten Quellen, keine vollständige Stilqualität. Der chromatische Motivprüfer ist ebenfalls kein tonales Fugenantwort-Modell.

## Noch fachlich zu belegen oder unabhängig zu prüfen

- Kanon/Fuge, reale gegenüber tonaler Antwort, Variationsbegriffe, methodischer Analyseabsatz: redaktionelle Einführung; reale/tonale Antwort zusätzlich gegen R7 gelesen, weitere Literatur- und unabhängige Fachprüfung offen.
- Intervallklassenvektor: Berechnung und eigene Paarlisten getestet; eine zusätzliche vollständige Fachreferenz zu Vektor, Z-Beziehungen und Begriffskonventionen ist im unabhängigen Review nachzutragen. Normal-/Primform ist nicht implementiert.
- Minimal Music, elektroakustische und spektrale Verfahren: kurze Begriffsentwürfe mit eigenen schematischen Modellen. Keine Zuschreibung an konkrete Werke, keine historische Aufnahme, keine kontinuierliche Phasing-Simulation. Spezialliteraturprüfung offen.
- Maqam/Raga: ausschließlich quellenkritischer Einstieg und Modellgrenzen, keine simulierte traditionelle Darbietung und keine algorithmische Bewertung. Der direkte Abruf von `https://www.maqamworld.com/en/maqam.php` scheiterte im Arbeitslauf mit HTTP 403; er gilt **nicht** als gelesene Quelle. Fachkundige Prüfung, konkret zugängliche Referenzen und gegebenenfalls lizenzierte Aufnahmen bleiben offen.
- DE, en-US und en-GB: gleiche fachliche Reichweite, lokalisierte Oberfläche und Tonbezeichnungen. Muttersprachliche und unabhängige Fachprüfung der neuen Texte offen.

Es findet keine Veröffentlichung oder Indexsynchronisierung zu einer entfernten Umgebung statt. Eine Freigabe verlangt einen getrennten Prüfdurchgang und die bereits geltenden Produkt-/Phasenabnahmen.
