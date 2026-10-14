# P2.20 – Paywall und Gratis-Limits

Stand 14.10.2026: Energie-Modell, Konto-/Gastgrenzen, Paywall in DE/US/UK und öffentlicher Web-Kündigungseingang sind technisch umgesetzt. Checkout bleibt standardmäßig geschlossen. Echte RevenueCat-/Store-Käufe, geprüfte Rechtstexte und die vollständige Kündigungsabwicklung sind weiterhin offen; dies ist keine juristisch abgenommene Verkaufsfreigabe.

## Verhalten

F06: wiederauffüllbare Energie/Herzen. Startwerte: 30 Punkte und ein neuer Punkt alle zehn Minuten. Neue Lektionen/freie Sätze reservieren ihre gesamte kanonische Aufgabenzahl vor dem ersten Aufgabenbild. Zu wenig Energie öffnet die Paywall vor dem Start. Bereits reservierte Durchgänge, Hinweise und Fehlerwiederholung darin brauchen keine weitere Energie. Bei einem Neustart mit neuer ID wird erneut reserviert; Abbruch erstattet nichts automatisch. Mini-Onboarding und Einstufung sind ausgenommen. Premium/Max verbrauchen keine Lernenergie. Ein Abo ersetzt weder fachliche Voraussetzungen noch Bestehen mit 80 % anrechenbaren Erstversuchsantworten.

Die Anzeige unter Lernen und Üben zeigt den tatsächlichen Vorrat und die nächste Auffüllzeit. Sie aktualisiert sich beim Vordergrundwechsel, periodisch im Vordergrund und nach einer Startentscheidung. Ohne Netzwerk werden neue Konto-Durchgänge verständlich verweigert. Eine lokal gespeicherte Reservierung erlaubt exakt ihren bisherigen Inhalt/Seed offline. Gäste lernen mit lokalem SQLite-Vorrat; die ausdrücklich gewählte temporäre Sitzung behält ihn nur im Speicher. Eine lokale Gastgrenze ist nicht gegen neue Installationen oder absichtliche Daten-/Uhrmanipulation abgesichert.

Die Paywall ist an fünf Stellen erreichbar:

1. Nach frisch abgeschlossenem Onboarding, ausdrücklich überspringbar.
2. Über „Abos vergleichen“ in der Energieanzeige bzw. Abo-Verwaltung.
3. Vor einem neuen Durchgang ohne ausreichende Energie.
4. Vor Aufgaben einer für Gratis gesperrten Kursstufe.
5. Über die ausdrückliche Tutor-Angebotsauswahl.

Ein laufender Durchgang wird nie durch Energieprüfung oder Werbung unterbrochen. Ein Netzfehler erzeugt eine Wiederholungsmöglichkeit statt einer automatischen Paywall. Die Vergleichsansicht nennt nur veröffentlichte Kurse und getrennte Tutor-Kontingente. Max ist in Vorbereitung und standardmäßig nicht verkäuflich. Die Periodenauswahl übernimmt reale Monats-/Jahrespreise aus dem SDK; keine erfundenen Rabatte, Preisfreigaben oder Probezeiträume. Wiederherstellung und bestehende Abos bleiben in der Verwaltung verfügbar.

## Policy und Reservierung

Die additive Migration `20261014050000_access.sql` ergänzt ausschließlich serverlesbare Tabellen `access_policy`, `access_energy`, `access_grants` und Service-RPCs. `GET /access?public=true` liefert die öffentliche Policy, eigene Kontoabfragen benötigen ein nicht-anonymes JWT. `POST /access` akzeptiert lediglich eine stabile Durchgangs-ID und Quelle: Lektion/Version/Planfingerprint/Seed oder freier Satz/Version/Seed. Der Server leitet Kosten und Stufe selbst ab und verwendet ausschließlich veröffentlichte Inhalte; `HARMONIA_LOCAL_PREVIEW=true` erlaubt Entwürfe nur im ausdrücklich lokalen Backend.

Startpolicy:

```json
{"version":1,"model":"energy","energyCapacity":30,"energyRefillSeconds":600,"freeMaxLevel":2,"checkoutEnabled":false,"adsPrepared":true,"adsEnabled":false}
```

`access_policy.revision` steigt automatisch bei Änderungen. Kapazität ist 20–1000, Intervall 60–86400 Sekunden; alle sichtbaren Werte kommen aus der Policy. Neue Raten erzeugen keine rückwirkende Zusatzenergie. Serverentscheidungen verwenden Transaktionszeit und denselben Kontolock; zwei Geräte können nicht denselben Vorrat doppelt ausgeben. Derselbe reservierte Durchgang ist auch nach leerem Vorrat oder Abo-Ablauf zugänglich. Andere Quelle unter gleicher ID wird verweigert. Seeds behalten ihren Zahlen-/Texttyp.

`learning-sync` prüft auch Alt-/Gastimporte und reserviert bislang unbekannte kanonische Durchgänge atomar mit Lernnachweis/XP. Alter Client-Zeitstempel umgeht keine Kontoenergie. Wiederholte Events zählen nicht doppelt. Der Client sendet einen Beleg pro Upload, damit ein großer Altbestand den ersten finanzierbaren Beleg nicht blockiert. Größere Gastbestände können dadurch schrittweise importiert werden; abgelehnte Belege bleiben lokal. Kontoenergie und Gastenergie sind getrennt, eine historische Gastreservierung wird nicht als vertrauenswürdiger Serverbeleg übernommen.

## Checkout und Rechtstexte

Öffentliche Buildvariablen, ausschließlich juristisch geprüfte HTTPS-Dokumente:

- `EXPO_PUBLIC_LEGAL_TERMS_DE` / `EXPO_PUBLIC_LEGAL_TERMS_EN`
- `EXPO_PUBLIC_LEGAL_PRIVACY_DE` / `EXPO_PUBLIC_LEGAL_PRIVACY_EN`
- `EXPO_PUBLIC_LEGAL_IMPRINT`

Anbietersecrets bleiben auf dem Server. Ungültige URL-Bindungen brechen schon vor Metro ab. Fehlende Bindungen lassen die App gratis starten, sperren jedoch Kaufbuttons. Zusätzlich muss der Betreiber nach tatsächlicher Abnahme `checkoutEnabled` serverseitig aktivieren. Der Kaufcontroller lädt unmittelbar vor dem SDK-Aufruf einen neuen Zugangsstatus und prüft dessen aktuellen Kontobesitzer. Späte Antworten nach Kontowechsel werden verworfen. Die Abo-Verwaltungsseite enthält keinen direkten Kaufpfad.

## Öffentlicher Kündigungseingang

Der dauerhaft sichtbare Weblink „Verträge hier kündigen“ öffnet `/cancel-subscription`, auch vor Onboarding/Anmeldung und bei einem Gerätespeicherfehler. Das Formular hat einen gesonderten Prüfschritt und „Jetzt kündigen“ als Übermittlungsbutton. Web-Abos, ordentliche/außerordentliche Kündigung (Grund erforderlich), gewünschtes Datum/frühestmöglich und Vertragsdaten sind vorgesehen. Apple-/Google-Abos verweisen weiterhin auf ihre Stores.

`POST /cancellation` benötigt keine Kontoanmeldung, begrenzt Körper/Felder und nimmt dieselbe ID/Körper-Kombination idempotent entgegen. Die additive Migration `20261014060000_cancellation.sql` speichert eine unveränderliche Erklärung mit Server-Eingangszeit. Fünf neue Erklärungen je E-Mail/Stunde sind vorgesehen; dieselbe Erklärung kann weiterhin erneut bestätigt werden. Eingangsbelege sind als Textdatei speicherbar. Andere Konten/Gäste können die Tabelle und personenbezogenen Angaben nicht abfragen.

**Noch keine vollständige §312k-Abnahme:** Eingang ist keine automatische Vertragsbeendigung. `cancellation_requests.status='received'` ist eine Betreiber-Arbeitsliste. Der zuständige Betreiber muss Erklärungen zuordnen, Beendigungsdatum prüfen, beim tatsächlichen Webanbieter verarbeiten und die gesetzlich erforderliche Bestätigung über einen sicher gebundenen Versand zustellen. `processing`, `completed`, `needs_contact`, `processed_at` und `provider_reference` sind für diese dokumentierte Bearbeitung vorbereitet. Erst Anbieterbeleg und versandte Bestätigung rechtfertigen `completed`. Es wird kein unbestätigter RevenueCat-Kündigungsendpunkt angesprochen und kein Konto anhand einer fremden E-Mail öffentlich verraten. Ohne Betreiber-/Versand-/Anbieterbindung darf Checkout nicht aktiviert werden. Aufbewahrung, Zugriff, Löschung und Datenschutztext werden in P2.21 festgelegt.

## Werbung später

F09 ist entschieden: nur vorbereiten. Die Policy markiert dies; `preparedAdSlot` akzeptiert allein das Ende eines Gratis-Durchgangs. Kein SDK oder Anzeigenabruf, keine Münz-/Energiebelohnung, keine Werbung bei bezahlten Konten oder während Aufgaben. Anbieter, Einwilligung, Altersregeln und tatsächliche Einbindung bleiben spätere Arbeit.

## Prüfung und Fortsetzung

Lokaler Prüfweg, ohne Zahlungen oder externe Nachrichten:

```bash
source /workspace/harmonia-env.sh
pnpm db:start
pnpm exec supabase migration up --local
pnpm db:serve:learning --tutor-test --billing-test
# Zweite Shell:
pnpm db:test:access
pnpm db:test:learning
pnpm db:test:motivation
pnpm db:lint
pnpm db:test
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm check:i18n
```

Die lokale Prüfung verwendet echte Supabase-JWTs, Postgres und Edge Functions. RevenueCat-Zahlungen und Versand werden dadurch nicht behauptet. Am 14.10.2026 bestehen insgesamt **2890 Paket-/App-/Werkzeugprüfungen** aus Gesamtläufen und gezielten Nachläufen, darunter 504 App-Prüfungen mit zwei zusätzlichen Startregressionen. **310 pgTAP-Prüfungen**, SQL-Lint, **48 Vorschau- und 46 öffentliche Energie-/Kündigungs-API-Prüfungen**, 226 Lernsync-Belege sowie Motivations-/Push-Regressionen bestehen. Die vollständige Deno-Prüfkette besteht; nach der Körpervalidierungsänderung ist die Zugangsfunction zusätzlich erneut typgeprüft. Typen, Lint, Format, Übersetzungen, Inhalte und Fähigkeitsplan sind geprüft. Tatsächliche Vorschau-Exporte liefern Web und native Hermes-Bundles für iOS/Android; öffentliche Exporte und ihre Inhaltsgrenze sind geprüft. Keine native Geräte-/Store-Abnahme wird daraus abgeleitet. Im mobilen Chromium bestehen öffentlicher Kündigungseingang ohne Anmeldung, Prüfschritt, realer Eingangsbeleg/Download, Onboarding mit überspringbarer Paywall, drei komplette freie Sätze und Ablehnung des vierten bei drei Energiepunkten; Rückkehr erhält das Ergebnis. Ein dabei gefundener gleichzeitiger erster SQLite-Start wurde durch Warten auf den Gerätespeicher behoben und mit zwei Regressionen abgesichert. CI prüft die neuen Migrationen aus einer leeren Datenbank und die Energie-/Kündigungs-API; keine bereits grüne GitHub-CI wird behauptet.

Vor Verkaufsfreigabe offen: aktuelle Anbieter-/Storebindung und Sandbox-Abnahme aus P2.19; echte Rechtstexte DE/EN und Betreiberverantwortung; vollständige Webkündigung einschließlich Bestätigungsversand und dokumentierter juristischer Abnahme; native Geräteprüfung. P2.21 – Recht und Datenschutz ist der nächste technische Schritt. Claude Code übernimmt Review und Merge; `main` bleibt unverändert. [Review P2.19 → P2.20](https://github.com/PhiFa96/harmonia/compare/codex/p2-19-revenuecat...codex/p2-20-paywall-limits?expand=1).
