import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useDeviceState } from '@/state/device';
import { initializeAccess, refreshAccess } from '@/access/state';
export function AccessLifecycle() {
  const phase = useDeviceState((state) => state.phase),
    storage = useDeviceState((state) => state.storage === 'memory');
  useEffect(() => {
    if (phase !== 'ready') return;
    initializeAccess();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshAccess();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void refreshAccess();
    }, 60000);
    return () => {
      listener.remove();
      clearInterval(timer);
    };
  }, [phase, storage]);
  return null;
}
