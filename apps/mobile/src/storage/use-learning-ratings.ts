import { useMemo } from 'react';
import { catalogue } from '@harmonia/content/catalogue';
import { localLearningRatings } from '@harmonia/content';
import { useLearningState } from '@/state/learning';
import { useAuthState } from '@/auth';

/** Never use another account's snapshot during a delayed login/logout transition. */
export function useLearningRatings() {
  const rows = useLearningState((s) => s.rows);
  const cached = useLearningState((s) => s.ratings);
  const scope = useLearningState((s) => s.scope);
  const owner = useAuthState((s) => s.session?.user.id ?? 'guest');
  return useMemo(() => {
    if (scope !== owner) return { skills: {}, buckets: {} };
    const remaining = cached
      ? rows.filter((row) =>
          row.sequence === null ? row.pending : row.sequence > cached.throughSequence,
        )
      : rows;
    return localLearningRatings(
      catalogue,
      remaining.map((row) => row.event),
      cached ?? undefined,
    );
  }, [rows, cached, scope, owner]);
}
