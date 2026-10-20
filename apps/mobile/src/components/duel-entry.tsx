import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { View } from 'react-native';
import { SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
export function DuelEntry() {
  const { t } = useTranslation();
  return (
    <Card>
      <View style={{ gap: SPACE.m }}>
        <AppText variant="title3">{t('duel.title')}</AppText>
        <AppText>{t('duel.entry')}</AppText>
        <Button
          label={t('duel.open')}
          onPress={() => {
            router.push('/duel');
          }}
        />
      </View>
    </Card>
  );
}
