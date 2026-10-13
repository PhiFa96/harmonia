import { useRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { RADIUS, SPACE, TOUCH } from '@harmonia/ui';
import { AppText, Icon, useHaptics, useUiTheme } from '@harmonia/ui/native';
import { useWebChoiceInput } from './use-web-choice-input';

export interface SetupOption<T extends string | number> {
  readonly value: T;
  readonly label: string;
  readonly description?: string;
}
export function OnboardingChoices<T extends string | number>({
  label,
  options,
  selected,
  onSelect,
  disabled = false,
}: {
  readonly label: string;
  readonly options: readonly SetupOption<T>[];
  readonly selected: T | null;
  readonly onSelect: (value: T) => void;
  readonly disabled?: boolean;
}) {
  const { colors } = useUiTheme(),
    haptics = useHaptics(),
    group = useRef<View>(null);
  const select = (value: T) => {
    haptics.tap();
    onSelect(value);
  };
  useWebChoiceInput(group, {
    choices: options.map((o) => String(o.value)),
    enabled: !disabled,
    select: (value) => {
      const option = options.find((o) => String(o.value) === value);
      if (option) select(option.value);
    },
  });
  return (
    <View ref={group} role="radiogroup" aria-label={label} style={styles.group}>
      {options.map((option, index) => {
        const checked = option.value === selected;
        return (
          <Pressable
            key={option.value}
            testID={`setup-choice-${String(option.value)}`}
            role="radio"
            aria-label={option.label}
            aria-checked={checked}
            aria-disabled={disabled}
            disabled={disabled}
            {...(Platform.OS === 'web'
              ? { tabIndex: !disabled && (checked || (selected === null && index === 0)) ? 0 : -1 }
              : {})}
            onPress={() => {
              select(option.value);
            }}
            style={[
              styles.option,
              {
                backgroundColor: checked ? colors.primarySoft : colors.surface,
                borderColor: checked ? colors.primary : colors.borderStrong,
              },
            ]}
          >
            <View style={styles.text}>
              <AppText variant="small" tone={checked ? 'primary' : 'default'}>
                {option.label}
              </AppText>
              {option.description ? (
                <AppText variant="footnote" tone="muted">
                  {option.description}
                </AppText>
              ) : null}
            </View>
            {checked ? <Icon name="check" color={colors.primaryText} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  group: { gap: SPACE.s },
  option: {
    minHeight: TOUCH.buttonLarge,
    padding: SPACE.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.m,
    borderWidth: 2,
    borderRadius: RADIUS.control,
  },
  text: { flex: 1, gap: SPACE.xs },
});
