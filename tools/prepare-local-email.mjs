// Supabase CLI 2.119 erzeugt die öffentlichen Template-Mounts mit 0600;
// der unprivilegierte Kong-User benötigt Leserechte für den HTTP-Template-Server.
import { execFileSync } from 'node:child_process';
import { chmodSync, readFileSync, statSync } from 'node:fs';
const expected = readFileSync(new URL('../supabase/templates/email-code.html', import.meta.url));
const [container] = JSON.parse(
  execFileSync('docker', ['inspect', 'supabase_kong_harmonia'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
);
const destinations = [
  '/home/kong/templates/email/confirmation.html',
  '/home/kong/templates/email/magic_link.html',
];
let changed = false;
for (const destination of destinations) {
  const mount = container.Mounts.find((m) => m.Destination === destination);
  if (!mount || !readFileSync(mount.Source).equals(expected))
    throw new Error(
      'Erwartete eigene E-Mail-Vorlage fehlt; keine anderen Dateien werden geändert.',
    );
  changed ||= (statSync(mount.Source).mode & 0o777) !== 0o644;
  chmodSync(mount.Source, 0o644);
}
// Auth 2.197 lädt früh und cached nach einem 403 die Standardvorlage.
// Nach der öffentlichen Dateivorbereitung gezielt neu laden, ohne Datenbankverlust.
if (changed) {
  execFileSync('docker', ['restart', 'supabase_auth_harmonia'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let healthy = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const response = await fetch('http://127.0.0.1:54321/auth/v1/health', {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) {
        healthy = true;
        break;
      }
    } catch {
      /* Container startet noch. */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!healthy) throw new Error('Lokale Auth nach Template-Vorbereitung nicht bereit.');
}
console.log('Zwei öffentliche lokale E-Mail-Vorlagen für den Template-Server lesbar.');
