# ADR 0011 – Lernfortschritt aus geprüften Versuchen

**Status:** angenommen für die technische Umsetzung von P2.11.
**Datum:** 13.10.2026

## Anlass

Der Lernpfad benötigt verlässliche Freischaltungen, freiwillige Wiederholung und denselben Stand nach Kontosynchronisation. Die bisherige letzte Ergebniszusammenfassung eines Geräts genügt dafür nicht. P2.03 ist noch nicht vollständig umgesetzt. Phillip hat F11 ausdrücklich mit 80 % richtigen Erstversuchsantworten entschieden; Hinweise 1–2 bleiben erlaubt, Lösungen und ausgelassene Aufgaben liefern keine richtige Antwort.

## Entscheidung

`learning-evidence.ts` erzeugt einen minimalen Nachweis mit Lektions-ID, Inhaltsversion, Seed, Zeitpunkten und den ursprünglichen Eingaben einschließlich Hinweisstufe und Hörpause. Items, Lösungswerte, Ergebnisflags und Zusammenfassungen werden nicht übernommen. `validateLearningEvent` erzeugt die Aufgaben und Fehlerwiederholungen erneut aus dem tatsächlichen Katalog und bewertet sie mit der vorhandenen Engine. Ein abgeschlossener Versuch besteht bei mindestens 80 % anrechenbaren Erstversuchsantworten, bezogen auf **alle ursprünglichen Aufgaben**. Hinweisstufe 3 und ausgelassene Aufgaben zählen nicht als richtig. Die Fehlerwiederholung verändert diese Quote nicht. Die Schwelle steht zentral in `PASS_PERCENT`; Client und Backend verwenden dieselbe Implementierung.

`learningPath` berechnet den Pfad aus dem injizierten Katalog. Innerhalb einer Einheit folgt die Freischaltung der Lektionsreihenfolge. Externe Voraussetzungen kommen aus dem Fähigkeitsgraphen, auch über Bereichsgrenzen hinweg. Eine Fähigkeit erfüllt ihre Voraussetzungen erst, wenn sämtliche zugehörigen Lektionen bestanden sind oder eine geschlossene Einstufungskette sie zugänglich macht. Bestandene Versuche derselben Lektionsversion werden vereinigt: Ein späterer Fehlversuch löscht keinen Erfolg. Änderungen der Lektionsversion verlangen einen neuen passenden Versuch; alte Nachweise bleiben gespeichert und werden kenntlich gemacht.

Einstufungsnachweise reproduzieren die P2.10-Aktionen und Empfehlungen. Getestete Einheiten bleiben freiwillig erreichbar und unterscheiden sich von bestandenen Lektionen. Die zuletzt vom Server angenommene Einstufung gilt nach Sync auf allen Geräten. Noch nicht heruntergeladene lokale Einstufungen gelten zunächst als jüngste lokale Einschätzung. Die Serversequenz bestimmt eine gemeinsame Reihenfolge, unabhängig von unterschiedlichen Geräteuhren. Einstufungen erzeugen keine XP und keine abgeschlossenen Lektionsversuche.

Eine additive, separate `harmonia-learning.db` speichert die Nachweise, Uploadbestätigungen und Kontocursor transaktional. Die bisherigen Geräte- und Lektionsdatenbanken bleiben erhalten. Bestehende vollständige Lektionsversuche werden einmal ohne ihre Bewertungsflags übernommen. Der bisherige P2.10-Abschluss und lokale Pausensnapshot werden einmal importiert. Danach liegen aktive und letzte lokale Tests in einem nach Konto getrennten Metadatensatz; geordnete Writes behalten ihren ursprünglichen Eigentümer. Neue Tests erhalten eine eigene UUID, ältere Snapshot-Payloads ohne ID bleiben lesbar. Gastnachweise werden bei der ersten Anmeldung in das ausgewählte Konto verschoben; spätere Konten übernehmen sie nicht erneut. Abmeldung zeigt einen getrennten Gastpfad. Der beim Lektionsstart bestimmte Eigentümer bleibt auch bei verzögerten Schreibvorgängen erhalten. Temporäres Lernen schreibt keine Lernpfadnachweise auf Gerät oder Server.

Die Edge Function `learning-sync` prüft das Bearer-Token über Supabase `getUser`, nimmt höchstens 50 Nachweise pro Upload und liefert höchstens 200 Zeilen pro Downloadseite. Sie bewertet die Eingaben erneut und schreibt über eine ausschließlich für `service_role` ausführbare RPC. Eine Konto-Sperre ordnet parallele Uploads; identische IDs sind idempotent, andere Payloads mit derselben ID brechen die Transaktion ab. RLS erlaubt angemeldeten Personen nur das Lesen ihrer eigenen Nachweise. Direkte Client-Schreibzugriffe sind gesperrt. ACK und Downloadcursor werden auf dem Gerät atomar gespeichert; Offline-/Netzfehler erhalten die Warteschlange. Wiederverbindung, App-Vordergrund und manuelles Synchronisieren versuchen sie erneut.

Die Produktion verwendet ausschließlich den veröffentlichten Katalog. Die lokale Testfunktion darf Entwürfe nur mit ausdrücklich gesetztem `HARMONIA_LOCAL_PREVIEW=true` und lokaler Supabase-URL verwenden. Der öffentliche Modus setzt diesen Schalter nicht. Kein Service-Schlüssel wird in die App exportiert. Deno verwendet für Schema und Engine dieselben aktuellen zod-/i18next-Versionen wie Node.

## Folgen und Grenzen

- P2.11 zieht die Bestehensregel aus P2.12 und den notwendigen Nachweis-Sync aus P2.03 vor. P2.03/P2.12 werden dadurch nicht insgesamt abgeschlossen.
- Die Lektionsroute prüft die Freischaltung erneut; direkte Links umgehen sie nicht.
- Für Offline-Fortschritt bleiben lokale Geräteantworten die Quelle, nach Sync die geprüften Nachweise des Kontos. Berechnete Statusflags sind keine serverseitigen Berechtigungen, Zertifikate oder XP.
- Bereichs-/Stufenauswahl und aufgeklappte Einheiten sind lokale, pro Konto gespeicherte Ansichtspräferenzen.
- Produktionsmigration, echtes SMTP, echte native Geräte, Lernendentests und Claudes fachliche Inhaltsfreigabe benötigen ihre eigenen Abnahmen. Es wurde kein Remote-Deployment vorgenommen.
