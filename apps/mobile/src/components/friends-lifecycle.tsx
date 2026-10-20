import { useEffect } from 'react';
import { useAuthState } from '@/auth';
import { clearFriends } from '@/state/friends';
export function FriendsLifecycle() {
  const owner = useAuthState((s) => s.session?.user.id ?? null);
  useEffect(() => {
    clearFriends();
    return clearFriends;
  }, [owner]);
  return null;
}
