import { useCallback, useEffect, useState } from 'react';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { friendsRequestSchema } from '@harmonia/content';
import { AppState, Platform, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card, useUiTheme } from '@harmonia/ui/native';
import { useAuthState } from '@/auth';
import { changeFriends, refreshFriends, useFriends } from '@/state/friends';

const codeFrom = (input: string) =>
  input
    .trim()
    .split('invite=')
    .at(-1)
    ?.split(/[&#\s]/)[0] ?? '';
const validCode = (code: string) =>
  friendsRequestSchema.safeParse({ action: 'accept', token: code }).success;

export default function FriendsScreen() {
  const { t } = useTranslation();
  const { colors } = useUiTheme();
  const params = useLocalSearchParams<{ invite?: string }>();
  const actor = useAuthState((s) => s.session?.user.id ?? null);
  const state = useFriends();
  const view = actor && state.owner === actor ? state.view : null;
  const [input, setInput] = useState(typeof params.invite === 'string' ? params.invite : '');
  const [pending, setPending] = useState<{ action: 'remove' | 'block'; id: string } | null>(null);
  const code = codeFrom(input);
  const load = useCallback(() => {
    if (actor) void refreshFriends();
  }, [actor]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  useEffect(() => {
    setPending(null);
    setInput(typeof params.invite === 'string' ? params.invite : '');
  }, [actor, params.invite]);
  useEffect(() => {
    if (!actor) return;
    const timer = setInterval(load, 30000);
    const app = AppState.addEventListener('change', (next) => {
      if (next === 'active') load();
    });
    return () => {
      clearInterval(timer);
      app.remove();
    };
  }, [actor, load]);
  const inviteLink = view?.invite
    ? Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.origin + '/friends?invite=' + view.invite.token
      : 'harmonia://friends?invite=' + view.invite.token
    : '';
  const share = async () => {
    if (!view?.invite) return;
    const message = t('friends.shareMessage', { link: inviteLink, code: view.invite.token });
    const clipboard: Clipboard | undefined =
      Platform.OS === 'web' && typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
    if (clipboard) await clipboard.writeText(message);
    else await Share.share({ message });
  };
  const questFriend = view?.friends.find((f) => f.id === view.quest?.friendId);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('friends.title') }} />
      <View style={styles.content}>
        <AppText variant="title1">{t('friends.title')}</AppText>
        <AppText>{t('friends.rules')}</AppText>
        {!actor ? (
          <Card>
            <View style={styles.group}>
              <AppText>{t('friends.guest')}</AppText>
              <Button
                label={t('rush.account')}
                onPress={() => {
                  router.push('/account');
                }}
              />
            </View>
          </Card>
        ) : (
          <>
            {state.error ? (
              <AppText role="alert">
                {t(
                  state.error === 'auth'
                    ? 'friends.error_auth'
                    : state.error === 'missing'
                      ? 'friends.error_missing'
                      : state.error === 'retry'
                        ? 'friends.error_retry'
                        : state.error === 'limit'
                          ? 'friends.error_limit'
                          : state.error === 'quest_active'
                            ? 'friends.error_quest_active'
                            : 'friends.error_unavailable',
                )}
              </AppText>
            ) : null}
            {state.loading && !view ? <AppText>{t('friends.loading')}</AppText> : null}
            <Button
              label={t('friends.refresh')}
              variant="ghost"
              disabled={state.loading}
              onPress={load}
            />
            <Card>
              <View style={styles.group}>
                <AppText variant="title2">{t('friends.inviteTitle')}</AppText>
                <Button
                  label={t('friends.createInvite')}
                  disabled={state.loading}
                  onPress={() => void changeFriends({ action: 'invite', token: randomUUID() })}
                />
                {view?.invite ? (
                  <>
                    <AppText selectable>{view.invite.token}</AppText>
                    <AppText>
                      {t('friends.inviteExpiry', {
                        date: new Date(view.invite.expiresAt).toLocaleDateString(),
                      })}
                    </AppText>
                    <Button
                      label={t('friends.share')}
                      variant="secondary"
                      onPress={() => void share().catch(() => undefined)}
                    />
                  </>
                ) : null}
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel={t('friends.code')}
                  placeholder={t('friends.code')}
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.borderStrong,
                      backgroundColor: colors.surface,
                    },
                  ]}
                />
                <Button
                  label={t('friends.accept')}
                  disabled={!validCode(code) || state.loading}
                  onPress={() => void changeFriends({ action: 'accept', token: code })}
                />
              </View>
            </Card>
            <Card>
              <View style={styles.group}>
                <AppText variant="title2">{t('friends.listTitle')}</AppText>
                {!view?.friends.length ? <AppText>{t('friends.empty')}</AppText> : null}
                {view?.friends.map((friend, index) => (
                  <View key={friend.id} style={styles.group}>
                    <AppText variant="title3">{t('friends.friend', { count: index + 1 })}</AppText>
                    <AppText>
                      {t('friends.stats', { count: friend.streak, tier: friend.leagueTier })}
                    </AppText>
                    {!view.questUsed ? (
                      <Button
                        label={t('friends.startQuest')}
                        disabled={state.loading}
                        onPress={() => void changeFriends({ action: 'quest', friendId: friend.id })}
                      />
                    ) : null}
                    <View style={styles.actions}>
                      <Button
                        label={t('friends.remove')}
                        variant="ghost"
                        disabled={state.loading}
                        onPress={() => {
                          setPending({ action: 'remove', id: friend.id });
                        }}
                      />
                      <Button
                        label={t('friends.block')}
                        variant="ghost"
                        disabled={state.loading}
                        onPress={() => {
                          setPending({ action: 'block', id: friend.id });
                        }}
                      />
                    </View>
                    {pending?.id === friend.id ? (
                      <View style={styles.group}>
                        <AppText>
                          {t(
                            pending.action === 'block'
                              ? 'friends.confirmBlock'
                              : 'friends.confirmRemove',
                          )}
                        </AppText>
                        <View style={styles.actions}>
                          <Button
                            label={t('friends.confirm')}
                            disabled={state.loading}
                            onPress={() => {
                              void changeFriends({ action: pending.action, friendId: friend.id });
                              setPending(null);
                            }}
                          />
                          <Button
                            label={t('friends.cancel')}
                            variant="ghost"
                            onPress={() => {
                              setPending(null);
                            }}
                          />
                        </View>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </Card>
            <Card>
              <View style={styles.group}>
                <AppText variant="title2">{t('friends.questTitle')}</AppText>
                {view?.quest ? (
                  <>
                    <AppText>
                      {t('friends.questPartner', {
                        number: questFriend ? view.friends.indexOf(questFriend) + 1 : '?',
                      })}
                    </AppText>
                    <AppText>
                      {t('friends.questProgress', {
                        own: view.quest.ownXp,
                        friend: view.quest.friendXp,
                        target: view.quest.target,
                      })}
                    </AppText>
                    <AppText>
                      {t(view.quest.completed ? 'friends.questCompleted' : 'friends.questActive')}
                    </AppText>
                  </>
                ) : (
                  <AppText>
                    {t(view?.questUsed ? 'friends.questUsed' : 'friends.questEmpty')}
                  </AppText>
                )}
                <AppText>{t('friends.badges', { count: view?.badges ?? 0 })}</AppText>
              </View>
            </Card>
            {!!view?.blocked.length && (
              <Card>
                <View style={styles.group}>
                  <AppText variant="title2">{t('friends.blockedTitle')}</AppText>
                  {view.blocked.map((id, index) => (
                    <View key={id} style={styles.group}>
                      <AppText>{t('friends.blocked', { count: index + 1 })}</AppText>
                      <Button
                        label={t('friends.unblock')}
                        variant="ghost"
                        disabled={state.loading}
                        onPress={() => void changeFriends({ action: 'unblock', friendId: id })}
                      />
                    </View>
                  ))}
                </View>
              </Card>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: LAYOUT.screenPadding, paddingBottom: SPACE.xxxl },
  content: { width: '100%', maxWidth: LAYOUT.maxContentWidth, alignSelf: 'center', gap: SPACE.m },
  group: { gap: SPACE.m },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s },
  input: { borderWidth: 1, borderRadius: 8, padding: SPACE.m },
});
