# 0006 – Audio-Grundlage: Web Audio API auf allen Plattformen

- **Status:** vorgeschlagen. Die Messwerte von Geräten fehlen noch (P1.16), F12 ist offen.
- **Datum:** 2026-10-03

## Kontext

Harmonia spielt Töne, Intervalle, Akkorde, Sequenzen und ein Metronom. Später kommen Aufnahme und Tonhöhenerkennung dazu. Wichtig sind:

- kurze Latenz vom Tippen bis zum Klang: Ziel unter 50 ms auf Referenzgeräten ([notation-audio-eingabe.md](../plan/notation-audio-eingabe.md#latenzziele-in-p116-messen))
- genaue Zeitplanung für Rhythmus und Metronom, unabhängig von schwankenden JavaScript-Timern
- dieselbe Programmierschnittstelle auf iOS, Android und Web

## Entscheidung (vorgeschlagen)

- **iOS und Android:** [`react-native-audio-api`](https://github.com/software-mansion/react-native-audio-api) von Software Mansion (MIT-Lizenz, Version 0.13.6). Es setzt die Web Audio API nativ um (Oszillatoren, Gain, Puffer, genaue Zeitplanung auf der Audio-Uhr).
- **Web:** die Web Audio API des Browsers. Dieselbe Bibliothek bringt dafür eine Hülle mit, die App importiert auf allen Plattformen dasselbe.
- **Eigenes Paket `packages/audio`:**
  - Es arbeitet gegen eine kleine, selbst definierte Teilmenge der Web Audio API (`AudioContextLike`) und ist dadurch ohne Gerät testbar.
  - Töne, Intervalle, Akkorde und Sequenzen werden auf der Audio-Uhr geplant.
  - Das Metronom plant vorausschauend: Ein Timer schaut alle 25 ms 100 ms voraus.
  - Die App erzeugt den Kontext und übergibt ihn.

## Gründe

- **Gleiche Schnittstelle überall:** Web Audio im Browser, dieselbe Schnittstelle nativ. Logik und Tests gelten für alle Plattformen.
- **Genaue Zeitplanung:** Klänge werden zu Zeitpunkten der Audio-Uhr gestartet. Schwankende Timer verschieben nur den Planungszeitpunkt, nicht den Klang (geprüft mit Tests und im Browser).
- **Klangerzeugung im Programm:** Synthese, Hüllkurven und später ein Sampler mit Tonhöhenverschiebung (P1.17) sind möglich. Bibliotheken, die nur Dateien abspielen, können das nicht.
- **Gepflegt** von Software Mansion (u. a. Reanimated, Gesture Handler). Ein Expo-Config-Plugin ist dabei.

## Alternativen

| Alternative | Warum nicht |
|---|---|
| `expo-audio` (Expo SDK 57) | Spielt Dateien ab und nimmt auf (`AudioPlayer`, `AudioRecorder`, `AudioPlaylist`), hat aber keine Klangerzeugung und keine Planung auf einer Audio-Uhr. Für ein Metronom und für Sequenzen zu ungenau. |
| Eigene native Module (AVAudioEngine, Oboe/AAudio) | Beste Kontrolle, aber doppelter Aufwand (Swift/Kotlin) und kein Web. Nur als Ausweg, falls die Latenz mit `react-native-audio-api` das Ziel deutlich verfehlt. |
| Nur Web Audio im Browser, nativ eine WebView | Höhere Latenz und schlechtere Einbindung. |

## Konfiguration

- **Config-Plugin:** ohne Hintergrund-Audio (`iosBackgroundMode: false`) und ohne Android-Vordergrunddienst (`androidForegroundService: false`, keine zusätzlichen Berechtigungen). Klang nur im Vordergrund. Beides bräuchte eine Begründung im Store-Review, auf Android zudem eine dauerhafte Benachrichtigung. Geprüft mit `expo config --type introspect`: kein `UIBackgroundModes`, kein Dienst, keine Mikrofon-Berechtigung.
- **iOS-Audio-Session (vorläufig bis F12):** Kategorie `playback` mit `mixWithOthers`. Musikbeispiele startet man ausdrücklich, deshalb klingen sie auch bei Stummschalter. So sehen es die [Human Interface Guidelines](https://developers.apple.com/design/human-interface-guidelines/patterns/playing-audio/) für ausdrücklich gestartete Wiedergabe vor. Andere Musik läuft weiter.
- **Web:** Der Kontext entsteht erst bei der ersten Nutzeraktion (Autoplay-Regeln) mit dem Standard-Latenzhinweis `interactive`.
- **Antippen:** Ton beim Berühren (`onPressIn`), nicht erst beim Loslassen. react-native-web verzögert `onPressIn` standardmäßig um 50 ms. Im Web setzt die App diese Verzögerung deshalb auf 0.

## Messwerte

| Plattform | Gerät | Tippen bis Klang (gemessen) | Gemeldete Latenz | Bemerkung |
|---|---|---|---|---|
| Web | Chromium (headless, Container) | – (ohne Mikrofon nicht messbar) | 10 ms Verarbeitung + 32 ms Ausgabe | Gemeldete Werte von `AudioContext.baseLatency`/`outputLatency`, 44,1 kHz. Ersetzt keine Messung. |
| Web | Desktop-Browser mit Lautsprecher | offen | | |
| iOS | aktuelles iPhone | offen | | |
| iOS | älteres iPhone | offen | | |
| Android | teures Gerät | offen | | |
| Android | günstiges Gerät | offen | | |
| alle | Kopfhörer mit Kabel / Bluetooth | offen | | Bluetooth erfahrungsgemäß deutlich langsamer, notieren |

Messverfahren: [audio-latenz-messen.md](../plan/audio-latenz-messen.md).

## Falls das Ziel verfehlt wird

1. Zeit zwischen Tippen und `start()` messen (JavaScript) und kürzen.
2. Kleinere Puffer bzw. Low-Latency-Pfad prüfen (Android AAudio, iOS kleinere IO-Pufferdauer), soweit `react-native-audio-api` das erlaubt.
3. Den Kontext beim Öffnen einer Übung vorwärmen, statt ihn beim ersten Ton zu starten.
4. Als letzter Ausweg: eigene native Module (siehe Alternativen).

## Konsequenzen

- Development Builds sind nötig (natives Modul, nicht in Expo Go).
- Klang ist im Paket `@harmonia/audio` ohne Gerät testbar (Attrappe mit eigener Uhr). Plattformfehler zeigt aber erst der Test im Browser bzw. auf dem Gerät. Ein Beispiel aus P1.16: `setInterval` braucht im Browser `window` als `this`.
- Der Spike-Klang (Oszillator mit Hüllkurve) wird in P1.17 durch einen Klavier-Sampler ersetzt. Die Schnittstelle bleibt.
