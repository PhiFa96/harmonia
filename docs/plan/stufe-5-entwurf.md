# P4.19 – Stufe 5 als interner Entwurf

Stand: 25.10.2026 · Grundentwurf `codex/p4-19-level-five-draft` (#103); Weiterbau `codex/p4-19-preview-resume-draft`

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
5. Zur Übersicht zurückkehren oder die Seite neu laden. Der eigene Vorschau-Durchgang kann über „Gespeicherten Entwurf öffnen“ fortgesetzt oder ausdrücklich verworfen werden. Es entstehen keine Lernereignisse, Ratings, XP oder Freischaltungen.

### Wiederaufnahme im aktuellen Entwurfsstand

**Versionswechsel 26.10.2026:** Der P4.11-Einführungsweiterbau hebt die globale Katalogversion auf 24. Gespeicherte Stufe-5-Vorschauentwürfe mit Version 23 werden deshalb als veraltet abgewiesen und benötigen einen neuen Start. Die Stufe-5-Aufgaben und ihre eigenen Quellversionen ändern sich dabei nicht. [ADR 0053](../decisions/0053-chor-einfuehrungen-fuer-jede-stimmlage.md).

Der Weiterbau führt #103 und #110 lokal zusammen. Einführungskarte, Auswahl (einschließlich unvollständiger Zuordnungen), Hinweise, bereits gewertete Antworten, Fehlerwiederholung und Abschluss werden getrennt vom normalen Lernfortschritt gespeichert und beim Laden nachvollzogen. Genau ein Vorschau-Durchgang je Konto/Gast; vor einem anderen Durchgang den vorhandenen verwerfen. Besitzerwechsel zeigen keine fremde Vorschau, Gastübernahme übernimmt sie nicht. Im Modus ohne dauerhaften Speicher geht sie beim Reload verloren.

Die lokale Speicherung nutzt `preview:<scope>` in der vorhandenen `learning_meta`, ohne Datenbankversion oder produktive Migration zu ändern. Quellenkennung der aufgelösten Lektion, Katalog- und Engine-Version schützen vor stillen Inhaltswechseln. Die mobile Engine-Version muss bei Änderungen der Wiedergabesemantik bewusst erhöht werden; sie ist kein automatisch berechneter Codehash. Ungültige/veraltete Quellen bleiben gesperrt und löschbar. SQLite-Vergleich und Transaktionswarteschlange verhindern veraltetes Überschreiben/Löschen durch konkurrierende Ansichten. Ein neuer Ablaufstand wird erst nach erfolgreichem Speichern angezeigt; nach Speicher-/Konfliktfehlern den bestätigten Stand neu laden.

Eigene Vorschau-Antworten gehören zum lokalen Datenschutzexport und zur Kontolöschung. Die bestehende Löschsperre schützt auch verzögerte Speicheraufrufe. Aufbewahrung: intern höchstens sieben Tage ab Erstellung, Bereinigung beim nächsten Zugriff/Export/Aufbewahrungslauf. Keine Synchronisation, Analytics-/XP-Buchung oder Schulfreigabe. Das P4.17-Inventar enthält jetzt zehn ungeprüfte Funktionsbereiche einschließlich dieses konkreten Kontrapunkt-/Analysezwecks und der neuen Speicherpfade. [ADR 0046](../decisions/0046-stufe-fuenf-vorschau-getrennt-wiederaufnehmen.md).

Der reguläre Lernpfad nutzt dieselben Aufgaben mit seinen bestehenden Voraussetzungen. Der separate Prüfablauf umgeht diese Voraussetzungen nur für die interne Vorschau und erzeugt keine Freischaltungen. Notation und Ton nutzen dieselbe Partitur. Lange Reihen sind horizontal scrollbar und per Tastatur erreichbar.

Die Theorieoperationen sind plattformunabhängig. Fehlende, unpassend rhythmisierte oder mehrdeutige Analysequellen werden abgewiesen. Die Aufgaben speichern keine richtige Antwort als Metadatum; Evaluation und Lösungshinweis berechnen sie erneut. Ein leeres Kontrapunktergebnis gilt nur für die neun benannten Regeln.

Der Wissensindex verarbeitet jetzt auch Stufe 5. Die Migration `20261022190000_knowledge_stage_five.sql` erweitert die zulässige Stufe auf 5; sie publiziert und synchronisiert nichts. Vorschauartikel bleiben über RLS vor Gästen und gewöhnlichen Konten verborgen. Öffentliche Entwürfe sind weiterhin unzulässig.

Die anschließende Migration `20261022200000_knowledge_query_coverage.sql` berücksichtigt zusätzlich, wie viele unterschiedliche Suchbegriffe ein Abschnitt abdeckt. Abdeckung und Ähnlichkeit der Überschrift erhalten jeweils höchstens vier Gewichtungspunkte. So verdrängt eine kurze, nur teilweise passende Überschrift keinen Abschnitt mit mehreren passenden Begriffen. Die Suche bleibt sprach- und snapshotgebunden; Dokumentbudget und Zugriffsrechte bleiben erhalten. Beide Migrationen vor dem nächsten lokalen Vorschauindex-Abgleich anwenden.

In Produktion werden zusätzlich zu Katalog/Kartentexten auch die neuen Übungsdefinitionen und Aufgabenstellungen durch Metro ausgeschlossen. Der direkte Aufruf des internen Pfades zeigt dort nur den Nichtverfügbarkeitszustand. Der Bundle-Check kontrolliert diese Texte ausdrücklich.

## Prüfungen

- Theorie: eigener Kontrapunktkorpus einschließlich enharmonischer Gegenbeispiele, unabhängige Intervall-/Tonklassenkontrolle mit `tonal`, Property-Tests zu Vektoren und Transposition.
- Übungen: deterministische Quellen, jeweils genau eine passende Antwort, geänderte Quellen verändern die Bewertung, Zurückweisung von Mehrdeutigkeit/ungeeigneten Dauern, DE/US/UK-Hinweise und keine Begriffslecks.
- Inhalt: alle 24 Lektionen über mehrere Seeds einschließlich echter Fehlerwiederholung; Graph, Texte, Notation, Artikel und Freigabefilter.
- Datenbank: gezielter Lauf auf lokalem PostgreSQL 17 mit den tatsächlichen Wissensmigrationen; Stufe 4 bleibt erhalten, Stufe 5 ist intern suchbar, Stufe 6/öffentliche Entwürfe scheitern, Rollback und RLS bleiben wirksam. Zusätzlich erweitert `knowledge.test.sql` die reguläre pgTAP-CI um diese Grenze. Kein vollständiger lokaler Supabase-Systemlauf.
- Suche: 48 neue Suchfälle (acht Artikel, jeweils direkte und umformulierte Frage in DE/US/UK). Mit den 237 vorhandenen Fällen finden **285/285** auf lokalem PostgreSQL 17 den vorgesehenen Artikel innerhalb des tatsächlichen Tutor-Dokumentbudgets. Vor der Gewichtungskorrektur scheiterten drei neue Fälle. Die 198 Fälle der Stufen 3–5 laufen zusätzlich in der bestehenden Supabase-Such-CI; Deno prüft ihre Artikel-/Sprachabdeckung. Eigene Suchfälle sind keine Live-Modell- oder Fachabnahme.
- Browser: DE/US/UK, schmale und breite Darstellung, Einführung → Aufgaben → Wiederholung → Abschluss, Reload, lange Reihen, Axe und Export ohne gespeicherte Entwurfs-Lernereignisse.
- Typecheck, Lint, Übersetzungs-/Katalogprüfungen, Deno-Portabilität, Preview- und Produktions-Export samt Bundle-Prüfung gehören zum technischen PR-Nachweis. Der endgültige CI-Status steht am PR.

Lokaler Nachweis vom 22.10.2026: Theorie **853**, Übungen **547**, Inhalte **1334** und i18n **474** Tests bestanden; Browser **3/3** bestanden; Deno einschließlich aller 1866 Katalogaufgaben und **1157** Wissensbasis-/SDK-Prüfungen bestanden. Typecheck, Lint, Übersetzungen und Produktionsprüfung bestanden. Produktions-Bundle: 5 JavaScript-Dateien ohne unveröffentlichte Katalog-IDs, Lerntexte oder neue Aufgabenstellungen; 1.409.281 Byte gzip innerhalb des bestehenden Budgets. Die Builds sind lokale Prüfarbeitsprodukte, kein Deployment.

## Offene Abnahme

Die vorstehenden Prüfungen ersetzen keine unabhängige Fachprüfung. Quellenlücken und Modellgrenzen stehen im [Quellenentwurf](../quality/p4-19-quellenentwurf.md). Reale iOS-/Android-Audio- und Geräteprüfungen, didaktische Evaluation, Tutor-Primärquellenreview, F03/F05 soweit betroffen sowie formale P4-/Veröffentlichungsabnahmen bleiben offen. [ADR 0038](../decisions/0038-stufe-fuenf-als-begrenzter-analyseentwurf.md) hält die technische Entscheidung fest.

## Prüfstand des Weiterbaus (25.10.2026)

- 254 portable Modell-/Lektionsablauf-/Prüfungstests, darunter 28 neue Vorschau-Prüfungen: alle 24 neuen Lektionen, Auswahl und Teilzuordnung, Hinweise, Fehlerwiederholung, Abschluss, Quellen-/Versionswechsel, ungültige Eingaben und exakte Aufbewahrungsgrenze.
- 35 gezielte App-/SQLite-/Datenschutztests: Besitzertrennung, Vergleich gegen veraltete Writes, Löschen und verspätete Writes, Aufbewahrung, Hook-Wiederaufnahme, verlorener ACK, Speicherfehler, Konflikt, Unmount/Besitzerwechsel und RAM-Modus. Ein zusätzlich gestarteter vollständiger lokaler App-Lauf wurde ohne bisherigen Fehlerbefund beendet; die vollständige App-Suite bleibt Teil der neuen GitHub-CI.
- 238 Werkzeugtests, vollständiger Lint, Typprüfung, Formatierung sowie Inhalts-/Curriculum-/Übersetzungsprüfung erfolgreich.
- 3/3 Browserprüfungen in DE/en-US/en-GB erfolgreich. Sie decken Reload während eines Durchgangs, unveränderte Frage/Originalfehler, Wiederholung, wiederaufgenommenen Abschluss, gezieltes Verwerfen, neuen Durchgang und eigenen Datenschutzexport ohne Lernnachweis ab. Der lange Scrollbereich wurde nach Axe-Befund fokussierbar gemacht. Der Test wartet an den nun asynchronen Speicherübergängen auf den bestätigten Stand; aktuelle Browser-/CI-Ergebnisse stehen im Weiterbau-PR.
- Isolierter Produktions-Webexport mit tatsächlicher Bundle-Prüfung: fünf JS-Dateien ohne Entwurfsdaten. Aktuelle private KI-/Zertifikatsprüfpakete sowie Rechts-/Beta-/P2-Vorbereitung bleiben bei offenen Freigaben technisch prüfbar.

Die Ausgangsstände #103 und #110 haben jeweils fünf grüne CI-Jobs. Für den kombinierten Weiterbau ist ein eigener GitHub-Lauf erforderlich; keine fachliche, rechtliche, native Geräte- oder formale Phase-4-Freigabe aus den technischen Prüfungen ableiten.
