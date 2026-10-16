import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TUTOR_PROMPT_VERSION } from './tutor.ts';

const migrations = new URL('../../../supabase/migrations/', import.meta.url);

describe('tutor prompt version', () => {
  it('matches the latest database default for new requests', () => {
    const defaults = readdirSync(migrations)
      .filter((name) => name.endsWith('.sql'))
      .sort()
      .flatMap((name) =>
        [
          ...readFileSync(new URL(name, migrations), 'utf8').matchAll(
            /tutor_requests alter column prompt_version set default (\d+)/g,
          ),
        ].map((match) => Number(match[1])),
      );
    expect(defaults.at(-1)).toBe(TUTOR_PROMPT_VERSION);
  });
});
