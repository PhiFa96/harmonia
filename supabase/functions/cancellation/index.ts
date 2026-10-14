import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import {
  cancellationRequestSchema,
  cancellationReceiptSchema,
} from '../../../packages/content/src/cancellation.ts';
import { billingBody } from '../_shared/billing.ts';
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey,content-type,authorization,x-client-info',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers });
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return json(405, { error: 'method' });
  let input;
  try {
    input = cancellationRequestSchema.safeParse(JSON.parse(await billingBody(request, 16384)));
  } catch {
    return json(400, { error: 'schema' });
  }
  if (!input.success) return json(400, { error: 'schema' });
  try {
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(10000) }),
        },
      },
    );
    const result = await client.rpc('receive_cancellation', {
      request_id: input.data.id,
      body: input.data.body,
    });
    if (result.error)
      return json(
        result.error.message === 'Cancellation conflict'
          ? 409
          : result.error.message === 'Cancellation rate'
            ? 429
            : 503,
        { error: 'unavailable' },
      );
    return json(200, cancellationReceiptSchema.parse(result.data));
  } catch {
    return json(503, { error: 'unavailable' });
  }
});
