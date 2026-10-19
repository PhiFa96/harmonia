import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LAYOUT, RADIUS, SPACE, TOUCH } from '@harmonia/ui';
import { AppText, Button, Card, Icon, ProgressBar, useUiTheme } from '@harmonia/ui/native';
import type { IconName } from '@harmonia/ui/native';
import { PASS_PERCENT } from '@harmonia/content';
import type { PathStatus } from '@harmonia/content';
import { catalogue } from '@harmonia/content/catalogue';
import { firstLesson } from '@/content';
import { lessonPlan } from '@harmonia/content';
import { useContentText } from '@/content/use-content-text';
import {
  initializeLearning,
  selectLearningArea,
  selectLearningLevel,
  startTemporaryLearning,
  syncLearning,
  toggleLearningUnit,
  useLearningState,
} from '@/state/learning';
import { useWebChoiceInput } from './use-web-choice-input';

const ICONS: Readonly<Record<PathStatus, IconName>> = {
  locked: 'lock',
  open: 'play',
  completed: 'check',
  tested: 'sparkle',
};
export function LearningPath() {
  const { t } = useTranslation(),
    text = useContentText(),
    { colors } = useUiTheme(),
    state = useLearningState();
  const areas = catalogue.areas.filter((area) => state.path.some((u) => u.areaId === area.id));
  const selected = areas.some((a) => a.id === state.areaId) ? state.areaId : null;
  const units = state.path.filter(
    (u) =>
      (selected === null || u.areaId === selected) &&
      (state.level === null || u.level === state.level),
  );
  const group = useRef<View>(null),
    choices = ['all', ...areas.map((a) => a.id)];
  useWebChoiceInput(group, {
    choices,
    enabled: state.phase === 'ready',
    select: (id) => {
      selectLearningArea(id === 'all' ? null : id);
    },
  });
  if (state.phase !== 'ready')
    return (
      <Card>
        <AppText role={state.phase === 'error' ? 'alert' : undefined}>
          {t(state.phase === 'error' ? 'path.loadError' : 'path.loading')}
        </AppText>
        {state.phase === 'error' ? (
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
      </Card>
    );
  return (
    <>
      <Card>
        <View style={styles.stack}>
          <AppText variant="title2">{t('path.title')}</AppText>
          <AppText>
            {t('path.overview', {
              completed: state.path.filter((u) => u.status === 'completed').length,
              tested: state.path.filter((u) => u.status === 'tested').length,
              total: state.path.length,
            })}
          </AppText>
          <AppText variant="footnote" tone="muted">
            {t('path.rule', { percent: PASS_PERCENT })}
          </AppText>
          <AppText aria-live="polite" tone={state.sync === 'error' ? 'danger' : 'muted'}>
            {t(
              state.memory
                ? 'onboarding.temporaryHint'
                : state.sync === 'guest'
                  ? 'path.guest'
                  : state.sync === 'syncing'
                    ? 'path.syncing'
                    : state.sync === 'error'
                      ? 'path.syncError'
                      : 'path.synced',
            )}
          </AppText>
          {state.sync !== 'guest' ? (
            <Button
              variant="ghost"
              size="medium"
              disabled={state.sync === 'syncing'}
              label={t('path.syncNow')}
              onPress={() => {
                void syncLearning();
              }}
            />
          ) : null}
          {state.outdated > 0 ? <AppText variant="footnote">{t('path.outdated')}</AppText> : null}
        </View>
      </Card>
      {areas.length ? (
        <>
          <AppText variant="title3">{t('path.areas')}</AppText>
          <ScrollView horizontal contentContainerStyle={styles.tabs}>
            <View ref={group} role="radiogroup" aria-label={t('path.areas')} style={styles.tabs}>
              {choices.map((id, i) => {
                const checked = selected === (id === 'all' ? null : id),
                  area = areas.find((a) => a.id === id);
                return (
                  <Pressable
                    key={id}
                    testID={`path-area-${id}`}
                    role="radio"
                    aria-label={area ? text(area.titleKey) : t('path.allAreas')}
                    aria-checked={checked}
                    {...(Platform.OS === 'web'
                      ? { tabIndex: checked || (selected === null && i === 0) ? 0 : -1 }
                      : {})}
                    onPress={() => {
                      selectLearningArea(id === 'all' ? null : id);
                    }}
                    style={[
                      styles.tab,
                      {
                        borderColor: checked ? colors.primary : colors.borderStrong,
                        backgroundColor: checked ? colors.primarySoft : colors.surface,
                      },
                    ]}
                  >
                    <AppText variant="small" tone={checked ? 'primary' : 'default'}>
                      {area ? text(area.titleKey) : t('path.allAreas')}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
          <AppText variant="footnote" tone="muted">
            {t('path.areaHint')}
          </AppText>
          <View style={[styles.tabs, styles.levels]}>
            {([null, 1, 2, 3] as const).map((level) => (
              <Button
                key={level ?? 'all'}
                variant={state.level === level ? 'primary' : 'secondary'}
                size="medium"
                label={level === null ? t('path.allLevels') : t('path.level', { level })}
                onPress={() => {
                  selectLearningLevel(level);
                }}
              />
            ))}
          </View>
          {units.map((unit, index) => {
            const expanded = state.expanded.includes(unit.id),
              area = areas.find((a) => a.id === unit.areaId);
            return (
              <View key={unit.id} testID={`lesson-group-${unit.id}`} style={styles.unit}>
                <View
                  style={[
                    styles.marker,
                    {
                      borderColor: colors.borderStrong,
                      backgroundColor:
                        unit.status === 'completed'
                          ? colors.successSoft
                          : unit.status === 'tested'
                            ? colors.primarySoft
                            : colors.surface,
                    },
                  ]}
                >
                  <Icon
                    name={ICONS[unit.status]}
                    color={unit.status === 'completed' ? colors.success : colors.primaryText}
                  />
                </View>
                <Card style={styles.unitCard}>
                  <View style={styles.stack}>
                    <AppText variant="overline" tone="muted">
                      {t('path.unitPosition', { count: index + 1, level: unit.level })}
                      {area ? ` · ${text(area.titleKey)}` : ''}
                    </AppText>
                    <AppText variant="title2">{text(unit.titleKey)}</AppText>
                    <AppText variant="small">{t(`path.status_${unit.status}`)}</AppText>
                    <ProgressBar
                      value={unit.completed / unit.lessons.length}
                      label={t('path.unitProgress')}
                      valueText={t('path.lessonProgress', {
                        completed: unit.completed,
                        total: unit.lessons.length,
                      })}
                    />
                    <AppText variant="footnote" tone="muted">
                      {t('path.lessonProgress', {
                        completed: unit.completed,
                        total: unit.lessons.length,
                      })}
                    </AppText>
                    {unit.status === 'tested' ? (
                      <AppText variant="footnote">{t('path.testedHint')}</AppText>
                    ) : null}
                    {unit.prerequisiteUnitIds.map((id) => {
                      const prerequisite = state.path.find((u) => u.id === id);
                      return prerequisite ? (
                        <Button
                          key={id}
                          variant="ghost"
                          size="medium"
                          label={t('path.prerequisite', { title: text(prerequisite.titleKey) })}
                          onPress={() => {
                            selectLearningArea(prerequisite.areaId);
                            selectLearningLevel(
                              prerequisite.level === 3 ? 3 : prerequisite.level === 2 ? 2 : 1,
                            );
                            if (!state.expanded.includes(id)) toggleLearningUnit(id);
                          }}
                        />
                      ) : null;
                    })}
                    <Button
                      variant="secondary"
                      label={t(expanded ? 'path.hideLessons' : 'path.showLessons')}
                      accessibilityLabel={t(expanded ? 'path.hideNamed' : 'path.showNamed', {
                        title: text(unit.titleKey),
                      })}
                      onPress={() => {
                        toggleLearningUnit(unit.id);
                      }}
                    />
                    {expanded
                      ? unit.lessons.map((lesson) => (
                          <View
                            key={lesson.id}
                            style={[styles.lesson, { borderTopColor: colors.border }]}
                          >
                            <AppText variant="title3">{text(lesson.titleKey)}</AppText>
                            <AppText variant="footnote" tone="muted">
                              {t('lesson.taskCount', {
                                count: lessonPlan(catalogue, lesson.id)?.exercises.length ?? 0,
                              })}
                            </AppText>
                            <AppText variant="small" tone="muted">
                              {t(`path.status_${lesson.status}`)}
                            </AppText>
                            <Button
                              disabled={lesson.status === 'locked'}
                              label={
                                lesson.id === firstLesson?.id
                                  ? t('lesson.open')
                                  : t('lesson.openAnother')
                              }
                              accessibilityLabel={
                                lesson.id === firstLesson?.id
                                  ? t('lesson.open')
                                  : t('lesson.openNamed', { title: text(lesson.titleKey) })
                              }
                              onPress={() => {
                                router.push({ pathname: '/lesson', params: { id: lesson.id } });
                              }}
                            />
                          </View>
                        ))
                      : null}
                  </View>
                </Card>
              </View>
            );
          })}
        </>
      ) : (
        <Card>
          <AppText>{t('learn.unavailable')}</AppText>
        </Card>
      )}
    </>
  );
}
const styles = StyleSheet.create({
  stack: { gap: SPACE.m },
  tabs: { flexDirection: 'row', gap: SPACE.s },
  levels: { flexWrap: 'wrap' },
  tab: {
    minHeight: TOUCH.buttonMedium,
    maxWidth: LAYOUT.maxContentWidth / 2,
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: RADIUS.control,
    paddingHorizontal: SPACE.m,
    paddingVertical: SPACE.s,
  },
  unit: { flexDirection: 'row', gap: SPACE.s, alignItems: 'flex-start' },
  marker: { borderWidth: 2, borderRadius: RADIUS.control, padding: SPACE.s },
  unitCard: { flex: 1, minWidth: 0 },
  lesson: { borderTopWidth: 1, paddingTop: SPACE.m, gap: SPACE.s },
});
