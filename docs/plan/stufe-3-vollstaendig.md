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

Der vollständige interne Katalog hat Version 15: 41 Einheiten, 126 Fähigkeiten, 121 Lektionen mit 1210 Aufgaben, 298 Karten mit 355 Beispielen und 41 Wissensartikel. Die öffentliche Projektion bleibt leer. `tools/author-level-three.py` mit `tools/level_three_data.py` beschreibt die neuen Originalinhalte reproduzierbar; ältere Datensätze werden beim Lauf nicht neu geschrieben. Nach einer erneuten Generierung müssen JSON-Dateien formatiert und die abgeleiteten öffentlichen Artefakte sowie Diagramme erneut erzeugt werden.

Technisch bestanden: `pnpm test` einschließlich 834 Inhaltstests, 411 Übungstests und 619 App-Tests in 86 Suiten; zusätzlich der gezielte Stufe-3-Lernpfadtest. Alle 36 neuen Lektionen durchlaufen je 25 vollständige Seeds. Die beiden neuen Quellenaufgaben wurden je 200-mal gegen die tatsächlich gezeigten Noten geprüft. `pnpm typecheck`, `pnpm format:check`, `pnpm check:content`, `pnpm check:i18n`, `pnpm check:curriculum`, `pnpm check:tutor:catalogue` und der vollständige `pnpm check:deno` einschließlich FSRS und 858 Wissensbasis-Abschnitten bestanden. `pnpm lint` bestand mit `NODE_OPTIONS=--max-old-space-size=4096` (die Standardgrenze von 2 GB reichte für das gesamte Repo nicht). Der isolierte Produktions-Webexport enthält in fünf JavaScript-Dateien keine unveröffentlichten Katalog-IDs oder eigenständigen Artikeltexte; öffentliche Lektionen: null. Die 589 bisherigen Katalogdatensätze, 29 bisherigen Planeinheiten und alle alten Inhaltstexte wurden gegen P3.14 semantisch identisch verglichen.

GitHub-CI, echte iOS-/Android-Geräte und der lokale SQL-Wissensabgleich wurden hier nicht ausgeführt. Der Container-Download für lokales Supabase war in dieser Cloud bereits bei P3.14 blockiert; die neue Constraint-Migration braucht deshalb die Datenbankprüfung im Integrationsablauf.

Für den getrennten fachlichen Durchgang besonders prüfen: modal-tonikalen Bezug statt nur gemeinsamer Tonvorräte, Septakkordschrift und hörbare Eindeutigkeit, Funktionssystem DE/EN, den bewusst vereinfachten Kadenzbegriff, Tonikalisierung versus Modulation, B-Klarinetten-Transposition, Grenzen kurzer Formmodelle, Instrumentenfamilien und historische Quellenbehauptungen. Die Schemanoten sind Eigenkompositionen und weder Archivmaterial noch lizenzierte Songauszüge. Die Quellenliste aus [Stufe 2](stufe-2-vollstaendig.md) ist ein Ansatz; für Formen und Instrumentenkunde kommen etwa William Caplin, *Classical Form*, und Samuel Adler, *The Study of Orchestration*, als Prüfquellen in Frage. Diese Sitzung behauptet keinen abgeschlossenen Zugriff auf diese Literatur.
