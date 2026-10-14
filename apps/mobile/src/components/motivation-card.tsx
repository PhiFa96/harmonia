import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { SPACE } from '@harmonia/ui';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, ProgressBar } from '@harmonia/ui/native';
import { useAuthState } from '@/auth';
import { useLearningState } from '@/state/learning';
import {
  currentMotivation,
  useMotivation,
  buyFreeze,
  initializeMotivation,
  syncMotivation,
} from '@/state/motivation';
export function MotivationCard({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation(),
    state = useMotivation(),
    auth = useAuthState();
  useLearningState((s) => s.rows);
  const [, setNow] = useState(Date.now()),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => {
      clearInterval(timer);
    };
  }, []);
  if (state.scope !== (auth.session?.user.id ?? 'guest') || state.phase === 'loading') return null;
  if (state.phase === 'error')
    return (
      <Card>
        <AppText tone="danger">{t('motivation.loadError')}</AppText>
        <Button
          label={t('motivation.retry')}
          onPress={() => {
            void initializeMotivation();
          }}
        />
      </Card>
    );
  const view = currentMotivation(Date.now()),
    summary = view.summary,
    progress = t('motivation.dailyProgress', {
      xp: summary.todayXP,
      goal: view.preferences.dailyGoal,
    });
  return (
    <Card>
      <AppText variant="title3">{t('motivation.dailyTitle')}</AppText>
      {state.writeError ? (
        <AppText role="alert" tone="danger">
          {t('motivation.writeError')}
        </AppText>
      ) : null}
      <AppText variant="title2" aria-live="polite">
        {progress}
      </AppText>
      <ProgressBar
        label={t('motivation.dailyTitle')}
        value={Math.min(1, summary.todayXP / view.preferences.dailyGoal)}
        valueText={progress}
      />
      {compact ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.l }}>
            <AppText>{t('motivation.series', { count: summary.streak.current })}</AppText>
            <AppText>{t('motivation.coins', { count: summary.coins })}</AppText>
          </View>
          <Button
            variant="ghost"
            label={t('motivation.details')}
            onPress={() => {
              router.push('/profile');
            }}
          />
        </>
      ) : (
        <>
          <AppText>
            {t(
              summary.todayXP >= view.preferences.dailyGoal
                ? 'motivation.goalReached'
                : 'motivation.goalRemaining',
              { xp: Math.max(0, view.preferences.dailyGoal - summary.todayXP) },
            )}
          </AppText>
          <AppText variant="title3">
            {t('motivation.series', { count: summary.streak.current })}
          </AppText>
          <AppText>{t('motivation.longest', { count: summary.streak.longest })}</AppText>
          <AppText>{t('motivation.stock', { available: summary.streak.freezesAvailable })}</AppText>
          <AppText tone="muted">
            {t('motivation.nextFreeze', { count: summary.streak.daysUntilFreeze })}
          </AppText>
          <AppText variant="title3">{t('motivation.coins', { count: summary.coins })}</AppText>
          <AppText variant="footnote" tone="muted">
            {t('motivation.coinRules', {
              first: view.rule.newCoins,
              repeat: view.rule.repeatCoins,
            })}
          </AppText>
          <AppText variant="footnote" tone="muted">
            {t('motivation.protectionHint')}
          </AppText>
          <Button
            variant="secondary"
            label={t('motivation.buyFreeze', { cost: view.rule.freezePrice })}
            disabled={
              busy || summary.coins < view.rule.freezePrice || summary.streak.freezesAvailable >= 2
            }
            onPress={() => {
              if (busy) return;
              setBusy(true);
              setError(false);
              void buyFreeze()
                .catch(() => {
                  setError(true);
                })
                .finally(() => {
                  setBusy(false);
                });
            }}
          />
          {state.data?.purchases.some((p) => p.rejected) ? (
            <AppText tone="danger">{t('motivation.purchaseRejected')}</AppText>
          ) : null}
          {error ? <AppText tone="danger">{t('motivation.buyError')}</AppText> : null}
          {view.estimated ? (
            <AppText variant="footnote" tone="muted">
              {t('motivation.estimated')}
            </AppText>
          ) : null}
          {summary.streak.travel ? (
            <AppText variant="footnote" tone="muted">
              {t('motivation.travel')}
            </AppText>
          ) : null}
        </>
      )}
      {state.sync === 'error' ? (
        <>
          <AppText tone="danger">{t('motivation.syncError')}</AppText>
          <Button
            variant="ghost"
            label={t('motivation.retry')}
            onPress={() => {
              void syncMotivation();
            }}
          />
        </>
      ) : null}
    </Card>
  );
}
