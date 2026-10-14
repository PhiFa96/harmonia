export function legalUrl(raw: unknown): string | null {
  if (raw === undefined || raw === '') return null;
  if (typeof raw !== 'string') throw new Error('Legal URL');
  const url = new URL(raw);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    url.hostname === 'localhost'
  )
    throw new Error('Legal URLs require public HTTPS');
  return url.href;
}
export function legalConfig() {
  return {
    termsDe: legalUrl(process.env.EXPO_PUBLIC_LEGAL_TERMS_DE),
    termsEn: legalUrl(process.env.EXPO_PUBLIC_LEGAL_TERMS_EN),
    privacyDe: legalUrl(process.env.EXPO_PUBLIC_LEGAL_PRIVACY_DE),
    privacyEn: legalUrl(process.env.EXPO_PUBLIC_LEGAL_PRIVACY_EN),
    imprint: legalUrl(process.env.EXPO_PUBLIC_LEGAL_IMPRINT),
    withdrawalDe: legalUrl(process.env.EXPO_PUBLIC_LEGAL_WITHDRAWAL_DE),
    withdrawalEn: legalUrl(process.env.EXPO_PUBLIC_LEGAL_WITHDRAWAL_EN),
  };
}
export function legalReady() {
  return (
    process.env.EXPO_PUBLIC_LEGAL_RELEASE_APPROVED === 'true' &&
    Object.values(legalConfig()).every(Boolean)
  );
}
