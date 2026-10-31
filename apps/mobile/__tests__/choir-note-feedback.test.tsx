import { render, screen } from '@testing-library/react-native';
import { UiProvider } from '@harmonia/ui/native';
import {
  assessChoir,
  choirAnswerId,
  createRng,
  expectedAnswer,
  generateChoir,
} from '@harmonia/exercises';
import { ChoirNoteFeedback } from '@/choir/note-feedback';
import { i18n } from '@/i18n';

const item = generateChoir({ voice: 'soprano', piece: 'home', fifths: 2 }, createRng(1));
const rows = () => JSON.parse(expectedAnswer(item).slice(6)) as (number | null)[][];

for (const locale of ['de', 'en-US', 'en-GB'] as const) {
  it(`${locale}: shows all four window states with labels, counts and the actual octave correction`, async () => {
    await i18n.changeLanguage(locale);
    const samples = rows().map((row) => row.map((n) => (n === null ? null : n + 1200)));
    const target = samples[0]?.[0];
    if (target === undefined || target === null) throw new Error('Pitch fixture missing');
    samples[0] = [0, -51, 51, null, ...Array<number>(8).fill(0)].map((offset) =>
      offset === null ? null : target + offset,
    );
    const report = assessChoir(item, choirAnswerId(samples));
    expect(report.octaveShift).toBe(1);
    const note = report.notes[0];
    if (!note) throw new Error('Note fixture missing');
    render(
      <UiProvider scheme="light">
        <ChoirNoteFeedback note={note} pitch="F#4" />
      </UiProvider>,
    );
    expect(
      screen.getByText(i18n.t('exercise.choirWindowCounts', { detected: 11, matching: 9 })),
    ).toBeTruthy();
    expect(
      screen.getByLabelText(
        i18n.t('exercise.choirWindowObserved', {
          note: 1,
          window: 1,
          status: i18n.t('exercise.choirWindowInTune'),
          cents: 0,
        }),
      ),
    ).toBeTruthy();
    expect(
      screen.getByLabelText(
        i18n.t('exercise.choirWindowObserved', {
          note: 1,
          window: 2,
          status: i18n.t('exercise.choirWindowLow'),
          cents: -51,
        }),
      ),
    ).toBeTruthy();
    expect(
      screen.getByLabelText(
        i18n.t('exercise.choirWindowObserved', {
          note: 1,
          window: 3,
          status: i18n.t('exercise.choirWindowHigh'),
          cents: 51,
        }),
      ),
    ).toBeTruthy();
    expect(
      screen.getByLabelText(i18n.t('exercise.choirWindowMissing', { note: 1, window: 4 })),
    ).toBeTruthy();
    expect(screen.getAllByTestId(/^choir-window-0-\d+$/)).toHaveLength(12);
    expect(screen.getByText(i18n.t('exercise.choirPass'))).toBeTruthy();
  });

  it(`${locale}: distinguishes no detection from failed tuning without a zero-denominator summary`, async () => {
    await i18n.changeLanguage(locale);
    const report = assessChoir(
      item,
      choirAnswerId(Array.from({ length: 8 }, () => Array<null>(12).fill(null))),
    );
    const note = report.notes[0];
    if (!note) throw new Error('Note fixture missing');
    render(
      <UiProvider scheme="light">
        <ChoirNoteFeedback note={note} pitch="F#4" />
      </UiProvider>,
    );
    expect(screen.getByText(i18n.t('exercise.choirNoWindows'))).toBeTruthy();
    expect(screen.getByText(i18n.t('exercise.choirMissing'))).toBeTruthy();
    expect(screen.getAllByTestId(/^choir-window-0-\d+$/)).toHaveLength(12);
    expect(
      screen.queryByText(i18n.t('exercise.choirWindowCounts', { detected: 0, matching: 0 })),
    ).toBeNull();
  });
}
