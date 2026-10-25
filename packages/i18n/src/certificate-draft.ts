// Imported only by the local P4.18 tool, never by the public app resource tree.
import i18next from 'i18next';
import type { ParseKeys } from 'i18next';
import type { AppLocale } from './locale.ts';

const de = {
  title: 'Zertifikats-Werkstatt',
  draft: 'INTERNER ENTWURF · Kein gültiger Qualifikationsnachweis',
  intro:
    'Erprobe Prüfungsablauf, Auswertung und Musterzertifikat mit eigenen Harmonia-Aufgaben. Verwende nur Testdaten. Fachliche und rechtliche Freigaben stehen aus.',
  policy:
    'Technisches Testprofil: 12 Aufgaben, 20 Minuten, 5 Punkte je richtiger Antwort. Ein Muster entsteht ab 80 % und nur, wenn alle Aufgaben beantwortet sind. Diese Testgrenze ist keine freigegebene Bestehensregel.',
  privacy:
    'Die Durchgänge bleiben auf diesem lokalen Server und werden nach sieben Tagen beim nächsten Zugriff entfernt. Keine Namen, Zahlungen, XP oder öffentlichen Zertifikate. Ein Browser-Cookie ermöglicht die Wiederaufnahme.',
  language: 'Sprache',
  profile: 'Stufe {{stage}} · Testprofil v{{version}}',
  start: 'Testprüfung starten',
  history: 'Meine lokalen Durchgänge',
  resume: 'Durchgang öffnen',
  home: 'Zur Übersicht',
  progress: 'Aufgabe {{current}} von {{total}}',
  remaining: 'Verbleibende Zeit: {{time}}',
  noHints:
    'Während der Testprüfung gibt es keine Lösungshinweise oder Sofortwertung. Die Frist läuft auch beim Verlassen dieser Seite weiter.',
  answers: 'Antwortmöglichkeiten',
  answer: 'Antwort abgeben',
  submit: 'Vorzeitig abgeben',
  confirm:
    'Jetzt beenden? Offene Aufgaben erhalten null Punkte. Es entsteht kein Musterzertifikat.',
  yes: 'Durchgang beenden',
  cancel: 'Weiter bearbeiten',
  play: 'Klangbeispiel abspielen',
  stop: 'Wiedergabe stoppen',
  audioError:
    'Die Wiedergabe ist nicht verfügbar. Prüfe den Ton oder gib den Durchgang vorzeitig ab.',
  notation: 'Notenbeispiel',
  description: 'Textbeschreibung des Notenbilds',
  theory: 'Theorie',
  aural: 'Gehörbildung',
  result: 'Servergeprüfte Testauswertung',
  points: '{{points}} von {{maximum}} Punkten',
  qualified:
    'Die technische Testgrenze ist erreicht. Ein ausdrücklich ungültiges Musterzertifikat ist verfügbar.',
  notQualified: 'Kein Musterzertifikat: Testgrenze nicht erreicht oder Aufgaben offen.',
  completed: 'Alle Aufgaben wurden abgegeben.',
  submitted: 'Der Durchgang wurde vorzeitig abgegeben.',
  timeout: 'Die Serverfrist ist abgelaufen. Spätere Antworten zählen nicht.',
  download: 'Muster-PDF herunterladen',
  revoke: 'Muster-Prüfcode widerrufen',
  revoked: 'Dieser Muster-Prüfcode wurde widerrufen.',
  verifyTitle: 'Internen Muster-Prüfcode prüfen',
  code: 'Muster-Prüfcode',
  verify: 'Code prüfen',
  verified: 'Muster gefunden · Stufe {{stage}} · Kein gültiger Qualifikationsnachweis',
  notFound: 'Kein Muster zu diesem Code gefunden.',
  erase: 'Meine lokalen Testdaten löschen',
  eraseConfirm: 'Alle eigenen Durchgänge und Prüfcodes auf diesem Server dauerhaft löschen?',
  erased: 'Die lokalen Testdaten wurden gelöscht.',
  busy: 'Wird verarbeitet …',
  error:
    'Die Anfrage ist fehlgeschlagen. Deine bereits gespeicherten Antworten bleiben erhalten. Versuche es erneut.',
  invalid: 'Die Eingabe ist ungültig.',
  conflict: 'Der Durchgang wurde bereits verändert. Öffne ihn erneut, um den Serverstand zu laden.',
  outdated:
    'Dieser aktive Durchgang passt nicht mehr zum aktuellen Inhaltsstand. Lösche die lokalen Testdaten und beginne neu.',
  limit: 'Das lokale Testlimit ist erreicht. Lösche alte Testdaten, bevor du neu beginnst.',
  pdfTitle: 'HARMONIA · MUSTERZERTIFIKAT',
  pdfWarning: 'ENTWURF / UNGÜLTIG',
  pdfSubject: 'Synthetischer Testdurchgang – keine Identitätsprüfung',
  pdfStage: 'Testprofil Stufe {{stage}}',
  pdfDate: 'Erstellt (UTC): {{date}}',
  pdfVersion: 'Profilversion {{profile}} · Inhaltsversion {{content}}',
  pdfNotice: 'Nur technische Vorarbeit vor der formalen Phase-4-Freigabe.',
  pdfLegal: 'Kein Abschluss, keine Akkreditierung und keine fachliche Freigabe.',
  pdfCheck: 'Code nur in der lokalen Zertifikats-Werkstatt prüfen.',
  pdfRevocation: 'Der dortige Status ist maßgeblich; dieses PDF kann widerrufen sein.',
  pdfExpiry: 'Lokale Testdaten und Codes werden nach sieben Tagen entfernt.',
};
const en: typeof de = {
  title: 'Certificate workshop',
  draft: 'INTERNAL DRAFT · Not a valid qualification',
  intro:
    'Try the exam flow, assessment and sample certificate using original Harmonia tasks. Use test data only. Specialist and legal approvals remain open.',
  policy:
    'Technical test profile: 12 questions, 20 minutes, 5 points per correct answer. A sample requires 80% and answers to every question. This test threshold is not an approved passing rule.',
  privacy:
    'Attempts stay on this local server and are removed on the next access after seven days. No names, payments, XP or public certificates. A browser cookie allows you to resume.',
  language: 'Language',
  profile: 'Stage {{stage}} · Test profile v{{version}}',
  start: 'Start test exam',
  history: 'My local attempts',
  resume: 'Open attempt',
  home: 'Back to overview',
  progress: 'Question {{current}} of {{total}}',
  remaining: 'Time remaining: {{time}}',
  noHints:
    'There are no solution hints or instant grades during the test exam. The deadline keeps running when you leave this page.',
  answers: 'Answer choices',
  answer: 'Submit answer',
  submit: 'Submit early',
  confirm:
    'Finish now? Unanswered questions receive zero points. No sample certificate will be created.',
  yes: 'Finish attempt',
  cancel: 'Continue exam',
  play: 'Play audio example',
  stop: 'Stop playback',
  audioError: 'Audio is unavailable. Check your sound or submit the attempt early.',
  notation: 'Score example',
  description: 'Text description of the score',
  theory: 'Theory',
  aural: 'Aural skills',
  result: 'Server-checked test result',
  points: '{{points}} of {{maximum}} points',
  qualified:
    'The technical test threshold was reached. An explicitly invalid sample certificate is available.',
  notQualified: 'No sample certificate: test threshold not reached or questions left unanswered.',
  completed: 'All questions were submitted.',
  submitted: 'The attempt was submitted early.',
  timeout: 'The server deadline has expired. Later answers do not count.',
  download: 'Download sample PDF',
  revoke: 'Revoke sample verification code',
  revoked: 'This sample verification code has been revoked.',
  verifyTitle: 'Check an internal sample code',
  code: 'Sample verification code',
  verify: 'Check code',
  verified: 'Sample found · Stage {{stage}} · Not a valid qualification',
  notFound: 'No sample found for this code.',
  erase: 'Delete my local test data',
  eraseConfirm: 'Permanently delete all your attempts and verification codes on this server?',
  erased: 'Local test data deleted.',
  busy: 'Working …',
  error: 'The request failed. Previously saved answers are retained. Please try again.',
  invalid: 'Invalid input.',
  conflict: 'This attempt has already changed. Reopen it to load the server state.',
  outdated:
    'This active attempt no longer matches the content version. Delete your local test data and start again.',
  limit: 'The local test limit has been reached. Delete old test data before starting again.',
  pdfTitle: 'HARMONIA · SAMPLE CERTIFICATE',
  pdfWarning: 'DRAFT / INVALID',
  pdfSubject: 'Synthetic test attempt – no identity verification',
  pdfStage: 'Stage {{stage}} test profile',
  pdfDate: 'Created (UTC): {{date}}',
  pdfVersion: 'Profile version {{profile}} · Content version {{content}}',
  pdfNotice: 'Technical preparation before formal Phase 4 approval only.',
  pdfLegal: 'No qualification, accreditation or specialist approval.',
  pdfCheck: 'Check the code only in the local certificate workshop.',
  pdfRevocation: 'The current status there applies; this PDF may have been revoked.',
  pdfExpiry: 'Local test data and codes are removed after seven days.',
};
export const CERTIFICATE_DRAFT_MESSAGES = { de, 'en-US': en, 'en-GB': { ...en } };
export type CertificateTextKey = keyof typeof de;
export function certificateTranslator(locale: AppLocale) {
  const instance = i18next.createInstance();
  void instance.init({
    lng: locale,
    fallbackLng: false,
    initAsync: false,
    resources: { [locale]: { translation: CERTIFICATE_DRAFT_MESSAGES[locale] } },
    interpolation: { escapeValue: false },
  });
  return (key: CertificateTextKey, values: Record<string, string | number> = {}) =>
    instance.t<ParseKeys, typeof values, string>(key as unknown as ParseKeys, values);
}
