import {
  motivationRequestSchema,
  motivationPreferencesSchema,
  motivationSummary,
  rewardRuleAt,
} from '../../../packages/content/src/index.ts';
import {
  backend,
  hash,
  history,
  rules,
  headers,
  json,
  registerDevice,
} from '../_shared/motivation.ts';
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!['GET', 'POST', 'DELETE'].includes(request.method)) return json(405, { error: 'method' });
  try {
    const client = backend(),
      rewardRules = await rules(client);
    if (request.method === 'GET') return json(200, { rules: rewardRules });
    const body = await request.text();
    if (body.length > 262144) return json(413, { error: 'size' });
    const parsed = motivationRequestSchema.safeParse(JSON.parse(body) as unknown);
    if (!parsed.success) return json(400, { error: 'schema' });
    const data = parsed.data,
      secretHash = await hash(data.deviceKey);
    if (request.method === 'DELETE') {
      const result = await client.rpc('retire_reminder_device', {
        device: data.deviceId,
        secret_hash: secretHash,
        new_revision: data.deviceRevision,
      });
      return result.error ? json(503, { error: 'storage' }) : json(200, { disabled: true });
    }
    const authorization = request.headers.get('authorization') ?? '';
    if (!authorization.startsWith('Bearer ') || authorization.length > 8192)
      return json(401, { error: 'auth' });
    const auth = await client.auth.getUser(authorization.slice(7));
    if (auth.error || auth.data.user.is_anonymous) return json(401, { error: 'auth' });
    const actor = auth.data.user.id,
      now = Date.now();
    const stored = await client
      .from('motivation_preferences')
      .select('preferences,practiced_at,reminded_at')
      .eq('user_id', actor)
      .maybeSingle();
    if (stored.error) return json(503, { error: 'storage' });
    let preferences = motivationPreferencesSchema.parse(
      (data.initializePreferences && stored.data ? stored.data.preferences : data.preferences) ??
        stored.data?.preferences ?? {
          dailyGoal: 20,
          reminderConsent: false,
          reminderTime: '18:00',
          locale: 'en-US',
          timeZone: 'UTC',
        },
    );
    if (data.practicedAt !== undefined && data.practicedAt > now + 300000)
      return json(422, { error: 'time' });
    let practicedAt = Math.max(Number(stored.data?.practiced_at ?? 0), data.practicedAt ?? 0);
    const pushAvailable = Deno.env.get('HARMONIA_PUSH_ENABLED') === 'true';
    const consent = await client.rpc('privacy_choices', { actor });
    if (consent.error) return json(503, { error: 'storage' });
    const pushConsent = (consent.data as { push?: unknown }).push === true;
    const device = await client
      .from('reminder_devices')
      .select('push_token,user_id')
      .eq('device_id', data.deviceId)
      .maybeSingle();
    if (device.error) return json(503, { error: 'storage' });
    const league = await client
      .from('league_accounts')
      .select('push_consent')
      .eq('user_id', actor)
      .maybeSingle();
    if (league.error) return json(503, { error: 'storage' });
    const token =
      pushAvailable &&
      pushConsent &&
      (preferences.reminderConsent || league.data?.push_consent === true)
        ? data.pushToken === undefined
          ? device.data?.user_id === actor
            ? (device.data.push_token as string | null)
            : null
          : data.pushToken
        : null;
    const registered = await registerDevice(client, {
      actor,
      device: data.deviceId,
      secret_hash: secretHash,
      new_revision: data.deviceRevision,
      token,
    });
    if (registered.error) return json(409, { error: 'device' });
    const saved = await client.rpc('save_motivation_preferences', {
      actor,
      prefs: data.preferences ?? null,
      initialize: data.initializePreferences ?? false,
      practice: practicedAt,
      reminded: Math.min(data.remindedAt ?? 0, now),
    });
    if (saved.error) return json(503, { error: 'storage' });
    preferences = motivationPreferencesSchema.parse(
      (saved.data as { preferences: unknown }).preferences,
    );
    practicedAt = Number((saved.data as { practiced_at: unknown }).practiced_at);
    const located = await client
      .from('reminder_devices')
      .update({ time_zone: preferences.timeZone, locale: preferences.locale })
      .eq('device_id', data.deviceId)
      .eq('user_id', actor)
      .eq('revision', data.deviceRevision);
    if (located.error) return json(503, { error: 'storage' });
    const actualDevice = await client
      .from('reminder_devices')
      .select('push_token')
      .eq('device_id', data.deviceId)
      .eq('user_id', actor)
      .maybeSingle();
    if (actualDevice.error) return json(503, { error: 'storage' });
    const active = await client
      .from('reminder_devices')
      .select('device_id')
      .eq('user_id', actor)
      .not('push_token', 'is', null)
      .gt('lease_until', new Date(now).toISOString())
      .limit(1);
    if (active.error) return json(503, { error: 'storage' });
    const accepted: string[] = [];
    for (const purchase of data.purchases ?? []) {
      const existing = await history(client, actor),
        old = existing.purchases.find((p) => p.id === purchase.id);
      if (old) {
        if (JSON.stringify(old) !== JSON.stringify(purchase))
          return json(409, { error: 'purchase' });
        accepted.push(purchase.id);
        continue;
      }
      if (purchase.at > now + 300000) return json(422, { error: 'time' });
      const rule = rewardRuleAt(rewardRules, purchase.at),
        before = motivationSummary(
          existing.activities,
          purchase.at,
          purchase.timeZone,
          practicedAt,
          existing.purchases,
        );
      if (rule.version !== purchase.ruleVersion || rule.freezePrice !== purchase.price)
        return json(422, { error: 'price', id: purchase.id, accepted });
      if (before.coins < purchase.price)
        return json(422, { error: 'balance', id: purchase.id, accepted });
      if (before.streak.freezesAvailable >= 2)
        return json(422, { error: 'stock', id: purchase.id, accepted });
      const appended = await client.rpc('append_freeze_purchase', {
        actor,
        entry: purchase,
        expected_revision: existing.revision,
      });
      if (appended.error) return json(409, { error: 'changed' });
      accepted.push(purchase.id);
    }
    const current = await history(client, actor),
      summary = motivationSummary(
        current.activities,
        now,
        preferences.timeZone,
        practicedAt,
        current.purchases,
      );
    const streak = await client.from('streaks').upsert({
      user_id: actor,
      current: summary.streak.current,
      longest: summary.streak.longest,
      last_active_date: summary.streak.lastActiveDate,
      freezes_available: summary.streak.freezesAvailable,
      calculated_at: new Date(now).toISOString(),
    });
    if (streak.error) return json(503, { error: 'storage' });
    return json(200, {
      ...(data.rushFormat === 1
        ? { rushActivities: current.activities.filter((a) => a.id.startsWith('rush:')) }
        : {}),
      preferences,
      rules: rewardRules,
      summary,
      pushAvailable,
      pushRegistered: actualDevice.data?.push_token != null,
      remoteReminders:
        pushConsent && preferences.reminderConsent && pushAvailable && active.data.length > 0,
      accepted,
      purchases: current.purchases,
    });
  } catch {
    return json(400, { error: 'request' });
  }
});
