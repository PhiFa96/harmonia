import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { dispatchReminders } from '../supabase/functions/_shared/reminder-job.ts';
import type { PushMessage } from '../supabase/functions/_shared/push.ts';
const url = Deno.env.get('HARMONIA_TEST_LOCAL_URL') ?? '';
if (new URL(url).hostname !== '127.0.0.1') throw new Error('Local only');
const client = createClient(url, Deno.env.get('HARMONIA_TEST_LOCAL_KEY') ?? '', {
  auth: { persistSession: false, autoRefreshToken: false },
});
const users: string[] = [],
  messages: PushMessage[] = [];
const current = new Date();
current.setUTCHours(18, 30, 0, 0);
const now = current.getTime();
const monday = new Date(now);
monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
monday.setUTCHours(0, 0, 0, 0);
const week = new Date(monday.getTime() - 7 * 86400000).toISOString().slice(0, 10);
const day = current.toISOString().slice(0, 10),
  cohort = crypto.randomUUID();
let checks = 0;
function check(ok: boolean, label: string) {
  if (!ok) throw new Error(label);
  checks++;
}
async function account(index: number) {
  const created = await client.auth.admin.createUser({
    email: 'league-push-' + crypto.randomUUID() + '@example.invalid',
    password: crypto.randomUUID(),
    email_confirm: true,
  });
  if (created.error) throw new Error('Test account unavailable');
  const actor = created.data.user.id;
  users.push(actor);
  const consent = await client.rpc('set_privacy_consent', {
    actor,
    entry: {
      id: crypto.randomUUID(),
      purpose: 'push',
      granted: index !== 3,
      version: 'privacy-v1',
      locale: 'de',
    },
  });
  check(!consent.error, 'Local privacy consent');
  const prefs = await client.rpc('save_motivation_preferences', {
    actor,
    prefs: {
      dailyGoal: 20,
      reminderConsent: index === 6,
      reminderTime: '18:00',
      timeZone: 'UTC',
      locale: index === 6 ? 'en-GB' : 'de',
    },
    practice: now - 1000,
    reminded: index === 8 ? now - 1800000 : 0,
  });
  check(!prefs.error, 'Local motivation preferences');
  const league = await client
    .from('league_accounts')
    .insert({ user_id: actor, tier: 3, push_consent: index !== 1 });
  check(!league.error, 'Separate result opt-in');
  const device = crypto.randomUUID();
  check(
    !(
      await client.rpc('register_reminder_device', {
        actor,
        device,
        secret_hash: 'local-test',
        new_revision: 1,
        token: 'ExpoPushToken[league-' + String(index) + ']',
      })
    ).error,
    'Own test device',
  );
  await client
    .from('reminder_devices')
    .update({ time_zone: index === 5 ? 'Asia/Tokyo' : 'UTC', locale: index === 6 ? 'en-GB' : 'de' })
    .eq('device_id', device);
  return { actor, device };
}
try {
  const accounts = [];
  for (let i = 0; i < 9; i++) accounts.push(await account(i));
  check(
    !(
      await client
        .from('league_cohorts')
        .insert({ id: cohort, week_start: week, tier: 3, capacity: 30, movement: 5 })
    ).error,
    'Dedicated past cohort',
  );
  check(
    !(
      await client.from('league_members').insert(
        accounts.map((a, i) => ({
          user_id: a.actor,
          week_start: week,
          cohort_id: cohort,
          slot: i + 1,
          xp: 100 - i,
          joined_at: week + 'T12:00:00Z',
        })),
      )
    ).error,
    'Own result fixtures',
  );
  check(
    !(await client.rpc('finalize_league', { cohort, at_time: current.toISOString() })).error,
    'Finalize only own fixture cohort',
  );
  await client
    .from('league_members')
    .update({ seen_at: current.toISOString() })
    .eq('user_id', accounts[2]?.actor);
  await client.from('reminder_deliveries').insert({
    user_id: accounts[4]?.actor,
    local_date: day,
    device_id: accounts[4]?.device,
    status: 'delivered',
    category: 'learning',
    attempted_at: new Date(now - 3600000).toISOString(),
  });
  const transport = {
    send: (message: PushMessage) => {
      messages.push(message);
      if (message.to === 'ExpoPushToken[league-7]') throw new Error('Fake transport failure');
      return Promise.resolve({
        ticket: 'league-ticket-' + String(messages.length),
        unregistered: false,
      });
    },
    receipts: () => Promise.resolve([]),
  };
  await Promise.all([
    dispatchReminders(client, now, transport, users),
    dispatchReminders(client, now, transport, users),
  ]);
  check(messages.length === 3, 'Parallel jobs attempt each eligible result exactly once');
  check(
    messages.every((m) => m.data['category'] === 'league'),
    'Results take priority over learning reminders',
  );
  check(
    messages.every((m) => m.ttl === 1800),
    'Result push expires within thirty minutes',
  );
  check(
    messages.some((m) => m.title === 'Dein Liga-Ergebnis'),
    'German result copy',
  );
  check(
    messages.some((m) => m.title === 'Your league result'),
    'British English result copy',
  );
  check(
    messages.every((m) => !m.body.includes('XP') && !m.body.includes('Platz')),
    'Lock-screen text omits private results',
  );
  check(
    !messages.some((m) => /league-[123458]\]/.test(m.to)),
    'Category opt-out, read marker, global opt-out, daily cap, quiet hours and local fallback suppress push',
  );
  await dispatchReminders(client, now, transport, users);
  check(messages.length === 3, 'Same-day retry cannot send again after success or failure');
  const rows = await client
    .from('reminder_deliveries')
    .select('status,category')
    .in('user_id', users);
  check(
    rows.data?.filter((r) => r.category === 'league').length === 3,
    'Shared durable delivery ledger',
  );
  check(
    rows.data?.some((r) => r.category === 'league' && r.status === 'failed') === true,
    'Failure consumes one delivery attempt',
  );
  const first = accounts[0];
  if (!first) throw new Error('Fixture');
  await client.from('league_accounts').update({ push_consent: false }).eq('user_id', first.actor);
  await client
    .from('league_members')
    .update({ push_attempted_at: null })
    .eq('user_id', first.actor);
  await client.from('reminder_deliveries').delete().eq('user_id', first.actor);
  const revoked = await client.rpc('claim_league_delivery', {
    actor: first.actor,
    day,
    device: first.device,
    week,
    at_time: current.toISOString(),
  });
  check(revoked.data === false, 'Atomic claim rechecks category withdrawal');
  await client.from('league_accounts').update({ push_consent: true }).eq('user_id', first.actor);
  const next = new Date(now + 86400000);
  const wrongDay = await client.rpc('claim_league_delivery', {
    actor: first.actor,
    day,
    device: first.device,
    week,
    at_time: next.toISOString(),
  });
  check(wrongDay.data === false, 'A stale local day cannot bypass the budget');
  const withdrawal = await client.rpc('set_privacy_consent', {
    actor: first.actor,
    entry: {
      id: crypto.randomUUID(),
      purpose: 'push',
      granted: false,
      version: 'privacy-v1',
      locale: 'de',
    },
  });
  check(!withdrawal.error, 'Global withdrawal saved');
  const withdrawn = await client
    .from('league_accounts')
    .select('push_consent')
    .eq('user_id', first.actor)
    .single();
  check(withdrawn.data?.push_consent === false, 'Global withdrawal clears the league category');
  const retired = await client
    .from('reminder_devices')
    .select('push_token')
    .eq('device_id', first.device)
    .single();
  check(
    retired.data?.push_token === null,
    'Global withdrawal retires the registered delivery token',
  );
  console.log(`${String(checks)} local league notification checks passed; transport replaced.`);
} finally {
  for (const actor of users)
    check(!(await client.auth.admin.deleteUser(actor)).error, 'Own account removed');
  await client.from('league_cohorts').delete().eq('id', cohort);
}
