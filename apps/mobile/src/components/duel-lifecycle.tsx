import { useEffect } from 'react';
import { useAuthState } from '@/auth';
import { clearDuel } from '@/state/duel';
export function DuelLifecycle() {
  const owner = useAuthState((s) => s.session?.user.id ?? null);
  useEffect(() => {
    clearDuel();
    return clearDuel;
  }, [owner]);
  return null;
}
