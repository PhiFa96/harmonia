/** P4.12: authoring data is selected only by the development Metro resolver. */
export type HistoryEraId = 'medieval' | 'renaissance' | 'baroque' | 'classical';
export type HistoryChoice = 0 | 1 | 2;

export interface HistoryStop {
  readonly id: HistoryEraId;
  readonly status: 'entwurf';
  /** Exact section of the versioned P3 knowledge article supporting the narrative. */
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
