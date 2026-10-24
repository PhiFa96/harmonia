# P4.16 – Schullizenz als interner Entwurf

Stand: 24.10.2026 · Branch `codex/p4-16-school-license-draft`

**Technische P4-Vorarbeit auf Nutzerauftrag vor der formalen Phase-4-Freigabe.** Grundlage ist die lokale Schulwerkstatt aus den noch offenen Entwurfs-PRs #105–#107. [P4.15 / #107](https://github.com/PhiFa96/harmonia/pull/107) ist für `cb90816` inzwischen in allen fünf CI-Jobs grün. Der neue PR gegen `main` enthält diese Voraussetzungen; vor einer Integration müssen deren PRs abgestimmt werden.

Der Entwurf enthält Rechnungsproben, simulierte Zahlungsbestätigungen, Lizenzplätze und zeitlich begrenzte Premium-Übungen mit synthetischen Konten. **Keine reale Rechnung, Bestellung, Zahlung oder Bereitstellung.** P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt. P4.17, Schulrecht/AVV, echte Identitäten, fachliche Inhalteprüfung und die im Plan verlangte eingerichtete Pilotschule bleiben offen. Technische Tests sind keine Produktabnahme.

## Ausprobieren

```sh
corepack pnpm school:preview
```

Node, Projektabhängigkeiten und lokales Docker sind erforderlich. Die Werkstatt läuft ausschließlich auf Loopback und startet ihren eigenen flüchtigen PostgreSQL-17-Container. Sie bietet jetzt **neun synthetische Konten**, einschließlich eines separaten Betreiberkontos. Diese freie Kontenauswahl ist weiterhin keine Anmeldung. Reguläres Stoppen löscht den Container; nach hartem Abbruch kann er bis zur manuellen Entfernung bestehen bleiben. Keine echten Schul-/Personen- oder Rechnungsdaten eingeben.

1. Als Verwaltung/Lehrkraft eine erfundene Organisation mit Klassenmitgliedern vorbereiten. Der globale Einstieg **Schullizenz · Entwurf** ist für alle Konten vorhanden; die Berechtigungen bestimmen dessen Inhalt.
2. Als **Betreiber · Testkonto** Organisation, 1–1000 Plätze, Testpreis in ganzen EUR-Cent und 30/90/365 Tage wählen. Ein leeres Beginndatum bedeutet sofortigen Beginn. Ein expliziter Beginn muss in der Zukunft, höchstens 366 Tage entfernt liegen. Die Eingabe verwendet die Browserzeitzone; der Beleg zeigt UTC. Laufzeiten sind feste 24-Stunden-Tage.
3. **Rechnungsentwurf anlegen** friert Organisationstext, Platzanzahl, Testpreis und Laufzeit ein. Der Testpreis gilt je Platz für die gesamte gewählte Laufzeit, ohne reale Preisfestlegung oder steuerliche Einordnung. Der Gesamtbetrag wird in der Datenbank aus Platzanzahl und Preis berechnet. Wiederholung mit derselben Vorgangskennung und denselben Angaben erzeugt keinen zweiten Beleg; abweichende Angaben werden abgewiesen.
4. **Rechnungsprobe herunterladen** erzeugt eine eigenständige HTML-Datei mit deutlichem Hinweis **RECHNUNGSPROBE – NICHT ZAHLBAR**. Der Download fragt die Leseberechtigung frisch ab, maskiert alle Texte und enthält keine Skripte oder externen Ressourcen. Er ist kein steuerlich geprüfter Rechnungsbeleg und wird nicht versendet.
5. Nur das Betreiberkonto kann **Testzahlung bestätigen**. Dadurch stehen die Plätze zur Vergabe bereit. Der Vorgang ist ausdrücklich eine lokale Simulation, ohne Stripe, RevenueCat, Bank oder Zahlungsaufforderung. Die Schulverwaltung kann keine eigene Rechnung als bezahlt markieren. Das Betreiberkonto erhält durch diese Rolle keinen Zugriff auf Klassen oder Lernergebnisse.
6. Als zuständige Organisationsverwaltung Plätze an aktuelle Mitglieder vergeben oder entziehen. Ein Mitglied zählt je Rechnung einmal, unabhängig von der Anzahl seiner Klassen. Lehrkräfte und Verwaltung können ebenfalls einen Platz erhalten; sie verbrauchen dafür einen Platz. Andere Organisationen und unberechtigte Konten bleiben ausgeschlossen. Parallele Vergaben überschreiten das Kontingent nicht.
7. Als zugewiesenes Mitglied erscheint während der bezahlten Testlaufzeit **Premium aus einer aktiven Schullizenz**. Die **Premium-Übungswerkstatt** öffnet eigene Notennamen-, visuelle Intervall- und Hörfragen ohne Energielimit. Die Fragen werden durch die vorhandene Engine erzeugt/bewertet. Antworten und Wiederaufnahme werden im lokalen PostgreSQL gespeichert; erneutes Senden derselben Antwort zählt einmal. Kein XP, Rating, Zertifikat oder Notenwert.
8. Platz entziehen, Lizenz aufheben, Laufzeit ablaufen lassen oder letzte Organisationsmitgliedschaft beenden. Der nächste geschützte Serverabruf verweigert den Zugriff. Die offene Premium-Seite prüft zusätzlich alle fünf Sekunden und entfernt bei Entzug oder Abruffehler die Frage. Hintergrundwechsel stoppt Audio und Statusprüfung, Rückkehr lädt Rechte neu.

DE, en-US und en-GB sind gleichberechtigt vorhanden. Die Oberfläche erlaubt nach einer abgelaufenen Übungsfrage eine neue Frage; gespeicherte Einzelaufgaben gelten höchstens eine Stunde. Reload setzt über `#school-practice=<Kennung>` dieselbe eigene Frage fort, solange Laufzeit, Platz und Frage gültig sind.

## Lizenz- und Berechtigungsmodell

| Vorgang | Berechtigung |
|---|---|
| Rechnungsentwurf erzeugen, Zahlung simulieren, Lizenz aufheben | Festes synthetisches Betreiberkonto |
| Rechnungen/Verlauf sehen und herunterladen | Betreiber oder Verwaltung der zugehörigen Organisation |
| Plätze verteilen/entziehen und Mitglieder dafür sehen | Verwaltung der zugehörigen Organisation |
| Eigenen Premium-Status und eigene Fragen nutzen | Kontobezogener Serverabruf; aktiver Platz erforderlich |
| Lernstände/Quiz-Ergebnisse sehen | Unverändert eigene Klassenrechte und gesonderte Freigaben aus P4.13–P4.15 |

Ein Platz erteilt keine Lernstandfreigabe. Die Betreiberrolle sieht Abrechnungsmetadaten und belegte Platzanzahlen, aber keine Teilnehmerliste oder Lernergebnisse. Die Rechnungsansicht einer Verwaltung enthält nur ihre Organisationen; Lernkonten sehen ihre eigenen aktiven Quellen und Enddaten, keine Preise oder Rechnungen.

`licenses.sql` ergänzt vier RLS-Tabellen: Rechnungsproben, Platzzuweisungen, Ereignisverlauf und private Übungsfragen/-antworten. Insgesamt enthält das lokale Schulschema 21 Tabellen. Die Browserrolle kann weder Rechnungsstatus/Preise noch Plätze oder Ergebnisse direkt schreiben. Geschützte Datenbankfunktionen mit festem Suchpfad prüfen Betreiber-/Verwaltungsrechte und serialisieren Änderungen je Rechnung. Die bereits vorhandene interne Bewertungsrolle darf nur eigene freigeschaltete Übungsfragen speichern und bewerten. Keine neue Supabase-Produktionsmigration.

Datenbankzeit entscheidet über Beginn und Ende: `Beginn <= jetzt < Ende`. Eine bezahlte zukünftige Lizenz kann bereits Plätze erhalten, schaltet jedoch erst ab Beginn frei. Mehrere Rechnungen derselben Organisation können unabhängig nebeneinander bestehen, etwa zur Vorbereitung einer Folgelaufzeit. Eine Person braucht mindestens einen aktuell gültigen Platz; Aufheben einer Quelle beendet keine andere noch gültige Quelle. Es gibt keine automatische Verlängerung, Kulanzfrist, Teilgutschrift oder echte Rückzahlung.

Rechnungsparameter werden nach Erzeugung nicht geändert. `draft → paid → void` sowie `draft → void` sind möglich; `void` wird nicht reaktiviert. Wiederholte gleiche Status-/Platzänderungen sind idempotent und erzeugen keine doppelten Ereignisse. Ereignisse dokumentieren Zeitpunkt, ausführendes Testkonto und gegebenenfalls Zielkonto. Sie sind kein manipulationssicheres kaufmännisches Journal.

Mitgliedschafts- und Archivierungstrigger entfernen unberechtigte Plätze sofort. Mehrere aktive Klassen derselben Organisation erhalten den Platz; das Ende der letzten Mitgliedschaft löscht ihn. Erneuter Beitritt belebt keinen alten Platz. Die Platzvergabe sperrt relevante Mitgliedschaften während der Prüfung, damit eine gleichzeitig beendete Mitgliedschaft keinen wiederverwendbaren Platz hinterlässt. Rechnungen, Plätze und Verlauf werden bei Organisationslöschung kaskadierend gelöscht; Übungsfragen sind kontobezogen und werden beim Löschen des Testkontos oder Containers entfernt. Ohne aktiven Platz sind sie nicht abrufbar. Für echten Betrieb sind Aufbewahrung, Buchhaltung und Löschregeln neu festzulegen.

## Anschluss an bestehendes Premium

Der lokale Status verwendet das vorhandene `AccessStatus`-Schema und dieselben Stufen `free`/`premium`; Premium hat `remaining: null`. Diese Zuordnung wird bei jedem geschützten Übungsabruf aus den aktuellen Schulplätzen berechnet. Es wird keine vom Browser angegebene Stufe, Laufzeit oder Zahlungsbestätigung übernommen.

Die neue Werkstatt erprobt diese Freischaltung tatsächlich mit servergesperrten Übungen. Die produktive App, RevenueCat und bestehende individuelle Abonnements erhalten dadurch noch keine Schulrechte. Vor einer produktiven Anbindung muss die bestehende kontogebundene Zugriffsauflösung Schulplätze zusätzlich zu persönlichen Abos berücksichtigen, ohne deren Kauf-/Kündigungsregeln zu überschreiben. KI-Max, echte Tutor-Modellkosten und rechtlich gesperrte Inhalte werden nicht über einen Schulplatz aktiviert.

## Prüfungen und offene Abnahmen

```sh
corepack pnpm school:test:db
corepack pnpm school:test
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium corepack pnpm school:test:web
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm format:check
```

pgTAP prüft Preis-/Statusschutz, Rollen-/Organisationstrennung, Kapazität, private Übungsdaten, Mitgliedschaftsende und Ereignisse. Der Schemaaufbau wird auch unter einer Rolle ohne Superuserrechte ausgeführt. Die Supabase-CI verwendet nur ihre lokale Datenbank und rollt sämtliche Schul-DDL/Testdaten zurück.

Serverprüfungen decken Rechnung → Testzahlung → Platz → Premium-Übung → Entzug in drei Sprachen, letzte Plätze unter paralleler Last, identische Wiederholungen, abweichende Vorgangskennungen, geplanten Beginn, Ablauf, mehrere Quellen, Aufheben, Archivierung und Mitgliedschaftsrennen ab. Browserprüfungen verwenden echten HTTP-Server/PostgreSQL mit Rechnungsdownload, getrennter Betreiber-/Verwaltungs-/Lernkontoansicht, Notation/Audio, Reload, Ablauf einer Frage, Entzug, schmaler Ansicht und Axe. Die bisherigen Schul-, Aufgaben- und Quizprüfungen einschließlich 30 synthetischer Live-Clients laufen mit.

Lokaler Nachweis am 24.10.2026: **114/114 pgTAP-Prüfungen**, **52/52 Server-/Werkzeugtests** und **16/16 Chromium-Abläufe** erfolgreich; vollständiger Lint, Typcheck und Formatprüfung bestanden. Produktions-Webexport und Bundle-Wache: fünf JavaScript-Dateien ohne unveröffentlichte Inhalte.

Die Produktions-Bundle-Wache prüft zusätzliche P4.16-Merkmale. Standardübersetzungen, öffentliche App-Routen und veröffentlichter Katalog enthalten keinen Lizenzentwurf. Lokale Ergebnisse und GitHub-CI werden im PR getrennt angegeben.

Vor echtem Verkauf bleiben insbesondere Vertrags-/Preis- und Steuerprüfung, Rechnungsanforderungen, zulässige Schulbedingungen, produktive Zahlungsbestätigung, echte Identitäten, sichere Betreiberbindung, P4.17, AVV/Schulrecht und Pilotbetrieb offen. **Die Produktbedingung „Eine Pilotschule ist eingerichtet“ ist nicht erfüllt.** Der lokale Testablauf setzt keine dieser Abnahmen auf erledigt.

Architektur: [ADR 0043](../decisions/0043-schullizenz-mit-getrennter-betreiberfreigabe.md). Datenkategorien: [Datenschutzentwurf Schule](../quality/p4-13-datenschutz-entwurf.md).

Folgeschritt: [P4.17 ist als technische Prüfvorbereitung implementiert](ki-verordnung-pruefvorbereitung.md). Unabhängige Rechtsprüfung und alle formalen Schul-/Lizenzabnahmen bleiben offen.
