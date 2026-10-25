import { useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { catalogue } from '@harmonia/content/catalogue';
import { activeLessonSession, currentItem, lessonSummary } from '@harmonia/exercises';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { ExerciseTask } from '@/components/exercise-task';
import { LessonIntroduction } from '@/components/lesson-introduction';
import { levelFiveDraftLessons } from '@/components/level-five-entry';
import { useContentText } from '@/content/use-content-text';
import { useLevelFivePreview } from '@/preview/use-level-five-preview';
import { useAuthState } from '@/auth';
import { useDeviceState } from '@/state/device';

/** Owner changes unmount the old preview immediately; pending writes retain their old owner. */
export default function LevelFiveScreen() {
  const owner = useAuthState((s) => s.session?.user.id ?? 'guest');
  const memory = useDeviceState((s) => s.storage === 'memory');
  return <LevelFivePreview key={`${owner}:${String(memory)}`} owner={owner} memory={memory} />;
}
function LevelFivePreview({ owner, memory }: { readonly owner: string; readonly memory: boolean }) {
  const { t } = useTranslation(),
    text = useContentText();
  const flow = useLevelFivePreview(owner, memory),
    lessons = levelFiveDraftLessons();
  const scroll = useRef<ScrollView>(null),
    question = useRef<View>(null);
  const top = () => scroll.current?.scrollTo({ y: 0, animated: false });
  const content = flow.opened && !flow.problem ? flow.state?.lesson : null;
  const lesson = content ? flow.state?.session : null;
  const session = lesson ? activeLessonSession(lesson) : undefined;
  const item = session ? currentItem(session) : undefined;
  const summary = lesson ? lessonSummary(lesson) : undefined;
  const problemKey = {
    load: 'levelFiveLoadError',
    save: 'levelFiveSaveError',
    outdated: 'levelFiveOutdated',
    conflict: 'levelFiveConflict',
  } as const;
  return (
    <ScrollView
      ref={scroll}
      tabIndex={0}
      aria-label={t('exercise.levelFiveTitle')}
      contentContainerStyle={{
        padding: SPACE.l,
        gap: SPACE.m,
        maxWidth: LAYOUT.maxContentWidth,
        width: '100%',
        alignSelf: 'center',
      }}
    >
      <Stack.Screen options={{ headerShown: true, title: t('exercise.levelFiveTitle') }} />
      {!lessons.length ? (
        <AppText>{t('learn.unavailable')}</AppText>
      ) : (
        <>
          <AppText variant="title1">{t('exercise.levelFiveTitle')}</AppText>
          <AppText role="note">{t('exercise.levelFiveDraft')}</AppText>
          <AppText tone="muted">{t('exercise.levelFiveInternal')}</AppText>
          <AppText role="status">
            {t(
              `exercise.${flow.busy ? 'levelFiveSaving' : memory ? 'levelFiveMemory' : flow.stored ? 'levelFiveSaved' : 'levelFiveEmpty'}`,
            )}
          </AppText>
          {flow.problem ? (
            <Card>
              <AppText role="alert">{t(`exercise.${problemKey[flow.problem]}`)}</AppText>
              <Button
                disabled={flow.busy}
                label={t('exercise.levelFiveReload')}
                onPress={() => {
                  void flow.load();
                }}
              />
              {flow.stored ? (
                <Button
                  disabled={flow.busy}
                  label={t('exercise.levelFiveDiscard')}
                  onPress={() => {
                    void flow.discard();
                  }}
                />
              ) : null}
            </Card>
          ) : null}
          {!content ? (
            <>
              {flow.stored && !flow.problem ? (
                <Card testID="level-five-resume">
                  <AppText variant="title3">
                    {flow.state ? text(flow.state.lesson.titleKey) : ''}
                  </AppText>
                  <Button
                    disabled={flow.busy}
                    label={t('exercise.levelFiveResume')}
                    onPress={flow.resume}
                  />
                  <Button
                    disabled={flow.busy}
                    variant="secondary"
                    label={t('exercise.levelFiveDiscard')}
                    onPress={() => {
                      void flow.discard();
                    }}
                  />
                </Card>
              ) : null}
              {lessons.map((entry) => {
                const unit = catalogue.units.find((u) => u.id === entry.unitId);
                return (
                  <Card key={entry.id}>
                    <AppText variant="title3">{unit ? text(unit.titleKey) : ''}</AppText>
                    <AppText>{text(entry.titleKey)}</AppText>
                    <Button
                      testID={`level-five-open-${entry.id}`}
                      disabled={flow.busy || flow.stored || !!flow.problem}
                      label={t('exercise.levelFiveLesson')}
                      onPress={() => {
                        void flow.start(entry.id).then(top);
                      }}
                    />
                  </Card>
                );
              })}
            </>
          ) : !lesson ? (
            <LessonIntroduction
              key={flow.state?.draft.id}
              lesson={content}
              disabled={flow.busy}
              initialCard={flow.state?.draft.introCard ?? 0}
              onCardChange={top}
              onCardSave={(index) => {
                void flow.change({ type: 'card', index });
              }}
              onStart={() => {
                void flow.change({ type: 'start' }).then(top);
              }}
            />
          ) : item && session ? (
            <View pointerEvents={flow.busy ? 'none' : 'auto'}>
              <ExerciseTask
                item={item}
                session={session}
                answer={flow.state?.draft.answer ?? null}
                question={question}
                scroll={scroll}
                reportSource={{
                  kind: 'lesson',
                  lessonId: content.id,
                  contentVersion: content.contentVersion,
                  seed: lesson.seed,
                  round: lesson.phase === 'review' ? 'review' : 'initial',
                  index:
                    lesson.phase === 'review'
                      ? (lesson.reviewOrigins[session.index] ?? session.index)
                      : session.index,
                }}
                progressText={`${String(session.index + 1)} / ${String(session.items.length)}`}
                progressLabel={t('exercise.levelFiveTitle')}
                hearingPausedText=""
                continueLabel={t('exercise.levelFiveNext')}
                onSelect={(answer) => {
                  void flow.change({ type: 'select', answer });
                }}
                onCheck={(answer) => {
                  void flow.change({ type: 'act', action: { type: 'answer', answer } });
                }}
                onHint={() => {
                  void flow.change({ type: 'act', action: { type: 'hint' } });
                }}
                onSkip={() => {
                  /* No hearing-only tasks in this preview. */
                }}
                onNext={() => {
                  void flow.change({ type: 'act', action: { type: 'next' } }).then(top);
                }}
              />
            </View>
          ) : lesson.phase === 'review-intro' ? (
            <Card>
              <AppText>{t('exercise.levelFiveReview')}</AppText>
              <Button
                disabled={flow.busy}
                label={t('exercise.levelFiveReviewStart')}
                onPress={() => {
                  void flow.change({ type: 'act', action: { type: 'review' } }).then(top);
                }}
              />
            </Card>
          ) : (
            <Card testID="level-five-complete">
              <AppText>
                {t('exercise.levelFiveDone', {
                  correct: summary?.correct ?? 0,
                  total: summary?.answered ?? 0,
                  remaining: summary?.unresolved ?? 0,
                })}
              </AppText>
            </Card>
          )}
          {content ? (
            <Button
              disabled={flow.busy}
              variant="secondary"
              label={t('exercise.levelFiveBack')}
              onPress={() => {
                flow.back();
                top();
              }}
            />
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
