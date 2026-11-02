# ADR 0070 – Chor-Trainer als gemeinsamer technischer Gesamtentwurf

Datum: 02.11.2026 · Status: auf Nutzerauftrag als interner Entwurf umgesetzt

## Auftrag

Der Nutzer möchte P4.11 vollständig als technisches Paket bearbeiten. `codex/choir-complete-draft` führt deshalb die geprüften Arbeitsstände aus #137 (C8), #141 (C12) und #142 (C9) lokal zusammen und ergänzt die übrigen Chor-Nacharbeiten. Basis ist `main` bei `f7bc15d`; kein Merge nach `main` oder Deployment. Der getrennte Tutor-PR #136 ist nicht enthalten.

## Musik und Wiederholungen – C4/C6

Die Aufgabenfassung `edition: 2` enthält zwei eigene neue vierstimmige Miniaturen. Sopran und Alt liegen höher als in den ursprünglichen tiefen Modellen; Alt und Tenor verwenden pro Miniatur mindestens drei verschiedene Tonhöhen und mindestens vier Halbtöne Umfang. Auch die übrigen Stimmen bewegen sich. Die beiden Alt-Linien haben unterschiedliche Intervallfolgen. Die sechs C-/B-/D-Dur-Fassungen bleiben innerhalb des bestehenden SATB-Bereichsprofils und des Tonhöhen-Erkennungsbereichs. Diese technischen Grenzen sind keine persönliche Stimmberatung oder fachliche Abnahme.

Fehlerwiederholungen der neuen Fassung wechseln Stück und Tonart. Der kanonische Generator weist jede Variante zurück, deren musikalische Identität bereits in irgendeiner Erstaufgabe dieses Durchlaufs vorkommt. Ein Tempowechsel zählt nicht als neue Aufgabe. Die bestehende deterministische Wiederholung alter Spezifikationen bleibt erhalten. Ratingprofile unterscheiden die neue Fassung ausdrücklich durch `edition` und Quellenversion.

Die ursprünglichen Noten bleiben für Spezifikationen ohne `edition` erhalten. Aktuelle Chor-Einheit, Fähigkeiten, Lektionen, Übungssätze und Einführungskarten erhalten Version 29, Katalog/Fähigkeitsplan ebenfalls 29. Die neue Vorzeichen-Leseeinheit aus #137 bleibt unverändert Version 28. Alte Chor-Durchläufe brauchen einen neuen Start; historische Antworten werden nicht umgedeutet. Anzahl der Fähigkeiten, Einheiten, Lektionen und Aufgaben unverändert gegenüber #137.

## Bewertungsprofil – C3

`CHOIR_PROFILE` hält die bisherigen Werte zentral: Abweichung strikt unter 50 Cent, mindestens 8 von 12 erkannten Zeitfenstern pro Note, davon mindestens 75 Prozent passend; globale Oktavkorrektur höchstens ±2. Alle acht Noten müssen die Einzelregel erfüllen. Die Oberfläche verwendet dieselben Konstanten für ihre Erklärung. An den Bestehensgrenzen wird nichts geändert.

Die Einzelton-Aufgaben der Stufen 2–3 verwenden ein anderes Messprofil mit 25 Cent. Das Chorprofil wertet viele zeitlich getrennte Fenster unter gleichzeitiger Begleitung aus. Der halbe Halbton ist hier eine **ausschließende Zuordnungsgrenze**: Genau die Mitte zwischen zwei Nachbartönen gehört zu keinem der beiden. Acht erkannte Fenster verlangen Beobachtungen in mindestens zwei Dritteln des zentralen Bewertungsbereichs; die 75-Prozent-Regel gestattet einzelne abweichende Fenster. Sie belegt weder eine allgemeine musikalische Intonationsnorm noch empirisch angemessene Lernschwellen. Die Kombination bleibt eine begründete, transparente **Entwurfshypothese**, bis Vergleichsaufnahmen mit echten Stimmen unabhängig beurteilt sind. Dies schließt die Dokumentationslücke, nicht die empirische Abnahme.

## Schlüssel und Erstversuch – C7/C11

Tenor und Bass bleiben im Bassschlüssel. Der interne Trainer verwendet dieselbe klingende Lage wie die Notation des geschlossenen zweisystemigen Satzes; es gibt keine stillschweigende Oktavtransposition wie bei einem oktavierten Violinschlüssel. Ein eigener DE/en-US/en-GB-Hinweis erklärt dies bei der Tenoraufgabe. Die ausdrücklich erlaubte globale Oktavwahl des Nutzers ist davon getrennt.

„Erstversuch“ bezeichnet die erste **geprüfte Antwort**, nicht die erste Mikrofonaufnahme. Vor dem Prüfen sind erneute Takes zulässig; ein bewusst neuer Take ersetzt die noch ungeprüfte Antwort. Angezeigte Lösungen, nachträgliche Fehlerkorrekturen und fremde Wiederholungsaufgaben erfüllen die Mindest-Gesangsregel weiterhin nicht. Die Oberfläche erklärt den Zeitpunkt des Prüfens; ADR 0064 wird entsprechend präzisiert.

## Zeitzuordnung – C13

Der Runner richtet den Mikrofon-Zeitstempel auf die Wiedergabeuhr aus. Die Uhren dürfen unterschiedliche Ursprünge besitzen. Während Eingangsprüfung und Vorzähler wird der kleinste beobachtete Versatz verwendet; ab Gesangsbeginn bleibt er fest. Danach bestimmen die Zeitstempel der Fenster ihre Position, einschließlich bisheriger Mittelpunkt-/Ausgangslatenz-/manueller Korrektur. Mehrere verspätet in einem Callback gelieferte Fenster behalten dadurch ihren zeitlichen Abstand.

Ein Regressionstest liefert jeweils drei Fenster gemeinsam mit 200 ms Verzögerung und einem fremden Uhrenursprung: vorher fehlte die zeitliche Abdeckung, danach wird der vollständige Take korrekt rekonstruiert. Die bisherigen Datenlücken-/Sampleraten-/Hintergrund-/Abbruchschutzregeln bleiben erhalten. Die Anpassung misst keine physische Ein-/Ausgangslatenz. SDK-Zeitstempel, sehr grob gerundete Browseruhren, Routenwechsel und tatsächliche Warteschlangen müssen weiterhin auf Geräten geprüft werden. Unzureichende Abdeckung erzeugt keine Teilwertung.

## Texte – C14

DE/en-US/en-GB sprechen die Singstimme grammatisch passend an. Dauerbegriffe kommen aus dem Glossar, mit US „quarter notes“ und UK „crotchets“. Lerntexte und normale Titel enthalten keine Entwickler-Arbeitsanweisungen; die sichtbare Entwurfskennzeichnung und die offenen Abnahmen bleiben erhalten. Das Bewertungsprofil heißt im Lernablauf „Bewertung“, seine Vorläufigkeit steht in der Entwurfsinformation und dieser Entscheidung. Der widersprüchliche Testkommentar zur Option `soprano-leap` wird berichtigt.

## Grenzen und Prüfung

Gesamtstand und technische Abnahmematrix: [P4.11-Gesamtentwurf](../plan/chor-trainer-gesamtstand.md). Konkrete lokale und vollständige CI-Ergebnisse werden am finalen Head im Entwurfs-PR festgehalten. Einzelne frühere grüne PRs gelten nicht als Integrationsnachweis.

Keine Änderung des Rohantwort-/Speicher-/Sync-/Retentionsformats, keine neue SQL-Migration, Rohaufnahme oder Anbieteranfrage. Öffentliche Kataloge bleiben leer. Fach-/Primärliteratur-/Sprachprüfung, empirische Kalibrierung und reale Stimmen-/Geräte-/Kopfhörer-/Screenreaderabnahmen bleiben offen. Technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**, Inhalte `entwurf`; keine Veröffentlichung. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt.
