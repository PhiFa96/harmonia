import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RADIUS, SPACE, TOUCH, TYPOGRAPHY } from '@harmonia/ui';
import { AppText, Button, Card, useUiTheme } from '@harmonia/ui/native';
import { useLocale } from '@/i18n';
import {
  getAuthClient,
  sendEmailCode,
  validEmail,
  verifyEmailCode,
  useAuthState,
  initializeAuth,
} from '@/auth';

export function EmailSignIn({
  ageConfirmed,
  onVerified,
}: {
  readonly ageConfirmed: boolean;
  readonly onVerified: (userId: string) => void;
}) {
  const { t } = useTranslation(),
    locale = useLocale(),
    { colors } = useUiTheme(),
    auth = useAuthState();
  const [email, setEmail] = useState(''),
    [code, setCode] = useState(''),
    [sentTo, setSentTo] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<
      'invalidEmail' | 'invalidCode' | 'sendError' | 'verifyError' | null
    >(null),
    [availableAt, setAvailableAt] = useState(0),
    [remaining, setRemaining] = useState(0);
  const mounted = useRef(true),
    request = useRef(false),
    input = useRef<TextInput>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!availableAt) return;
    const tick = () => {
      setRemaining(Math.max(0, Math.ceil((availableAt - Date.now()) / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [availableAt]);
  useEffect(() => {
    if (sentTo) input.current?.focus();
  }, [sentTo]);
  let configured = false;
  try {
    configured = getAuthClient() !== null;
  } catch {
    /* Ungültige Konfiguration wird ohne Geheimnisse als nicht verfügbar angezeigt. */
  }
  if (!configured)
    return (
      <Card>
        <AppText>{t('auth.unavailable')}</AppText>
      </Card>
    );
  if (auth.error)
    return (
      <Card>
        <AppText tone="danger">{t('auth.sessionError')}</AppText>
        <Button
          label={t('onboarding.retry')}
          onPress={() => {
            void initializeAuth();
          }}
        />
      </Card>
    );
  if (!auth.ready) return <AppText aria-live="polite">{t('onboarding.loading')}</AppText>;
  if (auth.session)
    return (
      <Card>
        <AppText>{t('auth.signedIn', { email: auth.session.user.email ?? '' })}</AppText>
        <Button
          label={t('onboarding.continue')}
          disabled={!ageConfirmed}
          onPress={() => {
            if (ageConfirmed && auth.session) onVerified(auth.session.user.id);
          }}
        />
      </Card>
    );
  const send = async () => {
    if (request.current || !ageConfirmed || remaining > 0) return;
    const address = (sentTo ?? email).trim();
    if (!validEmail(address)) {
      setError('invalidEmail');
      return;
    }
    request.current = true;
    setBusy(true);
    setError(null);
    try {
      await sendEmailCode(address, locale);
      if (mounted.current) {
        setSentTo(address);
        setCode('');
        setAvailableAt(Date.now() + 60_000);
        setRemaining(60);
      }
    } catch {
      if (mounted.current) setError('sendError');
    } finally {
      request.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const verify = async () => {
    if (request.current || !ageConfirmed || !sentTo) return;
    if (!/^\d{6}$/.test(code)) {
      setError('invalidCode');
      return;
    }
    request.current = true;
    setBusy(true);
    setError(null);
    try {
      const session = await verifyEmailCode(sentTo, code);
      if (mounted.current) onVerified(session.user.id);
    } catch {
      if (mounted.current) setError('verifyError');
    } finally {
      request.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <View style={styles.form}>
      {sentTo ? (
        <>
          <AppText aria-live="polite">{t('auth.sent')}</AppText>
          <AppText variant="small">{sentTo}</AppText>
          <AppText>{t('auth.code')}</AppText>
          <TextInput
            ref={input}
            testID="email-code"
            accessibilityLabel={t('auth.code')}
            value={code}
            onChangeText={setCode}
            editable={!busy}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.borderStrong,
              },
            ]}
            onSubmitEditing={() => {
              void verify();
            }}
          />
          <Button
            label={t(busy ? 'auth.verifying' : 'auth.verify')}
            disabled={busy || !ageConfirmed}
            onPress={() => {
              void verify();
            }}
          />
          <Button
            variant="ghost"
            size="medium"
            label={remaining ? t('auth.resendWait', { seconds: remaining }) : t('auth.resend')}
            disabled={busy || !ageConfirmed || remaining > 0}
            onPress={() => {
              void send();
            }}
          />
          <Button
            variant="ghost"
            size="medium"
            label={t('auth.changeEmail')}
            disabled={busy}
            onPress={() => {
              setSentTo(null);
              setCode('');
              setError(null);
            }}
          />
        </>
      ) : (
        <>
          <AppText>{t('auth.email')}</AppText>
          <TextInput
            testID="email-address"
            accessibilityLabel={t('auth.email')}
            placeholder={t('auth.emailPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            editable={!busy}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={254}
            {...(Platform.OS === 'web' ? { inputMode: 'email' as const } : {})}
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.borderStrong,
              },
            ]}
            onSubmitEditing={() => {
              void send();
            }}
          />
          <AppText variant="footnote" tone="muted">
            {t('auth.privacy')}
          </AppText>
          <Button
            label={t(busy ? 'auth.sending' : 'auth.send')}
            disabled={busy || !ageConfirmed || remaining > 0}
            onPress={() => {
              void send();
            }}
          />
        </>
      )}
      {!ageConfirmed ? (
        <AppText variant="footnote" tone="muted">
          {t('auth.ageHint')}
        </AppText>
      ) : null}
      {error ? (
        <AppText role="alert" tone="danger">
          {t(`auth.${error}`)}
        </AppText>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  form: { gap: SPACE.m },
  input: {
    ...TYPOGRAPHY.body,
    minHeight: TOUCH.buttonLarge,
    padding: SPACE.m,
    borderRadius: RADIUS.input,
    borderWidth: 2,
  },
});
