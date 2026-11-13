# KI-/Zertifikatsbindung: vollständige lokale Importketten

Stand: 13.11.2026 · Branch `codex/ai-certificate-import-binding-draft` · Basis `main@ab157e8`.

Auf Nutzerauftrag werden N1/N2 aus dem [v3-Rohbericht KI/Zertifikate](../quality/fachpruefung-phase-4-v3/ki-zertifikate.md) umgesetzt. Technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**. Keine Veröffentlichung, entfernte Bereitstellung oder Main-Integration. Die Inhalte bleiben Entwurf; P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt. Die bestehenden Fachprüfungen sind dokumentiert. [ADR 0078](../decisions/0078-ki-und-zertifikatspruefwerte-an-importketten-binden.md).

## Verhalten

| Befund | Umsetzung |
|---|---|
| N1: Importierte Dateien außerhalb der KI-Wurzelverzeichnisse fehlen | Gemeinsame Syntaxanalyse verfolgt direkte und transitive relative Importe, Workspace-Exports, TypeScript-Aliasse und Plattformvarianten. Tatsächlich importierte Fixtures werden trotz ursprünglichem Dateifilter erfasst. |
| N2: KI-Prüflogik fehlt im Zertifikatsprüfwert | Die bestehende Kette `certificates/review.mjs → ai-act/model.mjs` wird bis zu ihren lokalen Abhängigkeiten einschließlich Binder und Nachweisprüfung verfolgt. Eine Änderung macht alte Zertifikatsentwürfe nach Neustart ungültig. |

`tools/source-binding.mjs` sammelt den Importgraph ohne Codeausführung. Typimporte, Reexports, literale Lazy-Imports, `require` und `require.resolve` zählen ebenfalls. Kommentare und importähnliche Zeichenketten erzeugen keine Dateikanten. Zyklen zwischen Modulen werden vollständig, aber nur einmal besucht.

Paketmanifeste und zuständige TypeScript-Konfigurationen werden mitgehasht. Exakte Pfad-Aliasse haben Vorrang vor Platzhaltern; lokale Vererbung und Ausweichziele werden berücksichtigt. Alle deklarierten Workspace-Bedingungen und vorhandenen Plattformvarianten werden gemeinsam gebunden. Importierte JSON- und Audio-Dateien werden als Bytes erfasst. Der KI-Stand bindet App-/Metro-Konfiguration, Node-Version und Deno-Importkonfigurationen zusätzlich. Die bisherigen vollständigen Verzeichnisbestände und Fontnachweise bleiben erhalten.

Fehlt eine lokale Datei oder lässt sich eine interne Importkante nicht sicher bestimmen, entsteht kein vollständiger Prüfstand. Nichtliteral berechnete Importe brauchen eine ausdrückliche technische Lösung statt eines stillen Überspringens. Quellen dürfen weder per Symlink noch per Pfad aus dem Repository ausbrechen. Die bestehenden installierten Fontdateien dürfen pnpm-Verweise innerhalb des Repositorys nutzen.

Externe Bibliotheken und externe Konfigurationspakete bleiben über Manifeste/Lockfile bzw. gepinnte Importkennungen gebunden. Es wird kein vollständiger Hash aller `node_modules` behauptet. Beliebige Dateizugriffe, private Belegdokumente und Netzwerkantworten sind keine statischen Modulimporte; ihre bisherigen eigenen Prüfpfade bleiben maßgeblich. Inventarentscheidungen werden weiterhin semantisch ohne ihre eigenen Reviewfelder gebunden, damit eine Freigabe sich nicht selbst entwertet.

## Übernahme nach Review

1. Quellenstand integrieren und erforderliche Prüfungen durchführen; dieser Auftrag bereitet ausschließlich einen eigenen Entwurfs-PR vor.
2. Private KI-Prüfmappe mit `pnpm ai:review` neu erzeugen. Arbeitsblätter einzeln mit `pnpm ai:handoff --scope general`, `pnpm ai:handoff --scope school` und `pnpm ai:handoff --scope certificates` erzeugen. Alte Vorlagen werden beim Prüfen abgewiesen; menschliche Anmerkungen bewusst in neue Vorlagen übertragen. Kein Skript übernimmt automatisch eine Rechtsfreigabe.
3. `pnpm certificates:review` erneut ausführen und den lokalen Zertifikatsserver neu starten. Vorher gebundene Durchgänge bleiben als Daten erhalten, gelten aber unter dem neuen Quellprüfwert als veraltet. Keine nachträgliche Umbindung von Antworten oder Ergebnissen; neue Prüfung benötigt den regulären Testablauf.
4. Export, Löschung und Widerruf alter Datensätze bleiben möglich. Der bestehende Hinweis auf den notwendigen Serverneustart gilt weiterhin: Ein geladener Server wird nicht als Hot-Reload-Ausführung geänderter Quellen ausgegeben.

Es gibt keine neue SQL-Migration, App-Route, Fragenbank, Bewertungsregel, Bestehensgrenze oder Inhaltsversion. Katalog 31, Tutor-Prompt/Werkzeuge 5/3 bleiben erhalten.

## Prüfungen

Die Regressionstests kopieren ausschließlich bekannte Projektquellen und nötige Assets in eigene temporäre Verzeichnisse. Vier bisher ungebundene Dateien werden dort tatsächlich verändert: Tutor-Antwortansicht, Einstellungen, Workspace-UI-Schaltfläche und Beta-Studienlogik. Der frisch berechnete KI-Prüfwert muss sich ändern und das alte Arbeitsblatt abgewiesen werden. Ein echter SQLite-Durchgang mit ausschließlich simulierter Testbestellung wird abgeschlossen; nach Änderung der kopierten KI-Prüflogik und Neustart mit dem neuen Prüfwert sind Beleg und Code veraltet, die Löschung bleibt möglich. Alle fünf Fälle wurden vor der Implementierung rot beobachtet.

Zusätzliche isolierte Graphprüfungen decken Syntax statt regulärer Ausdrücke, keine Codeausführung, Reexports/Typ-/Lazy-/JSON-Importe, Modulzyklen, Workspace-Bedingungen, Aliasvorrang/-vererbung/-Ausweichziele, geänderte Zuordnungen, neue Plattformdateien, wörtliche Platzhalterwerte, fehlende Quellen, ungültige Syntax und Pfad-/Symlinkgrenzen ab. Der Syntaxcache verhindert keine Neuprüfung geänderter Bytes oder Ziele.

```sh
node --test tools/source-binding.test.mjs tools/import-binding.test.mjs
corepack pnpm test:tools
corepack pnpm check:ai
corepack pnpm check:certificates
corepack pnpm typecheck
NODE_OPTIONS=--max-old-space-size=8192 corepack pnpm lint
corepack pnpm format:check
corepack pnpm certificates:test:web
```

`check:ai:release --scope general`, `--scope school`, `--scope certificates` und `check:certificates:release` bleiben im tatsächlichen Entwurfsstand jeweils mit Exitcode 1 gesperrt. Aktuelle Dateizahlen liefert `check:ai`; historische Zahlen im Rohbericht bleiben historisch. Konkrete lokale Nachweise und die fünf erforderlichen GitHub-Jobs am finalen Commit werden im Entwurfs-PR festgehalten.

## Getrennte offene Punkte

Die getrennten Schul-/Tutor-PRs #151/#156 sind nicht in diesem Branch enthalten. Eine spätere Integration ändert Prüfwerte und verlangt erneut aktuelle Prüfmappen.

N3 bleibt eine Grenze privater Belegdokumente: Dateihash und Besitzrechte beweisen keine Echtheit oder Unabhängigkeit. N4 (schreibende Lese-/Exportpfade) und N5 (selbst bedienbare simulierte Zahlung) sind nicht Teil dieser Importbindung. Keine produktive Identitäts-/Zahlungsberechtigung, echten Zertifikate oder juristische Freigabe. Unabhängige Fach-/Quellen-/Sprachprüfung sowie reale Geräte-/Screenreader-/Anbieter-/Rechtsabnahmen bleiben offen.
