# P2.15 – Tutor-Backend

Stand: 14.10.2026. Technisch umgesetzt auf `codex/p2-15-tutor-backend`, Ausgangspunkt `3ef8db04` (P2.14). Claude Code bleibt für Review und Merge zuständig. Vergleich: [P2.14 → P2.15](https://github.com/PhiFa96/harmonia/compare/codex/p2-14-motivation-reminders...codex/p2-15-tutor-backend?expand=1). Entscheidung: [ADR 0015](../decisions/0015-tutor-backend-und-kostenreservierung.md).

Die technische Umsetzung ist geprüft. **Die Live-Abnahme mit Anthropic und echte Kosten pro Antwort sind noch offen**, weil `ANTHROPIC_API_KEY`, ein offiziell geprüftes aktuelles Modell und dessen Tarif nicht gebunden sind. Der gespeicherte Umgebungsentwurf bereitet die Schlüsselbindung an `api.anthropic.com` und die Dokumentationsdomains vor; er wurde hier nicht veröffentlicht. Simulationskosten werden ausdrücklich als solche ausgewiesen. P2.15 ist damit noch nicht vollständig nach seiner Live-Definition-of-Done abgenommen.

## Funktion und bestehendes Design

Der Server kann textliche Fragen mit gestreamter Antwort und Engine-Werkzeugen bearbeiten. Vier Modi trennen freie Frage, Hinweis 1–2, Erklärung einer gewerteten Antwort und ausdrücklich verlangte Lösung. Ein Dialog verwendet einen festen Aufgaben-/Sprach-/Hilfekontext. Historie, inkrementelles Nachladen, Seitenweise-Dialogliste, Löschung und Kontingentstatus sind vorhanden. Es werden keine Profilnamen oder E-Mail-Felder aus Auth/Profilen an das Modell geschickt. Erkennbare E-Mail-Muster in Freitext werden redigiert.

Bestehende Screens, Tokens, Farben, Feedbackkarten, Hinweisleiter, XP, Münzen und Bestehensregel bleiben erhalten. Diese Änderung enthält die Backend-Grundlage; die inzwischen technisch umgesetzte Chat-Oberfläche mit Notenwiedergabe, „Warum?“, KI-Hinweisen und Meldungen ist in [P2.17](tutor-oberflaeche.md) beschrieben. Die anschließend technisch umgesetzte Bibliothek mit belegbaren Artikelzitaten und verifizierter Artikelroute ist in [P2.16](wissensbasis.md) beschrieben. Der Kurs bleibt Version 13 mit 29 Einheiten, 90 Fähigkeiten, 85 Entwurfslektionen und 19 Übungstypen. Öffentliche Auslieferung enthält weiterhin keine Entwurfslektionen; freie Übungssätze können ihren Tutor-Kontext liefern.

## Umsetzung und Vertrag

- `packages/content/src/tutor.ts`: strenge Anfrage-, Policy-, Tarif-, Nutzungs- und Werkzeugschemas sowie Versionen.
- `supabase/functions/_shared/tutor-{tools,prompt,provider,runtime}.ts`: Engine-Adapter, pädagogischer Prompt, Glossar DE/US/UK, SDK-Transport und begrenzter Werkzeugdialog.
- `supabase/functions/tutor/index.ts`: JWT-Prüfung, Zulassung, SSE, Verlauf, Kontingentstatus und Löschung.
- `20261014010000_tutor.sql`: sechs RLS-geschützte Tabellen (`tutor_policy`, `entitlements`, `tutor_conversations`, `tutor_messages`, `tutor_requests`, `ai_usage`), private RPCs und automatisch steigende Policy-Revision.
- `TutorModelProvider` erlaubt einen ersetzten Transport. Produktion verwendet ausschließlich die feste Anthropic-Adresse. SDK-Version und Deno-/TypeScript-Auflösung sind gepinnt.

`POST /functions/v1/tutor` verlangt Bearer-JWT eines nicht anonymen Kontos. Keine Clientsystemnachrichten, Clienthistorie, Abobehauptung, Tokenpreise oder Benutzer-ID sind erlaubt. Alle Felder des folgenden Objekts sind erforderlich; leere Kontextfelder sind ausdrücklich `null`:

```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "conversationId": "22222222-2222-4222-8222-222222222222",
  "message": "Erkläre den Unterschied zwischen großer Terz und verminderter Quarte.",
  "locale": "de",
  "noteNaming": "de",
  "mode": "chat",
  "hintLevel": null,
  "context": null
}
```

Neue UUID für eine neue Frage, gleiche UUID und gleicher Inhalt für einen Übertragungsretry. Für Fortsetzung bleibt `conversationId` gleich. `locale` ist `de`, `en-US` oder `en-GB`; `noteNaming` ist `de` oder `intl`. `hint` verlangt Stufe 1 oder 2; andere Modi verlangen `hintLevel: null`. `hint`, `explain` und `solution` verlangen `context: {source, answer, checked}`. `source` verwendet die bestehende kanonische Quelle der Inhaltsmeldungen (Übungssatz, Lektion oder Einstufung). `explain` verlangt eine übergebene Antwort und berechnet ihre Bewertung serverseitig. Das boolesche `checked` bleibt UI-Metadaten im bestehenden Format und ist kein Nachweis einer früheren Wertung. Veraltete oder nicht veröffentlichte Quellen sind `422 content`. Die Function schreibt keine Lernnachweise und vergibt keine Belohnungen.

### Serverkontext: Weiterbau vom 26.10.2026

Auf `codex/p4-10-tutor-context-draft` wird die P4.10-Nacharbeit zum Clientfeld `checked` umgesetzt, aufbauend auf dem offenen Entwurfs-PR #124 mit fünf erfolgreichen CI-Jobs. Dies ist technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**, ohne Bereitstellung.

Der neue Erklärkontext ist für dieselbe Antwort bei `checked: false` und `checked: true` identisch: Quelle/Version/Seed werden rekonstruiert, die Antwort wird mit der Engine ausgewertet. Dies ist eine aktuelle Serverwertung, keine Bestätigung eines früheren lokalen Klicks. Hinweis-/Chatkontexte geben unabhängig vom Clientfeld keine Bewertungsdaten oder versteckten Hörbeschreibungen frei. Bereits als Frage sichtbares Material von `RHYTHM_TAP`/`LISTENING_CHOICE` behält seine bisherige Serverbeschreibung; die App verwendet im Chat die bisherige konservative Hinweis-Notenanzeige. Das SATB-Werkzeug bleibt in Hinweis/Chat gesperrt.

Sieben Request-/Scope-/Versionsprüfungen, zwölf App-Tests, 930 simulierte Tutor-/SDK-/Engine-Prüfungen unter Deno und 265 Werkzeugtests sind erfolgreich. Die Deno-Probe vergleicht alle 28 aktuellen Aufgabentypen in DE/en-US/en-GB und rekonstruiert alle 36 P4.10-Erst-/Wiederholungsquellen ohne behauptete Client-Wertung. Der erweiterte authentifizierte Supabase-HTTP-Test ist Teil der neuen CI und wurde lokal in diesem Schritt nicht erneut ausgeführt. Typecheck, Lint/Paketgraph sowie Sprach-/Inhalts- und Formatprüfung sind erfolgreich.

Prompttext/-version 5, Toolargumente/-version 3 und Katalogversion 24 bleiben unverändert; keine Migration. Frühere Texte und gespeicherte Replays werden nicht nachträglich bereinigt. Keine neue Lernstands-, XP- oder Freigabewirkung. Reale Modell-/Kosten-, Fach-, Rechts- und Geräteabnahmen bleiben offen. P4.01 bleibt bis F14/Rechtsklärung zurückgestellt. [ADR 0057](../decisions/0057-tutor-kontext-nach-modus-und-serverwertung.md).

SSE besteht aus benannten `event:`-/`data:`-Blöcken mit jeweils einem JSON-Objekt. Reihenfolge: `meta`, Text-/Werkzeug-/Beispiel-/Hinweisereignisse, `usage`, `done`. `text` enthält sichere Textteile; `tool` enthält nur Name/ID/Erfolg, keine Rohparameter. `example` trägt ein geprüftes Originalbeispiel mit Quelle, BPM, Score und Timeline. Nur dieses Ereignis darf P2.17 zeichnen/abspielen; Text-Makros `[[notes:…]]` werden auch über Chunk-Grenzen entfernt. `notice` enthält einen Fehler-/Ablehnungscode. `usage` enthält tatsächliche gemeldete Token und tarifgebundene Kosten oder eine gekennzeichnete Schätzung. `done` folgt erst nach Speicherung. Bei Speicherfehler kommt `error` mit der ursprünglichen Retry-ID. Ein Retry eines abgeschlossenen Dialogs liefert `replay` mit gespeicherten Text-/Beispieldaten und Nutzung, danach `done`, ohne neue Modellanfrage. Ein zuvor abgelaufener Vorgang kann erst `409 recovered` und beim erneuten selben Retry seinen konservativ abgeschlossenen Datensatz liefern.

`GET /functions/v1/tutor` liefert höchstens 20 eigene Dialoge plus `next`-UUID. `?before=<next>` setzt die Liste fort. `?conversationId=<uuid>` liefert höchstens 100 Nachrichten plus einen nächsten Nachrichten-Cursor; `&after=<id>` lädt weiter. Fremde/fehlende Dialoge sind gleichermaßen `404`. `GET ?view=status` liefert UTC-Tag, Resetzeit, Abo-Stufe, verwendete/erlaubte/verbleibende Anfragen und `availability`. Es gibt keine fremden oder globalen Nutzungszahlen im Client.

`DELETE ?conversationId=<uuid>` entfernt eigene Texte, Kontext, Nachrichten und gespeicherte Antwortkopien. Bereits entstandene Nutzung bleibt bis zur Kontolöschung erhalten. Die ursprüngliche Anfrage-ID kann danach keine Antwort wiederherstellen (`410 deleted`). Auch ein laufender Modellaufruf legt den Dialog beim späteren Abschluss nicht wieder an.

Fehler vor SSE: `400` Form/JSON, `401` Anmeldung, `403 subscription`, `409` Konflikt/geänderter Kontext/laufende Anfrage, `410` gelöscht, `413` Körper über 128 KiB, `422 content`, `429` Tageskontingent/Minutenlimit/Budget, `503` fehlende oder unbrauchbare Serverbindung. Fehlertexte der zukünftigen Oberfläche werden in P2.17 lokalisiert; Vendor-Rohfehler und Schlüssel werden nicht übertragen. Beim Schreiben von Client-SSE-Ausgaben HTML deaktivieren; Text ist kein Noten- oder HTML-Renderer.

## Fachliche und betriebliche Grenzen

Werkzeuge (Stand P2.15; seit P3.18 kommen `get_learner_summary` und `analyze_progression` hinzu, insgesamt zehn, siehe [tutor-lernplaner.md](tutor-lernplaner.md)): `analyze_interval`, `build_interval`, `build_scale`, `key_signature`, `identify_chord`, `build_chord`, `get_exercise_context`, `render_example`. Sie unterstützen den tatsächlichen Engine-Stand, insbesondere vier Dreiklangarten und deren drei Lagen. Kein Septakkord-/Stimmführungs-/achtstimmiger Satzprüfer wird vorgetäuscht. Allgemeine Musikfragen bleiben möglich, aber Quellen und Modellprosa sind ohne P2.16/P2.18 noch nicht fachlich abgenommen.

Notenbeispiele sind höchstens acht Takte, 128 Klänge und 60 Sekunden lang, einstimmig auf einem System. Zwei Systeme erlauben nur den bestehenden einfachen Violin-/Bassschlüssel-Einstieg. Taktfüllung, Haltebögen und MIDI-Umfang sind geprüft. Inhaltliche Aussagen über Intervalle/Akkorde müssen zusätzlich auf den entsprechenden Werkzeugdaten beruhen; ein strukturell gültiges Notenbild allein belegt keine solche Aussage.

Die Policy startet ausgeschaltet, Modell/Tarif sind `null`. Free hat zunächst keinen Texttutor; Premium und Max verwenden serverseitige aktive, nicht abgelaufene Entitlements. Die gespeicherten Kontingente sind technische Startgrenzen, noch keine Launch-Entscheidung. Token-/Rundenreservierung muss zum gewählten Modelltarif und Tagesbudget passen; bei einem zu kleinen Budget wird keine Modellanfrage gestartet. Ein UTC-Tag zählt nach Zulassung, unabhängig von Clientzeit. Bei Fehler ohne abschließende Tokenabrechnung wird vorsichtshalber die vollständige Reservierung als Schätzung verbraucht. Bei erfolgreichem Abschluss zählen alle Modellrunden einschließlich Cache-Lesen und -Schreiben genau einmal.

Verlauf verwendet maximal zehn vollständige frühere Frage-/Antwortpaare; bei zu großer Eingabe fallen die ältesten vollständigen Paare weg. Fehler-/Abbruchantworten dienen nicht als Sprachmodellvorbild. SDK-Aufrufe haben keine automatischen Retries. Ausgabetoken, Werkzeuganzahl, Runden und Gesamtdauer sind begrenzt. Private REST-/Auth-Aufrufe haben ebenfalls ein Zeitlimit. Lease-Recovery begrenzt jede Bereinigung auf 100 veraltete Vorgänge. Die Volltext-Wissenssuche wurde anschließend in P2.16 technisch ergänzt; finale Kontingente und RevenueCat-Anbindung bleiben P2.18/P2.19.

## Prüfung und reproduzierbarer Einstieg

Die bestehende lokale Datenbank wurde additiv migriert; keine Nutzerdatenbank wurde zurückgesetzt. Die Migrationenkette und pgTAP wurden zusätzlich in einer neu angelegten, leeren temporären Projektdatenbank mit datenfreier Auth-Struktur geprüft. Diese Testdatenbank wurde anschließend entfernt.

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm check:deno
pnpm check:i18n
pnpm check:content
pnpm check:curriculum
pnpm db:lint
pnpm db:test
# In einem separaten Terminal, ausschließlich lokaler Test:
pnpm db:serve:learning --tutor-test
pnpm db:test:tutor
# Öffentliche Inhaltsgrenze: Vorschau stoppen, dann
node tools/serve-local-learning.mjs --published --tutor-test
node tools/test-tutor.mjs --published
```

Geprüft: 2742 bestehende/ergänzte Paket-, App- und Tooltests, 206 zusätzliche Deno-Tutor-/SDK-/Engine-Prüfungen mit allen 19 Übungstypen und drei Sprachen, 181 pgTAP-Prüfungen insgesamt und jeweils 122 echte lokale Auth-/REST-/Edge-API-Prüfungen mit interner sowie öffentlicher Inhaltsbindung. Die API-Simulation prüft denselben SDK-SSE-Parser, Engine-Aufrufe, mehrfache Modellrunden, echte Datenbankbuchung, Aboablauf, Kontotrennung, Tarifrevision, Konkurrenz, Retry, Refusal, Fehler, Timeout, Löschrennen und Cursor. Testkonto/-konfiguration werden aufgeräumt beziehungsweise wiederhergestellt. Produktions-Web-Build und tatsächlicher öffentlicher Export sind geprüft; keine ungeprüften Katalogdaten oder Anthropic-SDK-Testbindung gelangen in den App-Export.

Die einzige anfängliche Gesamt-Testabweichung war ein Zeitlimit einer vorhandenen umfangreichen Akkord-Seedprüfung bei gleichzeitigem Web-Build. Der anschließende vollständige Lauf besteht ohne geänderte Testgrenzen. CI enthält Deno-Tutorprüfungen, RLS, lokale Integration und öffentliche Inhaltsgrenze; echte Anthropic-Kosten werden dort nicht automatisch ausgelöst.

## Echte Anthropic-Abnahme

1. Sicheren `ANTHROPIC_API_KEY` in der Cloud-Umgebung binden und den gespeicherten Entwurf veröffentlichen. Die Bindung beschränkt den Schlüssel auf `api.anthropic.com`; offizielle Dokumentationsdomains werden separat erlaubt. Schlüssel nicht in Chat, Repo, Argumente oder Logdateien schreiben.
2. Das aktuelle Frontier-Modell und dessen Eingabe-/Ausgabe-/Cachepreise aus offiziellen Anthropic-Unterlagen prüfen. `HARMONIA_TUTOR_MODEL` enthält die geprüfte ID; `HARMONIA_TUTOR_TARIFF` das nicht geheime JSON mit `version`, `source`, `verifiedAt`, `input`, `output`, `cacheRead`, `cacheWrite5m`, `cacheWrite1h`, jeweils ganzzahlige Nano-USD pro Token. Kein in dieser Änderung verwendeter Testtarif ist ein Live-Tarif.
3. `pnpm check:tutor:live` manuell ausführen. Acht eigene Fragen prüfen die vorgesehenen Werkzeuge mit dem echten SDK-Transport und geben Antwort, Token, Cache-Nutzung und Kosten pro Antwort als JSON-Zeilen aus. Die fachliche Prosa ist anschließend zu prüfen. Ohne vollständige Bindung stoppt der Test vor jedem API-Aufruf; dieser Vorabbruch ist hier nachgewiesen.
4. Für Live-Edge-Betrieb Modell/Tarif und passende Budgets in der privaten Policy setzen, dann freigeben. Lokales Live-Serving kann `node tools/serve-local-learning.mjs --tutor-live` verwenden; Docker bindet nur den Umgebungsnamen des Schlüssels. Remote-Functions/Secrets und echte Billing-Webhooks sind hier nicht bereitgestellt.

Die Mindest-Liveprüfung aus P2.15 bleibt offen, bis diese tatsächlichen Antworten und Kosten vorliegen. P2.16/P2.17 sind anschließend technisch umgesetzt; nächster technischer Planpunkt ist **P2.18 – Tutor-Testkatalog und Kalibrierung**. Die Live-Abnahme bleibt in allen Übergaben sichtbar.

## Nachprüfung P2.15–P2.18 (16.10.2026, Claude)

Code-Review nach der direkten Integration; behoben und mit Tests abgesichert:

- **Lösungsfreier Kontext bei Hörfragen:** `get_exercise_context` lieferte im Hinweis-/Chatmodus vor der Wertung die Notenpositionen von `INTERVAL_IDENTIFY_AURAL` und auditivem `CHORD_IDENTIFY`. Daraus ließ sich die Lösung ableiten, obwohl die App das Notenbild verbirgt. Die Beschreibung entfällt dort jetzt wie in der App; `RHYTHM_TAP` und `LISTENING_CHOICE` bleiben unverändert.
- **Kein Freitext im vertrauenswürdigen Aufgabenblock:** Im Erklärmodus erscheint die Nutzerantwort nur noch als engine-gültige Antwort-ID; ungültige Eingaben werden als `answer: null`/`answerValid: false` übergeben.
- **Prompt-Version in der Datenbank:** Neue Anfragen trugen trotz Prompt v3 den Spaltenstandard 2. Migration `20261016040000_tutor_prompt_v3.sql` setzt 3; ein Vitest vergleicht künftig `TUTOR_PROMPT_VERSION` mit dem letzten Migrationsstandard.
- **Deutsche Oktavnamen:** Werkzeugergebnisse zeigten deutsche Buchstaben mit wissenschaftlicher Oktavzahl („H4“, „B4“ für B♭4), was mit der internationalen Schreibweise kollidiert. Sie folgen jetzt wie die App Helmholtz (h¹ = B4). Der Prompt-v3-Text nennt diese Regel; „eight-part scoring“ heißt jetzt „multi-part writing“. v3 wurde nie bereitgestellt oder echt kalibriert, deshalb bleibt die Versionsnummer.
- **Testkatalog/Auswertung:** Die 98-%-Annahmequote gilt jetzt wie in ADR 0018 auch je Sprache und Rolle. Falsche Beispielantworten für Akkord-/Tonleiterschreiben vertauschen nicht mehr den fest vorgegebenen ersten Ton (beim Akkord war das sogar derselbe Klang), sondern lassen ein Vorzeichen weg. Der Katalog wurde neu erzeugt; alle Fälle bleiben Entwurf.
