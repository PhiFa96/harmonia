/// <reference types="node" />
import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { catalogue } from './authoring.ts';
import {
  buildKnowledgeSnapshot,
  splitKnowledgeBody,
  knowledgeText,
  knowledgeArticleHref,
  articleTargetSchema,
  knowledgeArticles,
  resolveKnowledgeArticle,
} from './knowledge.ts';
import { publicCatalogue } from './catalogue.ts';
import type { ContentCatalogue } from './catalogue-schema.ts';
const digest = (text: string) => Promise.resolve(createHash('sha256').update(text).digest('hex'));
const text = (_locale: string, key: string) =>
  key.endsWith('Title') ? 'Original heading' : 'A short original section about music.';
describe('Wissensbasis und Quellenidentität', () => {
  it('lässt unveröffentlichte Artikel vollständig aus dem öffentlichen Index weg', async () => {
    const publicIndex = await buildKnowledgeSnapshot(catalogue, 'published', text, digest);
    expect(publicIndex.chunks).toHaveLength(0);
    expect(publicIndex.articleCount).toBe(0);
  });
  it('erzeugt alle 41 Artikel und 286 Abschnitte in drei getrennten Sprachfassungen', async () => {
    const preview = await buildKnowledgeSnapshot(catalogue, 'preview', text, digest);
    expect(preview.articleCount).toBe(41);
    expect(preview.chunks).toHaveLength(858);
    expect(new Set(preview.chunks.map((c) => c.id)).size).toBe(858);
    for (const locale of ['de', 'en-US', 'en-GB'])
      expect(preview.chunks.filter((c) => c.locale === locale)).toHaveLength(286);
    expect(preview.chunks.every((c) => [1, 2, 3].includes(c.stage))).toBe(true);
  });
  it('ändert die Identität auch bei einer Textänderung ohne Versionsanhebung', async () => {
    const a = await buildKnowledgeSnapshot(catalogue, 'preview', text, digest),
      b = await buildKnowledgeSnapshot(
        catalogue,
        'preview',
        (locale, key) => text(locale, key) + ' changed',
        digest,
      );
    expect(a.digest).not.toBe(b.digest);
    expect(a.chunks[0]?.id).not.toBe(b.chunks[0]?.id);
    expect((await buildKnowledgeSnapshot(catalogue, 'preview', text, digest)).digest).toBe(
      a.digest,
    );
  });
  it('prüft die Freigabeabhängigkeiten vor einem öffentlichen Index', async () => {
    const invalid: ContentCatalogue = {
      ...catalogue,
      knowledgeArticles: catalogue.knowledgeArticles.map((a) => ({ ...a, status: 'freigegeben' })),
    };
    await expect(buildKnowledgeSnapshot(invalid, 'published', text, digest)).rejects.toThrow();
  });
  it('begrenzt die Wissensbasis auf nachweislich trainierte Stufen 1 bis 3', () => {
    const future = { ...catalogue, levels: catalogue.levels.map((l) => ({ ...l, number: 4 })) };
    expect(knowledgeArticles(future, 'preview')).toHaveLength(0);
  });
  it('teilt lange Texte ohne beschädigte Unicode-Zeichen und mit exakten Originalbereichen', () => {
    const source = Array.from({ length: 100 }, () => 'Ein eigener Satz mit 𝄞 und ü.').join(' '),
      chunks = splitKnowledgeBody(source, 100),
      chars = Array.from(source);
    expect(chunks.length).toBeGreaterThan(20);
    for (const chunk of chunks) {
      expect(Array.from(chunk.body).length).toBeLessThanOrEqual(100);
      expect(chars.slice(chunk.startChar, chunk.endChar).join('')).toBe(chunk.body);
      expect(chunk.body).not.toContain('\uFFFD');
    }
  });
  it('verweigert leere und ungelöste Übersetzungstexte', () => {
    for (const source of ['  ', '$t(glossary:measure)', '{{value}}', 'unsafe\0body'])
      expect(() => knowledgeText(source)).toThrow();
    expect(knowledgeText(' e\u0301\r\nText ')).toBe('é\nText');
  });
  it('erzeugt ausschließlich versionierte App-Artikelziele', async () => {
    const index = await buildKnowledgeSnapshot(catalogue, 'preview', text, digest),
      first = index.chunks[0];
    if (!first) throw new Error('Source');
    const href = knowledgeArticleHref(first);
    expect(href.startsWith('/article?')).toBe(true);
    const params = Object.fromEntries(new URL(href, 'https://example.invalid').searchParams);
    expect(articleTargetSchema.parse(params).digest).toBe(first.id);
    expect(
      articleTargetSchema.safeParse({ ...params, articleId: 'https://evil.invalid' }).success,
    ).toBe(false);
    expect(articleTargetSchema.safeParse({ ...params, locale: 'fr' }).success).toBe(false);
    expect(articleTargetSchema.safeParse({ ...params, version: ['1'] }).success).toBe(false);
    expect(articleTargetSchema.safeParse({ ...params, section: ['0'] }).success).toBe(false);
  });
  it('verweigert geänderte, veraltete oder zurückgezogene Quellen', async () => {
    const index = await buildKnowledgeSnapshot(catalogue, 'preview', text, digest),
      first = index.chunks[0];
    if (!first) throw new Error('Source');
    const target = Object.fromEntries(
      new URL(knowledgeArticleHref(first), 'https://example.invalid').searchParams,
    );
    expect((await resolveKnowledgeArticle(catalogue, target, text, digest))?.part.body).toBe(
      first.body,
    );
    expect(
      await resolveKnowledgeArticle(catalogue, { ...target, version: 999 }, text, digest),
    ).toBeNull();
    expect(
      await resolveKnowledgeArticle(
        catalogue,
        target,
        (locale, key) => text(locale, key) + ' changed',
        digest,
      ),
    ).toBeNull();
    expect(
      await resolveKnowledgeArticle({ ...catalogue, knowledgeArticles: [] }, target, text, digest),
    ).toBeNull();
    expect(
      await resolveKnowledgeArticle(publicCatalogue(catalogue), target, text, digest),
    ).toBeNull();
  });
  it('kann einen freigegebenen Artikel vor den zugehörigen Lektionen veröffentlichen', async () => {
    const approved: ContentCatalogue = {
      ...catalogue,
      areas: catalogue.areas.map((a) => ({ ...a, status: 'freigegeben' })),
      skills: catalogue.skills.map((s) => ({ ...s, status: 'freigegeben' })),
      knowledgeArticles: catalogue.knowledgeArticles.map((a) => ({ ...a, status: 'freigegeben' })),
    };
    const stages = Object.fromEntries(
      knowledgeArticles(approved, 'published').map(({ article, stage }) => [article.id, stage]),
    );
    const released = publicCatalogue(approved);
    expect(released.lessons).toHaveLength(0);
    expect(
      (await buildKnowledgeSnapshot(released, 'published', text, digest, stages)).articleCount,
    ).toBe(41);
  });
});
