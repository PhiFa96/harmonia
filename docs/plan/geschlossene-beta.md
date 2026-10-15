# P2.25 – Geschlossene Beta

Stand 15.10.2026: **technisch vorbereitet, noch keine echte Beta gestartet**. Null Testpersonen rekrutiert oder eingeladen; keine TestFlight-/Play-Verteilung, kein externer Web-Host. Auf eigenem Branch `codex/p2-25-closed-beta`, aufbauend auf dem noch ungemergten P2.24-Branch. Claude Code bleibt Hauptprogrammierer. Integration ausschließlich über PR, erfolgreiche erforderliche CI und Reviews; `main` bleibt unverändert. [ADR 0025](../decisions/0025-geschlossene-beta.md).

## Was umgesetzt ist

- EAS-Profil `beta`: Store-Build, eigener Kanal, Produktionskatalog, Node 22.23.3. `eas-build-post-install` prüft die Voraussetzungen vor nativer Kompilierung. Expo-Konfiguration weist die Kombination Beta-Profil/Entwurfskatalog zurück. Bestehende Entwicklungs-/Vorschauprofile bleiben für interne Arbeit verfügbar.
- `check:beta` validiert die Vorbereitung und benennt offene Felder je Plattform. `check:beta:start --platform ios|android|web` muss ohne tatsächliche Startbelege scheitern. Wiederverwendet die bestehenden Rechts-, Website- und Vier-Geräte-Prüfungen; mindestens eine freigegebene Lektion ist zwingend. Öffentliche HTTPS-Auth-/Rechtstextbindungen, bei nativen Builds auch EAS-Projektbindung, sind erforderlich. `bindings.supabaseOrigin` und `bindings.easProjectId` im Beta-Manifest müssen mit den tatsächlichen Projektbindungen übereinstimmen; gültige Zugangsdaten eines anderen Projekts reichen nicht.
- `tools/beta/readiness.json`: Zuständigkeit, Feedbackkontakt, Teilnehmerhinweise, Feedback-Datenschutz/Aufbewahrung, Auth/SMTP, Anbieter-Sandbox/Tutor, Datenschutzbetrieb, Support-/Wochentakt, Rollback und getrennte Kanalbelege. Alles zunächst offen. Referenzen enthalten keine Zugangsdaten. Die Kanalbelege bestätigen eingerichtete und geprüfte Testverteilung, keine Behauptung eines bereits veröffentlichten Kandidaten.
- Separater Web-Kandidatenbau: sauberes Checkout, Produktion statt QA-Vorschau, öffentlicher Inhaltscheck, Größenbudgets, Guides sowie SHA-256 für alle Dateien und den Inhaltsstand. Der Gateway prüft Commit, Katalogstand und Dateimenge/-hashes beim Start. Er liefert nur die gelisteten Dateien aus; private Reports und Zugangsdateien gehören nicht in einen Kandidaten. Keine Symlinks in Kandidaten.
- Web-Gateway mit persönlichem, ablaufendem und widerrufbarem Zugang vor allen Dateien/Deep Links. Nur auf Loopback; `no-store`, `noindex`, keine Request-/Zugangsprotokollierung. Ein Widerruf wirkt auf folgende Requests, auch bei im Browser gespeicherten Basic-Zugangsdaten. Bereits heruntergeladene App-Daten lassen sich damit nicht zurückholen; eine laufende lokale Lektion ist kein weiterer Server-Request.
- Statische Testhinweise und Feedbackvorlagen DE/US/UK, Tastatur-/No-JavaScript-Nutzung und große Schrift, vorhandene Design-Tokens. Sie erklären Gastmeldungen, freiwillige Analytics sowie ausschließlich ausdrücklich eingerichtete Store-Testkäufe. Kein kostenpflichtiges Abo durch Beta-Zugang, kein automatisch gestarteter Kauf oder Mailversand.
- Privates, streng begrenztes Journal und Wochenbericht als HTML/JSON. Keine Konto-IDs, E-Mails oder Originalgespräche als Journalfelder. Unbekannte Felder, ungültige Zeiten, doppelte Pseudonyme und lose Verweise werden zurückgewiesen. Freitext vor Eintragung redigieren; Schema-Prüfung erkennt personenbezogene Inhalte im Freitext nicht.

## Tatsächliche Startvoraussetzungen

1. Claude gibt den fachlich geprüften Umfang frei und erzeugt den öffentlichen Snapshot. **Derzeit weiterhin null öffentliche Lektionen**. Interne Vorschau und Maestro-Fixtures sind keine extern verteilbare Beta.
2. Offene Freigaben aus P2.19–P2.24 tatsächlich abschließen: Betreiber/Rechtstexte/Support/Domain, Anbieter-/Auth-/SMTP-Betrieb, Datenschutz-Export/-Löschung/Retention, Store-Sandbox und Tutor-Abnahme, vier echte Geräte-/Akustik-/Bedienhilfenbelege. Die vorhandenen Gates bleiben erhalten. Analytics bleibt bis eigener rechtlicher/Betriebsfreigabe aus; Beta-Teilnahme verlangt keine Analytics-Einwilligung.
3. App-/Bundle-IDs und EAS-Projekt final zuordnen. Die freigegebene kanonische Supabase-Origin und EAS-Projekt-UUID in `tools/beta/readiness.json` unter `bindings` festhalten. Im EAS-Environment `preview` ausschließlich diese geprüften Beta-Projektbindungen hinterlegen; keine Service-Schlüssel als `EXPO_PUBLIC_`. RevenueCat-/Tutor-Betrieb und Sandbox-/Produktionsumgebung tatsächlich abstimmen. Der Kanalname alleine trennt keine Datenbank und keinen Anbieterzugang.
4. Verantwortlichen, erreichbaren Feedbackkontakt, wöchentliche Triage, Rückroll-/Notfallablauf sowie getrennte TestFlight-, Play- und Web-Zugangsprüfung festhalten. Ein ausgefülltes Belegfeld ist keine automatische Inhalts-, Rechts- oder Betriebsfreigabe.

Die Prüfungen kennen keine versteckten Test-/Bypass-Schalter. Aktuell scheitern Start, Beta-Webexport und Beta-Gateway absichtlich. Native EAS-/Store-Aktionen bleiben unausgeführt.

## Native Verteilung nach tatsächlicher Freigabe

Benötigt eingerichtete Apple-/Google-Entwicklerkonten, geprüfte Bundle-IDs, EAS-CLI/-Projekt und Signierung. Keine Zugangsdaten in Git oder Chat. Die folgenden Schritte sind eine spätere Betriebsanleitung, keine bereits ausgeführten Aktionen:

```sh
APP_VARIANT=production pnpm check:beta:start --platform ios
APP_VARIANT=production pnpm check:beta:start --platform android
cd apps/mobile
eas build --profile beta --platform ios
eas build --profile beta --platform android
```

Nur den tatsächlich geprüften EAS-Build anschließend separat auswählen und einreichen. Kein `--auto-submit`. `submit.beta.android` ist auf `internal` und `draft` beschränkt; Closed Testing und Teilnehmergruppen werden im Play Console nach Prüfung eingerichtet. Auf iOS zunächst die tatsächlichen TestFlight-Gruppen und erforderliche Beta-App-Prüfung durchlaufen. Tester nicht zu App-Store-Connect-Administratoren machen. Aktuelle Apple-/Google-Anforderungen beim echten Start prüfen und belegen; keine dauerhaften Plattformregeln aus dieser Anleitung ableiten.

Kanal `beta` und Produktionskatalog gelten auch für Updates. OTA-Veröffentlichung ist ein eigener Release-Vorgang; keine ungeprüfte Vorschau an den Beta-Kanal senden. Rollback auf einem echten Testgerät samt Backend-/Schema-Kompatibilität proben und referenzieren. Die hier vorhandenen Exporte ersetzen keinen installierten EAS-/TestFlight-/Play-Build.

## Geschützte Web-Beta nach tatsächlicher Freigabe

Der Kandidat wird direkt mit den vorhandenen geprüften Betreiberbindungen gebaut. `qa:build` isoliert diese absichtlich und ist deshalb kein Beta-Bauwerkzeug.

```sh
APP_VARIANT=production pnpm beta:build:web --output artifacts/beta/candidates/web-001
mkdir -p artifacts/beta/private
chmod 700 artifacts/beta/private
pnpm beta:access add --file artifacts/beta/private/access.json --expires 2026-11-01T00:00:00.000Z
```

Das Ablaufdatum bei echter Ausführung neu wählen: zukünftig und höchstens 90 Tage entfernt. Der Befehl schreibt eine persönliche Handout-Datei mit Modus 0600, nennt nur deren Pfad und sendet nichts. Die Prüfliste enthält nur Hashes; sie ist ebenfalls 0600. Einmalige Handouts getrennt vertraulich übergeben und nach Übergabe löschen, sofern nicht mehr nötig. Keine gemeinsamen Zugänge, Zugangscodes in URLs oder Zugangsdaten in Logs. Rekrutierung, Kontaktliste und Einladungsversand sind ein gesonderter Betreiberprozess.

```sh
APP_VARIANT=production \
HARMONIA_BETA_DIR=artifacts/beta/candidates/web-001 \
HARMONIA_BETA_ACCESS_FILE=artifacts/beta/private/access.json \
pnpm beta:serve:web

pnpm beta:access revoke --file artifacts/beta/private/access.json --id bt-0123456789abcdef
```

Das Widerrufsbeispiel erfordert die tatsächlich ausgegebene ID. Zugangsänderungen nacheinander als Betreiber ausführen. Handout-/Zugangsliste niemals in den Web-Ordner legen. Der Gateway startet nur mit passendem, unverändertem Produktionsmanifest. Ein neuer Commit/Inhaltsstand erfordert einen neuen Kandidaten und neuen Start, statt den laufenden Export zu überschreiben.

Für externe Verwendung einen HTTPS-Reverse-Proxy auf diesen Loopback-Dienst konfigurieren. **Jeden Pfad**, auch JS/CSS/WASM/Fonts/Medien, Vorlagen und unbekannte Deep Links, ausschließlich zum Gateway weiterleiten. Keinen öffentlichen `root`, `alias`, CDN-/Proxy-Cache oder ungeprüften zweiten App-Endpunkt daneben betreiben. `Authorization` unverändert weiterreichen und nicht protokollieren. HTTPS einschließlich HTTP-Weiterleitung, vorgelagerte Begrenzung fehlgeschlagener Zugriffe, COOP/COEP, fehlenden/widerrufenen/abgelaufenen Zugang und direkten Assetabruf von außen prüfen. Diese externen Proxy-/TLS-Prüfungen sind hier noch nicht durchgeführt. Alternativ kann der spätere Host einen vollständig serverseitigen Identitätszugang vor alle Pfade setzen; dessen tatsächliche Konfiguration ist ebenfalls abzunehmen.

Guides: `/beta/de-DE.html`, `/beta/en-US.html`, `/beta/en-GB.html`. Haupt-App bleibt `/`; die App-Anmeldung erfolgt zusätzlich nach Wunsch innerhalb der App. Geschützter Web-Zugang ersetzt keine Supabase-RLS oder serverseitige Berechtigungsprüfung.

## Rekrutierung, Feedback und Wochentakt

Ziel sind **30–100 unterschiedliche tatsächlich testende Menschen**, mit Einsteigern, Chor-/Ensembleperspektive, Instrumentalperspektive und Studierenden, über iOS, Android und Web. Mehrere Geräte desselben Menschen zählen einmal; `platforms` darf mehrere tatsächlich getestete Plattformen enthalten. Eine Einladung oder ausgestellte Web-Zugangskarte ist kein Nutzungsbeleg. Kein Teilnehmer und kein Alter wird erfunden; Einbezug Minderjähriger setzt die tatsächliche gesonderte Alters-/Teilnahmeprüfung voraus.

Den leeren Vertrag in einen privaten Arbeitsordner kopieren:

```sh
mkdir -p artifacts/beta/private
chmod 700 artifacts/beta/private
cp tools/beta/study.example.json artifacts/beta/private/study.json
chmod 600 artifacts/beta/private/study.json
```

`dataKind=real` beginnt mit **leeren** Listen und ohne Startdatum. Für Übungs-/Demodaten ausdrücklich `synthetic` verwenden. Teilnehmer nur mit zufälligem `bt-`-Pseudonym (16 Hex-Zeichen), Zielgruppe, getesteten Plattformen, Sprache und tatsächlich bestätigter erster Nutzung (`firstUsedAt`, sonst `null`) eintragen. Reale Identitäten nicht in dieses Journal übernehmen. Mobile-only-Tester benötigen keinen unnötigen Web-Zugang; ihr Pseudonym kann unabhängig zufällig erzeugt werden. Das Journal wird nicht an Supabase oder einen externen Dienst gesendet.

| Bereich | Vertrag |
| --- | --- |
| Kampagne | `campaignId`, `startedOn`, `endedOn` als UTC-Kalendertage; Ende exklusiv |
| Teilnehmer | `id`, `group` (`beginner`, `choir`, `instrumental`, `student`), `platforms`, `locale`, `firstUsedAt` |
| Rückmeldung | `id` (`FB-0001` usw.), `participantId` oder `null`, `receivedAt`, `source` (`general`, `content`, `tutor`), redigierte `summary`, `issueId` oder zunächst `null` |
| Arbeitspaket | `id` (`BETA-0001` usw.), `severity` (`critical`, `high`, `medium`, `low`), `status` (`new`, `planned`, `fixed`, `dismissed`), `summary`, `owner`, `trackingReference`, `createdAt`, `triagedAt`, `fixCommit`, `verificationReference`, `verifiedAt`, `resolutionReference`; offene Werte explizit `null` |
| Wochenreview | `from`, `toExclusive` (1–7 abgeschlossene UTC-Tage), `reviewedAt`, `reviewer`, `summary` |

Allgemeines Feedback geht nach Einrichtung an `feedbackEmail`; Vorlage fragt Reproduktion, Erwartung/Ergebnis und Build/Plattform ab. Aufgaben-/Tutor-Meldungen behalten ihre gespeicherten Kontexte im bestehenden privaten System. Betreiber prüft die tatsächlichen Eingänge und übernimmt nur redigierte Zusammenfassungen/Referenzen ins Journal. Gleicher Fehler aus mehreren Meldungen: mehrere `feedback`-Einträge, dasselbe `issueId`. Unbekannte Quelle/fehlende Zuordnung nicht als erledigt zählen.

Wöchentlich offene Meldungen prüfen, Fehler reproduzieren, Priorität/Verantwortlichen und tatsächliches Issue/PR zuordnen. `planned` verlangt Zuständigkeit und Nachverfolgung. `fixed` verlangt vollständigen Commit, datierten Prüfbeleg und wiederholte Regression; `dismissed` eine begründete Prüfung, bei kritischen Meldungen zusätzlich einen datierten Nachweis. Kritische offene Fehler stoppen die Beta-Abnahme. Bestehende PR-/CI-Regel gilt für jede Fehlerkorrektur.

```sh
pnpm beta:report --study artifacts/beta/private/study.json \
  --from 2026-10-01 --to 2026-10-08 \
  --output artifacts/beta/reports/week-001
```

Datumsbereich beim tatsächlichen Einsatz anpassen. Heute und spätere Tage bleiben ausgeschlossen. Bericht zählt bis zum Periodenende bestätigte erste Nutzungen sowie Wochenmeldungen und deduplizierte Arbeitspakete; er bezeichnet deren **aktuellen** Status bei Erstellung. Kein erfundener historischer Wochenstatus, kein täglicher Aktivitäts-/Retentionwert aus diesem Journal. Ein abschließender Teilzeitraum darf kürzer als sieben Tage sein. Ein Review wird erst nach wirklicher Auswertung eingetragen, nicht automatisch durch Reporterzeugung. Maximal 100 Teilnehmer; lokale Eingaben sind auf 2 MiB begrenzt.

Berichte/Journal sind privat, keine App- oder CI-Artefakte. Vorübergehende Kontakte, Zuordnungen, Originalmeldungen, Berichtigungen, Löschungen und Aufbewahrung im getrennten freizugebenden Feedbackprozess behandeln. Keine neue pauschale Aufbewahrungsentscheidung aus F17 ableiten. Nach Berichtigung/Löschung Bericht neu erzeugen und alte Kopien entfernen.

## Zielwerte und Ende der Beta

Für echte Kennzahlen das bestehende private Supabase-Dashboard aus P2.22 verwenden; nur die dort gültigen einwilligenden Kohorten und abgeschlossenen Beobachtungsfenster. Journalpersonen sind kein Analytics-Nenner. Bei ausgeschalteter Erfassung, Widerruf oder leerem/unreifem Nenner keine Aktivierungs-/Bindungs-/Umwandlungsquote behaupten.

`metricReview` bleibt zunächst `null`. Erst nach Beta und tatsächlicher Baseline ausfüllen: `reviewedAt`, `reviewer`, `baselineReference`, Phillips `approvalReference` und `targets`. Je Ziel: `metric`, `target`, `baselineNumerator`, `baselineDenominator`, `denominator`, `window`, `rationale`. Metriken sind `activation`, `retentionD1`, `retentionD7`, `retentionD30`, `lessonCompletion`, `premiumConversion` in Prozent sowie `aiCostPerRequest` in USD/Anfrage. Mindestens ein beobachteter Nenner, genaue Stichprobe/Fenster und Begründung sind erforderlich; Sandbox-Käufe und simulierte KI-Kosten sind keine Produktionsbaseline. Die Prüfung setzt keine Zielhöhe selbst fest und ersetzt keine fachliche Beurteilung der Stichprobe. Bei fehlender Basis bleibt dieser Teil offen.

```sh
pnpm beta:report --study artifacts/beta/private/study.json --finish
```

Diese Prüfung betrachtet ausschließlich das Journal. Sie verlangt echte statt synthetischer Kennzeichnung, 30–100 bestätigte Tester, Gruppen-/Plattformabdeckung, eingeplante Meldungen, keine offenen kritischen Fehler, vollständige Wochenreview-Abdeckung und Review der neuesten Meldungen/Triage-/Prüfbelege sowie Zielwerte nach der Beta. Belegfelder beweisen ihre Echtheit nicht. Unabhängig davon bleiben reale Start-/Geräte-/Anbieter-/Rechtsbelege und eine Launch-Freigabe erforderlich. **Kein automatischer Übergang zu P2.26.**

## Prüfung und Übergabe

Die technische Vorbereitung wird mit Werkzeugtests, tatsächlichem lokalem Chromium, axe, bestehenden App-Kernabläufen, Typen und Lint geprüft. Nur eigene temporäre Fixtures mit synthetischen Zugängen/Daten werden in Tests erzeugt. Der echte Beta-Export und Gateway bleiben bei den aktuell offenen Voraussetzungen blockiert; es gibt keinen Bypass-Schalter im Betriebsbefehl. Tatsächliche Tester, Wochenreviews, Zielwerte, native EAS-/Store-/Geräte-/Proxy- und Anbieterabnahmen bleiben unausgeführt.

Tatsächlich lokal ausgeführt am 15.10.2026:

- Vollständiger `pnpm test`-Lauf: **2.974 Tests bestanden** (2.305 Pakete, 539 App, 101 bisherige Werkzeugtests, 29 QA-/Storefront-/Beta-Tests). Die zunächst 14 Beta-Werkzeugtests prüfen unter anderem echte lokale HTTP-Anfragen, Widerruf/Ablauf, 0600-Prüfung, fehlende/ungültige Zugangslisten, direkten Dateizugriff, Symlinks, nachträglich hinzugefügte Dateien, Kandidatenänderungen, Journalreferenzen, offene kritische Fehler und leere Kennzahlen-Nenner. Nach Ergänzung des Projektabgleichs **15 Beta-Werkzeugtests** erneut bestanden, darunter die zusätzliche Prüfung gegen gültige Bindungen eines falschen Supabase-/EAS-Projekts; insgesamt 2.975 unterschiedliche Testfälle geprüft.
- **Fünf neue tatsächliche Chromium-Abläufe** bestanden: DE/US/UK-Guide, lokale Schrift-/Dateiauslieferung hinter Basic-Zugang, Feedbackvorlagen-Download, Tastatur, ohne JavaScript, 320 px, verdoppelte Textgrößen sowie leerer privater Wochenbericht. Alle aufgerufenen axe-Audits ohne Befund, keine externen Guide-Requests oder Seitenfehler. Nur eigene temporäre synthetische Zugänge und Daten, keine echte Beta.
- **Alle 13 bestehenden Web-Kernabläufe** mit dem angepassten gemeinsamen Server am unveränderten P2.24-Vorschau-Bundle bestanden. App-Quellcode und Lerninhalte sind unverändert; der Expo-Konfigurationsschutz betrifft das neue EAS-Betaprofil. Lokaler Chromium-Start-P95 1.411,76 ms, Lektionsöffnung-P95 299,87 ms; keine physische Geräte- oder hörbare Latenzmessung.
- Vollständige Typprüfung, ESLint/Paketgraph, Formatierung, Übersetzungen, Inhalts- und Curriculum-Prüfung bestanden. Nach letzten Werkzeugergänzungen die betroffenen Dateien erneut mit ESLint geprüft. Keine neue Abhängigkeit, kein Datenbank-/Remote-Dateneingriff.
- Vorbereitungsprüfung besteht und benennt offene Belege. `check:beta:start --platform web`, echter Beta-Webexport/-Gateway, nativer Beta-Hook und Journal-Abschluss scheitern wie vorgesehen ohne die Voraussetzungen. Fehlgeschlagene Startversuche erzeugen keinen Beta-Kandidaten und starten keinen Gateway. EAS-CLI/-Store-Build, vier echte Geräte, externer HTTPS-Proxy und tatsächliche Anbieteraufrufe bleiben unausgeführt.
- Leeres echtes Journal ohne Startdatum und privater Wochenbericht tatsächlich angelegt: `artifacts/beta/private/study-unstarted.json`, `artifacts/beta/reports/unstarted-review/index.html`; **null Teilnehmer und Meldungen**, „Beta noch nicht gestartet“. Keine Einladungen, Nachrichten, Käufe oder Datenerfassung ausgelöst.

Ignorierte lokale Browserbelege: `artifacts/quality/p225-beta-accepted` und `artifacts/quality/p225-app-regression`. Synthetische Browser-Fixtures werden nach den Tests entfernt; sie sind kein Kandidat. Remote-GitHub-CI ist über die hier verfügbaren Werkzeuge nicht einsehbar. Die PR-Erstellung und der tatsächliche Branch-Stand werden unten separat festgehalten.

## Git-Übergabe

Implementierung `57da87f` am 15.10.2026 auf **`codex/p2-25-closed-beta` gepusht**, aufbauend auf P2.24 `e0d9a9f`. P2.24 bleibt ein eigener ungemergter Branch. Für getrennte Prüfung den P2.25-PR zunächst gegen `codex/p2-24-store-website` richten und nach dessen geprüftem Merge die Basis auf `main` umstellen. Kein direkter Push/Merge nach `main`, keine Branchlöschung und keine Änderung am separaten PR-Workflow-Korrekturbranch.

Tatsächlicher `gh pr create`-Versuch mit vorbereitetem Titel und Body scheitert mit `Post "https://api.github.com/graphql": Forbidden`. **Kein PR erstellt, keine erfolgreiche Remote-CI oder Review behauptet.** Die vollständige PR-Beschreibung liegt lokal unter `/workspace/p225-pr-body.md`; Git-Zugriff und Feature-Push funktionieren, GitHub-API-Zugriff dagegen nicht. PR-/CI-/Review-Weg vor jeder Integration abschließen; dieser technische Stand ist keine Beta- oder Launch-Freigabe.
