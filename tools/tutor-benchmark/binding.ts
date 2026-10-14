import type { BenchmarkConfig } from './schema.ts';
export function officialEvidence(source: string, verifiedAt: string, now = Date.now()) {
  const url = new URL(source),
    age = now - Date.parse(verifiedAt);
  return (
    url.protocol === 'https:' &&
    !url.username &&
    !url.password &&
    ['platform.claude.com', 'docs.anthropic.com', 'www.anthropic.com', 'anthropic.com'].includes(
      url.hostname,
    ) &&
    age >= 0 &&
    age <= 30 * 86400000
  );
}
export function verifiedBinding(config: BenchmarkConfig) {
  return (
    config.variants.every((v) => /^claude-[a-z0-9.-]+$/.test(v.model)) &&
    officialEvidence(config.modelEvidence.source, config.modelEvidence.verifiedAt) &&
    officialEvidence(config.streamTariff.source, config.streamTariff.verifiedAt) &&
    officialEvidence(config.batchTariff.source, config.batchTariff.verifiedAt)
  );
}
