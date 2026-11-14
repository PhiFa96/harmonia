import { useRef, useState } from 'react';
import type { ScrollView, View } from 'react-native';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { createRng, generateContext, createSession, answerSession } from '@harmonia/exercises';
import type { ContextItem } from '@harmonia/exercises';
import { parseScore } from '@harmonia/notation';
import { UiProvider } from '@harmonia/ui/native';
import { ExerciseTask } from '@/components/exercise-task';
import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';

jest.mock('@/audio', () => ({
  usePianoStatus: () => 'ready',
  getAudioEngine: () => ({ stopAll: jest.fn() }),
}));

function Fixture({ item }: { item: ContextItem }) {
  const [answer, setAnswer] = useState<string | null>(null),
    [session, setSession] = useState(() => createSession([item])),
    question = useRef<View>(null),
    scroll = useRef<ScrollView>(null);
  return (
    <UiProvider scheme="light">
      <ExerciseTask
        item={item}
        session={session}
        answer={answer}
        question={question}
        scroll={scroll}
        scrollAfterCheck={false}
        progressText=""
        progressLabel=""
        hearingPausedText=""
        continueLabel=""
        onSelect={setAnswer}
        onCheck={(value) => {
          setSession(answerSession(session, value));
        }}
        onHint={jest.fn()}
        onSkip={jest.fn()}
        onNext={jest.fn()}
      />
    </UiProvider>
  );
}

beforeEach(() => {
  useSettings.setState({ sound: true, locale: null });
});

for (const locale of ['de', 'en-US', 'en-GB'] as const)
  it.each(['ascending-semitone', 'descending-tone'] as const)(
    `${locale}: the %s cantus explanation appears after checking the actual score`,
    async (kind) => {
      useSettings.setState({ locale, noteNaming: 'auto' });
      await i18n.changeLanguage(locale);
      const score =
          kind === 'ascending-semitone'
            ? 'treble | 4/4 | C5/1 | G4/1 | D5/1 | C5/1\ntreble | 4/4 | C4/1 | E4/1 | B3/1 | C4/1'
            : 'treble | 4/4 | C5/1 | E5/1 | B4/1 | C5/1\ntreble | 4/4 | C4/1 | G4/1 | D4/1 | C4/1',
        item = {
          ...generateContext({ topics: ['counterpoint-check'] }, createRng(0)),
          source: { kind: 'score' as const, score: parseScore(score) },
        };
      renderRouter({ index: () => <Fixture item={item} /> });
      expect(screen.getByText(/7→1.+2→1/)).toBeTruthy();
      expect(screen.queryByText(/Cantus: /)).toBeNull();
      expect(screen.getByRole('button', { name: i18n.t('practice.check') })).toBeDisabled();
      // A wrong user answer must still receive the source's actual cadence explanation.
      fireEvent.press(
        screen.getByTestId(
          kind === 'ascending-semitone' ? 'answer-boolean:no' : 'answer-boolean:yes',
        ),
      );
      fireEvent.press(screen.getByRole('button', { name: i18n.t('practice.check') }));
      const notes =
        locale === 'de'
          ? kind === 'ascending-semitone'
            ? /Cantus: h → c¹\./
            : /Cantus: d¹ → c¹\./
          : kind === 'ascending-semitone'
            ? /Cantus: B3 → C4\./
            : /Cantus: D4 → C4\./;
      expect(screen.getByText(notes)).toBeTruthy();
      expect(screen.getByTestId('answer-boolean:yes')).toBeDisabled();
      expect(screen.queryByText(/\$t\(|\{\{/)).toBeNull();
    },
  );
