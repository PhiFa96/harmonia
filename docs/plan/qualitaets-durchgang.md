# P2.23 – Qualitäts-Durchgang

Stand 15.10.2026. Automatische Web-, Komponenten- und Größenprüfung technisch umgesetzt. **Die vollständige Definition of Done bleibt bis zur tatsächlichen Abnahme auf mindestens vier Geräten offen.** [ADR 0023](../decisions/0023-wiederholbare-qualitaetspruefung.md).

## Behobene Befunde

- Die Web-App besaß keinen Hauptbereich als Landmark. Der gemeinsame Rahmen liefert nun genau einen Hauptbereich einschließlich öffentlicher Seiten.
- Der rechtliche Seitenfuß lag im dunklen Modus auf einem hellen Hintergrund. Der App-Rahmen verwendet die passende Hintergrundrolle aus den Tokens.
- Der von React Native Web tatsächlich erzeugte Dialog war unbenannt. Das Modal erhält den übersetzten Titel; eine zweite konkurrierende Dialogrolle wird vermieden. Die Abdunkelung ist kein Tastaturziel.
- Sprach-/Darstellungsauswahl hatte keine Radio-Pfeiltastensteuerung. Die Listener hängen an den tatsächlich im sichtbaren Modal montierten Feldern; ein lediglich vorgemerkter, noch nicht montierter Ref reicht nicht. Roving-Tabindex, Pfeile, Pos1/Ende, Leertaste und Enter verwenden den bestehenden Auswahladapter. Schließen gibt den Fokus zurück.
- Reine Noten-Scrollbereiche und die Lektions-Ergebnisansicht müssen auch ohne darin aktiven Knopf mit der Tastatur erreichbar bleiben. Entsprechender Web-Fokus ergänzt die bestehenden Notenbeschreibungen.
- Lange Knopfbeschriftungen können umbrechen. Das Auswahlfenster besitzt einen scrollbar begrenzten Inhalt; automatischer Textstress prüft die Lage im kleinen Ansichtsfenster.
- Rohe Renderfehler/ungültige Seiten führen nicht mehr zur technischen Standardansicht. Übersetzte Fehler-/Nicht-gefunden-Ansichten bieten eine bewusste Wiederholung bzw. Rückkehr; gespeicherte Daten bleiben erhalten. Fehlermeldungen und deren möglicherweise private Texte werden nicht eingeblendet.

Die Farben selbst und die musikfachliche Bewertung wurden nicht verändert. Eine erfolgreiche automatische Prüfung ist keine vollständige WCAG-Konformitätserklärung.

## Reproduzierbar prüfen

```sh
source /workspace/harmonia-env.sh # nur diese Cloud-Maschine
pnpm qa:build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium HARMONIA_QA_DIR="$PWD/artifacts/quality/web-preview" pnpm qa:web
pnpm qa:build --production --output artifacts/quality/web-public
pnpm qa:bundle artifacts/quality/web-public
pnpm check:content:bundle artifacts/quality/web-public
pnpm qa:release # erwartet gesperrt, solange Gerätebelege fehlen
```

Andere Maschinen installieren Chromium für die gepinnte Playwright-Version mit `pnpm exec playwright install --with-deps chromium` und lassen `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` weg. In dieser Cloud wird das vorhandene Chromium verwendet; keine Browserdateien aus ungeprüften Quellen. `qa:web` startet den ausschließlich lokalen Vorschau-Server automatisch. Ein bereits separat betriebener Fixture-Server kann über `HARMONIA_QA_URL=http://127.0.0.1:PORT` verwendet werden; entfernte URLs werden abgewiesen. Testausgaben liegen ignoriert unter `artifacts/quality`, getrennte Läufe müssen eigene Ausgabeordner über `HARMONIA_QA_OUTPUT` verwenden. Keine zwei Playwright-Prozesse auf denselben Ausgabeordner loslassen.

`qa:build` erzeugt ausschließlich lokale Gast-Fixtures und leert hierfür Supabase-/RevenueCat-Bindungen; Dotenv ist aus. Keine Zugangsdaten in Konfigurationsdateien oder Reports schreiben. Es ist keine reale Anbieter-/Kaufabnahme. Native Exporte: `pnpm qa:build --all`; Vorschau/Produktion und große Jest-Läufe nacheinander ausführen. Öffentliche Bundlechecks benötigen lesbares JavaScript statt Hermes-Bytecode; beim separaten Prüfexport `--no-bytecode` an Expo weitergeben. Der normale native Releaseexport behält Hermes.

## Automatisierte Kernabläufe

- DE auf schmalem hellem Handy, US mit Tastatur, UK dunkel mit reduzierter Bewegung: echtes Gast-Onboarding inklusive sichtbarer Notenfrage, Altersbestätigung und überspringbarer Paywall; keine vorzeitige Benachrichtigung/Analytics-/Kaufpflicht.
- Persistierter Lernpfad, Lektionsstart, Wiederaufnahme nach Seitenreload, lokale Bearbeitung ohne Netz im bereits geladenen Webclient, wiederhergestellter Hinweis.
- Vollständiger Durchlauf einschließlich Fehlerwiederholung mit ausdrücklich eingeblendeten Lösungen. Ergebnis und eigener Gast-Export müssen gespeichert bleiben, ohne durch Lösungshilfen Bestehen/XP zu erhalten; gleiche Abschluss-ID nach Reload.
- Radio-Tastaturbedienung, Dialogbenennung, Fokus nach Schließen, synthetischer 200-%-Textstress bei kleinem Fenster, 320-CSS-Pixel-Seitenbreite, öffentliche Rechts-/Datenschutz-/Kündigungsseiten und sichere 404-Rückkehr.
- Axe mit allen ausgewählten Regeln; kein Abschalten von Scroll-, Kontrast- oder Dialogregeln zur Umgehung eines Befunds. Keine ungefangenen JS-Fehler oder Analytics-/Anthropic-/RevenueCat-Requests in den Gastabläufen.
- Fünf Browserstarts mit geleertem HTTP-Cache und erhaltenem Gerätespeicher sowie fünf Lektionsöffnungen (neue bzw. gespeicherte Einführung); P95 gegen 3 s/1 s. Kein Netzwerkprofil oder Emulator wird als echtes Mittelklasse-Gerät bezeichnet.

## Größenbudgets

`tools/qa/budgets.json` ist die technische Größenwache. Ausgangsmessung des öffentlichen P2.22-Exports: 5.371.782 Byte Web-JavaScript insgesamt, 1.278.305 Byte Gzip-Potenzial; 686.098 Byte MP3s. Die Größenwache summiert alle Webchunks einschließlich nachgeladener SDKs/Worker, nicht nur die Entrydatei. Native Entrydateien werden je Plattform getrennt gemessen; Hermes und Debug-JavaScript nicht als identische Formate vergleichen.

Der Vorschau-Server liefert für unterstützte Text-/WASM-Dateien Gzip nur bei entsprechender Anforderung, respektiert `gzip;q=0`, setzt `Vary: Accept-Encoding` und liefert HEAD ohne Body. COOP/COEP bleiben für SQLite-WASM erhalten. Ein späterer Webhost muss seine eigene Kompression/Cache-/Sicherheitskonfiguration tatsächlich prüfen.

## Mobile Abnahme: vorbereitet, nicht durchgeführt

- `e2e/mobile/onboarding.yaml`: ausschließlich auf eigener wegwerfbarer `app.harmonia.mobile.preview`-Installation; löscht deren Testdaten, wählt Deutsch, durchläuft Gaststart/Paywall, prüft Neustart und Darstellungswahl.
- `e2e/mobile/lesson-resume.yaml`: erste Einführung, Beginn, Prozessneustart und Wiederaufnahme. Die Flows verwenden weder echte Zahlungen noch Anbieteraufrufe als vermeintliche Simulation.
- Ausführen auf eingerichteten Testgeräten: `maestro test e2e/mobile/onboarding.yaml`, danach `maestro test e2e/mobile/lesson-resume.yaml`. Maestro/SDK/Simulator sind hier nicht vorhanden. YAML-Formatierung ersetzt keine ausgeführte Maestro-Abnahme.

Die vier Slots in `tools/qa/device-readiness.json` sind **leer**, keine erfundenen Gerätemodelle oder Prüfer. Pro Gerät festhalten:

1. Tatsächliches Modell, OS, Prüfer, Datum und private Belegreferenz; keine Kontoschlüssel oder privaten Mitschnitte einchecken.
2. Fünf kalte Starts/Öffnungen, Messmethode und schlechtesten bzw. P95-Wert; Start <3.000 ms, Lektion <1.000 ms. Echte hörbare Touch-Latenz <50 ms mit dokumentiertem Messaufbau; Audio-Clock-Scheduling ist kein Akustiknachweis. Bluetooth getrennt dokumentieren.
3. VoiceOver/TalkBack, große Systemschrift mindestens 200 %, Fokus-/Auswahlreihenfolge, Feedback ohne Farbe, reduzierte Bewegung und alle benötigten Notenbeschreibungen.
4. Audio mit Lautsprecher/Kopfhörern, iOS-Stummschalter, Hintergrund/Unterbrechung und Rückkehr; native Offline-Wiederaufnahme.
5. Eigene Store-Sandbox-Abnahme einschließlich Kauf/Wiederherstellung und Kontowechsel; reale Anbieterbindungen aus P2.19 müssen dafür erst eingerichtet sein. Kein unbeabsichtigter echter Kauf. Konto-/Datenschutzlöschung und Export mit eigenen Testkonten.

`qa:release` verlangt vier unterschiedliche Modelle, zwei iOS/zwei Android, ausgefüllte Referenzen, tatsächlich eingetragene Messwerte innerhalb der Ziele und alle Einzelprüfungen. Aktuell muss die Prüfung scheitern. P2.23-Gesamtabnahme, echte Geräte-/Store-/Modellabnahme und verbleibende Freigaben aus P2.21 bleiben offen.

## Nachweise

Tatsächlich am 15.10.2026 lokal ausgeführt:

- Gesamter `pnpm test`-Lauf: **2.950 Tests bestanden** (2.305 Pakete, 539 App, 101 bisherige Werkzeugtests und fünf neue QA-Werkzeugtests). Anschließend sechs QA-Werkzeugtests einschließlich des ergänzten Ausgabeordner-Schutzes bestanden; elf gezielte App-Tests für Lektionsablauf und Fehleransicht erneut bestanden.
- Vollständige Typprüfung, ESLint, Formatierung, Übersetzungs-, Inhalts-, Curriculum- und Paketgraphprüfung bestanden. Nach der letzten Ergänzung am Ausgabeordner-Schutz nochmals die betroffenen Werkzeugtests, ESLint und die gültige Testauflistung geprüft.
- **Acht Playwright-Kernabläufe** am finalen Vorschau-Webexport bestanden; alle aufgerufenen axe-Prüfungen ohne Befund. Zusätzlich die **drei öffentlichen Seiten am Produktions-Webexport** bestanden. Das belegt die geprüften Ansichten und Abläufe, keine vollständige manuelle WCAG-Abnahme.
- Fünf lokale Chromium-Messungen: Start-P95 **1.402,185 ms**, Lektionsöffnung-P95 **229,829 ms**. HTTP-Cache vor dem Start jeweils geleert, Gerätespeicher erhalten. Keine physische Geräte- oder hörbare Latenzmessung.
- Finale Vorschau für Web sowie native Hermes-Exporte für iOS/Android erstellt. Separater Produktions-Prüfexport für alle drei Plattformen mit `--no-bytecode` erstellt; öffentlicher Inhaltscheck über sieben JavaScript-Dateien bestanden. Kein nativer Installations-/Storetest.
- Öffentliche Größenwache bestanden: Web-JavaScript **5.375.274 Byte roh / 1.279.172 Byte Gzip-Potenzial**, Audio **686.098 Byte**, Android-Entry **5.953.021 Byte**, iOS-Entry **5.798.903 Byte** im lesbaren Prüfexport. Vorschau-Hermes: Android **9.616.527 Byte**, iOS **9.409.426 Byte**.
- `qa:release` scheitert wie vorgesehen an vier unausgeführten Geräteslots. Beide Maestro-Flows bleiben unausgeführt. Remote-GitHub-CI wurde eingerichtet, aber ihr Laufstatus ist in dieser Umgebung nicht einsehbar.

Lokale, ignorierte Belege: `artifacts/quality/final-accepted` und `artifacts/quality/public-accepted` (Screenshots und Timing-Anhang); Builds unter `/workspace/p223-preview-final` und `/workspace/p223-public-final`. Die Playwright-Konfiguration akzeptiert ausschließlich separate Unterordner von `artifacts/quality` und verhindert damit, dass ihr automatisches Leeren Quellcode oder den Fixture-Build entfernt. Parallele Läufe benötigen weiterhin unterschiedliche Ausgabeordner. Die finalen Abnahmeläufe wurden nacheinander ausgeführt.

## Git-Integration und Übergabe

Am 15.10.2026 direkt ohne Pull Request nach `main` integriert und gepusht: Qualitätsänderung `cc3cb7de617858a19738841a99534a29a0b19595` vom Arbeitsbranch `codex/p2-23-quality-review`, Fast-forward ausgehend von `328ef484b00ec1b0bd270aee10d5f83054e1c6eb`. Beim Abgleich lagen keine zusätzlichen Änderungen auf `origin/main` vor; alle vorhandenen Remote-Branch-Spitzen sind enthalten. Bei dieser Integration wurden keine Branches gelöscht und keine Historie überschrieben. Die anschließende Löschung der 15 integrierten Arbeitsbranches und die ausdrückliche Korrektur des PR-Ablaufs sind in [Nachprüfung](pr-pruefung-nach-integration.md) dokumentiert. Die direkte Integration entsprach nicht dem vorgesehenen PR-Ablauf; eine grüne GitHub-CI war vorab nicht nachgewiesen.

Claude Code bleibt Hauptprogrammierer. Nächster Planpunkt ist P2.24 als Vorbereitung. Die offenen vier Geräte-/Akustik-/Storeprüfungen aus diesem Dokument und die fachlichen, rechtlichen sowie Anbieterfreigaben aus den vorherigen Schritten bleiben erforderlich. Die Integration ist keine Veröffentlichung oder vollständige P2.23-Abnahme.
