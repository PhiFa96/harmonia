import { schoolText, type SchoolTextKey } from '../../packages/i18n/src/school-draft.ts';
import type { AppLocale } from '../../packages/i18n/src/locale.ts';
import type { ClassReport, Evidence, SchoolClass, SchoolState } from './protocol.ts';
import { summarizeClass } from './report.ts';
import { createAssignmentUi } from './assignment-browser.ts';
import {
  ASSIGNMENT_MESSAGES,
  assignmentText,
  type AssignmentTextKey,
} from '../../packages/i18n/src/school-assignments.ts';

const root = document.querySelector('main');
if (!root) throw new Error('Missing dashboard root');
const main: HTMLElement = root;
let locale: AppLocale = 'de',
  state: SchoolState | undefined,
  selected = '',
  learner = '',
  busy = false;
const t = (key: SchoolTextKey, values: Record<string, string | number> = {}) =>
  schoolText(locale, key, values);
const error = document.createElement('p');
error.setAttribute('role', 'alert');
const status = document.createElement('p');
status.setAttribute('role', 'status');
const content = document.createElement('div');
const assignmentUi = createAssignmentUi({ root: content, api, guard, refresh });
const languages = document.createElement('select'),
  accounts = document.createElement('select');
let fieldId = 0;
for (const [value, label] of [
  ['de', 'Deutsch'],
  ['en-US', 'English (US)'],
  ['en-GB', 'English (UK)'],
])
  if (value && label) languages.add(new Option(label, value));
function el<K extends keyof HTMLElementTagNameMap>(tag: K, text = '') {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}
function actions(...nodes: HTMLElement[]) {
  const div = el('div');
  div.className = 'actions';
  div.append(...nodes);
  return div;
}
function label(key: SchoolTextKey, node: HTMLElement) {
  const wrapper = el('div');
  const l = el('label', t(key));
  node.id ||= `school-field-${String(++fieldId)}`;
  l.htmlFor = node.id;
  wrapper.append(l, node);
  return wrapper;
}
function button(key: SchoolTextKey, action: () => void | Promise<void>) {
  const node = el('button', t(key));
  node.type = 'button';
  node.addEventListener('click', () => {
    void guard(action);
  });
  return node;
}
function input(key: SchoolTextKey, value = '') {
  const node = document.createElement('input');
  node.value = value;
  node.maxLength = 80;
  node.required = true;
  return { node, label: label(key, node) };
}
function form(key: SchoolTextKey, fields: HTMLElement[], action: () => Promise<void>) {
  const node = el('form');
  node.append(...fields);
  const submit = el('button', t(key));
  submit.type = 'submit';
  node.append(submit);
  node.addEventListener('submit', (event) => {
    event.preventDefault();
    void guard(action);
  });
  return node;
}
async function api<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(
    path,
    body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10000),
        }
      : { signal: AbortSignal.timeout(10000) },
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
async function guard(action: () => void | Promise<void>) {
  if (busy) return;
  busy = true;
  error.textContent = '';
  status.textContent = '';
  languages.disabled = true;
  accounts.disabled = true;
  content.setAttribute('aria-busy', 'true');
  for (const node of content.querySelectorAll('button')) node.disabled = true;
  try {
    await action();
  } catch (reason) {
    // Never retain a cached report after a failed authorization or refresh.
    const message = reason instanceof Error ? reason.message : 'error';
    if (selected || assignmentUi.clearOnError(message)) content.replaceChildren();
    error.textContent = Object.hasOwn(ASSIGNMENT_MESSAGES.de, message)
      ? assignmentText(locale, message as AssignmentTextKey)
      : t(
          message === 'invalid' || message === 'invalidCode' || message === 'forbidden'
            ? message
            : 'error',
        );
  } finally {
    busy = false;
    languages.disabled = false;
    accounts.disabled = false;
    content.removeAttribute('aria-busy');
    for (const node of content.querySelectorAll('button')) node.disabled = false;
    assignmentUi.controls();
  }
}
function headingFocus() {
  const h = content.querySelector('h2');
  h?.setAttribute('tabindex', '-1');
  h?.focus();
}
function shell() {
  document.documentElement.lang = locale;
  document.title = t('title');
  languages.value = locale;
  accounts.replaceChildren();
  for (const actor of state?.actors ?? []) accounts.add(new Option(t(actor.key), actor.key));
  accounts.value = state?.actor.key ?? 'adminA';
  const banner = el('p', t('draft'));
  banner.className = 'draft';
  main.replaceChildren(
    el('h1', t('title')),
    banner,
    el('p', t('intro')),
    el('p', t('privacy')),
    label('language', languages),
    label('account', accounts),
    actions(
      button('refresh', refresh),
      button('overview', async () => {
        assignmentUi.reset();
        selected = '';
        learner = '';
        await refresh();
      }),
    ),
    error,
    status,
    content,
  );
}
async function change(action: string, payload: object) {
  await api(`/api/${action}`, payload);
  await refresh();
  status.textContent = t('changed');
}
function inviteSection(org: string, classId: string | null) {
  const section = el('section');
  section.append(el('h3', t(classId ? 'inviteLearner' : 'inviteTeacher')));
  const uses = input('uses', classId ? '30' : '1');
  uses.node.type = 'number';
  uses.node.min = '1';
  uses.node.max = '30';
  uses.node.step = '1';
  const output = el('div');
  output.setAttribute('aria-live', 'polite');
  section.append(
    form(classId ? 'inviteLearner' : 'inviteTeacher', [uses.label], async () => {
      const result = await api<{ code: string; uses: number }>('/api/invite', {
        org,
        class: classId,
        kind: classId ? 'learner' : 'teacher',
        uses: Number(uses.node.value),
      });
      output.replaceChildren(
        el('p', t('code')),
        el('code', result.code),
        el('p', t('codeInfo', { uses: result.uses })),
      );
    }),
    output,
    el('p', t('codeLost')),
    button('revokeInvites', async () => {
      await change('revokeInvites', { org, class: classId });
    }),
  );
  return section;
}
function overview() {
  if (!state) return;
  content.replaceChildren(el('h2', t('overview')));
  if (state.actor.kind === 'staff') {
    const name = input('orgLabel');
    const section = el('section');
    section.append(
      el('h2', t('organizations')),
      form('createOrg', [name.label], async () => {
        await change('createOrg', { label: name.node.value });
      }),
    );
    for (const org of state.organizations) {
      const article = el('article');
      article.append(el('h3', org.label), el('p', t(org.role)));
      const className = input('classLabel');
      article.append(
        form('createClass', [className.label], async () => {
          await change('createClass', { org: org.id, label: className.node.value });
        }),
      );
      if (org.role === 'admin') {
        article.append(inviteSection(org.id, null), el('h3', t('staff')));
        for (const member of state.colleagues.filter((m) => m.org_id === org.id)) {
          const who = state.actors.find((a) => a.id === member.actor_id);
          const row = el('p', who ? t(who.key) : member.actor_id);
          if (member.role !== 'admin')
            row.append(
              button('removeTeacher', async () => {
                if (confirm(t('confirmRemove')))
                  await change('removeTeacher', { org: org.id, actor: member.actor_id });
              }),
            );
          article.append(row);
        }
      }
      section.append(article);
    }
    content.append(section);
  }
  const join = el('section'),
    code = input('code');
  code.node.maxLength = 64;
  code.node.autocomplete = 'off';
  join.append(
    el('h2', t('joinTitle')),
    form('join', [code.label], async () => {
      await change('join', { code: code.node.value });
      status.textContent = t('joined');
    }),
  );
  content.append(join, el('h2', t('classes')));
  if (!state.classes.length) content.append(el('p', t('noClasses')));
  for (const schoolClass of state.classes) content.append(classCard(schoolClass));
}
function classCard(c: SchoolClass) {
  const section = el('section');
  section.dataset['class'] = c.id;
  section.append(el('h3', c.label));
  if (!state) return section;
  const org = state.organizations.find((o) => o.id === c.org_id),
    membership = state.memberships.find((m) => m.class_id === c.id);
  if (c.archived) section.append(el('p', t('archived')));
  if (!c.archived && (c.teaches || membership)) {
    const entry = el('button', assignmentText(locale, 'assignments'));
    entry.type = 'button';
    entry.addEventListener('click', () => {
      void guard(async () => {
        selected = '';
        assignmentUi.openClass(c.id);
        await refresh();
      });
    });
    section.append(entry);
  }
  if (c.teaches)
    section.append(
      button('view', async () => {
        selected = c.id;
        learner = '';
        await refresh();
        headingFocus();
      }),
      inviteSection(c.org_id, c.id),
    );
  if (membership) {
    section.append(
      el('p', t(membership.sharing ? 'sharingOn' : 'sharingOff')),
      el('p', t('shareInfo')),
    );
    if (!c.archived)
      section.append(
        button(membership.sharing ? 'withdraw' : 'share', async () => {
          if (membership.sharing || confirm(t('shareConfirm')))
            await change('sharing', { class: c.id, enabled: !membership.sharing });
        }),
      );
    section.append(
      button('leave', async () => {
        if (confirm(t('confirmLeave'))) await change('leave', { class: c.id });
      }),
    );
  }
  if (org?.role === 'admin' && !c.archived) {
    section.append(el('h3', t('assignment')));
    for (const colleague of state.colleagues.filter((m) => m.org_id === c.org_id)) {
      const actor = state.actors.find((a) => a.id === colleague.actor_id);
      const assigned = state.teachers.some(
        (row) => row.class_id === c.id && row.actor_id === colleague.actor_id,
      );
      const row = el('p', actor ? t(actor.key) : colleague.actor_id);
      row.append(
        button(assigned ? 'unassign' : 'assign', async () => {
          if (!assigned || confirm(t('confirmRemove')))
            await change('setTeacher', {
              class: c.id,
              actor: colleague.actor_id,
              enabled: !assigned,
            });
        }),
      );
      section.append(row);
    }
  }
  if (!c.archived && (c.teaches || org?.role === 'admin'))
    section.append(
      button('archive', async () => {
        if (confirm(t('confirmArchive'))) await change('archive', { class: c.id });
      }),
    );
  if (org?.role === 'admin')
    section.append(
      button('deleteClass', async () => {
        if (confirm(t('confirmDelete'))) await change('deleteClass', { class: c.id });
      }),
    );
  return section;
}
function evidence(entries: readonly Evidence[]) {
  const section = el('div');
  if (!entries.length) section.append(el('p', t('noData')));
  for (const row of entries) {
    const article = el('article');
    article.append(
      el('h3', t(row.area)),
      el(
        'p',
        t('evidence', {
          correct: row.correct,
          total: row.total,
          percent: Math.round((row.correct / row.total) * 100),
        }),
      ),
      el('p', t('completed', { count: row.completed })),
      el('p', t('last', { date: new Date(row.at).toLocaleString(locale) })),
      el('p', t(row.correct * 100 < row.total * 80 ? 'practice' : 'sufficient')),
    );
    section.append(article);
  }
  return section;
}
function report(result: ClassReport) {
  content.replaceChildren(el('h2', result.label), el('p', t('reportNote')));
  const chosen = result.learners.find((l) => l.actor === learner);
  if (chosen) {
    content.append(
      el('h2', t('learner', { alias: chosen.alias })),
      el('p', t(chosen.sharing ? 'sharingOn' : 'noSharing')),
      evidence(chosen.areas),
      button('back', () => {
        learner = '';
        report(result);
        headingFocus();
      }),
    );
    return;
  }
  learner = '';
  content.append(
    el('h2', t('report')),
    el(
      'p',
      t('coverage', {
        shared: result.learners.filter((l) => l.sharing).length,
        members: result.learners.length,
      }),
    ),
    evidence(summarizeClass(result.learners)),
  );
  for (const entry of result.learners) {
    const article = el('article');
    article.append(
      el('h3', t('learner', { alias: entry.alias })),
      el('p', t(entry.sharing ? 'sharingOn' : 'noSharing')),
      button('detail', () => {
        learner = entry.actor;
        report(result);
        headingFocus();
      }),
      button('removeLearner', async () => {
        if (confirm(t('confirmRemove')))
          await change('removeLearner', { class: result.id, actor: entry.actor });
      }),
    );
    content.append(article);
  }
}
async function refresh() {
  if (selected || assignmentUi.active()) content.replaceChildren();
  state = await api<SchoolState>('/api/state');
  shell();
  if (assignmentUi.active()) {
    await assignmentUi.render(state, locale);
    if (document.hidden) {
      assignmentUi.stop();
      content.replaceChildren();
    }
    return;
  }
  if (selected) {
    if (!state.classes.some((c) => c.id === selected && c.teaches)) {
      selected = '';
      learner = '';
      overview();
      status.textContent = t('accessEnded');
      return;
    }
    const result = await api<ClassReport>(`/api/report?class=${encodeURIComponent(selected)}`);
    if (!document.hidden) report(result);
  } else overview();
}
languages.addEventListener('change', () => {
  void guard(async () => {
    locale = languages.value === 'en-US' ? 'en-US' : languages.value === 'en-GB' ? 'en-GB' : 'de';
    await refresh();
  });
});
accounts.addEventListener('change', () => {
  void guard(async () => {
    const next = accounts.value;
    selected = '';
    learner = '';
    content.replaceChildren();
    await api('/api/session', { actor: next });
    await refresh();
  });
});
// Clear report DOM when hidden. On return, retrieve authorization and data again.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && (selected || assignmentUi.active())) {
    assignmentUi.stop();
    content.replaceChildren();
  } else if (!document.hidden) void guard(refresh);
});
window.setInterval(() => {
  if ((selected || assignmentUi.polling()) && !document.hidden && !busy) void guard(refresh);
}, 10000);
window.addEventListener('pagehide', () => {
  assignmentUi.stop();
});
shell();
void guard(refresh);
