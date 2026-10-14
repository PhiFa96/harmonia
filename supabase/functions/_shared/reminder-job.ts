import {
  motivationPreferencesSchema,
  motivationSummary,
  reminderDue,
  reminderTTL,
} from '../../../packages/content/src/index.ts';
import { reminderMessages } from '../../../packages/i18n/src/index.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.117.3';
import { history } from './motivation.ts';
import { sendReminder, pushReceipts } from './push.ts';
export async function dispatchReminders(
  client: SupabaseClient,
  now: number,
  transport = { send: sendReminder, receipts: pushReceipts },
  actors?: readonly string[],
) {
  if (actors?.length === 0) return { sent: 0, skipped: 0, failed: 0 };
  const ticketQuery = client
    .from('reminder_deliveries')
    .select('user_id,local_date,device_id,push_token,ticket_id')
    .eq('status', 'sent')
    .is('receipt_checked_at', null)
    .lt('attempted_at', new Date(now - 15 * 60000).toISOString())
    .gt('attempted_at', new Date(now - 24 * 3600000).toISOString())
    .limit(1000);
  const tickets = await (actors ? ticketQuery.in('user_id', actors) : ticketQuery).overrideTypes<
    {
      user_id: string;
      local_date: string;
      device_id: string | null;
      push_token: string | null;
      ticket_id: string;
    }[],
    { merge: false }
  >();
  if (tickets.error) throw new Error('Storage unavailable');
  if (tickets.data.length) {
    const receipts = await transport.receipts(tickets.data.map((t) => t.ticket_id));
    for (const receipt of receipts) {
      const ticket = tickets.data.find((t) => t.ticket_id === receipt.id);
      if (!ticket) continue;
      await client
        .from('reminder_deliveries')
        .update({
          status: receipt.delivered ? 'delivered' : 'failed',
          receipt_checked_at: new Date(now).toISOString(),
        })
        .eq('user_id', ticket.user_id)
        .eq('local_date', ticket.local_date);
      if (receipt.unregistered)
        await client
          .from('reminder_devices')
          .update({ push_token: null, invalid_token: ticket.push_token })
          .eq('device_id', ticket.device_id)
          .eq('user_id', ticket.user_id)
          .eq('push_token', ticket.push_token);
    }
  }
  const deviceQuery = client
    .from('reminder_devices')
    .select('device_id,user_id,push_token,seen_at,time_zone,locale')
    .not('push_token', 'is', null)
    .gt('lease_until', new Date(now).toISOString())
    .order('seen_at', { ascending: false })
    .limit(1000);
  const devices = await (actors ? deviceQuery.in('user_id', actors) : deviceQuery).overrideTypes<
    {
      device_id: string;
      user_id: string;
      push_token: string;
      seen_at: string;
      time_zone: string;
      locale: string;
    }[],
    { merge: false }
  >();
  if (devices.error) throw new Error('Storage unavailable');
  const visited = new Set<string>();
  let sent = 0,
    skipped = 0,
    failed = 0;
  for (const device of devices.data) {
    if (visited.has(device.user_id)) continue;
    visited.add(device.user_id);
    const consent = await client.rpc('privacy_choices', { actor: device.user_id });
    if (consent.error) {
      failed++;
      continue;
    }
    if ((consent.data as { push?: unknown }).push !== true) {
      skipped++;
      continue;
    }
    const profile = await client
      .from('motivation_preferences')
      .select('preferences,practiced_at,reminded_at')
      .eq('user_id', device.user_id)
      .maybeSingle();
    if (profile.error || !profile.data) {
      failed++;
      continue;
    }
    const prefs = motivationPreferencesSchema.parse({
        ...motivationPreferencesSchema.parse(profile.data.preferences),
        timeZone: device.time_zone,
        locale: device.locale,
      }),
      ledger = await history(client, device.user_id),
      summary = motivationSummary(
        ledger.activities,
        now,
        prefs.timeZone,
        Number(profile.data.practiced_at),
        ledger.purchases,
      );
    if (
      now - Number(profile.data.reminded_at) < 23 * 3600000 ||
      !reminderDue(now, prefs, summary.practiced)
    ) {
      skipped++;
      continue;
    }
    const claimed = await client.rpc('claim_reminder_delivery', {
      actor: device.user_id,
      day: summary.today,
      device: device.device_id,
    });
    if (claimed.error) {
      failed++;
      continue;
    }
    if (claimed.data !== true) {
      skipped++;
      continue;
    }
    try {
      const result = await transport.send({
        to: device.push_token,
        title: reminderMessages(prefs.locale).title,
        body: reminderMessages(prefs.locale).body,
        data: { harmoniaReminder: 'true', scope: device.user_id },
        ttl: reminderTTL(now, prefs.timeZone),
        sound: 'default',
      });
      const updated = await client
        .from('reminder_deliveries')
        .update({
          status: result.ticket ? 'sent' : 'failed',
          ticket_id: result.ticket,
          push_token: device.push_token,
        })
        .eq('user_id', device.user_id)
        .eq('local_date', summary.today);
      if (updated.error) throw new Error('Ticket not saved');
      if (result.unregistered)
        await client
          .from('reminder_devices')
          .update({ push_token: null, invalid_token: device.push_token })
          .eq('device_id', device.device_id)
          .eq('user_id', device.user_id)
          .eq('push_token', device.push_token);
      if (result.ticket) sent++;
      else failed++;
    } catch {
      await client
        .from('reminder_deliveries')
        .update({ status: 'failed' })
        .eq('user_id', device.user_id)
        .eq('local_date', summary.today);
      failed++;
    }
  }
  return { sent, skipped, failed };
}
