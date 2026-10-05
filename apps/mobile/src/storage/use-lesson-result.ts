import type { LessonSession } from '@harmonia/exercises';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createLessonAttempt } from './lesson-repository';
import { getLessonRepository } from './lessons';

export function useLessonResult(session: LessonSession | null, id: string, startedAt: string) {
  const attempt = useMemo(
    () =>
      session?.phase === 'complete'
        ? createLessonAttempt(id, session, startedAt, new Date(Date.now()).toISOString())
        : null,
    [session, id, startedAt],
  );
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    const token = ++generation.current;
    if (!attempt) {
      setStatus('idle');
      return;
    }
    setStatus('saving');
    // Der Schreibvorgang läuft auch beim Verlassen zu Ende; nur UI-Aktualisierungen entfallen.
    void getLessonRepository()
      .then((repository) => repository.save(attempt))
      .then(
        () => {
          if (token === generation.current) setStatus('saved');
        },
        () => {
          if (token === generation.current) setStatus('error');
        },
      );
    return () => {
      generation.current++;
    };
  }, [attempt, retry]);
  const retrySave = useCallback(() => {
    setRetry((value) => value + 1);
  }, []);
  return { attempt, status, retrySave };
}
