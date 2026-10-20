# P3.19 – Wissensbasis v2

## Artikel und Freigabe

P3.15 und P3.16 haben bereits zwölf Stufe-3- und dreizehn Stufe-4-Artikel angelegt. Jeder hat vier Originalabschnitte in Deutsch, US- und UK-Englisch. Dazu gehören Musikgeschichte und Quellenkritik (`history.l3.methods.article`, `history.l4.survey.article`). Alle 25 Artikel sind `entwurf`. Der öffentliche Katalog und Suchindex enthalten weiterhin keine dieser Texte. Die Inhalts-Pipeline und native, auf den Snapshot gebundene Quellenzitate bleiben die Freigabegrenze.

Die getrennte fachliche Prüfung nach ADR 0005 ist für alle 25 Artikel erforderlich. Besonders zu prüfen sind Funktions- und Kadenzbegriffe, modaler Grundtonbezug, Septakkord-Schreibweisen, transponierende Instrumente, Generalbass, historische Epochenbehauptungen, Edition/Aufnahme/Werkdatum und die Grenzen schematischer Sonatenform. Die Literaturhinweise in den [Stufe-3](stufe-3-vollstaendig.md)- und [Stufe-4](stufe-4-vollstaendig.md)-Übergaben sind Prüfansätze, keine bereits abgeglichenen Belege. Claudes Review muss jede Sachbehauptung und Übersetzung am Originalartikel prüfen und erst danach den Inhaltsstatus freigeben.

## Suche

`tools/knowledge-queries-v2.ts` enthält zu jedem der 25 Artikel eine direkte und eine umformulierte Frage in drei Sprachfassungen: 150 Abrufe. `pnpm check:knowledge:v2` prüft Artikel- und Sprachabdeckung ohne Datenbank. `pnpm knowledge:sync --preview` und `pnpm db:test:knowledge:v2` prüfen nach Anwendung der Migrationen die echte lokale Supabase-Suche. Der P2.18-Katalog und seine 29 alten Suchfragen bleiben eingefroren. Der separate Tutor-Katalog v2 enthält zusätzlich 50 Quellenfälle mit verlangtem Artikel und nativer Zitatprüfung.

Die bisherige PostgreSQL-Volltextsuche fand bei einer Messung 130/150 neue Fragen innerhalb des tatsächlichen 6-Dokumente-/6000-Byte-Budgets. Die additive Migration `20261020020000_knowledge_search_v2.sql` ergänzt den FTS-Rang um `pg_trgm`-Ähnlichkeit zu Titel und Abschnittsüberschrift. Die Ähnlichkeit verwendet höchstens die ersten 512 Zeichen der Frage. Die Dokumentauswahl sichert zunächst bis zu drei verschiedene Artikel und füllt dann verbleibende Plätze nach Rang. Treffer bleiben auf den exakten Katalog-Snapshot und die angefragte Sprache beschränkt; der Modelltext kommt weiterhin aus dem versionierten Katalog.

Die neue Funktion und 1014 Vorschauabschnitte wurden in einem isolierten PostgreSQL 16 mit denselben deutschen/englischen FTS-Konfigurationen geprüft: 150/150 neue Fragen und 87/87 bisherige Fragen fanden ihren Zielartikel innerhalb des Dokumentbudgets. Ein unbekanntes Thema lieferte null Treffer, ein veralteter Snapshot blieb `stale`. Das war eine Prüfung der echten SQL-Funktion und lokalen Auswahl, aber kein vollständiger Supabase-Migrations-/RLS-Test und kein Produktions-Latenzwert. Der lokale Supabase-Start dieser Cloud scheiterte beim Postgres-Image am Speicherplatz; die vollständige DB- und Tutor-API-Prüfung bleibt für den Integrationslauf offen.

`pgvector` wird für diesen Katalog vorerst nicht eingeführt: Die messbare Suchlücke ist mit FTS plus Trigramm behoben. Das ist keine Aussage über unbegrenzte freie Fragen. Bei späteren unabhängigen, fachlich geprüften Paraphrasen oder nach Inhaltsfreigabe die Trefferquote erneut messen. Erst wenn relevante Artikel dann nicht zuverlässig im Dokumentbudget erscheinen, Embedding-Modell, Datenfluss, Versionsbindung, Kosten und `pgvector` gegen die bestehende Suche prüfen.

## Antwort-Abnahme

Ein gefundener Artikel allein belegt noch keine korrekte Tutorantwort. Die 50 neuen Quellenfälle brauchen unabhängige Katalog- und Antwortreviews sowie einen echten Lauf mit geprüftem Anthropic-Modell/Tarif. Jede fachliche oder historische Behauptung muss durch den konkreten zitierten Abschnitt gedeckt sein; ohne geeignete Quelle muss der Tutor die Lücke benennen. Solange alle Artikel Entwürfe sind, bleiben sie nur in der lokalen Vorschau verfügbar. Claude Code übernimmt Fachreview, CI, Migration und PR-Integration; Codex erstellt hier weder PR noch Merge.

Der vollständige v2-Katalog umfasst nach P3.19 **315 Fälle**. Mit zwei synthetischen Varianten in drei Sprachfassungen liefen **1.890/1.890** Dialoge technisch durch. Die Bewertung meldet `reviewed: 0`, `releaseEligible: false` und keine Rollen- oder Kontingentempfehlung. Typprüfung, Lint, Wissensbasis-Smoke, Benchmark-Smoke und der unveränderte P2.18-Katalog bestanden lokal. Diese Zahlen messen keine Qualität echter Tutorantworten.
