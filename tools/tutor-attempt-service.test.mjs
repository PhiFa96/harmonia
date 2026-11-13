import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareTutorAttempt } from '../supabase/functions/_shared/tutor-attempt-service.ts';
import { catalogue } from '../packages/content/src/authoring.ts';
import { resolveReportSource, tutorRequestSchema } from '../packages/content/src/index.ts';
import { expectedAnswer } from '../packages/exercises/src/index.ts';
import { tutorAttemptError } from '../supabase/functions/_shared/tutor-attempt.ts';
const actor = '11111111-1111-4111-8111-111111111111';
const secret = 'synthetic-isolated-attempt-service-test-key';
const source = {
  kind: 'practice',
  set: 'reading',
  contentVersion: 1,
  seed: 'service-test',
  index: 0,
};
const input = { source, answer: expectedAnswer(resolveReportSource(catalogue, source).item) };
function dependencies(options = {}) {
  const calls = { limit: 0, content: 0 };
  return {
    calls,
    env: (name) => (name === 'TUTOR_ATTEMPT_SECRET' ? secret : 'different-administrative-key'),
    consume: async () => {
      calls.limit++;
      return { allowed: true, retryAfter: 0 };
    },
    content: async () => {
      calls.content++;
      return catalogue;
    },
    ...options,
  };
}
test('missing, weak or reused signing configuration returns 503 before consuming or grading', async () => {
  for (const configured of [undefined, 'short', 'different-administrative-key']) {
    const deps = dependencies({
      env: (name) =>
        name === 'TUTOR_ATTEMPT_SECRET' ? configured : 'different-administrative-key',
    });
    assert.deepEqual(await prepareTutorAttempt(actor, input, deps), {
      status: 503,
      error: 'server',
    });
    assert.deepEqual(deps.calls, { limit: 0, content: 0 });
  }
});
test('schema failures return 400 without consuming a grading slot', async () => {
  const deps = dependencies();
  assert.deepEqual(await prepareTutorAttempt(actor, { ...input, correct: true }, deps), {
    status: 400,
    error: 'schema',
  });
  assert.deepEqual(deps.calls, { limit: 0, content: 0 });
});
test('throttling returns a retry delay and never loads or grades content', async () => {
  const deps = dependencies({ consume: async () => ({ allowed: false, retryAfter: 17 }) });
  assert.deepEqual(await prepareTutorAttempt(actor, input, deps), {
    status: 429,
    error: 'rate',
    retryAfter: 17,
  });
  assert.equal(deps.calls.content, 0);
});
test('storage failures and malformed budget responses fail closed without a proof', async () => {
  const deps = dependencies({
    consume: async () => {
      throw new Error('private diagnostic');
    },
  });
  assert.deepEqual(await prepareTutorAttempt(actor, input, deps), {
    status: 503,
    error: 'storage',
  });
  for (const value of [
    null,
    [],
    {},
    true,
    { allowed: true, retryAfter: 1 },
    { allowed: false, retryAfter: 0 },
    { allowed: false, retryAfter: 61 },
    { allowed: 'yes', retryAfter: 0 },
  ])
    assert.deepEqual(
      await prepareTutorAttempt(actor, input, dependencies({ consume: async () => value })),
      { status: 503, error: 'storage' },
    );
});
test('invalid answers return 422, while a content-loading failure returns 503', async () => {
  assert.deepEqual(
    await prepareTutorAttempt(actor, { ...input, answer: 'invalid-answer' }, dependencies()),
    { status: 422, error: 'content' },
  );
  assert.deepEqual(
    await prepareTutorAttempt(
      actor,
      input,
      dependencies({
        content: async () => {
          throw new Error('private catalogue error');
        },
      }),
    ),
    { status: 503, error: 'server' },
  );
});
test('the shared issuance path returns only a real cryptographic proof bound to the submitted answer', async () => {
  const outcome = await prepareTutorAttempt(actor, input, dependencies());
  assert.equal(outcome.status, 200);
  assert.deepEqual(Object.keys(outcome).sort(), ['proof', 'status']);
  const request = tutorRequestSchema.parse({
    id: crypto.randomUUID(),
    conversationId: crypto.randomUUID(),
    locale: 'de',
    noteNaming: 'de',
    message: 'Warum?',
    mode: 'explain',
    hintLevel: null,
    context: { ...input, checked: false },
    attemptProof: outcome.proof,
  });
  assert.equal(await tutorAttemptError(actor, request, secret), null);
});
