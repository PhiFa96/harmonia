# P4.18 – Zertifikate als interner technischer Prototyp

Stand: 25.10.2026 · ursprünglicher Prototyp `codex/p4-18-certificate-draft` (#104), Weiterbau `codex/p4-18-review-bound-draft`

**Ausdrücklich beauftragte technische P4-Vorarbeit vor der formalen Phase-4-Freigabe.** P4.17, fachliche Prüfungsfreigaben, verbindliche Bestehens-/Wiederholungsregeln und Zahlungsentscheidungen bleiben offen. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt. Kein Deployment, keine Veröffentlichung, keine gültigen Zertifikate.

## Lokal ausprobieren

```sh
corepack pnpm certificates:preview
```

Die getrennte Web-Werkstatt läuft ausschließlich auf `http://127.0.0.1:8237`. Ein anderer lokaler Port ist über `HARMONIA_CERTIFICATES_PORT` möglich. Es gibt keinen öffentlichen App-Einstieg, keine Supabase-Bereitstellung und keinen Veröffentlichungsmodus. Der Prototyp ist unabhängig vom offenen Stufe-5-PR #103 auf dem integrierten P3.17-Prüfungskern aufgebaut.

1. Sprache DE/en-US/en-GB und Testprofil Stufe 1 oder 2 wählen.
2. Zwölf Aufgaben ohne Hinweise oder Sofortwertung bearbeiten: acht Theorie- und vier Hörfragen. Notation, Beschreibungen und Klang verwenden die bestehenden Harmonia-Quellen und Engines.
3. Die Serverfrist beträgt 20 Minuten; jede richtige Antwort gibt fünf Punkte. Abgeben oder Fristablauf werten offene Aufgaben mit null Punkten. Die Uhr läuft beim Verlassen weiter; Reload, Übersichtswechsel und Serverneustart erlauben die Wiederaufnahme mit demselben Browser-Cookie.
4. Die Auswertung zeigt Theorie, Gehörbildung und Gesamtergebnis. **80 % und vollständig beantwortete Aufgaben sind ausschließlich eine technische Testgrenze**, keine fachlich freigegebene Bestehensregel. Die Profile bilden keine vollständigen Stufenabschlussprüfungen ab.
5. Bei erfüllter Testgrenze ein mit **ENTWURF / UNGÜLTIG** gekennzeichnetes PDF herunterladen. Es enthält Punkte, Profil-/Inhaltsversion, UTC-Erstellungszeit, einen zufälligen Muster-Prüfcode und ausdrückliche Gültigkeitsgrenzen. Figtree wird eingebettet, damit die Darstellung ohne installierte Schrift funktioniert.
6. Code in der lokalen Werkstatt prüfen, widerrufen oder sämtliche eigenen Testdaten löschen. Die Codeprüfung liefert nur Entwurfs-/Widerrufsstatus, Stufe, Profilversion und Erstellungszeit. Sie bestätigt weder Identität noch Qualifikation. Bereits heruntergeladene PDFs bleiben nach einem Widerruf bestehen und verweisen auf den aktuellen lokalen Prüfstatus.

## Server und Daten

**Weiterbau mit P4.17:** Die lokale Zusammenführung der Entwurfsstände #104 und #109 enthält jetzt eine zusätzliche Bindung an die Prüfungsimplementierung, nicht nur die erzeugten Aufgaben. `source_hash` wird beim Serverstart über Werkstatt, Inhalte, Engines, Übersetzungen, Schriften und Lockfile ermittelt und beim Start eines Durchgangs gespeichert. Neue Dateien in den überwachten Verzeichnissen zählen mit. Nach Codeänderungen den Server neu starten; laufende Prozesse werden nicht automatisch neu geladen. Ein veralteter oder ungebundener Altbestand erscheint als eigener Zustand ohne Aufgaben/Ergebnis und kann nicht fortgesetzt, neu bewertet oder als neues PDF ausgegeben werden. Die additive lokale Migration löscht keine bestehenden Zeilen. Eigene Daten können gelöscht und anschließend neue Testdurchgänge begonnen werden. Bereits vorhandene Muster bleiben ungültig; der technische Hash ist keine Freigabe. Siehe [ADR 0045](../decisions/0045-zertifikatsentwuerfe-an-pruefcode-binden.md).

- Der Server wählt Seed, Aufgaben und Frist. Antworten bestehen nur aus Durchgangs-ID, aktuellem Index, Auswahl und Sprache. Clientpunkte, Zeitstempel, Ergebnisse und zusätzliche Felder werden abgewiesen.
- Der P3.17-Kern erzeugt und bewertet die Aufgaben erneut. Ein Fingerabdruck bindet Profil, Inhalte und erzeugte Aufgaben; eine geänderte Inhaltsfassung erlaubt keine Fortsetzung mit stillschweigend geänderten Fragen.
- Der Browser erhält nur die aktuelle Aufgabenansicht; keine Seeds, zukünftigen Aufgaben, Lösungshinweise oder Bewertung vor Abschluss. Hörfragen geben keine Notengrafik aus. Dies ist keine beaufsichtigte Prüfung und kein Schutz gegen Hilfsmittel oder externe Analyse des Hörmaterials.
- Antwortwiederholungen sind idempotent; abweichende Wiederholungen und übersprungene Indizes werden abgewiesen. Abschluss und Codevergabe erfolgen gemeinsam in einer SQLite-Transaktion. Eine Wiederholung erzeugt einen neuen Durchgang und Seed; maximal 20 lokale Durchgänge je Cookie, insgesamt 5.000.
- Ein zufälliges HttpOnly-/SameSite-Strict-Cookie trennt Browser-Sitzungen; gespeichert wird dessen Hash. Das ist eine lokale Testidentität, kein Benutzerkonto und keine Identitätsprüfung. Fremde Sitzungen erhalten weder Durchgänge noch PDFs oder Widerrufsrechte.
- Alle schreibenden API-Aufrufe und Code-/PDF-Abfragen verlangen dieselbe Origin und JSON. Der Server bindet fest an Loopback und prüft den Host. Keine Zugangsdaten, Prüfcodes oder Antworten in Serverlogs oder öffentlichen URLs.
- SQLite liegt ausschließlich unter dem ignorierten `artifacts/certificates/drafts.sqlite` (Verzeichnis 0700, Datei 0600). Keine Namen oder sonstige Identitätsfelder, keine Kontosynchronisation, Lernnachweise, XP oder Zahlungen. Datensätze und Codes werden nach sieben Tagen ab Start beim nächsten Zugriff entfernt. Die Löschfunktion entfernt nur die eigenen Datensätze sofort; Browser-Cookie löschen allein löscht die Serverdaten nicht.
- Nach Verlust des Cookies kann ein Durchgang nicht wiederhergestellt werden; seine automatische Aufbewahrungsgrenze bleibt bestehen. Antworten müssen vor Ablauf beim Server eintreffen; offline eingegebene Antworten erhalten keinen nachträglichen Zeitbonus.

## Prüfungen

### Private Prüfmappe und Veröffentlichungssperre

```sh
corepack pnpm certificates:review
corepack pnpm check:certificates
corepack pnpm check:certificates:release
```

`certificates:review` erzeugt `snapshot.json`, `de.html`, `en-US.html` und `en-GB.html` ausschließlich unter dem ignorierten `artifacts/certificates/review/` (0700/0600). Die statischen Berichte enthalten **Lösungsschlüssel**, eigene Aufgaben-/Notenquellen, drei feste Seeds je Profil (insgesamt 72 Aufgabenbeispiele), Profilkonfiguration, verwendete Lektionen und ausgelassene Einheiten. Eine verwendete Einheit kann weitere ungeprüfte Fähigkeiten enthalten. Weder diese Liste noch die mit derselben Engine ermittelten Lösungen sind ein unabhängiger Vollständigkeits-/Fachnachweis. Bravura wird mit Lizenz eingebettet; die Mappe benötigt keine externen Ressourcen. Der Prüfungsserver liefert weder die Mappe noch einen Antwortschlüssel-Endpunkt aus.

Beide technischen Prüfstände sind enthalten: der Prüfungsquellcode und der aktuelle P4.17-Snapshot mit offenen Zertifikatsanforderungen. Das KI-Inventar beschreibt jetzt den vorhandenen lokalen Entwurf statt ausschließlich geplanter Zertifikatsfunktionen. Die Prüfmappe ist keine neue KI-Einstufung.

`check:certificates` darf bei offenen Abnahmen erfolgreich sein und läuft in CI. `check:certificates:release` muss mit Exitcode 1 sperren: ungültiger Musterbetrieb, fachliche Abschlussinhalte, verbindliche Prüfungsregeln, Identität/Datenschutz, Zahlung/Erstattung, Betrieb/Verifikation, Geräte/Barrierefreiheit, formale Phase 4 und die P4.17-Nachweise sind offen. Es gibt weiterhin keinen Produktmodus; ein Rechtsformular allein schaltet keine gültigen Zertifikate frei.

```sh
corepack pnpm certificates:test
corepack pnpm certificates:test:web
```

Node-Prüfungen decken beide Profile in allen drei Sprachen, 60-Punkte-Läufe, Testgrenze, Frist, vorzeitige Abgabe, manipulierte Anfragen, doppelte/parallele Antworten, Sitzungstrennung, Neustart, Quellenwechsel, PDF-Download, Widerruf, Löschung und Aufbewahrung ab. HTTP-Tests nutzen den tatsächlichen lokalen Server und SQLite. Browserprüfungen verwenden eigene temporäre Datenbanken, keine echten Konten oder Dienste; sie prüfen den vollständigen Ablauf, Reload, Audio, schmale Darstellung, Axe, PDFs und Codeprüfung. Diese Prüfungen laufen in der Werkzeug-/Web-CI. Die Testdatenbank wird nicht als CI-Artefakt hochgeladen; nur synthetische Browserbelege und Muster-PDFs.

Die vorhandenen P3.17-Regressionstests bleiben erhalten. Die Erweiterung des Prüfungskerns ist eine generische Vorlagenkennung, damit die internen Profile nicht in die bisherigen App-Vorlagen oder den öffentlichen Katalog aufgenommen werden müssen. Neue UI-Texte liegen in einem ausschließlich vom lokalen Werkzeug importierten i18n-Modul. Die Produktions-Bundle-Prüfung weist Entwurfskennungen und zentrale Entwurfstexte zurück; absichtlich verunreinigte Test-Bundles prüfen diese Sperre.

Lokaler Nachweis vom 23.10.2026: 13 Server-/Werkzeugtests, vier Chromium-Abläufe und die neun bestehenden P3.17-Prüfungstests erfolgreich; vollständiger Lint- und Typcheck sowie Produktions-Webexport mit Bundle-Prüfung erfolgreich. Die drei erzeugten Sprachfassungen der Muster-PDFs wurden zusätzlich ausgelesen und die deutsche Fassung gerendert geprüft. Reale Geräte, fachliche Anerkennung und rechtliche Abnahmen sind dadurch nicht geprüft.

## Vor einem Produktangebot offen

- P4.17: schriftliche rechtliche Einordnung und daraus folgende Maßnahmen.
- Fachliche Freigabe fester Stufenabschlussinhalte, anerkannte Bestehensregeln, Wiederholungs-/Gültigkeits-/Widerrufsverfahren und Nachteilsausgleich.
- Kontobindung, Datenschutz und Identitäts-/Prüfungsaufsichtskonzept; die lokale Testidentität reicht dafür nicht.
- Kauf, Erstattung und serverseitige Zahlungsberechtigung; es gibt keine angebundene Zahlung und keine freigeschaltete Ausstellung.
- Produktive Speicherung, Betrieb, veröffentlichte Verifikationsseite, reale Geräte-/Audioabnahme und formale P4-Freigabe.

Diese offenen Punkte sind keine durch Simulation erledigten Abnahmen. Entscheidung: [ADR 0039](../decisions/0039-zertifikate-als-lokaler-pruefprototyp.md).

## Nachweis des Weiterbaus (25.10.2026)

- 24/24 Zertifikats-/Prüfmappe-Tests, darunter echte HTTP-/SQLite-Prüfungen, Codewechsel nach Neustart, additive Altbestandsmigration, gesperrte Neubewertung/PDF-Ausgabe, Quellen-/Lösungsmappe, P4.17-Anbindung und Veröffentlichungssperre.
- 8/8 Chromium-Abläufe: bisheriger DE/US/UK-Prüfablauf, verlorene Antwort/Frist, veralteter Durchgang mit Löschung/Neustart und drei eigenständige Berichte mit eingebetteter Schrift, schmaler Ansicht und Axe. Gleiche Regionsnamen im Bericht wurden nach einem Axe-Befund eindeutig gemacht.
- Vollständige Werkzeugtests: 231/231; vollständiger Lint (mit dem auch in CI gesetzten 4-GB-Heap), Typprüfung und Formatprüfung erfolgreich. Der erste lokale Lint-Aufruf ohne diese Heap-Einstellung erreichte das 2-GB-Node-Limit; der anschließende vollständige Lauf war erfolgreich.
- Produktions-Webexport und Bundle-Prüfung: fünf JS-Dateien ohne Entwurfsdaten; neues deutsches Muster-PDF zusätzlich ausgelesen, gerendert und visuell geprüft.
- Prüfpakete sowie Rechts-, Beta- und P2-Vorbereitung laufen; die Produktfreigaben bleiben gesperrt. GitHub-CI wird für den neuen Entwurfs-PR gesondert ausgewiesen. Lokale grüne Ergebnisse ersetzen keine erforderliche CI oder offene Fach-/Rechts-/Geräteabnahme.
