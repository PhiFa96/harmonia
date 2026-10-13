import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { expectedAnswer } from '@harmonia/exercises';
import { newOnboarding, miniSession } from '@/onboarding/model';
import type { DeviceSnapshot } from '@/onboarding/model';
import { useDeviceState } from '@/state/device';
import { useSettings } from '@/state/settings';
import { i18n } from '@/i18n';
import { sendEmailCode, verifyEmailCode, useAuthState } from '@/auth';
import { completedDeviceFixture } from '../jest/device-fixture.ts';
const mockSave = jest.fn<Promise<void>, [DeviceSnapshot]>(() => Promise.resolve());
const mockSession: Session = {
  access_token: 'test-access',
  refresh_token: 'test-refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'learner@example.invalid',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: '2026-10-13T12:00:00Z',
  },
};
jest.mock('@/storage/device', () => ({
  getDeviceRepository: () => Promise.resolve({ load: () => Promise.resolve(null), save: mockSave }),
}));
jest.mock('@/auth', () => ({
  useAuthState: jest
    .requireActual<{ create: typeof create }>('zustand')
    .create(() => ({ ready: true, error: false, session: null })),
  initializeAuth: () => Promise.resolve(),
  getAuthClient: () => ({
    auth: { getUser: () => Promise.resolve({ data: { user: mockSession.user }, error: null }) },
  }),
  validEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  sendEmailCode: jest.fn(() => Promise.resolve()),
  verifyEmailCode: jest.fn(() => Promise.resolve(mockSession)),
  signOutDevice: () => Promise.resolve(),
}));
const mockResume = jest.fn(() => Promise.resolve()),
  mockStop = jest.fn(),
  mockPlay = jest.fn();
jest.mock('@/audio', () => ({
  usePianoStatus: () => 'ready',
  getAudioEngine: () => ({
    context: { currentTime: 10 },
    resume: mockResume,
    playPitch: (pitch: unknown, options: { when: number; duration: number }) => {
      mockPlay(pitch, options);
      return { startTime: options.when, endTime: options.when + options.duration, stop: mockStop };
    },
  }),
}));
beforeEach(() => {
  useDeviceState.setState({
    phase: 'ready',
    completed: false,
    data: newOnboarding(20909),
    storage: 'saved',
    completing: false,
  });
  useSettings.setState({ locale: 'de', appearance: 'system', haptics: true, reduceMotion: false });
  void i18n.changeLanguage('de');
  useAuthState.setState({ ready: true, error: false, session: null });
  mockSave.mockReset().mockResolvedValue(undefined);
  mockResume.mockReset().mockResolvedValue(undefined);
  mockPlay.mockClear();
  mockStop.mockClear();
  jest.mocked(sendEmailCode).mockReset().mockResolvedValue(undefined);
  jest.mocked(verifyEmailCode).mockReset().mockResolvedValue(mockSession);
});
function next() {
  fireEvent.press(screen.getByTestId('setup-next'));
}
function toMini() {
  next();
  fireEvent.press(screen.getByTestId('setup-choice-ensemble'));
  next();
  fireEvent.press(screen.getByTestId('setup-choice-new'));
  next();
  fireEvent.press(screen.getByTestId('setup-choice-requested'));
  next();
  fireEvent.press(screen.getByTestId('setup-choice-30'));
  next();
  next();
}
function solve(wrong = false) {
  const data = useDeviceState.getState().data;
  if (!data) throw new Error('Daten fehlen');
  const item = miniSession(data).items[0];
  if (!item) throw new Error('Aufgabe fehlt');
  const answer = wrong
    ? item.choices.find((v) => v !== expectedAnswer(item))
    : expectedAnswer(item);
  fireEvent.press(screen.getByTestId('answer-' + String(answer)));
  fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
  fireEvent.press(screen.getByTestId('exercise-next'));
}

describe('Onboarding auf echten App-Routen', () => {
  it('schützt den ersten Start und direkte Lektionslinks; führt vor jedem Konto zur Mini-Aufgabe und speichert einen Gaststart', async () => {
    const router = renderRouter('./src/app', { initialUrl: '/lesson?id=notation.l1.staff.lines' });
    await screen.findByText('Musik beginnt mit dir.');
    expect(router.getPathname()).toBe('/onboarding');
    toMini();
    expect(screen.getByText('Deine erste kleine Aufgabe')).toBeTruthy();
    expect(screen.queryByTestId('email-address')).toBeNull();
    expect(mockResume).not.toHaveBeenCalled();
    solve(true);
    expect(screen.getByText('Dein Lernen bleibt deins.')).toBeTruthy();
    expect(screen.getByTestId('setup-next')).toBeDisabled();
    fireEvent.press(screen.getByRole('switch', { name: 'Ich bin mindestens 16 Jahre alt' }));
    next();
    await waitFor(() => {
      expect(useDeviceState.getState().completed).toBe(true);
    });
    expect(mockSave.mock.calls[0]?.[0].onboarding).toMatchObject({
      step: 'complete',
      dailyGoal: 30,
      reminderConsent: false,
      account: 'guest',
    });
    expect(jest.mocked(sendEmailCode)).not.toHaveBeenCalled();
  });
  it('Sprache wechselt sofort, Zurück erhält Angaben und verweigerte Einwilligung setzt keine Erinnerung', () => {
    renderRouter('./src/app', { initialUrl: '/onboarding' });
    fireEvent.press(screen.getByTestId('setup-choice-en-GB'));
    expect(screen.getByText('Music starts with you.')).toBeTruthy();
    next();
    fireEvent.press(screen.getByTestId('setup-choice-hobby'));
    next();
    fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('radio', { name: 'Music as a hobby', checked: true })).toBeTruthy();
    expect(useDeviceState.getState().data?.reminderConsent).toBe(false);
  });
  it('Audio braucht eine ausdrückliche Aktion, spielt dieselben zwei Quelltöne und stoppt beim Weitergehen', async () => {
    renderRouter('./src/app', { initialUrl: '/onboarding' });
    toMini();
    fireEvent.press(screen.getByRole('button', { name: 'Klang starten' }));
    await waitFor(() => {
      expect(mockPlay).toHaveBeenCalledTimes(2);
    });
    expect(mockResume).toHaveBeenCalledTimes(1);
    solve();
    expect(mockStop).toHaveBeenCalled();
  });
  it('Audiofehler lässt die visuelle erste Aufgabe lösbar', async () => {
    mockResume.mockRejectedValueOnce(new Error('blocked'));
    renderRouter('./src/app', { initialUrl: '/onboarding' });
    toMini();
    fireEvent.press(screen.getByRole('button', { name: 'Klang starten' }));
    await screen.findByText(/Der Klang konnte nicht gestartet werden/);
    solve();
    expect(screen.getByText('Dein Lernen bleibt deins.')).toBeTruthy();
  });
  it('ein verspätetes Audio-resume startet nach dem Verlassen keine Töne', async () => {
    let release: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    mockResume.mockReturnValueOnce(pending);
    renderRouter('./src/app', { initialUrl: '/onboarding' });
    toMini();
    fireEvent.press(screen.getByRole('button', { name: 'Klang starten' }));
    fireEvent.press(screen.getByRole('button', { name: 'Zurück' }));
    await act(async () => {
      if (!release) throw new Error('Resume fehlt');
      release();
      await pending;
    });
    expect(mockPlay).not.toHaveBeenCalled();
  });
  it('ein fehlgeschlagener Abschluss bleibt auf der Seite und ist ohne verlorene Antwort wiederholbar', async () => {
    mockSave.mockRejectedValueOnce(new Error('full'));
    renderRouter('./src/app', { initialUrl: '/onboarding' });
    toMini();
    solve();
    fireEvent.press(screen.getByRole('switch', { name: 'Ich bin mindestens 16 Jahre alt' }));
    next();
    await waitFor(() => {
      expect(useDeviceState.getState().storage).toBe('error');
    });
    expect(useDeviceState.getState().completed).toBe(false);
    next();
    await waitFor(() => {
      expect(useDeviceState.getState().completed).toBe(true);
    });
    expect(mockSave).toHaveBeenCalledTimes(2);
  });
  it('E-Mail erst nach Altersbestätigung; falscher Code bleibt korrigierbar, bestätigte ID wird gespeichert', async () => {
    renderRouter('./src/app', { initialUrl: '/onboarding' });
    toMini();
    solve();
    fireEvent.press(screen.getByTestId('setup-choice-email'));
    fireEvent.changeText(screen.getByTestId('email-address'), 'learner@example.invalid');
    expect(screen.getByRole('button', { name: 'Code senden' })).toBeDisabled();
    fireEvent.press(screen.getByRole('switch', { name: 'Ich bin mindestens 16 Jahre alt' }));
    fireEvent.press(screen.getByRole('button', { name: 'Code senden' }));
    await screen.findByTestId('email-code');
    expect(sendEmailCode).toHaveBeenCalledWith('learner@example.invalid', 'de');
    expect(useDeviceState.getState().completed).toBe(false);
    jest.mocked(verifyEmailCode).mockRejectedValueOnce(new Error('wrong'));
    fireEvent.changeText(screen.getByTestId('email-code'), '111111');
    fireEvent.press(screen.getByRole('button', { name: 'Adresse bestätigen' }));
    await screen.findByText(/Der Code ist ungültig/);
    expect(useDeviceState.getState().data?.accountId).toBeNull();
    fireEvent.changeText(screen.getByTestId('email-code'), '123456');
    fireEvent.press(screen.getByRole('button', { name: 'Adresse bestätigen' }));
    await waitFor(() => {
      expect(useDeviceState.getState().data?.accountId).toBe(mockSession.user.id);
    });
    next();
    await waitFor(() => {
      expect(useDeviceState.getState().completed).toBe(true);
    });
  });
  it('bereits eingerichtete Geräte öffnen das Profil und können Erinnerungen widerrufen und Tagesziele ändern', async () => {
    useDeviceState.setState({
      completed: true,
      data: { ...completedDeviceFixture(), reminderConsent: true },
    });
    const router = renderRouter('./src/app', { initialUrl: '/profile' });
    fireEvent.press(screen.getByRole('button', { name: 'Lernziele anpassen' }));
    expect(router.getPathname()).toBe('/preferences');
    fireEvent.press(screen.getByTestId('setup-choice-50'));
    fireEvent.press(screen.getByRole('switch', { name: 'Lern-Erinnerungen vormerken' }));
    expect(useDeviceState.getState().data).toMatchObject({
      dailyGoal: 50,
      reminderConsent: false,
      step: 'complete',
    });
    await act(async () => {
      await Promise.resolve();
    });
  });
  it('ein Ladefehler hat einen ausdrücklichen Sitzungsmodus statt einer stillen erfolgreichen Speicherung', () => {
    useDeviceState.setState({ phase: 'error' });
    renderRouter('./src/app', { initialUrl: '/' });
    fireEvent.press(screen.getByRole('button', { name: 'Nur für diese Sitzung starten' }));
    expect(useDeviceState.getState().storage).toBe('memory');
    expect(screen.getByText(/Nach dem Schließen sind sie nicht gespeichert/)).toBeTruthy();
  });
});
