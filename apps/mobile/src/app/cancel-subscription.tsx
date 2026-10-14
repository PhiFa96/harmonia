import { useRef, useState } from 'react';
import { Linking, Platform, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useTranslation } from 'react-i18next';
import { LAYOUT, RADIUS, SPACE } from '@harmonia/ui';
import { AppText, Button, Card, useUiTheme } from '@harmonia/ui/native';
import { cancellationBodySchema, cancellationReceiptSchema } from '@harmonia/content';
import type { CancellationBody } from '@harmonia/content';
import { configuredAuth } from '@/auth/config';
import { legalConfig } from '@/legal/config';
import { useLocale } from '@/i18n';
export default function CancellationScreen() {
  const { t } = useTranslation(),
    locale = useLocale(),
    { colors } = useUiTheme();
  const [form, setForm] = useState<CancellationBody>({
    name: '',
    email: '',
    contract: '',
    tier: 'premium',
    kind: 'ordinary',
    reason: '',
    date: 'earliest',
    locale,
  });
  const [review, setReview] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<'schema' | 'send' | null>(null),
    [receipt, setReceipt] = useState<ReturnType<typeof cancellationReceiptSchema.parse> | null>(
      null,
    );
  const request = useRef<{ id: string; body: CancellationBody } | null>(null),
    lock = useRef(false);
  const change = (key: keyof CancellationBody, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    request.current = null;
    setError(null);
  };
  const check = () => {
    const parsed = cancellationBodySchema.safeParse(form);
    if (!parsed.success) {
      setError('schema');
      return;
    }
    setForm(parsed.data);
    setReview(true);
    setError(null);
  };
  const submit = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    request.current ??= { id: randomUUID(), body: cancellationBodySchema.parse(form) };
    try {
      const config = configuredAuth();
      if (!config) throw new Error('Cancellation unavailable');
      const response = await fetch(config.url + '/functions/v1/cancellation', {
        method: 'POST',
        headers: { apikey: config.key, 'Content-Type': 'application/json' },
        body: JSON.stringify(request.current),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('Cancellation unavailable');
      setReceipt(cancellationReceiptSchema.parse(await response.json()));
    } catch {
      setError('send');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const summary = () =>
    [
      t('cancellation.title'),
      t('cancellation.name') + ': ' + form.name,
      t('cancellation.email') + ': ' + form.email,
      t('cancellation.contract') + ': ' + form.contract,
      t(`billing.tier_${form.tier}`),
      t(`cancellation.${form.kind}`),
      t('cancellation.date') +
        ': ' +
        (form.date === 'earliest' ? t('cancellation.earliest') : form.date),
      form.reason,
    ]
      .filter(Boolean)
      .join('\n');
  const download = () => {
    if (!receipt) return;
    const text =
      summary() +
      '\n' +
      t('cancellation.receipt', { id: receipt.id, time: receipt.receivedAt }) +
      '\n' +
      t('cancellation.receivedBody');
    if (Platform.OS === 'web') {
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'harmonia-cancellation-' + receipt.id + '.txt';
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } else
      void Share.share({ message: text }).catch(() => {
        setError('send');
      });
  };
  const input = (key: 'name' | 'email' | 'contract' | 'reason' | 'date') => (
    <View style={styles.field} key={key}>
      <AppText>{t(`cancellation.${key}`)}</AppText>
      <TextInput
        accessibilityLabel={t(`cancellation.${key}`)}
        value={key === 'date' && form.date === 'earliest' ? '' : form[key]}
        placeholder={key === 'date' ? t('cancellation.earliest') : undefined}
        onChangeText={(value) => {
          change(key, value);
        }}
        maxLength={key === 'reason' ? 2000 : key === 'name' ? 200 : 256}
        keyboardType={key === 'email' ? 'email-address' : 'default'}
        autoCapitalize={key === 'email' ? 'none' : 'sentences'}
        multiline={key === 'reason'}
        style={[
          styles.input,
          { borderColor: colors.borderStrong, color: colors.text, backgroundColor: colors.surface },
        ]}
      />
    </View>
  );
  const privacy = legalConfig();
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('cancellation.title') }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <AppText variant="title1">{t('cancellation.title')}</AppText>
          <AppText>{t('cancellation.body')}</AppText>
          {receipt ? (
            <Card>
              <AppText variant="title2">{t('cancellation.received')}</AppText>
              <AppText>
                {t('cancellation.receipt', {
                  id: receipt.id,
                  time: new Date(receipt.receivedAt).toLocaleString(locale),
                })}
              </AppText>
              <AppText>{t('cancellation.receivedBody')}</AppText>
              <AppText>{summary()}</AppText>
              <Button label={t('cancellation.download')} onPress={download} />
            </Card>
          ) : review ? (
            <>
              <Card>
                <AppText variant="title2">{t('cancellation.review')}</AppText>
                <AppText>{summary()}</AppText>
                <AppText>{t('cancellation.reviewBody')}</AppText>
              </Card>
              <Button
                label={t('cancellation.submit')}
                disabled={busy}
                onPress={() => void submit()}
              />
              <Button
                variant="ghost"
                label={t('cancellation.edit')}
                disabled={busy}
                onPress={() => {
                  setReview(false);
                }}
              />
            </>
          ) : (
            <>
              {input('name')}
              {input('email')}
              {input('contract')}
              <AppText>{t('cancellation.product')}</AppText>
              <View style={styles.buttons}>
                {(['premium', 'max'] as const).map((tier) => (
                  <Button
                    key={tier}
                    variant={form.tier === tier ? 'primary' : 'secondary'}
                    label={t(`billing.tier_${tier}`)}
                    onPress={() => {
                      change('tier', tier);
                    }}
                  />
                ))}
              </View>
              <View style={styles.buttons}>
                {(['ordinary', 'extraordinary'] as const).map((kind) => (
                  <Button
                    key={kind}
                    variant={form.kind === kind ? 'primary' : 'secondary'}
                    label={t(`cancellation.${kind}`)}
                    onPress={() => {
                      change('kind', kind);
                    }}
                  />
                ))}
              </View>
              {form.kind === 'extraordinary' ? input('reason') : null}
              <AppText>{t('cancellation.dateBody')}</AppText>
              <Button
                variant="secondary"
                label={t('cancellation.earliest')}
                onPress={() => {
                  change('date', 'earliest');
                }}
              />
              {input('date')}
              <Button label={t('cancellation.continue')} onPress={check} />
            </>
          )}
          {error ? <AppText role="alert">{t(`cancellation.error_${error}`)}</AppText> : null}
          {busy ? <AppText aria-live="polite">{t('cancellation.sending')}</AppText> : null}
          <Button
            variant="ghost"
            label={t('paywall.privacy')}
            disabled={!(locale === 'de' ? privacy.privacyDe : privacy.privacyEn)}
            onPress={() => {
              const url = locale === 'de' ? privacy.privacyDe : privacy.privacyEn;
              if (url)
                void Linking.openURL(url).catch(() => {
                  setError('send');
                });
            }}
          />
        </View>
      </ScrollView>
    </>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: LAYOUT.screenPadding },
  content: { width: '100%', maxWidth: LAYOUT.maxContentWidth, alignSelf: 'center', gap: SPACE.m },
  field: { gap: SPACE.s },
  input: { borderWidth: 1, borderRadius: RADIUS.input, padding: SPACE.m },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s },
});
