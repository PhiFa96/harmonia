# ADR 0027 – Release mit echten Prüfbelegen

Datum: 15.10.2026. Status: technische Vorbereitung, kein Launch.

P2.26 braucht einen nachvollziehbaren Übergang von technischer Vorbereitung zu tatsächlicher Veröffentlichung. Ein grüner lokaler Build ersetzt weder fachliche Prüfung, Rechtsfreigabe, echte Beta noch Anbieter- und Gerätebelege.

Ein zentraler Preflight vereinigt die bestehenden Store-, Rechts-, Geräte- und Beta-Gates mit dem vollständigen öffentlichen Katalog, aktueller echter Tutor-Kalibrierung, Produktionsbindung, Betriebsbudget und Abnahmen. Der Vorbereitungsmodus darf mit offenen Punkten erfolgreich laufen; `p2:release` scheitert bei offenen Punkten. Anschließend verlangt er einen sauberen `main`-Kandidaten aus einem gemergten PR mit erfüllten GitHub-Reviewregeln und erfolgreiche erforderliche CI genau für dessen Commit. Der Befehl veröffentlicht und mergt nichts selbst. Integration erfolgt ausschließlich über PRs, wie vom Nutzer verlangt.

Supabase zählt optional ausschließlich aggregierte Service-Ergebnisse pro UTC-Minute. Die Dimensionen sind fest begrenzt; keine Nutzerkennungen, URLs, Antworten oder Nachrichtentexte. Clientrollen haben keinen Zugriff. Erfassung bleibt standardmäßig aus. Der private Betreiberbericht prüft Sync-Fehler, Tutor-Kosten einschließlich Reservierungen und überfällige Billing-/Löschaufträge. Fehlende Messungen oder Budgets bleiben unbekannt. Native Abstürze und vollständige SSE-Laufzeit lassen sich aus diesen Zählern nicht ableiten und benötigen eigene echte Belege. Metriken sind von optionaler Produktanalyse getrennt; Zweck, Aufbewahrung und Betriebsfreigabe sind vor Aktivierung zu prüfen.

Supportvorlagen werden nur gerendert, nie automatisch versandt. Ein gesondertes Journal verlangt tatsächliche Store-/Web-Verfügbarkeit, 72 verstrichene Stunden, zeitlich passende Beobachtungen, nachgewiesene Incident-Behandlung, Rückblick und aktualisierte Phase-3-Planung. Synthetische Daten erfüllen diesen Abschluss nicht.

Ablauf und offene Verantwortlichkeiten: [Launch und Betrieb](../plan/launch-betrieb.md), [P2-Abschlussstand](../plan/p2-abschluss.md).
