# ADR 0084 – Zeitgrenzen und Drosselung für Lern-Sync, Rätsel und Freunde

Stand 27.11.2026. Technische Entscheidung für M2. Die Startwerte der Drosselung sind vorläufig.

Lern-Sync kann mit `futureMode: 'defer'` gültige Ereignisse übernehmen und zu weit in der Zukunft liegende Ereignisse zusammen mit der Serverzeit zurückstellen. Die App bewahrt die zurückgestellten Ereignisse dauerhaft auf. `finishedAt` bleibt erhalten. Für die Anzeige und Bewertung fälliger Karten werden ausstehende Ereignisse höchstens bis zur aktuellen lokalen Planungszeit berücksichtigt. Der bisherige 422-Fehler bleibt der Vertrag für frühere Clients. Ein pauschaler Abbruch würde auch den gültigen Teil eines Batches blockieren. Eine automatische Korrektur der Ereigniszeit würde Lernhistorie und Tagesgrenzen verändern.

Die erste beantwortete Tagesfrage speichert die Zeitzone. Eine abweichende Zone kann nach 20 Stunden mit einer Antwort übernommen werden. Vor Ablauf meldet die API einen Konflikt und behält die gespeicherte Zone bei. Der Antwortpfad prüft die Sperre innerhalb derselben Transaktion. Eine feste UTC-Zone würde den lokalen Tageswechsel ändern.

`request_limits` führt getrennte 60-Sekunden-Fenster je Konto. Die vorläufigen Startwerte betragen 10 Annahmen für Freundeseinladungen und 60 Rätselabrufe. Überschreitung liefert HTTP 429 mit `Retry-After`. Eine reine App-Sperre würde direkte Aufrufe und mehrere Geräte nicht gemeinsam erfassen.

Offene Freundeseinladungen können nach Bestätigung widerrufen und mit neuem Token erstellt werden. Die Einstellung `EXPO_PUBLIC_INVITE_LINK_ORIGIN` ermöglicht HTTPS-Einladungen für Freunde und Duelle. Domain und Plattform-Verifizierungsdateien folgen mit M4. Eingehende Links füllen den Code für die bewusste Annahme vor.

Die Rätselbank erhält pro Katalog-Snapshot einen Hash über die kanonisch serialisierte Bank. Objektschlüssel sind sortiert, die Arrayreihenfolge bleibt erhalten. Änderungen an Generator oder Bewertung erhöhen `PUZZLE_ENGINE_VERSION`. Der neue Hash beeinflusst nur noch nicht eingefrorene Tage. Ein Neuaufbau schon veröffentlichter Tage würde Aufgaben und bereits eingegangene Antworten entkoppeln.

Bereitstellung erfolgt in der Reihenfolge Migrationen, Edge Functions, dann App.
