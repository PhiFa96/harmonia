# ADR 0017 – Tutor-Oberfläche mit privater Sitzung und gezielter Wiederholung

**Status:** Angenommen für die technische Umsetzung; echte Modell- und Geräteabnahme ausstehend.

**Datum:** 14.10.2026

**Planpunkt:** P2.17

## Anlass

P2.15/P2.16 stellen Streaming, Engine-Werkzeuge und Quellen bereit. Die App benötigt einen Chat und aufgabenbezogene Erklärungen, ohne Bewertung, Hinweiszählung oder private Daten verschiedener Konten zu vermischen.

## Entscheidung

Ein eigener Tutor-Tab und die Aufgabenroute verwenden dieselbe Oberfläche. Eine falsche oder richtige bewertete Antwort öffnet „Warum?“ mit unveränderter Aufgabenquelle, Seed, Durchgang, Erstantwort und `checked: true`. Das vorhandene Notenbild bleibt sichtbar und wird im Verlauf aus derselben Quelle wiederhergestellt. Der Nutzer fordert die Erklärung ausdrücklich an; das Öffnen kostet keine Anfrage.

KI-Hinweise ergänzen erst einen bereits verwendeten festen Hinweis 1 oder 2 auf genau derselben Stufe. Erst nach dem festen Lösungshinweis 3 ist `solution` möglich. Bilder, die Schreib- oder Hörlösungen verraten, werden bei Hinweisen nicht übernommen. Die Engine bewertet weiter allein; KI-Aktionen erzeugen keine Bewertung, XP oder Freischaltung und verändern die 80-%-Erstversuchsregel nicht.

## Transport und Wiederholung

`expo/fetch` liefert einen lesbaren Antwortstrom auf Web, iOS und Android. Ein unabhängiger Decoder behandelt getrennte UTF-8-Zeichen, LF/CRLF und mehrzeilige SSE-Daten. Gemeinsame Zod-Schemas prüfen jedes Ereignis, Antwortgröße, Quellen und Metadaten; IDs müssen zur Anfrage passen. Ohne abschließendes `done` ist eine Antwort unvollständig. Eigene AbortController und Zeitlimits funktionieren auch ohne neuere Browser-AbortSignal-Hilfen.

Es gibt keine automatische kostenpflichtige Wiederholung. Nach Abbruch oder einem unklaren Abschluss ruft „Dieselbe Antwort erneut abrufen“ exakt dieselbe gespeicherte Anfrage-ID und denselben Körper ab. Das Backend kann einen gespeicherten Beleg wiedergeben, einen laufenden Auftrag melden oder einen terminalen Fehler zeigen. Eine neue Frage erhält eine neue ID. Die Quelle für Kontingent, Abo und Verfügbarkeit ist ausschließlich der Server.

## Private Daten und Verlauf

Chat, Teilantwort und ungesendeter Text bleiben nur im Arbeitsspeicher der App. Kontoabmeldung/-wechsel löscht den Zustand synchron und bricht laufende Streams ab; eine Generationsprüfung verwirft verspätete Antworten. Nur ein als Gast neu geöffneter Aufgabenauftrag darf nach Anmeldung übernommen werden. Alte Kontoantworten werden nicht lokal in SQLite oder im Einstellungsspeicher persistiert.

Der Server liefert beim Wiederöffnen die letzten 100 Nachrichten in chronologischer Reihenfolge. Frühere Nachrichten werden mit einem exklusiven Cursor nachgeladen; die Ansicht begrenzt sich auf 1000 Nachrichten und bietet danach ein neues Gespräch. Das vorhandene `after`-Verhalten bleibt kompatibel. Die Löschbestätigung entfernt Gespräch, Nachrichten, Quellen und zugehörige Meldungen, nicht das bereits verbrauchte Kontingent.

## Beispiele, Quellen und Meldungen

Ein `example` wird vor Anzeige erneut aus seinem DSL geparst und gegen Score und Timeline verglichen. Die Grenzen aus dem Backend gelten nochmals: höchstens acht Takte, 32 Ereignisse je System, 128 klingende Töne und 60 Sekunden. Zwei Systeme unterstützen weiterhin nur das begrenzte große System. Wiedergabe beginnt ausdrücklich, verwendet das geprüfte Tempo und stoppt bei Verlassen/Hintergrund.

Quellen verwenden die geprüften Harmonia-Artikelrouten aus ADR 0016. Antworten ohne Bibliotheksbeleg zeigen diesen Zustand; Vorschauquellen bleiben als fachlich ungeprüft markiert. Modelltext wird als Text dargestellt, nicht als ausführbares HTML oder beliebiger Markdown-Link.

Die additive Tabelle `tutor_reports` verknüpft eine Meldung per Fremdschlüssel mit genau einer eigenen gespeicherten Assistentennachricht und ihrem Gespräch. Der Service-RPC prüft Besitzer, Rolle, Kategorie und Text und verarbeitet die Meldungs-ID idempotent. Direkte Clients dürfen nur ihre eigenen Meldungen lesen. Löschen der Antwort, des Gesprächs oder Kontos löscht die Meldung mit; keine Kopie des KI-Texts bleibt zurück. Eine Meldung benötigt weder ein neues Modellkontingent noch ein aktives Abo.

## Grenzen der Abnahme

Browser und API verwenden ausschließlich den bestehenden lokal geschützten Modelladapter mit sichtbarer Simulationskennzeichnung. Dadurch werden Streaming, Werkzeuge, Notenklang, Quellen und Meldungen überprüfbar. Es belegt keine Qualität eines echten Modells. Anthropic-Schlüssel, offiziell verifiziertes Modell/Tarif, echte Geräte und Claudes fachliche Quellenprüfung bleiben separate Abnahmen. Kauf und Paywall folgen in P2.19/P2.20; die Oberfläche informiert jetzt über Premium/Max und lässt freies Üben erreichbar.
