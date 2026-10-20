import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuthState } from '@/auth';
import { useLearningState } from '@/state/learning';
import { useLeagues, clearLeagues, refreshLeagues } from '@/state/leagues';
import { reconcileReminders } from '@/reminders';
import { syncMotivation } from '@/state/motivation';
export function LeagueLifecycle() {
  const owner = useAuthState((s) => s.session?.user.id ?? null);
  const ready = useAuthState((s) => s.ready);
  const rows = useLearningState((s) => s.rows);
  const consent = useLeagues((s) => s.data?.pushConsent);
  useEffect(() => {
    clearLeagues();
    if (ready && owner) void refreshLeagues();
    return clearLeagues;
  }, [owner, ready]);
  useEffect(() => {
    if (ready && owner) void refreshLeagues();
  }, [rows, owner, ready]);
  useEffect(() => {
    void syncMotivation();
    void reconcileReminders();
  }, [consent]);
  useEffect(() => {
    if (!ready || !owner) return;
    const listener = AppState.addEventListener('change', (s) => {
      if (s === 'active') void refreshLeagues();
    });
    const timer = setInterval(() => {
      void refreshLeagues();
    }, 60000);
    return () => {
      listener.remove();
      clearInterval(timer);
    };
  }, [owner, ready]);
  return null;
}
