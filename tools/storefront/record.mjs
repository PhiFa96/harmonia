// Actual Chromium frames and capture timestamps, encoded later by the installed ffmpeg.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
export async function recordPage(page, directory) {
  mkdirSync(directory, { recursive: true });
  const session = await page.context().newCDPSession(page),
    frames = [];
  let firstFrame,
    firstFailure,
    started = 0,
    failure = null;
  const ready = new Promise((resolve, reject) => {
    firstFrame = resolve;
    firstFailure = reject;
  });
  const timer = setTimeout(
    () => firstFailure(Error('Chromium screencast did not produce a frame')),
    10000,
  );
  const frame = (event) => {
    try {
      const timestamp = event.metadata.timestamp;
      if (
        !Number.isFinite(timestamp) ||
        frames.length >= 10000 ||
        (frames.length && timestamp < frames.at(-1).timestamp)
      )
        throw Error('Invalid Chromium frame timeline');
      const file = `frame-${String(frames.length).padStart(6, '0')}.jpeg`;
      writeFileSync(join(directory, file), Buffer.from(event.data, 'base64'));
      frames.push({ file, timestamp });
      if (frames.length === 1) {
        started = performance.now();
        firstFrame();
      }
    } catch (error) {
      failure = error;
      firstFailure(error);
    }
    void session.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch((error) => {
      failure = error;
    });
  };
  session.on('Page.screencastFrame', frame);
  try {
    await session.send('Page.enable');
    await session.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 90,
      maxWidth: 440,
      maxHeight: 956,
      everyNthFrame: 1,
    });
    await ready;
  } catch (error) {
    session.off('Page.screencastFrame', frame);
    await session.detach();
    throw error;
  } finally {
    clearTimeout(timer);
  }
  return {
    async stop() {
      await session.send('Page.stopScreencast');
      const durationSeconds = (performance.now() - started) / 1000;
      session.off('Page.screencastFrame', frame);
      await session.detach();
      if (failure) throw failure;
      const lines = ['ffconcat version 1.0'];
      for (let i = 0; i < frames.length; i++) {
        const duration =
          i < frames.length - 1
            ? frames[i + 1].timestamp - frames[i].timestamp
            : durationSeconds - (frames[i].timestamp - frames[0].timestamp);
        lines.push('file ' + frames[i].file, 'duration ' + Math.max(0.001, duration).toFixed(6));
      }
      lines.push('file ' + frames.at(-1).file);
      writeFileSync(join(directory, 'recording.ffconcat'), lines.join('\n') + '\n');
      writeFileSync(
        join(directory, 'timeline.json'),
        JSON.stringify(
          { transport: 'Chromium CDP Page.startScreencast', durationSeconds, frames },
          null,
          2,
        ) + '\n',
      );
    },
  };
}
