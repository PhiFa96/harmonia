import type { GlyphName } from '@harmonia/notation';
import { glyphMetrics } from '@harmonia/notation';
import { RADIUS, SPACE, TOUCH } from '@harmonia/ui';
import { useHaptics, useUiTheme } from '@harmonia/ui/native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';

const SIZE = TOUCH.buttonLarge;
/** Zeichenfläche innerhalb des 2-pt-Rands */
const INNER = SIZE - 4;
const FONT_SIZE = 36;

/**
 * Zeichen und senkrechte Lage: Bravura setzt Versetzungszeichen auf die Grundlinie wie im Notensystem.
 * Damit sie im Knopf mittig stehen, wird die Grundlinie um die Mitte der SMuFL-Box verschoben
 * (1 Notenlinienabstand = ein Viertel der Schriftgröße).
 */
function glyph(name: GlyphName): { readonly text: string; readonly baseline: number } {
  const { codepoint, bBoxNE, bBoxSW } = glyphMetrics(name);
  const center = (bBoxNE[1] + bBoxSW[1]) / 2;
  return {
    text: String.fromCodePoint(codepoint),
    baseline: INNER / 2 + (center * FONT_SIZE) / 4,
  };
}

/** Versetzungszeichen von Doppel-b bis Doppelkreuz: Alteration, SMuFL-Zeichen (Bravura), Glossarbegriff. */
const ACCIDENTALS = [
  { alter: -2, ...glyph('accidentalDoubleFlat'), term: 'glossary:doubleFlat' },
  { alter: -1, ...glyph('accidentalFlat'), term: 'glossary:flat' },
  { alter: 0, ...glyph('accidentalNatural'), term: 'glossary:natural' },
  { alter: 1, ...glyph('accidentalSharp'), term: 'glossary:sharp' },
  { alter: 2, ...glyph('accidentalDoubleSharp'), term: 'glossary:doubleSharp' },
] as const;

interface AccidentalBarProps {
  /** Alteration der gewählten Note; undefined = keine Note gewählt (Leiste gesperrt). */
  readonly value: number | undefined;
  readonly disabled?: boolean;
  readonly onChange: (alter: number) => void;
}

/** Vorzeichen-Leiste: setzt das Versetzungszeichen der gewählten Note. */
export function AccidentalBar({ value, onChange, disabled: locked = false }: AccidentalBarProps) {
  // Beschriftung der Zeichen aus dem Glossar (Kreuz/sharp …)
  const { t } = useTranslation(['translation', 'glossary']);
  const { colors } = useUiTheme();
  const haptics = useHaptics();
  const disabled = value === undefined || locked;
  return (
    <View role="radiogroup" aria-label={t('practice.accidentals')} style={styles.bar}>
      {ACCIDENTALS.map(({ alter, text, baseline, term }) => {
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
              haptics.tap();
              onChange(alter);
            }}
            style={[
              styles.button,
              {
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primarySoft : colors.surface,
              },
              disabled && styles.disabled,
            ]}
          >
            <Svg width={INNER} height={INNER}>
              <SvgText
                // x/y sind bei Text die Position der Grundlinie (keine Verschiebung); die Typen
                // von react-native-svg markieren sie fälschlich als veraltet (wie in score-view.tsx)
                // eslint-disable-next-line @typescript-eslint/no-deprecated
                x={INNER / 2}
                // eslint-disable-next-line @typescript-eslint/no-deprecated
                y={baseline}
                textAnchor="middle"
                fontFamily="Bravura"
                fontSize={FONT_SIZE}
                fill={colors.text}
              >
                {text}
              </SvgText>
            </Svg>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACE.s + 2 },
  button: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.control,
    borderWidth: 2,
  },
  disabled: { opacity: 0.5 },
});
