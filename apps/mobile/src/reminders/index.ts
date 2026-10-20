import { router } from 'expo-router';
import { leaguePushAllowed, changeLeagueConsent } from '../state/leagues.ts';
import { setPrivacyConsent, privacyPushAllowed, usePrivacy } from '@/privacy/state';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { reminderMessages } from '@harmonia/i18n';
import { reminderTimes, lessonDay } from '@harmonia/content';
import { getMotivationRepository } from '../storage/motivation.ts';
import { useDeviceState, updateOnboarding } from '../state/device.ts';
import {
  useMotivation,
  currentMotivation,
  motivationOwner,
  changeMotivationPreferences,
  syncMotivation,
} from '../state/motivation.ts';
let generation = 0,
  queued: Promise<unknown> = Promise.resolve(),
  applied = '';
const ours = (data: Record<string, unknown> | undefined) => data?.['harmoniaReminder'] === 'true';
export async function refreshReminderPermission() {
  if (Platform.OS === 'web') {
    useMotivation.setState({ permission: 'unsupported' });
    return;
  }
  try {
    const permissions = await Notifications.getPermissionsAsync();
    const permission = permissions.granted
      ? 'granted'
      : permissions.canAskAgain
        ? 'unknown'
        : 'denied';
    const previous = useMotivation.getState();
    if (previous.permission !== permission) useMotivation.setState({ permission });
    if (permission !== 'granted' && previous.pushToken !== null) {
      useMotivation.setState({ pushToken: null });
      void syncMotivation();
    }
  } catch {
    useMotivation.setState({ notificationError: true });
  }
}
export async function optInReminders(category: 'learning' | 'league' = 'learning') {
  const owner = motivationOwner(),
    revision = useMotivation.getState().device?.revision;
  if (Platform.OS === 'web' || useMotivation.getState().memory) return;
  try {
    if (Platform.OS === 'android')
      await Notifications.setNotificationChannelAsync('learning', {
        name: reminderMessages(currentMotivation().preferences.locale).channel,
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    const result = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
    if (owner !== motivationOwner() || revision !== useMotivation.getState().device?.revision)
      return;
    useMotivation.setState({
      permission: result.granted ? 'granted' : 'denied',
      notificationError: false,
    });
    await setPrivacyConsent('push', result.granted);
    if (owner !== motivationOwner() || revision !== useMotivation.getState().device?.revision)
      return;
    if (category === 'league') await changeLeagueConsent(result.granted);
    else {
      updateOnboarding((d) => ({ ...d, reminderConsent: result.granted }));
      await changeMotivationPreferences({ reminderConsent: result.granted });
    }
    void reconcileReminders();
  } catch {
    if (owner === motivationOwner() && revision === useMotivation.getState().device?.revision)
      useMotivation.setState({ notificationError: true });
    if (category === 'league') throw new Error('League notifications unavailable');
  }
}
export function initializeReminderHandler() {
  if (Platform.OS === 'web') return () => undefined;
  Notifications.setNotificationHandler({
    handleNotification: (notification) => {
      const state = useMotivation.getState(),
        view = currentMotivation(),
        data = notification.request.content.data;
      const show =
        ours(data) &&
        data?.['scope'] === motivationOwner() &&
        state.scope === motivationOwner() &&
        state.phase === 'ready' &&
        useDeviceState.getState().completed &&
        privacyPushAllowed() &&
        (data['category'] === 'league'
          ? leaguePushAllowed()
          : view.preferences.reminderConsent && !view.summary.practiced);
      return Promise.resolve({
        shouldShowBanner: show,
        shouldShowList: show,
        shouldPlaySound: show,
        shouldSetBadge: false,
      });
    },
  });
  let pendingResponse: Notifications.NotificationResponse | null = null;
  const tryOpenResult = () => {
    const state = useMotivation.getState();
    if (
      !pendingResponse ||
      state.phase !== 'ready' ||
      state.scope !== motivationOwner() ||
      !useDeviceState.getState().completed
    )
      return;
    const data = pendingResponse.notification.request.content.data;
    pendingResponse = null;
    if (ours(data)) Notifications.clearLastNotificationResponse();
    if (ours(data) && data?.['category'] === 'league' && data['scope'] === motivationOwner())
      router.push('/(tabs)/leagues');
  };
  const openResult = (response: Notifications.NotificationResponse) => {
    pendingResponse = response;
    tryOpenResult();
  };
  const motivationSubscription = useMotivation.subscribe(tryOpenResult);
  const deviceSubscription = useDeviceState.subscribe(tryOpenResult);
  const responses = Notifications.addNotificationResponseReceivedListener(openResult);
  const lastResponse = Notifications.getLastNotificationResponse();
  if (lastResponse) openResult(lastResponse);
  const privacySubscription = usePrivacy.subscribe((next, previous) => {
    if (next.choices.push !== previous.choices.push || next.phase !== previous.phase)
      void reconcileReminders();
  });
  const subscription = Notifications.addPushTokenListener(() => {
    useMotivation.setState({ pushToken: null });
    void reconcileReminders();
  });
  return () => {
    subscription.remove();
    responses.remove();
    motivationSubscription();
    deviceSubscription();
    privacySubscription();
  };
}
/** Keine automatische Berechtigungsanfrage. Reconcile stoppt alte Pläne auch bei Kontowechseln. */
export function reconcileReminders(): Promise<void> {
  const token = ++generation,
    requestedOwner = motivationOwner();
  const work = queued
    .catch(() => undefined)
    .then(async () => {
      if (token !== generation || Platform.OS === 'web') return;
      const state = useMotivation.getState(),
        owner = motivationOwner(),
        now = Date.now();
      if (state.phase !== 'ready' || state.scope !== owner) return;
      const repo = state.memory ? null : await getMotivationRepository(),
        plan = repo ? await repo.reminderPlan() : { lastRemindedAt: 0, entries: [] };
      const fired = plan.entries.filter((e) => e.at <= now),
        lastRemindedAt = Math.max(plan.lastRemindedAt, ...fired.map((e) => e.at));
      if (lastRemindedAt > plan.lastRemindedAt && repo) {
        await repo.saveReminderPlan({
          ...plan,
          lastRemindedAt,
          entries: plan.entries.filter((e) => e.at > now),
        });
        await changeMotivationPreferences({});
      }
      await refreshReminderPermission();
      if (token !== generation || owner !== motivationOwner()) return;
      const view = currentMotivation(),
        ready = useMotivation.getState();
      const eas: unknown = Constants.expoConfig?.extra?.['eas'];
      const projectId: unknown =
        eas && typeof eas === 'object' && 'projectId' in eas ? eas.projectId : null;
      if (
        ready.permission === 'granted' &&
        privacyPushAllowed() &&
        (view.preferences.reminderConsent || leaguePushAllowed()) &&
        ready.data?.server?.pushAvailable &&
        Device.isDevice &&
        typeof projectId === 'string' &&
        ready.pushToken === null
      ) {
        try {
          const result = await Notifications.getExpoPushTokenAsync({ projectId });
          if (token !== generation || owner !== motivationOwner()) return;
          useMotivation.setState({ pushToken: result.data });
          void syncMotivation();
        } catch {
          /* Lokale Zeitplanung bleibt verfügbar. */
        }
      }
      const remote = ready.data?.server?.remoteReminders === true;
      const enabled =
        useDeviceState.getState().completed &&
        !ready.memory &&
        ready.permission === 'granted' &&
        privacyPushAllowed() &&
        view.preferences.reminderConsent &&
        privacyPushAllowed() &&
        !remote;
      const dates = enabled
        ? reminderTimes(now, view.preferences, view.summary.practiced, lastRemindedAt)
        : [];
      const key = JSON.stringify([owner, dates, view.preferences.locale, remote]);
      if (
        key === applied &&
        JSON.stringify(plan.entries.map(({ at, date }) => ({ at, date }))) === JSON.stringify(dates)
      )
        return;
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of scheduled)
        if (ours(notification.content.data))
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      const entries = [];
      try {
        for (const date of dates) {
          if (token !== generation || owner !== motivationOwner()) return;
          const id = await Notifications.scheduleNotificationAsync({
            identifier: `harmonia-reminder.${owner}.${date.date}`,
            content: {
              title: reminderMessages(view.preferences.locale).title,
              body: reminderMessages(view.preferences.locale).body,
              data: { harmoniaReminder: 'true', studyDate: date.date, scope: owner },
              sound: 'default',
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: new Date(date.at),
              ...(Platform.OS === 'android' ? { channelId: 'learning' } : {}),
            },
          });
          if (token !== generation || owner !== motivationOwner()) {
            await Notifications.cancelScheduledNotificationAsync(id);
            for (const entry of entries)
              await Notifications.cancelScheduledNotificationAsync(entry.id);
            return;
          }
          entries.push({ id, at: date.at, date: date.date, owner });
        }
        if (repo) await repo.saveReminderPlan({ lastRemindedAt, entries });
        applied = key;
        if (token === generation && owner === motivationOwner())
          useMotivation.setState({ notificationError: false });
      } catch (e) {
        for (const entry of entries) await Notifications.cancelScheduledNotificationAsync(entry.id);
        if (repo) await repo.saveReminderPlan({ lastRemindedAt, entries: [] });
        throw e;
      }
    })
    .catch(() => {
      if (token === generation && requestedOwner === motivationOwner())
        useMotivation.setState({ notificationError: true });
    });
  queued = work;
  return work;
}
export const reminderDate = () => lessonDay(Date.now(), currentMotivation().preferences.timeZone);
export async function cancelErasedReminders(scope: string) {
  if (Platform.OS === 'web') return;
  for (const item of await Notifications.getAllScheduledNotificationsAsync())
    if (item.content.data?.['harmoniaReminder'] === 'true' && item.content.data['scope'] === scope)
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
}
