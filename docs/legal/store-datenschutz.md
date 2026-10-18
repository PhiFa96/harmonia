# Arbeitsvorlage für App Privacy, Data Safety und Altersfreigabe

**Keine Store-Einreichung, keine bestätigte Altersbewertung.** Betreiber und aktuelle Provider-/SDK-Konfiguration müssen die Angaben abschließen. Aktuelle Formulare/Richtlinien sind über die offiziellen Stores zu prüfen; deren Hosts sind im aktuellen Cloud-Netz gesperrt.

| Kategorie | Aktueller Funktionsbezug | Verknüpfung / Zweck / Abnahme |
|---|---|---|
| Kontakt-/Benutzerdaten | E-Mail-Anmeldung, Supabase-/RevenueCat-ID; Lösch-/Kündigungsangaben | Kontoabhängig; Auth/Funktion/Betroffenenrechte. Öffentliche Kündigung darf ohne Login ankommen |
| Nutzerinhalte | Lernantworten und Hinweise, Meldungstext, Tutor-Fragen/-Antworten | Kontolernen/Tutor privat verknüpft; lokale Gastdaten zusätzlich. Nicht pauschal „keine Sammlung“ markieren |
| Nutzung / Lernfortschritt | Aufgabe/Lektion, Einstufung, XP/Münzen, Streak, Ziele, Energie | Notwendige Appfunktion; optionale, standardmäßig ausgeschaltete eigene Produktstatistik separat nach ADR 0022 bewerten |
| Käufe | Store, Produkt, Berechtigung, Ablauf/Zahlungsstatus | RevenueCat/Stores; Web-Zahlungsdaten ggf. bei Stripe. Endgültige SDK-/Checkout-Fragen prüfen |
| Kennungen | Konto- und Gerätekennungen, bei Remote-Push Token | Funktion/optionale Erinnerung. Anbieterseitige Geräte-/Diagnosekennungen prüfen |
| Diagnosen / IP / Protokolle | Mögliche Infrastruktur-/SDK-Protokolle | Konkrete Providerkonfiguration prüfen; keine ungeprüfte „kein Tracking/keine Daten“-Gesamtzusage |
| Audio/Mikrofon | Optionales Stimmgerät verarbeitet Mikrofon-PCM und Tonhöhe flüchtig auf dem Gerät, ohne Datei oder Upload; außerdem Ausgabe und Rhythmus-Taps | OS-/Browserberechtigung, Datenschutztext und die tatsächlichen Store-Formulare für lokale Verarbeitung prüfen; vor anderer Aufnahmefunktion neu bewerten |

Tracking/Weitergabe anhand der Storedefinition und **aller** aktiven SDKs bewerten, nicht nur nach eigener Absicht. Aktuell keine Werbung, Ad-ID-Erfassung oder Analytics-/Marketing-SDK implementiert. P2.22 bereitet eigene einwilligungsgebundene Analytics-Ereignisse bei Supabase vor; diese Verarbeitung und deren Kontoverknüpfung in beiden Stores gesondert deklarieren, bevor die Erfassung aktiviert wird. RevenueCat-/Expo-/Infrastrukturverhalten bleibt vertraglich und auf Geräten zu verifizieren. Transitverschlüsselung für den echten Remote-Build/alle SDK-Destinationen prüfen; lokale HTTP-Testdienste sind kein produktiver Verschlüsselungsnachweis. Lokale SQLite-Daten sind OS-sandboxgeschützt, keine ungeprüfte Zusage eigener Datenbankverschlüsselung.

Anzugeben: öffentlicher erreichbarer Datenschutzlink DE/EN, Verantwortlicher/Kontakt, eigener Löschweg (in App), bei Google die erforderliche öffentliche Kontolöschungsinformation, tatsächliche Aufbewahrung/Ausnahmen und Anfragewege. `/privacy` und `/legal` sind ohne Onboarding/Anmeldung erreichbar; die echte Kontolöschung verlangt eigene Identitätsbestätigung.

Altersfragebogen: Musiklernen, optionale KI-Freitextantworten, keine freie User-User-Kommunikation, keine eigenen Gewalt-/Sexualitäts-/Glücksspielinhalte, virtuelle verdiente Schutzmünzen ohne Geldkauf, Abos noch gesperrt. KI kann trotz Schutzmaßnahmen unpassende Inhalte erzeugen; nicht sämtliche Inhaltsrisiken automatisch mit „nein“ beantworten. Vorläufige App-Altersgrenze ab 16 ersetzt keine Storebewertung und keine Prüfung der Geschäftsfähigkeit bei Abos. Google-Login ist nicht implementiert; die dadurch eventuell ausgelöste Apple-Login-Pflicht wird erst bei tatsächlicher Einführung relevant.

P3.04 ergänzt bei angemeldeten Konten gruppensichtbare Wochen-XP und Rang unter einer nur gruppeninternen Kennung. Kontozuordnung bleibt intern; kein privater Profilname wird veröffentlicht. Kategorieentscheidung, Lese-/Zustellmarker, Stufe und Retention nach ADR 0031 in den tatsächlichen Storeformularen und Rechtstexten gesondert prüfen. Keine Freigabe dieser Angaben durch technische Tests.
