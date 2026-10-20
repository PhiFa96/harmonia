# Phase 3 – technischer Rückblick und Übergabe

**Stand 20.10.2026.** Die Arbeitspakete P3.01–P3.19 haben technische Implementierungen oder redaktionelle Entwürfe auf gestapelten Arbeitsbranches. P3.18 liegt auf `codex/p3-18-tutor-planner` über P3.17; P3.19 liegt auf `codex/p3-19-knowledge-v2` über P3.18. Claude Code integriert sie in dieser Reihenfolge mit PR, CI und Review. Codex hat keine PR und keinen Merge erstellt.

Die Produkt-Definition von „Phase 3 abgeschlossen“ ist **nicht** erfüllt: Der öffentliche Stufe-3/4-Katalog ist leer, Fachfreigaben und echte Plattformabnahmen fehlen. Der Rückblick beschreibt deshalb den technischen Übergabestand und die offenen Entscheidungen, keinen öffentlichen Release.

## Was funktioniert und was zu prüfen ist

| Bereich | Technischer Stand | Offene Abnahme |
|---|---|---|
| Adaptive Lernlogik P3.01–03 | Glicko-2, Aufgabenauswahl, FSRS und Offline-Projektionen vorbereitet | Reale Rating-Plausibilität, Beta-Nichtunterlegenheit, Behaltenswirkung |
| Wettbewerb P3.04–08 | Ligen, Rush, Duelle, Rätsel, Freunde und Quests vorbereitet | Echte DB-/Realtime-/Schedulerläufe, Mehrgeräte-/Netztests, freigegebene Aufgaben und Datenschutz |
| Eingabe P3.09–12 | Mikrofon, Singaufgaben, MIDI und Rhythmus-Übungsmodus vorbereitet | Mikrofon-95-%-Reihe, USB/Bluetooth/iOS/Android/Web, Latenz und Akku |
| Fachkern P3.13–14 | Erweiterte Engine, Notation, Harmonik und Diktat vorbereitet | F03-Funktionskonvention, Literatur-/Fachprüfung und reale Audio-/Notenansicht |
| Inhalte P3.15–17 | Stufen 3–4 und zwei Prüfungsvorlagen als DE/EN-Entwürfe | Unabhängige Prüfung nach ADR 0005, Eignung für echte Aufnahmeprüfungen, Inhaltsrelease |
| Tutor P3.18–19 | Kontogebundene Lernübersicht, Lernplan, 25 Artikel und 315-Fälle-Katalog v2 vorbereitet | Fachliche Lernplan-/Quellenreviews, echtes Modell und Kosten, vollständige Supabase-Prüfung |

Der isolierte PostgreSQL-Suchlauf prüfte 150/150 neue und 87/87 alte Themenfragen, aber keine Modellantwort. Der v2-Katalog umfasst nach P3.19 315 Fälle; 1.890 simulierte Dialoge bestanden technisch bei null fachlichen Antwortreviews. Die lokale Supabase-CLI konnte in dieser Cloud wegen des großen Postgres-Images nicht starten. Eine kleine isolierte PostgreSQL-Instanz ersetzt weder alle Migrationen noch RLS, Realtime und Edge Functions.

## Folgen für Phase 4

Phase 4 beginnt erst nach den im [angepassten Plan](phase-4-v2.md) genannten Phase-3-Abnahmen. P4.06 darf die Tutor-Zusammenfassung nur nach ausdrücklicher, widerrufbarer Freigabe an Coaches zeigen. P4-Funktionen mit Tonsatz oder harmonischer Korrektur benötigen die offene F03-Konvention und unabhängige Literaturprüfung. Ein KI-Live-Call setzt getestete Audio-, Mikrofon- und Netzwerkpfade voraus. Keine Phase-4-Startentscheidung wird aus grünen Simulationszahlen abgeleitet.
