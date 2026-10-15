# ADR 0022 – Eigene Analytics mit Einwilligung

- Status: technische Entscheidung angenommen; Erfassung und Rechtsfreigabe aus
- Datum: 15.10.2026
- Kontext: P2.22; Phillip wählt Supabase und ein eigenes Dashboard

Produktstatistik bleibt im bestehenden Supabase-System. Es gibt keinen weiteren Analytics-Anbieter, kein Analytics-SDK, Session-Replay, Werbe-ID oder Fingerprinting. Ein kleines streng validiertes Schema ersetzt automatische Bildschirm-/Interaktionsaufzeichnung. Gäste werden nicht erfasst. Das erzeugt eine ausdrücklich ausgewiesene, nicht repräsentative Stichprobe.

Die eigene Information beschreibt Ereignisse, Kontozuordnung und Löschfrist. Sie verwendet die neue Zweckversion `analytics-supabase-v1`; alte allgemeine Einwilligungen reichen nicht. Zusätzlich müssen die bestehende Serverpolicy `analyticsEnabled` und `legalPublished` freigegeben sein. Beide bleiben false. Die App bietet keine Vorabeinwilligung bei geschlossener Freigabe an. Der Betreiber muss insbesondere die DE/EN-Texte, Storeangaben, Supabase-Verträge und das Lösch-/Betriebskonzept abnehmen.

Der Server bindet Ereignisse an den verifizierten JWT und die aktuelle Einwilligungs-ID. Die App übermittelt weder eine frei wählbare Konto-ID noch Antworten, Tutor-Texte, E-Mails oder beliebige Zusatzfelder. Ein Konto-Lock serialisiert Aufnahme/Widerruf. Widerruf entfernt die eigene Kohorte einschließlich Ereignissen; Re-Opt-in erhält einen neuen Beleg. Alte Anfragen können danach nicht nachgeliefert werden. Auth-Wechsel und lokaler Widerruf brechen laufende Analytics-Anfragen ab. Kein persistenter Puffer und keine nachträgliche Durchsuchung vorhandener Lern-/Tutor-Daten.

Starts/Aufrufe sind freiwillige Clientereignisse, keine Nachweise über Lernen oder Geld. Abschlüsse entstehen nach kanonischer Engine-Prüfung, Tutor-Fragen/-Kosten aus neuen Servervorgängen. Bezahlte Umwandlungen verlangen einen erfolgreich bearbeiteten authentifizierten RevenueCat-Produktionsbeleg plus aktuelle Anbieterberechtigung. Trial-Starts, gewöhnliche Verlängerungen, Wiederherstellung und Sandbox zählen nicht als Erstkauf. Ereignisse vor der aktuellen Einwilligung werden nicht nachgetragen.

Die maximal zwölfmonatige Beobachtung wird auch beim Aufnahmegate geprüft. Der vorbereitete Retentionsjob löscht bis zu 100 abgelaufene Kohorten je Aufruf samt Ereignissen; sein Scheduler bleibt bis zur Betriebsfreigabe aus. Kontolöschung löscht über Fremdschlüssel. Der private Export enthält eigene Analytics-Zeilen und den Einwilligungsbeginn.

Kennzahlen werden ausschließlich serviceintern aggregiert. Das Betreiberwerkzeug erzeugt einen privaten HTML-Bericht; im Browser liegen keine Service-Schlüssel, Einzelereignisse oder Konto-IDs. Die Kohorte beginnt mit der Einwilligung, Zeiten sind serverseitige Eingangszeiten in UTC. Ausgereifte Nenner, exakte Tag-1/7/30-Rückkehr, offene Lektionsdurchgänge und Nano-USD/Schätzkennzeichen sind verbindlich definiert. CSV-/HTML-Exporte sind vertrauliche Betreiberunterlagen und müssen nach Widerruf/Löschung ersetzt werden. Ein dauerhaft öffentliches Dashboard ist nicht vorgesehen.
