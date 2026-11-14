import { useRef, useState } from 'react';
import type { ScrollView, View } from 'react-native';
import { AppState } from 'react-native';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { createAudioEngine } from '@harmonia/audio';
import type { AudioEngine } from '@harmonia/audio';
import {
  createRng,
  createSession,
  expectedAnswer,
  generateChoir,
  revealHint,
} from '@harmonia/exercises';
import { UiProvider } from '@harmonia/ui/native';
import { FakeContext, FakeTimers } from '../../../packages/audio/src/testing/fake-context';
import { ExerciseTask } from '@/components/exercise-task';
import { i18n } from '@/i18n';
import { startMicrophone } from '@/microphone/input';
import { useSettings } from '@/state/settings';
import type { OnPcmFrame } from '@/microphone/types';

let mockEngine: AudioEngine;
const mockClose = jest.fn(() => Promise.resolve());
const mockCreateAudio = jest.fn();
jest.mock('@/audio/choir', () => ({
  createChoirAudio: () => {
    mockCreateAudio();
    return { engine: mockEngine, close: mockClose };
  },
}));
jest.mock('@/audio', () => ({
  usePianoStatus: () => 'ready',
  getAudioEngine: () => ({ stopAll: jest.fn() }),
}));
jest.mock('@/microphone/input', () => ({ startMicrophone: jest.fn() }));

const item = generateChoir({ voice: 'soprano', piece: 'home' }, createRng(1));
const savedAnswer = expectedAnswer(item);
const checked = jest.fn();
const appStateDescriptor = Object.getOwnPropertyDescriptor(AppState, 'currentState');
function Fixture() {
  const [answer, setAnswer] = useState<string | null>(savedAnswer);
  const [session, setSession] = useState(() => createSession([item]));
  const scroll = useRef<ScrollView>(null),
    question = useRef<View>(null);
  return (
    <UiProvider scheme="light">
      <ExerciseTask
        item={item}
        session={session}
        answer={answer}
        scroll={scroll}
        question={question}
        scrollAfterCheck={false}
        progressText=""
        progressLabel=""
        hearingPausedText=""
        continueLabel=""
        onSelect={setAnswer}
        onCheck={checked}
        onHint={() => {
          setSession(revealHint(session));
        }}
        onSkip={jest.fn()}
        onNext={jest.fn()}
      />
    </UiProvider>
  );
}
beforeEach(() => {
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
  mockEngine = createAudioEngine(new FakeContext(), { timers: new FakeTimers() });
  mockCreateAudio.mockReset();
  mockClose.mockClear();
  checked.mockReset();
  jest.mocked(startMicrophone).mockReset();
  useSettings.setState({ sound: true, referenceHz: 440, locale: null });
});
afterEach(() => {
  jest.restoreAllMocks();
  if (appStateDescriptor) Object.defineProperty(AppState, 'currentState', appStateDescriptor);
});

for (const locale of ['de', 'en-US', 'en-GB'] as const) {
  it(`${locale}: a timing failure leaves no checkable answer and allows a fresh take`, async () => {
    await i18n.changeLanguage(locale);
    let frame: OnPcmFrame | undefined;
    const closeInput = jest.fn(() => Promise.resolve());
    jest.mocked(startMicrophone).mockImplementation((callback) => {
      frame = callback;
      return Promise.resolve({ stop: closeInput });
    });
    const router = renderRouter({ index: Fixture });
    fireEvent.press(screen.getByRole('button', { name: i18n.t('exercise.choirHeadphones') }));
    fireEvent.press(screen.getByTestId('choir-start'));
    await waitFor(() => {
      expect(screen.getByText(i18n.t('exercise.choirChecking'))).toBeTruthy();
    });
    await act(async () => {
      frame?.(new Float32Array(2048), 48000, 0, 'buffered');
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(screen.getByTestId('choir-status')).toHaveTextContent(
      i18n.t('exercise.choirCountIn', { beat: 1 }),
    );
    act(() => {
      const context = mockEngine.context as FakeContext;
      context.currentTime = 0.05 + (4 * 60) / item.bpm + 0.2;
      frame?.(new Float32Array(2048), 48000, (context.currentTime + 0.3) * 1000, 'buffered');
    });
    await waitFor(() => {
      expect(screen.getByText(i18n.t('exercise.choirTimingFailed'))).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: i18n.t('practice.check') })).toBeDisabled();
    expect(checked).not.toHaveBeenCalled();
    expect(screen.queryByTestId('choir-results')).toBeNull();
    await waitFor(() => {
      expect(closeInput).toHaveBeenCalledTimes(1);
    });
    fireEvent.press(screen.getByRole('button', { name: i18n.t('exercise.choirRetry') }));
    await waitFor(() => {
      expect(screen.getByText(i18n.t('exercise.choirChecking'))).toBeTruthy();
    });
    await act(async () => {
      frame?.(new Float32Array(2048), 48000, mockEngine.context.currentTime * 1000, 'buffered');
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(screen.getByTestId('choir-status')).toHaveTextContent(
      i18n.t('exercise.choirCountIn', { beat: 1 }),
    );
    expect(screen.queryByText(i18n.t('exercise.choirTimingFailed'))).toBeNull();
    expect(startMicrophone).toHaveBeenCalledTimes(2);
    fireEvent.press(screen.getByRole('button', { name: i18n.t('exercise.choirStop') }));
    act(() => {
      router.unmount();
    });
    await waitFor(() => {
      expect(closeInput).toHaveBeenCalledTimes(2);
    });
  });

  it.each(['resume', 'initialization'] as const)(
    `${locale}: a preview %s failure keeps the existing answer checkable and retryable`,
    async (failure) => {
      await i18n.changeLanguage(locale);
      if (failure === 'resume')
        jest.spyOn(mockEngine, 'resume').mockRejectedValueOnce(new Error('Audio unavailable'));
      else
        mockCreateAudio.mockImplementationOnce(() => {
          throw new Error('Audio unavailable');
        });
      const router = renderRouter({ index: Fixture });
      fireEvent.press(screen.getByRole('button', { name: i18n.t('exercise.choirHeadphones') }));
      const check = () => screen.getByRole('button', { name: i18n.t('practice.check') });
      const preview = () => screen.getByRole('button', { name: i18n.t('exercise.choirSolo') });
      expect(check()).toBeEnabled();
      fireEvent.press(preview());
      await waitFor(() => {
        expect(screen.getByText(i18n.t('exercise.choirPreviewFailed'))).toBeTruthy();
      });
      expect(check()).toBeEnabled();
      expect(preview()).toBeEnabled();
      expect(screen.getByTestId('choir-start')).toBeEnabled();
      expect(startMicrophone).not.toHaveBeenCalled();
      expect(checked).not.toHaveBeenCalled();
      fireEvent.press(preview());
      await waitFor(() => {
        expect(screen.getByTestId('choir-status')).toHaveTextContent(
          i18n.t('exercise.choirPreview'),
        );
      });
      expect(screen.queryByText(i18n.t('exercise.choirPreviewFailed'))).toBeNull();
      fireEvent.press(screen.getByRole('button', { name: i18n.t('exercise.choirStop') }));
      expect(check()).toBeEnabled();
      fireEvent.press(check());
      expect(checked.mock.calls).toEqual([[savedAnswer]]);
      act(() => {
        router.unmount();
      });
      await waitFor(() => {
        expect(mockClose).toHaveBeenCalledTimes(1);
      });
    },
  );
}
