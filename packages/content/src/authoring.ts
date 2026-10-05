import data from './catalogue.json' with { type: 'json' };
import { parseCatalogue, resolveLesson } from './catalogue.ts';
export const catalogue = parseCatalogue(data);
const lesson = resolveLesson(catalogue, 'fundament.reading-and-listening.1');
if (!lesson) throw new Error('Erste Vorschaulektion fehlt');
export const firstLesson = lesson;
