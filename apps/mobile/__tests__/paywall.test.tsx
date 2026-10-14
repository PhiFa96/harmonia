import { UiProvider } from '@harmonia/ui/native';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import Paywall from '@/app/paywall';
import { useAccess } from '@/access/state';
import { DEFAULT_ACCESS_POLICY, guestAccessStatus } from '@harmonia/content';
import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';
import type { BillingState } from '@/billing/controller';
let mockState: BillingState;
const mockBuy = jest.fn<Promise<void>, [string, string]>(() => Promise.resolve());
jest.mock('@/billing/state', () => ({
  useBilling: () => mockState,
  purchaseBilling: (id: string, locale: string) => mockBuy(id, locale),
  restoreBilling: () => Promise.resolve(),
  refreshBilling: () => Promise.resolve(),
}));
const vars = [
  'EXPO_PUBLIC_LEGAL_TERMS_DE',
  'EXPO_PUBLIC_LEGAL_TERMS_EN',
  'EXPO_PUBLIC_LEGAL_PRIVACY_DE',
  'EXPO_PUBLIC_LEGAL_PRIVACY_EN',
  'EXPO_PUBLIC_LEGAL_IMPRINT',
];
function view(reason = 'settings') {
  return renderRouter(
    { paywall: Paywall, index: () => null, account: () => null, subscription: () => null },
    {
      initialUrl: '/paywall?reason=' + reason,
      wrapper: ({ children }) => <UiProvider scheme="light">{children}</UiProvider>,
    },
  );
}
beforeEach(async () => {
  mockBuy.mockClear();
  mockState = {
    actor: 'a',
    phase: 'ready',
    busy: false,
    customer: { active: false, managementUrl: null },
    status: { configured: true, simulation: true, entitlements: [] },
    notice: null,
    offers: [
      { id: 'p:m', tier: 'premium', period: 'monthly', price: '9,99 €' },
      { id: 'p:y', tier: 'premium', period: 'annual', price: '99,00 €' },
    ],
  };
  for (const name of vars) process.env[name] = 'https://example.invalid/legal';
  useAccess.setState({
    owner: 'a',
    loading: false,
    error: false,
    status: guestAccessStatus(
      { ...DEFAULT_ACCESS_POLICY, checkoutEnabled: true },
      null,
      Date.now(),
    ),
  });
  useSettings.setState({ locale: 'de' });
  await i18n.changeLanguage('de');
});
afterEach(() => {
  for (const name of vars) Reflect.deleteProperty(process.env, name);
});
it('uses store prices per period and only buys after an explicit choice', () => {
  view();
  expect(screen.getByText('9,99 € pro Monat')).toBeTruthy();
  expect(screen.queryByText('99,00 € pro Jahr')).toBeNull();
  expect(mockBuy).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: 'Jährlich' }));
  expect(screen.getByText('99,00 € pro Jahr')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Premium jährlich abonnieren' }));
  expect(mockBuy).toHaveBeenCalledWith('p:y', 'de');
});
it('disables checkout with missing legal bindings or closed policy', () => {
  Reflect.deleteProperty(process.env, 'EXPO_PUBLIC_LEGAL_TERMS_EN');
  view();
  expect(screen.getByRole('button', { name: 'Premium monatlich abonnieren' })).toBeDisabled();
  expect(mockBuy).not.toHaveBeenCalled();
});
it('closed server policy also blocks the purchase despite valid legal links', () => {
  useAccess.setState({ status: guestAccessStatus(DEFAULT_ACCESS_POLICY, null, Date.now()) });
  view();
  expect(screen.getByRole('button', { name: 'Premium monatlich abonnieren' })).toBeDisabled();
});
it('onboarding can be skipped without purchase or account', () => {
  mockState = {
    ...mockState,
    actor: null,
    phase: 'guest',
    offers: [],
    status: null,
    customer: null,
  };
  const app = view('onboarding');
  fireEvent.press(screen.getByRole('button', { name: 'Gratis weiterlernen' }));
  expect(app.getPathname()).toBe('/');
  expect(mockBuy).not.toHaveBeenCalled();
});
it.each(['de', 'en-US', 'en-GB'] as const)(
  'offers localized comparison and legal links in %s',
  async (locale) => {
    useSettings.setState({ locale });
    await i18n.changeLanguage(locale);
    view('limit');
    expect(screen.getByText(i18n.t('paywall.compare'))).toBeTruthy();
    expect(screen.getByText(i18n.t('paywall.reason_limit'))).toBeTruthy();
    expect(screen.getByRole('button', { name: i18n.t('paywall.privacy') })).toBeTruthy();
    expect(screen.getByText(i18n.t('paywall.maxPreparing'))).toBeTruthy();
  },
);
