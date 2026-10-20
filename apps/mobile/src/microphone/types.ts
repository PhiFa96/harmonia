export type MicrophoneErrorReason = 'permission' | 'unavailable' | 'interrupted';

export class MicrophoneError extends Error {
  constructor(readonly reason: MicrophoneErrorReason) {
    super(reason);
  }
}

export interface MicrophoneSession {
  stop(): Promise<void>;
}

export type OnPcmFrame = (samples: Float32Array, sampleRate: number, atMs: number) => void;
export type OnMicrophoneError = (reason: MicrophoneErrorReason) => void;
