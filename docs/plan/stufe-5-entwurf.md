# P4.19 – Stufe 5 als interner Entwurf

Stand: 22.10.2026 · Arbeitsbranch `codex/p4-19-level-five-draft`

**Technische P4-Vorarbeit vor der formalen Phase-4-Freigabe auf ausdrücklichen Nutzerauftrag.** Kein Deployment, keine Veröffentlichung, keine Fachabnahme. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt.

## Implementierter Umfang

| Neue Einheit | Inhalte / berechnete Übungen |
| --- | --- |
| `counterpoint.l5.species` | Erste Gattung: geschriebene Konsonanzen, Bewegungsarten, neun begrenzte Prüfregeln mit Taktbefunden |
| `counterpoint.l5.imitation` | Imitation, Kanon-/Fugenbegriffe, chromatische Motivtransformation T/I/R/RI |
| `forms.l5.structure` | Exakte Abschnittsidentität, Rondo-/Variationshypothesen, Reprise und tonale Funktion |
| `analysis.l5.methods` | Fragestellung, Segmentierung, Messung/Deutung, Motiv- und Mengenvergleich, begrenzte Analyseargumente |
| `contemporary.l5.serial` | Eigene Zwölftonreihe, Vollständigkeit, Transformationen, historische Einordnung und Grenzen |
| `contemporary.l5.sets` | Tonklassenmenge, Mächtigkeit, Intervallklasse, Intervallklassenvektor |
| `contemporary.l5.process` | Diskrete zyklische Verschiebung, additive Prozesse, elektroakustisches Material, Spektralmodell |
| `world.l5.context` | Maqam/Raga als kontextgebundene Praxis, Quellenperspektive und Grenzen des App-Modells |

Je Einheit drei Lektionen mit 8/10/12 Aufgaben, vier eigene Karten mit abspielbarer Notation sowie ein Artikel. Insgesamt **24 neue Lektionen, 240 Aufgaben, 24 Fähigkeiten, 32 Karten/Notenbeispiele und acht Artikel**, jeweils DE/en-US/en-GB. Mit den drei vorhandenen P4.10-Lektionen umfasst Stufe 5 nun neun Einheiten und 27 Lektionen. Gesamtkatalog v21: 65 Einheiten, 199 Fähigkeiten, 194 Lektionen, 1866 Aufgaben; öffentlich weiterhin null Lektionen.

Die Reihenfolge folgt dem Fähigkeitsgraphen. Neue Katalogdatensätze sind durchgehend `entwurf`. Bereits vorhandene Inhaltsversionen bleiben erhalten.

## Ablauf und Daten

In einer lokalen Preview unter **Üben → Stufe-5-Entwurf öffnen** oder `/level-five`:

1. Eine der 24 neuen Lektionen wählen, Einführungskarten lesen und eigene Beispiele hören.
2. Aufgaben mit Notation, semantischen Auswahlantworten und drei Hinweisstufen bearbeiten.
3. Rückmeldung aus dem sichtbaren Material erhalten; die Kontrapunktprüfung nennt Regel und Takt.
4. Fehler mit verändertem Material wiederholen und eine lokale Zusammenfassung sehen.
5. Zur Übersicht zurückkehren. Es werden keine Lernereignisse, Bewertungen oder XP gespeichert; Reload beendet den Entwurfsdurchgang.

Der reguläre Lernpfad nutzt dieselben Aufgaben mit seinen bestehenden Voraussetzungen. Der separate Prüfablauf umgeht diese Voraussetzungen nur für die interne Vorschau und erzeugt keine Freischaltungen. Notation und Ton nutzen dieselbe Partitur. Lange Reihen sind horizontal scrollbar und per Tastatur erreichbar.

Die Theorieoperationen sind plattformunabhängig. Fehlende, unpassend rhythmisierte oder mehrdeutige Analysequellen werden abgewiesen. Die Aufgaben speichern keine richtige Antwort als Metadatum; Evaluation und Lösungshinweis berechnen sie erneut. Ein leeres Kontrapunktergebnis gilt nur für die neun benannten Regeln.

Der Wissensindex verarbeitet jetzt auch Stufe 5. Die Migration `20261022190000_knowledge_stage_five.sql` erweitert die zulässige Stufe auf 5; sie publiziert und synchronisiert nichts. Vorschauartikel bleiben über RLS vor Gästen und gewöhnlichen Konten verborgen. Öffentliche Entwürfe sind weiterhin unzulässig.

In Produktion werden zusätzlich zu Katalog/Kartentexten auch die neuen Übungsdefinitionen und Aufgabenstellungen durch Metro ausgeschlossen. Der direkte Aufruf des internen Pfades zeigt dort nur den Nichtverfügbarkeitszustand. Der Bundle-Check kontrolliert diese Texte ausdrücklich.

## Prüfungen

- Theorie: eigener Kontrapunktkorpus einschließlich enharmonischer Gegenbeispiele, unabhängige Intervall-/Tonklassenkontrolle mit `tonal`, Property-Tests zu Vektoren und Transposition.
- Übungen: deterministische Quellen, jeweils genau eine passende Antwort, geänderte Quellen verändern die Bewertung, Zurückweisung von Mehrdeutigkeit/ungeeigneten Dauern, DE/US/UK-Hinweise und keine Begriffslecks.
- Inhalt: alle 24 Lektionen über mehrere Seeds einschließlich echter Fehlerwiederholung; Graph, Texte, Notation, Artikel und Freigabefilter.
- Datenbank: gezielter Lauf auf lokalem PostgreSQL 17 mit den tatsächlichen Wissensmigrationen; Stufe 4 bleibt erhalten, Stufe 5 ist intern suchbar, Stufe 6/öffentliche Entwürfe scheitern, Rollback und RLS bleiben wirksam. Zusätzlich erweitert `knowledge.test.sql` die reguläre pgTAP-CI um diese Grenze. Kein vollständiger lokaler Supabase-Systemlauf.
- Browser: DE/US/UK, schmale und breite Darstellung, Einführung → Aufgaben → Wiederholung → Abschluss, Reload, lange Reihen, Axe und Export ohne gespeicherte Entwurfs-Lernereignisse.
- Typecheck, Lint, Übersetzungs-/Katalogprüfungen, Deno-Portabilität, Preview- und Produktions-Export samt Bundle-Prüfung gehören zum technischen PR-Nachweis. Der endgültige CI-Status steht am PR.

Lokaler Nachweis vom 22.10.2026: Theorie **853**, Übungen **547**, Inhalte **1334** und i18n **474** Tests bestanden; Browser **3/3** bestanden; Deno einschließlich aller 1866 Katalogaufgaben und **1157** Wissensbasis-/SDK-Prüfungen bestanden. Typecheck, Lint, Übersetzungen und Produktionsprüfung bestanden. Produktions-Bundle: 5 JavaScript-Dateien ohne unveröffentlichte Katalog-IDs, Lerntexte oder neue Aufgabenstellungen; 1.409.281 Byte gzip innerhalb des bestehenden Budgets. Die Builds sind lokale Prüfarbeitsprodukte, kein Deployment.

## Offene Abnahme

Die vorstehenden Prüfungen ersetzen keine unabhängige Fachprüfung. Quellenlücken und Modellgrenzen stehen im [Quellenentwurf](../quality/p4-19-quellenentwurf.md). Reale iOS-/Android-Audio- und Geräteprüfungen, didaktische Evaluation, Tutor-Primärquellenreview, F03/F05 soweit betroffen sowie formale P4-/Veröffentlichungsabnahmen bleiben offen. [ADR 0038](../decisions/0038-stufe-fuenf-als-begrenzter-analyseentwurf.md) hält die technische Entscheidung fest.
