import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { create } from 'zustand';
import type { AppLocale } from '@harmonia/i18n';
import { configuredAuth } from './config.ts';
import { createSecureAuthStorage } from './secure-storage.ts';

export const useAuthState = create<{
  readonly session: Session | null;
  readonly ready: boolean;
  readonly error: boolean;
}>()(() => ({ session: null, ready: false, error: false }));
let client: SupabaseClient | undefined;
let initialized: Promise<void> | undefined;
export function getAuthClient(): SupabaseClient | null {
  const config = configuredAuth();
  if (!config) return null;
  if (!client) {
    client = createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        ...(Platform.OS !== 'web' ? { storage: createSecureAuthStorage() } : {}),
      },
    });
    client.auth.onAuthStateChange((_event, session) => {
      useAuthState.setState({ session, ready: true, error: false });
    });
    if (Platform.OS !== 'web') {
      const activeClient = client;
      const failure = () => {
        useAuthState.setState({ error: true });
      };
      if (AppState.currentState === 'active')
        void activeClient.auth.startAutoRefresh().catch(failure);
      AppState.addEventListener('change', (state) => {
        if (state === 'active') void activeClient.auth.startAutoRefresh().catch(failure);
        else void activeClient.auth.stopAutoRefresh().catch(failure);
      });
    }
  }
  return client;
}
export function initializeAuth(): Promise<void> {
  initialized ??= (async () => {
    try {
      const auth = getAuthClient();
      const result = auth ? await auth.auth.getSession() : null;
      if (result?.error) throw result.error;
      useAuthState.setState({ session: result?.data.session ?? null, ready: true, error: false });
    } catch {
      useAuthState.setState({ ready: true, error: true });
      initialized = undefined;
    }
  })();
  return initialized;
}
export function validEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
export async function sendEmailCode(email: string, locale: AppLocale): Promise<void> {
  if (!validEmail(email)) throw new Error('Ungültige E-Mail-Adresse');
  const auth = getAuthClient();
  if (!auth) throw new Error('Anmeldung nicht konfiguriert');
  const { error } = await auth.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, data: { locale, age_confirmed: true } },
  });
  if (error) throw error;
}
export async function verifyEmailCode(email: string, token: string): Promise<Session> {
  if (!validEmail(email) || !/^\d{6}$/.test(token)) throw new Error('Ungültiger E-Mail-Code');
  const auth = getAuthClient();
  if (!auth) throw new Error('Anmeldung nicht konfiguriert');
  const { data, error } = await auth.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  if (!data.session || !data.user) throw new Error('Bestätigte Sitzung fehlt');
  useAuthState.setState({ session: data.session, ready: true, error: false });
  return data.session;
}
export async function signOutDevice(): Promise<void> {
  const auth = getAuthClient();
  if (!auth) return;
  const { error } = await auth.auth.signOut({ scope: 'local' });
  if (error) throw error;
  useAuthState.setState({ session: null, ready: true });
}
