import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
type Service = 'learning-sync' | 'tutor' | 'billing-webhook';
/** Default-off operational counts. No request contents or identities enter the recorder. */
export function observeHandler(
  service: Service,
  handler: (request: Request) => Promise<Response>,
  env = (key: string) => Deno.env.get(key),
  transport: typeof fetch = fetch,
) {
  return async (request: Request): Promise<Response> => {
    if (env('OPS_METRICS_ENABLED') !== 'true' || request.method === 'OPTIONS')
      return handler(request);
    const started = performance.now();
    const record = async (status: number) => {
      try {
        const url = env('SUPABASE_URL'),
          key = env('SUPABASE_SERVICE_ROLE_KEY');
        if (!url || !key) return;
        const client = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) =>
              transport(input, { ...init, signal: AbortSignal.timeout(1000) }),
          },
        });
        await client.rpc('record_operational_outcome', {
          service_name: service,
          response_status: status,
          duration_ms: Math.min(60000, Math.max(0, Math.round(performance.now() - started))),
        });
      } catch {
        /* Diagnostics do not replace the handler's response; missing samples remain possible. */
      }
    };
    try {
      const response = await handler(request);
      await record(response.status);
      return response;
    } catch (error) {
      await record(500);
      throw error;
    }
  };
}
