import { render, screen } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { UiProvider } from '@harmonia/ui/native';
import { createRng, generateChoir, CHOIR_BINS, CHOIR_PROFILE } from '@harmonia/exercises';
import { ChoirAnswerInput } from '@/components/choir-answer-input';
import { i18n } from '@/i18n';

jest.mock('expo-router', () => ({ useFocusEffect: () => undefined }));

beforeEach(() => {
  jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
});
afterEach(() => jest.restoreAllMocks());

for (const locale of ['de', 'en-US', 'en-GB'] as const)
  it(`${locale}: explains tenor clef, first checked answer and actual shared scoring parameters`, async () => {
    await i18n.changeLanguage(locale);
    const tenor = generateChoir(
      { voice: 'tenor', piece: 'home', fifths: 0, edition: 2 },
      createRng(1),
    );
    const app = render(
      <UiProvider scheme="light">
        <ChoirAnswerInput item={tenor} answer={null} onSelect={jest.fn()} />
      </UiProvider>,
    );
    expect(screen.getByText(i18n.t('exercise.choirTenorClef'))).toBeTruthy();
    expect(screen.getByText(i18n.t('exercise.choirFirstCheck'))).toBeTruthy();
    expect(
      screen.getByText(
        i18n.t('exercise.choirProfile', {
          tolerance: CHOIR_PROFILE.toleranceCents,
          minimum: CHOIR_PROFILE.minimumDetectedWindows,
          total: CHOIR_BINS,
          matching: CHOIR_PROFILE.matchingPercent,
        }),
      ),
    ).toBeTruthy();
    expect(screen.getByText(i18n.t('exercise.choirDraft'))).toBeTruthy();
    const soprano = generateChoir(
      { voice: 'soprano', piece: 'home', fifths: 0, edition: 2 },
      createRng(1),
    );
    app.rerender(
      <UiProvider scheme="light">
        <ChoirAnswerInput item={soprano} answer={null} onSelect={jest.fn()} />
      </UiProvider>,
    );
    expect(screen.queryByText(i18n.t('exercise.choirTenorClef'))).toBeNull();
  });
