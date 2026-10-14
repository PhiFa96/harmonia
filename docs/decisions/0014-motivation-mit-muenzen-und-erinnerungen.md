# ADR 0014: Motivation mit Münzen und ausdrücklichen Lernerinnerungen

- Datum: 14.10.2026
- Status: angenommen
- Bezug: P2.14, F07, ADR 0011/0012; Spielwährung ausdrücklich vom Nutzer entschieden

## Entscheidung

Bestandene Lektionen verdienen XP und Münzen. Die bestehende 80-%-Erstversuchsregel bleibt der Qualifikationsmaßstab. Wiederholung und Hinweisgewichte werden mit derselben Engine wie im Lernpfad geprüft. Freies Üben, Mini-Aufgabe, Einstufung und Inhaltsmeldungen verdienen in P2.14 keine XP oder Münzen. Freies Üben unterdrückt jedoch die heutige Erinnerung.

Startwerte: 10 XP für das erste Bestehen einer Lektion/Inhaltsversion, 5 für erneutes Bestehen, +5 ab 90 % anrechenbarer Genauigkeit und +3 vollständig ohne Hinweise. Die Basis wird mit Hinweisgewichten 100/90/80/0 % gewichtet und abgerundet. Münzen: 3 für das erste und 1 für erneutes Bestehen. Ein Streak-Schutz kostet 10 Münzen. Dies sind anpassbare Startwerte, keine weitere Preisentscheidung des Nutzers. Keine Echtgeldzahlung wird eingeführt.

`reward_rules` enthält unveränderliche Regelversionen mit Gültigkeitsbeginn. Die Function wählt die zum Abschlusszeitpunkt gültige Version. `append_learning_results` entscheidet unter der bestehenden Kontosperre atomar über Erstbestehen/Wiederholung und bucht Regelversion, Qualifikation, XP und Münzen. Bestätigte Buchungen werden bei neuen Regeln nicht rückwirkend verändert. Alte Sync-Clients erhalten weiterhin `{amount,date}`; aktuelle Clients verlangen `rewardFormat: 2`.

Die Serie zählt erfolgreiche Lerntage einmal, nicht abgeschlossene Lektionen. Sie verdient nach sieben tatsächlichen Lerntagen einen kostenlosen Schutz, höchstens zwei insgesamt mit gekauften Vorräten. Schutz wird automatisch für einen geschlossenen, verpassten Tag einer bestehenden Serie eingesetzt. Er erzeugt weder XP noch einen Lerntag. Eine ungeschützte Lücke unterbricht die Serie und den Fortschritt zum nächsten kostenlosen Schutz. Vorrat wird bei einer bereits unterbrochenen Serie nicht für weitere Pausentage verbraucht.

Beim Reisen wird der Übergang zunächst in der Zeitzone des vorherigen erfolgreichen Abschlusses ausgewertet; danach gilt die neue Abschlusszeitzone. Ein Ortswechsel allein erzeugt oder entfernt keinen Lerntag. Der heutige XP-Fortschritt verwendet die aktuelle Gerätezeitzone. Mitternacht und Sommerzeit werden als Kalendertage, nicht als feste 24-Stunden-Abstände gerechnet.

Schutzkäufe haben eine unveränderliche UUID, Zeitpunkt, Regelversion, Preis und Zeitzone. Der Server prüft Guthaben und Vorrat anhand der bisherigen Historie zum Kaufzeitpunkt. Ein Revisionstest unter derselben Kontosperre verhindert gleichzeitiges Ausgeben desselben Guthabens. Gleiche ID und gleicher Inhalt sind Wiederholungen; abweichender Inhalt ist ein Konflikt. Macht ein später nachgeladener Offline-Tag einen zuvor zulässigen Kauf überflüssig, wird er bei der Historienberechnung erstattet. Abgelehnte lokale Käufe werden ausgeschlossen und nicht erneut gesendet.

`harmonia-motivation.db` hält Wünsche, Regeln, Praxiszeitpunkt, Kaufwarteschlange und bestätigten Kontostand getrennt nach Besitzer. Gastdaten werden genau dem ersten angemeldeten Konto zugeordnet. Auf einem neuen Gerät gewinnen vorhandene Kontowünsche über dessen Startwerte; ausdrückliche Änderungen bleiben möglich. Bestätigte Anzeige gilt nur zur passenden Zeitzone, zum aktuellen Datum und zu denselben Lernnachweisen. Lokale Schreibfehler und ausstehende Bestätigung sind sichtbar. Eine ausdrückliche vorübergehende Sitzung sendet und plant nichts.

Erinnerungen verlangen Einwilligung und eine ausdrücklich ausgelöste Systemberechtigungsanfrage. Angeboten werden 17/18/19/20 Uhr, außerhalb der Ruhezeit 21–08 Uhr. Web speichert Wünsche, bietet aber keinen Web-Push. Native Apps planen als Ausweichweg höchstens sieben einmalige Erinnerungen und entfernen die heutige nach einer abgeschlossenen Übung. Der letzte geplante Erinnerungszeitpunkt schützt vor einem zweiten Versuch bei einer Reise. Nur eigene Benachrichtigungen werden gelöscht.

Remote-Push wird erst durch `HARMONIA_PUSH_ENABLED=true` auf dem Server sowie Projekt-/APNs-/FCM-Bindung verfügbar. Tokens haben eine siebentägige Lease. Installationskennung, lokale Widerrufsfähigkeit und steigende Revision verhindern, dass verspätete Anfragen ein altes Konto wieder anbinden. Logout kann das eigene Token auch ohne Kontositzung stilllegen. Ein noch anderweitig gebundenes Token nach Neuinstallation blockiert den Lern-/Kaufabgleich nicht; die neue Installation bleibt zunächst ohne eigenen Remote-Token. Abgelaufene Leases geben die eindeutige Tokenbindung frei. Systemwiderruf, Kontowechsel, Token-Rotation und Zustellfehler werden berücksichtigt; ein dauerhaft ungültiges Token wird erst mit einem neuen SDK-Token wieder aktiviert.

Der geplante Serverjob verwendet die Zeitzone und Sprache des zuletzt aktiven gültigen Kontogeräts. Die private Claim-RPC prüft aktuelle Einwilligung und heutiges Üben nochmals unter Kontosperre; sie erlaubt höchstens einen Versandversuch pro Konto/Ortsdatum und mindestens 23 Stunden Abstand. Bereits beanspruchte Fehler werden am selben Tag nicht erneut gesendet. Expo-Tickets und verzögerte Receipts werden geprüft; alte Receipts löschen nur das dazugehörige, noch unveränderte Token. TTL endet spätestens um 21 Uhr Ortszeit. Nachrichtentexte sind freundlich und enthalten keine Kontodaten.

Der Web-Dateipool von `expo-sqlite@57.0.4` wird über einen kleinen pnpm-Patch auf mindestens 32 Plätze erweitert, einschließlich bereits bestehender Sechser-Pools. Fünf Datenbanken und ihre gleichzeitigen Rollback-Journale benötigen mehr als die sechs upstream reservierten Dateien. Die Erweiterung löscht keine Daten und erhält die normale Journal-/Crash-Sicherheit. Bei einem SDK-Update den Patch prüfen und entfernen, sobald Expo ausreichend Kapazität verwaltet.

## Folgen und Grenzen

Der Server prüft Antworten und Wirtschaftsbuchungen; Offline-Abschlusszeiten bleiben Geräteangaben. Ein manipulierter Gerätezeitpunkt kann Kalenderhistorie beeinflussen. Das ist kein manipulationssicheres Liga-/Wettbewerbsmodell für Phase 3.

Lokale Erinnerungen gelten pro Installation; ohne Verbindung ist ein kontoübergreifender Vergleich mehrerer Geräte nicht möglich. Bereits bei APNs/FCM eingereichte Nachrichten lassen sich nach Logout nicht zurückholen. Die Vordergrundanzeige prüft den Besitzer und heutiges Üben nochmals. Im Hintergrund folgt die Oberfläche den Betriebssystemregeln. Lokale Planung wird beim Öffnen an Reisen, Uhrzeit und Sprache angepasst; Android darf inexacte Alarme verzögern. Native Zustellung, Ruhezeit bei geschlossenem Gerät und diese Übergänge benötigen die getrennte Geräteabnahme.

Der Scheduler verarbeitet je Lauf höchstens 1000 aktuelle Geräte und 1000 offene Receipts. Größere Populationen brauchen vor dem Betrieb Paginierung/Batch-Jobs. Migrationen, Functions, Vault und Cron werden vor dem Remote-Betrieb geprüft und bereitgestellt. Fachliche Kursfreigabe bleibt bei Claude Code; diese Änderung veröffentlicht keine Lektionen.
