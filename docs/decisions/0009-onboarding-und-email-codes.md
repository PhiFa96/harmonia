# 0009 – Lokales Onboarding und E-Mail-Codes

- **Status:** vorgeschlagen, im Review-Zweig umgesetzt
- **Datum:** 2026-10-13

## Anlass und Verhalten

P2.09 benötigt einen schnellen ersten Einstieg, eine Mini-Aufgabe vor dem Konto und dauerhaft gespeicherte Lernangaben. P2.01/P2.02 sind noch nicht vollständig implementiert. Phillip hat am 13.10.2026 ausdrücklich die E-Mail-Anmeldung vorgezogen.

Das Onboarding verwendet einen separaten validierten Gerätesnapshot in SQLite; die bisherige Lektionsdatenbank bleibt erhalten. Navigation wird vor einem erfolgreichen Abschluss geschützt, nach Neustart aus dem Snapshot wiederhergestellt und bei Lade-/Speicherfehlern ehrlich behandelt. Nur ein ausdrücklich gewählter Sitzungsmodus verzichtet auf dauerhafte Speicherung. Die vorhandene Theorie-Engine bewertet eine kleine visuelle Richtungsfrage; Klang bleibt eine Nutzeraktion. Die Mini-Aufgabe zählt keine XP und verändert keine Kursfreigaben.

Gaststart erzeugt kein anonymes Supabase-Konto. Die alternative E-Mail-Anmeldung bestätigt Besitz der Adresse mit einem sechsstelligen Code über das offizielle Supabase-SDK. Die gleiche Form unterstützt neue und vorhandene Konten; sie verwendet keine Magic-Link-Rückleitung. Die eigene zweisprachige Mailvorlage muss auch auf entfernten Projekten eingerichtet werden. Anmeldestatus wird nicht aus lokalem Onboarding-JSON erfunden: der Abschluss prüft die bestätigte Konto-ID serverseitig.

Sitzungen gehören nicht in den Gerätesnapshot. Web verwendet die SDK-Speicherung, native Geräte SecureStore mit vorab geschriebenen begrenzten Teilen und anschließendem Manifest. SDK-Refresh folgt dem Vordergrund. Abmelden bleibt getrennt von Kontolöschung und lokalem Fortschritt. Der Build erlaubt ausschließlich öffentliche Publishable-/Anon-Schlüssel und verhindert Secret-/Service-Schlüssel vor der Bundelerstellung.

Einstufung, XP-Vergabe und Pushzustellung bleiben P2.10/P2.14. Das Onboarding speichert hier nur Ziele, Wunsch und widerrufbare Einwilligung; die Oberfläche benennt diese Grenzen. Anmeldung synchronisiert noch keine Lektionsversuche, was vor dem Abschluss erklärt wird. P2.03 muss die vorhandenen Daten ausdrücklich ohne Verlust übernehmen.

## Abnahme

Technische Nachweise, lokale Betriebsanleitung, Plattformgrenzen und echte noch offene Testpersonen-Abnahme: [Onboarding](../plan/onboarding.md). Die Inhaltsversion 13 und alle Entwurfsstatus bleiben unverändert. Echte Geräte, produktive SMTP-/Projektbindung und CI sind getrennt nachzuweisen.
