export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, string>;
  ttl: number;
  sound: 'default';
}
/** Tickets und dauerhafte Fehler explizit prüfen; ein HTTP 200 allein bestätigt keine Annahme. */
export async function sendReminder(message: PushMessage, fetcher: typeof fetch = fetch) {
  const token = Deno.env.get('EXPO_ACCESS_TOKEN');
  const response = await fetcher('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(message),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Push transport failed');
  const body: unknown = await response.json();
  if (
    !body ||
    typeof body !== 'object' ||
    !('data' in body) ||
    !body.data ||
    typeof body.data !== 'object' ||
    Array.isArray(body.data)
  )
    throw new Error('Push ticket missing');
  if (
    'status' in body.data &&
    body.data.status === 'ok' &&
    'id' in body.data &&
    typeof body.data.id === 'string'
  )
    return { ticket: body.data.id, unregistered: false };
  return {
    ticket: null,
    unregistered:
      'details' in body.data &&
      !!body.data.details &&
      typeof body.data.details === 'object' &&
      'error' in body.data.details &&
      body.data.details.error === 'DeviceNotRegistered',
  };
}
export async function pushReceipts(ids: string[], fetcher: typeof fetch = fetch) {
  const token = Deno.env.get('EXPO_ACCESS_TOKEN');
  const response = await fetcher('https://exp.host/--/api/v2/push/getReceipts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ ids }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Receipt transport failed');
  const body: unknown = await response.json();
  if (
    !body ||
    typeof body !== 'object' ||
    !('data' in body) ||
    !body.data ||
    typeof body.data !== 'object' ||
    Array.isArray(body.data)
  )
    throw new Error('Receipts missing');
  const output: { id: string; delivered: boolean; unregistered: boolean }[] = [];
  for (const id of ids) {
    const receipt: unknown = Object.getOwnPropertyDescriptor(body.data, id)?.value;
    if (!receipt || typeof receipt !== 'object' || !('status' in receipt)) continue;
    if (receipt.status !== 'ok' && receipt.status !== 'error')
      throw new Error('Receipt status invalid');
    output.push({
      id,
      delivered: receipt.status === 'ok',
      unregistered:
        'details' in receipt &&
        !!receipt.details &&
        typeof receipt.details === 'object' &&
        'error' in receipt.details &&
        receipt.details.error === 'DeviceNotRegistered',
    });
  }
  return output;
}
