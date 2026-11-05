# ADR 0068 – Vorhörfehler erhalten den ungeprüften Chor-Take

Datum: 02.11.2026 · Status: angenommen für interne technische Vorarbeit

## Ausgangspunkt

Befund C12 der Phase-4-Prüfung: Der gemeinsame Fehlerpfad im Chor-Runner setzte die Antwort auch beim Vorhören auf `null`. Eine misslungene Audiofreigabe oder eine spätere Audiounterbrechung konnte dadurch einen vollständig aufgenommenen, noch ungeprüften Take löschen. Der Start des Vorhörens behielt denselben Take zuvor ausdrücklich bei.

## Entscheidung

- Arbeitsbranch `codex/choir-preview-recovery` basiert auf `main` bei `f7bc15d`, unabhängig von den offenen Entwurfs-PRs #136 und #137. Keine Fortsetzung der früheren gestapelten Entwurfskette.
- Nur der ausdrücklich gewählte Start einer neuen Gesangsaufnahme ersetzt die bisherige Antwort. Dieser Start leert sie vor Audiofreigabe und Mikrofonöffnung; ein späterer Aufnahmefehler stellt keinen alten Take wieder her.
- Vorhören der eigenen oder aller vier Stimmen erzeugt und löscht keine Antwort. Das gilt für erfolgreiches Vorhören, Abbrechen, fehlgeschlagene Audiofreigabe, Wiedergabefehler und erkannte Unterbrechungen. Ein vorhandener Take bleibt prüfbar.
- Vorhörfehler stoppen die Wiedergabe und erhalten eine eigene DE/en-US/en-GB-Meldung: Eine vorhandene Antwort bleibt erhalten; Vorhören erneut versuchen oder Antwort prüfen. Fehler schon beim Erzeugen der Audioinstanz verwenden dieselbe Meldung.
- Eine erneute Nutzeraktion kann das Vorhören beziehungsweise die Aufnahme neu starten. Die bestehende serialisierte Mikrofon-Lebensdauer bleibt erhalten: Eine neue Aufnahme wartet auf das tatsächliche Schließen der vorherigen Sitzung. Alte Timer, Mikrofon- und asynchrone Start-Callbacks dürfen keinen späteren Durchlauf verändern.
- Unterbrochene oder unvollständige Aufnahmen erzeugen weiterhin keine neue Antwort oder Teilwertung. Vorhören bleibt ein Hinweis gemäß dem bestehenden Lektionsablauf; die Fehlerbehebung entfernt keine bereits gezählte Hilfe.

## Nachweise und Grenzen

Sechs Regressionen prüfen beide Vorhörarten gegen abgewiesenes `resume`, Fehler beim Planen und eine spätere Unterbrechung. Sie weisen am alten Stand das unerwünschte `answer(null)` nach. Weitere Runner-Fälle prüfen den bewussten Ersatz eines Takes, verweigerte Berechtigung, verzögertes Mikrofon-Schließen und verspätete alte Callbacks. Die Oberfläche prüft vorhandene Antworten, Fehlermeldung, erneutes Vorhören und nachfolgendes Prüfen in allen drei Sprachfassungen. Die Browserprobe verarbeitet einen synthetisch gesungenen Take, provoziert echte Browser-Kontextfehler und prüft anschließend weiterhin alle acht Noten.

Die vorhandenen Antwort-, Speicher-, Sync- und Bewertungsformate bleiben bestehen; keine neue Rohaufnahme, Datenbank oder Migration. Katalogversion auf dieser Basis weiter 27. Die von PR #137 ergänzte Version 28 ist eine getrennte Änderung und wird hier weder eingeführt noch zurückgesetzt. C9 (lebendes Null-PCM), C4 (Alt-Varianten) sowie echte Stimmen-/Mikrofon-/Kopfhörer-/Geräteabnahmen bleiben offen. Ein dauerhaft nicht verfügbares Audiogerät wird durch synthetische Tests nicht freigegeben.

Technische P4-Vorarbeit auf Nutzerauftrag **vor der formalen Phase-4-Freigabe**. Alle Inhalte bleiben `entwurf`; kein Merge, Deployment oder Veröffentlichen. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt. Der konkrete lokale und GitHub-Prüfstatus steht im Entwurfs-PR.
