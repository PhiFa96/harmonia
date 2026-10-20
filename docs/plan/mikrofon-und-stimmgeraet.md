# P3.09 – Mikrofon und Stimmgerät

## Stand und Bedienung

Die Übungsansicht öffnet ein Stimmgerät. Ein Startknopf fragt die Mikrofonerlaubnis an. Die Ansicht zeigt bei einem stabilen Einzelton den Notennamen gemäß Musiklocale, Frequenz, Cent-Abweichung und eine Skala von −50 bis +50 Cent. ±5 Cent gelten für die **Anzeige** als gestimmt; die in P3.10 geplanten Übungstoleranzen bleiben davon unabhängig. Der Kammerton kommt aus der bestehenden Einstellung (415–466 Hz). Stop, Verlassen der Ansicht und Wechsel in den Hintergrund beenden den Zugriff. Ein verweigerter Zugriff und ein unterbrochenes Gerät liefern konkrete Meldungen mit Neustartmöglichkeit.

Auf iOS/Android verwendet der Adapter den PCM-Rückruf von `react-native-audio-api` mit Mono und nominal 48 kHz. Er bildet aus gerätespezifischen Callbackgrößen zusammenhängende Fenster von 2048 Samples. Auf Web liefert die Web Audio API alle 40 ms ein Zeitbereichsfenster aus dem Mikrofonstream; die Quelle ist mit keinem Audioausgang verbunden. Browserzugriff benötigt HTTPS oder localhost. Der Detektor akzeptiert Töne von 75 bis 1200 Hz, verwirft leise oder unklare Fenster, filtert bis zu fünf Ergebnisse per Median und verlangt mindestens 80 ms stabile Notenklasse. Einzelne Oktavausreißer werden so unterdrückt. Bei längerem Oktavfehler, Vibrato, mehreren gleichzeitigen Stimmen oder Lärm ist die Erkennung offen. Der Code speichert weder PCM noch Tonhöhenverläufe dauerhaft und enthält keinen Uploadpfad.

## Spike und Grenzen

`pitchy` 4.1.0 nutzt die McLeod Pitch Method in JavaScript und ist über alle Zielplattformen dieselbe Abhängigkeit. `react-native-pitchy` 1.3.1 ist eine native Alternative mit mehreren Algorithmen; sie braucht ein neues Native-Modul und für Web weiterhin einen eigenen Pfad. Die Herstellerangaben sind keine Messungen für Harmonia. Die Auswahl von `pitchy` ist daher eine technische Vorentscheidung. CPU-Zeit, Stromverbrauch, Geräte-Latenz und echte Gesangsgenauigkeit sind noch nicht gemessen. Die synthetischen Unit-Tests prüfen u. a. 44,1/48 kHz, Referenzton, Harmonische, Stille und einen einzelnen Oktavsprung; daraus folgt keine 95-Prozent-Quote bei Menschen.

## Geräteabnahme

Vor Abschluss des P3.09-Fertigkriteriums ist folgende Messreihe auf **mindestens zwei iPhones und zwei Android-Geräten** unterschiedlicher Leistung auszuführen; Web zusätzlich auf Safari und Chromium prüfen:

1. Drei Stimmen mit unterschiedlichem Stimmumfang wählen, darunter eine tiefe Stimme. In einem ruhigen Raum für jede Stimme zwölf vorher mit einem unabhängigen Referenzinstrument festgelegte Einzeltöne in ihrem Umfang je fünfmal singen. Töne jeweils mindestens zwei Sekunden halten, ohne Begleitton aus dem Testgerät. Das ergibt mindestens 180 Versuche je Gerät und 720 über vier Geräte.
2. Pro Versuch die erste stabile angezeigte Notenklasse, die Cent-Abweichung und die Zeit ab Tonbeginn protokollieren. Eine korrekte Erkennung verlangt die richtige Oktave und Notenklasse innerhalb einer Sekunde; Aussetzer und Oktavfehler zählen als falsch. Pro Gerät und Stimme korrekte Versuche / Gesamtversuche ausweisen. Das Kriterium **mindestens 95 %** muss für jede Geräte-Stimmen-Kombination erfüllt sein; zusätzlich Gesamtquote angeben.
3. Mit demselben festgehaltenen Eingangssignal bzw. denselben Versuchen `react-native-pitchy` auf einem separaten Testbranch vergleichen, falls `pitchy` das Kriterium verfehlt. Algorithmus, Fenster und Schwellen dokumentieren. Ende-zu-Ende-Latenz über externes Referenzsignal und Video/Messaufnahme pro Gerät messen, nicht aus Blockgröße ableiten.
4. Für die Akkuprüfung denselben Geräteaufbau, Helligkeit, Flugmodus/Netzzustand, Temperatur und Laufzeit verwenden. Leerlauf, aktives Stimmgerät mit `pitchy` und gegebenenfalls native Variante je mindestens 30 Minuten vergleichen; Median aus wiederholten Läufen und Streuung dokumentieren.
5. Berechtigung verweigern, später erteilen, App während Aufnahme verlassen, Bildschirm sperren, Audiogerät abziehen und auf Web Tab verbergen. OS-Mikrofonindikator und Freigabe prüfen. Stimmen auf echten Lautsprechern/Mikrofonen, Tablet und Screenreader separat abnehmen.

**Noch offen:** Diese Messungen benötigen physische Geräte und menschliche Stimmen. Ohne sie ist P3.09 technisch vorbereitet, aber das Fertigkriterium nicht nachgewiesen. Die datenschutzrechtliche Formulierung und Storeangaben brauchen ebenfalls Abnahme.
