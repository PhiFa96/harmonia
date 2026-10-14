import { resolveKnowledgeArticle } from '@harmonia/content';
import type { ResolvedKnowledgeArticle } from '@harmonia/content';
import { catalogue, knowledgeStages } from '@harmonia/content/catalogue';
import { contentTranslator, LOCALE_NAMES } from '@harmonia/i18n';
import { contentMessages } from '@harmonia/i18n/content-messages';
import { LAYOUT, SPACE } from '@harmonia/ui';
import { AppText, Button, Card, MusicText } from '@harmonia/ui/native';
import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ArticleExample } from '@/components/article-example';

export default function ArticleScreen() {
  const params = useLocalSearchParams(),
    router = useRouter(),
    { t } = useTranslation();
  const target = JSON.stringify(params);
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<{
    target: string;
    article: ResolvedKnowledgeArticle | null;
  } | null>(null);
  const translators = useMemo(
    () => ({
      de: contentTranslator('de', contentMessages),
      'en-US': contentTranslator('en-US', contentMessages),
      'en-GB': contentTranslator('en-GB', contentMessages),
    }),
    [],
  );
  useEffect(() => {
    let active = true;
    setState(null);
    void resolveKnowledgeArticle(
      catalogue,
      JSON.parse(target),
      (locale, key) => translators[locale](key),
      (value) => digestStringAsync(CryptoDigestAlgorithm.SHA256, value),
      knowledgeStages,
    )
      .then((article) => {
        if (active) setState({ target, article });
      })
      .catch(() => {
        if (active) setState({ target, article: null });
      });
    return () => {
      active = false;
    };
  }, [target, retry, translators]);
  const source = state?.target === target ? state.article : null;
  const pending = state?.target !== target;
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('article.title') }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          {pending ? (
            <AppText aria-live="polite">{t('article.loading')}</AppText>
          ) : source ? (
            <ArticleBody key={target} source={source} />
          ) : (
            <Card>
              <View style={styles.content}>
                <AppText aria-live="polite">{t('article.unavailable')}</AppText>
                <Button
                  variant="secondary"
                  label={t('article.retry')}
                  onPress={() => {
                    setRetry((value) => value + 1);
                  }}
                />
              </View>
            </Card>
          )}
          <Button
            variant="ghost"
            label={t('article.back')}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/');
            }}
          />
        </View>
      </ScrollView>
    </>
  );
}
function ArticleBody({ source }: { readonly source: ResolvedKnowledgeArticle }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(source.section);
  const section = source.sections[selected];
  if (!section) return null;
  return (
    <>
      <MusicText variant="title1" role="heading">
        {source.title}
      </MusicText>
      <AppText variant="footnote" tone="muted">
        {t('article.version', { version: source.article.contentVersion })}
      </AppText>
      <AppText variant="footnote" tone="muted">
        {t('article.sourceLanguage', { language: LOCALE_NAMES[source.locale] })}
      </AppText>
      {source.article.status !== 'freigegeben' ? (
        <Card>
          <AppText>{t('article.draft')}</AppText>
        </Card>
      ) : null}
      {selected === source.section ? (
        <AppText variant="small" tone="accent">
          {t('article.citedSection')}
        </AppText>
      ) : null}
      <MusicText variant="title2" role="heading" aria-live="polite">
        {section.heading}
      </MusicText>
      <MusicText>{section.body}</MusicText>
      {section.examples.map((example, index) => (
        <ArticleExample
          key={`${String(selected)}:${String(index)}`}
          example={example}
          locale={source.locale}
        />
      ))}
      <AppText variant="title2" role="heading">
        {t('article.sections')}
      </AppText>
      {source.sections.map((other, index) => (
        <Button
          key={index}
          variant="secondary"
          label={other.heading}
          disabled={index === selected}
          onPress={() => {
            setSelected(index);
          }}
        />
      ))}
    </>
  );
}
const styles = StyleSheet.create({
  container: { padding: LAYOUT.screenPadding, paddingBottom: SPACE.xxxl },
  content: { width: '100%', maxWidth: LAYOUT.maxContentWidth, alignSelf: 'center', gap: SPACE.m },
});
