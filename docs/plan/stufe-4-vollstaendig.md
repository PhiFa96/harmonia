# P3.16 – Stufe 4 als interner Studienvorbereitungs-Entwurf

Stand 19.10.2026 auf `codex/p3-16-level-four-content`, aufbauend auf P3.15. Der interne Katalog enthält 13 Stufe-4-Einheiten mit 39 Fähigkeiten und Lektionen, 390 Aufgaben, 52 Wissenskarten mit 52 eigenen schematischen Beispielen und 13 vierteilige Wissensartikel. Alle neuen Datensätze tragen Inhaltsversion 16 und Status `entwurf`. Ziele, Erklärungen und Aufgabenoberfläche sind in DE, US- und UK-Englisch vorhanden.

**P3.16 ist fachlich nicht abgeschlossen.** Die unabhängige Claude-Prüfung nach [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md), Literaturabgleich, echte Geräteabnahme und öffentliche Inhaltsfreigabe fehlen. Der öffentliche Katalog hat weiterhin null Lektionen.

## Lehrplan und Aufgaben

| Einheit | Inhalte und tatsächlich geübte Aufgaben |
|---|---|
| `notation.l4.multivoice` | Stimmen, Ausrichtung, Alt-/Tenorschlüssel, Systeme; Notenlesung im C-Schlüssel aus dem angezeigten Bild |
| `rhythm.l4.complex` | Unterteilung, 3:2-Achteltriolen, Synkope, Hemiolenwirkung; Triolen in 2/4, 3/4 und 4/4 klopfen |
| `chords.l4.extensions` | Nonen, Umkehrungen, Alterationen, Lagen; Septakkorde erkennen, hören und in Umkehrungen schreiben |
| `harmony.l4.applied` | Zwischendominante, Pivotakkord, neue Tonika, Kadenz; leitereigene Stufen und einfache Kadenzmodelle bestimmen |
| `satz.l4.voice-leading` | Gemeinsame Töne, Leitton, parallele Quinten/Oktaven, Stimmumfang; parallele Quinten aus zwei notierten Stimmen prüfen |
| `satz.l4.figured-bass` | Bezifferung, Sext-/Quartsextlage, Aussetzung; 5/3, 6/3 und 6/4 aus notiertem Bass und Oberstimmen bestimmen |
| `forms.l4.sonata` | Exposition, Durchführung, Reprise, Coda; Begriffswahl und Zuordnung mit ausdrücklicher Modellgrenze |
| `analysis.l4.score` | Motiv, Phrase, Harmonik, Belegpflicht; Begriffswahl und Zuordnung zu schematischen Notenstellen |
| `jazzpop.l4.voicings` | Guide Tones, Optionstöne, II–V–I, Lead-Sheet-Grenzen; Septakkorde notiert, gespielt und gehört |
| `instruments.l4.orchestration` | Tonumfang, Verdopplung, transponierende Stimme, Partiturkontrolle; B-Klarinetten-Transposition aus Notenbild |
| `acoustics.l4.tuning` | Obertonreihe, reine Quinte 3:2, gleichstufige und mitteltönige Stimmung; Begriffswahl und Zuordnung |
| `aural.l4.preparation` | Intervalle und Vierklänge hören, Melodie-/Rhythmusdiktat, Blattsingen und Nachspielen |
| `history.l4.survey` | Werk, Edition, Aufnahme, historische Unsicherheit; zwei datierte Quellen gegeneinander prüfen |

Die neuen C-Schlüssel-, Quintparallelen- und Generalbassaufgaben berechnen Antworten aus dem **tatsächlich angezeigten Notenbild**. Sie besitzen Frage, zwei Hinweise und Erklärung in allen drei Sprachfassungen. Die 13 begrifflichen Themen haben jeweils vier unterschiedliche Definitionen. Schematische Eigenkompositionen sind weder Werkauszüge noch historische Aufnahmen oder Instrumentenklangproben.

Die praktische Reichweite bleibt begrenzt: Die App bewertet hier noch keinen vollständigen vierstimmigen Satz, keine freie Generalbass-Aussetzung und keine Analyse eines ganzen Werkes. Sie kann Stimmungsunterschiede nicht anhand authentischer Instrumentenaufnahmen beurteilen. Die Stufe vermittelt und prüft diese Konzepte mit kurzen Modellen; der Prüfungsmodus ist P3.17. Fachliche Begutachtung muss auch entscheiden, ob für eine reale Studienvorbereitung weitere Aufgabentypen nötig sind.

## Abhängigkeiten und Freigabe

Die Einheiten bauen im Fähigkeitsgraphen auf Stufen 2–3 und untereinander auf. Der Lernpfad zeigt Stufe 4 intern an und hält ihre Lektionen hinter den Voraussetzungen gesperrt. Alle älteren Datensatz-IDs, Versionen und Texte bleiben semantisch erhalten. Der P2.18-Tutor-Testkatalog bleibt als Vergleichsstand eingefroren; die Erweiterung auf Stufen 3–4 gehört zu P3.18.

Der gesamte interne Katalog umfasst Version 16: 54 Einheiten, 165 Fähigkeiten, 160 Lektionen mit 1600 Aufgaben, 350 Karten mit 407 Beispielen und 54 Artikel. Der Vorschau-Wissensindex umfasst 1014 Abschnitte in drei Sprachfassungen, darunter 156 der Stufe 4. Öffentlicher Index und Katalog bleiben leer. Die additive Migration `20261019110000_knowledge_stage_four.sql` erweitert die erlaubte Stufe in `knowledge_chunks` von 1–3 auf 1–4 und muss vor lokalem Vorschau-Wissensabgleich angewendet werden.

`tools/author-level-four.py` und `tools/level_four_data.py` erzeugen die neuen Originalinhalte reproduzierbar. Nach erneuter Generierung JSON formatieren, `pnpm content:publish` und `pnpm curriculum:render` ausführen und den Diff prüfen. Datenbankmigration, GitHub-CI, echte iOS-/Android-Geräte und ein produktiver Inhaltsrelease sind nicht durch die lokale Vorschau ersetzt.

## Lokaler Prüfstand

Alle 39 neuen Lektionen wurden mit je 25 vollständigen Seeds erzeugt und bewertet. C-Schlüssel, Quintparallelen und Grundbezifferungen wurden je 200-mal gegen die angezeigten Noten sowie in DE/US/UK geprüft. Die älteren 121 Lektionen, 126 Fähigkeiten und 41 Artikel blieben bei einem semantischen Vergleich mit P3.15 unverändert; der neue Autorengenerator ist nach Formatierung idempotent. Die vollständigen Inhalts- und Übungspaket-Suiten bestanden mit 991 beziehungsweise 447 Tests. Inhaltspipeline, Fähigkeitsgraph, i18n, Format, Typen, Lint, Werkzeugtests und `pnpm check:deno` bestanden lokal; Deno spielte alle 1600 Aufgaben durch und prüfte 1014 Wissensabschnitte. Der neu gebaute Produktions-Webexport enthält in fünf JavaScript-Dateien keine unveröffentlichten Inhalts-IDs oder Artikeltexte. Die gezielten App-Tests für Stufe 4 und Lektionswiederaufnahme bestanden. GitHub-CI, lokale SQL-Migration und echte Geräte stehen aus.

Ein erster monolithischer `pnpm test`-Lauf bestand die Paket-Suiten bis einschließlich Content, lief dann aber in einem älteren App-Lektionsfluss-Test unter Last in ein 20-Sekunden-Timeout. Derselbe Test bestand isoliert und in einem zweiten, stillen App-Lauf. Dieser zweite Lauf wurde nach den betroffenen und weiteren ersten App-Suiten beendet; ein vollständig grüner App-Gesamtlauf ist hier nicht belegt.

Für den getrennten fachlichen Durchgang gezielt prüfen: C-Schlüssel-Linien und Oktavlage, Hemiolenbeispiel und Triole, Nonen-/Alterationsbezeichnungen, Modulation versus Tonikalisierung, klassische Satzregel paralleler Quinten, Generalbasskonventionen (insbesondere 6/4), Sonatenform als historisch variables Modell, Jazz-Voicings und Stilbezug, Instrumentenumfang, Frequenzverhältnisse sowie Epochen- und Quellenbehauptungen. Geeignete Prüfquellen sind unter anderem Adler, *The Study of Orchestration*; Aldwell/Schachter/Cadwallader, *Harmony and Voice Leading*; Caplin, *Classical Form*; und Hall, *Musical Acoustics*. Diese Sitzung behauptet keinen abgeschlossenen Zugriff oder Abgleich mit diesen Werken.
