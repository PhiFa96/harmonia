# Supabase-Grundlage P1.04

Stand: 04.10.2026. Lokale Backend-Grundlage für P2.01; Anmeldung in der App und entfernte EU-Projekte sind noch offen.

## Lokal arbeiten

Voraussetzungen: Node 22, pnpm 10 und ein laufender Docker-Daemon (Docker Desktop auf macOS/Windows). Die Supabase CLI ist mit Version 2.119.0 im Lockfile gepinnt. Kein globales Supabase und kein Supabase-Cloudkonto erforderlich.

```sh
pnpm install --frozen-lockfile
pnpm db:start
pnpm db:lint
pnpm db:test
pnpm db:test:api
```

`db:start` startet PostgreSQL 17, Auth, PostgREST, Kong und Mailpit. API: `http://127.0.0.1:54321`, Datenbank-Port: `54322`, lokale E-Mails: `http://127.0.0.1:54324`. Studio, Storage, Realtime, Edge Runtime und Analytics bleiben bis zum jeweiligen Arbeitsschritt deaktiviert.

`pnpm db:stop` beendet die lokalen Dienste und behält die lokale Datenbank. `pnpm db:reset` **löscht die lokale Datenbank** und spielt sämtliche Migrationen neu ein. Nur für lokale Testdaten verwenden; die Befehle enthalten keine Verknüpfung zu staging/production. Die pgTAP-Tests laufen in einer zurückgerollten Transaktion. Der API-Test legt zwei zufällige lokale Konten an und entfernt sie anschließend, auch bei einem fehlgeschlagenen Test.

In dieser Cloud-Umgebung zuerst `source /workspace/harmonia-env.sh` ausführen. Die Umgebung setzt `SUPABASE_HOME` auf ein beschreibbares Verzeichnis außerhalb des Repos und `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io` auf die erlaubte Registry. `SUPABASE_USE_SLIM_IMAGES=1` verwendet die von der gepinnten CLI vorgesehenen kleineren Images aus `ghcr.io/supabase/cli`, damit der Docker-Speicherbedarf sinkt; die CI verwendet dieselbe Variante. Die normalen Docker-Proxy-/CA-Einstellungen bleiben erhalten. Das beschreibbare Cache-Verzeichnis ersetzt keine Nutzer-Credentials.

Die Cloud-Startanleitung enthält außerdem eine außerhalb des Repos installierte Docker-Aufrufhilfe: BusyBox-`wget` in den Slim-Images ignoriert `no_proxy`; ausschließlich für Healthchecks an Loopback ergänzt die Hilfe `-Y off`. So geht die interne Startprüfung direkt an den eigenen Container. Docker-Konfiguration, Registry-Anmeldung und Proxy für externe Verbindungen werden nicht verändert. Auf einem normalen lokalen Rechner und in der GitHub-CI ohne diesen Proxy ist keine Hilfe erforderlich.

`supabase status` gibt lokale Schlüssel aus. Diese Ausgabe nicht in Logs, Issues oder Dokumentation kopieren. Der API-Test liest sie nur im Prozess. In der CI wird die Startausgabe in eine temporäre, nicht hochgeladene Datei umgeleitet. Der Service-Schlüssel gehört niemals in Expo-Variablen oder die App.

## Profile und Zugriff

Die Migration `20261004000000_profiles.sql` legt das erste, minimale Profil an:

| Feld | Verhalten |
|---|---|
| `id` | Auth-User-ID, Primär-/Fremdschlüssel, Löschkaskade vom Konto |
| `display_name` | Optional; nicht ausschließlich Leerzeichen, höchstens 60 Zeichen |
| `locale` | `de`, `en-US`, `en-GB`; Standard `de`, passend zu `AppLocale` |
| `created_at`, `updated_at` | Vom Server gesetzt; Aktualisierungen setzen `updated_at` neu |

Ein Auth-Trigger erzeugt genau ein Profil mit der echten Konto-ID. Vom Nutzer frei gewählte Auth-Metadaten werden dabei ignoriert. Für bestehende Konten legt die Migration fehlende Profile an. Die privilegierte Triggerfunktion hat einen leeren `search_path` und liegt im nicht über REST exponierten Schema `private`.

Ohne Session gibt es keinen Profilzugriff. Angemeldete Nutzer lesen nur ihre eigene Zeile und ändern nur `display_name` und `locale`. RLS prüft Konto-ID und Zielzeile; Spaltenrechte verhindern Änderungen von ID und Zeitstempeln. Direkte Profil-Erstellung/-Löschung durch die App ist gesperrt. Der vertrauenswürdige Backend-Service darf kontenübergreifend zugreifen. Das Löschen des Auth-Kontos entfernt das Profil; die vollständige Kontolöschung mit späteren Tabellen und externen Diensten gehört zu P2.01.

Weitere Einstellungen, Altersbestätigung und Onboarding-Felder folgen in P2.01/P2.02. Der anonyme Auth-Modus bleibt deaktiviert, solange F10 (Gastmodus) nicht entschieden ist. Die lokale E-Mail-Bestätigung ist für Tests ausgeschaltet; das ist keine Produktionskonfiguration.

## Prüfungen und CI

34 pgTAP-Prüfungen testen reale Datenbankrollen, eigene/fremde Profile, gefälschte Metadaten, Schreibschutz der Serverfelder, Eingabegrenzen und die Löschkaskade. Der zusätzliche Auth-/REST-Test verwendet echte lokale Sessions, prüft dieselbe Kontentrennung über HTTP und entfernt seine Testkonten.

Der CI-Job „Supabase und Profil-Zugriffsschutz“ startet die lokale Umgebung, setzt die Datenbank neu auf und führt SQL-Lint, pgTAP und den API-Test aus. Er benötigt keine GitHub-Secrets und deployt keine Migrationen auf entfernte Projekte. Ein erfolgreicher GitHub-Lauf muss vor dem Merge nachgewiesen werden.

Lokal geprüft: vollständiger Start mit gesunden Diensten, Stop/Neustart, Neuaufsetzen der Datenbank, SQL-Lint ohne Warnungen, alle 34 pgTAP-Prüfungen und der Auth-/REST-Test mit zwei echten Sessions. Keine Testkonten bleiben zurück. Die bisherigen 1.317 Paket-/App-Tests sowie Lint, Typprüfung, Format, Übersetzungen, eingefrorene Installation und Deno-Prüfung bestehen ebenfalls.

## Noch offen für vollständiges P1.04 und P2.01

- Staging und Produktion in einer EU-Region anlegen bzw. bestehende Projekte identifizieren; PostgreSQL-Hauptversion mit der lokalen Version abgleichen.
- Projekte verbinden, Zugangsdaten in den dafür vorgesehenen Secret-Einstellungen hinterlegen und einen getrennten staging-Migrationsworkflow einrichten. Produktive Migrationen erst nach geprüftem staging-Lauf.
- Für die App nur öffentliche URL und Publishable-/Anon-Schlüssel konfigurieren. Auth-Rückleitungen, E-Mail-Bestätigung, SMTP und Apple/Google separat je Umgebung einrichten und testen.
- F10 klären und anschließend die Konten-/Gastverknüpfung implementieren. Keine ungetestete Anmeldung oder vermeintliche Synchronisation in der UI anzeigen.

Diese externen Projekte sind in der aktuellen Sitzung nicht konfiguriert. Die lokale Umsetzung schließt P1.04 deshalb noch nicht vollständig ab.
