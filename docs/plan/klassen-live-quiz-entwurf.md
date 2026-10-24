# P4.15 – Klassen-Live-Quiz als interner Entwurf

Stand: 24.10.2026 · Branch `codex/p4-15-class-live-quiz-draft`

**Technische P4-Vorarbeit auf Nutzerauftrag vor der formalen Phase-4-Freigabe.** Der Entwurf erweitert die lokale Schulwerkstatt und Aufgabenquellen aus P4.13/P4.14. Voraussetzung ist der noch offene [Entwurfs-PR #106](https://github.com/PhiFa96/harmonia/pull/106), der seinerseits #105 enthält. Alle fünf CI-Jobs für dessen Commit `c9b685d` sind inzwischen grün. Der neue PR gegen `main` enthält diese Voraussetzungen; ihre Integration ist vor einem späteren Merge abzustimmen.

Keine Veröffentlichung, Bereitstellung, echte Anmeldung oder Schulfreigabe. Sämtliche Quellen bleiben Entwurf bis zur unabhängigen Fachprüfung. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt. P4.17, Schulrecht/AVV, Identitäten, reale Geräte und Pilotabnahme bleiben offen.

## Ausprobieren

```sh
corepack pnpm school:preview
```

Es gelten [P4.13](schule-dashboard-entwurf.md) und [P4.14](schulaufgaben-entwurf.md): Node, Projektabhängigkeiten und lokales Docker; ausschließlich Loopback und ein eigener flüchtiger PostgreSQL-17-Container. Die Vorschau bietet weiterhin acht frei wählbare synthetische Konten, keine Authentifizierung. Keine echten Namen oder Schuldaten eingeben. Reguläres Stoppen löscht den Container; nach hartem Prozessabbruch kann der eigene Container bis zur manuellen Entfernung bestehen bleiben.

1. Als Lehrkraft eine Klasse mit eingeschriebenen synthetischen Lernkonten vorbereiten und **Klassen-Live-Quiz · Entwurf** öffnen.
2. Titel, Aufgabenquelle, Anzahl und 15–120 Sekunden pro Frage wählen. Der vorhandene begrenzte Katalog enthält vier ganze Lektions-Aufgabenfolgen und drei Bausteine für Notennamen, visuelle Intervallnummern und gehörte Intervalle. Die Oberfläche wählt eine Quelle pro Quiz; die Schnittstelle unterstützt dieselben geprüften Quellenkombinationen wie P4.14, mit insgesamt höchstens 20 Fragen.
3. **Quiz vorbereiten** erzeugt eine Lobby und einen zufälligen zehnstelligen Code. Die konkreten Aufgaben werden einmalig für alle Teilnehmer eingefroren. Der Code wird nur beim Erzeugen angezeigt; **Neuen Code anzeigen** ersetzt den bisherigen. Gespeichert wird ausschließlich sein Hash. Code und Lobby gelten höchstens zwei Stunden.
4. In einem zweiten Browserkontext mit einem bereits eingeschriebenen Lernkonto die Quiz-Liste öffnen und den Code eingeben. Ein Code ersetzt keine Klassenmitgliedschaft. Beitritt ist nur in der Lobby möglich, mit höchstens 30 Teilnehmern. Wiederholter Beitritt erzeugt keinen zweiten Platz. Ein vorhandenes Quiz lässt sich nach Reload über Liste oder `#quiz=<Kennung>` wieder öffnen.
5. Die Ranglistenfreigabe ist separat, freiwillig und standardmäßig aus. Mit ihr werden nur das zufällige Spielkürzel und die Punkte dieses Quiz für Mitspieler und Beamer sichtbar. Spielkürzel gewährleisten keine Anonymität; andere Personen können Zusammenhänge erkennen. Teilnahme funktioniert ohne Rangliste. Ein- und Ausschalten ist jederzeit möglich.
6. Als Lehrkraft optional **Beameransicht** einschalten und **Quiz starten**. Die Projektion blendet Konten-/Organisationsverwaltung aus und fragt ausdrücklich eine reduzierte Serveransicht ab: Fragen, Teilnehmer-/Antwortanzahl und freiwillige Spielkürzel, keine personenbezogene Ergebnistabelle. Der Modus bleibt an das berechtigte Lehrkraftkonto gebunden, ohne öffentlichen Projektorlink.
7. Alle Lernkonten erhalten dieselbe aktuelle Frage. Notenbilder und vorhandene Audio-Wiedergabe sind unterstützt. Jede Antwort wird serverseitig bewertet und nur einmal gespeichert. Während die Runde offen ist, werden weder Lösung noch Punkte veröffentlicht. Zeitbonus, Noten, XP und Zertifikate gibt es nicht.
8. Fristablauf oder **Runde auflösen** schließt die Frage. Jetzt erscheinen Lösung, eigenes Zwischenergebnis und die freiwillige Rangliste. **Nächste Runde** öffnet die nächste Frage; nach der letzten Runde endet das Quiz. Doppelte Steuerungsaufrufe mit altem Frageindex überspringen keine Runde.
9. **Quiz abschließen** beendet frühzeitig einschließlich der aktuellen Runde. Nicht gespielte Fragen zählen nicht zum Ergebnis; unbeantwortete gespielte Fragen zählen mit null Punkten. Ein beigetretenes Lernkonto ohne Antworten hat daher ein Ergebnis von null für die gespielten Runden. Gleiche Punktzahlen erhalten denselben Rang, nachfolgende Rangplätze berücksichtigen die Anzahl Gleichplatzierter.
10. Nach Quizende zeigt die Lehrkraftansicht die personenbezogenen Ergebnisse nur mit der separaten, aktuell gültigen Klassenfreigabe. Die Ranglistenfreigabe ersetzt diese nicht. Fehlende Klassenfreigaben werden aus der Klassensumme ausgeschlossen; deren Abdeckung wird angegeben. Eigene Ergebnisse sind unabhängig von beiden Freigaben sichtbar. **Quiz abbrechen** oder Ablauf der zweistündigen Sitzung beendet den Zugriff auf Rangliste und Auswertung dieses Quiz.

DE, en-US und en-GB sind vollständig vorhanden. Nach Beginn ist kein neuer Beitritt möglich; bestehende Teilnehmer können wieder einsteigen. Zusätzliche Pausen-, Team-, Geschwindigkeits- oder Belohnungsmodelle sind nicht Bestandteil dieses Entwurfs.

## Synchronisation und Rechte

- Vier zusätzliche RLS-Tabellen in `tools/school/quiz.sql`: Quizstatus, privates Material/Codehash, Teilnehmer und Antworten. Zusammen mit P4.13/P4.14 sind es 17 Tabellen. Keine produktive Migration oder exponierte Supabase-Schnittstelle.
- Die lokale Serverrolle bewertet mit der bestehenden Engine. Browser dürfen weder Antworten/Ergebnisse direkt in SQL schreiben noch privates Material oder Rohantworten lesen. IDs, Punkte, Zeitangaben und Rollen aus zusätzlichen Clientfeldern werden zurückgewiesen.
- Datenbankzeit und Sperren je Klasse bestimmen Rundenstand, Platzvergabe und Antwortannahme. Bereits gespeicherte gleiche Antworten sind idempotent; abweichende Wiederholungen werden zurückgewiesen. Ein Material-Prüfwert sperrt die weitere Bearbeitung bei unbemerkter Änderung. Neue Inhalte erfordern ein neues Quiz.
- Server-Sent Events übertragen vollständige, neu autorisierte Ansichten. Schreibvorgänge wecken offene Verbindungen sofort; zusätzlich werden auch ruhige Verbindungen einmal pro Sekunde gegen die Datenbank geprüft. Keine Lösungen oder Rohantworten in allgemeinen Broadcasts. Neue Verbindungen erhalten den aktuellen Zustand; die Datenbank ist die Quelle für Wiederaufnahme.
- Bei Konto-/Rechtewechsel endet die alte Verbindung. Bei Verbindungsfehlern verschwinden Ergebnisse und Antwortfelder; Browser-Offline-/Online-Ereignisse und erneuter Verbindungsaufbau holen einen frischen Stand. Heartbeats erfolgen spätestens nach 15 Sekunden; nach 20 Sekunden ohne Snapshot entfernt der Browser die Darstellung und versucht einen neuen Abruf. Hintergrundwechsel stoppt Verbindung und Audio; Rückkehr prüft Rechte erneut. Bereits gesehene Angaben lassen sich nicht zurückholen.
- Maximal vier Streams pro Sitzung und 128 pro Vorschau, auch bei parallelem Verbindungsaufbau. Langsame Verbindungen mit Rückstau werden geschlossen und können sich mit aktuellem Snapshot erneut verbinden. Ein Datenbank-/Autorisierungsfehler beendet die betreffende Verbindung; die Oberfläche bietet erneutes Verbinden.
- Entfernen/Verlassen einer Klassenmitgliedschaft löscht deren Quizteilnahme und Antworten kaskadierend. Wiederbeitritt stellt sie nicht wieder her. Archivieren sperrt alle Ansichten; Klassenlöschung entfernt Quiz und Material. Die Zweistundenfrist beendet die Sitzung, ist jedoch keine zusätzliche automatische Datenlöschfrist. Der gesamte Vorschaucontainer ist flüchtig.

## Prüfungen

```sh
corepack pnpm school:test:db
corepack pnpm school:test
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium corepack pnpm school:test:web
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm format:check
```

- PostgreSQL/pgTAP: Zugriffsgrenzen, private Lösungen/Rohantworten, getrennte Ranglisten- und Klassenfreigabe, Zurückhalten laufender Punkte, Rechteentzug und Löschung. Der Aufbau wird lokal auch ohne Superuserrechte geprüft; in der Supabase-CI wird sämtliches Entwurfs-DDL mit Testdaten zurückgerollt.
- Server: vollständige Runden in drei Sprachen, konkurrierende Antworten und Steuerungen, Ablauf, frühes Ende, Codewechsel, Kapazität, Manipulationen, Materialänderung und Rechteentzug.
- Realtime-Lastprobe: **30 getrennte synthetische HTTP-Sitzungen mit 30 gleichzeitigen SSE-Verbindungen** gegen echten lokalen HTTP-Server und PostgreSQL. Gleiche Frage, 30 eindeutige Antworten trotz Wiederholung, Wiederverbindung und gleiche abschließende Rangliste. Ein isolierter lokaler Lauf maß 244 ms vom Startaufruf bis zu allen 30 Frageansichten; der Test verlangt unter fünf Sekunden. Das ist eine einzelne synthetische Funktions-/Lastprobe, kein Netz- oder Gerätebenchmark.
- Browser: Lehrkraft und Lernkonto, Lobbycode, Beamer, Audio, Reload, Rangliste, Freigabe/Widerruf, Notation, automatische Frist, Offline/Online, Rechteentzug, schmale Ansicht und Axe. Die bestehenden Schul- und Aufgabenabläufe laufen mit. Ein älterer Aufgaben-Browsertest wartete nach dem Start nicht auf die Antwortfelder; die Probe wartet nun auf deren tatsächliche Sichtbarkeit.
- Bundle-Wache: zusätzliche P4.15-Merkmale verhindern Entwurfstexte und privates Material im öffentlichen App-Export. Keine neuen Standardübersetzungs- oder App-Routenimporte.

Lokaler Nachweis am 24.10.2026: **88/88 pgTAP-Prüfungen**, **40/40 Server-/Werkzeugtests**, **12/12 Chromium-Abläufe**, vollständiger Lint, Typcheck und Formatprüfung erfolgreich. Produktions-Webexport und Bundle-Wache bestanden: fünf JavaScript-Dateien ohne unveröffentlichte Inhalte.

**Die im Plan verlangte Abnahme mit 30 echten gleichzeitigen Geräten bleibt offen.** Die lokale Lastprobe prüft 30 Netzwerkclients auf demselben Rechner; weder reale WLAN-Bedingungen noch Mobilgeräte, Audioausgabe oder Unterrichtsbetrieb werden dadurch abgenommen. GitHub-CI und lokale Ergebnisse werden im PR getrennt ausgewiesen. Keine technische Prüfung ersetzt formale P4-, Fach- oder Rechtsfreigaben.

## Nächster Schritt

Im Plan folgt **P4.16 – Schul-Lizenz**. Ein nächster interner technischer Entwurf kann Plätze, Laufzeiten und Freischaltungen mit Testdaten erproben. Reale Verträge, Rechnungen/Zahlungen und eine eingerichtete Pilotschule benötigen ihre offenen rechtlichen und betrieblichen Voraussetzungen; P4.17 bleibt eine gesonderte Prüfung.

Architektur: [ADR 0042](../decisions/0042-klassenquiz-mit-autorisierten-live-ansichten.md). Datenkategorien: [Datenschutzentwurf Schule](../quality/p4-13-datenschutz-entwurf.md).
