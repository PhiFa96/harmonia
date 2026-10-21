# P4.10 – Tonsatz-Korrektor als interner Entwurf

Stand: 21.10.2026. Arbeitsbranch: `codex/p4-10-part-writing-draft`.

## Auftrag und Freigabegrenze

Auf ausdrücklichen Nutzerauftrag findet **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe** statt. P4.10 baut auf dem P4.09-Branch und dessen Draft-PR #100 auf. Die technische Implementierung ersetzt weder die P3-Abnahmen noch F03, F05 oder eine unabhängige Fachprüfung. P4.01 bleibt bis zur Klärung von F14 und der rechtlichen Voraussetzungen zurückgestellt. Kein Merge, Deployment oder öffentlich freigegebener Inhalt ist Teil dieses Schritts.

## Implementierter Ablauf

- `VOICE_LEADING` ist ein regulärer, seedbarer Übungstyp mit Bewertung, Hinweisen, Wiederholungen, Quellenrekonstruktion und Ratingprofil.
- Sechs Entwurfslektionen: in Stufe 4 und 5 jeweils Bass vorgegeben, Sopran vorgegeben oder Funktionen vorgegeben; je drei Aufgaben. Eigene Einführungskarten und UI-Texte auf Deutsch, Englisch (US) und Englisch (UK).
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
- Tutor-Smoke prüft Werkzeugargumente, Modusgrenzen, unveränderte Regelwahl, keine ungeprüfte Antwortprosa und einen lokalen SDK-Werkzeug-Rundlauf mit tatsächlichen Engine-Befunden. Das Modell wird dabei simuliert; keine Anbieteranfrage.
- Browserprüfungen verwenden den echten lokalen Expo-Webbuild: DE/EN-US/EN-GB, schmale und breite Ansichten, Tastatureingabe, gesperrte Stimmen, Rückgängig, Befunde, vollständige Stufe-5-Aufgabe, Tutor-Einstieg und Axe-Prüfung.
- Die Migration erhöht ausschließlich die Prompt-Versionsvorgabe auf 5; Werkzeugversion 3. Sie wird hier nicht auf eine entfernte Datenbank angewendet.

## Offene Abnahmen

Unabhängige Literatur-/Fachprüfung der Aufgaben, Referenzsätze, Alternativwertung, Umfänge, Schweregrade und DE/EN-Erklärungen; F03/F05; reales Tutor-Modell mit Quellenprüfung; reale iOS-/Android-Geräte einschließlich Noteneingabe, Screenreader und Audio; formale Phase-4-Start-/Produktfreigabe. Der Quellenentwurf und dessen Grenzen stehen in [P4.09-Quellenentwurf](../quality/p4-09-quellenentwurf.md). Keine dieser Abnahmen wird aus grünen technischen Tests abgeleitet.
