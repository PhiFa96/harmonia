// Private review reports only; never imported by public app resources.
const de = {
  title: 'Prüfmappe für den Zertifikatsentwurf',
  draft: 'INTERNER ENTWURF · Lösungen enthalten · Keine Prüfungsfreigabe',
  intro:
    'Zwei technische Testprofile für Stufen 1 und 2. Die Beispiele sind reproduzierbare Stichproben aus eigenen Harmonia-Quellen. Sie bilden keine vollständige Abschlussprüfung und ersetzen keine unabhängige Fachprüfung.',
  snapshot: 'Gebundener Prüfungsstand (SHA-256)',
  aiSnapshot: 'Prüfstand der KI-Verordnungsunterlagen',
  blockers: 'Offene Voraussetzungen für ein Produktangebot',
  draftOnly: 'Der Server unterstützt ausschließlich ungültige Muster. Ein Produktmodus fehlt.',
  content: 'Feste Abschlussinhalte und unabhängige Fach- und Quellenprüfung fehlen.',
  rules:
    'Bestehens-, Wiederholungs-, Gültigkeits- und Nachteilsausgleichsregeln sind nicht freigegeben.',
  identity: 'Produktive Kontobindung, Identitäts-/Aufsichtskonzept und Datenschutzabnahme fehlen.',
  payments: 'Kauf, servergeprüfte Zahlungsberechtigung und Erstattungen fehlen.',
  operations:
    'Produktiver Betrieb, öffentliche Codeprüfung und Widerrufsverfahren sind nicht abgenommen.',
  devices: 'Echte Geräte-/Audio- und Barrierefreiheitsabnahmen fehlen.',
  phase4: 'Die formale Phase-4-Freigabe fehlt.',
  ai: 'P4.17: Schriftliche Rechtsprüfung und ihre Maßnahmen sind weiterhin offen.',
  profile: 'Testprofil',
  stage: 'Stufe',
  version: 'Profilversion',
  minutes: 'Minuten',
  points: 'Punkte je Aufgabe',
  threshold: 'Technische Testgrenze (%)',
  policy:
    'Nur Testkonfiguration: Alle Aufgaben müssen beantwortet sein. Keine freigegebene Bestehensregel.',
  coverage: 'Themenabdeckung',
  selected: 'Verwendete Lektionen',
  omitted: 'Einheiten ohne Aufgabe in diesem Profil',
  coverageLimit:
    'Eine verwendete Einheit kann weitere ungeprüfte Fähigkeiten enthalten. Die Liste ist keine Vollständigkeits- oder Qualitätsfreigabe.',
  examples: 'Reproduzierbare Aufgabenstichproben',
  sampleLimit:
    'Drei feste Seeds je Profil. Lösungen wurden mit derselben Engine ermittelt und sind Prüfgegenstand, kein unabhängiges Orakel. Audio wird hier als Notenquelle gezeigt; Hörablauf und Geräte sind gesondert zu prüfen.',
  sample: 'Stichprobe',
  question: 'Aufgabe',
  source: 'Quelllektion',
  area: 'Bereich',
  theory: 'Theorie',
  aural: 'Gehörbildung',
  correct: 'Engine-Lösung',
  files: 'Gebundene Dateien',
  fontLicense: 'Lizenz der eingebetteten Bravura-Notenschrift',
  limits:
    'Diese private Mappe enthält Lösungsschlüssel. Sie wird weder vom Prüfungsserver ausgeliefert noch in die öffentliche App eingebunden. Hashes belegen einen technischen Stand, keine fachliche oder rechtliche Freigabe.',
};
const en: typeof de = {
  title: 'Review pack for the certificate draft',
  draft: 'INTERNAL DRAFT · Contains answers · No exam approval',
  intro:
    'Two technical test profiles for stages 1 and 2. Examples are reproducible samples from original Harmonia sources. They are not complete final exams and do not replace independent specialist review.',
  snapshot: 'Bound exam snapshot (SHA-256)',
  aiSnapshot: 'AI Act documentation snapshot',
  blockers: 'Open requirements before a product offer',
  draftOnly: 'The server supports invalid samples only. No production mode exists.',
  content: 'Fixed final exam content and independent specialist and source review remain open.',
  rules: 'Passing, retake, validity and reasonable adjustment rules are not approved.',
  identity:
    'Production account binding, identity/supervision design and privacy approval remain open.',
  payments: 'Purchases, server-verified payment eligibility and refunds are missing.',
  operations:
    'Production operation, public code verification and revocation procedures are not approved.',
  devices: 'Real device, audio and accessibility acceptance remain open.',
  phase4: 'Formal Phase 4 approval remains open.',
  ai: 'P4.17: Written legal review and its measures remain open.',
  profile: 'Test profile',
  stage: 'Stage',
  version: 'Profile version',
  minutes: 'Minutes',
  points: 'Points per question',
  threshold: 'Technical test threshold (%)',
  policy: 'Test configuration only: Every question must be answered. Not an approved passing rule.',
  coverage: 'Topic coverage',
  selected: 'Lessons used',
  omitted: 'Units without a question in this profile',
  coverageLimit:
    'A unit used may contain further untested skills. This list does not approve completeness or quality.',
  examples: 'Reproducible question samples',
  sampleLimit:
    'Three fixed seeds per profile. Answers come from the same engine and need review; they are not an independent oracle. Audio is shown as a score source here; the listening flow and devices require separate checks.',
  sample: 'Sample',
  question: 'Question',
  source: 'Source lesson',
  area: 'Area',
  theory: 'Theory',
  aural: 'Aural training',
  correct: 'Engine answer',
  files: 'Bound files',
  fontLicense: 'Embedded Bravura music font licence',
  limits:
    'This private pack contains answer keys. It is never served by the exam server or bundled in the public app. Hashes identify a technical snapshot, not specialist or legal approval.',
};
export const CERTIFICATE_REVIEW_MESSAGES = { de, 'en-US': en, 'en-GB': { ...en } };
