import { z } from 'zod';
import {
  motivationPreferencesSchema,
  motivationSummary,
  reminderDue,
  reminderTTL,
  lessonDay,
} from '../../../packages/content/src/index.ts';
import { leagueResultMessage, reminderMessages } from '../../../packages/i18n/src/index.ts';
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
  const devices = await client.rpc('reminder_candidates', {
    at_time: new Date(now).toISOString(),
    batch_size: 1000,
    actors: actors ?? null,
  });
  if (devices.error) throw new Error('Storage unavailable');
  const deviceRows = z
    .object({
      device_id: z.uuid(),
      user_id: z.uuid(),
      push_token: z.string(),
      seen_at: z.string(),
      time_zone: z.string(),
      locale: z.enum(['de', 'en-US', 'en-GB']),
    })
    .array()
    .max(1000)
    .parse(devices.data);
  const visited = new Set<string>();
  let sent = 0,
    skipped = 0,
    failed = 0;
  for (const device of deviceRows) {
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
    // Result pushes use a separate opt-in and the SAME atomic daily budget.
    // Every candidate is revalidated under the account lock immediately before send.
    const resultQuery = await client
      .from('league_members')
      .select('week_start')
      .eq('user_id', device.user_id)
      .not('final_rank', 'is', null)
      .is('seen_at', null)
      .is('push_attempted_at', null)
      .gte('week_start', new Date(now - 14 * 86400000).toISOString().slice(0, 10))
      .order('week_start', { ascending: false })
      .limit(1);
    if (resultQuery.error) {
      failed++;
      continue;
    }
    const resultWeek = resultQuery.data[0]?.week_start as string | undefined;
    if (resultWeek) {
      const day = lessonDay(now, device.time_zone);
      const claim = await client.rpc('claim_league_delivery', {
        actor: device.user_id,
        day,
        device: device.device_id,
        week: resultWeek,
        at_time: new Date(now).toISOString(),
      });
      if (claim.error) {
        failed++;
        continue;
      }
      if (claim.data === true) {
        const message = leagueResultMessage(device.locale);
        try {
          const pushed = await transport.send({
            to: device.push_token,
            ...message,
            data: { harmoniaReminder: 'true', category: 'league', scope: device.user_id },
            ttl: reminderTTL(now, device.time_zone),
            sound: 'default',
          });
          const saved = await client
            .from('reminder_deliveries')
            .update({
              status: pushed.ticket ? 'sent' : 'failed',
              ticket_id: pushed.ticket,
              push_token: device.push_token,
            })
            .eq('user_id', device.user_id)
            .eq('local_date', day);
          if (saved.error) throw new Error('Ticket not saved');
          if (pushed.unregistered)
            await client
              .from('reminder_devices')
              .update({ push_token: null, invalid_token: device.push_token })
              .eq('device_id', device.device_id)
              .eq('user_id', device.user_id)
              .eq('push_token', device.push_token);
          if (pushed.ticket) sent++;
          else failed++;
        } catch {
          await client
            .from('reminder_deliveries')
            .update({ status: 'failed' })
            .eq('user_id', device.user_id)
            .eq('local_date', day);
          failed++;
        }
        continue;
      }
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
