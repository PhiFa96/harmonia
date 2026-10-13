// Supabase CLI 2.119 erzeugt die öffentlichen Template-Mounts mit 0600;
// der unprivilegierte Kong-User benötigt Leserechte für den HTTP-Template-Server.
import { execFileSync } from 'node:child_process';
import { chmodSync, readFileSync } from 'node:fs';
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
for (const destination of destinations) {
  const mount = container.Mounts.find((m) => m.Destination === destination);
  if (!mount || !readFileSync(mount.Source).equals(expected))
    throw new Error(
      'Erwartete eigene E-Mail-Vorlage fehlt; keine anderen Dateien werden geändert.',
    );
  chmodSync(mount.Source, 0o644);
}
console.log('Zwei öffentliche lokale E-Mail-Vorlagen für den Template-Server lesbar.');
