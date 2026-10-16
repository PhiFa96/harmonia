# ADR 0033 – Duelle aus geprüften Rush-Aufgaben

- Status: technisch vorbereitet; lokale Datenbank-, Realtime- und Geräteabnahme offen
- Datum: 16.10.2026
- Arbeitspaket: P3.06

## Entscheidung

Ein Duell verwendet dieselbe versionierte, visuelle Rush-Aufgabenbank und dieselbe deterministische Engine wie P3.05. Der Server friert Bank, Regelprofil und Seed pro Spiel ein. Beide Seiten erhalten dieselbe Folge aus `rushQuestion`, senden nur den fortlaufenden Index und die Antwort und bekommen Punkte erst nach der Engine-Prüfung. Die Datenbank begrenzt die Antwortfolge, Mindestzeit und dreiminütige Deadline. Ein Countdown von acht Sekunden gibt beiden Geräten Zeit, die Paarung abzurufen; die Spielzeit beginnt erst danach. Netzwerkverlust pausiert weder Countdown noch Spiel. Der eigene bestätigte Stand wird wieder geladen; ein privater Realtime Broadcast kündigt nur eine Aktualisierung an. Er entscheidet nie über Punkte oder Ergebnis. Polling bleibt als Rückfallweg aktiv.

## Gegner und Wertung

Ein Konto kann nur ein aktives Duell führen. Wartende Personen werden nach eigenem Duell-Rating gepaart; das zulässige Ratingfenster wächst mit der Wartezeit. Die Warteschlange verwendet gesperrte Zeilen und Kontosperren, damit konkurrierende Suchen keine Doppelbelegung erzeugen. Nach zehn Sekunden kann eine bestätigte, nicht gekürzte dreiminütige Rush-Aufzeichnung aus derselben Wettbewerbsbank mit ähnlichem Rating einspringen. Ohne passende echte Aufzeichnung bleibt die Suche offen. Ghost-Duelle sind deutlich gekennzeichnet; sie erzeugen keine neue Spieleridentität. Einladungen sind zehn Minuten gültige zufällige UUID-Links; wer den Link besitzt und angemeldet ist, kann teilnehmen. Zusätzlich kann der Code manuell eingegeben werden, falls ein Plattformlink nicht geöffnet wird.

Nur Live-Duelle zwischen zwei Konten ändern `duel_ratings`. Nach Ablauf berechnet die Edge Function für beide Seiten Glicko-2 aus demselben Ratingzustand und dem geprüften Punktvergleich. Ein geplanter Serviceaufruf kann auch Spiele abschließen, die niemand mehr öffnet. Die Datenbank setzt Ergebnis, Ratings und XP in einer Transaktion; Wiederholungen haben keine zweite Wirkung. Sieg gibt anfänglich 10 XP, Niederlage oder Unentschieden 3 XP, höchstens 50 Duell-XP je UTC-Tag. Die Werte stehen in einer privaten Regelzeile. Einladungs- und Ghost-Duelle sind ohne Rating und XP, damit eigene Zweitkonten und aufgezeichnete Läufe keine Ranglistenpunkte erzeugen. Duelle vergeben keine Münzen, Lernfreischaltungen oder qualifizierenden Serientage.

## Daten und Grenzen

Antworten, Spielquellen, Einladungen und Ratings sind servicegeschützt. Der eigene Export enthält persönliche Rating-, Spiel-, Antwort-, Warteschlangen- und Einladungsdaten, aber keine fremden Konten. Kontolöschung entfernt persönliche Einträge; abgeschlossene Ergebnisse der verbleibenden Person bleiben als eigenes Ergebnis erhalten. Der bestehende Retentionjob entfernt Duell-Rohantworten und Aufgabenquellen nach zwölf Monaten ab Spielbeginn, Einladungen nach Ablauf plus 30 Tagen. Aktuelle Ghosts verweisen nur auf echte Rush-Läufe der letzten 30 Tage. Wird deren Quelle während eines laufenden Ghost-Duells gelöscht, bleibt das gespeicherte Endergebnis; die Fortschrittskurve kann dann nicht mehr vollständig abgespielt werden.

Die öffentliche Aufgabenbank enthält weiterhin keine freigegebenen Lektionen, daher startet ein produktives Duell bis zur fachlichen Freigabe nicht. Bot-Schutz ist mit Engine-Nachrechnung und Mindestantwortzeit nicht vollständig erreicht. Für ein Release fehlen lokale Postgres-/Realtime-Integration, physische iOS-/Android-/Web-Kombinationen, schwaches Netz, Betreiber- und Datenschutzabnahme sowie ein aktivierter und überwachter Abschlussjob. Der vorliegende Branch wird gemäß aktueller Nutzeranweisung ohne Codex-PR oder Merge an Claude Code übergeben.
