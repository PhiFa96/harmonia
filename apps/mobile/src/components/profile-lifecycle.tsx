import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useNetworkState } from 'expo-network';
import { useAuthState } from '@/auth';
import { useDeviceState } from '@/state/device';
import { initializeProfile, syncProfile } from '@/state/profile';
export function ProfileLifecycle() {
  const auth = useAuthState(),
    completed = useDeviceState((s) => s.completed),
    network = useNetworkState();
  useEffect(() => {
    if (auth.ready && completed) void initializeProfile();
  }, [auth.ready, auth.session?.user.id, completed]);
  useEffect(() => {
    if (network.isConnected !== false && network.isInternetReachable !== false) void syncProfile();
  }, [network.isConnected, network.isInternetReachable]);
  useEffect(() => {
    const timer = setInterval(() => {
        void syncProfile();
      }, 30000),
      sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') void syncProfile();
      });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);
  return null;
}
