# ADR 0031 – Wöchentliche Ligen aus bestätigten XP

Datum: 16.10.2026. Status: technisch umgesetzt; Integration und Betriebs-/Geräteabnahme offen.

## Entscheidung

Die Woche beginnt weltweit montags um 00:00 UTC. Die Oberfläche nennt zusätzlich das lokale Ende. Ausschließlich neue positive Buchungen im kanonischen `xp_ledger` vergeben Liga-XP. Der Insert-Trigger ermittelt die Woche nach Erwerb der Transaktionssperre über die Serveruhr; weder Abschlussdatum, lokale Tagesgrenze noch Clientzähler bestimmen die Liga. Nachträglich übertragene Offline-Nachweise zählen bei Bestätigung in der dann laufenden Woche. Vor der Migration gebuchte XP werden nicht nachgetragen. Idempotente Nachweis-Retries erzeugen keine neue Buchung und damit keine weiteren Liga-XP. FSRS-Kartenselbsteinschätzungen und die bestehenden Übungsmodi ohne XP verändern die Liga nicht.

Die sieben Stufen sind `pp → p → mp → mf → f → ff → fff`. Ein Konto beginnt in pp. Erst die erste positive XP-Buchung einer Woche teilt es einer Gruppe gleicher Stufe zu. Standard: bis zu 30 Personen und fünf Auf-/Abstiegsplätze; `league_rules` erlaubt serverseitige Änderung für neu entstehende Gruppen. Jede Gruppe speichert ihre Regeln. Aufnahme, Aufsummierung und Abschluss verwenden dieselbe kurze Transaktionssperre; keine nachträgliche Befüllung geschlossener Gruppen. Vor Aufnahme in eine spätere Woche wird die vorherige eigene Gruppe gegebenenfalls abgeschlossen. Ein verspäteter Job kann dadurch keine falsche Stufe zuweisen. Eine Woche ohne neu bestätigte XP erzeugt keine Teilnahme und keinen zusätzlichen Abstieg. Noch offene Vorwochenresultate werden weiterhin abgerechnet.

Sortierung: Wochen-XP absteigend, Aufnahmezeit aufsteigend, dann gruppeninterner Platz. Bei Gleichstand gewinnt also die frühere Aufnahme. Je Richtung gelten höchstens `min(movement, floor(Gruppengröße / 2))` Plätze; Auf- und Abstieg überlappen nicht. Eine Einzelperson bleibt in ihrer Liga. In pp entfällt der Abstieg, in fff der Aufstieg; es werden dafür keine zusätzlichen Plätze auf der anderen Seite vergeben. Die Vorschau ist ausdrücklich vorläufig.

Der Abschluss speichert Rang, Ausgang und nächste Stufe atomar und nur einmal. Löschung anderer Konten ändert abgeschlossene eigene Resultate nicht. `close_league_weeks` verarbeitet höchstens 100 Gruppen pro Standardaufruf und meldet verbleibende Arbeit. Ein minütlicher `pg_cron`-Job ist als überprüfbares Betriebsskript vorbereitet. Die gemeinsame Sperre priorisiert nachvollziehbare Korrektheit; die lokale Mehrtausend-Simulation ersetzt keine Lastabnahme einer produktiven Umgebung.

## Datenschutz und Benachrichtigungen

`learner_league()` bindet die Identität ausschließlich an den geprüften eigenen JWT. Direkte Tabellenleserechte zeigen nur eigene Konto-/Mitgliedschaftszeilen. Die Rangliste liefert nur Gruppenplatz, Rang, XP und „Du“. Andere sehen etwa „Lernperson 7“ / „Learner 7“. Keine Profilnamen, E-Mails, fremden Konto-IDs, globalen Handles oder individuellen Aufnahmezeiten. Die Kennung gilt nur innerhalb der jeweiligen Gruppe; gleiche Nummern über verschiedene Wochen bedeuten keine Verbindung.

Ergebnisanzeige und eigener Lesemarker sind dauerhaft im Konto vorhanden. Unter Datenschutz kann die globale Erlaubnis unabhängig von den einzelnen Kategorien widerrufen werden; das entfernt auch die Liga-Auswahl und registrierte Tokens. Eine neue globale Erlaubnis allein aktiviert keine Kategorie. Systemmitteilungen haben ein getrenntes, standardmäßig ausgeschaltetes Liga-Opt-in. Erforderlich bleiben globale Push-Einwilligung, Betriebssystem-Erlaubnis, aktives Gerätetoken, nicht gelesener aktueller Vorwochenabschluss und aktivierter Pushbetrieb. Beide Kategorien teilen dasselbe atomare Tagesbudget, einschließlich fehlgeschlagener Versuche, der 23-Stunden-Sperre und der gewählten Ortszeit außerhalb 21–08 Uhr. Ein Resultat erhält maximal einen Versuch, spätestens innerhalb seiner Folgewoche; spätere Rückkehr zeigt es weiterhin in der App. Der Mitteilungstext nennt weder Rang noch XP. Fehlende Providerbindung wird nicht als erfolgreiche Einrichtung angezeigt.

Die Versandabfrage filtert vor der Begrenzung auf 1.000 Konten nach Berechtigung, Fälligkeit und schon verbrauchtem Budget. Bereits verarbeitete oder heute schon übende Konten blockieren dadurch keine wartenden Ergebnis-Mitteilungen. Die Auswahl ersetzt nicht die erneute Prüfung beim atomaren Claim. Bekannte Ticket-/Receipt- und Tokenrotationsregeln bleiben erhalten. Native Ergebnisaufrufe warten auf die passende initialisierte Sitzung und verbrauchen die Kaltstartantwort einmal.

Das eigene Exportpaket enthält Liga-Konto und Mitgliedschaften. Kontolöschung entfernt diese Daten kaskadierend und sperrt verzögerte lokale Antworten. Der Wochenjob hält höchstens die laufende und die letzten 52 abgeschlossenen Wochen vor; die aktuelle Stufe und Kategoriepräferenz bleiben bis Kontolöschung. Die notwendigen Rechts-/Storeinformationen bleiben Arbeitsentwürfe und benötigen weiterhin rechtliche Abnahme.

## Sprache und Bereitstellung

Dynamikangaben kommen aus dem zentralen Glossar: pianissimo, piano, mezzo piano, mezzo forte, forte, fortissimo, fortississimo. Italienische Vortragsanweisungen bleiben kleingeschrieben; Erklärungen und Oberfläche liegen in DE/US/UK vor. Ligen messen Aktivität, kein musikalisches Können. Es wird keine neue musikalische Inhaltsfreigabe behauptet.

Öffentliche Expo-Umgebungseinstellungen fließen zusätzlich zur Inhaltsvariante in den Metro-Cache-Schlüssel ein. Ein Gastexport darf keine früher eingebundene lokale Auth-Konfiguration übernehmen. Der explizite lokale Auth-Testexport verifiziert die eingebundene lokale Adresse und enthält ausschließlich den öffentlichen Anon-Schlüssel.

Änderungen bleiben auf einem normalen Featurebranch auf P3.03. Claude Code übernimmt PR, CI und Integration. Remote-Migration, Cron-Aktivierung, Pushanbieter und tatsächliche native Zustellung werden nicht durch lokale Ersatztransport-Tests abgenommen.
