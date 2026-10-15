import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
export default function NotFoundScreen() {
  const { t } = useTranslation(),
    router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: t('quality.notFound'), headerShown: true }} />
      <View style={styles.container}>
        <Card>
          <AppText variant="title1">{t('quality.notFound')}</AppText>
          <AppText>{t('quality.notFoundBody')}</AppText>
          <Button
            label={t('quality.home')}
            onPress={() => {
              router.replace('/');
            }}
          />
        </Card>
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: LAYOUT.screenPadding,
    gap: SPACE.m,
    maxWidth: LAYOUT.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
  },
});
