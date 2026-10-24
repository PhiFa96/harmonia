import { quizText, type QuizTextKey } from '../../packages/i18n/src/school-quiz.ts';
import { assignmentText } from '../../packages/i18n/src/school-assignments.ts';
import type { AppLocale } from '../../packages/i18n/src/locale.ts';
import {
  createAudioEngine,
  type AudioEngine,
  type Timers,
} from '../../packages/audio/src/index.ts';
import { createWorkbenchPlayer } from '../voice-leading/playback.ts';
import type { SchoolState } from './protocol.ts';
import type { BankEntry } from './assignment-protocol.ts';
import type { QuizView } from './quiz-protocol.ts';
interface Context {
  root: HTMLElement;
  api: <T>(path: string, body?: object) => Promise<T>;
  guard: (action: () => void | Promise<void>) => Promise<void>;
  refresh: () => Promise<void>;
}
export function createQuizUi(ctx: Context) {
  let quizId = /^#quiz=([a-f0-9-]{36})$/.exec(location.hash)?.[1] ?? '',
    classId = '',
    lang: AppLocale = 'de',
    projector = false,
    joinCode = '',
    field = 0,
    generation = 0,
    latestAt = 0;
  let stream: EventSource | undefined,
    timer: ReturnType<typeof setInterval> | undefined,
    watchdog: ReturnType<typeof setInterval> | undefined,
    current: QuizView | undefined,
    engine: AudioEngine | undefined;
  let soundStatus: HTMLElement | undefined;
  const timers: Timers = {
    setInterval: (fn, ms) => window.setInterval(fn, ms),
    clearInterval: (id) => {
      window.clearInterval(id as number);
    },
  };
  const player = createWorkbenchPlayer(
    () => {
      engine ??= createAudioEngine(new AudioContext(), { timers, volume: 0.6 });
      return engine;
    },
    timers,
    (s) => {
      if (soundStatus) soundStatus.textContent = s.status === 'error' ? t('audioError') : '';
    },
  );
  const t = (key: QuizTextKey, values: Record<string, string | number> = {}) =>
    quizText(lang, key, values);
  function el<K extends keyof HTMLElementTagNameMap>(tag: K, text = '') {
    const n = document.createElement(tag);
    n.textContent = text;
    return n;
  }
  function button(key: QuizTextKey, fn: () => void | Promise<void>) {
    const b = el('button', t(key));
    b.type = 'button';
    b.addEventListener('click', () => {
      void ctx.guard(fn);
    });
    return b;
  }
  function label(key: QuizTextKey, input: HTMLElement) {
    const l = el('label', t(key)),
      wrap = el('div');
    input.id = `quiz-field-${String(++field)}`;
    l.htmlFor = input.id;
    wrap.append(l, input);
    return wrap;
  }
  function clearTimer() {
    if (timer) clearInterval(timer);
    timer = undefined;
  }
  function stop() {
    generation++;
    if (watchdog) clearInterval(watchdog);
    watchdog = undefined;
    stream?.close();
    stream = undefined;
    clearTimer();
    player.stop();
    current = undefined;
    latestAt = 0;
  }
  function setProjector(value: boolean) {
    projector = value;
    ctx.root.closest('main')?.setAttribute('data-projector', String(value));
  }
  function reset() {
    stop();
    quizId = '';
    classId = '';
    joinCode = '';
    setProjector(false);
  }
  function open(id: string) {
    stop();
    quizId = id;
    joinCode = '';
    history.replaceState(null, '', `#quiz=${id}`);
  }
  function controls() {
    const b = ctx.root.querySelector<HTMLButtonElement>('[data-quiz-answer]');
    if (b)
      b.disabled =
        Boolean(current?.self?.answered) ||
        !ctx.root.querySelector('input[name=quiz-answer]:checked');
  }
  function unavailable(retry: boolean) {
    player.stop();
    clearTimer();
    current = undefined;
    latestAt = 0;
    ctx.root.replaceChildren(
      el('h2', t('entry')),
      el('p', t(retry ? 'reconnecting' : 'unavailable')),
      button('retry', ctx.refresh),
    );
    if (projector)
      ctx.root.append(
        button('exitProjector', async () => {
          setProjector(false);
          await ctx.refresh();
        }),
      );
  }
  async function command(action: string, payload: object) {
    await ctx.api(`/api/quiz-${action}`, payload);
    await update();
  }
  function payload() {
    return {
      id: quizId,
      locale: lang,
      mode: projector ? 'projector' : current?.teacher ? 'teacher' : mode,
    };
  }
  let mode = 'learner';
  async function update() {
    const gen = generation;
    const value = await ctx.api<QuizView>('/api/quiz-view', payload());
    if (gen === generation && !document.hidden) show(value);
  }
  function show(v: QuizView) {
    if (Date.parse(v.serverNow) < latestAt) return;
    const same = current?.id === v.id && current.index === v.index && current.phase === v.phase;
    const selected = same
      ? ctx.root.querySelector<HTMLInputElement>('input[name=quiz-answer]:checked')?.value
      : undefined;
    const focused =
      document.activeElement instanceof HTMLInputElement &&
      document.activeElement.name === 'quiz-answer'
        ? document.activeElement.value
        : undefined;
    if (!same || v.self?.answered) player.stop();
    clearTimer();
    current = v;
    latestAt = Date.parse(v.serverNow);
    classId = v.classId;
    const panel = el('section');
    panel.className = 'quiz-panel';
    panel.append(el(projector ? 'h1' : 'h2', v.title), el('p', t('intro')));
    const connection = el('p', t('connected'));
    connection.setAttribute('role', 'status');
    panel.append(
      connection,
      el(projector ? 'h2' : 'h3', t(v.phase)),
      el('p', t('participation', { players: v.players, answered: v.answered })),
    );
    if (v.teacher)
      panel.append(
        button(projector ? 'exitProjector' : 'projector', async () => {
          setProjector(!projector);
          await ctx.refresh();
        }),
      );
    if (projector) panel.append(el('p', t('projectorNote')));
    if (v.phase === 'lobby') {
      if (v.teacher) {
        const box = el('div');
        if (joinCode) box.append(el(projector ? 'h2' : 'h3', t('code')), el('code', joinCode));
        box.append(
          el('p', t('codeInfo')),
          button('rotate', async () => {
            const r = await ctx.api<{ code: string }>('/api/quiz-rotate', { id: v.id });
            joinCode = r.code;
            await update();
          }),
          button('start', () => command('start', { id: v.id, index: v.index })),
        );
        panel.append(box);
      } else panel.append(el('p', t('waiting')));
    }
    if (v.question) {
      const q = v.question;
      panel.append(
        el(projector ? 'h2' : 'h3', t('round', { index: v.index + 1, total: v.total })),
        el('p', q.prompt),
      );
      if (q.svg) {
        const n = el('div');
        n.className = 'score';
        n.tabIndex = 0;
        n.setAttribute('role', 'img');
        n.setAttribute('aria-label', q.description ?? q.prompt);
        n.innerHTML = q.svg;
        n.querySelector('svg')?.setAttribute('aria-hidden', 'true');
        panel.append(n);
      }
      const audio = q.audio;
      if (audio) {
        soundStatus = el('p');
        soundStatus.setAttribute('role', 'status');
        panel.append(
          button('play', () => player.start(audio)),
          button('stop', () => {
            player.stop();
          }),
          soundStatus,
        );
      }
      if (v.phase === 'question') {
        const clock = el('p');
        panel.append(clock);
        const anchor = performance.now(),
          remaining = Date.parse(v.dueAt ?? '') - Date.parse(v.serverNow);
        const tick = () => {
          const seconds = Math.max(0, Math.ceil((remaining - (performance.now() - anchor)) / 1000));
          clock.textContent = t('remaining', { seconds });
          if (!seconds) {
            const b = ctx.root.querySelector<HTMLButtonElement>('[data-quiz-answer]');
            if (b) b.disabled = true;
          }
        };
        tick();
        timer = setInterval(tick, 250);
        if (v.self && !v.self.answered) {
          const form = el('form'),
            set = el('fieldset');
          set.append(el('legend', q.prompt));
          for (const c of q.choices) {
            const radio = el('input'),
              l = el('label', c.label);
            radio.type = 'radio';
            radio.name = 'quiz-answer';
            radio.value = c.id;
            radio.checked = c.id === selected;
            l.prepend(radio);
            set.append(l);
          }
          const send = el('button', t('send'));
          send.type = 'submit';
          send.dataset['quizAnswer'] = 'true';
          send.disabled = !selected;
          set.addEventListener('change', controls);
          form.append(set, send);
          form.addEventListener('submit', (event) => {
            event.preventDefault();
            const checked = set.querySelector<HTMLInputElement>('input:checked');
            if (checked)
              void ctx.guard(async () => {
                try {
                  await command('answer', { id: v.id, index: v.index, answer: checked.value });
                } catch (e) {
                  await update();
                  throw e;
                }
              });
          });
          panel.append(form);
        } else if (v.self) panel.append(el('p', t('saved')));
        else {
          const choices = el('ul');
          for (const c of q.choices) choices.append(el('li', c.label));
          panel.append(choices);
        }
      }
      if (v.solution) panel.append(el('p', t('solution', { answer: v.solution })));
    }
    if (v.self) {
      panel.append(
        el('p', t('nickname', { nickname: v.self.nickname })),
        el('p', t('privacy')),
        el('p', t('rankingInfo')),
      );
      if (v.phase !== 'cancelled')
        panel.append(
          button(v.self.ranking ? 'rankingOff' : 'rankingOn', async () => {
            if (v.self?.ranking || confirm(t('rankingConsent')))
              await command('ranking', { id: v.id, enabled: !v.self?.ranking });
          }),
        );
      if (v.self.result)
        panel.append(
          el(projector ? 'h2' : 'h3', t('yourResult')),
          el('p', t('score', { correct: v.self.result.correct, total: v.self.result.total })),
        );
    }
    if (['review', 'finished'].includes(v.phase)) {
      panel.append(el(projector ? 'h2' : 'h3', t('board')));
      const list = el('ol');
      for (const r of v.board) list.append(el('li', t('rank', r)));
      panel.append(list);
      if (!v.board.length) panel.append(el('p', t('noBoard')));
    }
    if (v.results && v.summary && !projector) {
      panel.append(el('h3', t('results')), el('p', t('coverage', v.summary)));
      if (v.summary.total) panel.append(el('p', t('score', v.summary)));
      for (const r of v.results) {
        const a = el('article');
        a.append(
          el('h4', r.alias),
          el(
            'p',
            r.result
              ? t('score', { correct: r.result.correct, total: r.result.total })
              : t('private'),
          ),
        );
        panel.append(a);
      }
    }
    if (v.teacher && !['finished', 'cancelled'].includes(v.phase)) {
      if (v.phase === 'question')
        panel.append(button('reveal', () => command('reveal', { id: v.id, index: v.index })));
      if (v.phase === 'review')
        panel.append(button('next', () => command('next', { id: v.id, index: v.index })));
      if (v.index >= 0)
        panel.append(
          button('finish', async () => {
            if (confirm(t('finishConfirm'))) await command('finish', { id: v.id, index: v.index });
          }),
        );
      panel.append(
        button('cancel', async () => {
          if (confirm(t('cancelConfirm'))) await command('cancel', { id: v.id, index: v.index });
        }),
      );
    }
    panel.append(
      button('back', async () => {
        stop();
        quizId = '';
        joinCode = '';
        setProjector(false);
        history.replaceState(null, '', '/');
        await ctx.refresh();
      }),
    );
    ctx.root.replaceChildren(panel);
    controls();
    if (same && focused)
      for (const input of panel.querySelectorAll<HTMLInputElement>('input[name=quiz-answer]'))
        if (input.value === focused) input.focus();
  }
  async function room() {
    const gen = generation;
    await update();
    if (gen !== generation || document.hidden || !navigator.onLine) return;
    let receivedAt = performance.now();
    stream = new EventSource(`/api/quiz-events?${new URLSearchParams(payload())}`);
    stream.addEventListener('snapshot', (event) => {
      if (gen === generation && !document.hidden) {
        receivedAt = performance.now();
        show(JSON.parse((event as MessageEvent<string>).data) as QuizView);
      }
    });
    stream.addEventListener('unavailable', () => {
      if (gen === generation) {
        stream?.close();
        unavailable(false);
      }
    });
    stream.onerror = () => {
      if (gen === generation) unavailable(true);
    };
    watchdog = setInterval(() => {
      if (performance.now() - receivedAt > 20000) {
        stop();
        unavailable(true);
        void ctx.guard(ctx.refresh);
      }
    }, 1000);
  }
  async function list(state: SchoolState) {
    const c = state.classes.find((c) => c.id === classId);
    if (!c || c.archived) throw new Error('forbidden');
    ctx.root.replaceChildren(
      el('h2', `${c.label} · ${t('entry')}`),
      el('p', t('intro')),
      el('p', t('rules')),
    );
    if (c.teaches) {
      const { bank } = await ctx.api<{ bank: BankEntry[] }>('/api/assignment-catalog', {
        locale: lang,
      });
      const form = el('form'),
        title = el('input'),
        source = el('select'),
        count = el('input'),
        seconds = el('input');
      title.required = true;
      title.maxLength = 80;
      for (const b of bank)
        source.add(
          new Option(`${b.label} · ${assignmentText(lang, b.kind, { count: b.tasks })}`, b.key),
        );
      count.type = 'number';
      count.min = '1';
      count.max = '10';
      count.value = '1';
      seconds.type = 'number';
      seconds.min = '15';
      seconds.max = '120';
      seconds.value = '30';
      seconds.required = true;
      count.required = true;
      const submit = el('button', t('create'));
      submit.type = 'submit';
      form.append(
        label('title', title),
        label('source', source),
        label('count', count),
        label('seconds', seconds),
        submit,
      );
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        void ctx.guard(async () => {
          const r = await ctx.api<{ id: string; code: string }>('/api/quiz-create', {
            class: classId,
            title: title.value,
            seconds: Number(seconds.value),
            blocks: [{ key: source.value, count: Number(count.value) }],
          });
          open(r.id);
          joinCode = r.code;
          await ctx.refresh();
        });
      });
      ctx.root.append(form);
    } else {
      const form = el('form'),
        code = el('input'),
        ranking = el('input');
      code.required = true;
      code.maxLength = 10;
      code.autocomplete = 'off';
      ranking.type = 'checkbox';
      const submit = el('button', t('join'));
      submit.type = 'submit';
      form.append(
        label('code', code),
        label('rankingConsent', ranking),
        el('p', t('rankingInfo')),
        submit,
      );
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        void ctx.guard(async () => {
          const r = await ctx.api<{ id: string }>('/api/quiz-join', {
            code: code.value.trim(),
            ranking: ranking.checked,
          });
          open(r.id);
          await ctx.refresh();
        });
      });
      ctx.root.append(form);
    }
    const result = await ctx.api<{
      quizzes: { id: string; title: string; phase: QuizView['phase'] }[];
    }>('/api/quiz-list', { class: classId });
    if (!result.quizzes.length) ctx.root.append(el('p', t('empty')));
    for (const q of result.quizzes) {
      const a = el('article');
      a.append(
        el(projector ? 'h2' : 'h3', q.title),
        el('p', t(q.phase)),
        button('open', async () => {
          open(q.id);
          await ctx.refresh();
        }),
      );
      ctx.root.append(a);
    }
  }
  window.addEventListener('offline', () => {
    if (quizId) {
      stop();
      unavailable(true);
    }
  });
  window.addEventListener('online', () => {
    if (quizId && !document.hidden) void ctx.guard(ctx.refresh);
  });
  return {
    active: () => Boolean(quizId || classId),
    stop,
    reset,
    controls,
    onError(code: string) {
      if (!quizId || ['answerConflict', 'quizRoundClosed', 'invalid'].includes(code)) return;
      if (code === 'forbidden' || code === 'materialChanged') {
        stop();
        unavailable(false);
      } else unavailable(true);
    },
    openClass(id: string) {
      reset();
      classId = id;
      history.replaceState(null, '', '/');
    },
    async render(state: SchoolState, locale: AppLocale) {
      stop();
      lang = locale;
      mode = state.actor.kind === 'staff' ? 'teacher' : 'learner';
      if (!quizId) {
        setProjector(false);
        await list(state);
      } else {
        if (mode === 'learner') setProjector(false);
        await room();
      }
    },
  };
}
