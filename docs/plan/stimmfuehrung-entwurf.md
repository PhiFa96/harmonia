# P4.09 – Stimmführung: technischer Entwurf

**Stand 21.10.2026.** `packages/theory/src/voice-leading.ts` analysiert synchronisierte vierstimmige SATB-Schnitte. Jede Stimme hat pro Schnitt genau eine geschriebene Tonhöhe; gehaltene Töne werden im nächsten Schnitt wiederholt. Der Rückgabewert besteht aus Regelkennung, eingestelltem Schweregrad, Zielindex und Stimmpaar. Die Funktion fällt **kein Gesamturteil** über einen Satz. Ohne ausdrücklich konfigurierte Regeln gibt sie keine Befunde zurück. Es gibt keine Anbindung an Übungen, Tutor, Lernstand oder Produktionsinhalte.

Diese Arbeit ist technische P4-Vorarbeit vor der formalen Phase-4-Freigabe. F05 (Lehrbuchkonvention, Stimmumfänge und Regelwerk) ist offen. Jeder hier gemeldete Sachverhalt ist ein **Entwurf zur Fachprüfung**, kein freigegebenes Lehrurteil. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.

| Muster | Berechnung im Entwurf | Quelle / Fachstand |
|---|---|---|
| Quintparallele | Zwei beliebige Stimmen bewegen sich gleichgerichtet von einer geschriebenen reinen Quinte/Duodezime in die nächste | [Fachprüfung P3.16, A2/A5](../quality/fachpruefung-phase-3/p3-16-stufe-4.md), erkennt diesen Fall; Lehrbuch mit Seitenbeleg und unabhängiger Primärtextprüfung für P4.09 noch offen |
| Oktav- und Primparallele | Wie oben, mit geschriebenen reinen Oktaven bzw. Primen; getrennte Kennungen | Lehrbuch mit Seitenbeleg und unabhängige Fachprüfung offen |
| Stimmkreuzung | Eine tiefere der benachbarten Stimmen liegt in einem Schnitt über der höheren | Lehrbuch mit Seitenbeleg und unabhängige Fachprüfung offen |
| Stimmüberschreitung | Eine Stimme überschreitet den **vorigen** Ton der benachbarten Stimme, während beide Zielschnitt-Stimmen geordnet bleiben | Lehrbuch mit Seitenbeleg und unabhängige Fachprüfung offen |
| Abstand oberer Stimmen | Alt–Tenor oder Sopran–Alt liegen mehr als zwölf Halbtöne auseinander; Bass–Tenor ist ausgenommen | Lehrbuchkonvention F05, Seitenbeleg und unabhängige Fachprüfung offen |

Der eigene Testkorpus enthält für diese sechs Kennungen gezielte Funde sowie Gegenbeispiele: ein I–V-Übergang mit gehaltenem Ton, Gegen- und Seitenbewegung, enharmonisch klingende aber anders geschriebene Intervalle, einen verdeckten Quintgang und die Oktavgrenze. Er prüft Berechnung und Abgrenzung; er ersetzt weder Literaturbeispiele noch die getrennte fachliche Kontrolle nach [ADR 0005](../decisions/0005-fachliche-pruefung-durch-claude.md).

**Für P4.09 noch offen:** F05 mit nachprüfbaren Lehrbuchstellen entscheiden; Schweregrade je Stufe und Stil festlegen; Gegenparallelen, verdeckte Quint-/Oktavgänge, Stimmumfänge, Leitton- und Septimauflösung, Verdopplung und melodische Intervalle ergänzen; dafür einen geprüften Korpus mit eigenen fehlerhaften und fehlerfreien Sätzen zusammenstellen. Der jetzige Korpus betrachtet nur gleichzeitige Schnitte. Metrische Lage, Tonart, Akkordfunktion, Dissonanz und ungleichzeitige Einsätze werden nicht modelliert. Erst danach kann ein Tonsatz-Korrektor oder Tutor-Werkzeug darauf aufbauen.
