# P2.12 – Lektionsablauf

Stand: 13.10.2026. Review-Zweig `codex/p2-12-lesson-flow`, Basis P2.11 (`53c567f`). Vertrag: [ADR 0012](../decisions/0012-lektionsablauf-mit-wiederaufnahme-und-xp.md).

## Funktion und Design

Die Einführung nennt die Aufgaben zum aktuellen Stoff und die zusätzliche Wiederholung. Alle vorhandenen Aufgaben bleiben erhalten. Bekannte Aufgaben kommen aus früheren Lektionen derselben Einheit und aus Voraussetzungen im Fähigkeitsgraph. Sie stehen zwischen den neuen Aufgaben; bei mehr vorausgesetztem Stoff steigt ihr Anteil. Der Satz bleibt bei höchstens 15 Fragen. Aufgaben tragen eine kurze Beschriftung für aktuellen Stoff, Festigung oder Fehlerwiederholung. Die Aufgabenanzahl im Lernpfad entspricht dem tatsächlich gestarteten Mischplan.

Feedback und Hinweise verwenden die bestehenden gemeinsamen Aufgabenbausteine. Falsche Antworten erscheinen am Ende in einer neuen musikalischen Variante; Erstversuch und Wiederholungsrunde bleiben getrennt. Die 80-%-Regel aus P2.11 gilt unverändert für die ursprüngliche gemischte Runde. Hinweise 1–2 sind erlaubt. Lösungen und Hörpausen geben keine anrechenbare richtige Antwort, und ein perfektes Review kann einen ungenügenden Erstversuch nicht bestehen lassen.

Der Ergebnisbildschirm zeigt Genauigkeit, Bestehen, anrechenbare Antworten, Hinweise, ausgelassene Aufgaben, Fehlerwiederholung, Zeit, XP und die Zahl aktiver Lerntage. Ein Ziel-Symbol begleitet nicht bestandene Versuche; bestandene erhalten einen Haken. Bei einem nicht bestandenen Durchgang bleibt die nächste Lektion gesperrt. Lokal berechnete XP werden als solche bezeichnet, bis ein Konto den Serverbeleg erhalten hat. Alle Texte sind DE/US/UK, Gestaltung und Bedienelemente verwenden die bestehenden Tokens und Komponenten.

„Pausieren oder abbrechen“ und Zurück-Navigation bieten **hier weiterlernen**, **speichern und zurück zum Lernpfad** sowie **Durchgang verwerfen**. Beim erneuten Öffnen wartet der gespeicherte Durchgang mit „Lektion fortsetzen“. Einführungskarte, ungeprüfte Auswahl, Hinweise, sichtbares Feedback, Aufgabenposition und Review werden wiederhergestellt. Klang startet nicht automatisch. Ein laufender Rhythmus-Take wird beim Pausieren gestoppt und kann neu aufgenommen werden; ein bereits abgeschlossener Take bleibt als Antwort erhalten. Ein neuer Durchgang erhält eine neue ID und einen anderen Seed, auch nach einem Neuladen mit gleicher Geräteuhr.

Ein veränderter Mischplan wird ausdrücklich erkannt und ersetzt den alten Snapshot erst bei einem neuen Durchgang. Fehler beim Speichern zeigen einen erneuten Schreibversuch und verhindern das Verlassen mit dem Speichern-Knopf. Ausdrückliches Verwerfen braucht keinen Lektionsabschluss. Verwerfen und Pausieren vergeben weder Fortschritt noch XP.

## Technischer Vertrag

- `packages/content/src/lesson-flow.ts`: Mischplan, begrenztes Snapshot-/Aktionsschema und kaltes Replay. Neue Nachweise enthalten `planKey`; ältere werden weiterhin kanonisch mit ihrem ursprünglichen Satz bewertet.
- `packages/exercises/src/lesson.ts`: bestehende Fehlerwiederholung; wirkungslose Antworten/Hinweise behalten nun auch die äußere Session-Identität.
- `storage/use-lesson-flow.ts`: lebende Session plus Antwortprotokoll, pro Startbesitzer gespeichert. Die Lernpfadinitialisierung lädt aktive Durchgänge vor dem Spieler. Live-Interaktionen regenerieren keine Audio-/Rhythmusobjekte.
- `harmonia-learning.db`: zusätzliche Metadateneinträge, weiterhin DB-Version 1; ältere Daten werden nicht gelöscht. Aktive Durchgänge bleiben lokal beim Gast bzw. Konto ihres Starts. Sie werden beim Kontowechsel ausgeblendet und beim Zurückwechseln wieder geladen. Abgeschlossene Nachweise und XP synchronisieren sich zwischen Geräten.
- `storage/use-lesson-result.ts`: stabiler Abschlusszeitpunkt und dieselbe ID bei erneuter Speicherung. Nachweis zuerst, vollständiges lokales Ergebnis danach. Der Snapshot bleibt bis zum gespeicherten Abschluss erhalten. Seine Löschung prüft die Versuch-ID und kann einen späteren neuen Durchgang nicht löschen.
- Vollständige lokale Ergebnisse behalten Mischplan und Zeitzone auch beim Legacy-Import. Ergebnisflags und gespeicherte Lösungen bleiben als Bewertungsquelle ausgeschlossen.

## XP und Serie

Die ersten belohnten bestandenen Abschlüsse einer Lektionsversion haben 10 Basis-XP, Wiederholungen 5. Hinweise reduzieren die Basis mit dem Durchschnitt der Gewichte 1 / 0,9 / 0,8 / 0. Ausgelassene Fragen haben Gewicht 0. Ab 90 % anrechenbaren richtigen Antworten gibt es +5; vollständig und ohne Hinweise +3. Perfekt: **18 XP**, als Wiederholung **13 XP**. Nicht bestanden: **0 XP**. Die genauen Regeln stehen in ADR 0012.

Der Server bewertet alle Antworten selbst und liefert `reward` pro synchronisiertem Nachweis. Die additiven Migrationen `20261013010000_lesson_rewards.sql` und `20261013020000_learning_reward_page.sql` legen `xp_ledger`, die private Buchungs-RPC und gemeinsame Nachweis-/XP-Seiten an. Der Download benötigt keine langen GET-Filter aus Client-IDs. Transaktion und Kontosperre schützen vor halben Ergebnissen, doppelten Uploads und zwei gleichzeitigen Erstabschlussboni. Einmalige Belege bleiben beim Cursor-Download und bei einem Geräteneustart erhalten. Direkte Writes, fremdes Lesen und RPC-Bypass sind gesperrt; Konto-Löschung entfernt Belege mit den Nachweisen.

Die Ergebnisserie verwendet die lokalen Abschlusstage aus den gespeicherten IANA-Zeitzonen und zählt jeden Tag einmal. Sommerzeit und UTC-Tagesgrenzen werden berücksichtigt. Ein aktiver gestriger Tag erhält die Serie bis zum heutigen Abschluss. Vollständige Reise-/Schutzlogik, serverseitig veränderliche Regeln, Tagesziel und Erinnerungen bleiben P2.14; FSRS bleibt P3.03. Alte Nachweise ohne Zeitzone vergeben keine nachträglichen XP.

## Lokal starten und prüfen

```sh
pnpm db:start
pnpm exec supabase migration up --local
pnpm db:serve:learning
# Zweites Terminal:
pnpm db:test:learning
pnpm db:test
pnpm db:lint
```

Die vorhandene lokale Vorschau verwendet Entwürfe ausschließlich mit der ausdrücklichen lokalen Freigabe. Produktionsfunktionen und App-Exports verwenden weiterhin nur freigegebene Inhalte. Cloud-Proxy und CA-Konfiguration sind unverändert. Die neue Migration wurde nur lokal additiv angewendet; keine vorhandene Datenbank wurde zurückgesetzt und keine Remote-Funktion veröffentlicht.

## Prüfstand

Geprüft sind kanonische Mischpläne aller 85 Lektionen, alte Nachweise, Hinweisstufen, Bestehen, neue Fehlervarianten, kaltes Replay von Einführung/Auswahl/Feedback/Review, ungültige Aktionen und veränderte Inhalte. Echte SQLite prüft Kontotrennung, Schreibfehler, Wiederöffnung, atomare XP-/ACK-/Cursor-Buchungen und das verspätete Löschen eines alten Durchgangs. Spielerprüfungen umfassen Pause, Zurück, Fortsetzen, Verwerfen, Neuladen und neue Seeds. Die bestehenden Kursprüfungen bedienen weiterhin alle Eingabearten einschließlich der hinzugefügten Wiederholungsfragen.

Die lokale Auth-/Edge-/REST-Integration prüft weiterhin 226 Offline-Versuche und zwei Geräte, zusätzlich parallele XP-Abschlüsse, doppelte Retries, Lösungen ohne Gutschrift, lokale Tagesgrenzen, falsche Zeitzonen, manipulierte Mischpläne, Zukunftszeiten, lange Unicode-IDs und gesperrte direkte Buchungen. PostgreSQL prüft Transaktion, RLS und Löschschutz. Web-, iOS- und Android-Exports sowie der Produktionsfilter werden separat geprüft.

Gesamtprüfung: **2645 Paket-, App- und Tooltests**, darunter 377 App-Tests; 170 Deno-Prüfpunkte einschließlich aller 850 ursprünglichen Aufgaben und aller 85 Mischpläne; 76 pgTAP-Prüfungen. Lint/Paketgraph, Typen einschließlich Edge Function, Übersetzungen, Inhalts-/Curriculumprüfung, Format und DB-Lint sind geprüft. Preview und Produktion exportieren Web, iOS und Android; der tatsächliche Produktions-Webexport enthält keine Entwurfs-IDs oder ungeprüften Inhaltstexte.

Browserprüfung mit dem tatsächlichen Export: 390-px-Touch, Tastatur-Bereichswechsel, kaltes Laden von Einführung, Auswahl, Hinweisen und sichtbarem Feedback, gesperrte direkte Links, 6/8 weiterhin nicht bestanden trotz Review, 8/8 mit 18 XP und einem Lerntag, Browser-Zurück mit bestätigtem Rückweg und Wiederaufnahme, E-Mail-Verknüpfung, zwölf gemischte Offline-Aufgaben, zwei echte Kontositzungen, Nachsync und Abmeldung. Der öffentliche Browserexport prüft Gaststart, leeren freigegebenen Pfad und direkte Entwurfslinks ohne Kursfragen. Die öffentliche lokale Funktion verweigert weiterhin Entwurfsgutschriften.

Echte iOS-/Android-Geräte, produktive Auth-/Sync-Bindung und Claudes getrennte fachliche Freigabe bleiben die bereits bestehenden externen Abnahmen. Die Inhalte bleiben Entwurf; der Produktionskatalog liefert sie deshalb weiterhin nicht aus.

**Nächster Schritt: P2.13 – Feedback, Erklärungen, „Fehler melden“.**
