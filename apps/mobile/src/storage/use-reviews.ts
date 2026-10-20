import { useMemo } from 'react';
import { catalogue } from '@harmonia/content/catalogue';
import { emptyReviewState, localReviewState } from '@harmonia/content';
import { useLearningState } from '@/state/learning';
import { useAuthState } from '@/auth';

export function useReviews() {
  const rows = useLearningState((s) => s.rows);
  const cache = useLearningState((s) => s.reviews);
  const scope = useLearningState((s) => s.scope);
  const owner = useAuthState((s) => s.session?.user.id ?? 'guest');
  return useMemo(
    () => (scope === owner ? localReviewState(catalogue, rows, cache) : emptyReviewState()),
    [rows, cache, scope, owner],
  );
}
