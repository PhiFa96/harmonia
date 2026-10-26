import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ChoirNoteAssessment } from '@harmonia/exercises';
import { SPACE } from '@harmonia/ui';
import { AppText, Card, useUiTheme } from '@harmonia/ui/native';

interface Props {
  readonly note: ChoirNoteAssessment;
  readonly pitch: string;
}

/** Describes the existing grading windows without replaying or retaining microphone audio. */
export function ChoirNoteFeedback({ note, pitch }: Props) {
  const { t } = useTranslation(),
    { colors } = useUiTheme();
  const symbols = { missing: '—', 'in-tune': '✓', low: '↓', high: '↑' } as const;
  const labels = {
    missing: t('exercise.choirWindowMissingStatus'),
    'in-tune': t('exercise.choirWindowInTune'),
    low: t('exercise.choirWindowLow'),
    high: t('exercise.choirWindowHigh'),
  };
  return (
    <Card>
      <AppText variant="title3">
        {t('exercise.choirNote', {
          note: note.index + 1,
          bar: Math.floor(note.index / 2) + 1,
          pitch,
        })}
      </AppText>
      <AppText>
        {t(
          note.passed
            ? 'exercise.choirPass'
            : note.coverage < 8 / 12
              ? 'exercise.choirMissing'
              : 'exercise.choirMiss',
        )}
      </AppText>
      <AppText>
        {note.deviation === null
          ? t('exercise.choirNoPitch')
          : t('exercise.choirDeviation', {
              cents: note.deviation,
              coverage: Math.round(note.coverage * 100),
            })}
      </AppText>
      <AppText testID={`choir-window-counts-${String(note.index)}`}>
        {note.detectedWindows === 0
          ? t('exercise.choirNoWindows')
          : t('exercise.choirWindowCounts', {
              detected: note.detectedWindows,
              matching: note.matchingWindows,
            })}
      </AppText>
      <View
        testID={`choir-windows-${String(note.index)}`}
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.xs }}
      >
        {note.windows.map((window) => (
          <AppText
            key={window.index}
            accessibilityRole="image"
            testID={`choir-window-${String(note.index)}-${String(window.index)}`}
            accessibilityLabel={
              window.deviation === null
                ? t('exercise.choirWindowMissing', {
                    note: note.index + 1,
                    window: window.index + 1,
                  })
                : t('exercise.choirWindowObserved', {
                    note: note.index + 1,
                    window: window.index + 1,
                    status: labels[window.status],
                    cents: window.deviation,
                  })
            }
            style={{
              minWidth: 28,
              textAlign: 'center',
              borderWidth: 1,
              borderRadius: 4,
              borderColor: colors.textMuted,
              color:
                window.status === 'in-tune'
                  ? colors.success
                  : window.status === 'missing'
                    ? colors.textMuted
                    : colors.danger,
            }}
          >
            {symbols[window.status]}
          </AppText>
        ))}
      </View>
    </Card>
  );
}
