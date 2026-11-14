# ADR 0080: Zertifikatszahlungen nur ausdrücklich lokal simulieren

Datum: 14.11.2026 · Status: angenommen für den beauftragten internen technischen Entwurf.

## Ausgangslage

Befund N5 der [v3-Prüfung](../quality/fachpruefung-phase-4-v3/ki-zertifikate.md) beschreibt einen allgemeinen `/api/settle`-Endpunkt: Derselbe Sitzungsinhaber kann die eigene Bestellung als bezahlt bestätigen. Der bisherige Prototyp kennzeichnet das als Simulation und bindet an Loopback. Diese Umgebung allein ist keine Zahlungsautorität und darf bei einer späteren Anbieteranbindung nicht stillschweigend übernommen werden.

## Entscheidung

1. Der Zertifikatsdienst und der HTTP-Server starten mit gesperrten Zahlungen (`unavailable`). Ohne ausdrückliche lokale Simulation können weder Bestellungen angelegt noch Testprüfungen freigeschaltet werden. Gespeicherte simulierte Zahlungen ändern das nicht.
2. Eine nur im Node-Prozess erzeugbare Fähigkeit schaltet `local-simulation` ein. Sie ist per `WeakSet` gebunden, nicht per JSON, Booleschem Wert, Anfrageheader oder Browserzustand übertragbar. Produktion und unbekannte Anwendungskontexte lehnen sie ab; die Prüfung erfolgt auch während des Betriebs. Unbekannte Konfigurationsfelder und CLI-Argumente werden abgewiesen.
3. Allgemeine `settle`-/`refund`-Methoden und `/api/settle`-/`api/refund`-Routen entfallen. Ausdrücklich benannte Simulationsmethoden und `/api/simulation/settle` beziehungsweise `/api/simulation/refund` bestehen ausschließlich mit aktiver lokaler Fähigkeit. Die Serverfabriken aktivieren diese niemals selbst; Testfabriken tun dies ausdrücklich.
4. Neue Bestellungen tragen `certificate-local-simulation-v2` und bleiben immer `simulated: true`. Alte v1-Bestellungen werden weder umgewidmet noch zur Freischaltung angenommen. Ein echter Anbieter oder echte Berechtigungen sind in diesem Dienst nicht implementiert. Unbekannte Anbieterkonfiguration führt zu einem Fehler statt zum Simulator.
5. Die private DE/en-US/en-GB-Oberfläche zeigt den Modus. Ohne Simulation fehlen Start-, Zahlungs- und Erstattungsaktionen. Vorhandene Durchgänge zeigen `unavailable`, ohne Aufgaben, Auswertung oder Muster-PDF. Export, Einzel- und Gesamtlöschung bleiben für die eigene gültige Testsitzung verfügbar. Ein ausgeschalteter Modus allein invalidiert passende v2-Testdaten nicht dauerhaft.
6. `certificates:preview` öffnet den gesperrten Standardmodus. Nur `certificates:preview:simulation` beziehungsweise das einzelne Argument `--simulate-payments` aktiviert die lokale Simulation. Es gibt keinen Live-, Produktions- oder Anbieter-Schalter.

## Folgen und Grenzen

Die ausdrücklich aktivierte Simulation bleibt vom Sitzungsinhaber bedienbar: Das dient ausschließlich synthetischen internen Tests, ohne Preis, Geld, Zahlungsanbieter oder echte Prüfungsberechtigung. Sitzungsschutz, Eigentumsprüfung, atomarer Verbrauch, Wiederholbarkeit und Widerruf während der PDF-Erzeugung bleiben erforderlich. Die Fähigkeit bestätigt keine reale Zahlung.

Die neue Codebindung erfordert neue Prüfmappen und Testdurchgänge; alte v1-Daten bleiben als solche exportierbar und löschbar. Ein produktiver Dienst braucht eine gesonderte geprüfte Konten-/Anbieteranbindung mit serverseitiger Zahlungsbestätigung. N3 (Dateihash ist kein Echtheitsbeweis) bleibt eine ausdrücklich dokumentierte Grenze. N4 wird separat bearbeitet; diese Änderung beansprucht keine allgemeine Trennung aller Leser und Schreiber.

Technische P4-Vorarbeit **vor der formalen Phase-4-Freigabe**. Keine Veröffentlichung, echte Zahlung, gültige Zertifikatsausstellung oder Main-Integration. Inhalte bleiben Entwurf; unabhängige Fach-/Quellen-/Sprach-, Rechts-, Anbieter- und reale Geräte-/Screenreaderabnahmen bleiben offen. P4.01 bleibt bis F14 und Klärung der rechtlichen Voraussetzungen zurückgestellt. [Bedienung und Nachweise](../plan/zertifikate-zahlungsgrenze.md).
