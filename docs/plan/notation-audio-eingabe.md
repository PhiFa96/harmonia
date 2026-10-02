# Notation, Audio und Eingabe

Pakete `packages/notation` und `packages/audio`, Eingabekomponenten in `packages/exercises` und `apps/mobile`.

## Notation

### Ziel

Interaktive Notendarstellung, die auf iOS, Android und Web gleich aussieht und sich antippen lässt. Kein vollwertiges Notensatzprogramm: Wir rendern Übungs- und Beispielausschnitte (typisch 1–16 Takte).

### Aufbau in drei Schichten

1. **Score-Modell** – was dargestellt wird: Systeme, Schlüssel, Vorzeichnung, Taktart, Takte, Stimmen, Noten, Pausen, Akkorde, Haltebögen, später Bindebögen, Triolen, Dynamik, Akkord- und Funktionssymbole. Tonhöhen kommen aus `theory`.
2. **Layout** – wo alles steht: berechnet Positionen als reine Daten (Koordinaten in Notenlinien-Abständen). Gut testbar, plattformunabhängig.
3. **Renderer** – wie es aussieht: zeichnet das Layout mit `react-native-svg`. Die Web-Unterstützung in P1.14 prüfen.

### Notenfont

- **Bravura** (SMuFL-Referenzfont, SIL Open Font License 1.1).
- Glyphen über SMuFL-Codepoints; Maße aus den Metadaten des Fonts (Begrenzungsrahmen, Ankerpunkte für Hälse, Standardwerte für Linienstärken).
- Lizenzhinweis in den App-Credits.

### Layout-Regeln (Phase 1, Grundumfang)

- Horizontale Abstände nach Notenwert (längere Werte → mehr Platz, nicht linear)
- Hilfslinien, Vorzeichen vor Noten, Vorzeichen-Stapelung bei Akkorden
- Halsrichtung: Noten auf oder über der Mittellinie Hals nach unten, darunter nach oben; bei Akkorden nach der am weitesten entfernten Note
- Sekund-Abstände in Akkorden: Notenkopf seitlich versetzen
- Balken nach Gruppierung der Taktart, einfache Balkenneigung
- Schlüssel: Violin- und Bassschlüssel (Phase 1), Alt- und Tenorschlüssel (Phase 3)

Erweiterungen in Phase 3: Klaviersystem (zwei Systeme mit Klammer), mehrere Stimmen pro System, Bindebögen, Triolen, Akkord- und Funktionssymbole unter dem System, Taktwechsel.

### Interaktion

- Tippen auf Linie oder Zwischenraum setzt eine Note (Einrasten auf die nächste Position), Ziehen verschiebt sie, Vorzeichen per Auswahlleiste.
- Hervorhebung von Noten (richtig, falsch, aktuell gespielt) – immer zusätzlich mit Symbol, nicht nur Farbe.
- Wiedergabe-Cursor synchron zum Audio.
- Barrierefreiheit: Jede Note hat eine Textbeschreibung (z. B. „Viertelnote, eingestrichenes c“) für Screenreader.

### Leistungsziele (in Phase 1 messen)

- Layout eines 8-taktigen Beispiels unter 50 ms auf einem Mittelklasse-Gerät
- Flüssige Interaktion (60 Bilder pro Sekunde) beim Setzen und Ziehen

### Tests

- Layout: Snapshot-Tests der berechneten Positionen
- Darstellung: Screenshot-Vergleiche im Web mit Playwright
- Manuelle Prüfung auf echten Geräten (iOS, Android) bei jeder Layout-Änderung

## Audio

### Grundlage

- **`react-native-audio-api`** (Software Mansion): setzt die Web Audio API für iOS und Android um; im Browser nutzen wir die native Web Audio API. Gleiche Programmierschnittstelle auf allen Plattformen.
- Entscheidung nach dem Spike in **P1.16** als ADR 0005 festhalten (inkl. gemessener Latenzen).

### Klangerzeugung

- **Klavier-Sampler:** Grundlage z. B. Salamander Grand Piano (CC BY 3.0, Namensnennung in den Credits). Für die App reduziert: Samples etwa alle drei Halbtöne, wenige Anschlagsstufen, komprimiert. Zwischenstufen über Tonhöhenverschiebung. Zielgröße des Pakets im MVP: unter 10 MB.
- Weitere Klänge später: Streicher, Chor („Ah“) für den Chor-Trainer, einfache Synthese als Rückfallebene.
- Funktionen: Einzeltöne, Intervalle (nacheinander und gleichzeitig), Akkorde (auch arpeggiert), Sequenzen mit Tempo, Kadenzen.
- **Metronom** mit vorausplanender Zeitsteuerung über die Audio-Uhr (nicht über JavaScript-Timer), damit es nicht schwankt.
- Kammerton einstellbar (Standard 440 Hz).

### Plattformdetails

- **Web:** Der Audio-Kontext startet erst nach einer Nutzeraktion (Autoplay-Regeln der Browser). Erster Bildschirm mit „Tippen zum Starten“.
- **iOS:** Verhalten beim Stummschalter festlegen (offene Frage). Audio-Session für Wiedergabe und später Aufnahme konfigurieren.
- **Android:** Latenz stark geräteabhängig, deshalb Messung auf mehreren Geräten (günstig bis teuer).

### Latenzziele (in P1.16 messen)

- Tippen bis Klang: Ziel unter 50 ms auf Referenzgeräten
- Messung: Aufnahme mit externem Mikrofon (Tipp-Geräusch und Ausgabe) oder Hochgeschwindigkeitsvideo; Ergebnisse je Gerät in ADR 0005

## Eingabe

### Bildschirm-Klaviatur (Phase 1)

- Mehrfachberührung, scrollbar über den ganzen Tonumfang, Zoom
- Beschriftung umschaltbar (keine / deutsch / international)
- Klang beim Antippen, Hervorhebung von Lösung und Fehlern

### Mikrofon (Phase 3)

- **Tonhöhenerkennung** auf dem Gerät; Kandidaten: `pitchy` (MIT, McLeod Pitch Method, reines JavaScript) oder eine native Bibliothek (z. B. `react-native-pitchy`). Entscheidung per Spike.
- Verarbeitung: Audioblöcke von etwa 2048 Samples, Klarheitsschwelle, Medianfilter gegen Ausreißer, Ton gilt als erkannt, wenn er etwa 80 ms stabil ist.
- Bewertung: Abweichung in Cent; Toleranz je Stufe einstellbar (Einstieg ±50 Cent, Fortgeschritten ±25 Cent).
- Oktavfehler gesondert behandeln (bei Gesang häufig).
- **Datenschutz:** Audio wird nur auf dem Gerät verarbeitet, nichts wird hochgeladen.
- Berechtigungen: iOS-Mikrofonbeschreibung, Android `RECORD_AUDIO`, Web nur über HTTPS.
- Zuerst einstimmig (Singen, Einzeltöne). Akkorderkennung per Mikrofon erst nach eigener Evaluierung, da sie laut Testberichten bei anderen Apps weniger zuverlässig ist.

### MIDI (Phase 3)

- **Web:** Web MIDI API (in Chromium-Browsern verfügbar, Safari derzeit nicht – zum Zeitpunkt der Umsetzung prüfen)
- **iOS/Android:** natives Modul nötig. Vorhandene Bibliotheken prüfen, sonst eigenes Expo-Modul (Expo Modules API, Swift/Kotlin).
- Note-On/Off mit Anschlagstärke, Sustain-Pedal, Geräteauswahl
