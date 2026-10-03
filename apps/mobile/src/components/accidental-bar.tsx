import type { GlyphName } from '@harmonia/notation';
import { glyphMetrics } from '@harmonia/notation';
import { useTheme } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const symbol = (name: GlyphName): string => String.fromCodePoint(glyphMetrics(name).codepoint);

/** Versetzungszeichen von Doppel-b bis Doppelkreuz: Alteration, SMuFL-Zeichen (Bravura), Glossarbegriff. */
const ACCIDENTALS = [
  { alter: -2, glyph: symbol('accidentalDoubleFlat'), term: 'glossary:doubleFlat' },
  { alter: -1, glyph: symbol('accidentalFlat'), term: 'glossary:flat' },
  { alter: 0, glyph: symbol('accidentalNatural'), term: 'glossary:natural' },
  { alter: 1, glyph: symbol('accidentalSharp'), term: 'glossary:sharp' },
  { alter: 2, glyph: symbol('accidentalDoubleSharp'), term: 'glossary:doubleSharp' },
] as const;

interface AccidentalBarProps {
  /** Alteration der gewählten Note; undefined = keine Note gewählt (Leiste gesperrt). */
  readonly value: number | undefined;
  readonly onChange: (alter: number) => void;
}

/** Vorzeichen-Leiste: setzt das Versetzungszeichen der gewählten Note. */
export function AccidentalBar({ value, onChange }: AccidentalBarProps) {
  // Beschriftung der Zeichen aus dem Glossar (Kreuz/sharp …)
  const { t } = useTranslation(['translation', 'glossary']);
  const { colors } = useTheme();
  const disabled = value === undefined;
  return (
    <View role="radiogroup" aria-label={t('practice.accidentals')} style={styles.bar}>
      {ACCIDENTALS.map(({ alter, glyph, term }) => {
        const selected = value === alter;
        return (
          <Pressable
            key={alter}
            role="radio"
            aria-checked={selected}
            aria-disabled={disabled}
            aria-label={t(term)}
            disabled={disabled}
            onPress={() => {
              onChange(alter);
            }}
            style={[
              styles.button,
              { borderColor: selected ? colors.primary : colors.border },
              selected && styles.selected,
              disabled && styles.disabled,
            ]}
          >
            <Text style={[styles.glyph, { color: colors.text }]}>{glyph}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 8 },
  button: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  selected: { borderWidth: 2 },
  disabled: { opacity: 0.4 },
  // Bravura-Zeichen sitzen auf der Grundlinie wie Noten; etwas Höhe, damit Doppel-b und Kreuz nicht abgeschnitten werden
  glyph: { fontFamily: 'Bravura', fontSize: 28, lineHeight: 56 },
});
