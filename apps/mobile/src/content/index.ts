import { resolveLesson } from '@harmonia/content';
import { catalogue } from '@harmonia/content/catalogue';
// Der Lernpfad folgt in P2.11. Bis dahin: erste tatsächlich ausgelieferte Lektion.
export const firstLesson = resolveLesson(catalogue, catalogue.lessons[0]?.id ?? '');
