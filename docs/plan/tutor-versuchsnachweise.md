# Tutor: serverseitige Versuchsnachweise (E2)

Stand: 31.10.2026. Technische Nacharbeit auf Nutzerauftrag nach Integration von #103–#132. Arbeitsbranch `codex/tutor-verified-attempts`, Basis `f7bc15d` auf `main`. [ADR 0066](../decisions/0066-tutor-erklaerungen-mit-serverseitigem-versuchsnachweis.md). Technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**. Alle Inhalte bleiben Entwurf; keine Veröffentlichung oder entfernte Bereitstellung.

## Ablauf

1. Die App übernimmt nach „Prüfen“ die tatsächlich bewertete Antwort und versionierte Quelle in den Aufgaben-Tutor.
2. Beim Anfordern einer Erklärung/Lösung sendet sie Quelle und Antwort an `POST /tutor?view=attempt`. Dieser authentifiziert das Konto, rekonstruiert die Aufgabe und prüft die Antwort mit der Engine.
3. Nur ein gültiges Antwortformat erhält einen signierten, 30 Minuten gültigen Nachweis. Falsche Antworten sind zulässig; eine bloße Behauptung wie `correct` oder `checked` ersetzt die Wertung nicht. Es werden weder Lösung noch Wertung an dieser Schnittstelle ausgegeben.
4. Die eigentliche Tutor-Anfrage enthält `attemptProof`. Der Server prüft die Bindung an Konto, Quelle und genaue Antwort vor jeder neuen Modellreservierung. Ein passender Nachweis hebt keine Inhalts-/Entwurfssperre auf.
5. Hinweise und Chat verwenden weiterhin ihren begrenzten lösungsfreien Kontext. Die feste Lösung in der Aufgabe bleibt ohne KI verfügbar. Die zusätzliche KI-Lösung wird nach einer geprüften Antwort angeboten.

## Fehler, Wiederholung und Datenschutz

- Fehlender Nachweis: HTTP 409 `attempt_required`. Manipulation oder fremdes Konto: `attempt_invalid`. Ablauf: `attempt_expired`. DE/en-US/en-GB verwenden verständliche Hinweise.
- Identische bereits gespeicherte Anfragen dürfen nach Ablauf abgerufen werden, nur mit passendem Besitz, vollständigem Anfragehash und Signatur. Neue Anfragen müssen einen aktuellen Nachweis verwenden. Bereits vorhandene Gesprächsverläufe bleiben kontogeschützt lesbar.
- Offline oder ohne erfolgreichen Prüfaufruf startet kein Modell. Der bisherige lokale Lernablauf und dessen Feedback bleiben erhalten. Ein erneutes Senden kann einen neuen Nachweis holen; die Wiederholung einer bereits vorbereiteten Modellanfrage behält ihre ID und Signatur.
- Kontowechsel und Abbruch während der Prüfung verhindern einen verspäteten Modellaufruf. Nachweise liegen nur im flüchtigen Tutor-Zustand. Keine neue Antworttabelle, keine Migration und keine Änderung an XP, Ratings oder Lernnachweisen.
- Der Nachweis bestätigt die Serverwertung einer eingesandten Antwort, keine menschliche Bearbeitung oder bereits früher erfolgte Offline-Wertung. Das Signaturgeheimnis bleibt ausschließlich serverseitig. Nachweis und Konto-ID gehen nicht in den Modellkontext.

## Prüfstand

- 7 Signatur-/Bindungs-/Ablauftests mit echter Web-Crypto und beide geschützten Modi.
- 9 Inhalts-/Protokoll-/Versionsprüfungen in zwei Dateien.
- 32 gezielte App-Tests in Tutor und Aufgabenroute: erlaubte und abgewiesene Anfragen, Wiederholung, Kontowechsel, Abbruch, alte Lösungsdialoge und der Übergang von festen Hinweisen zur geprüften KI-Lösung.
- 281 Werkzeugtests und 1.266 Tutor-/SDK-/Engine-Prüfungen mit ausschließlich simuliertem Anbieter erfolgreich.
- KI-Verordnungsinventar mit zehn ungeprüften Bereichen und 251 gebundenen Dateien, weiterhin 20 offenen allgemeinen Nachweisen; neue Signaturprüfung und tatsächliche UI-/Client-Einstiege sind gebunden. Daraus entsteht keine Rechtsfreigabe.
- Vollständige Typprüfung, Lint/Paketgraph, Formatierung, Übersetzungsprüfung und `git diff --check` erfolgreich. Ein erster Lintlauf fand zwei unsichere Zugriffe in einem neuen Test; nach der Typisierung sind auch diese und der vollständige Nachlauf erfolgreich. Der abschließende GitHub-Nachweis wird im PR festgehalten.
- `tools/test-tutor.mjs` prüft echte lokale Authentifizierung, Nachweisausgabe, Kontentrennung, manipulierte Quelle/Antwort/Signatur, Ablauf, Nichtverbrauch des KI-Kontingents und weiterhin gesperrte Entwurfsquellen. Ein tatsächlicher lokaler Stackstart wurde versucht und nach verweigertem Image-Zugriff abgebrochen (`registry_access_denied`). Deshalb wurden die neuen HTTP-/DB-Fälle hier nicht lokal ausgeführt. Der GitHub-Nachweis wird im PR dokumentiert; reine Unit-Tests sind kein Datenbanknachweis.

Kein reales Tutor-Modell aufgerufen. Fach-/Literatur-, Rechts- und echte Geräteabnahmen bleiben offen. Prompt/Werkzeuge 5/3, Inhaltsversion 27; P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.
