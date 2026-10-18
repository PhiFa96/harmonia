# ADR 0036 – Lokale Tonhöhenerkennung

**Status:** Technische Vorentscheidung am 18.10.2026. Genauigkeit, Ende-zu-Ende-Latenz, Akkuverbrauch, Geräteverhalten und Rechtstexte sind nicht abgenommen.

P3.09 verwendet `pitchy` 4.1.0 (MIT, McLeod Pitch Method) in einem gemeinsamen TypeScript-Detektor für iOS, Android und Web. Das vorhandene `react-native-audio-api` liefert auf iOS und Android PCM ohne Datei; im Web liefert `getUserMedia` über einen `AnalyserNode` Zeitbereichswerte. Eine Analyse umfasst 2048 Mono-Samples. RMS und Klarheit filtern Stille bzw. unsichere Tonhöhen. Ein Median über höchstens fünf Ergebnisse unterdrückt einzelne Ausreißer. Erst nach mindestens 80 ms stabiler Notenklasse wird die Note samt Cent-Abweichung gezeigt. Das Stimmgerät dient als sichtbares Prüfwerkzeug; Übungen mit Mikrofon folgen separat in P3.10.

`react-native-pitchy` wäre eine native Alternative mit zusätzlichen Modulen und getrenntem Webpfad. Die öffentliche Dokumentation des Anbieters enthält Benchmarks, aber keine Messwerte für diese App und diese Geräte. Deshalb lässt sich derzeit weder ein Genauigkeits-, Latenz- noch Akkuvorteil behaupten. `pitchy` erlaubt die Wiederverwendung des Detektors auf drei Plattformen ohne neue native Abhängigkeit. Bei verfehlter Abnahme wird die native Alternative auf demselben aufgezeichneten Prüfkorpus und denselben Geräten verglichen; die Architektur trennt Mikrofonadapter und Detektor dafür.

Mikrofonzugriff beginnt erst nach ausdrücklichem Start. Bei Stop, Navigation aus der Ansicht und Hintergrundwechsel endet der Zugriff. Audio wird nicht als Datei gespeichert und nicht versendet; die Ansicht zeigt nur flüchtige Messergebnisse. iOS benötigt die Nutzungserklärung, Android `RECORD_AUDIO`, das Web einen sicheren Ursprung und Browsererlaubnis. Die Datenschutztexte nennen diese lokale Verarbeitung; die rechtliche Prüfung bleibt offen.

Die Geräte-Messreihe und das 95-Prozent-Kriterium stehen in [mikrofon-und-stimmgeraet.md](../plan/mikrofon-und-stimmgeraet.md). Synthetische Tests belegen nur den Detektor unter kontrollierten Signalen.
