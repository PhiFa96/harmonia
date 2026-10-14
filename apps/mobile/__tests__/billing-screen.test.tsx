import { UiProvider } from '@harmonia/ui/native';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import Subscription from '@/app/subscription';
import type { BillingState } from '@/billing/controller';
import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';
import { Linking } from 'react-native';
const mockBuy = jest.fn<Promise<void>, [string, string]>(() => Promise.resolve()),
  mockRestore = jest.fn(() => Promise.resolve()),
  mockRefresh = jest.fn(() => Promise.resolve());
let mockState: BillingState;
jest.mock('@/billing/state', () => ({
  useBilling: () => mockState,
  purchaseBilling: (id: string, locale: string) => mockBuy(id, locale),
  refreshBilling: () => mockRefresh(),
  restoreBilling: () => mockRestore(),
}));
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));
const initial = (): BillingState => ({
  actor: 'a',
  phase: 'ready',
  busy: false,
  offers: [
    { id: 'premium:monthly', tier: 'premium', period: 'monthly', price: '9,99 €' },
    { id: 'premium:annual', tier: 'premium', period: 'annual', price: '99,00 €' },
  ],
  customer: { active: false, managementUrl: null },
  status: { configured: true, simulation: true, entitlements: [] },
  notice: null,
});
function view() {
  return renderRouter(
    { subscription: Subscription, account: () => null, index: () => null },
    {
      initialUrl: '/subscription',
      wrapper: ({ children }) => <UiProvider scheme="light">{children}</UiProvider>,
    },
  );
}
beforeEach(async () => {
  mockState = initial();
  jest.clearAllMocks();
  useSettings.setState({ locale: 'de' });
  await i18n.changeLanguage('de');
});
it('shows actual period prices and only purchases after explicit press', () => {
  view();
  expect(screen.getByText('9,99 € pro Monat')).toBeTruthy();
  expect(screen.getByText('99,00 € pro Jahr')).toBeTruthy();
  expect(mockBuy).not.toHaveBeenCalled();
  const button = screen.getAllByRole('button', { name: 'Premium monatlich abonnieren' })[0];
  if (!button) throw new Error('Missing buy button');
  fireEvent.press(button);
  expect(mockBuy).toHaveBeenCalledWith('premium:monthly', 'de');
});
it('offers account login to guests and hides purchase and restore', () => {
  mockState = {
    ...initial(),
    actor: null,
    phase: 'guest',
    offers: [],
    status: null,
    customer: null,
  };
  view();
  expect(screen.getByRole('button', { name: 'Zum Konto' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Käufe wiederherstellen' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Premium monatlich abonnieren' })).toBeNull();
});
it('does not offer purchases before setup', () => {
  mockState = { ...initial(), phase: 'unconfigured', offers: [], status: null };
  view();
  expect(screen.getByText('Abonnements sind hier noch nicht für Käufe eingerichtet.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Premium monatlich abonnieren' })).toBeNull();
});
it('shows cancellation expiry and links management instead of another purchase', () => {
  mockState.customer = {
    active: true,
    managementUrl: 'https://billing.revenuecat.com/manage/local-test',
  };
  if (!mockState.status) throw new Error('Missing fixture');
  mockState.status.entitlements = [
    {
      entitlement: 'premium',
      active: true,
      expires_at: '2099-11-14T12:00:00Z',
      store: 'web',
      will_renew: false,
      billing_issue: false,
    },
  ];
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  view();
  expect(screen.getByText(/Gekündigt\. Zugang bis/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Premium monatlich abonnieren' })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Abo verwalten oder kündigen' }));
  expect(open).toHaveBeenCalledWith(mockState.customer.managementUrl);
  open.mockRestore();
});
it('pending confirmation prevents another purchase while allowing refresh', () => {
  mockState.notice = 'pending';
  view();
  expect(screen.getAllByRole('button', { name: 'Premium monatlich abonnieren' })[0]).toBeDisabled();
  fireEvent.press(screen.getByRole('button', { name: 'Status aktualisieren' }));
  expect(mockRefresh).toHaveBeenCalledTimes(1);
});
it.each([
  ['en-US', 'Purchase canceled.'],
  ['en-GB', 'Purchase cancelled.'],
] as const)('renders %s cancellation wording', async (locale, wording) => {
  useSettings.setState({ locale });
  await i18n.changeLanguage(locale);
  mockState.notice = 'canceled';
  view();
  expect(screen.getByText(wording)).toBeTruthy();
  expect(screen.getByText('9,99 € per month')).toBeTruthy();
});
it('busy purchase disables restore and refresh', () => {
  mockState.busy = true;
  view();
  expect(screen.getByRole('button', { name: 'Käufe wiederherstellen' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Status aktualisieren' })).toBeDisabled();
});
it('annual and monthly purchase buttons identify their own billing period', () => {
  view();
  fireEvent.press(screen.getByRole('button', { name: 'Premium jährlich abonnieren' }));
  expect(mockBuy).toHaveBeenCalledWith('premium:annual', 'de');
  expect(screen.getByRole('button', { name: 'Premium monatlich abonnieren' })).toBeTruthy();
});
it('billing issues are not displayed as customer cancellation', () => {
  mockState.status = {
    configured: true,
    simulation: true,
    entitlements: [
      {
        entitlement: 'premium',
        active: true,
        expires_at: '2099-11-14T12:00:00Z',
        store: 'web',
        will_renew: false,
        billing_issue: true,
      },
    ],
  };
  view();
  expect(
    screen.getByText('Es gibt ein Zahlungsproblem. Prüfe die Zahlung in der Abo-Verwaltung.'),
  ).toBeTruthy();
  expect(screen.queryByText(/Gekündigt/)).toBeNull();
});
