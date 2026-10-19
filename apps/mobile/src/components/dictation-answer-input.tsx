import type { DictationItem, Evaluation } from '@harmonia/exercises';
import {
  dictationAnswerId,
  dictationDurationId,
  dictationInputValues,
  pitchInputLabel,
  durationName,
  formatPitch,
} from '@harmonia/exercises';
import { engineLanguage } from '@harmonia/i18n';
import { keyboardMidi } from '@harmonia/notation';
import { SPACE } from '@harmonia/ui';
import { AppText, Button } from '@harmonia/ui/native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useMusicLocale } from '@/i18n';
import { PianoKeyboard } from './piano-keyboard';

interface Props {
  readonly item: DictationItem;
  readonly answer: string | null;
  readonly result?: Evaluation;
  readonly onSelect: (answer: string | null) => void;
}

export function DictationAnswerInput({ item, answer, result, onSelect }: Props) {
  const { t } = useTranslation();
  const locale = useMusicLocale();
  const values = dictationInputValues(item, answer) ?? [];
  const options =
    item.type === 'MELODY_DICTATION'
      ? item.inputPitches.map((pitch) => ({
          id: formatPitch(pitch),
          label: pitchInputLabel(pitch, locale),
        }))
      : item.inputDurations.map((value) => ({
          id: dictationDurationId(value),
          label: durationName(value, engineLanguage(locale)),
        }));
  const entries = values.map(
    (value) => options.find((option) => option.id === value)?.label ?? value,
  );
  return (
    <View style={{ gap: SPACE.m }}>
      <AppText aria-live="polite">
        {t('exercise.dictationProgress', { count: values.length, total: item.pitches.length })}
      </AppText>
      <AppText>{entries.join(' → ') || '—'}</AppText>
      {item.type === 'MELODY_DICTATION' ? (
        <PianoKeyboard
          fixedRange={{ first: 60, last: 67 }}
          enabled={!result && values.length < item.pitches.length}
          onPitch={(pitch) => {
            const chosen = item.inputPitches.find(
              (value) => keyboardMidi(value) === keyboardMidi(pitch),
            );
            if (chosen) onSelect(dictationAnswerId([...values, formatPitch(chosen)]));
          }}
        />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s }}>
          {options.map((option) => (
            <Button
              key={option.id}
              variant="secondary"
              label={option.label}
              disabled={!!result || values.length >= item.pitches.length}
              onPress={() => {
                onSelect(dictationAnswerId([...values, option.id]));
              }}
            />
          ))}
        </View>
      )}
      <Button
        variant="ghost"
        label={t('exercise.dictationUndo')}
        disabled={!!result || values.length === 0}
        onPress={() => {
          onSelect(values.length > 1 ? dictationAnswerId(values.slice(0, -1)) : null);
        }}
      />
    </View>
  );
}
