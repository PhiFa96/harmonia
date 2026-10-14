/** Eine JSONB-/Datei-Schlüsselreihenfolge ist kein Inhaltswechsel; Arrayreihenfolge ist relevant. */
export function canonical(value: unknown): string {
  if (
    ['undefined', 'symbol', 'function', 'bigint'].includes(typeof value) ||
    (typeof value === 'number' && !Number.isFinite(value))
  )
    throw Error('Kein JSON-Wert');
  if (value === null || typeof value !== 'object') {
    const serialized = JSON.stringify(value);
    return serialized;
  }
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  const record = value as Record<string, unknown>;
  return (
    '{' +
    Object.keys(record)
      .sort()
      .map((key) => JSON.stringify(key) + ':' + canonical(record[key]))
      .join(',') +
    '}'
  );
}
export async function fingerprint(value: unknown): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(value)));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
