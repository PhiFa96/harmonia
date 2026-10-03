# Audio-Latenz messen (P1.16)

Ziel: Zeit vom Antippen bis zum hörbaren Ton, je Gerät. Ergebnisse kommen in [ADR 0006](../decisions/0006-audio-grundlage.md).

## Was man braucht

- Das Gerät mit einem **Development Build** der App, besser einem Preview-Build (näher an der späteren App als der Entwicklungsmodus).
- Ein zweites Gerät zum Aufnehmen (Handy oder Laptop mit Mikrofon) und Audacity (kostenlos) zum Auswerten.
- Ruhige Umgebung.

## Ablauf

1. In der App: **Profil → Audio-Test (Messungen)**. Lautstärke auf etwa 70 %.
2. Aufnahmegerät dicht neben das Testgerät legen (etwa 10 cm vom Bildschirm und vom Lautsprecher) und die Aufnahme starten.
3. Mit dem **Fingernagel** kurz und hörbar auf die Schaltfläche **„Ton a¹“** tippen. Der Ton startet beim Berühren.
4. Das 10-mal wiederholen, mit etwa 2 Sekunden Abstand.
5. Aufnahme in Audacity öffnen. Für jeden Tipp die Zeit vom Klick des Fingernagels bis zum Beginn des Tons ablesen (Auswahl von Anfang zu Anfang, unten steht die Länge).
6. **Median** der 10 Werte notieren.

Der Schall braucht etwa 0,3 ms für 10 cm, das ist vernachlässigbar. Der Wert enthält die Touch-Erkennung des Geräts, die App und die Audio-Ausgabe, also genau das, was Nutzer erleben.

## Zusätzlich je Gerät

- **Kopfhörer mit Kabel:** gleicher Ablauf, Aufnahmegerät am Ohrhörer.
- **Bluetooth-Kopfhörer:** gleicher Ablauf; Modell notieren. Bluetooth ist erfahrungsgemäß deutlich langsamer.
- **iOS-Stummschalter (F12):** Schalter auf lautlos, „Ton a¹“ antippen. Notieren, ob es klingt. Mit der vorläufigen Einstellung (Kategorie `playback`) sollte es klingen.
- **Andere Musik im Hintergrund:** Musik-App starten, dann „Ton a¹“. Notieren, ob die Musik weiterläuft (erwartet: ja, `mixWithOthers`).
- **Metronom:** „Metronom 90 BPM“ eine Minute laufen lassen und auf Aussetzer oder Stolpern hören, auch beim Scrollen und beim Wechsel der App.

## Ergebnisvorlage

| Gerät (Modell, Betriebssystem) | Ausgabe | Median (ms) | Spanne (ms) | Stummschalter | Metronom gleichmäßig | Bemerkung |
|---|---|---|---|---|---|---|
| | Lautsprecher | | | | | |
| | Kopfhörer (Kabel) | | | – | | |
| | Bluetooth (Modell) | | | – | | |

Gemessen werden sollte auf mindestens: einem aktuellen und einem älteren iPhone, einem teuren und einem günstigen Android-Gerät, einem Desktop-Browser.
