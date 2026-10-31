import { registerDevice } from '../supabase/functions/_shared/motivation.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { dispatchReminders } from '../supabase/functions/_shared/reminder-job.ts';
import { lessonDay } from '../packages/content/src/calendar.ts';
import { lateBerlinReminderInstant } from './reminder-smoke-clock.ts';
import type { PushMessage } from '../supabase/functions/_shared/push.ts';
const url = Deno.env.get('HARMONIA_TEST_LOCAL_URL') ?? '';
if (new URL(url).hostname !== '127.0.0.1') throw new Error('Nur lokale API erlaubt');
const client = createClient(url, Deno.env.get('HARMONIA_TEST_LOCAL_KEY') ?? '', {
  auth: { persistSession: false, autoRefreshToken: false },
});
const users: string[] = [],
  messages: PushMessage[] = [];
const now = lateBerlinReminderInstant(Date.now());
let checks = 0;
function check(value: boolean, label: string) {
  if (!value) throw new Error(label);
  checks++;
}
const prefs = {
  dailyGoal: 20,
  reminderConsent: true,
  reminderTime: '18:00',
  locale: 'de',
  timeZone: 'UTC',
};
async function account(consent = true, practice = 0) {
  const result = await client.auth.admin.createUser({
    email: `reminders-${crypto.randomUUID()}@example.invalid`,
    password: crypto.randomUUID(),
    email_confirm: true,
  });
  if (result.error) throw new Error('Testkonto fehlt');
  const id = result.data.user.id;
  users.push(id);
  const choices = await client.rpc('set_privacy_consent', {
    actor: id,
    entry: {
      id: crypto.randomUUID(),
      purpose: 'push',
      granted: consent,
      version: 'privacy-v1',
      locale: 'de',
    },
  });
  if (choices.error) throw new Error('Fixture consent failed');
  const saved = await client.rpc('save_motivation_preferences', {
    actor: id,
    prefs: { ...prefs, reminderConsent: consent },
    practice,
    reminded: 0,
  });
  if (saved.error) throw new Error('Testwünsche fehlen');
  return id;
}
async function device(actor: string, token: string, zone = 'Europe/Berlin') {
  const id = crypto.randomUUID(),
    registered = await client.rpc('register_reminder_device', {
      actor,
      device: id,
      secret_hash: 'test-installation',
      new_revision: 1,
      token,
    });
  if (registered.error) throw new Error('Testgerät fehlt');
  const located = await client
    .from('reminder_devices')
    .update({ time_zone: zone, locale: 'de' })
    .eq('device_id', id);
  if (located.error) throw new Error('Zeitzone fehlt');
  return id;
}
async function token(id: string) {
  const row = await client
    .from('reminder_devices')
    .select('push_token')
    .eq('device_id', id)
    .single();
  if (row.error) throw new Error('Tokenabfrage fehlt');
  return row.data.push_token as string | null;
}
try {
  const active = await account(),
    older = await device(active, 'ExpoPushToken[older]'),
    latest = await device(active, 'ExpoPushToken[latest]');
  await client
    .from('reminder_devices')
    .update({ seen_at: new Date(now - 60000).toISOString() })
    .eq('device_id', older);
  await client
    .from('reminder_devices')
    .update({ seen_at: new Date(now).toISOString() })
    .eq('device_id', latest);
  await device(await account(false), 'ExpoPushToken[off]');
  const practiced = await account(true, now - 60000),
    practicedDevice = await device(practiced, 'ExpoPushToken[practiced]');
  const expiredOwner = await account(),
    expired = await device(expiredOwner, 'ExpoPushToken[expired]');
  await client
    .from('reminder_devices')
    .update({ lease_until: new Date(now - 86400000).toISOString() })
    .eq('device_id', expired);
  await device(await account(), 'ExpoPushToken[west]', 'America/Los_Angeles');
  const invalidOwner = await account(),
    invalid = await device(invalidOwner, 'ExpoPushToken[invalid]');
  const rotatedOwner = await account(),
    rotated = await device(rotatedOwner, 'ExpoPushToken[rotated]');
  const receiptOwner = await account(),
    receiptDevice = await device(receiptOwner, 'ExpoPushToken[receipt]');
  for (const [actor, id, pushToken, ticket] of [
    [rotatedOwner, rotated, 'ExpoPushToken[old]', 'old-receipt'],
    [receiptOwner, receiptDevice, 'ExpoPushToken[receipt]', 'bad-receipt'],
  ] as const) {
    const inserted = await client.from('reminder_deliveries').insert({
      user_id: actor,
      local_date: lessonDay(now - 86400000, 'Europe/Berlin'),
      device_id: id,
      push_token: pushToken,
      ticket_id: ticket,
      status: 'sent',
      attempted_at: new Date(now - 20 * 60000).toISOString(),
    });
    if (inserted.error) throw new Error('Testticket fehlt');
  }
  const transport = {
    send: (message: PushMessage) => {
      messages.push(message);
      return Promise.resolve(
        message.to === 'ExpoPushToken[invalid]'
          ? { ticket: null, unregistered: true }
          : { ticket: `ticket-${String(messages.length)}`, unregistered: false },
      );
    },
    receipts: (ids: string[]) =>
      Promise.resolve(
        ids
          .filter((id) => ['old-receipt', 'bad-receipt'].includes(id))
          .map((id) => ({ id, delivered: false, unregistered: true })),
      ),
  };
  await Promise.all([
    dispatchReminders(client, now, transport, users),
    dispatchReminders(client, now, transport, users),
  ]);
  check(messages.length === 2, 'Parallele Jobs senden nur einen Versuch je aktivem Konto');
  check(
    messages.filter((m) => m.to === 'ExpoPushToken[latest]').length === 1,
    'Nur jüngstes gültiges Kontogerät',
  );
  check(
    messages.every((m) => m.ttl === 30),
    'Ruhezeit beendet verspätete Zustellung',
  );
  check(
    messages.find((m) => m.to === 'ExpoPushToken[latest]')?.data['scope'] === active,
    'Nachricht gehört zum richtigen Konto',
  );
  check(
    messages.some(
      (m) => m.body === 'Eine kleine Übung passt in deinen Tag. Harmonia wartet auf dich.',
    ),
    'Deutscher Nachrichtentext',
  );
  check(
    !messages.some((m) =>
      [
        'ExpoPushToken[off]',
        'ExpoPushToken[practiced]',
        'ExpoPushToken[expired]',
        'ExpoPushToken[west]',
        'ExpoPushToken[receipt]',
      ].includes(m.to),
    ),
    'Opt-out, heutiges Üben, Lease, Ortszeit und Receipt unterdrücken Versand',
  );
  check((await token(invalid)) === null, 'Sofort ungültiges Token entfernt');
  check((await token(receiptDevice)) === null, 'Verspätet ungültiges Token entfernt');
  check(
    (await token(rotated)) === 'ExpoPushToken[rotated]',
    'Altes Receipt löscht kein neues Token',
  );
  await client.rpc('register_reminder_device', {
    actor: invalidOwner,
    device: invalid,
    secret_hash: 'test-installation',
    new_revision: 2,
    token: 'ExpoPushToken[invalid]',
  });
  check((await token(invalid)) === null, 'Sync reaktiviert kein dauerhaft ungültiges Token');
  await client.rpc('register_reminder_device', {
    actor: invalidOwner,
    device: invalid,
    secret_hash: 'test-installation',
    new_revision: 3,
    token: 'ExpoPushToken[replaced]',
  });
  check(
    (await token(invalid)) === 'ExpoPushToken[replaced]',
    'SDK-Rotation darf neues Token registrieren',
  );
  const suppressed = await client.rpc('claim_reminder_delivery', {
    actor: practiced,
    device: practicedDevice,
    day: lessonDay(now, 'Europe/Berlin'),
  });
  check(suppressed.data === false, 'Atomic Claim prüft heutiges Üben nochmals');
  await client.rpc('save_motivation_preferences', {
    actor: active,
    prefs: { ...prefs, reminderConsent: false },
    practice: 0,
    reminded: 0,
  });
  await dispatchReminders(client, now, transport, users);
  check(messages.length === 2, 'Kein zweiter Versuch nach Widerruf oder Fehler');
  const duplicate = crypto.randomUUID(),
    conflict = await registerDevice(client, {
      actor: active,
      device: duplicate,
      secret_hash: 'new-install',
      new_revision: 1,
      token: 'ExpoPushToken[latest]',
    });
  check(!conflict.error, 'Aktiver Tokenkonflikt verhindert keine Kontosynchronisation');
  check(
    (await token(duplicate)) === null && (await token(latest)) === 'ExpoPushToken[latest]',
    'Vorhandene Lease erhalten, neuer Installationsfallback ohne Remote-Token',
  );
  const renewed = crypto.randomUUID(),
    renewal = await registerDevice(client, {
      actor: expiredOwner,
      device: renewed,
      secret_hash: 'new-install',
      new_revision: 1,
      token: 'ExpoPushToken[expired]',
    });
  check(!renewal.error, 'Abgelaufene Tokenlease kann übernommen werden');
  check(
    (await token(renewed)) === 'ExpoPushToken[expired]' && (await token(expired)) === null,
    'Abgelaufene eindeutige Bindung wird freigegeben',
  );
  console.log(
    `${String(checks)} lokale Push-Job-Prüfungen mit echter Datenbank bestanden; Versand ersetzt.`,
  );
} finally {
  for (const user of users) {
    const result = await client.auth.admin.deleteUser(user);
    check(!result.error, 'Testkonto entfernt');
  }
}
