# ADR 0034 – Tagesrätsel aus freigegebenem Katalog

**Status:** Technisch vorbereitet am 16.10.2026; fachliche und Geräteabnahme offen.

Der veröffentlichte Inhaltskatalog ist die kuratierte Quelle. Die Edge Function materialisiert bei Abruf 42 datierte Rätsel und friert Aufgabe, Seed, Bank und Schwierigkeit pro Datum ein. Eine neue Katalogversion überschreibt bestehende Tage nicht. Die Stufe steigt innerhalb jeder Woche von Montag bis Sonntag, soweit die veröffentlichten Stufen dies erlauben. Gibt es keine freigegebene Quelle, erscheint keine erfundene Aufgabe. Der lokale Vorschaumodus darf den redaktionellen Katalog verwenden.

Ein Kalenderdatum bezeichnet weltweit dieselbe Aufgabe. Der aktuelle Tag folgt der IANA-Zeitzone des Geräts; die Serverzeit entscheidet bei jeder Antwort und die Datenbank prüft das Datum nochmals. Der nächste lokale Mitternachtswechsel wird samt Sommerzeitwechsel berechnet. Pro Konto und Datum ist genau eine bestätigte Antwort erlaubt. Dieses einfache Format begrenzt Rateversuche und vermeidet, nach einer falschen Antwort Hinweise auf weitere Versuche zu geben. Die Musiktheorie-Engine prüft die Antwort serverseitig. Es gibt keine XP oder Bestenliste. Nur richtige Tage zählen zur eigenen, getrennten Rätselserie. Der geteilte Text enthält Datum, ein Erfolgszeichen und die eigene Serienlänge, weder Aufgabe noch Lösung oder Kontokennung.

Rohantwort, genaue Antwortzeit und damals gemeldete Zeitzone werden nach zwölf Monaten entfernt; Datum und Richtig/Falsch-Beleg bleiben für die eigene Serie bis zur Kontolöschung. Die globale Aufgabenbank hat keine Personenzuordnung. Der bestehende Export umfasst eigene Ergebnisse. Die erforderliche juristische Zweck-/Fristenprüfung und der Retentionbetrieb bleiben offen.
