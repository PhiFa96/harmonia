# 0004 – Eigene Theorie-Engine, tonal als Test-Orakel

- **Status:** vorgeschlagen (angenommen mit Merge des Pull Requests zu P1.07)
- **Datum:** 2026-10-02

## Kontext

Die Theorie-Engine ist der fachliche Kern von Harmonia ([ADR 0002](0002-ki-tutor-und-fachliche-korrektheit.md)). Zu klären war, ob wir sie selbst schreiben oder auf `tonal` (MIT-Lizenz, TypeScript) aufbauen. Kriterien aus [theorie-engine.md](../plan/theorie-engine.md): Korrektheit, Erweiterbarkeit, deutsche Benennung, Wartung.

## Spike (02.10.2026)

Getestet mit `tonal` 6.4.3 und 6.5.0:

| Prüfung | Ergebnis |
|---|---|
| Intervalle, auch doppelt übermäßig/vermindert (C4→Fb4 = `4d`, C4→B##4 = `7AA`, Cb4→B#4 = `7AA`) | korrekt |
| Transposition mit korrekter Schreibweise (B#3 + gr. Terz = D##4, Fb4 + verm. Quarte = Bbbb4) | korrekt |
| Tonleitern (Ces-Dur, Gis-harmonisch-Moll mit Fisis), Vorzeichnungen | korrekt |
| MIDI, Frequenz, Enharmonik | korrekt im MIDI-Bereich 0–127, außerhalb `null` |
| **Akkorderkennung** | **berücksichtigt die Schreibweise nicht:** E–G–C → `["Em#5", "CM/E"]` (Em♯5 wäre E–G–His); C–E–Gis → u. a. `Eaug/C` (wäre E–Gis–His) |
| Deutsche Benennung (H, B, -is, -es, Helmholtz) | nicht vorhanden (`H4` wird nicht erkannt) |
| Funktionstheorie, Stimmführung | nicht vorhanden |
| Paketierung | **6.5.0 und drei Unterpakete vom 28.09.2026 verweisen in `main` auf fehlende Dateien.** Unter Node nicht ladbar; 6.4.3 funktioniert |

## Entscheidung

1. **Eigene Engine** in `packages/theory` mit eigenen Datentypen (`Pitch`, später `Interval`, `Chord` …) und eigener Benennungsschicht. Keine Laufzeit-Abhängigkeit zu `tonal`.
2. **`tonal` als Test-Orakel:** In Vergleichstests prüfen wir unsere Ergebnisse gegen `tonal` – überall dort, wo `tonal` nachweislich korrekt ist (Tonhöhen, Intervalle, Transposition, Tonleitern, Vorzeichnungen). Nicht für die Akkorderkennung.
   - Exakt auf 6.4.3 gepinnt.
   - Die defekten Unterpakete sind per pnpm-Override auf ihre Vorversionen festgelegt (`pnpm-workspace.yaml`).

## Begründung

- **Rechtschreibung der Musik ist Pflicht** (CLAUDE.md). Eine Akkorderkennung, die E–G–C als „Em♯5“ vorschlägt, ist für eine Lern-App nicht brauchbar.
- **Deutsche Benennung, Funktionstheorie und Stimmführung** müssten wir ohnehin selbst bauen. Der Kern (Tonhöhe, Intervall) ist überschaubar und profitiert von voller Kontrolle.
- **Weniger Laufzeit-Abhängigkeiten** in App und Edge Functions: Das Paketierungsproblem von 6.5.0 hätte sonst die App betroffen.
- **Zwei unabhängige Implementierungen**, die sich gegenseitig prüfen, finden mehr Fehler als eine allein.

## Konsequenzen

- Mehr eigener Code im Kern. Ausgeglichen durch Beispiel-, Eigenschafts- und Vergleichstests.
- Die Overrides für `tonal` entfernen, sobald die Paketierung repariert ist (bei Updates prüfen).
- Der Vergleichstest beschränkt sich auf den MIDI-Bereich 0–127, weil `tonal` außerhalb davon keine MIDI-Nummer liefert.
