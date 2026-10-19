import { availableExamTemplates } from '@harmonia/content';
import { catalogue, examTemplates } from '@harmonia/content/catalogue';
import { SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export function ExamEntry() {
  const { t } = useTranslation();
  if (availableExamTemplates(catalogue, examTemplates).length === 0) return null;
  return (
    <Card>
      <View style={{ gap: SPACE.m }}>
        <AppText variant="title3">{t('exam.title')}</AppText>
        <AppText>{t('exam.entry')}</AppText>
        <Button
          label={t('exam.open')}
          onPress={() => {
            router.push('/exam');
          }}
        />
      </View>
    </Card>
  );
}
