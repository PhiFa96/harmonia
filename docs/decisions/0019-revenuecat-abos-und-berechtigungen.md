# ADR 0019 – RevenueCat-Abos und serverseitige Berechtigungen

- Datum: 14.10.2026
- Status: technisch umgesetzt; Anbieterbindung und echte Sandbox-Abnahme offen
- Bezug: P2.19, P2.15, P2.20

## Entscheidung

Phillip möchte monatliche und jährliche Abos vorbereiten; Preise werden später festgelegt (F08 bleibt für den Launch offen). Die App zeigt ausschließlich die lokalisierten Preise tatsächlich geladener RevenueCat-Pakete. Es werden keine Preise oder realen Store-Produktkennungen erfunden. Die Offerings heißen `premium` und `max`, mit `$rc_monthly`/`$rc_annual`. Max-Käufe sind bis zur ausdrücklichen Produktfreigabe standardmäßig ausgeschaltet; die geplanten Max-Funktionen liegen teilweise erst in Phase 3/4.

Native Käufe verwenden `react-native-purchases` 10.13.0; Web Billing verwendet `@revenuecat/purchases-js` 1.70.0. Beide sind hinter derselben Schnittstelle und werden erst bei einem angemeldeten Konto mit passendem öffentlichem Plattformschlüssel geladen. Die App-User-ID ist die bestätigte, nicht anonyme Supabase-ID. Wiederherstellung ist ausdrücklich nutzergesteuert; im Web bedeutet sie erneutes Laden desselben Kontos. Es gibt keine Käufe als Gast und keine automatischen bezahlten Retries.

Identitätswechsel und Käufe werden serialisiert. Die Oberfläche löscht Kontodaten synchron bei Logout/Kontowechsel und verwirft verzögerte Ergebnisse. Ein laufender Store-Kauf lässt sich durch Logout nicht zuverlässig abbrechen; deshalb wird die SDK-Identität erst nach dessen Abschluss gewechselt. Sein Ergebnis wird dem alten Kaufkonto zugeordnet und nicht im neuen Konto angezeigt. Native Logout erzeugt die vom SDK verlangte anonyme Identität; dort kann die App nichts kaufen. Web Logout schließt die SDK-Instanz. Direkter Web-Kontowechsel verwendet `changeUser`, kein Aliasing.

## Server entscheidet über Zugang

RevenueCat-Webhooks besitzen einen konfigurierten `Authorization: Bearer …`-Wert, keine von uns erfundene HMAC-Signatur. Die Function prüft diesen Wert, die zugelassenen RevenueCat-App-IDs und die Umgebung. Sie speichert einen begrenzten, validierten Ereigniskern in `billing_events`; E-Mail, Subscriber-Attribute, Tracking-IDs und Header werden nicht übernommen. Derselbe Ereignisbezeichner mit anderem Kern liefert 409; bereits verarbeitete Wiederholungen liefern 200.

Ereignisse erteilen selbst keine Berechtigung. Für alle betroffenen existierenden Supabase-Konten wird der aktuelle Subscriber über die fest gebundene RevenueCat-V1-API abgefragt. Das vermeidet Reaktivierung durch verspätete Ereignisse und berücksichtigt Änderungen auf einem anderen Gerät. Transfers können ohne Ereignisumgebung eintreffen; ihr aktueller Kontostand wird weiterhin ausschließlich für die konfigurierte Umgebung ausgewertet. Auch alte/aliasierte Konten werden erneut abgefragt, ohne deren Berechtigungen aus der Zielidentität abzuleiten.

Eine DB-Lease serialisiert Fetch und vollständige Projektion pro Konto. Ablauf, falsche Lease und ältere Provider-Zeitstempel verhindern Commit. Fehlende Berechtigungen im validen vollständigen Snapshot werden deaktiviert; kaputte Antworten oder Anbieterfehler verändern keine vorhandene Berechtigung. 503 lässt den Webhook wiederholen, einschließlich teilweise abgeschlossener Transfers. Kündigung beendet Verlängerung, erhält aber den bezahlten Zugang. Ablauf/refund entfernen Zugang; eine vom Provider bestätigte Schonfrist erhält ihn bis zu ihrem Ende. Store und Sandbox/Produktion werden ausdrücklich geprüft. Unbekannte Stores, Test Store, lebenslange/promotional Grants und fehlende Subscription-Daten werden nicht als bezahltes Monats-/Jahresabo akzeptiert.

Ein eigener authentifizierter `billing`-Endpunkt zeigt nur das eigene Konto und bietet begrenzte explizite Neusynchronisation. Der Client sendet keine User-ID, Receipts oder Entitlement-Proofs. Manuelle Versuche sind auf zehn Sekunden begrenzt, auch nach Providerfehlern. `entitlements` bleibt für Clients schreibgeschützt; der bestehende Tutor verwendet unverändert dessen wirksamen, nicht abgelaufenen Zugang. Temporäre aktive Admin-Grants mit `store=manual` werden nicht durch leere RevenueCat-Snapshots gelöscht.

## Grenzen und Abnahme

Der minimale Abo-Bereich im Profil bietet Kauf, Wiederherstellung, Aktualisierung und geprüfte Anbieterlinks. Bestehender SDK-/Serverzugang verhindert einen weiteren Kauf und verweist auf die Abo-Verwaltung. Die komplette Angebotsvergleichs-Paywall, Gratis-Limits, finale Rechtstexte und der deutsche Web-Kündigungsbutton folgen P2.20/P2.21.

Lokale API-/DB-, Adapter-, Kontowechsel- und Oberflächentests ersetzen keine Store-Sandbox-Käufe. Ohne Anbieterzugang wurden keine Produkte, Apple-/Google-/Stripe-Projekte, Remote-Secrets oder Small-Business-Anträge angelegt, keine reale Zahlung ausgelöst und keine Remote-Function bereitgestellt. Die Definition of Done von P2.19 bleibt bis zur protokollierten iOS-/Android-/Web-Abnahme offen. Technische Konfiguration und Abnahmeschritte: [Übergabe P2.19](../plan/abos-revenuecat.md).
