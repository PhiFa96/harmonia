import type { Evaluation, KeySignatureItem } from '@harmonia/exercises';
import {
  signatureAnswerId,
  signatureAnswerNotes,
  signatureInputNotes,
  signatureNoteLabel,
  signatureSolutionScore,
} from '@harmonia/exercises';
import { engineLanguage } from '@harmonia/i18n';
import { ScoreView } from '@harmonia/notation/native';
import { RADIUS, SPACE, TOUCH } from '@harmonia/ui';
import { AppText, Button, Card, MusicText, useUiTheme } from '@harmonia/ui/native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useMusicLocale } from '@/i18n';
import { useWebChoiceInput } from './use-web-choice-input';

interface Props {
  readonly item: KeySignatureItem;
  readonly answer: string | null;
  readonly result?: Evaluation;
  readonly showSolution: boolean;
  readonly onSelect: (answer: string | null) => void;
}
export function SignatureAnswerInput({ item, answer, result, showSolution, onSelect }: Props) {
  const { t } = useTranslation(),
    locale = useMusicLocale(),
    { colors } = useUiTheme();
  const [alter, setAlter] = useState<1 | -1>(1);
  const group = useRef<View>(null);
  useWebChoiceInput(group, {
    choices: ['1', '-1'],
    enabled: !result,
    select: (value) => {
      setAlter(value === '1' ? 1 : -1);
    },
  });
  const notes = signatureAnswerNotes(answer) ?? [];
  return (
    <View style={styles.container}>
      <View
        ref={group}
        role="radiogroup"
        aria-label={t('exercise.signatureInput')}
        style={styles.row}
      >
        {([1, -1] as const).map((value) => (
          <Pressable
            key={value}
            role="radio"
            aria-checked={alter === value}
            aria-disabled={!!result}
            disabled={!!result}
            aria-label={t(value === 1 ? 'exercise.signatureSharp' : 'exercise.signatureFlat')}
            {...(Platform.OS === 'web' ? { tabIndex: !result && alter === value ? 0 : -1 } : {})}
            onPress={() => {
              setAlter(value);
            }}
            style={[
              styles.mode,
              {
                borderColor: alter === value ? colors.primary : colors.border,
                backgroundColor: alter === value ? colors.primarySoft : colors.surface,
              },
            ]}
          >
            <AppText>
              {t(value === 1 ? 'exercise.signatureSharp' : 'exercise.signatureFlat')}
            </AppText>
          </Pressable>
        ))}
      </View>
      <View style={styles.row}>
        {signatureInputNotes(alter).map((note) => (
          <Button
            key={note.letter}
            size="medium"
            variant="secondary"
            label={t('exercise.signatureAppend', { note: signatureNoteLabel(note, locale) })}
            disabled={!!result || notes.length === 7}
            onPress={() => {
              onSelect(signatureAnswerId([...notes, note]));
            }}
          />
        ))}
      </View>
      <Card>
        <MusicText aria-live="polite">
          {answer === null
            ? t('exercise.signatureNothingEntered')
            : t('exercise.signatureEntered', {
                notes: notes.length
                  ? notes.map((note) => signatureNoteLabel(note, locale)).join(' → ')
                  : t('exercise.signatureEmpty'),
              })}
        </MusicText>
      </Card>
      <Button
        size="medium"
        variant="ghost"
        label={t('exercise.signatureRemoveLast')}
        disabled={!!result || !notes.length}
        onPress={() => {
          onSelect(signatureAnswerId(notes.slice(0, -1)));
        }}
      />
      <Button
        size="medium"
        variant="secondary"
        label={t('exercise.signatureNoAccidentals')}
        disabled={!!result}
        onPress={() => {
          onSelect(signatureAnswerId([]));
        }}
      />
      {showSolution ? (
        <Card padding={SPACE.s}>
          <AppText variant="title3">{t('exercise.inputSolution')}</AppText>
          <ScrollView horizontal>
            <ScoreView
              score={signatureSolutionScore(item)}
              staffSpace={14}
              color={colors.text}
              describeOptions={engineLanguage(locale)}
            />
          </ScrollView>
        </Card>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: SPACE.m },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s },
  mode: {
    minHeight: TOUCH.buttonLarge,
    padding: SPACE.m,
    borderRadius: RADIUS.control,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
