# Notation, Audio und Eingabe

Pakete `packages/notation` und `packages/audio`, Eingabekomponenten in `packages/exercises` und `apps/mobile`.

## Notation

### Ziel

Interaktive Notendarstellung, die auf iOS, Android und Web gleich aussieht und sich antippen lässt. Kein vollwertiges Notensatzprogramm: Wir rendern Übungs- und Beispielausschnitte (typisch 1–16 Takte).

### Aufbau in drei Schichten

1. **Score-Modell** – was dargestellt wird: Systeme, Schlüssel, Vorzeichnung, Taktart, Takte, Stimmen, Noten, Pausen, Akkorde, Haltebögen, später Bindebögen, Triolen, Dynamik, Akkord- und Funktionssymbole. Tonhöhen kommen aus `theory`.
2. **Layout** – wo alles steht: berechnet Positionen als reine Daten (Koordinaten in Notenlinien-Abständen). Gut testbar, plattformunabhängig.
3. **Renderer** – wie es aussieht: zeichnet das Layout mit `react-native-svg`. Die Web-Unterstützung in P1.14 prüfen.

### Score-Modell und Kurzschreibweise (umgesetzt in P1.12)

Paket `@harmonia/notation`, abhängig nur von `theory`.

- **Aufbau:** Partitur → Systeme → Takte → Stimmen → Ereignisse (Note, Akkord, Pause).
  - Ein System hat Schlüssel, Vorzeichnung und Taktart.
  - Ein Takt kann sie ab dem zweiten Takt wechseln. Die Angaben des ersten Takts gehören zum System.
  - Tonhöhen (`Pitch`), Dauern (`Duration`), Taktarten und Tonarten kommen aus der Theorie-Engine.
- **Phase 1** nutzt ein System mit einer Stimme. Mehrere Systeme und Stimmen sowie Alt- und Tenorschlüssel sind im Modell schon vorhanden und werden ab Phase 3 dargestellt.
- **Vorzeichnung:** Zahl der Vorzeichen, optional mit der gemeinten Tonart (für Analyse und Wiedergabe).
- **Haltebogen:** Er ist eine Eigenschaft eines Tons und führt zum nächsten Ereignis derselben Stimme, auch über den Taktstrich. Das Ziel muss dieselbe Tonhöhe in derselben Schreibweise enthalten (Cis → Des ist kein Haltebogen). `ties()` liefert alle Bögen, `validateScore()` meldet Bögen ohne Ziel sowie zu kurze und zu volle Takte. Ein zu kurzer erster Takt gilt standardmäßig als Auftakt.
- **Kurzschreibweise** für Tests und Inhalte, z. B. `treble | key:G | 3/4 | G4/4 B4/4 D5/4 | (G4 B4 D5)/2.`:
  - Abschnitte trennt `|`. Ein Abschnitt enthält entweder Angaben oder einen Takt.
  - Schlüssel: `treble`, `bass`, `alto`, `tenor`
  - Taktart: `4/4`, `6/8`, `3+2+2/8`
  - Vorzeichnung: `key:Eb` (Es-Dur), `key:c` (c-Moll, kleiner Grundton = Moll), `key:3b`, `key:2#`, `key:0`
  - Note: Tonhöhe in wissenschaftlicher Notation plus Dauer (`C4/4`, `F#5/8.`, `Bb3/2..`). Dauern: `1`, `2`, `4` … `64` oder `breve`.
  - Pause `r/4`, Akkord `(C4 E4 G4)/2`, Haltebogen `~` hinter dem Ton (`C4/2~`, `(C4~ E4)/2`) oder hinter dem Akkord für alle Töne
  - Stimmen trennt `&`, Systeme stehen in eigenen Zeilen.
  - N-tolen folgen mit ihrer Darstellung in Phase 3.
  - Fehler nennen Abschnitt und Grund. Schreiben ergibt eine kanonische Form; Lesen und Schreiben sind als Rundreise getestet.

### Layout v1 (umgesetzt in P1.13)

`layoutScore(score)` liefert reine Daten: Glyphen (SMuFL-Name, Position, Rolle, Bezug auf Takt/Ereignis/Ton), Linien (Notenlinien, Hilfslinien, Hälse, Taktstriche), Balken und Haltebögen.
- **Koordinaten:** Notenlinienabstände, Ursprung an der obersten Linie links, y nach unten, auf Tausendstel gerundet.
- **SVG-Ausgabe:** `layoutToSvg` zeichnet Vorschauen und Tests. Der App-Renderer folgt in P1.14.

Regeln (Phase 1):

- **Horizontale Abstände:** Jede Verdopplung des Notenwerts gibt ×√2 mehr Platz (Viertel = 3,5 Abstände). Vorzeichen und versetzte Köpfe bekommen zusätzlich Platz.
- **Hälse:**
  - Richtung nach der Note, die am weitesten von der Mittellinie entfernt ist. Auf der Mittellinie und bei Gleichstand zeigt der Hals nach unten.
  - Länge eine Oktave (3,5 Abstände), außerhalb des Systems mindestens bis zur Mittellinie. 32stel und 64stel bekommen längere Hälse wegen der Fähnchen.
  - Ansatz an den Ankerpunkten des Fonts.
- **Sekunden im Akkord:** Die untere Note steht immer links. Vom Halsansatz aus wechselt jede Note, die eine Sekunde über bzw. unter einer normal stehenden liegt, auf die andere Halsseite.
- **Vorzeichen:**
  - Sie gelten bis zum Taktende für dieselbe Oktave, die Vorzeichnung für alle Oktaven.
  - Ein Auflösungszeichen hebt auf.
  - Das Ziel eines Haltebogens über den Taktstrich bekommt kein Vorzeichen; spätere Noten im Takt bekommen es wieder.
- **Stapelung der Vorzeichen im Akkord** nach Gould („Behind Bars“): oberstes nah am Akkord, dann unterstes, dann zweitoberstes usw., jeweils in die erste freie Spalte. Eine Spalte teilen sich Vorzeichen, die mindestens eine Septime auseinander liegen (vorsichtige Vereinfachung).
- **Balken:**
  - Achtel und kürzer innerhalb einer Zählzeit der Taktart (4/4 je Viertel, 6/8 je punktierte Viertel, 3+2+2/8 nach Gruppen). Pausen unterbrechen.
  - Richtung gemeinsam nach der entferntesten Note. Neigung nach den äußeren Noten, höchstens ein Abstand; ist eine innere Note extremer, liegt der Balken waagerecht.
  - Hälse unter Balken sind mindestens 3 Abstände lang (plus 0,75 je weitere Ebene).
  - Teilbalken zeigen beim ersten Ereignis nach rechts, sonst nach links (punktierte Achtel + Sechzehntel).
- **Fähnchen** bei einzelnen Achteln und kürzer, angesetzt nach den Ankerpunkten des Fonts.
- **Pausen:** Die ganze Pause hängt an der vierten Linie, die halbe sitzt auf der Mittellinie, kürzere sind um die Mittellinie gesetzt. Ein Takt mit nur einer Pause in Taktlänge zeigt die Ganztaktpause mittig, auch in 3/4.
- **Punkte:** Rechts neben dem Kopf. Bei Köpfen auf einer Linie stehen sie im Zwischenraum darüber; bei doppelten Positionen im Akkord weichen sie nach unten aus.
- **Haltebögen:** Einzelnoten gegenüber dem Hals. Im Akkord zeigt der oberste nach oben, der unterste nach unten, die mittleren nach ihrer Lage.
- **Kopf:** Violinschlüssel auf der g¹-Linie, Bassschlüssel auf der f-Linie. Vorzeichnung in Standardpositionen (Kreuze F C G D A E H, b: B E A D G C F; im Bassschlüssel eine Linie tiefer). Taktart mit Zähler und Nenner, Gruppierung mit Pluszeichen.
- **Abschluss:** einfacher Taktstrich (Standard), Schlussstrich oder keiner.
- **Grenzen von v1:** ein System, eine Stimme, Violin- und Bassschlüssel, keine Wechsel im Stück, keine N-tolen-Klammern, kein Zeilenumbruch. Ab Phase 3 kommt das dazu.
- **Prüfung:**
  - Regeltests je Regel und Snapshots der Referenzbeispiele
  - Vergleich der Glyphendaten mit dem Font-Paket
  - Leistungstest (8 Takte deutlich unter 50 ms)
  - Sichtprüfung der Referenzbeispiele mit Bravura im Browser: [Referenzbild](bilder/layout-v1-referenz.png)

### Renderer (umgesetzt in P1.14)

- **`ScoreView`** aus `@harmonia/notation/native` zeichnet mit `react-native-svg` auf iOS, Android und Web. Der Einstiegspunkt ist eigenständig, damit Modell und Layout ohne React (z. B. in Edge Functions) nutzbar bleiben.
- **Eine Elementliste für alle Ausgaben:** `svgScene` rechnet das Layout in Pixel-Elemente um (Text, Linie, Polygon, Pfad). Sowohl `layoutToSvg` als auch `ScoreView` zeichnen daraus. Im Web ist die App-Darstellung pixelgleich mit der SVG-Referenz (gemessen: 0 abweichende Pixel bei dreifacher Auflösung).
- **Notenfont:** Die App lädt Bravura mit `expo-font` aus `@vexflow-fonts/bravura` (OTF). Solange der Font lädt, zeigt sie nichts an, damit keine Ersatzzeichen erscheinen.
- **Zoom** über `staffSpace` (Pixel pro Notenlinienabstand), Farbe über `color`. Die App übergibt die Textfarbe des Themes; Hell- und Dunkelmodus folgen dem System.
- **Screenreader:**
  - Das SVG ist ausgeblendet. Über jeder Note liegt eine unsichtbare Fläche mit eigenem Text in der App-Sprache, z. B. „Viertelnote, eingestrichenes c“, „Halbe Note, Akkord: …“, „Achtelpause“, englisch „Quarter note, C 4“.
  - Diese Flächen dienen in P1.15 auch zum Antippen.
- **Beispiel in der App:** C-Dur-Tonleiter im Tab „Lernen“, bis die echten Lektionen kommen. Bilder: [hell](bilder/renderer-web-hell.png), [dunkel](bilder/renderer-web-dunkel.png).
- **Lizenz:** Der Hinweis auf Bravura (SIL OFL 1.1) steht im Profil, bis es einen eigenen Bereich für Credits gibt.
- **Offen:** Sichtprüfung auf iOS- und Android-Geräten. Sie braucht Development Builds und damit das Expo-Konto (siehe P1.03).

### Notenfont

- **Bravura** (SMuFL-Referenzfont, SIL Open Font License 1.1).
- Glyphen über SMuFL-Codepoints; Maße aus den Metadaten des Fonts (Begrenzungsrahmen, Ankerpunkte für Hälse, Standardwerte für Linienstärken).
- Lizenzhinweis in den App-Credits.
- **Quelle:** npm-Paket `@vexflow-fonts/bravura` 1.0.2, eine Kopie von Bravura 1.392 aus `steinbergmedia/bravura` mit OFL-Lizenztext. Die benötigten Glyphenmaße erzeugt `tools/generate-smufl-data.mjs` nach `packages/notation/src/smufl-data.ts`. Die Codepoints kommen aus der SMuFL-Glyphenliste. Ein Test prüft, dass die erzeugten Daten mit dem Font-Paket übereinstimmen.

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
- Entscheidung nach dem Spike in **P1.16** als ADR 0006 festhalten (inkl. gemessener Latenzen). ADR 0005 ist inzwischen für die fachliche Prüfung vergeben.

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
- Messung: Aufnahme mit externem Mikrofon (Tipp-Geräusch und Ausgabe) oder Hochgeschwindigkeitsvideo; Ergebnisse je Gerät in ADR 0006

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
