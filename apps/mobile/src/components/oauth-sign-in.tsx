import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppText, Button } from '@harmonia/ui/native';
import { oauthProviders, startOAuth } from '@/auth/oauth';
export function OAuthSignIn({
  ageConfirmed,
  onVerified,
}: {
  readonly ageConfirmed: boolean;
  readonly onVerified: (id: string) => void;
}) {
  const { t } = useTranslation(),
    [busy, setBusy] = useState(false),
    [failed, setFailed] = useState(false);
  return (
    <>
      {(['apple', 'google'] as const)
        .filter((provider) => oauthProviders()[provider])
        .map((provider) => (
          <Button
            key={provider}
            variant="secondary"
            label={t(`auth.${provider}`)}
            disabled={!ageConfirmed || busy}
            onPress={() => {
              setBusy(true);
              setFailed(false);
              void startOAuth(provider, ageConfirmed)
                .then((id) => {
                  if (id) onVerified(id);
                })
                .catch(() => {
                  setFailed(true);
                })
                .finally(() => {
                  setBusy(false);
                });
            }}
          />
        ))}
      {failed ? (
        <AppText role="alert" tone="danger">
          {t('auth.oauthError')}
        </AppText>
      ) : null}
    </>
  );
}
