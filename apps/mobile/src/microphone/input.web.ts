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
  const stop = async () => {
    if (stopped) return;
    stopped = true;
    if (timer) clearInterval(timer);
    source?.disconnect();
    for (const track of stream.getTracks()) track.stop();
    if (context) await context.close();
  };
  try {
    context = new AudioContext();
    if (stream.getAudioTracks().length === 0) throw new MicrophoneError('unavailable');
    source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = PITCH_WINDOW;
    source.connect(analyser);
    const frame = new Float32Array(PITCH_WINDOW);
    await context.resume();
    if (context.state !== 'running') throw new MicrophoneError('unavailable');
    stream.getAudioTracks()[0]?.addEventListener('ended', () => {
      onError('interrupted');
    });
    timer = setInterval(() => {
      if (stopped) return;
      analyser.getFloatTimeDomainData(frame);
      onFrame(frame, context?.sampleRate ?? 48000, performance.now());
    }, 40);
    return { stop };
  } catch (error) {
    await stop();
    throw error;
  }
}
