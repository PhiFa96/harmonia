import { AudioManager, AudioRecorder } from 'react-native-audio-api';
import { PitchFramer } from '@harmonia/audio/pitch-detection';
import { MicrophoneError } from './types';
import type { MicrophoneSession, OnMicrophoneError, OnPcmFrame } from './types';

/** Native PCM callback only. File output is never enabled. */
export async function startMicrophone(
  onFrame: OnPcmFrame,
  onError: OnMicrophoneError,
  options: { readonly headphones?: boolean } = {},
): Promise<MicrophoneSession> {
  const permission = await AudioManager.requestRecordingPermissions();
  if (permission !== 'Granted') throw new MicrophoneError('permission');
  AudioManager.setAudioSessionOptions({
    iosCategory: 'playAndRecord',
    iosMode: 'measurement',
    iosOptions: options.headphones ? ['mixWithOthers'] : ['defaultToSpeaker', 'mixWithOthers'],
  });
  const recorder = new AudioRecorder();
  const framer = new PitchFramer();
  let stopped = false;
  let closing: Promise<void> | undefined;
  const isStopped = (): boolean => stopped;
  const restorePlayback = () => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playback',
      iosMode: 'default',
      iosOptions: ['mixWithOthers'],
    });
  };
  const stop = () => {
    if (closing) return closing;
    stopped = true;
    closing = (async () => {
      recorder.clearOnAudioReady();
      recorder.clearOnError();
      try {
        await recorder.stop();
      } finally {
        restorePlayback();
      }
    })();
    return closing;
  };
  try {
    recorder.onError(() => {
      if (stopped) return;
      void stop().catch(() => undefined);
      onError('interrupted');
    });
    const callback = recorder.onAudioReady(
      { sampleRate: 48000, bufferLength: 2048, channelCount: 1 },
      (event) => {
        if (stopped || event.buffer.numberOfChannels < 1) return;
        framer.push(
          event.buffer.getChannelData(0),
          event.buffer.sampleRate,
          event.when * 1000,
          onFrame,
        );
      },
    );
    if (callback.status === 'error') throw new MicrophoneError('unavailable');
    const started = await recorder.start();
    if (started.status === 'error') throw new MicrophoneError('unavailable');
    // onError can stop the recorder while its start promise is still pending.
    if (isStopped()) throw new MicrophoneError('interrupted');
    return { stop };
  } catch (error) {
    await stop();
    throw error;
  }
}
