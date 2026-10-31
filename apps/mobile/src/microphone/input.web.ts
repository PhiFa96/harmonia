import { PITCH_WINDOW } from '@harmonia/audio/pitch-detection';
import { MicrophoneError } from './types';
import type { MicrophoneSession, OnMicrophoneError, OnPcmFrame } from './types';

/** Browser capture stays inside this AudioContext; it has no output or upload path. */
export async function startMicrophone(
  onFrame: OnPcmFrame,
  onError: OnMicrophoneError,
): Promise<MicrophoneSession> {
  if (typeof navigator === 'undefined' || !('mediaDevices' in navigator))
    throw new MicrophoneError('unavailable');
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      video: false,
    });
  } catch (error) {
    if (
      error instanceof DOMException &&
      ['NotAllowedError', 'PermissionDeniedError'].includes(error.name)
    )
      throw new MicrophoneError('permission');
    throw new MicrophoneError('unavailable');
  }
  let context: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let stopped = false;
  let closing: Promise<void> | undefined;
  let track: MediaStreamTrack | undefined;
  let received = false;
  const interrupted = () => {
    if (stopped) return;
    void stop().catch(() => undefined);
    onError('interrupted');
  };
  const muted = () => {
    if (received) interrupted();
  };
  const stateChanged = () => {
    if (context?.state !== 'running') interrupted();
  };
  const stop = () => {
    if (closing) return closing;
    stopped = true;
    if (timer) clearInterval(timer);
    track?.removeEventListener('ended', interrupted);
    track?.removeEventListener('mute', muted);
    context?.removeEventListener('statechange', stateChanged);
    closing = (async () => {
      try {
        source?.disconnect();
      } finally {
        for (const track of stream.getTracks()) track.stop();
        if (context) await context.close();
      }
    })();
    return closing;
  };
  try {
    context = new AudioContext();
    track = stream.getAudioTracks()[0];
    if (!track || track.readyState === 'ended') throw new MicrophoneError('unavailable');
    source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = PITCH_WINDOW;
    source.connect(analyser);
    const frame = new Float32Array(PITCH_WINDOW);
    await context.resume();
    if (context.state !== 'running') throw new MicrophoneError('unavailable');
    track.addEventListener('ended', interrupted);
    track.addEventListener('mute', muted);
    context.addEventListener('statechange', stateChanged);
    timer = setInterval(() => {
      if (stopped) return;
      if (context?.state !== 'running' || track?.readyState !== 'live' || !track.enabled) {
        interrupted();
        return;
      }
      if (track.muted) {
        muted();
        return;
      }
      analyser.getFloatTimeDomainData(frame);
      received = true;
      onFrame(frame, context.sampleRate, performance.now());
    }, 40);
    return { stop };
  } catch (error) {
    await stop();
    throw error;
  }
}
