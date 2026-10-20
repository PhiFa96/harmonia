import type { HistoryStop } from './history-journey.ts';

/** Internal P4.12 draft. Sources are sections 0, 1, 3 and 4 of the P2 period article. */
export const historyStops: readonly HistoryStop[] = [
  {
    id: 'medieval',
    status: 'entwurf',
    source: { articleId: 'history.l2.period-contexts.article', section: 0 },
    sceneScore: 'treble | 4/4 | C4/4 D4/4 E4/4 G4/4',
    listeningScore: 'treble | 4/4 | D4/4 F4/4 E4/4 D4/4',
    knowledgeAnswer: 1,
    listeningAnswer: 0,
  },
  {
    id: 'renaissance',
    status: 'entwurf',
    source: { articleId: 'history.l2.period-contexts.article', section: 1 },
    sceneScore: 'treble | 4/4 | C4/4 D4/4 E4/4 F4/4 & G4/4 A4/4 B4/4 C5/4',
    listeningScore: 'treble | 4/4 | E4/4 F4/4 G4/4 A4/4 & C5/4 D5/4 E5/4 F5/4',
    knowledgeAnswer: 2,
    listeningAnswer: 1,
  },
  {
    id: 'baroque',
    status: 'entwurf',
    source: { articleId: 'history.l2.period-contexts.article', section: 3 },
    sceneScore: 'treble | 4/4 | (C4 G4)/4 (D4 A4)/4 (E4 B4)/4 (F4 C5)/4',
    listeningScore: 'treble | 4/4 | (G3 D4)/4 (A3 E4)/4 (B3 F4)/4 (C4 G4)/4',
    knowledgeAnswer: 0,
    listeningAnswer: 2,
  },
  {
    id: 'classical',
    status: 'entwurf',
    source: { articleId: 'history.l2.period-contexts.article', section: 4 },
    sceneScore: 'treble | 4/4 | C4/4 D4/4 E4/4 C4/4 | G4/4 F4/4 E4/4 C4/4',
    listeningScore: 'treble | 4/4 | E4/4 F4/4 G4/4 E4/4 | A4/4 G4/4 F4/4 E4/4',
    knowledgeAnswer: 1,
    listeningAnswer: 0,
  },
] as const;
