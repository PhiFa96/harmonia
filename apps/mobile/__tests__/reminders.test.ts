import { waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { ReminderPlan } from '@harmonia/content';
import { useMotivation } from '@/state/motivation';
import { useDeviceState } from '@/state/device';
import { useAuthState } from '@/auth';
import { usePrivacy, initializePrivacy } from '@/privacy/state';
import type { Session } from '@supabase/supabase-js';
import type * as ReminderModule from '@/reminders';
import { motivationFixture, motivationResponse } from '../jest/motivation-fixture';
let mockPlan: ReminderPlan = { lastRemindedAt: 0, entries: [] };
jest.mock('@/storage/motivation', () => ({
  getMotivationRepository: () =>
    Promise.resolve({
      save: () => Promise.resolve(),
      reminderPlan: () => Promise.resolve(mockPlan),
      saveReminderPlan: (plan: ReminderPlan) => {
        mockPlan = plan;
        return Promise.resolve();
      },
    }),
}));
const reminders = jest.requireActual<typeof ReminderModule>('@/reminders');
let mockPhysical = false;
jest.mock('expo-device', () => ({
  get isDevice() {
    return mockPhysical;
  },
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    ...jest.requireActual<{ default: object }>('expo-constants').default,
    expoConfig: { extra: { eas: { projectId: '00000000-0000-4000-8000-000000000077' } } },
  },
}));
const originalOS = Platform.OS;
beforeEach(async () => {
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-14T10:00:00Z'));
  jest.clearAllMocks();
  mockPhysical = false;
  mockPlan = { lastRemindedAt: 0, entries: [] };
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({
    granted: true,
    canAskAgain: true,
    expires: 'never',
    status: Notifications.PermissionStatus.GRANTED,
  });
  jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({
    granted: true,
    canAskAgain: true,
    expires: 'never',
    status: Notifications.PermissionStatus.GRANTED,
  });
  jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([]);
  let n = 0;
  jest
    .mocked(Notifications.scheduleNotificationAsync)
    .mockImplementation(() => Promise.resolve(`planned-${String(++n)}`));
  const data = motivationFixture();
  data.preferences.reminderConsent = true;
  useMotivation.setState({
    data,
    scope: 'guest',
    phase: 'ready',
    permission: 'granted',
    notificationError: false,
    pushToken: null,
  });
  useAuthState.setState({ session: null });
  useDeviceState.setState({ completed: true, storage: 'saved' });
  await initializePrivacy();
  usePrivacy.setState({
    owner: 'guest',
    phase: 'ready',
    choices: { analytics: false, marketing: false, push: true },
  });
});
afterEach(() => {
  jest.restoreAllMocks();
  Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
});
it('plant sieben einmalige Ortszeiten ohne automatische Berechtigungsanfrage und löscht nur eigene Pläne', async () => {
  jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([
    { identifier: 'old', content: { data: { harmoniaReminder: 'true' } } },
    { identifier: 'other', content: { data: {} } },
  ] as unknown as Notifications.NotificationRequest[]);
  await reminders.reconcileReminders();
  expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('old');
  expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalledWith('other');
  expect(mockPlan.entries).toHaveLength(7);
  expect(mockPlan.entries[0]?.at).toBe(Date.parse('2026-10-14T16:00:00Z'));
  const requested = jest.mocked(Notifications.scheduleNotificationAsync).mock.calls[0]?.[0];
  expect(requested?.trigger).toMatchObject({ type: 'date' });
  expect(requested?.content.data).toMatchObject({ scope: 'guest' });
});
it('überspringt heute nach einer Übung und entfernt Pläne bei Widerruf oder gesperrter Systemberechtigung', async () => {
  useMotivation.setState((s) => ({ data: s.data ? { ...s.data, practicedAt: Date.now() } : null }));
  await reminders.reconcileReminders();
  expect(mockPlan.entries[0]?.date).toBe('2026-10-15');
  useMotivation.setState((s) => ({
    data: s.data
      ? { ...s.data, preferences: { ...s.data.preferences, reminderConsent: false } }
      : null,
  }));
  await reminders.reconcileReminders();
  expect(mockPlan.entries).toEqual([]);
  useMotivation.setState({
    data: {
      ...motivationFixture(),
      preferences: { ...motivationFixture().preferences, reminderConsent: true },
    },
  });
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({
    granted: false,
    canAskAgain: false,
    expires: 'never',
    status: Notifications.PermissionStatus.DENIED,
  });
  await reminders.reconcileReminders();
  expect(mockPlan.entries).toEqual([]);
  expect(useMotivation.getState().permission).toBe('denied');
});
it('fragt nur nach ausdrücklichem Opt-in und behandelt eine Systemablehnung als ausgeschaltet', async () => {
  jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({
    granted: false,
    canAskAgain: false,
    expires: 'never',
    status: Notifications.PermissionStatus.DENIED,
  });
  await reminders.optInReminders();
  expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  expect(useMotivation.getState().data?.preferences.reminderConsent).toBe(false);
  expect(useDeviceState.getState().data?.reminderConsent).toBe(false);
});
it('wendet eine verspätete Berechtigungsantwort nicht auf ein anderes Konto an', async () => {
  let release: (p: Notifications.NotificationPermissionsStatus) => void = () => {
    throw new Error('Request fehlt');
  };
  jest.mocked(Notifications.requestPermissionsAsync).mockImplementation(
    () =>
      new Promise((done) => {
        release = done;
      }),
  );
  const promise = reminders.optInReminders();
  useAuthState.setState({ session: { user: { id: 'b' } } as Session });
  useMotivation.setState({ scope: 'b', data: motivationFixture() });
  release({
    granted: true,
    canAskAgain: true,
    expires: 'never',
    status: Notifications.PermissionStatus.GRANTED,
  });
  await promise;
  expect(useMotivation.getState().data?.preferences.reminderConsent).toBe(false);
});
it('unterdrückt lokale Zustellung bei aktiver Konto-Push-Bindung und arbeitet im Web ohne native Aufrufe', async () => {
  const data = motivationFixture();
  data.preferences.reminderConsent = true;
  data.server = { ...motivationResponse(), remoteReminders: true };
  useMotivation.setState({ data });
  await reminders.reconcileReminders();
  expect(mockPlan.entries).toEqual([]);
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
  jest.clearAllMocks();
  await reminders.refreshReminderPermission();
  await reminders.optInReminders();
  await reminders.reconcileReminders();
  expect(useMotivation.getState().permission).toBe('unsupported');
  expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
});
it('räumt eine teilweise fehlgeschlagene Planung auf und zeigt den Fehler', async () => {
  const data = motivationFixture();
  data.preferences.reminderConsent = true;
  data.preferences.reminderTime = '19:00';
  useMotivation.setState({ data });
  jest
    .mocked(Notifications.scheduleNotificationAsync)
    .mockResolvedValueOnce('partial')
    .mockRejectedValueOnce(new Error('OS'));
  await reminders.reconcileReminders();
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('partial');
  expect(mockPlan.entries).toEqual([]);
  expect(useMotivation.getState().notificationError).toBe(true);
});
it('speichert bereits fällige Pläne und verhindert eine zweite Erinnerung nach Zeitzonenwechsel', async () => {
  const data = motivationFixture();
  data.preferences.reminderConsent = true;
  data.preferences.timeZone = 'America/Los_Angeles';
  data.preferences.reminderTime = '17:00';
  useMotivation.setState({ data });
  mockPlan = {
    lastRemindedAt: 0,
    entries: [{ id: 'fired', at: Date.now() - 3600000, date: '2026-10-14', owner: 'guest' }],
  };
  await reminders.reconcileReminders();
  expect(mockPlan.lastRemindedAt).toBe(Date.now() - 3600000);
  expect(mockPlan.entries[0]?.date).toBe('2026-10-15');
});
it('zeigt fremde Kontonachrichten und Nachrichten nach heutigem Üben nicht im Vordergrund an', async () => {
  const dispose = reminders.initializeReminderHandler();
  const handler = jest.mocked(Notifications.setNotificationHandler).mock.calls.at(-1)?.[0];
  expect(handler).toBeTruthy();
  if (!handler) throw new Error('Handler fehlt');
  const note = (scope: string) =>
    ({
      request: { content: { data: { harmoniaReminder: 'true', scope } } },
    }) as unknown as Notifications.Notification;
  expect(await handler.handleNotification(note('guest'))).toMatchObject({
    shouldShowBanner: true,
    shouldSetBadge: false,
  });
  expect(await handler.handleNotification(note('other'))).toMatchObject({
    shouldShowBanner: false,
  });
  useMotivation.setState((s) => ({ data: s.data ? { ...s.data, practicedAt: Date.now() } : null }));
  expect(await handler.handleNotification(note('guest'))).toMatchObject({
    shouldShowBanner: false,
  });
  dispose();
});

it('registriert Expo-Tokens erst bei aktivem Server und verfolgt eine native Token-Rotation', async () => {
  mockPhysical = true;
  const data = motivationFixture();
  data.preferences.reminderConsent = true;
  data.server = { ...motivationResponse(), pushAvailable: true };
  useMotivation.setState({ data });
  jest
    .mocked(Notifications.getExpoPushTokenAsync)
    .mockResolvedValue({ type: 'expo', data: 'ExpoPushToken[first]' });
  await reminders.reconcileReminders();
  expect(useMotivation.getState().pushToken).toBe('ExpoPushToken[first]');
  expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  const dispose = reminders.initializeReminderHandler(),
    callback = jest.mocked(Notifications.addPushTokenListener).mock.calls.at(-1)?.[0];
  if (!callback) throw new Error('Listener fehlt');
  jest
    .mocked(Notifications.getExpoPushTokenAsync)
    .mockResolvedValue({ type: 'expo', data: 'ExpoPushToken[rotated]' });
  callback({ type: 'ios', data: 'native-rotated' });
  await waitFor(() => {
    expect(useMotivation.getState().pushToken).toBe('ExpoPushToken[rotated]');
  });
  await reminders.reconcileReminders();
  dispose();
});
it('zieht eine Push-Bindung zurück, wenn die Systemberechtigung später entzogen wird', async () => {
  useMotivation.setState({ pushToken: 'ExpoPushToken[old]' });
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({
    granted: false,
    canAskAgain: false,
    expires: 'never',
    status: Notifications.PermissionStatus.DENIED,
  });
  await reminders.refreshReminderPermission();
  expect(useMotivation.getState().pushToken).toBeNull();
});
it('entfernt einen verspätet angelegten lokalen Plan nach Kontowechsel', async () => {
  let release: (id: string) => void = () => {
    throw new Error('Plan fehlt');
  };
  const entered = new Promise<void>((resolve) => {
    jest.mocked(Notifications.scheduleNotificationAsync).mockImplementationOnce(() => {
      resolve();
      return new Promise((done) => {
        release = done;
      });
    });
  });
  const pending = reminders.reconcileReminders();
  await entered;
  useAuthState.setState({ session: { user: { id: 'other' } } as Session });
  useMotivation.setState({ scope: 'other', data: motivationFixture() });
  const next = reminders.reconcileReminders();
  release('late');
  await pending;
  await next;
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('late');
  expect(mockPlan.entries).toEqual([]);
});
it('cancels only notifications belonging to the explicitly erased account', async () => {
  jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([
    {
      identifier: 'erase-own',
      content: { data: { harmoniaReminder: 'true', scope: 'erase-notification-a' } },
    },
    {
      identifier: 'keep-other',
      content: { data: { harmoniaReminder: 'true', scope: 'erase-notification-b' } },
    },
  ] as unknown as Notifications.NotificationRequest[]);
  await reminders.cancelErasedReminders('erase-notification-a');
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('erase-own');
  expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalledWith('keep-other');
});
