# Fachprüfung und Integration Phase 4 v3 (05.11.2026)

**Technischer Nachtrag N5 (14.11.2026, noch nicht integriert):** [Zahlungsgrenze](zertifikate-zahlungsgrenze.md), ADR 0080: Standarddienst ohne Zahlungsfreigabe, lokale Simulation nur mit ausdrücklicher Prozessfähigkeit, allgemeine Client-Zahlungsendpunkte entfernt, alte v1-Zahlungen gesperrt. Eigener Entwurfsbranch auf `main@ab157e8`; #151/#156/#157/#158 nicht enthalten. N4 bleibt separat, N3 weiterhin eine dokumentierte Echtheitsgrenze. Rohbefunde und bisherige Fachprüfung unverändert. Technische P4-Vorarbeit vor formaler Phase-4-Freigabe, keine neue Fach-/Rechtsfreigabe oder Veröffentlichung; P4.01 bis F14/Recht zurückgestellt.

Integriert über den Branch `claude/stoic-pascal-eaoojx` per Sammel-PR nach `main`. Rohberichte: `docs/quality/fachpruefung-phase-4-v3/`.

## Integrierte PRs

| PR | Inhalt | Ergebnis |
|---|---|---|
| #136 | Tutor: signierter Servernachweis für Erklärung/Lösung | keine Blocker |
| #143 | P4.11 Chor-Gesamtentwurf (enthält #137, #141, #142; per `git range-diff` geprüft) | ein fachlicher Fehler behoben, sonst keine Blocker |
| #144 | P4.12 Zeitreise mit gestuften Hinweisen | keine Blocker |
| #145 | P4.13–P4.16 Schule mit `auth.uid()`-Bindung und Freigabeversion 2 | keine Blocker |
| #146 | P4.17/P4.18 KI-Prüfübergabe und Zertifikatsablauf | Bindungslücke behoben |
| #147 | P4.19 Stufe 5 | keine Blocker |
| #138 | Dependabot minor/patch (`@revenuecat/purchases-js` 1.73.2, `@types/node`) | übernommen |
| #139 | `react-native-purchases` 11.0.0 | übernommen: Typen, 55 Billing-App-Tests, 37 + 91 Billing-Proben grün; native Laufzeit ungeprüft |

Nicht übernommen:
- **#140 `ts-fsrs` 6.0.0:** 15 von 17 FSRS-Tests rechnen anders, die Deno-Pins (`tools/deno.json`, `supabase/functions/deno.json`) bleiben 5.4.2, die alte API ist veraltet. Die Umstellung ändert das Planungsmodell gespeicherter Karten und braucht eine eigene ADR (Nachfolge zu ADR 0030). Nachtrag 05.11.2026: nach Nutzerentscheidung separat migriert (ADR 0075). Die Testfehler lagen am entfallenen Feld `elapsed_days`; die Rechnung weicht nur um 30 s bei „Schwer“ im Lernschritt ab.
- **#113 `@expo/metro-runtime` 58:** gehört zu Expo SDK 58, das Repo ist auf SDK 57. Wird geschlossen.

## Integrationsentscheidungen

- Die Inhaltsversionen hat Codex fortlaufend vergeben (Chor 28/29, Zeitreise 30, Stufe 5 31). Gemeinsamer Stand: **Katalog/Fähigkeitsplan 31**, 200 Fähigkeiten, 66 Einheiten, 195 interne Lektionen, 0 freigegeben. Testerwartungen sind auf die kombinierten Zählwerte gezogen, die öffentlichen Artefakte über `content:publish`/`curriculum:render` neu erzeugt.
- Die CLAUDE.md-Statusabsätze wurden vereinigt. In `fachpruefung-phase-4-v2.md` steht E2 jetzt als über #136 bearbeitet.

## Behobene Befunde

1. **Chor, „Kleiner Bogen“ (Edition 2):** Der Bass sprang bei IV→V eine kleine Septime abwärts (F3→G2), während alle Oberstimmen fielen. Die Engine meldete das nicht, weil die Sprungobergrenze bei 8 diatonischen Stufen liegt. Korrektur: Sekundschritt F3→G3 in Gegenbewegung. Nachgerechnet ohne Parallelen; die Kadenz V–I mit Sopran 7→1 bleibt gleich. Einführungskarte und Pipelineerwartung angepasst. Ein neuer Test verbietet Septimen- und Überoktavsprünge in allen Miniaturen; er schlägt ohne die Korrektur fehl. Edition 2 ist neu in diesem Stand, es gibt also keine alten Lernstände und keine Versionserhöhung.
2. **KI-Inventar:** Die Ausschlussregel `-fixture.` ließ `supabase/functions/_shared/tutor-local-fixture.ts` aus der Hashbindung, obwohl `tutor/index.ts` die Datei importiert. Sie ist jetzt ausdrücklich gebunden (278 Dateien).

## Nacharbeit (nicht blockierend)

- **Stufe 5:** In 12 von 24 Modellen schließt der Cantus 7→1 statt nach Fux 2→1. Das ist zulässig; der Erklärtext sollte es als Variante kennzeichnen.
- **Chor:** Die Folge V→iii in „Heimweg“ ist ungewöhnlich. Die Uhrendrift während eines Takes wird nicht korrigiert, auf Geräten nicht belegt.
- **Zeitreise:** Hinweis 2 verrät die Lösung fast (wie in ADR 0071 vorgesehen); eine didaktische Prüfung steht aus.
- **Schule (vor echter Nutzung):** kein Fremdschlüssel `actors.id` → `auth.users`; das Bearer-Token wird nur beim Einstieg geprüft, danach gilt das Cookie (ein Widerruf wirkt verzögert); die Serverrolle `harmonia_school_grader` ist unter Supabase nicht beschrieben; `delete_actor` löscht bezahlte Rechnungen mit (Aufbewahrungspflicht prüfen).
- **Tutor:** Der HMAC-Schlüssel ist der Service-Role-Key, besser wäre ein eigenes Secret; fehlende Signaturkonfiguration liefert 422 statt 503; `attempt_required` kommt vor der Idempotenzabfrage; der Nachweis belegt keine menschliche Bearbeitung; kein Ratenlimit auf `?view=attempt`, keine Uhrentoleranz.
- **KI/Zertifikate:** Transitive Importe außerhalb der gebundenen Verzeichnisse sind nicht gebunden; `tools/ai-act/model.mjs` fehlt in der Zertifikatsbindung; `view()` schreibt beim Lesen; die simulierte Zahlung kann vom Sitzungsinhaber selbst bestätigt werden (nur Loopback).
- Lokale private Artefakte neu erzeugen: `pnpm ai:review`, `pnpm ai:handoff`, `pnpm certificates:review`.

## Lokale Nachweise (Integrationsstand)

`check:content`, `check:curriculum`, `check:i18n`, `check:ai`, `check:certificates`, `check:deno`, `typecheck` und `lint` sind grün. Lint lief mit `NODE_OPTIONS=--max-old-space-size=8192`, ohne diesen Wert bricht er hier mit Speichermangel ab. Vitest: Theorie 892, Übungen 637, Inhalte 1.479, i18n 509, Notation 251, Audio 41, UI 14. Mobile: 105 Suites; `level-two-complete` brach im Gesamtlauf mit Speichermangel ab und lief einzeln grün (43/43). `test:tools`: 275/276, der eine Fehler war die Pipelineerwartung zu Befund 1; nach der Korrektur einzeln grün (Pipeline 64/64, KI 27/27), kein erneuter Gesamtlauf. Schul-DB-, pgTAP-, Supabase- und Browserproben laufen nur in der CI.

## Grenzen

Keine Literatur-Volltext-, Geräte-, Stimmen-, Screenreader-, Live-Modell- oder Rechtsabnahme. Alle Inhalte bleiben `entwurf`, öffentlich null Lektionen. P4.01 bleibt wegen F14/Recht zurückgestellt.
