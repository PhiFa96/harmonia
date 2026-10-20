# P3.14 – Harmonik- und Diktatübungen

Technischer Stand vom 19.10.2026 auf `codex/p3-14-harmony-dictation-exercises`. Die Übungstypen sind im gemeinsamen Generator, Inhaltsschema, Bewertungsablauf und in der mobilen App verbunden. Der freie Satz „Harmonik und Diktat“ enthält zwölf Aufgaben; veröffentlichte Kurslektionen der Stufen 3–4 folgen erst in P3.15–16.

## Aufgaben und Bewertung

- `CADENCE_IDENTIFY` spielt zwei Akkorde in einer angegebenen Durtonart. Die Antwort wird mit `classifyCadence` aus der Folge ermittelt. Der erste Entwurf umfasst Ganz-, Plagal-, Halb- und Trugschluss sowie Tonarten mit bis zu drei Vorzeichen.
- `FUNCTION_ANALYSIS` zeigt einen diatonischen Dreiklang mit Tonart und verlangt die Stufe. Der Befund wird mit `analyzeHarmony` neu berechnet. Das Inhaltsschema erlaubt römische Stufen oder vorläufige deutsche Funktionszeichen; der freie Satz verwendet römische Stufen. F03 bleibt offen.
- `MELODY_DICTATION` spielt vier Viertelnoten aus C4–G4. Die Eingabe erfolgt über die Klaviatur, einschließlich falscher chromatischer Tasten als bewertbarer Antwort. `RHYTHM_DICTATION` spielt einen vollständigen 4/4-Takt aus drei bis vier Notenwerten; die Dauern werden in Reihenfolge eingegeben. Beide Aufgaben verbergen den Score bis nach der Antwort bzw. Lösungshilfe. Bewertet wird die vollständige Folge aus den Score-Ereignissen, nicht aus einem gespeicherten Lösungstext.
- `CHORD_IDENTIFY` und `CHORD_BUILD` unterstützen acht Septakkordarten mit bis zu vier Umkehrungen. Schreibaufgaben verwenden vier Tonplätze, prüfen vollständige Schreibweise und Oktave und zeigen die Septime im Feedback. Dreiklangaufgaben und ihre Vorgaben bleiben erhalten.

Antwortformate, Bewertungsprofile und Parameter sind sprachneutral. Ungültige oder unvollständige Eingaben werden nicht gewertet. DE, en-US und en-GB verwenden Übersetzungsschlüssel; en-GB übernimmt die allgemeinen Texte aus en-US.

## Grenzen und Abnahme

Die generierten Kadenz- und Stufenaufgaben sind bewusst auf diatonische Durbeispiele begrenzt. Diktate verwenden eine Stimme und einen Takt ohne Pausen, Auftakte oder bindende Notationskorrektur. Die Kadenz-Hörfrage spielt vor der Folge den Tonika-Dreiklang der genannten Tonart (`playCadence`, Fachprüfung Phase 3); ohne Tonartbezug wäre dieselbe Tonfolge je nach Tonart eine andere Antwort. Das Notenbild und die Bewertung bleiben bei den beiden Akkorden; Stimmführung (Quinte im Bass, geschlossene Lagen) ist weiterhin nicht umgesetzt, alle Akkorde erklingen in Grundstellung. Das Rhythmusdiktat bewertet Notenwerte, keine Klopflatenz. Diese Grenzen sind Parameter- und Inhaltsumfang des ersten technischen Satzes. Die vollständigen Stufen 3–4 und komplexere Prüfungsdiktate sind weitere Arbeit.

Automatisierte Referenzfälle prüfen die vier Kadenzen, Stufen, vollständige Diktatfolgen, Score-Gültigkeit und vierstimmige Septakkord-Schreibantworten. Die festgeschriebene P2.18-Tutorkalibrierung erhält durch den neuen freien Satz keine zusätzlichen Fälle; Stufen-3/4-Fälle gehören zur eigenen Kalibrierung P3.18. Fachliche Prüfung der Beispiele gegen Literatur und durch Claude gemäß ADR 0005, Entscheidung F03 und reale Audio-/Klaviaturtests auf Web, iOS und Android sind offen. Es gibt keine Kursfreigabe oder PR durch Codex.
