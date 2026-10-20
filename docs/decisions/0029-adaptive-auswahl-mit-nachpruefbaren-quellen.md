# ADR 0029 – Adaptive Auswahl mit nachprüfbaren Quellen

**Status:** Technisch implementiert, empirische Abnahme offen. 16.10.2026.

## Kontext

P3.01 schätzt Fähigkeiten und Aufgabenprofile. P3.02 soll passende Aufgaben auswählen, den Einstufungstest auf Ratings umstellen und Schwächen trainieren. Seed, ursprüngliche Antworten und Inhalt müssen auch offline und nach Änderungen an globalen Ratings reproduzierbar bleiben. Weniger Pflichtstoff oder leichtere Ersatzaufgaben dürfen die 80-%-Bestehensregel nicht aushöhlen.

## Entscheidung

Die Lektionsauswahl verwendet die prädiktive Glicko-Wahrscheinlichkeit aus ADR 0028. Bevorzugt werden Kandidaten im Intervall 0,70–0,85, danach die Nähe zur Mitte 0,775. Bei mehreren zugeordneten Fähigkeiten gelten wie in der Rating-Projektion deren Mittelwert und die größte Unsicherheit. Volle inaktive Tage vergrößern die Unsicherheit. Unbekannte Fähigkeiten erhalten keine erfundene Schwäche.

Alle verfassten neuen Aufgaben bleiben genau einmal erhalten. Ihre Reihenfolge wird zu Beginn gewählt; die vorhandenen 2–5 Wiederholungen kommen ausschließlich aus früheren Lektionen bzw. der Voraussetzungshülle. Verschiedene Profile werden vor mehrfachen gleichen Profilen ausgewählt. Reicht der Kandidatenraum nicht für das Zielintervall, wird der nächstliegende Kandidat verwendet. Ohne Fähigkeitsdaten bleibt der bisherige Plan erhalten. Die App erfindet keine neuen fachlichen Aufgabenparameter.

`flow:2` speichert ausschließlich eine vollständige Permutation der Pflichtaufgaben und versionierte Wiederholungsreferenzen. Backend, Meldungsprüfung und Wiederaufnahme prüfen dieselben Grenzen. Ratings oder vom Client behauptete Erfolgsquoten werden nicht als Nachweis übernommen. Die Auswahl ist für einen Durchgang eingefroren, damit globale Nachkalibrierung und Kontosynchronisation die laufende Audioquelle nicht austauschen. Während eines Durchgangs gibt es keine erneute Rating-Auswahl; neue Antworten beeinflussen den nächsten Durchgang.

Der Einstufungstest bekommt `placement-2` mit einem getrennten Glicko-Modell je Fachbereich. Alte `placement-1`-Nachweise und aktive Tests bleiben abspielbar. Jede Diagnose wird als ein Rating-Zeitraum aus eindeutigen selbstständigen Antworten gerechnet. Vier geordnete, vorläufige Anker verwenden 900/1200/1500/1800 mit RD 100. Auswahl nach der ersten unabhängigen Antwort verwendet die obere plausible Fähigkeit (0,75 RD), nach zwei Antworten einen breiteren Prüfpunkt (1,5 RD). Empfehlungen verwenden den Mittelwert, mindestens zwei unterschiedliche unabhängige Antworten, widerspruchsarme Evidenz und weiterhin die geschlossene Voraussetzungskette. Keine Summe guter Antworten in anderen Bereichen gleicht eine Lücke aus. Hilfen und ausgelassene Hörfragen liefern keine Rating-Erfolge oder -Niederlagen. Anker und Explorationsfaktoren sind Modellannahmen, keine fachlich oder empirisch bestätigten Schwierigkeitswerte.

„Schwächen trainieren“ verwendet bis zu drei bekannte Fähigkeiten mit den niedrigsten Ratings, mindestens zwei unabhängige Antworten je Fähigkeit und ausschließlich bereits erreichte Lektionen. Zehn Fragen werden über diese Schwerpunkte verteilt. Der Modus nutzt denselben Aufgaben-/Fehlerwiederholungsablauf. `weak:1` enthält seine Quellen; `practice.weakness` ist eine explizite technische Durchgangs-ID. Diese Nachweise gewähren keinen Kursfortschritt, keine XP, keine Münzen und keine Serienqualifikation. Selbstständige Antworten werden kanonisch bewertet und verbessern die Rating-Daten. Energie und gegebenenfalls die höchste Premium-Stufe aller Quellen gelten weiterhin.

Angemeldete Konten erhalten ausschließlich die eigenen Fähigkeiten und angeforderte anonyme Aufgabenaggregate über `learner_rating_snapshot`. Der Aufruf akzeptiert keinen fremden Besitzer. Ein Sequenzstand verhindert doppelte lokale Anwendung bestätigter Antworten. Der Cache liegt kontogetrennt in der vorhandenen SQLite-Datenbank und wird mit dem Konto gelöscht. Gäste und neue Offline-Antworten werden aus vorhandenen Nachweisen geschätzt; lokale Schätzungen können nie Server-Ratings überschreiben. Bereits entfernte Rohdaten werden nicht rekonstruiert.

Die Migration stellt nur die in P3.01 ausdrücklich ausgeschlossenen rohen Einstufungsnachweise erneut in die Warteschlange. Für sie gab es bisher keinen Rating-Effekt. Vorher gewertete Lektionen werden nicht zurückgesetzt oder doppelt gerechnet.

## Beta und Grenzen

`EXPO_PUBLIC_ADAPTIVE_LESSONS` erlaubt `adaptive` (Standard), `control` und ausdrücklich `beta`. Beta teilt angemeldete Konten stabil in zwei Gruppen; Gäste bleiben dort Kontrolle. Die Einstufung und der Schwächenmodus gehören nicht zur Lektions-A/B-Zuteilung. Das Start-Ereignis speichert Zuteilung, die ausdrückliche Experimentkennung `p302-beta-v1` und tatsächlich verwendete Auswahl getrennt. Der Bericht schließt erzwungene Modi und nicht zur Beta zugeteilte Starts aus. Es gelten unverändert Einwilligung und rechtliche Sperre der vorhandenen Analytics-Erfassung. Der private Bericht zählt auch abgebrochene Starts, wartet 24 Stunden und trennt nach Lektionsversion. Empfangszeiten ersetzen keine genaue Offline-Lernzeit; Messverzögerungen müssen bei der Analyse berücksichtigt werden.

Der Bericht stellt niemals selbst eine Nichtunterlegenheit fest. Ein geeignet geplanter Vergleich mit echten Beta-Lernenden, auf Kontoebene berücksichtigten Wiederholungen und vorab festgelegter Toleranz bleibt Voraussetzung für die P3.02-Abnahme. Es wurden keine echten Teilnehmenden eingeschrieben, keine Erfassung aktiviert und keine öffentliche Version ausgerollt. Geräte- und fachliche Abnahmen aus P2 bleiben getrennt offen.
