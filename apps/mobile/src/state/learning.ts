import { assertPrivacyWrite } from '@/privacy/guard';
import { create } from 'zustand';
import { catalogue } from '@harmonia/content/catalogue';
import {
  EvidenceError,
  learningPath,
  learningSyncResponseSchema,
  legacyLessonEvent,
  lessonEvent,
  validateLearningEvent,
  learnerRatingCacheSchema,
  reviewCacheSchema,
  localReviewState,
  lessonExerciseSources,
} from '@harmonia/content';
import type {
  LearningEvent,
  LessonProgress,
  PathUnit,
  LessonDraft,
  LearnerRatingCache,
  ReviewCache,
} from '@harmonia/content';
import type { LessonAttempt } from '../storage/lesson-repository.ts';
import type { StoredLearningEvent } from '../storage/learning-repository.ts';
import { GUEST_SCOPE } from '../storage/learning-repository.ts';
import { getLearningRepository } from '../storage/learning.ts';
import { getLessonRepository } from '../storage/lessons.ts';
import { useDeviceState } from './device.ts';
import { getAuthClient, useAuthState } from '../auth/index.ts';
import {
  usePlacementState,
  initializePlacement,
  configurePlacementStorage,
  flushPlacementWrites,
} from './placement.ts';
import { EMPTY_PLACEMENT } from '../placement/model.ts';
import { ratingBucket } from '@harmonia/exercises';

const ratingBuckets = [
  ...new Set(
    catalogue.lessons.flatMap((lesson) =>
      (lessonExerciseSources(catalogue, lesson.id) ?? []).map((source) =>
        ratingBucket(source.spec, source.contentVersion),
      ),
    ),
  ),
];

interface LearningState {
  readonly reviews: ReviewCache | null;
  readonly ratings: LearnerRatingCache | null;
  readonly drafts: Readonly<Record<string, LessonDraft>>;
  readonly phase: 'loading' | 'ready' | 'error';
  readonly scope: string;
  readonly path: readonly PathUnit[];
  readonly rows: readonly StoredLearningEvent[];
  readonly outdated: number;
  readonly memory: boolean;
  readonly sync: 'guest' | 'idle' | 'syncing' | 'error';
  readonly areaId: string | null;
  readonly level: 1 | 2 | null;
  readonly expanded: readonly string[];
}
export const useLearningState = create<LearningState>()(() => ({
  reviews: null,
  ratings: null,
  drafts: {},
  phase: 'loading',
  scope: GUEST_SCOPE,
  path: [],
  rows: [],
  outdated: 0,
  memory: false,
  sync: 'guest',
  areaId: null,
  level: null,
  expanded: [],
}));
let generation = 0,
  subscribed = false,
  queue: Promise<unknown> = Promise.resolve(),
  syncing: Promise<void> | undefined;
function scope() {
  return useAuthState.getState().session?.user.id ?? GUEST_SCOPE;
}
function derive(rows: readonly StoredLearningEvent[]) {
  const progress: LessonProgress[] = [];
  let outdated = 0;
  const placements: { row: StoredLearningEvent; tested: readonly string[] }[] = [];
  for (const row of rows) {
    try {
      const validated = validateLearningEvent(catalogue, row.event);
      if (validated.lesson) progress.push(validated.lesson);
      else if (
        row.event.kind === 'placement' ||
        (row.event.kind === 'retained' && row.event.sourceKind === 'placement')
      )
        placements.push({ row, tested: validated.testedUnitIds });
    } catch (e) {
      if (e instanceof EvidenceError && e.reason === 'changed') outdated++;
      else throw e;
    }
  }
  placements.sort(
    (a, b) =>
      (a.row.sequence ?? Number.MAX_SAFE_INTEGER) - (b.row.sequence ?? Number.MAX_SAFE_INTEGER) ||
      a.row.position - b.row.position,
  );
  return { path: learningPath(catalogue, progress, placements.at(-1)?.tested ?? []), outdated };
}
async function refresh(expected = scope()) {
  const state = useLearningState.getState();
  const repo = state.memory ? null : await getLearningRepository();
  const rows = repo ? await repo.list(expected) : state.rows;
  const reviews = repo ? await repo.reviews(expected) : state.reviews;
  if (expected !== scope()) return;
  useLearningState.setState({ ...derive(rows), rows, reviews, scope: expected, phase: 'ready' });
}
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const work = queue.catch(() => undefined).then(fn);
  queue = work;
  return work;
}
export async function initializeLearning(): Promise<void> {
  const current = ++generation,
    owner = scope();
  useLearningState.setState({
    phase: 'loading',
    scope: owner,
    rows: [],
    path: [],
    drafts: {},
    reviews: null,
    ratings: null,
    sync: 'guest',
  });
  try {
    await serialize(async () => {
      const memory = useDeviceState.getState().storage === 'memory';
      useLearningState.setState({ memory });
      if (!memory) {
        const repo = await getLearningRepository();
        if (!(await repo.imported()))
          await repo.importLegacy(
            (await (await getLessonRepository()).allAttempts()).map(legacyLessonEvent),
          );
        if (current !== generation || owner !== scope()) return;
        await initializePlacement();
        await flushPlacementWrites().catch(() => undefined);
        if (current !== generation || owner !== scope()) return;
        const placementState = usePlacementState.getState();
        if (placementState.phase !== 'ready') throw new Error('Einstufungsspeicher nicht geladen');
        await repo.importPlacement(
          owner,
          placementState.storage === 'memory' ? EMPTY_PLACEMENT : placementState.data,
        );
        await repo.claimGuest(owner, catalogue);
        const data = await repo.placement(owner),
          last = data.last;
        if (last && usePlacementState.getState().storage !== 'memory') {
          const event = placementEvent(last);
          if (!(await repo.exists(event.id))) {
            try {
              validateLearningEvent(catalogue, event);
              await repo.save(owner, event);
            } catch (e) {
              if (!(e instanceof EvidenceError && e.reason === 'changed')) throw e;
            }
          }
        }
        const view = await repo.view(owner);
        const drafts = await repo.drafts(owner);
        const ratings = await repo.ratings(owner);
        const reviews = await repo.reviews(owner);
        if (current === generation && owner === scope()) {
          useLearningState.setState({ ...view, drafts, ratings, reviews });
          configurePlacementStorage(data, (value) => repo.savePlacement(owner, value));
        }
      } else {
        configurePlacementStorage(EMPTY_PLACEMENT, () => Promise.resolve(), true);
      }
      if (current !== generation || owner !== scope()) return;
      await refresh(owner);
    });
    if (current !== generation || owner !== scope()) return;
    subscribe();
    void syncLearning();
  } catch {
    if (current === generation) useLearningState.setState({ phase: 'error' });
  }
}
function subscribe() {
  if (subscribed) return;
  subscribed = true;
  usePlacementState.subscribe((next, previous) => {
    if (useLearningState.getState().phase !== 'ready') return;
    if (next.data.last !== previous.data.last && next.data.last) {
      const event = placementEvent(next.data.last);
      const owner = useLearningState.getState().scope;
      void recordLearningEvent(event, next.storage === 'memory', owner).catch(() => {
        if (owner === scope()) useLearningState.setState({ sync: 'error' });
      });
    }
  });
}
function placementEvent(
  last: NonNullable<ReturnType<typeof usePlacementState.getState>['data']['last']>,
): LearningEvent {
  if (last.endedAt === null) throw new Error('Einstufung noch nicht abgeschlossen');
  return {
    kind: 'placement',
    id: last.id ?? `placement:${last.bankKey}:${last.seed}:${String(last.endedAt)}`,
    startedAt: last.startedAt,
    finishedAt: last.endedAt,
    seed: last.seed,
    bankKey: last.bankKey,
    actions: [...last.actions],
  };
}
export async function recordLearningEvent(
  event: LearningEvent,
  temporary = false,
  owner = scope(),
) {
  assertPrivacyWrite(owner, event.id);
  validateLearningEvent(catalogue, event);
  await serialize(async () => {
    const state = useLearningState.getState();
    if (owner === scope() && (state.phase !== 'ready' || state.scope !== owner))
      throw new Error('Lernpfad noch nicht geladen');
    if ((state.memory && owner === scope()) || temporary) {
      if (owner !== scope()) return;
      const rows = [
        ...state.rows.filter((r) => r.event.id !== event.id),
        {
          event,
          sequence: null,
          position: Math.max(0, ...state.rows.map((r) => r.position)) + 1,
          pending: false,
        },
      ];
      useLearningState.setState({ rows, ...derive(rows) });
    } else {
      await (await getLearningRepository()).save(owner, event);
      await refresh(owner);
    }
  });
  if (!temporary) void syncLearning();
}
export async function recordLessonLearning(
  attempt: LessonAttempt,
  owner = scope(),
  temporary = false,
  timeZone?: string,
) {
  await recordLearningEvent(
    lessonEvent(
      attempt.id,
      attempt.session,
      Date.parse(attempt.startedAt),
      Date.parse(attempt.finishedAt),
      timeZone ?? attempt.timeZone,
    ),
    temporary,
    owner,
  );
}
export function startTemporaryLearning() {
  generation++;
  configurePlacementStorage(EMPTY_PLACEMENT, () => Promise.resolve(), true);
  useLearningState.setState({
    phase: 'ready',
    memory: true,
    scope: scope(),
    rows: [],
    drafts: {},
    reviews: null,
    ratings: null,
    ...derive([]),
    sync: 'guest',
  });
  subscribe();
}
/** Netzfehler halten die lokale Warteschlange; ACK und Cursor werden gemeinsam in SQLite gespeichert. */
export function syncLearning(): Promise<void> {
  if (syncing) return syncing;
  const state = useLearningState.getState(),
    owner = scope(),
    session = useAuthState.getState().session,
    client = getAuthClient();
  if (state.phase !== 'ready' || state.memory || owner === GUEST_SCOPE || !client || !session) {
    useLearningState.setState({ sync: 'guest' });
    return Promise.resolve();
  }
  const token = generation;
  useLearningState.setState({ sync: 'syncing' });
  syncing = (async () => {
    const repo = await getLearningRepository();
    for (let page = 0; page < 1000; page++) {
      if (token !== generation || owner !== scope()) return;
      const pending = (await repo.list(owner))
        .filter((row) => row.pending && row.event.kind !== 'retained')
        .filter((row) => {
          try {
            validateLearningEvent(catalogue, row.event);
            return true;
          } catch (e) {
            if (e instanceof EvidenceError && e.reason === 'changed') return false;
            throw e;
          }
        });
      const events: LearningEvent[] = [];
      for (const row of pending.slice(0, 1)) {
        if (JSON.stringify([...events, row.event]).length > 120000) break;
        if (row.event.kind !== 'retained') events.push(row.event);
      }
      if (pending.length && !events.length) throw new Error('Lernnachweis zu groß');
      const since = await repo.cursor(owner);
      if (token !== generation || owner !== scope()) return;
      const result = await client.functions.invoke('learning-sync', {
        body: { since, events, rewardFormat: 2, rowFormat: 4 },
        headers: { Authorization: `Bearer ${session.access_token}` },
        timeout: 15000,
      });
      if (result.error) throw new Error('Lernpfad nicht synchronisiert');
      const response = learningSyncResponseSchema.parse(result.data);
      for (const row of response.rows) {
        try {
          validateLearningEvent(catalogue, row.event);
        } catch (e) {
          if (!(e instanceof EvidenceError && e.reason === 'changed')) throw e;
        }
      }
      if (
        response.accepted.length !== events.length ||
        new Set(response.accepted).size !== response.accepted.length ||
        response.accepted.some((id) => !events.some((e) => e.id === id))
      )
        throw new Error('Unvollständige oder fremde Sync-Bestätigung');
      await repo.merge(owner, response);
      if (!response.more && pending.length <= events.length) {
        if (token === generation && owner === scope()) {
          await refresh(owner);
          // Ratings are optional for learning availability; an older deployment/offline failure uses local replay.
          const ratingRequest = new AbortController();
          const ratingDeadline = setTimeout(() => {
            ratingRequest.abort();
          }, 10000);
          try {
            const read = await client
              .rpc('learner_rating_snapshot', { bucket_ids: ratingBuckets })
              .setHeader('Authorization', `Bearer ${session.access_token}`)
              .abortSignal(ratingRequest.signal);
            const ratings = read.error ? null : learnerRatingCacheSchema.parse(read.data);
            if (ratings && token === generation && owner === scope()) {
              await repo.saveRatings(owner, ratings);
              if (token === generation && owner === scope()) useLearningState.setState({ ratings });
            }
          } catch {
            /* Keep the last account-scoped snapshot. */
          } finally {
            clearTimeout(ratingDeadline);
          }
          if (token !== generation || owner !== scope()) return;
          const reviewRequest = new AbortController();
          const reviewDeadline = setTimeout(() => {
            reviewRequest.abort();
          }, 10000);
          try {
            const read = await client
              .rpc('learner_review_snapshot')
              .setHeader('Authorization', `Bearer ${session.access_token}`)
              .abortSignal(reviewRequest.signal);
            let reviews = read.error ? null : reviewCacheSchema.parse(read.data);
            if (reviews && token === generation && owner === scope()) {
              const previous = await repo.reviews(owner);
              const throughSequence = reviews.throughSequence;
              const rows = (await repo.list(owner)).filter((r) =>
                r.sequence === null ? !r.pending : r.sequence <= throughSequence,
              );
              const fallback = localReviewState(catalogue, rows, previous);
              // Retained guest history stays on this device. Server evidence wins every overlapping key.
              reviews = {
                ...reviews,
                skills: { ...fallback.skills, ...reviews.skills },
                cards: { ...fallback.cards, ...reviews.cards },
                throughPosition: previous?.throughPosition ?? 0,
              };
              if (token !== generation || owner !== scope()) return;
              await repo.saveReviews(owner, reviews);
              if (token === generation && owner === scope()) useLearningState.setState({ reviews });
            }
          } catch {
            /* Last own snapshot + local evidence keeps offline review available. */
          } finally {
            clearTimeout(reviewDeadline);
          }
          if (token === generation && owner === scope())
            useLearningState.setState({ sync: 'idle' });
        }
        return;
      }
      if (!response.rows.length && response.more) throw new Error('Ungültige Sync-Seite');
    }
    throw new Error('Sync-Seitenlimit erreicht');
  })()
    .catch(() => {
      if (token === generation && owner === scope()) useLearningState.setState({ sync: 'error' });
    })
    .finally(() => {
      syncing = undefined;
      if (owner !== scope() || token !== generation) void syncLearning();
    });
  return syncing;
}
export function selectLearningArea(areaId: string | null) {
  useLearningState.setState({ areaId, level: null });
  saveView();
}
export function selectLearningLevel(level: 1 | 2 | null) {
  useLearningState.setState({ level });
  saveView();
}
export function toggleLearningUnit(id: string) {
  const expanded = useLearningState.getState().expanded;
  useLearningState.setState({
    expanded: expanded.includes(id) ? expanded.filter((u) => u !== id) : [...expanded, id],
  });
  saveView();
}
function saveView() {
  const { phase, memory, scope: owner, areaId, level, expanded } = useLearningState.getState();
  if (phase === 'ready' && !memory)
    void getLearningRepository()
      .then((repo) => repo.saveView(owner, { areaId, level, expanded }))
      .catch(() => {
        if (owner === scope()) useLearningState.setState({ sync: 'error' });
      });
}
