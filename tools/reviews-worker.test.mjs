import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processPendingReviews } from '../supabase/functions/_shared/reviews.ts';
import { catalogue, firstLesson } from '../packages/content/src/authoring.ts';
import { lessonEvent, applyReviewEvent, emptyReviewState } from '../packages/content/src/index.ts';
import {
  answerLesson,
  createLessonSession,
  expectedAnswer,
  nextLessonExercise,
} from '../packages/exercises/src/index.ts';
const actor = '33333333-3333-4333-8333-333333333333';
let s = createLessonSession(firstLesson, 'review-worker');
for (const item of s.initial.items) s = nextLessonExercise(answerLesson(s, expectedAnswer(item)));
const event = lessonEvent('review-worker', s, 1000, 2000);
const row = { actor, id: event.id, hash: 'a'.repeat(64), receivedAt: 1234567, event };
const initial = { revision: '0', ...emptyReviewState() };
const ok = (data) => ({ data, error: null });
test('FSRS CAS reloads newer account state and recomputes only changed schedules', async () => {
  let reads = 0,
    writes = 0;
  const changed = { revision: '1', ...applyReviewEvent(catalogue, initial, event) };
  const client = {
    async rpc(name, args) {
      if (name === 'review_pending') return ok([row]);
      if (name === 'review_snapshot') return ok(++reads === 1 ? initial : changed);
      assert.equal(name, 'commit_review_period');
      assert.equal(args.actor, actor);
      assert.equal(args.expected_hash, row.hash);
      if (++writes === 1) return ok('conflict');
      assert.equal(args.expected_revision, '1');
      const next = applyReviewEvent(catalogue, changed, event);
      assert.deepEqual(args.updates.skills, next.skills);
      assert.deepEqual(args.updates.cards, {});
      return ok('applied');
    },
  };
  const result = await processPendingReviews(client, catalogue, actor);
  assert.equal(result.applied, 1);
  assert.equal(result.rated, 1);
  assert.equal(reads, 2);
  assert.equal(writes, 2);
});
test('FSRS rejects a foreign queue row before reading any snapshot', async () => {
  let calls = 0;
  const client = {
    async rpc() {
      calls++;
      return ok([{ ...row, actor: '44444444-4444-4444-8444-444444444444' }]);
    },
  };
  await assert.rejects(() => processPendingReviews(client, catalogue, actor), /account mismatch/);
  assert.equal(calls, 1);
});
for (const kind of ['retained', 'unavailable', 'invalid'])
  test('FSRS acknowledges ' + kind + ' without inventing memory', async () => {
    const source =
      kind === 'retained'
        ? { kind: 'retained', sourceKind: 'practice', id: event.id, finishedAt: 2000 }
        : kind === 'invalid'
          ? { kind: 'lesson', id: 'bad' }
          : { ...event, contentVersion: 999 };
    const client = {
      async rpc(name, args) {
        if (name === 'review_pending') return ok([{ ...row, event: source }]);
        if (name === 'review_snapshot') return ok(initial);
        assert.deepEqual(args.updates, { skills: {}, cards: {} });
        return ok('applied');
      },
    };
    const result = await processPendingReviews(client, catalogue, actor);
    assert.equal(result.excluded, 1);
    assert.equal(result.rated, 0);
  });
test('FSRS duplicate receipt is not counted as a second applied review', async () => {
  const client = {
    async rpc(name) {
      return ok(
        name === 'review_pending' ? [row] : name === 'review_snapshot' ? initial : 'already',
      );
    },
  };
  const result = await processPendingReviews(client, catalogue, actor);
  assert.equal(result.applied, 0);
  assert.equal(result.already, 1);
});
test('FSRS bounded contention leaves receipts pending and stops before later events', async () => {
  let writes = 0;
  const client = {
    async rpc(name) {
      if (name === 'review_pending') return ok([row, { ...row, id: 'later' }]);
      if (name === 'review_snapshot') return ok(initial);
      writes++;
      return ok('conflict');
    },
  };
  const result = await processPendingReviews(client, catalogue, actor);
  assert.equal(writes, 3);
  assert.equal(result.deferred, 1);
  assert.equal(result.applied, 0);
});
test('FSRS clamps future clocks to server receipt time', async () => {
  const late = { ...event, finishedAt: 999999 };
  const receivedAt = 5000;
  const client = {
    async rpc(name, args) {
      if (name === 'review_pending') return ok([{ ...row, event: late, receivedAt }]);
      if (name === 'review_snapshot') return ok(initial);
      assert.deepEqual(args.updates, applyReviewEvent(catalogue, initial, late, receivedAt));
      return ok('applied');
    },
  };
  await processPendingReviews(client, catalogue, actor);
});
