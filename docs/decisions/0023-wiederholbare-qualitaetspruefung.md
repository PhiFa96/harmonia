# ADR 0023 – Wiederholbare Qualitätsprüfung und getrennte Geräteabnahme

- Datum: 15.10.2026
- Status: technische Umsetzung; physische Geräte-/Storeabnahme offen
- Kontext: P2.23

Web-Kernabläufe werden mit fest gepinntem Playwright und axe geprüft. Nur explizite lokale Gast-Fixtures: keine fremden Konten, keine echten Zahlungen, Modellaufrufe oder Analytics. Der Exporter deaktiviert Dotenv und externe öffentliche Konto-/RevenueCat-Bindungen für diese Fixtures. Das verändert weder Serverpolicies noch produktive Konfiguration. Vorschaudaten bleiben Entwürfe. Ein eigenständiger Produktions-Bundlecheck schützt die öffentliche Inhaltsgrenze.

Axe prüft WCAG 2.0/2.1/2.2 A/AA und ergänzende Best Practices ohne pauschales Abschalten gefundener Regeln. Echte Tastaturinteraktionen, persistierte Wiederaufnahme, ein vollständiger Durchlauf mit Lösungshilfen und das Ausbleiben einer Bestehens-/XP-Gutschrift ergänzen den Scanner. Web-Landmark, korrekte Dialogbenennung, Scrollfokus, Radio-Pfeiltasten und Fokuswiederherstellung sind Teil des Vertrags. Textvergrößerungsstress im Browser ersetzt keine native Dynamic-Type-/TalkBack-/VoiceOver-Abnahme.

Die vorhandenen Ziele von <3 s Start, <1 s Lektionsladen und <50 ms bis zum hörbaren Klang bleiben erhalten. Fünf lokale Browsermessungen prüfen die ersten beiden Ziele als Entwicklungsindikator, ausdrücklich ohne Geräte- oder Akustikbehauptung. Komprimierte Größe ist nicht automatisch tatsächlich übertragene Größe; der lokale Vorschau-Server handelt deshalb Gzip aus und behält die nötigen SQLite-COOP-/COEP-Header. Neue Größenwachen begrenzen den **öffentlichen** Web-JavaScript-Export auf 6 MiB roh/1,5 MiB Gzip, native Entrydateien auf 12 MiB und Klavier-MP3s auf 4 MiB. Grundlage ist der gemessene P2.22-Export, keine erfundene Store-/Gerätemessung. Vorschau enthält zusätzliche Entwurfsdaten und wird nicht am öffentlichen Inhaltsbudget gemessen.

Maestro-Flows sind für ausschließlich eigene wegwerfbare Vorschauinstallationen vorbereitet. In dieser Linux-Cloud fehlen Maestro, Android-SDK/Emulator und der iOS-Simulator; diese Flows werden deshalb nicht als ausgeführt abgehakt. Vier unterschiedliche physische Modelle, davon zwei iOS und zwei Android, müssen Modell/OS, Prüfer, Datum, privaten Beleg sowie tatsächliche Start-/Lektions-/Akustikwerte und Bedien-/Storeprüfungen erhalten. `qa:release` prüft die Vollständigkeit dieses Nachweises und scheitert derzeit erwartet. Ein Validator bestätigt keine Echtheit eines Gerätetests.

Unbehandelte Renderfehler erhalten eine übersetzte erneute Öffnung ohne rohe Fehlermeldung und ohne Datenreset. Es wird kein neuer Fehler-Tracking-Anbieter aktiviert. Betriebs-/Datenschutz-/Anbieterfreigaben aus den früheren Schritten bleiben erforderlich. Eine technische Codeintegration veröffentlicht keine Inhalte oder Dienste.

Prüfwerkzeuge: `@playwright/test` 1.64.1 (Apache-2.0), `@axe-core/playwright` 4.13.0 (MPL-2.0). Nur Entwicklungsabhängigkeiten; Anbieterquellen unverändert. Keine Einbindung dieser Prüfbibliotheken in die App.
