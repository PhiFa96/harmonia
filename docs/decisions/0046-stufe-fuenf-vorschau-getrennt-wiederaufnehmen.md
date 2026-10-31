# ADR 0046 – Stufe-5-Vorschau getrennt wiederaufnehmen

Datum: 25.10.2026 · Status: angenommen für interne technische Vorarbeit

## Ausgangspunkt

Der Stufe-5-Entwurf aus #103 war nur im Arbeitsspeicher spielbar. Reload beendete die Prüfung, und der Branch enthielt die spätere Schul-/Zertifikats-/Rechtsvorbereitung noch nicht. Ein wiederaufnehmbarer Entwurfsdurchgang darf keine Lernnachweise, XP oder fachliche Freigabe vortäuschen.

## Entscheidung

- `codex/p4-19-preview-resume-draft` führt die offenen Entwurfsstände #103 und #110 lokal zusammen. Keine Integration auf `main`, Bereitstellung oder Veröffentlichung.
- Genau ein eigener Vorschau-Durchgang je Konto oder Gast wird unter dem getrennten Schlüssel `preview:<scope>` in der vorhandenen lokalen `learning_meta` gespeichert. Keine zusätzliche Datenbank oder produktive Migration. Normale Lektionsentwürfe, Ereignisse, FSRS, Ratings, XP und Synchronisation verwenden diesen Schlüssel nicht; Gastübernahme kopiert ihn nicht in ein Konto.
- Das gespeicherte Schema enthält Seed, Einführungsposition, Auswahl und begrenztes Aktionsprotokoll. Quellenkennung aus der aufgelösten Lektion, Katalogversion und `engineVersion: 1` binden die Wiedergabe an ihren definierten Stand. Beim Laden werden Aufgaben und Wertung aus Originalantworten rekonstruiert. Unbekannte Felder und ungültige Übergänge werden abgewiesen; Punktzahlen oder fertige Aufgaben werden nicht übernommen.
- Dies ist keine automatische Hashbindung des mobilen Programmcodes. Änderungen der Wiedergabesemantik müssen die Engine-/Schema-Version erhöhen. Quellen- und Katalogänderungen sperren den alten Entwurf; beschädigte/veraltete Stände bleiben bis zum Verwerfen oder zur lokalen Aufbewahrungsgrenze sichtbar gesperrt.
- Schreiben und Verwerfen vergleichen den zuletzt gelesenen vollständigen Speicherwert innerhalb der bestehenden SQLite-Transaktionswarteschlange. Ein zweiter Tab darf den neueren Stand nicht still überschreiben oder löschen. Erst nach bestätigtem Speichern zeigt die Vorschau einen geänderten Ablaufstand. Speicherfehler erfordern Neuladen; ein verlorener ACK kann dabei nachgeholt werden.
- Die Anzeige wird bei Besitzer-/Speichermoduswechsel neu aufgebaut. Verzögerte Schreibvorgänge behalten ihren ursprünglichen Besitzer. Die bestehende Löschsperre wird innerhalb der Schreibtransaktion erneut geprüft.
- Ohne dauerhaften Speicher bleibt die Vorschau ausschließlich im getrennten Arbeitsspeicher je Besitzer und zeigt diese Grenze an.
- Interne Aufbewahrungsregel: höchstens sieben Tage ab Erstellung, auch ohne Netzwerk. Zugriff, lokale Aufbewahrung und Export bereinigen abgelaufene Stände. Lokaler Datenschutzexport enthält den eigenen Vorschau-Datensatz; Kontolöschung entfernt ihn und blockiert späte erneute Writes. Keine gesetzlich behauptete Siebentagesfrist.
- DE/en-US/en-GB-Texte erklären Fortsetzen, Verwerfen, Speichergrenzen, Inhaltswechsel und Konflikte. Der Produktionskatalog bleibt leer; interne Inhalte und neue Vorschautexte bleiben durch die bestehende Buildauswahl und Bundle-Prüfung ausgeschlossen.
- P4.17 erfasst den konkreten Kontrapunkt-/Analysezweck als zehnten ungeprüften Funktionsbereich einschließlich mobiler Vorschau und Speicher-/Datenschutzpfaden.

## Grenzen

Eine lokale Antwortrekonstruktion ist keine Identitäts-, Fach- oder Prüfungsaufsicht. Die neun Kontrapunktregeln bleiben ein begrenztes Lehrprofil. Die Aufbewahrungsbereinigung läuft beim nächsten lokalen Zugriff, nicht bei ausgeschaltetem Gerät. Native iOS-/Android-, Geräte-/Audio- und unabhängige Fachprüfungen bleiben offen.

Diese Umsetzung ist ausdrücklich technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**. P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt. Es entstehen keine gültigen Zertifikate oder rechtlichen Freigaben.
