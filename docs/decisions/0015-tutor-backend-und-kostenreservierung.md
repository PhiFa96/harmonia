# ADR 0015: Engine-gestützter Tutor mit privatem Verlauf und Kostenreservierung

- Datum: 14.10.2026
- Status: angenommen für die technische Umsetzung; Live-Modell und Launch-Kontingente noch offen
- Bezug: P2.15, ADR 0002, [Tutor-Konzept](../plan/ki-tutor.md), [Übergabe](../plan/tutor-backend.md)

## Entscheidung

Der Tutor läuft als Supabase Edge Function. Nur eine serverseitig geprüfte, nicht anonyme Kontositzung kann einen Dialog anlegen oder lesen. Anthropic-SDK `0.133.0` liegt ausschließlich im Backend; `TutorModelProvider` bildet die Transportgrenze. Es gibt keine automatische Wiederholung eines Modellaufrufs mit unbekanntem Verbrauch. Host ist fest `https://api.anthropic.com`; SDK-Protokollierung ist ausgeschaltet. Schlüssel und Profilfelder erscheinen weder im Systemprompt noch im gespeicherten Nutzungsprotokoll.

Acht Werkzeuge verwenden geschlossene, vollständig erforderliche JSON-Schemas und `strict: true`: Intervall bestimmen/bauen, Tonleiter bauen, Vorzeichnung, Dreiklang bestimmen/bauen, Aufgabenkontext und Notenbeispiel. Kanonische Eingaben verwenden internationales ASCII mit wissenschaftlicher Oktave; B bezeichnet deutsches H und Bb deutsches B. Die Engine bewahrt enharmonische Schreibweise. Dreiklänge sind der gegenwärtige Akkordumfang. Notenbeispiele erhalten Struktur-, Taktfüllungs-, Haltebogen-, Größen-, MIDI- und Zeitprüfung. Allgemeiner mehrstimmiger Satz bleibt in den späteren Phasen.

Der Server rekonstruiert Aufgaben aus Katalog, Version, Seed und Position. Er übernimmt keine vom Client behauptete Bewertung. `hint` gibt nur den passenden festen Hinweis und einen lösungsfreien Kontext an das Modell; `explain` berechnet die eingegebene Antwort erneut; `solution` erlaubt die ausdrücklich verlangte Lösung. Aufgabenkontext, Sprache, Tonnamensystem, Modus und Hinweisstufe bleiben innerhalb eines Dialogs fest. Änderungen beginnen einen neuen Dialog, damit frühere Lösungen nicht in eine niedrigere Hinweisstufe geraten. Freie Fragen ohne Aufgabenkontext verwenden `chat`.

Die Prompt-Regeln verlangen fachliche Werkzeugaufrufe, kurze Lernschritte, Glossarbegriffe und die gewählte Sprache einschließlich US/UK. Stabile Werkzeuge und Prompt-/Glossarteil besitzen Cache-Markierungen; Aufgabe und Verlauf folgen danach. Eine noch nicht angeschlossene Quellenbibliothek wird offen benannt. Das Modell darf keine Quellen, Zitate oder Seitenzahlen erfinden. Quellen-Retrieval kommt in P2.16; die Chat-Oberfläche in P2.17. Die Prompt-Regeln sind keine Garantie für fehlerfreie Modellprosa; Claudes fachliche Abnahme und der Testkatalog aus P2.18 bleiben erforderlich.

Gespräche und Nachrichten sind nur für ihren Besitzer lesbar. Löschen entfernt den Dialog, Nachrichten und alle gespeicherten Antwortkopien, auch bei einem laufenden Stream. Ein späterer Abschluss kann den Dialog nicht neu anlegen. Ein ohne Gesprächstexte weiterbestehender Nutzungsdatensatz verhindert das Zurücksetzen der Kontingente durch Löschen. Kontolöschung entfernt auch diese Datensätze. Erkennbare E-Mail-Muster werden aus Frage, Antwortkontext und Modelltext entfernt; andere freiwillig eingegebene personenbezogene Freitexte werden nicht zuverlässig automatisch erkannt.

Eine unveränderliche Anfrage-ID mit Fingerabdruck und Lease verbindet Zulassung, Stream und Abschluss. Gleicher Inhalt erhält das gespeicherte Ergebnis; geänderter Inhalt ist ein Konflikt. Es gibt höchstens einen laufenden Modellaufruf je Konto. Zulassung prüft den aktuellen serverseitigen Abo-Spiegel, Ablauf, Minutenlimit, tägliche Anfragen sowie Konto- und Gesamtbudget atomar unter einer kurzen Datenbanksperre. Der Abrechnungstag ist der serverseitige UTC-Tag der Zulassung. Clientzeit und Reisezeitzone verändern ihn nicht.

Vor dem Modellaufruf wird der maximal mögliche Preis aller zugelassenen Runden reserviert. Eine konservative UTF-8-Größengrenze begrenzt den Eingabetext; Ausgabetoken, Werkzeuganzahl, Runden und Gesamtdauer sind ebenfalls begrenzt. Reservierungen geben nach einem eindeutigen Abschluss den ungenutzten Betrag frei. Bei unbekanntem Verbrauch nach Transportfehler oder Prozessausfall bleibt der reservierte Höchstbetrag als ausdrücklich gekennzeichnete Schätzung gebucht. Abgelaufene Leases werden bei weiterer Zulassung beziehungsweise Wiederholung bereinigt. Das ist eine konservative lokale Kostenschätzung, keine Anthropic-Rechnung.

Nutzungsdaten speichern Eingabe-, Ausgabe-, Cache-Lese- und getrennte 5-Minuten-/1-Stunden-Schreibtoken sowie ganzzahlige Nano-USD. `1 USD / Million Token = 1000 Nano-USD / Token`. Jede Anfragereservierung bewahrt Modell, Tarif, Effort und Prompt-/Werkzeugversion. Eine Tarifänderung erhält automatisch eine neue Revision; eine zwischen Lesen und Zulassung geänderte Revision verhindert den Modellaufruf.

## Modell, Zugang und Grenzen

Die neue Policy startet ausgeschaltet mit Modell und Tarif `null`. Ein Modell und dessen Preise werden aus aktuellen offiziellen Anthropic-Unterlagen eingetragen; diese Cloud hatte weder Zugriff auf diese Dokumentation noch eine sichere API-Schlüsselbindung. Kein vermeintlich aktuelles Frontier-Modell und kein Preis wurden geraten. Der manuelle Live-Test erfordert eine offizielle Tarifquelle und aktuelle Prüfmetadaten.

Der Texttutor gehört gemäß Geschäftsmodell zu Premium und Max. Free erhält zunächst keine Anfragen. Die gespeicherten 30/60 Anfragen, 1/2 USD Kontobudget, 10 USD Gesamtbudget, sechs Anfragen pro Minute und weitere Token-/Zeitgrenzen sind technische, anpassbare Startgrenzen. Sie sind keine entschiedenen Launch-Kontingente oder zugesagten Nutzerpreise. Bei Aktivierung müssen Modell, Tarif und passende Reservierungs-/Tagesbudgets gemeinsam geprüft werden; die endgültige Kalibrierung folgt in P2.18. RevenueCat schreibt den serverseitigen Abo-Spiegel erst in P2.19. Ein Client kann weder Abos noch Kosten oder Zulassungen verändern.

Die lokale API-Simulation benötigt ein ausdrücklich gesetztes Serverflag und eine lokale Supabase-URL. Sie benutzt denselben SDK-SSE-Parser und dieselbe Datenbanklogik, ist aber kein Sprachmodell. Ihre Token und Preise sind künstliche Testwerte. Der echte Test wird getrennt von CI ausgelöst. Der lokale Docker-Adapter bindet einen Live-Schlüssel ausschließlich über seinen Umgebungsnamen und nur im eigenen Edge-Container; er schreibt keinen Schlüssel in Argumente oder temporäre env-Dateien.

Die üblichen TCP-/Proxy-Abbrüche können eine Modellanfrage erst über das serverseitige Zeitlimit beenden. Der SDK-Abbruch wird propagiert und geprüft; eine sofortige Erkennung jeder getrennten Browserverbindung wird nicht zugesagt. Bereits berechnete und unbekannte Token bleiben kontingentwirksam. Es gibt keine Tutor-Buchung von XP, Münzen oder Freischaltungen. P2.17 muss beim Anzeigen einer ungeprüften Aufgabenlösung den vorhandenen Hinweis-3-/Lösungsstatus der Lektion setzen.

## Nachtrag 31.10.2026

Das SDK ist inzwischen auf 1.3.0 (API-Version `2026-10-21`) umgestellt, mit ausdrücklich abgeschaltetem OpenTelemetry-Tracing; die hier genannte Version 0.133.0 ist der damalige Stand. Siehe [ADR 0065](0065-anthropic-sdk-1-und-api-version-2026-10-21.md).
