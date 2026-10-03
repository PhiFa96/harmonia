// Text mit Vorzeichen: Kreuz, Be, Auflösungszeichen, Doppelkreuz und Doppel-b fehlen in Figtree
// (und allen geprüften Textschriften). Sie kommen aus einer Teilmenge von Bravura Text, deren Zeichen
// für Fließtext gestaltet sind (auf der Grundlinie, so hoch wie Großbuchstaben).

import { Text } from 'react-native';

import { ACCIDENTAL_FONT, TYPOGRAPHY } from '../tokens.ts';
import type { AppTextProps } from './text.tsx';
import { AppText } from './text.tsx';

/**
 * Unicode-Vorzeichen → Zeichen der Vorzeichen-Schrift und Größe relativ zum Text.
 * 𝄪 und 𝄫 stehen in Bravura Text tiefgestellt; daher das SMuFL-Doppelkreuz (etwas größer) und zwei Be.
 */
const ACCIDENTALS: Readonly<Record<string, { readonly glyph: string; readonly scale: number }>> = {
  '♭': { glyph: '♭', scale: 1 },
  '♮': { glyph: '♮', scale: 1 },
  '♯': { glyph: '♯', scale: 1 },
  '\u{1D12A}': { glyph: '', scale: 1.3 },
  '\u{1D12B}': { glyph: '♭♭', scale: 1 },
};

const PATTERN = /(♭|♮|♯|\u{1D12A}|\u{1D12B})/u;

/** Zerlegt Text in Abschnitte; Vorzeichen als eigene Teile. */
export function splitAccidentals(
  text: string,
): { readonly text: string; readonly accidental: boolean }[] {
  return text
    .split(PATTERN)
    .filter((part) => part !== '')
    .map((part) => ({ text: part, accidental: part in ACCIDENTALS }));
}

export interface MusicTextProps extends Omit<AppTextProps, 'children'> {
  readonly children: string;
}

/**
 * Wie AppText, aber Vorzeichen im Text werden mit der Vorzeichen-Schrift gesetzt. Der Screenreader
 * liest den ursprünglichen Text (z. B. „F♯“), nicht die Ersatzzeichen.
 */
export function MusicText({ children, variant = 'body', ...rest }: MusicTextProps) {
  const { fontSize, lineHeight } = TYPOGRAPHY[variant];
  return (
    <AppText variant={variant} aria-label={children} {...rest}>
      {splitAccidentals(children).map((part, index) => {
        const accidental = ACCIDENTALS[part.text];
        return accidental ? (
          <Text
            key={index}
            style={{
              fontFamily: ACCIDENTAL_FONT,
              fontSize: fontSize * accidental.scale,
              lineHeight,
            }}
          >
            {accidental.glyph}
          </Text>
        ) : (
          part.text
        );
      })}
    </AppText>
  );
}
