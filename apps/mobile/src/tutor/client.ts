import { configuredAuth } from '@/auth/config';
import { useAuthState } from '@/auth';
import { TutorError, TutorTransport } from './transport.ts';
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
