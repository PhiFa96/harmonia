# P4.11 – Technischer Gesamtentwurf

Stand: 02.11.2026. Arbeitsbranch `codex/choir-complete-draft`, Basis `main` bei `f7bc15d`. Enthält die lokalen Zusammenführungen von #137, #141 und #142 sowie die übrigen technischen Chor-Nacharbeiten. Der Tutor-PR #136 bleibt getrennt. **Keine Integration nach main, Veröffentlichung oder formale Phase-4-Freigabe.** Alle Inhalte bleiben Entwurf. [ADR 0070](../decisions/0070-chor-trainer-als-technischer-gesamtentwurf.md).

## Programmierter Gesamtumfang

| Bereich | Gemeinsamer Stand |
| --- | --- |
| Einstieg und Grundlagen | Vier unabhängig erreichbare Stimmen; eigene Vorzeichen-Leseeinheit ohne zusätzliche Bass-/Schreibpflicht für Sopran/Alt; gesperrte Direktlinks. |
| Einführung | Je Stimme zwei vollständige Noten-/Klangbeispiele, DE/en-US/en-GB und tatsächliche Gesamtaufgabenzahl. |
| Musik C4/C6 | Zwei eigene neue vierstimmige Miniaturen, bewegtere und unterscheidbare Alt-/Tenor-Linien, sechs geprüfte Transpositionen; alte Noten für Seed-Replay erhalten. |
| Wiederholungen C4 | Neues Stück und neue Tonart, keine Wiederholung einer anderen Erstaufgabe; Client und Server rekonstruieren dieselbe Variante. |
| Aufnahme | Kopfhörerbestätigung, Mikrofonberechtigung, PCM-Bereitschaft, vollständige Bewertungsfenster, Watchdog, bereinigter Neustart und Schutz vor alten Callbacks. |
| Vorhören C12 | Audiofehler erhalten den fertigen ungeprüften Take; erneutes Vorhören und Prüfen bleiben möglich. |
| Fehlende Tonhöhe C9 | Keine neue Antwort oder Fehlerwertung bei vollständig leerer Erkennung; Wiederholen oder bewusstes Überspringen. Ungeprüfte gespeicherte Leer-Takes werden vor dem Prüfen geleert; bewertete Historie bleibt erhalten. |
| Zeitzuordnung C13 | Zeitstempel statt Callback-Ankunft, Ausrichtung verschiedener Uhrenursprünge, Regression mit verzögerten Fensterpaketen. Physische Latenz-/Geräteabnahme offen. |
| Bewertung C3 | Gemeinsame explizite Konstanten und verständliche Erklärung; exklusive 50-Cent-Grenze, 8/12 erfasste Fenster, 75 Prozent passend und begrenzte globale Oktavwahl. Empirische Freigabe offen. |
| Rückmeldung | Zwölf beschriftete Fenster je Note, getrennte Erkennungs-/Trefferzahlen, gleiche Oktavkorrektur in Anzeige und Wertung. |
| Abschluss C11 | 80-Prozent-Quote plus eigener bestandener Gesangs-Erstversuch; der Erstversuch ist die erste geprüfte Antwort. Beliebig viele Takes vor dem Prüfen erlaubt. |
| Offline/Server | Bestehende kontogetrennte Wiederaufnahme, kanonischer Servernachweis, Belohnungen, Retention und Sync-Format 5; keine zusätzliche Antworttabelle. |
| Texte/Schlüssel C7/C14 | Grammatische Stimmenbezeichnungen, Glossar für Dauern, sichtbare Entwurfsinformation; Tenor im Bassschlüssel mit klingender Notation ausdrücklich erklärt. |
| Veröffentlichungsschutz | Öffentlicher Katalog ohne freigegebene Chor-Lektionen; Produktionsrouten und Bundle werden geprüft. |

## Versionierung

Gesamtkatalog und Fähigkeitsplan **29**. Chor-Einheit, -Fähigkeiten, -Lektionen, -Übungssätze und -Karten **29**; neuer Parameter `edition: 2` und eigenes Ratingprofil. Die Vorzeichen-Leseeinheit bleibt 28. Insgesamt weiterhin 200 Fähigkeiten, 66 Einheiten, 195 Lektionen, 1876 Aufgaben, 395 Karten/458 Beispiele und 63 Artikel/373 Abschnitte. Öffentlich null freigegebene Lektionen.

Neue Noten betreffen ausschließlich die ausdrücklich versionierte Fassung. Spezifikationen ohne `edition` erzeugen die alten Noten und bisherigen Variantenfolgen. Alte Chor-Durchläufe sowie kataloggebundene freie/adaptive/Stufe-5-Vorschauen brauchen einen Neustart. Historische Antworten, Erfolge und Belohnungsbelege werden nicht umgedeutet. Antwort-/Speicher-/Sync-Format und Tutor-Prompt/-Werkzeuge bleiben unverändert.

## Gemeinsame Nachweise

- Vorher rote Regressionen: fehlende Vorzeichenpflicht, unzugänglicher Leseweg, Verlust eines fertigen Takes beim Vorhören, stille/instabile Aufnahmen, fortgesetzte Leer-Takes, enge/identische Alt-/Tenorlinien und zusammenfallende Fenster bei verzögerten Callbacks.
- Musik: beabsichtigte vollständige Dreiklänge, Grenzen jeder Stimme und des Pitch-Trackers, bestehendes SATB-Profil einschließlich Gegenparallelen in allen sechs Fassungen. Eigene Kompositionen; keine fremden Noten übernommen.
- Wiederholungen: alle vier Stimmen mit 50 Seeds, neue Kontur/Tonart, keine Identität mit Erstaufgaben und deterministische Rekonstruktion.
- Gemeinsame Appfälle: Lernpfad, Einführung, Mindestgesang, alte Nachweise, Vorhörfehler, Null-Erkennung, Wiederaufnahme, Erstprüfung, Tenor-Schlüssel und tatsächliche Profilwerte in allen Sprachfassungen.
- Tatsächliche Browser-Audioverarbeitung mit synthetischen Gesangstönen beziehungsweise lebendem Null-PCM; Mikrofonabbruch/-verlust, Kopfhörergate, Navigation, schmale Ansichten und Axe. Synthetische Signale sind keine echten Geräte- oder Stimmenabnahmen.
- Vollständige erforderliche CI einschließlich Supabase/DB/API und Produktion muss am gemeinsamen finalen Head erfolgreich sein. Konkrete Ergebnisse stehen im Entwurfs-PR; frühere Einzel-PR-Ergebnisse werden nicht als Gesamtprüfung ausgegeben.

## Verbleibende externe Abnahmen

Diese Liste sind Abnahmebedingungen, keine behaupteten Testergebnisse:

| Nachweis | Durchzuführen | Stand |
| --- | --- | --- |
| Fach-/Literaturprüfung | Neue Noten, Stimmführung, Tessituren, Schlüsselkonvention und didaktische Voraussetzungen unabhängig prüfen. | offen |
| Empirisches Bewertungsprofil C3 | Aufnahmen mehrerer Stimmen von Fachpersonen beurteilen lassen; 25-/50-Cent- und Abdeckungsprofile mit Fehlannahmen/-ablehnungen vergleichen. | offen |
| Kabelgebundene Kopfhörer | Auf iOS, Android und Web alle Stimmen, leises Singen, Kammertöne und Oktavwahl prüfen; Datum, Geräte-/OS-Version und Ergebnis belegen. | offen |
| Bluetooth und Routenwechsel | Gemeldete/manuelle Latenz, Ein-/Ausgang, Kopfhörerwechsel, Mute und Geräteeinstellungen unter laufendem Take prüfen. | offen |
| Zeitstempel C13 | Native SDK-Pakete, verzögerte/bündelnde Callbacks, Uhrursprung, Rundung und zeitliche Abdeckung auf echten Geräten messen. | offen |
| Berechtigung/Unterbrechung | Verweigern, spätes Erlauben, Hintergrund, Bildschirmwechsel und erneutes Öffnen prüfen; keine Teilwertung. | offen |
| Sprache/Screenreader | DE/en-US/en-GB, tatsächliche VoiceOver-/TalkBack-/Web-Bedienung, Ansagen und große Schrift abnehmen. | offen |
| Produkt-/P4-Freigabe | Offene P3-, Inhalts-, Anbieter-, Rechts- und Phase-4-Voraussetzungen separat erfüllen. | offen |

P4.11 ist damit als gemeinsamer **technischer Entwurf** prüfbar. Das Plankriterium „mit Kopfhörern zuverlässig“ darf erst nach diesen realen Abnahmen bestätigt werden. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt.
