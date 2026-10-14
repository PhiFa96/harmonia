# ADR 0021 – Datenschutz, Kontolöschung und gekürzte Lernnachweise

- Status: technische Entscheidung angenommen; juristische Abnahme offen
- Datum: 14.10.2026
- Kontext: P2.21, F17 = zwölf Monate; Betreiberangaben noch offen

Detaillierte Antworten dürfen nicht unbefristet allein wegen ihrer XP-/Fortschrittsbelege erhalten bleiben. Ein Löschen der gesamten Ereigniszeile würde dagegen durch Fremdschlüssel Belohnungen entfernen und bereits bestätigte Freischaltung verlieren.

Rohereignisse werden nach zwölf Monaten durch Engine-geprüfte knappe Ereignisse ersetzt. Ihre ID, Originalhash, Quellen-/Versionsbezug, Abschlusszeit, Zeitzone und verifizierter Fortschritt bleiben; Antworten, Seeds und einzelne Hilfs-/Einstufungsaktionen verschwinden. Neue Uploads speichern die kanonische Zusammenfassung bereits beim Eingang. Alte Quellen, die nicht mehr nachgerechnet werden können, erhalten keine erfundene Bestehensbewertung; vorhandene Belohnungen bleiben. Uploads bleiben ausschließlich roh und werden neu bewertet. `retained` ist nur ein Server-/Cache-Leseformat, Clientformat 2 und SQLite-Version 2 sind nötig. Konto- und Gastdaten bleiben getrennt; alte gekürzte Gastbelege werden nicht als neue Serverbelohnung importiert.

Analytics, Push und Marketing haben unabhängige versionierte Wahlbelege, standardmäßig aus. Analytics/Marketing sind derzeit gar nicht aktiv; die Oberfläche fragt nicht nach Einwilligung für unbestimmte spätere Verarbeitung. Der vorbereitete Analytics-Guard benötigt zusätzlich aktivierte, rechtlich veröffentlichte Serverpolicy und das aktuelle Konto. Native Erinnerungen werden erst nach ausdrücklicher Wahl und Systemberechtigung geplant. Widerruf stoppt lokal sofort und entfernt bei erfolgreicher Synchronisation die eigenen Server-Pushregistrierungen.

Ein Datenexport verlangt das eigene Konto, verwendet paginierte erlaubte Kategorien und enthält keine Auth-/Dienst-/Pushschlüssel. Gemischte Anbieter-Transferbelege enthalten nur erlaubte Felder und eigene Zuordnungen. Gäste können eigene lokale Daten exportieren. Ein Geräteprofil eines anderen Kontos wird dabei nicht mitgenommen.

Die Kontolöschung verlangt einen eigenen gültigen JWT mit höchstens 15 Minuten alter tatsächlicher Authentifizierung, eine zweite Bestätigung und Kenntnis über weiterlaufende Abos. Ein stabiler privater Anfragenbeleg überlebt Auth-Löschung und Verbindungsabbruch. Lokale Wiederaufnahme bereinigt das betreffende Konto auch nach Neustart, ohne ein inzwischen angemeldetes anderes Konto abzumelden. Datenbanken werden nach Sperren verspäteter Writes kontoweise bereinigt. Geräte-/Legacykopien und native temporäre Exportdateien gehören dazu; außerhalb der App gespeicherte Dateien bleiben beim Nutzer.

Supabase-Löschung bestätigt keine Anbieter-Löschung oder Abo-Kündigung. Separate dienstinterne RevenueCat-/gegebenenfalls Anthropic-Aufträge bleiben offen, bis tatsächliche Bearbeitung mit Beleg dokumentiert wurde; kein ungeprüfter privater Löschendpunkt wird erfunden. Die service-only Abschlussroutine entfernt den Zuordnungswert. Öffentliche zufällige Beleg-IDs enthalten keine E-Mail/Konto-ID. Abgeschlossene Belege laufen nach dem technisch vorbereiteten 30-Tage-Wert aus; offene Anbieteraufträge bleiben bearbeitbar. Diese zusätzliche Frist und minimal verbleibende Audit-/Sperrhashes bedürfen Betreiberabnahme.

Rechtstexte werden als eigene DE/EN-Arbeitsentwürfe außerhalb der App bereitgestellt. URLs, vollständige Betreiberangaben und dokumentierte Abnahmen sind erforderlich, bevor das explizite Releaseflag aktiviert werden darf. `check:legal:release` bleibt mit offenen Angaben absichtlich rot; Vorschau-Builds sind möglich, Checkout bleibt geschlossen. Es werden keine AV-Verträge, Storeformulare oder juristischen Prüfungen als erledigt abgehakt.
