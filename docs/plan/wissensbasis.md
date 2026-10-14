# P2.16 – Wissensbasis v1

## Stand und Verhalten

Technisch umgesetzt: Artikelabschnitte in DE/US/UK, Postgres-Volltextsuche, vorab eingebundene native Dokumente, geprüfte Zitate im SSE und Verlauf sowie eine verlinkbare Artikelansicht mit ursprünglichen Noten-/Klaviatur-/Pulsbeispielen und Klang. Entscheidung und Spike: [ADR 0016](../decisions/0016-wissensbasis-vorab-und-native-zitate.md).

Der Kurs bleibt Version 13. Die interne Vorschau enthält 29 Artikel mit 238 Abschnitten je Sprache, insgesamt 714 indexierte Abschnitte. Texte werden mit einem eigenen i18next-Kontext aufgelöst; Glossar und US-/UK-Begriffe bleiben richtig, globale öffentliche Ressourcen werden nicht mit Entwürfen ergänzt. Lange künftige Abschnitte werden an Wortgrenzen in höchstens 1800 Unicode-Codepunkte geteilt.

Alle vorhandenen Artikel sind weiterhin Entwürfe. Der öffentliche Wissensindex ist daher korrekt leer. Es wurde keine fachliche Freigabe erteilt, keine Remote-Function bereitgestellt und kein echtes Modell bezahlt. Die fachliche Freigabe der Quellen nach ADR 0005 sowie die Live-Definition-of-Done aus P2.15/P2.16 bleiben offen. SDK- und lokale API-Prüfungen ersetzen ausdrücklich den KI-Transport.

## Daten und Aktualisierung

Die additive Migration `20261014020000_knowledge.sql` führt `knowledge_indexes`, `knowledge_chunks`, GIN-Volltext-/Fähigkeitsindexe und die privaten RPCs `replace_knowledge_index`/`search_knowledge` ein. Bestehende Konten, Lernnachweise, XP, Münzen und Datenbankinhalte wurden nicht zurückgesetzt. Neue Tutor-Anfragen verwenden Promptversion 2; alte Belege bleiben unverändert.

Der lokale Abgleich hält Service-Schlüssel nur im Arbeitsspeicher und verweigert Remote-Ziele:

```bash
pnpm knowledge:sync            # ausschließlich freigegebene Daten
pnpm knowledge:sync --preview  # ausdrücklich interne, lokale Prüfung
```

Der Indexabgleich ist ausdrücklich Teil des Inhaltsrollouts; eine Tutor-Anfrage schreibt keine Quellen. Nach fachlicher Freigabe oder Rückzug zuerst `pnpm content:publish` erzeugen und Diff prüfen, dann Function, App und Index mit denselben Artefakten bereitstellen. Der zusätzliche öffentliche Stufenindex enthält ausschließlich freigegebene Artikel, keine Entwurfsüberschriften oder -texte. Für ein Remote-Projekt muss ein gesondert autorisierter serverseitiger Job denselben Snapshot über das Service-RPC übertragen; der lokale Einstieg weicht niemals still auf ein Remote-Ziel aus.

Der Abgleich ersetzt eine Auslieferung atomar. Identische Snapshots sind idempotent, rückläufige Katalogversionen und inkonsistente Metadaten werden verweigert. Beim Rückzug wird der ganze neue Stand einschließlich leerem Index eingespielt. Wenn Function und DB unterschiedliche Snapshots kennen, werden keine alten Quellen verwendet. Die Reihenfolge eines Deployments kann kurzzeitig ungestützte Antworten erzeugen; sie mischt keine alten Quellen in einen neuen Stand.

## Suche, Zitate und Oberfläche

Suche erfolgt genau in der angefragten Sprache. Deutsche und englische Wortstämme, exakte Treffer, gewichtete Titel/Überschriften und begrenzte Präfix-Alternativen bestimmen den Rang. Bei einer kanonisch aufgelösten Lektion helfen ihre Fähigkeiten; der Client kann keine Suchfähigkeiten oder Quellen vorgeben. Maximal 24 Treffer werden auf bekannte Katalog-IDs, Sprache, sechs Dokumente, drei Abschnitte je Artikel und 6000 UTF-8-Bytes begrenzt.

Die Function liefert zusätzlich:

- `knowledge`: Zustand `ready`, `empty` oder `unavailable`, tatsächliche Dokumentzahl, Snapshot und Vorschaukennzeichen.
- `citation`: validierter Verweis mit Artikel-ID/-Version, Sprache, Abschnitt/Teil, Zitat und absolutem Unicode-Codepunktbereich, Snapshot, `round`, `blockIndex` und App-Link.
- `notice`: `invalid_citation`, `knowledge_unavailable` oder `no_library_source`, wenn entsprechend erforderlich.

`TutorResult.citations` und `sourceState` sind bei neuen Antworten vorhanden, bei alten gespeicherten P2.15-Ergebnissen optional. Wiederholung verwendet dieselben gespeicherten Quellen. Gesprächs-/Kontolöschung entfernt auch Quellenkopien; Kostenbelege bleiben nach Gesprächslöschung ohne Antworttext bestehen. Alte Modellantworten werden bei neuen Aufrufen nicht als Quellendokumente wiederverwendet.

Ein Link hat die Form `/article?articleId=…&version=…&locale=…&section=…&part=…&digest=…`. Die Route prüft nicht nur ID und Version, sondern den Hash des konkreten aktuellen Abschnitts. Sie öffnet den zitierten Abschnitt, bietet die übrigen Artikelabschnitte an und bewahrt dessen Sprache auch bei anderer Oberflächensprache. Entwürfe haben einen sichtbaren Hinweis. Notenbilder erhalten Beschreibungen, breite Beispiele einen Scrollhinweis und Tastaturzugang. Klang startet erst auf Betätigung und stoppt beim Abschnittswechsel oder Verlassen. Nicht verfügbare Quellen bieten erneute Prüfung und Zurücknavigation. Die Artikelprüfung verwendet den Katalog des installierten App-Builds und funktioniert offline. Ein älterer Offline-Build kann einen darin noch enthaltenen früheren Artikel weiterhin anzeigen; neue Tutor-Anfragen verwenden nach Rückzug keine alten Indexabschnitte mehr. Für die Änderung der lokalen Artikelansicht gehört ein App-Update zum Inhaltsrollout. Die Chat-Oberfläche, welche diese Links als Quellenfußnoten anbietet, folgt in P2.17.

## Prüfung und Einstieg

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm check:deno
pnpm check:i18n
pnpm check:content
pnpm check:curriculum
pnpm db:lint
pnpm db:test
pnpm knowledge:sync
pnpm knowledge:sync --preview
# Separates Terminal, ausschließlich lokale Simulation:
pnpm db:serve:learning --tutor-test
pnpm db:test:knowledge
pnpm db:test:tutor
# Vorschau-Serving beenden, danach öffentliche Inhaltsbindung:
node tools/serve-local-learning.mjs --published --tutor-test
node tools/test-knowledge.mjs --published
node tools/test-tutor.mjs --published
```

Geprüft: 2761 Paket-/App-/Tooltests, 755 zusätzliche Wissensbasis-/SDK-Prüfungen und weiterhin 206 Deno-Tutorprüfungen. Alle 714 Quellenlinks lösen zum genauen Quelltext auf. Die Datenbank-Suite umfasst 221 pgTAP-Prüfungen, davon 40 neue zu Volltextsuche, RLS, atomarem Abgleich, Rückzug, Versionen und getrennten Auslieferungen. Echte lokale Wissensbasis-/Tutor-API: 244 Prüfungen mit Vorschau und 214 mit öffentlicher Bindung; die bestehende Tutor-API besteht weiterhin je 122 Prüfungen. Die Prüfungen erstellen eigene Konten und stellen Index bzw. deaktivierte Modellkonfiguration danach wieder her.

Die Suchabnahme umfasst 29 feste Artikelthemen in jeder der drei Sprachen: 87/87 finden den erwarteten Artikel unter dem tatsächlichen Dokumentbudget. Das ist eine technische Abnahme nah am vorhandenen Wortschatz, kein Nachweis fachlich korrekter Modellantworten oder Synonymabdeckung. Lokale REST-/Postgres-Latenz lag bei einem Lauf parallel zu anderen Prüfungen bei Median 5,0 ms und P95 18,8 ms; daraus folgt kein Produktions-SLA. Der größere, fachlich geprüfte Testkatalog bleibt P2.18.

Browserabnahme besteht mit Desktop-Tastatur und 390-px-Touch in hell/dunkel, DE-/US-/UK-Quellen, Originaltexten, bewusst gestarteter tatsächlicher Web-Audio-Wiedergabe samt Stopp beim Abschnittswechsel, ohne Seitenüberbreite oder Browserfehler. Geänderte Quellen und erneute Prüfung sind getestet. Vorschau- und Produktions-Web-Export bestehen; der tatsächliche öffentliche Export enthält keine unveröffentlichten Katalog-IDs oder Inhaltstexte. Der öffentliche Browser-Export verweigert außerdem einen echten internen Quellenlink ohne Entwurfstitel, Text oder Klang. iOS-/Android-Exporte bestehen für Vorschau und Produktion; zusätzlich ist der öffentliche native JavaScript-Export auf Entwurfsdaten geprüft. Die eigentliche native Auslieferung ist Hermes-Bytecode; der JavaScript-Checker prüft den zusätzlich ohne Bytecode erzeugten Export. Native Geräteabnahme bleibt offen.

## Offene Abnahme und Fortsetzung

Claudes getrennte fachliche Prüfung der 29 Artikel bleibt erforderlich. Echte Anthropic-Antworten, korrekte native Quellenunterstützung der Aussagen sowie Token-/Cachekosten können erst nach sicherer Schlüsselbindung und Prüfung des aktuellen Modells/Tarifs abgenommen werden. Der vorhandene P2.15-Konfigurationsentwurf ist unverändert; Schlüssel gehören nicht in den Chat. Die Policy bleibt standardmäßig deaktiviert.

Nach sicherer Schlüssel-/Modell-/Tarifbindung prüft `pnpm check:knowledge:live` neun echte Antworten zu Notation, Notenwerten und Quellenkritik in DE/US/UK mit nativen Zitaten. Bei leerem öffentlichem Index stoppt der Einstieg vor jedem API-Aufruf. Für ausdrücklich interne Prüfung kann `pnpm check:tutor:live --knowledge-preview` dieselben Quellenproben gegen Entwürfe ausführen; das Protokoll markiert `preview: true`. Diese manuelle Probe prüft den echten Dokument-/Zitattransport mit vorgegebenen Abschnitten; PostgreSQL-Retrieval wird unabhängig über die lokale API geprüft. Exakte Zitate, Antworten und tatsächliche Kosten erscheinen im Protokoll, die fachliche Unterstützung der Aussagen muss Claude gesondert bewerten. Ohne vollständige sichere Bindung brechen beide Einstiege vor jedem API-Aufruf ab; das ist hier geprüft.

Als nächster technischer Planpunkt folgt **P2.17 – Tutor-Oberfläche**: gestreamter Chat, geprüfte Notenbeispiele, Quellenfußnoten über diese Artikelroute, „Warum?“, Hinweisleiter, verständliche Kontingent-/Fehlerzustände und löschbarer Verlauf. Anschließend bewertet P2.18 fachliche Antworten und Kosten mit dem getrennten Testkatalog.
