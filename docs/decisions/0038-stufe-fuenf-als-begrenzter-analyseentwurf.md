# 0038 – Stufe 5 als begrenzter Analyseentwurf

Datum: 22.10.2026 · Status: technisch umgesetzt, fachliche Freigabe offen

## Anlass

Auf ausdrücklichen Nutzerauftrag wird P4.19 nach dem integrierten P4.09–P4.12-Stand programmiert. Diese technische Vorarbeit erfolgt **vor der formalen Phase-4-Freigabe**. Sie ist keine Startentscheidung für den Coach-Marktplatz und keine Veröffentlichung.

## Entscheidung

- Die Theorie-Engine erhält einen eigenen zweistimmigen Prüfer für neun Regeln der ersten Gattung. Cantus unten, Gegenstimme oben, gleiche Dauern, Befunde mit Positionsbezug. Die Regeln des vierstimmigen Tonsatzes werden nicht stillschweigend übertragen.
- Analyseoperationen verwenden ausdrücklich vorgegebenes Material: gerichtete Halbtonfolgen, T/I/R/RI, exakte Abschnittswiederkehr, Zwölftonreihen, Tonklassenmengen, Intervallklassenvektoren und diskrete zyklische Verschiebung. Mehrdeutige Transformationen bleiben mehrdeutig; Auswahlaufgaben mit mehreren passenden Lösungen werden abgewiesen.
- Zehn neue Themen erweitern `CONTEXT_CHOICE`. Die Antwort folgt aus der sichtbaren und abspielbaren Partitur. Bestehende Bewertung, Hinweise, Fehlerwiederholung und Tutor-Aufgabenkontexte bleiben der gemeinsame Ablauf. Keine neue Antwortablage.
- Acht Einheiten mit 24 Lektionen, 240 Aufgaben, 32 Karten und acht Wissensartikeln ergänzen die vorhandenen drei Tonsatzlektionen der Stufe 5. Alle neuen Inhaltsdatensätze bleiben `entwurf`, Katalogversion 21.
- `/level-five` bietet einen internen Prüfablauf mit Karten, Aufgaben und veränderter Fehlerwiederholung. Er speichert keine Lernereignisse und vergibt keine XP. Der normale Lernpfad behält seine Voraussetzungen.
- Der Wissensindex akzeptiert Stufe 5 innerhalb der bestehenden Vorschau-/Freigaberegeln. Die Migration erweitert allein die Stufengrenze; sie befüllt keinen Index. RLS und die Sperre öffentlicher Entwürfe bleiben bestehen.
- Metro ersetzt die neuen Übungstexte in Produktion durch reine Navigationstexte. Der veröffentlichte Katalog enthält weiterhin null Lektionen; der Browser-Prüfeinstieg verschwindet. Der Bundle-Check prüft auch die neuen Aufgabenstellungen und Definitionen.

## Grenzen

Ein leeres Kontrapunkt-Befundarray bestätigt ausschließlich neun Regeln, keine vollständige Stilqualität. Weitere Gattungen, Fugenkomposition, freie Werkidentifikation, Set-Primformen, kontinuierliches Phasing und traditionsspezifische Intonationsbewertung sind nicht implementiert. Der Lehrtext macht diese Grenzen sichtbar. Die Notenbeispiele sind eigene Miniaturen; keine historischen Werke oder traditionellen Darbietungen werden vorgetäuscht.

Die unabhängige Fachprüfung gemäß ADR 0005, F03/F05 soweit betroffen, reale Geräte-/Audioprüfungen, formale Phase-4-Abnahme und Veröffentlichung bleiben offen. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt.

Details: [Umsetzung](../plan/stufe-5-entwurf.md), [Quellen- und Regelentwurf](../quality/p4-19-quellenentwurf.md).
