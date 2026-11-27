import { z } from 'zod';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.117.3';

const limits = { friends_accept: 10, daily_puzzle_read: 60 } as const;
const resultSchema = z.object({
  allowed: z.boolean(),
  retryAfter: z.number().int().min(0).max(60),
});

export async function socialRequestLimit(
  client: SupabaseClient,
  actor: string,
  scope: keyof typeof limits,
): Promise<number | null> {
  const result = await client.rpc('consume_request_limit', {
    actor,
    scope,
    max_requests: limits[scope],
    window_seconds: 60,
  });
  if (result.error) throw new Error('Request limit unavailable');
  const checked = resultSchema.parse(result.data);
  if (checked.allowed !== (checked.retryAfter === 0)) throw new Error('Invalid request limit');
  return checked.allowed ? null : checked.retryAfter;
}
