export type MicrophoneErrorReason = 'permission' | 'unavailable' | 'interrupted' | 'no-input';

export class MicrophoneError extends Error {
  constructor(readonly reason: MicrophoneErrorReason) {
    super(reason);
  }
}

export interface MicrophoneSession {
  stop(): Promise<void>;
}

/** Window timestamp in the capture clock's milliseconds; its origin may differ from playback. */
export type OnPcmFrame = (samples: Float32Array, sampleRate: number, atMs: number) => void;
export type OnMicrophoneError = (reason: MicrophoneErrorReason) => void;
