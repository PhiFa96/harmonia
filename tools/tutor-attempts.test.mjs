import assert from 'node:assert/strict';
import test from 'node:test';
import { catalogue } from '../packages/content/src/authoring.ts';
import { resolveReportSource, tutorRequestSchema } from '../packages/content/src/index.ts';
import { expectedAnswer } from '../packages/exercises/src/index.ts';
import {
  issueTutorAttempt,
  tutorAttemptError,
  TUTOR_ATTEMPT_TTL_MS,
} from '../supabase/functions/_shared/tutor-attempt.ts';

const actor = '11111111-1111-4111-8111-111111111111';
const secret = 'synthetic-receipt-signing-secret-only-for-tests';
const now = 1_800_000_000_000;
const source = { kind: 'practice', set: 'reading', contentVersion: 1, seed: 'receipt', index: 0 };
const item = resolveReportSource(catalogue, source).item;
const answer = expectedAnswer(item);
const attempt = { source, answer };
const request = (proof, extra = {}) =>
  tutorRequestSchema.parse({
    id: '22222222-2222-4222-8222-222222222222',
    conversationId: '33333333-3333-4333-8333-333333333333',
    locale: 'de',
    noteNaming: 'de',
    message: 'Warum?',
    mode: 'explain',
    hintLevel: null,
    context: { ...attempt, checked: false },
    ...(proof ? { attemptProof: proof } : {}),
    ...extra,
  });

test('server grades valid correct and wrong answers before issuing a bounded receipt, without a solution', async () => {
  const wrong = item.choices.find((choice) => choice !== answer);
  assert.ok(wrong);
  for (const submitted of [answer, wrong]) {
    const proof = await issueTutorAttempt(
      catalogue,
      actor,
      { source, answer: submitted },
      secret,
      now,
    );
    assert.deepEqual(Object.keys(proof).sort(), ['expiresAt', 'id', 'issuedAt', 'signature']);
    assert.equal(proof.expiresAt, now + TUTOR_ATTEMPT_TTL_MS);
    for (const mode of ['explain', 'solution'])
      assert.equal(
        await tutorAttemptError(
          actor,
          request(proof, {
            mode,
            context: { source, answer: submitted, checked: false },
          }),
          secret,
          now,
        ),
        null,
      );
  }
});
test('legacy checked flag and an otherwise valid answer cannot authorize a model request', async () => {
  for (const checked of [false, true])
    for (const mode of ['explain', 'solution'])
      assert.equal(
        await tutorAttemptError(
          actor,
          request(undefined, {
            mode,
            context: { ...attempt, checked },
          }),
          secret,
          now,
        ),
        'attempt_required',
      );
});
test('no receipt for an invalid answer, stale source, forged source, empty answer or client result flags', async () => {
  for (const value of [
    { ...attempt, answer: 'untrusted-wrong' },
    { ...attempt, answer: '' },
    { ...attempt, source: { ...source, contentVersion: 999 } },
    { ...attempt, source: { ...source, index: 99 } },
    { ...attempt, correct: true },
  ])
    await assert.rejects(issueTutorAttempt(catalogue, actor, value, secret, now));
});
test('receipt binds actor, source, answer, identifier, timestamps and server key', async () => {
  const proof = await issueTutorAttempt(catalogue, actor, attempt, secret, now);
  const base = request(proof);
  for (const changed of [
    { ...base, context: { ...base.context, answer: 'other' } },
    { ...base, context: { ...base.context, source: { ...source, seed: 'other' } } },
    { ...base, context: { ...base.context, source: { ...source, index: 1 } } },
    { ...base, attemptProof: { ...proof, id: base.id } },
    { ...base, attemptProof: { ...proof, signature: '0'.repeat(64) } },
    { ...base, attemptProof: { ...proof, issuedAt: now + 1 } },
    { ...base, attemptProof: { ...proof, expiresAt: proof.expiresAt + 1 } },
  ])
    assert.equal(await tutorAttemptError(actor, changed, secret, now), 'attempt_invalid');
  assert.equal(await tutorAttemptError(base.id, base, secret, now), 'attempt_invalid');
  assert.equal(await tutorAttemptError(actor, base, secret + '-rotated', now), 'attempt_invalid');
});
test('expiry is exclusive; only an already stored identical owned request may replay an expired receipt', async () => {
  const proof = await issueTutorAttempt(catalogue, actor, attempt, secret, now);
  assert.equal(await tutorAttemptError(actor, request(proof), secret, proof.expiresAt - 1), null);
  assert.equal(
    await tutorAttemptError(actor, request(proof), secret, proof.expiresAt),
    'attempt_expired',
  );
  assert.equal(await tutorAttemptError(actor, request(proof), secret, now - 1), 'attempt_invalid');
  assert.equal(await tutorAttemptError(actor, request(proof), secret, proof.expiresAt, true), null);
  assert.equal(
    await tutorAttemptError(request(proof).id, request(proof), secret, proof.expiresAt, true),
    'attempt_invalid',
  );
});
test('canonical source ordering survives JSON transport; new requests get independent receipts', async () => {
  const proof = await issueTutorAttempt(catalogue, actor, attempt, secret, now);
  const reordered = Object.fromEntries(Object.entries(source).reverse());
  const fromWire = request(proof, { context: { source: reordered, answer, checked: true } });
  assert.equal(await tutorAttemptError(actor, fromWire, secret, now), null);
  assert.notEqual((await issueTutorAttempt(catalogue, actor, attempt, secret, now)).id, proof.id);
});
test('hint and chat do not require a receipt; solution cannot use a receipt without its submitted answer', async () => {
  for (const mode of ['hint', 'chat'])
    assert.equal(
      await tutorAttemptError(
        actor,
        request(undefined, {
          mode,
          hintLevel: mode === 'hint' ? 1 : null,
          context: { source, answer: null, checked: true },
        }),
        secret,
        now,
      ),
      null,
    );
  const proof = await issueTutorAttempt(catalogue, actor, attempt, secret, now);
  assert.equal(
    await tutorAttemptError(
      actor,
      request(proof, {
        mode: 'solution',
        context: { source, answer: null, checked: true },
      }),
      secret,
      now,
    ),
    'attempt_required',
  );
});
