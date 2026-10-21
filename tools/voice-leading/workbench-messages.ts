const de = {
  title: 'Satzwerkstatt · interner Entwurf',
  introduction:
    'Vier Stimmen bearbeiten und mit ausdrücklich gewählten Regeln prüfen. Die Berechnung läuft in dieser Datei. Eingaben werden nicht automatisch gespeichert; lade deinen Entwurf vor dem Schließen herunter.',
  language: 'Sprache',
  scoreTitle: 'Titel des Satzes',
  meter: 'Taktart',
  key: 'Vorzeichnung',
  notationHelp:
    'Noten z. B. C4/4, F#4/2, Bb3/8.; Pause r/4; Haltebogen ~; Taktstrich |. Eingaben verwenden internationale Tonnamen: B = deutsches H, Bb = deutsches B. Je Stimme 1–32 Takte. Vorzeichnung: C für C-Dur, c für c-Moll oder z. B. 2#.',
  settings: 'Regeln und Harmonieangaben (JSON)',
  settingsHelp:
    'Das Startbeispiel wählt vier Regeln und vier Harmoniezeitpunkte. Bei geänderten Einsatzzeiten müssen die Harmonieangaben dazu passen. Die Auswahl ist kein freigegebenes Lehrprofil. Technische Feldnamen und Parserdetails sind sprachneutral bzw. in der Sprache des Parsers.',
  analyze: 'Satz prüfen',
  save: 'Entwurf herunterladen',
  load: 'Entwurf laden (JSON)',
  export: 'Prüfbericht herunterladen',
  pending: 'Eingabe geändert. Erneut prüfen, um aktuelle Befunde zu sehen.',
  checked: 'Prüfung abgeschlossen. Befunde:',
  invalid: 'Eingabe konnte nicht geprüft werden. Bitte Notation und Einstellungen korrigieren.',
  loadError: 'Der Entwurf konnte nicht geladen werden. Die bisherigen Eingaben bleiben erhalten.',
  loaded: 'Entwurf geladen. Prüfe ihn für aktuelle Befunde.',
  details: 'Fehlerdetails',
  results: 'Aktueller Prüfbericht',
  noScript: 'Diese lokale Bearbeitungsansicht benötigt JavaScript.',
};
type Messages = { readonly [Key in keyof typeof de]: string };
const en: Messages = {
  title: 'Part-writing workshop · internal draft',
  introduction:
    'Edit four voices and check them with explicitly chosen rules. Calculation runs in this file. Input is not saved automatically; download your draft before closing.',
  language: 'Language',
  scoreTitle: 'Composition title',
  meter: 'Time signature',
  key: 'Key signature',
  notationHelp:
    'Notes e.g. C4/4, F#4/2, Bb3/8.; rest r/4; tie ~; barline |. Input uses international pitch names: B is German H, Bb is German B. Use 1–32 measures per voice. Key signature: C for C major, c for C minor, or e.g. 2#.',
  settings: 'Rules and harmony context (JSON)',
  settingsHelp:
    'The starting example selects four rules and four harmony frames. If onset times change, match the harmony context to them. This selection is not an approved teaching profile. Technical field names and parser details use their original language.',
  analyze: 'Check composition',
  save: 'Download draft',
  load: 'Load draft (JSON)',
  export: 'Download review report',
  pending: 'Input changed. Check again to see current findings.',
  checked: 'Check complete. Findings:',
  invalid: 'Input could not be checked. Please correct the notation and settings.',
  loadError: 'The draft could not be loaded. Your previous input is preserved.',
  loaded: 'Draft loaded. Check it for current findings.',
  details: 'Error details',
  results: 'Current review report',
  noScript: 'This local editor requires JavaScript.',
};
export const WORKBENCH_MESSAGES = {
  'de-DE': de,
  'en-US': en,
  'en-GB': { ...en, notationHelp: en.notationHelp.replace('measures', 'bars') },
};
