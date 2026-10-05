import data from './published-content.json' with { type: 'json' };
import type { contentMessages as authoredMessages } from './authoring-content-messages.ts';
// Der Typ kennt die Schlüssel; zur Laufzeit enthält die öffentliche Datei nur freigegebene Texte.
export const contentMessages = data as unknown as typeof authoredMessages;
