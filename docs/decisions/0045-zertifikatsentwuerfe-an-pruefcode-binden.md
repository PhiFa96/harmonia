# ADR 0045 – Zertifikatsentwürfe an den Prüfcode binden

Datum: 25.10.2026 · Status: angenommen für interne technische Vorarbeit

## Ausgangspunkt

P4.18 erzeugt ausschließlich ungültige lokale Muster nach ADR 0039. Der Aufgabenfingerabdruck bindet bisher Profil, Inhaltsversion und erzeugte Aufgaben. Eine Änderung des Bewertungscodes bei gleichbleibenden Aufgaben war dadurch nicht erfasst. P4.17 und der Zertifikatsprototyp lagen zudem auf getrennten Entwurfsbranches.

## Entscheidung

- Auf `codex/p4-18-review-bound-draft` werden die Entwurfsstände #109 und #104 lokal zusammengeführt. Ein neuer Entwurfs-PR ermöglicht die gemeinsame Prüfung; dies integriert oder veröffentlicht nichts auf `main`.
- Jeder neue lokale Durchgang erhält einen SHA-256-Prüfwert der vollständigen Prüfungsimplementierung: Werkstatt, Inhalte, Übungs-/Theorie-/Notations-/Audioquellen, Übersetzungen, gebundene Schriften und Abhängigkeitsdateien. Neue Quelldateien in diesen Verzeichnissen verändern den Prüfwert ebenfalls. Tests und erzeugte Berichte sind ausgenommen.
- Der Server ermittelt diesen Stand beim Start. Nach Quelländerungen muss er neu gestartet werden; es gibt keine garantierte Überwachung oder dynamische Neuladung eines laufenden Prozesses. Ein übergebener Prüfwert ist ausschließlich eine interne Abhängigkeit für Tests, kein HTTP-Feld.
- Der lokale SQLite-Bestand erhält additiv `source_hash`. Fehlende/abweichende Bindung führt zu `outdated`: keine Fragen, Neubewertung, Fortsetzung oder neue PDF-Ausgabe. Eigene Daten bleiben löschbar; Widerruf bleibt über den Service möglich. Unveränderte Neustarts erhalten die Fortsetzung. Alte Ergebnisdatensätze werden nicht neu bewertet oder als aktuell ausgegeben.
- Neue Muster-PDFs nennen den ursprünglichen technischen Prüfstand, weiterhin mit **ENTWURF / UNGÜLTIG**. Hash, Testgrenze und lokale Codeprüfung bestätigen keine Identität, Qualifikation, Echtheit eines Rechtsgutachtens oder fachliche Anerkennung.
- Eine private DE/en-US/en-GB-Prüfmappe enthält drei feste Aufgabenstichproben je Profil, Quellen-/Lösungsbezug und Einheiten ohne Prüfungsaufgabe. Die Lösungen stammen aus derselben Engine und bleiben Gegenstand der unabhängigen Prüfung.
- `check:certificates` prüft diese Vorbereitung. `check:certificates:release` sperrt ausdrücklich wegen des fehlenden Produktmodus und offener Produktabnahmen sowie der aktuellen P4.17-Zertifikatsprüfung. Auch vollständig ergänzte Rechtsfelder allein würden den lokalen Server nicht in einen Produktmodus versetzen.
- Das KI-Inventar erfasst jetzt die tatsächlich vorhandene Zertifikatswerkstatt, einschließlich Quellcode und Prüfungszweck. Sämtliche juristischen Einstufungen und Maßnahmen bleiben offen.

## Folgen und Grenzen

Die breite Bindung bevorzugt einen erneuten synthetischen Durchgang gegenüber einer stillen Übernahme veränderter Prüfungslogik. Auch eine fachlich unbedeutende Änderung an einer erfassten Datei kann einen alten Entwurf sperren. Ein semantischer Kompatibilitätsnachweis ist nicht implementiert. Abhängigkeiten müssen aus dem gebundenen Lockfile installiert werden; ein manipulierter Prozess oder privilegierter Datenbankzugriff liegt außerhalb dieser lokalen Konsistenzprüfung.

Die Prüfmappe enthält Lösungsschlüssel und wird nur unter dem ignorierten `artifacts/certificates/review/` erzeugt, mit Verzeichnisrechten 0700 und Dateien 0600. Der Prüfungsserver hat dafür keinen Auslieferungspfad. Keine neue öffentliche App-Route, produktive Identität, Zahlung, gültige Urkunde oder Veröffentlichung.

Technische P4-Vorarbeit findet auf Nutzerauftrag **vor der formalen Phase-4-Freigabe** statt. P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt. P4.17, unabhängige Fachprüfung und sämtliche Produktabnahmen aus P4.18 bleiben offen.
