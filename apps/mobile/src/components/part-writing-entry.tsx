import { catalogue } from '@harmonia/content/catalogue';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
export function PartWritingEntry() {
  const { t } = useTranslation();
  if (
    !catalogue.lessons.some((l) => /^satz\.l[45]\.writing\./.test(l.id) && l.status === 'entwurf')
  )
    return null;
  return (
    <Card>
      <AppText variant="title3">{t('exercise.type_VOICE_LEADING')}</AppText>
      <AppText>{t('exercise.satbDraft')}</AppText>
      <Button
        label={t('exercise.satbOpen')}
        onPress={() => {
          router.push('/part-writing');
        }}
      />
    </Card>
  );
}
