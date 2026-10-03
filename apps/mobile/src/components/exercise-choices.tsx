import type { Evaluation, ExerciseItem } from '@harmonia/exercises';
import { choiceLabel } from '@harmonia/exercises';
import { RADIUS, SPACE, TOUCH } from '@harmonia/ui';
import { Icon, MusicText, useHaptics, useUiTheme } from '@harmonia/ui/native';
import { useTranslation } from 'react-i18next';
import { useRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useLocale } from '@/i18n';
import { useWebChoiceInput } from './use-web-choice-input';

export function ExerciseChoices({
  item,
  answer,
  result,
  onSelect,
}: {
  readonly item: ExerciseItem;
  readonly answer: string | null;
  readonly result?: Evaluation;
  readonly onSelect: (value: string) => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const { colors } = useUiTheme();
  const haptics = useHaptics();
  const group = useRef<View>(null);
  const select = (value: string) => {
    haptics.tap();
    onSelect(value);
  };
  useWebChoiceInput(group, { choices: item.choices, enabled: !result, select });
  return (
    <View ref={group} role="radiogroup" aria-label={t('exercise.answers')} style={styles.choices}>
      {item.choices.map((value, index) => {
        const selected = answer === value;
        const correct = result?.expected === value;
        const wrong = result && selected && !correct;
        const label = choiceLabel(item, value, locale);
        return (
          <Pressable
            key={value}
            testID={`answer-${value}`}
            role="radio"
            aria-checked={selected}
            aria-disabled={!!result}
            aria-label={`${label}${correct ? `, ${t('highlight.correct')}` : wrong ? `, ${t('highlight.wrong')}` : ''}`}
            disabled={!!result}
            {...(Platform.OS === 'web'
              ? { tabIndex: !result && (selected || (answer === null && index === 0)) ? 0 : -1 }
              : {})}
            onPress={() => {
              select(value);
            }}
            style={[
              styles.choice,
              {
                backgroundColor: correct
                  ? colors.successSoft
                  : wrong
                    ? colors.dangerSoft
                    : selected
                      ? colors.primarySoft
                      : colors.surface,
                borderColor: correct
                  ? colors.success
                  : wrong
                    ? colors.danger
                    : selected
                      ? colors.primary
                      : colors.border,
              },
            ]}
          >
            <MusicText variant="small" style={styles.label}>
              {label}
            </MusicText>
            {correct || wrong || selected ? (
              <Icon
                name={correct ? 'check' : wrong ? 'close' : 'target'}
                color={correct ? colors.success : wrong ? colors.danger : colors.primaryText}
                size={20}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s },
  choice: {
    minHeight: TOUCH.buttonLarge,
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.s,
    padding: SPACE.m,
    borderWidth: 2,
    borderRadius: RADIUS.control,
  },
  label: { flexShrink: 1 },
});
