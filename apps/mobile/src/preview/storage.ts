import { getLearningRepository } from '@/storage/learning';
import { comparePreviewMemory, readPreviewMemory } from './memory.ts';
export function previewStore(scope: string, memory: boolean) {
  return {
    async read() {
      if (memory) return readPreviewMemory(scope);
      const repo = await getLearningRepository();
      await repo.prunePreviews(Date.now());
      return repo.preview(scope);
    },
    async compare(expected: string | null, next: string | null) {
      return memory
        ? comparePreviewMemory(scope, expected, next)
        : (await getLearningRepository()).comparePreview(scope, expected, next);
    },
  };
}
