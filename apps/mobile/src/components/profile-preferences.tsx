import { useEffect, useState, useRef } from 'react';
import { TextInput, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button, ListGroup, ListItem, useUiTheme } from '@harmonia/ui/native';
import { SPACE, RADIUS, TYPOGRAPHY } from '@harmonia/ui';
import { useSettings } from '@/state/settings';
import { useProfile, changeProfile, initializeProfile, syncProfile } from '@/state/profile';
import { useAuthState } from '@/auth';
import { useDeviceState } from '@/state/device';
import { OptionSheet } from './option-sheet';
export function ProfilePreferences() {
  const { t } = useTranslation(),
    settings = useSettings(),
    profile = useProfile(),
    auth = useAuthState(),
    storage = useDeviceState((s) => s.storage),
    { colors } = useUiTheme();
  const [sheet, setSheet] = useState<'names' | 'harmony' | 'pitch' | null>(null),
    [name, setName] = useState(''),
    [busy, setBusy] = useState(false),
    [failed, setFailed] = useState(false);
  const owns = profile.scope === (auth.session?.user.id ?? 'guest'),
    displayName = owns ? profile.data?.settings.displayName : null;
  const editing = useRef(false);
  useEffect(() => {
    editing.current = false;
    setName('');
  }, [profile.scope]);
  useEffect(() => {
    if (!editing.current) setName(displayName ?? '');
  }, [displayName, profile.scope]);
  return (
    <View style={{ gap: SPACE.m }}>
      <AppText variant="overline" tone="muted">
        {t('profile.musicSettings')}
      </AppText>
      <ListGroup>
        <ListItem
          label={t('profile.noteNaming')}
          value={t(`profile.names_${settings.noteNaming}`)}
          onPress={() => {
            setSheet('names');
          }}
        />
        <ListItem
          label={t('profile.harmonySystem')}
          value={t(`profile.harmony_${settings.harmonySystem}`)}
          onPress={() => {
            setSheet('harmony');
          }}
        />
        <ListItem
          label={t('profile.sound')}
          toggle={{ value: settings.sound, onValueChange: settings.setSound }}
        />
        <ListItem
          label={t('profile.referencePitch')}
          value={t('profile.hz', { value: settings.referenceHz })}
          onPress={() => {
            setSheet('pitch');
          }}
          last
        />
      </ListGroup>
      <AppText variant="footnote" tone="muted">
        {t('profile.musicSettingsHint')}
      </AppText>
      <AppText
        aria-live="polite"
        variant="footnote"
        tone={profile.sync === 'error' ? 'danger' : 'muted'}
      >
        {t(
          profile.phase === 'loading'
            ? 'profile.syncLoading'
            : profile.phase === 'error' || profile.sync === 'error'
              ? 'profile.syncError'
              : profile.sync === 'local'
                ? storage === 'memory'
                  ? 'onboarding.temporaryHint'
                  : 'profile.syncLocal'
                : profile.scope === 'guest' && profile.sync === 'pending'
                  ? 'profile.syncSaving'
                  : profile.sync === 'saved'
                    ? 'profile.syncSaved'
                    : 'profile.syncPending',
        )}
      </AppText>
      {profile.phase === 'error' || profile.sync === 'error' ? (
        <Button
          variant="ghost"
          label={t('onboarding.retry')}
          onPress={() => {
            void (profile.phase === 'error' ? initializeProfile() : syncProfile());
          }}
        />
      ) : null}
      {auth.session && owns && profile.phase === 'ready' ? (
        <>
          <AppText>{t('profile.displayName')}</AppText>
          <TextInput
            accessibilityLabel={t('profile.displayName')}
            value={name}
            onChangeText={(value) => {
              editing.current = true;
              setName(value);
            }}
            maxLength={60}
            autoComplete="off"
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.borderStrong,
                backgroundColor: colors.surface,
              },
            ]}
            editable={!busy}
          />
          <Button
            label={t('profile.saveName')}
            disabled={busy || name.trim() === (displayName ?? '')}
            onPress={() => {
              setBusy(true);
              setFailed(false);
              void changeProfile({ displayName: name.trim() || null })
                .then(() => {
                  editing.current = false;
                  setName(name.trim());
                })
                .catch(() => {
                  setFailed(true);
                })
                .finally(() => {
                  setBusy(false);
                });
            }}
          />
          {failed ? (
            <AppText role="alert" tone="danger">
              {t('profile.syncError')}
            </AppText>
          ) : null}
        </>
      ) : null}
      <OptionSheet
        visible={sheet === 'names'}
        title={t('profile.noteNaming')}
        options={(['auto', 'de', 'intl'] as const).map((value) => ({
          value,
          label: t(`profile.names_${value}`),
        }))}
        selected={settings.noteNaming}
        onSelect={(value) => {
          settings.setNoteNaming(value);
        }}
        onClose={() => {
          setSheet(null);
        }}
      />
      <OptionSheet
        visible={sheet === 'harmony'}
        title={t('profile.harmonySystem')}
        options={(['functions', 'roman', 'both'] as const).map((value) => ({
          value,
          label: t(`profile.harmony_${value}`),
        }))}
        selected={settings.harmonySystem}
        onSelect={(value) => {
          settings.setHarmonySystem(value);
        }}
        onClose={() => {
          setSheet(null);
        }}
      />
      <OptionSheet
        visible={sheet === 'pitch'}
        title={t('profile.referencePitch')}
        options={[415, 432, 440, 442, 443, 444, 466].map((hz) => ({
          value: String(hz),
          label: t('profile.hz', { value: hz }),
        }))}
        selected={String(settings.referenceHz)}
        onSelect={(value) => {
          settings.setReferenceHz(Number(value));
        }}
        onClose={() => {
          setSheet(null);
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  input: {
    ...TYPOGRAPHY.body,
    minHeight: SPACE.xxxl,
    borderWidth: 1,
    borderRadius: RADIUS.input,
    padding: SPACE.m,
  },
});
