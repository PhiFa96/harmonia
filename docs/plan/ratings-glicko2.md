# P3.01 – Ratings mit Glicko-2

Stand: 15.10.2026. Technische Umsetzung für interne Erprobung; P2-Launch und Plausibilität mit echten Lernenden bleiben offen. Es werden keine fachlichen Inhalte freigegeben und keine Anbieteraktionen durchgeführt.

## Umsetzung

- `packages/exercises`: plattformneutrale Berechnung, Unsicherheitszuwachs, Vorhersage, versionierte Parameterprofile für alle 19 Typen und Periodenauswertung.
- `packages/content`: Rekonstruktion aus Originalantworten und Herkunft je Aufgabe. Alle 850 Aufgaben sowie gemischte Wiederholungen werden geprüft. Der aktuelle Lektionskatalog nutzt 17 der 19 unterstützten Übungstypen.
- Migration `20261016030000_skill_ratings.sql`: eigene lesbare Fähigkeitsratings, private globale Schwierigkeitsprofile, Service-RPCs und transaktionale Revisions-/Verarbeitungsbelege.
- `learning-sync`: nach bestätigtem Lernen bis zu 50 wartende Ereignisse des eigenen Kontos projizieren, einschließlich leerer Sync-Anfragen. Konflikte werden erneut gelesen; bei Ausfall bleibt ein ausdrücklicher Rückstand.
- Datenschutzexport: `skillRatings` sowie Rating-Version, Ausgang und Verarbeitungszeit im Lernexport. Kontolöschung kaskadiert persönliche Ratings und Belege.

Die mathematischen, zeitlichen und mehrteiligen Modellannahmen sowie Quellen stehen in [ADR 0028](../decisions/0028-glicko-aus-kanonischen-lernversuchen.md). Ratings verändern noch keine Lektionsauswahl oder Freischaltung. Adaptive Auswahl folgt in P3.02.

Der CI-Durchgang fand außerdem einen bestehenden Kontrastfehler im Auswahlblatt: Im Modus „Bewegung reduzieren“ verblasste auch der Text kurz bis etwa 1,8:1 Kontrast. Das Blatt erscheint dort nun sofort deckend; nur der Hintergrund blendet über. Die Browserprüfung erfasst die Deckkraft über die ersten Animationsframes und prüft weiterhin unverändert mit axe.

## Wiederholbare lokale Prüfung

Mit vorhandenen Abhängigkeiten und laufendem lokalen Supabase; nur additive Migrationen anwenden, eine bestehende Entwicklungsdatenbank nicht zurücksetzen:

```bash
pnpm exec supabase migration up --local
pnpm --filter @harmonia/exercises test
pnpm --filter @harmonia/content test
node --test tools/ratings-worker.test.mjs
pnpm db:test
pnpm db:serve:learning --tutor-test --billing-test
# In einem zweiten Terminal:
pnpm db:test:ratings
pnpm db:test:privacy
pnpm check:deno
```

Der lokale API-Test erzeugt zwei eigene JWT-Konten, prüft kanonische Antworten, doppelte Übertragung, parallele Eigentümer, bestehende Quellen, tatsächliche Kürzung, Export und Rückrechnung. Er entfernt die Konten und stellt ausschließlich seine betroffenen Modellprofile unter einer Revisionssperre wieder her. Gleichzeitige fremde Rating-Schreibvorgänge verhindern diese Wiederherstellung und machen den Test erfolglos; deshalb ohne andere aktive lokale Rating-Tests ausführen. Keine echten E-Mails, Modelle oder Zahlungen.

## Rückrechnung und Betrieb

```bash
# Nur nachsehen; Exit 1 bedeutet wartende Ereignisse, Exit 0 keine Wartenden.
pnpm ratings:backfill --local --check
# Interne lokale Entwürfe ausdrücklich wählen:
pnpm ratings:backfill --local --preview
# Ein einzelnes Konto auswählen, ohne dessen ID im Ergebnis auszugeben:
pnpm ratings:backfill --local --preview --actor <Konto-UUID>
```

Für eine echte Umgebung muss der Betreiber `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` sicher serverseitig binden. `pnpm ratings:backfill --remote` verwendet ausschließlich den öffentlichen freigegebenen Katalog und HTTPS; `--preview` ist dort verboten. Vorher müssen die passende Inhaltsversion sowie Migrationen, Datensicherung und Betriebsfreigabe tatsächlich vorliegen. Keine Schlüssel ins Repository oder Chat schreiben.

Jeder Aufruf verarbeitet höchstens 10.000 Ereignisse. Die Ausgabe enthält ausschließlich Summen für angewendet, bewertet, ausgeschlossen, bereits verarbeitet, gelöschte Quelle sowie `complete`. Exit 1 signalisiert verbleibende Arbeit; erneut ausführen. Ein bereits bewertetes Ereignis bleibt bei Wiederholung unverändert. Vor Aktivierung den historischen Rückstand abarbeiten, anschließend `--check` regelmäßig prüfen. Es wurde kein Remote-Aufruf und kein geplanter Remote-Job gestartet.

Gelöschte Rohantworten und nicht mehr verfügbare Versionen bleiben ausgeschlossene Evidenz. Sie sind im Ergebnis nicht mit richtigen/falschen Antworten gleichzusetzen. Die tatsächliche Auswertung alter Belege verwendet dieselbe Routine wie neuer Sync und ändert keine XP oder Bestehensnachweise.

## Verbleibende Abnahme

Echte Lernverläufe sind noch nicht vorhanden bzw. freigegeben. Offen bleiben Prüfung der Rating-Plausibilität und Vorhersagegüte, ausreichende Aufgabenstichproben, die Modellannahme für mehrere Fähigkeiten sowie Unterschiede bei Sprache und Hilfenutzung. Tau 0,5 ist ein Startwert. P3.01 ist deshalb nicht als vollständig empirisch abgenommen markiert. Die offenen P2-Voraussetzungen stehen unverändert in [P2-Abschluss](p2-abschluss.md).
