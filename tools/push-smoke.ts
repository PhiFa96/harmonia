import { sendReminder, pushReceipts } from '../supabase/functions/_shared/push.ts';
import type { PushMessage } from '../supabase/functions/_shared/push.ts';
const message: PushMessage = {
  to: 'ExpoPushToken[test]',
  title: 'Test',
  body: 'Test',
  data: { harmoniaReminder: 'true' },
  ttl: 30,
  sound: 'default',
};
let checks = 0;
function check(condition: boolean, label: string) {
  if (!condition) throw new Error(label);
  checks++;
}
function fake(body: unknown, status = 200): typeof fetch {
  return () => Promise.resolve(new Response(JSON.stringify(body), { status }));
}
async function rejects(run: () => Promise<unknown>, label: string) {
  let rejected = false;
  try {
    await run();
  } catch {
    rejected = true;
  }
  check(rejected, label);
}
check(
  (await sendReminder(message, fake({ data: { status: 'ok', id: 'ticket' } }))).ticket === 'ticket',
  'Ticket',
);
check(
  (
    await sendReminder(
      message,
      fake({ data: { status: 'error', details: { error: 'DeviceNotRegistered' } } }),
    )
  ).unregistered,
  'Ungültiges Token',
);
check(
  !(
    await sendReminder(
      message,
      fake({ data: { status: 'error', details: { error: 'MessageRateExceeded' } } }),
    )
  ).unregistered,
  'Temporärer Fehler löscht kein Token',
);
await rejects(() => sendReminder(message, fake({}, 500)), 'HTTP-Fehler');
await rejects(() => sendReminder(message, fake({ data: [] })), 'Array-Ticket');
await rejects(() => sendReminder(message, fake({ data: null })), 'Fehlendes Ticket');
const receipts = await pushReceipts(
  ['ok', 'bad', 'later', 'missing'],
  fake({
    data: {
      ok: { status: 'ok' },
      bad: { status: 'error', details: { error: 'DeviceNotRegistered' } },
      later: { status: 'error', details: { error: 'MessageTooBig' } },
      extraneous: { status: 'ok' },
    },
  }),
);
check(receipts.length === 3, 'Nur angeforderte, tatsächlich vorhandene Receipts');
check(receipts[0]?.delivered === true, 'Receipt bestätigt Transport zum Push-Dienst');
check(receipts[1]?.unregistered === true, 'Verspätetes ungültiges Token');
check(receipts[2]?.unregistered === false, 'Anderer Receipt-Fehler');
await rejects(
  () => pushReceipts(['bad'], fake({ data: { bad: { status: 'unknown' } } })),
  'Falscher Status',
);
await rejects(() => pushReceipts([], fake({}, 503)), 'Receipt HTTP-Fehler');
await rejects(() => pushReceipts([], fake({ data: [] })), 'Receipt Array');
await sendReminder(message, (_url, options) => {
  check(options?.signal instanceof AbortSignal, 'Transport-Timeout');
  const payload: unknown = JSON.parse(typeof options?.body === 'string' ? options.body : '{}');
  check(
    !!payload && typeof payload === 'object' && 'ttl' in payload && payload.ttl === 30,
    'Ruhezeit-TTL im Request',
  );
  return Promise.resolve(new Response(JSON.stringify({ data: { status: 'ok', id: 'bounded' } })));
});
console.log(`${String(checks)} Push-Transportprüfungen bestanden; kein externer Versand.`);
