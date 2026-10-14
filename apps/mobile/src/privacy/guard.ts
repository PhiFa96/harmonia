const erasedScopes = new Set<string>(),
  erasedIds = new Set<string>();
export function blockErasedScope(scope: string, ids: readonly string[]) {
  erasedScopes.add(scope);
  for (const id of ids) erasedIds.add(id);
}
export function assertPrivacyWrite(scope: string, id?: string) {
  if (erasedScopes.has(scope) || (id && erasedIds.has(id))) throw new Error('Erased private data');
}
