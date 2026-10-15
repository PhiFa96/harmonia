import { assertBetaReady } from './readiness.mjs';
// EAS invokes this after dependencies are installed, before native compilation/signing.
// Existing development/preview/production workflows retain their own separate gates.
if (process.env.EAS_BUILD_PROFILE === 'beta') {
  assertBetaReady(process.env.EAS_BUILD_PLATFORM, { native: true, betaBuild: true });
  console.log('Beta prerequisite fields checked; Store submission is a separate action.');
}
