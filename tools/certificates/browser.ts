import {
  certificateTranslator,
  CERTIFICATE_DRAFT_MESSAGES,
  type CertificateTextKey,
} from '../../packages/i18n/src/certificate-draft.ts';
import type { AppLocale } from '../../packages/i18n/src/locale.ts';
import {
  createAudioEngine,
  type AudioEngine,
  type Timers,
} from '../../packages/audio/src/index.ts';
import { createWorkbenchPlayer } from '../voice-leading/playback.ts';
import type { DraftAttempt, DraftState, DraftPurchase } from './protocol.ts';

const root = document.querySelector('main');
if (!root) throw new Error('Missing workshop root');
const main: HTMLElement = root;
const language = document.createElement('select');
for (const [value, label] of [
  ['de', 'Deutsch'],
  ['en-US', 'English (US)'],
  ['en-GB', 'English (UK)'],
]) {
  if (value && label) language.add(new Option(label, value));
}
const initial = localStorage.getItem('certificate-draft-locale');
let locale: AppLocale = initial === 'en-US' || initial === 'en-GB' ? initial : 'de';
let t = certificateTranslator(locale),
  state: DraftState | undefined;
let selected = location.hash.slice(1),
  busy = false,
  timer: ReturnType<typeof setInterval> | undefined;
let endedReason: CertificateTextKey | undefined;
let audioEngine: AudioEngine | undefined;
const timers: Timers = {
  setInterval: (fn, ms) => window.setInterval(fn, ms),
  clearInterval: (id) => {
    window.clearInterval(id as number);
  },
};
const error = document.createElement('p');
error.setAttribute('role', 'alert');
const content = document.createElement('div');
const audioStatus = document.createElement('p');
audioStatus.setAttribute('role', 'status');
let stopButton: HTMLButtonElement | undefined;
const player = createWorkbenchPlayer(
  () => {
    audioEngine ??= createAudioEngine(new AudioContext(), { timers, volume: 0.6 });
    return audioEngine;
  },
  timers,
  (s) => {
    if (stopButton) stopButton.disabled = !['starting', 'playing'].includes(s.status);
    audioStatus.textContent = s.status === 'error' ? t('audioError') : '';
  },
);
function element<K extends keyof HTMLElementTagNameMap>(tag: K, text = '') {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}
function button(key: CertificateTextKey, action: () => void | Promise<void>, primary = false) {
  const node = element('button', t(key));
  node.type = 'button';
  if (primary) node.className = 'primary';
  node.addEventListener('click', () => {
    if (!busy) void guarded(action);
  });
  return node;
}
async function guarded(action: () => void | Promise<void>) {
  if (busy) return;
  busy = true;
  language.disabled = true;
  error.textContent = '';
  content.setAttribute('aria-busy', 'true');
  for (const b of content.querySelectorAll('button')) b.disabled = true;
  try {
    await action();
  } catch (reason) {
    const key =
      reason instanceof Error && reason.message in CERTIFICATE_DRAFT_MESSAGES.de
        ? (reason.message as CertificateTextKey)
        : 'error';
    if (key === 'sessionExpired') endSession(key);
    else error.textContent = t(key);
  } finally {
    busy = false;
    language.disabled = false;
    content.removeAttribute('aria-busy');
    for (const b of content.querySelectorAll('button')) b.disabled = false;
    // Answer submission remains unavailable until a radio has been selected.
    const answer = content.querySelector<HTMLButtonElement>('[data-submit-answer]');
    if (answer) answer.disabled = !content.querySelector('input[type=radio]:checked');
  }
}
async function api<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(
    path,
    body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : {},
  );
  const value: unknown = await response.json();
  if (!response.ok)
    throw new Error(
      typeof value === 'object' && value && 'error' in value && typeof value.error === 'string'
        ? value.error
        : 'error',
    );
  return value as T;
}
function choose(id: string) {
  selected = id;
  history.replaceState(null, '', id ? `#${id}` : '/');
}
async function download(path: string, body: object, filename: string) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const value = (await response.json()) as { error?: string };
    throw new Error(value.error ?? 'error');
  }
  const url = URL.createObjectURL(await response.blob()),
    link = element('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10000);
}
function endSession(reason: CertificateTextKey) {
  player.stop();
  if (timer) clearInterval(timer);
  endedReason = reason;
  state = undefined;
  choose('');
  shell();
  content.replaceChildren(
    element('h2', t('sessionEnded')),
    element('p', t(reason)),
    button('newSession', () => {
      location.assign('/');
    }),
  );
}
function shell() {
  document.documentElement.lang = locale;
  document.title = t('title');
  const heading = element('h1', t('title')),
    banner = element('p', t('draft'));
  banner.className = 'draft';
  const label = element('label', t('language'));
  language.value = locale;
  label.append(language);
  const actions = element('div');
  actions.className = 'actions';
  if (!endedReason)
    actions.append(
      button('exportData', () =>
        download('/api/export', {}, 'harmonia-certificate-test-data.json'),
      ),
      button('logout', async () => {
        if (!window.confirm(t('logoutConfirm'))) return;
        await api('/api/logout', {});
        endSession('loggedOut');
      }),
      button('erase', async () => {
        if (!window.confirm(t('eraseConfirm'))) return;
        await api('/api/erase', {});
        endSession('erased');
      }),
    );
  main.replaceChildren(heading, banner, label, error, content, actions);
}
function focusHeading() {
  const h = content.querySelector<HTMLElement>('h2');
  h?.setAttribute('tabindex', '-1');
  h?.focus();
}
function overview() {
  if (!state) return;
  player.stop();
  if (timer) clearInterval(timer);
  choose('');
  content.replaceChildren(
    element('h2', t('history')),
    element('p', t('intro')),
    element('p', t('policy')),
    element('p', t('privacy')),
  );
  content.append(
    element(
      'p',
      t(state.paymentMode === 'local-simulation' ? 'paymentSimulationMode' : 'paymentsUnavailable'),
    ),
  );
  for (const profile of state.profiles) {
    const section = element('section');
    section.append(element('h3', t('profile', profile)));
    if (state.paymentMode === 'local-simulation')
      section.append(
        button(
          'start',
          async () => {
            const active = state?.attempts.find((a) => a.phase === 'active');
            if (active) {
              choose(active.id);
              renderAttempt(active);
              focusHeading();
              return;
            }
            const existing = state?.purchases.find(
              (p) =>
                p.profile === profile.id &&
                p.policy === state?.paymentPolicy &&
                !p.attemptId &&
                ['pending', 'paid'].includes(p.status),
            );
            const order =
              existing ??
              (await api<DraftPurchase>('/api/order', {
                profile: profile.id,
                requestId: crypto.randomUUID(),
              }));
            choose('order:' + order.id);
            renderCheckout(order);
            focusHeading();
          },
          true,
        ),
      );
    content.append(section);
  }
  for (const attempt of state.attempts) {
    const section = element('section'),
      profile = state.profiles.find((p) => p.id === attempt.profile);
    section.append(
      element('h3', t('profile', { stage: profile?.stage ?? 0, version: profile?.version ?? 1 })),
      element('p', new Date(attempt.startedAt).toLocaleString(locale)),
      button('resume', async () => {
        choose(attempt.id);
        await refresh();
        focusHeading();
      }),
    );
    content.append(section);
  }
  if (state.purchases.length) {
    const history = element('section');
    history.append(element('h2', t('purchaseHistory')));
    for (const order of state.purchases) {
      const row = element('div');
      row.append(
        element('p', t(paymentStatus(order))),
        button('openPurchase', () => {
          choose('order:' + order.id);
          renderCheckout(order);
          focusHeading();
        }),
      );
      history.append(row);
    }
    content.append(history);
  }
  const verify = element('section');
  verify.append(element('h2', t('verifyTitle')));
  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = 38;
  input.autocomplete = 'off';
  const label = element('label', t('code'));
  label.append(input);
  const status = element('p');
  status.setAttribute('role', 'status');
  verify.append(
    label,
    button('verify', async () => {
      const result = await api<{
        status: 'draft' | 'revoked' | 'notFound' | 'outdatedCode';
        stage?: number;
      }>('/api/verify', { code: input.value.trim().toUpperCase() });
      status.textContent =
        result.status === 'draft' ? t('verified', { stage: result.stage ?? 0 }) : t(result.status);
    }),
    status,
  );
  content.append(verify);
}
function paymentStatus(order: DraftPurchase): CertificateTextKey {
  return {
    pending: 'paymentPending',
    paid: 'paymentPaid',
    cancelled: 'paymentCancelled',
    refunded: 'paymentRefunded',
  }[order.status] as CertificateTextKey;
}
function refundButton(order: DraftPurchase) {
  return button('refund', async () => {
    if (!window.confirm(t('refundConfirm'))) return;
    await api('/api/simulation/refund', { id: order.id });
    await refresh();
    focusHeading();
  });
}
function renderCheckout(order: DraftPurchase) {
  player.stop();
  if (timer) clearInterval(timer);
  const profile = state?.profiles.find((p) => p.id === order.profile);
  content.replaceChildren(
    element('h2', t('purchaseTitle')),
    element('p', t('profile', { stage: profile?.stage ?? 0, version: profile?.version ?? 1 })),
    element('p', t('purchaseNotice')),
    element('p', t(paymentStatus(order))),
  );
  if (state?.paymentMode !== 'local-simulation' || order.policy !== state.paymentPolicy) {
    content.append(
      element(
        'p',
        t(
          state?.paymentMode === 'local-simulation'
            ? 'paymentOrderOutdated'
            : 'paymentsUnavailable',
        ),
      ),
      button('home', async () => {
        choose('');
        await refresh();
        focusHeading();
      }),
    );
    return;
  }
  if (['pending', 'paid'].includes(order.status) && !order.attemptId) {
    content.append(
      button(
        order.status === 'pending' ? 'payAndStart' : 'startPaid',
        async () => {
          if (order.status === 'pending')
            await api('/api/simulation/settle', { id: order.id, outcome: 'paid' });
          const attempt = await api<DraftAttempt>('/api/start', {
            profile: order.profile,
            purchase: order.id,
            locale,
          });
          choose(attempt.id);
          await refresh();
          focusHeading();
        },
        true,
      ),
    );
    if (order.status === 'pending')
      content.append(
        button('cancelPurchase', async () => {
          await api('/api/simulation/settle', { id: order.id, outcome: 'cancelled' });
          await refresh();
        }),
      );
  }
  if (order.status === 'paid') content.append(refundButton(order));
  content.append(
    button('home', async () => {
      choose('');
      await refresh();
      focusHeading();
    }),
  );
}
function renderAttempt(attempt: DraftAttempt) {
  player.stop();
  if (timer) clearInterval(timer);
  content.replaceChildren();
  if (attempt.phase === 'unavailable') {
    content.append(
      element('h2', t('paymentsUnavailableTitle')),
      element('p', t('paymentsUnavailable')),
    );
  } else if (attempt.phase === 'cancelled') {
    content.append(element('h2', t('paymentRefunded')), element('p', t('purchaseRefunded')));
  } else if (attempt.phase === 'outdated') {
    content.append(element('h2', t('outdatedTitle')), element('p', t('outdated')));
  } else if (attempt.phase === 'finished' && attempt.result) {
    const result = attempt.result;
    content.append(
      element('h2', t('result')),
      element('p', t(attempt.reason ?? 'submitted')),
      element('p', t('points', { points: result.points, maximum: result.maxPoints })),
    );
    for (const area of result.areas)
      content.append(
        element(
          'p',
          `${t(area.area)}: ${t('points', { points: area.points, maximum: area.maxPoints })}`,
        ),
      );
    content.append(element('p', t(result.qualified ? 'qualified' : 'notQualified')));
    if (result.code) {
      content.append(element('p', t('code')), element('code', result.code));
      if (result.revoked) content.append(element('p', t('revoked')));
      else
        content.append(
          button('download', async () => {
            await download('/api/pdf', { id: attempt.id, locale }, 'harmonia-DRAFT-INVALID.pdf');
          }),
          button('revoke', async () => {
            await api('/api/revoke', { id: attempt.id });
            await refresh();
          }),
        );
    }
  } else if (attempt.question) {
    const q = attempt.question;
    const countdown = element('p'),
      start = performance.now();
    const tick = () => {
      const seconds = Math.max(
        0,
        Math.ceil((attempt.deadlineAt - attempt.serverNow - (performance.now() - start)) / 1000),
      );
      countdown.textContent = t('remaining', {
        time: `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, '0')}`,
      });
      if (!seconds && !busy) {
        if (timer) clearInterval(timer);
        void guarded(refresh);
      }
    };
    content.append(
      element('h2', t('progress', { current: q.index + 1, total: q.total })),
      countdown,
      element('p', t(q.area)),
      element('p', t('noHints')),
      element('h3', q.prompt),
    );
    tick();
    timer = setInterval(tick, 1000);
    if (q.svg) {
      const score = element('div');
      score.className = 'score';
      score.tabIndex = 0;
      score.setAttribute('role', 'img');
      score.setAttribute('aria-label', t('notation'));
      score.innerHTML = q.svg;
      score.querySelector('svg')?.setAttribute('aria-hidden', 'true');
      content.append(score);
      if (q.description) {
        const details = element('details');
        details.append(
          element('summary', t('description')),
          element('p', q.description.map((d) => d.text).join('; ')),
        );
        content.append(details);
      }
    }
    if (q.audio) {
      stopButton = button('stop', () => {
        player.stop();
      });
      content.append(
        button('play', async () => {
          if (q.audio) await player.start(q.audio);
        }),
        stopButton,
        audioStatus,
      );
    }
    const form = element('fieldset');
    form.append(element('legend', t('answers')));
    let selectedAnswer: string | null = null;
    const submit = button(
      'answer',
      async () => {
        if (selectedAnswer === null) return;
        const next = await api<DraftAttempt>('/api/answer', {
          id: attempt.id,
          index: q.index,
          answer: selectedAnswer,
          locale,
        });
        renderAttempt(next);
        focusHeading();
      },
      true,
    );
    submit.dataset['submitAnswer'] = '';
    submit.disabled = true;
    for (const choice of q.choices) {
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'answer';
      input.value = choice.id;
      input.addEventListener('change', () => {
        selectedAnswer = choice.id;
        submit.disabled = busy;
      });
      const label = element('label');
      label.append(input, document.createTextNode(choice.label));
      form.append(label);
    }
    content.append(
      form,
      submit,
      button('submit', async () => {
        if (!window.confirm(t('confirm'))) return;
        const next = await api<DraftAttempt>('/api/finish', { id: attempt.id, locale });
        renderAttempt(next);
        focusHeading();
      }),
    );
  }
  const order = state?.purchases.find((p) => p.id === attempt.purchaseId);
  if (
    order?.status === 'paid' &&
    state?.paymentMode === 'local-simulation' &&
    order.policy === state.paymentPolicy
  )
    content.append(refundButton(order));
  content.append(
    button('remove', async () => {
      if (!window.confirm(t('removeConfirm'))) return;
      await api('/api/remove', { id: attempt.id });
      choose('');
      await refresh();
      focusHeading();
    }),
    button('home', async () => {
      choose('');
      await refresh();
      focusHeading();
    }),
  );
}
async function refresh() {
  if (endedReason) {
    endSession(endedReason);
    return;
  }
  state = await api<DraftState>(`/api/state?locale=${locale}`);
  const attempt = state.attempts.find((a) => a.id === selected);
  const order = state.purchases.find((p) => 'order:' + p.id === selected);
  if (order) renderCheckout(order);
  else if (attempt) renderAttempt(attempt);
  else overview();
}
language.addEventListener('change', () => {
  locale = language.value as AppLocale;
  localStorage.setItem('certificate-draft-locale', locale);
  t = certificateTranslator(locale);
  shell();
  void guarded(refresh);
});
window.addEventListener('popstate', () => {
  selected = location.hash.slice(1);
  void guarded(refresh);
});
document.addEventListener('visibilitychange', () => {
  player.stop();
  if (!document.hidden && !busy) void guarded(refresh);
});
window.addEventListener('pagehide', () => {
  player.stop();
});
shell();
void guarded(refresh);
