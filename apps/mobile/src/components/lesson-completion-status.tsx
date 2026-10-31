import { countedTotal, PASS_PERCENT } from '@harmonia/content';
import type { LessonProgress } from '@harmonia/content';
import { AppText } from '@harmonia/ui/native';
import { useTranslation } from 'react-i18next';

export function LessonCompletionStatus({
  progress,
  minimumChoirCorrect,
}: {
  readonly progress: LessonProgress;
  readonly minimumChoirCorrect?: 1 | undefined;
}) {
  const { t } = useTranslation();
  const choirMissing = minimumChoirCorrect && (progress.choirCorrect ?? 0) < minimumChoirCorrect;
  return (
    <>
      <AppText tone={progress.passed ? 'success' : 'default'} aria-live="polite">
        {t(
          progress.passed
            ? 'path.passed'
            : choirMissing
              ? 'path.choirRequiredResult'
              : 'path.failed',
          {
            correct: progress.eligibleCorrect,
            total: countedTotal(progress),
            percent: PASS_PERCENT,
          },
        )}
      </AppText>
      {minimumChoirCorrect ? (
        <AppText>{t('path.choirProgress', { count: progress.choirCorrect ?? 0 })}</AppText>
      ) : null}
    </>
  );
}
