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
export const TUTOR_ATTEMPT_CLOCK_SKEW_MS = 5000;
const encoder = new TextEncoder();
type Attempt = ReturnType<typeof tutorAttemptRequestSchema.parse>;

export class TutorAttemptConfigurationError extends Error {
  constructor() {
    super('Attempt signing configuration');
    this.name = 'TutorAttemptConfigurationError';
  }
}
export class TutorAttemptContentError extends Error {
  constructor() {
    super('Invalid attempt content');
    this.name = 'TutorAttemptContentError';
  }
}
export function validateTutorAttemptSecret(secret: unknown): string {
  if (
    typeof secret !== 'string' ||
    secret.length < 32 ||
    secret.length > 4096 ||
    !/^[A-Za-z0-9_+/=-]+$/.test(secret)
  )
    throw new TutorAttemptConfigurationError();
  return secret;
}
/** Dedicated server secret; no fallback to an administrative credential. */
export function readTutorAttemptSecret(env: (name: string) => string | undefined): string {
  const secret = validateTutorAttemptSecret(env('TUTOR_ATTEMPT_SECRET'));
  if (secret === env('SUPABASE_SERVICE_ROLE_KEY')) throw new TutorAttemptConfigurationError();
  return secret;
}
async function key(secret: string) {
  validateTutorAttemptSecret(secret);
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
  const signingKey = await key(secret);
  let attempt: Attempt;
  try {
    attempt = tutorAttemptRequestSchema.parse(input);
    const { item } = resolveReportSource(catalogue, attempt.source);
    if (!evaluateExercise(item, attempt.answer).validAnswer) throw new TutorAttemptContentError();
  } catch {
    throw new TutorAttemptContentError();
  }
  const proof = { id: crypto.randomUUID(), issuedAt: now, expiresAt: now + TUTOR_ATTEMPT_TTL_MS };
  const signature = await crypto.subtle.sign('HMAC', signingKey, binding(actor, attempt, proof));
  return {
    ...proof,
    signature: Array.from(new Uint8Array(signature), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join(''),
  };
}
/** Freshness for new requests only; exact owned stored replays use the database path. */
export async function tutorAttemptError(
  actor: string,
  request: TutorRequest,
  secret: string,
  now = Date.now(),
): Promise<'attempt_required' | 'attempt_invalid' | 'attempt_expired' | null> {
  if (request.mode !== 'explain' && request.mode !== 'solution') return null;
  if (!request.attemptProof || !request.context?.answer) return 'attempt_required';
  const parsed = tutorAttemptProofSchema.safeParse(request.attemptProof);
  if (!parsed.success) return 'attempt_invalid';
  const proof = parsed.data;
  const checked = tutorAttemptRequestSchema.safeParse({
    source: request.context.source,
    answer: request.context.answer,
  });
  if (!checked.success) return 'attempt_invalid';
  const attempt = checked.data;
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
    proof.issuedAt > now + TUTOR_ATTEMPT_CLOCK_SKEW_MS
  )
    return 'attempt_invalid';
  return proof.expiresAt <= now ? 'attempt_expired' : null;
}
