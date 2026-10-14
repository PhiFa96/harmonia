import { legalUrl, legalReady } from '@/legal/config';
it('requires complete legal bindings and public HTTPS without credentials', () => {
  expect(legalReady()).toBe(false);
  expect(legalUrl(undefined)).toBeNull();
  expect(legalUrl('https://example.invalid/terms')).toBe('https://example.invalid/terms');
  for (const url of [
    'http://example.invalid',
    'https://user:password@example.invalid',
    'javascript:alert(1)',
    'https://localhost/legal',
  ])
    expect(() => legalUrl(url)).toThrow();
});
