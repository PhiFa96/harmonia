import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { resolve, sep, isAbsolute } from 'node:path';
export const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
export function verifiedAsset(root, asset) {
  if (
    typeof asset.path !== 'string' ||
    isAbsolute(asset.path) ||
    asset.path.split(/[\\/]/).includes('..')
  )
    throw Error('Media path must stay inside its package');
  const base = realpathSync(root),
    file = realpathSync(resolve(root, asset.path));
  if (!file.startsWith(base + sep)) throw Error('Media path leaves its package');
  if (!/^[a-f0-9]{64}$/.test(asset.sha256) || sha256(file) !== asset.sha256)
    throw Error('Media checksum mismatch');
  return file;
}
export function pngDimensions(file) {
  const data = readFileSync(file);
  if (
    data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
    data.subarray(12, 16).toString() !== 'IHDR'
  )
    throw Error('Expected actual PNG screenshot');
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}
