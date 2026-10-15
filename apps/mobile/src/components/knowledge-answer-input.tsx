import type { Evaluation, MatchItem, OrderItem } from '@harmonia/exercises';
import {
  choiceLabel,
  knowledgeChoiceFact,
  knowledgeDefinition,
  knowledgeFactId,
  knowledgeFactLabel,
  knowledgeStatuses,
  matchAnswerId,
  matchAnswerValues,
  orderAnswerId,
  orderAnswerValues,
} from '@harmonia/exercises';
import { RADIUS, SPACE, TOUCH } from '@harmonia/ui';
import { AppText, Button, Card, Icon, MusicText, useUiTheme } from '@harmonia/ui/native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useMusicLocale } from '@/i18n';
import { ExerciseChoices } from './exercise-choices';
import { useWebChoiceInput } from './use-web-choice-input';

interface Props<Item> {
  readonly item: Item;
  readonly answer: string | null;
  readonly result?: Evaluation;
  readonly onSelect: (value: string | null) => void;
}
export function MatchAnswerInput({ item, answer, result, onSelect }: Props<MatchItem>) {
  const { t } = useTranslation(),
    locale = useMusicLocale(),
    { colors } = useUiTheme();
  const [selected, setSelected] = useState(0),
    group = useRef<View>(null);
  const values = matchAnswerValues(item, answer ?? '') ?? item.facts.map(() => null),
    ids = item.facts.map(knowledgeFactId);
  const statuses = result ? knowledgeStatuses(item, answer ?? '') : undefined;
  const selectTerm = (id: string) => {
    if (!result) setSelected(ids.indexOf(id));
  };
  useWebChoiceInput(group, { choices: ids, enabled: !result, select: selectTerm });
  const edit = (value: string | null) => {
    if (result) return;
    onSelect(
      matchAnswerId(
        values.map((previous, index) =>
          index === selected ? value : previous === value && value !== null ? null : previous,
        ),
      ),
    );
  };
  const current = item.facts[selected];
  return (
    <View style={styles.container}>
      <AppText variant="small" tone="muted">
        {t('exercise.matchInstruction')}
      </AppText>
      <View
        ref={group}
        role="radiogroup"
        aria-label={t('exercise.matchSelectTerm')}
        style={styles.container}
      >
        {item.facts.map((fact, index) => {
          const id = knowledgeFactId(fact),
            term = knowledgeFactLabel(fact, locale),
            chosen = knowledgeChoiceFact(item, values[index] ?? ''),
            status = statuses?.[index];
          const definition = chosen
            ? knowledgeDefinition(chosen, locale)
            : t('exercise.matchUnset');
          return (
            <Pressable
              key={id}
              testID={`match-term-${String(index)}`}
              role="radio"
              aria-checked={index === selected}
              aria-disabled={!!result}
              disabled={!!result}
              aria-label={`${term}, ${definition}${status === undefined ? '' : `, ${t(status ? 'highlight.correct' : 'highlight.wrong')}`}`}
              {...(Platform.OS === 'web'
                ? { tabIndex: !result && index === selected ? 0 : -1 }
                : {})}
              onPress={() => {
                selectTerm(id);
              }}
              style={[
                styles.term,
                {
                  borderColor: index === selected ? colors.primary : colors.border,
                  backgroundColor: index === selected ? colors.primarySoft : colors.surface,
                },
              ]}
            >
              <View style={styles.termText}>
                <MusicText variant="title3">{term}</MusicText>
                <AppText variant="small">{definition}</AppText>
              </View>
              {status === undefined ? null : (
                <Icon
                  name={status ? 'check' : 'close'}
                  size={20}
                  color={status ? colors.success : colors.danger}
                />
              )}
            </Pressable>
          );
        })}
      </View>
      <AppText aria-live="polite">
        {t('exercise.matchFilled', {
          count: values.filter((value) => value !== null).length,
          total: item.facts.length,
        })}
      </AppText>
      {!result && current ? (
        <>
          <AppText variant="title3">
            {t('exercise.matchDefinitions', { term: knowledgeFactLabel(current, locale) })}
          </AppText>
          <ExerciseChoices item={item} answer={values[selected] ?? null} onSelect={edit} />
          <Button
            variant="ghost"
            label={t('exercise.matchClear')}
            disabled={values[selected] === null}
            onPress={() => {
              edit(null);
            }}
          />
        </>
      ) : null}
    </View>
  );
}
export function OrderAnswerInput({ item, answer, result, onSelect }: Props<OrderItem>) {
  const { t } = useTranslation(),
    locale = useMusicLocale();
  const values = orderAnswerValues(item, answer ?? '') ?? [],
    statuses = result ? knowledgeStatuses(item, answer ?? '') : undefined;
  const edit = (next: readonly string[]) => {
    if (!result) onSelect(orderAnswerId(next));
  };
  const move = (index: number, change: number) => {
    const next = [...values],
      source = next[index],
      target = next[index + change];
    if (source === undefined || target === undefined) return;
    next[index] = target;
    next[index + change] = source;
    edit(next);
  };
  return (
    <View style={styles.container}>
      <AppText variant="small" tone="muted">
        {t('exercise.orderInputHint')}
      </AppText>
      <AppText variant="title3">{t('exercise.orderAnswer')}</AppText>
      {values.length ? (
        values.map((id, index) => {
          const label = choiceLabel(item, id, locale),
            status = statuses?.[index];
          return (
            <Card key={id} testID={`order-position-${String(index)}`}>
              <MusicText variant="title3">
                {t('exercise.orderPosition', { index: index + 1, value: label })}
              </MusicText>
              {status === undefined ? null : (
                <AppText tone={status ? 'success' : 'danger'}>
                  {t(status ? 'highlight.correct' : 'highlight.wrong')}
                </AppText>
              )}
              <View style={styles.actions}>
                <Button
                  testID={`order-up-${String(index)}`}
                  size="medium"
                  variant="ghost"
                  label={t('exercise.orderMoveUp')}
                  accessibilityLabel={t('exercise.orderUp', { value: label })}
                  disabled={!!result || index === 0}
                  onPress={() => {
                    move(index, -1);
                  }}
                />
                <Button
                  testID={`order-down-${String(index)}`}
                  size="medium"
                  variant="ghost"
                  label={t('exercise.orderMoveDown')}
                  accessibilityLabel={t('exercise.orderDown', { value: label })}
                  disabled={!!result || index === values.length - 1}
                  onPress={() => {
                    move(index, 1);
                  }}
                />
                <Button
                  testID={`order-remove-${String(index)}`}
                  size="medium"
                  variant="ghost"
                  label={t('exercise.orderRemoveItem')}
                  accessibilityLabel={t('exercise.orderRemove', { value: label })}
                  disabled={!!result}
                  onPress={() => {
                    edit(values.filter((_, position) => position !== index));
                  }}
                />
              </View>
            </Card>
          );
        })
      ) : (
        <AppText tone="muted">{t('exercise.orderEmpty')}</AppText>
      )}
      <AppText aria-live="polite">
        {t('exercise.orderFilled', { count: values.length, total: item.values.length })}
      </AppText>
      {!result ? (
        <>
          <AppText variant="title3">{t('exercise.orderChoices')}</AppText>
          <View style={styles.container}>
            {item.choices.map((id) => (
              <Button
                key={id}
                testID={`order-option-${id}`}
                variant="secondary"
                label={choiceLabel(item, id, locale)}
                disabled={values.includes(id)}
                onPress={() => {
                  if (!values.includes(id)) edit([...values, id]);
                }}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: SPACE.m },
  term: {
    minHeight: TOUCH.buttonLarge,
    borderRadius: RADIUS.control,
    borderWidth: 2,
    padding: SPACE.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.s,
  },
  termText: { flex: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s },
});
