import type { ScoreTimeline } from '../../packages/notation/src/index.ts';
export interface BankEntry {
  key: string;
  kind: 'lesson' | 'exercise';
  label: string;
  tasks: number;
}
export interface AssignmentBlock {
  key: string;
  count: number;
}
export interface Assignment {
  id: string;
  classId: string;
  title: string;
  dueAt: string;
  closedAt: string | null;
  total: number;
  contentVersion: number;
  blocks: AssignmentBlock[];
}
export interface AssignmentResult {
  answered: number;
  correct: number;
  total: number;
  reason: 'completed' | 'submitted' | 'deadline' | 'closed';
  finishedAt?: string;
  areas?: { area: 'theory' | 'aural'; total: number; correct: number }[];
}
export interface AssignmentView extends Assignment {
  serverNow: string;
  phase: 'ready' | 'active' | 'finished' | 'closed' | 'expired';
  result?: AssignmentResult;
  question?: {
    index: number;
    total: number;
    prompt: string;
    choices: { id: string; label: string }[];
    svg: string | null;
    description: string | null;
    audio: ScoreTimeline | null;
  };
}
export interface AssignmentReport extends Assignment {
  learners: { actor: string; alias: string; sharing: boolean; result: AssignmentResult | null }[];
  summary: {
    recipients: number;
    shared: number;
    submitted: number;
    correct: number;
    total: number;
  };
}
