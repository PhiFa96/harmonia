# ADR 0078: KI- und Zertifikatsprüfwerte an Importketten binden

Datum: 13.11.2026 · Status: angenommen für den internen technischen Entwurf.

## Anlass

Die unabhängige Fachprüfung Phase 4 v3 nennt für KI/Zertifikate N1 und N2: Importierte Dateien außerhalb der fest erfassten Verzeichnisse fehlen im KI-Prüfstand; die Zertifikatsbindung erfasst die von der Prüfmappe importierte KI-Prüflogik nicht. Der Nutzer beauftragt diesen nächsten Programmierblock. Die vorhandenen Fachprüfungen bleiben dokumentiert.

## Entscheidung

Ein gemeinsamer, ausschließlich lokal arbeitender Binder ergänzt die vorhandenen Startdateien und Verzeichnisbestände um ihre Importketten. Er analysiert TypeScript-/JavaScript-Syntax mit der bereits gepinnten TypeScript-Version, ohne untersuchte Module auszuführen. Er erfasst statische Importe, Reexports, Typimporte, literale dynamische Importe und literales `require`/`require.resolve`.

Relative Dateien und Verzeichnis-Einstiege, Repository-Workspace-Exports, im Repository erklärte TypeScript-Pfad-Aliasse und lokale Konfigurationsvererbung werden verfolgt. Web-, native, iOS- und Android-Varianten sowie alle deklarierten Workspace-Exportbedingungen werden konservativ gemeinsam gebunden. Zuständige Paketmanifeste und TypeScript-Konfigurationen gehören zum Prüfstand. Der KI-Stand bindet außerdem Node-Version, Deno-Importkonfigurationen und die App-/Metro-Konfiguration. Importierte JSON-/Audio-Dateien und die bisherigen ausdrücklichen Font-Assets werden als Bytes gehasht.

Die bisherigen Verzeichnisbestände bleiben erhalten: Auch eine dort neu hinzugefügte Laufzeitdatei ändert den Prüfstand. Die Ausschlüsse für Testdateien und Fixtures betreffen nur diese anfängliche Sammlung. Wird eine ausgeschlossene Datei tatsächlich importiert, wird sie trotzdem verfolgt. Der Binder selbst gehört über seine echten Importe zu beiden Prüfständen.

Fehlende lokale Module, unbekannte interne Aliasse/Workspace-Exports, nichtliteral berechnete Modulimporte, ungültige Syntax, Konfigurationszyklen, Quellen-Symlinks und Pfade außerhalb des Repositorys verhindern einen vollständigen Prüfstand. Innerhalb des Repositorys liegende pnpm-Verweise bleiben für die bisherigen ausdrücklich gebundenen installierten Fontdateien zulässig. Externe Bibliotheken werden durch Paketmanifeste, Lockfile und gegebenenfalls im Quelltext gepinnte Importkennung gebunden; ihr vollständiger installierter Quelltext wird nicht rekursiv aufgenommen. Beliebige Dateizugriffe oder Netzwerkantworten werden nicht als Modulimporte ausgegeben. Private Rechtsdokumente und Inventarentscheidungen behalten ihre eigenen bestehenden Prüfpfade.

Jeder Aufruf liest die Dateibytes und löst die Importziele erneut auf. Nur die bereits analysierte Syntax unveränderter Dateien wird begrenzt zwischengespeichert. Neue Importkanten, geänderte Alias-/Exportziele und neu hinzugefügte Plattformdateien werden daher auch im selben Prozess erkannt.

## Folgen und Nachweise

Die stärkere Bindung ändert die Prüfwerte. Alte KI-Arbeitsblätter müssen neu erzeugt und menschliche Anmerkungen in den neuen Stand übertragen werden. Bestehende Zertifikatsentwürfe werden nach Neustart unter dem neuen Prüfwert als veraltet behandelt; keine stillschweigende Umbindung, keine neue PDF aus dem alten Prüfstand. Export, Löschung und Widerruf bleiben nach den bisherigen Regeln möglich. Keine Datenbankmigration, keine Änderung an Fragen, Bewertung oder Bestehensgrenzen.

Fünf tatsächliche Regressionen wurden vor der Implementierung rot beobachtet: vier reale Änderungen bisher ungebundener Dateien und ein trotz Änderung der KI-Prüflogik weiter abrufbares gespeichertes Zertifikatsmuster. Die Tests arbeiten mit eigenen temporären Quellbäumen und einer eigenen SQLite-Datei; keine Mutation der Arbeitsquellen oder echten Rechtsfreigaben.

Technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**. Inhalte, Rechtsprüfungen und Zertifikate bleiben Entwurf; keine Veröffentlichung, echte Zahlung, entfernte Bereitstellung oder Main-Integration. P4.01 bleibt bis F14/Recht zurückgestellt. N3–N5 aus dem Rohbericht bleiben ausdrücklich getrennte Punkte, insbesondere Dokumentechtheit, schreibende Lese-/Exportpfade und simulierte Zahlungsbestätigung.

ADR 0076/0077 sind für die separaten Schul-/Tutor-Entwürfe reserviert. [Umsetzung und Übergabe](../plan/ki-zertifikate-importbindung.md).
