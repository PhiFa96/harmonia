import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, ListGroup, ListItem } from '@harmonia/ui/native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { OnboardingChoices } from '@/components/onboarding-choices';
import { DeviceStatus } from '@/components/device-status';
import { updateOnboarding, useDeviceState } from '@/state/device';
import { PlacementEntry } from '@/components/placement-entry';

export default function PreferencesScreen() {
  const { t } = useTranslation(),
    router = useRouter(),
    data = useDeviceState((s) => s.data);
  if (!data) return null;
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('onboarding.editTitle') }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <AppText tone="muted">{t('onboarding.editBody')}</AppText>
          <AppText variant="title2">{t('onboarding.goalTitle')}</AppText>
          <OnboardingChoices
            label={t('onboarding.goalTitle')}
            selected={data.goal}
            options={(['hobby', 'school', 'exam', 'ensemble'] as const).map((value) => ({
              value,
              label: t(`onboarding.goal_${value}`),
            }))}
            onSelect={(goal) => {
              updateOnboarding((d) => ({ ...d, goal }));
            }}
          />
          <AppText variant="title2">{t('onboarding.experienceTitle')}</AppText>
          <OnboardingChoices
            label={t('onboarding.experienceTitle')}
            selected={data.experience}
            options={(['new', 'basics', 'experienced'] as const).map((value) => ({
              value,
              label: t(`onboarding.experience_${value}`),
            }))}
            onSelect={(experience) => {
              updateOnboarding((d) => ({ ...d, experience }));
            }}
          />
          <AppText variant="title2">{t('onboarding.profileDaily')}</AppText>
          <OnboardingChoices
            label={t('onboarding.profileDaily')}
            selected={data.dailyGoal}
            options={([10, 20, 30, 50] as const).map((value) => ({
              value,
              label: t('onboarding.dailyOption', { count: value }),
            }))}
            onSelect={(dailyGoal) => {
              updateOnboarding((d) => ({ ...d, dailyGoal }));
            }}
          />
          <AppText variant="title2">{t('onboarding.profilePlacement')}</AppText>
          <OnboardingChoices
            label={t('onboarding.profilePlacement')}
            selected={data.placement}
            options={(['later', 'requested'] as const).map((value) => ({
              value,
              label: t(`onboarding.placement_${value}`),
            }))}
            onSelect={(placement) => {
              updateOnboarding((d) => ({ ...d, placement }));
            }}
          />
          <AppText variant="footnote" tone="muted">
            {t('onboarding.placementHint')}
          </AppText>
          <PlacementEntry />
          <AppText variant="title2">{t('onboarding.profileReminder')}</AppText>
          <ListGroup>
            <ListItem
              label={t('onboarding.reminderConsent')}
              toggle={{
                value: data.reminderConsent,
                onValueChange: (reminderConsent) => {
                  updateOnboarding((d) => ({ ...d, reminderConsent }));
                },
              }}
              last
            />
          </ListGroup>
          <AppText variant="footnote" tone="muted">
            {t('onboarding.reminderHint')}
          </AppText>
          {data.reminderConsent ? (
            <OnboardingChoices
              label={t('onboarding.reminderTime')}
              selected={data.reminderTime}
              options={(['17:00', '18:00', '19:00', '20:00'] as const).map((value) => ({
                value,
                label: t('onboarding.timeOption', { time: value }),
              }))}
              onSelect={(reminderTime) => {
                updateOnboarding((d) => ({ ...d, reminderTime }));
              }}
            />
          ) : null}
          <DeviceStatus />
          <Button
            label={t('onboarding.done')}
            onPress={() => {
              router.replace('/profile');
            }}
          />
        </View>
      </ScrollView>
    </>
  );
}
const styles = StyleSheet.create({
  container: { padding: LAYOUT.screenPadding, paddingBottom: SPACE.xxxl },
  content: { width: '100%', maxWidth: LAYOUT.maxContentWidth, alignSelf: 'center', gap: SPACE.m },
});
