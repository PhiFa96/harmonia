# P4.17 – Programmierte Prüfvorbereitung

Stand: 24.10.2026 · Branch `codex/p4-17-ai-act-review-draft`

Technische P4-Vorarbeit auf Nutzerauftrag **vor der formalen Phase-4-Freigabe**. Auf Grundlage des Schul-/Lizenzstands aus Entwurfs-PR #108 entsteht eine prüfbare Vorbereitung der unabhängigen Rechtsprüfung. Keine rechtliche Freigabe, Veröffentlichung, Bereitstellung oder Kontaktaufnahme mit Dritten. P4.01 bleibt bis F14/Rechtsklärung zurückgestellt.

Die [technische Voreinschätzung](../legal/ai-act/vorpruefung.md) dokumentiert direkt gelesene amtliche Quellen, bestätigte Änderungen und verbleibende Prüffragen. Der direkte EUR-Lex-Volltextabruf war blockiert; der amtliche Explorer mit Rechtsstand 27.07.2026 und die Kommissionsmitteilung waren lesbar. Dieses Nachweisgefälle ist im Inventar ausdrücklich enthalten. Alle neun Funktionsbereiche und acht Maßnahmenpakete bleiben ungeprüft/offen.

## Befehle

```sh
corepack pnpm check:ai
corepack pnpm ai:review
corepack pnpm check:ai:release --scope general
corepack pnpm check:ai:release --scope school
corepack pnpm check:ai:release --scope certificates
```

`check:ai` validiert die technische Vorbereitung und darf bei offenen Rechtsprüfungen erfolgreich sein. Die drei `--release`-Aufrufe müssen im aktuellen Stand mit Exitcode 1 sperren. Ein unbekannter Scope oder ungültiges Inventar wird ebenfalls abgewiesen. Die Prüfung hat keinen Netzwerk-, KI-Modell- oder Zahlungsaufruf.

`ai:review` schreibt ausschließlich unter `artifacts/ai-act/` eine `snapshot.json` und drei statische HTML-Berichte (`de.html`, `en-US.html`, `en-GB.html`). Das Verzeichnis ist ignoriert und gehört nicht zum öffentlichen App-Export. Die Berichte enthalten den Code-Prüfwert, Quellen-/Abrufstand, Zwecke, Klassifizierungsfragen, Maßnahmenrollen, Freigabeblocker und Datei-Prüfwerte. Sie laden keine externen Ressourcen; amtliche Links öffnen sich nur bei Benutzung. Alle Texte werden maskiert.

## Inventar, Nachweise und Codebindung

`tools/ai-act/inventory.json` erfasst Tutor, Lernstand/Lernplanung, SATB-Erklärung, Adaptivität/Einstufung, Tonhöhenerkennung/Chor, Zeitreise, Schulbewertung, geplanten Zertifikatsbetrieb und geplanten KI-Live-Call. Eine bloße Engine-/KI-Trennung führt zu keiner automatischen Niedrigrisiko-Einstufung.

Das Modell validiert unabhängig für `general`, `school` und `certificates`. Geplanter Live-Call wird inventarisiert und gehasht, blockiert aber die vorhandenen Funktionen nicht zusätzlich allein durch sein geplantes Vorhandensein. Der Zertifikats-Scope verlangt ausdrücklich die Einordnung des geplanten Zertifikatsbetriebs. Jede neue konkrete Implementierung oder Zweckänderung verändert den Prüfstand und erfordert neuen Nachweis.

Erfasst werden die im Inventar genannten Dateien und komplette relevante Laufzeitverzeichnisse: Tutor-Function/-Werkzeuge, Client, Mikrofon/Einstufung, Übungsengine, Inhalte, Standardtexte, Schulwerkstatt und die Prüflogik selbst. Tests/Fixtures und erzeugte Berichte gehören nicht zum Fingerprint. Ein neu hinzukommendes Laufzeitmodul innerhalb dieser Verzeichnisse kann sich nicht durch Weglassen eines Eintrags der Codebindung entziehen. Neue andere Funktionsfamilien außerhalb dieser Verzeichnisse benötigen weiterhin eine bewusste Inventarerweiterung und Review; das Werkzeug ist kein vollständiger semantischer KI-Detektor.

Die drei schriftlichen Prüfdatensätze sind vom Hashinhalt ausgenommen, damit sie nach Prüfung den angezeigten Snapshot referenzieren können. Zwecke, Einstufungen, Kontrollen und Quellen sind enthalten. Eine Änderung daran nach dem Rechtsreview macht den alten Nachweis technisch ungültig. Das Werkzeug prüft Nachweisfelder, ersetzt aber keine Überprüfung der tatsächlichen Echtheit oder des rechtlichen Inhalts.

Die allgemeine KI-Prüfung ist in `check:legal:release`, Beta-, Storefront- und P2-Freigabe eingebunden. Das gemeinsame rechtliche Manifest hat zusätzlich `aiActReview: false`. Die CI prüft das Inventar über `check:ai` und führt die zugehörigen Negativ-/Integrationstests aus. Der Bundle-Checker verbietet zusätzliche P4.17-Inventar-/Berichtstexte im öffentlichen Export. Es gibt keine neue App-Route und keinen produktiven Schul-/Zertifikatsstart.

## Prüfung

Die Werkzeugtests prüfen insbesondere: offene/synthetische Nachweise; fehlende Prüferreferenzen; veränderten Code, neue Dateien und geänderte Zwecke; Ablauf/Future-Datierung; ungeklärtes Profiling; widersprüchliche Klassifikation; nicht zulässige Maßnahmenausnahmen; fehlende Inventarbereiche; sichere Pfade/Quellen; tatsächliche Einbindung in bestehende Freigaben; Berichtstexte/Maskierung in drei Sprachen. Das bestehende App-Rechtsmanifest bleibt über seinen vorhandenen Jest-Test abgedeckt.

```sh
node --test tools/ai-act/review.test.mjs tools/release/check.test.mjs
corepack pnpm check:legal
corepack pnpm check:beta
corepack pnpm p2:status
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm format:check
```

Die rechtlichen Produkt-Häkchen in P4.17 bleiben offen. Vor einer formalen Abnahme fehlen die unabhängige schriftliche Einschätzung und die daraus tatsächlich notwendigen Maßnahmen. Die bereits vorhandenen P4.18-/P4.19-Entwürfe oder grüne Tests heben diese Abhängigkeit nicht auf.

Lokaler Nachweis am 24.10.2026: **21/21 Werkzeug-/Integrations-/Diagnosetests**, **2/2 App-Rechtsmanifesttests**, vollständiger Lint und Typcheck sowie Formatprüfung bestanden. Die Erstellung der drei Prüfpakete und die gesperrten Release-Aufrufe sind geprüft. Produktions-Webexport und Bundle-Wache bestanden: fünf JavaScript-Dateien ohne unveröffentlichte Prüfpaketdaten. GitHub-CI wird im PR getrennt ausgewiesen.
