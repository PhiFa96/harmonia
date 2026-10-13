import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button } from '@harmonia/ui/native';
import { Stack, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { EmailSignIn } from '@/components/email-sign-in';
import { DeviceStatus } from '@/components/device-status';
import { updateOnboarding, useDeviceState } from '@/state/device';
export default function AccountScreen() {
  const { t } = useTranslation(),
    router = useRouter(),
    data = useDeviceState((s) => s.data);
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('auth.title') }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <EmailSignIn
            ageConfirmed={data?.ageConfirmed ?? false}
            onVerified={(accountId) => {
              updateOnboarding((d) => ({ ...d, account: 'email', accountId }));
              router.replace('/profile');
            }}
          />
          <AppText variant="footnote" tone="muted">
            {t('onboarding.localProgress')}
          </AppText>
          <DeviceStatus />
          <Button
            variant="ghost"
            label={t('auth.back')}
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
