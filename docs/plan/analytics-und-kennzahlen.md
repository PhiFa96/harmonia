# P2.22 – Analytics und Kennzahlen

Stand 15.10.2026: technisch umgesetzt, Erfassung standardmäßig aus. Phillip hat **Supabase und ein eigenes Dashboard** gewählt. Kein externer Analytics-Dienst, keine realen Beta-Nutzer erfasst. Die Definition of Done „Dashboard zeigt Daten der Beta“ bleibt bis zur rechtlichen Freigabe und tatsächlichen Beta offen. [ADR 0022](../decisions/0022-eigene-consentgebundene-analytics.md).

## Ereignisvertrag v1

| Ereignis | Ursprung und erlaubte Angaben | Bedeutung |
|---|---|---|
| `app_active` | Client; Plattform, Sprache; einmal je Konto/UTC-Tag | Nach bestätigter Einwilligung beim Vordergrundstart; keine Hintergrundaktivität |
| `onboarding_completed` | Client; Plattform, Sprache; einmal je Kohorte | Beobachteter Abschluss bei bereits aktiver Einwilligung, kein historischer Import |
| `lesson_started` | Client; freigegebene Katalog-ID/Version, Durchgang-UUID, Plattform, Sprache | Tatsächlich gestarteter/fortgesetzter Durchgang; gleiche UUID einmal |
| `lesson_completed` | Server nach neuer kanonischer Lernprüfung; ID/Version, Durchgang-UUID, bestanden | Wiederholte Synchronisation/Retention erzeugt keinen weiteren Abschluss |
| `paywall_viewed` | Client; Grund onboarding/limit/premium/tutor/settings, Plattform, Sprache | Aufruf, kein Kaufversuch oder Finanzbeleg |
| `purchase_completed` | Server; bezahlter Tarif | Neuer Produktions-Erstkauf mit NORMAL-Periode oder bezahlte Trial-Umwandlung, nach Anbieterabgleich; keine frei behaupteten Clientkäufe |
| `tutor_question_asked` | Neue akzeptierte Serverreservierung; keine Textdaten | Kontingent-/Schemarejektionen zählen nicht; wiederholte UUID bleibt einmal |
| `tutor_request_finished` | Server; endgültiger Status, Nano-USD, geschätzt ja/nein | Auch Abbruch/Teilantwort/Fehler mit tatsächlichem oder konservativ geschätztem Verbrauch |

Account-JWT, Einwilligungs-ID, Schema 1 und zufällige Anfrage-UUID gehören zum Transport. Konto-Zuordnung bleibt ausschließlich intern. Kein Seed, Antworttext, Prompt, Quelletext, E-Mail, Preis, Transaktionsschlüssel, Geräte-/Werbe-ID, URL oder frei erweiterbares Eigenschaftenobjekt. Serverzeit statt Client-Uhr; keine vorgetäuschte Genauigkeit bei Offline-Nutzung. Public Functions akzeptieren nur vier Clienttypen und tatsächliche Katalogquellen. Entwürfe ausschließlich beim vorhandenen expliziten lokalen Vorschauadapter.

## Einwilligung und Datenlebenszyklus

`/privacy` erläutert den konkreten Zweck in DE/US/UK und bietet die freiwillige Wahl nur angemeldeten Konten bei freigegebener Serverpolicy an. Die neue Zweckversion ist `analytics-supabase-v1`. Alte `privacy-v1`-Analytics-Grants reichen nicht. Push/Marketing bleiben getrennt. Lernen und Kauf erhalten keine Analytics-Pflicht.

Die App wartet auf bestätigten Consent, passenden Besitzer und Policy. Kein SQLite, Cookie, zusätzlicher Installationsschlüssel oder persistenter Analytics-Puffer. Ereignisse werden mit fünf Sekunden Timeout best effort gesendet. Bei Verbindungsfehlern kann ein neuer Vordergrundstart erneut versuchen; alte Lernhandlungen werden nicht nachgetragen. Das kann die Beobachtung unvollständig machen und ist keine zuverlässige Nutzungsabrechnung. Nachträgliche Einwilligung erzeugt keinen historischen Onboarding-Zähler.

Serverseitige Aufnahme prüft die aktuelle Einwilligung innerhalb desselben Kontolocks wie der Widerruf. Widerruf löscht Kohorte und alle Ereignisse nach Synchronisation. Alte Requests bleiben nach Re-Opt-in gesperrt. Fremde Konten können weder die eigene Einwilligung noch die eigene RLS-/Exportzuordnung übernehmen. Löschung des Kontos entfernt alle Analytics-Zeilen. Die zwölfmonatige Grenze stoppt weitere Aufnahme auch ohne ausgeführten Scheduler; `privacy-retention` entfernt abgelaufene Kohorten in Batches zu 100. Vor Aktivierung den bestehenden Retentionsjob samt Wiederholungen/Alarmierung real einrichten. Es gibt keine Analytics-Löschaufträge an zusätzliche Anbieter.

## Kennzahlen

Alle Tagesgrenzen sind UTC, Zeit ist serverseitiger Eingang. `--from` ist einschließlich, `--to` ausschließlich; höchstens 366 Tage. Heute bleibt als offener Tag aus Ereignis-Auswertungen ausgeschlossen. Kohorten enthalten im Zeitraum neu eingewilligte Konten. Ereigniszähler/Kosten enthalten Ereignisse aller aktuell einwilligenden Konten im Zeitraum; Lektionsquoten enthalten dort beobachtete Starts.

| Kennzahl | Zähler | Nenner / Zeitfenster |
|---|---|---|
| Aktivierung | Konten mit bestandener erster beobachteter Lektion in den ersten sieben UTC-Kalendertagen | Kohorten mit allen sieben abgeschlossenen Tagen seit Einwilligung |
| Bindung Tag 1/7/30 | Einwilligende Konten mit `app_active` am exakten Folgetag | Nur Kohorten, deren betreffender Tag bereits vollständig vergangen ist; keine kumulierte „irgendwann zurück“-Quote |
| Abschlussquote | Durchgänge mit kanonischem Abschluss derselben UUID, Lektion und Version bis zum Berichtsstand | Beobachtete Starts im Zeitraum, offene/abgebrochene Durchgänge eingeschlossen; bestanden separat |
| Premium-Umwandlung | Bestätigte bezahlte Erstkäufe/Trial-Umwandlungen in den ersten 30 UTC-Tagen | Kohorten mit vollständigem 30-Tage-Fenster und ohne bestehende bezahlte Berechtigung beim Einstieg; keine Sandbox/Trial-Starts/normalen Renewals |
| KI-Kosten | Summe endgültiger Nano-USD; Anfragen und geschätzte Kostenanzahl getrennt | Nur die einwilligende beobachtete Stichprobe im Zeitraum, einschließlich kostenpflichtiger Fehl-/Abbruchvorgänge; keine Gesamtanbieterrechnung |

Null im Nenner wird als „—“ dargestellt. Der Bericht nennt Stichprobenverzerrung und fehlende Gäste/Widerrufe. Keine Beta-Zielwerte erfunden. Keine Abrechnungs-, Umsatz- oder Repräsentativitätsbehauptung aus dieser Stichprobe.

## Privates Dashboard

Lokal mit laufendem Supabase und angewendeter Migration:

```sh
source /workspace/harmonia-env.sh # nur diese Cloud-Maschine
pnpm analytics:dashboard --local --from 2026-10-01 --to 2026-11-01 --output /workspace/harmonia-analytics.html
```

Der Bericht ist ein eigenständiges responsives HTML-Dashboard mit Kennzahlkarten, Lektionsquoten, Ereigniszahlen und aufklappbaren Definitionen. Es enthält ausschließlich Aggregate. Kein Service-Schlüssel und kein Betreiber-API-Endpunkt im App-Bundle. SQL-RPC `analytics_dashboard` ist service-only; Nutzer dürfen nur ihre eigenen Rohzeilen lesen/exportieren.

Ein späterer sicherer Betreiberprozess kann mit `--remote`, HTTPS-`HARMONIA_ANALYTICS_URL` und ausschließlich serverseitigem `HARMONIA_ANALYTICS_SERVICE_ROLE_KEY` arbeiten. Keine dieser Bindungen wurde gesetzt oder getestet. Niemals `EXPO_PUBLIC_` für den Service-Schlüssel verwenden. Werkzeug protokolliert keine Credentials/Serverantworten. Der vollständige Service-Schlüssel verlangt eine gesicherte Betreiberumgebung, keine Verteilung an App-Nutzer. Datei mit Modus 0600 erzeugt; bestehenden Dateirechten/externen Kopien muss der Betreiber gesondert Rechnung tragen. Bericht nach Widerruf/Löschung regenerieren und alte Kopien löschen. Nicht im öffentlichen App-Verzeichnis/CI-Artefakt veröffentlichen.

## Prüfung und Freigabe

- Schema-/App-Proben: erlaubte Felder, Default-off, Policy/Owner/Consent/Pending-Gate, Tagesdeduplizierung, sofortiger Abbruch, keine fremden verzögerten Starts.
- `pnpm db:test:analytics`: eigene lokale JWT-Konten, echter Engine-Abschluss, RLS, Export, private RPC, idempotente Aufnahme, synthetische Tutor-/Kaufbelege, exakte Kohorten/Nenner, HTML-Escaping, Widerruf-Race, neue Einwilligungs-ID, Retention und Kontolöschung. Eigene Fixtures werden entfernt, die geschlossene Policy wird im `finally` wiederhergestellt.
- P2.21-Exportproben umfassen die zwei neuen privaten Bereiche. Bestehende Billing-/Tutor-/SQL-Proben laufen ohne externe Anbieter.
- Vollständige Prüf- und Browser-/Build-Ergebnisse werden nach Abschluss hier ergänzt.

Noch offen: Betreiber/Rechtstexte/Storeangaben und Betriebsfreigabe aus P2.21; echte Beta-Einwilligungen und Daten; tatsächliche RevenueCat-/Anthropic-Abnahme und native Geräteabnahme. Keine Bereitstellung, Verträge, Datenerfassung, realen Käufe oder bezahlten Modellaufrufe durchgeführt.

## Integration

Phillip erlaubt am 15.10.2026 ausdrücklich, nach P2.22 die offenen Arbeitsbranches zusammenzuführen. Der geprüfte P2.22-Stand enthält die Kette P2.09–P2.21; frühere lokale Branches sind bereits Vorfahren. Normale Git-Integration ohne History-Rewrite; keine automatische Inhalts-/Rechtsfreigabe durch Merge. Der tatsächliche Integrationsstand wird nach Prüfung ergänzt.

### Technische Abnahme 15.10.2026

- Gesamtlauf `pnpm test`: 2.942 Tests grün (2.305 Pakete, 536 App, 101 Node-Werkzeugtests). Danach eine zusätzliche Regression gegen das Ableiten eines neuen Onboardings aus einem geladenen Gerätezustand; alle 19 betroffenen Analytics-/Onboarding-Proben grün. Insgesamt 2.943 unterschiedliche Fälle geprüft. Im großen Jest-Lauf erschien eine Worker-Exit-Warnung; die gezielte Analytics-/Onboarding-Ausführung mit `--detectOpenHandles` endete sauber ohne gemeldete offene Handles.
- TypeScript, ESLint/Paketgraph, Prettier, DE/US/UK-Übersetzungen, Inhalts-/Fähigkeitsgraph und vollständige Deno-/Tutor-/Billing-Smokes grün. `check:legal` meldet weiterhin 25 offene Belegfelder; `check:legal:release` scheitert deshalb erwartet.
- SQL-Lint und 310 pgTAP-Prüfungen grün; 76 Analytics-API-/DB-Prüfungen, 104 Datenschutz-, 81 Billing- und 146 Tutor-API-Prüfungen grün. Kanonischer Offline-Lernsync mit 226 Nachweisen, Motivation und 17 ersetzten Push-Job-Prüfungen ebenfalls grün. Keine Anbieteraufrufe/Käufe/echten Push-Nachrichten.
- Dashboard im echten Chromium auf Desktop und 375 px: 18 Prüfungen, synthetische Daten sichtbar beschriftet, Leerzustand, Nenner, aufklappbare Definitionen, kein horizontaler Seitenüberlauf und keine externen Requests.
- App-Browser: 16 Prüfungen in DE/US/UK auf schmalen Handys, Gast-/Kontodownload, geschlossenes Opt-in und keine Analytics-Requests. Zusätzlich elf Browserprüfungen mit eigener lokaler synthetischer Konto-/Policy-Fixture: echte Zweckversion beim Opt-in, genau ein App-Tag, vollständige Entfernung von Kohorte/Ereignissen nach Widerruf. Policy und eigene Fixtures anschließend zurückgesetzt/gelöscht.
- Web/iOS/Android-Exports wurden erstellt (Vorschau mit nativer Hermes-Bytecodeausgabe, öffentlicher Export zusätzlich als prüfbares JavaScript). Öffentlicher Bundle-Check kontrolliert sieben JS-Dateien auf ungeprüfte Katalog-IDs/Texte. Keine physische iOS-/Android-Abnahme oder echten Beta-Daten daraus ableiten.

Auch der abschließende öffentliche Build besteht alle 16 DE/US/UK-App-Browserprüfungen. Seine sieben tatsächlichen JS-Dateien enthalten weder den lokalen Service-Schlüssel noch die Betreiber-Schlüsselbindung. Weitere Integrationsproben: 48 Energie-/Kündigungs- und 244 Wissensbasis-/Tutor-API-Prüfungen, Inhaltsmeldungen, Auth/Profil-RLS und beide lokalen E-Mail-Code-Abläufe grün. Remote-GitHub-CI-Status ist über die vorhandenen Werkzeuge nicht auslesbar; die genannten Prüfungen sind lokal ausgeführt.

### Erfolgreiche Integration

Am 15.10.2026 wurde die gesamte offene Kette **P2.09–P2.22** nach `main` übernommen und der normale Push bestätigt. Implementierungsstand: `46fe9fabe37dbfbe94da149e4629d1c70ddbb068`. Alle vorhandenen lokalen und entfernten Branch-Spitzen waren bereits Vorfahren dieses getesteten Stands; frühere Arbeiten bis P2.08 waren schon in `main`. Daher war ein Fast-forward ohne Konfliktauflösung oder History-Rewrite möglich. Branch-Referenzen bleiben erhalten. Diese Übernahme veröffentlicht weder Entwurfsinhalte noch Analytics, Verkäufe oder Rechtstexte. GitHub-CI-Status bleibt hier nicht auslesbar; lokale Nachweise stehen oben. Nächster technischer Schritt: **P2.23 – Qualitäts-Durchgang**.
