import type { AppLocale } from './locale.ts';
const de = {
  assignments: 'Klassenaufgaben · Entwurf',
  intro:
    'Eigene Entwurfsaufgaben unter synthetischen Testkonten bearbeiten. Antworten werden automatisch geprüft; keine Noten, XP oder Zertifikate.',
  create: 'Aufgabe zuweisen',
  title: 'Titel der Aufgabe',
  due: 'Fällig am (Zeitzone dieses Browsers)',
  dueResolved: 'Gewählte Frist: {{local}} · UTC: {{utc}}',
  builder: 'Lektionen und Übungsbausteine',
  source: 'Quelle',
  count: 'Anzahl (Bausteine: 1–10; ganze Lektion: 1)',
  add: 'Quelle hinzufügen',
  remove: 'Quelle entfernen',
  up: 'Nach oben',
  down: 'Nach unten',
  lesson: 'Ganze Aufgabenfolge einer Lektion · {{count}} Fragen',
  exercise: 'Übungsbaustein',
  notesBlock: 'Notennamen lesen',
  intervalBlock: 'Intervallnummern lesen',
  hearingBlock: 'Intervalle hören',
  selection: '{{count}} ausgewählte Fragen · höchstens 40',
  draftPolicy:
    'Alle Quellen bleiben Entwurf. Auswahl, Aufgaben und Frist werden beim Zuweisen eingefroren. Empfänger sind die jetzt eingeschriebenen Lernkonten. Je Lernkonto ist ein Durchgang vorgesehen.',
  empty: 'Noch keine zugewiesenen Aufgaben.',
  open: 'Aufgabe öffnen',
  report: 'Auswertung öffnen',
  share: 'Klassenlink',
  shareNote:
    'Dieser lokale Link öffnet die Aufgabe nur für berechtigte Testkonten. Er lädt niemanden in eine Klasse ein. Nur innerhalb derselben laufenden Vorschau nutzbar.',
  dueLabel: 'Fälligkeit: {{date}}',
  start: 'Bearbeitung starten',
  resume: 'Bearbeitung fortsetzen',
  answer: 'Antwort speichern',
  submit: 'Jetzt abgeben',
  submitConfirm:
    'Jetzt abgeben? Unbeantwortete Fragen zählen im Ergebnis mit null richtigen Antworten. Eine neue Bearbeitung ist danach nicht möglich.',
  progress: 'Frage {{index}} von {{total}}',
  result: 'Dein Aufgabenergebnis',
  score: '{{correct}} von {{total}} richtig',
  answered: '{{answered}} von {{total}} beantwortet',
  theory: 'Notenbild',
  aural: 'Gehörbildung',
  completed: 'Alle Fragen beantwortet',
  submitted: 'Vorzeitig abgegeben',
  deadline: 'Frist abgelaufen',
  closed: 'Von der Lehrkraft beendet',
  ready: 'Noch nicht begonnen',
  expired: 'Die Frist ist abgelaufen. Es kann kein neuer Durchgang gestartet werden.',
  play: 'Klang abspielen',
  stop: 'Klang stoppen',
  audioError:
    'Audio ist nicht verfügbar. Prüfe die Tonausgabe; du kannst die Aufgabe später fortsetzen.',
  noScore:
    'Keine abgegebenen, freigegebenen Ergebnisse. Fehlende Ergebnisse werden nicht als null Punkte gezählt.',
  private: 'Lernstand nicht freigegeben',
  notSubmitted: 'Noch kein abgegebenes Ergebnis',
  coverage:
    '{{submitted}} abgegebene Ergebnisse · {{shared}} von {{recipients}} Empfängern mit Freigabe',
  privacy:
    'Dein Ergebnis ist für Lehrkräfte nur mit der Lernstandfreigabe dieser Klasse sichtbar. In der Übersicht kannst du die Freigabe erteilen oder widerrufen.',
  close: 'Aufgabe beenden',
  closeConfirm:
    'Aufgabe für alle Empfänger beenden? Laufende Antworten können danach nicht mehr ergänzt werden.',
  back: 'Zur Aufgabenliste',
  noRecipients: 'Die Klasse hat noch keine Lernkonten. Zuerst Lernkonten aufnehmen.',
  answerConflict:
    'Die Antwort wurde bereits anders gespeichert oder der Aufgabenstand hat sich geändert. Bitte neu laden.',
  materialChanged:
    'Das gespeicherte Aufgabenmaterial stimmt nicht mehr überein. Die Bearbeitung ist gesperrt.',
};
const en: Record<keyof typeof de, string> = {
  assignments: 'Class assignments · draft',
  intro:
    'Work through original draft exercises with synthetic test accounts. Answers are checked automatically; no grades, XP or certificates.',
  create: 'Assign task',
  title: 'Assignment title',
  due: 'Due at (this browser’s time zone)',
  dueResolved: 'Selected deadline: {{local}} · UTC: {{utc}}',
  builder: 'Lessons and exercise blocks',
  source: 'Source',
  count: 'Quantity (blocks: 1–10; whole lesson: 1)',
  add: 'Add source',
  remove: 'Remove source',
  up: 'Move up',
  down: 'Move down',
  lesson: 'Whole lesson exercise sequence · {{count}} questions',
  exercise: 'Exercise block',
  notesBlock: 'Read note names',
  intervalBlock: 'Read interval numbers',
  hearingBlock: 'Hear intervals',
  selection: '{{count}} selected questions · maximum 40',
  draftPolicy:
    'All sources remain drafts. Selection, questions and deadline are frozen on assignment. Recipients are the currently enrolled learner accounts. Each learner has one attempt.',
  empty: 'No assignments yet.',
  open: 'Open assignment',
  report: 'Open results',
  share: 'Class link',
  shareNote:
    'This local link opens the assignment only for authorized test accounts. It does not invite anyone to a class. It works only within the same running preview.',
  dueLabel: 'Due: {{date}}',
  start: 'Start working',
  resume: 'Resume work',
  answer: 'Save answer',
  submit: 'Submit now',
  submitConfirm:
    'Submit now? Unanswered questions count as zero correct answers. A new attempt will not be available afterwards.',
  progress: 'Question {{index}} of {{total}}',
  result: 'Your assignment result',
  score: '{{correct}} of {{total}} correct',
  answered: '{{answered}} of {{total}} answered',
  theory: 'Notation',
  aural: 'Aural skills',
  completed: 'All questions answered',
  submitted: 'Submitted early',
  deadline: 'Deadline reached',
  closed: 'Closed by the teacher',
  ready: 'Not started',
  expired: 'The deadline has passed. A new attempt cannot be started.',
  play: 'Play audio',
  stop: 'Stop audio',
  audioError: 'Audio is unavailable. Check audio output; you can resume the assignment later.',
  noScore: 'No submitted, shared results. Missing results are not counted as zero scores.',
  private: 'Learning data not shared',
  notSubmitted: 'No submitted result yet',
  coverage: '{{submitted}} submitted results · {{shared}} of {{recipients}} recipients sharing',
  privacy:
    'Teachers can see your result only when learning data sharing is enabled for this class. Enable or withdraw sharing in the overview.',
  close: 'Close assignment',
  closeConfirm:
    'Close the assignment for all recipients? Answers in progress cannot be completed afterwards.',
  back: 'Back to assignments',
  noRecipients: 'The class has no learner accounts yet. Enroll learners first.',
  answerConflict: 'A different answer was already saved or the task state changed. Please refresh.',
  materialChanged: 'The saved task material no longer matches. Work on this assignment is blocked.',
};
export const ASSIGNMENT_MESSAGES = {
  de,
  'en-US': en,
  'en-GB': {
    ...en,
    shareNote: en.shareNote.replace('authorized', 'authorised'),
    noRecipients: en.noRecipients.replace('Enroll', 'Enrol'),
  },
};
export type AssignmentTextKey = keyof typeof de;
export function assignmentText(
  locale: AppLocale,
  key: AssignmentTextKey,
  values: Record<string, string | number> = {},
) {
  return ASSIGNMENT_MESSAGES[locale][key].replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    String(values[name] ?? `{{${name}}}`),
  );
}
