# ADR 0044 – KI-Prüfstand an Code und Zweck binden

- Datum: 24.10.2026
- Status: angenommen für technische Prüfvorbereitung, keine rechtliche Einstufung
- Bezug: P4.17, `docs/legal/ai-act/vorpruefung.md`

## Kontext

Vor Schule/Zertifikaten verlangt der Plan eine schriftliche Einordnung nach KI-Verordnung. Der Tutor verarbeitet neben Erklärfragen inzwischen verdichtete Lerndaten; deterministische Bewertung allein beantwortet die Frage des Gesamtzwecks nicht. Bisherige Freigabefelder binden externe Prüfreferenzen nicht an die tatsächlich geprüfte Funktionsfassung.

## Entscheidung

Ein internes Inventar dokumentiert zehn Funktionsbereiche und acht Maßnahmenpakete. Allgemeines Produkt, Schule und Zertifikate erhalten getrennte Prüfdatensätze. Alle bleiben zunächst offen. Nur echte, zeitlich gültige Referenzen mit passendem aktuellem Snapshot können die technischen Nachweisfelder erfüllen; die Prüfung bestätigt keine juristische Richtigkeit.

Ein SHA-256-Snapshot bindet Zwecke, Klassifikation, Maßnahmen, Quellen und relevante Laufzeitdateien. Verzeichnisüberwachung erfasst auch neue Module; Änderungen machen alte Prüfreferenzen technisch unbrauchbar. Die Prüfreferenzen selbst sind ausgenommen. Offene Profiling-/Anhang-III-Fragen lassen sich nicht durch eine unzulässige Ausnahme oder synthetische Testbelege auflösen. Die Quellenkontrolle nach spätestens 90 Tagen ist eine interne Wiederprüfregel.

Die vorhandenen Rechts-, Beta-, Storefront- und P2-Veröffentlichungsprüfungen berücksichtigen die neue Sperre. Die eigenständigen Schul-/Zertifikats-Scopeprüfungen stehen für spätere Produktionsabläufe bereit. Lokale Vorschauen sind weiterhin interne Entwürfe. Berichte in DE/en-US/en-GB werden nur in einem ignorierten lokalen Artefaktverzeichnis erzeugt, ohne App-Import.

## Folgen

P4.17 erhält eine konkrete technische Übergabe und quellenbezogene Voreinschätzung. Ein ausgefülltes Feld kann Echtheit, Qualifikation und Inhalt eines Gutachtens nicht beweisen; `legalApprovalInferred` ist immer falsch. Die unabhängige Rechtsprüfung und Umsetzung ihrer Maßnahmen bleiben Voraussetzung. Keine formale Phase-4-Freigabe, keine Veröffentlichung; P4.01 bleibt bis F14/Rechtsklärung zurückgestellt.
