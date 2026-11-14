# P4.11 – Zeitzuordnung und sicherer Abbruch der Chor-Aufnahme

Stand: 14.11.2026 · Branch `codex/choir-clock-drift-draft` · eigenständig auf `main@ab157e8`.

Der Weiterbau bearbeitet [Chor-Hinweis 4 der v3-Prüfung](../quality/fachpruefung-phase-4-v3/chor.md) im Rahmen von C13. Frische Browserfenster erhalten eine laufende Zuordnung zur Wiedergabe; native Pakete behalten ihre Abstände. Unplausible Uhren führen zu einem vollständigen Abbruch ohne Wertung. **Technische P4-Vorarbeit vor der formalen Phase-4-Freigabe.** Inhalte bleiben Entwurf, keine Veröffentlichung oder Main-Integration. P4.01 bleibt bis F14/Rechtsklärung zurückgestellt. [ADR 0081](../decisions/0081-chorfenster-nach-erfassungsart-zeitlich-zuordnen.md).

## Implementierter Ablauf

| Erfassung | Zeitangabe | Zuordnung |
|---|---|---|
| Web, `snapshot` | Ende des frisch gelesenen Analyser-Fensters in der Aufnahme-Audiouhr | jeden synchronen Callback mit der aktuellen Wiedergabe-Audiouhr paaren |
| Native, `buffered` | SDK-Zähler des ersten Samples plus tatsächliche Blockdauer; `PitchFramer` bildet Fensterenden | kleinster Versatz während Prüfung/Vorzähler, danach fester Versatz; verspätete Pakete nicht an ihre Ankunft verschieben |

Die zusätzliche Callback-Kennzeichnung ist lokal und flüchtig. Bestehende Dreiparameter-Aufrufer gelten als gepuffert. Erfassungsartwechsel sind innerhalb eines Takes ungültig. Ein neuer Take verwirft den Uhrenzustand; die bestehende Revisionsprüfung verwirft alte Callbacks.

Die native Konvention wurde am gepinnten SDK 0.13.6 geprüft: `common/cpp/audioapi/core/utils/AudioRecorderCallback.cpp`, `invokeCallback`, setzt `when` vor dem Erhöhen von `framesEmitted_`. `PitchFramer.push` erwartet dagegen ein Blockende. Der Adapter berücksichtigt die tatsächliche Blocklänge auch bei Teil-/Mehrfachfenstern. Das offene SDK-Major-Upgrade #155 ist nicht enthalten und braucht eine erneute Konventionsprüfung.

Nach der Zuordnung gelten wie bisher Fenster-Mittelpunkt, gemeldete Ausgangslatenz und vorab gewählter manueller Versatz. Tonhöhenbestimmung, acht Noten, zwölf Fenster, exklusive 50-Cent-Grenze, 8/12-Abdeckung, 75-%-Regel und globale Oktavwahl ändern sich nicht.

## Fehler und Wiederaufnahme

- Nicht endliche, negative oder rückläufige Wiedergabezeiten und wechselnde Erfassungsart beenden den Take. Bestehende Aufnahmezeit-, Sample-Rate-, PCM-, Hintergrund- und Lückenprüfungen bleiben wirksam.
- Gepufferte Fenster mehr als eine halbe Bewertungsfensterbreite in der Zukunft oder mindestens eine Sekunde in der Vergangenheit beenden den Take. Zukunftsgrenze aus Tempo und bestehendem 70-%-/Zwölf-Fensterbereich, Altersgrenze aus dem Transportprofil; keine empirisch abgenommene Latenzkorrektur.
- Ohne verlässliche Zuordnung entsteht keine Antwort und kein Fehlversuch. Eigene DE/en-US/en-GB-Meldung, „Durchlauf wiederholen“ und weiterhin bewusstes Überspringen. Nur ein ausdrücklich neuer Gesangstake ersetzt eine alte ungeprüfte Antwort.
- Der Runner schließt das Mikrofon auch bei einer Ausnahme beim Wiedergabe-Stopp. Bei ungültiger Ausgangsuhr stoppt und trennt die Audio-Engine Stimmen sofort und beendet Metronomtimer; keine Ausblendung mit negativen oder nicht endlichen Zeiten.

## Nachweise

Acht Regressionen vor der Umsetzung reproduziert: Browser-Taktraten 0,98/1,02, unplausible Zeitangaben/Moduswechsel, rückläufige Wiedergabe und beide Adapter-Verträge. Drei weitere Audio-Regressionen reproduzierten fehlerhaftes Stoppen bei negativer/nicht endlicher Uhr. Die echte Browserprüfung deckte außerdem auf, dass ein solcher Stoppfehler die Mikrofonfreigabe verhindern konnte; beide Abbruchpfade sind abgesichert.

Gezielte Tests prüfen Uhrenursprünge/-raten, Rundung, Vorzählerkalibrierung, Paketabstände, technische Grenzfälle, Abbruch ohne Teilantwort, Mikrofonfreigabe und erfolgreichen neuen Take. Die bisherige um 200 ms gebündelt verspätete Aufnahme bleibt Teil der Runner-Suite. Native Fixtures prüfen geteilte und mehrere Fenster enthaltende SDK-Blöcke.

Drei zusätzliche Browserabläufe für DE/en-US/en-GB verwenden echte AudioContext-/MediaStream-/Analyser-/PitchTracker-Pfade mit eigenen synthetischen Sinustönen. Nur die beobachtete Aufnahmeuhr erhält anderen Ursprung und ±2 % Taktrate. Eine zurückspringende Wiedergabeuhr muss ohne Wertung stoppen; danach muss ein neuer Take alle acht Noten bewerten und 96 Fenster anzeigen. Meldung, Wiederholung, Eingangsfreigabe, schmales Layout und Axe werden geprüft. Keine reale Person wird aufgenommen.

Konkrete lokale Ergebnisse, endgültiger Commit und alle fünf Pflichtjobs stehen im eigenen Entwurfs-PR. Keine Tests, Zeitlimits, Schutzgates oder Wertungsprofile zur Freigabe abgeschwächt.

## Offene Abnahmen und Integration

Die echte Zeit-/Latenzabnahme **C13 bleibt offen**. Bei nativen Paketen lässt sich Drift aus der Callback-Ankunft nicht eindeutig von Warteschlangenlatenz unterscheiden; im zulässigen Bereich wird sie nicht automatisch korrigiert. Browser-Snapshots lösen diese Mehrdeutigkeit für ihren synchronen Erfassungspfad. Physische Ein-/Ausgangslatenz, Routenwechsel, Bluetooth, Paket-Zeitstempel sowie reale Geräte-/Stimmen-/Kopfhörer-/Screenreaderprüfungen bleiben zu messen.

Katalog/Fähigkeitsplan bleiben 31, Musik und Antwort-/Speicher-/Sync-Formate unverändert. Keine Audioablage, neuen Gerätekennungen, Telemetrie oder Uploads. Nach gemeinsamer Integration private KI-/Zertifikatsprüfmappen neu erzeugen. Stärkere Importbindung #157, Schulnacharbeit #151, Tutor #156 und Zertifikatsnacharbeiten #158/#159 sind separate offene PRs und hier nicht enthalten.

Bisherige Fachprüfungen vom 31.10. und 05.11.2026 bleiben dokumentiert. Dieser Weiterbau ersetzt keine unabhängige Fach-/Quellen-/Sprach-, Rechts-, reale Geräteabnahme oder formale P4-Freigabe. Öffentlich bleiben null Lektionen; P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.
