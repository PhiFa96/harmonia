# ADR 0063 – Unabhängige Chorlektionen mit eigenen Voraussetzungen

Datum: 27.10.2026. Status: interner technischer Entwurf auf Nutzerauftrag; keine fachliche oder Gerätefreigabe.

## Anlass

Nach dem vollständig erfolgreichen CI-Lauf 244 von Entwurfs-PR #130 beauftragt der Nutzer den vollständigen technischen Weiterbau von P4.11. In der Nacharbeitsliste fehlen Notenlese-Voraussetzungen; außerdem sperrt die allgemeine Reihenfolge innerhalb einer Einheit Bass hinter Sopran, Alt und Tenor. Im Fähigkeitsgraphen bestehen zwischen diesen Stimmen keine Abhängigkeiten. Der bisherige Mischplan importiert trotzdem frühere Stimmen als Wiederholung. Dadurch würde eine bloße Freischaltung weitere, möglicherweise ungeübte Stimmen in die gewählte Lektion einschleusen.

## Entscheidung

- Eine Einheit darf `lessonOrder: 'independent'` ausdrücklich festlegen. Ohne Angabe bleibt die bisherige Lektionsreihenfolge erhalten. Nur die interne Chor-Einheit verwendet die neue Option.
- Jede unabhängige Lektion wird gegen ihre eigenen Fähigkeitsvoraussetzungen geprüft. Eine fehlende Voraussetzung einer anderen Stimme sperrt sie nicht. Ausdrückliche Abhängigkeiten innerhalb einer Einheit bleiben wirksam; eine isolierte Einstufung umgeht keine Voraussetzungen. Teilweise zugängliche oder getestete Einheiten bleiben als zugänglich erkennbar, ohne Abschlussgutschrift.
- Sopran/Alt verlangen `notation.treble-natural`, Tenor/Bass `notation.bass-natural`. Alle vier verlangen zusätzlich `notation.accidental-scope`, `rhythm.read-basic` und die bisherige Gehörvorbereitung `aural.l3.dictation.s3`. Es werden vorhandene Lernziele verbunden, keine neuen musikalischen Bewertungsregeln eingeführt. Die didaktische Auswahl bleibt Entwurf zur unabhängigen Prüfung.
- Feste und adaptive Mischpläne unabhängiger Lektionen verwenden nur die ausdrücklich vorausgesetzte Fähigkeitshülle. Die Position einer anderen Lektion innerhalb derselben Einheit macht sie nicht zur Wiederholungsquelle. Manipulierte adaptive Schlüssel mit einer fremden Stimme werden abgewiesen.
- Die Oberfläche erklärt die freie Wahl in DE/en-US/en-GB und zeigt noch fehlende Grundlagen mit Navigation bei der jeweiligen Lektion. Der gesperrte direkte Lektionslink nennt die eigenen Voraussetzungen. Der getrennte interne Vorschaueinstieg bleibt zur Erprobung ohne Lernnachweise verfügbar.

## Versionierung und bestehende Regeln

Katalog/Fähigkeitsplan, Chor-Einheit, vier Chor-Fähigkeiten und vier Lektionen erhalten Version 26. Übungssätze/Ratingquellen bleiben 25, Einführungskarten 24. Klang, Zielnoten, zufällige Aufgabenvarianten, Bewertungsfenster, Cent-Toleranz, Oktavkorrektur, Antwortformat und Tutor-Schnittstelle bleiben gleich. Alte Chorquellen und Durchläufe mit Lektionsversion 25 benötigen einen neuen Start; sie werden nicht als neue Evidenz umgedeutet. Die globale Katalogänderung erfordert auch bei alten Stufe-5-Vorschauen und kataloggebundenen Übungsplänen einen neuen Start. Andere Lektionsversionen und ihre feste Reihenfolge bleiben erhalten.

ADR 0037 und F11 bleiben wirksam: Mikrofon-Skips zählen weder als richtige Antworten noch im Quotennenner. Ein vollständig übersprungener reiner Gesangsdurchlauf besteht nicht. Ein gemischter Durchlauf kann dagegen durch richtig beantwortete Wiederholungsfragen bestehen, ohne gesungenen Ton; nach Entfernung fremder Chor-Wiederholungen gilt dies für alle vier Stimmen gleich. Das ist kein Nachweis einer gesungenen Leistung. Eine abweichende Produktregel mit mindestens einer gezählten Gesangsaufgabe verlangt eine ausdrückliche Entscheidung; sie wird hier nicht stillschweigend eingeführt.

## Technische Nachweise

Gezielte Inhaltsprüfungen decken unabhängige Freischaltung, unterschiedliche Schlüsselvoraussetzungen, explizite interne Abhängigkeiten, Teil-Einstufung, veraltete Nachweise, feste/adaptive Quellen, manipulierte Planschlüssel, Offline-Wiederaufnahme, Mikrofon-Skips und kanonische Serverwertung ab. App- und Browserprüfungen ergänzen die echte Oberfläche in drei Sprachen, Verlinkung, gesperrte Direktlinks, Einführung, Mikrofon-/Audio-Lebenszyklus und den bestehenden synthetischen Gesangsablauf. Der Produktionsbuild enthält weiterhin keine Chorlektionen oder privaten Inhaltsdaten. Konkrete Ergebnisse werden im Entwurfs-PR und in der P4.11-Übergabe festgehalten; lokale Prüfungen ersetzen den neuen GitHub-Lauf nicht.

## Freigabegrenze

Dies ist ausdrücklich technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**. Alle Chor-Inhalte bleiben `entwurf`. Die automatische technische Prüfung belegt keine unabhängige Fach-/Sprachprüfung, individuelle Stimmlageneignung oder zuverlässige Verwendung mit echten Kopfhörern auf iOS/Android. Die offenen Bewertungs-/Latenzfragen aus der Fachprüfungsnacharbeit bleiben offen. Keine Veröffentlichung, Produktionsmigration oder Merge. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt.

## Fortführung vom 28.10.2026

Die damals offene Mindest-Gesangsentscheidung ist jetzt ausdrücklich beauftragt und in [ADR 0064](0064-chorabschluss-verlangt-bestandenen-gesangsversuch.md) umgesetzt. Version 27 ergänzt den eigenen bestandenen Erstversuch zum bisherigen Quotenkriterium. Die hier beschriebene unabhängige Stimmauswahl bleibt erhalten.

## Fortführung vom 31.10.2026

[ADR 0067](0067-chor-vorzeichenlesen-ohne-bassschluessel.md) ergänzt eine eigene Vorzeichnungs-Lesefähigkeit als Voraussetzung aller vier Stimmen. Ihre neue Leseeinheit benötigt keinen Bassschlüssel oder Schreibweg; unabhängige Stimmauswahl und die passenden Schlüsselgrundlagen bleiben erhalten. Katalog und betroffene Chor-Metadaten steigen auf 28.
