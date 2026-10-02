# 0001 – Plattform und Tech-Stack

- **Status:** offen
- **Datum:** 2026-10-02

## Kontext

Harmonia soll im Browser sowie als App auf iOS und Android laufen, möglichst aus einer gemeinsamen Codebasis.

Fachliche Anforderungen, die die Wahl bestimmen:

- **Notendarstellung:** Notensystem, Schlüssel, Noten und Akkorde, sauber und skalierbar
- **Tonausgabe mit geringer Latenz:** In der Gehörbildung muss der Klang unmittelbar auf eine Eingabe folgen
- **Interaktive Eingabe:** Klaviatur, Noten setzen per Touch oder Maus
- **Später möglich:** Mikrofon-Eingabe (Tonhöhenerkennung), MIDI
- **Offline-Fähigkeit:** [offen]

## Optionen

### A) React Native mit Expo (inkl. Web)

- TypeScript, eine Codebasis für iOS, Android und Web
- Notendarstellung: Gängige JS-Bibliotheken (z. B. VexFlow, abcjs) zielen auf den Browser. Auf iOS und Android bräuchte es SVG-Anbindung, eine WebView oder eigenes Rendering – zu prüfen.
- Audio: im Browser Web Audio API, auf iOS und Android native Audio-Module – Latenz zu prüfen

### B) Flutter

- Dart, eine Codebasis für iOS, Android und Web
- Notendarstellung: eigenes Zeichnen mit einem Notenfont nach SMuFL-Standard (z. B. Bravura). Das Ökosystem für Notation ist kleiner als bei JavaScript – zu prüfen.
- Audio: über Plugins, Latenz zu prüfen

### C) Web-App (PWA), für die Stores in eine native Hülle verpackt (z. B. Capacitor)

- Ein Web-Stack (z. B. React oder Svelte mit TypeScript) mit vollem Zugriff auf JS-Bibliotheken für Notation (VexFlow, abcjs, OpenSheetMusicDisplay) und Audio (Web Audio API, Tone.js)
- Mobile als PWA oder über eine Capacitor-Hülle in den App-Stores
- Risiken: Audio-Latenz und App-Gefühl auf Mobilgeräten; Store-Richtlinien sind bei reinen Web-Hüllen streng

## Entscheidungskriterien

- Qualität der Notendarstellung auf allen Plattformen
- Audio-Latenz auf allen Plattformen
- Entwicklungsgeschwindigkeit und vorhandene Erfahrung
- Wartungsaufwand, Reife des Ökosystems, Kosten

## Vorgehen

Pro Favorit ein kleiner Spike (1–2 Tage): ein Intervall im Notensystem darstellen, beide Töne abspielen, Antwort per Tippen entgegennehmen – getestet im Browser, auf iOS und auf Android.

## Entscheidung

[offen]

## Konsequenzen

[nach der Entscheidung ergänzen]
