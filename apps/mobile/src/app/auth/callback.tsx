import { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { AppText, Button } from '@harmonia/ui/native';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { finishOAuth } from '@/auth/oauth';
import { updateOnboarding, useDeviceState } from '@/state/device';
export default function AuthCallback() {
  const router = useRouter(),
    { t } = useTranslation(),
    device = useDeviceState(),
    incoming = Linking.useLinkingURL(),
    [failed, setFailed] = useState(false),
    started = useRef(false);
  const callback = useRef(Platform.OS === 'web' ? window.location.href : null);
  useEffect(() => {
    if (Platform.OS === 'web' && callback.current) {
      window.history.replaceState(window.history.state, '', '/auth/callback');
    }
  }, []);
  useEffect(() => {
    if (device.phase !== 'ready' || started.current) return;
    started.current = true;
    void (async () => {
      const url = callback.current ?? incoming ?? (await Linking.getInitialURL());
      if (!url) throw new Error('OAuth callback missing');
      const id = await finishOAuth(url);
      updateOnboarding((value) => ({ ...value, account: 'email', accountId: id }));
      router.replace(device.completed ? '/profile' : '/onboarding');
    })().catch(() => {
      setFailed(true);
    });
  }, [device.phase, device.completed, router, incoming]);
  const error = failed || device.phase === 'error';
  useEffect(() => {
    // On failure replace the route too: Expo may restore its initial query after hydration.
    // The original callback is consumed before replacing; successful flows navigate away.
    if (error && Platform.OS === 'web' && window.location.search) router.replace('/auth/callback');
  }, [error, router]);
  return (
    <ScrollView
      contentContainerStyle={{ padding: LAYOUT.screenPadding, paddingBottom: SPACE.xxxl }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: LAYOUT.maxContentWidth,
          alignSelf: 'center',
          gap: SPACE.m,
        }}
      >
        <AppText role="heading" aria-level={1} variant="title1">
          {t('auth.title')}
        </AppText>
        <AppText aria-live="polite">{t(error ? 'auth.oauthError' : 'auth.oauthWorking')}</AppText>
        {error ? (
          <Button
            label={t('auth.back')}
            onPress={() => {
              router.replace(device.completed ? '/account' : '/onboarding');
            }}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}
