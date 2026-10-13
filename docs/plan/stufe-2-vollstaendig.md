# P2.08 – Stufe 2 vollständig intern

Stand 13.10.2026: **Alle 16 geplanten Stufe-2-Einheiten und alle 50 Fähigkeiten sind intern umgesetzt.** Stufe 2 umfasst 48 Lektionen mit 480 Aufgaben, 144 Wissenskarten mit 150 eigenen Beispielen und 16 Wissensartikel in DE/US/UK. Jede Einheit besitzt drei Lektionen mit 8, 10 und 12 Aufgaben; die neue Inhaltsversion 13 ergänzt die 15 nach dem Bassschlüssel-Einstieg verbliebenen Einheiten. Frühere Datensätze behalten ihre Versionen.

**Alle Inhalte bleiben `entwurf`.** P2.08 ist technisch und inhaltlich vollständig vorbereitet, jedoch noch nicht fachlich freigegeben. Die getrennte Claude-Abnahme nach [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md) sowie der zugängliche Literaturabgleich sind offen. Ein interner Prüfstand ist kein öffentlicher Inhalts-Release.

## Einheiten und konkrete Aufgaben

| Einheit | Inhalte und Anwendung |
|---|---|
| `notation.l2.clefs-registers` | Bassschlüssel, zwei verbundene Systeme und vollständige Helmholtz-/wissenschaftliche Oktavnamen; Version 12 bleibt erhalten |
| `notation.l2.spelling` | Vorzeichengeltung im Takt und in derselben Lage, Auflösung/Zurücksetzen, enharmonische Klanggleichheit sowie freie Schrift in beiden Schlüsseln |
| `rhythm.l2.dotted-tied` | Einfach punktierte Werte, Bindungsketten einschließlich Taktgrenzen und einfache Synkopen mit überbrücktem Viertel-Grundschlag |
| `rhythm.l2.subdivision` | Exakte Achteltriolen mit sichtbarer 3 und echten Anschlägen, 3/4 versus 6/8 und Mittippen in zusammengesetzter Gliederung |
| `intervals.l2.qualities-build` | Nummer/Qualität einfacher Intervalle, aufwärtiges Schreiben und klanggleiche unterschiedliche Schrift wie große Terz/verminderte Quarte |
| `intervals.l2.inversion` | Umkehrung, abwärtiges Schreiben sowie einfache und zusammengesetzte Intervalle bis zur Doppeloktave |
| `scales.l2.major` | Durmuster aus realen Tonabständen, freie Tonleitern bis drei Vorzeichen und Tonika/Stufen in unterschiedlichen Tonarten |
| `scales.l2.minor` | Freies Schreiben von natürlichem, harmonischem und klassisch melodischem Moll; Auf-/Abwärtskonvention ausdrücklich erklärt |
| `scales.l2.keys` | Durvorzeichnungen, Dur-Nachbarn im Quintenzirkel, Mollvorzeichnungen und Paralleltonarten/englisch relative keys |
| `chords.l2.qualities` | Grundton/Terz/Quinte in Grundstellung und freies Schreiben der vier Dreiklangarten |
| `chords.l2.inversions` | Grundton versus Bass, drei enge Lagen und leitereigene Dreiklänge in Dur/natürlichem Moll aus Tonart und Stufe |
| `aural.l2.rhythm-detail` | Punktierte Bildauswahl, markierte zwei-/dreiteilige Grundschläge und fehlender letzter Viertel-Baustein |
| `aural.l2.melody` | Elf hörbar verschiedene reine/kleine/große Intervalle bis zur Oktave, Dur/natürliches Moll und geänderte Vier-Ton-Position |
| `aural.l2.triads` | Dur/Moll, alle vier Dreiklangarten und enge Dur-/Mollumkehrungen mit hörbarem Grundtonbezug |
| `history.l2.period-contexts` | Grobe europäische Epochen, Kontext und Merkmale; Werkjahr ausdrücklich im fiktiven Dossier, keine Datierung aus dem Modellklang |
| `history.l2.jazz-pop-sources` | Afroamerikanische Musikpraxis, Migration, Aufnahmegeschäft, populäre Medienkontexte und begründete Grenzen zweier Quellen |

Die neun Karten jeder neuen Einheit erklären ihre Begriffe und enthalten eigene vollständige Klangmodelle. Historische Modelle sind ausdrücklich keine Archivaufnahmen oder übernommenen Werke. Die 15 neuen Artikel besitzen je neun Abschnitte und bewahren ihre zugehörigen Beispiele; die vorherige Bass-/Oktaveinheit bleibt unverändert. Artikel sind weiterhin Datensätze für die Tutor-Wissensbasis, keine bereits vorhandene separate Leseroute.

## Funktionen, Darstellung und Versionen

Es gibt nun 19 Übungstypen und weiterhin dieselben sechs freien Sätze. `CONTEXT_CHOICE` verwendet 21 Quellenfragen mit berechneter Lösung und vollständig lokalisierten Fragen, Antworten, zwei Hilfestufen sowie erklärtem Lösungsweg. Die Zielantwort ist kein zusätzliches gespeichertes Bewertungsorakel. Antwort- und Quellenänderungen für Wiederholungen werden unabhängig von bloß gemischten Knöpfen geprüft. Die bereits implementierten Schreib-/Tasten-/Tonleiter-/Vorzeichnungs-/Akkordtypen werden in echte Lektionen eingebunden.

Achteltriolen verwenden exakte Brüche und die Bravura-Glyphe U+E883, identische Quellwerte für Klang und Aufnahme sowie sichtbare Gruppierung. Grundschlagtempo bleibt in 6/8 die punktierte Viertel. Rhythmusergänzungen zeigen ein beschriftetes Drei-Viertel-Gerüst und drei einviertellange Ausschnitte ohne eigene Taktangabe; gespielt wird der vollständige Quelltakt. Sonstige neue Hörquellen bleiben bis Wertung beziehungsweise Lösungshinweis verborgen. Genau eine geänderte Melodieposition und ein klingender Akkordgrundtonbezug machen die entsprechenden Antworten eindeutig.

Die Vorzeichenleiste erhält die vorhandene Radio-Tastaturbedienung mit Leertaste/Enter, Pfeilen und Home/End sowie einem passenden Tab-Stopp. Das behebt die im vollständigen Tastatur-Schreibdurchgang gefundene fehlende Aktivierung. Themefarben, bestehende Bedienelemente, individuelle Audio-Stopps, Erstwertungs-Sperre, Hilfen/Überspringen und getrennte Wiederholungsstatistik bleiben erhalten.

Katalog und Fähigkeitsplan: Inhaltsversion **13**. Inhalts-Schema und SQLite-Schema bleiben **1**. Gesamtumfang beider Stufen: **85 Lektionen, 850 Aufgaben, 250 Karten mit 307 Beispielen und 29 Artikel**. Der Graph behält 90 Fähigkeiten und 29 Einheiten. Alle 37 Stufe-1-Lektionen mit 370 Aufgaben bleiben separat auf vollständige Abdeckung geprüft.

## Prüfstand

- Gesamte Testsuite: **2.297 Tests bestanden** (UI 14, Theorie 717, Audio 29, i18n 419, Notation 234, Übungen 318, Inhalt 228, App 282, Werkzeuge 56). Die von den letzten Quellen- und Screenreader-Korrekturen betroffenen Prüfungen wurden erneut erfolgreich ausgeführt.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm check:i18n`, `pnpm check:content` und `pnpm check:curriculum` bestanden. `pnpm check:deno`: Typprüfung und **78 echte Laufzeitprüfungen**, einschließlich aller 850 Aufgaben und exakter Triolenzeiten.
- Alle 48 Stufe-2-Lektionen durchlaufen je **100 vollständige Fehler-/Wiederholungsrunden**. Alle 50 Fähigkeiten sind Aufgaben, Karten und Artikeln zugeordnet; die 135 neuen Beispiele sind vollständig, gültig und darstellbar. Die App-Tests bedienen und speichern alle 45 neuen Lektionen mit Version 13.
- Alle 21 Quellenfragen und fünf zusätzlichen Hörformen durchlaufen je 200 Seeds samt DE/US/UK-Fragen, Antwortnamen und Hinweisen. Unabhängige Tabellen, gezielt geänderte Quelldaten und `tonal` prüfen die fachlichen Berechnungen; 300 leitereigene Schreibaufgaben stimmen mit dem unabhängigen Dur-/Mollvergleich überein.
- Chromium: alle **45 neuen Lektionen mit 450 Aufgaben und 135 gespielten Kartenbeispielen** jeweils vollständig in DE per Tastatur, DE per Touch im dunklen Theme mit reduzierter Bewegung, US per Maus und UK per Touch. Die letzten geänderten Intervall-/Geschichtsquellen wurden in den bereits abgeschlossenen Sprachdurchgängen erneut geprüft. Anschläge/Dauern stimmen mit der Klangquelle überein; Ergebnisse sind nach Reload vorhanden, keine JavaScript-Fehler. Touchansichten: 390 × 844; Desktop: 1.280/1.440 Pixel breit.
- Fehler-/Hilfen-/Wiederholungsdurchgänge für Vorzeichengeltung und Melodieposition prüfen die Wertungssperre, neue Quelle und Antwort, getrennte Statistiken und Speicherung nach Reload. Eine vollständige Hörpause zählt acht ausgelassene Fragen und keine beantwortete Frage oder erfundene Genauigkeit.
- Produktions- und Vorschau-Exports erfolgreich. Der tatsächliche Produktions-Bundle enthält in seinen zwei JavaScript-Dateien keine unveröffentlichten Katalog-IDs/Inhaltstexte; alle 45 neuen Lektions-URLs bleiben öffentlich gesperrt.
- Der Basisvergleich gegen `a9d450de298eae8f61b0991edd89e87a7a511e02` bestätigt **349 identische alte Katalogdatensätze**, sämtliche bisherigen Inhaltstexte und **4.000 identische alte Durchgänge mit 40.000 Aufgaben**. Bestehende Versionen und sechs freie Sätze bleiben erhalten.

Die Notationsbeschreibung für Screenreader benennt den Schlüssel und danach tatsächlich gedruckte Zeichen, Dauern und Positionen. Sie nennt vor der Wertung keine Lösungstonhöhe. Die Vorzeichenleiste ist zusätzlich mit Home/End, Pfeilen, Enter und Leertaste geprüft.

## Getrennte fachliche Abnahme

Claude prüft die 50 Ziele nach den Karten und konkreten Aufgaben der Tabelle, besonders Vorzeichengeltung/Oktavlage, enharmonische Schrift versus Klang, Bindungen über Taktgrenzen, Synkopenkriterium, Triolengruppen, 3/4/6/8, Oktav-Randfälle, klassische Mollkonvention, Parallel-/Varianttonarten, leitereigene Dreiklänge, hörbare Mehrdeutigkeit und historische Aussagegrenzen. Technische Tabellen ersetzen diesen Durchgang nicht.

Prüfbibliografie ohne übernommenen Originaltext: *Open Music Theory* (Notation, Rhythmus, Intervalle, Tonleitern und Dreiklänge); Ulrich Michels, *dtv-Atlas Musik*, Band 1; Burkholder/Grout/Palisca, *A History of Western Music*; Ted Gioia, *The History of Jazz*; *Grove Music Online* für Begriff-/Quellenkontexte. Diese Liste behauptet keinen abgeschlossenen Literaturabgleich dieser Sitzung. Die zuvor geprüften Literaturzugänge sind vom Cloud-Proxy gesperrt; Claude CLI, Claude-Zugangsdaten und ein aufrufbares Claude-Werkzeug sind nicht verfügbar. Echte iOS-/Android-/VoiceOver-/TalkBack- und GitHub-CI-Abnahmen bleiben zusätzlich offen.

Review-Zweig `codex/p2-08-complete-level-two`, Basis `codex/p2-08-clefs-registers`: [GitHub-Vergleich](https://github.com/PhiFa96/harmonia/compare/codex/p2-08-clefs-registers...codex/p2-08-complete-level-two). Kein Merge und kein öffentlicher Inhalts-Release. Ein Pull Request wurde nicht angelegt; der zuvor bestätigte GitHub-API-Zugriffsschutz bleibt bestehen. Der Vergleich enthält den vollständigen Stand für Claude.

Als nächster Planpunkt folgt P2.09 Onboarding. Einstufungstest ist P2.10, Freischaltung P2.11 und Bestehensschwelle P2.12. Diese Lernerlebnisregeln sind keine bereits umgesetzte Eigenschaft der Inhaltsfertigstellung. Allgemeiner mehrstimmiger Notensatz, Chor-/Orchesterpraxis und höhere Stufen bleiben weitere Projektarbeit.
