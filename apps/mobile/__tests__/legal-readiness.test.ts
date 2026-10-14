import manifest from '../legal-readiness.json';
import { legalReleaseMissing } from '@/legal/readiness';
import { legalReady } from '@/legal/config';
it('keeps release blocked when operator or documentary evidence is missing', () => {
  const missing = legalReleaseMissing(manifest);
  expect(missing).toContain('operator.name');
  expect(missing).toContain('documents.privacyDe');
  expect(missing).toContain('approvals.retentionReview');
  const documents = Object.fromEntries(
    Object.keys(manifest.documents).map((key) => [
      key,
      { reviewed: true, reviewReference: 'fixture-review' },
    ]),
  );
  const approvals = Object.fromEntries(
    Object.keys(manifest.approvals).map((key) => [
      key,
      { approved: true, evidenceReference: 'fixture-evidence' },
    ]),
  );
  const complete = {
    operator: {
      name: 'Test operator',
      address: 'Test address',
      email: 'test@example.invalid',
      legalForm: 'Test only',
    },
    documents,
    approvals,
  };
  expect(legalReleaseMissing(complete)).toEqual([]);
  complete.documents['privacyDe'] = { reviewed: true, reviewReference: '' };
  expect(legalReleaseMissing(complete)).toContain('documents.privacyDe');
});
it('valid URLs alone cannot enable checkout without explicit release approval', () => {
  const variables = [
    'EXPO_PUBLIC_LEGAL_TERMS_DE',
    'EXPO_PUBLIC_LEGAL_TERMS_EN',
    'EXPO_PUBLIC_LEGAL_PRIVACY_DE',
    'EXPO_PUBLIC_LEGAL_PRIVACY_EN',
    'EXPO_PUBLIC_LEGAL_IMPRINT',
    'EXPO_PUBLIC_LEGAL_WITHDRAWAL_DE',
    'EXPO_PUBLIC_LEGAL_WITHDRAWAL_EN',
  ];
  const old: unknown[] = variables.map((key): unknown => process.env[key]);
  try {
    for (const name of variables) Reflect.set(process.env, name, 'https://example.invalid/fixture');
    expect(legalReady()).toBe(false);
  } finally {
    variables.forEach((name, index) => {
      const value = old[index];
      if (value === undefined) Reflect.deleteProperty(process.env, name);
      else if (typeof value === 'string') Reflect.set(process.env, name, value);
    });
  }
});
