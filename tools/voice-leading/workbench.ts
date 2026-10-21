import { REPORT_MESSAGES, type ReportLocale } from './messages.ts';
import { renderVoiceLeadingReport, type ReportAssets } from './report.ts';
import {
  MAX_DRAFT_BYTES,
  PARTS,
  parseWorkbenchDraft,
  workbenchReportInput,
  type WorkbenchDraft,
} from './workbench-model.ts';
import { WORKBENCH_MESSAGES } from './workbench-messages.ts';

interface Bootstrap {
  draft: WorkbenchDraft;
  locale: ReportLocale;
  assets: ReportAssets;
}

export function startWorkbench({ draft, locale: initialLocale, assets }: Bootstrap): void {
  let locale = initialLocale;
  let revision = 0;
  let reportHtml: string | null = null;
  const main = document.querySelector('main');
  if (!main) throw new Error('Missing workshop root');
  const form = document.createElement('form');
  form.noValidate = true;
  const h1 = document.createElement('h1');
  const banner = document.createElement('p');
  banner.className = 'draft';
  const introduction = document.createElement('p');
  const language = document.createElement('select');
  for (const [value, text] of [
    ['de-DE', 'Deutsch'],
    ['en-US', 'English (US)'],
    ['en-GB', 'English (UK)'],
  ]) {
    if (!value || !text) continue;
    language.add(new Option(text, value));
  }
  language.value = locale;
  const translations: (() => void)[] = [];
  const label = (
    control: HTMLElement,
    key: keyof (typeof WORKBENCH_MESSAGES)['de-DE'] | (typeof PARTS)[number],
  ) => {
    const wrapper = document.createElement('label');
    const text = document.createElement('span');
    translations.push(() => {
      text.textContent =
        key in WORKBENCH_MESSAGES[locale]
          ? WORKBENCH_MESSAGES[locale][key as keyof (typeof WORKBENCH_MESSAGES)['de-DE']]
          : REPORT_MESSAGES[locale].voices[key as (typeof PARTS)[number]];
    });
    wrapper.append(text, control);
    return wrapper;
  };
  const field = (value: string, maxLength: number) => {
    const input = document.createElement('input');
    input.value = value;
    input.maxLength = maxLength;
    return input;
  };
  const title = field(draft.title, 200),
    meter = field(draft.meter, 20),
    key = field(draft.key, 20);
  const row = document.createElement('div');
  row.className = 'fields';
  row.append(label(title, 'scoreTitle'), label(meter, 'meter'), label(key, 'key'));
  const notationHelp = document.createElement('p');
  notationHelp.id = 'notation-help';
  const parts = Object.fromEntries(
    PARTS.map((voice) => {
      const input = document.createElement('textarea');
      input.value = draft.parts[voice];
      input.rows = 3;
      input.maxLength = 8_000;
      input.spellcheck = false;
      input.setAttribute('aria-describedby', 'notation-help');
      return [voice, input];
    }),
  ) as Record<(typeof PARTS)[number], HTMLTextAreaElement>;
  const voices = document.createElement('div');
  voices.className = 'voices';
  for (const voice of PARTS) voices.append(label(parts[voice], voice));
  const settingsHelp = document.createElement('p');
  settingsHelp.id = 'settings-help';
  const settings = document.createElement('textarea');
  settings.rows = 12;
  settings.value = draft.settings;
  settings.maxLength = 30_000;
  settings.spellcheck = false;
  settings.setAttribute('aria-describedby', 'settings-help');
  const actions = document.createElement('div');
  actions.className = 'actions';
  const button = (message: 'analyze' | 'save' | 'export') => {
    const node = document.createElement('button');
    node.type = 'button';
    translations.push(() => {
      node.textContent = WORKBENCH_MESSAGES[locale][message];
    });
    return node;
  };
  const analyze = button('analyze');
  analyze.type = 'submit';
  const save = button('save'),
    exportReport = button('export');
  exportReport.disabled = true;
  const file = document.createElement('input');
  file.type = 'file';
  file.accept = '.json,application/json';
  actions.append(analyze, save, exportReport);
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  const error = document.createElement('div');
  error.setAttribute('role', 'alert');
  const output = document.createElement('section');
  output.setAttribute('aria-label', WORKBENCH_MESSAGES[locale].results);
  const style = document.createElement('style');
  document.head.append(style);
  form.append(
    row,
    notationHelp,
    voices,
    label(settings, 'settings'),
    settingsHelp,
    actions,
    label(file, 'load'),
  );
  main.replaceChildren(
    h1,
    banner,
    introduction,
    label(language, 'language'),
    form,
    status,
    error,
    output,
  );

  const read = (): WorkbenchDraft => ({
    format: 'harmonia-satb-draft-v1',
    title: title.value,
    meter: meter.value,
    key: key.value,
    parts: {
      soprano: parts.soprano.value,
      alto: parts.alto.value,
      tenor: parts.tenor.value,
      bass: parts.bass.value,
    },
    settings: settings.value,
  });
  function invalidate(message = WORKBENCH_MESSAGES[locale].pending) {
    revision += 1;
    reportHtml = null;
    exportReport.disabled = true;
    output.replaceChildren();
    error.replaceChildren();
    status.textContent = message;
  }
  function showError(message: string, reason: unknown) {
    const text = document.createElement('p');
    text.textContent = message;
    const details = document.createElement('details'),
      summary = document.createElement('summary'),
      pre = document.createElement('pre');
    summary.textContent = WORKBENCH_MESSAGES[locale].details;
    pre.textContent = reason instanceof Error ? reason.message : String(reason);
    details.append(summary, pre);
    error.replaceChildren(text, details);
  }
  function check() {
    invalidate('');
    try {
      const report = renderVoiceLeadingReport(workbenchReportInput(read()), locale, assets);
      const parsed = new DOMParser().parseFromString(report.html, 'text/html');
      const body = parsed.querySelector('main');
      if (!body) throw new Error('Missing report body');
      const reportTitle = body.querySelector('h1');
      if (reportTitle) {
        const heading = document.createElement('h2');
        heading.textContent = reportTitle.textContent;
        reportTitle.replaceWith(heading);
      }
      style.textContent = parsed.querySelector('style')?.textContent ?? '';
      output.replaceChildren(...body.childNodes);
      reportHtml = report.html;
      exportReport.disabled = false;
      status.textContent = `${WORKBENCH_MESSAGES[locale].checked} ${String(report.analysis.findings.length)}.`;
    } catch (reason) {
      showError(WORKBENCH_MESSAGES[locale].invalid, reason);
    }
  }
  function localize() {
    const m = WORKBENCH_MESSAGES[locale];
    document.documentElement.lang = locale;
    document.title = m.title;
    h1.textContent = m.title;
    banner.textContent = REPORT_MESSAGES[locale].draft;
    introduction.textContent = m.introduction;
    notationHelp.textContent = m.notationHelp;
    settingsHelp.textContent = m.settingsHelp;
    output.setAttribute('aria-label', m.results);
    translations.forEach((translate) => {
      translate();
    });
  }
  function download(text: string, name: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }
  form.addEventListener('input', () => {
    invalidate();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    check();
  });
  language.addEventListener('change', () => {
    const wasChecked = reportHtml !== null;
    locale = language.value as ReportLocale;
    localize();
    if (wasChecked) check();
    else invalidate();
  });
  save.addEventListener('click', () => {
    download(JSON.stringify(read(), null, 2), 'satb-draft.json', 'application/json');
  });
  exportReport.addEventListener('click', () => {
    if (reportHtml) download(reportHtml, `satb-review-${locale}.html`, 'text/html');
  });
  file.addEventListener('change', () => {
    const selected = file.files?.[0];
    if (!selected) return;
    const started = revision;
    void (async () => {
      try {
        if (selected.size > MAX_DRAFT_BYTES) throw new RangeError('Maximum draft size: 512 KB');
        const loaded = parseWorkbenchDraft(JSON.parse(await selected.text()));
        if (started !== revision) return;
        title.value = loaded.title;
        meter.value = loaded.meter;
        key.value = loaded.key;
        settings.value = loaded.settings;
        for (const voice of PARTS) parts[voice].value = loaded.parts[voice];
        invalidate(WORKBENCH_MESSAGES[locale].loaded);
      } catch (reason) {
        if (started === revision) showError(WORKBENCH_MESSAGES[locale].loadError, reason);
      } finally {
        file.value = '';
      }
    })();
  });
  localize();
  check();
}
