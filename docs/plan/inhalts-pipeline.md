# Inhalts-Pipeline P2.04

Stand: 05.10.2026. Lokale Inhaltsprüfung, Freigabefilter und App-Anbindung sind implementiert. Die echte EAS-Projektbindung und eine nachgewiesene OTA-Auslieferung bleiben offen.

Fortsetzung 12.10.2026: Sieben Stufe-1-Einheiten besitzen je drei Lektionen mit 8/10/12 Aufgaben, zusammen 58 neue Karten und sieben vorbereitete Artikel. Intern sind 22 Lektionen mit 220 Aufgaben auswählbar. Katalog und Plan haben Version 9. Die neue Intervalleinheit fragt Nummern, Richtung und Wiederholung/Schritt/Sprung aus dem Notenbild ab. Alle Inhalte bleiben Entwurf für Claudes separate fachliche Abnahme. Prüfstand und nächste Einheit `intervals.l1.first-qualities`: [intervallgroesse-und-richtung.md](intervallgroesse-und-richtung.md). Schemaformat 1 und Freigabefilter bleiben bestehen; die EAS-/OTA-Anbindung bleibt offen.

## Daten und Einstiegspunkte

`packages/content/src/catalogue.json` ist der vollständige interne Katalog. Strenge Zod-Schemas beschreiben Bereiche, Stufen, Einheiten, Fähigkeiten, Übungssätze, Wissenskarten, Wissensartikel und Lektionen. Jeder Datensatz hat eine stabile `id`, eine positive `contentVersion`, einen Freigabestatus und einen `titleKey`. Die Katalogversion ist mindestens so groß wie die Version jedes enthaltenen Datensatzes; `schemaVersion: 1` bezeichnet das Dateiformat.

Die erste Lektion behält `fundament.reading-and-listening.1`, Inhaltsversion 1, dieselben zehn Übungsparameter und ihre bisherigen Einführungstexte. Die frühere einzelne Lektionsdatei ist in den Katalog überführt. Karten und Übungssätze werden per ID referenziert und erst für den Spieler aufgelöst. Eine Übungssatz-Zeile beschreibt `spec` und `count`; dadurch sind verschiedene Längen möglich. Der aktuelle Spieler unterstützt 1–200 generierte Aufgaben je Lektion. Längere Kompositionsaufgaben und zusätzliche Übungstypen brauchen später ihr eigenes Modell bzw. P2.06; diese Grenze beschreibt keine Dauer oder maximale Stimmenzahl eines Musikstücks.

Inhaltsübersetzungen liegen zentral in `packages/i18n/src/authored-content.json`: Deutsch, Englisch (US) und Englisch (UK). Referenzen haben die Form `content.firstLesson.notesBody`. Oberfläche und Glossar bleiben in ihren bisherigen Dateien. Für US/UK-Fachbegriffe bleiben `$t(glossary:…)`-Verweise die Quelle. Die bisherigen Texte wurden verschoben, nicht fachlich neu formuliert oder freigegeben.

| Einstieg | Zweck |
|---|---|
| `@harmonia/content` | Schemas, Prüfung, Auflösung und Freigabefilter; lädt keine Entwurfsdaten |
| `@harmonia/content/catalogue` | Öffentlich erzeugter Katalog als Standard |
| `@harmonia/content/authoring` | Vollständiger interner Katalog und erste Vorschaulektion |
| `@harmonia/i18n/content-messages` | Öffentliche Inhaltsübersetzungen als Standard |

## Prüfen und öffentliche Dateien erzeugen

```sh
pnpm check:content
pnpm content:publish
pnpm check:i18n
pnpm test
```

`content:publish` erzeugt **nur lokale Dateien**; es veröffentlicht nichts bei EAS oder auf einer Website. Es validiert sämtliche internen Inhalte und schreibt deterministisch im Repository-Format:

- `packages/content/src/published.json`: ausschließlich Datensätze mit `freigegeben`.
- `packages/i18n/src/published-content.json`: ausschließlich die von diesen Datensätzen verwendeten Inhaltstexte.

Beide Dateien sind versioniert. `check:content` berechnet sie erneut und vergleicht sie mit dem eingecheckten Stand. Veraltete Dateien oder hineinkopierte Entwürfe lassen die CI fehlschlagen.

Die Prüfung erfasst globale ID-Eindeutigkeit, alle typisierten Referenzen, doppelte Referenzen/Stufennummern, den Fähigkeitsgraphen ohne Zyklen, positive Versionen, vorhandene und nicht leere Texte in allen drei Sprachfassungen, gleiche Platzhalter, Glossar-Verweise und Inhalts-Textverschachtelungen ohne Zyklen. Notenbeispiele werden mit `parseScore` und der Engine-basierten Takt-/Haltebogenprüfung geprüft; Übungen müssen mit ihren Parametern tatsächlich generierbar sein. Gleich klingende Hörantworten werden weiterhin abgelehnt.

**Freigabe ist geschlossen:** Eine freigegebene Lektion darf keine ungeprüfte Einheit, Karte, Fähigkeit oder Übungssatz voraussetzen. Dasselbe gilt für weitere Beziehungen und für verschachtelte Inhaltstexte. Der Status ist fachlich durch Claude in einem getrennten Prüfdurchgang zu setzen (ADR 0005); technische Tests setzen ihn nicht automatisch.

Die erste Lektion ist weiterhin `entwurf`. Daher enthält der aktuelle öffentliche Katalog keine Lektion. Die öffentliche App erklärt den noch fehlenden Lektionsinhalt und lässt freies Üben erreichbar. Ein direkter `/lesson`-Aufruf startet keine Entwurfslektion und greift nicht auf deren gespeicherte Ergebnisse zu.

## App-Build und CI

Metro wählt zwei statische Module nach `APP_VARIANT` aus, mit getrenntem Cache:

- `development` (Standard) und `preview`: interner Katalog und interne Inhaltsübersetzungen.
- `production`: ausschließlich die erzeugten öffentlichen Dateien. Der interne Katalogeinstieg ist für Produktionsimporte gesperrt.

Die ungeprüften Daten werden nicht erst in der Oberfläche versteckt: Die Inhaltsdateien und Erklärungstexte gelangen im Produktions-Build nicht in den Modulgraphen. `check:content:bundle` kontrolliert zusätzlich die tatsächlichen JavaScript-Dateien auf unveröffentlichte IDs und Texte, auch bei String-Escapes. Die CI baut beide Varianten und prüft anschließend den Produktions-Export. Der Prüfer weist den internen Export erwartungsgemäß zurück; er ist für Produktionsdateien vorgesehen.

```sh
APP_VARIANT=preview pnpm --filter @harmonia/mobile build:web
APP_VARIANT=production pnpm --filter @harmonia/mobile build:web
pnpm check:content:bundle
```

Zum getrennten lokalen Prüfen kann `expo export --output-dir <Verzeichnis>` verwendet werden. `HARMONIA_PREVIEW_DIR=<Verzeichnis> HARMONIA_PREVIEW_PORT=<Port> pnpm preview:web` stellt den jeweiligen Export mit den SQLite-Headern bereit.

## EAS Update vorbereiten

`expo-updates` ist in der zu SDK 57 gehörenden Version installiert. `app.config.ts` bindet Updates nur bei einer gültigen öffentlichen `EAS_PROJECT_ID` an `https://u.expo.dev/<ID>`; ohne Projekt-ID bleiben sie deaktiviert. Die native Laufzeit wird über `runtimeVersion.policy = appVersion` gebunden. Die EAS-Buildprofile verwenden die Kanäle `preview` und `production`.

Nach Bindung an ein echtes EAS-Projekt muss zunächst ein neuer nativer Build mit `expo-updates`, Projekt-ID und Laufzeitbindung installiert werden. Danach kann ein geprüftes Inhaltsupdate etwa so veröffentlicht werden:

```sh
pnpm check:content
APP_VARIANT=preview EAS_PROJECT_ID=<öffentliche-Projekt-ID> eas update --channel preview
# Erst nach geprüfter Vorschau:
APP_VARIANT=production EAS_PROJECT_ID=<öffentliche-Projekt-ID> eas update --channel production
```

Diese Befehle wurden hier nicht ausgeführt. EAS-Projekt, Berechtigung und native Empfänger-Builds sind nicht konfiguriert; es gibt deshalb keinen Nachweis einer OTA-Auslieferung. Eine Änderung der App-Version oder nativer Abhängigkeiten verlangt einen neuen kompatiblen Build. Inhaltliche Änderungen erhöhen die betroffenen Inhaltsversionen und die Katalogversion; gespeicherte Fortschritte behalten ihre stabilen IDs. Das EAS-SDK ersetzt keine Migration oder Synchronisation von Lernfortschritt.

## Validierung und offene Übergabe

Gezielte Tests prüfen ungültige Referenzen, Zyklen, Sprach-/Notationsfehler, manipulierte Freigabeketten, Textverschachtelungen, unterschiedliche Übungslängen, leeren öffentlichen Katalog und escapete Entwurfstexte im Bundle. Browserprüfungen testen die Einführung und erste Aufgabe in der internen Vorschau sowie den gesperrten Direktlink und freien Übungsbereich im öffentlichen Export. Der Lektionsablauf und die lokale Speicherung bleiben durch die bisherigen App-Tests abgedeckt.

Lokal am 05.10.2026 bestanden: 1.363 Tests, darunter 44 Pipeline- und 86 App-Tests; Formatierung, Lint, Typprüfung, Übersetzungs- und Inhaltsprüfung; 24 Deno-Prüfungen; Web-Exporte für preview und production samt Browserprüfung und Kontrolle des tatsächlichen Produktions-Bundles. Die App-Testläufe verwenden höchstens zwei Jest-Worker, damit parallele Pakete die asynchronen Audio-/UI-Tests nicht durch zu viele Prozesse ausbremsen.

Noch offen: Claudes separate fachliche Freigabe der ersten Inhalte, erfolgreicher GitHub-CI-Lauf, EAS-Projektbindung und tatsächliches Update auf nativen Geräten. Der vollständige Fähigkeitsgraph der Stufen 1–2 und weitere Inhalte folgen in P2.05–P2.08; achtstimmige Chor-/Orchesteraufgaben bleiben Teil des späteren Curriculums.
