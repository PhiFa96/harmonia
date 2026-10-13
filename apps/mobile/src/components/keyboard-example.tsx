import type { KeyboardRange, Score } from '@harmonia/notation';
import { signatureNoteLabel } from '@harmonia/exercises';
import {
  keyboardLabel,
  keyboardLayout,
  keyboardMidi,
  keyboardPitch,
  scoreTimeline,
} from '@harmonia/notation';
import { COLORS, FONT_FAMILIES, SPACE } from '@harmonia/ui';
import { AppText, useUiTheme } from '@harmonia/ui/native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, View } from 'react-native';
import Svg, { Circle, G, Rect, Text as SvgText } from 'react-native-svg';
import { useLocale } from '@/i18n';

/** Statische Lernabbildung: dieselben Tonhöhen wie im Notenbild, keine Eingabe oder Wiedergabe. */
export function KeyboardExample({
  score,
  range,
  showOctaves = false,
}: {
  readonly score: Score;
  readonly range: KeyboardRange;
  readonly showOctaves?: boolean;
}) {
  const { t } = useTranslation(),
    locale = useLocale(),
    { colors } = useUiTheme();
  const [width, setWidth] = useState(0);
  const layout = useMemo(() => keyboardLayout(range), [range]);
  const pitches = useMemo(
    () => scoreTimeline(score, { bpm: 90 }).tones.map(({ pitch }) => pitch),
    [score],
  );
  const active = new Set(pitches.map(keyboardMidi));
  const notes = [
    ...new Set(pitches.map((pitch) => keyboardLabel(pitch, locale === 'de' ? 'de' : 'intl'))),
  ];
  const whiteWidth = layout.keys.find((key) => !key.black)?.width ?? SPACE.xxxl;
  const svgWidth = width
    ? Math.max(width, showOctaves ? (layout.width * SPACE.xxxl) / whiteWidth : 0)
    : 0;
  const height = svgWidth ? layout.height * Math.min(1, svgWidth / layout.width) : 0;
  const scrollable = width > 0 && svgWidth > width + 1;
  return (
    <View
      style={{ gap: SPACE.s }}
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width);
      }}
    >
      <View
        accessible
        role="img"
        aria-label={t('lesson.keyboardExample', { notes: notes.join(', ') })}
        testID="keyboard-example"
      >
        <ScrollView
          horizontal
          testID="keyboard-example-scroll"
          {...(Platform.OS === 'web' && scrollable ? { tabIndex: 0 } : {})}
        >
          <View aria-hidden importantForAccessibility="no-hide-descendants">
            <Svg
              width={svgWidth}
              height={height}
              viewBox={`0 0 ${String(layout.width)} ${String(layout.height)}`}
              preserveAspectRatio="xMidYMid meet"
            >
              {[
                ...layout.keys.filter((key) => !key.black),
                ...layout.keys.filter((key) => key.black),
              ].map((key) => {
                const marked = active.has(key.midi),
                  h = key.black ? layout.blackHeight : layout.height;
                return (
                  <G key={key.midi}>
                    <Rect
                      transform={[{ translateX: key.left }]}
                      width={key.width}
                      height={h}
                      fill={
                        marked
                          ? colors.primary
                          : key.black
                            ? COLORS.light.text
                            : COLORS.light.surface
                      }
                      stroke={marked ? colors.onPrimary : COLORS.light.borderStrong}
                      strokeWidth={2}
                    />
                    {marked ? (
                      <Circle
                        cx={key.left + key.width / 2}
                        cy={h - (key.black ? SPACE.xl : SPACE.xxxl + SPACE.s)}
                        r={SPACE.s}
                        fill={colors.onPrimary}
                      />
                    ) : null}
                    {!key.black ? (
                      <SvgText
                        // eslint-disable-next-line @typescript-eslint/no-deprecated
                        x={key.left + key.width / 2}
                        // eslint-disable-next-line @typescript-eslint/no-deprecated
                        y={h - SPACE.m}
                        textAnchor="middle"
                        fontFamily={FONT_FAMILIES.bold}
                        fontSize={SPACE.xxl}
                        fill={marked ? colors.onPrimary : COLORS.light.text}
                      >
                        {showOctaves
                          ? keyboardLabel(keyboardPitch(key.midi), locale === 'de' ? 'de' : 'intl')
                          : signatureNoteLabel(keyboardPitch(key.midi), locale)}
                      </SvgText>
                    ) : null}
                  </G>
                );
              })}
            </Svg>
          </View>
        </ScrollView>
      </View>
      {scrollable ? (
        <AppText variant="footnote" tone="muted">
          {t('lesson.scrollKeyboardExample')}
        </AppText>
      ) : null}
      <AppText variant="footnote" tone="muted">
        {t('lesson.keyboardMarkers')}
      </AppText>
    </View>
  );
}
