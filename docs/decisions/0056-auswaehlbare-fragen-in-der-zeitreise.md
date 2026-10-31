# ADR 0056 – Auswählbare Fragen in der Zeitreise

Datum: 26.10.2026. Status: technische und redaktionelle Entwurfsentscheidung; Fach-/Sprachfreigabe offen.

## Anlass

P4.12 zeigte je Station eine fest sichtbare Frage und Antwort. Die Nacharbeitsliste nennt die Perspektive der Rollen: Sie sprachen über Lehrdossiers, statt innerhalb der erfundenen Szene zu handeln. Die interne Zeitreise soll ein bedienbares, weiterhin ausdrücklich erfundenes Interview erhalten.

## Entscheidung

- Jede der vier Stationen erhält drei eigene auswählbare Fragen mit drei zugeordneten, fest geschriebenen Antworten in DE/EN. Die Rollen sprechen in der Ich-Perspektive über ihre Tätigkeit innerhalb der erfundenen Lehrszene: Melodie notieren, gemeinsam proben, eine Basslinie begleiten oder eine kurze Übung gliedern. Sie sprechen nicht als belegte historische Personen. Die Kennzeichnung als redaktionelles Rollenspiel bleibt unmittelbar sichtbar.
- `personaPrompts` und `personaReplies` ersetzen die bisherigen einzelnen Dialogfelder. Die Reihenfolge 0/1/2 ist in DE/en-US/en-GB gleich gebunden. Britische Abweichungen bei „realisation“ und „practise“ werden vollständig über die bestehende en-GB-Überlagerung geliefert; Fachbegriffe verwenden weiterhin das Glossar.
- Der portable Interviewzustand enthält nur die ausgewählte Frage und höchstens drei unterschiedliche geöffnete Frageindizes. Wiederholtes Öffnen erhöht den Zähler nicht; unbekannte Indizes ändern den Zustand nicht. Eine Frage genügt für „Weiter“, die beiden anderen sind freiwillig. Schritt- und Stationswechsel beginnen einen leeren Zustand.
- Die Schaltflächen benennen die vollständige Frage und ihren Auswahlzustand. Die gewählte Antwort erscheint mit höflicher Live-Ankündigung; der Zähler heißt ausdrücklich „Fragen gestellt“. Auswahl und Zähler bleiben im Arbeitsspeicher. Es entstehen kein Chat, Modellaufruf, gespeicherter Dialog, Lernnachweis oder XP.
- Die isolierte Textbindung löst nun auch beide Dialoggruppen auf. Sprachprüfung und Laufzeitbindung verlangen je drei unterschiedliche Fragen/Antworten, auch nach Glossarauflösung. Vorlagen und aufgelöste Dialogantworten bleiben durch den bestehenden Produktions-Bundleguard gesperrt; die öffentlichen Aliase bleiben leer.
- Quellenabschnitte, versionierte Artikellinks, Szenen, Klangmodelle, Quizlösungen und Katalog/Fähigkeitsplan Version 24 bleiben unverändert. Die neuen Rollentexte sind erfundene Lehrdialoge und keine historischen Zitate oder belegten Rekonstruktionen. Der verlinkte Entwurfsartikel dient als fachlicher Hintergrund, nicht als Beleg dafür, dass eine erfundene Person diese Worte gesagt hätte.

## Nachweise und Grenzen

Neun portable Ablauf-, 502 Sprach-, neun App- und 265 Werkzeugtests sind erfolgreich. Sie prüfen Auswahl, Wiederholung ohne Doppelzählung, ungültige Indizes, frischen Zustand, alle vier Dialoge, Mindestinteraktion, Zuordnung von Frage und Antwort, regionale Schreibweisen sowie fehlende/gleichlautende Einträge. Zwölf Sprach-/Stationsbindungen samt Dialogzustand sind zusätzlich unter Deno ausgeführt; der gemeinsame Deno-Smoke ist typgeprüft.

Sechs Chromium-Abläufe auf tatsächlichen Vorschau-/Produktions-Webexports sind erfolgreich. Die Vorschau prüft sämtliche zwölf Fragen je Sprache, Antwortwechsel, Auswahlzustand, Rückkehr mit leerem Interview, Axe/schmale Ansicht und den bestehenden Quiz-/Audioablauf. Öffentliche Deep-Links zeigen in allen drei Sprachen keine Stationen. Der Produktions-Bundleguard bestätigt fünf JS-Dateien ohne Entwurfsdaten; eigene Fixtures weisen auch rohe und aufgelöste neue Interviewantworten zurück. Typecheck, Lint/Paketgraph, Sprach-/Inhalts- und Formatprüfung sind erfolgreich.

Dies ist ausdrücklich **technische P4-Vorarbeit vor der formalen Phase-4-Freigabe** auf Nutzerauftrag. Die neuen Fragen, Ich-Antworten, Rollenperspektiven und Übersetzungen benötigen unabhängige Fach-/Sprachprüfung. Primärquellen-, Hör-, Screenreader- und Geräteabnahmen bleiben offen; alle Stationen bleiben `entwurf`. Keine Veröffentlichung oder Bereitstellung. P4.01 bleibt bis F14 und den rechtlichen Voraussetzungen zurückgestellt.
