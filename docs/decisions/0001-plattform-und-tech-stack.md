# 0001 – Plattform und Tech-Stack

- **Status:** angenommen
- **Datum:** 2026-10-02

## Kontext

Harmonia soll im Browser sowie als App auf iOS und Android laufen, aus einer gemeinsamen Codebasis. Das Team besteht aus Phillip und Claude. Entscheidend ist deshalb, womit wir schnell und zuverlässig auf allen drei Plattformen liefern.

Fachliche Anforderungen:

- **Notendarstellung:** Notensystem, Schlüssel, Noten und Akkorde, sauber und skalierbar
- **Tonausgabe mit geringer Latenz:** In der Gehörbildung muss der Klang unmittelbar auf eine Eingabe folgen
- **Interaktive Eingabe:** Klaviatur, Noten setzen per Touch oder Maus, später Mikrofon und MIDI
- **Echtzeit:** Live-Duelle, Video- und Sprach-Calls (Coaches, KI-Tutor)
- **Bezahlung:** Abos auf iOS, Android und Web; Auszahlungen an Coaches

## Betrachtete Optionen

- **A) React Native mit Expo (inkl. Web)** – TypeScript, eine Codebasis
- **B) Flutter** – Dart, eine Codebasis, kleineres Ökosystem für Musiknotation
- **C) Web-App mit Capacitor-Hülle** – volles Browser-Ökosystem, aber Risiken bei Audio-Latenz, App-Gefühl und Store-Prüfung

## Entscheidung

**Option A: Expo (React Native, TypeScript) mit Supabase als Backend.**

Bausteine, die wir dafür vorsehen (jeweils im Prototyp zu bestätigen):

| Aufgabe | Kandidat | Warum |
|---|---|---|
| App (iOS, Android, Web) | Expo, TypeScript | Eine Codebasis, großes Ökosystem |
| Backend | Supabase (Postgres, Auth, Realtime, Edge Functions, Storage) | Login, Datenbank, Echtzeit für Duelle, serverseitige Logik |
| Audio | `react-native-audio-api` (Software Mansion) | Setzt die Web Audio API für iOS, Android und Web um; Kern in C++, auf Android mit Oboe für niedrige Latenz |
| Notendarstellung | Eigener SVG-Renderer mit SMuFL-Notenfont (z. B. Bravura) | Volle Kontrolle für interaktive Übungen auf allen Plattformen |
| Calls und KI-Sprache | LiveKit (React-Native-SDK mit Expo-Plugin, Agents für Sprach-KI) | Video-Calls und Sprach-KI über dieselbe Infrastruktur |
| Abos | RevenueCat (`react-native-purchases`) | In-App-Käufe auf iOS und Android plus Web Billing über Stripe, gemeinsame Berechtigungen |
| Marktplatz-Zahlungen | Stripe Connect | Provision pro Zahlung, Auszahlung an Coaches |

## Konsequenzen

- Einige native Module (z. B. LiveKit) laufen nicht in Expo Go. Wir arbeiten mit Development Builds (EAS).
- Die Notendarstellung bauen wir selbst. Das ist mehr Aufwand, dafür beherrschen wir sie überall gleich.
- Die Audio-Latenz bleibt das größte technische Risiko. Ein früher Spike misst sie auf allen drei Plattformen.
- Supabase basiert auf Standard-Postgres. Ein späterer Wechsel des Anbieters bleibt möglich.
- Lizenzen aller Bibliotheken und Fonts vor der Einbindung prüfen.
