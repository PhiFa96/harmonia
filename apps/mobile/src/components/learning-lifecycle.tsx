import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useNetworkState } from 'expo-network';
import { useAuthState } from '@/auth';
import { useDeviceState } from '@/state/device';
import { initializeLearning, syncLearning } from '@/state/learning';

export function LearningLifecycle() {
  const completed = useDeviceState((s) => s.completed),
    auth = useAuthState(),
    network = useNetworkState();
  useEffect(() => {
    if (completed && auth.ready) void initializeLearning();
  }, [completed, auth.ready, auth.session?.user.id]);
  useEffect(() => {
    if (completed && network.isConnected !== false && network.isInternetReachable !== false)
      void syncLearning();
  }, [completed, network.isConnected, network.isInternetReachable]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncLearning();
    });
    const timer = setInterval(() => {
      void syncLearning();
    }, 30000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, []);
  return null;
}
