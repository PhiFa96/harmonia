import {
  assignmentText,
  type AssignmentTextKey,
} from '../../packages/i18n/src/school-assignments.ts';
import type { AppLocale } from '../../packages/i18n/src/locale.ts';
import {
  createAudioEngine,
  type AudioEngine,
  type Timers,
} from '../../packages/audio/src/index.ts';
import { createWorkbenchPlayer } from '../voice-leading/playback.ts';
import type { SchoolState } from './protocol.ts';
import type {
  Assignment,
  AssignmentBlock,
  AssignmentReport,
  AssignmentView,
  BankEntry,
} from './assignment-protocol.ts';

interface Context {
  root: HTMLElement;
  api: <T>(path: string, body?: object) => Promise<T>;
  guard: (action: () => void | Promise<void>) => Promise<void>;
  refresh: () => Promise<void>;
}
function localInput(date: Date) {
  const n = (v: number) => String(v).padStart(2, '0');
  return `${String(date.getFullYear())}-${n(date.getMonth() + 1)}-${n(date.getDate())}T${n(date.getHours())}:${n(date.getMinutes())}`;
}
export function createAssignmentUi(ctx: Context) {
  let classId = '',
    assignmentId = /^#assignment=([a-f0-9-]{36})$/.exec(location.hash)?.[1] ?? '',
    lang: AppLocale = 'de',
    phase = '',
    field = 0;
  let timer: ReturnType<typeof setInterval> | undefined, engine: AudioEngine | undefined;
  const timers: Timers = {
    setInterval: (fn, ms) => window.setInterval(fn, ms),
    clearInterval: (id) => {
      window.clearInterval(id as number);
    },
  };
  let soundStatus: HTMLElement | undefined;
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
  const t = (key: AssignmentTextKey, values: Record<string, string | number> = {}) =>
    assignmentText(lang, key, values);
  function el<K extends keyof HTMLElementTagNameMap>(tag: K, text = '') {
    const n = document.createElement(tag);
    n.textContent = text;
    return n;
  }
  function button(key: AssignmentTextKey, action: () => void | Promise<void>) {
    const n = el('button', t(key));
    n.type = 'button';
    n.addEventListener('click', () => {
      void ctx.guard(action);
    });
    return n;
  }
  function label(key: AssignmentTextKey, input: HTMLElement) {
    const div = el('div'),
      l = el('label', t(key));
    input.id = `assignment-field-${String(++field)}`;
    l.htmlFor = input.id;
    div.append(l, input);
    return div;
  }
  function stop() {
    player.stop();
    if (timer) clearInterval(timer);
    timer = undefined;
  }
  function chooseClass(id: string) {
    stop();
    classId = id;
    assignmentId = '';
    phase = 'list';
    history.replaceState(null, '', `#class=${id}`);
  }
  function chooseAssignment(id: string) {
    stop();
    assignmentId = id;
    phase = 'loading';
    history.replaceState(null, '', `#assignment=${id}`);
  }
  async function change(action: string, payload: object) {
    await ctx.api(`/api/assignment-${action}`, payload);
    await ctx.refresh();
  }
  function heading(a: Assignment) {
    ctx.root.replaceChildren(
      el('h2', a.title),
      el('p', t('intro')),
      el('p', t('dueLabel', { date: new Date(a.dueAt).toLocaleString(lang) })),
      button('back', async () => {
        chooseClass(a.classId);
        await ctx.refresh();
      }),
    );
  }
  function view(run: AssignmentView) {
    stop();
    phase = run.phase;
    classId = run.classId;
    heading(run);
    ctx.root.append(el('p', t('privacy')));
    if (run.result) {
      ctx.root.append(
        el('h2', t('result')),
        el('p', t(run.result.reason)),
        el('p', t('score', { correct: run.result.correct, total: run.result.total })),
        el('p', t('answered', { answered: run.result.answered, total: run.result.total })),
      );
      for (const area of run.result.areas ?? []) {
        if (area.total) ctx.root.append(el('h3', t(area.area)), el('p', t('score', area)));
      }
      return;
    }
    if (run.phase === 'ready') {
      ctx.root.append(
        el('p', t('ready')),
        button('start', async () => {
          view(
            await ctx.api<AssignmentView>('/api/assignment-start', { id: run.id, locale: lang }),
          );
        }),
      );
      return;
    }
    if (run.phase === 'closed' || run.phase === 'expired') {
      ctx.root.append(el('p', t(run.phase)));
      return;
    }
    const q = run.question;
    if (!q) return;
    const form = el('form'),
      fieldset = el('fieldset');
    fieldset.append(
      el('legend', t('progress', { index: q.index + 1, total: q.total })),
      el('h3', q.prompt),
    );
    if (q.svg) {
      const scroll = el('div');
      scroll.className = 'score';
      scroll.tabIndex = 0;
      scroll.setAttribute('role', 'img');
      scroll.setAttribute('aria-label', q.description ?? q.prompt);
      scroll.innerHTML = q.svg;
      scroll.querySelector('svg')?.setAttribute('aria-hidden', 'true');
      fieldset.append(scroll);
    }
    const audio = q.audio;
    if (audio) {
      soundStatus = el('p');
      soundStatus.setAttribute('role', 'status');
      fieldset.append(
        button('play', () => player.start(audio)),
        button('stop', () => {
          player.stop();
        }),
        soundStatus,
      );
    }
    for (const choice of q.choices) {
      const l = el('label', choice.label),
        radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'assignment-answer';
      radio.value = choice.id;
      l.prepend(radio);
      fieldset.append(l);
    }
    const submit = el('button', t('answer'));
    submit.type = 'submit';
    submit.dataset['assignmentAnswer'] = 'true';
    submit.disabled = true;
    fieldset.addEventListener('change', () => {
      submit.disabled = !fieldset.querySelector('input:checked');
    });
    form.append(fieldset, submit);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const checked = fieldset.querySelector<HTMLInputElement>('input:checked');
      if (checked)
        void ctx.guard(async () => {
          view(
            await ctx.api<AssignmentView>('/api/assignment-answer', {
              id: run.id,
              locale: lang,
              index: q.index,
              answer: checked.value,
            }),
          );
        });
    });
    ctx.root.append(
      form,
      button('submit', async () => {
        if (confirm(t('submitConfirm')))
          view(
            await ctx.api<AssignmentView>('/api/assignment-finish', { id: run.id, locale: lang }),
          );
      }),
    );
    const anchor = performance.now(),
      remaining = Date.parse(run.dueAt) - Date.parse(run.serverNow);
    timer = setInterval(() => {
      if (performance.now() - anchor >= remaining) void ctx.guard(ctx.refresh);
    }, 1000);
  }
  function report(result: AssignmentReport) {
    phase = 'report';
    classId = result.classId;
    heading(result);
    const link = document.createElement('input');
    link.readOnly = true;
    link.value = `${location.origin}/#assignment=${result.id}`;
    ctx.root.append(
      label('share', link),
      el('p', t('shareNote')),
      el('p', t('coverage', result.summary)),
    );
    if (result.summary.total) ctx.root.append(el('p', t('score', result.summary)));
    else ctx.root.append(el('p', t('noScore')));
    for (const l of result.learners) {
      const row = el('article');
      row.append(el('h3', l.alias));
      if (!l.sharing) row.append(el('p', t('private')));
      else if (!l.result) row.append(el('p', t('notSubmitted')));
      else
        row.append(
          el('p', t(l.result.reason)),
          el('p', t('score', { correct: l.result.correct, total: l.result.total })),
          el('p', t('answered', { answered: l.result.answered, total: l.result.total })),
        );
      ctx.root.append(row);
    }
    if (!result.closedAt)
      ctx.root.append(
        button('close', async () => {
          if (confirm(t('closeConfirm'))) await change('close', { id: result.id });
        }),
      );
    else ctx.root.append(el('p', t('closed')));
  }
  function builder(bank: BankEntry[]) {
    const section = el('section'),
      form = el('form'),
      title = document.createElement('input'),
      due = document.createElement('input');
    title.required = true;
    title.maxLength = 80;
    due.type = 'datetime-local';
    due.required = true;
    due.value = localInput(new Date(Date.now() + 86400000));
    const resolved = el('p');
    const showDue = () => {
      const date = new Date(due.value);
      resolved.textContent = Number.isFinite(date.getTime())
        ? t('dueResolved', { local: date.toLocaleString(lang), utc: date.toISOString() })
        : '';
    };
    due.addEventListener('change', showDue);
    showDue();
    const source = document.createElement('select'),
      count = document.createElement('input');
    count.type = 'number';
    count.min = '1';
    count.max = '10';
    count.value = '1';
    for (const entry of bank)
      source.add(
        new Option(
          `${entry.label} · ${entry.kind === 'lesson' ? t('lesson', { count: entry.tasks }) : t('exercise')}`,
          entry.key,
        ),
      );
    const sync = () => {
      count.disabled = bank.find((b) => b.key === source.value)?.kind === 'lesson';
      if (count.disabled) count.value = '1';
    };
    source.addEventListener('change', sync);
    sync();
    const chosen: AssignmentBlock[] = [],
      list = el('div'),
      total = el('p');
    const render = () => {
      list.replaceChildren();
      chosen.forEach((b, index) => {
        const row = el(
          'p',
          `${bank.find((entry) => entry.key === b.key)?.label ?? b.key} × ${String(b.count)}`,
        );
        row.append(
          button('remove', () => {
            chosen.splice(index, 1);
            render();
          }),
        );
        if (index > 0)
          row.append(
            button('up', () => {
              const previous = chosen[index - 1];
              if (previous) {
                chosen[index - 1] = b;
                chosen[index] = previous;
                render();
              }
            }),
          );
        if (index < chosen.length - 1)
          row.append(
            button('down', () => {
              const next = chosen[index + 1];
              if (next) {
                chosen[index + 1] = b;
                chosen[index] = next;
                render();
              }
            }),
          );
        list.append(row);
      });
      total.textContent = t('selection', {
        count: chosen.reduce(
          (sum, b) => sum + (bank.find((entry) => entry.key === b.key)?.tasks ?? 0) * b.count,
          0,
        ),
      });
    };
    const add = button('add', () => {
      if (chosen.length >= 6) throw new Error('invalid');
      chosen.push({ key: source.value, count: Number(count.value) });
      render();
    });
    const submit = el('button', t('create'));
    submit.type = 'submit';
    form.append(
      label('title', title),
      label('due', due),
      resolved,
      el('h3', t('builder')),
      label('source', source),
      label('count', count),
      add,
      list,
      total,
      el('p', t('draftPolicy')),
      submit,
    );
    render();
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      void ctx.guard(async () => {
        const date = new Date(due.value);
        if (!Number.isFinite(date.getTime()) || localInput(date) !== due.value)
          throw new Error('invalid');
        const result = await ctx.api<{ id: string }>('/api/assignment-create', {
          class: classId,
          title: title.value,
          dueAt: date.toISOString(),
          blocks: chosen,
        });
        chooseAssignment(result.id);
        await ctx.refresh();
      });
    });
    section.append(el('h2', t('create')), form);
    return section;
  }
  return {
    active: () => Boolean(classId || assignmentId),
    stop,
    polling: () => phase === 'report',
    clearOnError: (code: string) =>
      phase === 'report' ||
      phase === 'finished' ||
      code === 'forbidden' ||
      code === 'materialChanged',
    controls: () => {
      const b = ctx.root.querySelector<HTMLButtonElement>('[data-assignment-answer]');
      if (b) b.disabled = !ctx.root.querySelector('input[name=assignment-answer]:checked');
    },
    reset: () => {
      stop();
      classId = '';
      assignmentId = '';
      phase = '';
      history.replaceState(null, '', '/');
    },
    openClass: chooseClass,
    async render(state: SchoolState, locale: AppLocale) {
      lang = locale;
      stop();
      if (assignmentId) {
        if (state.actor.kind === 'staff')
          report(await ctx.api<AssignmentReport>('/api/assignment-report', { id: assignmentId }));
        else
          view(await ctx.api<AssignmentView>('/api/assignment-view', { id: assignmentId, locale }));
        return;
      }
      phase = 'list';
      const c = state.classes.find((entry) => entry.id === classId);
      if (!c || c.archived) throw new Error('forbidden');
      const result = await ctx.api<{ assignments: Assignment[] }>('/api/assignment-list', {
        class: classId,
      });
      ctx.root.replaceChildren(el('h2', `${c.label} · ${t('assignments')}`), el('p', t('intro')));
      if (c.teaches) {
        const { bank } = await ctx.api<{ bank: BankEntry[] }>('/api/assignment-catalog', {
          locale,
        });
        ctx.root.append(builder(bank));
      }
      if (!result.assignments.length) ctx.root.append(el('p', t('empty')));
      for (const a of result.assignments) {
        const article = el('article');
        article.append(
          el('h3', a.title),
          el('p', t('dueLabel', { date: new Date(a.dueAt).toLocaleString(locale) })),
          button(c.teaches ? 'report' : 'open', async () => {
            chooseAssignment(a.id);
            await ctx.refresh();
          }),
        );
        ctx.root.append(article);
      }
    },
  };
}
