import { useEffect } from 'react';
import { useAuthState } from '@/auth';
import { clearDailyPuzzle } from '@/state/daily-puzzle';
export function DailyPuzzleLifecycle() {
  const owner = useAuthState((s) => s.session?.user.id ?? null);
  useEffect(() => {
    clearDailyPuzzle();
    return clearDailyPuzzle;
  }, [owner]);
  return null;
}
