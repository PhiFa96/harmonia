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
  listen: 'Satz anhören',
  soundHelp:
    'Der zuletzt geprüfte Satz erklingt mit einem einfachen Synthesizer. Wähle alle Stimmen oder eine einzelne Stimme. Das Tempo zählt immer Viertelnoten pro Minute, auch bei anderen Taktarten.',
  tempo: 'Tempo (Viertel/min, 40–200)',
  part: 'Stimmenauswahl',
  allParts: 'Alle vier Stimmen',
  play: 'Abspielen',
  stop: 'Stoppen',
  audioStatus: 'Wiedergabestatus',
  progress: 'Wiedergabefortschritt',
  audioStarting: 'Wiedergabe wird vorbereitet …',
  audioPlaying: 'Wiedergabe läuft.',
  audioStopped: 'Wiedergabe gestoppt.',
  audioEnded: 'Wiedergabe beendet.',
  audioError:
    'Wiedergabe nicht möglich. Prüfe die Audioausgabe des Browsers und versuche es erneut.',
  tempoError: 'Wähle ein ganzzahliges Tempo zwischen 40 und 200 Viertelnoten pro Minute.',
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
  listen: 'Listen to the composition',
  soundHelp:
    'The last checked composition plays with a simple synthesizer. Choose all voices or a single voice. Tempo always counts quarter notes per minute, including in other time signatures.',
  tempo: 'Tempo (quarter notes/min, 40–200)',
  part: 'Voice selection',
  allParts: 'All four voices',
  play: 'Play',
  stop: 'Stop',
  audioStatus: 'Playback status',
  progress: 'Playback progress',
  audioStarting: 'Preparing playback …',
  audioPlaying: 'Playback in progress.',
  audioStopped: 'Playback stopped.',
  audioEnded: 'Playback finished.',
  audioError: 'Playback is unavailable. Check your browser’s audio output and try again.',
  tempoError: 'Choose a whole-number tempo between 40 and 200 quarter notes per minute.',
};
export const WORKBENCH_MESSAGES = {
  'de-DE': de,
  'en-US': en,
  'en-GB': {
    ...en,
    notationHelp: en.notationHelp.replace('measures', 'bars'),
    soundHelp: en.soundHelp
      .replace('synthesizer', 'synthesiser')
      .replace('quarter notes', 'crotchets'),
    tempo: 'Tempo (crotchets/min, 40–200)',
    tempoError: en.tempoError.replace('quarter notes', 'crotchets'),
  },
};
