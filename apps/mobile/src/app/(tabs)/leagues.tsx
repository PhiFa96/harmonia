import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LEAGUE_LEVELS, leagueOutcome } from '@harmonia/content';
import { formatDate, formatNumber } from '@harmonia/i18n';
import { LAYOUT, SPACE, RADIUS } from '@harmonia/ui';
import { AppText, Button, Card, ListGroup, ListItem, useUiTheme } from '@harmonia/ui/native';
import { useLocale } from '@/i18n';
import { useAuthState } from '@/auth';
import { useDeviceState } from '@/state/device';
import { useMotivation, syncMotivation } from '@/state/motivation';
import { usePrivacy } from '@/privacy/state';
import { optInReminders, reconcileReminders } from '@/reminders';
import {
  useLeagues,
  refreshLeagues,
  changeLeagueConsent,
  acknowledgeLeagueResult,
} from '@/state/leagues';

export default function LeaguesScreen() {
  const { t } = useTranslation(),
    locale = useLocale(),
    { colors } = useUiTheme();
  const owner = useAuthState((s) => s.session?.user.id ?? null);
  const state = useLeagues(),
    motivation = useMotivation(),
    privacy = usePrivacy();
  const memory = useDeviceState((s) => s.storage === 'memory');
  const [busy, setBusy] = useState(false),
    [failed, setFailed] = useState(false);
  const data = state.owner === owner ? state.data : null;
  useFocusEffect(
    useCallback(() => {
      void refreshLeagues();
    }, []),
  );
  const perform = (work: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    void work()
      .catch(() => {
        setFailed(true);
      })
      .finally(() => {
        setBusy(false);
      });
  };
  const date = (value: string) =>
    formatDate(new Date(value + 'T00:00:00Z'), locale, { dateStyle: 'medium', timeZone: 'UTC' });
  const level = (tier: number) => t(`leagues.level_${LEAGUE_LEVELS[tier] ?? 'pp'}`);
  const cohort = data?.cohort;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <AppText variant="title1">{t('leagues.title')}</AppText>
        <AppText tone="muted">{t('leagues.intro')}</AppText>
        {!owner ? (
          <Card>
            <View style={styles.content}>
              <AppText variant="title2">{t('leagues.guestTitle')}</AppText>
              <AppText>{t('leagues.guest')}</AppText>
              <Button
                label={t('leagues.account')}
                onPress={() => {
                  router.push('/account');
                }}
              />
            </View>
          </Card>
        ) : (
          <>
            {state.loading ? <AppText aria-live="polite">{t('leagues.loading')}</AppText> : null}
            {state.error && state.owner === owner ? (
              <AppText role="alert">{t('leagues.error')}</AppText>
            ) : null}
            {data ? (
              <>
                {state.error ? <AppText>{t('leagues.stale')}</AppText> : null}
                {data.result ? (
                  <Card>
                    <View style={styles.content}>
                      <AppText variant="title2">{t('leagues.resultTitle')}</AppText>
                      <AppText>
                        {t('leagues.result', {
                          date: date(data.result.weekStart),
                          rank: formatNumber(data.result.rank, locale),
                          xp: formatNumber(data.result.xp, locale),
                        })}
                      </AppText>
                      <AppText>
                        {t(`leagues.result_${data.result.outcome}`, {
                          level: level(data.result.nextTier),
                        })}
                      </AppText>
                      {!data.result.seen ? (
                        <Button
                          disabled={busy}
                          label={t('leagues.ack')}
                          onPress={() => {
                            const result = data.result;
                            if (result) perform(() => acknowledgeLeagueResult(result.weekStart));
                          }}
                        />
                      ) : null}
                    </View>
                  </Card>
                ) : null}
                <Card>
                  <View style={styles.content}>
                    <AppText variant="title2">{level(data.tier)}</AppText>
                    <AppText>
                      {t('leagues.week', {
                        start: date(data.weekStart),
                        end: date(
                          new Date(Date.parse(data.weekEnd) - 86400000).toISOString().slice(0, 10),
                        ),
                      })}
                    </AppText>
                    <AppText variant="footnote">
                      {t('leagues.boundary', {
                        date: formatDate(new Date(data.weekEnd + 'T00:00:00Z'), locale, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }),
                      })}
                    </AppText>
                    {cohort ? (
                      <>
                        <AppText>{t('leagues.group', { count: cohort.entries.length })}</AppText>
                        {cohort.entries.map((entry) => {
                          const outcome = leagueOutcome(
                            entry.rank,
                            cohort.entries.length,
                            data.tier,
                            cohort.movement,
                          );
                          return (
                            <View
                              key={entry.slot}
                              style={[
                                styles.row,
                                {
                                  backgroundColor: entry.isYou ? colors.primarySoft : colors.sunken,
                                },
                              ]}
                            >
                              <AppText variant={entry.isYou ? 'title3' : 'body'}>
                                {t('leagues.row', {
                                  rank: formatNumber(entry.rank, locale),
                                  xp: formatNumber(entry.xp, locale),
                                  name: entry.isYou
                                    ? t('leagues.you')
                                    : t('leagues.alias', {
                                        number: formatNumber(entry.slot, locale),
                                      }),
                                })}
                              </AppText>
                              <AppText variant="footnote" tone="muted">
                                {t(`leagues.row_${outcome}`)}
                              </AppText>
                            </View>
                          );
                        })}
                        <AppText variant="footnote">{t('leagues.forecast')}</AppText>
                        <AppText>{t('leagues.rules', { count: cohort.movement })}</AppText>
                      </>
                    ) : (
                      <AppText>{t('leagues.empty')}</AppText>
                    )}
                    <AppText variant="footnote">{t('leagues.xpRule')}</AppText>
                  </View>
                </Card>
                <AppText>{t('leagues.privacy')}</AppText>
                <AppText variant="title2">{t('leagues.pushTitle')}</AppText>
                <AppText>{t('leagues.pushBody')}</AppText>
                {Platform.OS === 'web' ? (
                  <AppText tone="muted">{t('leagues.pushWeb')}</AppText>
                ) : memory ? (
                  <AppText>{t('leagues.pushUnavailable')}</AppText>
                ) : (
                  <>
                    <ListGroup>
                      <ListItem
                        last
                        icon="bell"
                        label={t('leagues.pushTitle')}
                        toggle={{
                          value: data.pushConsent && privacy.choices.push,
                          onValueChange: (enabled) => {
                            perform(async () => {
                              if (enabled) await optInReminders('league');
                              else await changeLeagueConsent(false);
                              await syncMotivation();
                              await reconcileReminders();
                            });
                          },
                        }}
                      />
                    </ListGroup>
                    {motivation.permission === 'denied' ? (
                      <>
                        <AppText>{t('leagues.pushPermission')}</AppText>
                        <Button
                          variant="secondary"
                          label={t('motivation.openSettings')}
                          onPress={() => {
                            void Linking.openSettings().catch(() => undefined);
                          }}
                        />
                      </>
                    ) : null}
                    {data.pushConsent &&
                    privacy.choices.push &&
                    motivation.permission === 'unknown' ? (
                      <Button
                        disabled={busy}
                        label={t('motivation.allowNotifications')}
                        onPress={() => {
                          perform(() => optInReminders('league'));
                        }}
                      />
                    ) : null}
                    {data.pushConsent && privacy.choices.push ? (
                      <AppText variant="footnote">
                        {t(
                          motivation.scope === owner && motivation.data?.server?.pushRegistered
                            ? 'leagues.pushRegistered'
                            : 'leagues.pushPending',
                        )}
                      </AppText>
                    ) : null}
                  </>
                )}
              </>
            ) : null}
            <Button
              variant="secondary"
              disabled={state.loading}
              label={t('leagues.refresh')}
              onPress={() => {
                void refreshLeagues();
              }}
            />
            {failed ? <AppText role="alert">{t('leagues.actionError')}</AppText> : null}
          </>
        )}
        <Card>
          <View style={styles.content}>
            <AppText variant="title2">{t('leagues.levelsTitle')}</AppText>
            <AppText>{t('leagues.levelsBody')}</AppText>
            {LEAGUE_LEVELS.map((symbol, tier) => (
              <View key={symbol} style={styles.level}>
                <AppText variant="title3">{level(tier)}</AppText>
                <AppText tone="muted">{t(`leagues.meaning_${symbol}`)}</AppText>
              </View>
            ))}
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: LAYOUT.screenPadding, paddingBottom: SPACE.xxxl },
  content: { width: '100%', maxWidth: LAYOUT.maxContentWidth, alignSelf: 'center', gap: SPACE.m },
  row: { gap: SPACE.xs, padding: SPACE.m, borderRadius: RADIUS.input },
  level: { gap: SPACE.xs },
});
