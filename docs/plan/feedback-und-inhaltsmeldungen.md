# P2.13 – Feedback, Erklärungen und Inhaltsmeldungen

Stand: 13.10.2026. Technisch umgesetzt auf dem Review-Branch; Claude Code bleibt für fachlichen Review und Merge zuständig. Entscheidung: [ADR 0013](../decisions/0013-inhaltsmeldungen-mit-gastwarteschlange.md).

## Funktion und Design

Alle 19 Übungstypen liefern Engine-Erklärungen und die feste Hinweisleiter in DE/US/UK. Feedback nennt das Ergebnis mit Text und Symbol. Die Aufgabenquelle bleibt sichtbar; Schreibaufgaben zeigen weiterhin die korrekte Lösung neben der gesperrten Eingabe. Verborgene Notation bei Oktavnamen und Namen-zu-Tasten-Aufgaben wird nach der Bewertung oder Hinweis 3 ergänzt. Hörfragen verraten die Quellnotation weiterhin erst zur Lösung. Der Pulseinstieg behält die Zahlendarstellung. Vergleichsaufgaben behalten alle Hörclips; die unvollständige Rhythmuskontur wird nicht zum vollständigen Hörbeispiel erklärt.

Musikalische Kontextfragen erhalten Quellenklang mit ihren tatsächlichen Dauern, Stimmen und Haltebögen. Tonartquellen und Vorzeichnungen erhalten ein benanntes Tonleiterbeispiel in Dur oder natürlichem Moll. Das Beispiel erklärt die Tonart, ersetzt aber keine falsche Eingabe durch eine gehörte Lösung. Wissens-, Zuordnungs-, Reihenfolge- und Dokumentfragen verwenden ihre vollständigen Textlösungen; dokumentarische Quellen bekommen kein künstliches Notenbild oder Audio. KI-Hinweise bleiben P2.18.

„Fehler melden“ steht vor und nach Bewertung in Lektion, Fehlerwiederholung, Einstufung, freiem Üben und Onboarding-Mini-Aufgabe. Das Formular zeigt die festgehaltene Frage, sieben auswählbare Bereiche und ein optionales Textfeld. Die Zurück-Aktion bringt dieselbe Aufgabe mit Auswahl, Hinweisen und bereits vorhandenem Feedback zurück. Der Meldeweg selbst ändert den Lernstand nicht. Navigation stoppt Wiedergabe und unvollständige Rhythmusaufnahme. Die Melderoute ist auch vor Abschluss des Onboardings verfügbar; der Erststart führt weiterhin zum Onboarding.

Gastmeldungen werden gemäß Nutzerentscheidung lokal gespeichert und bei der nächsten Anmeldung dem angemeldeten Konto zugeordnet und gesendet. Netzfehler sind wiederholbar. Das Profil zeigt ausstehende und gesendete Meldungen mit Versandfehler und Wiederholen. Nicht mehr rekonstruierbare Quellen bleiben lokal sichtbar. Explizite vorübergehende Sitzungen nennen, dass Meldungen beim Schließen verloren gehen und nicht gesendet werden.

## Technischer Vertrag

- `packages/content/src/content-reports.ts`: strikte Größen-/Quellschemas, kanonische Rekonstruktion und Engine-Kontext. Lektionen: ID, Inhaltsversion, optionaler Mischplan, Seed, Runde und ursprünglicher Aufgabenindex. Einstufung: Bankversion, Seed, zulässige Aktionen. Freie Sätze und Mini: Satz, Inhaltsversion 1, Seed und Index.
- `packages/exercises/src/practice.ts`: gemeinsame bisherige sechs freie Sätze und identische Mini-Aufgabe; keine Änderung ihrer RNG-Reihenfolge. `lessonReviewItem` rekonstruiert die kanonische Fehlervariante. `feedbackMedia` liefert ausschließlich passende ergänzende Medien.
- Separate `harmonia-reports.db`, lokale Version 1: `content_report_outbox` mit Scope, stabiler UUID, schema-geprüfter Meldung und Versandzustand. Speicherung, Gastübernahme und exakte ID-/Payload-Bestätigung verwenden serialisierte Transaktionen. Unbekannte Datenbankversionen und beschädigte Daten werden nicht überschrieben.
- Controller und Lifecycle starten auch während des Onboardings. Auth-/Besitzergeneration verhindert fremde Formulare und Listen bei Kontoänderungen. Ein laufender Upload bewahrt seine ursprüngliche Konto-/Tokenzuordnung; seine Bestätigung wird dort gespeichert.
- `content-reports`: explizit verifiziertes Auth-JWT, keine Gast-/anonyme Sitzung, höchstens zehn Meldungen pro Anfrage, Größenlimits und strikte Felder. Rekonstruiert Items und bewertet gemeldete Eingaben selbst; clientseitige Richtig-/Status-/User-ID-Felder sind unzulässig. Verfügbare Meldungen werden unabhängig von veralteten Quellen verarbeitet.
- Migration `20261013030000_content_reports.sql`: Tabelle, eigenes Lesen per RLS, service-only Append-RPC, eindeutige Konto-/Client-ID und serverseitiger Anfangsstatus `new`. Account-Löschung entfernt die zugehörigen Meldungen. Kein XP-/Lernpfadzugriff des Meldewegs.
- `pnpm db:serve:learning` startet jetzt beide lokalen Funktionen mit derselben Proxy-/CA-Unterstützung. Die öffentliche Konfiguration bleibt ohne Entwurfsvorschau. CI prüft beide Functions und die lokale Meldungsintegration in Vorschau und öffentlichem Modus.

Die Formulardaten vor dem Speichern liegen nur im laufenden Formular. Nach Beginn eines Speicherversuchs bleibt die Einreichung für Retry unverändert. Erst lokal gespeicherte Meldungen überleben einen Neustart. Gesendete Meldungen werden auf diesem Gerät quittiert; ein serverseitiger Review-Status wird in P2.13 nicht zurückgeladen.

## Lokal prüfen

```sh
pnpm db:start
pnpm exec supabase migration up --local
pnpm db:serve:learning
# Zweites Terminal:
pnpm db:test:reports
pnpm db:test:learning
pnpm db:test
pnpm db:lint
```

`node tools/serve-local-learning.mjs --published` und `node tools/test-content-reports.mjs --published` prüfen öffentlich verfügbare freie Aufgaben und verweigerte Entwurfskurse. Nur die eigene lokale Migration wird additiv angewendet; keine Remote-Bereitstellung und kein Datenbank-Reset sind Teil dieser Übergabe.

## Review und Grenzen

Claude kann für den fachlichen Inhaltsreview nach `status='new'` und `received_at` filtern. `content_id`/`content_version`, die Originalanfrage und der kanonische Snapshot zeigen die gemeldete Variante einschließlich Antwort, Hinweisen und Sprache. Statuswechsel bleiben einem vertrauenswürdigen Review vorbehalten; die App enthält kein Adminwerkzeug. Regelmäßige fachliche Sichtung ist eine Betriebsaufgabe, kein automatischer Abschluss von P2.13.

Alle Kursinhalte bleiben Entwurf; öffentliche Auslieferung und echte iOS-/Android-Geräteabnahme bleiben wie zuvor getrennt. Produktive Migration/Function-Bereitstellung erfolgt nach dem Review. Nächster Planpunkt: **P2.14 – Streaks, XP, Tagesziel, Erinnerungen**.

## Prüfstand

**2693 Paket-, App- und Tooltests** bestehen, darunter 391 App-Tests in 43 Suiten. Die kanonische Rekonstruktion aller 85 Mischpläne, der freien Sätze, Mini-Aufgabe, Fehlerwiederholung und adaptiver Einstufungsfragen ist geprüft. Feedback und drei Hinweise decken alle 19 Typen in DE/US/UK ab. 23 zusätzliche Medienprüfungen prüfen unter anderem alle Kontextthemen, Quellidentität, Haltebögen und die hörbaren Tonfolgen. Echte SQLite prüft Gastübernahme, Kontotrennung, Idempotenz, fremde/unvollständige Bestätigungen, defekte Daten und nicht verfügbare Quellen. Controllerprüfungen decken Netzfehler und verspätete Übertragungen beim Kontowechsel ab. Die gezielte Prüfung von Formular und Controller mit `--detectOpenHandles` endet ohne offene Handles.

92 pgTAP-Prüfungen und DB-Lint bestehen. Zwei echte lokale Konten prüfen die Meldungs-Function einschließlich eigener Leserechte, gesperrter direkter Writes/Statusänderungen, paralleler Wiederholungen, Batch-Konflikten und fehlender XP. Beide Functions sind in öffentlichem Modus geprüft: freie Quellen bleiben meldbar, Entwurfskurse werden verweigert. Die bestehende Lernpfad-/XP-Integration mit 226 Offline-Nachweisen, Paging und zwei Geräten besteht weiterhin. Deno prüft beide Functions und die bestehende Engine-/Katalogstrecke mit 170 Prüfpunkten.

Im echten Chromium-Webexport sind 390-px-Touch und Dunkelmodus, Meldungen in der Mini-Aufgabe sowie vor/nach Lektionsbewertung, Rückkehr mit derselben Antwort und Hinweisstufe, kaltes SQLite-Laden, drei Gastmeldungen, echte lokale E-Mail-Code-Anmeldung, Netzfehler und Nachversand, Kontowechsel und fehlende XP-Gutschrift geprüft. Der öffentliche Browserexport startet korrekt mit Onboarding und verweigert direkte Entwurfslektionen. Web/iOS/Android exportieren sowohl Vorschau als auch Produktion; der tatsächliche Produktions-Webexport ist auf Entwurfs-IDs und -texte geprüft. Lint/Paketgraph, Typen, Übersetzungen, Inhalts-/Curriculumprüfung und Format bestehen. Native Exports ersetzen weiterhin keine Geräteabnahme.
