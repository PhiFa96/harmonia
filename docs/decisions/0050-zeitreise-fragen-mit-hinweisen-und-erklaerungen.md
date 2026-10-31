# ADR 0050 – Zeitreise-Fragen mit Hinweisen und Erklärungen

Datum: 26.10.2026. Status: technischer und redaktioneller Entwurf; unabhängige Fachprüfung offen.

## Anlass

Die P4.12-Nacharbeitsliste nennt unmittelbar aufgelöste Falschantworten, reine Jahreszahlfragen, offensichtlich unpassende Ablenker und eine widersprüchliche Kennzeichnung der fest geschriebenen Interviews.

## Entscheidung

- Eine portable, flüchtige Fragezustandsmaschine verwaltet Auswahl, Rückmeldung und Versuche. Eine Prüfung erfordert eine Auswahl und die Freigabe des bisherigen Audioablaufs. Doppelte Aktivierungen werden ignoriert. Nach einem Fehler muss eine andere Antwort gewählt werden; danach darf erneut geprüft werden. Richtige Antworten bleiben gesperrt.
- Jede der acht Fragen hat einen eigenen Hinweistext. Nach einer falschen Antwort zeigt die Oberfläche diesen Hinweis. Die vollständige Erklärung erscheint nach einer richtigen Antwort. Die vorhandene höfliche Live-Rückmeldung wird verwendet.
- Wechsel der Station, Weiter und Zurück erzeugen einen leeren Fragezustand. Der bestehende ausdrückliche Hörfragen-Skip bleibt verfügbar. Die Preview vergibt keine XP oder Lernnachweise und speichert diese Zustände nicht; F11 für bewertete Lektionen bleibt offen.
- Vier eigene DE/EN-Wissensfragen wenden die Grenzen des vorhandenen Quellenkontexts auf undatierte Modelle und deren Einordnung an. Die acht Antwortgruppen haben passendere Ablenker. Fragen und Hinweise bleiben fachlich zu prüfende Entwürfe.
- Die Interviews werden als redaktionell vorbereitetes, erfundenes Rollenspiel bezeichnet. Die App spielt einen festen Textablauf aus. KI-Autorenschaft und erforderliche rechtliche Kennzeichnung bleiben in P4.17 gesondert zu prüfen.
- En-GB erhält gezielte Abweichungen zur Schreibweise `realisation`; die übrigen Texte verwenden die gemeinsame englische Fassung. Die Sprachprüfung verlangt unterschiedliche Antworttexte und vorhandene Hinweise.

## Nachweise

Portable Tests prüfen alle drei Lösungspositionen, fehlende Auswahl/Audiofreigabe, wiederholte Prüfungen, neue Auswahl nach Fehler und Sperre nach Erfolg. App-Tests prüfen Hinweis und verborgene Erklärung bei Fehler, vollständige Erklärung nach Korrektur, Zurücksetzen sowie ausdrücklichen Skip. Browserproben prüfen beide Fehler-/Korrekturschritte mit tatsächlichem Start des lokalen Klangmodells in DE/en-US/en-GB sowie die britische Barockfassung. Produktions-Deep-Links und der tatsächliche Bundleguard werden weiter geprüft.

Die Audiofreigabe entspricht dem vorhandenen `heard`-Signal nach erfolgreichem Wiedergabestart. Ein tatsächliches vollständiges Anhören und die physische Audioqualität werden damit nicht nachgewiesen. Echte Geräte-, Hör- und Screenreader-Abnahmen bleiben offen.

## Einordnung

Diese Arbeit ist ausdrücklich **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe**. Die Quellenabschnitte bleiben die bisherigen P2.08-Entwurfsartikel mit P3.19-Linkmechanismus. Eigenständige Fach-/Literaturprüfung der neuen Formulierungen, Glossararbeit und die weitere Gestaltung der Rollen bleiben offen. Alle Inhalte bleiben `entwurf`; öffentlich sind null Lektionen freigegeben. Keine Veröffentlichung. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt.
