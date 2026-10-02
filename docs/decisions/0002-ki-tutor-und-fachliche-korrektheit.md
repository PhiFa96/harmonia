# 0002 – KI-Tutor und fachliche Korrektheit

- **Status:** angenommen
- **Datum:** 2026-10-02

## Kontext

Harmonia soll langfristig so gut unterrichten wie eine Lehrkraft und jede Frage zu Theorie, Geschichte und Werken beantworten können. Sprachmodelle (LLMs) erklären gut, können aber überzeugend klingende Fehler machen. Bei Musiktheorie sind das z. B. falsch benannte Intervalle, übersehene Parallelen oder erfundene Werkdaten. Eine Lern-App, die Falsches als richtig bewertet, verliert sofort Vertrauen.

## Entscheidung

1. **Die Engine entscheidet, die KI erklärt.** Eine deterministische, getestete Musiktheorie-Engine erzeugt die Aufgaben und bewertet Antworten: Intervalle, Akkorde, Tonarten, Stimmführung. Das LLM entscheidet nie allein, ob etwas richtig ist.
2. **Die KI nutzt die Engine als Werkzeug.** Für fachliche Aussagen ruft der Tutor die Engine auf, statt selbst zu rechnen, und erklärt deren Ergebnis.
3. **Wissensfragen mit Quellen.** Antworten zu Geschichte und Werken stützen sich auf eine kuratierte Wissensbasis (Retrieval). Der Tutor nennt Quellen und sagt offen, wenn er unsicher ist.
4. **Gestufte Hilfe.** Hinweis → stärkerer Hinweis → Lösung mit Erklärung. Die Lösung ist jederzeit auf Wunsch abrufbar, denn rein fragende Tutoren werden laut Berichten über Khanmigo oft abgebrochen.
5. **Qualitätssicherung.** Ein Testkatalog mit Fachfragen und erwarteten Antworten läuft bei jeder Änderung am Tutor. Kursinhalte werden vor der Veröffentlichung fachlich geprüft.
6. **Austauschbares Modell.** Der Tutor greift über eine eigene Schnittstelle auf das Sprachmodell zu, z. B. Claude über die Anthropic API. So bleibt ein Wechsel möglich.

## Konsequenzen

- Die Engine ist zu Beginn mehr Arbeit, macht Bewertungen aber prüfbar. Der Tonsatz-Korrektor baut direkt auf ihr auf.
- Jede KI-Interaktion kostet Geld. Die Nutzung wird je Abo-Stufe begrenzt.
- Die Wissensbasis muss aufgebaut und gepflegt werden. Inhalte erstellen wir selbst oder nutzen sie mit passender Lizenz.
- Kandidaten für die Engine prüfen: `tonal` (JavaScript) für Grundlagen; für tiefe Analysen ggf. `music21` (Python) in einem eigenen Dienst. Lizenzen vorher prüfen.
