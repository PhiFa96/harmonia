# ADR 0042 – Klassenquiz mit autorisierten Live-Ansichten

- Datum: 24.10.2026
- Status: angenommen für den internen Entwurf; keine Schul-/Rechtsfreigabe
- Bezug: P4.15, ADR 0040/0041, `docs/plan/klassen-live-quiz-entwurf.md`

## Kontext

Die lokale P4.13/P4.14-Werkstatt soll einen vollständigen gemeinsamen Quizablauf tragen. Klassenrechte, widerrufbare Freigaben, Übungsquellen und Engine-Bewertung liegen vor. Produktive Identitäten, formale P4-Freigabe und die geforderte Abnahme mit 30 echten Geräten fehlen weiterhin.

## Entscheidung

Ein Quiz enthält höchstens 20 eingefrorene Fragen, 30 Teilnehmer und 15–120 Sekunden je Frage. Die Lobby endet beim Start oder spätestens nach zwei Stunden. Ein zufälliger gehashter Code erlaubt nur bereits eingeschriebenen Lernkonten den Beitritt. Reload verwendet die bestehende Teilnahme; neue Beitritte nach Start werden zurückgewiesen.

PostgreSQL hält den autoritativen Rundenstand. Klassensperren, Frageindex und Datenbankzeit verhindern übersprungene Runden, doppelte Wertung und verspätete Antworten. Eine richtige Antwort ergibt einen Punkt ohne Zeitbonus. Lösungen/Punkte erscheinen erst nach Schließen einer Runde. Nicht gespielte Fragen sind aus einem frühen Endergebnis ausgeschlossen; unbeantwortete gespielte Fragen zählen mit null. Ein Abbruch erzeugt keine sichtbare Rangliste/Auswertung.

Server-Sent Events übertragen vollständige, je Sitzung frisch autorisierte Snapshots, keine gemeinsamen sensiblen Datenpakete. Schreibzugriffe wecken Streams sofort, eine zusätzliche Sekundenprüfung berücksichtigt ruhige Verbindungen und Rechteänderungen außerhalb des HTTP-Pfads. Wiederverbindung liest die Datenbank; fehlende Ereignisse müssen nicht nachgespielt werden. Gleichzeitige Streams sind begrenzt, Rückstau beendet die Verbindung. Browser entfernen veraltete Ansichten bei Offline/Fehler, Hintergrundwechsel und ausbleibendem Heartbeat.

Rangliste und personenbezogene Auswertung haben unterschiedliche Freigaben. Die pro Quiz freiwillige Rangliste zeigt zufällige Spielkürzel und Punkte, ohne eine Garantie von Anonymität. Die Lehrkraft erhält personenbezogene Ergebnisse erst nach Ende und mit aktueller Klassenfreigabe. Der Beamer fordert eine reduzierte Serverprojektion an und erhält keine personenbezogene Ergebnistabelle. Verlassen/Entfernen löscht Teilnahme und Antworten kaskadierend.

## Konsequenzen

- Ein kompletter lokaler DE/EN-Ablauf mit Audio, Projektion, Wiederaufnahme und Auswertung ist prüfbar; Quellen bleiben unabhängig fachlich zu prüfen.
- SSE und die gemeinsame Klassensperre sind bewusst für die begrenzte lokale Last gewählt. Der Test mit 30 HTTP/SSE-Clients ist keine 30-Geräte-, WLAN- oder Produktions-Skalierungsabnahme.
- Keine Supabase-Produktionsmigration, echte Anmeldung, Noten, XP, Zertifikate oder externe Einladung. P4.01 bleibt wegen F14/Recht zurückgestellt; technische P4-Vorarbeit erfolgt vor formaler Freigabe.
- Die flüchtige Vorschau ersetzt weder verbindliche Löschfristen und Kontenexport noch P4.17, AVV/Schulrecht und Pilotabnahme.
