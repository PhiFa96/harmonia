import { useRef, useState } from 'react';
import type { ScrollView, View } from 'react-native';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import {
  answerSession,
  choirAnswerId,
  createRng,
  createSession,
  currentItem,
  generateChoir,
  revealHint,
  skipVoiceExercise,
} from '@harmonia/exercises';
import type { ExerciseSession } from '@harmonia/exercises';
import { UiProvider } from '@harmonia/ui/native';
import { ExerciseTask } from '@/components/exercise-task';
import { i18n } from '@/i18n';
import { startMicrophone } from '@/microphone/input';

jest.mock('@/microphone/input', () => ({ startMicrophone: jest.fn() }));
jest.mock('@/audio', () => ({
  usePianoStatus: () => 'ready',
  getAudioEngine: () => ({ stopAll: jest.fn() }),
}));

const item = generateChoir({ voice: 'soprano', piece: 'home' }, createRng(1)),
  nextItem = generateChoir({ voice: 'soprano', piece: 'arch' }, createRng(1));
const empty = Array.from({ length: 8 }, () => Array<null>(12).fill(null));
const silent = choirAnswerId(empty),
  sparse = choirAnswerId([[6400, ...Array<null>(11).fill(null)], ...empty.slice(1)]);
const selected = jest.fn(),
  checked = jest.fn();
let observed: ExerciseSession;

function Fixture({ mode }: { mode: 'pending' | 'sparse' | 'graded' }) {
  const [answer, setAnswer] = useState<string | null>(mode === 'sparse' ? sparse : silent);
  const [session, setSession] = useState(() => {
    const initial = createSession([item, nextItem]);
    return mode === 'graded' ? answerSession(initial, silent) : initial;
  });
  observed = session;
  const scroll = useRef<ScrollView>(null),
    question = useRef<View>(null);
  const current = currentItem(session);
  if (!current) throw Error('Missing current choir item');
  return (
    <UiProvider scheme="light">
      <ExerciseTask
        item={current}
        session={session}
        answer={answer}
        scroll={scroll}
        question={question}
        scrollAfterCheck={false}
        progressText=""
        progressLabel=""
        hearingPausedText=""
        continueLabel=""
        onSelect={(value) => {
          selected(value);
          setAnswer(value);
        }}
        onCheck={(value) => {
          checked(value);
          setSession(answerSession(session, value));
        }}
        onHint={() => {
          setSession(revealHint(session));
        }}
        onSkip={jest.fn()}
        onSkipVoice={() => {
          setAnswer(null);
          setSession(skipVoiceExercise(session));
        }}
        onNext={jest.fn()}
      />
    </UiProvider>
  );
}
beforeEach(() => {
  selected.mockReset();
  checked.mockReset();
  jest.mocked(startMicrophone).mockReset();
});

for (const locale of ['de', 'en-US', 'en-GB'] as const) {
  it(`${locale}: clears a pending empty take without answering or skipping; skip requires a press`, async () => {
    await i18n.changeLanguage(locale);
    renderRouter({ index: () => <Fixture mode="pending" /> });
    expect(screen.getByRole('button', { name: i18n.t('practice.check') })).toBeDisabled();
    expect(screen.getByText(i18n.t('exercise.choirNoPitchTake'))).toBeTruthy();
    expect(selected.mock.calls).toEqual([[null]]);
    expect(observed).toMatchObject({ index: 0, records: [], skipped: [] });
    expect(checked).not.toHaveBeenCalled();
    expect(startMicrophone).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: i18n.t('exercise.choirHeadphones') }));
    expect(screen.getByRole('button', { name: i18n.t('exercise.choirRetry') })).toBeEnabled();
    fireEvent.press(screen.getByRole('button', { name: i18n.t('voice.skip') }));
    expect(observed).toMatchObject({ index: 1, records: [], skipped: [0] });
  });

  it(`${locale}: keeps a sparse pending take checkable and grades it with the existing rules`, async () => {
    await i18n.changeLanguage(locale);
    renderRouter({ index: () => <Fixture mode="sparse" /> });
    expect(screen.queryByText(i18n.t('exercise.choirNoPitchTake'))).toBeNull();
    expect(selected).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: i18n.t('practice.check') }));
    expect(checked.mock.calls).toEqual([[sparse]]);
    expect(observed.records).toHaveLength(1);
    expect(observed.result).toMatchObject({ validAnswer: true, correct: false });
  });

  it(`${locale}: retains an already graded historic empty answer and its feedback`, async () => {
    await i18n.changeLanguage(locale);
    renderRouter({ index: () => <Fixture mode="graded" /> });
    expect(screen.queryByText(i18n.t('exercise.choirNoPitchTake'))).toBeNull();
    expect(screen.getByTestId('choir-results')).toBeTruthy();
    expect(selected).not.toHaveBeenCalled();
    expect(observed.records).toHaveLength(1);
    expect(observed.result).toMatchObject({ answer: silent, validAnswer: true, correct: false });
  });
}
