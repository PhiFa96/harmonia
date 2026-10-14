import { createHash } from 'node:crypto';
import type * as NodeCrypto from 'node:crypto';
import { UiProvider } from '@harmonia/ui/native';
import {
  knowledgeArticleParts,
  knowledgeArticleHref,
  knowledgeChunkFingerprint,
} from '@harmonia/content';
import { catalogue, knowledgeStages } from '@harmonia/content/authoring';
import { contentTranslator } from '@harmonia/i18n';
import { contentMessages } from '@harmonia/i18n/content-messages';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import ArticleScreen from '@/app/article';
import { useSettings } from '@/state/settings';
import { i18n } from '@/i18n';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));
jest.mock('expo-crypto', () => ({
  randomUUID: () => '00000000-0000-4000-8000-000000000001',
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  digestStringAsync: (_algorithm: string, text: string) =>
    Promise.resolve(
      jest
        .requireActual<typeof NodeCrypto>('node:crypto')
        .createHash('sha256')
        .update(text)
        .digest('hex'),
    ),
}));
const mockPlay = jest.fn(() => Promise.resolve());
jest.mock('@/components/use-exercise-playback', () => ({
  useExercisePlayback: () => ({ playing: false, error: false, play: mockPlay, stop: jest.fn() }),
}));
beforeEach(() => {
  useSettings.setState({ locale: null });
  void i18n.changeLanguage('de');
  mockPlay.mockClear();
});
function target(
  id = 'notation.l1.staff.article',
  locale: 'de' | 'en-US' | 'en-GB' = 'de',
  section = 0,
) {
  const article = catalogue.knowledgeArticles.find((a) => a.id === id);
  if (!article) throw new Error('Article fixture');
  const stage = knowledgeStages[id];
  if (!stage) throw new Error('Stage fixture');
  const text = contentTranslator(locale, contentMessages),
    part = knowledgeArticleParts(article, stage, locale, text).find(
      (p) => p.section === section && p.part === 0,
    );
  if (!part) throw new Error('Section fixture');
  const chunk = {
    ...part,
    id: createHash('sha256').update(knowledgeChunkFingerprint(part)).digest('hex'),
  };
  return {
    href: knowledgeArticleHref(chunk),
    title: chunk.title,
    heading: chunk.heading,
    article,
    text,
  };
}
function open(href: string) {
  return renderRouter(
    { article: ArticleScreen, index: () => null },
    {
      initialUrl: href,
      wrapper: ({ children }) => <UiProvider scheme="light">{children}</UiProvider>,
    },
  );
}
it('öffnet die genaue Quelle, markiert Vorschau und zeigt ursprüngliche Beispiele', async () => {
  const source = target();
  open(source.href);
  await waitFor(() => {
    expect(screen.getByText(source.title)).toBeTruthy();
  });
  expect(screen.getByText('Zitierter Abschnitt')).toBeTruthy();
  expect(screen.getByText(/Dieser Artikel wartet noch auf die fachliche Freigabe/)).toBeTruthy();
  expect(screen.getByText('Artikelversion 3')).toBeTruthy();
  expect(mockPlay).not.toHaveBeenCalled();
  if (source.article.sections[0]?.examples.length) {
    const button = screen.getAllByText('Klangbeispiel')[0];
    if (!button) throw new Error('Example button');
    fireEvent.press(button);
    expect(mockPlay).toHaveBeenCalledTimes(1);
  }
  const other = source.article.sections[1];
  if (!other) throw new Error('Other section');
  fireEvent.press(screen.getByText(source.text(other.headingKey)));
  expect(screen.getByText(source.text(other.bodyKey))).toBeTruthy();
  expect(screen.queryByText('Zitierter Abschnitt')).toBeNull();
});
it('bewahrt britische Quellensprache bei deutscher Oberfläche', async () => {
  const source = target('rhythm.l1.values.article', 'en-GB', 1);
  open(source.href);
  await waitFor(() => {
    expect(screen.getByText(source.title)).toBeTruthy();
  });
  expect(screen.getByText('Sprache der zitierten Quelle: English (UK)')).toBeTruthy();
  const section = source.article.sections[1];
  if (!section) throw new Error('Section fixture');
  expect(screen.getByText(source.text(section.bodyKey))).toBeTruthy();
});
it.each([
  'version=999',
  'digest=' + 'f'.repeat(64),
  'locale=fr',
  'section=999',
  'articleId=missing.article',
])('weist unpassende Quelle ab: %s', async (change) => {
  const href = new URL(target().href, 'https://example.invalid');
  const [key, value] = change.split('=');
  if (!key || !value) throw new Error('Change fixture');
  href.searchParams.set(key, value);
  open(href.pathname + href.search);
  await waitFor(() => {
    expect(screen.getByText(/Diese Quelle ist in dieser App-Version nicht verfügbar/)).toBeTruthy();
  });
  expect(screen.queryByText('Zitierter Abschnitt')).toBeNull();
  fireEvent.press(screen.getByText('Quelle erneut prüfen'));
  await waitFor(() => {
    expect(screen.getByText(/Diese Quelle ist in dieser App-Version nicht verfügbar/)).toBeTruthy();
  });
});
it('lehnt mehrfache Versionsparameter ab', async () => {
  open(target().href + '&version=3');
  await waitFor(() => {
    expect(screen.getByText(/Diese Quelle ist in dieser App-Version nicht verfügbar/)).toBeTruthy();
  });
});
