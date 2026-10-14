/** Gemeinsamer SHA-256 für Node/Deno, ohne SDK-/Secret-Abhängigkeit. */
export const hash = async (key: string) =>
  Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
