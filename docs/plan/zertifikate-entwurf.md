# P4.18 – Zertifikate als interner technischer Prototyp

Stand: 23.10.2026 · Branch `codex/p4-18-certificate-draft`

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

- Der Server wählt Seed, Aufgaben und Frist. Antworten bestehen nur aus Durchgangs-ID, aktuellem Index, Auswahl und Sprache. Clientpunkte, Zeitstempel, Ergebnisse und zusätzliche Felder werden abgewiesen.
- Der P3.17-Kern erzeugt und bewertet die Aufgaben erneut. Ein Fingerabdruck bindet Profil, Inhalte und erzeugte Aufgaben; eine geänderte Inhaltsfassung erlaubt keine Fortsetzung mit stillschweigend geänderten Fragen.
- Der Browser erhält nur die aktuelle Aufgabenansicht; keine Seeds, zukünftigen Aufgaben, Lösungshinweise oder Bewertung vor Abschluss. Hörfragen geben keine Notengrafik aus. Dies ist keine beaufsichtigte Prüfung und kein Schutz gegen Hilfsmittel oder externe Analyse des Hörmaterials.
- Antwortwiederholungen sind idempotent; abweichende Wiederholungen und übersprungene Indizes werden abgewiesen. Abschluss und Codevergabe erfolgen gemeinsam in einer SQLite-Transaktion. Eine Wiederholung erzeugt einen neuen Durchgang und Seed; maximal 20 lokale Durchgänge je Cookie, insgesamt 5.000.
- Ein zufälliges HttpOnly-/SameSite-Strict-Cookie trennt Browser-Sitzungen; gespeichert wird dessen Hash. Das ist eine lokale Testidentität, kein Benutzerkonto und keine Identitätsprüfung. Fremde Sitzungen erhalten weder Durchgänge noch PDFs oder Widerrufsrechte.
- Alle schreibenden API-Aufrufe und Code-/PDF-Abfragen verlangen dieselbe Origin und JSON. Der Server bindet fest an Loopback und prüft den Host. Keine Zugangsdaten, Prüfcodes oder Antworten in Serverlogs oder öffentlichen URLs.
- SQLite liegt ausschließlich unter dem ignorierten `artifacts/certificates/drafts.sqlite` (Verzeichnis 0700, Datei 0600). Keine Namen oder sonstige Identitätsfelder, keine Kontosynchronisation, Lernnachweise, XP oder Zahlungen. Datensätze und Codes werden nach sieben Tagen ab Start beim nächsten Zugriff entfernt. Die Löschfunktion entfernt nur die eigenen Datensätze sofort; Browser-Cookie löschen allein löscht die Serverdaten nicht.
- Nach Verlust des Cookies kann ein Durchgang nicht wiederhergestellt werden; seine automatische Aufbewahrungsgrenze bleibt bestehen. Antworten müssen vor Ablauf beim Server eintreffen; offline eingegebene Antworten erhalten keinen nachträglichen Zeitbonus.

## Prüfungen

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
