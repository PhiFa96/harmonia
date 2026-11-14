export type MicrophoneErrorReason = 'permission' | 'unavailable' | 'interrupted' | 'no-input';

export class MicrophoneError extends Error {
  constructor(readonly reason: MicrophoneErrorReason) {
    super(reason);
  }
}

export interface MicrophoneSession {
  stop(): Promise<void>;
}

/** Fresh analyser snapshots are read synchronously; native buffers may arrive in a queue. */
export type PcmTiming = 'snapshot' | 'buffered';
/** End of the PCM window in the capture clock; its origin may differ from playback. */
export type OnPcmFrame = (
  samples: Float32Array,
  sampleRate: number,
  atMs: number,
  timing?: PcmTiming,
) => void;
export type OnMicrophoneError = (reason: MicrophoneErrorReason) => void;
