import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.117.3';
import { motivationHistorySchema, rewardRuleSchema } from '../../../packages/content/src/index.ts';
export const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers });
export const backend = () =>
  createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
export { hash } from './hash.ts';
export async function history(client: SupabaseClient, actor: string) {
  const result = await client.rpc('motivation_history', { actor });
  if (result.error) throw new Error('History unavailable');
  return motivationHistorySchema.parse(result.data);
}
export async function rules(client: SupabaseClient) {
  const result = await client
    .from('reward_rules')
    .select('rule')
    .order('effective_at')
    .overrideTypes<{ rule: unknown }[], { merge: false }>();
  if (result.error) throw new Error('Rules unavailable');
  return rewardRuleSchema
    .array()
    .min(1)
    .max(1000)
    .parse(result.data.map((r) => r.rule));
}
/** Ein Tokenkonflikt nach Neuinstallation blockiert keine Lern-/Wirtschaftssynchronisation. */
export async function registerDevice(
  client: SupabaseClient,
  input: {
    actor: string;
    device: string;
    secret_hash: string;
    new_revision: number;
    token: string | null;
  },
) {
  if (input.token !== null) {
    const expired = await client
      .from('reminder_devices')
      .update({ push_token: null })
      .eq('push_token', input.token)
      .lt('lease_until', new Date().toISOString());
    if (expired.error) return { error: expired.error };
  }
  const result = await client.rpc('register_reminder_device', input);
  return result.error?.code === '23505'
    ? client.rpc('register_reminder_device', { ...input, token: null })
    : result;
}
