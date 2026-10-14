import { Directory, File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
export function erasePrivateExports(scope: string) {
  for (const entry of new Directory(Paths.cache).list())
    if (
      entry instanceof File &&
      entry.name.startsWith('harmonia-data-' + scope + '-') &&
      entry.name.endsWith('.json')
    )
      entry.delete();
}
export function cleanPrivateExports(now = Date.now()) {
  for (const entry of new Directory(Paths.cache).list())
    if (
      entry instanceof File &&
      /^harmonia-(data|erasure)-[a-z0-9-]+\.json$/.test(entry.name) &&
      (entry.lastModified === null || entry.lastModified < now - 5 * 60000)
    )
      entry.delete();
}
export async function downloadPrivateFile(text: string, name: string) {
  if (!/^[a-z0-9-]+\.json$/.test(name)) throw new Error('Export filename');
  if (!(await isAvailableAsync())) throw new Error('Sharing unavailable');
  cleanPrivateExports();
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.write(text);
  try {
    await shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
  } finally {
    setTimeout(() => {
      if (file.exists) file.delete();
    }, 5 * 60000);
  }
}
