import { UiProvider } from '@harmonia/ui/native';
import { historyStops } from '@harmonia/content/history-journey';
import { catalogue, knowledgeStages } from '@harmonia/content/authoring';
import {
  knowledgeArticleParts,
  knowledgeArticleHref,
  knowledgeChunkFingerprint,
  resolveKnowledgeArticle,
} from '@harmonia/content';
import { contentTranslator } from '@harmonia/i18n';
import { contentMessages } from '@harmonia/i18n/content-messages';
import { createHash } from 'node:crypto';
import { historyJourneyMessages } from '@harmonia/i18n/history-journey';
import { layoutScore, parseScore, scoreTimeline } from '@harmonia/notation';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import HistoryJourneyScreen from '@/app/history-journey';
import { i18n } from '@/i18n';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));
jest.mock('@/components/use-exercise-playback', () => ({
  useExercisePlayback: () => ({
    playing: false,
    heard: true,
    error: false,
    play: jest.fn(() => Promise.resolve()),
    stop: jest.fn(),
  }),
}));
jest.mock('@/components/article-example', () => ({
  ArticleExample: () => null,
}));

it('keeps four sourced, translated stages as drafts with playable original scores', () => {
  expect(historyStops).toHaveLength(4);
  for (const stop of historyStops) {
    expect(stop.status).toBe('entwurf');
    const article = catalogue.knowledgeArticles.find((entry) => entry.id === stop.source.articleId);
    expect(article?.status).toBe('entwurf');
    expect(article?.sections[stop.source.section]).toBeDefined();
    for (const score of [stop.sceneScore, stop.listeningScore]) {
      const parsed = parseScore(score);
      expect(scoreTimeline(parsed, { bpm: 90 }).tones.length).toBeGreaterThan(0);
      expect(layoutScore(parsed).items.length).toBeGreaterThan(0);
    }
    const tones = scoreTimeline(parseScore(stop.listeningScore), { bpm: 90 }).tones;
    const onsets = new Map<number, number>();
    for (const tone of tones)
      onsets.set(tone.onsetSeconds, (onsets.get(tone.onsetSeconds) ?? 0) + 1);
    expect([...onsets.values()]).toEqual(
      Array(stop.id === 'classical' ? 8 : 4).fill(
        stop.id === 'renaissance' || stop.id === 'baroque' ? 2 : 1,
      ),
    );
    for (const locale of ['de', 'en-US', 'en-GB'] as const) {
      const copy = historyJourneyMessages[locale][stop.id];
      expect(copy.title.trim()).not.toBe('');
      expect(copy.personaReply.trim()).not.toBe('');
      expect(copy.knowledgeOptions).toHaveLength(3);
      expect(copy.listeningOptions).toHaveLength(3);
      expect(copy.knowledgeOptions[stop.knowledgeAnswer]).toBeTruthy();
      expect(copy.listeningOptions[stop.listeningAnswer]).toBeTruthy();
    }
  }
});

it('opens the exact versioned source section in both languages', async () => {
  const digest = (value: string) =>
    Promise.resolve(createHash('sha256').update(value).digest('hex'));
  for (const stop of historyStops) {
    const article = catalogue.knowledgeArticles.find((entry) => entry.id === stop.source.articleId);
    const stage = knowledgeStages[stop.source.articleId];
    if (!article || !stage) throw new Error('Missing source fixture');
    for (const locale of ['de', 'en-US', 'en-GB'] as const) {
      const translate = contentTranslator(locale, contentMessages);
      const part = knowledgeArticleParts(article, stage, locale, translate).find(
        (entry) => entry.section === stop.source.section && entry.part === 0,
      );
      if (!part) throw new Error('Missing source part');
      const id = await digest(knowledgeChunkFingerprint(part));
      const href = knowledgeArticleHref({ ...part, id });
      const params = Object.fromEntries(new URL(href, 'https://example.test').searchParams);
      const resolved = await resolveKnowledgeArticle(
        catalogue,
        params,
        (language, key) => contentTranslator(language, contentMessages)(key),
        digest,
        knowledgeStages,
      );
      expect(resolved?.section).toBe(stop.source.section);
      expect(resolved?.locale).toBe(locale);
    }
  }
});

it('allows correction, completes a station, and awards no progress', () => {
  void i18n.changeLanguage('de');
  renderRouter(
    { 'history-journey': HistoryJourneyScreen, index: () => null },
    {
      initialUrl: '/history-journey',
      wrapper: ({ children }) => <UiProvider scheme="light">{children}</UiProvider>,
    },
  );
  const stop = historyStops[0];
  if (!stop) throw new Error('Missing story fixture');
  const copy = historyJourneyMessages.de[stop.id];
  const wrongOption = copy.knowledgeOptions[0];
  const knowledgeAnswer = copy.knowledgeOptions[stop.knowledgeAnswer];
  const listeningAnswer = copy.listeningOptions[stop.listeningAnswer];
  if (!wrongOption || !knowledgeAnswer || !listeningAnswer) throw new Error('Missing options');
  fireEvent.press(screen.getByText(copy.title));
  expect(screen.getByText(copy.scene)).toBeTruthy();
  fireEvent.press(screen.getByText('Weiter'));
  expect(screen.getByText(copy.personaReply)).toBeTruthy();
  fireEvent.press(screen.getByText('Weiter'));
  fireEvent.press(screen.getByText(wrongOption));
  fireEvent.press(screen.getByText('Antwort prüfen'));
  expect(screen.getByText(/Noch nicht richtig/)).toBeTruthy();
  fireEvent.press(screen.getByText(knowledgeAnswer));
  fireEvent.press(screen.getByText('Antwort prüfen'));
  fireEvent.press(screen.getByText('Weiter'));
  expect(screen.getByText(copy.listeningPrompt)).toBeTruthy();
  fireEvent.press(screen.getByText(listeningAnswer));
  fireEvent.press(screen.getByText('Antwort prüfen'));
  fireEvent.press(screen.getByText('Weiter'));
  expect(screen.getByText(/vergibt keine XP/)).toBeTruthy();
});
