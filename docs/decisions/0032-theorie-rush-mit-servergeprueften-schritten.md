# ADR 0032 – Theorie-Rush mit servergeprüften Schritten

- Status: technisch umgesetzt, Betriebs-/Geräteabnahme offen
- Datum: 16.10.2026
- Arbeitspaket: P3.05

## Entscheidung

Rush benötigt ein nicht anonymes Konto und eine Verbindung. Der Server vergibt den Seed und friert die aus dem freigegebenen Katalog abgeleitete Aufgabenbank und die Regelkonfiguration pro Lauf ein. Nur in ausdrücklich lokalen Vorschauumgebungen werden Entwürfe verwendet. Der Client übermittelt Lauf-ID, fortlaufenden Aufgabenindex und Antwort, keine Zeitstempel, Ergebnisflags oder Punktzahlen. Die Edge Function reproduziert die jeweilige Aufgabe mit der deterministischen Engine und bewertet sie. Die Datenbank übernimmt den bewerteten Schritt atomar unter derselben Kontosperre wie die vorhandenen Lern-/XP-Buchungen.

Die Modi dauern drei oder fünf Minuten nach Serverzeit; Überleben hat keinen Spieltimer. Der dritte Fehler beendet jeden Lauf. Ein freiwilliger Abbruch vor einem natürlichen Ende ergibt keinen Ranglistenbeitrag und keine XP. Verlassen/Reload pausiert den Lauf nicht; ein Gerät lädt den zuletzt bestätigten Stand vom Server. Identische Übertragungen sind idempotent, widersprüchliche Antworten auf denselben Index werden abgewiesen. Der Server prüft eine Mindestzeit von zunächst 350 ms zwischen bestätigten Schritten. Das begrenzt unmögliche Laufzeiten, verhindert aber keine Bots oder externen Lösungshilfen.

## Auswahl, Vergleich und Vergütung

Die Bank enthält ausschließlich schnelle visuelle Aufgaben mit einer einzelnen Auswahlantwort aus den vorhandenen kanonischen Übungssätzen. Hör-, Mikrofon-, Tipp- und umfangreiche Bauaufgaben bleiben im normalen Lernmodus. Die didaktische Reihenfolge des Katalogs definiert vorläufige Schwierigkeitsstufen; nach zunächst fünf Antworten steigt die Stufe bis zum höchsten verfügbaren Bankabschnitt. Dies ist keine empirische Kalibrierung. P3.01 liefert die versionierte Parameteridentität (`ratingBucket`); persönliche Ratings verändern eine gemeinsame Wettbewerbsbank nicht. Rush erzeugt weder Ratings noch Freischaltungen oder FSRS-Termine.

Richtige Antworten ergeben 10 × Schwierigkeitsstufe Punkte. Ein natürlich beendeter Lauf vergibt zunächst 1 XP je richtiger Antwort, höchstens 30 XP, keine Münzen und keinen qualifizierenden Serientag. XP werden genau einmal mit explizitem `source_kind=rush` in `xp_ledger` gebucht. Die vorhandene Ligabuchung und Motivationszusammenfassung verwenden denselben Beleg. Bestehende Lektionsschreiber behalten ihre Fremdschlüsselprüfung. Der Namensraum `rush:<UUID>` ist für neue Lernereignisse gesperrt. Neue Clients fordern mit `rushFormat: 1` bestätigte Rush-Aggregate für ihre Offline-Schätzung an; alte Motivationsantworten erhalten kein unbekanntes Zusatzfeld.

Gratis: ein Start pro UTC-Tag, über alle Modi gemeinsam. Premium und Max: zunächst höchstens 100 Starts pro UTC-Tag als Betriebsgrenze. Jeder neue Start zählt, auch ein Abbruch; Wiederaufnahme und Wiederholung derselben Start-ID zählen nicht erneut. Diese Startwerte sowie XP-Deckel, Mindestantwortzeit und Stufenabstand stehen serverseitig in `rush_policy`; Berechtigungen kommen aus `access_status`, keine neuen Kaufpreise oder Kauf-Freigaben. Lernenergie und Rush-Starts bleiben unterschiedliche Kontingente.

## Bestenlisten und Freundschaftsgrenze

Die Funktion liefert je Modus und aktueller Bank-/Regelkennung den besten natürlich beendeten Lauf pro Konto: Tag, Woche, Allzeit oder bestätigte Freundschaften. Tages-/Wochenfenster folgen UTC, Wochen beginnen montags. Reihenfolge: Punkte absteigend, weniger Fehler, früherer Abschluss, dann stabile interne ID. Es werden höchstens die ersten 50 Ränge und gegebenenfalls der eigene Rang ausgeliefert, ausschließlich `rank`, `score`, `isYou`.

P3.05 enthält die notwendige private `friendships`-Relationsgrenze. Nur zwei gegenseitig akzeptierte Seiten erlauben einen Freundesbeitrag; eine blockierte, fehlende oder ausstehende Seite schließt ihn aus. Konten können die Relation nicht direkt schreiben oder durchsuchen. Es gibt keine erfundenen Freundschaften und keinen Klarnamen-/Kontaktabgleich. Einladungen, Verwaltung und Quests bleiben P3.08. Die Freundesbestenliste funktioniert bereits mit bestätigten Beziehungen und zeigt vorher ausschließlich den eigenen besten Lauf.

## Speicherung und Betrieb

`rush_runs` enthält den eingefrorenen Lauf und bestätigte Summen; `rush_steps` hält die serverbewerteten Rohantworten. Dies sind eigene Rush-Quellen, keine Kopien von `learning_events`. Direkter Zugriff ist Service-only. Der bestehende Datenschutzexport enthält eigene Läufe, Schritte, Tagesnutzung und ausgehende Freundschaftsbeziehungen; Auth-Löschung kaskadiert auf beide Seiten einer Beziehung. Der vorhandene zwölfmonatige Retentionjob entfernt Rohantworten, Seed und Aufgabenbank in begrenzten Chargen, erhält bestätigte Summen, Ranglisten und XP-Belege. Ein zwölf Monate alter Überlebenslauf wird bei der Retention abgebrochen; dies ist eine Aufbewahrungsgrenze, kein Spieltimer.

Abgelaufene Zeitläufe werden beim nächsten eigenen Status-/Abschlussaufruf oder durch `close_expired_rush(100)` abgeschlossen. `supabase/ops/schedule-rush.sql` ist eine ausdrücklich zu prüfende Cronvorlage und wurde nicht aktiviert. Bei einer verzögerten Jobausführung bleibt die Bestenlistenzeit das Serverdeadline; Liga-XP zählen nach ihrer tatsächlichen Bestätigung wie andere neue XP.

## Grenzen

Die öffentlichen Inhalte bleiben bis zur getrennten fachlichen Freigabe leer. Echte Geräte, produktive Bereitstellung/Scheduler und die bestehenden P2-Rechts-/Anbieter-/Launchfreigaben sind offen. Keine PRs/Merges durch Codex: Claude übernimmt den Prüf- und Integrationsablauf.

Die Wettbewerbskennung enthält Aufgabenbank, Engineversion, Stufenabstand und Mindestantwortzeit. Änderungen ausschließlich am Tageskontingent oder XP-Deckel setzen vergleichbare Allzeitrekorde nicht zurück; die vollständige Regelkonfiguration bleibt trotzdem pro Lauf eingefroren.
