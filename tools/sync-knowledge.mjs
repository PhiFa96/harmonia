// Nur abgeleitete Wissensinhalte; keine Kontodaten und kein Remote-Ziel in diesem lokalen Einstieg.
import { execFileSync } from 'node:child_process';
import { currentKnowledgeSnapshot } from '../supabase/functions/_shared/knowledge.ts';
const status = JSON.parse(
    execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  ),
  api = new URL(status.API_URL);
if (api.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(api.hostname))
  throw new Error('Wissensabgleich ist ausschließlich lokal.');
const lane = process.argv.includes('--preview') ? 'preview' : 'published',
  snapshot = await currentKnowledgeSnapshot(lane);
const response = await fetch(new URL('/rest/v1/rpc/replace_knowledge_index', api), {
  method: 'POST',
  headers: {
    apikey: status.SERVICE_ROLE_KEY,
    Authorization: `Bearer ${status.SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    target_lane: lane,
    new_snapshot: snapshot.digest,
    version: snapshot.contentVersion,
    article_total: snapshot.articleCount,
    entries: snapshot.chunks,
  }),
  signal: AbortSignal.timeout(30000),
});
if (!response.ok) throw new Error(`Lokaler Wissensabgleich fehlgeschlagen (${response.status}).`);
console.log(
  `Wissensindex ${lane}: ${snapshot.articleCount} Artikel, ${snapshot.chunks.length} Abschnitte, Version ${snapshot.contentVersion}; ${(await response.json()) ? 'atomar ersetzt' : 'bereits aktuell'}.`,
);
