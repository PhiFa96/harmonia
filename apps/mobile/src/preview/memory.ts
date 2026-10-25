import { LEVEL_FIVE_PREVIEW_TTL, levelFivePreviewSchema } from '@harmonia/content';
import { assertPrivacyWrite } from '@/privacy/guard';
const drafts = new Map<string, string>();
export function erasePreviewMemory(scope: string) {
  drafts.delete(scope);
}
export function readPreviewMemory(scope: string, now = Date.now()) {
  const raw = drafts.get(scope) ?? null;
  if (raw) {
    const draft = levelFivePreviewSchema.parse(JSON.parse(raw) as unknown);
    if (draft.createdAt > now || now - draft.createdAt >= LEVEL_FIVE_PREVIEW_TTL) {
      drafts.delete(scope);
      return null;
    }
  }
  return raw;
}
export function comparePreviewMemory(scope: string, expected: string | null, next: string | null) {
  const draft = next === null ? null : levelFivePreviewSchema.parse(JSON.parse(next) as unknown);
  assertPrivacyWrite(scope, draft?.id);
  if ((drafts.get(scope) ?? null) !== expected) return false;
  if (next === null) drafts.delete(scope);
  else drafts.set(scope, next);
  return true;
}
