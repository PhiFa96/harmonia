import { catalogue } from '@harmonia/content/catalogue';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
export function ChoirEntry() {
  const { t } = useTranslation();
  if (!catalogue.lessons.some((l) => l.id.startsWith('aural.l4.choir.') && l.status === 'entwurf'))
    return null;
  return (
    <Card>
      <AppText variant="title3">{t('exercise.type_CHOIR_PART')}</AppText>
      <AppText>{t('exercise.choirDraft')}</AppText>
      <Button
        label={t('exercise.choirOpen')}
        onPress={() => {
          router.push('/choir');
        }}
      />
    </Card>
  );
}
