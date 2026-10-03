import { SPACE } from '@harmonia/ui';
import { AppText, BottomSheet, Icon, useHaptics, useUiTheme } from '@harmonia/ui/native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

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
  const { colors } = useUiTheme();
  const haptics = useHaptics();
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} closeLabel={t('common.close')}>
      <View role="radiogroup" aria-label={title}>
        {options.map((option) => {
          const checked = option.value === selected;
          return (
            <Pressable
              key={option.value}
              role="radio"
              aria-checked={checked}
              onPress={() => {
                haptics.tap();
                onSelect(option.value);
                onClose();
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
    </BottomSheet>
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
