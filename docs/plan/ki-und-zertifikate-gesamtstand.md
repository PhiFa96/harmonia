# P4.17/P4.18 – Zusammenhängender interner Gesamtentwurf

Stand: 02.11.2026 · Branch `codex/ai-certificates-complete-draft` · Basis `main` bei `f7bc15d`.

Auf ausdrücklichen Nutzerauftrag wird die vorhandene KI-Prüfvorbereitung mit dem Zertifikatsprototyp vervollständigt. **Technische P4-Vorarbeit vor der formalen Phase-4-Freigabe.** Dies ist keine schriftliche Rechtsprüfung oder fachliche Abschlussfreigabe. Inhalte, Regeln und Berichte bleiben Entwurf; keine Veröffentlichung, echte Zahlung, gültige Zertifikatsausstellung oder Main-Integration. P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt. [ADR 0073](../decisions/0073-ki-pruefuebergabe-und-zertifikatsgesamtentwurf.md).

## P4.17: Prüfvorlagen und Nachweise

- Zehn Funktionsbereiche und acht Maßnahmenpakete bleiben inventarisiert. Pflichtbereiche bekannter Funktionen, ihr tatsächliches Vorhandensein und die acht amtlichen Quellen werden geprüft. Ein bekanntes vorhandenes Modul darf nicht als bloß geplant aus der Prüfung fallen.
- Codebindung einschließlich neu hinzukommender Laufzeitmodule, kompletter Wiedergabeimporte und Abhängigkeitsversionen. Nach Integration anderer Branches ist eine neue Übergabe nötig.
- Eigene, versionierte Prüfvorlage für `general`, `school` und `certificates`; vollständige Funktions-/Maßnahmen-/Quellenlisten. Bei erneuter Ausgabe desselben Prüfstands bleiben menschliche Notizen erhalten.
- Prüfung ausgefüllter Vorschläge: exakte Felder und IDs, vollständige Bereichsabdeckung, unveränderter Ausgangsstand, Begründungs-/Quellenreferenzen und neuer Ergebnisprüfwert. Die Ausgabe zeigt offene Nachweise, ohne eine Freigabe zu übernehmen.
- Eine erklärte schriftliche Abnahme benötigt ein vorhandenes, unverändertes Dokument mit `document.path` und `document.sha256`. Ablage ausschließlich unter `artifacts/ai-act/evidence/`, als reguläre PDF-/MD-/TXT-Datei mit Modus 0600, nicht leer und höchstens 10 MiB. Keine Symlinks, externen URLs oder Pfadüberschreitungen.
- Widerruf über `revokedAt`/`revocationReason`, abgelaufene Nachweise, neue Inhalte/Zwecke oder fehlende Dokumente sperren. Jeder Freigabebereich wird unabhängig geprüft.
- Vorlagen, Vorschläge, Prüfsnapshots und DE/EN-HTML-Berichte liegen privat mit 0700/0600 unter `artifacts/ai-act/`. Der Prüfungsserver liefert sie nicht aus.

**Unabhängigkeit bleibt erforderlich:** Der Dateihash prüft den Zusammenhang mit einer vorhandenen Datei, nicht die Echtheit, Qualifikation oder rechtliche Richtigkeit einer Einschätzung. Keine erfundene Prüferperson, kein als echt markierter Testnachweis. Tatsächlich bleiben alle drei Reviews `pending`/`draft`, alle Klassifikationen ungeprüft, alle Maßnahmen offen und der direkte EUR-Lex-Nachweis blockiert. Der Quellenstand vom 24.10.2026 wird nicht durch einen neuen Programmlauf als neu gelesen ausgegeben.

### Bedienung

```sh
corepack pnpm ai:review
corepack pnpm ai:handoff --scope certificates
corepack pnpm ai:handoff --scope school
corepack pnpm ai:handoff --scope general
```

`ai:handoff` nennt jeweils den konkreten Pfad `artifacts/ai-act/handoff/<Prüfwert>/<Bereich>/assessment.json`. Nur die passende Datei annotieren. Klassifikationen, Begründungen und Referenzen sind Arbeitsfelder für die unabhängige Prüfung, keine automatisch ermittelten Rechtsurteile.

Nach Ersetzen von `PRUEFWERT` durch den ausgegebenen Wert:

```sh
corepack pnpm ai:handoff --inspect "artifacts/ai-act/handoff/PRUEFWERT/certificates/assessment.json"
corepack pnpm ai:handoff --inspect "artifacts/ai-act/handoff/PRUEFWERT/certificates/assessment.json" --write
```

Das zweite Kommando erzeugt unter `artifacts/ai-act/proposals/<neuer Prüfwert>/<Bereich>/` einen Inventarvorschlag, die annotierte Vorlage und drei Berichte. **Es ändert weder `inventory.json` noch eine aktive Freigabe.** Entscheidungen zu Einstufungen/Quellen können den Ergebnisprüfwert verändern. Eine tatsächliche schriftliche Abnahme muss sich auf diesen abschließenden Stand beziehen; ein alter Prüfwert genügt nicht. Die Übernahme echter Nachweise braucht die Prüfung des konkreten Dokuments und einen regulären Review.

Die bestehenden Freigaben bleiben gesperrt:

```sh
corepack pnpm check:ai:release --scope general
corepack pnpm check:ai:release --scope school
corepack pnpm check:ai:release --scope certificates
corepack pnpm check:certificates:release
```

Alle vier Kommandos müssen im tatsächlichen Entwurfsstand mit Exitcode 1 enden. Ein gültiges Rechtsformular allein schaltet keine echten Zertifikate frei. Recht, Beta, Storefront und P2 verwenden weiterhin die bestehenden vorgeschalteten KI-Prüfungen.

## P4.18: Vollständiger lokaler Ablauf

```sh
corepack pnpm certificates:preview
```

Nur Loopback, standardmäßig `http://127.0.0.1:8237`. Persistenz unter dem ignorierten privaten `artifacts/certificates/`; kein öffentlicher App-Einstieg und keine Supabase-Bereitstellung.

1. DE/en-US/en-GB und Testprofil Stufe 1 oder 2 auswählen.
2. Eine Testbestellung öffnen. Sie zeigt ausdrücklich: keine Preise, kein Zahlungsanbieter, kein Geld und keine echte Prüfungsberechtigung. Abbruch oder simulierte Zahlung wählen.
3. Die eigene bezahlte Testbestellung startet genau einen Durchgang. Doppelte Zahlungs-/Startanfragen erzeugen keine zweite Bestellung oder Prüfung; verlorene Antworten können erneut angefragt werden. Falsches Profil, fremde Bestellung und injizierte Zahlungs-/Punktefelder werden abgewiesen.
4. Zwölf Aufgaben aus dem bestehenden Profil, 20 Minuten Serverfrist, fünf Punkte je richtiger Antwort. Reload und Serverneustart erhalten Antworten und Sitzung, solange diese gültig bleibt. Nur aktuelle Aufgabe, keine Seeds, Lösungen oder zukünftigen Aufgaben im Client.
5. Serverbewertete Auswertung; ungültiges Muster-PDF ab der unveränderten technischen Testgrenze. Code prüfen oder widerrufen. Ein veralteter/nicht mehr rekonstruierbarer Prüfstand wird auch bei der Codeprüfung ausdrücklich erkannt.
6. Jede Wiederholung braucht eine neue Testbestellung. Derselbe bereits verbrauchte Auftrag öffnet seinen bisherigen Durchgang. Löschung stellt seine Berechtigung nicht wieder her. Es gibt höchstens einen gültigen aktiven Durchgang je Sitzung.
7. Simulierte Erstattung entzieht die Testberechtigung und widerruft den Muster-Prüfcode, einschließlich bereits abgeschlossener Durchgänge. Ein neuer Durchgang benötigt eine andere Testbestellung. Bereits heruntergeladene PDFs bleiben als ausdrücklich ungültige Dateien bestehen.
8. Eigene Daten als JSON herunterladen, einzelne Durchgänge oder alle eigenen Testdaten löschen. Export ohne Seeds, Sitzungstoken, Zukunftsfragen oder Lösungsschlüssel; beschädigte/veraltete Ergebnisse werden nicht als geprüfte Ergebnisse ausgegeben.
9. Testsitzung ausdrücklich beenden. Das Token wird serverseitig widerrufen. Es endet außerdem nach 30 Minuten ohne Zugriff oder sieben Tagen absolut. Ohne gültige Sitzung sind weder alte Fragen noch Exporte/PDFs erreichbar. Eine neue Sitzung sieht die bisherigen Daten nicht.

### Einzelne veraltete oder beschädigte Datensätze

E3/E4 sind gemeinsam bearbeitet: vollständige Bindung von `tools/voice-leading/`; Rekonstruktion jeder Zeile mit Prüfung von Quelle, Fingerprint, Antwortfolge, Antwortzeit und gespeichertem Ergebnis. Eine fehlerhafte Zeile erhält den Status `outdated` und keine Aufgaben oder neue PDF-Ausgabe. Andere Durchgänge bleiben nutzbar. Ein veralteter aktiver Datensatz blockiert keinen Neustart; seine einzelne Löschung lässt andere Durchgänge erhalten.

Die lokale Migration ergänzt `invalidated`, `purchase_id`, Testbestellungen und registrierte Testsitzungen additiv. Sie löscht keine Altbestände beim Start. Alte ungebundene Durchgänge werden nicht stillschweigend auf den neuen Stand umgestellt. Der Server muss nach Codeänderungen neu gestartet werden.

### Daten und Grenzen

| Daten | Lokale Aufbewahrung |
|---|---|
| Durchgänge, Antworten, Muster-Prüfcodes | Sieben Tage ab Start, bis zum nächsten Datenzugriff |
| Ungenutzte/abgebrochene Testbestellungen | Sieben Tage ab Anlage |
| Zugeordnete Testbestellungen | Bis zur Löschung des Durchgangs; maximal knapp 14 Tage ab ihrer früheren Anlage |
| Testsitzung | 30 Minuten Leerlauf, höchstens sieben Tage; sofortiger Widerruf bei Logout/Gesamtlöschung |

Einzelne Durchgangslöschung entfernt auch seinen Muster-Prüfcode; der Verbrauchsvermerk der Bestellung bleibt bis zur Aufbewahrungsgrenze. Gesamtlöschung entfernt eigene Bestellungen und Durchgänge und widerruft die Sitzung. Andere Sitzungen bleiben erhalten. SQLite nutzt `secure_delete`; keine Behauptung zur Löschung externer Sicherungen oder heruntergeladener Dateien.

Die Sitzungen sind lokale Testidentitäten, **keine geprüften Personen und keine produktive Kontobindung**. Kontoverlust durch Ablauf/Logout ist erklärt; verbleibende Daten haben weiterhin ihre Aufbewahrungsgrenze. Es gibt keine Anbindung an echte Zahlungs-, Steuer-, Rechnungs-, Identitäts- oder Aufsichtsdienste. Keine Kontosynchronisation, Lernnachweise oder XP.

Die musikalischen Profile bleiben bewusst die bestehenden **ausgewählten technischen Testprofile**, keine vollständige Abschlussprüfung über alle Fähigkeiten einer Stufe. `certificates:review` zeigt unverändert auch die ausgelassenen Einheiten. Fachlich freigegebene Stufenabschlussinhalte sowie verbindliche Bestehens-, Wiederholungs-, Nachteilsausgleichs- und Gültigkeitsregeln bleiben Produktvoraussetzungen. Diese Grenzen werden nicht durch simulierte Zahlung oder grüne Tests erledigt.

## Prüfungen und Übergabe

```sh
corepack pnpm ai:test
corepack pnpm certificates:test
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium corepack pnpm certificates:test:web
corepack pnpm certificates:review
corepack pnpm test:tools
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm format:check
```

Die neuen Regressionen zu E3/E4, Export und Pflichtbereichs-/Bereitstellungsprüfung wurden zuerst rot ausgeführt. Zusätzliche tatsächliche SQLite-/HTTP-/Browserprüfungen decken Zahlungs-/Startwiederholung, fremde Zugriffe, Rücknahme, Export/Löschung, Cookiefälschung, Neustart, Ablauf, beschädigte Zeilen, Aufbewahrung und unveränderte Freigabesperren ab. Browserprüfungen enthalten alle drei Sprachen, schmale Darstellung, Axe, Audio, Muster-PDFs und offline nutzbare KI-Prüfberichte. Konkrete Zahlen und alle fünf erforderlichen GitHub-CI-Jobs am finalen Commit stehen im Entwurfs-PR.

Die getrennten offenen PRs #136/#143/#144/#145 sind nicht enthalten. Deren spätere Integration ändert die Prüfwerte und erfordert neue Prüfvorlagen. Dieser Branch ändert keine Katalog-/Lektionsversion (Basis weiterhin 27). Keine Veröffentlichung; unabhängig von der technischen Übergabe bleiben P4.17-Rechtsprüfung, produktive Anbieter-/Kontobindung, Fach-/Quellen-/Sprachprüfung, reale Geräte/Screenreader und formale Phase-4-Freigabe offen. P4.01 weiter bis F14/Rechtsklärung zurückgestellt.
