# ADR 0075: ts-fsrs 6.0.0 mit der FSRS-6-Legacy-Schnittstelle

Status: angenommen (05.11.2026, Nutzerentscheidung „migrieren und mergen“). Ergänzt ADR 0030.

## Kontext

Dependabot #140 hebt `ts-fsrs` von 5.4.2 auf 6.0.0. ADR 0030 pinnt Engine und Parameter (FSRS-6, Zielbehalten 0,9, maximales Intervall 36.500 Tage, kein Fuzz, Lernschritte 1/10 Minuten, Wiederlernschritt 10 Minuten). Jede Änderung muss versioniert und erneut geprüft werden.

Mit 6.0.0 ändern sich drei Dinge:
- `fsrs()`, `next()`, `createEmptyCard()` und `Card` sind als veraltet markiert. Die neue Scheduler-API (`DefaultScheduler`, `defineScheduler`) nutzt eine andere Kartenform und standardmäßig FSRS-7.
- Die zurückgegebene Karte enthält kein `elapsed_days` mehr. Das gespeicherte Format verlangt das Feld aber, sowohl im Zod-Schema als auch in der DB-Prüfung aus `20261016050000_fsrs_review.sql`.
- Das Scheduling-Verhalten weicht minimal ab, siehe Messung.

## Messung

Eigener Vergleich über 3.000 zufällige Verläufe mit je 25 Wiederholungen (75.000 Schritte), gleiche Parameter, Noten 1–4, Abstände von Sekunden bis zu 60 Tagen.

| Variante gegenüber 5.4.2 | Stabilität, Schwierigkeit, Zustand, Wiederholungen, Lapses, Lernschritt | Intervalltage | Fälligkeit |
|---|---|---|---|
| 6.0.0 `fsrs()` (Legacy) | identisch | identisch | 2.516 Abweichungen, ausschließlich −30 s |
| 6.0.0 `defineScheduler` + FSRS-6 + Standard-Middlewares | – | 420 Abweichungen | 2.936 Abweichungen |
| wie oben, ohne Monoton-Middleware | – | 4.137 Abweichungen | 6.653 Abweichungen |

Die 30-Sekunden-Abweichungen betreffen ausschließlich die Note „Schwer“ aus den Zuständen „Neu“ oder „Lernen“. Der nächste Lernschritt liegt dann bei 5 statt 5,5 Minuten (Mittel aus 1 und 10 Minuten, jetzt auf ganze Minuten gerundet). Langfristige Gedächtniswerte und Tagesintervalle bleiben gleich.

## Entscheidung

- `ts-fsrs` 6.0.0 überall gemeinsam: `package.json`, `packages/content/package.json`, `tools/deno.json`, `supabase/functions/deno.json`.
- Weiter die synchrone Legacy-Schnittstelle `fsrs()` mit FSRS-6. Die Lint-Ausnahme `no-deprecated` gilt nur für `review.ts`, `review.test.ts` und `tools/review-smoke.ts` und ist dort begründet. Ein Umstieg auf die neue API würde Tagesintervalle verändern und braucht eine eigene Kalibrierung und ADR. Das gilt auch für einen Umstieg auf FSRS-7.
- `elapsed_days` führen wir selbst weiter, mit der Semantik von 5.4.2: ganze UTC-Kalendertage seit der letzten Wiederholung, 0 für neue Karten. Die Formel stimmt in allen 75.000 Vergleichsschritten mit 5.4.2 überein und ist zusätzlich durch einen Test festgehalten. Gespeichertes Format, SQLite, Sync und DB-Prüfung bleiben dadurch unverändert, eine Migration ist nicht nötig.
- `REVIEW_ALGORITHM` wird zu `fsrs-6/ts-fsrs-6.0.0/v1`.
- Die 30-Sekunden-Verkürzung des Lernschritts bei „Schwer“ wird akzeptiert. Bereits gespeicherte Fälligkeiten bleiben stehen; neue Wiederholungen nutzen den neuen Wert. Server und Client rechnen mit derselben Version. Offline-Schätzungen dürfen nach ADR 0030 ohnehin vom Serverstand abweichen.

## Folgen und Grenzen

- Auswirkung auf den Lernerfolg ist nicht gemessen. Die Zielquote bleibt eine Modellannahme.
- Rückrechnungen (`pnpm reviews:backfill`) können für betroffene Lernschritte 30 Sekunden frühere Termine ergeben. Das betrifft nur kurzfristige Lernschritte.
- Die nächste Major-Version oder ein Wechsel auf die neue API braucht wieder eine eigene Abnahme.
