# P4.09 – Stimmführung: technischer Entwurf

**Stand 21.10.2026.** `packages/theory/src/voice-leading.ts` analysiert synchronisierte vierstimmige SATB-Schnitte mit 16 einzeln aktivierbaren Regelkennungen. Jede Stimme hat pro Schnitt genau eine geschriebene Tonhöhe; gehaltene Töne werden im nächsten Schnitt wiederholt. Der Rückgabewert besteht aus Regelkennung, eingestelltem Schweregrad, Zielindex und einer oder mehreren beteiligten Stimmen. Die Funktion fällt **kein Gesamturteil** über einen Satz. Ohne ausdrücklich konfigurierte Regeln gibt sie keine Befunde zurück. Es gibt keine Anbindung an Übungen, Tutor, Lernstand oder Produktionsinhalte.

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

Der eigene Testkorpus deckt alle 16 Kennungen ab, einschließlich Gegenbeispielen, Stilvarianten, Dur/Moll, enharmonischer Schreibweise, mehreren Fundstellen und ungültiger Konfiguration. Intervallbeispiele werden zusätzlich mit `tonal` verglichen; die Deno-Probe enthält die Gegenquintenprüfung. Diese Prüfmittel ersetzen die getrennte fachliche Kontrolle nach [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md) nicht.

**Für P4.09 noch offen:** F05 mit passenden SATB-Quellen entscheiden; Schweregrade und Parameter je Stufe und Stil festlegen; Quellenlücken und Übertragungen aus der Quellenübersicht unabhängig kontrollieren. Metrische Lage, Vorhalte/Durchgänge, Dissonanzübertragung zwischen Stimmen, weitere Verdopplungsregeln und ungleichzeitige Einsätze werden nicht automatisch behandelt. Der jetzige Korpus bestätigt die abgrenzbaren Muster, nicht die vollständige Korrektheit längerer Sätze. Erst nach diesen Abnahmen kann ein Tonsatz-Korrektor oder Tutor-Werkzeug darauf aufbauen.
