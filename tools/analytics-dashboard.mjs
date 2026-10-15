// Private operator report. The browser receives aggregates only, never a service key.
import { execFileSync } from 'node:child_process';
import { writeFileSync, chmodSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const escape = (text) =>
  String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
const ratio = (numerator, denominator) =>
  denominator ? `${((100 * numerator) / denominator).toFixed(1)} %` : '—';
export function renderDashboard(report, { fixture = false } = {}) {
  const metric = (title, numerator, denominator, note) =>
    `<article><h2>${escape(title)}</h2><strong>${ratio(numerator, denominator)}</strong><p>${escape(numerator)} / ${escape(denominator)}</p><small>${escape(note)}</small></article>`;
  const money = Number(report.aiCosts.nano_usd) / 1e9;
  return `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Harmonia · Kennzahlen</title><style>
  :root{color-scheme:light dark;font:16px system-ui;background:#111923;color:#f1f5fa}body{max-width:1152px;margin:auto;padding:clamp(16px,4vw,48px)}header{margin-bottom:32px}h1{font-size:clamp(28px,5vw,44px);letter-spacing:-.04em}h2{font-size:18px;margin-top:0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:16px}article,section{background:#1b2736;padding:24px;border:1px solid #425570;border-radius:16px}strong{display:block;font-size:36px;color:#b6e2ce}p,small{line-height:1.6}small{color:#c5cfdd}section{margin-top:24px}.scroll{overflow:auto}table{width:100%;border-collapse:collapse;text-align:left}th,td{padding:12px 8px;border-bottom:1px solid #425570}.lessons table{min-width:640px}caption{text-align:left;margin-bottom:12px}code{overflow-wrap:anywhere}summary{cursor:pointer;padding:8px}footer{margin-top:24px;color:#c5cfdd}
  </style><header><p>HARMONIA · PRIVATER BETREIBERBERICHT</p><h1>Lernen verstehen.</h1>${fixture ? '<p><b>SYNTHETISCHE TESTDATEN · KEINE BETA-DATEN</b></p>' : ''}<p>${escape(report.from)} bis ${escape(report.toExclusive)} (Ende exklusiv). Nur abgeschlossene UTC-Tage vor ${escape(report.closedBefore)}.</p><p>Erfassung: <b>${report.collectionEnabled ? 'freigegeben' : 'ausgeschaltet'}</b> · ${escape(report.participants)} beobachtete Konten in der Kohorte.</p><p>Nur freiwillig teilnehmende Konten. Gäste und widerrufene Konten fehlen; die Stichprobe repräsentiert nicht alle Lernenden. Keine Beta-Abnahme aus Testdaten ableiten.</p></header><main><div class="grid">
  ${metric('Aktivierung · 7 Tage', report.activation.converted, report.activation.eligible, 'Erste bestandene Lektion in den ersten 7 UTC-Tagen nach Einwilligung; nur ausgereifte Kohorten.')}
  ${report.retention.map((row) => metric(`Rückkehr · Tag ${row.n}`, row.returned, row.eligible, 'App am exakten UTC-Folgetag aktiv; dieser Tag muss vollständig abgeschlossen sein.')).join('')}
  ${metric('Premium · 30 Tage', report.premiumConversion.converted, report.premiumConversion.eligible, 'Bestätigter bezahlter Erstkauf/Trial-Umwandlung in 30 Tagen. Bereits zahlende Konten, Sandbox und Trial-Starts ausgeschlossen.')}
  <article><h2>KI-Kosten · Stichprobe</h2><strong>${money.toFixed(9)} USD</strong><p>${escape(report.aiCosts.requests)} abgeschlossene Anfragen</p><small>${escape(report.aiCosts.estimated)} mit Kostenschätzung. Enthält auch fehlgeschlagene/abgebrochene Anfragen mit Verbrauch. Keine Gesamtanbieterrechnung.</small></article>
  </div><section><h2>Abschlussquote je Lektion</h2><p>Durchgänge mit beobachtetem Start im Zeitraum, Abschluss bis zum Berichtsstand. Offene Durchgänge sind im Nenner enthalten. Wiederaufnahme zählt einmal.</p><p>Diese Tabelle kann seitlich gescrollt werden.</p><div class="scroll lessons" tabindex="0" role="region" aria-label="Lektionsquoten"><table><caption>Lektion und Inhaltsversion</caption><thead><tr><th scope="col">Lektion</th><th scope="col">Version</th><th scope="col">Starts</th><th scope="col">Abschlüsse</th><th scope="col">Quote</th><th scope="col">Bestanden</th></tr></thead><tbody>${report.lessons.map((row) => `<tr><th scope="row"><code>${escape(row.lesson)}</code></th><td>${escape(row.version)}</td><td>${escape(row.started)}</td><td>${escape(row.completed)}</td><td>${ratio(row.completed, row.started)}</td><td>${escape(row.passed)}</td></tr>`).join('') || '<tr><td colspan="6">Noch keine beobachteten Lektionsstarts.</td></tr>'}</tbody></table></div></section>
  <section><h2>Ereignisse im Zeitraum</h2><div class="scroll"><table><caption>Dokumentierte Ereignisnamen</caption><thead><tr><th scope="col">Ereignis</th><th scope="col">Anzahl</th></tr></thead><tbody>${
    Object.entries(report.events)
      .map(
        ([name, total]) => `<tr><th scope="row">${escape(name)}</th><td>${escape(total)}</td></tr>`,
      )
      .join('') || '<tr><td colspan="2">Keine Daten im Zeitraum.</td></tr>'
  }</tbody></table></div></section>
  <section><details><summary>Definitionen und Datenschutz</summary><p>Die Kohorte beginnt bei der ausdrücklichen Einwilligung. Zeitbasis ist UTC und der serverseitige Eingang des Ereignisses. Keine rückwirkende Auswertung vorhandener Antworten. Nenner 0 bedeutet „—“. Kohorten mit unvollständigem Beobachtungsfenster fehlen in der jeweiligen Quote.</p><p>Ein Widerruf entfernt nach Synchronisation die eigene Kohorte und ihre Ereignisse, eine Kontolöschung ebenfalls. Nach spätestens zwölf Monaten endet die Beobachtung und die Kohorte wird durch den Retentionsjob gelöscht. Bereits exportierte Betreiberberichte sind getrennt vertraulich zu behandeln und bei Widerruf/Löschung zu ersetzen.</p></details></section></main><footer>Harmonia · Analytics v1 · Nur aggregierte Werte, keine Konto-IDs, Texte oder Schlüssel. Dieser Bericht ist kein öffentliches App-Angebot.</footer></html>`;
}
export async function dashboardMain(args) {
  const value = (name) => args[args.indexOf(name) + 1];
  if (!args.includes('--local') && !args.includes('--remote'))
    throw new Error('Explizit --local oder --remote wählen.');
  if (args.includes('--local') && args.includes('--remote'))
    throw new Error('Nur eine Umgebung wählen.');
  const from = value('--from'),
    to = value('--to'),
    output = value('--output');
  if (
    !args.includes('--from') ||
    !args.includes('--to') ||
    !args.includes('--output') ||
    !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
    !output
  )
    throw new Error('--from YYYY-MM-DD --to YYYY-MM-DD --output datei.html erforderlich.');
  let url, key;
  if (args.includes('--local')) {
    const status = JSON.parse(
      execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    );
    url = status.API_URL;
    key = status.SERVICE_ROLE_KEY;
    if (!/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(url))
      throw new Error('Nur lokale Supabase-URL.');
  } else {
    url = process.env.HARMONIA_ANALYTICS_URL;
    key = process.env.HARMONIA_ANALYTICS_SERVICE_ROLE_KEY;
    const target = new URL(url);
    if (
      target.protocol !== 'https:' ||
      target.username ||
      target.password ||
      target.pathname !== '/' ||
      target.search ||
      target.hash ||
      !key
    )
      throw new Error('Sichere serverseitige Analytics-Bindung fehlt.');
  }
  const res = await fetch(new URL('/rest/v1/rpc/analytics_dashboard', url), {
    method: 'POST',
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ first_day: from, last_day: to }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error('Privater Bericht nicht verfügbar: HTTP ' + res.status);
  const report = await res.json();
  writeFileSync(output, renderDashboard(report), { mode: 0o600 });
  chmodSync(output, 0o600);
  console.log('Privater aggregierter Bericht erstellt: ' + output);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  dashboardMain(process.argv.slice(2)).catch(() => {
    console.error(
      'Analytics-Bericht fehlgeschlagen. Argumente, Verbindung und serverseitige Berechtigung prüfen.',
    );
    process.exitCode = 1;
  });
