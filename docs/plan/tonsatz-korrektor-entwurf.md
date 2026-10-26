# P4.10 – Tonsatz-Korrektor als interner Entwurf

Stand: 21.10.2026. Arbeitsbranch: `codex/p4-10-part-writing-draft`.

## Auftrag und Freigabegrenze

Auf ausdrücklichen Nutzerauftrag findet **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe** statt. P4.10 baut auf dem P4.09-Branch und dessen Draft-PR #100 auf. Die technische Implementierung ersetzt weder die P3-Abnahmen noch F03, F05 oder eine unabhängige Fachprüfung. P4.01 bleibt bis zur Klärung von F14 und der rechtlichen Voraussetzungen zurückgestellt. Kein Merge, Deployment oder öffentlich freigegebener Inhalt ist Teil dieses Schritts.

## Implementierter Ablauf

- `VOICE_LEADING` ist ein regulärer, seedbarer Übungstyp mit Bewertung, Hinweisen, Wiederholungen, Quellenrekonstruktion und Ratingprofil.
- Sechs Entwurfslektionen: in Stufe 4 und 5 jeweils Bass vorgegeben, Sopran vorgegeben oder Funktionen vorgegeben; je drei Aufgaben. Eigene Einführungskarten und UI-Texte auf Deutsch, Englisch (US) und Englisch (UK).
- Weiterbau vom 26.10.2026: Jeder Erstversuch enthält C-, F- und G-Dur genau einmal in dieser Reihenfolge. Fehlerwiederholungen verwenden seedbar eine andere Tonart als ihre Ursprungsaufgabe. Inhaltsversion 22 für die sechs Lektionen und Übungssätze; alte Quellen mit Version 19 werden zurückgewiesen. Die Spezifikationen ohne feste Tonart behalten die historische Zufallsfolge. [ADR 0048](../decisions/0048-tonsatz-aufgaben-mit-drei-festen-tonarten.md) beschreibt Versionierung und Grenzen. Dies bleibt technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**.
- Vier Stimmen im Klaviersystem. Die gewählte Stimme erhält zusätzlich ein editierbares Notensystem für Tippen, Ziehen und Pfeiltasten/Screenreader. Taktwahl, Vorzeichen, Löschen, Rückgängig/Wiederholen und Zurücksetzen erhalten die vorgegebenen Stimmen.
- Gesamt- und Solo-Wiedergabe der Eingabe; eine mögliche Lösung wird erst nach Wertung oder angeforderter Lösung sichtbar und abspielbar. Der vorhandene Audio-Lebenszyklus stoppt bei Verlassen/Hintergrund und verhindert verspäteten Start.
- Die Vorprüfung markiert aktuelle und bei Bewegungsregeln vorherige Noten. Textliche Befunde nennen Takt, Stimmen, Schweregrad und Grund. Befunde lassen sich auswählen; Bearbeiten entfernt die veraltete Anzeige. Vorprüfung zählt im Lektionenablauf als Hilfe und wird bei deaktivierten Hilfen nicht angeboten.
- `check_voice_leading` hat keine frei wählbaren Score- oder Regelargumente. Es liefert ausschließlich den serverseitig aus Lektion, Version und Seed rekonstruierten Befund zur geprüften Antwort. Nur Erklärungs-/Lösungsmodus; Hinweise und Chat erhalten weder das Werkzeug noch die Musterlösung. Ein Tutor-Modell darf diese Ergebnisse erklären, aber nicht die Bewertung ändern.
- Ein zusätzlicher interner Einstieg unter **Üben → Satzaufgaben öffnen**, Route `/part-writing`, ermöglicht die Erprobung ohne abgeschlossene Vorgängerlektionen. Er erzeugt keine Lernnachweise oder Belohnungen und speichert keine Eingaben über das Verlassen hinaus. Im regulären Lernpfad gelten die Voraussetzungen weiter.
- Produktionsbuilds verwenden weiterhin den gefilterten öffentlichen Katalog; Einstieg und Aufgaben sind darin nicht verfügbar. Der öffentliche Katalog hat weiterhin **0 Lektionen**.

## Expliziter Aufgabenrahmen

Vier Takte, je eine ganze Note pro Stimme und Takt (EN-GB: semibreve), Tonarten C-, F- und G-Dur. Stufe 4 verwendet T–S–D–T / I–IV–V–I; Stufe 5 T–S–D7–T / I–IV–V7–I. Die Funktionen sind **vorgegeben**, keine automatische Funktionsanalyse und keine Entscheidung über die allgemeine F03-Konvention.

Profil `p4.10-root-position-v1`:

- Grundton im Bass, Dreiklänge vollständig. Bei D7 sind Grundton, Terz und Septime verlangt; die Quinte darf fehlen. Nach einem D7 (Stufe 5) darf auch die abschließende Tonika ohne Quinte stehen (verdreifachter Grundton); in Stufe 4 bleibt der Dreiklang vollständig. Enharmonisch anders geschriebene Töne gelten nicht automatisch als derselbe Akkordton.
- Umfänge in wissenschaftlicher Oktavnotation: Bass E2–C4, Tenor C3–G4, Alt G3–D5, Sopran C4–G5.
- Fehler: parallele reine Quinten/Oktaven/Einklänge, Stimmkreuzung, Übergreifen, Oberstimmenabstand über Oktave, überschrittener Umfang, verdoppelter Leitton und übermäßige Sekundschritte. Am markierten D–T-Übergang: Leitton einen Schritt aufwärts oder, nur in Alt und Tenor, eine Terz abwärts zur Quinte der Tonika (Engine-Modus `up-or-frustrated-inner`, verbreiteter Lehrbuchstandard; Quellen nur als Suchauszüge belegt, F05 offen), Akkordseptime einen Schritt abwärts.
- Warnungen: verdeckte Quinten/Oktaven der Außenstimmen mit Sopransprung und Melodiesprünge über die Oktave. Warnungen verhindern keine positive Aufgabenwertung. Gegenbewegungsregeln sind in diesem Profil nicht eingeschaltet.
- Eine positive Wertung bedeutet nur, dass die Bedingungen dieses **Entwurfsprofils** erfüllt sind. Mehrere Aussetzungen werden akzeptiert; kein Vergleich allein mit einer Musterlösung. Die Auswahl der Regeln und Schweregrade bleibt fachlich zu prüfen.

Freie Rhythmen, Umkehrungen, Durchgangsdissonanzen, weitere Stilprofile und freie Funktionsdeutung sind nicht Teil dieser sechs Einführungsaufgaben. Die bestehende [lokale Satzwerkstatt](stimmfuehrung-entwurf.md#lokale-satzwerkstatt) bleibt für frei eingegebene Notation und explizite Regelkonfiguration verfügbar.

## Technische Nachweise

- Exercise-Tests prüfen alle sechs Varianten in drei Tonarten, echte alternative Lösungen, unvollständige/manipulierte Eingaben, Schreibweise, Notations-/Audiostruktur und DE/EN-Hinweise.
- Katalogtests prüfen Stufen-/Voraussetzungszuordnung, serverseitige Quellenrekonstruktion, reguläre Wiederholungen und Ausschluss aus dem öffentlichen Katalog.
- Ergänzende Tests prüfen die drei unterschiedlichen Kernaufgaben über numerische und textliche Seeds, vollständige Fehlerdurchgänge, unveränderte Erstversuchsquote nach erfolgreicher Wiederholung, serverseitig rekonstruierte Erst-/Wiederholungsquellen und Ablehnung der alten Aufgabenfassung. Der Tutor-Smoke rekonstruiert alle 18 Kernaufgaben und ihre Wiederholungen; historische RNG-Folgen sind separat festgehalten.
- Tutor-Smoke prüft Werkzeugargumente, Modusgrenzen, unveränderte Regelwahl, keine ungeprüfte Antwortprosa und einen lokalen SDK-Werkzeug-Rundlauf mit tatsächlichen Engine-Befunden. Das Modell wird dabei simuliert; keine Anbieteranfrage.
- Browserprüfungen verwenden den echten lokalen Expo-Webbuild: DE/EN-US/EN-GB, schmale und breite Ansichten, Tastatureingabe, gesperrte Stimmen, Rückgängig, Befunde, vollständige Stufe-5-Aufgabe, Tutor-Einstieg und Axe-Prüfung.
- Der erweiterte Stufe-5-Browserablauf bearbeitet nacheinander C-, F- und G-Dur und prüft dabei die leere Eingabe und gesperrte Abgabe nach jedem Aufgabenwechsel.
- Die Migration erhöht ausschließlich die Prompt-Versionsvorgabe auf 5; Werkzeugversion 3. Sie wird hier nicht auf eine entfernte Datenbank angewendet.

### Technischer Prüfstand vom 26.10.2026

40 gezielte Exercise-/Lektions-/Ratingtests, 213 Inhalts-/Adaptiv-/Nachweistests, sechs App-Tests und vier Chromium-Abläufe sind erfolgreich. Der Tutor-Smoke umfasst 420 Prüfungen mit ausschließlich simuliertem Anbieter. Die Inhaltsprüfung bestätigt 194 interne und null freigegebene Lektionen; der tatsächlich erzeugte Produktions-Webexport enthält keine Entwurfsdaten. Lint, Typprüfung und Übersetzungs-/Planprüfung sind erfolgreich. Der zuvor veraltete FSRS-Deno-Sollwert wurde auf den vorhandenen Umfang von 1866 Aufgaben aktualisiert.

Ein erster Gesamtlauf fand den noch nicht ergänzten Ratingparameter; derselbe Fehler stoppte den ersten Vorschau-Browserlauf beim Start. Nach Ergänzung der Ratingprofile sind die betroffenen Inhaltsprüfungen und alle vier Abläufe auf einem frisch erzeugten Webexport erfolgreich. Die Ergebnisse bleiben technische Nachweise.

## Einführung: Weiterbau vom 26.10.2026

`codex/p4-10-introduction-draft` baut auf dem offenen Entwurfs-PR #118 mit fünf erfolgreichen CI-Jobs auf. Dies ist ausdrücklich **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe**. P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt.

- Die sechs Einführungskarten zeigen jeweils einen vierstimmigen Akkord auf zwei Systemen: C-Dur in Stufe 4, G7 im bestehenden begrenzten Entwurfsprofil in Stufe 5. Vier Stimmen klingen gleichzeitig je eine ganze Note. Die eigenen DE/en-US/en-GB-Beschriftungen erklären Anordnung und Dauer über Glossarverweise.
- Der interne Einstieg zeigt vor den Aufgaben dieselbe `LessonIntroduction` wie der reguläre Lernpfad. Klangbeispiel und expliziter Start führen in den vorhandenen Drei-Aufgaben-Durchgang. Verlassen der Einführung zeigt keine Aufgabe und erzeugt keinen Lernnachweis; erneutes Öffnen zeigt die Einführung neu.
- Mehrstimmige Beispiele werden in Einführung und Artikelansicht mit dem allgemeinen Notensatz dargestellt. Die bisherigen einfachen Lernbilder behalten ihre Darstellung. Die Pipeline prüft rhythmische Gültigkeit und Layoutunterstützung; mehrstimmige Klaviatur-Lernbilder werden weiterhin abgewiesen.
- Karten/Lektionen und Katalog/Fähigkeitsplan tragen Version 23. Übungssätze und Ratingquellen bleiben Version 22. Alte Lektionsquellen 19/22 sowie gebundene Altpläne werden zurückgewiesen; lokale Stufe-5-Vorschauentwürfe mit Katalogversion 22 müssen neu gestartet werden. [ADR 0051](../decisions/0051-vierstimmige-einfuehrung-fuer-satzaufgaben.md).
- 1371 Inhaltsprüfungen, 17 gezielte App-/Wiedergabetests, 252 Werkzeugtests und 456 Tutor-/SDK-Prüfungen sind erfolgreich. Der Tutor läuft dabei ausschließlich mit simuliertem Anbieter. Vier Browserabläufe prüfen Einführung, vier lesbare Stimmen, tatsächlichen Klangstart, regionale Begriffe, Axe und den anschließenden Editor; der Stufe-5-Durchgang bearbeitet weiter C-, F- und G-Dur.

Die neuen Akkordbeispiele und Beschriftungen bleiben fachlich ungeprüfte Entwürfe. Der öffentliche Katalog enthält weiterhin null Lektionen; der tatsächliche Produktionsexport wird auf Entwurfsdaten geprüft. Keine Veröffentlichung.

## Tutor-Kontext: Weiterbau vom 26.10.2026

`codex/p4-10-tutor-context-draft` baut auf dem offenen Entwurfs-PR #124 mit fünf erfolgreichen CI-Jobs auf. Die technische Nacharbeit entkoppelt die Tutor-Sichtbarkeit vom Clientfeld `checked`. Der Erklärmodus verlangt eine übergebene Antwort und wertet sie mit der serverseitig rekonstruierten Aufgabe aus; beide Flagwerte führen zum selben Kontext. Dies bestätigt keinen früheren lokalen Bewertungsklick. Hinweise und Chat erhalten unabhängig vom Flag keine Bewertungsfelder oder versteckten Hörbeschreibungen; das SATB-Werkzeug bleibt dort gesperrt.

Die App verwendet im Chat dieselbe konservative Notenbildauswahl wie bei Hinweisen. Bestehende „Warum?“-Abläufe, expliziter Lösungsmodus, Regeln, Quellen sowie Katalog/Fähigkeitsplan Version 24 bleiben unverändert. `checked` bleibt im bestehenden Request-/Gesprächsformat als UI-Metadaten erhalten. Keine Migration, Lernnachweise oder Belohnungen; gespeicherte alte Antworten/Replays werden nicht nachträglich bereinigt.

Sieben Request-/Scope-/Versionsprüfungen, zwölf App-Tests, 930 simulierte Deno-Tutor-/SDK-/Engine-Prüfungen und 265 Werkzeugtests sind erfolgreich. Die Probe vergleicht alle 28 Aufgabentypen in drei Sprachen und alle 36 P4.10-Erst-/Wiederholungsquellen. Der angepasste authentifizierte HTTP-Test wird durch die neue CI geprüft; er wurde lokal nicht erneut ausgeführt. Typecheck, Lint/Paketgraph und Sprach-/Inhalts-/Formatprüfung sind erfolgreich. Dies bleibt technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**, ohne Fach-/Modell-/Geräteabnahme oder Veröffentlichung. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt. [ADR 0057](../decisions/0057-tutor-kontext-nach-modus-und-serverwertung.md).

## Offene Abnahmen

Unabhängige Literatur-/Fachprüfung der Aufgaben, Referenzsätze, Alternativwertung, Umfänge, Schweregrade und DE/EN-Erklärungen; F03/F05; reales Tutor-Modell mit Quellenprüfung; reale iOS-/Android-Geräte einschließlich Noteneingabe, Screenreader und Audio; formale Phase-4-Start-/Produktfreigabe. Der Quellenentwurf und dessen Grenzen stehen in [P4.09-Quellenentwurf](../quality/p4-09-quellenentwurf.md). Keine dieser Abnahmen wird aus grünen technischen Tests abgeleitet.
