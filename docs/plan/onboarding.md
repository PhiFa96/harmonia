# P2.09 – Onboarding und E-Mail-Anmeldung

**Fortsetzung P2.10:** Der gespeicherte Einstufungswunsch führt jetzt zum Testangebot über Lernen/Profil. Ablauf und Ergebnis: [Einstufungstest](einstufungstest.md). Die folgenden Abschnitte dokumentieren die ursprüngliche P2.09-Abnahme; dessen damalige Vormerkung ist ersetzt. Gerätedatenbankversion 2 ergänzt die separate Testtabelle ohne Änderung des Onboarding-Payloadschemas.

Stand 13.10.2026: Der vollständige Einstieg ist in DE/US/UK implementiert. Die E-Mail-Anmeldung aus P2.01 wurde auf ausdrücklichen Wunsch vorgezogen. Die technische Abnahme erfolgt lokal; echte Testpersonen, native Geräte und die produktive Supabase-/SMTP-Anbindung bleiben gesonderte Abnahmen.

## Tatsächlicher Ablauf

Ein neues Gerät und direkte Links auf geschützte App-Routen führen zunächst zur Einrichtung. Gespeicherte Geräte starten direkt im Lernbereich. Schrift und Einstellungen werden vor der Navigation geladen; ein Ladefehler wird mit Wiederholen und einem ausdrücklich ungespeicherten Sitzungsstart behandelt.

1. Sprache: Gerät, Deutsch, English (US), English (UK); Auswahl wirkt sofort.
2. Lernziel: Hobby, Schule/Unterricht, Aufnahmeprüfung oder Chor/Ensemble.
3. Selbsteinschätzung: neu, Grundlagen oder erfahren; kein dadurch erfundenes Testergebnis.
4. Einstufungsangebot: Grundlagen ausprobieren oder den Test vormerken. Die Oberfläche sagt ausdrücklich, dass P2.10 noch folgt; gespeichert wird der Wunsch.
5. Tagesziel: 10, 20, 30 oder 50 XP. Das ist ein Ziel, keine bereits existierende XP-Vergabe aus P2.14.
6. Erinnerungen: standardmäßig aus; Einwilligung und bevorzugte lokale Uhrzeit (17/18/19/20 Uhr) vormerken. Keine Systemberechtigung, kein Push-Token und keine Zustellung werden dadurch erzeugt. Widerruf ist im Profil möglich.
7. Mini-Aufgabe: zwei natürliche Noten im Violinschlüssel vergleichen. Eine kurze Erklärung führt ein; Tonnamen werden nicht vorausgesetzt. Die vorhandene Engine bewertet die Richtung aus dem Score. Klang startet nur durch eine ausdrückliche Aktion und ist für die visuelle Antwort optional. Auch eine falsche Antwort führt nach Erklärung weiter; Erstwertungs-Sperre und Hilfen bleiben erhalten.
8. Konto oder Gast: Altersbestätigung gemäß F01 (mindestens 16), lokal als Gast beginnen oder E-Mail mit einem sechsstelligen Code bestätigen. Die Mini-Aufgabe liegt vor jeder Kontoerstellung. Bestehende Konten verwenden denselben Code-Ablauf. Nach einem Gaststart ist Anmeldung im Profil möglich.

Die acht Ansichten bilden die sieben geplanten Einrichtungsschritte plus die eingeschobene Mini-Aufgabe. Fortschrittsbalken, klare Optionsfelder, lesbare Auswahlzustände, große Ziele und Hell-/Dunkelfarben verwenden das bestehende Designsystem. Tastatur: Radio-Gruppen mit Pfeilen, Home/End, Leertaste/Enter; Schalter mit Leertaste/Enter. Schrittwechsel setzen Scrollposition und Überschriftfokus zurück. Bewegungsreduktion bleibt über den bestehenden Provider aktiv.

## Speicherung und Kontogrenzen

`harmonia-device.db` enthält eine separate SQLite-Tabelle `device_preferences`, genau eine Zeile mit validiertem Snapshot. Schema-/Payloadversion jeweils 1. Sie bewahrt Sprache, Erscheinungsbild, Haptik, Bewegungsreduktion, Ablaufposition, Lernangaben, Einwilligung, Mini-Seed/-Antwort/-Hilfen/-Wertung und lokale Zeitpunkte. Keine E-Mail-Adresse, Codes oder Sitzungstoken liegen in diesem Snapshot. Gespeicherte Mini-Wertungen werden aus dem Seed neu berechnet, nicht aus einer gespeicherten richtigen Antwort übernommen.

Writes laufen nacheinander; ein neuerer Stand wird nicht von einem langsameren alten Write überholt. Speichern ist sichtbar, Fehler sind wiederholbar. Die normale Abschlussnavigation wird erst nach erfolgreichem Abschluss-Write freigegeben. Im ausdrücklich gewählten Sitzungsmodus bleibt der Hinweis auf fehlende dauerhafte Speicherung auch im Lernbereich sichtbar. Unbekannte Versionen oder beschädigte Daten werden nicht still überschrieben. Die bisherige `harmonia-lessons.db`, ihre Version 1 und sämtliche Lektionsversuche bleiben unverändert.

Supabase Auth bestätigt die E-Mail; vor dem E-Mail-Onboardingabschluss wird die Konto-ID nochmals über `getUser()` geprüft. Web-Sitzungen verwendet die SDK-Speicherung; iOS/Android verwenden SecureStore mit vollständigen, vor dem Manifest geschriebenen Teilen unter der Einzelwertgrenze. Native Refreshes folgen dem App-Vordergrund. Abmelden entfernt die Gerätesitzung und erhält den lokalen Lernstand.

Anmeldung ist noch keine geräteübergreifende Fortschrittssynchronisierung. P2.03 bleibt offen; die App erklärt das vor Abschluss und auf der Kontoseite. Keine neuen Supabase-Profilspalten oder RLS-Regeln wurden eingeführt. Apple/Google, vollständige Kontolöschung und Datenexport aus P2.01 sowie die übrigen P2.02-Einstellungen sind weiterhin eigene Arbeitspunkte.

## E-Mail lokal und produktiv konfigurieren

In `apps/mobile/.env` nur die öffentlichen Werte aus [`.env.example`](../../apps/mobile/.env.example) setzen: `EXPO_PUBLIC_SUPABASE_URL` und Publishable-Key, alternativ Anon-Key. Ein leerer Publishable-Eintrag lässt den Anon-Key zu. Service-/Secret-Schlüssel sind untersagt; die Expo-Konfiguration bricht vor Metro ab, damit solche Werte nicht ins Bundle gelangen. Externe URLs müssen HTTPS verwenden; Loopback und die Android-Emulatoradresse dürfen für lokale Entwicklung HTTP verwenden. Ohne Bindung funktioniert der Gaststart, die E-Mail-Oberfläche nennt ihre Nichtverfügbarkeit.

Die eigene [Code-Vorlage](../../supabase/templates/email-code.html) ist durchgehend deutsch/englisch, auch für ältere Konten ohne Locale-Metadaten. In staging/production sowohl Bestätigungs- als auch Magic-Link-Vorlage auf diese Code-Fassung einstellen, E-Mail-Bestätigung aktivieren und den SMTP-Versand prüfen. OTP-Code-Verifikation verwendet keine Link-Rückleitung; `detectSessionInUrl` ist deaktiviert. Weiteres OAuth/Link-Handling gehört zu P2.01.

Lokale Befehle:

```sh
source /workspace/harmonia-env.sh # nur in dieser Cloud-Umgebung
pnpm db:start
pnpm db:lint
pnpm db:test
pnpm db:test:api
pnpm db:test:email
```

`db:start` bewahrt Docker-/Proxy-/CA-Konfiguration und die lokale Datenbank. Bei CLI 2.119 wurden öffentliche Template-Mounts mit Modus 0600 nachgewiesen: `prepare-local-email.mjs` prüft deren Übereinstimmung mit der eigenen Vorlage und macht ausschließlich diese beiden Dateien lesbar. Die mit CLI 2.120 gelieferte Auth-Version 2.197 lädt die Vorlagen bereits beim Start; nach geänderten Dateirechten wird nur der eigene Auth-Container neu gestartet und seine Bereitschaft geprüft, damit keine Standardvorlage aus dem Fehlercache bleibt. Ein temporärer Docker-Aufrufhelfer ergänzt bei vorhandenen Proxys ausschließlich den eigenen Kong-Host in den vorhandenen NO_PROXY-Werten des eigenen Auth-Containers. Externe Ziele und andere Container bleiben unverändert; der ursprüngliche Docker-Aufruf bleibt erhalten. Ohne diese Korrektur lieferte der lokale Template-Server 403 bzw. der falsch verwendete Proxy 400 und Auth fiel auf eine ungeeignete Standardmail zurück.

Die Auth-Integrationstests verwenden ausschließlich Loopback und reservierte `example.invalid`-Adressen mit lokalem Mailpit. Schlüssel/Codes/Sitzungen bleiben im Prozess. Nur die eigenen Testkonten und Test-E-Mails werden entfernt. Der bestehende API-/RLS-Test erstellt bestätigte lokale Testkonten über Admin und meldet sie regulär an; öffentliche Kontoerstellung mit tatsächlicher Code-Bestätigung prüft der neue E-Mail-Test. CI enthält diesen zusätzlichen Durchgang.

## Prüfstand

- Vollständige Testsuite: **2.332 Tests** (UI 14, Theorie 717, Audio 29, i18n 419, Notation 234, Übungen 318, Inhalt 227, App 317, Werkzeuge 57). Neue Onboarding-, SQLite-, Konfigurations-, SecureStore-, Lifecycle- und UI-Prüfungen; betroffene Bereiche zusätzlich nach den letzten Korrekturen geprüft.
- Typprüfung, Lint/Paketgraph, Format, Übersetzungen, Inhalts-/Fähigkeitsplan und eingefrorene Offline-Installation geprüft. Deno: Typprüfung plus **78 Laufzeitprüfungen**. Datenbank: SQL-Lint, **34 pgTAP-Tests**, Auth-/REST-Zugriffsschutz und die echte E-Mail-Code-Integration erfolgreich.
- 100 reproduzierbare Mini-Quellen einschließlich JSON-Restore, ungültige/fremde Snapshots, echter SQLite-Dateineustart und unveränderte getrennte Lektionsdatenbank.
- Echte lokale Auth: neues/bestehendes Konto, Versand ohne bereits erfolgte Anmeldung, falscher und verbrauchter Code, bestätigte Adresse, normales Auth-Role, Client-Neustart, Refresh, eigenes RLS-Profil, Abmeldung und Bereinigung.
- Browser: vollständiger DE-Touch-, US-Tastatur- und UK-Touch-Durchgang; Dark Mode und reduzierte Bewegung; Wiederaufnahme nach Reload, gespeicherte falsche Mini-Antwort, Änderungen von Tagesziel und Widerruf des Erinnerungswunsches. Keine automatischen Töne oder Benachrichtigungsanfragen.
- Browser gegen echtes lokales Auth: neues Konto nach Mini-Aufgabe und bestehendes Konto nach Gaststart; falscher/richtiger Code, Sitzung nach Reload und Abmeldung ohne verlorene lokale Lernangaben.
- Browserfehlerfälle: tatsächlicher Audio-Startfehler lässt die visuelle Aufgabe und den gespeicherten Abschluss zu. Fehlende SQLite-Webvoraussetzungen führen zum ausdrücklich gewählten Sitzungsmodus; der Speicherhinweis bleibt nach Abschluss sichtbar. Die Sprachansicht wurde bei 200% Darstellung auf Umbruch/Überbreite geprüft; daraus folgt keine native Großschriftabnahme.
- Automatisch gemessene Zeit vom Aufruf bis zur Mini-Aufgabe: deutlich unter 120 Sekunden. Das misst Rendering und Bedienungswege eines schnellen automatisierten Durchgangs, **nicht** menschliche Lese-/Entscheidungszeit. `startedAt` und `firstTaskAt` erlauben die lokale Messung bei echten Testpersonen; keine Analytics-Anbindung wurde eingeführt.

Letzter vollständiger Browserstand: DE Touch **1,96 s**, US Tastatur **1,60 s**, UK Touch/dunkel/reduzierte Bewegung **1,82 s** bis zur sichtbaren ersten Frage, jeweils inklusive Kaltaufruf und eines echten Zwischen-Reloads. Touch 390 × 844, Desktop 1440 × 1000. Produktions-Export und lokale Auth-Vorschau gebaut; das tatsächliche Produktions-Bundle enthält keine unveröffentlichten Katalog-IDs oder Inhaltstexte. Ein synthetischer Secret-Schlüssel wird nachweislich bereits durch die Expo-Konfiguration vor dem Bundle abgewiesen.

Eine echte iOS-/Android-/VoiceOver-/TalkBack-Abnahme, ein erfolgreicher GitHub-CI-Lauf sowie der im Plan geforderte Durchgang mit Testpersonen ohne Hilfe sind noch nicht belegt. Deshalb ist dies eine vollständige technische Implementierung, kein behaupteter öffentlicher Launch oder abgeschlossener Usability-Nachweis.

Review-Zweig `codex/p2-09-onboarding`, auf den aktuellen `main`-Stand `421ff18` gesetzt: [GitHub-Vergleich](https://github.com/PhiFa96/harmonia/compare/main...codex/p2-09-onboarding). Kein Merge; die zuvor bestätigte GitHub-API-Sperre verhindert weiterhin die PR-Erstellung aus dieser Umgebung. Nächster Planpunkt: P2.10, mit dem gespeicherten Einstufungswunsch als Übergang.
