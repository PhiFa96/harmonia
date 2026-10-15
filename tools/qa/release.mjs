import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const budgets = JSON.parse(readFileSync(new URL('./budgets.json', import.meta.url), 'utf8'));
export function missingDeviceEvidence(input) {
  const missing = [],
    models = new Set(),
    counts = { ios: 0, android: 0 };
  const devices = Array.isArray(input?.devices) ? input.devices : [];
  if (devices.length < 4) missing.push('four devices');
  for (const [index, device] of devices.entries()) {
    const label = `devices[${index}]`;
    for (const field of ['deviceModel', 'osVersion', 'testedAt', 'reviewer', 'evidenceReference'])
      if (typeof device[field] !== 'string' || !device[field].trim())
        missing.push(label + '.' + field);
    if (!['ios', 'android'].includes(device.platform)) missing.push(label + '.platform');
    else counts[device.platform]++;
    if (device.deviceModel)
      models.add(device.platform + ':' + device.deviceModel.toLowerCase().trim());
    for (const [field, limit] of [
      ['startupMs', budgets.startupMs],
      ['lessonOpenMs', budgets.lessonOpenMs],
      ['audibleLatencyMs', budgets.audibleLatencyMs],
    ])
      if (
        typeof device[field] !== 'number' ||
        !Number.isFinite(device[field]) ||
        device[field] < 0 ||
        device[field] >= limit
      )
        missing.push(label + '.' + field);
    for (const field of [
      'screenReader',
      'text200Percent',
      'reducedMotion',
      'audioLatencyMeasured',
      'muteBackgroundHeadphones',
      'offlineResume',
      'purchaseSandbox',
      'privacyAccountSwitch',
    ])
      if (device.checks?.[field] !== true) missing.push(label + '.checks.' + field);
  }
  if (counts.ios < 2 || counts.android < 2) missing.push('two iOS and two Android devices');
  if (models.size < 4) missing.push('four distinct physical device models');
  return missing;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const input = JSON.parse(
    readFileSync(new URL('./device-readiness.json', import.meta.url), 'utf8'),
  );
  const missing = missingDeviceEvidence(input);
  if (missing.length) {
    console.error('Device release evidence still open: ' + missing.join(', '));
    process.exitCode = 1;
  } else
    console.log(
      'Four-device evidence fields and budgets checked; no device test inferred by this validator.',
    );
}
