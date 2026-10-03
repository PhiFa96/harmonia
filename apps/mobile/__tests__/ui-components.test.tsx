import { DARK_HIGHLIGHT_COLORS, DEFAULT_HIGHLIGHT_COLORS } from '@harmonia/notation';
import type { ColorScheme } from '@harmonia/ui';
import { ACCIDENTAL_FONT, COLORS, TOUCH, highlightColors } from '@harmonia/ui';
import {
  AppText,
  BottomSheet,
  Button,
  Card,
  FeedbackBanner,
  ListItem,
  MusicText,
  ProgressBar,
  Toggle,
  UiProvider,
  splitAccidentals,
  useUiTheme,
} from '@harmonia/ui/native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { AccessibilityInfo, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-haptics', () => ({
  ...jest.requireActual<object>('expo-haptics'),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
}));

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderUi(
  node: ReactNode,
  options: { scheme?: ColorScheme; haptics?: boolean; reduceMotion?: boolean } = {},
) {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <UiProvider
        scheme={options.scheme ?? 'light'}
        haptics={options.haptics ?? true}
        reduceMotion={options.reduceMotion ?? false}
      >
        {node}
      </UiProvider>
    </SafeAreaProvider>,
  );
}

/** Zusammengeführter Stil eines Elements */
function styleOf(element: { props: Record<string, unknown> }): Record<string, unknown> {
  return StyleSheet.flatten(element.props['style'] as never);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Button', () => {
  it('ist ein beschrifteter Knopf mit mindestens 48 pt Höhe; Antippen gibt leichte Haptik', () => {
    const onPress = jest.fn();
    renderUi(<Button label="Prüfen" onPress={onPress} size="medium" />);
    const button = screen.getByRole('button', { name: 'Prüfen' });
    expect(Number(styleOf(button)['minHeight'])).toBeGreaterThanOrEqual(TOUCH.min);
    fireEvent(button, 'pressIn');
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('gesperrt: meldet sich als gesperrt und löst nichts aus', () => {
    const onPress = jest.fn();
    renderUi(<Button label="Prüfen" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Prüfen', disabled: true });
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('Farben aus den Tokens, hell und dunkel', () => {
    render(
      <SafeAreaProvider initialMetrics={METRICS}>
        <UiProvider scheme="light">
          <Button label="Hell" variant="success" />
        </UiProvider>
        <UiProvider scheme="dark">
          <Button label="Dunkel" variant="success" />
        </UiProvider>
      </SafeAreaProvider>,
    );
    expect(styleOf(screen.getByRole('button', { name: 'Hell' }))['backgroundColor']).toBe(
      COLORS.light.success,
    );
    expect(styleOf(screen.getByRole('button', { name: 'Dunkel' }))['backgroundColor']).toBe(
      COLORS.dark.success,
    );
  });

  it('ohne Haptik, wenn sie abgeschaltet ist', () => {
    renderUi(<Button label="Prüfen" onPress={jest.fn()} />, { haptics: false });
    fireEvent(screen.getByRole('button'), 'pressIn');
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});

describe('Text', () => {
  it('Titelstufen sind Überschriften, Fließtext nicht', () => {
    renderUi(
      <>
        <AppText variant="title1">Titel</AppText>
        <AppText>Fließtext</AppText>
      </>,
    );
    expect(screen.getByRole('heading', { name: 'Titel' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Fließtext' })).toBeNull();
  });

  it('Vorzeichen im Text kommen aus der Vorzeichen-Schrift; der Screenreader liest den Originaltext', () => {
    renderUi(<MusicText>F♯ und G♭, C𝄪 und D𝄫</MusicText>);
    expect(screen.getByLabelText('F♯ und G♭, C𝄪 und D𝄫')).toBeTruthy();
    const glyphs = screen.getAllByText(/^(♯|♭|\uE263|♭♭)$/u);
    expect(glyphs.map((glyph) => glyph.props['children'] as string)).toEqual([
      '♯',
      '♭',
      '\uE263',
      '♭♭',
    ]);
    for (const glyph of glyphs) {
      expect(styleOf(glyph)['fontFamily']).toBe(ACCIDENTAL_FONT);
    }
    expect(splitAccidentals('C𝄪 D')).toEqual([
      { text: 'C', accidental: false },
      { text: '𝄪', accidental: true },
      { text: ' D', accidental: false },
    ]);
  });

  it('Farbrolle „leise“ nutzt die Token-Farbe', () => {
    renderUi(<AppText tone="muted">Hinweis</AppText>);
    expect(styleOf(screen.getByText('Hinweis'))['color']).toBe(COLORS.light.textMuted);
  });
});

describe('Toggle und ListItem', () => {
  it('Schalter: Rolle switch, Zustand, Ziel mindestens 48 pt', () => {
    const onValueChange = jest.fn();
    renderUi(<Toggle value={false} onValueChange={onValueChange} label="Vibration" />);
    const toggle = screen.getByRole('switch', { name: 'Vibration', checked: false });
    const slop = toggle.props['hitSlop'] as { top: number; bottom: number };
    expect(32 + slop.top + slop.bottom).toBeGreaterThanOrEqual(TOUCH.min);
    fireEvent.press(toggle);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('Listenzeile mit Schalter ist selbst der Schalter (ein Ziel)', () => {
    const onValueChange = jest.fn();
    renderUi(<ListItem label="Bewegung reduzieren" toggle={{ value: true, onValueChange }} last />);
    const row = screen.getByRole('switch', { name: 'Bewegung reduzieren', checked: true });
    expect(screen.getAllByRole('switch')).toHaveLength(1);
    fireEvent.press(row);
    expect(onValueChange).toHaveBeenCalledWith(false);
  });

  it('Listenzeile mit Wert nennt Beschriftung und Wert', () => {
    const onPress = jest.fn();
    renderUi(<ListItem label="Sprache" value="Deutsch" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Sprache, Deutsch' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('ProgressBar', () => {
  it('meldet Wert und Text für den Screenreader', () => {
    renderUi(<ProgressBar value={0.6} label="Fortschritt der Lektion" valueText="6 von 10" />);
    expect(
      screen.getByRole('progressbar', {
        name: 'Fortschritt der Lektion',
        value: { min: 0, max: 100, now: 60, text: '6 von 10' },
      }),
    ).toBeTruthy();
  });

  it('begrenzt Werte außerhalb von 0 bis 1', () => {
    renderUi(<ProgressBar value={1.4} label="Fortschritt" />);
    expect(screen.getByRole('progressbar', { value: { now: 100 } })).toBeTruthy();
  });
});

describe('FeedbackBanner', () => {
  it('richtig: Text, Live-Region, Erfolgs-Haptik und Ansage (iOS)', () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    renderUi(
      <FeedbackBanner kind="correct" title="Richtig!" message="c¹–e¹ ist eine große Terz." />,
    );
    expect(screen.getByRole('heading', { name: 'Richtig!' })).toBeTruthy();
    expect(screen.getByText('c¹–e¹ ist eine große Terz.')).toBeTruthy();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success,
    );
    expect(announce).toHaveBeenCalledWith('Richtig!. c¹–e¹ ist eine große Terz.');
  });

  it('falsch: Warn-Haptik (sanfter als Fehler), Titel in Falsch-Farbe, Anhören-Knopf', () => {
    const onReplay = jest.fn();
    renderUi(
      <FeedbackBanner
        kind="wrong"
        title="Noch nicht ganz"
        message="Das ist eine kleine Terz."
        replayLabel="Noch mal anhören"
        onReplay={onReplay}
      />,
    );
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Warning,
    );
    expect(styleOf(screen.getByText('Noch nicht ganz'))['color']).toBe(COLORS.light.danger);
    fireEvent.press(screen.getByRole('button', { name: 'Noch mal anhören' }));
    expect(onReplay).toHaveBeenCalled();
  });
});

describe('BottomSheet', () => {
  it('zeigt Titel und Schließen-Knopf; Schließen meldet sich', () => {
    const onClose = jest.fn();
    renderUi(
      <BottomSheet visible onClose={onClose} title="Erscheinungsbild" closeLabel="Schließen">
        <Text>Inhalt</Text>
      </BottomSheet>,
    );
    expect(screen.getByRole('heading', { name: 'Erscheinungsbild' })).toBeTruthy();
    expect(screen.getByText('Inhalt')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Schließen' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('geschlossen: kein Inhalt', () => {
    renderUi(
      <BottomSheet
        visible={false}
        onClose={jest.fn()}
        title="Erscheinungsbild"
        closeLabel="Schließen"
      >
        <Text>Inhalt</Text>
      </BottomSheet>,
    );
    expect(screen.queryByText('Inhalt')).toBeNull();
  });
});

describe('Theme', () => {
  function Probe() {
    const { reduceMotion, colors } = useUiTheme();
    return <Text>{`${String(reduceMotion)} ${colors.background}`}</Text>;
  }

  it('Karte im Dunkelmodus: dunkle Fläche, Linie statt Schatten', () => {
    renderUi(
      <Card testID="card">
        <Text>x</Text>
      </Card>,
      { scheme: 'dark' },
    );
    const style = styleOf(screen.getByTestId('card'));
    expect(style['backgroundColor']).toBe(COLORS.dark.surface);
    expect(style['boxShadow']).toBeUndefined();
    expect(style['borderColor']).toBe(COLORS.dark.border);
  });

  it('„Bewegung reduzieren“ folgt der App-Einstellung', () => {
    renderUi(<Probe />, { reduceMotion: true });
    expect(screen.getByText(`true ${COLORS.light.background}`)).toBeTruthy();
  });

  it('„Bewegung reduzieren“ folgt auch der Systemeinstellung', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    renderUi(<Probe />);
    expect(await screen.findByText(`true ${COLORS.light.background}`)).toBeTruthy();
  });

  it('ohne UiProvider: verständlicher Fehler', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow('UiProvider');
  });
});

describe('Notenbild', () => {
  it('Standardfarben der Hervorhebung entsprechen den Tokens', () => {
    expect(DEFAULT_HIGHLIGHT_COLORS).toEqual(highlightColors('light'));
    expect(DARK_HIGHLIGHT_COLORS).toEqual(highlightColors('dark'));
  });
});
