import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { View } from 'react-native';
import { SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
export function RushEntry() {
  const { t } = useTranslation();
  return (
    <Card>
      <View style={{ gap: SPACE.m }}>
        <AppText variant="title3">{t('rush.title')}</AppText>
        <AppText>{t('rush.entry')}</AppText>
        <Button
          label={t('rush.open')}
          onPress={() => {
            router.push('/rush');
          }}
        />
      </View>
    </Card>
  );
}
