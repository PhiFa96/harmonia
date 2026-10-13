# P2.11 – Lernpfad

Stand: 13.10.2026. Review-Zweig `codex/p2-11-learning-path`, Basis `codex/p2-10-placement-test` (`dfd4f4f`). Vertrag: [ADR 0011](../decisions/0011-lernfortschritt-aus-geprueften-versuchen.md).

## Funktion und Gestaltung

Der Lernen-Tab zeigt einen Pfad mit den tatsächlich ausgelieferten Einheiten und Lektionen. In der internen Vorschau sind das 29 Einheiten und 85 Lektionen. Es gibt vier beschriftete Zustände mit Symbolen: **gesperrt**, **offen**, **bestanden** und **durch Einstufung getestet**. Einheit und Lektion haben eigene Zustände. Bestanden-Zähler und Fortschrittsbalken zählen tatsächliche Erfolge; eine Einstufung erhält eine eigene Kennzeichnung und Erklärung.

Bereichsfilter folgen dem Katalog, einschließlich des optionalen Grundlagen-Prototyps. Stufen 1 und 2 sowie alle Stufen sind auswählbar. Einheiten klappen ihre Lektionen mit Aufgabenanzahl auf. Voraussetzungen lassen sich anklicken, auch wenn sie aus einem anderen Bereich stammen. Bereich, Stufe und aufgeklappte Einheiten werden lokal pro Konto behalten. Die Web-Bereichsauswahl unterstützt Pfeile, Home/End und Leertaste/Enter. Text, Symbole, Fokus und Zustandsbeschriftung ergänzen die Farben; DE/US/UK verwenden die bestehenden Übersetzungen und Design-Tokens.

Gesperrte Lektionen sind deaktiviert und werden auch bei einem direkten Lektionslink abgefangen. Offene, bestandene und getestete Lektionen bleiben jederzeit zugänglich. Eine neue Einstufung beeinflusst die geschätzten Überspringempfehlungen; tatsächliche Erfolge bleiben erhalten.

## Bestehen und Freischalten

F11 ist entschieden: **80 % der ursprünglichen Aufgaben müssen im Erstversuch richtig sein**. Hinweise 1–2 sind erlaubt. Eingeblendete Lösungen (Stufe 3) und ausgelassene Hörfragen sind keine anrechenbaren richtigen Antworten; sie bleiben im Nenner. Beispielsweise bestehen 7/8, 8/10 und 10/12; 6/8, 7/10 und 9/12 bestehen nicht. Fehlerwiederholungen mit neuen Varianten verbessern das Üben, verändern diese Quote aber nicht. Der Ergebnisbildschirm nennt das Bestehen und die anrechenbaren Antworten ausdrücklich.

Innerhalb einer Einheit müssen die vorherigen Lektionen bestanden sein. Für externe Voraussetzungen wird der vorhandene Fähigkeitsgraph verwendet. Alle Lektionen einer benötigten Fähigkeit zählen. Einstufungsfreigaben brauchen dieselbe geschlossene Voraussetzungskette. Ein bereits bestandener Versuch derselben Version bleibt bei schlechteren Wiederholungen gültig. Alte Inhaltsversionen bleiben als archivierte Nachweise erhalten und schalten eine neue Lektionsversion nicht frei.

## Speicherung und Sync

`harmonia-learning.db` ergänzt die bestehenden SQLite-Dateien additiv. Bestehende vollständige Versuche werden einmal übernommen und erneut bewertet. Auth-Token, E-Mail-Adressen und Lösungsvorgaben stehen nicht in diesen Nachweisen. Für neue Abschlüsse wird zuerst der Lernnachweis gespeichert, danach das bisherige vollständige lokale Ergebnis. Ein Fehler bietet Wiederholung mit derselben ID; doppelte Speicherung erzeugt keinen zweiten Versuch.

Auch pausierte und letzte lokale Einstufungstests liegen nun pro Konto in `learning_meta`. Der bisherige Singleton in `harmonia-device.db` wird einmal übernommen und bleibt als Legacy-Datei erhalten. Eine neue Versuch-ID unterscheidet Wiederholungen unabhängig von Seed und Geräteuhr; bestehende Snapshot-Payloads ohne ID bleiben lesbar. Die laufende Audioquelle behält bei Auswahl, Hinweisen und Prüfung ihre Identität. Pausierte Tests werden lokal fortgesetzt; ihre fertigen Nachweise synchronisieren den Pfad.

Gastfortschritt bleibt lokal. Anmeldung verschiebt ihn einmal in das gewählte Konto. Weitere Konten und der Gast nach Abmeldung erhalten getrennte Pfade. Offline-Abschlüsse bleiben auf dem Gerät in einer Warteschlange. Wiederverbindung, Vordergrund, periodische Prüfung und „Jetzt synchronisieren“ holen Änderungen nach. Aktive Requests verwenden das eingefangene Konto-Token; verspätete Antworten werden beim richtigen Eigentümer abgelegt und verändern nicht den sichtbaren Pfad eines anderen Kontos. Netzfehler, ungültige Bestätigungen und widersprüchliche Seiten lassen die lokalen Antworten erhalten. Ein ausdrücklich temporärer Pfad arbeitet ohne dauerhafte Nachweise.

Der Server speichert append-only Nachweise mit Kontozuordnung und globaler Sequenz. `learning-sync` authentifiziert die Person, reproduziert Aufgaben und Bewertungen und schreibt über eine private RPC. Authenticated/Anon können keine Ergebnisse direkt einsetzen, ändern, löschen oder die RPC aufrufen. RLS trennt das Lesen. Account-Löschung entfernt die zugehörigen Nachweise durch Cascade. Uploads mit derselben ID und Payload sind idempotent; widersprüchliche IDs brechen das gesamte Batch ab. Seiten, Bestätigungen und Cursor werden auf dem Gerät transaktional verarbeitet.

## Lokale Einrichtung

Voraussetzung: Abhängigkeiten und die bestehende lokale Supabase-Grundlage.

```sh
pnpm db:start
pnpm exec supabase migration up --local
pnpm db:serve:learning
# In einem zweiten Terminal:
pnpm db:test:learning
```

`db:serve:learning` aktiviert Entwürfe ausschließlich für die lokale Integration. Im Cloud-Proxy übernimmt der Docker-Wrapper die CA lesend und ergänzt nur die eigenen Auth-/Edge-Container um ihren internen Kong-Host; vorhandene Proxywerte bleiben erhalten. Öffentlichen Funktionsmodus mit `pnpm db:serve:learning --published` starten und `node tools/test-learning-sync.mjs --published` prüfen. Vor dem Moduswechsel den vorherigen Serve-Prozess beenden. Der Test erzeugt nur lokale Konten und löscht sie wieder; Schlüssel und Sessions bleiben im Prozess.

Für eine spätere produktive Bereitstellung Migration anwenden und `learning-sync` mit dem veröffentlichten Katalog deployen. `verify_jwt=false` delegiert die JWT-Prüfung ausdrücklich an `getUser` im Handler; es erlaubt keine anonymen Writes. `HARMONIA_LOCAL_PREVIEW` gehört nicht in Remote-Secrets. Die bereits dokumentierte öffentliche App-Auth-Konfiguration bleibt erforderlich. Es wurde weder eine Remote-Migration noch eine Funktion veröffentlicht.

## Prüfstand und offene Abnahmen

Gezielt geprüft: Schwellen für 8/10/12 Aufgaben, Hinweise 0–3, ausgelassene Hörfragen, vollständige Wiederholungen aller 85 Lektionen, manipulierte Ergebnisflags, geänderte Versionen, graphbasierte Voraussetzungen, freiwillige getestete Einheiten und Bestandserhalt. Echte SQLite prüft Dateineustart, Import, Eigentümer, Idempotenz, Auswahl, defekte Daten sowie atomare ACK-/Cursor- und Konflikt-Rollbacks. Zustandsprüfungen decken Offline-Warteschlangen und Kontowechsel während eines Requests ab.

Die lokale Auth-/Edge-/REST-Integration prüft 226 Versuche, Uploadbatches, Downloadseiten, parallele Duplikate, ungültige Tokens, direkte Schreibversuche, RPC-Bypass und einen identischen Pfad auf zwei Geräten. PostgreSQL-Zugriffstests ergänzen den Konto- und Löschschutz. Die öffentliche Katalogprüfung verhindert Entwurfsgutschriften.

Gesamtprüfungen: 2523 Paket-, App- und Tooltests (darunter 363 App-Tests), 83 Deno-Prüfpunkte einschließlich aller 850 Aufgaben und 85 Lernnachweise, 56 pgTAP-Zugriffsprüfungen, Lint/Paketgraph, Typen einschließlich Edge Function, Übersetzungen, Inhalte, Curriculum und Formatierung. Lokale Auth-/Edge-Integration und der öffentliche Funktionsmodus sind erfolgreich geprüft.

Browserautomation mit dem tatsächlichen Export: 390-px-Touch, Tastatur-Bereichswechsel, Auswahl nach Reload, direkte Zugriffssperre, 6/8 mit korrektem Review weiterhin nicht bestanden, 8/8 öffnet die nächste Lektion, E-Mail-Verknüpfung, zehn weitere Aufgaben bei abgebrochener Sync-Verbindung, zwei echte Sitzungen, Nachsync, Reload auf dem zweiten Gerät und getrennter Gastpfad nach Abmeldung. Der bestehende Einstufungsablauf wurde mit 21 Aufgaben, echten Eingaben/Audio, Pause/Reload und Wiederholung erneut geprüft. Öffentlicher Browserexport: Erststart funktioniert, keine Entwurfseinheiten oder direkt geöffneten Entwurfsfragen. Preview- und Produktions-Exporte für Web, iOS und Android bauen; der tatsächliche Produktions-Webexport enthält keine unveröffentlichten Katalog-IDs oder Inhaltstexte. Echte iOS-/Android-Geräte, produktive Auth-/Sync-Infrastruktur und die fachliche Freigabe aller Kursinhalte durch Claude bleiben getrennte Abnahmen. Der öffentliche Katalog enthält weiterhin keine freigegebenen Lektionen; Produktion zeigt deshalb keine Entwurfspfade.

**Nächster Schritt: P2.12 – Lektionsablauf.** Bestehensregel und Fehlerwiederholung wiederverwenden. Mischung aus neuem Stoff und Wiederholung, Abbrechen/Fortsetzen, XP-/Streak-Ergebnis und ihre übrigen Abhängigkeiten bleiben Aufgabe dieses Schritts. Der allgemeine P2.03-Sync für weitere Kontodaten ist ebenfalls noch offen.
