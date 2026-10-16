import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { z } from 'zod';
import {
  consentChoicesSchema,
  privacyPolicySchema,
  consentEventSchema,
  privacyDeleteSchema,
  privacyReceiptSchema,
  PRIVACY_EXPORT_SECTIONS,
} from '../../../packages/content/src/privacy.ts';
import { billingBody } from '../_shared/billing.ts';
import { revokeAppleGrant } from '../_shared/apple-grant.ts';
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers });
function recentlyAuthenticated(token: string, lastSignIn: string | undefined) {
  if (!lastSignIn || Date.now() - Date.parse(lastSignIn) > 15 * 60000) return false;
  // getUser already validated this JWT. A refresh token or another session's
  // recent sign-in must not make an old authentication ceremony fresh.
  try {
    const claims: unknown = JSON.parse(
      atob(token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/') ?? ''),
    );
    const parsed = z
      .object({ amr: z.array(z.object({ timestamp: z.number(), method: z.string() })) })
      .parse(claims);
    return parsed.amr.some(
      (entry) =>
        ['otp', 'password', 'oauth', 'mfa/totp', 'mfa/phone'].includes(entry.method) &&
        entry.timestamp * 1000 <= Date.now() + 60000 &&
        Date.now() - entry.timestamp * 1000 < 15 * 60000,
    );
  } catch {
    return false;
  }
}
const sections = {
  profiles: ['profiles', 'id', 'id', '*'],
  leagueAccount: ['league_accounts', 'user_id', 'user_id', '*'],
  leagueMemberships: ['league_members', 'user_id', 'week_start', '*'],
  rushRuns: ['rush_runs', 'user_id', 'id', '*'],
  rushSteps: ['rush_steps', 'user_id', 'sequence', '*'],
  rushUsage: ['rush_daily_usage', 'user_id', 'day', '*'],
  friendships: ['friendships', 'user_id', 'friend_id', '*'],
  skillRatings: ['skill_progress', 'user_id', 'skill_id', '*'],
  cardReviews: ['card_review_progress', 'user_id', 'card_key', '*'],
  learning: [
    'learning_events',
    'user_id',
    'sequence',
    'sequence,client_id,event,received_at,retained_at,rating_version,rating_outcome,rated_at,fsrs_version',
  ],
  rewards: ['xp_ledger', 'user_id', 'client_id', '*'],
  motivation: ['motivation_preferences', 'user_id', 'user_id', '*'],
  freezes: ['freeze_purchases', 'user_id', 'sequence', '*'],
  streaks: ['streaks', 'user_id', 'user_id', '*'],
  reminders: [
    'reminder_devices',
    'user_id',
    'device_id',
    'device_id,revision,seen_at,time_zone,locale',
  ],
  consents: ['privacy_consents', 'user_id', 'sequence', '*'],
  analyticsParticipants: ['analytics_participants', 'user_id', 'user_id', '*'],
  analyticsEvents: ['analytics_events', 'user_id', 'sequence', '*'],
  contentReports: ['content_reports', 'user_id', 'id', '*'],
  conversations: ['tutor_conversations', 'user_id', 'id', '*'],
  messages: [
    'tutor_messages',
    'tutor_conversations.user_id',
    'id',
    'id,conversation_id,role,content,created_at,tutor_conversations!inner(user_id)',
  ],
  tutorRequests: [
    'tutor_requests',
    'user_id',
    'id',
    'id,conversation_id,user_text,state,day,cost,prompt_version,tool_version,usage,result,created_at,finished_at',
  ],
  tutorReports: ['tutor_reports', 'user_id', 'id', '*'],
  aiUsage: ['ai_usage', 'user_id', 'day', '*'],
  entitlements: ['entitlements', 'user_id', 'entitlement', '*'],
  access: ['access_grants', 'user_id', 'client_id', '*'],
  energy: ['access_energy', 'user_id', 'user_id', '*'],
  cancellations: [
    'cancellation_requests',
    'payload->>email',
    'id',
    'id,payload,received_at,status,processed_at',
  ],
} as const;
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!['GET', 'POST', 'DELETE'].includes(request.method)) return json(405, { error: 'method' });
  const params = new URL(request.url).searchParams,
    view = params.get('view') ?? 'status';
  const client = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(10000) }) },
    },
  );
  try {
    if (request.method === 'GET' && view === 'receipt') {
      const id = z.uuid().safeParse(params.get('id'));
      if (!id.success) return json(400, { error: 'schema' });
      const saved = await client
        .from('privacy_erasure_receipts')
        .select('id,subject_id,state,received_at')
        .eq('id', id.data)
        .maybeSingle()
        .overrideTypes<
          {
            id: string;
            subject_id: string | null;
            state: 'processing' | 'deleted';
            received_at: string;
          } | null,
          { merge: false }
        >();
      if (saved.error) return json(503, { error: 'storage' });
      if (!saved.data) return json(404, { error: 'missing' });
      if (saved.data.state === 'processing' && saved.data.subject_id) {
        const user = await client.auth.admin.getUserById(saved.data.subject_id);
        if (user.error?.status === 404) {
          const done = await client.rpc('finish_privacy_erasure', { request_id: id.data });
          if (done.error) return json(503, { error: 'storage' });
          return json(200, privacyReceiptSchema.parse(done.data));
        }
      }
      const external = await client
        .from('privacy_external_erasure')
        .select('state')
        .eq('receipt_id', id.data)
        .in('state', ['pending', 'processing']);
      if (external.error) return json(503, { error: 'storage' });
      return json(
        200,
        privacyReceiptSchema.parse({
          id: id.data,
          state: saved.data.state,
          receivedAt: saved.data.received_at,
          externalPending: external.data.length > 0,
        }),
      );
    }
    const policy = await client.from('privacy_policy').select('policy').eq('id', true).single();
    if (policy.error) return json(503, { error: 'policy' });
    const config = privacyPolicySchema.parse(policy.data.policy);
    if (request.method === 'GET' && view === 'public') return json(200, { policy: config });
    const bearer = request.headers.get('Authorization') ?? '';
    if (!bearer.startsWith('Bearer ') || bearer.length > 8192) return json(401, { error: 'auth' });
    const auth = await client.auth.getUser(bearer.slice(7));
    if (auth.error || auth.data.user.is_anonymous) return json(401, { error: 'auth' });
    const user = auth.data.user,
      actor = user.id;
    if (request.method === 'GET' && view === 'status') {
      const choices = await client.rpc('privacy_choices', { actor });
      if (choices.error) return json(503, { error: 'storage' });
      const analytics = await client
        .from('analytics_participants')
        .select('consent_id')
        .eq('user_id', actor)
        .maybeSingle()
        .overrideTypes<{ consent_id: string } | null, { merge: false }>();
      if (analytics.error) return json(503, { error: 'storage' });
      return json(200, {
        policy: config,
        choices: consentChoicesSchema.parse(choices.data),
        analyticsConsentId: analytics.data?.consent_id ?? null,
        sections: PRIVACY_EXPORT_SECTIONS,
        recentSignIn: recentlyAuthenticated(bearer.slice(7), user.last_sign_in_at),
      });
    }
    if (request.method === 'GET' && view === 'export') {
      const section = z.enum(PRIVACY_EXPORT_SECTIONS).safeParse(params.get('section')),
        after = params.get('after') ?? '';
      if (!section.success || after.length > 256) return json(400, { error: 'schema' });
      if (section.data === 'account')
        return json(200, {
          section: 'account',
          rows: [
            {
              id: actor,
              email: user.email,
              created_at: user.created_at,
              last_sign_in_at: user.last_sign_in_at,
              user_metadata: user.user_metadata as unknown,
              providers: z.array(z.string()).parse(user.app_metadata.providers ?? []),
            },
          ],
          next: null,
        });
      if (section.data === 'billingEvents') {
        const result = await client.rpc('privacy_export_billing', { actor, after_id: after });
        if (result.error) return json(503, { error: 'storage' });
        const rows = result.data as { event_id: string }[];
        return json(200, {
          section: section.data,
          rows: rows.slice(0, 100),
          next: rows.length > 100 ? rows[99]?.event_id : null,
        });
      }
      const [table, owner, key, columns] = sections[section.data];
      let query = client
        .from(table)
        .select(columns)
        .eq(owner, section.data === 'cancellations' ? (user.email?.toLowerCase() ?? '') : actor)
        .order(key)
        .limit(101);
      if (after) query = query.gt(key, after);
      const result = await query;
      if (result.error) return json(503, { error: 'storage' });
      const data: Record<string, unknown>[] = result.data as unknown as Record<string, unknown>[];
      const rows: Record<string, unknown>[] = [];
      let size = 0;
      for (const row of data.slice(0, 100)) {
        const sanitized = { ...row };
        Reflect.deleteProperty(sanitized, 'tutor_conversations');
        size += JSON.stringify(sanitized).length;
        if (size > 524288 && rows.length) break;
        rows.push(sanitized);
      }
      return json(200, {
        section: section.data,
        rows,
        next: data.length > rows.length ? String(rows.at(-1)?.[key]) : null,
      });
    }
    if (request.method === 'POST' && view === 'consent') {
      let parsed;
      try {
        parsed = consentEventSchema.safeParse(JSON.parse(await billingBody(request, 4096)));
      } catch {
        return json(400, { error: 'schema' });
      }
      if (!parsed.success) return json(400, { error: 'schema' });
      const result = await client.rpc('set_privacy_consent', { actor, entry: parsed.data });
      if (result.error)
        return json(result.error.message === 'Purpose unavailable' ? 422 : 409, {
          error: 'consent',
        });
      return json(200, { choices: consentChoicesSchema.parse(result.data) });
    }
    if (request.method === 'DELETE' && view === 'account') {
      let input;
      try {
        input = privacyDeleteSchema.safeParse(JSON.parse(await billingBody(request, 4096)));
      } catch {
        return json(400, { error: 'schema' });
      }
      if (!input.success) return json(400, { error: 'schema' });
      if (!recentlyAuthenticated(bearer.slice(7), user.last_sign_in_at))
        return json(403, { error: 'reauth' });
      await revokeAppleGrant(user, client, (key) => Deno.env.get(key));
      const prepared = await client.rpc('prepare_privacy_erasure', {
        actor,
        request_id: input.data.id,
      });
      if (prepared.error) return json(409, { error: 'conflict' });
      const deleted = await client.auth.admin.deleteUser(actor);
      if (deleted.error) return json(503, { error: 'deletion' });
      const finished = await client.rpc('finish_privacy_erasure', { request_id: input.data.id });
      if (finished.error) return json(503, { error: 'storage' });
      return json(200, privacyReceiptSchema.parse(finished.data));
    }
    return json(405, { error: 'method' });
  } catch {
    return json(503, { error: 'unavailable' });
  }
});
