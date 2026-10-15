import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processPendingRatings } from '../supabase/functions/_shared/ratings.ts';
import { catalogue, firstLesson } from '../packages/content/src/authoring.ts';
import { lessonEvent, learningRatingEvidence } from '../packages/content/src/index.ts';
import {
  answerLesson,
  createLessonSession,
  expectedAnswer,
  nextLessonExercise,
  ratePeriod,
} from '../packages/exercises/src/index.ts';

const actor = '33333333-3333-4333-8333-333333333333';
let session = createLessonSession(firstLesson, 'rating-worker');
for (const item of session.initial.items)
  session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
const event = lessonEvent('worker', session, 1, 2);
const row = { actor, id: event.id, hash: 'a'.repeat(64), receivedAt: 1234567, event };
const initial = { revision: '0', tau: 0.5, skills: {}, buckets: {} };
const ok = (data) => ({ data, error: null });

test('CAS conflict reloads the shared difficulty snapshot before committing', async () => {
  let reads = 0,
    writes = 0;
  const evidence = learningRatingEvidence(catalogue, event);
  const competing = ratePeriod(
    initial,
    evidence.observations.map((item) => ({ ...item, correct: false })),
    row.receivedAt,
  );
  const changed = { ...initial, revision: '1', buckets: competing.buckets };
  const client = {
    async rpc(name, args) {
      if (name === 'rating_pending') {
        assert.equal(args.actor, actor);
        return ok([row]);
      }
      if (name === 'rating_snapshot') {
        reads++;
        return ok(reads === 1 ? initial : changed);
      }
      assert.equal(name, 'commit_rating_period');
      assert.equal(args.actor, actor);
      assert.equal(args.expected_hash, row.hash);
      writes++;
      if (writes === 1) return ok('conflict');
      assert.equal(args.expected_revision, '1');
      assert.deepEqual(args.updates, ratePeriod(changed, evidence.observations, row.receivedAt));
      return ok('applied');
    },
  };
  const result = await processPendingRatings(client, catalogue, actor);
  assert.equal(result.applied, 1);
  assert.equal(result.rated, 1);
  assert.equal(reads, 2);
  assert.equal(writes, 2);
});
test('already processed events never count as new observations', async () => {
  const client = {
    async rpc(name) {
      return ok(
        name === 'rating_pending' ? [row] : name === 'rating_snapshot' ? initial : 'already',
      );
    },
  };
  const result = await processPendingRatings(client, catalogue, actor);
  assert.equal(result.applied, 0);
  assert.equal(result.already, 1);
  assert.equal(result.rated, 0);
});
test('account mismatch is rejected before reading or writing another owner', async () => {
  let calls = 0;
  const client = {
    async rpc() {
      calls++;
      return ok([{ ...row, actor: '44444444-4444-4444-8444-444444444444' }]);
    },
  };
  await assert.rejects(() => processPendingRatings(client, catalogue, actor), /account mismatch/);
  assert.equal(calls, 1);
});
test('retained evidence commits only an exclusion receipt and no invented ratings', async () => {
  const retained = {
    ...row,
    event: { kind: 'retained', sourceKind: 'unavailable', id: event.id, finishedAt: 2 },
  };
  const client = {
    async rpc(name, args) {
      if (name === 'rating_pending') return ok([retained]);
      if (name === 'rating_snapshot') return ok(initial);
      assert.equal(args.outcome, 'retained');
      assert.deepEqual(args.updates, { skills: {}, buckets: {} });
      return ok('applied');
    },
  };
  const result = await processPendingRatings(client, catalogue, actor);
  assert.equal(result.excluded, 1);
  assert.equal(result.rated, 0);
});
test('repeated contention defers the page, preserving source order for the next invocation', async () => {
  let writes = 0;
  const client = {
    async rpc(name) {
      if (name === 'rating_pending') return ok([row, { ...row, id: 'later' }]);
      if (name === 'rating_snapshot') return ok(initial);
      writes++;
      return ok('conflict');
    },
  };
  const result = await processPendingRatings(client, catalogue, actor);
  assert.equal(writes, 3);
  assert.equal(result.deferred, 1);
  assert.equal(result.applied, 0);
});
test('storage failures and malformed snapshots remain retryable', async () => {
  for (const failure of ['rating_pending', 'rating_snapshot', 'commit_rating_period']) {
    const client = {
      async rpc(name) {
        if (name === failure) return { data: null, error: { status: 503 } };
        return ok(name === 'rating_pending' ? [row] : initial);
      },
    };
    await assert.rejects(() => processPendingRatings(client, catalogue, actor), /unavailable/);
  }
  const client = {
    async rpc(name) {
      return ok(name === 'rating_pending' ? [row] : { ...initial, revision: 1 });
    },
  };
  await assert.rejects(() => processPendingRatings(client, catalogue, actor));
});
