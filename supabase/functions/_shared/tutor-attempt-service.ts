import { tutorAttemptRequestSchema } from '../../../packages/content/src/index.ts';
import type { ContentCatalogue, TutorAttemptProof } from '../../../packages/content/src/index.ts';
import {
  issueTutorAttempt,
  readTutorAttemptSecret,
  TutorAttemptContentError,
} from './tutor-attempt.ts';

type Outcome =
  | { status: 200; proof: TutorAttemptProof }
  | {
      status: 400 | 422 | 429 | 503;
      error: 'schema' | 'content' | 'rate' | 'storage' | 'server';
      retryAfter?: number;
    };
/** Shared issuance path; caller has authenticated the actor and bounded the body. */
export async function prepareTutorAttempt(
  actor: string,
  input: unknown,
  dependencies: {
    env: (name: string) => string | undefined;
    consume: () => Promise<unknown>;
    content: () => Promise<ContentCatalogue>;
  },
): Promise<Outcome> {
  const attempt = tutorAttemptRequestSchema.safeParse(input);
  if (!attempt.success) return { status: 400, error: 'schema' };
  let secret: string;
  try {
    secret = readTutorAttemptSecret(dependencies.env);
  } catch {
    return { status: 503, error: 'server' };
  }
  let value: unknown;
  try {
    value = await dependencies.consume();
  } catch {
    return { status: 503, error: 'storage' };
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return { status: 503, error: 'storage' };
  const limit = value as { allowed?: unknown; retryAfter?: unknown };
  if (
    typeof limit.allowed !== 'boolean' ||
    typeof limit.retryAfter !== 'number' ||
    !Number.isInteger(limit.retryAfter) ||
    limit.retryAfter < 0 ||
    limit.retryAfter > 60 ||
    (limit.allowed ? limit.retryAfter !== 0 : limit.retryAfter === 0)
  )
    return { status: 503, error: 'storage' };
  if (!limit.allowed) return { status: 429, error: 'rate', retryAfter: limit.retryAfter };
  try {
    return {
      status: 200,
      proof: await issueTutorAttempt(await dependencies.content(), actor, attempt.data, secret),
    };
  } catch (error) {
    return error instanceof TutorAttemptContentError
      ? { status: 422, error: 'content' }
      : { status: 503, error: 'server' };
  }
}
