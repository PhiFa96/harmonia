import { placementEstimates } from '@harmonia/exercises';
import type { PlacementSession } from '@harmonia/exercises';
import { placementRecommendations, placementFirstLesson } from '@harmonia/content';
import { catalogue } from '@harmonia/content/catalogue';
import { AppText, Button, Card } from '@harmonia/ui/native';
import { SPACE } from '@harmonia/ui';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { bank } from '@/state/placement';
import { useContentText } from '@/content/use-content-text';

export function PlacementResults({ state }: { readonly state: PlacementSession }) {
  const { t } = useTranslation(),
    text = useContentText(),
    router = useRouter();
  const estimates = placementEstimates(bank, state),
    complete = state.ended === 'complete';
  const recommendations = placementRecommendations(catalogue, bank, estimates, complete);
  const firstId = placementFirstLesson(catalogue, recommendations),
    first = catalogue.lessons.find((l) => l.id === firstId);
  const summary = estimates.reduce(
    (sum, e) => ({
      answered: sum.answered + e.answered,
      correct: sum.correct + e.correct,
      assisted: sum.assisted + e.assisted,
      skipped: sum.skipped + e.skipped,
    }),
    { answered: 0, correct: 0, assisted: 0, skipped: 0 },
  );
  return (
    <>
      <AppText variant="title1">
        {t(complete ? 'placement.resultTitle' : 'placement.partialTitle')}
      </AppText>
      <AppText>{t(complete ? 'placement.resultBody' : 'placement.partialBody')}</AppText>
      <Card>
        <AppText>{t('placement.summary', summary)}</AppText>
      </Card>
      <AppText variant="footnote" tone="muted">
        {t('placement.estimateHint')}
      </AppText>
      {first ? (
        <Card>
          <AppText variant="title3">{t('placement.overallStart')}</AppText>
          <AppText>{text(first.titleKey)}</AppText>
          <Button
            label={t('placement.startLearning')}
            accessibilityLabel={t('placement.startNamed', { title: text(first.titleKey) })}
            onPress={() => {
              router.push({ pathname: '/lesson', params: { id: first.id } });
            }}
          />
        </Card>
      ) : null}
      {bank.areas.map((area) => {
        const estimate = estimates.find((e) => e.areaId === area.id),
          recommendation = recommendations.find((r) => r.areaId === area.id);
        const unit = catalogue.units.find((u) => u.id === recommendation?.unitId),
          lesson = catalogue.lessons.find((l) => l.id === recommendation?.lessonId);
        if (!estimate || !recommendation || !unit || !lesson) return null;
        return (
          <Card key={area.id} testID={`placement-result-${area.id}`}>
            <View style={styles.content}>
              <AppText variant="title2">{text(area.titleKey)}</AppText>
              <AppText>
                {t(
                  estimate.confirmedTier === null
                    ? 'placement.notRated'
                    : estimate.confirmedTier < 0
                      ? 'placement.foundation'
                      : 'placement.level',
                  {
                    level:
                      recommendation.level ??
                      bank.areas.find((a) => a.id === estimate.areaId)?.checkpoints[
                        estimate.confirmedTier ?? 0
                      ]?.level ??
                      1,
                  },
                )}
              </AppText>
              <AppText variant="small" tone="muted">
                {t('placement.areaEvidence', { ...estimate })}
              </AppText>
              {estimate.uncertain ? (
                <AppText variant="footnote">{t('placement.uncertain')}</AppText>
              ) : null}
              <AppText variant="title3">
                {t('placement.startPoint', { title: text(unit.titleKey) })}
              </AppText>
              <AppText variant="small">{text(lesson.titleKey)}</AppText>
              {recommendation.prerequisiteUnitIds.map((id) => {
                const prerequisite = catalogue.units.find((u) => u.id === id),
                  prerequisiteLesson = catalogue.lessons.find((l) => l.unitId === id);
                return prerequisite && prerequisiteLesson ? (
                  <Button
                    key={id}
                    variant="ghost"
                    size="medium"
                    label={t('placement.prerequisite', { title: text(prerequisite.titleKey) })}
                    onPress={() => {
                      router.push({ pathname: '/lesson', params: { id: prerequisiteLesson.id } });
                    }}
                  />
                ) : null;
              })}
              <Button
                label={t('placement.startLearning')}
                accessibilityLabel={t('placement.startNamed', { title: text(lesson.titleKey) })}
                onPress={() => {
                  router.push({ pathname: '/lesson', params: { id: lesson.id } });
                }}
              />
              {recommendation.testedUnitIds.length ? (
                <>
                  <AppText variant="small">{t('placement.testedHint')}</AppText>
                  {recommendation.testedUnitIds.map((id) => {
                    const tested = catalogue.units.find((u) => u.id === id),
                      first = catalogue.lessons.find((l) => l.unitId === id);
                    return tested && first ? (
                      <Button
                        key={id}
                        variant="ghost"
                        size="medium"
                        label={t('placement.testedUnit', { title: text(tested.titleKey) })}
                        onPress={() => {
                          router.push({ pathname: '/lesson', params: { id: first.id } });
                        }}
                      />
                    ) : null;
                  })}
                </>
              ) : null}
            </View>
          </Card>
        );
      })}
    </>
  );
}
const styles = StyleSheet.create({ content: { gap: SPACE.m } });
