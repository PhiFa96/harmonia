# P4.14 – Klassenaufgaben als interner Entwurf

Stand: 24.10.2026 · Arbeitsbranch `codex/p4-14-school-assignments-draft`

**Technische P4-Vorarbeit auf Nutzerauftrag vor der formalen Phase-4-Freigabe.** Der Entwurf baut auf P4.13 / [Entwurfs-PR #105](https://github.com/PhiFa96/harmonia/pull/105) auf. Dieser ist zum Arbeitsbeginn noch nicht integriert; der neue PR gegen `main` enthält deshalb auch diese Voraussetzung. Kein Merge, Deployment oder öffentliches Schulangebot. P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt. Sämtliche Aufgabenquellen bleiben Entwurf; unabhängige Fachprüfung, P4.17, Schulrecht/AVV, echte Authentifizierung und Pilotabnahme bleiben offen.

## Ausprobieren

```sh
corepack pnpm school:preview
```

Es gelten die Voraussetzungen und Grenzen der [P4.13-Werkstatt](schule-dashboard-entwurf.md): Node, Projektabhängigkeiten und lokales Docker; eigener flüchtiger PostgreSQL-17-Container, HTTP ausschließlich auf Loopback, acht frei wählbare **synthetische** Konten. Die Kontenauswahl ist keine Anmeldung. Reguläres Stoppen löscht den Container einschließlich Aufgaben und Antworten; nach hartem Abbruch kann der eigene Container bis zur manuellen Entfernung weiterbestehen. Keine echten Schul- oder Personendaten eingeben.

1. Über die bestehende Werkstatt Organisation, Lehrkraft und Klasse anlegen und mindestens ein Lernkonto per Klassencode aufnehmen.
2. Als zugewiesene Lehrkraft **Klassenaufgaben · Entwurf** öffnen. Titel, Frist und Quellen wählen; Quellen hinzufügen, entfernen und umordnen. Höchstens sechs Quellen und insgesamt 40 Fragen. Die Frist liegt in der Zukunft, höchstens 31 Tage entfernt; Browserzeitzone und aufgelöster UTC-Zeitpunkt werden angezeigt.
3. **Aufgabe zuweisen** friert die konkreten Fragen und die aktuell eingeschriebenen Empfänger ein. Leere Klassen werden abgewiesen. Später Beigetretene erhalten diese alte Aufgabe nicht automatisch. Änderungen erfordern eine neue Zuweisung.
4. Den angezeigten Klassenlink in einem weiteren Browserkontext derselben laufenden Vorschau öffnen und ein berechtigtes synthetisches Lernkonto wählen. Der Link enthält nur die Aufgabenkennung, gewährt keine Rechte und ersetzt keinen Klassenbeitritt. Er ist kein öffentlicher Einladungslink.
5. Bearbeitung starten, Notenbild-/Höraufgaben beantworten und Antworten speichern. Reload und erneutes Öffnen setzen am gespeicherten Stand fort; eine zweite gleichlautende Übermittlung zählt nicht nochmals. Eine abweichende Antwort auf eine bereits gespeicherte Frage wird zurückgewiesen. Pro Empfänger besteht genau ein Durchgang.
6. Alle Fragen bearbeiten oder **Jetzt abgeben** bestätigen. Ablauf und vorzeitiges Beenden durch die Lehrkraft schließen begonnene Durchgänge mit dem erreichten Stand; unbeantwortete Fragen zählen im Nenner. Nicht begonnene Durchgänge werden nicht in Null-Ergebnisse umgewandelt.
7. Das Lernkonto sieht sein eigenes Gesamtergebnis und die Bereiche Notenbild/Gehörbildung. Die Lehrkraft erhält ausschließlich abgeschlossene, für diese Klasse freigegebene Ergebnisse und eine Summe über diese Ergebnisse. Laufende, fehlende und nicht freigegebene Ergebnisse bleiben aus dieser Summe ausgeschlossen. Freigabe/Widerruf erfolgen in der Klassenübersicht.

Die Oberfläche ist in DE, en-US und en-GB verfügbar. Es entstehen keine Noten, XP, Ratings, Münzen oder Zertifikate. Der allgemeine P4.13-Lernstandbericht enthält weiterhin seine erfundenen Nachweise; die neue Aufgabenauswertung verwendet tatsächlich im lokalen Probelauf gespeicherte Antworten und Engine-Bewertungen.

## Aufgaben und Auswertung

Der begrenzte Quellenkatalog enthält vier vollständige vorhandene Lektions-Aufgabenfolgen:

| Quelle | Fragen |
|---|---:|
| `notation.l1.staff.anchor` | 8 |
| `notation.l1.staff.positions` | 10 |
| `intervals.l1.size.numbers` | 8 |
| `intervals.l1.size.direction` | 10 |

Dazu kommen drei Übungsbausteine: Notennamen, visuelle Intervallnummern und gehörte Intervalle, jeweils 1–10 Fragen. Es handelt sich um eigene vorhandene Entwurfsquellen, keine übernommenen Aufgaben und keinen frei wählbaren Gesamtkatalog. Eine ganze Lektion bezeichnet hier ihre Fragenfolge, ohne vorgelagerte Lesekarten oder Lernpfad-Freischaltung. Andere Eingabeformen wie Diktat, Gesang und SATB gehören nicht zu diesem Quellenangebot.

Die bestehende Engine erzeugt einmalig dieselben konkreten Aufgaben für alle Empfänger und bewertet die Antworten serverseitig. Es gibt einen Punkt pro richtiger Frage, keine Zeitboni und keine Benotung. Quellen-/Katalogversion und konkrete Instanzen bleiben im lokalen Datenbankstand eingefroren; ein kanonischer SHA-256-Prüfwert schützt gegen unbeabsichtigte Materialänderungen. Ein abweichender Prüfwert sperrt die Bearbeitung. Das ist keine Signatur gegen einen privilegierten Datenbankbetreiber und keine dauerhafte Archivierung über Engine-Upgrades hinweg. Der Vorschaucontainer wird nicht für solche Upgrades weiterverwendet.

Der Browser erhält nur die jeweils aktuelle Frage, Antwortmöglichkeiten und das erforderliche Notenbild oder Audio. Für Hörfragen gibt es keine zusätzliche Notenanzeige. Die Tonwiedergabe nutzt die vorhandene Audio-Engine; Navigation und Hintergrundwechsel stoppen sie. Ein Audiofehler bietet Wiederaufnahme, keine vorgetäuschte Bewertung.

## Datenbank und Rechte

`tools/school/assignments.sql` erweitert ausschließlich das lokale Schema um vier RLS-Tabellen: Aufgaben, Empfänger, privates Material und Bearbeitungen. Zusammen mit P4.13 sind es 13 Tabellen. **Keine produktive Supabase-Migration.** Der CI-Aufbau in der lokalen Supabase-Datenbank wird vollständig zurückgerollt.

- Nur aktuell zugewiesene Lehrkräfte dürfen Aufgaben erzeugen, beenden und Ergebnisse ihrer Klasse abrufen. Organisationsverwaltung erbt keinen Zugriff; fremde Klassen und andere Lehrkräfte derselben Organisation bleiben getrennt.
- Zusammengesetzte Fremdschlüssel binden Aufgabe, Klasse und Empfänger zusammen. Verlassen/Entfernen einer Mitgliedschaft löscht deren Empfängerzeile, Antworten und Ergebnis kaskadierend. Ein Wiederbeitritt stellt alte Zuweisungen nicht wieder her. Archivieren sperrt Zugriffe; Klassenlöschung entfernt auch Material und Aufgaben.
- Die Anwendungsrolle kann weder Material noch Rohantworten lesen oder Ergebnisse direkt schreiben. Die zusätzliche serverinterne Rolle `harmonia_school_grader` darf die Engine-Ergebnisse innerhalb derselben Identitäts- und RLS-Grenzen speichern. Sie kann weder selbst anmelden noch RLS umgehen; die Anwendungsrolle kann nicht zu ihr wechseln. Der Browser wählt keine Datenbankrolle.
- Pro Klasse serialisieren Datenbanksperren Erzeugung, Start, Antwort und Abschluss. Datenbankzeit entscheidet über Fristen; Clientzeit, Punkte und Identitäten werden nicht als Eingabe akzeptiert. Antworten werden atomar gespeichert. Gleiche Wiederholungen sind idempotent, auch nach verloren gegangener HTTP-Antwort.
- Eine Freigabe gilt klassenbezogen, separat vom Beitritt und standardmäßig nicht. Die Lehrkraft sieht erst abgeschlossene Ergebnisse; Fristablauf bzw. manuelles Beenden beendet auch laufende Versuche für die Auswertung. Widerruf wird bei der nächsten Datenbankabfrage wirksam. Offene Berichte werden alle zehn Sekunden neu geladen und bei Hintergrundwechsel oder Abruffehler entfernt. Bereits gesehene Daten können nicht zurückgeholt werden.
- Bestehende Host-/Origin-Prüfung, Sitzungscookie, CSP, `no-store` und Anfragelimit gelten auch für die neuen Endpunkte. UI-Texte und Aufgabenmaterial werden weder in Produktionsübersetzungen noch in öffentliche App-Routen importiert; die Bundle-Wache prüft zusätzliche P4.14-Merkmale.

## Prüfungen und Grenzen

```sh
corepack pnpm school:test
corepack pnpm school:test:db
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium corepack pnpm school:test:web
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm format:check
```

Lokale PostgreSQL-/pgTAP-Prüfungen laufen einschließlich Schemaaufbau unter einer Rolle ohne Superuserrechte. Abgedeckt sind Rechte und zusammengesetzte Fremdschlüssel, private Lösungen/Rohantworten, laufende versus abgeschlossene Ergebnisse, Freigabe/Widerruf und kaskadierende Löschung. Die Serverprüfungen ergänzen parallele Wiederholungen, Reload, tatsächliche Fälligkeit einschließlich eines während des Starts veralteten Zeit-Snapshots, vorzeitige Abgabe, Lehrerabschluss, Rechteentzug, manipuliertes Material und Erzeugungs-Rollback.

Browserproben verwenden den echten HTTP-Server und PostgreSQL: Lektion und Hörbaustein zusammenstellen, Link öffnen, Antworten speichern, Reload, Klangwiedergabe, Auswertung und Freigabe/Widerruf in allen drei Sprachen. Dazu kommen verlorene HTTP-Antworten, Fristablauf, fremde Konten, Axe und schmale Ansicht sowie die bisherigen P4.13-Abläufe. Sie ersetzen keine realen Audio-/Gerätetests oder Schulabnahme.

Lokaler Nachweis am 24.10.2026: **65/65 pgTAP-Prüfungen**, **28/28 Server-/Werkzeugtests**, **8/8 Chromium-Abläufe** sowie vollständiger Lint, Typcheck und Formatprüfung erfolgreich. Produktions-Webexport und Bundle-Wache bestanden: fünf JavaScript-Dateien ohne unveröffentlichte Inhalte.

Die bestehenden CI-Jobs führen die erweiterten Server-, Datenbank- und Browserbefehle aus. Die öffentliche Webausgabe wird zusätzlich auf Entwurfsbestandteile geprüft. Lokale Ergebnisse und GitHub-CI-Status werden im PR getrennt angegeben; eine grüne technische Prüfung ist keine formale Phase-4- oder Fachfreigabe.

## Übergabe

**P4.15 – Klassen-Live-Quiz** ist inzwischen auf einem [Folgebranch als interner Entwurf](klassen-live-quiz-entwurf.md) implementiert. Dafür stehen Klassenrechte und Aufgabenquellen als interne Grundlage bereit; der geforderte Test mit 30 echten gleichzeitigen Geräten bleibt eine eigene Abnahme. Schul-Lizenz/P4.16 und KI-Verordnungsprüfung/P4.17 sind nicht durch diesen Aufgabenentwurf erledigt.

Architektur: [ADR 0041](../decisions/0041-klassenaufgaben-mit-eingefrorenen-durchgaengen.md). Datenkategorien und offene Rechts-/AVV-Punkte: [Datenschutzentwurf P4.13/P4.14](../quality/p4-13-datenschutz-entwurf.md).
