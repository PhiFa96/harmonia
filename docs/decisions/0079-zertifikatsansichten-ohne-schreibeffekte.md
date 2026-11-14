# ADR 0079: Zertifikatsansichten ohne Schreibeffekte

Datum: 14.11.2026 · Status: angenommen für den internen technischen Entwurf.

## Anlass

Der Nutzer beauftragt das nächste zusammenhängende Programmierpaket. N4 der Fachprüfung Phase 4 v3 beschreibt schreibende Zertifikatsansichten: `view()` speichert Invalidierungen und Fristabschlüsse; die gemeinsame Transaktion bereinigt bei Lesezugriffen sogar alte Daten anderer Konten. Der Export kann deshalb einen Zustand verändern, während er ihn erst ausliest.

## Entscheidung

`state`, `exportData`, `verify` und `receipt` arbeiten in einer verzögerten SQLite-Lesetransaktion. `PRAGMA query_only` verhindert auch versehentlich ergänzte Schreibbefehle während dieser Operation; nach Erfolg und Fehler wird der Verbindungsschutz wieder aufgehoben. Es wird keine Schreibreservierung per `BEGIN IMMEDIATE` angefordert. Jeder Lesesnapshot verwendet genau einen Serverzeitpunkt.

Ansichten sind reine Projektionen. Beschädigte oder nicht mehr passende Durchgänge erscheinen als veraltet, ohne ein Invalidierungsdatum zu speichern. Nach Fristende wird das Ergebnis mit der vorhandenen Engine im Speicher berechnet. Die unvollständige Prüfung erhält keinen Mustercode. Exportphase, Abschlussgrund, Ergebnis und Abschlusszeit sind dabei konsistent; eine dargestellte Fristbeendigung schreibt keinen Abschlussdatensatz.

Schreibvorgänge bleiben ausdrücklich schreibend. `answer` und `finish` speichern ihre bisherigen Fristabschlüsse. `start` schließt einen abgelaufenen aktiven Durchgang oder invalidiert einen veralteten aktiven Datensatz innerhalb seiner eigenen Schreibtransaktion, bevor er den einzigen aktiven Platz neu verwendet. Bereits verbrauchte Testbestellungen bleiben verbraucht. Fragen, Wertung, Bestehensgrenze und Zahlungs-/Identitätsmodell ändern sich nicht.

Die bisherige Siebentagesgrenze wird beim Lesen als Filter angewandt. Ein alter Auftrag bleibt sichtbar, solange er zu einem noch aufbewahrten eigenen Durchgang gehört. Lesen entfernt keine Zeilen. Physische Löschung erfolgt in Schreibtransaktionen und über den privaten Wartungsaufruf `maintain()`. Der lokale HTTP-Server führt diesen beim Start und anschließend minütlich aus, protokolliert bei Fehlschlag nur eine feste Meldung und versucht es im nächsten Lauf erneut. Beim Stoppen wird der Timer entfernt. Es entsteht weder ein öffentlicher Wartungsendpunkt noch ein entfernter Zeitplan.

Die vorhandene Sitzungsprüfung bleibt getrennt: HTTP-Zugriffe aktualisieren weiterhin Aktivität und Ablauf ihrer Testsitzung. Deshalb behaupten HTTP-Prüfungen keine byteidentische gesamte Datenbank. Sie prüfen unveränderte Prüfungs-/Kaufdaten; direkte Service-Leseprüfungen belegen zusätzlich unveränderte SQLite-Dateibytes. Unabhängige Wartung darf während des Serverbetriebs aufbewahrungsbedingt Daten entfernen, sie wird nicht von einem Lesezugriff ausgelöst.

## Folgen und Nachweise

Kein neues SQL-Schema und kein Exportformatwechsel; Exportversion 1 bleibt erhalten. `finishedAt` und `reason` stammen bei einem dargestellten Timeout aus der berechneten Fristbeendigung und passen zum Ergebnis. Der gespeicherte Datensatz bleibt bis zu einem ausdrücklichen Schreibvorgang unabgeschlossen. Eine PDF-Ausgabe verlangt weiterhin einen tatsächlich gespeicherten, passenden und nicht widerrufenen Mustercode.

Neun tatsächlich vor der Implementierung rote Regressionen decken kontoübergreifende Bereinigung durch alle vier Leser, Invalidierung beim Lesen, Timeout-Export, eine konkurrierende Schreibreservierung, reine Aufbewahrungsfilter und den folgenden Neustart eines Durchgangs ab. Weitere Datenbank-/HTTP-Prüfungen sichern Fristgrenzen, Snapshotzeit, private PDFs, Sitzungsaktivität, Wartungswiederholung und Timerabbau. Drei neue DE/en-US/en-GB-Browserfälle belegen den Ablauf mit echten Downloads und unveränderten gespeicherten Prüfungsdaten.

Technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**. Alles bleibt Entwurf. Keine Veröffentlichung, echten Zertifikate, Zahlungen, entfernte Bereitstellung oder Main-Integration. N3 (Echtheit unabhängiger Belege) und N5 (clientbedienbare Zahlungssimulation) bleiben offen; P4.01 bleibt bis F14/Recht zurückgestellt. ADR 0076–0078 sind für die getrennten Schul-/Tutor-/Importbindungs-Entwürfe reserviert. [Übergabe](../plan/zertifikate-leseansichten.md).
