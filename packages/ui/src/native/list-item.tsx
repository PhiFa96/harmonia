// Listenzeile für Einstellungen: Symbol, Beschriftung, Wert, Pfeil oder Schalter.
// Mit Schalter ist die ganze Zeile der Schalter (ein Ziel für Finger und Screenreader).

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { RADIUS, SPACE } from '../tokens.ts';
import { Card } from './card.tsx';
import { useHaptics } from './haptics.ts';
import type { IconName } from './icons.tsx';
import { Icon } from './icons.tsx';
import { AppText } from './text.tsx';
import { useUiTheme } from './theme.tsx';
import { SwitchTrack } from './toggle.tsx';

export interface ListItemProps {
  readonly label: string;
  /** Aktueller Wert rechts, z. B. „Deutsch“ */
  readonly value?: string;
  readonly icon?: IconName;
  /** Öffnet etwas (Pfeil rechts) */
  readonly onPress?: () => void;
  /** Macht die Zeile zum Schalter */
  readonly toggle?: { readonly value: boolean; readonly onValueChange: (value: boolean) => void };
  readonly accessibilityHint?: string;
  /** Letzte Zeile einer Gruppe: ohne Trennlinie */
  readonly last?: boolean;
}

export function ListItem({
  label,
  value,
  icon,
  onPress,
  toggle,
  accessibilityHint,
  last = false,
}: ListItemProps) {
  const { colors } = useUiTheme();
  const haptics = useHaptics();
  const content = (
    <>
      {icon ? (
        <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
          <Icon name={icon} color={colors.primary} size={20} />
        </View>
      ) : null}
      <AppText style={styles.label}>{label}</AppText>
      {value === undefined ? null : (
        <AppText variant="small" tone="muted">
          {value}
        </AppText>
      )}
      {toggle ? <SwitchTrack value={toggle.value} /> : null}
      {!toggle && onPress ? (
        <Icon name="chevronRight" color={colors.borderStrong} size={18} strokeWidth={2.4} />
      ) : null}
    </>
  );
  const rowStyle = [
    styles.row,
    last ? null : { borderBottomWidth: 1, borderBottomColor: colors.border },
  ];
  const hint = accessibilityHint === undefined ? {} : { accessibilityHint };

  if (toggle) {
    return (
      <Pressable
        role="switch"
        aria-label={label}
        aria-checked={toggle.value}
        {...hint}
        onPress={() => {
          haptics.tap();
          toggle.onValueChange(!toggle.value);
        }}
        style={rowStyle}
      >
        {content}
      </Pressable>
    );
  }
  if (onPress) {
    return (
      <Pressable
        role="button"
        aria-label={value === undefined ? label : `${label}, ${value}`}
        {...hint}
        onPress={onPress}
        style={rowStyle}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={rowStyle}>{content}</View>;
}

/** Gruppe von Listenzeilen auf einer Karte. */
export function ListGroup({ children }: { readonly children: ReactNode }) {
  return (
    <Card padding={0} style={styles.group}>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.m,
    minHeight: 56,
    paddingHorizontal: SPACE.l,
    paddingVertical: SPACE.s,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.input - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1 },
  group: { overflow: 'hidden' },
});
