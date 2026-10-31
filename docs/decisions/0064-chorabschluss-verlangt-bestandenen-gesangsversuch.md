# ADR 0064 – Chorabschluss verlangt einen bestandenen Gesangsversuch

Datum: 28.10.2026. Status: ausdrücklich vom Nutzer beauftragte Produktentscheidung, als interner technischer Entwurf umgesetzt.

## Auftrag und Regel

Nach dem vollständig grünen Entwurfs-PR #131 wurde empfohlen, für den Chorabschluss zusätzlich zur 80-%-Regel mindestens eine bestandene Gesangsaufgabe zu verlangen. Der Nutzer bestätigt: „Dann los! Mach P4.11 komplett!“ Damit ist die entsprechende offene Entscheidung aus ADR 0037/0063 geklärt.

Die vier Chor-Lektionen setzen ausdrücklich `minimumChoirCorrect: 1`. Eine gültige Fertigmeldung verlangt gleichzeitig:

1. Der Durchlauf ist abgeschlossen.
2. Mindestens eine Aufgabe zählt im Quotennenner.
3. Mindestens 80 % der gezählten Erstversuchsaufgaben sind anrechenbar richtig.
4. Mindestens eine eigene `CHOIR_PART`-Aufgabe wurde im Erstversuch anrechenbar bestanden.

Hinweise 1–2 bleiben erlaubt. Eine angezeigte Lösung, ein erst in der Fehlerwiederholung erzielter Erfolg oder eine als Wiederholungsfrage eingefügte Chor-Aufgabe erfüllt Punkt 4 nicht. Die Engine entscheidet weiter anhand der übergebenen Antwortwerte. Dies ist keine technische Bestätigung, dass ein echter Mensch tatsächlich gesungen hat.

Überspringen bleibt möglich und zählt weiterhin weder als richtig noch im Quotennenner. Allein richtige Wiederholungsfragen können den Chorabschluss nicht mehr vergeben. Das betrifft ausschließlich die vier neu versionierten Chor-Lektionen. Die bestehenden mikrofonfreien Bestehenswege anderer Lektionen und freie Übungssitzungen bleiben erhalten. Historische Regeln und Erfolge werden nicht rückwirkend umgedeutet.

## Umsetzung und Konsistenz

- Die Anforderung steht im versionierten Katalog und der aufgelösten Lektion. Die Katalogprüfung weist die Regel ohne eigene Chor-Aufgabe zurück. Der Client kann die serverseitig rekonstruierte Anforderung nicht ausschalten.
- Die gemeinsame `lessonProgress`-Auswertung zählt nur eigene, richtig bewertete Erstversuche ohne Lösung. Lernpfad, XP, Coins und qualifizierte Lernaktivität verwenden dieselbe Bestehensentscheidung. Ohne erforderlichen Gesang entstehen keine Abschlussbelohnungen.
- Einführung und Abschlussanzeige erklären die Bedingung in DE/en-US/en-GB. Die Anzeige nennt den fehlenden Gesangsversuch auch dann, wenn die Wiederholungsquote 100 % beträgt. Der reine interne Vorschaueinstieg vergibt weiter keine Lernnachweise oder Belohnungen und zeigt keine irreführende Abschlussregel.
- Ein dabei gefundener Mischplanfehler wird für die neue Chor-Version korrigiert: Der Plan kündigte fünf Wiederholungen an, fügte aber nur zwei ein. Neue Chor-Pläne fügen alle angekündigten Wiederholungen ein, sowohl fest als auch adaptiv und bei der Serverrekonstruktion. Andere historische Mischpläne bleiben reproduzierbar.
- `choirCorrect` wird als begrenzter Zähler in der vertrauenswürdigen Fortschrittszusammenfassung erhalten. Nach der Antwortkürzung bleiben Quote und Gesangsbedingung prüfbar. Fehlende oder unmögliche Zähler, widersprüchliche Erfolgsflags und Zähler bei nicht dafür vorgesehenen Lektionen werden abgewiesen. Ein vollständig übersprungener reiner Gesangsdurchlauf bleibt auch nach Verdichtung mit Nenner null korrekt als nicht bestanden lesbar.
- Uploads enthalten weiter ausschließlich die ursprünglichen Antworten/Skips, keine clientseitigen Erfolgszähler oder fertigen Fortschrittsbehauptungen. Die Edge Function rekonstruiert Aufgaben und Ergebnis; Retention verwendet die beim Upload gespeicherte Serverzusammenfassung.

## Versionierung und Protokoll

Katalog/Fähigkeitsplan und die vier Chor-Lektionen erhalten Version 27. Chor-Einheit/Fähigkeiten bleiben 26, Übungssätze/Ratingquellen 25, Einführungskarten 24. Alte Chor-Durchläufe 26 benötigen einen neuen Start. Auch kataloggebundene Übungs-/Stufe-5-Vorschauen benötigen nach dem Versionswechsel einen Neustart. Klang, Zielnoten, Toleranzen, Oktavregel, Tonhöhen-Antwortformat und Tutor-Prompt/-Werkzeuge ändern sich nicht.

Der gekürzte Zähler erweitert das streng geprüfte Sync-Format. Die App fordert `rowFormat: 5` an; der Server unterstützt weiterhin die früheren Formate, verweigert ihnen aber Seiten mit neuen gekürzten Chor-Zählern ausdrücklich mit HTTP 426 (`upgrade_required`). Andere bisher unterstützte Seiten bleiben lesbar. Es ist keine SQL-Spalte oder Migration erforderlich. Keine entfernte Function-/App-Bereitstellung; vor einer späteren Veröffentlichung muss der neue Server das neue Clientformat unterstützen.

## Nachweise und Grenzen

Tests prüfen feste/adaptive Pläne aller Stimmen, die zusätzliche Gesangsbedingung bei ansonsten erfüllter Quote, Hinweise/Lösungen, Fehlerwiederholung, unveränderte 80-%-Grenze, Offline-Wiederaufnahme, manipulierte Quellen, Belohnungen, SQLite-Verdichtung und Sprachfassungen. Die lokale HTTP-/DB-Integration prüft echte Auth-Konten und Engine-Rekonstruktion, Nullbelohnung ohne Gesang, isolierte Konten, den tatsächlichen Retention-Dienst und die Protokollgrenze für ältere Clients. Es werden ausschließlich eigene synthetische Antworten und Testkonten verwendet.

Dies bleibt technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**. Inhalte bleiben `entwurf`; nichts wird veröffentlicht oder gemergt. Unabhängige Fach-/Sprachprüfung, reale Kopfhörer-/Stimmen-/iOS-/Android-/Screenreader-/Latenztests bleiben offen. Die Abschlussentscheidung ist getroffen; fachliche und Geräteabnahmen werden nicht durch Softwaretests ersetzt. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt.
