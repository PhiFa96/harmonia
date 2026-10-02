# 0005 – Fachliche Prüfung durch Claude

- **Status:** angenommen (entschieden von Phillip am 02.10.2026)
- **Datum:** 2026-10-02

## Kontext

Bisher sah der Plan vor, dass Phillip alles fachlich abnimmt, was Musiktheorie betrifft:

- Stichproben aus der Engine
- Konventionen (F03–F05)
- Lerninhalte und der Tutor-Testkatalog
- das Regelwerk für den Tonsatz

Am 02.10.2026 hat Phillip entschieden, dass Claude diese Prüfungen vollständig selbst übernimmt und ihn dazu nicht mehr fragt.

## Entscheidung

1. **Claude prüft fachlich selbst.** Das gilt für Ergebnisse der Engine, Konventionen, Lerninhalte, den Tutor-Testkatalog und Regelwerke.
2. **Mehrere unabhängige Prüfmittel.** Wo möglich, wird jede fachliche Aussage mit mindestens zwei davon geprüft:
   - Tabellentests mit selbst erstellten Erwartungswerten
   - Vergleichstests gegen `tonal` als Orakel ([ADR 0004](0004-eigene-theorie-engine.md))
   - Abgleich mit Standardliteratur und Lehrmaterial; die Quelle wird in der Doku genannt (nur das Ergebnis, kein Originaltext)
   - Prüfung aller Notenbeispiele in Texten durch die Engine
   - für Lerninhalte und den Testkatalog: ein zweiter, getrennter Prüfdurchgang in frischem Kontext, bevor ein Inhalt `freigegeben` wird
3. **Uneinheitliche Konventionen.** Ist die Literatur uneinheitlich, recherchiert Claude und wählt die verbreitetste Schreibweise. Wahl, Begründung und Alternativen kommen in den Plan oder in ein ADR. Wo es sinnvoll ist, wird die Alternative als umschaltbare Variante vorgesehen.
4. **Was bei Phillip bleibt:**
   - Produkt- und Geschäftsentscheidungen (z. B. Preise, Werbung, Rechtsform, Name)
   - Freigabe von Design und Store-Auftritt
   - Freigabe zum Merge
   - Tests auf echten Geräten

## Begründung

- Die Grundlagen der Musiktheorie (Tonnamen, Intervalle, Tonleitern, Tonarten, Akkorde) sind in der Literatur eindeutig und lassen sich automatisch prüfen.
- Die Architektur aus [ADR 0002](0002-ki-tutor-und-fachliche-korrektheit.md) macht fachliche Aussagen maschinell prüfbar: Die Engine entscheidet, die KI erklärt.
- Phillips Zeit ist knapp (Risiko R14).

## Konsequenzen

- **Risiko R4 (fachliche Fehler) verschiebt sich:** Wer Inhalte schreibt, prüft sie jetzt auch. Dagegen helfen mehrere unabhängige Prüfmittel und der getrennte Prüfdurchgang. Dazu kommen Quellen in der Doku und „Fehler melden“ in jeder Aufgabe mit wöchentlicher Sichtung.
- Vor Zertifikaten und Schul-Lizenzen (Phase 4) ist ein externes Fachgutachten sinnvoll. Es wird dort als Option geführt.
- Die offenen Fachfragen F03–F05 entscheidet Claude nach Recherche.
- In der PR-Vorlage beschreibt der Abschnitt „Fachliche Prüfung“, womit geprüft wurde.
