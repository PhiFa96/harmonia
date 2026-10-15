# Konten und Einstellungen – P2.01 bis P2.03

Stand: 15.10.2026. Implementierung und lokale Prüfungen; keine produktive Auth-Bereitstellung oder Anbieterabnahme.

## Anmeldewege

Gast, Altersbestätigung ab 16 und E-Mail-OTP bestehen seit P2.09. Datenübernahme, Export und Löschung wurden in den Folgepunkten ergänzt. Neu sind Apple/Google-PKCE über Supabase, korrelierte Rückleitungen und der Apple-Grant-Lebenszyklus nach [ADR 0026](../decisions/0026-kontoeinstellungen-und-providerfreigaben.md). Die Buttons sind ohne explizite Anbieterflags unsichtbar. Es werden keine Testkonten bei Apple/Google und keine echte externe E-Mail erzeugt.

Vor Aktivierung auf dem gebundenen Projekt:

1. Apple-/Google-Provider, Client-IDs und Redirects in den jeweiligen Konsolen und Supabase einrichten. Nur tatsächliche Web-Ursprünge und signierte native Schemes erlauben; kein Wildcard-Produktionsredirect. `EXPO_PUBLIC_AUTH_WEB_ORIGIN` muss exakt zum Web-Host passen. Web benötigt weiterhin COOP/COEP für SQLite. Der Rückleitungsserver soll Querystrings und Codes weder protokollieren noch an Analytics weitergeben; `Referrer-Policy: no-referrer` ist im lokalen Server gesetzt.
2. Function `apple-grant` und die Migrationen bereitstellen. `APPLE_CLIENT_ID` und `APPLE_CLIENT_SECRET` gehören ausschließlich in die Supabase-Function-Secrets. Der Client-Secret-JWT muss zum OAuth-Client passen; Ablauf/Rotation mit Zuständigkeit im Betreiberkalender eintragen. Keine dieser Daten in `EXPO_PUBLIC_*`, Git oder Supporttickets aufnehmen. Supabase Vault und dessen Backup-/Löschverfahren prüfen.
3. Auf echten Web-/iOS-/Android-Builds Anmeldung, Abbruch, Fehler, Wiederaufnahme, kalten/warmen Deep Link und Kontowechsel prüfen. Apple-Relay-Mail inklusive frischer OTP-Löschbestätigung zustellbar machen. Für Apple Store-Policy und gegebenenfalls erforderliche native Sign-in-Darstellung tatsächliche Abnahme dokumentieren; das vorhandene WebBrowser-Verfahren allein ist kein Compliancebeleg.
4. Pro Anbieter ein echtes eigenes Sandboxkonto anlegen, Tokenregistrierung nachweisen, Datenexport prüfen, frische Bestätigung und Kontolöschung einschließlich Apple-Widerruf, Vault-Bereinigung und externer RevenueCat-/Analytics-Bearbeitung prüfen. Fehler beim Widerruf müssen Löschung ohne falsche Erfolgsmeldung abbrechen. Bestehende Apple-Konten ohne Grant müssen sich erneut über Apple anmelden.
5. Erst dann die beiden öffentlichen Anbieterflags aktivieren und `authProvidersAndRevocation` mit Prüfbeleg freigeben. Produktives SMTP und Zustellnachweise bleiben Voraussetzung.

## Profil und Musikpräferenzen

Sprache DE/US/UK, Erscheinungsbild, reduzierte Bewegung, Haptik, Tonnamen unabhängig von der Sprache, Harmonikpräferenz, Klang, Kammerton 415–466 Hz, Anzeigename und vorhandene Ziel-/Erfahrungswerte werden kontogebunden gespeichert. Der Picker bietet 415/432/440/442/443/444/466 Hz. Tagesziel und Erinnerungen behalten ihre vorhandene Motivationssynchronisation. Streak, XP und Lektionsstatistik stammen weiterhin aus geprüften Lernnachweisen. Rechtstexte und Lizenzen liegen im bestehenden Rechtsbereich.

Musikoptionen ändern dynamische Namen und Audio sofort. Sie schreiben keine fachlich ungeprüften Autorenbeispiele um. Die Harmonikpräferenz steht dem Tutor zur Verfügung; spätere Analyseübungen/Funktionsbewertung aus Phase 3 werden nicht vorweggenommen. Promptversion 3 verlangt eine neue tatsächliche Tutor-Kalibrierung.

Gäste bleiben lokal. Bei Anmeldung lädt ein bestehendes Konto seine vorhandenen Werte; nur echte Änderungen gehen zurück. Bei gleichzeitigen Änderungen verschiedener Felder bleiben beide erhalten; bei demselben Feld gilt die letzte Servertransaktion. Fehler behalten die Warteschlange und zeigen einen Wiederholungsweg. Eine Gaständerung wird erst nach beiden SQLite-Schreibwarteschlangen als gespeichert bestätigt; bis dahin zeigt das Profil den laufenden Speichervorgang. Bestehende ältere Profilnamen werden bei der Erstinitialisierung erhalten. Nach Abmeldung erscheint der eigene Gaststand. Ein anderer Account erhält keine Daten des vorherigen Accounts.

## Vorhandene Fortschrittssynchronisation

P2.03 verwendet seit P2.11/P2.12 kanonische `learning_events`, Serverbewertung, `xp_ledger`, motivierte Streaks und abgeleiteten Fortschritt statt zusätzlicher paralleler Tabellen für dieselben Versuche. SQLite-Outbox, feste Client-IDs, Paging, atomare ACKs, Konflikt-/Zeitstempelbehandlung und Gastübernahme sind vorhanden. Aktuell geprüft: 226 Offline-Versuche, Duplikate, zwei Clients, manipulierte Antworten, RLS und atomare XP. Das ersetzt keine echte mehrtägige Offline-Abnahme auf Geräten; 50 komplette Lektionen mit echten Gerätesnapshots sind weiterhin in der Geräteprüfung nachzuweisen.

## Wiederholbare Prüfungen

`pnpm db:test:profile` erzeugt ausschließlich eigene lokale Konten und prüft isolierte Profile, nebenläufige Feldänderungen, RLS, Initialisierung, ungültige Patches und Löschkaskade. `pnpm db:test` umfasst verschlüsselte Apple-Grants mit Rotation und Vault-Kaskade. `pnpm check:accounts` prüft Apple-Identitätsbindung, Widerruffehler und anonyme Betriebsmetriken nur gegen HTTP-Attrappen. App-Tests prüfen SQLite/Kontowechsel/Offline-Patches und Rückleitungsvalidierung. Web-E2E prüfen DE/US/UK-Musikoptionen und echten SQLite-Neustart. Echte Anbieter- und Geräteprüfungen bleiben offen.
