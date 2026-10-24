# P4.17 – Technische Voreinschätzung zur KI-Verordnung

Stand: 24.10.2026 · **Entwurf zur unabhängigen schriftlichen Rechtsprüfung, keine rechtliche Freigabe.**

Diese Unterlage beschreibt den nachgelesenen Regelungsstand und den tatsächlichen technischen Einsatz von Harmonia. Die rechtliche Gesamtbewertung durch qualifizierte Rechtsprüfung, Betreiberbindung und konkrete Schul-/Zertifikatsverwendung fehlen. Die Produktabnahme von P4.17 bleibt offen. P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt. Technische P4-Vorarbeit erfolgt auf Nutzerauftrag vor der formalen Phase-4-Freigabe; nichts wird veröffentlicht.

## Quellenstand und Grenzen des Abrufs

Am 24.10.2026 wurden folgende amtliche Seiten direkt über den verfügbaren Webzugang gelesen. Zuvor dokumentierte Cloud-Netzsperren sind kein Nachweis, dass diese Seiten in dieser Prüfung ungelesen geblieben wären: Der Webzugang und der eingeschränkte Shell-Zugang sind unterschiedliche Dienste.

| Quelle | Gelesener Inhalt | Nachweisgrenze |
|---|---|---|
| [EU-Kommission: AI Omnibus tritt in Kraft](https://digital-strategy.ec.europa.eu/en/news/ai-omnibus-enters-force) | Mitteilung vom 27.07.2026 zu Fristen und Änderungen | Amtliche Erläuterung, nicht der Verordnungsvolltext |
| [Art. 113, amtlicher AI Act Explorer](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-113) | Allgemeiner Geltungsbeginn und geänderte Hochrisiko-Fristen | Explorer weist selbst die konsolidierte Fassung vom 27.07.2026 als Grundlage aus |
| [Art. 6](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-6) | Hochrisiko, Ausnahmevoraussetzungen, Profiling, Dokumentation/Registrierung | Rechtliche Anwendung auf konkrete Zwecke bleibt offen |
| [Anhang III](https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-3) | Bildung: Zugang, Lernergebnisse/Lernsteuerung, Einstufung und Prüfungsüberwachung | Keine automatische Aussage über Harmonia |
| [Art. 50](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50) | Interaktionshinweis, maschinenlesbare Markierung, Offenlegung und Ausnahmen | Rollen- und Ausgabeverantwortung je Funktion prüfen |
| [Art. 4](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-4) | Geänderte Pflicht zu Maßnahmen zur Förderung von KI-Kompetenz | Keine Garantie eines bestimmten individuellen Kompetenzniveaus; Maßnahmen bleiben zu dokumentieren |
| [Art. 5](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5) | Verbotene Praktiken, insbesondere emotionale Inferenz in Bildung und sensible biometrische Kategorisierung | Tatbestände und Ausnahmen dürfen nicht pauschal übertragen werden |
| [EUR-Lex: konsolidierte Fassung](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02024R1689-20260727) | **Direktabruf blockiert** durch JavaScript-/Robot-Prüfung | Nicht als direkt gelesener Verordnungsvolltext ausgegeben |

Der amtliche Explorer verlinkt die Änderungsverordnung über [OJ L 2026/1744](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=OJ:L_202601744). Auch dieser direkte EUR-Lex-Abruf war blockiert. Für die formale Einschätzung ist die vollständige maßgebliche Rechtsfassung nochmals unabhängig zu prüfen und der direkte Textnachweis nachzutragen. Im maschinenlesbaren Inventar bleibt diese Quelle deshalb `blocked`.

## Wesentliche Korrekturen gegenüber dem bisherigen Plan

Die zuvor nur behauptete und später ausdrücklich als unbestätigt markierte Friständerung ist jetzt durch amtliche Kommissionsangaben und den amtlichen Explorer belegt. Art. 113 nennt weiterhin den allgemeinen 02.08.2026; für die dort bezeichneten Hochrisiko-Regeln nach Art. 6(2)/Anhang III gilt der **02.12.2027**, für Art. 6(1)/Anhang I der **02.08.2028**. Einzelne andere Bestimmungen haben eigene Termine. Die Verschiebung ist keine pauschale Aussetzung der KI-Verordnung und erteilt keine Schulfreigabe. [Art. 113](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-113)

Auch Art. 4 wurde geändert: Anbieter und Betreiber sollen durch geeignete Maßnahmen die Entwicklung von KI-Kompetenz unterstützen; die Vorschrift verlangt keine Garantie eines bestimmten individuellen Niveaus. Konkrete rollenbezogene Maßnahmen für Produktteam, Support und Schule sind noch zu bestimmen. [Art. 4](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-4)

Für Art. 50 sind direkte KI-Interaktion, maschinenlesbare Markierung synthetischer Ausgaben und Offenlegung bestimmter Inhalte getrennt zu prüfen. Ein sichtbarer KI-Hinweis allein belegt nicht jede Ausgabemarkierungsanforderung. Fiktive Inhalte und redaktionell verantwortete Texte haben eigene Voraussetzungen/Ausnahmen; statische Klangmodelle sind nicht automatisch mit generiertem Sprach-Audio gleichzusetzen. [Art. 50](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50)

## Technische Einsatzbereiche und vorläufige Bewertung

| Funktion | Festgestellter Einsatz | Frage an die Rechtsprüfung |
|---|---|---|
| KI-Tutor | Anthropic-Modell erklärt; servergebundene Werkzeuge rechnen und prüfen. UI zeigt einen KI-Hinweis. Das Modell kann keine XP/Noten/Zugänge schreiben. | Anbieter-/Betreiberrollen, Kennzeichnung und konkreter Bildungszweck prüfen. Der sichtbare Hinweis ist ein technischer Beleg, keine Art.-50-Gesamtabnahme. |
| Tutor-Lernplanung | Modell erhält verdichtete eigene Ratings und Fortschritte; Vorschläge ändern den Lernpfadzugang nicht. | Anhang III Nr. 3(b) umfasst auch die Verwendung von Lernergebnissen zur Lernsteuerung in Bildungseinrichtungen. Profiling und Gesamtverwendung prüfen. |
| SATB-Prüfung/Tutor | Explizites deterministisches Regelprofil, danach KI-Erklärung der Befunde; Inhalte bleiben Entwurf. | Engine und zusammengesetztes System jeweils abgrenzen. Die Trennung allein schließt einen Hochrisiko-Zweck nicht aus. |
| Ratings/Einstufung/Adaptivität | Statistische Ratings und feste Auswahlregeln steuern Reihenfolge und Einstufung. | KI-Systembegriff nach Art. 3 und personenbezogene Profilbildung gesondert prüfen. „Deterministisch“ ist hier keine pauschale rechtliche Ausnahme. |
| Tonhöhe/Chor | Lokale Tonhöhen-/Zeitmessung, keine an den Tutor gesendeten Lerner-Audiosignale. | Messung von Gefühls-/Identitäts-/sensiblen Merkmalen abgrenzen; tatsächliche Eingabe- und Ausgabepfade bestätigen. |
| Zeitreise | Statische eigene fiktive Interviews und synthetische Klangmodelle, kein Laufzeit-Interviewmodell. | Fiktionshinweis, mögliche KI-Erstellung und medienbezogene Kennzeichnung getrennt beurteilen. |
| Schulaufgaben/Quiz/Berichte | Lokale Engine-Punkte und freigegebene Berichte unter synthetischen Konten. | Institutioneller Einsatz und Kombination mit Lernplanung/Tutor sind ungeprüft. Die freie Demo-Kontenauswahl ist kein Schulbetrieb. |
| Zertifikate | Prüfungsentwürfe liegen vor; öffentlicher Zertifikatsbetrieb ist nicht implementiert. | Bewertungs-, Zugangs- und Anerkennungszweck vor jeder Freigabe bestimmen. P4.18 bleibt von P4.17 abhängig. |
| KI-Live-Call | In diesem Branch nur geplant. | Vor Implementierung gesonderte Audio-, Rollen-, Transparenz- und biometrische Prüfung. Nicht als bereits abgenommen behandeln. |

Art. 6(3) erlaubt keine einfache Ausnahme aufgrund eines unterstützenden Etiketts: Die dortigen Voraussetzungen und die tatsächliche Entscheidungsbeeinflussung müssen bewertet werden. Bei einem unter Anhang III fallenden KI-System mit Profiling steht die dort genannte Ausnahme nicht zur Verfügung. Eine begründete Nicht-Hochrisiko-Einstufung nach dieser Ausnahme benötigt Dokumentation; der Explorer nennt außerdem die Registrierung nach Art. 49(2). [Art. 6](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-6)

Emotionale Inferenz im Bildungskontext und sensible biometrische Kategorisierung gehören zu den besonders zu prüfenden Verbotstatbeständen. Harmonia schließt diese Zwecke technisch aus seinem vorgesehenen Produktumfang aus. Automatisierte Schulzulassung und Prüfungsüberwachung sind ebenfalls **eigene ausgeschlossene Produktzwecke**; damit wird nicht behauptet, jeder solche Einsatz sei gesetzlich verboten. Ein Prompt-Hinweis ersetzt weder Zweckkontrolle noch die rechtliche Prüfung. [Art. 5](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5)

## Maßnahmen und Zuständigkeiten

Das Inventar `tools/ai-act/inventory.json` legt acht offene Arbeitspakete mit Rollen fest: schriftliche Einordnung; Anbieter-/Betreiberzuordnung; Transparenz und Markierung; KI-Kompetenzmaßnahmen; menschliche Aufsicht/Korrektur; Datenschutz/Minderjährige/DSFA; bei Hochrisiko die zugehörigen Governance-/Konformitäts-/Registrierungsnachweise sowie gegebenenfalls Grundrechteprüfung; Betrieb, Beschwerden und Vorfälle.

Die Rollen sind Zuständigkeitsvorschläge, keine beauftragten oder namentlich bestätigten Fachleute. Alle Maßnahmen sind `open`, alle Prüfungen `pending`. Referenzen sollen auf außerhalb des Repositorys aufbewahrte echte Unterlagen verweisen. Private Gutachten, Kontodaten oder Vertragsinhalte werden nicht eingecheckt. Der Prüfstand speichert ausschließlich Inventar, Nachweisreferenzen und Datei-Prüfwerte.

## Programmierte Prüfsperren

`pnpm check:ai` prüft Schema, Inventarvollständigkeit, Quellenpfade und Codebindung. `pnpm ai:review` erzeugt ein privates Prüfpaket in DE/en-US/en-GB. `pnpm check:ai:release --scope general|school|certificates` verweigert den aktuellen Stand erwartet.

Eine spätere Freigabe setzt ausgefüllte echte Prüfreferenzen, abgeschlossene oder begründet nicht anwendbare Maßnahmen, eine konsistente Einstufung sowie einen gültigen Bezug zum aktuellen Snapshot voraus. Profiling-Ausnahmen werden zurückgewiesen, solange Voraussetzungen offen sind. Allgemeine Pflichtpakete lassen sich nicht als „nicht anwendbar“ wegschalten. Für Hochrisiko kann das gesonderte Maßnahmenpaket nicht erlassen werden.

Der Snapshot bindet Funktionszwecke, Einstufungen, Maßnahmen, Quellen und die erfassten Laufzeitdateien. Neue Module in den überwachten Verzeichnissen ändern ihn ebenfalls. Prüfdatum/Frist müssen gültig sein. Quellenstände älter als 90 Tage lösen nach einer **internen Prüfregel** eine erneute Quellenkontrolle aus; das ist keine gesetzlich behauptete 90-Tage-Frist. Zeitablauf oder grüne Tests erzeugen keine Freigabe.

Die bestehenden Rechts-, Beta-, Storefront- und P2-Veröffentlichungsprüfungen verwenden diese Sperre. Schul-/Zertifikats-Produktion ist in diesem Branch weiterhin nicht vorhanden; für spätere Freigabewerkzeuge stehen die getrennten Scope-Prüfungen bereit. Die lokalen internen Vorschauen bleiben nutzbar. Ein synthetisch ausgefüllter Testsatz belegt lediglich die Validierungslogik. Selbst vollständige Felder können Echtheit, Qualifikation, Unterzeichnung und rechtliche Tragfähigkeit externer Unterlagen nicht automatisch beweisen: `legalApprovalInferred` bleibt immer `false`.

## Was für P4.17 noch fehlt

1. Unabhängige schriftliche Einschätzung anhand des vollständigen Rechtsstands, des beabsichtigten Vertriebs und konkreter Schul-/Zertifikatsabläufe.
2. Verantwortlicher Anbieter/Betreiber, Rechtsform, Datenflüsse und Einordnung der kombinierten Systeme; insbesondere Lernsteuerung und Profiling.
3. Freigabe und tatsächliche Umsetzung der jeweils erforderlichen Maßnahmen, einschließlich Art.-50-Ausgabemarkierung, Schul-/Datenschutz- und Betriebsnachweisen.
4. Erneute Prüfung bei Zweck-, Modell-, Inhalts- oder Codeänderungen und vor echtem Einsatz.

Bis dahin bleibt P4.17 fachlich/rechtlich **nicht abgenommen**. P4.01 und die formalen Phase-4-Start-/Veröffentlichungsvoraussetzungen bleiben offen.
