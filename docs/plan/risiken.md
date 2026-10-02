# Risiken

Bewertung: Wahrscheinlichkeit (W) und Auswirkung (A) jeweils niedrig / mittel / hoch. Das Register wird am Ende jeder Phase überprüft.

| # | Risiko | W | A | Gegenmaßnahme |
|---|---|---|---|---|
| R1 | **Inhaltsmenge:** 6 Stufen × viele Bereiche × 2 Sprachen übersteigen die Kapazität von zwei Personen | hoch | hoch | Parametrische Übungen, KI-Entwürfe mit fachlicher Abnahme, Stufen nacheinander, klarer MVP-Umfang |
| R2 | **Audio-Latenz** auf Android-Geräten zu hoch für Gehörbildung | mittel | hoch | Früher Spike (P1.16) auf mehreren Geräten, Rückfallebene mit vorab geladenen Puffern, Mindestanforderungen kommunizieren |
| R3 | **Notendarstellung** aufwendiger als geplant | mittel | mittel | Umfang streng auf Übungsausschnitte begrenzen, Layout als reine Daten testbar, Erweiterungen erst in Phase 3 |
| R4 | **Fachliche Fehler** in Engine oder Inhalten beschädigen Vertrauen | mittel | hoch | ADR 0002, eigenschaftsbasierte Tests, Literaturabgleich, Abnahme durch Phillip, „Fehler melden“ |
| R5 | **KI-Kosten** höher als Einnahmen | mittel | hoch | Kontingente je Abo, Prompt-Caching, Messung der Kosten pro Antwort, feste Erklärungen aus der Engine statt KI, wo möglich |
| R6 | **KI-Fehlinformation** (vor allem Geschichte, Werke) | mittel | mittel | Wissensbasis mit Quellen, Kennzeichnung ohne Quelle, Testkatalog |
| R7 | **Store-Ablehnung** (Zahlungsregeln, Login, Datenschutz) | mittel | mittel | Richtlinien-Checkliste, frühe TestFlight- und Internal-Testing-Builds, Zahlungslogik wie in [business-model.md](../business-model.md) |
| R8 | **Startproblem** bei Ligen, Duellen und Marktplatz (zu wenige Nutzer) | hoch | mittel | Ghost-Duelle, Ligen erst bei ausreichender Aktivität, Marktplatz erst in Phase 4 mit bestehender Nutzerbasis |
| R9 | **Rechtliche Komplexität** (Minderjährige, Marktplatz, KI-Verordnung, DAC7) | hoch | mittel | Checkliste, rechtzeitige Beratung vor Phase 2 und Phase 4, Funktionen mit Risiko später |
| R10 | **Name „Harmonia“** bereits als Marke oder App-Name belegt | mittel | mittel | Markenrecherche in Phase 0, Ausweichnamen sammeln |
| R11 | **Wettbewerb** (z. B. Duolingo Music) im Einstiegssegment | hoch | mittel | Abgrenzung über Tiefe, Gehörbildung, Tutor, Coaches, deutsche Theorie-Tradition |
| R12 | **Abhängigkeit von Anbietern** (Supabase, Expo, RevenueCat, Anthropic) | niedrig | mittel | Eigene Schnittstellen, Standard-Postgres, Export-Möglichkeiten |
| R13 | **Mikrofon-Erkennung** unzuverlässig (Räume, Geräte) | mittel | mittel | Einstimmig zuerst, Toleranzen einstellbar, MIDI als genaue Alternative |
| R14 | **Kapazität** des Teams (zwei Personen, Phillip mit begrenzter Zeit) | hoch | hoch | Plan in kleinen, abschließbaren Schritten, klare Prioritäten, Scope-Reduktion statt Verzug |
| R15 | **Datenschutzvorfall** | niedrig | hoch | RLS mit Tests, Geheimnisse nur serverseitig, Datensparsamkeit, Ablaufplan für Vorfälle (Meldung binnen 72 Stunden, Art. 33 DSGVO) |
