import { TUTOR_REPORT_CATEGORIES } from '@harmonia/content';
import type { TutorReport } from '@harmonia/content';
import { RADIUS, SPACE, TYPOGRAPHY } from '@harmonia/ui';
import { AppText, BottomSheet, Button, useUiTheme } from '@harmonia/ui/native';
import { randomUUID } from 'expo-crypto';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { OnboardingChoices } from './onboarding-choices';
import { reportTutorAnswer } from '@/tutor/state';

export function TutorReportSheet({
  conversationId,
  messageId,
  onClose,
}: {
  readonly conversationId: string;
  readonly messageId: number;
  readonly onClose: () => void;
}) {
  const { t } = useTranslation(),
    { colors } = useUiTheme();
  const [category, setCategory] = useState<TutorReport['category']>('incorrect'),
    [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false),
    [saved, setSaved] = useState(false),
    [error, setError] = useState(false);
  const submission = useRef<TutorReport | null>(null),
    inFlight = useRef(false);
  return (
    <BottomSheet
      visible
      title={t('tutor.reportTitle')}
      closeLabel={t('tutor.cancel')}
      onClose={onClose}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          {saved ? (
            <AppText aria-live="polite">{t('tutor.reportSent')}</AppText>
          ) : (
            <>
              <AppText tone="muted">{t('tutor.reportBody')}</AppText>
              <OnboardingChoices
                label={t('report.category')}
                selected={category}
                disabled={saving || submission.current !== null}
                options={TUTOR_REPORT_CATEGORIES.map((value) => ({
                  value,
                  label: t(
                    value === 'other' ? 'tutor.reportCategoryOther' : `tutor.report_${value}`,
                  ),
                }))}
                onSelect={setCategory}
              />
              <TextInput
                accessibilityLabel={t('tutor.reportLabel')}
                value={message}
                onChangeText={setMessage}
                editable={!saving && submission.current === null}
                maxLength={2000}
                multiline
                textAlignVertical="top"
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.borderStrong,
                    backgroundColor: colors.background,
                  },
                ]}
              />
              {error ? (
                <AppText role="alert" tone="danger">
                  {t('tutor.reportError')}
                </AppText>
              ) : null}
              <Button
                label={t(saving ? 'tutor.reportSending' : 'tutor.reportSubmit')}
                disabled={saving}
                onPress={() => {
                  if (inFlight.current) return;
                  inFlight.current = true;
                  submission.current ??= {
                    id: randomUUID(),
                    conversationId,
                    messageId,
                    category,
                    message,
                  };
                  setSaving(true);
                  setError(false);
                  void reportTutorAnswer(submission.current)
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
          <Button variant="ghost" label={t('tutor.cancel')} onPress={onClose} />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
const styles = StyleSheet.create({
  content: { gap: SPACE.m, paddingBottom: SPACE.l },
  input: {
    ...TYPOGRAPHY.body,
    minHeight: SPACE.xxxl * 3,
    padding: SPACE.m,
    borderRadius: RADIUS.input,
    borderWidth: 1,
  },
});
