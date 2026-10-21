# P4.09 – Stimmführung: technischer Entwurf

**Stand 21.10.2026.** `packages/theory/src/voice-leading.ts` analysiert synchronisierte vierstimmige SATB-Schnitte mit 16 einzeln aktivierbaren Regelkennungen. Jede Stimme hat pro Schnitt eine geschriebene Tonhöhe oder ausdrücklich `null` für eine Pause; gehaltene Töne werden im nächsten Schnitt wiederholt. Der Rückgabewert besteht aus Regelkennung, eingestelltem Schweregrad, Zielindex und einer oder mehreren beteiligten Stimmen. Die Funktion fällt **kein Gesamturteil** über einen Satz. Ohne ausdrücklich konfigurierte Regeln gibt sie keine Befunde zurück. Es gibt keine Anbindung an Übungen, Tutor, Lernstand oder Produktionsinhalte.

Diese Arbeit ist technische P4-Vorarbeit vor der formalen Phase-4-Freigabe. F05 (Lehrbuchkonvention, Stimmumfänge und Regelwerk) ist offen. Jeder hier gemeldete Sachverhalt ist ein **Entwurf zur Fachprüfung**, kein freigegebenes Lehrurteil. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.

Die [Quellenübersicht](../quality/p4-09-quellenentwurf.md) nennt direkt gelesene Open-Music-Theory-Primärtexte mit festem Commit und Abschnitt. Sie hält Unterschiede zwischen Spezieskontrapunkt, Generalbass-/Klaviersatz und dem noch zu wählenden SATB-Modell ausdrücklich fest. SATB-Abstände, Stimmumfänge und einige Verallgemeinerungen haben noch keine passende Fachfreigabe.

| Regelfamilie | Verhalten / erforderliche Konfiguration |
|---|---|
| Parallelen | Reine Quinten, Oktaven und Primen zwischen allen Stimmpaaren. Oktavierte Intervalle sind eingeschlossen; ein Wechsel zwischen Prim- und Oktavverdopplung zählt zur Oktavfamilie. |
| Gegenparallelen | Getrennte Quint-/Oktavkennungen; Bereich `contraryPerfectScope: 'outer'` oder `'all'` erforderlich. |
| Verdeckte Gänge | Getrennte Quint-/Oktavkennungen in den Außenstimmen, ohne Doppelmeldung offener Parallelen; `hiddenPerfectMotion: 'soprano-leap'` oder `'any'` erforderlich. |
| Kreuzung / Überschreitung / Abstand | Nachbarstimmen im aktuellen und vorigen Schnitt; Abstandsregel nur S–A und A–T über zwölf Halbtöne. |
| Stimmumfang | Alle vier `ranges` müssen angegeben werden; keine Standardwerte. Grenzen sind inklusive und gelten nach klingender Tonhöhe. |
| Leittonauflösung | `harmonies` pro Schnitt und ein ausdrücklich markierter Übergang `resolveToNext.leadingTone: 'up'`; optional `'up-or-frustrated-inner'` für den abspringenden Innenstimmenleitton. |
| Septimauflösung | Akkord im Quellkontext und `resolveToNext.seventh: 'down'`; die benannte Akkordseptime muss in derselben Stimme einen Halb-/Ganzton abwärts gehen. |
| Leittonverdopplung | Tonika pro Schnitt; der Halbton darunter bestimmt den geschriebenen Leitton. Ein Befund nennt alle beteiligten Stimmen. |
| Melodie | Übermäßige Sekunde sowie frei konfigurierbare Sprunggrenze `maxMelodicInterval` (1 = Prime, 8 = Oktave). |

`harmonies` enthält genau einen Kontext je Schnitt; `tonic: null` und `chord: null` markieren unbekannte Harmonik ausdrücklich. Ohne markierte Grenze wird keine Auflösung verlangt, etwa innerhalb einer Dominantverlängerung. Eine markierte Grenze prüft genau den nächsten Schnitt; eine noch gehaltene Dissonanz wird dort als unerledigt gemeldet. Der Aufrufer muss eine spätere Auflösungsgrenze entsprechend markieren. Die Funktion bestimmt weder Funktionen noch Akkorde aus den Tönen und setzt F03 damit nicht voraus. Fehlende erforderliche Parameter, umgekehrte Bereiche, unvollständige Kontextlisten und eine Auflösung nach dem letzten Schnitt lösen `RangeError` aus.

Pausen werden nicht als Tonhöhen ersetzt. Lage- und Bewegungsregeln prüfen nur die jeweils klingenden Stimmen; eine Pause unterbricht die Bewegung dieser Stimme, ohne andere Stimmen von der Prüfung auszunehmen. Eine Pause am ausdrücklich verlangten Auflösungsziel erfüllt eine Leitton-/Septimauflösung nicht. Auch diese Abgrenzung bleibt Teil des fachlich zu prüfenden Entwurfs.

## Verbindung zur Partitur

`packages/notation/src/voice-leading.ts` verbindet das vorhandene `Score`-Modell mit der Engine:

- `voiceLeadingScoreTimeline(score, assignment)` erzeugt exakte Brüche für absolute Zeit, Taktindex und Position im Takt. `assignment` ordnet Bass, Tenor, Alt und Sopran ausdrücklich vier verschiedenen Notationsstimmen zu. Analysiert werden ausschließlich diese Stimmen.
- Ein Schnitt entsteht an jedem Ereignisanfang einer gewählten Stimme. Unterschiedliche Dauern, Punktierungen, N-tolen, Taktwechsel und gleich lange Auftakte sind unterstützt. Lange Töne und Haltebögen bleiben erhalten; die vier Stimmen brauchen gemeinsame Taktgrenzen.
- `analyzeVoiceLeadingScore(score, assignment, rules, options)` liefert einen Bericht mit `status: 'draft'`, Zeitfolge und Befunden. Jeder Befund nennt die aktuellen Noten-/Pausenpositionen; Bewegungsregeln nennen zusätzlich den vorigen Zeitpunkt und die Ausgangsnoten. Die Positionen passen zur vorhandenen Notenmarkierung.
- Unveränderte Lagebefunde werden bei fremden Einsätzen und innerhalb derselben Haltebogenketten nicht wiederholt. Ein erneuter Anschlag oder ein nach einer Unterbrechung wiederkehrender Befund wird erneut gemeldet. Es gibt keine Gesamtpunktzahl.
- Für harmonische Regeln wird `options.harmonies` passend zu diesen Schnitten angegeben; die Zeitfolge kann dafür zuerst separat abgefragt werden. Notierte Akkord-/Funktionslabels werden nicht als Analyse übernommen.

Ungültige Notation einschließlich offener Haltebögen, fehlende oder doppelt zugeordnete Stimmen, unterschiedliche Taktspannen und Akkorde innerhalb einer ausgewählten SATB-Stimme werden mit `RangeError` zurückgewiesen. Der Adapter teilt Akkorde nicht selbst in Stimmen auf. Die genauen Einsatzzeiten erlauben noch keine automatische Beurteilung von Durchgängen, Vorhalten oder metrisch bedingten Ausnahmen.

## Lokaler Review-Bericht auf Deutsch und Englisch

`tools/voice-leading-report.mjs` erzeugt aus einer ausdrücklich konfigurierten Eingabe einen eigenständigen HTML-Bericht. Er enthält die Partitur, aufklappbare Befunde mit markierten Zielnoten, Ausgangs-/Zieltabellen, gewählte Regeln und eine Textbeschreibung aller Noten/Pausen. Die Notenschrift und ihre Lizenz sind eingebettet; der Bericht lädt keine externen Assets und benötigt kein JavaScript. Es gibt keine neue App-Route.

```sh
pnpm voice-leading:report --input tools/voice-leading/example.json --language de-DE --output artifacts/voice-leading/review-de.html
pnpm voice-leading:report --input tools/voice-leading/example.json --language en-US --output artifacts/voice-leading/review-en.html
pnpm voice-leading:report --input tools/voice-leading/example.json --language en-GB --output artifacts/voice-leading/review-uk.html
```

Die eigene Zweitakt-Fixture enthält absichtlich zwei Quintparallelen und eine nicht erfüllte Leittonauflösung. Sie ist ein technisches Beispiel mit vier gewählten Regeln, **kein F05-Standardprofil und kein freigegebener Lerninhalt**. Eigene JSON-Eingaben verwenden die Noten-Kurzschreibweise, eine SATB-Zuordnung, Regelkennungen/Schweregrade und bei Bedarf Stimmumfänge/Harmoniekontexte. Tonhöhen sind Zeichenketten wie `C4`, Tonika-/Akkordgrundtöne wie `C` oder `F#`. Unbekannte Felder oder Regeln werden zurückgewiesen; fehlende fachliche Parameter werden nicht ergänzt.

DE-, EN-US- und EN-GB-Texte stehen ausschließlich in `tools/voice-leading/messages.ts`. Alle 16 Regeln haben eine Bezeichnung und Erklärung; Unterschiede wie H/B, „leading tone“/„leading note“ und „measure“/„bar“ werden berücksichtigt. Das Werkzeug interpretiert einen leeren Bericht nicht als Freigabe des Satzes. Kopf und Fuß kennzeichnen jeden Bericht als Entwurf und verweisen auf F05 und die Quellenübersicht.

Ausgaben sind nur als neue HTML-Dateien unter dem ignorierten lokalen Verzeichnis `artifacts/voice-leading/` möglich. Bestehende Dateien und symbolische Elternpfade werden zurückgewiesen. App-Exports und öffentliche Inhaltsartefakte werden nicht beschrieben. Das Werkzeug hat keine Bereitstellungs- oder Versandfunktion.

Der eigene Testkorpus deckt alle 16 Kennungen ab, einschließlich Gegenbeispielen, Stilvarianten, Dur/Moll, enharmonischer Schreibweise, Pausen, mehreren Fundstellen und ungültiger Konfiguration. Intervallbeispiele werden zusätzlich mit `tonal` verglichen. Die Partiturtests prüfen exakte Einsatzzeiten, Quell-/Zielnoten, die Verbindung zur Notenmarkierung, Haltebögen, Auftakte, unveränderte Eingaben und ungültige Partituren. Die Deno-Probe enthält Gegenquinten sowie einen vollständigen Partitur-zu-Befund-Durchgang. `tools/voice-leading-report.test.mjs` prüft alle Sprachfassungen, Befunde, leere Ergebnisse, Eingabevalidierung, HTML-Maskierung, private Ausgabepfade und einen vollständigen CLI-Aufruf; es ist Teil von `pnpm test:tools`. Die lokale Chromium-Probe prüfte Tastatur, eingebettete Schrift, fehlende externe Abrufe und axe in allen drei Sprachen sowie die schmale Darstellung. Dazu wurde der generierte HTML-Inhalt direkt eingesetzt, weil `file://`-Navigation in der Cloud gesperrt ist. Diese Prüfmittel ersetzen die getrennte fachliche Kontrolle nach [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md) nicht.

## Lokale Satzwerkstatt

`pnpm voice-leading:workbench --language de-DE --output artifacts/voice-leading/workbench.html` erzeugt eine eigenständige bearbeitbare HTML-Datei. DE, EN-US und EN-GB sind auch innerhalb der Datei umschaltbar. Das Werkzeug bündelt mit dem festgelegten esbuild 0.28.1 die vorhandene Engine, den Adapter und den Bericht. Schrift und Lizenz sind enthalten. Nach dem Erzeugen laufen Bearbeitung und Prüfung ohne Server oder Netzwerk im Browser; ein CSP-Hash erlaubt genau das eingebettete Skript. Der erzeugte Prüfbericht bleibt skriptfrei.

Der interne Ablauf:

1. Sopran, Alt, Tenor und Bass in getrennten Feldern schreiben. Takte mit `|` trennen; das gemeinsame Klaviersystem entsteht daraus automatisch. Die Oberfläche nennt die internationale Eingabeschreibweise (`B` = deutsches H, `Bb` = deutsches B).
2. Gemeinsame Taktart/Vorzeichnung wählen und die ausdrücklichen Regeln/Harmonieangaben als JSON bearbeiten. Das eigene Startbeispiel hat dieselben drei absichtlichen Funde wie der Bericht. Es ist kein freigegebenes F05-Profil.
3. „Satz prüfen“ zeigt den aktuellen Bericht. Jede Eingabeänderung entfernt alte Befunde und sperrt den Berichtsdownload bis zur erneuten erfolgreichen Prüfung. Ungültige Notation, unterschiedliche Taktspannen und nicht passende Harmoniezeitpunkte erzeugen eine Fehlermeldung.
4. „Entwurf herunterladen“ sichert auch unfertige Notation und unvollständiges Einstellungs-JSON. „Entwurf laden“ stellt diese Eingaben wieder her; eine beschädigte/zu große Datei ersetzt keine Eingaben. Es gibt keine automatische Speicherung. „Prüfbericht herunterladen“ sichert den zuletzt erfolgreich geprüften Stand als HTML.

Das Dateiformat `harmonia-satb-draft-v1` enthält Titel, Taktart, Vorzeichnung, vier Stimmen und den noch unbearbeiteten Einstellungstext. Es ist vom Eingabeformat des Bericht-CLI getrennt. Die Werkstatt ist auf 1–32 Takte mit gemeinsamer Taktart/Vorzeichnung begrenzt. Takt-/Schlüsselwechsel werden hier ausdrücklich zurückgewiesen; der allgemeinere Partituradapter unterstützt sie weiterhin. Noten setzt man in dieser Vorarbeit über Text; grafische Eingabe, Wiedergabe, Aufgaben, Tutor und Stufenintegration sind noch offen.

Der Generator schreibt ausschließlich neue Dateien unter `artifacts/voice-leading/`. Die Downloadknöpfe speichern in den vom Browser gewählten lokalen Downloadordner; die Werkstatt speichert und versendet selbst nichts. Die Produkt-App importiert das Werkzeug nicht.

Die Modell-/Bündeltests sind in `pnpm test:tools` eingebunden. `pnpm voice-leading:test:web` prüft in Chromium drei Sprachen, echte Tonänderungen und Befunde, Fehler/Wiederaufnahme, Speichern/Laden unfertiger Entwürfe, Berichtsdownload, HTML-Maskierung, Tastatur, schmale Darstellung und axe. Die Probe verwendet eigenen generierten HTML-Inhalt über `setContent`; sie ist keine echte Geräte-/Screenreader-Abnahme. Der Browserlauf ist zusätzlich in den bestehenden Web-CI-Job eingebunden.

**Für P4.09 noch offen:** F05 mit passenden SATB-Quellen entscheiden; Schweregrade und Parameter je Stufe und Stil festlegen; Quellenlücken und Übertragungen aus der Quellenübersicht unabhängig kontrollieren. Metrische Lage, Vorhalte/Durchgänge, Dissonanzübertragung zwischen Stimmen und weitere Verdopplungsregeln werden nicht automatisch behandelt. Der jetzige Korpus bestätigt die abgrenzbaren Muster, nicht die vollständige Korrektheit längerer Sätze. Ein produktiver Tonsatz-Korrektor oder Tutor-Werkzeug wartet auf diese Abnahmen; die interne Satzwerkstatt ist technische Vorarbeit vor der formalen Phase-4-Freigabe.
