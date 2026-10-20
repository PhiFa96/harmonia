# Entwurf des Lösch- und Aufbewahrungskonzepts

F17 ist entschieden: **zwölf Monate** für einzelne Aufgaben, Antworten und detaillierte Lernnachweise. Betreiber-/Rechtsprüfung der übrigen Fristen, Sicherungen und gesetzlichen Ausnahmen bleibt offen.

## Lernbelege

Neue Engine-geprüfte Uploads enthalten zusätzlich eine vorbereitete knappe Zusammenfassung. Die Serverbereinigung ersetzt alte Rohereignisse nach zwölf Monaten ab Eingang durch `kind=retained`: bestätigter Lektionsfortschritt oder geprüfte Einheiten des Einstufungstests, Quellen-/Versionsbezug und notwendige Abschluss-/Statistikangaben. Antworten, Seeds, Hint-/Skip-Einzelfolgen und Einstufungsaktionen verschwinden. XP-/Münz-/Serienbelege und ihre FK-Verbindung bleiben erhalten; Bestehen und Freischaltung werden nicht nachträglich erfunden.

Für vorbestehende Rohereignisse wird gegen die passende aktuell verfügbare Quelle nachgerechnet. Ist die Quelle nicht mehr verfügbar/geändert, bleibt ein minimaler `unavailable`-Beleg mit vorhandener Statistik; kein unbekanntes Bestehen wird behauptet. Hash und ID bleiben als minimaler Wiederholungsbeleg: derselbe alte Upload darf keine zweite XP-/Energiebuchung oder erneute Rohdatenspeicherung erzeugen. Hashes sind pseudonyme Daten, keine behauptete Anonymisierung.

Lokale Bereinigung läuft unabhängig vom Netzwerk. Der aktuelle Cache kann knappe Belege lesen; alte Clients bekommen bei solchen Serverzeilen eine eindeutige `426 upgrade_required`-Antwort. Neue App-Builds/Clientformat 2 müssen vor dem produktiven Start des Jobs ausgerollt sein. Lokale Datenbankversion 2 schützt vor stillem Lesen eines unbekannten Formats. Gast-Zusammenfassungen sind lokal verwendbar; ohne die ursprünglichen Antworten lassen sich alte Gastbelege nicht als neue serverseitig Engine-geprüfte Belohnung importieren.

## Weitere Speicher

Tutor-Rohdialoge und zugehörige Berichte, Inhalte von abgeschlossenen Tutor-Requests sowie Inhaltsmeldungen werden nach zwölf Monaten entfernt. Minimale Anfrage-/Kosten-/Wiederholungsmetadaten bleiben, bis die Aufbewahrung organisatorisch abgenommen ist. Energiequellen verlieren ihre Seeds/Rezepte nach zwölf Monaten; der Quellenhash erhält die Bindung an dieselbe Reservierung. Billing-Auditpayloads werden auf minimale Ereignis-/Statusdaten reduziert; der Originalhash erlaubt weiterhin idempotente Anbieterzustellung. Ein vor Jahren liegengebliebener Auftrag wird nicht fälschlich als verarbeitet markiert.

Kündigungserklärungen haben technisch dieselbe Startfrist; ein Betreiber kann für einen konkreten rechtlichen Grund `hold_until` und `hold_reason` setzen. Eine Sperre ist zu befristen und zu überprüfen, keine allgemeine unbegrenzte Archivierung. Gesetzliche Steuer-/Vertrags-/Rechnungsfristen sind abhängig vom tatsächlichen Geschäftsmodell und durch Fachleute festzulegen; die App behauptet keine pauschale Sechs-/Acht-/Zehnjahresfrist.

## Kontolöschung

`DELETE /privacy?view=account` verlangt eigenes JWT, kürzlich bestätigte Anmeldung und ausdrückliche Bestätigung einschließlich der weiterlaufenden Abos. Ein stabiler Anfragenbeleg wird vor der Auth-Löschung angelegt. Eigene Supabase-Tabellen verschwinden über ihre Kaskaden; eigene lokale Lern-/Meldungs-/Motivations-/Energie-/Einwilligungsdaten werden entfernt. Bereits laufende Schreibvorgänge dürfen gelöschte Kontodaten nicht wieder anlegen. Andere Konten auf demselben Gerät werden nicht gelöscht. Laufende Geräte-/Einstufungs-Warteschlangen werden zuerst geleert; bedingte SQL-Updates löschen nur das passende gespeicherte Konto, eigene Erinnerungspläne und Benachrichtigungen. Eine Kontolöschung braucht selbst in einer temporären Sitzung zuerst einen dauerhaften Anfragenmarker; ist dieser Speicher nicht verfügbar, startet sie nicht blind. Temporäre Gastdaten können hingegen ohne SQLite aus dem eigenen Arbeitsspeicher exportiert werden.

Erneuter Aufruf verwendet dieselbe ID. Beim nächsten regulären Start bzw. Vordergrund werden stabile Marker abgearbeitet, auch wenn zwischenzeitlich ein anderes Konto angemeldet ist. Ein verlorener HTTP-Erfolg lässt sich über den unerratbaren Eingangsbeleg wieder feststellen, auch nachdem das Konto entfernt wurde. Der öffentliche Beleg enthält keine E-Mail/Konto-ID. Änderungen an der Erklärungs-/Anfragenidentität sind ausgeschlossen. Der Betreiber braucht einen Wiederanlauf für `state=processing`, falls Auth-Löschung und Belegabschluss auseinanderfallen.

Account-IDs in Billing-Ereignissen werden entfernt; neue Webhooks können diese Zuordnung nicht einfach wieder speichern. Externe Anbieteraufträge sind separat und service-lesbar. RevenueCat-Kundendaten/Abos und Anthropic-Verarbeitung werden **nicht** allein durch Supabase-Löschung beseitigt. Bis tatsächlicher Anbieterbearbeitung plus Beleg bleibt `externalPending=true`. Die service-only Routine `complete_privacy_external_erasure` akzeptiert nur finale Zustände mit Belegreferenz und entfernt die Zuordnung; keine Provideraktion wird dadurch automatisiert. Aufträge mit `completed`/`not_found` benötigen eine überprüfte Referenz und entfernte `subject_reference`. Es wurde kein unbestätigter Anbieter-Löschendpoint erfunden. Noch offene Unternehmens-/Provider-/Versandbindung verhindert eine vollständige externe Abnahme.

Kündigungserklärungen und notwendige Anbieter-/Finanznachweise können eigene rechtliche Pflichten haben; die Kontolöschung ist keine Abo-Kündigung. Der Nutzer wird vorher zur Abo-Verwaltung geführt. Native temporäre Exportkopien werden nach fünf Minuten entfernt, nach einem Prozessabbruch beim nächsten Start/Vordergrund nachbereinigt und bei Kontolöschung kontoweise entfernt. Bestehende private Exportkopien außerhalb der App kann der Dienst nicht zurückholen.

## Betrieb

Der Retention-Endpoint ist ausschließlich service-authentifiziert, verarbeitet begrenzte Chargen und meldet weitere Arbeit. Keine automatische Ausführung gegen produktive Nutzerdaten aus diesem Entwicklungsschritt. Cron-/Vault-/Remote-URL, Alarmierung bei Fehlchargen, Backup-Auslauf und Wiederherstellung mit erneut anzuwendenden Löschmarkern müssen vor dem Release gebunden und getestet werden. Lokale Integration arbeitet ausschließlich mit eigenen Testkonten und entfernt diese wieder. Keine vollständige DSGVO-Erledigung behaupten, solange Betreiberpflichten und externe Bearbeitung offen sind.

## Ergänzung P2.22

Eigene Analytics-Kohorte und alle Ereignisse bei synchronisiertem Widerruf/Kontolöschung vollständig entfernen. Aufnahme endet nach zwölf Monaten ab Einwilligungsbeginn. `analytics_retention()` löscht abgelaufene Kohorten in Batches zu 100 im bestehenden vorzubereitenden `privacy-retention`-Job; kein Scheduler aktiviert. Keine externen Analytics-Anbieter. Private Betreiberberichte regenerieren, veraltete Kopien löschen; keine öffentliche Veröffentlichung. Details und Zweckversion: ADR 0022.

## Ergänzung P3.04

Liga-Mitgliedschaften, Wochenresultate, Lese-/Zustellmarker und Konto-Stufe/-Präferenz kaskadieren bei Kontolöschung. Der lokale Arbeitsspeicher wird gesperrt und geleert; verzögerte Abrufe dürfen ihn nicht wieder befüllen. Der Liga-Job entfernt ältere Gruppen samt Mitgliedschaften und hält nur die laufende sowie die letzten 52 abgeschlossenen Wochen. Aktuelle Stufe und Kategoriepräferenz bleiben bis Kontolöschung bestehen. Geschlossene Resultate anderer Personen werden nach Löschung eines Kontos nicht neu berechnet. Beide persönlichen Bereiche sind im eigenen Export enthalten. Cronbetrieb und juristische Zweck-/Fristenprüfung bleiben offen; ADR 0031.

## Theorie-Rush und minimale Freundschaftsrelation (P3.05, Arbeitsentwurf)

Eigene Rush-Läufe, bestätigte Einzelschritte, Tageskontingente und ausgehende Freundschaftsrelationen sind im persönlichen Export enthalten. Kontolöschung entfernt Läufe/Antworten/Kontingente und beide Seiten betroffener Freundschaften kaskadierend. Der flüchtige App-Cache wird gesperrt/geleert; bestätigte XP-Aggregate im kontogetrennten Motivationsspeicher folgen dessen bestehender Löschung. Der private Retentionjob entfernt spätestens zwölf Monate nach Laufbeginn die Rush-Rohantworten sowie Seed und Aufgabenbank. Bestätigte Summen, Ranglisten- und XP-Belege bleiben bis Kontolöschung erhalten; alte Tageskontingente werden begrenzt bereinigt. Ein dann noch aktiver Überlebenslauf wird ohne XP abgebrochen, ein bereits abgelaufener Zeitlauf nach den vorher servergeprüften Schritten abgeschlossen. Der Freundesfilter verlangt gegenseitige Bestätigung; Blockieren/Entfernen schließt den Beitrag sofort aus. Verwaltung/Einladungen siehe P3.08. Juristische Prüfung dieser Zweck-/Fristentscheidung und eingerichteter Schedulerbetrieb bleiben offen; ADR 0032.

## Freunde und Wochenquests (P3.08, Arbeitsentwurf)

Eigene Freundschaftszeilen, Einladungen, Questpaarungen und Abzeichen sind exportierbar. Kontolöschung kaskadiert Beziehungen in beiden Richtungen, Codes, Quests und Abzeichen. Entfernen oder Blockieren beendet sofort eine laufende gemeinsame Quest; bereits verdiente Abzeichen bleiben bis zur Kontolöschung. Der Retentionjob löscht abgelaufene Einladungen nach 30 Tagen und Quests nach 52 Wochen in begrenzten Chargen. Ein Abzeichen speichert nur Konto und Wochenbeginn. Der flüchtige App-Cache wird beim Kontowechsel und Löschen geleert. Juristische Fristenprüfung und Jobbetrieb bleiben offen; ADR 0035.

## Tägliches Rätsel (P3.07, Arbeitsentwurf)

Eigene Rätselergebnisse sind exportierbar und kaskadieren bei Kontolöschung. Der flüchtige App-Stand wird beim Kontowechsel und Löschen geleert. Der bestehende Retentionjob entfernt nach zwölf Monaten rohe Antwort, genaue Antwortzeit und damals angegebene Zeitzone in begrenzten Chargen; Datum und Richtig/Falsch-Beleg bleiben für die eigene Serie bis Kontolöschung. Die globale Tagesaufgabe hat keine Personenzuordnung. Juristische Prüfung und Jobbetrieb bleiben offen; ADR 0034.

## Duelle (P3.06, Arbeitsentwurf)

Eigene Duell-Ratings, Spiele, Schritte, Warteschlange und Einladungen sind im Export enthalten. Kontolöschung entfernt eigene Antworten und Ratings sowie Warteschlangen- und Einladungsdaten; das bestätigte Ergebnis einer verbleibenden anderen Person wird bewahrt. Der private Retentionjob entfernt Rohantworten und Aufgabenbank zwölf Monate nach Spielbeginn, offene Einladungen 30 Tage nach Ablauf. Bestätigte Ergebnisse und eigene kanonische XP-Belege bleiben bis zur Kontolöschung. Ghost-Aufzeichnungen stammen aus echten Rush-Läufen und folgen zusätzlich deren Löschfrist. Juristische Fristenprüfung, Backup-Auslauf und aktivierter Job bleiben offen; ADR 0033.
