# P4.12 – Zeitreise durch die Musikgeschichte (interner Entwurf)

Vier Stationen behandeln **Mittelalter, Renaissance, Barock und Klassik** im ausdrücklich europäischen Überblick des vorhandenen Artikels `history.l2.period-contexts.article`. Jede Station durchläuft Szene → fiktives Interview → Wissensfrage → Hörfrage → Abschluss. Eine falsche Antwort kann erneut gewählt werden. Hörfragen lassen sich erst nach dem Abspielen prüfen. Der Modus schreibt weder Lernnachweise noch XP.

Die Texte liegen in `packages/i18n/src/history-journey-draft.json` mit DE und EN-US; EN-GB verwendet derzeit dieselben nicht terminologiespezifischen englischen Texte. `packages/content/src/history-journey-draft.ts` enthält ausschließlich IDs, Quellenpositionen, Lösungen und eigens verfasste Notenkurzschrift. Die Audio-Engine spielt diese Kurzschrift synthetisch. **Alle Klangmodelle sind eigene Unterrichtsbeispiele; keine historische Aufführung, Rekonstruktion oder Transkription.** Die Hörfragen prüfen direkt hörbare Eigenschaften und verlangen keine Epochenerkennung allein am Klang.

Die historischen Personen sind erfundene Rollen, keine Zitate realer Menschen. Die App benennt das redaktionelle Rollenspiel ausdrücklich als KI-Fiktion und bietet keinen Live-KI-Dialog an. Jede inhaltliche Aussage verweist auf den exakten Abschnitt des versionierten P3-Wissensartikels; der vorhandene Artikelbildschirm zeigt seinen Entwurfsstatus. Der Quellenlink wird mit demselben Text-Fingerabdruck wie P3.19 erzeugt und öffnet nur die passende Artikelfassung.

`@harmonia/content/history-journey` und `@harmonia/i18n/history-journey` werden für Development/Preview auf die internen Daten und für Production auf leere Daten abgebildet. Der Modus ist nur bei vorhandenen Stationen in der Übungsübersicht verlinkt. Ein Produktions-Deep-Link zeigt nur den Zustand „noch keine Station freigegeben“. Vor einem öffentlichen Release muss der Bundleguard erneut geprüft werden.

## Quellen und offene Abnahme

| Station | P3-Artikelabschnitt | Offene Fachprüfung |
|---|---:|---|
| Mittelalter | 0 | Werkjahr 1250 und Grenzen der einstimmigen Modellierung |
| Renaissance | 1 | Werkjahr 1550, Polyphonie und Grenze der modellhaften Zweistimmigkeit |
| Barock | 3 | Werkjahr 1720, Generalbass-Begriff und Klangmodell |
| Klassik | 4 | Werkjahr 1780, Phrasenmerkmal und Epochengrenzen |

Alle verwendeten P3-Artikel und die neuen Texte sind `entwurf`. Die Artikel wurden noch nicht unabhängig gegen Primärliteratur geprüft. Das Quellenreview muss Aussagen, Übersetzungen und die Aussagegrenze der Modelle getrennt beurteilen. Danach sind echte Hör-, Screenreader- und Geräteprüfungen auf iOS, Android und Web erforderlich. Bis dahin bleiben die vier Stationen intern; **keine Epoche ist fachlich freigegeben**. Auch Phase 3 und Phase 4 bleiben nach ihren bestehenden Start- und Abschlussbedingungen offen. P4.01 wartet weiter auf F14 und die rechtlichen Voraussetzungen.
