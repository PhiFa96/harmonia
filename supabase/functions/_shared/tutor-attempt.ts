import {
  resolveReportSource,
  tutorAttemptProofSchema,
  tutorAttemptRequestSchema,
} from '../../../packages/content/src/index.ts';
import type {
  ContentCatalogue,
  TutorAttemptProof,
  TutorRequest,
} from '../../../packages/content/src/index.ts';
import { evaluateExercise } from '../../../packages/exercises/src/index.ts';

export const TUTOR_ATTEMPT_TTL_MS = 30 * 60 * 1000;
const encoder = new TextEncoder();
type Attempt = ReturnType<typeof tutorAttemptRequestSchema.parse>;
async function key(secret: string) {
  if (secret.length < 32) throw new Error('Attempt signing configuration');
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}
function binding(actor: string, attempt: Attempt, proof: Omit<TutorAttemptProof, 'signature'>) {
  return encoder.encode(
    JSON.stringify([
      'harmonia:tutor-graded-attempt:v1',
      actor,
      attempt.source,
      attempt.answer,
      proof.id,
      proof.issuedAt,
      proof.expiresAt,
    ]),
  );
}
/** Signs only a canonical, engine-valid submitted answer. Wrong answers are valid attempts. */
export async function issueTutorAttempt(
  catalogue: ContentCatalogue,
  actor: string,
  input: unknown,
  secret: string,
  now = Date.now(),
): Promise<TutorAttemptProof> {
  const attempt = tutorAttemptRequestSchema.parse(input);
  const { item } = resolveReportSource(catalogue, attempt.source);
  if (!evaluateExercise(item, attempt.answer).validAnswer) throw new Error('Invalid attempt');
  const proof = { id: crypto.randomUUID(), issuedAt: now, expiresAt: now + TUTOR_ATTEMPT_TTL_MS };
  const signature = await crypto.subtle.sign(
    'HMAC',
    await key(secret),
    binding(actor, attempt, proof),
  );
  return {
    ...proof,
    signature: Array.from(new Uint8Array(signature), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join(''),
  };
}
/** Expiry may be ignored only for a matching, already stored request owned by this actor. */
export async function tutorAttemptError(
  actor: string,
  request: TutorRequest,
  secret: string,
  now = Date.now(),
  storedReplay = false,
): Promise<'attempt_required' | 'attempt_invalid' | 'attempt_expired' | null> {
  if (request.mode !== 'explain' && request.mode !== 'solution') return null;
  if (!request.attemptProof || !request.context?.answer) return 'attempt_required';
  const parsed = tutorAttemptProofSchema.safeParse(request.attemptProof);
  if (!parsed.success) return 'attempt_invalid';
  const proof = parsed.data;
  const attempt = tutorAttemptRequestSchema.parse({
    source: request.context.source,
    answer: request.context.answer,
  });
  const signature = Uint8Array.from(proof.signature.match(/../g) ?? [], (byte) =>
    parseInt(byte, 16),
  );
  if (
    !(await crypto.subtle.verify(
      'HMAC',
      await key(secret),
      signature,
      binding(actor, attempt, proof),
    )) ||
    proof.expiresAt - proof.issuedAt !== TUTOR_ATTEMPT_TTL_MS ||
    proof.issuedAt > now
  )
    return 'attempt_invalid';
  return !storedReplay && proof.expiresAt <= now ? 'attempt_expired' : null;
}
