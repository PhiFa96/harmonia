import { useEffect } from 'react';
import { AppState } from 'react-native';
import { trackAnalytics } from '@/analytics/track';
import { usePrivacy } from '@/privacy/state';
export function AnalyticsLifecycle() {
  const state = usePrivacy();
  useEffect(() => {
    trackAnalytics({ name: 'app_active' });
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') trackAnalytics({ name: 'app_active' });
    });
    return () => {
      subscription.remove();
    };
  }, [
    state.owner,
    state.choices.analytics,
    state.policy,
    state.phase,
    state.pending,
    state.analyticsConsentId,
  ]);
  return null;
}
