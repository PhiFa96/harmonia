# Übersetzungen und Fachglossar

Umgesetzt in P1.05. Grundlage: [ADR 0003](../decisions/0003-zweisprachigkeit-de-en.md) (Deutsch und Englisch gleichberechtigt, Englisch als US- oder UK-Variante).

## Aufbau

Alles liegt in `packages/i18n`. Das Paket hängt nur von der Theorie-Engine und i18next ab und ist ohne React nutzbar, z. B. später in Edge Functions.

| Datei | Inhalt |
|---|---|
| `src/locale.ts` | Sprachen der App (`de`, `en-US`, `en-GB`), Bestimmung aus den Geräteeinstellungen, Sprache für die Engine |
| `src/messages/de.ts` | Texte der Oberfläche auf Deutsch; gibt Schlüssel und Platzhalter vor |
| `src/messages/en-us.ts` | Englisch (US), muss dieselben Schlüssel haben (prüft der Compiler) |
| `src/messages/en-gb.ts` | Englisch (UK), nur Abweichungen (z. B. „Licences“); der Rest kommt aus en-US |
| `src/glossary.ts` | Fachglossar DE ↔ EN (US/UK) |
| `src/instance.ts` | `createI18n(locale)`: i18next-Instanz mit allen Texten, synchron initialisiert |
| `src/format.ts` | Zahlen und Daten über `Intl` |
| `src/check.ts` | Prüfung der Übersetzungen (siehe unten) |
| `eslint/no-hardcoded-text.js` | ESLint-Regel gegen fest eingetragene Texte |

In der App richtet `apps/mobile/src/i18n` die Instanz mit `react-i18next` ein. Komponenten holen Texte mit `const { t } = useTranslation()`.

## Texte schreiben

- **Neuer Text:** Schlüssel in `de.ts` anlegen, dann in `en-us.ts`. Fehlt er dort, meldet der Compiler einen Fehler. Nur bei britischer Schreibweise (colour, licence, programme) zusätzlich `en-gb.ts`.
- **Typsicher:** `t('tabs.lern')` ist ein Compilerfehler, ebenso unbekannte Glossarbegriffe.
- **Fachbegriffe nie direkt in Texte schreiben,** sondern aus dem Glossar einsetzen: `'Beispiel: C-Dur-Tonleiter in $t(glossary:notes.quarter_other)'`. So zeigt en-GB automatisch „crotchets“ statt „quarter notes“, ohne dass der Text doppelt gepflegt wird.
- **Platzhalter:** `{{name}}`. Die Prüfung stellt sicher, dass beide Sprachen dieselben Platzhalter verwenden.
- **Pluralformen:** i18next-Schlüssel mit Endung `_one`/`_other` (Kategorien nach CLDR über `Intl.PluralRules`; Deutsch und Englisch haben beide `one` und `other`). Aufruf: `t('key', { count })`.
- **Sprachnamen** (Deutsch, English (US), English (UK)) stehen in jeder Oberfläche in der eigenen Sprache (`LOCALE_NAMES`) und werden nicht übersetzt.

## Prüfungen

1. **Compiler:** en-US muss die Form von `de.ts` haben (`satisfies Messages`), en-GB darf nur vorhandene Schlüssel überschreiben.
2. **Prüfskript** `pnpm check:i18n` (in der CI, Job „Lint, Typen, Tests“). Es meldet:
   - fehlende oder überzählige Schlüssel,
   - leere Texte,
   - unvollständige Pluralformen,
   - abweichende Platzhalter,
   - unvollständig überschriebene Pluralgruppen in en-GB,
   - Verweise `$t(…)` auf unbekannte Texte.
3. **ESLint-Regel** `harmonia/no-hardcoded-text` in allen `.tsx`-Dateien außer Tests. Sie meldet:
   - Text zwischen JSX-Tags,
   - Zeichenketten als Kinder,
   - sichtbare oder vorgelesene Attribute (`aria-label`, `accessibilityLabel`, `title`, `placeholder`, `alt` …),
   - Navigationsoptionen wie `options={{ title: '…' }}`.

   Zeichenketten ohne Buchstaben (Zahlen, Satzzeichen, Symbole) sind erlaubt.

## Sprache bestimmen

- Die App geht die bevorzugten Sprachen des Geräts der Reihe nach durch; die erste deutsche oder englische gewinnt (z. B. Französisch, dann Deutsch → Deutsch). Ohne Treffer: Englisch (US).
- Im Profil lässt sich die Sprache fest wählen: „Wie das Gerät“, Deutsch, English (US), English (UK). Der Wechsel wirkt sofort, ohne Neustart.
- Im Web setzt die App zusätzlich `<html lang>` (Screenreader, Silbentrennung; WCAG 3.1.1).
- Die Notenbeschriftung für Screenreader folgt derselben Einstellung (`engineLanguage`).

### Standard für Englisch: US oder UK

ADR 0003 legt fest: umschaltbar, Standard nach Gerät. Offen war, welche Regionen britische Begriffe bekommen. Entscheidend ist, welche Begriffe der Musikunterricht des Landes verwendet, nicht nur die Rechtschreibung.

| Region | Standard | Beleg |
|---|---|---|
| Großbritannien (GB) | UK | ABRSM, Grade-1-Lehrplan: semibreve, minim, crotchet, quaver |
| Irland (IE) | UK | Royal Irish Academy of Music, Prüfungslehrpläne: crotchets, quavers, minims |
| Australien (AU) | UK | AMEB, Theory/Musicianship Grade 1: semibreve, minim, crotchet, quaver |
| Neuseeland (NZ) | UK | NCEA-Lehrplan: semibreves, minims, crotchets, quavers |
| Südafrika (ZA) | UK | Hauptprüfungsstelle UNISA mit Lehrplan in britischer Tradition, daneben ABRSM und Trinity (mittelbarer Beleg) |
| Indien (IN) | UK | Westliche Musiktheorie wird vor allem über Trinity und ABRSM geprüft (mittelbarer Beleg) |
| Kanada (CA) | US | Royal Conservatory of Music und kanadische Lehrwerke: quarter note, eighth note |
| alle anderen | US | Vorgabe aus ADR 0003 |

Für Südafrika und Indien gibt es nur mittelbare Belege. Weil die Variante jederzeit umschaltbar ist, wiegt ein falscher Standard dort wenig. Nicht aufgenommen sind andere Länder mit vielen ABRSM-Prüfungen (z. B. Singapur, Malaysia, Hongkong), weil dort nicht klar ist, wie verbreitet Englisch als Gerätesprache und die britischen Begriffe im Alltag sind. Das wird nachgezogen, sobald Nutzungsdaten vorliegen.

## Fachglossar

ADR 0003: Das Glossar ist die einzige Quelle für Fachbegriffe. Jeder Eintrag hat:

- eine Kategorie: Notenschrift, Tonhöhe, Tonleitern, Akkorde, Rhythmus,
- den deutschen Begriff mit Geschlecht (für Artikel in Texten),
- den englischen Begriff (US) und, wenn abweichend, den britischen,
- die Mehrzahl, wenn der Begriff in Texten gezählt wird,
- optional einen Hinweis für Autoren (Abgrenzungen, gängige Alternativen).

**Version 1 (P1.05):** 51 Kernbegriffe, dazu 8 Notenwerte und 8 Pausen. Den Ausbau auf etwa 150 Begriffe (u. a. Harmonik nach Entscheidung F03) übernimmt P0.05.

**Abgrenzung zur Engine:** Namen musikalischer Objekte wie „punktierte Viertelnote“, „große Terz“, „harmonisches Moll“ oder „C-Dur“ erzeugt die Theorie-Engine (`durationName`, `intervalName`, `scaleTypeName`, `chordName`, `keyName`). Das Glossar schreibt sie nicht ein zweites Mal auf. Die Notenwerte übernimmt es aus `durationName`, damit Texte sie als Begriff einsetzen können (`$t(glossary:notes.quarter)`). Die Mehrzahl entsteht regelmäßig (-n bzw. -s); ein Test vergleicht sie mit einer eigenen Erwartungstabelle.

### Begriffswahl (geprüft nach ADR 0005)

| Begriff | Wahl | Begründung, Alternativen |
|---|---|---|
| flat | das b, Mehrzahl die b | Duden; Variante „Be“ |
| key signature | Tonartvorzeichnung | eindeutiger als „Vorzeichen“ (meint auch Versetzungszeichen); auch Generalvorzeichen, Vorzeichnung |
| accidental | Versetzungszeichen | „Vorzeichen“ ist mehrdeutig |
| time signature / meter | Taktangabe / Taktart | Taktangabe ist das Zeichen am Anfang, Taktart die Art des Takts; „Taktvorzeichnung“ ist gleichbedeutend mit Taktangabe |
| measure | US measure, UK bar | |
| semitone / whole tone | US half step, whole step; UK semitone, tone | ABRSM: „tones and semitones“. „whole tone“ ist in beiden Varianten verständlich |
| staff | US staff, UK stave, Mehrzahl staves | US-Mehrzahl auch „staffs“ |
| meter | UK metre | britische Schreibung |
| Paralleltonart / Varianttonart | relative key / parallel key | falsche Freunde, im Glossar vermerkt |
| Grundton | tonic (Tonleiter) und root (Akkord) | zwei Einträge, weil Englisch unterscheidet |
| tie, tempo | ohne Mehrzahl | Mehrzahl schwankt (Haltebogen/Haltebögen, Tempi/Tempos) |

Großschreibung: Englische Begriffe stehen in der Grundform klein (Wörterbuchform). Am Satzanfang groß schreiben, wo der Text das braucht. Deutsche Substantive stehen groß, Ausnahme ist das „b“.

Quellen:

- Duden: Stichwort [b (Buchstabe, Ton)](https://www.duden.de/rechtschreibung/b_Buchstabe__Ton)
- [ABRSM Music Theory Syllabus](https://www.abrsm.org/sites/default/files/2023-09/music-theory-syllabus-outline-grades-1-5-from-2020.pdf)
- [AMEB Theory of Music Grade 1](https://www.ameb.edu.au/theory-of-music-grade-1-theory-of-music)
- [RIAM Piano Syllabus](https://www.riam.ie/sites/default/files/media/file-uploads/2025-05/Piano-syllabus-2023-2026-Updated-16-06-2023.pdf)
- [Music Ecademy NCEA Curriculum](https://musicecademy.com/wp-content/uploads/2021/06/Music-Ecademy-NCEA-and-School-Curriculum-2021.pdf)
- [Ultimate Music Theory: Conservatory Canada](https://ultimatemusictheory.com/conservatory-canada-theory-1/)
- [UNISA Theory of Music Syllabus](https://www.unisa.ac.za/static/corporate_web/Content/About/Directorate%20Music/Documents/Theory%20of%20Music%20Syllabus%202015%20Pg1-Gr5%2020190122.pdf)
- [solmisieren.de: Tonartvorzeichnung](https://solmisieren.de/basiskurse/noten-solmisation/lektion-5-tonartvorzeichnung)
- [dewiki: Taktangabe](https://dewiki.de/Lexikon/Taktangabe)

## Plattformen: Intl in Hermes

Hermes, die JavaScript-Engine der App auf iOS und Android, führt in ihrer Dokumentation ([`doc/IntlAPIs.md`](https://github.com/facebook/hermes/blob/main/doc/IntlAPIs.md)) `Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.Collator` und `Intl.getCanonicalLocales` als unterstützt auf. `Intl.PluralRules`, `Intl.RelativeTimeFormat`, `Intl.ListFormat` und `Intl.Locale` fehlen in der Liste. Falls eine neuere Hermes-Version mehr kann, schadet das nicht: Das Polyfill greift nur, wenn nötig.

- **Pluralformen:** i18next braucht `Intl.PluralRules`. Die App lädt deshalb `intl-pluralrules` (ISC-Lizenz, etwa 7 kB). Das Polyfill greift nur, wo die eingebaute Umsetzung fehlt. Ein Test vergleicht es für de, en-US und en-GB mit der eingebauten Umsetzung von Node und prüft i18next mit nur dem Polyfill.
- **Zahlen und Daten:** `formatNumber` und `formatDate` nutzen `Intl.NumberFormat` und `Intl.DateTimeFormat`, die Hermes kann. Beispiele: 1.234,5 (de) und 1,234.5 (en); 3.10.2026 (de), 10/3/2026 (en-US), 03/10/2026 (en-GB).
- **Nicht verwenden ohne Polyfill:** relative Zeitangaben („vor 3 Tagen“), Listen („A, B und C“) und die i18next-Formate `relativetime` und `list`.
