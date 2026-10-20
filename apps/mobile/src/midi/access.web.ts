import type { MIDIAccess } from '@motiz88/react-native-midi';

let current: Promise<MIDIAccess> | null = null;

export function currentMidiAccess() {
  return current;
}

export function requestMidiAccess(): Promise<MIDIAccess> {
  if (!current) {
    const browser = navigator as unknown as {
      requestMIDIAccess?: (options: { sysex: boolean }) => Promise<unknown>;
    };
    if (!browser.requestMIDIAccess) return Promise.reject(new Error('unsupported'));
    const pending = browser.requestMIDIAccess({ sysex: false }) as unknown as Promise<MIDIAccess>;
    current = pending.catch((error: unknown) => {
      current = null;
      throw error;
    });
  }
  return current;
}
