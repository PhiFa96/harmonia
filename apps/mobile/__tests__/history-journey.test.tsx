import { UiProvider } from '@harmonia/ui/native';
import { historyStops } from '@harmonia/content/history-journey';
import { catalogue, knowledgeStages } from '@harmonia/content/authoring';
import {
  knowledgeArticleParts,
  knowledgeArticleHref,
  knowledgeChunkFingerprint,
  resolveKnowledgeArticle,
} from '@harmonia/content';
import { contentTranslator, createHistoryJourneyText } from '@harmonia/i18n';
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
  const copy = createHistoryJourneyText('de', historyJourneyMessages)(stop.id);
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
  expect(screen.getByText(copy.knowledgeHint, { exact: false })).toBeTruthy();
  expect(screen.queryByText(copy.knowledgeExplanation, { exact: false })).toBeNull();
  expect(screen.getByText('Weiter')).toBeDisabled();
  fireEvent.press(screen.getByText(knowledgeAnswer));
  expect(screen.queryByText(/Noch nicht richtig/)).toBeNull();
  fireEvent.press(screen.getByText('Antwort prüfen'));
  expect(screen.getByText(copy.knowledgeExplanation, { exact: false })).toBeTruthy();
  fireEvent.press(screen.getByText('Weiter'));
  expect(screen.getByText(copy.listeningPrompt)).toBeTruthy();
  const wrongListening = copy.listeningOptions[1];
  if (!wrongListening) throw new Error('Missing listening distractor');
  fireEvent.press(screen.getByText(wrongListening));
  fireEvent.press(screen.getByText('Antwort prüfen'));
  expect(screen.getByText(copy.listeningHint, { exact: false })).toBeTruthy();
  expect(screen.queryByText(copy.listeningExplanation, { exact: false })).toBeNull();
  expect(screen.getByText('Weiter')).toBeDisabled();
  fireEvent.press(screen.getByText(listeningAnswer));
  fireEvent.press(screen.getByText('Antwort prüfen'));
  expect(screen.getByText(copy.listeningExplanation, { exact: false })).toBeTruthy();
  fireEvent.press(screen.getByText('Weiter'));
  expect(screen.getByText(/vergibt keine XP/)).toBeTruthy();
  fireEvent.press(screen.getByText('Zurück'));
  expect(screen.queryByText(copy.listeningHint, { exact: false })).toBeNull();
  expect(screen.queryByText(copy.listeningExplanation, { exact: false })).toBeNull();
  expect(screen.getByText('Antwort prüfen')).toBeDisabled();
  fireEvent.press(screen.getByText('Gerade nicht hören – Frage überspringen'));
  expect(screen.getByText(/vergibt keine XP/)).toBeTruthy();
});

it('keeps the sound models free of parallel fifths and octaves and audibly groups the phrases', () => {
  const natural: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const perfect = (low: number, high: number) => [0, 7].includes((high - low) % 12);
  for (const stop of historyStops)
    for (const source of [stop.sceneScore, stop.listeningScore]) {
      const byOnset = new Map<number, number[]>();
      for (const { onsetSeconds, pitch } of scoreTimeline(parseScore(source), { bpm: 90 }).tones)
        byOnset.set(onsetSeconds, [
          ...(byOnset.get(onsetSeconds) ?? []),
          12 * (pitch.octave + 1) + (natural[pitch.letter] ?? 0) + pitch.alter,
        ]);
      const pairs: (readonly [number, number])[] = [];
      for (const [, notes] of [...byOnset.entries()].sort(([a], [b]) => a - b)) {
        const [low, high] = notes.sort((a, b) => a - b);
        if (notes.length === 2 && low !== undefined && high !== undefined) pairs.push([low, high]);
      }
      for (let index = 1; index < pairs.length; index++) {
        const [beforeLow, beforeHigh] = pairs[index - 1] ?? [0, 0];
        const [low, high] = pairs[index] ?? [0, 0];
        const parallel =
          Math.sign(low - beforeLow) === Math.sign(high - beforeHigh) &&
          low !== beforeLow &&
          perfect(low, high) &&
          perfect(beforeLow, beforeHigh) &&
          (high - low) % 12 === (beforeHigh - beforeLow) % 12;
        expect({ stop: stop.id, pair: index, parallel }).toEqual({
          stop: stop.id,
          pair: index,
          parallel: false,
        });
      }
    }
  const classical = historyStops.find((stop) => stop.id === 'classical');
  if (!classical) throw new Error('Missing classical stop');
  for (const source of [classical.sceneScore, classical.listeningScore]) {
    const tones = scoreTimeline(parseScore(source), { bpm: 90 }).tones;
    const gaps = tones.filter((tone, index) => {
      const previous = tones[index - 1];
      return (
        previous !== undefined &&
        tone.onsetSeconds - (previous.onsetSeconds + previous.durationSeconds) > 0.1
      );
    });
    expect(tones).toHaveLength(8);
    expect(gaps).toHaveLength(1);
  }
});
