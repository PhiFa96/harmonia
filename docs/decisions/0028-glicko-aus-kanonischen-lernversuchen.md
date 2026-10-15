# ADR 0028 – Glicko-2 aus kanonischen Lernversuchen

Status: technisch umgesetzt, empirische Abnahme offen. Datum: 15.10.2026.

## Entscheidung

P3.01 verwendet eine eigene reine TypeScript-Implementierung in `packages/exercises`. Startwerte: Rating 1500, Abweichung 350, Volatilität 0,06; Tau zunächst 0,5 und serverseitig konfigurierbar. Die gemeinsame Skala beschreibt relative Fähigkeit bzw. Schwierigkeit, keine Note oder bestätigte Beherrschung.

Eine abgeschlossene Lektion ist eine Rating-Periode. Beide Seiten verwenden die Zustände vor dieser Periode. Nur tatsächlich beantwortete Erstaufgaben ohne Hinweis zählen; falsche unabhängige Antworten zählen als Niederlage. Wiederholungsrunde, Hinweise 1–3 und übersprungene Hörfragen liefern keine zusätzliche Evidenz. Die 80-%-Bestehensregel und XP verwenden weiterhin ihre eigene bestehende Auswertung. Die Einstufung bleibt bis P3.02 getrennt.

Die Zuordnung folgt dem tatsächlichen Übungssatz jeder Aufgabe, auch bei eingestreuten Wiederholungen. Bei mehreren zugeordneten Fähigkeiten erhält jede eine eigene Beobachtung; für die Aufgabenschwierigkeit zählt die Antwort genau einmal gegen den Mittelwert ihrer Fähigkeiten mit deren größter Unsicherheit. Das ist eine vorläufige Modellannahme, keine Behauptung unabhängiger Teilfähigkeiten. Sie benötigt Prüfung an echten Lernverläufen.

Parameterprofile sind nach Algorithmusschema, Inhaltsversion, Übungstyp und den ausdrücklich verfassten Parametern getrennt. Die 19 Typen haben eine vollständige Parameter-Allowlist. Objektreihenfolge und Reihenfolge von Optionen verändern die Kennung nicht. Wiederholte Optionen bleiben als mögliche Auswahlgewichtung erhalten. Implizite und explizit verfasste Defaultparameter bleiben getrennte Profile; eine spätere Zusammenlegung benötigt eine neue Profilversion. Texte, Locale, Antwort und Seed sind keine Profilparameter. Es gibt keine fachlich erfundene Rangfolge von Profilen; ihre Schwierigkeit wird geschätzt.

Zusätzlich verstrichene vollständige inaktive Tage erhöhen die Unsicherheit, höchstens bis 350. Grundlage ist der serverseitige Empfangszeitpunkt, nie die frei übertragene Abschlusszeit. Spät synchronisierte Daten drehen den letzten Übungszeitpunkt nicht zurück.

## Speicherung und Wiederaufnahme

Die bestehende Tabelle `learning_events` bleibt die Quelle. Die im frühen Plan erwähnte Tabelle `item_attempts` wurde in P2 nicht angelegt und wird nicht als paralleler Antwortspeicher eingeführt. `skill_progress` enthält ausschließlich die persönliche Rating-Projektion; Lernpfadstatus bleibt aus den vorhandenen Nachweisen abgeleitet. `item_difficulty` enthält kontounabhängige Modellparameter, keine Antwort-/Nutzerliste. Direkter Zugriff bleibt auf den Service beschränkt; Konten lesen nur eigene Fähigkeiten.

Nach dem kanonischen Sync verarbeitet dieselbe portable Routine höchstens 50 ausstehende Ereignisse dieses Kontos. Sie rekonstruiert die Aufgaben und Antworten erneut. Ein Service-RPC speichert neue Ratings und den Ereignisbeleg gemeinsam. Eine globale Revision schützt gemeinsam genutzte Schwierigkeitsprofile; bei Konflikten wird mit neuem Snapshot gerechnet. Kontolöschung, Quellhash, RLS und idempotente Belege schützen gegen fremde oder doppelte Projektionen.

Ein Fehler in der Projektion nimmt bestätigte Lernfortschritte/XP nicht zurück. Ein leeres `rating_version` ist der dauerhafte Rückstand. Nächster Sync und `ratings:backfill` verwenden denselben Prozessor. Bei drei Revisionskonflikten wird die Seite zurückgestellt. Es existiert kein automatisch eingerichteter Remote-Job; Betreiber müssen vor Aktivierung rückrechnen und den Rückstand überwachen bzw. den dokumentierten Befehl wiederholen.

Gekürzte Rohdaten, nicht verfügbare Inhaltsversionen, ungültige Altdaten, Einstufungen und ausschließlich mit Hilfen beantwortete Lektionen erhalten jeweils einen ausdrücklichen Ausschlussbeleg. Ausschlüsse werden nicht als fachliche Fehler des Lernenden gewertet. Es werden keine gelöschten Antworten rekonstruiert oder neue XP vergeben. Ein einmal verarbeiteter Versions-1-Beleg wird bei späterem Inhaltstausch nicht heimlich erneut gewertet.

Persönliche Aggregate und Verarbeitungsbelege sind exportierbar und werden mit dem Konto gelöscht. Die zwölfmonatige Rohdatenkürzung bleibt bestehen; zusätzliche Rohantwortkopien entstehen nicht. Globale Modellparameter enthalten keine Kontoreferenz und sind nicht öffentlich abrufbar. Datenschutztexte und Freigaben bleiben vor einem echten Start zu prüfen.

## Prüfgrundlage

- Mark E. Glickman, *Example of the Glicko-2 system*, [Originaladresse](https://www.glicko.net/glicko/glicko2.pdf). Der direkte PDF-Abruf war in dieser Umgebung nicht verfügbar. Das bekannte Drei-Gegner-Beispiel und dessen veröffentlichte Rundung werden geprüft; ungerundete Rechnung ergibt 1464,0506705393 statt des mit Zwischenrundungen angegebenen Wertes 1464,06.
- Unabhängige Implementierung und Tests: [mmai/glicko2js, Commit efe1e2d](https://github.com/mmai/glicko2js/tree/efe1e2d03f2a5a977b4dd9a2b07a169062f20f33). Quell-Blob gegen den Commit geprüft; zwölf daraus separat erzeugte Zahlenfälle mit Tau 0,3/0,5/1,2 sind eingecheckt. Der fremde Programmcode ist keine Laufzeitabhängigkeit.
- Seedbare Konvergenzsimulationen, Deno-Ausführung, Herkunft aller 850 verfassten Aufgaben und gemischter Lektionen, Transaktionen/RLS, echte lokale JWT-/Sync-/Backfill-/Retention-/Exportprüfungen.

Die technische Vorbereitung beginnt vor dem tatsächlichen P2-Launch. Echte Ratings, Vorhersagegüte, Hilfen-/Sprachverzerrung und hinreichende Stichproben sind noch nicht abgenommen. P3.02 darf eine Produktwirkung erst mit tatsächlichem Vergleich nachweisen.
