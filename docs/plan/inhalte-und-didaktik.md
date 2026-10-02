# Inhalte und Didaktik

Wie Lerninhalte aufgebaut, erstellt, geprüft und ausgeliefert werden. Fachlicher Rahmen: [curriculum.md](../curriculum.md).

## Struktur

```
Bereich (z. B. Intervalle)
└── Stufe (1–6)
    └── Einheit (thematischer Block, z. B. „Terzen und Sexten“)
        └── Lektion (5–10 Minuten)
            └── Übungssatz (8–15 Aufgaben)
                └── Aufgabe (eine Frage)
```

Dazu kommen:

- **Fähigkeiten (Skills):** kleinste prüfbare Lerneinheiten, z. B. „Notennamen im Violinschlüssel, ohne Vorzeichen“. Jede Aufgabe trainiert eine oder mehrere Fähigkeiten.
- **Fähigkeitsgraph:** gerichteter Graph der Voraussetzungen (z. B. Notennamen → Intervalle bestimmen). Er steuert Lernpfad, Einstufung und Wiederholung.
- **Wissenskarten:** kurze Erklärtexte mit Beispielen (Notenbild + Klang), auch für die Wiederholung nach FSRS.
- **Wissensartikel:** längere Texte für die Wissensbasis des KI-Tutors.

## Inhalte als Code

- Alle Inhalte liegen in `packages/content` als YAML- oder JSON-Dateien, geprüft durch Schemas (zod).
- Jeder Text hat einen deutschen und einen englischen Eintrag. Die CI schlägt fehl, wenn eine Sprache fehlt.
- Übungen sind meist **parametrisch:** Die Datei beschreibt den Übungstyp und seine Parameter. Die Engine erzeugt daraus beliebig viele Aufgaben. Feste Aufgaben gibt es nur, wo nötig (Prüfungen, Geschichte).
- Inhalte sind versioniert (`contentVersion`). Fortschritt verweist auf stabile IDs, damit Änderungen keine Fortschritte zerstören.
- Auslieferung mit dem App-Bundle. Inhaltsupdates per EAS Update (Over-the-air), ohne neuen Store-Release.

Beispiel (vereinfacht):

```yaml
id: intervals.l2.u3.lesson2
skills: [interval.identify.visual.thirds-sixths]
title: { de: "Terzen und Sexten erkennen", en: "Recognizing thirds and sixths" }
exercises:
  - type: INTERVAL_IDENTIFY_VISUAL
    count: 6
    params: { clefs: [treble], intervals: [m3, M3, m6, M6], maxAccidentals: 1, direction: up }
  - type: INTERVAL_IDENTIFY_AURAL
    count: 4
    params: { intervals: [m3, M3], playback: melodic-up }
```

## Übungstypen

Jeder Typ implementiert dieselbe Schnittstelle: Aufgabe erzeugen, Antwort bewerten, Feedback und Hinweise liefern. Bewertung immer durch die Engine.

| Typ | Beschreibung | Eingabe | Phase |
|---|---|---|---|
| `NOTE_NAME` | Notenbild → Tonname | Auswahl | 1 |
| `NOTE_PLACE` | Tonname → Note ins System setzen | Notation | 2 |
| `KEY_FIND` | Ton auf der Klaviatur finden | Klaviatur | 2 |
| `INTERVAL_IDENTIFY_VISUAL` | Intervall im Notenbild bestimmen | Auswahl | 1 |
| `INTERVAL_IDENTIFY_AURAL` | Intervall hören und bestimmen | Auswahl | 1 |
| `INTERVAL_BUILD` | Intervall von einem Ton aus bilden | Notation / Klaviatur | 2 |
| `SCALE_BUILD` | Tonleiter aufbauen | Notation | 2 |
| `SCALE_IDENTIFY` | Tonleitertyp erkennen (sehen/hören) | Auswahl | 2 |
| `KEYSIG_IDENTIFY` / `KEYSIG_BUILD` | Vorzeichnung bestimmen bzw. setzen | Auswahl / Notation | 2 |
| `CHORD_IDENTIFY` | Akkord bestimmen (sehen/hören), inkl. Umkehrung | Auswahl | 2 |
| `CHORD_BUILD` | Akkord bauen | Notation / Klaviatur | 2 |
| `RHYTHM_TAP` | Rhythmus mittippen | Tippen | 2 |
| `METER_IDENTIFY` | Taktart erkennen | Auswahl | 2 |
| `KNOWLEDGE_MC` / `MATCH` / `ORDER` | Wissensfragen, Zuordnen, Reihenfolge (z. B. Epochen) | Auswahl | 2 |
| `CADENCE_IDENTIFY` | Kadenz hören und bestimmen | Auswahl | 3 |
| `FUNCTION_ANALYSIS` | Funktionen oder Stufen zuordnen | Auswahl | 3 |
| `MELODY_DICTATION` | Melodiediktat | Notation / Klaviatur | 3 |
| `RHYTHM_DICTATION` | Rhythmusdiktat | Rhythmus-Eingabe | 3 |
| `SING_INTERVAL` / `SIGHT_SING` | Intervall singen, Blattsingen | Mikrofon | 3 |
| `PLAY_BACK` | Gehörte Melodie nachspielen | Klaviatur / MIDI | 3 |
| `VOICE_LEADING` | Vierstimmigen Satz schreiben, Engine prüft | Notation | 4 |
| `CHOIR_PART` | Eine Stimme zu drei gespielten singen | Mikrofon | 4 |

## Ablauf einer Lektion

1. Kurze Einführung (Wissenskarte) bei neuem Stoff
2. Aufgaben aus neuem Stoff und Wiederholung gemischt (Anteil Wiederholung steigt mit Fortschritt)
3. Sofortiges Feedback nach jeder Aufgabe: richtig/falsch, Erklärung, Hörbeispiel
4. Falsch beantwortete Aufgaben kommen am Ende in neuer Variante noch einmal
5. Ergebnis: Genauigkeit, XP, Fortschritt im Pfad
6. Optional: „Warum?“ öffnet den KI-Tutor mit dem Kontext der Aufgabe

**Hinweisleiter** in jeder Aufgabe: Hinweis 1 (Denkanstoß) → Hinweis 2 (konkreter) → Lösung mit Erklärung. Hinweise verringern die XP der Aufgabe leicht, sind aber nie gesperrt.

**Bestanden:** Eine Lektion gilt bei mindestens 80 % richtigen Antworten (Wert einstellbar) als abgeschlossen. Darunter wird sie zur Wiederholung vorgeschlagen.

## Einstufungstest

- Adaptiv: Er startet in der Mitte von Stufe 1–2 und wird schwerer oder leichter, je nach Antwort.
- 15–25 Aufgaben über die wichtigsten Fähigkeiten, Abbruch jederzeit möglich.
- Ergebnis: Startpunkt im Pfad plus geschätztes Niveau je Bereich. Übersprungene Einheiten gelten als „getestet“ und können freiwillig gemacht werden.
- Ab Phase 3 baut er auf dem Rating-System auf (Glicko-2, siehe [motivation-und-social.md](motivation-und-social.md)).

## Inhaltsproduktion

Der Umfang (6 Stufen × viele Bereiche × 2 Sprachen) ist das größte Mengenproblem. Deshalb gilt:

1. **Parametrische Übungen zuerst:** Ein gut parametrisierter Übungstyp ersetzt Hunderte handgeschriebene Aufgaben.
2. **KI-gestützte Entwürfe:** Claude schreibt Entwürfe für Wissenskarten, Erklärtexte und Artikel in beiden Sprachen.
3. **Fachliche Abnahme:** Phillip prüft jeden Text. Nichts geht ohne Freigabe live. Status je Inhalt: `entwurf → in_pruefung → freigegeben`.
4. **Engine-Prüfung:** Alle Notenbeispiele in Texten sind maschinenlesbar (z. B. `[[notes: C4 E4 G4]]`) und werden von der Engine geprüft und gerendert.
5. **Glossar:** zentrales Fachbegriff-Glossar DE ↔ EN in `packages/i18n` als einzige Quelle für Terminologie.
6. **Stilrichtlinie:** kurze Sätze, Du-Form auf Deutsch, aktive Sprache, ein Gedanke pro Karte, immer mit Klangbeispiel.
7. **Rechte:** nur eigene Texte und Notenbeispiele oder gemeinfreie Werke in eigenem Notensatz (siehe [curriculum.md](../curriculum.md)).
8. **Fehler melden:** In jeder Aufgabe können Nutzer einen Fehler melden. Meldungen landen in einer Tabelle und werden wöchentlich gesichtet.

## Zweisprachigkeit (DE/EN)

Siehe [ADR 0003](../decisions/0003-zweisprachigkeit-de-en.md). Fachliche Besonderheiten:

| Thema | Deutsch | Englisch |
|---|---|---|
| Tonnamen | H/B, -is/-es | B/B♭, sharp/flat |
| Notenwerte | Ganze, Halbe, Viertel | US: whole, half, quarter (UK: semibreve, minim, crotchet) – offene Frage |
| Harmonik | Funktionstheorie und Stufen | Römische Ziffern |
| Oktavlagen | Helmholtz (c′) | Wissenschaftlich (C4) |

Die Inhalte sind nicht nur übersetzt, sondern an die Tradition angepasst. Ein englischer Kurs zur Harmonik arbeitet mit römischen Ziffern, ein deutscher mit Funktionen und Stufen.
