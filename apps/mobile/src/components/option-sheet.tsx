import { SPACE } from '@harmonia/ui';
import { AppText, BottomSheet, Icon, useHaptics, useUiTheme } from '@harmonia/ui/native';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRef } from 'react';
import { useWebChoiceInput } from './use-web-choice-input';

export interface Option<T extends string> {
  readonly value: T;
  readonly label: string;
}

interface OptionSheetProps<T extends string> {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly options: readonly Option<T>[];
  readonly selected: T;
  readonly onSelect: (value: T) => void;
}

/** Auswahl aus wenigen Möglichkeiten in einem Blatt von unten (Optionsfelder); Auswahl schließt das Blatt. */
export function OptionSheet<T extends string>({
  visible,
  onClose,
  title,
  options,
  selected,
  onSelect,
}: OptionSheetProps<T>) {
  const { t } = useTranslation();
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} closeLabel={t('common.close')}>
      <OptionRows
        title={title}
        options={options}
        selected={selected}
        onSelect={onSelect}
        onClose={onClose}
      />
    </BottomSheet>
  );
}

/** Mounted with the actual dialog, so DOM refs exist before keyboard listeners attach. */
function OptionRows<T extends string>({
  title,
  options,
  selected,
  onSelect,
  onClose,
}: Omit<OptionSheetProps<T>, 'visible'>) {
  const { colors } = useUiTheme();
  const haptics = useHaptics();
  const group = useRef<View>(null);
  const select = (value: string) => {
    const option = options.find((entry) => entry.value === value);
    if (!option) return;
    haptics.tap();
    onSelect(option.value);
    onClose();
  };
  useWebChoiceInput(group, {
    choices: options.map((option) => option.value),
    enabled: true,
    select,
    focusOnly: true,
  });
  return (
    <View ref={group} role="radiogroup" aria-label={title}>
      {options.map((option, index) => {
        const checked = option.value === selected;
        return (
          <Pressable
            key={option.value}
            role="radio"
            aria-label={option.label}
            aria-checked={checked}
            {...(Platform.OS === 'web'
              ? {
                  tabIndex:
                    checked || (!options.some((entry) => entry.value === selected) && index === 0)
                      ? 0
                      : -1,
                }
              : {})}
            onPress={() => {
              select(option.value);
            }}
            style={[styles.row, { borderBottomColor: colors.border }]}
          >
            <AppText style={styles.label} tone={checked ? 'primary' : 'default'}>
              {option.label}
            </AppText>
            {checked ? <Icon name="check" color={colors.primaryText} strokeWidth={2.6} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    gap: SPACE.m,
    borderBottomWidth: 1,
  },
  label: { flex: 1 },
});
