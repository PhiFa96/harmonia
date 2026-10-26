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
import {
  createAudioEngine,
  type AudioEngine,
  type Timers,
} from '../../packages/audio/src/index.ts';
import {
  createWorkbenchPlayer,
  workbenchPlaybackTimeline,
  MIN_TEMPO,
  MAX_TEMPO,
  type PlaybackPart,
  type PlayerState,
} from './playback.ts';

interface Bootstrap {
  draft: WorkbenchDraft;
  locale: ReportLocale;
  assets: ReportAssets;
}

export function startWorkbench({ draft, locale: initialLocale, assets }: Bootstrap): void {
  let locale = initialLocale;
  let revision = 0;
  let reportHtml: string | null = null;
  let checkedDraft: WorkbenchDraft | null = null;
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
  const button = (message: 'analyze' | 'save' | 'export' | 'play' | 'stop') => {
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
  status.id = 'check-status';
  status.setAttribute('role', 'status');
  const error = document.createElement('div');
  error.setAttribute('role', 'alert');
  const output = document.createElement('section');
  output.setAttribute('aria-label', WORKBENCH_MESSAGES[locale].results);
  const style = document.createElement('style');
  document.head.append(style);
  const sound = document.createElement('fieldset');
  const soundTitle = document.createElement('legend'),
    soundHelp = document.createElement('p');
  const tempo = document.createElement('input');
  tempo.type = 'number';
  tempo.min = String(MIN_TEMPO);
  tempo.max = String(MAX_TEMPO);
  tempo.step = '1';
  tempo.value = '96';
  const part = document.createElement('select');
  for (const voice of ['all', ...PARTS]) part.add(new Option('', voice));
  const soundFields = document.createElement('div');
  soundFields.className = 'fields';
  soundFields.append(label(tempo, 'tempo'), label(part, 'part'));
  const play = button('play'),
    stop = button('stop');
  play.disabled = true;
  stop.disabled = true;
  const soundActions = document.createElement('div');
  soundActions.className = 'actions';
  soundActions.append(play, stop);
  const soundStatus = document.createElement('p');
  soundStatus.id = 'playback-status';
  soundStatus.setAttribute('role', 'status');
  const progress = document.createElement('progress');
  progress.max = 1;
  progress.value = 0;
  sound.append(
    soundTitle,
    soundHelp,
    soundFields,
    soundActions,
    soundStatus,
    label(progress, 'progress'),
  );
  let audioContext: AudioContext | undefined;
  let audioEngine: AudioEngine | undefined;
  let audioState: PlayerState = { status: 'idle', elapsed: 0, duration: 0 };
  const timers: Timers = {
    setInterval: (callback, ms) => window.setInterval(callback, ms),
    clearInterval: (handle) => {
      window.clearInterval(handle as number);
    },
  };
  function renderPlayer(next: PlayerState) {
    audioState = next;
    const active = next.status === 'starting' || next.status === 'playing';
    play.disabled = checkedDraft === null || active;
    stop.disabled = !active;
    const m = WORKBENCH_MESSAGES[locale];
    const messages = {
      idle: '',
      starting: m.audioStarting,
      playing: m.audioPlaying,
      stopped: m.audioStopped,
      ended: m.audioEnded,
      error: m.audioError,
    };
    // Keine wiederholten Live-Ankündigungen für jeden Fortschrittsschritt.
    if (soundStatus.textContent !== messages[next.status])
      soundStatus.textContent = messages[next.status];
    progress.max = next.duration || 1;
    progress.value = next.elapsed;
  }
  const player = createWorkbenchPlayer(
    () => {
      if (!audioContext || audioContext.state === 'closed') {
        const context = new AudioContext();
        audioContext = context;
        audioEngine = createAudioEngine(context, { timers, volume: 0.6 });
        context.addEventListener('statechange', () => {
          if (
            audioContext === context &&
            context.state !== 'running' &&
            audioState.status === 'playing'
          )
            player.stop();
        });
      }
      if (!audioEngine) throw new Error('Audio engine unavailable');
      return audioEngine;
    },
    timers,
    renderPlayer,
  );
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
    sound,
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
    checkedDraft = null;
    player.stop();
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
      const snapshot = read();
      const report = renderVoiceLeadingReport(workbenchReportInput(snapshot), locale, assets);
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
      checkedDraft = snapshot;
      renderPlayer(audioState);
      exportReport.disabled = false;
      status.textContent = `${WORKBENCH_MESSAGES[locale].checked} ${String(report.analysis.findings.length)}.`;
      if (report.groupCount < report.analysis.findings.length)
        status.textContent += ` ${REPORT_MESSAGES[locale].groups}: ${String(report.groupCount)}.`;
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
    soundTitle.textContent = m.listen;
    soundHelp.textContent = m.soundHelp;
    soundStatus.setAttribute('aria-label', m.audioStatus);
    for (const option of part.options)
      option.textContent =
        option.value === 'all'
          ? m.allParts
          : REPORT_MESSAGES[locale].voices[option.value as (typeof PARTS)[number]];
    renderPlayer(audioState);
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
  play.addEventListener('click', () => {
    if (!checkedDraft) return;
    if (
      !Number.isInteger(tempo.valueAsNumber) ||
      tempo.valueAsNumber < MIN_TEMPO ||
      tempo.valueAsNumber > MAX_TEMPO
    ) {
      player.stop();
      soundStatus.textContent = WORKBENCH_MESSAGES[locale].tempoError;
      tempo.focus();
      return;
    }
    void player.start(
      workbenchPlaybackTimeline(checkedDraft, tempo.valueAsNumber, part.value as PlaybackPart),
    );
  });
  stop.addEventListener('click', () => {
    player.stop();
  });
  tempo.addEventListener('input', () => {
    player.stop();
  });
  part.addEventListener('change', () => {
    player.stop();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) player.stop();
  });
  window.addEventListener('pagehide', () => {
    player.dispose();
    const context = audioContext;
    audioContext = undefined;
    audioEngine = undefined;
    if (context && context.state !== 'closed')
      void context.close().catch(() => {
        /* Bereits beendete Plattformausgabe. */
      });
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
