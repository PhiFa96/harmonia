import type { MIDIAccess } from '@motiz88/react-native-midi';

let current: Promise<MIDIAccess> | null = null;

export function currentMidiAccess() {
  return current;
}

/** Kept for the app session so native device callbacks are not registered on every task. */
export function requestMidiAccess(): Promise<MIDIAccess> {
  current ??= import('@motiz88/react-native-midi')
    .then(({ requestMIDIAccess }) => requestMIDIAccess({ sysex: false }))
    .catch((error: unknown) => {
      current = null;
      throw error;
    });
  return current;
}
