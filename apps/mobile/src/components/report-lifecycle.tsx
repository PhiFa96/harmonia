import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useNetworkState } from 'expo-network';
import { useAuthState } from '@/auth';
import { useDeviceState } from '@/state/device';
import { initializeReports, syncReports } from '@/state/reports';
export function ReportLifecycle() {
  const device = useDeviceState(),
    auth = useAuthState(),
    network = useNetworkState();
  useEffect(() => {
    if (device.phase === 'ready' && auth.ready) void initializeReports();
  }, [device.phase, device.storage, auth.ready, auth.session?.user.id]);
  useEffect(() => {
    if (network.isConnected !== false && network.isInternetReachable !== false) void syncReports();
  }, [network.isConnected, network.isInternetReachable]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void syncReports();
    });
    const timer = setInterval(() => {
      void syncReports();
    }, 30000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, []);
  return null;
}
