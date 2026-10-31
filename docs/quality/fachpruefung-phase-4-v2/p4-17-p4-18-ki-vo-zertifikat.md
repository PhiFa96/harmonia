# Prüfbericht E (a8738ff), nur lesend

Ausgeführt: node --test certificates.test, review.test, ai-act/review.test (38/38 grün), reminder-smoke-clock.test (7/7), check:ai, check-legal-release, Probeskript gegen den Zertifikatsservice. Kein BLOCKER gefunden.

## Befunde

1. NACHARBEIT (inhaltlich nah an BLOCKER für eine echte Prüfung) – tools/certificates/service.mjs:~175 (`description: describeScore(...)`).
   Die Prüfungsansicht liefert für Notenbilder die Textbeschreibung von describeScore, die Tonnamen nennt. Beleg per Probe: Stufe 1 Aufgabe 1 "Wie heißt diese Note?" -> description "Ganze Note, eingestrichenes e", Antwort E:0; Aufgabe 2 -> "eingestrichenes f", Antwort F4; Stufe 2 Aufgabe 1/2 analog (kleines d / kleines e). Die Beschreibung steckt im eingeklappten <details> (browser.ts:298), steht aber im JSON von /api/state und /api/answer. Die App nutzt für Aufgaben exerciseDescription (strukturell, nennt den Ton nicht, per Probe geprüft). Die Aussage in zertifikate-entwurf.md "keine Lösungshinweise" ist damit für 4 der 24 Aufgaben falsch. Behebung: exerciseDescription statt describeScore; Test mit Tonname-gegen-Antwort ergänzen.

2. NACHARBEIT (Dokumentation) – docs/decisions/0057, CLAUDE.md "P4.10-Tutorkontext".
   Im Modus explain (beliebiger nicht-null Antwortstring, auch '') und solution (answer null) enthält der Serverkontext solution/solutionLabel/feedback (tutor-tools.ts:~128-170). Der Server hat keinen Nachweis eines Versuchs. Ein authentifizierter Client kann so ohne Hinweisleiter und ohne Erstversuch die Lösung in den Modellkontext bringen. Das war mit `checked:true` schon vorher möglich; der Commit schließt es nicht, sondern entfernt nur das wirkungslose Flag. ADR 0057 benennt das teilweise ("beweist keinen früheren Klick"), aber die Nacharbeitszeile in fachpruefung-phase-4-entwuerfe.md und CLAUDE.md lesen sich wie "Vertrauensproblem behoben". Hinweis/Chat sind dagegen sauber: keine Bewertungsfelder, Hörquelle verborgen, SATB-Werkzeug gesperrt (tutor-tools.ts:104-130). Prompt-Version 5 / Tools 3 unverändert und konsistent (tutor.ts:4), Tests bleiben stimmig. Formulierung nachschärfen oder serverseitigen Versuchsnachweis (Lernereignis vor Erklärung) einplanen.

3. NACHARBEIT (gering) – tools/certificates/binding.mjs:8-15.
   Der Prüfwert deckt tools/voice-leading/playback.ts, aber nicht dessen Importe (tools/voice-leading/workbench-model.ts, report.ts u. a.), die in browser.ts gebündelt werden. Betrifft nur Klangwiedergabe, nicht Bewertung. Verzeichnis tools/voice-leading oder die Importkette ergänzen. Hash selbst ist reproduzierbar (zweimal gleich, 182 Dateien), Symlinks/Pfade außerhalb des Repos werden abgewiesen.

4. NACHARBEIT (gering) – tools/certificates/service.mjs:69-79 reconstruct().
   Ein einzelner Datensatz mit abweichendem Fingerprint lässt state() für alle Durchgänge desselben Besitzers mit 'outdated' (409) scheitern (Test "changed content fingerprint" bestätigt dies). Nur lokal, per erase behebbar; besser pro Zeile als phase 'outdated' ausgeben, wie beim source_hash.

5. NACHARBEIT (Doku) – docs/decisions/0044: nennt "neun Funktionsbereiche", Inventar/Plan haben zehn; ki-verordnung-pruefvorbereitung.md Z.~7 erwähnt zehn. ADR-Zahl nachziehen (rein redaktionell).

6. HINWEIS – docs/legal/ai-act/vorpruefung.md: "Harmonia schließt diese Zwecke technisch aus". Im Code gibt es nur die Liste excludedPurposes im Inventar und einen Prompthinweis, keine technische Durchsetzung. "konzeptionell/vorgesehen ausgeschlossen" wäre ehrlicher.

## Ohne Befund (geprüft)

Zertifikat (P4.18):
- Bewertung nur serverseitig: Payload-Schlüssel exakt (id,index,answer,locale), Zeit stammt aus now() des Servers, Antworten werden aus Seed+Antwortprotokoll neu gerechnet, Antwort muss in item.choices liegen, Index muss dem Serverindex entsprechen, Wiederholung idempotent, abweichende Wiederholung 409. Client kann Punkte/Zeit/Ergebnis nicht setzen (Tests "injected scores").
- Frist: Ablauf wird vor jeder Antwort finalisiert (now >= deadline), Test mit exakt 20 Minuten.
- Code nur bei qualified (80 %, alle beantwortet); 128-Bit-Zufall; Verify liefert nur status/stage/issuedAt/profileVersion.
- Muster-PDF: keine Namen/personenbezogenen Daten; "ENTWURF / UNGÜLTIG" in Titel, Wasserzeichen, Dateiname harmonia-DRAFT-INVALID.pdf; pdf.mjs verweigert Nicht-Entwurf/widerrufen/ohne Bindung. check:certificates --release gibt unbedingt Exit 1. Server bindet an 127.0.0.1, Host-/Origin-/Content-Type-Prüfung, CSP, HttpOnly/SameSite=Strict, DB 0600, Prüfmappe (mit Lösungen) unter ignoriertem artifacts/ ohne Auslieferungspfad (Test grün). Bundle-Wache getestet.
- DST-Test (74f6449): Berlin-Umstellungen 29.03. und 25.10.2026 korrekt (Sommer 18:59:30Z, Winter 19:59:30Z); 7 Fälle grün, TTL 30 s und 0 s gegen reminderTTL (Ruhezeit ab 21:00) bestätigt.

KI-VO (P4.17):
- check:ai: 249 gebundene Dateien (stimmt mit der Angabe in 6c3263a); alle drei Scopes scheitern mit --release (Exit 1), ebenso check-legal-release; Release-Gate wirkt auch in Beta/Storefront/P2. releaseProblems verlangt echte Prüfung, Prüfer, Referenz, Gültigkeit, aktuellen Snapshot, Klassifikation und Maßnahmen; legalApprovalInferred bleibt false. Die Bindung der Chor-Abschlussentscheidung (6c3263a) nennt die tatsächlichen Pfade, die Tests verlangen sie.
- Nirgends wird eine erfolgte Rechtsprüfung behauptet; alle Einstufungen unreviewed, Reviews pending, EUR-Lex-Volltext als blocked ausgewiesen.
- Rechtsangaben: Ich habe Art. 113 im amtlichen Explorer abgerufen: "applies from 2 August 2026"; Anhang III/Art. 6(2) ab 2. Dezember 2027, Art. 6(1)/Anhang I ab 2. August 2028 (als AMENDED markiert) – stimmt mit der Doku überein. Aus eigenem Wissen plausibel: Anhang III Nr. 3(b) Lernergebnisse/Lernsteuerung, Art. 6(3) mit Profiling-Ausschluss, Art. 49(2) Registrierung, Art. 5 (Emotionserkennung im Bildungsbereich, biometrische Kategorisierung), Art. 50 Transparenz, Art. 4 KI-Kompetenz. Nicht von mir verifiziert (Vermutung/aus Doku übernommen): Wortlaut der Art.-4-Änderung und die Omnibus-Mitteilung; keine erfundenen Zitate erkannt.
- Tutor-Behauptungen stichprobenartig bestätigt: Werkzeuge nur rechnend/lesend, keine Netzwerk- oder Schreibzugriffe im Mikrofon-/Chorcode.

CI (#130):
- Nur offizielle Registries (ECR/GHCR/Docker Hub) über die gepinnte CLI 2.121.0 aus dem Lockfile; kein fremder Mirror, keine Credentials; Tags nicht per Digest gepinnt (Basisrisiko, nicht neu). Workflow-Permissions contents: read. Diagnose gibt nur feste Namen aus (Test mit Zugangsdaten im Log grün).
- GitHub-Prüfung: Lauf 243 (a1ae544) Supabase-Job scheiterte beim Start (Doku stimmt); Lauf 244 (e4736f9, PR #130) conclusion success. Dass die CLI '' als "ungesetzt" und SLIM='0' als falsch behandelt, habe ich nicht aus dem CLI-Quelltext geprüft; der grüne Lauf 244 spricht dafür.

## Grenzen
Kein Docker/Supabase, keine Playwright-/Jest-/Vollläufe, keine Deno-Tutor-Probe und keine Live-HTTP-Prüfung des Tutors; die Rechtsangaben außer Art. 113 beruhen auf meinem Wissensstand und ersetzen keine juristische Prüfung.
