import { oauthCode, oauthWebOrigin } from '@/auth/oauth-model';
const id = '00000000-0000-4000-8000-000000000001',
  now = 1000000;
const attempt = {
  id,
  expiresAt: now + 600000,
  redirect: 'https://music.example.org/auth/callback?attempt=' + id,
};
describe('OAuth correlation and PKCE callback', () => {
  it('accepts exactly the expected HTTPS or native callback with one code', () => {
    expect(oauthCode(attempt.redirect + '&code=own-code', attempt, now)).toBe('own-code');
    const native = { ...attempt, redirect: 'harmonia://auth/callback?attempt=' + id };
    expect(oauthCode(native.redirect + '&code=own-code', native, now)).toBe('own-code');
  });
  it.each([
    'https://other.example.org/auth/callback?attempt=' + id + '&code=own',
    attempt.redirect + '&code=own&code=other',
    attempt.redirect + '&code=own#access_token=private',
    attempt.redirect + '&code=own&next=https://other.example.org',
    attempt.redirect + '&error=denied&code=own',
    attempt.redirect.replace(id, '00000000-0000-4000-8000-000000000002') + '&code=own',
  ])('rejects uncorrelated or unsafe callbacks %s', (input) => {
    expect(() => oauthCode(input, attempt, now)).toThrow();
  });
  it('rejects expired attempts and unsafe configured origins', () => {
    expect(() => oauthCode(attempt.redirect + '&code=own', attempt, attempt.expiresAt)).toThrow();
    for (const origin of [
      'http://music.example.org',
      'https://name:private@music.example.org',
      'https://music.example.org/path',
      'https://music.example.org/?token=private',
    ])
      expect(() => oauthWebOrigin(origin)).toThrow();
    expect(oauthWebOrigin('https://music.example.org/')).toBe('https://music.example.org');
    expect(oauthWebOrigin(undefined)).toBeNull();
  });
});
