import { useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import { useNetworkState } from 'expo-network';
import { useAuthState } from '@/auth';
import { useDeviceState } from '@/state/device';
import { useLearningState } from '@/state/learning';
import { useLocale } from '@/i18n';
import {
  initializeMotivation,
  useMotivation,
  syncMotivation,
  changeMotivationPreferences,
  deviceTimeZone,
} from '@/state/motivation';
import {
  initializeReminderHandler,
  reconcileReminders,
  refreshReminderPermission,
} from '@/reminders';
export function MotivationLifecycle() {
  const auth = useAuthState(),
    device = useDeviceState(),
    state = useMotivation(),
    rows = useLearningState((s) => s.rows),
    learningPhase = useLearningState((s) => s.phase),
    learningScope = useLearningState((s) => s.scope),
    locale = useLocale(),
    network = useNetworkState(),
    memory = device.storage === 'memory';
  const evidenceKey = useMemo(
    () => JSON.stringify(rows.map((r) => [r.event.id, r.sequence, r.pending, r.reward])),
    [rows],
  );
  useEffect(() => {
    if (device.phase === 'ready' && auth.ready) void initializeMotivation();
  }, [device.phase, memory, auth.ready, auth.session?.user.id]);
  useEffect(() => {
    const cleanup = initializeReminderHandler();
    void refreshReminderPermission();
    return cleanup;
  }, []);
  useEffect(() => {
    if (state.phase === 'ready' && state.data?.preferences.timeZone !== deviceTimeZone())
      void changeMotivationPreferences({ timeZone: deviceTimeZone() }).catch(() => undefined);
  }, [state.phase, state.data?.preferences.timeZone]);
  useEffect(() => {
    if (state.phase === 'ready' && state.data?.preferences.locale !== locale)
      void changeMotivationPreferences({ locale }).catch(() => undefined);
  }, [locale, state.phase, state.data?.preferences.locale]);
  useEffect(() => {
    if (state.phase === 'ready' && !device.completed && device.data) {
      const p = state.data?.preferences,
        d = device.data;
      if (
        p &&
        (p.dailyGoal !== d.dailyGoal ||
          p.reminderConsent !== d.reminderConsent ||
          p.reminderTime !== d.reminderTime)
      )
        void changeMotivationPreferences({
          dailyGoal: d.dailyGoal,
          reminderConsent: d.reminderConsent,
          reminderTime: d.reminderTime,
        }).catch(() => undefined);
    }
  }, [
    device.completed,
    device.data?.dailyGoal,
    device.data?.reminderConsent,
    device.data?.reminderTime,
    state.phase,
  ]);
  useEffect(() => {
    void reconcileReminders();
  }, [state.phase, state.data, rows, device.completed, state.permission]);
  useEffect(() => {
    if (network.isConnected !== false && network.isInternetReachable !== false)
      void syncMotivation();
  }, [network.isConnected, network.isInternetReachable, evidenceKey, learningPhase, learningScope]);
  useEffect(() => {
    const refresh = () => {
      const timezone = deviceTimeZone(),
        s = useMotivation.getState();
      if (s.phase === 'ready' && s.data?.preferences.timeZone !== timezone)
        void changeMotivationPreferences({ timeZone: timezone }).catch(() => undefined);
      void refreshReminderPermission();
      void syncMotivation();
      void reconcileReminders();
    };
    const subscription = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    const timer = setInterval(refresh, 60000);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, []);
  return null;
}
