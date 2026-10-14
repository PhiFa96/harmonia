import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { authorizeStart, accessOwner } from '@/access/state';
import { randomUUID } from 'expo-crypto';
import { catalogue } from '@harmonia/content/catalogue';
import { applyLessonAction, restoreLessonDraft } from '@harmonia/content';
import type { LessonAction, LessonDraft, lessonPlan } from '@harmonia/content';
import { createLessonSession } from '@harmonia/exercises';
import type { LessonSession } from '@harmonia/exercises';
import { useLearningState } from '../state/learning.ts';
import { getLearningRepository } from './learning.ts';

type Plan = NonNullable<ReturnType<typeof lessonPlan>>;
/** Besitzer und Speicherart gehören zum Durchgang, auch wenn später das Konto wechselt. */
export function useLessonFlow(plan: Plan) {
  const owner = useRef(useLearningState.getState().scope).current;
  const temporary = useRef(useLearningState.getState().memory).current;
  const saved = useRef(useLearningState.getState().drafts[plan.id]).current;
  const run = useRef(
    typeof saved?.seed === 'number' ? Math.max(0, saved.seed - Date.now() + 1) : 0,
  );
  const fresh = (): { draft: LessonDraft; session: LessonSession | null } => {
    const now = Date.now();
    return {
      draft: {
        schemaVersion: 1,
        id: randomUUID(),
        lessonId: plan.id,
        contentVersion: plan.contentVersion,
        planKey: plan.planKey,
        seed: now + run.current++,
        startedAt: now,
        finishedAt: null,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        introCard: 0,
        started: false,
        actions: [],
        answer: null,
      },
      session: null,
    };
  };
  const accessActor = useRef(accessOwner()).current;
  const locked = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [accessPending, setAccessPending] = useState(false);
  const [accessError, setAccessError] = useState(false);
  const [changed, setChanged] = useState(false);
  const [state, setState] = useState(() => {
    if (saved) {
      try {
        return restoreLessonDraft(catalogue, saved);
      } catch {
        return fresh();
      }
    }
    return fresh();
  });
  const [resume, setResume] = useState(!!saved);
  const [status, setStatus] = useState<'saving' | 'saved' | 'memory' | 'error'>(
    temporary ? 'memory' : saved ? 'saved' : 'saving',
  );
  const [retry, setRetry] = useState(0);
  const revision = useRef(0);
  const pending = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    if (resume) {
      if (saved) {
        try {
          restoreLessonDraft(catalogue, saved);
        } catch {
          setChanged(true);
        }
      }
      return;
    }
    const token = ++revision.current;
    const draft = state.draft;
    const current = useLearningState.getState();
    if (current.scope === owner && current.phase === 'ready')
      useLearningState.setState({ drafts: { ...current.drafts, [plan.id]: draft } });
    if (temporary) {
      setStatus('memory');
      return;
    }
    setStatus('saving');
    const work = getLearningRepository().then((repo) => repo.saveDraft(owner, draft));
    pending.current = work;
    void work.then(
      () => {
        if (token === revision.current) setStatus('saved');
      },
      () => {
        if (token === revision.current) setStatus('error');
      },
    );
    return () => {
      revision.current++;
    };
  }, [state.draft, resume, retry, owner, temporary, plan.id, saved]);
  const select = (answer: string | null) => {
    setState((current) => ({ ...current, draft: { ...current.draft, answer } }));
  };
  const act = (action: LessonAction) => {
    setState((current) => {
      if (!current.session) return current;
      const session = applyLessonAction(current.session, action);
      if (session === current.session) return current;
      return {
        session,
        draft: {
          ...current.draft,
          actions: [...current.draft.actions, action],
          answer: action.type === 'next' || action.type === 'skip' ? null : current.draft.answer,
          finishedAt:
            session.phase === 'complete' ? Math.max(current.draft.startedAt, Date.now()) : null,
        },
      };
    });
  };
  const permit = async (draft: LessonDraft, commit: () => void) => {
    if (locked.current || accessActor !== accessOwner()) return;
    locked.current = true;
    setAccessPending(true);
    setAccessError(false);
    try {
      const grant = await authorizeStart(draft.id, {
        kind: 'lesson',
        lessonId: plan.id,
        contentVersion: plan.contentVersion,
        planKey: plan.planKey,
        seed: draft.seed,
      });
      if (!mounted.current || accessActor !== accessOwner()) return;
      if (grant.allowed) commit();
      else if (grant.reason === 'limit' || grant.reason === 'premium')
        router.push({ pathname: '/paywall', params: { reason: grant.reason } });
      else setAccessError(true);
    } catch {
      if (mounted.current) setAccessError(true);
    } finally {
      locked.current = false;
      if (mounted.current) setAccessPending(false);
    }
  };
  const start = () => {
    void permit(state.draft, () => {
      setState((current) => ({
        session: createLessonSession(plan, current.draft.seed),
        draft: { ...current.draft, started: true },
      }));
    });
  };
  const restart = (started = false) => {
    if (locked.current) return;
    const next = fresh();
    const commit = () => {
      setChanged(false);
      setResume(false);
      setState(
        started
          ? {
              draft: { ...next.draft, started: true },
              session: createLessonSession(plan, next.draft.seed),
            }
          : next,
      );
    };
    if (started) void permit(next.draft, commit);
    else commit();
  };
  const clear = useCallback(async () => {
    await pending.current.catch(() => undefined);
    const target = resume && saved ? saved.id : state.draft.id;
    if (!temporary) await (await getLearningRepository()).clearDraft(owner, plan.id, target);
    const current = useLearningState.getState();
    if (current.scope === owner && current.drafts[plan.id]?.id === target) {
      const drafts = Object.fromEntries(
        Object.entries(current.drafts).filter(([id]) => id !== plan.id),
      );
      useLearningState.setState({ drafts });
    }
  }, [owner, temporary, plan.id, state.draft.id, resume, saved]);
  return {
    ...state,
    owner,
    temporary,
    status,
    accessPending,
    accessError,
    resume,
    changed,
    select,
    act,
    start,
    restart,
    clear,
    continue: () => {
      if (!changed) {
        if (state.draft.started && state.session?.phase !== 'complete')
          void permit(state.draft, () => {
            setResume(false);
          });
        else setResume(false);
      }
    },
    card: (introCard: number) => {
      setState((current) => ({ ...current, draft: { ...current.draft, introCard } }));
    },
    flush: () => pending.current,
    retry: () => {
      setRetry((value) => value + 1);
    },
  };
}
