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
- Recorder: tatsächlicher Gaststart, Lernpfad, Einführung, Intervallaufgabe und geöffneter Hinweis. Vier unveränderte PNGs je Sprache bei 1.320 × 2.868; je ein stummes Browser-Referenzvideo, als MP4/H.264 bei 1.080 × 1.920/30 fps kodiert. Aufnahmeprotokoll mit tatsächlicher Dauer, Dimensionen, Quelle und SHA-256. Das sind keine nativen Store-Aufnahmen und keine Behauptung, dass ein Store dieses Format für jedes Zielgerät akzeptiert.
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

Abschließende tatsächlich ausgeführte Prüfungen, Dateien und Git-Stand werden nach den finalen Läufen ergänzt. Zielbranch `codex/p2-24-store-website`; ausschließlich PR-Integration. Der vorherige Korrekturbranch `codex/pr-workflow-correction` bleibt separat. Zugriff auf die GitHub-API war zuletzt gesperrt (`Forbidden`); kein PR- oder CI-Erfolg darf daraus abgeleitet werden.
