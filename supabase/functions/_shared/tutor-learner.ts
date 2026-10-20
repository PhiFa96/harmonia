import { z } from 'zod';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.117.3';
import { learningPath } from '../../../packages/content/src/index.ts';
import type { ContentCatalogue, TutorRequest } from '../../../packages/content/src/index.ts';
import { contentTranslator } from '../../../packages/i18n/src/instance.ts';
import { contentMessages as releasedMessages } from '../../../packages/i18n/src/published-content-messages.ts';
import type { MessageTree } from '../../../packages/i18n/src/messages/types.ts';
import { knowledgeLane } from './knowledge.ts';

/** Strengths and practice needs are only named when this many rating points separate them. */
export const MIN_RATING_GAP = 75;
const ratingSchema = z
  .object({
    skill_id: z.string().max(128),
    rating: z.number(),
    rating_deviation: z.number().positive(),
    attempts: z.number().int().nonnegative(),
  })
  .strip();
const snapshotSchema = z
  .object({
    passed: z
      .array(z.object({ lessonId: z.string(), contentVersion: z.number().int() }))
      .max(10000),
    testedUnitIds: z.array(z.string()).max(10000),
  })
  .strict();
export type LearnerContext = Awaited<ReturnType<typeof loadLearnerContext>>;
type Rating = z.infer<typeof ratingSchema>;
type Snapshot = z.infer<typeof snapshotSchema>;

/** The model receives catalogue labels and aggregate evidence only, never rows or account fields. */
export async function loadLearnerContext(
  client: SupabaseClient,
  actor: string,
  catalogue: ContentCatalogue,
  request: TutorRequest,
) {
  const [ratingsResult, snapshotResult] = await Promise.all([
    client
      .from('skill_progress')
      .select('skill_id,rating,rating_deviation,attempts')
      .eq('user_id', actor),
    client.rpc('tutor_learner_snapshot', { actor }),
  ]);
  if (ratingsResult.error || snapshotResult.error) return { available: false as const };
  const ratings = z.array(ratingSchema).max(10000).safeParse(ratingsResult.data),
    snapshot = snapshotSchema.safeParse(snapshotResult.data);
  if (!ratings.success || !snapshot.success) return { available: false as const };
  const messages =
    knowledgeLane((name) => Deno.env.get(name)) === 'preview'
      ? (await import('../../../packages/i18n/src/authoring-content-messages.ts')).contentMessages
      : releasedMessages;
  return summarizeLearner(catalogue, messages, request, ratings.data, snapshot.data);
}

export function summarizeLearner(
  catalogue: ContentCatalogue,
  messages: Readonly<Record<'de' | 'en-US' | 'en-GB', MessageTree>>,
  request: TutorRequest,
  ratings: readonly Rating[],
  snapshot: Snapshot,
) {
  const translate = contentTranslator(request.locale, messages),
    knownSkills = new Map(catalogue.skills.map((skill) => [skill.id, skill])),
    measured = ratings.flatMap((row) => {
      const skill = knownSkills.get(row.skill_id);
      return skill && row.attempts >= 3 && row.rating_deviation <= 150
        ? [
            {
              skillId: row.skill_id,
              skill: translate(skill.titleKey),
              rating: Math.round(row.rating),
              attempts: row.attempts,
            },
          ]
        : [];
    }),
    ordered = [...measured].sort(
      (a, b) => a.rating - b.rating || a.skillId.localeCompare(b.skillId),
    ),
    comparisonSize = Math.min(3, Math.floor(ordered.length / 2)),
    lowest = ordered[0]?.rating ?? 0,
    highest = ordered.at(-1)?.rating ?? 0,
    // Without a clear gap every ranking would be invented: equal ratings make no strength.
    strengths = comparisonSize
      ? ordered
          .slice(-comparisonSize)
          .reverse()
          .filter((row) => row.rating - lowest >= MIN_RATING_GAP)
      : [],
    needsPractice = ordered
      .slice(0, comparisonSize)
      .filter((row) => highest - row.rating >= MIN_RATING_GAP),
    path = learningPath(
      catalogue,
      snapshot.passed.map((row) => ({ ...row, passed: true, eligibleCorrect: 0, total: 1 })),
      snapshot.testedUnitIds,
    ),
    available = path.flatMap((unit) =>
      unit.lessons
        .filter((lesson) => lesson.status === 'open')
        .map((lesson) => ({
          lessonId: lesson.id,
          lesson: translate(lesson.titleKey),
          unit: translate(unit.titleKey),
          level: unit.level,
        })),
    ),
    completedLessons = path.reduce((sum, unit) => sum + unit.completed, 0),
    totalLessons = path.reduce((sum, unit) => sum + unit.lessons.length, 0);
  const weeklyPlan = Array.from({ length: Math.min(3, available.length) }, (_, index) => ({
    session: index + 1,
    minutes: 15,
    ...available[index],
  }));
  return {
    available: true as const,
    evidence: { measuredSkills: measured.length, completedLessons, totalLessons },
    strengths,
    needsPractice,
    progression: { nextLessons: available.slice(0, 5), weeklyPlan },
    limits:
      'Strengths and practice needs are relative only to measured skills, not proficiency grades, and are named only when at least 75 rating points separate them from the opposite end. Ratings require at least 3 attempts and deviation at most 150. Suggestions do not change course access. New offline activity may not be synced.',
  };
}
