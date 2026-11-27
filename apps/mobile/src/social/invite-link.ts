export function configuredInviteOrigin(): string | undefined {
  const configured = process.env.EXPO_PUBLIC_INVITE_LINK_ORIGIN;
  if (!configured) return undefined;
  const url = new URL(configured);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error('EXPO_PUBLIC_INVITE_LINK_ORIGIN must be an HTTPS origin');
  return url.origin;
}

export function inviteLink(kind: 'friends' | 'duel', token: string, webOrigin?: string) {
  const origin = configuredInviteOrigin();
  const query = '?invite=' + encodeURIComponent(token);
  if (origin) return origin + '/friends' + query + (kind === 'duel' ? '&kind=duel' : '');
  return webOrigin ? webOrigin + '/' + kind + query : 'harmonia://' + kind + query;
}
