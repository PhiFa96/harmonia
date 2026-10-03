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
  - Bei bearbeitbaren Noten sind diese Flächen Regler (siehe Interaktion).
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

### Interaktion (umgesetzt in P1.15)

- **Treffer** (`hitTest` in `input.ts`, ohne React):
  - Ein Punkt im Notenbild ergibt die nächste Linie oder den nächsten Zwischenraum (Einrasten), begrenzt auf vier Hilfslinien über und unter dem System.
  - Daraus folgt die Tonhöhe: Stammton und Oktave aus dem Schlüssel. Das Vorzeichen kommt aus der Vorzeichnung, überschrieben vom letzten Versetzungszeichen an derselben Position im Takt (`prevailingAlter`). Übergebundene Noten zählen nicht, wie im Layout.
  - Dazu liefert der Treffer den Takt, das Ereignis (mit 0,75 Abständen Toleranz) und einen Notenkopf in der Nähe.
  - Gegenprobe im Test: Eine Note mit dem ermittelten Vorzeichen bekommt im Layout nie ein Versetzungszeichen, eine abweichende immer.
- **Bearbeiten:** reine Funktionen auf der Partitur.
  - `setPitch`: Pause wird Note, Akkordton wird ersetzt.
  - `addPitch`: harmonisches Intervall, Akkord.
  - `removePitch`: Note wird Pause.
  - `moveByStep`: Vorzeichen folgt der neuen Position.
  - `setAlter`: Vorzeichen-Leiste.
- **`ScoreView`** meldet Eingaben nur; was passiert, entscheidet der Aufrufer (später das Übungs-Framework).
  - **Tippen/Klicken** → `onTap(hit)`.
  - **Ziehen** einer bearbeitbaren Note → `onDragNote(ref, schritte, fertig)`.
    - Die Note folgt der Bewegung relativ zum Startpunkt, damit der Finger sie nicht verdecken muss. Ein halber Linienabstand ist ein Schritt.
    - Greifbar ist der Notenkopf, das Ereignis oder, fingerfreundlich, die einzige bearbeitbare Note im Takt. Das ist nötig, weil eine gesetzte ganze Note am Taktanfang steht, die Ganztaktpause davor aber in der Mitte (Notensatz-Konvention).
    - Während des Ziehens gibt die Fläche die Geste nicht an eine scrollende Umgebung ab.
  - **Fester Ausschnitt** bei der Eingabe: vier Hilfslinien Platz nach oben und unten plus das Band für die Symbole. Das Bild springt beim Ziehen nicht.
- **Hervorhebung** richtig, falsch, aktiv:
  - Notenkopf, Vorzeichen, Hals usw. in Farbe, dazu ein Symbol über dem Ereignis: Haken, Kreuz bzw. Dreieck.
  - Die Symbole sind als Vektoren gezeichnet (keine Schrift nötig). Bei Akkorden lässt sich ein einzelner Ton markieren. Das Symbol zeigt dann falsch vor aktiv vor richtig.
  - Farben sind vorläufig bis zum Design-System (P1.06), mit eigener Palette für den Dunkelmodus. Ein Test prüft den Kontrast: mindestens 4,5 : 1 gegen Weiß, Hellgrau und die dunklen Hintergründe von React Navigation.
  - Der Screenreader-Text erhält den Zusatz („…, richtig“), übersetzt vom Aufrufer.
- **Screenreader und Tastatur:**
  - Bearbeitbare Noten (auch eine Pause als Platz für eine Note) sind „anpassbar“: Wischen nach oben oder unten stellt sie einen Schritt höher oder tiefer.
  - Im Web sind sie Regler (ARIA „slider“). Mit Tab erreichbar, Pfeil hoch und runter verschiebt, ohne die Seite zu scrollen.
- **Vorschau in der App:** Tab „Üben“, „Intervall eingeben“ (große Terz über c¹).
  - Bedienung: Note setzen, ziehen, Vorzeichen-Leiste, Löschen, Prüfen.
  - Die Vorzeichen-Leiste nutzt Bravura-Zeichen und Glossarbegriffe als Beschriftung.
  - Die Bewertung ist ein Platzhalter, bis das Übungs-Framework (P1.19) sie übernimmt.
  - Bilder: [hell, falsche Antwort](bilder/eingabe-web-hell.png), [dunkel, richtige Antwort, Englisch (UK)](bilder/eingabe-web-dunkel.png).
- **Geprüft im Web (Chromium):**
  - Maus: Klicken, Ziehen, Vorzeichen, Prüfen.
  - Touch (Handy-Emulation): Tippen, Ziehen.
  - Nur Tastatur: Tab, Pfeiltasten, Enter auf „Prüfen“.
  - Jeweils ohne Konsolenfehler.
- **Touch-Schwelle im Web:** Chrome meldet die ersten etwa 15 px einer Touch-Bewegung nicht als `touchmove` (Touch-Slop). Gemessen wird ab dem Startpunkt; über die Schwelle und zurück landet die Note also richtig. Ganz kleine Korrekturen per Finger gehen im mobilen Web erst nach etwas Bewegung. Tippen, Vorzeichen-Leiste und Tastatur sind davon nicht betroffen.
- **Offen:**
  - Sichtprüfung und Bedienung auf iOS- und Android-Geräten (Development Build, siehe P1.03). Dazu gehört, ob die Geste in einer scrollbaren Umgebung zuverlässig bei der Note bleibt.
  - Wiedergabe-Cursor synchron zum Audio (mit P1.17).

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
- **Stand (P1.16):** [ADR 0006](../decisions/0006-audio-grundlage.md) als Entwurf; die Messwerte von Geräten fehlen noch.
  - **Paket `@harmonia/audio`:** plattformneutral gegen eine kleine Teilmenge der Web Audio API.
    - Töne, Intervalle, Akkorde und Sequenzen werden auf der Audio-Uhr geplant.
    - Das Metronom plant vorausschauend (Timer alle 25 ms, 100 ms voraus). Die Zeit wird aus der Schlagnummer berechnet, nicht aufaddiert. Nach langer Pause (App im Hintergrund) werden verpasste Schläge ausgelassen statt nachgeholt.
    - Getestet mit einer Attrappe mit eigener Uhr, auch mit schwankendem Timer.
  - **App:** `src/audio` erzeugt den Kontext (react-native-audio-api, im Web die Web Audio API) und setzt die iOS-Audio-Session.
  - **Testseite:** Profil → „Audio-Test (Messungen)“, mit Ton beim Antippen, Akkord, Tonleiter mit Metronom und Metronom allein.
  - **Geprüft im Browser (Chromium):**
    - Frequenzen gleichstufig korrekt (a¹ = 440 Hz, c¹ ≈ 261,63 Hz)
    - Tonleiter und Metronom taktgenau, bei 90 BPM exakt 0,666667 s, Betonung auf Schlag 1
    - Vom Browser gemeldete Latenz: 10 ms Verarbeitung und 32 ms Ausgabe. Das ist keine Messung.
  - **Messanleitung für die Geräte:** [audio-latenz-messen.md](audio-latenz-messen.md).

### Klangerzeugung

- **Klavier-Sampler:** Grundlage z. B. Salamander Grand Piano (CC BY 3.0, Namensnennung in den Credits). Für die App reduziert: Samples etwa alle drei Halbtöne, wenige Anschlagsstufen, komprimiert. Zwischenstufen über Tonhöhenverschiebung. Zielgröße des Pakets im MVP: unter 10 MB.
- **Stand (P1.17):**
  - **Quelle:** Salamander Grand Piano von Alexander Holm (Yamaha C5, CC BY 3.0 Unported), hier aus der OGG-Vorbis-Kopie im Tone.js-Repository (`Tonejs/audio`, Ordner `salamander` mit der Original-Lizenzdatei, etwa 130 kbit/s).
    - Die Original-FLAC-Dateien (freepats.zenvoid.org) sind in der Entwicklungsumgebung gesperrt.
    - Dasselbe Skript verarbeitet sie, sobald sie erreichbar sind (`--pattern "{sharp}v8.flac"`, Dateinamen vorher prüfen).
  - **Aufbereitung** (`tools/prepare-samples.mjs`, ffmpeg):
    - 30 Stützstellen in kleinen Terzen (A0 bis C8, wie aufgenommen)
    - Stille am Anfang entfernt, auf 4 s gekürzt und ausgeblendet, Mono
    - MP3 (LAME VBR 4), zusammen 0,65 MB
  - **Lautheit:**
    - Die Aufnahmen waren sehr unterschiedlich laut (−41 bis −21,5 LUFS im Anschlag).
    - Jede Probe wird auf gleiche Lautheit des Anschlags gebracht (EBU R128, erste 0,6 s), danach gemeinsam so, dass keine Spitze −1 dBFS übersteigt.
    - Nur den Spitzenpegel anzugleichen genügte nicht: Bis zu 8,6 dB Sprung zwischen Nachbartönen aus verschiedenen Aufnahmen.
  - **Stimmung:**
    - Gemessen je Probe (`tools/lib/pitch.mjs`): unter C6 per YIN, ab C6 per Spektralspitze. Im Überlappungsbereich weichen beide Verfahren höchstens etwa 7 Cent voneinander ab.
    - Die Aufnahmen zeigen die übliche Spreizstimmung (Bass etwa −10 Cent, Diskant bis +39 Cent). C8 liegt einen Halbton zu hoch, er klingt wie Cis8.
    - Die gemessene Abweichung steht in `apps/mobile/src/audio/piano-samples.ts`. Der Sampler gleicht sie aus, damit jeder Ton gleichstufig zur Engine passt; Gehörbildung braucht eine exakte Referenz.
  - **Sampler** (`@harmonia/audio`, `createSampler`):
    - Nächste Stützstelle, Tonhöhe über die Abspielrate (höchstens ±1 Halbton)
    - Beginn ab dem ersten hörbaren Sample (gleicht Stille und Kodierverzögerung aus)
    - 3 ms Einblenden, Halten bis zum Ende des Notenwerts, 0,25 s Ausklingen; nie länger als die Probe
  - **App:** Die Proben laden beim ersten Ton. Bis dahin klingt der Synthesizer (`setInstrument`). Credits stehen im Profil.
  - **Geprüft:**
    - `tools/check-samples.mjs`: Jede Datei enthält ihren Ton, beginnt ohne Stille und hat die richtige Länge.
    - Im Browser (Chromium, `OfflineAudioContext`) 61 Töne C2–C7 mit dem Sampler gerendert:
      - Stimmung höchstens 7,6 Cent neben gleichstufig, meist unter 3 Cent
      - Kein Sprung am Tonende, danach vollständige Stille
      - Lautstärkesprung zwischen Nachbartönen beim Wechsel der Stützstelle im Mittel 0,75 dB, höchstens 2,2 dB (innerhalb einer Stützstelle 0,3 dB)
    - In der App im Web: Klavier lädt, Abspielraten mit Stimmungsausgleich, keine Warnungen.
- Weitere Klänge später: Streicher, Chor („Ah“) für den Chor-Trainer, einfache Synthese als Rückfallebene.
- Funktionen: Einzeltöne, Intervalle (nacheinander und gleichzeitig), Akkorde (auch arpeggiert), Sequenzen mit Tempo, Kadenzen.
- **Metronom** mit vorausplanender Zeitsteuerung über die Audio-Uhr (nicht über JavaScript-Timer), damit es nicht schwankt.
- Kammerton einstellbar (Standard 440 Hz).

### Plattformdetails

- **Web:** Der Audio-Kontext startet erst nach einer Nutzeraktion (Autoplay-Regeln der Browser). Erster Bildschirm mit „Tippen zum Starten“.
- **iOS:** Ton klingt auch bei Stummschalter (F12); Hörübungen lassen sich mit „Gerade nicht hören“ für die laufende Lektion überspringen. Audio-Session `playback` mit `mixWithOthers`, später für Aufnahme erweitern.
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
