# ADR 0047 – Choraufnahme nur mit vollständigem Datenfluss werten

Datum: 26.10.2026 · Status: angenommen für interne technische Vorarbeit

## Ausgangspunkt

Die P4.11-Nacharbeitsliste nennt Mikrofon-Datenverlust als mögliche Ursache falscher Gesangswertungen. Eine erteilte Berechtigung und ein gestarteter Recorder beweisen keinen laufenden PCM-Datenstrom. Der ursprüngliche Collector unterschied fehlende Pakete nicht von vorhandenen Paketen ohne stabil erkannten Ton. Zudem konnten Browser-Mute/Context-Unterbrechungen unbemerkt bleiben und wiederholte native Stop-Aufrufe zu früh zurückkehren.

## Entscheidung

- Auf `codex/p4-11-capture-reliability-draft`, basierend auf dem vollständig grünen Entwurfsstand #111, wird die Aufnahme technisch abgesichert. Kein Merge, Deployment oder Veröffentlichungsangebot.
- Der Chor-Trainer zeigt nach Mikrofoninitialisierung eine eigene Eingangsprüfung. Vor dem ersten gültigen PCM-Fenster starten weder Begleitung noch Vorzähler. Stoppen, Hintergrund und Navigation können auch diese Wartephase abbrechen; ein später Callback startet keinen alten Durchlauf neu.
- Technische Transportgrenzen: fünf Sekunden ab Initialisierung ohne gültiges Fenster und eine Sekunde seit dem letzten gültigen Fenster. Diese Fristen betreffen Datenverfügbarkeit, weder Lautstärke noch Tonhöhensicherheit oder musikalische Leistung. Der Bereitschaftstest prüft nicht während eines noch offenen Berechtigungsdialogs.
- Fenster müssen die Pitch-Tracker-Größe, endliche Werte, zulässige Samplerate und nicht rückläufige Zeitstempel haben. Ein Sampleratenwechsel beendet den Take. Gleiche Zeitstempel bleiben für Browser mit gerundeter Zeitmessung erlaubt. Die Prüfung vor Annahme eines neuen Fensters verhindert, dass ein verspätetes Paket einen bereits unterbrochenen Take wiederbelebt.
- Der Collector erfasst zusätzlich, ob für jedes der bestehenden 12 Bewertungsfenster jeder Note mindestens ein gültiges PCM-Fenster angekommen ist. Fehlende Transportabdeckung verhindert die Antwort auch bei kurzen Lücken, die den Einsekunden-Watchdog noch nicht auslösen. Diese Maske ist flüchtig und gehört nicht zum Antwortformat. Vorhandene Stille zählt als Datenfluss; fehlende Tonhöhenerkennung wird weiterhin nach dem unveränderten fachlichen Profil bewertet.
- Bei erkannten Unterbrechungen: Wiedergabe und Aufnahme stoppen, keine neue Antwort oder Teilwertung erzeugen, Grund anzeigen und vorhandene Wiederholungs-/Überspringwege beibehalten. Die Mindestzahl gesungener Aufgaben, Cent-Toleranzen, Oktavregel und Hint-/Skip-Regeln werden hier nicht entschieden oder verändert.
- Web-Capture meldet Ende, Mute nach Datenbeginn, deaktivierte Tracks und Context-Unterbrechung genau einmal und räumt selbst auf. Ein anfänglich stummer Track liefert keine vorgetäuschten Fenster. Native SDK-Fehler schließen Recorder und Callbacks ebenfalls selbst.
- Wiederholte Stop-Aufrufe warten auf dieselbe tatsächliche Schließoperation. Dadurch kann ein alter nativer Audio-Session-Abschluss nicht erst nach einer neuen Aufnahme die Playback-Konfiguration wiederherstellen.
- Die Anzeige aktualisiert nur Phasen-, Noten- und Beatwechsel. Der 50-ms-Watchdog bleibt aktiv, ohne bei jedem Tick die Partitur neu rendern zu lassen.
- DE/en-US/en-GB erklären Eingangsprüfung und fehlende Daten. Keine neuen Rohaufzeichnungen, Gerätekennungen, Datenbankfelder, Synchronisations- oder Analyseereignisse. Das KI-Inventar bindet die zusätzlichen Capture-/Runner-Pfade; seine Einstufungen bleiben offen.

## Grenzen

Ein Gerät, das bei physischem Ausfall weiterhin plausible stille PCM-Fenster mit lebendem Track liefert, ist damit nicht von echter Stille unterscheidbar. Kopfhöreranschluss, Mikrofonqualität, Intonation und tatsächliche Ein-/Ausgangslatenz werden nicht technisch freigegeben. Die vollständige PCM-Abdeckung ist konservativ und kann bei verzögerter JS-Verarbeitung einen erneuten Take verlangen. Die Fristen und das Verhalten müssen auf echten iOS-/Android-/Web-Geräten abgenommen werden; synthetische Signale sind keine Geräteabnahme.

Technische P4-Vorarbeit findet auf Nutzerauftrag **vor der formalen Phase-4-Freigabe** statt. Musik und fachliche Auswertung bleiben Entwurf. P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt.
