import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { AccessibilityInfo, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { currentPlacementTask, PLACEMENT_MAX } from '@harmonia/exercises';
import {
  bank,
  discardPlacement,
  dispatchPlacement,
  initializePlacement,
  selectPlacement,
  startPlacement,
  startTemporaryPlacement,
  usePlacementState,
} from '@/state/placement';
import { resumePlacement } from '@/placement/model';
import type { PlacementReplay } from '@/placement/model';
import { useContentText } from '@/content/use-content-text';
import { ExerciseTask } from '@/components/exercise-task';
import { PlacementResults } from '@/components/placement-results';
import { PlacementStatus } from '@/components/placement-status';
import { useAuthState } from '@/auth';
import { initializeLearning, startTemporaryLearning, useLearningState } from '@/state/learning';

export default function PlacementScreen() {
  const { t } = useTranslation(),
    learning = useLearningState(),
    owner = useAuthState((s) => s.session?.user.id ?? 'guest');
  if (learning.phase !== 'ready' || learning.scope !== owner)
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: t('placement.title') }} />
        <Card>
          <AppText>{t(learning.phase === 'error' ? 'path.loadError' : 'path.loading')}</AppText>
        </Card>
        {learning.phase === 'error' ? (
          <>
            <Button
              label={t('onboarding.retry')}
              onPress={() => {
                void initializeLearning();
              }}
            />
            <Button
              variant="ghost"
              label={t('onboarding.temporary')}
              onPress={startTemporaryLearning}
            />
          </>
        ) : null}
      </View>
    );
  return <OwnedPlacementScreen key={owner} />;
}
function OwnedPlacementScreen() {
  const { t } = useTranslation(),
    text = useContentText(),
    router = useRouter(),
    store = usePlacementState();
  const scroll = useRef<ScrollView>(null),
    question = useRef<View>(null);
  useEffect(() => {
    void initializePlacement();
  }, []);
  const snapshot = store.data.active ?? store.data.last;
  const replay = useRef<PlacementReplay | undefined>(undefined);
  const restored = useMemo(() => {
    if (!snapshot || !bank.areas.length) return { state: null, error: false };
    try {
      replay.current = resumePlacement(bank, snapshot, replay.current);
      return { state: replay.current.state, error: false };
    } catch {
      return { state: null, error: true };
    }
  }, [snapshot]);
  const state = restored.state,
    task = state ? currentPlacementTask(state) : undefined,
    item = task?.session.items[0];
  const area = bank.areas.find((a) => a.id === task?.areaId);
  useFocusEffect(
    useCallback(() => {
      scroll.current?.scrollTo({ y: 0, animated: false });
      if (Platform.OS === 'web')
        (question.current as unknown as HTMLElement | null)?.focus({ preventScroll: true });
      else AccessibilityInfo.announceForAccessibility(t('placement.title'));
    }, [state?.index, state?.ended, restored.error]),
  );
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  const progress = t('placement.progress', {
    current: (state?.index ?? 0) + 1,
    max: PLACEMENT_MAX,
  });
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('placement.title') }} />
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.container}
      >
        <View style={styles.content}>
          {store.phase !== 'ready' ? (
            <Card>
              <AppText role={store.phase === 'error' ? 'alert' : undefined}>
                {t(store.phase === 'error' ? 'placement.loadError' : 'onboarding.loading')}
              </AppText>
              {store.phase === 'error' ? (
                <Button
                  label={t('onboarding.retry')}
                  onPress={() => {
                    void initializePlacement();
                  }}
                />
              ) : null}
            </Card>
          ) : !bank.areas.length ? (
            <Card>
              <AppText>{t('placement.unavailable')}</AppText>
            </Card>
          ) : restored.error ? (
            <>
              <Card>
                <AppText role="alert">{t('placement.changed')}</AppText>
              </Card>
              <Button
                label={t('placement.restart')}
                onPress={() => {
                  startPlacement();
                }}
              />
              <Button
                variant="ghost"
                label={t('onboarding.temporary')}
                onPress={startTemporaryPlacement}
              />
              {store.data.active ? (
                <Button variant="ghost" label={t('placement.discard')} onPress={discardPlacement} />
              ) : null}
            </>
          ) : state?.ended ? (
            <>
              <PlacementResults state={state} />
              <Button
                variant="secondary"
                label={t('placement.retake')}
                onPress={() => {
                  startPlacement();
                }}
              />
            </>
          ) : task && item ? (
            <>
              <AppText variant="overline" tone="muted">
                {area ? text(area.titleKey) : t('placement.title')}
              </AppText>
              <ExerciseTask
                key={`${state?.seed ?? ''}:${String(state?.index)}`}
                session={task.session}
                item={item}
                answer={snapshot?.answer ?? null}
                question={question}
                scroll={scroll}
                progressText={progress}
                progressLabel={t('placement.progressLabel')}
                progressValue={(state?.index ?? 0) / PLACEMENT_MAX}
                hearingPausedText={t('placement.hearingPaused')}
                continueLabel={t('onboarding.continue')}
                onSelect={selectPlacement}
                onCheck={(answer) => {
                  dispatchPlacement({ type: 'answer', answer });
                }}
                onHint={() => {
                  dispatchPlacement({ type: 'hint' });
                }}
                onSkip={() => {
                  dispatchPlacement({ type: 'skip' });
                }}
                onNext={() => {
                  dispatchPlacement({ type: 'next' });
                }}
              />
              <Button variant="ghost" size="medium" label={t('placement.pause')} onPress={close} />
              <Button
                variant="ghost"
                size="medium"
                label={t('placement.finishEarly')}
                onPress={() => {
                  dispatchPlacement({ type: 'finish' });
                }}
              />
              <AppText variant="footnote" tone="muted">
                {t('placement.pauseHint')}
              </AppText>
            </>
          ) : (
            <>
              <View ref={question} {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})}>
                <AppText variant="title1">{t('placement.title')}</AppText>
              </View>
              <AppText>{t('placement.intro')}</AppText>
              <Card>
                <AppText>{t('placement.rules')}</AppText>
              </Card>
              <Button
                label={t('placement.start')}
                onPress={() => {
                  startPlacement();
                }}
              />
            </>
          )}
          <PlacementStatus />
          <Button variant="secondary" label={t('placement.close')} onPress={close} />
        </View>
      </ScrollView>
    </>
  );
}
const styles = StyleSheet.create({
  container: { padding: LAYOUT.screenPadding, paddingBottom: SPACE.xxxl },
  content: { width: '100%', maxWidth: LAYOUT.maxContentWidth, alignSelf: 'center', gap: SPACE.m },
});
