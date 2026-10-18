import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';

export function TunerEntry() {
  const { t } = useTranslation();
  return (
    <Card>
      <View style={{ gap: SPACE.m }}>
        <AppText variant="title3">{t('tuner.title')}</AppText>
        <AppText>{t('tuner.entry')}</AppText>
        <Button
          label={t('tuner.open')}
          onPress={() => {
            router.push('/tuner');
          }}
        />
      </View>
    </Card>
  );
}
