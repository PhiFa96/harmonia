import { useEffect } from 'react';
import { AppState } from 'react-native';
import { initializeBilling, refreshBilling } from '@/billing/state';
export function BillingLifecycle() {
  useEffect(() => {
    initializeBilling();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshBilling();
    });
    return () => {
      listener.remove();
    };
  }, []);
  return null;
}
