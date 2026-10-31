# ADR 0041 – Klassenaufgaben mit eingefrorenen Durchgängen

- Datum: 24.10.2026
- Status: angenommen für den internen technischen Entwurf, keine Produkt-/Rechtsfreigabe
- Bezug: P4.14, ADR 0040, `docs/plan/schulaufgaben-entwurf.md`

## Kontext

Nach dem lokalen Schulentwurf P4.13 soll ein vollständiger Zyklus aus Zusammenstellen, Zuweisen, Bearbeiten und Auswerten implementiert werden. Formale Phase-4-Freigabe, echte Schulidentitäten, Rechtsprüfung und unabhängige Fachabnahmen fehlen weiterhin. Die bestehende Übungsengine bietet eigene Entwurfsquellen und Bewertungen.

## Entscheidung

P4.14 erweitert die isolierte lokale PostgreSQL-Werkstatt. Ein begrenzter Katalog aus vier ganzen Aufgabenfolgen und drei Übungsbausteinen unterstützt Notennamen sowie visuelle und gehörte Intervalle. Beim Zuweisen werden Fragen, Quellenversion, Frist und aktuell eingeschriebene Empfänger eingefroren. Höchstens 40 Fragen und ein Durchgang je Empfänger verhindern unbegrenzte oder wechselnde Aufgabenstände.

Bewertungen entstehen ausschließlich im vertrauenswürdigen lokalen Server mit der vorhandenen Engine. Der Browser sendet Frageindex und Antwort, keine Punkte oder Identität. Ein SHA-256-Prüfwert erkennt geändertes Material; nachträgliche Wiederbewertung mit neuen Quellen ist nicht vorgesehen. Klassensperren, Eindeutigkeit und Datenbankzeit sichern parallele Antworten und den Fristablauf. Gleichlautende Übermittlungen sind idempotent. Fristablauf, vollständige Bearbeitung, frühe Abgabe und Beenden durch die Lehrkraft sind endgültige Abschlussgründe.

Vier neue RLS-Tabellen trennen Metadaten, Empfänger, privates Material und Antworten. Eine eigene nicht anmeldbare Serverrolle darf Material lesen und Engine-Ergebnisse schreiben. Die Browser-Anwendungsrolle erbt diese Rolle nicht, kann keine Punkte schreiben und keine Rohantworten oder Lösungen lesen. Der lokale Link ist ausschließlich Navigation; alle bisherigen Klassen- und Rollenprüfungen gelten weiter.

Eigene Ergebnisse sind unabhängig von einer Freigabe sichtbar. Lehrkräfte sehen ausschließlich abgeschlossene, aktuell klassenbezogen freigegebene Ergebnisse. Fehlende/nicht freigegebene Ergebnisse zählen nicht als Null; unbeantwortete Fragen eines beendeten Durchgangs bleiben dagegen im Nenner. Verlassen oder Entfernen einer Mitgliedschaft löscht Zuweisung, Antworten und Ergebnis kaskadierend. Wiederbeitritt erzeugt keine alte Zuweisung neu.

## Konsequenzen

- Der vollständige technische Ablauf ist lokal mit synthetischen Konten prüfbar, einschließlich RLS, HTTP, Browser und vorhandener Audio-/Notationsengine.
- Neue Aufgaben nach Inhaltskorrekturen erfordern eine neue Zuweisung. Keine mehrfachen Versuche, individuellen Fristverlängerungen, Freitextkorrekturen, Ratings, XP oder Zertifikate in diesem Entwurf.
- Der flüchtige Datenbankstand ist kein Archiv, keine Kontenverwaltung und kein Produktionsmigrationspfad. Identität, dauerhafte Aufbewahrung, Export, Rechtsgrundlage und Minderjährigenkonzept benötigen eine gesonderte Umsetzung und Abnahme.
- Alle Quellen bleiben Entwurf. Technische P4-Vorarbeit findet ausdrücklich vor der formalen P4-Freigabe statt; P4.01 bleibt bis F14 und Rechtsklärung zurückgestellt. Öffentliche Bundles und Standardübersetzungen erhalten keine Schulaufgaben.
