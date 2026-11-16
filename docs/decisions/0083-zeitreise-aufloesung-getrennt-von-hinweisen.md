# ADR 0083 – Zeitreise-Auflösung getrennt von Hinweisen

Datum: 14.11.2026. Status: interne technische Entwurfsentscheidung; unabhängige didaktische, Fach-, Quellen- und Sprachprüfung offen.

## Anlass

Die integrierte Fachprüfung v3 benennt bei P4.12 die fast lösungsverratende zweite Hinweisstufe als offene didaktische Nacharbeit. ADR 0071 erlaubt bewusst, Hinweis 2 bereits nach dem ersten Fehler ausdrücklich anzufordern. Unterstützung soll weiterhin ohne einen zusätzlichen absichtlichen Fehlversuch erreichbar sein.

Auf Nutzerauftrag entsteht auf `codex/history-hints-solution-draft` eigenständig auf `main@ab157e81` technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**. Die offenen Entwürfe #151 und #156–#161 sind keine Abhängigkeiten. Keine Veröffentlichung oder Main-Integration; P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt.

## Entscheidung

- Die acht zweiten Hinweise erhalten eigene DE/en-US-Texte, die zum Vergleichen, Verfolgen oder Zählen auffordern. Sie nennen weder die passende Option noch das konkrete Ergebnis der Beobachtung. en-GB übernimmt diese gemeinsamen Formulierungen; bestehende britische Schreibweisen in anderen Texten bleiben erhalten. Die erste Hinweisstufe, Fragen, Antworten, Erklärungen, Rollen, Quellen und alle acht synthetischen Klangmodelle bleiben erhalten.
- Hinweis 1 folgt weiterhin automatisch auf den ersten Fehler. Hinweis 2 folgt auf einen weiteren geprüften Fehler oder eine ausdrückliche Anforderung nach dem ersten. Diese Regel aus ADR 0071 bleibt bestehen. Beide Hinweise sind Unterstützung; ihre didaktische Eignung ist nicht durch automatische Prüfungen freigegeben.
- Erst nach Hinweis 2 erscheint eine gesonderte Aktion „Auflösung ansehen“ / „Show solution“. Sie öffnet die richtige Antwort und die vorhandene vollständige Erklärung. Der flüchtige Fragezustand wechselt zu `revealed`, niemals zu `correct`. Auswahl, Versuche und Hinweisstufe bleiben erhalten; eine vorher falsch gewählte Option wird nicht heimlich durch die Lösung ersetzt. Auch eine inzwischen ungeprüft richtig gewählte Antwort bleibt eine angesehene Auflösung.
- Die Rückmeldung benennt ausdrücklich „Auflösung angesehen“ / „Solution viewed“. Die ursprüngliche Auswahl steht zusätzlich als „Deine Auswahl“ / „Your choice“ im Text, da deaktivierte Knöpfe die Auswahl visuell kaum unterscheiden. „Mit Auflösung weiter“ / „Continue after viewing solution“ erlaubt den nächsten Schritt. Auswahl, Prüfen und erneute Hilfsaktionen sind danach gesperrt. Eine selbst richtig geprüfte Antwort bleibt `correct`; sie wird durch Auflösungsaktionen nicht umetikettiert. Hinweise und die Überspringen-Aktion verschwinden in beiden abgeschlossenen Fragezuständen.
- Für Hörfragen gilt dieselbe Freigabe wie beim Prüfen: Ohne erfolgreich gestartete Wiedergabe darf keine Auflösung geöffnet werden. Wiedergabefehler geben keine Antwort frei. Ein Wiedergabestart belegt weiterhin kein vollständiges Anhören; ausdrücklich überspringen bleibt vor dem Frageabschluss möglich.
- Weiter, Zurück und Stationswechsel beginnen mit einem leeren Fragezustand. Die Anwendung schreibt weder Versuche noch Auflösungsaufrufe, Fortschritt, XP oder sonstige Lernnachweise. Es gibt keine neue Speicherung oder Telemetrie.
- Katalog/Fähigkeitsplan bleiben **31**, der verlinkte Quellenartikel **30**. Es ändern sich isolierte Zeitreise-Hinweise und flüchtige Bedienzustände, keine gespeicherten Lektions- oder Quellenverträge. Kein Versionswechsel oder Neustart gespeicherter Lektionen ist dafür nötig.
- Development/Preview erhalten die vier Entwurfsstationen. Production und EAS-Beta behalten ihre leeren öffentlichen Aliase. Der vorhandene Bundleguard erfasst dynamisch alle rohen und aufgelösten neuen Hinweise in allen drei Sprachen sowie die Partituren. Allgemeine Oberflächenbeschriftungen enthalten keine Stationslösung. Öffentlich bleiben null Lektionen freigegeben.

## Nachweise und Grenzen

Portable Tests prüfen die Freigabebedingungen, beide Hinweiswege, unveränderte Auswahl/Versuche, ungeprüfte Auswahl, Endzustände und Rücksetzung. App-Tests durchlaufen alle vier Stationen und beide Fragearten in DE/en-US/en-GB; sie unterscheiden richtige Antworten von angesehenen Auflösungen. Browserproben prüfen den tatsächlichen Vorschau-Webexport einschließlich Audiofreigabe, gesperrter Auswahl, Rückkehr, Axe und schmaler Darstellung. Deno führt den Auflösungsweg für alle acht Fragen aus. Der tatsächliche Produktions-Export und seine leeren Routen bleiben in der erforderlichen CI geprüft. Konkrete Testergebnisse und alle fünf CI-Jobs am finalen Commit stehen im Entwurfs-PR.

Die bisherigen Prüfberichte bleiben als Berichte ihrer Prüfstände erhalten. Die neuen Hilfen brauchen eine unabhängige didaktische, Fach- und Sprachprüfung; die vorhandene Quellenbindung ersetzt keine Volltextprüfung der Primärliteratur. Reale Geräte-, Hör- und Screenreaderabnahmen bleiben offen. Die vier Stationen und ihre Texte bleiben `entwurf`; dies ist keine fachliche oder formale Phase-4-Freigabe.
