import { catalogue } from '@harmonia/content/catalogue';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

export const levelFiveDraftLessons = () =>
  catalogue.lessons.filter(
    (lesson) =>
      /^(counterpoint|forms|analysis|contemporary|world)\.l5\./.test(lesson.id) &&
      lesson.status === 'entwurf',
  );
export function LevelFiveEntry() {
  const { t } = useTranslation();
  if (!levelFiveDraftLessons().length) return null;
  return (
    <Card>
      <AppText variant="title3">{t('exercise.levelFiveTitle')}</AppText>
      <AppText>{t('exercise.levelFiveDraft')}</AppText>
      <Button
        label={t('exercise.levelFiveOpen')}
        onPress={() => {
          router.push('/level-five');
        }}
      />
    </Card>
  );
}
