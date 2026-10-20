# P3.15 – Stufe 3 als interner Entwurf

Stand 19.10.2026 auf `codex/p3-15-level-three-content`, aufbauend auf P3.14. Der interne Katalog enthält zwölf Stufe-3-Einheiten mit 36 Fähigkeiten, 36 Lektionen und 360 Aufgaben. Jede Einheit hat drei Lektionen mit 8, 10 und 12 Aufgaben, vier Wissenskarten mit eigenen Notenbeispielen und einen vierteiligen Wissensartikel. Ziele, Erklärungen und Aufgabenoberfläche liegen in Deutsch, US- und UK-Englisch vor. Neue Datensätze tragen Inhaltsversion 15 und Status `entwurf`.

**P3.15 ist fachlich nicht abgeschlossen.** Die getrennte Claude-Prüfung nach [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md), Literaturabgleich und echte Geräteabnahme stehen aus. Der öffentliche Katalog enthält weiterhin null Lektionen. Es gibt keinen Inhalts-Release.

## Lehrplan und Aufgaben

| Einheit | Inhalt und konkrete Aufgabe |
|---|---|
| `scales.l3.modes` | Ionisch, dorisch, mixolydisch und äolisch anhand von Intervallfolgen, Grundtonbezug und Vergleich zu Dur/natürlichem Moll; Begriffswahl und Zuordnung |
| `chords.l3.sevenths` | Vier Septakkordtypen mit notierter Erkennung, eigenem Schreiben und Hören; Grundton, Dreiklang und Septime |
| `harmony.l3.functions` | Leitereigene Stufen und Funktionszeichen in benannter Tonart aus notierten Akkorden bestimmen |
| `harmony.l3.cadences` | Vereinfachte authentische, plagale, Halb- und Trugschlussfolgen anhand gezeigter Akkorde unterscheiden |
| `harmony.l3.modulation` | Gemeinsamer Akkord, Tonikalisierung, neue Tonika und gemeinsamer Ton begrifflich unterscheiden; angewandte Modulationsanalyse bleibt für Stufe 4 |
| `aural.l3.dictation` | Vier-Ton-Melodie und Viertel-/Halbe-/Achtel-Rhythmus nach Gehör eingeben; in der dritten Lektion auch Blattsingen und Nachspielen |
| `forms.l3.phrases` | Motiv, Phrase, Vorder- und Nachsatz anhand eigener schematischer Tonfolgen unterscheiden |
| `forms.l3.designs` | Zweiteilig, dreiteilig, Rondo und Variation einführen; zusätzlich am Notenbild A–B–A gegen A–B–C erkennen, ohne daraus eine vollständige Werkform zu behaupten |
| `instruments.l3.families` | Streicher, Holz-, Blech- und Schlaginstrumente und die Grenzen von Familienbezeichnungen; Klaviersynthese ersetzt keine Instrumentenklangprobe |
| `instruments.l3.scores` | Notierte und klingende Höhe, einfache B-Klarinetten-Transposition und Partiturlese-Hinweise; klingenden Ton aus gezeigter Note berechnen |
| `jazzpop.l3.harmony` | Lead Sheet, II–V–I, Backbeat und harmonischer Loop; zusätzlich Septakkorde in Notenbild und Klang erkennen, ohne aus einem Akkord ein Genre abzuleiten |
| `history.l3.methods` | Handschrift, Edition, Aufnahme- und Werkdatum sowie mündliche Erinnerung; zwei fiktive datierte Quellen gegeneinander prüfen |

Neue Bereiche sind Harmonielehre, Formenlehre, Instrumentenkunde und Jazz/Pop. Die übrigen Einheiten knüpfen an Stufe 2 an. Direkte Voraussetzungen und alle 126 Ziele stehen in den [generierten Diagrammen](faehigkeitsgraph-diagramme.md). Die Stufe-3-Artikel sind in der internen Tutor-Wissensbasis der Stufe 3 zugeordnet. Bestehende IDs und Versionen der Stufen 1–2 bleiben erhalten; der P2.18-Tutor-Testkatalog bleibt als Vergleichsstand eingefroren. Seine Erweiterung und Kalibrierung gehört zu P3.18.

Die neuen Quellenaufgaben berechnen die Antwort aus dem gezeigten Notenbild. A–B–A und A–B–C werden aus den drei Tonfolgen bestimmt; die B-Klarinetten-Aufgabe transponiert den geschriebenen Ton um eine große Sekunde abwärts. Beide Themen besitzen Fragen, Antworttexte, zwei Hinweise und Lösungserklärungen in den drei Sprachfassungen. Wissensfragen verwenden 32 eigene Fachbegriffe mit getrennten Definitionen; die Septakkord-, Harmonik- und Diktatübungen verwenden die P3.14-Engine.

Die additive Migration `20261019100000_knowledge_stage_three.sql` erweitert ausschließlich die erlaubte Stufe in `knowledge_chunks` von 1–2 auf 1–3. Sie muss vor einem lokalen Vorschau-Wissensabgleich mit `pnpm knowledge:sync --preview` angewendet sein. Der veröffentlichte Wissensindex bleibt leer, solange keine Artikel freigegeben sind.

## Prüf- und Freigabestand

Der vollständige interne Katalog hat Version 15: 41 Einheiten, 126 Fähigkeiten, 121 Lektionen mit 1210 Aufgaben, 298 Karten mit 355 Beispielen und 41 Wissensartikel. Die öffentliche Projektion bleibt leer. `tools/author-level-three.py` mit `tools/level_three_data.py` hat die ersten Originalinhalte erzeugt. Seit Katalogversion 17 verweigert das Skript den Lauf (Versionsprüfung); nach den Fachkorrekturen unten sind die JSON-Dateien die Quelle, ein erneuter Lauf würde sie überschreiben und darf nicht ohne Übernahme der Korrekturen erfolgen.

Technisch bestanden: `pnpm test` einschließlich 834 Inhaltstests, 411 Übungstests und 619 App-Tests in 86 Suiten; zusätzlich der gezielte Stufe-3-Lernpfadtest. Alle 36 neuen Lektionen durchlaufen je 25 vollständige Seeds. Die beiden neuen Quellenaufgaben wurden je 200-mal gegen die tatsächlich gezeigten Noten geprüft. `pnpm typecheck`, `pnpm format:check`, `pnpm check:content`, `pnpm check:i18n`, `pnpm check:curriculum`, `pnpm check:tutor:catalogue` und der vollständige `pnpm check:deno` einschließlich FSRS und 858 Wissensbasis-Abschnitten bestanden. `pnpm lint` bestand mit `NODE_OPTIONS=--max-old-space-size=4096` (die Standardgrenze von 2 GB reichte für das gesamte Repo nicht). Der isolierte Produktions-Webexport enthält in fünf JavaScript-Dateien keine unveröffentlichten Katalog-IDs oder eigenständigen Artikeltexte; öffentliche Lektionen: null. Die 589 bisherigen Katalogdatensätze, 29 bisherigen Planeinheiten und alle alten Inhaltstexte wurden gegen P3.14 semantisch identisch verglichen.

GitHub-CI, echte iOS-/Android-Geräte und der lokale SQL-Wissensabgleich wurden hier nicht ausgeführt. Der Container-Download für lokales Supabase war in dieser Cloud bereits bei P3.14 blockiert; die neue Constraint-Migration braucht deshalb die Datenbankprüfung im Integrationsablauf.

Für den getrennten fachlichen Durchgang besonders prüfen: modal-tonikalen Bezug statt nur gemeinsamer Tonvorräte, Septakkordschrift und hörbare Eindeutigkeit, Funktionssystem DE/EN, den bewusst vereinfachten Kadenzbegriff, Tonikalisierung versus Modulation, B-Klarinetten-Transposition, Grenzen kurzer Formmodelle, Instrumentenfamilien und historische Quellenbehauptungen. Die Schemanoten sind Eigenkompositionen und weder Archivmaterial noch lizenzierte Songauszüge. Die Quellenliste aus [Stufe 2](stufe-2-vollstaendig.md) ist ein Ansatz; für Formen und Instrumentenkunde kommen etwa William Caplin, *Classical Form*, und Samuel Adler, *The Study of Orchestration*, als Prüfquellen in Frage. Diese Sitzung behauptet keinen abgeschlossenen Zugriff auf diese Literatur.

## Korrekturen aus der Fachprüfung (20.10.2026, Katalogversion 18)

Grundlage: [Prüfbericht P3.15](../quality/fachpruefung-phase-3/p3-15-stufe-3.md), Zusammenfassung in [fachpruefung-phase-3.md](fachpruefung-phase-3.md). Alle Inhalte bleiben `entwurf`, die öffentliche Projektion bleibt leer, nichts ist `freigegeben`. Geänderte Datensätze (10 Fähigkeiten, 26 Karten, 10 Artikel, 27 Übungssätze, 36 Lektionen) tragen Version 16, Katalog und Plan Version 18.

**Behoben:**
- **G-01 Lösungsleck:** Alle 32 Begriffsdefinitionen (KNOWLEDGE_MC/MATCH) sind in DE/EN-US/EN-GB neu und eigenständig formuliert; weder Begriff noch Wortstamm (erste fünf Buchstaben) kommt vor, die Imperativsätze sind Erklärungen. Wache: `packages/exercises/src/knowledge-leak.test.ts` (Begriffsliste in drei Sprachen plus erzeugte Aufgabe).
- **G-12:** Gerätehinweise, „Fehlerwiederholungen verwenden neue Varianten“, „klassifizieren nur …“ und „keine gemessene Hörerreaktion“ stehen nicht mehr in Karten; die Rhythmusdiktat-Karte nennt drei oder vier Ereignisse (die sechs Muster haben 4, 3, 3, 3, 4, 4 Ereignisse).
- **G-07a/c:** Die Rondo-Karte zeigt A–B–A–C–A über fünf Takte (der Artikelabschnitt der Dreiteiligen Form behält A–B–A); die vier Partitur-Karten beschriften notierte und klingende Höhe der B-Klarinette.
- **G-02:** Die Subdominanten-Karte erklärt Tp und Sp (DE; EN mit Herkunft aus der deutschen Funktionstheorie und Roman-Numeral-Entsprechung). tonal: C-Dur Am/Dm, G-Dur Em/Am.
- **G-09:** Ganzschluss und Plagalschluss mit Synonymen in Titel und Text; Stufenzeichen vi und viiø7 wie in den Aufgaben.
- **E-02/E-03:** große Sekunde statt „Sekundschritt“, B = B♭ bei der B-Klarinette, „nicht bloß eine zusätzliche Oktave“, Tonikalisierung erklärt, „plagal … Gattung“ gestrichen, EN „on an isolated sound“, „starting on a different note“, Quellenoption „refer to different events“, Kadenz-Rückmeldung EN ohne Großbuchstabe mitten im Satz; das führende Leerzeichen der Quellen-Rückmeldung (`contextResult`, DE) ist entfernt.
- **G-08:** EN-US ohne britische Formen, EN-GB aus dem US-Text abgeleitet (tone, crotchet/quaver, stave, bar, metre, leading note, recognise); Takt, Notenwerte, Halbton, Notensystem und Taktart über `$t(glossary:…)`. `en-gb.ts` bindet die britischen Aufgabentexte jetzt ein (zuvor wurden sie ignoriert).
- **G-14:** Voraussetzungen: `forms.l3.phrases.s1` (Notenlesen und Rhythmus statt Gattung), `chords.l3.sevenths.s1` (Dreiklangsarten, Umkehrungen, Intervallqualitäten), `scales.l3.modes.s1` (natürliches Moll, Grundton der Dur-Tonleiter), `instruments.l3.scores.s2` (Intervalle abwärts bilden).

**Zurückgestellt (nicht Teil dieser Korrektur):** G-04 (Septakkord-Umkehrungsterminologie schon in Lektion 1), G-05 (gleiche Lektionsstruktur, Karten-Fähigkeits-Zuordnung nach Index), G-06 und G-13 (Aufgaben decken Modus-, Formverlaufs-, Quellenziele nicht), G-10 (Singumfang), G-11 (Prompt „Stufe“ bei Funktionszeichen, allgemeine Hinweise), G-07b/d (generische Beispiele für Backbeat, Orchesterfamilien, Pivot), E-01 (UK-Kadenzterminologie, Glossar), E-04/E-05 (Literaturabgleich, Instrumentengrenzfälle), Glossareinträge für Leitton, Kadenzen, Funktionen und Tonikalisierung, aurale Voraussetzung `aural.triad-quality` für `chords.l3.sevenths` (würde Lektion 1 ohne Höraufgabe sperren).
