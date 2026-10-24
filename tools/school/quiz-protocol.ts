import type { AssignmentView } from './assignment-protocol.ts';
export interface QuizScore {
  correct: number;
  answered: number;
  total: number;
}
export interface QuizView {
  id: string;
  classId: string;
  title: string;
  phase: 'lobby' | 'question' | 'review' | 'finished' | 'cancelled';
  index: number;
  total: number;
  seconds: number;
  dueAt: string | null;
  serverNow: string;
  revision: number;
  teacher: boolean;
  mode: 'teacher' | 'learner' | 'projector';
  players: number;
  answered: number;
  question?: AssignmentView['question'];
  solution?: string;
  board: { nickname: string; score: number; rank: number }[];
  self?: { nickname: string; ranking: boolean; answered: boolean; result?: QuizScore };
  results?: { alias: string; sharing: boolean; result: QuizScore | null }[];
  summary?: { included: number; participants: number; correct: number; total: number };
}
