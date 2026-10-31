import { licenseText, type LicenseTextKey } from '../../packages/i18n/src/school-license.ts';
import { schoolText } from '../../packages/i18n/src/school-draft.ts';
import type { AppLocale } from '../../packages/i18n/src/locale.ts';
import {
  createAudioEngine,
  type AudioEngine,
  type Timers,
} from '../../packages/audio/src/index.ts';
import { createWorkbenchPlayer } from '../voice-leading/playback.ts';
import { licenseInvoiceHtml } from './license-document.ts';
import type {
  LicenseInvoice,
  LicenseOverview,
  LicensePractice,
  LicenseAccess,
} from './license-protocol.ts';
interface Context {
  root: HTMLElement;
  api: <T>(path: string, body?: object) => Promise<T>;
  guard: (action: () => void | Promise<void>) => Promise<void>;
  refresh: () => Promise<void>;
}
export function createLicenseUi(ctx: Context) {
  let active = location.hash === '#licenses' || location.hash.startsWith('#school-practice='),
    practiceId = /^#school-practice=([a-f0-9-]{36})$/.exec(location.hash)?.[1] ?? '',
    lang: AppLocale = 'de',
    field = 0,
    generation = 0;
  let engine: AudioEngine | undefined,
    timer: ReturnType<typeof setInterval> | undefined,
    sound: HTMLElement | undefined;
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
      if (sound) sound.textContent = s.status === 'error' ? t('audioError') : '';
    },
  );
  const t = (key: LicenseTextKey, values: Record<string, string | number> = {}) =>
    licenseText(lang, key, values);
  function el<K extends keyof HTMLElementTagNameMap>(tag: K, text = '') {
    const n = document.createElement(tag);
    n.textContent = text;
    return n;
  }
  function label(key: LicenseTextKey, input: HTMLElement) {
    const wrap = el('div'),
      l = el('label', t(key));
    input.id = `license-${String(++field)}`;
    l.htmlFor = input.id;
    wrap.append(l, input);
    return wrap;
  }
  function button(key: LicenseTextKey, fn: () => void | Promise<void>) {
    const b = el('button', t(key));
    b.type = 'button';
    b.addEventListener('click', () => {
      void ctx.guard(fn);
    });
    return b;
  }
  function stop() {
    generation++;
    player.stop();
    if (timer) clearInterval(timer);
    timer = undefined;
  }
  function reset() {
    stop();
    active = false;
    practiceId = '';
  }
  function lost(message: LicenseTextKey = 'licenseRequired') {
    stop();
    ctx.root.replaceChildren(
      el('h2', t('entry')),
      el('p', t(message)),
      button('refresh', ctx.refresh),
    );
  }
  function controls() {
    const b = ctx.root.querySelector<HTMLButtonElement>('[data-license-answer]');
    if (b) b.disabled = !ctx.root.querySelector('input[name=license-answer]:checked');
  }
  const money = (n: number) =>
    new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' }).format(n / 100);
  async function change(action: string, p: object) {
    await ctx.api(`/api/license-${action}`, p);
    await ctx.refresh();
  }
  function builder(data: LicenseOverview) {
    const form = el('form'),
      org = el('select'),
      seats = el('input'),
      unit = el('input'),
      days = el('select'),
      start = el('input'),
      requestId = crypto.randomUUID();
    for (const o of data.organizations) org.add(new Option(o.label, o.id));
    seats.type = 'number';
    seats.min = '1';
    seats.max = '1000';
    seats.value = '2';
    seats.required = true;
    unit.type = 'number';
    unit.min = '1';
    unit.max = '100000';
    unit.value = '250';
    unit.required = true;
    for (const d of [30, 90, 365]) days.add(new Option(t('duration', { days: d }), String(d)));
    start.type = 'datetime-local';
    const submit = el('button', t('create'));
    submit.type = 'submit';
    form.append(
      label('org', org),
      label('seats', seats),
      label('unit', unit),
      label('days', days),
      label('start', start),
      el('p', t('startInfo')),
      submit,
    );
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      void ctx.guard(async () => {
        const date = start.value ? new Date(start.value) : null;
        if (
          date &&
          (!Number.isFinite(date.getTime()) ||
            date.getHours() !== Number(start.value.slice(11, 13)) ||
            date.getDate() !== Number(start.value.slice(8, 10)))
        )
          throw new Error('invalid');
        await change('create', {
          id: requestId,
          org: org.value,
          seats: Number(seats.value),
          unitCents: Number(unit.value),
          days: Number(days.value),
          startsAt: date?.toISOString() ?? null,
        });
      });
    });
    return form;
  }
  function invoiceCard(i: LicenseInvoice, data: LicenseOverview) {
    const card = el('article');
    card.dataset['invoice'] = i.id;
    card.append(
      el('h3', i.organization),
      el('p', t(i.state)),
      el('p', i.reference),
      el('p', t('capacity', { used: i.used, seats: i.seats })),
      el('p', t('amount', { amount: money(i.totalCents) })),
      el(
        'p',
        t('period', {
          start: new Date(i.startsAt).toISOString(),
          end: new Date(i.endsAt).toISOString(),
        }),
      ),
    );
    if (i.state === 'paid')
      card.append(
        el(
          'p',
          t(
            Date.parse(i.endsAt) <= Date.now()
              ? 'expired'
              : Date.parse(i.startsAt) > Date.now()
                ? 'scheduled'
                : 'active',
          ),
        ),
      );
    card.append(
      button('invoice', async () => {
        const fresh = await ctx.api<LicenseInvoice>('/api/license-invoice', { id: i.id });
        const url = URL.createObjectURL(
            new Blob([licenseInvoiceHtml(fresh, lang)], { type: 'text/html;charset=utf-8' }),
          ),
          a = el('a');
        a.href = url;
        a.download = `sample-invoice-${i.id}.html`;
        a.click();
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      }),
    );
    if (data.operator) {
      if (i.state === 'draft')
        card.append(
          button('pay', async () => {
            if (confirm(t('payConfirm'))) await change('pay', { id: i.id });
          }),
        );
      if (i.state !== 'void')
        card.append(
          button('cancel', async () => {
            if (confirm(t('cancelConfirm'))) await change('void', { id: i.id });
          }),
        );
    } else if (i.state === 'paid') {
      card.append(el('h4', t('manage')), el('p', t('seatInfo')));
      for (const member of data.candidates.filter((c) => c.org === i.org)) {
        const assigned = data.seats.some((s) => s.invoice === i.id && s.actor === member.id),
          row = el('p', schoolText(lang, member.key));
        row.dataset['seatActor'] = member.key;
        row.append(
          button(assigned ? 'release' : 'assign', () =>
            change('assign', { id: i.id, actor: member.id, enabled: !assigned }),
          ),
        );
        card.append(row);
      }
    }
    const history = el('details');
    history.append(el('summary', t('events')));
    for (const e of data.events.filter((e) => e.invoice === i.id))
      history.append(el('p', `${t(e.kind)} · ${new Date(e.at).toISOString()}`));
    card.append(history);
    return card;
  }
  function practice(v: LicensePractice) {
    player.stop();
    const q = v.question,
      section = el('section');
    section.dataset['practice'] = v.id;
    section.append(el('h3', t('practice')), el('p', q.prompt));
    if (q.svg) {
      const score = el('div');
      score.className = 'score';
      score.tabIndex = 0;
      score.setAttribute('role', 'img');
      score.setAttribute('aria-label', q.description ?? q.prompt);
      score.innerHTML = q.svg;
      score.querySelector('svg')?.setAttribute('aria-hidden', 'true');
      section.append(score);
    }
    const audio = q.audio;
    if (audio) {
      sound = el('p');
      sound.setAttribute('role', 'status');
      section.append(
        button('play', () => player.start(audio)),
        button('stop', () => {
          player.stop();
        }),
        sound,
      );
    }
    if (v.result) section.append(el('p', t(v.result.correct ? 'correct' : 'incorrect')));
    else {
      const form = el('form'),
        set = el('fieldset');
      set.append(el('legend', q.prompt));
      for (const c of q.choices) {
        const input = el('input'),
          l = el('label', c.label);
        input.type = 'radio';
        input.name = 'license-answer';
        input.value = c.id;
        l.prepend(input);
        set.append(l);
      }
      const submit = el('button', t('answer'));
      submit.type = 'submit';
      submit.dataset['licenseAnswer'] = 'true';
      submit.disabled = true;
      set.addEventListener('change', controls);
      form.append(set, submit);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const answer = set.querySelector<HTMLInputElement>('input:checked')?.value;
        if (answer)
          void ctx.guard(async () => {
            const result = await ctx.api<LicensePractice>('/api/license-practice-answer', {
              id: v.id,
              answer,
              locale: lang,
            });
            section.replaceWith(practice(result));
          });
      });
      section.append(form);
    }
    return section;
  }
  return {
    active: () => active,
    stop,
    reset,
    controls,
    open() {
      reset();
      active = true;
      history.replaceState(null, '', '#licenses');
    },
    resetPractice() {
      practiceId = '';
      if (active) history.replaceState(null, '', '#licenses');
    },
    onError(code: string) {
      if (code === 'practiceExpired' || code === 'materialChanged') {
        practiceId = '';
        history.replaceState(null, '', '#licenses');
      }
      if (['licenseRequired', 'forbidden', 'materialChanged', 'practiceExpired'].includes(code))
        lost(code === 'practiceExpired' ? 'practiceExpired' : 'licenseRequired');
    },
    async render(locale: AppLocale) {
      stop();
      lang = locale;
      const data = await ctx.api<LicenseOverview>('/api/license-overview', {});
      ctx.root.replaceChildren(
        el('h2', t('entry')),
        el('p', t('intro')),
        el('h3', t('access')),
        el('p', t(data.status.tier === 'premium' ? 'premium' : 'free')),
      );
      for (const grant of data.grants)
        ctx.root.append(
          el(
            'p',
            t('grant', {
              organization: grant.organization,
              end: new Date(grant.endsAt).toISOString(),
            }),
          ),
        );
      if (data.operator) {
        ctx.root.append(el('h3', t('operator')));
        if (data.organizations.length) ctx.root.append(builder(data));
        else ctx.root.append(el('p', t('noOrgs')));
      }
      if (!data.invoices.length) ctx.root.append(el('p', t('noInvoices')));
      for (const i of data.invoices) ctx.root.append(invoiceCard(i, data));
      if (data.status.tier === 'premium') {
        ctx.root.append(el('h3', t('practice')), el('p', t('practiceInfo')));
        const source = el('select');
        for (const s of ['notes', 'intervals', 'hearing'] as const) source.add(new Option(t(s), s));
        ctx.root.append(label('practice', source));
        let requestId = crypto.randomUUID();
        ctx.root.append(
          button('newQuestion', async () => {
            const id = requestId,
              v = await ctx.api<LicensePractice>('/api/license-practice', {
                id,
                source: source.value,
                locale: lang,
              });
            requestId = crypto.randomUUID();
            practiceId = id;
            history.replaceState(null, '', `#school-practice=${id}`);
            ctx.root.querySelector('[data-practice]')?.remove();
            ctx.root.append(practice(v));
          }),
        );
        if (practiceId)
          ctx.root.append(
            practice(
              await ctx.api<LicensePractice>('/api/license-practice-view', {
                id: practiceId,
                locale: lang,
              }),
            ),
          );
        const gen = generation;
        let checking = false;
        timer = setInterval(() => {
          if (checking || document.hidden) return;
          checking = true;
          void ctx
            .api<LicenseAccess>('/api/license-status', {})
            .then((v) => {
              if (gen === generation && v.status.tier !== 'premium') lost();
            })
            .catch(() => {
              if (gen === generation) lost();
            })
            .finally(() => {
              checking = false;
            });
        }, 5000);
      } else if (practiceId) {
        practiceId = '';
        history.replaceState(null, '', '#licenses');
      }
    },
  };
}
