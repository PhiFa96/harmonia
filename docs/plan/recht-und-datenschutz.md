# P2.21 – Recht und Datenschutz

Stand: 14.10.2026. Die technische Umsetzung und das Abnahmepaket sind vorbereitet. **Die juristische Definition of Done ist offen.** Phillip hat F17 auf zwölf Monate festgelegt; Betreibername/Rechtsform, ladungsfähige Anschrift, Kontakt und geprüfte Texte stehen noch nicht fest. `main` bleibt unverändert; Claude Code übernimmt Review/Merge. Entscheidung: [ADR 0021](../decisions/0021-datenschutz-und-kuerzung-von-lernnachweisen.md).

## Funktion und Gestaltung

`/legal` und `/privacy` sind vor Onboarding und Anmeldung erreichbar, auch bei einem Geräteladefehler. Das Profil führt zu beiden Bereichen, der Webfuß zu Rechtlichem und öffentlichem Kündigungseingang. DE, US und UK verwenden bestehende Figtree-/Card-/ListItem-/BottomSheet-Bausteine, Design-Tokens, klare Fokus-/Screenreader-Beschriftungen und einspaltige responsive Inhalte.

Der Rechtsbereich bindet Impressum, Datenschutz, Nutzungsbedingungen und Widerruf DE/EN über geprüfte HTTPS-URLs ein; fehlende Texte sind sichtbar nicht verfügbar. Er enthält vorhandene Noten-/Schrift-/Klang-Credits und die KI-Kennzeichnung: Die Engine bewertet, der Tutor erklärt und kann Fehler machen. Eigene Arbeitsentwürfe in [docs/legal](../legal/README.md) werden nicht als fertige Verträge in App-Bundles eingebunden.

Der Datenschutzbereich erklärt zwölf Monate, bietet privaten Konto-/Gast-JSON-Export und getrennte Zwecke. Analytics/Marketing sind inaktiv; für eine spätere Einführung ist eine konkrete neue Einwilligungsoberfläche erforderlich. Erinnerungen nutzen expliziten Push-Wahlbeleg plus Systemberechtigung. Offline-Widerruf stoppt lokale Verarbeitung sofort, bleibt bis zur Speicherung/Synchronisation sichtbar offen und blockiert Remote-Zustellung nach Serverbestätigung. Ohne Netz kann ein anderes Gerät den Widerruf erst bei der nächsten Synchronisation erfahren.

Kontolöschung öffnet zunächst eine Bestätigung. Erst nach Bestätigung über weiterlaufende Abos kann gelöscht werden. Über 15 Minuten alte Authentifizierung verlangt erneuten E-Mail-Code; bloßes Tokenrefresh bzw. eine Anmeldung in einer anderen Sitzung genügt nicht. Wechsel des Kontos schließt eine schon geöffnete Bestätigung. Der Beleg unterscheidet entfernte Supabase-Daten von offenen Anbieteraufträgen. Ein abgebrochener Ablauf nutzt dieselbe Anfrage-ID; beim nächsten Start/Vordergrund werden bereits bestätigte Löschungen lokal nachgeholt.

## Daten, Zugriff und zwölf Monate

- `privacy_consents`: unveränderliche einzelne Wahlbelege mit Zweck, Version und Sprache; Nutzer können nur eigene Belege lesen. Schreib-RPCs und Betriebslisten sind service-only.
- `privacy_erasure_receipts`, `privacy_external_erasure`: privater Wiederanlauf und ausdrücklich offene Anbieterbearbeitung. Öffentlich abrufbar ist nur der knappe Beleg über eine zufällige UUID, ohne E-Mail/Konto-ID.
- Export: erlaubte paginierte Bereiche, eigene Zeilen, eigene Geräte-/SQLite-Daten. Keine Sitzungs-/Service-/Push-/Revoke-/Lease-Schlüssel. Fremde Transfer-IDs und Subscriberattribute werden nicht exportiert. Die JSON-Gesamtgröße ist begrenzt; bei Abbruch wird keine vollständige Datei behauptet.
- Neue Lernuploads erzeugen kanonische Zusammenfassungen. Nach zwölf Monaten ab Servereingang ersetzt der Job Rohantworten durch `retained`; lokale Frist zählt ab Aufgabenabschluss. IDs/Originalhashes verhindern zweite Energie-/XP-Buchungen und erneute Rohdatenspeicherung. Bestätigter Fortschritt, XP, Münzen und Seriennachweise bleiben. Geänderte Altquellen erzeugen keine neue erfundene Bewertung.
- Clientformat 2 liest gekürzte Ereignisse; frühere Clients erhalten `426 upgrade_required`. Rollout muss vor produktiver Jobaktivierung erfolgen. Gast-Kurzbelege sind kein neuer Server-Beweis.
- SQLite bereinigt alte aktive/abgeschlossene Entwürfe, Einstufungskopien und Mini-Antworten; erledigtes Onboarding bleibt nach Kürzung erledigt. Kontolöschung entfernt eigene scoped Caches, zugehörige Legacykopien und eigene Onboardingdaten. In-memory Schreibsperren verhindern verspätete Rückschreibungen, persistente Anfragenmarker ermöglichen Wiederaufnahme.
- Tutor-Nachrichten werden nach ihrem Alter gelöscht; ein kürzlich fortgesetzter alter Dialog behält aktuelle Nachrichten, verliert aber den alten Aufgabenkontext. Bei alter ursprünglicher Kontextidentität kann ein neuer Dialog nötig sein. Kosten-/Wiederholungsmetadaten bleiben. Alte Inhalts-/Tutorberichte, abgelaufene Energiequellen und Billing-Payloaddetails werden begrenzt bereinigt.
- Kündigungseingänge laufen nach der vorbereiteten Frist aus, außer konkret befristetem `hold_until`/`hold_reason`. Kontolöschung beendet keine Verträge und ersetzt diese Rechtsprüfung nicht.

[Verarbeitungsverzeichnis](../legal/verarbeitungsverzeichnis.md), [Löschkonzept](../legal/loeschkonzept.md), [Dienstleisterprüfung](../legal/dienstleister.md), [DSFA-Vorprüfung](../legal/dsfa-vorpruefung.md) und [Store-Angaben](../legal/store-datenschutz.md) beschreiben den tatsächlichen Stand und die offenen Verantwortlichkeiten.

## Betrieb und Freigabe

Migrationen `20261014070000` bis `20261014090000` additiv anwenden. Keine automatische lokale/Remote-Datenbankrücksetzung. Functions `privacy` und `privacy-retention` mit ihrem Importmap bereitstellen; sie prüfen eigenen JWT bzw. Servicebearer selbst. Der Retention-Endpoint benötigt keine neue externe Providerbindung. Wiederholungen mit `more=true` drainieren Chargen, ohne immer dieselben Billing-Payloads zu kürzen.

[Scheduler-Vorlage](../../supabase/ops/schedule-privacy-retention.sql) erst nach Clientrollout, Abnahme der Fristen/Sicherungen und tatsächlicher Remote-/Vault-Bindung ausführen. Sie ist keine automatische Migration. HTTP-Fehler/Rückstand überwachen, Backupauslauf und Wiederherstellung mit Löschmarkern prüfen. In diesem Schritt wurde kein produktiver Job aktiviert.

Externe Aufträge über die private Betriebsliste bearbeiten. Nur tatsächlich belegte Bearbeitung darf service-only `complete_privacy_external_erasure(job_id, final_state, evidence)` mit `completed`/`not_found` abschließen; die Referenz darf keine Schlüssel enthalten. Simulationen sind ausschließlich lokale Fixturebelege. Anthropic-Korrelation, Providerverträge und eventuelle gesetzliche Ausnahmen sind durch Betreiber/Dienstleister zu klären. `externalPending` wird bis dahin nicht als erledigt ausgegeben.

`apps/mobile/legal-readiness.json` enthält vollständige Betreiber- und Abnahmefelder. `pnpm check:legal` prüft die Vorbereitung; `pnpm check:legal:release` verweigert Freigabe bei offenen Belegen. Erst vollständig geprüfte und veröffentlichte sieben URLs plus `EXPO_PUBLIC_LEGAL_RELEASE_APPROVED=true` erlauben das App-Kaufgate. Expo-Konfiguration verweigert das Flag mit unvollständigem Manifest. Die separate Serverpolicy muss Checkout zusätzlich freigeben; aktuell bleiben Checkout, Analytics und Marketing aus. Strukturprüfung ist keine automatische juristische Prüfung.

Die amtlichen und Store-Hosts waren in der aktiven Cloud-Netzpolicy gesperrt (CONNECT 403). Aktuelle Gesetze, Anbieter-APIs und Fristen wurden deshalb nicht als live geprüft behauptet. Gewünschte Domains und URL-/Flagbindungen werden lediglich im Cloud-Entwurf vorbereitet; ein gespeicherter Entwurf aktiviert sie nicht.

## Validierung und offene Abnahmen

Die lokale Datenschutz-API prüft echte JWTs/Postgres und ausschließlich eigene temporäre Konten, Export aller Kategorien, Kontotrennung, Tokenausschluss, Consent/Widerruf, Aufbewahrung, zwei Billingchargen, Fortschritts-/XP-Erhalt, alte Clients, Löschbestätigung/Neuanmeldung, Auth-Kaskaden, Belegwiederaufnahme, Anbieterstatus und Belegablauf. Kein Anbieter wurde kontaktiert, keine Nachricht oder Zahlung ausgelöst. SQLite-/State-/UI-Prüfungen ergänzen diese Integration.

Prüfungen: 2.289 Pakettests; vollständige App-Prüfung mit 525 Fällen plus zwei nach dem Browserfund ergänzte Startschutzfälle; 101 CLI-/Pipelinefälle (zusammen 2.917 unterschiedliche Fälle). SQL-Lint und 310 pgTAP-Fälle sind grün, Datenschutz-API 102 lokale Prüfungen. Lernsync (226 Offline-Belege/Paging), Motivation/17 ersetzte Push-Jobfälle, Billing/81 und Energie-/Kündigungseingang/48 sind weiterhin geprüft. Lint, vollständige Typen, Formatierung, Übersetzungen, Inhalts-/Fähigkeitsgraph, Deno und die vorbereitete Freigabeprüfung bestehen. `check:legal:release` scheitert mit 25 offenen Belegfeldern erwartungsgemäß.

Die letzte Browserprüfung umfasst 16 Fälle: DE/US/UK vor Onboarding, deaktivierte ungebundene Rechtstexte, tatsächlicher Gast-/Konto-JSON-Download ohne Tokens/fremde Konten, echte Löschung eigener lokaler Testkonten, zweite Bestätigung, andere Konten und Wiederaufnahme nach einer verlorenen Antwort unter einem inzwischen angemeldeten anderen Konto. Keine ungefangenen Browserfehler. Ein tatsächlich gefundener Startfehler ist behoben: Die öffentliche Datenschutzseite darf ihren ersten Export-/Löschzugriff erst nach der Geräte-/SQLite-Initialisierung starten. Währenddessen bleibt sie lesbar; bei Ladefehler kann erneut geladen werden.

Vorschau: Web sowie iOS-/Android-Hermes exportiert. Öffentliche Web-/native-JS-Exporte werden getrennt geprüft; der Inhaltsscan umfasst sieben JS-Dateien ohne Entwurfs-IDs oder Entwurfstexte. Die öffentliche Webfassung besteht zusätzlich neun DE/US/UK-Prüfungen bei 375 Pixeln: erreichbare Rechtsseiten, geschlossene ungebundene Veröffentlichungen, tatsächlicher Gastdownload nach fertiger SQLite-Initialisierung und kein horizontaler Überlauf oder Browserfehler. Dies sind Bundle-/Browserprüfungen und keine physische Store-/Geräteabnahme. Echte Geräte/Teilen, juristische Prüfung, fertige Betreibertexte, unterschriebene AV-Verträge, tatsächliche Anbieter-Löschprozesse, Backup-/Jobbetrieb, Storeformulare und Alters-/Steuer-/Vertrags-/Lizenzabnahme bleiben offen. P2.22 kann technisch auf dem geschlossenen Analytics-Guard aufbauen; reale Datenerfassung wartet auf dessen getrennte Freigabe.


[Review P2.20 → P2.21](https://github.com/PhiFa96/harmonia/compare/codex/p2-20-paywall-limits...codex/p2-21-privacy-compliance?expand=1). Kein GitHub-API-/PR-Erstellungszugang verfügbar; der Vergleich dient Claude Code zur getrennten Review- und Merge-Übergabe.
