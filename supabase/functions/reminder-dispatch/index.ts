import { backend, hash, headers, json } from '../_shared/motivation.ts';
import { dispatchReminders } from '../_shared/reminder-job.ts';
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return json(405, { error: 'method' });
  const expected = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    auth = request.headers.get('authorization') ?? '';
  if (!expected || auth.length > 8192 || (await hash(auth)) !== (await hash(`Bearer ${expected}`)))
    return json(401, { error: 'auth' });
  if (Deno.env.get('HARMONIA_PUSH_ENABLED') !== 'true') return json(503, { error: 'disabled' });
  try {
    return json(200, await dispatchReminders(backend(), Date.now()));
  } catch {
    return json(503, { error: 'request' });
  }
});
