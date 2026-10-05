import { LOCALE_NAMES } from '@harmonia/i18n';
import type { Pitch } from '@harmonia/notation';
import type { ColorScheme, TextVariant } from '@harmonia/ui';
import { COLORS, LAYOUT, RADIUS, SPACE } from '@harmonia/ui';
import {
  AppText,
  BottomSheet,
  Button,
  Card,
  FeedbackBanner,
  ListGroup,
  MusicText,
  ListItem,
  ProgressBar,
  Toggle,
  UiProvider,
  useUiTheme,
} from '@harmonia/ui/native';
import { Redirect, Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useSettings } from '@/state/settings';
import { PianoKeyboard } from '@/components/piano-keyboard';

// Galerie aller Bausteine (P1.06), nur in Entwicklungsbuilds. Vorschau wahlweise hell oder dunkel,
// unabhängig vom Erscheinungsbild der App.

const VARIANTS: readonly TextVariant[] = [
  'display',
  'title1',
  'title2',
  'title3',
  'body',
  'small',
  'footnote',
  'overline',
];

export default function GalleryScreen() {
  const { t } = useTranslation();
  const app = useUiTheme();
  const reduceMotion = useSettings((state) => state.reduceMotion);
  const haptics = useSettings((state) => state.haptics);
  const [scheme, setScheme] = useState<ColorScheme>(app.scheme);
  if (!__DEV__) {
    return <Redirect href="/" />;
  }
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('gallery.title') }} />
      <UiProvider scheme={scheme} reduceMotion={reduceMotion} haptics={haptics}>
        <ScrollView
          style={{ backgroundColor: COLORS[scheme].background }}
          contentContainerStyle={styles.container}
        >
          <View style={styles.content}>
            <AppText tone="muted">{t('gallery.intro')}</AppText>
            <Section title={t('gallery.preview')}>
              <View style={styles.row}>
                {(['light', 'dark'] as const).map((value) => (
                  <Button
                    key={value}
                    size="medium"
                    variant={scheme === value ? 'primary' : 'secondary'}
                    label={
                      value === 'light' ? t('profile.appearanceLight') : t('profile.appearanceDark')
                    }
                    onPress={() => {
                      setScheme(value);
                    }}
                    style={styles.grow}
                  />
                ))}
              </View>
            </Section>
            <Typography />
            <Buttons />
            <Progress />
            <Feedback />
            <Section title={t('gallery.card')}>
              <Card>
                <AppText>{t('gallery.cardText')}</AppText>
              </Card>
            </Section>
            <Lists />
            <Sheet />
            <Piano />
          </View>
        </ScrollView>
      </UiProvider>
    </>
  );
}

function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="overline" tone="muted">
        {title}
      </AppText>
      {children}
    </View>
  );
}

function Typography() {
  const { t } = useTranslation();
  const samples: Readonly<Record<TextVariant, string>> = {
    display: t('gallery.sampleDisplay'),
    title1: t('gallery.title'),
    title2: t('gallery.sampleTitle'),
    title3: t('gallery.text'),
    body: t('gallery.sampleBody'),
    small: t('gallery.progressValue', { done: 6, total: 10 }),
    footnote: t('gallery.sampleMuted'),
    overline: t('gallery.buttons'),
  };
  return (
    <Section title={t('gallery.text')}>
      {VARIANTS.map((variant) => (
        <AppText key={variant} variant={variant}>
          {samples[variant]}
        </AppText>
      ))}
      <AppText tone="muted">{t('gallery.sampleMuted')}</AppText>
      <MusicText>{t('gallery.sampleAccidentals')}</MusicText>
    </Section>
  );
}

function Buttons() {
  const { t } = useTranslation();
  return (
    <Section title={t('gallery.buttons')}>
      <Button label={t('gallery.primary')} />
      <Button variant="secondary" icon="speaker" label={t('gallery.secondary')} />
      <Button variant="ghost" icon="headphones" label={t('gallery.ghost')} />
      <View style={styles.row}>
        <Button variant="success" label={t('gallery.success')} style={styles.grow} />
        <Button variant="danger" label={t('gallery.danger')} style={styles.grow} />
      </View>
      <Button disabled label={t('gallery.disabled')} />
    </Section>
  );
}

function Progress() {
  const { t } = useTranslation();
  const [done, setDone] = useState(4);
  const total = 10;
  return (
    <Section title={t('gallery.progress')}>
      <ProgressBar
        value={done / total}
        label={t('gallery.progress')}
        valueText={t('gallery.progressValue', { done, total })}
      />
      <Button
        variant="secondary"
        size="medium"
        label={t('gallery.more')}
        onPress={() => {
          setDone((value) => (value >= total ? 0 : value + 1));
        }}
      />
    </Section>
  );
}

function Feedback() {
  const { t } = useTranslation();
  const [round, setRound] = useState(0);
  return (
    <Section title={t('gallery.feedback')}>
      <FeedbackBanner
        key={`correct-${String(round)}`}
        kind="correct"
        title={t('practice.correctTitle')}
        message={t('gallery.correctMessage')}
        replayLabel={t('gallery.replay')}
        onReplay={() => undefined}
        style={styles.banner}
      >
        <Button
          variant="success"
          label={t('gallery.success')}
          onPress={() => {
            setRound((value) => value + 1);
          }}
          style={styles.grow}
        />
      </FeedbackBanner>
      <FeedbackBanner
        key={`wrong-${String(round)}`}
        kind="wrong"
        title={t('practice.wrongTitle')}
        message={t('gallery.wrongMessage')}
        style={styles.banner}
      >
        <Button variant="danger" label={t('gallery.danger')} style={styles.grow} />
      </FeedbackBanner>
    </Section>
  );
}

function Lists() {
  const { t } = useTranslation();
  const [vibration, setVibration] = useState(true);
  const [motion, setMotion] = useState(false);
  const [standalone, setStandalone] = useState(true);
  return (
    <Section title={t('gallery.list')}>
      <ListGroup>
        <ListItem
          icon="globe"
          label={t('profile.language')}
          value={LOCALE_NAMES.de}
          onPress={() => undefined}
        />
        <ListItem
          icon="vibration"
          label={t('profile.haptics')}
          toggle={{ value: vibration, onValueChange: setVibration }}
        />
        <ListItem
          icon="motion"
          label={t('profile.reduceMotion')}
          toggle={{ value: motion, onValueChange: setMotion }}
          last
        />
      </ListGroup>
      <Toggle value={standalone} onValueChange={setStandalone} label={t('gallery.list')} />
    </Section>
  );
}

function Piano() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Pitch>();
  return (
    <Section title={t('piano.title')}>
      <PianoKeyboard onPitch={setSelected} {...(selected ? { selected } : {})} />
    </Section>
  );
}

function Sheet() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <Section title={t('gallery.sheet')}>
      <Button
        variant="secondary"
        label={t('gallery.openSheet')}
        onPress={() => {
          setOpen(true);
        }}
      />
      <BottomSheet
        visible={open}
        onClose={() => {
          setOpen(false);
        }}
        title={t('gallery.sheetTitle')}
        closeLabel={t('common.close')}
      >
        <AppText>{t('gallery.sheetText')}</AppText>
        <Button
          label={t('gallery.success')}
          onPress={() => {
            setOpen(false);
          }}
        />
      </BottomSheet>
    </Section>
  );
}

const styles = StyleSheet.create({
  container: { padding: LAYOUT.screenPadding, paddingBottom: SPACE.xxxl },
  content: {
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
    gap: SPACE.xl,
  },
  section: { gap: SPACE.m },
  row: { flexDirection: 'row', gap: SPACE.m },
  grow: { flex: 1 },
  banner: { borderRadius: RADIUS.card },
});
