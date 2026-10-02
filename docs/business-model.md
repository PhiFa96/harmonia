# Geschäftsmodell (Entwurf)

> Keine Rechts- oder Steuerberatung. Die Store-Regeln ändern sich häufig. Vor dem Launch erneut prüfen. Stand der Angaben: 02.10.2026.

## Abo-Stufen

Namen sind Arbeitstitel, Preise noch offen.

| Stufe | Inhalt (Vorschlag) |
|---|---|
| **Gratis** | Lernpfad der ersten Stufen, begrenzte Übungen pro Tag, ein Rush und ein Duell pro Tag, Streaks und Ligen |
| **Premium** | Alle Stufen, unbegrenzt üben, KI-Tutor (Text), Prüfungsmodus, offline nutzbar, Statistiken |
| **Max** | Premium plus KI-Live-Calls (Sprache), Tonsatz-Korrektor, Song-Analyse |
| **Coaching** | Calls mit menschlichen Coaches: einzeln über den Marktplatz buchbar oder als Kontingent im teuersten Abo |

Vorbild für das Gratis-Kontingent: Bei chess.com bekommen Basis-Mitglieder 3 Rätsel, einen Puzzle Rush und ein Puzzle Battle pro Tag, Premium ist unbegrenzt.

## Einnahmequellen

1. **Abos** (Premium, Max)
2. **Coach-Marktplatz:** Provision auf jeden gebuchten Call
3. **Creator-Kurse:** Umsatzbeteiligung an verkauften Kursen
4. **Schul-Lizenzen:** B2B, z. B. pro Platz und Jahr
5. **Zertifikatsprüfungen:** Gebühr pro Prüfung

## Coach-Marktplatz: wie Harmonia mitverdient

**Ablauf:** Der Schüler bezahlt bei Harmonia. Harmonia behält eine Provision und zahlt den Rest an den Coach aus. Der Coach legt seinen Stundensatz selbst fest. Technisch geht das z. B. mit Stripe Connect: Die Plattform zieht pro Zahlung eine Gebühr („application fee“) ab und zahlt den Rest an das Konto des Coaches aus.

**Vergleichswerte:**

| Plattform | Provision | Quelle |
|---|---|---|
| Preply | 33 % für neue Tutoren, stufenweise sinkend bis 18 % ab 400 unterrichteten Stunden; dazu 100 % der ersten Probestunde mit jedem neuen Schüler | [Preply-Hilfe (offiziell)](https://help.preply.com/en/articles/4171383-preply-commission-model) |
| italki | Laut Drittquellen etwa 15–21 % je nach Paket, Gruppenkurse höher; nicht offiziell bestätigt | [supatutor.in](https://supatutor.in/preply-vs-italki/) |

**Zusätzliche Hebel (Ideen):**

- Coach-Pro-Abo: bessere Sichtbarkeit, Analyse-Tools und KI-Assistent für die Unterrichtsvorbereitung
- Hervorgehobene Platzierung in der Coach-Suche
- Probestunde: Provision wie bei Preply oder bewusst niedriger, um Coaches zu gewinnen

## App-Store-Regeln

Diese Regeln bestimmen, wie viel von jedem Euro bei uns ankommt.

**Apple (App Store)**

- Digitale Inhalte und Abos in der iOS-App müssen per In-App-Kauf bezahlt werden (Richtlinie 3.1.1).
- Live-Dienste in Echtzeit zwischen *zwei Personen* (Beispiel: Nachhilfe) dürfen anders abgerechnet werden. Bei 1:wenige und 1:viele ist der In-App-Kauf Pflicht (3.1.3(d)). → Coach-Calls 1:1 können über Stripe laufen.
- KI-Calls sind kein Dienst von Person zu Person. → Nach unserer Auslegung In-App-Kauf.
- Lizenzen, die direkt an Organisationen für ihre Mitarbeiter oder Schüler verkauft werden, dürfen außerhalb des In-App-Kaufs laufen. Käufe von Einzelpersonen oder Familien nicht (3.1.3(c)). → Schul-Lizenzen direkt verkaufen.
- Small Business Program: 15 % Provision statt 30 % bis 1 Mio. USD Erlös pro Jahr. Anmeldung nötig.
- Quelle: [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [Small Business Program](https://developer.apple.com/app-store/small-business-program/)

**Google (Play Store)**

- Seit 30.06.2026 gilt in den USA, im EWR und im Vereinigten Königreich: 10 % Servicegebühr auf die erste 1 Mio. USD Jahresumsatz und auf alle automatisch verlängerten Abos. Bei Abrechnung über Google Play kommen 5 % Abrechnungsgebühr dazu. Bei alternativer Abrechnung oder Web-Links entfällt die Abrechnungsgebühr. Quelle: [Android Developers Blog](https://developer.android.com/blog/posts/expanded-billing-choice-and-lower-fees-on-google-play)
- Bezahlte Online-Dienste 1:1 zwischen zwei Personen brauchen Google-Play-Billing nicht. Bedingung: Die Sitzung wird nicht aufgezeichnet und ist später nicht abrufbar. Quelle: [Play Console Hilfe](https://support.google.com/googleplay/android-developer/answer/10281818)
  → Coach-Calls standardmäßig ohne Aufzeichnung. Auch eine KI-Zusammenfassung des Calls vorher auf Vereinbarkeit prüfen.

**Web**

- Im Browser direkt per Stripe, ohne Store-Gebühr. Verweise aus der App auf den Web-Kauf sind je nach Region und Store eingeschränkt.

**Technik**

- Abos: RevenueCat (In-App-Käufe auf iOS und Android plus Web Billing über Stripe, gemeinsame Berechtigungen)
- Marktplatz: Stripe Connect

## Offene Entscheidungen

- Preise der Stufen
- Provisionsmodell im Marktplatz
- Werbung im Gratis-Bereich: ja oder nein?
- Tageslimit im Gratis-Bereich: Energie/Herzen wie bei Duolingo oder feste Kontingente wie bei chess.com?
