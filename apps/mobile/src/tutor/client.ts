import { configuredAuth } from '@/auth/config';
import { useAuthState } from '@/auth';
import { TutorError, TutorTransport } from './transport.ts';
import { tutorAttemptResponseSchema } from '@harmonia/content';
import type { TutorRequest } from '@harmonia/content';
export const tutorActor = () => {
  const session = useAuthState.getState().session;
  return session && !session.user.is_anonymous ? session.user.id : null;
};
export const tutorTransport = new TutorTransport(
  () => {
    const config = configuredAuth(),
      session = useAuthState.getState().session;
    if (!config) throw new TutorError('unconfigured');
    if (!session || !tutorActor()) throw new TutorError('auth');
    return { ...config, token: session.access_token };
  },
  async (url, init) => {
    // Expo Fetch liefert auch auf iOS/Android einen inkrementellen ReadableStream.
    const { fetch } = await import('expo/fetch');
    return fetch(url, init);
  },
);

/** Submit the answer for server grading before requesting any model explanation/solution. */
export async function verifyTutorRequest(
  request: TutorRequest,
  signal: AbortSignal,
): Promise<TutorRequest> {
  if ((request.mode !== 'explain' && request.mode !== 'solution') || request.attemptProof)
    return request;
  if (!request.context?.answer) throw new TutorError('attempt_required');
  const response = tutorAttemptResponseSchema.safeParse(
    await tutorTransport.json(
      '?view=attempt',
      'POST',
      { source: request.context.source, answer: request.context.answer },
      signal,
    ),
  );
  if (!response.success) throw new TutorError('protocol');
  return { ...request, attemptProof: response.data.proof };
}
