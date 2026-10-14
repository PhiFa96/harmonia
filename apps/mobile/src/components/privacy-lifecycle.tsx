import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useDeviceState } from '@/state/device';
import { retainLocalData } from '@/privacy/retention';
import {
  initializePrivacy,
  syncPrivacy,
  usePrivacy,
  recoverPrivacyDeletions,
} from '@/privacy/state';
import { cleanPrivateExports } from '@/privacy/download';
export function PrivacyLifecycle() {
  const phase = useDeviceState((state) => state.phase);
  const owner = usePrivacy((state) => state.owner);
  useEffect(() => {
    if (phase !== 'ready') return;
    try {
      cleanPrivateExports();
    } catch {
      /* Retry on the next foreground event. */
    }
    void initializePrivacy();
    if (useDeviceState.getState().storage !== 'memory')
      void recoverPrivacyDeletions().catch(() => undefined);
    void retainLocalData().catch(() => undefined);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        try {
          cleanPrivateExports();
        } catch {
          /* Retry on the next foreground event. */
        }
        void syncPrivacy();
        if (useDeviceState.getState().storage !== 'memory')
          void recoverPrivacyDeletions().catch(() => undefined);
        void retainLocalData().catch(() => undefined);
      }
    });
    return () => {
      subscription.remove();
    };
  }, [phase, owner]);
  return null;
}
