# P2.24 – Store-Auftritt und Website

Stand 15.10.2026. Website und Store-Vorbereitung auf eigenem Arbeitsbranch. **Keine Veröffentlichung, keine Store-Einreichung und keine Freigabe durch Phillip.** [ADR 0024](../decisions/0024-statischer-storeauftritt.md).

## Website

- `/about/de.html`, `/about/en-us.html`, `/about/en-gb.html`: eigene Startseiten mit Marke, Web-App-Einstieg, Lernprinzip, Funktionen, FAQ und Links zu Recht/Impressum, Datenschutz, Datenschutzeinstellungen, Support und Kündigung.
- `/about/support-de.html`, `/about/support-en-us.html`, `/about/support-en-gb.html`: Supportablauf mit hilfreichen Angaben für eine Anfrage. Ohne tatsächliche Supportadresse kein erfundenes Mailziel; der fehlende Kontakt bleibt als Vorbereitung sichtbar.
- Figtree und das eigene Logo aus P0.07 lokal, Farben und Größen aus den UI-Tokens. Responsives Layout, Hell/Dunkel, reduzierte Bewegung, Tastatur und native FAQ-Elemente. Kein JavaScript für die Website erforderlich; keine Tracking-/Cookie-/Drittanbieterintegration.
- Die Web-App unter `/` wird beim Ergänzen nicht überschrieben. Rechts-/Kündigungsrouten bleiben dieselben. Die Website verwendet vorhandene geprüfte Impressums-/Datenschutz-URL-Bindungen; ungebunden führen die Links in den vorbereiteten Rechtsbereich `/legal`. `/privacy` bezeichnet ausdrücklich die Datenschutzeinstellungen der App.
- Titel, Beschreibung, Sprachattribute und Social-Metadaten je Seite; canonical/hreflang erst bei echter `publicOrigin`. Vorbereitung bleibt `noindex,nofollow`. Kein erfundener Host oder Store-Badge. Ein Webhost muss diese Dateien tatsächlich neben dem SPA-Fallback ausliefern; nicht jeden `/about/*.html`-Aufruf auf den App-Einstieg umschreiben.

## Store-Texte und Medien

`packages/i18n/src/storefront.json` enthält DE/US/UK, `website/readiness.json` die offenen Angaben und Freigaben.

- App Store: Name, Untertitel, Werbetext, Schlüsselwörter und Beschreibung. Google Play: Name, Kurz- und vollständige Beschreibung. Je Sprache außerdem vier eigene Screenshot-Titel/Beschreibungen.
- Geprüfte Arbeitsbudgets: Name/Untertitel 30 Zeichen, Werbetext 170, Kurzbeschreibung 80, Volltext 4.000; Schlüsselwörter konservativ höchstens 100 UTF-8-Byte. Anforderungen und Zielgeräte müssen vor Upload gegen die aktuelle Store-Konsole geprüft werden.
- Keine unbelegten Behauptungen zu achtstimmigen Stücken, Orchesterklängen, Live-Tutor, Preisen oder bereits veröffentlichten Katalogmengen. Die beschriebenen Lernfunktionen sind implementiert; die bisherigen fachlichen Inhaltsfreigaben bleiben ausstehend.
- Recorder: tatsächlicher Gaststart, Lernpfad, Einführung, Übungsaufgabe und geöffneter Hinweis. Vier unveränderte PNGs je Sprache bei 1.320 × 2.868; je ein stummes Browser-Referenzvideo, als MP4/H.264 bei 1.080 × 1.920/30 fps kodiert. Aufnahmeprotokoll mit tatsächlicher Dauer, Dimensionen, Quelle und SHA-256. Das sind keine nativen Store-Aufnahmen und keine Behauptung, dass ein Store dieses Format für jedes Zielgerät akzeptiert.
- Referenzaufnahmen enthalten Vorschau-/Entwurfsinhalte. Sie gehören ausschließlich ins private Prüfpaket. Kein Kopieren dieser Bilder/Videos in den öffentlichen Export; echte native und fachlich freigegebene Store-Aufnahmen bleiben erforderlich.

## Reproduzierbar arbeiten

```sh
source /workspace/harmonia-env.sh # nur diese Cloud-Maschine
pnpm check:storefront
pnpm qa:build --output artifacts/quality/p224-preview
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium HARMONIA_QA_DIR="$PWD/artifacts/quality/p224-preview" pnpm qa:web
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium HARMONIA_QA_PORT=8245 pnpm store:capture --app-dir artifacts/quality/p224-preview
pnpm store:prepare --media artifacts/quality/store-captures/manifest.json
pnpm qa:build --production --output artifacts/quality/p224-public
pnpm check:content:bundle artifacts/quality/p224-public
pnpm qa:bundle artifacts/quality/p224-public
```

Ein normaler vorhandener Expo-Export erhält die Website über `pnpm website:build --output PFAD_ZUM_EXPORT`. `qa:build` erledigt das automatisch und schreibt zusätzlich die ausschließlich für QA verwendete Gast-Fixture-Markierung. Der Recorder verlangt diese Markierung mit `variant: preview`; fehlende Markierung, Produktions-Fixture oder ein separat vorgegebener Server werden abgewiesen. Benötigt: installierte Node-/pnpm-Abhängigkeiten, Chromium, ffmpeg und ffprobe. Die Videoaufzeichnung nutzt tatsächliche Chromium-CDP-Frames mit deren Zeitstempeln und den installierten Encoder; kein separater Playwright-Encoderdownload ist erforderlich. Außerhalb dieser Cloud Chromium für die gepinnte Playwright-Version installieren und den ausführbaren Pfad weglassen. Die Aufnahmeabläufe müssen nacheinander laufen; für weitere QA-Prozesse eigene Ports/Ausgabeordner wählen.

`store:prepare` erstellt Textdateien für beide Anbieter, Screenshot-Beschriftungen, ein Manifest und `review.html` als private Text-/Bild-/Videogalerie. Mit `--media` kopiert es nur aufgelistete Dateien nach überprüfter Prüfsumme; Pfadtraversierung und aus dem Paket führende Symlinks werden abgewiesen. `approvedForUpload` bleibt false. Nicht aufgelistete Altdateien sind kein Teil des Pakets; für eine Übergabe einen frischen Ausgabeordner über `--output artifacts/quality/NAME` verwenden.

## Noch benötigte Freigaben

1. Name/Marke, öffentliche Domain, endgültige Bundle-IDs sowie Store-Symbole aus P0.03/F16 bestätigen.
2. Tatsächliche Supportadresse und Betreiberangaben ergänzen. Rechtstexte juristisch prüfen und ihre öffentlichen URLs binden; vorherige Rechts-/Anbieterfreigaben aus P2.21 erledigen.
3. Inhalte durch Claude fachlich freigeben; reale native Store-Screenshots/-Videos und die aktuelle Store-Konsole prüfen. Den Web-Referenzmitschnitt nicht als native Abnahme umdeklarieren.
4. Vier tatsächliche Geräte-/Akustik-/Storeprüfungen aus P2.23 durchführen. Store-Datenschutz, Altersangaben und Zielgruppen aus P2.21 gegen die reale Veröffentlichung prüfen.
5. Finalen Website-/Store-Auftritt durch Phillip abnehmen und Belegreferenzen in `website/readiness.json` ergänzen. Erst anschließend Veröffentlichung/Einreichung in einem eigenen Schritt.

`pnpm check:storefront:release` und `pnpm website:build --release` scheitern derzeit erwartet. Die Store-Prüfung verlangt zusätzlich veröffentlichte Lektionen, native, manuell geprüfte Screenshots für iOS und Android pro Sprache, iOS-Vorschauvideos und die vier tatsächlichen Gerätebelege. iPad-/Android-Tablet-Ziele, Store-Symbole, Google-Play-Funktionsgrafik und die Einbindung eines Google-Play-Videos sind in der aktuellen Store-Konsole gesondert zu prüfen; ein MP4 allein ersetzt dort keine erforderliche Video-URL. Felder im Manifest sind keine Prüfung ihrer Echtheit. Es wurden keine Domains registriert, DNS-Werte geändert, Anbieter angeschrieben oder öffentliche Deployments ausgeführt.

## Nachweise und Git-Übergabe

Tatsächlich am 15.10.2026 lokal ausgeführt:

- **15 Werkzeugtests** bestanden: neun Store-/Websitefälle sowie sechs bestehende QA-/Serverfälle. Vollständige Typprüfung, ESLint, Formatierung, Übersetzungs-, Inhalts-, Curriculum- und Paketgraphprüfung grün; nach den letzten Anpassungen nochmals betroffene Werkzeuge, Server und E2E-Dateien mit ESLint sowie Formatierung und Werkzeugtests geprüft. Der App-Quellcode ist unverändert; der tatsächliche Vorschau-Web-Entry ist bytegleich zum geprüften P2.23-Export. Die App-Jest-Suite wurde für die Website-/Werkzeugänderungen nicht erneut ausgeführt.
- **13 Vorschau-Browserabläufe** einschließlich der bestehenden Lektions-/Persistenz-/Tastaturregression und **acht Produktions-Browserabläufe** für Website, Support, Einstieg und öffentliche Rechtsbereiche bestanden. Axe in allen aufgerufenen Prüfungen ohne Befund. Ohne JavaScript und bei 320 px/200-%-Textstress geprüft; keine vollständige manuelle WCAG-Erklärung.
- Die Netzprüfung der statischen Website endet beim Wechsel in die App. Dort darf die bestehende öffentliche Zugriffspolicy-API geladen werden. Statische Start-/Supportseiten laden ausschließlich eigene Ressourcen und enthalten kein JavaScript.
- Lokale Chromium-Probe (fünf Messungen): Start-P95 **1.405,420 ms**, Lektionsöffnung-P95 **237,738 ms**. Kein physisches Gerät oder hörbarer Latenznachweis.
- **Drei Medienabläufe** bestanden: zwölf unveränderte PNGs bei **1.320 × 2.868**, drei stumme MP4/H.264-Dateien bei **1.080 × 1.920 / 30 fps**, jeweils **22,033333 s** tatsächliche kodierte Dauer. Direkte Chromium-CDP-Frames mit Zeitstempeln, jeweils etwa 22,02 s tatsächliche Aufnahmezeit. Ein zusätzlich benötigter Playwright-Encoder konnte wegen der Domainfreigabe nicht geladen werden; der geprüfte Recorder verwendet den vorhandenen lokalen ffmpeg und benötigt diesen Download nicht.
- Private Galerie tatsächlich im Browser geprüft: alle zwölf PNGs dekodieren, alle drei Videos spielen, korrekter MP4-MIME-Typ, keine Seitenfehler. Alle **44 im Paket aufgelisteten Dateien** anhand ihrer SHA-256-Werte geprüft; ZIP mit zusätzlich dem Manifest, insgesamt **45 Dateien / 4.295.894 Byte**.
- Produktions-Export: fünf JavaScript-Dateien ohne unveröffentlichte Katalog-IDs oder Inhaltstexte; weiterhin null freigegebene Kataloglektionen. Web-JavaScript **5.375.274 Byte roh / 1.279.172 Byte Gzip-Potenzial**, Audio **686.098 Byte**. Die statische Website umfasst **12 Dateien / 165.766 Byte** (sechs HTML, CSS, drei lokale Schriften, Logo und OFL). Keine Store-Referenzbilder oder -videos im öffentlichen Export.
- Store- und Website-Veröffentlichungsprüfung scheitern wie vorgesehen an den fehlenden Freigaben. Das Medienpaket bleibt `web-preview-reference`, `physicalDeviceEvidence: false`, `reviewed: false` und `approvedForUpload: false`. Kein nativer Geräte-/Storetest durchgeführt.

Lokale, ignorierte Belege:

- Vorschau-Webexport: `/workspace/p224-preview`; Produktions-Prüfexport: `/workspace/p224-public`.
- Browsernachweise: `artifacts/quality/p224-preview-accepted` und `artifacts/quality/p224-public-final`.
- Finale Medien samt Aufnahmeprotokollen: `artifacts/quality/p224-store-captures-final` (Aufnahmequelle `3c9c5de75a72472d2e657e924b54d50e444caa6c`, sauberer Git-Stand).
- Prüfpaket: `artifacts/quality/p224-store-package/review.html`, dazu `manifest.json`; Dateierzeugung aus `c53c5e5f73a978d13e423e4f937427ea313cca1f`, sauberer Git-Stand, Aufnahmequelle separat erhalten.
- Downloadpaket: `artifacts/quality/p224-store-package.zip`; entpacken und `harmonia-store-review/review.html` öffnen. Nur die im Manifest aufgeführten Text-/Medien-/Galeriedateien und das Manifest enthalten; keine Rohframes oder Testjournale.

Arbeitsbranch `codex/p2-24-store-website`, ausgehend von `main` bei `ed0aa558a66d3c8d2676d2b25cd3a548ef633fbb`. Kein direkter Push oder Merge nach `main`. PR-Beschreibung lokal unter `/workspace/p224-pr-body.md` vorbereitet; der vorherige Korrekturbranch bleibt separat. GitHub-API-Zugriff war zuletzt gesperrt (`Forbidden`); ein Pull Request wurde hier nicht erstellt und ein grüner Remote-CI-Status nicht behauptet. Claude kann den Arbeitsbranch übernehmen, den PR anlegen und nach erfolgreicher erforderlicher CI und den vorgesehenen Reviews integrieren.

Die technische Vorbereitung ist prüfbar. P2.24 insgesamt bleibt bis zu den oben genannten tatsächlichen Angaben, nativen Store-Medien und Phillips Freigabe offen.
