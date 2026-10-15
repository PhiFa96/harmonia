import { configuredAuth } from './config.ts';
import type { StoredAccountSettings } from '@harmonia/content';
export function profileTransport(actor: string, token: string) {
  const config = configuredAuth();
  if (!config) throw new Error('Profile unavailable');
  const request = async (path: string, body?: unknown) => {
    const response = await fetch(config.url + '/rest/v1/' + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        apikey: config.key,
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('Profile request failed');
    const value: unknown = await response.json();
    if (!value || typeof value !== 'object' || !('id' in value) || value.id !== actor)
      throw new Error('Profile owner mismatch');
    return value;
  };
  return {
    load: async () => {
      // Singular PostgREST responses preserve the owner check without trusting client filters alone.
      const response = await fetch(
        config.url +
          '/rest/v1/profiles?id=eq.' +
          encodeURIComponent(actor) +
          '&select=id,settings,settings_revision,display_name',
        {
          headers: {
            apikey: config.key,
            Authorization: 'Bearer ' + token,
            Accept: 'application/vnd.pgrst.object+json',
          },
          signal: AbortSignal.timeout(15000),
        },
      );
      if (!response.ok) throw new Error('Profile unavailable');
      const value: unknown = await response.json();
      if (!value || typeof value !== 'object' || !('id' in value) || value.id !== actor)
        throw new Error('Profile owner mismatch');
      return value;
    },
    save: (patch: StoredAccountSettings['dirty'], initialize = false) =>
      request('rpc/save_profile_settings', { patch, initialize }),
  };
}
