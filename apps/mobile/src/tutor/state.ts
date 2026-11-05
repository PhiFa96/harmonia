import { create } from 'zustand';
import { useSettings } from '../state/settings.ts';
import { randomUUID } from 'expo-crypto';
import {
  tutorAccountSchema,
  tutorConversationsSchema,
  tutorHistorySchema,
  tutorScopeSchema,
  tutorRequestSchema,
} from '@harmonia/content';
import type {
  TutorScope,
  TutorAccount,
  TutorConversation,
  TutorMessage,
  TutorAnswer,
  TutorRequest,
  TutorReport,
  TutorStreamEvent,
} from '@harmonia/content';
import type { Score } from '@harmonia/notation';
import type { AppLocale } from '@harmonia/i18n';
import { useAuthState } from '@/auth';
import { tutorActor, tutorTransport, verifyTutorRequest } from './client.ts';
import { TutorError } from './transport.ts';
interface Entry {
  owner: string | null;
  prompt: string;
  score?: Score;
}
interface Current {
  request: TutorRequest;
  answer: TutorAnswer;
}
interface State {
  actor: string | null;
  scope: TutorScope | null;
  conversationId: string | null;
  entry: Entry | null;
  messages: TutorMessage[];
  current: Current | null;
  sending: boolean;
  retry: TutorRequest | null;
  error: string | null;
  account: TutorAccount | null;
  accountLoading: boolean;
  accountError: boolean;
  conversations: TutorConversation[];
  listNext: string | null;
  older: number | null;
  loading: boolean;
}
const initial = (): State => ({
  actor: null,
  scope: null,
  conversationId: null,
  entry: null,
  messages: [],
  current: null,
  sending: false,
  retry: null,
  error: null,
  account: null,
  accountLoading: false,
  accountError: false,
  conversations: [],
  listNext: null,
  older: null,
  loading: false,
});
export const useTutor = create<State>(() => initial());
let generation = 0;
const controllers = new Set<AbortController>();
let active: AbortController | null = null;
const valid = (actor: string | null, token: number) =>
  actor === tutorActor() && token === generation;
export function resetTutor() {
  const old = useTutor.getState(),
    actor = tutorActor();
  for (const controller of controllers) controller.abort();
  controllers.clear();
  active = null;
  generation++;
  const preserve = old.actor === null && old.entry?.owner === null;
  useTutor.setState({
    ...initial(),
    actor,
    ...(preserve
      ? {
          scope: old.scope,
          conversationId: old.conversationId,
          entry: old.entry ? { ...old.entry, owner: actor } : null,
        }
      : {}),
  });
}
export function ensureTutorActor() {
  if (useTutor.getState().actor !== tutorActor()) resetTutor();
}
export function stopTutor() {
  active?.abort();
}
useAuthState.subscribe(() => {
  if (useTutor.getState().actor !== tutorActor()) resetTutor();
});
export function newTutorConversation(locale: AppLocale) {
  ensureTutorActor();
  stopTutor();
  generation++;
  useTutor.setState({
    scope: {
      locale,
      noteNaming:
        useSettings.getState().noteNaming === 'auto'
          ? locale === 'de'
            ? 'de'
            : 'intl'
          : useSettings.getState().noteNaming === 'de'
            ? 'de'
            : 'intl',
      harmonySystem: useSettings.getState().harmonySystem,
      mode: 'chat',
      hintLevel: null,
      context: null,
    },
    conversationId: randomUUID(),
    entry: null,
    messages: [],
    current: null,
    retry: null,
    sending: false,
    error: null,
    older: null,
    loading: false,
    accountLoading: false,
  });
}
export function openTaskTutor(scope: TutorScope, prompt: string, score?: Score) {
  ensureTutorActor();
  stopTutor();
  generation++;
  useTutor.setState({
    scope: tutorScopeSchema.parse(scope),
    conversationId: randomUUID(),
    entry: { owner: tutorActor(), prompt, ...(score ? { score } : {}) },
    messages: [],
    current: null,
    retry: null,
    sending: false,
    error: null,
    older: null,
    loading: false,
    accountLoading: false,
  });
}
const codeOf = (error: unknown) => (error instanceof TutorError ? error.code : 'network');
export async function loadTutorAccount() {
  ensureTutorActor();
  const actor = tutorActor(),
    token = generation;
  if (!actor) return;
  useTutor.setState({ accountLoading: true, accountError: false });
  try {
    const account = tutorAccountSchema.parse(await tutorTransport.json('?view=status'));
    if (valid(actor, token)) useTutor.setState({ account, accountLoading: false });
  } catch {
    if (valid(actor, token)) useTutor.setState({ accountLoading: false, accountError: true });
  }
}
export async function loadTutorConversations(more = false) {
  ensureTutorActor();
  const actor = tutorActor(),
    token = generation,
    state = useTutor.getState();
  if (!actor || state.loading || (more && !state.listNext)) return;
  useTutor.setState({ loading: true, error: null });
  try {
    const page = tutorConversationsSchema.parse(
      await tutorTransport.json(more ? '?before=' + String(state.listNext) : ''),
    );
    if (valid(actor, token))
      useTutor.setState({
        conversations: more
          ? [
              ...state.conversations,
              ...page.conversations.filter(
                (c) => !state.conversations.some((old) => old.id === c.id),
              ),
            ]
          : page.conversations,
        listNext: page.next,
        loading: false,
      });
  } catch (error) {
    if (valid(actor, token)) useTutor.setState({ loading: false, error: codeOf(error) });
  }
}
export async function openTutorConversation(id: string) {
  ensureTutorActor();
  const actor = tutorActor();
  if (!actor) return;
  stopTutor();
  const token = ++generation;
  useTutor.setState({
    loading: true,
    accountLoading: false,
    error: null,
    current: null,
    retry: null,
    sending: false,
    messages: [],
    entry: null,
    scope: null,
    conversationId: id,
  });
  try {
    const page = tutorHistorySchema.parse(
      await tutorTransport.json('?conversationId=' + encodeURIComponent(id) + '&tail=true'),
    );
    if (page.conversation.id !== id) throw new TutorError('protocol');
    if (valid(actor, token))
      useTutor.setState({
        scope: page.conversation.context,
        messages: page.messages,
        older: page.older ?? null,
        loading: false,
      });
  } catch (error) {
    if (valid(actor, token)) useTutor.setState({ loading: false, error: codeOf(error) });
  }
}
export async function olderTutorMessages() {
  const state = useTutor.getState(),
    actor = tutorActor(),
    token = generation;
  if (
    !actor ||
    state.actor !== actor ||
    !state.conversationId ||
    !state.older ||
    state.loading ||
    state.messages.length >= 1000
  )
    return;
  useTutor.setState({ loading: true, error: null });
  try {
    const page = tutorHistorySchema.parse(
      await tutorTransport.json(
        '?conversationId=' +
          state.conversationId +
          '&tail=true&beforeMessage=' +
          String(state.older),
      ),
    );
    if (page.conversation.id !== state.conversationId) throw new TutorError('protocol');
    if (valid(actor, token))
      useTutor.setState({
        messages: [
          ...page.messages.filter((m) => !state.messages.some((old) => old.id === m.id)),
          ...state.messages,
        ],
        older: page.older ?? null,
        loading: false,
      });
  } catch (error) {
    if (valid(actor, token)) useTutor.setState({ loading: false, error: codeOf(error) });
  }
}
function accept(event: TutorStreamEvent) {
  const current = useTutor.getState().current;
  if (!current) return;
  let answer = { ...current.answer };
  switch (event.type) {
    case 'meta':
      answer.simulation = event.simulation;
      break;
    case 'text':
      answer.text += event.text;
      if (answer.text.length > 131072) throw new TutorError('protocol');
      break;
    case 'example':
      answer.examples = [...answer.examples, { id: event.id, example: event.example }];
      break;
    case 'citation':
      answer.citations = [...(answer.citations ?? []), event.citation];
      answer.sourceState = 'cited';
      break;
    case 'notice':
      answer.errors = [...answer.errors, event.code];
      break;
    case 'knowledge':
      if (event.state === 'unavailable') answer.sourceState = 'unavailable';
      break;
    case 'replay':
      answer = event.result;
      break;
    case 'done':
      answer.status = event.status;
      break;
  }
  useTutor.setState({ current: { ...current, answer } });
}
export async function refreshTutorMessages() {
  const state = useTutor.getState(),
    actor = tutorActor(),
    token = generation;
  if (!actor || state.actor !== actor || !state.conversationId) return;
  const page = tutorHistorySchema.parse(
    await tutorTransport.json(
      '?conversationId=' +
        state.conversationId +
        '&after=' +
        String(state.messages.at(-1)?.id ?? 0),
    ),
  );
  if (page.conversation.id !== state.conversationId || page.next !== null)
    throw new TutorError('protocol');
  if (valid(actor, token))
    useTutor.setState({
      messages: [
        ...state.messages,
        ...page.messages.filter((m) => !state.messages.some((old) => old.id === m.id)),
      ],
      current: null,
      retry: null,
    });
}
export async function sendTutor(message: string, retry = false) {
  ensureTutorActor();
  const state = useTutor.getState(),
    actor = tutorActor(),
    token = generation;
  if (!actor || state.sending || !state.scope || !state.conversationId) return;
  const request = retry
    ? state.retry
    : tutorRequestSchema.parse({
        id: randomUUID(),
        conversationId: state.conversationId,
        message,
        ...state.scope,
      });
  if (!request) return;
  const controller = new AbortController();
  controllers.add(controller);
  active = controller;
  useTutor.setState({
    sending: true,
    error: null,
    retry: request,
    current: {
      request,
      answer: {
        text: '',
        examples: [],
        errors: [],
        status: 'partial',
        citations: [],
        sourceState: 'no_source',
      },
    },
  });
  try {
    const verified = await verifyTutorRequest(request, controller.signal);
    if (!valid(actor, token)) return;
    if (controller.signal.aborted) throw new TutorError('cancelled');
    const current = useTutor.getState().current;
    if (!current) throw new TutorError('cancelled');
    useTutor.setState({
      retry: verified,
      current: { request: verified, answer: current.answer },
    });
    await tutorTransport.stream(verified, controller.signal, (event) => {
      if (valid(actor, token)) accept(event);
    });
    if (!valid(actor, token)) return;
    useTutor.setState({ sending: false });
    try {
      await refreshTutorMessages();
    } catch {
      if (valid(actor, token)) useTutor.setState({ error: 'history' });
    }
  } catch (error) {
    if (valid(actor, token)) {
      const code = codeOf(error);
      useTutor.setState({
        sending: false,
        error: code,
        // These refusals happen before any model reservation. A new send can obtain
        // a fresh receipt/new request ID; retrying the expired signature cannot help.
        ...(['attempt_required', 'attempt_invalid', 'attempt_expired'].includes(code)
          ? { retry: null, current: null }
          : {}),
      });
    }
  } finally {
    controllers.delete(controller);
    if (active === controller) active = null;
    if (valid(actor, token)) void loadTutorAccount();
  }
}
export async function deleteTutorConversation(id: string) {
  const actor = tutorActor(),
    token = generation;
  if (!actor) return;
  if (useTutor.getState().conversationId === id) stopTutor();
  await tutorTransport.json('?conversationId=' + encodeURIComponent(id), 'DELETE');
  if (valid(actor, token)) {
    const state = useTutor.getState();
    useTutor.setState({
      conversations: state.conversations.filter((c) => c.id !== id),
      loading: false,
      accountLoading: false,
      ...(state.conversationId === id
        ? {
            scope: null,
            conversationId: null,
            entry: null,
            messages: [],
            current: null,
            retry: null,
            sending: false,
            older: null,
            error: null,
          }
        : {}),
    });
    generation++;
  }
}
export async function reportTutorAnswer(report: TutorReport) {
  const actor = tutorActor(),
    token = generation;
  if (!actor) throw new TutorError('auth');
  const result = await tutorTransport.json('?view=report', 'POST', report);
  if (!valid(actor, token)) throw new TutorError('auth');
  if (
    !result ||
    typeof result !== 'object' ||
    !('accepted' in result) ||
    result.accepted !== report.id
  )
    throw new TutorError('protocol');
}
