# Klaviatur und Vorzeichen – zweiter Teil von P2.07

Stand: 09.10.2026. Die zweite Notationseinheit `notation.l1.keyboard` ergänzt drei interne Lektionen mit 8/10/12 Aufgaben, acht Wissenskarten mit dreizehn Noten-/Klaviaturbeispielen und einen fünfteiligen Artikelentwurf in DE/US/UK. Alle neuen Datensätze bleiben `entwurf`; P2.07 ist weiterhin offen bis zur vollständigen, fachlich freigegebenen Stufe 1.

## Lektionen und Voraussetzungen

| Lektions-ID | Titel | Aufgaben | Einführung | Fähigkeiten |
| --- | --- | --- | --- | --- |
| `notation.l1.keyboard.keys` | Die weißen Tasten finden | 8 Tastenfragen | 3 Karten | `notation.keyboard-layout` |
| `notation.l1.keyboard.steps` | Halbton und Ganzton unterscheiden | 6 Wissensfragen, 4 Tastenfragen | 2 Karten | zusätzlich `notation.semitone` |
| `notation.l1.keyboard.accidentals` | Einfache Versetzungszeichen lesen und spielen | 4 Wissensfragen, 4 Notennamenfragen, 4 Tastenfragen | 3 Karten | zusätzlich `notation.accidentals` |

Die Einführung beginnt mit Zweier-/Dreiergruppen schwarzer Tasten und C/F als Orientierung. Danach werden die weißen Tasten benannt. Halbtonschritte zählen jede benachbarte Taste, einschließlich schwarzer Tasten; E–F und H–C/international B–C liegen schon auf benachbarten weißen Tasten. Die letzte Lektion erklärt einfaches Kreuz, b und Auflösungszeichen, deutsche H/B-Namen und gleich klingende Schreibweisen. Doppelte Vorzeichen bleiben ausgeschlossen. Notierte Aufgaben verwenden den Violinschlüssel im bereits eingeführten Tonraum E4–F5.

Tastenfragen geben den Tonnamen ohne Oktave und ohne ein zusätzlich zu lesendes Notenbild vor. Ihr fester Ausschnitt ist C4–B4, MIDI 60–71, mit zwölf Tasten und nur einem C. So wird vor `notation.l1.register` keine Oktavbestimmung oder Hilfslinienkenntnis abgefragt. Die Einführung zeigt zur Orientierung auch das nächste C; der Unterschied zwischen Bild und Eingabe wird erklärt. Klaviaturbeschriftungen behalten ihre bisherigen lokalisierten Oktavnamen, die Frage bewertet diese Namen noch nicht.

Die Einheitenauswahl enthält jetzt sieben interne Lektionen: den Prototyp mit zehn Aufgaben sowie je drei Lektionen für Notensystem und Klaviatur, insgesamt 70 Aufgaben pro vollständigem Erstversuch. Ergebnisse und Fehlerwiederholungen bleiben je Lektions-ID getrennt. Diese Auswahl berechnet noch keine Bestehensschwelle und schaltet keine Einheit frei; P2.11/P2.12 bleiben eigene Schritte.

## Karten, Abbildungen, Klang und Artikel

| Karte | Beispiele |
| --- | --- |
| `card-groups` | C4–F4 als Orientierung an schwarzen Tastengruppen |
| `card-white` | C4–D4–E4–F4–G4–A4–B4–C5 |
| `card-find` | D4–A4 |
| `card-steps` | C4–C♯4–D4 |
| `card-neighbors` | E4–F4 und B4–C5 |
| `card-signs` | G4–G♯4, A4–A♭4 und G♯4–G4 mit Auflösung im selben Takt |
| `card-names` | B4–B♭4; deutsch H–B |
| `card-same` | C♯4–D♭4, E♯4–F4 und F♭4–E4 |

Die vollständigen IDs beginnen mit `notation.l1.keyboard.`. Jedes Beispiel besitzt optionales `keyboard: { first: 60, last: 72 }` im bestehenden Schemaformat 1. Die Inhaltsprüfung lehnt ein Bild ab, dessen Ausschnitt nicht alle klingenden Tasten des zugehörigen Scores enthält. Sie berücksichtigt tatsächliche MIDI-Höhen, einschließlich enharmonischer Schreibweisen.

`KeyboardExample` zeichnet eine statische, an die Kartenbreite angepasste SVG-Klaviatur. Punkte und Farbe markieren die im Score verwendeten Tasten. Beide Schreibweisen auf derselben Taste erzeugen einen Punkt; der zugängliche Bildname nennt dennoch beide geschriebenen Töne. Die weißen Tasten tragen deutsche H-/internationale B-Beschriftungen. Farben, Schrift und Abstände stammen aus den bestehenden Tokens; die Abbildung ist auch in der Entwicklungsgalerie vorhanden. Sie startet keinen Klang und nimmt keine Eingaben entgegen.

Notenbild und ausdrücklich gestartetes Klangbeispiel verwenden weiterhin denselben vollständigen Score mit ♩ = 90. Die Oberfläche nennt dieses Tempo als 90 Viertelnoten pro Minute, US „quarter notes“, UK „crotchets“; das bisher kaum sichtbare Unicode-Tempozeichen wird dadurch ersetzt. Beispiel-, Karten- und Routenwechsel stoppen eigene Stimmen über den vorhandenen Audioablauf. Alle dreizehn Beispiele bleiben vollständig; insbesondere wird die Acht-Ton-Folge nicht gekürzt. Ein seitlich überbreites Notenbild erhält den vorhandenen Scrollhinweis.

`notation.l1.keyboard.article` bereitet fünf Abschnitte zu Tastengruppen, Schrittweiten, Vorzeichen, deutschen/internationalen Namen und enharmonischen Schreibweisen vor. Er ist ein Datensatz für die spätere Wissensbasis; Artikel-Leseansicht und Tutor-Anbindung bleiben offen. Texte und Beispiele sind selbst verfasst. Fünf neue Glossareinträge sind `keyboard`, `pianoKey`, `twoBlackKeys`, `threeBlackKeys` und `enharmonic`. US verwendet „half step/whole step“, UK „semitone/tone“; der Klangvergleich ist auf die gleichstufige Stimmung bezogen.

## Parameter, Bewertung und Speicherung

- `KEY_FIND` erhält optional `presentation: 'name'`; ohne Parameter bleibt die bisherige Notenvorgabe erhalten. Namen benötigen einen Ausschnitt von höchstens elf MIDI-Schritten. Sowohl die klingende Taste als auch die natürliche Bezugstaste der Schreibweise liegen im Ausschnitt. Dadurch erscheinen bei C4–B4 keine außerhalb liegenden Bezüge wie H♯3 oder C♭5. Eigene Fragen, Hinweise und Lösungstexte verlangen keine Oktavprüfung; der bisherige Notenmodus behält seine Oktavvorgabe.
- `PianoKeyboard.fixedRange` hält diesen Ausschnitt fest und blendet den Tonumfang-Wechsel aus. Beschriftung, Zoom und seitliches Verschieben bleiben verfügbar. Das freie Klavier und bisherige Notenvorgaben behalten ihre bisherigen Bereichsoptionen.
- `KEY_FIND` bewertet `key:<MIDI>`; enharmonisch gleiche Tasten sind richtig. `NOTE_NAME` bewertet weiter Buchstabe und Alteration: Cis und Des bleiben verschiedene Notennamen. Hilfen, gesperrte Erstwertung und Fehlerwiederholungen gelten für beide Formen. Eine Tastenwiederholung muss eine andere MIDI-Höhe haben.
- `KNOWLEDGE_MC`/`MATCH` kennen ein siebtes Thema `keyboard` mit vier Fachdaten: Halbton, Ganzton, Zweiergruppe und Dreiergruppe schwarzer Tasten. Insgesamt besitzt der Generator 49 Begriffe; der sechste freie Übungssatz verwendet weiterhin seine bisherigen sechs Themen mit 45 Begriffen.
- Optionales `maxAccidentals: 1` begrenzt Wissensfragen und ihre Antwortmöglichkeiten auf Kreuz, b und Auflösung. Der bisherige Standard 2 umfasst auch Doppelzeichen. Für `MATCH` bleiben bei dieser Begrenzung höchstens zwei Paare erlaubt, damit eine fachlich andere Wiederholung möglich ist. Die neuen Lektionen verwenden ausschließlich `KNOWLEDGE_MC`.
- SQLite speichert weiterhin die vollständige Sitzung samt Parametern, Lektions-ID, Version, Antworten und beiden Runden. Datenbankversion 1, Abhängigkeiten und Lockfile bleiben unverändert.

Katalog, öffentlicher Katalog und Plan haben `contentVersion: 4`. Neue Karten, Sätze, Lektionen und Artikel haben Version 4. Prototyp und erste Notationseinheit behalten Version 1 beziehungsweise 3. Öffentliche Builds enthalten weiterhin keine ungeprüfte Lektion, Karte oder Artikel; alle sieben Lektionen sind intern.

## Prüfstand

- **42 zusätzliche Tests:** sieben Generator-/Bewertungsfälle, sechs Inhaltsfälle, acht App-Abläufe, drei öffentliche Direktlinkfälle, ein echter SQLite-Fall, zwei Pipelinefälle und fünfzehn Glossarfälle.
- Jede der drei Lektionen durchläuft 150 Seeds mit reproduzierbarem Umfang, korrekten Voraussetzungen, zunächst falschen Antworten samt Hinweis und anschließend richtigen neuen Wiederholungen. Namenstasten werden zusätzlich für 150 Seeds mit natürlichen und 150 mit einfach alterierten Tönen gegen eine feste MIDI-Tabelle geprüft. Weitere 150 Seeds prüfen einfache Wissensvorzeichen einschließlich Ablenkantworten und Zuordnungen.
- Alle dreizehn Beispiele werden gegen unabhängig ausgeschriebene Tonfolgen und MIDI-Zahlen geprüft. Die Pipeline weist gültige Ausschnitte zurück, wenn sie klingende Tasten eines Karten- oder Artikelbeispiels abschneiden; enharmonische Grenzfälle verwenden die klingende Höhe.
- **1.713 Tests bestanden**, darunter alle 168 App-Tests und die echte SQLite-Speicherung der drei Version-4-Lektionen neben einer Version-3-Lektion. Keine React-Schlüsselwarnungen. Lint, Typen, Format, Übersetzungen, Inhaltsartefakte und Fähigkeitsplan bestanden; keine neue Abhängigkeit. Deno-Typprüfung und **47 Laufzeitprüfungen** bestanden. Nach der visuellen Textkorrektur alle 174 Übungs- und 168 App-Tests erneut bestanden; die Namenfragen einschließlich Feedback und allen drei Hinweisstufen werden in DE/US/UK auf unerwünschte Oktavanforderungen geprüft.
- Preview und Production als Web-Export gebaut; der tatsächliche Produktions-Export besteht die Prüfung auf unveröffentlichte IDs und Inhaltstexte.
- Chromium: alle drei Lektionen mit 30 Aufgaben pro Durchgang auf deutscher Desktop-Tastatur, deutschem Telefon-Touch im Dunkelmodus mit reduzierter Bewegung, US-Maus und UK-Telefon-Touch. Alle dreizehn Diagramme einschließlich tatsächlicher SVG-Tastenpositionen und markierter Tasten sowie DE/US/UK-Namen und Tempobezeichnungen geprüft. Die beiden deutschen Durchläufe prüfen alle Beispielklänge samt vollständigen Einsätzen und Stopp. Drei Ergebnisse bleiben nach Neuladen getrennt erhalten.
- Eine Fehlerprobe speichert 7/8 im Erstversuch und 1/1 mit einer anderen klingenden Taste in der Wiederholung. Eine weitere Telefonprobe erreicht außerhalb liegende Tasten über die sichtbaren Höher-/Tiefer-Knöpfe und besteht acht Aufgaben. Der feste Ausschnitt enthält zwölf Tasten; Einstellungen bieten keinen größeren Tonumfang, die physische C5-Taste wird ignoriert. Alle drei Entwurfslinks bleiben in Production gesperrt; Rückweg und freies Üben sind erreichbar.
- Auswahl, Diagramme, Beispielwechsel und Aufgaben in beiden Themes visuell kontrolliert; keine JavaScriptfehler oder React-Warnungen. Die lokale Vorschau meldet lediglich die bereits fehlende `favicon.ico` mit HTTP 404; diese Browser-Icon-Anfrage wurde von App-/Audio-/Speicherfehlern getrennt erfasst.

Claudes separater Prüfdurchgang in frischem Kontext und Literaturabgleich nach [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md) bleiben offen, ebenso GitHub-CI und echte iOS-/Android-Geräteprüfungen mit VoiceOver/TalkBack und vergrößerter Schrift. Technische Prüfungen ersetzen diese Abnahmen nicht.

## Übergabe und nächster Schritt

Review-Zweig: `codex/p2-07-keyboard-accidentals`, Basis `codex/p2-07-notation-start` bei `481e08e`. Gegen diesen Vorgänger prüfen; `main` wird nicht verändert oder zusammengeführt. Der Vorgänger baut auf den noch separat zu prüfenden Wissens-, Rhythmus- und Akkordzweigen auf.

Der Review-Zweig ist gepusht; Implementierungscommit `68ae7db`. `main` stand nach dem abschließenden Fetch weiterhin auf `ea48230`; die Vorgänger sind noch nicht zusammengeführt. Die automatische Draft-PR-Erstellung scheitert am Cloud-Zugriff auf `https://api.github.com/graphql` mit `Forbidden`; es wurde kein PR angelegt. [Änderungen gegen die erste Notationseinheit vergleichen](https://github.com/PhiFa96/harmonia/compare/codex/p2-07-notation-start...codex/p2-07-keyboard-accidentals).

Für Claude Code: zuerst die drei neuen Lektionen, deutschen H/B-Namen, Vorzeichenbeispiele und die Trennung zwischen geschriebenem Ton und klingender Taste fachlich prüfen. Danach folgt die nächste Notationseinheit `notation.l1.register` mit Oktavlagen, Hilfslinien und passender Tonhöheneingabe. Weitere Stufe-1-Bereiche, Stufe 2, Bestehens-/Freischaltlogik und spätere Chor-, Orchester- und mehrstimmige Tonsatzstufen bleiben Folgearbeit. Alle neuen Inhalte benötigen vor `freigegeben` den getrennten fachlichen Prüfdurchgang.
