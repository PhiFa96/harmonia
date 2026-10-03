import type { KeyboardLabels, KeyboardRange, PianoKey, Pitch } from '@harmonia/notation';
import {
  PIANO_RANGE,
  PRACTICE_RANGE,
  keyboardHit,
  keyboardLabel,
  keyboardLayout,
  keyboardMidi,
  keyboardPitch,
  keyboardSpokenNames,
} from '@harmonia/notation';
import { RADIUS, SPACE, TOUCH } from '@harmonia/ui';
import {
  AppText,
  BottomSheet,
  Button,
  Icon,
  MusicText,
  moveTo,
  useUiTheme,
} from '@harmonia/ui/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GestureResponderEvent } from 'react-native';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { usePianoStatus } from '@/audio';
import { useLocale } from '@/i18n';
import { OptionSheet } from './option-sheet';
import { usePianoInput } from './use-piano-input';
import { useWebPianoInput } from './use-web-piano-input';

type KeyStatus = 'active' | 'correct' | 'wrong';
export interface PianoKeyboardProps {
  /** Tonhöhe an die Übung weitergeben; Mehrfachberührung klingt gleichzeitig. */
  readonly onPitch: (pitch: Pitch) => void;
  readonly selected?: Pitch;
  readonly highlights?: readonly { readonly pitch: Pitch; readonly kind: KeyStatus }[];
  /** Die Übung bestimmt die Schreibweise, nicht die Beschriftung der Klaviatur. */
  readonly spellPitch?: (midi: number) => Pitch;
  readonly enabled?: boolean;
}

type RangeName = 'practice' | 'middle' | 'full';
const RANGES: Readonly<Record<RangeName, KeyboardRange>> = {
  practice: PRACTICE_RANGE,
  middle: { first: 48, last: 84 },
  full: PIANO_RANGE,
};
const KEY_WIDTHS = [80, 96, 112] as const;

/** Spielbare Klaviatur: getrennte Quellen für Finger und Web-Tastatur, damit nichts hängen bleibt. */
export function PianoKeyboard({
  onPitch,
  selected,
  highlights = [],
  spellPitch,
  enabled = true,
}: PianoKeyboardProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const { colors, reduceMotion } = useUiTheme();
  const pianoStatus = usePianoStatus((state) => state.status);
  const [labels, setLabels] = useState<KeyboardLabels>(locale === 'de' ? 'de' : 'intl');
  const [rangeName, setRangeName] = useState<RangeName>('practice');
  const [zoom, setZoom] = useState(0);
  const [scrollMode, setScrollMode] = useState(false);
  const [sheet, setSheet] = useState<'settings' | 'labels' | 'range' | null>(null);
  const canvas = useRef<View>(null);
  const scroller = useRef<ScrollView>(null);
  const scrollX = useRef(0);
  const viewportWidth = useRef(0);
  const range = RANGES[rangeName];
  const layout = useMemo(() => keyboardLayout(range, KEY_WIDTHS[zoom]), [range, zoom]);
  const selectedMidi = selected ? keyboardMidi(selected) : undefined;
  // react-native-web unterstützt touchAction; die nativen ViewStyle-Typen kennen es nicht.
  const webTouchStyle: object =
    Platform.OS === 'web' ? { touchAction: scrollMode ? 'pan-x' : 'none' } : {};

  const { held, sources, stop, changeSource, pulse } = usePianoInput({
    onPitch,
    enabled: enabled && !scrollMode,
    ...(spellPitch ? { spellPitch } : {}),
  });
  useWebPianoInput(canvas, { changeSource, stop, enabled, scrollMode, layout });
  const selectedNote = useRef(selectedMidi);
  selectedNote.current = selectedMidi;

  useEffect(() => {
    stop();
    const anchor = selectedNote.current ?? 60;
    const key = layout.keys.find((item) => item.midi === anchor) ?? layout.keys[0];
    scrollX.current = Math.max(0, Math.min(key?.left ?? 0, layout.width - viewportWidth.current));
    scroller.current?.scrollTo({ x: scrollX.current, animated: false });
    // Ein neuer Ausschnitt oder Zoom beendet gehaltene Töne; Auswahl einer Note scrollt nicht ständig.
  }, [layout, stop]);
  const nativeTouches = (event: GestureResponderEvent) => {
    if (scrollMode || !enabled) return;
    const ids = new Set<string>();
    for (const touch of event.nativeEvent.touches) {
      const id = `touch:${touch.identifier}`;
      ids.add(id);
      changeSource(id, keyboardHit(layout, touch.locationX, touch.locationY)?.midi);
    }
    for (const id of sources.current.keys()) {
      if (id.startsWith('touch:') && !ids.has(id)) changeSource(id, undefined);
    }
  };
  const page = (direction: 1 | -1) => {
    stop();
    const step = (KEY_WIDTHS[zoom] ?? 80) * 7;
    scrollX.current = Math.max(
      0,
      Math.min(layout.width - viewportWidth.current, scrollX.current + direction * step),
    );
    scroller.current?.scrollTo({ x: scrollX.current, animated: !reduceMotion });
  };

  return (
    <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.heading}>
        <AppText variant="title3">{t('piano.title')}</AppText>
        <Button
          style={styles.compactButton}
          size="medium"
          variant="ghost"
          label={t('piano.settings')}
          onPress={() => {
            stop();
            setSheet('settings');
          }}
        />
      </View>
      <ScrollView
        ref={scroller}
        horizontal
        scrollEnabled={scrollMode}
        showsHorizontalScrollIndicator
        onLayout={(event) => {
          viewportWidth.current = event.nativeEvent.layout.width;
        }}
        onScroll={(event) => {
          scrollX.current = event.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        style={styles.viewport}
      >
        <View
          ref={canvas}
          testID="piano-canvas"
          aria-label={t('piano.title')}
          {...(Platform.OS === 'web' ? { tabIndex: 0 } : {})}
          style={[{ width: layout.width, height: layout.height }, webTouchStyle]}
        >
          {layout.keys.map((key) => {
            const status = highlights.find((item) => keyboardMidi(item.pitch) === key.midi)?.kind;
            const pitch = keyboardPitch(key.midi, spellPitch?.(key.midi));
            const names = keyboardSpokenNames(key.midi, locale === 'de' ? 'de' : 'en', pitch);
            const name = names.reduce(
              (combined, name, index) =>
                index === 0 ? name : t('piano.eitherName', { sharp: combined, flat: name }),
              '',
            );
            return (
              <KeyboardKey
                key={key.midi}
                pianoKey={key}
                height={key.black ? layout.blackHeight : layout.height}
                held={held.has(key.midi)}
                selected={selectedMidi === key.midi}
                status={status}
                label={keyboardLabel(pitch, labels)}
                spoken={status ? `${name}, ${t(`highlight.${status}`)}` : name}
                disabled={!enabled || scrollMode}
                onPress={() => {
                  pulse(key.midi);
                }}
              />
            );
          })}
          {Platform.OS !== 'web' ? (
            <View
              testID="piano-touch-surface"
              accessible={false}
              style={StyleSheet.absoluteFill}
              pointerEvents={scrollMode || !enabled ? 'none' : 'auto'}
              onStartShouldSetResponder={() => !scrollMode && enabled}
              onMoveShouldSetResponder={() => !scrollMode && enabled}
              onResponderGrant={nativeTouches}
              onResponderStart={nativeTouches}
              onResponderMove={nativeTouches}
              onResponderEnd={nativeTouches}
              onResponderRelease={nativeTouches}
              onResponderTerminate={stop}
              onResponderTerminationRequest={() => false}
            />
          ) : null}
        </View>
      </ScrollView>
      <View style={styles.controls}>
        <Button
          style={styles.compactButton}
          size="medium"
          variant="ghost"
          label={t('piano.lower')}
          onPress={() => {
            page(-1);
          }}
        />
        <Button
          style={styles.compactButton}
          size="medium"
          variant={scrollMode ? 'primary' : 'secondary'}
          label={scrollMode ? t('piano.playMode') : t('piano.moveMode')}
          onPress={() => {
            stop();
            setScrollMode(!scrollMode);
          }}
        />
        <Button
          style={styles.compactButton}
          size="medium"
          variant="ghost"
          label={t('piano.higher')}
          onPress={() => {
            page(1);
          }}
        />
      </View>
      {scrollMode ? (
        <AppText variant="footnote" tone="muted">
          {t('piano.moveHint')}
        </AppText>
      ) : null}
      {pianoStatus === 'loading' || pianoStatus === 'error' ? (
        <AppText variant="footnote" tone="muted" aria-live="polite">
          {t(`audioTest.piano_${pianoStatus}`)}
        </AppText>
      ) : null}
      <BottomSheet
        visible={sheet === 'settings'}
        onClose={() => {
          setSheet(null);
        }}
        title={t('piano.settings')}
        closeLabel={t('common.close')}
      >
        <View style={styles.settings}>
          <AppText variant="small" tone="muted">
            {t(`piano.range_${rangeName}`)}
          </AppText>
          <View style={styles.controls}>
            <Button
              style={styles.compactButton}
              size="medium"
              variant="secondary"
              label={t('piano.labels')}
              onPress={() => {
                setSheet('labels');
              }}
            />
            <Button
              style={styles.compactButton}
              size="medium"
              variant="secondary"
              label={t('piano.range')}
              onPress={() => {
                setSheet('range');
              }}
            />
            <Button
              style={styles.compactButton}
              size="medium"
              variant="ghost"
              label={t('piano.smaller')}
              accessibilityHint={t('piano.smallerHint')}
              disabled={zoom === 0}
              onPress={() => {
                setZoom(zoom - 1);
              }}
            />
            <Button
              style={styles.compactButton}
              size="medium"
              variant="ghost"
              label={t('piano.larger')}
              accessibilityHint={t('piano.largerHint')}
              disabled={zoom === KEY_WIDTHS.length - 1}
              onPress={() => {
                setZoom(zoom + 1);
              }}
            />
          </View>
          <AppText variant="footnote" tone="muted">
            {t('piano.playHint')}
          </AppText>
          {Platform.OS === 'web' ? (
            <AppText variant="footnote" tone="muted">
              {t('piano.shortcutHint')}
            </AppText>
          ) : null}
        </View>
      </BottomSheet>
      <OptionSheet
        visible={sheet === 'labels'}
        onClose={() => {
          setSheet(null);
        }}
        title={t('piano.labels')}
        selected={labels}
        options={(['none', 'de', 'intl'] as const).map((value) => ({
          value,
          label: t(`piano.labels_${value}`),
        }))}
        onSelect={setLabels}
      />
      <OptionSheet
        visible={sheet === 'range'}
        onClose={() => {
          setSheet(null);
        }}
        title={t('piano.range')}
        selected={rangeName}
        options={(['practice', 'middle', 'full'] as const).map((value) => ({
          value,
          label: t(`piano.range_${value}`),
        }))}
        onSelect={setRangeName}
      />
    </View>
  );
}

function KeyboardKey({
  pianoKey,
  height,
  held,
  selected,
  status,
  label,
  spoken,
  disabled,
  onPress,
}: {
  readonly pianoKey: PianoKey;
  readonly height: number;
  readonly held: boolean;
  readonly selected: boolean;
  readonly status: KeyStatus | undefined;
  readonly label: string;
  readonly spoken: string;
  readonly disabled: boolean;
  readonly onPress: () => void;
}) {
  const { colors, scheme, reduceMotion } = useUiTheme();
  const pressed = useSharedValue(0);
  useEffect(() => {
    pressed.value = moveTo(held ? 1 : 0, 'firm', reduceMotion);
  }, [held, pressed, reduceMotion]);
  const animation = useAnimatedStyle(() => ({
    transform: [{ translateY: reduceMotion ? 0 : pressed.value * 2 }],
  }));
  const strong = held || status === 'correct' || status === 'wrong';
  const background = held
    ? colors.primary
    : status === 'correct'
      ? colors.success
      : status === 'wrong'
        ? colors.danger
        : selected
          ? colors.primarySoft
          : pianoKey.black
            ? scheme === 'dark'
              ? colors.background
              : colors.text
            : colors.surface;
  const foreground = held
    ? colors.onPrimary
    : status === 'correct'
      ? colors.onSuccess
      : status === 'wrong'
        ? colors.onDanger
        : pianoKey.black && scheme === 'light' && !selected
          ? colors.surface
          : colors.text;
  const mark = status === 'correct' ? 'check' : status === 'wrong' ? 'close' : 'target';
  return (
    <Animated.View
      style={[
        styles.key,
        { left: pianoKey.left, width: pianoKey.width, height, zIndex: pianoKey.black ? 2 : 1 },
        animation,
      ]}
    >
      <Pressable
        testID={`piano-key-${String(pianoKey.midi)}`}
        role="button"
        aria-label={spoken}
        aria-pressed={held || selected}
        aria-disabled={disabled}
        disabled={disabled}
        onPress={onPress}
        style={[
          styles.keyFace,
          {
            backgroundColor: background,
            borderColor: strong || selected ? colors.primary : colors.borderStrong,
          },
        ]}
      >
        <View pointerEvents="none" aria-hidden style={styles.keyLabel}>
          {held || selected || status ? <Icon name={mark} color={foreground} size={20} /> : null}
          {label ? (
            <MusicText variant="footnote" style={{ color: foreground, textAlign: 'center' }}>
              {label}
            </MusicText>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  settings: { gap: SPACE.l },
  panel: { gap: SPACE.m, padding: SPACE.m, borderRadius: RADIUS.card, borderWidth: 1 },
  heading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACE.s,
  },
  compactButton: { minWidth: TOUCH.min, paddingHorizontal: SPACE.s },
  controls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.s },
  viewport: { borderRadius: RADIUS.input },
  key: { position: 'absolute', top: 0, paddingBottom: 3 },
  keyFace: {
    flex: 1,
    borderWidth: 1,
    borderBottomWidth: 4,
    borderBottomLeftRadius: RADIUS.mark,
    borderBottomRightRadius: RADIUS.mark,
    justifyContent: 'flex-end',
  },
  keyLabel: {
    gap: SPACE.xs,
    alignItems: 'center',
    paddingHorizontal: SPACE.xs,
    paddingBottom: SPACE.s,
  },
});
