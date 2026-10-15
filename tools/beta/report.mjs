import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readPrivateJson } from './access.mjs';
import { escapeHtml as e } from './guide.mjs';
import { summarizeWeek, betaCompletionProblems } from './study.mjs';
import { newPrivateOutput } from './paths.mjs';
export function renderWeeklyReport(report) {
  const table = (title, values) =>
    `<section><h2>${e(title)}</h2><dl>${Object.entries(values)
      .map(([key, value]) => `<dt>${e(key)}</dt><dd>${e(value)}</dd>`)
      .join('')}</dl></section>`;
  return `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Harmonia · Beta-Auswertung</title><style>:root{color-scheme:light dark;font:16px system-ui}body{max-width:1000px;margin:auto;padding:clamp(16px,4vw,48px);line-height:1.6;overflow-wrap:anywhere}section{border:1px solid #7d8994;border-radius:16px;padding:24px;margin:24px 0}dl{display:grid;grid-template-columns:1fr auto;gap:12px}dd{margin:0}h1{font-size:clamp(26px,5vw,42px)}li{margin:12px 0}</style><body><header><p>PRIVATER BETREIBERBERICHT · ${e(report.campaignId)}</p><h1>Rückmeldungen aus der Beta</h1>${report.dataKind === 'synthetic' ? '<p><strong>SYNTHETISCHE TESTDATEN · KEINE ECHTE BETA</strong></p>' : '<p>Manuell bestätigte Beobachtungen. Das Werkzeug prüft Felder; es bestätigt keine echte Nutzung.</p>'}<p>${report.startedOn ? `Beta-Zeitraum: ${e(report.startedOn)} bis ${e(report.endedOn ?? 'noch offen')}.` : 'Die Beta wurde noch nicht gestartet.'}</p><p>${e(report.from)} bis ${e(report.toExclusive)} (Ende exklusiv). Statusstand: ${e(report.asOf)}.</p></header><main><section><h2>Teilnahme und Rückmeldungen</h2><p>${report.participants} Personen mit bestätigter erster Nutzung bis zum Periodenende; ${report.newlyObserved} erstmals in dieser Woche. Ausgestellte oder eingeladene Zugänge zählen nicht als Nutzung.</p><p>${report.feedback} Rückmeldungen in dieser Periode; ${report.untriaged} noch ohne zugeordnetes Arbeitspaket. ${report.issuesReportedThisWeek.length} unterschiedliche zugeordnete Arbeitspakete.</p><p>Ein Mensch zählt einmal. Plattformzahlen können sich überschneiden. Kein Aktivierungs-/Bindungsnachweis aus diesem Journal; dafür das getrennte einwilligungsgebundene Analytics-Dashboard verwenden.</p></section>${table('Zielgruppen bis Periodenende', report.groups)}${table('Getestete Plattformen bis Periodenende', report.platforms)}${table('Rückmeldungen nach Kanal', report.sources)}<section><h2>Arbeitspakete der Wochenmeldungen</h2><p>Aktueller Bearbeitungsstand bei Erstellung; keine rückwirkende Statusrekonstruktion.</p><ul>${report.issuesReportedThisWeek.map((row) => `<li><b>${e(row.id)} · ${e(row.severity)} · ${e(row.status)}</b><p>${e(row.summary)}</p><p>Verantwortlich: ${e(row.owner ?? 'offen')} · Nachverfolgung: ${e(row.trackingReference ?? 'offen')}</p>${row.verificationReference ? `<p>Prüfbeleg: ${e(row.verificationReference)}</p>` : ''}</li>`).join('') || '<li>Keine zugeordneten Arbeitspakete in dieser Periode.</li>'}</ul></section><section><h2>Alle aktuell offenen kritischen Fehler</h2><ul>${report.openCritical.map((row) => `<li>${e(row.id)} · ${e(row.summary)}</li>`).join('') || '<li>Keine im Journal eingetragen. Das ersetzt keinen vollständigen Qualitätsdurchgang.</li>'}</ul></section><section><h2>Offene Beta-Abnahme</h2><ul>${report.completionProblems.map((item) => `<li>${e(item)}</li>`).join('') || '<li>Journalfelder vollständig. Tatsächliche Nutzung, Belege und Freigabe sind menschlich zu prüfen.</li>'}</ul><p>Zielwerte ${report.metricsReviewed ? 'nach Beta-Baseline dokumentiert' : 'noch offen; erst nach echten Beta-Daten festlegen'}. Prozentwerte mit leerem Nenner werden nicht erfunden.</p></section></main><footer>Vertraulich halten, nicht in App-Exports oder öffentliche CI-Artefakte kopieren. Kontaktliste, Konto-IDs und Originalmeldungen gehören nicht in diesen Bericht. Bei Berichtigung oder Löschung neu erzeugen und alte Kopien entfernen.</footer></body></html>`;
}
export function reportMain(args) {
  const value = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : null);
  if (!value('--study')) throw Error('--study is required');
  const study = readPrivateJson(resolve(value('--study')));
  if (args.includes('--finish')) {
    const problems = betaCompletionProblems(study);
    if (problems.length) throw Error('Beta completion blocked: ' + problems.join(', '));
    console.log(
      'Beta journal fields complete; human evidence review and launch approval remain separate.',
    );
    return;
  }
  if (!value('--output')) throw Error('--output is required');
  const report = summarizeWeek(study, value('--from'), value('--to'));
  const output = newPrivateOutput(value('--output'), 'reports');
  // A new directory avoids overwriting unrelated files or keeping stale previous reports.
  mkdirSync(output, { mode: 0o700 });
  writeFileSync(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', {
    mode: 0o600,
    flag: 'wx',
  });
  writeFileSync(join(output, 'index.html'), renderWeeklyReport(report), {
    mode: 0o600,
    flag: 'wx',
  });
  console.log(
    'Private weekly beta report created; no message sent or analytics collection enabled.',
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    reportMain(process.argv.slice(2));
  } catch (error) {
    console.error(
      error.message.startsWith('Beta completion blocked:')
        ? error.message
        : 'Beta report failed; check journal fields, private file permissions, closed UTC dates and a new private report directory.',
    );
    process.exitCode = 1;
  }
}
