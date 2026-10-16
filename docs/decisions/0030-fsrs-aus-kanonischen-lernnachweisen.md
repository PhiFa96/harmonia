# ADR 0030 – FSRS aus kanonischen Lernnachweisen

Datum: 16.10.2026. Status: technisch umgesetzt; Wirksamkeits- und Geräteabnahme offen.

## Entscheidung

`ts-fsrs` 5.4.2 (MIT, Open Spaced Repetition) berechnet die Wiederholungstermine. Engine und Parameter sind fest gebunden: FSRS-6, Zielbehalten 0,9, maximales Intervall 36.500 Tage, kein Fuzz, kurze Lernschritte 1/10 Minuten, Wiederlernschritt 10 Minuten. Die Standardgewichte dieser Paketversion gelten. Eine Änderung verlangt eine ausdrücklich versionierte Migration und erneute Prüfung. Die Zielquote ist eine Modellannahme, kein nachgewiesener Lernerfolg.

Fähigkeiten erhalten je abgeschlossenem ursprünglichem Durchgang höchstens eine konservative Bewertung: falsche Antwort oder eingeblendete Lösung → Again; richtige Antwort mit Hinweis 1–2 → Hard; selbstständig richtig → Good. Bei mehreren Antworten zu derselben Fähigkeit gilt die niedrigste Bewertung. Easy wird nicht aus Geschwindigkeit geraten. Korrekturrunden und ausgelassene Hörfragen liefern keinen zusätzlichen Gedächtniserfolg. Der bestehende Glicko-Nachweis bleibt getrennt: Nur selbstständige Antworten ändern diese Ratings.

Wissenskarten aus einer gesehenen Lektion werden zunächst als neue, sofort fällige Karten vorgemerkt. Erst nach eigenem Erinnern und Aufdecken kann die Person Again/Hard/Good/Easy wählen. Diese Selbsteinschätzung ist ein eigener `card-review`-Lernnachweis, ausdrücklich kein fachlich geprüftes Richtig/Falsch und keine Kursfreischaltung. Er kann eine zuvor nicht vorgemerkte Karte nicht eintragen. Karten werden durch ID und Inhaltsversion identifiziert; geänderte oder nicht mehr ausgelieferte Fassungen erscheinen nicht mehr als fällig.

## Persistenz und Synchronisation

Die vorhandenen `learning_events` bleiben die einzige Rohdatenquelle. `skill_progress.fsrs` und `card_review_progress` speichern ausschließlich abgeleitete FSRS-Zustände (Fälligkeit, Stabilität, Schwierigkeit, Zustand, Lernschritt, Wiederholungen, Rückfälle, Intervalle und letzter Wiederholungszeitpunkt). Für ausschließlich unterstützte Antworten darf eine Fähigkeitszeile mit null Glicko-Versuchen entstehen. Die Rating-RPCs schließen solche Zeilen aus; keine erfundene Fähigkeitsbewertung wird angezeigt.

`processPendingReviews` rechnet dieselben Nachweise in Empfangsreihenfolge nach. Hash, eigene Kontorevision, Kontosperre und atomarer Receipt verhindern doppelte Anwendung und überholende spätere Nachweise. Bei Konflikten wird neu gelesen; nach drei Versuchen bleibt die Arbeit dauerhaft in der Warteschlange. Unverfügbare oder strukturell ungültige Altdaten erhalten nur einen leeren Receipt. Unerwartete Implementierungsfehler bleiben hingegen wiederholbar und werden nicht als erledigt markiert. Zeitpunkte verwenden die frühere Zeit aus Abschluss und Serverempfang; verspätete Eingänge können den letzten Wiederholungszeitpunkt nicht zurückdrehen.

Nur der Dienst darf Termine schreiben. Der Client liest über `learner_review_snapshot()` ausschließlich das eigene Konto, ohne frei wählbaren Besitzer. Eine noch unvollständige Projektion liefert keinen vermeintlich vollständigen Snapshot. Sequenzstand, lokale Position und nach Besitzer getrennte SQLite-Caches verhindern doppeltes lokales Nachrechnen. Späte Antworten nach einem Kontowechsel dürfen weder Cache noch UI des neuen Kontos verändern; Netzwerkaufrufe verwenden den erfassten JWT und ein Zeitlimit.

Gäste und Offline-Antworten verwenden denselben Algorithmus lokal. Vor Entfernung alter Antworten wird der abgeleitete Zustand atomar gesichert. Gastdaten einschließlich dieses lokalen Zustands gehen nur in das erste gewählte Konto über. Bei überlappenden Schlüsseln hat vorhandene eigene bzw. spätere Serverevidenz Vorrang. Bereits verdichtete Gastgeschichte bleibt als Geräte-Fallback erhalten, wenn dem Server Rohbelege fehlen; sie wird nicht zu einem behaupteten Server-Nachweis. Solche vor Anmeldung entfernten Antworten lassen sich auf einem anderen Gerät nicht rekonstruieren. Die endgültigen serverseitigen Termine können daher von einer Offline-Schätzung abweichen.

F17 bleibt bei zwölf Monaten für Details. Der Server verdichtet einen Nachweis erst nach seiner FSRS-Projektion; der nachholbare Worker muss vor dem Aufbewahrungsjob laufen. Aggregierte Termine bleiben bestehen, erscheinen im eigenen Datenexport und werden beim Löschen des Kontos kaskadierend entfernt. Lokale Caches werden ebenfalls gelöscht.

## Oberfläche und Grenzen

„Wiederholen“ ist über Lernen und Üben erreichbar. Es zeigt fällige Karten und Fähigkeiten aus dem erreichten, ausgelieferten Stoff. Fähigkeiten verwenden einen eingefrorenen `review:1`-Plan mit bis zu zehn versionierten Quellen im vorhandenen pausierbaren Lektionsablauf. Energie und die höchste Stufe der Quellen gelten weiterhin. Karten sind frei lesbare Erklärungen und benötigen keine Energie. Beide Modi vergeben keine Kursfreischaltung, XP, Münzen oder Serienqualifikation; ein abgeschlossener Durchgang zählt als geübter Tag für das Aussetzen der allgemeinen Lernerinnerung.

Ein Hinweis bei mindestens zehn fälligen Einträgen bleibt innerhalb der App. Bestehende freiwillige Tageserinnerungen bleiben verfügbar. Es wird keine zusätzliche Push-Berechtigung angefragt und kein eigener externer Rückstandsversand aktiviert.

Die musikalischen Inhalte bleiben unveränderte Entwürfe. Physische iOS-/Android-Abnahme, echte Push-Zustellung und längerfristige Wirksamkeitsmessung sind separate offene Abnahmen. Main, Remote-Datenbank und Anbieter-Konfiguration werden durch diese Vorbereitung nicht geändert.
