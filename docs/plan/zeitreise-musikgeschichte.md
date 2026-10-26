# P4.12 – Zeitreise durch die Musikgeschichte (interner Entwurf)

Vier Stationen behandeln **Mittelalter, Renaissance, Barock und Klassik** im ausdrücklich europäischen Überblick des vorhandenen Artikels `history.l2.period-contexts.article`. Jede Station durchläuft Szene → fiktives Interview → Wissensfrage → Hörfrage → Abschluss. Nach einer falschen Antwort erscheint ein eigener Hinweis. Eine andere Auswahl erlaubt einen neuen Versuch; die vollständige Erklärung erscheint nach einer richtigen Antwort. Hörfragen lassen sich nach erfolgreichem Wiedergabestart prüfen. Der Modus schreibt weder Lernnachweise noch XP.

Die Texte liegen in `packages/i18n/src/history-journey-draft.json` mit DE und EN-US sowie gezielten en-GB-Abweichungen für die britische Schreibweise; weitere englische Texte werden gemeinsam verwendet. `packages/content/src/history-journey-draft.ts` enthält ausschließlich IDs, Quellenpositionen, Lösungen und eigens verfasste Notenkurzschrift. Die Audio-Engine spielt diese Kurzschrift synthetisch. **Alle Klangmodelle sind eigene Unterrichtsbeispiele; keine historische Aufführung, Rekonstruktion oder Transkription.** Die Hörfragen prüfen direkt hörbare Eigenschaften und verlangen keine Epochenerkennung allein am Klang.

Die historischen Personen sind erfundene Rollen, keine Zitate realer Menschen. Die App kennzeichnet das redaktionelle Rollenspiel als erfunden und vorab geschrieben. Jede inhaltliche Aussage verweist auf den exakten Abschnitt des versionierten P2.08-Wissensartikels; der vorhandene Artikelbildschirm zeigt seinen Entwurfsstatus. Der Quellenlink wird mit demselben Text-Fingerabdruck wie P3.19 erzeugt und öffnet nur die passende Artikelfassung.

`@harmonia/content/history-journey` und `@harmonia/i18n/history-journey` werden für Development/Preview auf die internen Daten und für Production auf leere Daten abgebildet. Der Modus ist nur bei vorhandenen Stationen in der Übungsübersicht verlinkt. Ein Produktions-Deep-Link zeigt nur den Zustand „noch keine Station freigegeben“. Vor einem öffentlichen Release muss der Bundleguard erneut geprüft werden.

## Technischer Weiterbau vom 26.10.2026

Auf `codex/p4-12-draft-boundaries` werden die drei technischen Prüflücken aus der Nacharbeitsliste geschlossen. Dies ist ausdrücklich **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe**. Grundlage ist der offene Entwurfs-PR #116 mit fünf erfolgreichen CI-Jobs. P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt.

- `check:i18n` prüft jetzt die Stations- und Antworttexte einschließlich Platzhaltern und Glossarverweisen. Beide Antwortgruppen verlangen jeweils drei Zeichenketten. Der Prüfeinstieg bleibt außerhalb des öffentlichen i18n-Index und der Laufzeitressourcen.
- Metro kontrolliert aufgelöste Dateipfade einschließlich Symlinks für die internen Zeitreise-TS-/JSON-Dateien. Virtuelle Expo-Shims funktionieren weiter. Vorschau und Entwicklung erhalten die internen Stationen; öffentliche Aliase liefern leere Module.
- Der tatsächliche Produktions-Export wird auf kurze Entwurfstexte und alle acht Partituren geprüft. Bereits öffentliche Sprachwerte und freigegebene Notenbeispiele sind zulässige gemeinsame Werte.
- 481 Sprachtests, 250 Werkzeugtests, vier gezielte App-Tests und sechs Chromium-Abläufe auf tatsächlichen Vorschau-/Produktions-Webexports sind erfolgreich. Die öffentlichen Deep-Links zeigen in DE/en-US/en-GB ausschließlich die Unverfügbarkeit der Stationen. Der Vorschau-Durchgang bleibt intern spielbar. Die Produktionsprobe ist zusätzlich in CI eingebunden.
- Sprachprüfung, Typecheck, Lint und Inhaltsprüfung sind erfolgreich; der Bundleguard bestätigt fünf JS-Dateien ohne Entwurfsdaten und der Katalog null freigegebene Lektionen. Die allgemeine Sprachprüfung bereitet große Textbäume je Aufruf nur einmal auf.

[ADR 0049](../decisions/0049-zeitreise-entwuerfe-an-den-buildgrenzen-pruefen.md) beschreibt die Grenzen der Prüfungen. Die vorhandenen en-GB-Rückfalltexte, redaktionellen Fragen, Fachbegriffe und Quiz-Ablenker benötigen weiterhin gesonderte Arbeit und unabhängige Prüfung. Keine Veröffentlichung.

## Quiz und Rückmeldungen: Weiterbau vom 26.10.2026

`codex/p4-12-quiz-feedback-draft` baut auf dem offenen Entwurfs-PR #117 mit fünf erfolgreichen CI-Jobs auf. Dies ist ausdrücklich **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe**. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.

- Auswahl, Rückmeldung und Versuche werden als flüchtiger, portabler Fragezustand geführt. Eine Prüfung ohne Auswahl oder erforderliche Audiofreigabe bleibt wirkungslos. Wiederholte Aktivierung prüft dieselbe Auswahl nicht erneut. Nach einem Fehler muss eine andere Antwort gewählt werden; eine richtige Antwort wird gesperrt.
- Acht eigene Hinweistexte in DE/EN begleiten Fehler. Die vollständige Erklärung ist an die richtige Antwort gebunden. Weiter, Zurück und Stationswechsel beginnen einen leeren Fragezustand; Hörfragen dürfen ausdrücklich übersprungen werden. Dieser interne Ablauf speichert keine Versuche und vergibt keine XP oder Lernnachweise.
- Die vier Wissensfragen verlangen das Anwenden der beschriebenen Grenzen auf undatierte Modelle. Die acht Antwortgruppen verwenden plausiblere Ablenker. Die Interviews sind als redaktionelles, fest geschriebenes Rollenspiel gekennzeichnet. Im deutschen Text wird „Stimmen“ verwendet; die britische Barockfassung verwendet „realisation“.
- Die Sprachprüfung verlangt drei unterschiedliche Antworttexte und vorhandene Hinweise. Sie prüft weiterhin sämtliche einzelnen Antworttexte und die aufgelöste britische Fassung.
- Sieben portable Modelltests, 483 Sprachtests, vier App-Tests und 250 Werkzeugtests sind erfolgreich. Die Browserproben prüfen in DE/en-US/en-GB Fehler, Hinweis, Korrektur und Erklärung für Wissens- und Hörfrage mit tatsächlichem Wiedergabestart. Der öffentliche Build zeigt weiterhin keine Stationen; die Inhalte bleiben Entwurf.

Neue Fragen, Hinweise und Ablenker brauchen eine unabhängige Fach-/Sprachprüfung. Die Rollen sprechen weiterhin über Lehrdossiers; ihre weitere Gestaltung und die Glossararbeit bleiben offen. Audiofreigabe nach Start ist kein Nachweis vollständigen Anhörens. [ADR 0050](../decisions/0050-zeitreise-fragen-mit-hinweisen-und-erklaerungen.md).

## Glossaranbindung: Weiterbau vom 26.10.2026

`codex/p4-12-glossary-draft` baut auf dem offenen Entwurfs-PR #119 mit fünf erfolgreichen CI-Jobs auf. Dies ist ausdrücklich **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe**. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.

- Die Route bezieht Stationsübersicht, Szenen, Interview, Fragen, Antworten, Hinweise und Erklärungen über `createHistoryJourneyText(locale, messages)`. Einstimmigkeit, Mehrstimmigkeit, Imitation, Generalbass, Stimme und Phrase verwenden das gemeinsame Glossar. Die Bezeichnung „Phrase“ ergänzt das Glossar mit DE/EN-Pluralformen; sie enthält keine historische Definition. US-/UK-Begriffe und die vorhandenen britischen Textabweichungen bleiben sprachgebunden.
- Die Bindung erhält Daten ausdrücklich und erzeugt eigene Textkopien in einer isolierten Inhaltsinstanz. Sie verändert weder Eingabe noch globale Laufzeitressourcen. Der öffentlich exportierte Helfer importiert keine Entwurfstexte zur Laufzeit. Ohne Station in der gewählten Sprache erfolgt kein Rückfall auf fremdsprachige Entwürfe.
- Alle 14 Textfelder einschließlich einzelner Antwortoptionen werden aufgelöst. Fehlende oder unvollständige Glossarverweise, Verweise auf andere Geschichten und unaufgelöste Platzhalter werden abgewiesen. Jede Antwortgruppe verlangt auch nach der Auflösung drei unterschiedliche Texte; `check:i18n` prüft denselben Vertrag.
- Der Bundleguard sperrt sowohl rohe Vorlagen als auch vollständig aufgelöste Entwurfstexte in allen drei Sprachen. Gemeinsame öffentliche Glossarwerte bleiben zulässig. Die Produktionsaliase bleiben leer; sämtliche privaten Geschichten und alle acht Partituren bleiben ausgeschlossen.
- 495 Sprachtests, vier gezielte App-Tests, 253 Werkzeugtests und zwölf Deno-Bindungen sind erfolgreich. Sechs Chromium-Abläufe prüfen tatsächliche Vorschau-/Produktions-Webexports in DE/en-US/en-GB, einschließlich aufgelöster Begriffe und öffentlicher Unverfügbarkeit. Der Bundleguard bestätigt fünf JS-Dateien ohne Entwurfsdaten. Typecheck, Lint und Sprach-/Inhaltsprüfungen sind erfolgreich.

Katalog/Fähigkeitsplan bleiben auf Version 23, öffentlich null Lektionen. Die sprachliche Einbettung der Begriffe, Rollen, Fragen, Hinweise und Ablenker benötigen weiterhin unabhängige Fach-/Sprachprüfung; Primärquellen- und Geräteabnahmen bleiben offen. Alle Stationen bleiben `entwurf`, keine Veröffentlichung. [ADR 0052](../decisions/0052-zeitreise-texte-mit-isolierter-glossarbindung.md).

## Quellen und offene Abnahme

| Station | Quellenabschnitt (Artikel `history.l2.period-contexts.article`, P2.08) | Offene Fachprüfung |
|---|---:|---|
| Mittelalter | 0 | Werkjahr 1250 und Grenzen der einstimmigen Modellierung |
| Renaissance | 1 | Werkjahr 1550, Polyphonie und Grenze der modellhaften Zweistimmigkeit |
| Barock | 3 | Werkjahr 1720, Generalbass-Begriff und Klangmodell |
| Klassik | 4 | Werkjahr 1780, Phrasenmerkmal und Epochengrenzen |

Der verwendete Wissensartikel (aus P2.08; der versionierte Abschnittslink stammt aus P3.19) und die neuen Texte sind `entwurf`. Der Artikel wurde noch nicht unabhängig gegen Primärliteratur geprüft. Das Quellenreview muss Aussagen, Übersetzungen und die Aussagegrenze der Modelle getrennt beurteilen. Danach sind echte Hör-, Screenreader- und Geräteprüfungen auf iOS, Android und Web erforderlich. Bis dahin bleiben die vier Stationen intern; **keine Epoche ist fachlich freigegeben**. Auch Phase 3 und Phase 4 bleiben nach ihren bestehenden Start- und Abschlussbedingungen offen. P4.01 wartet weiter auf F14 und die rechtlichen Voraussetzungen.
