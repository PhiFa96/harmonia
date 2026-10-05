import data from './lessons/reading-and-listening.json' with { type: 'json' };
import { lessonSchema } from './schema.ts';
export * from './schema.ts';
export const firstLesson = lessonSchema.parse(data);
