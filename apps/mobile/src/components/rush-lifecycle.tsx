import { useEffect } from 'react';
import { useAuthState } from '@/auth';
import { clearRush, refreshRush } from '@/state/rush';
export function RushLifecycle() {
  const owner = useAuthState((s) => s.session?.user.id ?? null);
  const ready = useAuthState((s) => s.ready);
  useEffect(() => {
    clearRush();
    if (owner && ready) void refreshRush();
    return clearRush;
  }, [owner, ready]);
  return null;
}
