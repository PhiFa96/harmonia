// Only static classifications reach CI output. Never print a line from the private startup log.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
export function startupFailureKinds(text) {
  const patterns = {
    registry_rate_limit: /toomanyrequests|pull rate limit|unauthenticated pull/i,
    image_unavailable: /manifest unknown|no matching manifest|pull access denied/i,
    invalid_configuration: /failed to parse config|invalid config|unknown config|cannot unmarshal/i,
    migration_failed: /failed to apply migration|applying migration[\s\S]*?ERROR:|sqlstate/i,
    template_verification_failed: /Erwartete eigene E-Mail-Vorlage fehlt/i,
    template_auth_unhealthy: /Lokale Auth nach Template-Vorbereitung nicht bereit/i,
    container_unhealthy: /container.*(?:unhealthy|not ready)|health check.*failed/i,
    docker_unavailable: /cannot connect to.*docker|permission denied.*docker.sock/i,
    tls_verification_failed: /certificate signed by unknown authority|certificate verify failed/i,
    network_failure: /connection refused|i\/o timeout|network is unreachable|no such host/i,
    heap_exhausted: /heap out of memory|reached heap limit|allocation failed.*heap/i,
  };
  const result = Object.entries(patterns)
    .filter(([, pattern]) => pattern.test(text))
    .map(([kind]) => kind);
  return result.length ? result : ['unclassified_startup_failure'];
}
export function diagnosticsMain(path) {
  const kinds = startupFailureKinds(readFileSync(path, 'utf8'));
  console.error('::error::Supabase startup diagnostic: ' + kinds.join(', '));
  for (const service of ['db', 'auth', 'kong', 'rest', 'edge_runtime', 'inbucket']) {
    const name = 'supabase_' + service + '_harmonia';
    try {
      const state = execFileSync(
        'docker',
        [
          'inspect',
          '--format',
          '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}',
          name,
        ],
        {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      ).trim();
      if (
        /^(?:created|running|paused|restarting|removing|exited|dead)(?: (?:starting|healthy|unhealthy))?$/.test(
          state,
        )
      )
        console.error('::notice::' + name + ': ' + state);
    } catch {
      /* Missing containers and daemon failures do not disclose raw diagnostics. */
    }
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  diagnosticsMain(process.argv[2]);
