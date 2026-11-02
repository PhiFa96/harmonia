# ADR 0069 – Chor ohne erkannte Tonhöhe erneut aufnehmen oder überspringen

Datum: 02.11.2026 · Status: angenommen für interne technische Vorarbeit

## Ausgangspunkt

Befund C9: Ein laufender PCM-Datenstrom kann vollständig still sein oder ausschließlich instabile Tonhöhen liefern. Bisher erzeugte der Chor-Runner nach vollständiger zeitlicher Abdeckung auch dann eine Antwort mit 96 leeren Tonhöhenfenstern. Diese Antwort war prüfbar und zählte anschließend als Fehlversuch. Stille beweist keinen Mikrofondefekt und ist von einem fehlenden Datenstrom zu unterscheiden (ADR 0047).

## Entscheidung

- Arbeitsbranch `codex/choir-no-pitch-retry` basiert auf `main` bei `f7bc15d`, unabhängig von den offenen Entwurfs-PRs #136, #137 und #141. C8/Vorzeichenlesen und C12/Vorhörfehler bleiben getrennte Änderungen.
- Der Collector stellt zusätzlich fest, ob mindestens ein akzeptierter Tonhöhenwert in einem der bestehenden Bewertungsfenster vorliegt. Vorzähler, Notenränder, Werte außerhalb des Stücks sowie ungültige oder außerhalb des bestehenden Wertebereichs liegende Tonhöhen erfüllen diese Bedingung nicht. Der Zustand ist flüchtig.
- Der Aufnahmeabschluss prüft zuerst die vollständige PCM-Abdeckung. Datenlücken bleiben eine Unterbrechung. Bei vollständigen Daten ohne einzigen akzeptierten Tonhöhenwert stoppen Begleitung und Mikrofon mit dem eigenen Hinweis `no-pitch`; es entsteht keine neue Antwort und keine Wertung.
- DE/en-US/en-GB erklären die fehlende auswertbare Tonhöhe und bieten den vorhandenen Weg zum Wiederholen oder bewussten Überspringen. Der Aufnahmebutton heißt in diesem Zustand „Durchlauf wiederholen“. Die Aufgabe wird nicht automatisch übersprungen oder weitergeschaltet. Wiederholungen erzeugen weiterhin keine Lern-/Antwortaktion, solange der Nutzer keine prüfbare Antwort prüft beziehungsweise ausdrücklich überspringt.
- Beim Fortsetzen wird auch ein bereits gespeicherter, noch ungeprüfter Take mit ausschließlich leeren Tonhöhenfenstern vor der Bedienbarkeit von „Prüfen“ geleert und mit demselben Hinweis versehen. Die aktuelle Aufgabe bleibt offen. Bereits geprüfte Ergebnisse und teilweise erkannte ungeprüfte Takes bleiben erhalten.
- Schon ein einzelner akzeptierter Wert erhält die bisherige prüfbare Antwort. Lückenhafte oder falsch gesungene Takes werden nach den bestehenden Erkennungs-, Treffer-, Cent- und Oktavregeln bewertet. Die Erkennungsschwellen werden nicht verändert.
- Ein leerer Take erfüllt die Mindest-Gesangsbedingung nicht. Bewusstes Überspringen verwendet den bestehenden gemeinsamen Client-/Serverpfad ohne Fehlerwertung. Ohne anrechenbar bestandenen eigenen Erstversuch gibt es weiterhin keinen Chorabschluss oder dessen XP, auch wenn alle Wiederholungsfragen richtig sind.

## Kompatibilität und Nachweise

Die Änderung liegt vor der Antworterzeugung neuer Aufnahmen beziehungsweise vor dem Prüfen eines fortgesetzten leeren Takes. Generatoren, Aufgaben, musikalische Bewertung sowie Antwort-, Speicher-, Sync- und Retentionsformate bleiben bestehen. Katalogversion auf dieser Basis weiter 27; keine Migration, neue Rohaufnahme, parallele Antwortablage oder neue Anbieteranfrage. Historisch bereits geprüfte Antworten mit leeren Fenstern bleiben mit ihrer bisherigen Fehlerwertung rekonstruierbar; sie werden nicht rückwirkend zu einem Skip. Eine all-leere übergebene Altantwort kann weiterhin keinen Gesangsabschluss belegen. C8/Version 28 liegt separat in PR #137 und wird hier nicht eingeführt oder zurückgesetzt.

Zwei Runner-Regressionen sind am alten Stand rot: vollständig stille beziehungsweise instabile Eingaben mit vollständiger PCM-Abdeckung erzeugen eine Antwort. Die Korrektur verhindert beide Antworten; erneute Aufnahme, ein erfolgreicher Take und die Abweisung alter Callbacks sind geprüft. Ein eigener Grenzfall hält einen Take mit genau einer erkannten Tonhöhe prüfbar. Collector-Prüfungen trennen Transportabdeckung, gültige Bewertungsfenster und die Kompatibilität historischer Antworten. Die bestehenden 44 Chorabschluss-Prüfungen decken Skip, Quote, Mindestgesang, Client-/Serverrekonstruktion und gekürzte Nachweise ab. Browserfälle verwenden lebendes Null-PCM durch den unveränderten echten Analyser/Pitch-Tracker und prüfen in allen drei Sprachfassungen Wiederholen, unveränderte Aufgabenposition, gesperrtes Prüfen und bewusstes Überspringen. Der konkrete Ausführungs-/CI-Stand wird im Entwurfs-PR festgehalten.

Drei weitere Oberflächenregressionen weisen den fortgesetzten leeren Take zunächst als weiterhin prüfbar nach. Nach der Korrektur bleiben in DE/en-US/en-GB Antwortprotokoll und Skip-Liste leer, bis der Nutzer bewusst überspringt. Sechs weitere Fälle prüfen die unveränderte Wertung eines teilweise erkannten Takes und den Erhalt bereits geprüfter historischer Leerantworten samt Rückmeldung.

## Grenzen

Die Meldung behauptet keinen Hardwaredefekt. Auch leises Singen, Nebengeräusche, kurze oder außerhalb der bewerteten Abschnitte gesungene Töne können ohne verwertbare Erkennung enden. Der Clientnachweis belegt weiterhin keinen tatsächlichen menschlichen Gesang. Reale Mikrofon-/Stimmen-/Kopfhörer-/iOS-/Android-/Web-Geräteabnahmen sowie unabhängige Fach-/Sprachprüfung bleiben offen. C4 (Alt-Varianten) und C13 (Zeitzuordnung auf Geräten) bleiben gesonderte Befunde.

Technische P4-Vorarbeit auf Nutzerauftrag **vor der formalen Phase-4-Freigabe**. Alle Inhalte bleiben `entwurf`; kein Merge, Deployment oder Veröffentlichen. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt.
