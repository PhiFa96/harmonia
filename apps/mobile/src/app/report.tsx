import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { REPORT_CATEGORIES } from '@harmonia/content';
import type { ContentReport } from '@harmonia/content';
import { LAYOUT, RADIUS, SPACE, TYPOGRAPHY } from '@harmonia/ui';
import { AppText, Button, Card, MusicText, useUiTheme } from '@harmonia/ui/native';
import { useAuthState } from '@/auth';
import { initializeReports, saveReport, useReports } from '@/state/reports';
import { ReportStatus } from '@/components/report-status';

export default function ReportScreen() {
  const { t } = useTranslation(),
    router = useRouter(),
    state = useReports(),
    auth = useAuthState(),
    { colors } = useUiTheme();
  const [category, setCategory] = useState<ContentReport['category']>('question'),
    [message, setMessage] = useState(''),
    [saving, setSaving] = useState(false),
    [saved, setSaved] = useState(false),
    [error, setError] = useState(false);
  const inFlight = useRef(false),
    submission = useRef<ContentReport | null>(null);
  const owner = auth.session?.user.id ?? 'guest',
    draft = state.draft?.owner === owner ? state.draft : null;
  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('report.title') }} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
        <View style={styles.content}>
          {!draft ? (
            <AppText>{t('report.noDraft')}</AppText>
          ) : saved ? (
            <>
              <AppText variant="title2" aria-live="polite">
                {t('report.saved')}
              </AppText>
              <ReportStatus />
            </>
          ) : (
            <>
              <MusicText variant="title3">{draft.prompt}</MusicText>
              <AppText>{t('report.intro')}</AppText>
              <Card>
                <AppText>
                  {t(
                    state.memory
                      ? 'report.memory'
                      : owner === 'guest'
                        ? 'report.guest'
                        : 'report.account',
                  )}
                </AppText>
              </Card>
              <AppText variant="title3">{t('report.category')}</AppText>
              {REPORT_CATEGORIES.map((value) => (
                <Button
                  key={value}
                  size="medium"
                  variant={category === value ? 'secondary' : 'ghost'}
                  label={t(`report.category-${value}`)}
                  selected={category === value}
                  disabled={saving || submission.current !== null}
                  onPress={() => {
                    setCategory(value);
                  }}
                />
              ))}
              <AppText>{t('report.message')}</AppText>
              <TextInput
                accessibilityLabel={t('report.message')}
                multiline
                maxLength={2000}
                editable={!saving && submission.current === null}
                value={message}
                onChangeText={setMessage}
                placeholder={t('report.placeholder')}
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.borderStrong,
                    backgroundColor: colors.surface,
                  },
                ]}
              />
              <AppText variant="footnote" tone="muted">
                {t('report.privacy')}
              </AppText>
              {error ? (
                <AppText tone="danger" aria-live="polite">
                  {t('report.saveError')}
                </AppText>
              ) : null}
              {state.phase === 'error' ? (
                <>
                  <AppText tone="danger">{t('report.loadError')}</AppText>
                  <Button
                    label={t('report.retry')}
                    onPress={() => {
                      void initializeReports();
                    }}
                  />
                </>
              ) : null}
              <Button
                label={t(saving ? 'report.saving' : 'report.submit')}
                disabled={saving || state.phase !== 'ready' || state.scope !== owner}
                onPress={() => {
                  if (inFlight.current) return;
                  inFlight.current = true;
                  submission.current ??= { ...draft.report, category, message };
                  setSaving(true);
                  setError(false);
                  void saveReport(submission.current, draft.owner)
                    .then(() => {
                      setSaved(true);
                    })
                    .catch(() => {
                      setError(true);
                    })
                    .finally(() => {
                      inFlight.current = false;
                      setSaving(false);
                    });
                }}
              />
            </>
          )}
          <Button
            variant="ghost"
            label={t(saved ? 'report.back' : 'report.cancel')}
            disabled={saving}
            onPress={back}
          />
        </View>
      </ScrollView>
    </>
  );
}
const styles = StyleSheet.create({
  container: { padding: LAYOUT.screenPadding, paddingBottom: SPACE.xxxl },
  content: { width: '100%', maxWidth: LAYOUT.maxContentWidth, alignSelf: 'center', gap: SPACE.m },
  input: {
    ...TYPOGRAPHY.body,
    minHeight: SPACE.xxxl * 3,
    padding: SPACE.m,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
});
