# ADR 0024 – Statische Website und getrenntes Store-Prüfpaket

- Datum: 15.10.2026
- Status: technische Umsetzung; Name/Domain, Betreiberangaben und Veröffentlichungsfreigabe offen
- Kontext: P2.24

Die Website wird als sechs statische HTML-Seiten in den vorhandenen Expo-Webexport unter `/about/` eingebaut: Start- und Supportseite in DE, US und UK. Die Web-App bleibt unter `/`, die vorhandenen Rechts-/Datenschutz-/Kündigungsrouten bleiben erhalten. So entstehen keine zweite App-Laufzeit, kein neues Framework und keine weiteren Laufzeitabhängigkeiten. Navigation, Sprachwechsel und FAQ funktionieren ohne JavaScript. Farben, Typografie, Abstände und Bewegung stammen aus `packages/ui`; Figtree wird mit OFL lokal ausgeliefert. Alle öffentlichen Texte liegen in `packages/i18n/src/storefront.json`.

Die Website enthält keine Tracker, externen Schriften, Preisbehauptungen oder erfundenen Store-Links. Ein noch fehlender Supportkontakt wird als Vorbereitung angezeigt. Impressum und Datenschutz nutzen die vorhandenen geprüften URL-Bindungen, bis dahin den bestehenden Rechtsbereich. Private Datenschutzeinstellungen sind getrennt erreichbar. Vorbereitungsseiten tragen `noindex,nofollow`; kanonische URLs und Sprachverweise entstehen nur aus einer ausdrücklich konfigurierten öffentlichen HTTPS-Origin. Eine Veröffentlichungsprüfung verlangt zusätzlich die bestehenden Rechtsbelege und tatsächlichen Dokument-URLs. Name, Domain und Websitefreigabe benötigen eigene Belegreferenzen.

Store-Texte werden für beide Anbieter in DE/US/UK exportiert und gegen konservative Feldbudgets geprüft. Veröffentlichungsangaben und Links kommen aus einem Manifest mit absichtlich offenen Werten. Keine Altersfreigabe, Preise, Domain oder Betreiberidentität erfinden. Die aktuelle Store-Konsole muss Anforderungen, Zielgrößen und Angaben vor einer Einreichung bestätigen; hier wurden keine Anbieterformulare ausgefüllt oder hochgeladen.

Screenshots und Vorschauvideos entstehen reproduzierbar aus tatsächlichen lokalen Gast-Abläufen. Der Recorder akzeptiert nur einen vom QA-Exporter als isolierte Vorschau markierten Export und startet selbst den lokalen Server. Die Aufnahmen sind ausdrücklich **Web-Referenzen** mit Entwurfsinhalten; keine nativen Geräte- oder Storebelege. Bilder werden unverändert erfasst, Videos aus dem Browsermitschnitt als stumme H.264-Referenz kodiert. Dimensionen, Dauer und SHA-256-Werte werden aus den tatsächlichen Dateien gelesen. Ein Aufnahme-Manifest kennzeichnet Quelle, Git-Stand und ungeprüften Status. Es gibt weder simulierte Tutorantworten in Werbeaufnahmen noch echte Benutzerkonten oder Zahlungen.

Dieses private Prüfpaket liegt ausschließlich ignoriert unter `artifacts/quality` und wird nicht in den öffentlichen Website-/App-Export kopiert. Auch ein vorhandenes Prüfpaket eröffnet keine Veröffentlichung: Rechts-, Marken-/Domain-, Metadaten-, native Medien-, aktuelle Store- und tatsächliche Gerätebelege bleiben erforderlich. Ein Validator prüft Felder, keine Echtheit einer menschlichen Freigabe. Phillip muss die finalen Store-Einträge abnehmen.

Integration ausschließlich über Arbeitsbranch, Pull Request, erfolgreiche erforderliche CI und Reviews. Keine direkten Pushes nach `main`; fehlender GitHub-API-Zugriff ist kein Anlass, den PR-Ablauf zu umgehen.
