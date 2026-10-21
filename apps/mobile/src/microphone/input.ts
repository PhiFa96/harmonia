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
  const restorePlayback = () => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playback',
      iosMode: 'default',
      iosOptions: ['mixWithOthers'],
    });
  };
  const stop = async () => {
    if (stopped) return;
    stopped = true;
    recorder.clearOnAudioReady();
    recorder.clearOnError();
    try {
      await recorder.stop();
    } finally {
      restorePlayback();
    }
  };
  try {
    recorder.onError(() => {
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
    return { stop };
  } catch (error) {
    await stop();
    throw error;
  }
}
