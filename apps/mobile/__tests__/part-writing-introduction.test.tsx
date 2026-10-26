import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { render } from '@testing-library/react-native';
import { catalogue } from '@harmonia/content/authoring';
import { UiProvider } from '@harmonia/ui/native';
import PartWritingScreen from '@/app/part-writing';
import { ArticleExample } from '@/components/article-example';
import { i18n } from '@/i18n';
import type { ComponentProps } from 'react';
import type { ExerciseTask } from '@/components/exercise-task';

const mockPlay = jest.fn(() => Promise.resolve());
const mockStop = jest.fn();
type TaskProps = ComponentProps<typeof ExerciseTask>;
const mockTask = jest.fn<null, [TaskProps]>(() => null);
jest.mock('@/components/use-exercise-playback', () => ({
  useExercisePlayback: () => ({
    playing: false,
    heard: false,
    error: false,
    play: mockPlay,
    stop: mockStop,
  }),
}));
jest.mock('@/components/exercise-task', () => ({
  ExerciseTask: (props: TaskProps) => mockTask(props),
}));

beforeEach(() => {
  mockTask.mockClear();
  mockPlay.mockClear();
  mockStop.mockClear();
  void i18n.changeLanguage('de');
});

for (const lesson of catalogue.lessons.filter((entry) => entry.id.includes('.writing.'))) {
  it(`${lesson.id}: shows the actual four-voice introduction before opening a task`, () => {
    renderRouter(
      { 'part-writing': PartWritingScreen, index: () => null },
      {
        initialUrl: '/part-writing',
        wrapper: ({ children }) => <UiProvider scheme="light">{children}</UiProvider>,
      },
    );
    fireEvent.press(screen.getByTestId(`satb-start-${lesson.id}`));
    expect(screen.getByTestId('lesson-example-scroll')).toBeTruthy();
    expect(screen.getAllByRole('img')).toHaveLength(4);
    expect(mockTask).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText(i18n.t('lesson.example')));
    expect(mockPlay).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByText(i18n.t('lesson.start', { count: 3 })));
    expect(mockStop).toHaveBeenCalled();
    expect(screen.queryByTestId('lesson-example-scroll')).toBeNull();
    const props = mockTask.mock.calls[0]?.[0];
    expect(props?.item).toMatchObject({ type: 'VOICE_LEADING', fifths: 0 });
    expect(props?.reportSource).toMatchObject({
      lessonId: lesson.id,
      contentVersion: 23,
      index: 0,
    });
  });
}

it('allows leaving the introduction without creating a task, then starts the next introduction fresh', () => {
  renderRouter(
    { 'part-writing': PartWritingScreen, index: () => null },
    {
      initialUrl: '/part-writing',
      wrapper: ({ children }) => <UiProvider scheme="light">{children}</UiProvider>,
    },
  );
  fireEvent.press(screen.getByTestId('satb-start-satz.l4.writing.bass.lesson'));
  fireEvent.press(screen.getByText(i18n.t('lesson.home')));
  expect(mockTask).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId('satb-start-satz.l5.writing.functions.lesson'));
  expect(screen.getAllByRole('img')).toHaveLength(4);
  expect(mockTask).not.toHaveBeenCalled();
});

it('renders polyphonic article examples and preserves the bounded single-target grand staff', () => {
  const example = catalogue.knowledgeCards.find((card) => card.id === 'satz.l5.writing.bass.card')
    ?.examples[0];
  if (!example) throw new Error('Missing SATB example');
  const view = render(
    <UiProvider scheme="light">
      <ArticleExample
        locale="de"
        example={{ score: example.score, caption: 'Polyphonic fixture' }}
      />
    </UiProvider>,
  );
  expect(screen.getAllByRole('img')).toHaveLength(4);
  view.unmount();
  render(
    <UiProvider scheme="light">
      <ArticleExample
        locale="de"
        example={{
          score: 'treble | 4/4 | C4/1\nbass | 4/4 | r/1',
          caption: 'Single-target fixture',
        }}
      />
    </UiProvider>,
  );
  expect(screen.getByRole('img', { name: 'Single-target fixture' })).toBeTruthy();
  expect(screen.getByTestId('grand-staff-example', { includeHiddenElements: true })).toBeTruthy();
});
