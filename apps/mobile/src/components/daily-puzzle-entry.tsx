import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { View } from 'react-native';
import { SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
export function DailyPuzzleEntry() {
  const { t } = useTranslation();
  return (
    <Card>
      <View style={{ gap: SPACE.m }}>
        <AppText variant="title3">{t('puzzle.title')}</AppText>
        <AppText>{t('puzzle.entry')}</AppText>
        <Button
          label={t('puzzle.open')}
          onPress={() => {
            router.push('/daily-puzzle');
          }}
        />
      </View>
    </Card>
  );
}
