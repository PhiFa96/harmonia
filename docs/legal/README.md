# P2.21 – Datenschutzunterlagen und Abnahmepaket

Stand: 14.10.2026. **Arbeitsunterlagen, keine juristische Freigabe.** Phillip hat F17 auf zwölf Monate festgelegt; Betreiber, Rechtsform, ladungsfähige Anschrift und Kontakt sind noch offen. Die Entwürfe dürfen nicht als veröffentlichte Verträge/Datenschutzerklärung ausgeliefert werden.

- [Verarbeitungsverzeichnis](verarbeitungsverzeichnis.md)
- [Lösch- und Aufbewahrungskonzept](loeschkonzept.md)
- [Dienstleister, AV-Verträge und Übermittlungen](dienstleister.md)
- [DSFA-Vorprüfung](dsfa-vorpruefung.md)
- [Store-Angaben und Altersfreigabe](store-datenschutz.md)
- `drafts/`: eigene, funktionsbezogene Entwürfe für Impressum, Datenschutz, Nutzungsbedingungen und Widerruf in DE/EN.

Das Manifest `apps/mobile/legal-readiness.json` hält die noch fehlenden Angaben und Belegreferenzen. `pnpm check:legal` prüft den vorbereiteten Stand; `pnpm check:legal:release` verweigert derzeit erwartet die Freigabe. Ein Häkchen ersetzt keinen tatsächlichen Vertrag oder juristischen Durchgang. Private Vertrags-/Prüfunterlagen nicht in den öffentlichen App-Bundle oder dieses Repository übernehmen; nur überprüfbare Referenzen im Manifest pflegen. Fachleute/Betreiber müssen tatsächliche Anbieterbindung, Rollen, Dokumente, Minderjährigenverträge, Steuern und vollständige Web-Kündigung abnehmen. Es wurden keine Vereinbarungen unterschrieben, Store-Formulare eingereicht oder Nachrichten an Anbieter versandt.

Offizielle Quellen zur Prüfung: [DSGVO](https://eur-lex.europa.eu/eli/reg/2016/679/oj), [KI-Verordnung](https://eur-lex.europa.eu/eli/reg/2024/1689/oj), [DDG §5](https://www.gesetze-im-internet.de/ddg/__5.html), [BGB §312k](https://www.gesetze-im-internet.de/bgb/__312k.html), [Apple Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [Apple App Privacy](https://developer.apple.com/app-store/app-privacy-details/), [Google Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469). Im ursprünglichen P2.21-Durchgang konnten diese Quellen über den eingeschränkten Shell-Zugang nicht direkt gelesen werden. Der aktualisierte Quellenstand für die KI-Verordnung wird im unten verlinkten P4.17-Durchgang getrennt dokumentiert. Die vollständige konsolidierte Rechtsfassung und die rechtliche Einordnung benötigen weiterhin den unabhängigen Durchgang.

Ergänzung 15.10.2026: P2.22 bereitet eigene Supabase-Analytics mit konkreter Einwilligung und privatem Dashboard vor. Verzeichnis, Löschkonzept, Storevorbereitung und DE/EN-Datenschutzentwürfe ergänzt; keine rechtliche Freigabe und keine Erfassung aktiviert. ADR 0022 beachten.

P4.17, 24.10.2026: [Quellenbezogene KI-Verordnungs-Voreinschätzung](ai-act/vorpruefung.md) und [technische Prüfvorbereitung](../plan/ki-verordnung-pruefvorbereitung.md) ergänzt. Der verfügbare Webzugang konnte amtliche Kommissions-/Explorer-Seiten lesen; der direkte EUR-Lex-Volltextabruf blieb blockiert. Die dort bestätigten Änderungen ersetzen für diesen Prüfstand die frühere unbestätigte Terminnotiz. Unabhängige schriftliche Rechtsprüfung und alle echten Freigaben bleiben offen. Private Prüfpakete liegen ausschließlich unter `artifacts/ai-act/`; `legalApprovalInferred` bleibt false.
