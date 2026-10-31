import type { Session } from '@supabase/supabase-js';
import type { TutorRequest, TutorStreamEvent } from '@harmonia/content';
import { parseScore, scoreTimeline } from '@harmonia/notation';
import { UiProvider } from '@harmonia/ui/native';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { useAuthState } from '@/auth';
import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';
import { TutorScreen } from '@/components/tutor-screen';
import { tutorTransport } from '@/tutor/client';
import { TutorError } from '@/tutor/transport';
import {
  newTutorConversation,
  openTaskTutor,
  resetTutor,
  useTutor,
  sendTutor,
  stopTutor,
} from '@/tutor/state';
import { createFreePracticeSession, expectedAnswer, PRACTICE_SETS } from '@harmonia/exercises';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));
const mockPlay = jest.fn(() => Promise.resolve());
jest.mock('@/components/use-exercise-playback', () => ({
  useExercisePlayback: () => ({ playing: false, error: false, play: mockPlay, stop: jest.fn() }),
}));
const actorA = 'aaaaaaaa-0000-4000-8000-aaaaaaaaaaaa',
  actorB = 'bbbbbbbb-0000-4000-8000-bbbbbbbbbbbb';
const account = {
  day: '2026-10-14',
  resetAt: '2026-10-15T00:00:00+00:00',
  tier: 'premium',
  requestsUsed: 0,
  requestsLimit: 30,
  requestsRemaining: 30,
  availability: 'available',
  simulation: true,
};
const scope = {
  locale: 'de' as const,
  noteNaming: 'de' as const,
  mode: 'chat' as const,
  hintLevel: null,
  context: null,
};
const date = '2026-10-14T10:00:00Z';
const proof = {
  id: 'cccccccc-0000-4000-8000-cccccccccccc',
  issuedAt: 1_800_000_000_000,
  expiresAt: 1_800_001_800_000,
  signature: 'a'.repeat(64),
};
function signIn(id = actorA) {
  const session = { access_token: 'test-only-token', user: { id, is_anonymous: false } } as Session;
  useAuthState.setState({ session, ready: true, error: false });
}
function view() {
  return renderRouter(
    { tutor: () => <TutorScreen />, account: () => null, index: () => null },
    {
      initialUrl: '/tutor',
      wrapper: ({ children }) => <UiProvider scheme="light">{children}</UiProvider>,
    },
  );
}
let json: jest.SpyInstance, stream: jest.SpyInstance;
beforeEach(() => {
  useAuthState.setState({ session: null, ready: true, error: false });
  resetTutor();
  useSettings.setState({ locale: null });
  void i18n.changeLanguage('de');
  mockPlay.mockClear();
  json = jest.spyOn(tutorTransport, 'json').mockImplementation((path) =>
    Promise.resolve(
      path === '?view=status'
        ? account
        : path === '?view=attempt'
          ? { proof }
          : path === ''
            ? { conversations: [], next: null }
            : {
                conversation: {
                  id: useTutor.getState().conversationId,
                  context: scope,
                  created_at: date,
                  updated_at: date,
                },
                messages: [],
                next: null,
                older: null,
              },
    ),
  );
  stream = jest.spyOn(tutorTransport, 'stream').mockResolvedValue(undefined);
});
afterEach(() => {
  resetTutor();
  jest.restoreAllMocks();
});
it('zeigt KI-Kennzeichnung, Premium und Kontoaufruf für Gäste ohne API-Zugriff', () => {
  view();
  expect(screen.getByText(/Du sprichst mit einer KI/)).toBeTruthy();
  expect(screen.getByText(/Melde dich mit deinem Konto/)).toBeTruthy();
  expect(screen.getByText('Zum Konto')).toBeTruthy();
  expect(screen.queryByTestId('tutor-question')).toBeNull();
  expect(json).not.toHaveBeenCalled();
});
it('zeigt serverseitiges Kontingent und sperrt neue Anfragen bei aufgebrauchtem Budget', async () => {
  signIn();
  json.mockResolvedValue({ ...account, requestsRemaining: 0, availability: 'quota' });
  view();
  await waitFor(() => {
    expect(screen.getByText('Heute noch 0 von 30 Fragen')).toBeTruthy();
  });
  fireEvent.changeText(screen.getByTestId('tutor-question'), 'Eine Frage');
  expect(screen.getByText('Frage senden')).toBeDisabled();
  expect(screen.getByText(/Dein Tageskontingent ist aufgebraucht/)).toBeTruthy();
  expect(stream).not.toHaveBeenCalled();
});
it('zeigt Teiltext während des Streams und ruft nach Abbruch dieselbe Anfrage erneut ab', async () => {
  signIn();
  let release: (() => void) | undefined;
  const requests: TutorRequest[] = [];
  stream.mockImplementation(
    async (
      request: TutorRequest,
      _signal: AbortSignal,
      emit: (event: TutorStreamEvent) => void,
    ) => {
      requests.push(request);
      emit({
        type: 'meta',
        id: request.id,
        conversationId: request.conversationId,
        promptVersion: 2,
        toolVersion: 1,
        simulation: true,
      });
      emit({ type: 'text', text: 'Empfangener Teil' });
      if (requests.length === 1) {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        throw new TutorError('interrupted');
      }
      emit({ type: 'done', status: 'complete', replay: true });
    },
  );
  view();
  await waitFor(() => {
    expect(screen.getByText('Heute noch 30 von 30 Fragen')).toBeTruthy();
  });
  fireEvent.changeText(screen.getByTestId('tutor-question'), 'Meine Frage');
  fireEvent.press(screen.getByText('Frage senden'));
  await waitFor(() => {
    expect(screen.getByText('Empfangener Teil')).toBeTruthy();
  });
  expect(screen.getByText('Antwort stoppen')).toBeTruthy();
  act(() => {
    if (!release) throw new Error('Stream fixture');
    release();
  });
  await waitFor(() => {
    expect(screen.getByText('Dieselbe Antwort erneut abrufen')).toBeTruthy();
  });
  fireEvent.press(screen.getByText('Dieselbe Antwort erneut abrufen'));
  await waitFor(() => {
    expect(requests).toHaveLength(2);
  });
  expect(requests[1]).toEqual(requests[0]);
});
it('löscht Antworten und Eingabe sofort beim Kontowechsel und verwirft verspätete Pakete', async () => {
  signIn();
  let emitLater: ((event: TutorStreamEvent) => void) | undefined, finish: (() => void) | undefined;
  stream.mockImplementation(
    async (
      _request: TutorRequest,
      _signal: AbortSignal,
      emit: (event: TutorStreamEvent) => void,
    ) => {
      emitLater = emit;
      emit({ type: 'text', text: 'Privat für A' });
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
    },
  );
  view();
  await waitFor(() => {
    expect(screen.getByText('Heute noch 30 von 30 Fragen')).toBeTruthy();
  });
  fireEvent.changeText(screen.getByTestId('tutor-question'), 'Private Frage A');
  fireEvent.press(screen.getByText('Frage senden'));
  await waitFor(() => {
    expect(screen.getByText('Privat für A')).toBeTruthy();
  });
  act(() => {
    signIn(actorB);
    emitLater?.({ type: 'text', text: 'Spätes Paket A' });
    finish?.();
  });
  expect(screen.queryByText('Privat für A')).toBeNull();
  expect(screen.queryByText('Private Frage A')).toBeNull();
  expect(screen.queryByText(/Spätes Paket A/)).toBeNull();
  expect(useTutor.getState().messages).toHaveLength(0);
});
it('öffnet gespeicherte Antworten mit Beispiel, meldet sie und löscht das Gespräch erst nach Bestätigung', async () => {
  signIn();
  const conversationId = '33333333-0000-4000-8000-333333333333';
  const source = 'treble | 4/4 | C4/1',
    score = parseScore(source);
  const conversation = { id: conversationId, context: scope, created_at: date, updated_at: date };
  json.mockImplementation((path: string, method?: string, body?: unknown) => {
    if (path === '?view=status') return Promise.resolve(account);
    if (method === 'DELETE') return Promise.resolve(null);
    if (path === '?view=report') {
      const report = body as { id: string };
      return Promise.resolve({ accepted: report.id });
    }
    if (path === '') return Promise.resolve({ conversations: [conversation], next: null });
    return Promise.resolve({
      conversation,
      messages: [
        { id: 1, role: 'user', content: { text: 'Meine Frage' }, created_at: date },
        {
          id: 2,
          role: 'assistant',
          content: {
            text: 'Gespeicherte Erklärung',
            examples: [
              {
                id: 'example_1',
                example: { source, bpm: 120, score, timeline: scoreTimeline(score, { bpm: 120 }) },
              },
            ],
            errors: [],
            status: 'complete',
            simulation: true,
          },
          created_at: date,
        },
      ],
      next: null,
      older: null,
    });
  });
  view();
  fireEvent.changeText(
    screen.getByTestId('tutor-question'),
    'Ungesendeter Text aus anderem Gespräch',
  );
  fireEvent.press(screen.getByText('Gespräche ansehen'));
  await waitFor(() => {
    expect(screen.getByText(/^Gespräch vom/)).toBeTruthy();
  });
  fireEvent.press(screen.getByText(/^Gespräch vom/));
  await waitFor(() => {
    expect(screen.getByText('Gespeicherte Erklärung')).toBeTruthy();
  });
  expect(screen.getByText('Geprüftes Notenbeispiel')).toBeTruthy();
  expect(screen.getByTestId('tutor-question').props['value']).toBe('');
  expect(mockPlay).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText('Klangbeispiel'));
  expect(mockPlay).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByText('KI-Antwort melden'));
  fireEvent.changeText(screen.getByLabelText('Was sollte verbessert werden?'), 'Bitte prüfen');
  fireEvent.press(screen.getByText('Meldung senden'));
  await waitFor(() => {
    expect(screen.getByText('Deine Meldung wurde gespeichert. Danke.')).toBeTruthy();
  });
  expect(json).toHaveBeenCalledWith(
    '?view=report',
    'POST',
    expect.objectContaining({ conversationId, messageId: 2, message: 'Bitte prüfen' }),
  );
  fireEvent.press(screen.getByText('Abbrechen'));
  await waitFor(() => {
    expect(screen.getByText('Gespräche ansehen')).toBeTruthy();
  });
  fireEvent.press(screen.getByText('Gespräche ansehen'));
  await waitFor(() => {
    expect(screen.getByText('Gespräch löschen')).toBeTruthy();
  });
  fireEvent.press(screen.getByText('Gespräch löschen'));
  expect(json.mock.calls.filter((call: unknown[]) => call[1] === 'DELETE')).toHaveLength(0);
  fireEvent.press(screen.getByText('Dauerhaft löschen'));
  await waitFor(() => {
    expect(screen.queryByText('Gespeicherte Erklärung')).toBeNull();
  });
});
it('behält den kanonischen Aufgabenkontext samt Hinweisstufe bei Rückfragen', async () => {
  signIn();
  const source = {
    kind: 'practice' as const,
    set: 'pitch' as const,
    contentVersion: 1 as const,
    seed: 'original-seed',
    index: 0,
  };
  openTaskTutor(
    { ...scope, mode: 'hint', hintLevel: 2, context: { source, answer: null, checked: false } },
    'Ursprüngliche Aufgabe',
  );
  newTutorConversation('de'); // Kein Vermischen mit einem freien Dialog.
  openTaskTutor(
    { ...scope, mode: 'hint', hintLevel: 2, context: { source, answer: null, checked: false } },
    'Ursprüngliche Aufgabe',
  );
  view();
  await waitFor(() => {
    expect(screen.getByText('Heute noch 30 von 30 Fragen')).toBeTruthy();
  });
  fireEvent.press(screen.getByText('KI-Hinweis anfordern'));
  await waitFor(() => {
    expect(stream).toHaveBeenCalled();
  });
  const calls = stream.mock.calls as unknown[][];
  expect(calls[0]?.[0]).toMatchObject({
    mode: 'hint',
    hintLevel: 2,
    context: { source, answer: null, checked: false },
  });
});
it('zeigt englische Oberfläche mit gleicher KI- und Premium-Kennzeichnung', () => {
  useSettings.setState({ locale: 'en-GB' });
  view();
  expect(screen.getByText(/You are talking to an AI/)).toBeTruthy();
  expect(screen.getByText('Practise freely')).toBeTruthy();
});

function auralTask() {
  const seed = 'tutor-visibility';
  for (const set of PRACTICE_SETS.filter((entry) => entry !== 'harmony')) {
    const items = createFreePracticeSession(set, seed).items;
    const index = items.findIndex((item) => item.type === 'INTERVAL_IDENTIFY_AURAL');
    const item = items[index];
    if (item)
      return {
        item,
        source: { kind: 'practice' as const, set, contentVersion: 1 as const, seed, index },
      };
  }
  throw new Error('Missing aural fixture');
}

for (const mode of ['hint', 'chat'] as const) {
  it(`${mode}: zeigt trotz checked=true kein verstecktes Hör-Notenbild`, async () => {
    signIn();
    const { item, source } = auralTask();
    openTaskTutor(
      {
        ...scope,
        mode,
        hintLevel: mode === 'hint' ? 2 : null,
        context: { source, answer: expectedAnswer(item), checked: true },
      },
      'Aufgabenfrage',
    );
    view();
    await waitFor(() => {
      expect(screen.getByText('Heute noch 30 von 30 Fragen')).toBeTruthy();
    });
    expect(screen.getByText('Aufgabenfrage')).toBeTruthy();
    expect(screen.queryByTestId('tutor-original-score')).toBeNull();
  });
}

it('holt vor der Erklärung einen Servernachweis, unabhängig vom checked-Flag', async () => {
  signIn();
  const { item, source } = auralTask();
  const answer = expectedAnswer(item);
  openTaskTutor(
    { ...scope, mode: 'explain', context: { source, answer, checked: false } },
    'Aufgabenfrage',
  );
  view();
  await waitFor(() => {
    expect(screen.getByText('Heute noch 30 von 30 Fragen')).toBeTruthy();
  });
  expect(screen.getByTestId('tutor-original-score')).toBeTruthy();
  fireEvent.press(screen.getByText(i18n.t('tutor.taskSend_explain')));
  await waitFor(() => {
    expect(stream).toHaveBeenCalled();
  });
  const calls = stream.mock.calls as unknown[][];
  expect(calls[0]?.[0]).toMatchObject({
    mode: 'explain',
    context: { source, answer, checked: false },
    attemptProof: proof,
  });
  expect(json).toHaveBeenCalledWith(
    '?view=attempt',
    'POST',
    { source, answer },
    expect.any(AbortSignal),
  );
});

it.each(['explain', 'solution'] as const)(
  '%s: kein Modellaufruf bei abgewiesenem Nachweis',
  async (mode) => {
    signIn();
    const { source, item } = auralTask();
    openTaskTutor(
      { ...scope, mode, context: { source, answer: expectedAnswer(item), checked: true } },
      'Aufgabe',
    );
    json.mockRejectedValue(new TutorError('attempt_invalid'));
    await sendTutor('Warum?');
    expect(stream).not.toHaveBeenCalled();
    expect(useTutor.getState()).toMatchObject({ sending: false, error: 'attempt_invalid' });
  },
);
it('verifiziert Wiederholungen mit derselben Anfrage und demselben Nachweis', async () => {
  signIn();
  const { source, item } = auralTask();
  openTaskTutor(
    { ...scope, mode: 'explain', context: { source, answer: expectedAnswer(item), checked: true } },
    'Aufgabe',
  );
  stream.mockRejectedValue(new TutorError('interrupted'));
  await sendTutor('Warum?');
  const calls = stream.mock.calls as unknown[][];
  const first = calls[0]?.[0];
  await sendTutor('', true);
  expect(calls[1]?.[0]).toEqual(first);
  expect(json.mock.calls.filter((call: unknown[]) => call[0] === '?view=attempt')).toHaveLength(1);
});
it.each(['switch', 'stop'] as const)(
  'kein später Modellaufruf nach %s während der Nachweisprüfung',
  async (change) => {
    signIn();
    const { source, item } = auralTask();
    openTaskTutor(
      {
        ...scope,
        mode: 'explain',
        context: { source, answer: expectedAnswer(item), checked: true },
      },
      'Aufgabe',
    );
    let finish: ((value: unknown) => void) | undefined;
    json.mockImplementation((path) =>
      path === '?view=attempt'
        ? new Promise((resolve) => {
            finish = resolve;
          })
        : Promise.resolve(account),
    );
    const pending = sendTutor('Warum?');
    expect(finish).toBeDefined();
    if (change === 'switch') signIn(actorB);
    else stopTutor();
    finish?.({ proof });
    await pending;
    expect(stream).not.toHaveBeenCalled();
    expect(useTutor.getState().sending).toBe(false);
  },
);
it('fängt alte Lösungsdialoge ohne geprüfte Antwort ab und weist fehlerhafte Nachweise zurück', async () => {
  signIn();
  const { source, item } = auralTask();
  openTaskTutor(
    { ...scope, mode: 'solution', context: { source, answer: null, checked: true } },
    'Aufgabe',
  );
  await sendTutor('Lösung');
  expect(useTutor.getState().error).toBe('attempt_required');
  expect(json.mock.calls.filter((call: unknown[]) => call[0] === '?view=attempt')).toHaveLength(0);
  openTaskTutor(
    { ...scope, mode: 'explain', context: { source, answer: expectedAnswer(item), checked: true } },
    'Aufgabe',
  );
  json.mockResolvedValue({ proof: { ...proof, signature: 'forged' } });
  await sendTutor('Warum?');
  expect(useTutor.getState().error).toBe('protocol');
  expect(stream).not.toHaveBeenCalled();
});
