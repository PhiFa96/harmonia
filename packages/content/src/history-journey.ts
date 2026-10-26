/** P4.12: authoring data is selected only by the development Metro resolver. */
export type HistoryEraId = 'medieval' | 'renaissance' | 'baroque' | 'classical';
export type HistoryChoice = 0 | 1 | 2;

/** Local scripted dialogue only; no chat, assessment or persisted history. */
export interface HistoryInterviewState {
  readonly selected: HistoryChoice | null;
  readonly asked: readonly HistoryChoice[];
}

export function createHistoryInterview(): HistoryInterviewState {
  return { selected: null, asked: [] };
}

export function askHistoryInterview(
  state: HistoryInterviewState,
  choice: HistoryChoice,
): HistoryInterviewState {
  if (![0, 1, 2].includes(choice) || state.selected === choice) return state;
  return {
    selected: choice,
    asked: state.asked.includes(choice) ? state.asked : [...state.asked, choice],
  };
}

export interface HistoryStop {
  readonly id: HistoryEraId;
  readonly status: 'entwurf';
  /** Exact section of the versioned P2.08 article; linked through P3.19. */
  readonly source: { readonly articleId: string; readonly section: number };
  /** Original teaching models, never presented as period recordings or transcriptions. */
  readonly sceneScore: string;
  readonly listeningScore: string;
  readonly knowledgeAnswer: HistoryChoice;
  readonly listeningAnswer: HistoryChoice;
}

export function answerHistoryQuestion(correct: HistoryChoice, choice: HistoryChoice) {
  return choice === correct;
}

/** Volatile preview interaction, never a learning or reward record. */
export interface HistoryQuestionState {
  readonly choice: HistoryChoice | null;
  readonly feedback: 'unanswered' | 'incorrect' | 'correct';
  readonly attempts: number;
}

export function createHistoryQuestion(): HistoryQuestionState {
  return { choice: null, feedback: 'unanswered', attempts: 0 };
}

export function chooseHistoryAnswer(
  state: HistoryQuestionState,
  choice: HistoryChoice,
): HistoryQuestionState {
  if (state.feedback === 'correct' || state.choice === choice) return state;
  return { ...state, choice, feedback: 'unanswered' };
}

export function checkHistoryQuestion(
  state: HistoryQuestionState,
  correct: HistoryChoice,
  ready = true,
): HistoryQuestionState {
  if (!ready || state.choice === null || state.feedback !== 'unanswered') return state;
  return {
    ...state,
    attempts: state.attempts + 1,
    feedback: answerHistoryQuestion(correct, state.choice) ? 'correct' : 'incorrect',
  };
}
