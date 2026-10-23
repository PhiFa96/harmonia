import type { ScoreTimeline } from '../../packages/notation/src/index.ts';
export interface DraftResult {
  points: number;
  maxPoints: number;
  qualified: boolean;
  code: string | null;
  revoked: boolean;
  stage: number;
  areas: { area: 'theory' | 'aural'; points: number; maxPoints: number }[];
}
export interface DraftAttempt {
  id: string;
  profile: string;
  startedAt: number;
  deadlineAt: number;
  serverNow: number;
  phase: 'active' | 'finished';
  reason?: 'completed' | 'submitted' | 'timeout';
  result?: DraftResult;
  question?: {
    index: number;
    total: number;
    area: 'theory' | 'aural';
    prompt: string;
    choices: { id: string; label: string }[];
    svg: string | null;
    description: { text: string }[] | null;
    audio: ScoreTimeline | null;
  };
}
export interface DraftState {
  profiles: { id: string; stage: number; version: number }[];
  attempts: DraftAttempt[];
}
