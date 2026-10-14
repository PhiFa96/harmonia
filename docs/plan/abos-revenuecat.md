# P2.19 – Abos mit RevenueCat

Stand: 14.10.2026. Technische Anbindung implementiert; **echte Käufe und P2.19-Definition-of-Done offen**. Keine Veröffentlichung oder Remote-Bereitstellung. Claude Code übernimmt Review/Merge. Entscheidung: [ADR 0019](../decisions/0019-revenuecat-abos-und-berechtigungen.md).

## Was vorhanden ist

- Native SDK 10.13.0 und Web SDK 1.70.0, lazy geladen; öffentlicher plattformspezifischer Schlüssel wird vor Export geprüft, Secret-/Test-Store-/falsche Plattformschlüssel werden verworfen.
- Supabase-ID als RevenueCat-App-User-ID; keine Gastkäufe, sofortiges Löschen der Anzeige bei Kontowechsel, serialisierte SDK-Aktionen und keine automatische Kaufwiederholung.
- Profil → Abonnement in DE, en-US, en-GB. Echte geladene Monats-/Jahrespreise, expliziter Kauf, Store-Zahlungswartezeit/Abbruch, Wiederherstellung, Statusaktualisierung, Anbieter-Verwaltung/Kündigung. Bereits vorhandener Zugang verhindert weitere Käufe.
- `billing-webhook`: begrenzter authentifizierter Ereigniskern, App-Whitelist, idempotente Ereignisse, aktueller V1-Subscriber statt Ereignisbehauptung, beide Transfer-Seiten, getrennte Umgebungen, Lease/Provider-Zeitstempel, atomare Projektion und retryfähige Fehler.
- `billing`: JWT mit `getUser`, eigene Berechtigungen, explizite vollständige Neusynchronisation ohne Client-Kaufbeweis. Zehn Sekunden Abstand auch bei Anbieterfehlern.
- Additive Migration `20261014040000_billing.sql`; `billing_events`/`billing_accounts` server-only und RLS. `entitlements` bleibt für Konten nur lesbar; Produkt, Verlängerung und Zahlungsproblem ergänzt. Bestehende Tutor-Abos verwenden die projizierten Rechte.
- Kündigung erhält Zugang bis Ablauf; Rückerstattung/fehlender Grant entfernt Zugang; bestätigte Schonfrist wird berücksichtigt. Entitlements außerhalb der gewählten Umgebung werden nicht übertragen. Aktive temporäre manuelle Admin-Grants bleiben separat erhalten.

## Produkte und Bindung

Phillips Entscheidung: **monatlich und jährlich vorbereiten, Preise später**. F08 enthält noch keinen Preis. Die Integration benötigt diese Produktmatrix in den echten Anbieterprojekten:

| Offering | Entitlement | Paket | Periode | Native/Web-Produkt |
|---|---|---|---|---|
| `premium` | `premium` | `$rc_monthly` | P1M | Anbieterkennung nach Festlegung von Name/Bundle-ID |
| `premium` | `premium` | `$rc_annual` | P1Y | Anbieterkennung nach Festlegung von Name/Bundle-ID |
| `max` | `max` | `$rc_monthly` | P1M | vorbereiten, noch nicht zum Launch freigeben |
| `max` | `max` | `$rc_annual` | P1Y | vorbereiten, noch nicht zum Launch freigeben |

Apple: erneuerbare Abos derselben App in einer passenden Subscription Group; keine konkurrierenden Doppelabos. Google: Monats-/Jahres-Base-Plans den entsprechenden RevenueCat-Packages zuordnen. Web: RevenueCat Web Billing mit Test-Zahlungsanbindung des Unternehmens; getrennte Sandbox-/Produktionsschlüssel. Produkte müssen ihren Entitlement wirklich freischalten, bloßer Offering-Name genügt dem Server nicht. Max darf nicht als bereits vorhandene Sprach-/Analysefunktion beworben werden. `EXPO_PUBLIC_REVENUECAT_MAX_ENABLED` bleibt standardmäßig aus.

Sandbox und Produktion vor echter Abnahme in getrennten Supabase- und RevenueCat-Projekten betreiben; ein Sandbox-Test darf keine produktiven Konto-/Entitlement-Zeilen beeinflussen.

RevenueCat-Restore-Behavior: **Keep with original App User ID** für authentifizierte Käufe auswählen. Keine anonymen Käufe/automatische Übertragung an ein anderes angemeldetes Harmonia-Konto. Bei Fehlkonto auf das ursprüngliche Konto verweisen. Explizite administrative Provider-Transfers werden unterstützt, aber durch erneute Abfragen beider Konten bestätigt. Web-Wiederherstellung fragt das Originalkonto ab; sie sucht nicht anhand einer fremden E-Mail oder eines Stripe-Receipts.

### Öffentliche App-Konfiguration

- `EXPO_PUBLIC_REVENUECAT_IOS_KEY`: öffentlicher Apple-App-Schlüssel (`appl_…`).
- `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`: öffentlicher Play-App-Schlüssel (`goog_…`).
- `EXPO_PUBLIC_REVENUECAT_WEB_KEY`: öffentlicher Web-Billing-Schlüssel (`rcb_…` oder `rcb_sb_…`).
- `EXPO_PUBLIC_REVENUECAT_MAX_ENABLED`: standardmäßig `false`; erst nach Produktfreigabe aktivieren.
- Bereits vorhandene öffentliche Supabase-URL und Publishable-/Anon-Key.

Keine realen Schlüssel in Git oder Chat. Expo muss nach Konfigurationsänderungen mit `--clear` neu exportiert werden. Native SDK benötigt einen neuen Development-/Store-Build; Expo Go und ein JS-Export ersetzen keinen native Sandbox-Test. Der SDK nennt RN ≥0.73; das Projekt verwendet Expo 57/RN 0.86. Tatsächliche StoreKit-/Play-Billing-Kompatibilität wird am Gerät abgenommen.

### Private Function-Konfiguration

Im eigenen Supabase-Projekt sicher hinterlegen, getrennt vom App-Build:

- `REVENUECAT_SECRET_API_KEY`: private RevenueCat-V1-API-Bindung desselben Projekts; ausschließlich Server. Proxybindung der Cloud gilt nur für HTTPS an `api.revenuecat.com`, ersetzt keine Secret-Bindung eines Remote-Supabase-Projekts.
- `BILLING_WEBHOOK_AUTH_TOKEN`: eigener zufälliger Wert mit mindestens 32 Zeichen, im RevenueCat-Webhook als **`Bearer <derselbe Wert>`** konfigurieren. Wird im Function-Prozess für eingehende Requests verglichen; eine ausgehende Proxy-Secret-Ersetzung kann diese Aufgabe nicht übernehmen.
- `BILLING_REVENUECAT_ENVIRONMENT`: ausdrücklich `SANDBOX` bzw. `PRODUCTION`; keine automatische Ableitung aus Event oder Client.
- `BILLING_REVENUECAT_APP_IDS`: kommagetrennte echten RevenueCat-App-IDs von Apple, Google und Web dieses Projekts.
- Supabase-URL/Service-Role: normale private Function-Bindung, niemals im App-Bundle.

Alle Bindungen sind Voraussetzung für `configured=true`. Webhook-URL des eigenen Projekts `/functions/v1/billing-webhook`; `verify_jwt=false` ist nötig für RevenueCat, der Function-eigene Bearer-Check bleibt obligatorisch. `billing` validiert stattdessen selbst das Konto-JWT. Keine vom Client wählbare Provider-URL. API-Redirects werden abgelehnt; Zeit-/Body-Grenzen verhindern unbeschränkte Eingaben. Testdaten-/Header-/Sessioninhalte nicht protokollieren.

Die Cloud-Konfiguration enthält als **gespeicherten Entwurf**, noch nicht als aktive Bindung, neue Variablennamen/API-Secret-Anforderung und zusätzliche RevenueCat-/Stripe-Domains. Aktuelle Maschine hat keine RevenueCat-Bindung; offizielle RevenueCat-Dokumentations-HTTP-Zugriffe wurden durch den Proxy abgewiesen. SDK-Verträge wurden an den veröffentlichten, gepinnten npm-Typen und dem offiziellen öffentlichen `RevenueCat/purchases-js`-Quellcode geprüft. Vor Remote-Konfiguration die aktuellen Anbieter-Dashboard-Verträge gegen die offiziellen Seiten erneut prüfen. Die vorhandene Anthropic-Anforderung bleibt erhalten. Für Live-Arbeit Einstellungen prüfen/speichern und Umgebung veröffentlichen; ein Draft-Save führt keine Scripts aus und veröffentlicht nichts.

## Lokal prüfen

```bash
source /workspace/harmonia-env.sh # nur diese vorbereitete Cloud, sonst Node 22/pnpm 10 verwenden
pnpm install --frozen-lockfile
pnpm db:start
pnpm exec supabase migration up --local
pnpm db:serve:learning --tutor-test --billing-test
```

Startlog enthält lokale Supabase-Schlüssel; in der Cloud umleiten. Kein Reset der bestehenden Datenbank. Functions in einem separaten Terminal starten und danach:

```bash
pnpm check:billing
pnpm db:test:billing
pnpm db:test
pnpm db:lint
pnpm --filter @harmonia/mobile test billing
pnpm lint
pnpm typecheck
pnpm check:i18n
```

`--billing-test` aktiviert ausschließlich an einer lokalen Supabase-URL einen sichtbar simulierten Provider und einen festen, öffentlichen **lokalen Test**-Bearer. Der API-Test erzeugt echte lokale Auth-Konten/JWTs und temporär eine nur serverlesbare `billing_test_snapshots`-Tabelle. Sie ist keine Migration; sie wird nach dem Lauf gelöscht, ebenso die eigenen Testkonten und Receipt-Zeilen. Auf einem Remote-Projekt ist dieser Runner nicht zulässig; dort keine `HARMONIA_*_LOCAL_TEST`-Flags setzen. CI verwendet dieselben lokalen Proben ohne Zahlung oder Anbieter-Secrets.

## Verifikation dieser Übergabe

- Gesamte Paket-/App-/Node-Suite: 2863 erfolgreiche Prüfungen; anschließend 48 finale Abo-/Adapter-/Oberflächenprüfungen nach den letzten Änderungen (einschließlich getrennter Monats-/Jahresbuttons, Zahlungsproblem und Pending-Schutz).
- Billing-Deno: 37 Snapshot-/Auth-/Body-Proben plus 91 Transportprüfungen an expliziten HTTP-Attrappen. Die private Produktions-Transportstrecke wird ohne externe Anbieteraufrufe geprüft; lokaler Fixture-Modus kann an Remote-URLs nicht aktiviert werden. Der übrige Deno-Gesamtlauf war ebenfalls grün.
- 81 echte lokale Auth-/Postgres-/Edge-Prüfungen, einschließlich Transfer ohne Ereignisumgebung; 278 pgTAP-Prüfungen insgesamt, davon 37 Billing. DB-Lint, Typen, ESLint, Formatierung, vollständige Übersetzungen, Inhaltspipeline und Curriculum geprüft. Frozen-Lockfile-Installation mit den neuen gepinnten SDKs erfolgreich.
- Browser mit tatsächlichem lokalem JWT: Gast, Kontonavigation, kaufdeaktivierte Konfiguration, echter Web-SDK-Import, simulierte HTTP-Angebote mit Monats-/Jahrespreisen, eigene serverseitige Wiederherstellung, Logout und mobile/desktop Breite. Keine reale Zahlung oder Stripe-Karte. SDK-Adapter wird über den plattformauflösenden App-Alias importiert; ein expliziter relativer `.ts`-Import hatte die Web-Spezialisierung übergangen und wurde korrigiert.
- Finale Preview-Exporte für Web/iOS/Android erfolgreich; iOS/Android als tatsächliche Hermes-Bytecode-Dateien kompiliert. Finaler öffentlicher Export: sechs JS-Dateien, keine unveröffentlichten Inhalte, kein privater lokaler Service-Key und keine Backend-/Billing-Testadapter. Der Web-Entry verwendet die Web-Spezialisierung. Diese Builds sind keine Gerätekäufe oder Sandbox-Zahlungen.

## Betrieb und offene echte Abnahme

`billing_events` mit `processed_at is null` nach einer Stunde alarmieren. RevenueCat wiederholt nicht mit 2xx bestätigte Ereignisse; bei längerem Ausfall pending Events über den Anbieter erneut zustellen. Keine Events als verarbeitet markieren, ohne alle betroffenen Konten abgefragt zu haben. Account-Neusynchronisation kann verlorene Webhooks reparieren. Laufzeit prüft `expires_at` auch ohne Ablauf-Webhooks; Refunds/Verlängerungen benötigen erfolgreiche Zustellung oder aktuellen Fetch.

Receipts enthalten noch personenbezogene Konto-IDs. Aufbewahrungszeit und Konto-Löschkonzept in P2.21 festlegen; keine unbegrenzte Aufbewahrung behaupten. `billing_accounts`/Entitlements werden bei Supabase-Kontolöschung kaskadiert. Löschung des RevenueCat-Kontos, Restfristen und Kündigung vor Kontolöschung gehören zu der noch offenen vollständigen P2.01/P2.21-Kontolöschung. Anbieterlinks öffnen nur geprüfte HTTPS-Hosts von Apple, Google und RevenueCat, keine beliebigen Event-/Client-URLs. Bei Zahlungsproblemen wird keine Kundenkündigung behauptet. Eine offene Zahlungsbestätigung bleibt auch nach Statusaktualisierung sichtbar und verhindert einen erneuten Kauf. Der deutsche eigenständige Web-Kündigungsbutton wird in P2.20 ergänzt; der vorhandene Portal-Link ist keine behauptete §312k-Abnahme.

Noch offen und nicht als erledigt markieren:

1. Unternehmensprojekte, endgültige Bundle-IDs, tatsächliche Store-/Web-Produkte und F08-Preise festlegen; Store-/RevenueCat-Verknüpfung und Restore-Regel einstellen.
2. Sichere Remote-Secrets, Webhook-Auth/App-Whitelist, Sandbox-Projekt und Functions/Migration bereitstellen.
3. iOS-Gerät: Monats-/Jahreskauf, Wiederherstellung auf zweitem Gerät, Kündigung, Ablauf, Refund und Fehlkonto prüfen. Nicht nur Expo Go/JS-Export.
4. Android-Gerät: Lizenztester, echte Play-Testprodukte/Base-Plans, Kauf, Pending Payment, Abbruch, Wiederherstellung, Ablauf/Refund prüfen.
5. Web: echte Web-Billing-Sandbox mit Testzahlung, Checkout-Texte/Steuern, Originalkonto, Konto-Wechsel, Portal-Kündigung und Ablauf prüfen; Checkout unter den SQLite-COOP/COEP-Headern abnehmen.
6. Geräteübergreifender Zugang desselben Kontos und korrekte Tutor-Berechtigungen; absichtlich vertauschte Umgebungen/Schlüssel und falsche Webhook-Auth verweigern.
7. Apple Small Business Program durch den berechtigten Unternehmensinhaber beantragen und Ergebnis protokollieren.

Nach dieser technischen Übergabe folgt P2.20 – Paywall und Gratis-Limits. Echte P2.19-Definition-of-Done bleibt bis zu obigen Sandbox-Nachweisen offen.
