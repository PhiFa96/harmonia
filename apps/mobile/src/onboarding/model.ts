import type { AppLocale } from '@harmonia/i18n';
import type { ExerciseSession } from '@harmonia/exercises';
import { answerSession, createMiniSession, revealHint } from '@harmonia/exercises';

export const ONBOARDING_STEPS = [
  'language',
  'goal',
  'experience',
  'placement',
  'daily',
  'reminders',
  'mini',
  'account',
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number] | 'complete';
export type LearningGoal = 'hobby' | 'school' | 'exam' | 'ensemble';
export type Experience = 'new' | 'basics' | 'experienced';
export type DailyGoal = 10 | 20 | 30 | 50;
export type ReminderTime = '17:00' | '18:00' | '19:00' | '20:00';
export interface SettingsData {
  readonly noteNaming?: 'auto' | 'de' | 'intl';
  readonly harmonySystem?: 'functions' | 'roman' | 'both';
  readonly sound?: boolean;
  readonly referenceHz?: number;
  readonly locale: AppLocale | null;
  readonly appearance: 'system' | 'light' | 'dark';
  readonly reduceMotion: boolean;
  readonly haptics: boolean;
}
export interface OnboardingData {
  readonly step: OnboardingStep;
  readonly startedAt: number;
  readonly firstTaskAt: number | null;
  readonly completedAt: number | null;
  readonly goal: LearningGoal | null;
  readonly experience: Experience | null;
  readonly placement: 'later' | 'requested' | null;
  readonly dailyGoal: DailyGoal;
  /** Wunsch und Einwilligung, keine Betriebssystem-Berechtigung oder geplante Zustellung. */
  readonly reminderConsent: boolean;
  readonly reminderTime: ReminderTime;
  readonly account: 'guest' | 'email';
  readonly accountId: string | null;
  readonly ageConfirmed: boolean;
  readonly mini: {
    readonly seed: number;
    readonly answer: string | null;
    readonly hintLevel: 0 | 1 | 2 | 3;
    readonly checked: boolean;
    /** Only a completed onboarding may discard its expired or erased raw answer. */
    readonly detailsRemoved?: true;
  };
}
export interface DeviceSnapshot {
  readonly schemaVersion: 1;
  readonly settings: SettingsData;
  readonly onboarding: OnboardingData;
}
export const DEFAULT_SETTINGS: SettingsData = {
  locale: null,
  appearance: 'system',
  reduceMotion: false,
  haptics: true,
};
export function newOnboarding(now: number): OnboardingData {
  if (!Number.isSafeInteger(now) || now < 0) throw new Error('Ungültiger Startzeitpunkt');
  return {
    step: 'language',
    startedAt: now,
    firstTaskAt: null,
    completedAt: null,
    goal: null,
    experience: null,
    placement: null,
    dailyGoal: 20,
    reminderConsent: false,
    reminderTime: '18:00',
    account: 'guest',
    accountId: null,
    ageConfirmed: false,
    mini: { seed: now, answer: null, hintLevel: 0, checked: false },
  };
}
export function miniSession(data: OnboardingData): ExerciseSession {
  if (data.mini.detailsRemoved) throw new Error('Mini-Aufgabendetails gelöscht');
  let session = createMiniSession(data.mini.seed);
  const item = session.items[0];
  if (!item) throw new Error('Mini-Aufgabe fehlt');
  for (let i = 0; i < data.mini.hintLevel; i++) session = revealHint(session);
  if (data.mini.checked) {
    if (!data.mini.answer || !item.choices.includes(data.mini.answer))
      throw new Error('Ungültige Mini-Antwort');
    session = answerSession(session, data.mini.answer);
  }
  return session;
}
export function canContinue(data: OnboardingData): boolean {
  switch (data.step) {
    case 'goal':
      return data.goal !== null;
    case 'experience':
      return data.experience !== null;
    case 'placement':
      return data.placement !== null;
    case 'mini':
      return data.mini.checked;
    case 'account':
      return data.ageConfirmed && (data.account === 'guest' || data.accountId !== null);
    case 'complete':
      return false;
    default:
      return true;
  }
}
export function nextOnboarding(data: OnboardingData, now: number): OnboardingData {
  if (!canContinue(data)) return data;
  const index = ONBOARDING_STEPS.indexOf(data.step as (typeof ONBOARDING_STEPS)[number]);
  const step = ONBOARDING_STEPS[index + 1];
  if (!step) return data;
  return {
    ...data,
    step,
    ...(step === 'mini' && data.firstTaskAt === null
      ? { firstTaskAt: Math.max(now, data.startedAt) }
      : {}),
  };
}
export function previousOnboarding(data: OnboardingData): OnboardingData {
  const index = ONBOARDING_STEPS.indexOf(data.step as (typeof ONBOARDING_STEPS)[number]);
  const step = ONBOARDING_STEPS[index - 1];
  return step ? { ...data, step } : data;
}
export function completeOnboarding(data: OnboardingData, now: number): OnboardingData {
  if (
    data.step !== 'account' ||
    !canContinue(data) ||
    !data.goal ||
    !data.experience ||
    !data.placement ||
    !data.mini.checked ||
    data.firstTaskAt === null ||
    !Number.isSafeInteger(now) ||
    now < 0
  )
    throw new Error('Onboarding ist noch nicht vollständig');
  return { ...data, step: 'complete', completedAt: Math.max(now, data.firstTaskAt) };
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Ungültige lokale Einstellungen');
  return value as Record<string, unknown>;
}
function oneOf<T extends string | number | null>(value: unknown, choices: readonly T[]): T {
  const choice = choices.find((v) => v === value);
  if (choice === undefined) throw new Error('Ungültige lokale Auswahl');
  return choice;
}
function bool(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new Error('Ungültiger lokaler Schalter');
  return value;
}
function timestamp(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    throw new Error('Ungültiger lokaler Zeitpunkt');
  return value;
}
/** Gespeicherte JSON-Daten sind Eingaben: unbekannte Versionen weder überschreiben noch freigeben. */
export function parseDeviceSnapshot(json: string): DeviceSnapshot {
  const root = object(JSON.parse(json) as unknown),
    s = object(root['settings']),
    o = object(root['onboarding']),
    m = object(o['mini']);
  if (root['schemaVersion'] !== 1) throw new Error('Unbekannte lokale Einstellungs-Version');
  const settings: SettingsData = {
    ...(s['noteNaming'] === undefined
      ? {}
      : { noteNaming: oneOf(s['noteNaming'], ['auto', 'de', 'intl']) }),
    ...(s['harmonySystem'] === undefined
      ? {}
      : { harmonySystem: oneOf(s['harmonySystem'], ['functions', 'roman', 'both']) }),
    ...(s['sound'] === undefined ? {} : { sound: bool(s['sound']) }),
    ...(s['referenceHz'] === undefined
      ? {}
      : {
          referenceHz: oneOf(
            s['referenceHz'],
            Array.from({ length: 52 }, (_, i) => 415 + i),
          ),
        }),
    locale: oneOf(s['locale'], [null, 'de', 'en-US', 'en-GB']),
    appearance: oneOf(s['appearance'], ['system', 'light', 'dark']),
    reduceMotion: bool(s['reduceMotion']),
    haptics: bool(s['haptics']),
  };
  const accountId = o['accountId'];
  if (
    accountId !== null &&
    (typeof accountId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountId))
  )
    throw new Error('Ungültige lokale Konto-ID');
  const onboarding: OnboardingData = {
    step: oneOf(o['step'], [...ONBOARDING_STEPS, 'complete']),
    startedAt: timestamp(o['startedAt']),
    firstTaskAt: o['firstTaskAt'] === null ? null : timestamp(o['firstTaskAt']),
    completedAt: o['completedAt'] === null ? null : timestamp(o['completedAt']),
    goal: oneOf(o['goal'], [null, 'hobby', 'school', 'exam', 'ensemble']),
    experience: oneOf(o['experience'], [null, 'new', 'basics', 'experienced']),
    placement: oneOf(o['placement'], [null, 'later', 'requested']),
    dailyGoal: oneOf(o['dailyGoal'], [10, 20, 30, 50]),
    reminderConsent: bool(o['reminderConsent']),
    reminderTime: oneOf(o['reminderTime'], ['17:00', '18:00', '19:00', '20:00']),
    account: oneOf(o['account'], ['guest', 'email']),
    accountId,
    ageConfirmed: bool(o['ageConfirmed']),
    mini: {
      seed: timestamp(m['seed']),
      answer: oneOf(m['answer'], [
        null,
        'interval-direction:up',
        'interval-direction:down',
        'interval-direction:same',
      ]),
      hintLevel: oneOf(m['hintLevel'], [0, 1, 2, 3]),
      checked: bool(m['checked']),
      ...(m['detailsRemoved'] === true ? { detailsRemoved: true as const } : {}),
    },
  };
  if (onboarding.account === 'guest' && onboarding.accountId !== null)
    throw new Error('Gastprofil darf keine Konto-ID tragen');
  if (
    (onboarding.firstTaskAt !== null && onboarding.firstTaskAt < onboarding.startedAt) ||
    (onboarding.completedAt !== null &&
      (onboarding.firstTaskAt === null || onboarding.completedAt < onboarding.firstTaskAt))
  )
    throw new Error('Widersprüchliche lokale Zeitpunkte');
  if (onboarding.mini.detailsRemoved) {
    if (
      onboarding.step !== 'complete' ||
      onboarding.mini.answer !== null ||
      onboarding.mini.seed !== 0 ||
      onboarding.mini.hintLevel !== 0 ||
      onboarding.mini.checked
    )
      throw new Error('Ungültige gekürzte Mini-Aufgabe');
  } else miniSession(onboarding);
  const index = ONBOARDING_STEPS.indexOf(onboarding.step as (typeof ONBOARDING_STEPS)[number]);
  if (
    (index >= 2 && onboarding.goal === null) ||
    (index >= 3 && onboarding.experience === null) ||
    (index >= 4 && onboarding.placement === null) ||
    (index >= 6 && onboarding.firstTaskAt === null) ||
    (index >= 7 && !onboarding.mini.checked)
  )
    throw new Error('Unvollständiger lokaler Ablauf');
  if (onboarding.step === 'complete')
    completeOnboarding(
      {
        ...onboarding,
        step: 'account',
        mini: {
          ...onboarding.mini,
          checked: onboarding.mini.detailsRemoved === true || onboarding.mini.checked,
        },
      },
      onboarding.completedAt ?? -1,
    );
  if ((onboarding.step === 'complete') !== (onboarding.completedAt !== null))
    throw new Error('Ungültiger lokaler Abschluss');
  return { schemaVersion: 1, settings, onboarding };
}
