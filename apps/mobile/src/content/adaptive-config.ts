export type AdaptiveGroup = 'control' | 'adaptive';
export function lessonSelectionExperiment(owner: string) {
  return process.env.EXPO_PUBLIC_ADAPTIVE_LESSONS === 'beta' && owner !== 'guest'
    ? ('p302-beta-v1' as const)
    : undefined;
}
/** Explicit beta opt-in; assignment stays stable per signed-in account across devices. */
export function lessonSelectionGroup(owner: string): AdaptiveGroup {
  const mode = process.env.EXPO_PUBLIC_ADAPTIVE_LESSONS;
  if (mode === 'control') return 'control';
  if (mode !== 'beta') return 'adaptive';
  if (owner === 'guest') return 'control';
  let hash = 2166136261;
  for (let i = 0; i < owner.length; i++)
    hash = Math.imul(hash ^ owner.charCodeAt(i), 16777619) >>> 0;
  return hash % 2 === 0 ? 'control' : 'adaptive';
}
