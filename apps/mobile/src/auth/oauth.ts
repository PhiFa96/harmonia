import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { randomUUID } from 'expo-crypto';
import { getAuthClient, useAuthState } from './index.ts';
import { createSecureAuthStorage } from './secure-storage.ts';
import { oauthCode, oauthWebOrigin } from './oauth-model.ts';
import type { OAuthAttempt } from './oauth-model.ts';
import { flushDeviceWrites } from '../state/device.ts';
import { captureGuestProfile } from '../state/profile.ts';
import { configuredAuth } from './config.ts';
import type { Session } from '@supabase/supabase-js';
const storage = createSecureAuthStorage(),
  key = 'harmonia.oauth.pending';
let finishing: Promise<string> | undefined,
  starting = false;
let finishingUrl: string | undefined;
let completed: { url: string; actor: string; until: number } | undefined;
async function retainAppleGrant(session: Session) {
  const config = configuredAuth();
  if (!config || !session.provider_refresh_token) throw new Error('Apple grant missing');
  const response = await fetch(config.url + '/functions/v1/apple-grant', {
    method: 'POST',
    signal: AbortSignal.timeout(15000),
    headers: {
      'Content-Type': 'application/json',
      apikey: config.key,
      Authorization: 'Bearer ' + session.access_token,
    },
    body: JSON.stringify({ refreshToken: session.provider_refresh_token }),
  });
  if (!response.ok) throw new Error('Apple grant unavailable');
}
export function oauthProviders() {
  return {
    apple: process.env.EXPO_PUBLIC_AUTH_APPLE_ENABLED === 'true',
    google: process.env.EXPO_PUBLIC_AUTH_GOOGLE_ENABLED === 'true',
  };
}
async function pendingRead(): Promise<OAuthAttempt> {
  const json = Platform.OS === 'web' ? sessionStorage.getItem(key) : await storage.getItem(key);
  if (!json) throw new Error('OAuth attempt missing');
  const value: unknown = JSON.parse(json);
  if (
    !value ||
    typeof value !== 'object' ||
    !('id' in value) ||
    !('redirect' in value) ||
    !('expiresAt' in value) ||
    typeof value.id !== 'string' ||
    typeof value.redirect !== 'string' ||
    typeof value.expiresAt !== 'number' ||
    !('provider' in value) ||
    !['apple', 'google'].includes(String(value.provider))
  )
    throw new Error('OAuth attempt invalid');
  return {
    id: value.id,
    redirect: value.redirect,
    expiresAt: value.expiresAt,
    provider: value.provider as 'apple' | 'google',
  };
}
async function removePending() {
  if (Platform.OS === 'web') sessionStorage.removeItem(key);
  else await storage.removeItem(key);
}
export function finishOAuth(url: string): Promise<string> {
  if (
    completed?.url === url &&
    completed.until > Date.now() &&
    useAuthState.getState().session?.user.id === completed.actor
  )
    return Promise.resolve(completed.actor);
  if (finishing && finishingUrl !== url)
    return Promise.reject(new Error('OAuth callback mismatch'));
  finishingUrl = url;
  finishing ??= (async () => {
    const pending = await pendingRead(),
      code = oauthCode(url, pending, Date.now()),
      client = getAuthClient();
    if (!client) throw new Error('OAuth unavailable');
    // Consume correlation before exchange; replay cannot start a second exchange.
    await removePending();
    const result = await client.auth.exchangeCodeForSession(code);
    if (result.error) throw new Error('OAuth exchange failed');
    const verified = await client.auth.getUser();
    if (verified.error || verified.data.user.id !== result.data.session.user.id) {
      await client.auth.signOut({ scope: 'local' });
      throw new Error('OAuth session not verified');
    }
    if (pending.provider === 'apple') {
      try {
        await retainAppleGrant(result.data.session);
      } catch {
        await client.auth.signOut({ scope: 'local' });
        throw new Error('Apple grant unavailable');
      }
    }
    useAuthState.setState({ session: result.data.session, ready: true, error: false });
    completed = { url, actor: verified.data.user.id, until: Date.now() + 60000 };
    return verified.data.user.id;
  })().finally(() => {
    finishing = undefined;
    finishingUrl = undefined;
  });
  return finishing;
}
export async function startOAuth(
  provider: 'apple' | 'google',
  ageConfirmed: boolean,
): Promise<string | null> {
  const client = getAuthClient();
  if (
    starting ||
    !ageConfirmed ||
    !client ||
    !oauthProviders()[provider] ||
    useAuthState.getState().session
  )
    throw new Error('OAuth unavailable');
  starting = true;
  try {
    await flushDeviceWrites();
    await captureGuestProfile();
    const origin = oauthWebOrigin(process.env.EXPO_PUBLIC_AUTH_WEB_ORIGIN);
    if (Platform.OS === 'web' && (!origin || window.location.origin !== origin))
      throw new Error('OAuth origin mismatch');
    const id = randomUUID(),
      redirect = new URL(
        Platform.OS === 'web' ? '/auth/callback' : Linking.createURL('auth/callback'),
        origin ?? undefined,
      );
    redirect.searchParams.set('attempt', id);
    const attempt: OAuthAttempt = {
      id,
      redirect: redirect.href,
      expiresAt: Date.now() + 10 * 60 * 1000,
      provider,
    };
    if (Platform.OS === 'web') sessionStorage.setItem(key, JSON.stringify(attempt));
    else await storage.setItem(key, JSON.stringify(attempt));
    const result = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirect.href, skipBrowserRedirect: true },
    });
    if (result.error || !result.data.url) throw new Error('OAuth unavailable');
    const auth = configuredAuth(),
      authorize = new URL(result.data.url);
    if (
      authorize.origin !== auth?.url ||
      authorize.pathname !== '/auth/v1/authorize' ||
      authorize.searchParams.get('provider') !== provider ||
      authorize.searchParams.get('redirect_to') !== redirect.href
    )
      throw new Error('OAuth authorization URL mismatch');
    if (Platform.OS === 'web') {
      window.location.assign(result.data.url);
      return null;
    }
    const response = await WebBrowser.openAuthSessionAsync(result.data.url, redirect.href);
    if (response.type !== 'success') {
      await removePending();
      return null;
    }
    return await finishOAuth(response.url);
  } catch {
    await removePending();
    throw new Error('OAuth failed');
  } finally {
    starting = false;
  }
}
