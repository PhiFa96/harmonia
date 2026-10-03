// Text mit Schriftstufe und Farbrolle aus den Tokens. Wächst mit der Systemschrift.

import type { TextProps } from 'react-native';
import { Text } from 'react-native';

import type { ColorRole, TextVariant } from '../tokens.ts';
import { HEADING_VARIANTS, TYPOGRAPHY } from '../tokens.ts';
import { useUiTheme } from './theme.tsx';

export type TextTone =
  | 'default'
  | 'muted'
  | 'primary'
  | 'accent'
  | 'success'
  | 'danger'
  | 'onPrimary'
  | 'onAccent'
  | 'onSuccess'
  | 'onDanger';

const TONE_ROLE: Readonly<Record<TextTone, ColorRole>> = {
  default: 'text',
  muted: 'textMuted',
  primary: 'primaryText',
  accent: 'accentText',
  success: 'success',
  danger: 'danger',
  onPrimary: 'onPrimary',
  onAccent: 'onAccent',
  onSuccess: 'onSuccess',
  onDanger: 'onDanger',
};

export interface AppTextProps extends TextProps {
  /** Schriftstufe. Standard: body */
  readonly variant?: TextVariant;
  /** Farbrolle. Standard: Textfarbe */
  readonly tone?: TextTone;
}

/** Überschriften (display bis title3) haben für den Screenreader die Rolle „heading“. */
export function AppText({ variant = 'body', tone = 'default', style, ...rest }: AppTextProps) {
  const { colors } = useUiTheme();
  const heading = HEADING_VARIANTS.includes(variant);
  return (
    <Text
      {...(heading ? { role: 'heading' as const } : {})}
      {...rest}
      style={[TYPOGRAPHY[variant], { color: colors[TONE_ROLE[tone]] }, style]}
    />
  );
}
