import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { View } from 'react-native';
import { SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
export function FriendsEntry() {
  const { t } = useTranslation();
  return (
    <Card>
      <View style={{ gap: SPACE.m }}>
        <AppText variant="title3">{t('friends.title')}</AppText>
        <AppText>{t('friends.entry')}</AppText>
        <Button
          label={t('friends.open')}
          onPress={() => {
            router.push('/friends');
          }}
        />
      </View>
    </Card>
  );
}
