# ADR 0081: Chorfenster nach Erfassungsart zeitlich zuordnen

Datum: 14.11.2026 · Status: als beauftragte interne technische Vorarbeit umgesetzt.

## Ausgangslage

[Chor-Hinweis 4 der v3-Prüfung](../quality/fachpruefung-phase-4-v3/chor.md) benennt den nach dem Vorzähler eingefrorenen Uhrenversatz. Er erhält verspätete native Fensterpakete, berücksichtigt aber keine unterschiedlichen Taktraten. Der Browser liest dagegen im Callback ein aktuelles Analyser-Fenster. Der gemeinsame feste Versatz kann diese Momentaufnahmen in falsche Bewertungsfenster verschieben. Die echte Zeit-/Latenzabnahme C13 bleibt offen.

## Entscheidung

1. `OnPcmFrame` kennzeichnet frische Fenster als `snapshot`, gepufferte native Fenster als `buffered`. Der Zeitstempel bezeichnet das Fensterende. Fehlende Kennzeichnung bleibt für bestehende Aufrufer gepuffert; ein Wechsel innerhalb des Takes ist ungültig. Die Kennzeichnung bleibt flüchtig, ohne Antwort-/Speicher-/Telemetrieänderung.
2. **Browser:** Der Adapter liest die Aufnahme-Audiouhr statt `performance.now()`. Jeder synchron frisch gelesene Analyser-Callback wird neu mit der Wiedergabe-Audiouhr gepaart. Kein Fortschreiben eines anfänglichen Versatzes oder einer angenommenen gemeinsamen Taktrate. Mittelpunkt, gemeldete Ausgangslatenz und manueller Zeitversatz werden danach wie bisher berücksichtigt.
3. **Native Aufnahme:** Das gepinnte SDK `react-native-audio-api` 0.13.6 liefert in `AudioRecorderCallback::invokeCallback` den Zähler des ersten Samples (`framesEmitted_ / sampleRate_`). Der Adapter addiert die tatsächliche Blockdauer, bevor `PitchFramer` Fenster-Endzeiten daraus bildet. Aufgeteilte und gebündelte Blöcke behalten ihre Sample-Abstände. SDK-Upgrades brauchen eine erneute Prüfung dieser Konvention.
4. **Gepufferte Zuordnung:** Während Eingangsprüfung/Vorzähler bleibt der kleinste beobachtete Versatz maßgeblich, danach bleibt er fest. Callback-Ankunft allein kann native Drift nicht von Warteschlangenverzögerung unterscheiden; daraus wird keine automatische Korrektur errechnet. Die bestehende Aufnahme mit drei gemeinsam um 200 ms verspäteten Fenstern bleibt gültig.
5. **Plausibilität:** Nicht endliche, negative oder rückläufige Wiedergabezeiten und Erfassungsartwechsel beenden ohne Antwort. Gepufferte Fenster dürfen höchstens eine halbe Bewertungsfensterbreite vor der Wiedergabeuhr liegen; ab einer Sekunde Alter wird der Take beendet. Die halbe Breite ist `120 / bpm × 0,7 / 12 / 2`, die Altersgrenze die bestehende Transport-Lückengrenze. Das sind technische Entwurfsgrenzen, keine neuen Intonationsregeln. Ein neuer Take erhält einen neuen Uhrenzustand.
6. **Abbruch und Wiederaufnahme:** Eigene DE/en-US/en-GB-Meldung, Wiederholung und bestehendes bewusstes Überspringen. Bei ungültiger Ausgangsuhr stoppt und trennt die Audio-Engine Stimmen sofort, statt ungültige Ausblendzeiten zu planen. Der Runner schließt das Mikrofon auch bei fehlschlagendem Wiedergabe-Stopp.

## Folgen und Grenzen

Katalog/Fähigkeitsplan 31, Miniaturen, Tempoauswahl, Wertung und Antwort-/Speicher-/Sync-Formate bleiben unverändert. Keine Audioablage, Uploads, neuen Gerätekennungen, Migration oder Analytics-Ereignisse. Alte bewertete Antworten werden nicht umgedeutet; geänderte Codebindungen erfordern neue private Prüfmappen.

Browser-Snapshots werden gegen unterschiedliche Uhrenraten abgesichert. Native Drift innerhalb des nicht unterscheidbaren Warteschlangenbereichs und physische Ein-/Ausgangslatenz sind damit nicht gemessen oder korrigiert. Reale iOS-/Android-/Web-Aufnahmen, Bluetooth/Routenwechsel, Stimmen, Kopfhörer und Screenreader bleiben abzunehmen. Synthetische Tests belegen diese Geräteabnahmen nicht.

Technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**. Alles bleibt Entwurf, keine Veröffentlichung oder Main-Integration. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt. [Übergabe und Tests](../plan/chor-zeitzuordnung.md).
