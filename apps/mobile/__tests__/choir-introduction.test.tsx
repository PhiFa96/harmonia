import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { catalogue } from '@harmonia/content/authoring';
import { UiProvider } from '@harmonia/ui/native';
import ChoirScreen from '@/app/choir';
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

function open() {
  renderRouter(
    { choir: ChoirScreen, index: () => null },
    {
      initialUrl: '/choir',
      wrapper: ({ children }) => <UiProvider scheme="light">{children}</UiProvider>,
    },
  );
}

beforeEach(() => {
  mockTask.mockClear();
  mockPlay.mockClear();
  mockStop.mockClear();
  void i18n.changeLanguage('de');
});

for (const lesson of catalogue.lessons.filter((entry) => entry.unitId === 'aural.l4.choir')) {
  it(`${lesson.id}: shows both complete solo examples before opening the selected voice`, () => {
    open();
    fireEvent.press(screen.getByTestId(`choir-start-${lesson.id}`));
    expect(screen.queryByText(i18n.t('path.choirRule', { percent: 80 }))).toBeNull();
    expect(screen.getAllByRole('img')).toHaveLength(8);
    expect(mockTask).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText(i18n.t('lesson.example')));
    expect(mockPlay).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByRole('button', { name: /„Kleiner Bogen“:/ }));
    expect(mockStop).toHaveBeenCalled();
    expect(screen.getAllByRole('img')).toHaveLength(8);
    fireEvent.press(screen.getByText(i18n.t('lesson.example')));
    expect(mockPlay).toHaveBeenCalledTimes(2);
    fireEvent.press(screen.getByText(i18n.t('lesson.start', { count: 2 })));
    expect(screen.queryByTestId('lesson-example-scroll')).toBeNull();
    const props = mockTask.mock.calls[0]?.[0];
    expect(props?.item).toMatchObject({
      type: 'CHOIR_PART',
      params: { voice: lesson.id.split('.')[3], piece: 'home', fifths: 0 },
    });
    expect(props?.reportSource).toMatchObject({
      lessonId: lesson.id,
      contentVersion: 27,
      index: 0,
    });
    act(() => props?.onSkipVoice?.());
    expect(mockTask.mock.calls.at(-1)?.[0].item).toMatchObject({
      type: 'CHOIR_PART',
      params: { voice: lesson.id.split('.')[3], piece: 'arch', fifths: 2 },
    });
    expect(mockTask.mock.calls.at(-1)?.[0].reportSource).toMatchObject({
      contentVersion: 27,
      index: 1,
    });
  });
}

it('leaves the introduction without opening a microphone task and resets the selected example', () => {
  open();
  fireEvent.press(screen.getByTestId('choir-start-aural.l4.choir.tenor.lesson'));
  fireEvent.press(screen.getByRole('button', { name: /„Kleiner Bogen“:/ }));
  fireEvent.press(screen.getByText(i18n.t('lesson.home')));
  expect(mockTask).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId('choir-start-aural.l4.choir.bass.lesson'));
  expect(
    screen.getByRole('button', { name: /„Heimweg“:/ }).props['accessibilityState'],
  ).toMatchObject({
    disabled: true,
  });
  expect(screen.getAllByRole('img')).toHaveLength(8);
  expect(mockTask).not.toHaveBeenCalled();
});
