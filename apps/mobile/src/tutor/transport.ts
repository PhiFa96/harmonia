import { tutorStreamEventSchema } from '@harmonia/content';
import type { TutorRequest, TutorStreamEvent } from '@harmonia/content';
export class TutorError extends Error {
  readonly code: string;
  constructor(code: string) {
    super('Tutor request failed');
    this.code = code;
  }
}
/** UTF-8 und SSE unabhängig von Paket-/Zeilengrenzen, inklusive CRLF und Keepalive. */
export class TutorEventDecoder {
  private decoder = new TextDecoder('utf-8', { fatal: true });
  private buffer = '';
  private lines: string[] = [];
  private event = '';
  private size = 0;
  constructor(privateOutput: (event: TutorStreamEvent) => void) {
    this.output = privateOutput;
  }
  private output: (event: TutorStreamEvent) => void;
  push(bytes: Uint8Array, final = false) {
    this.size += bytes.byteLength;
    if (this.size > 2_000_000) throw new TutorError('protocol');
    this.buffer += this.decoder.decode(bytes, { stream: !final });
    if (this.buffer.length > 262144) throw new TutorError('protocol');
    let end: number;
    while ((end = this.buffer.indexOf('\n')) >= 0) {
      const line = this.buffer.slice(0, end).replace(/\r$/, '');
      this.buffer = this.buffer.slice(end + 1);
      this.line(line);
    }
    if (final) {
      if (this.buffer) {
        this.line(this.buffer.replace(/\r$/, ''));
        this.buffer = '';
      }
      this.line('');
    }
  }
  private line(line: string) {
    if (!line) {
      if (this.lines.length) {
        let raw: unknown;
        try {
          raw = JSON.parse(this.lines.join('\n'));
        } catch {
          throw new TutorError('protocol');
        }
        const parsed = tutorStreamEventSchema.safeParse(raw);
        if (!parsed.success || parsed.data.type !== this.event) throw new TutorError('protocol');
        this.output(parsed.data);
      }
      this.lines = [];
      this.event = '';
      return;
    }
    if (line.startsWith('event:')) this.event = line.slice(6).replace(/^ /, '');
    if (line.startsWith('data:')) {
      this.lines.push(line.slice(5).replace(/^ /, ''));
      if (this.lines.reduce((n, v) => n + v.length, 0) > 262144) throw new TutorError('protocol');
    }
  }
}
export interface TutorCredentials {
  url: string;
  key: string;
  token: string;
}
const serverCodes = new Set([
  'auth',
  'subscription',
  'quota',
  'rate',
  'budget',
  'busy',
  'conflict',
  'context',
  'deleted',
  'missing',
  'recovered',
  'unavailable',
  'configuration',
  'storage',
  'content',
  'size',
  'schema',
  'attempt_required',
  'attempt_invalid',
  'attempt_expired',
]);
export class TutorTransport {
  private credentials: () => TutorCredentials;
  private fetcher: (url: string, init: RequestInit) => Promise<Response>;
  constructor(
    credentials: () => TutorCredentials,
    fetcher: (url: string, init: RequestInit) => Promise<Response>,
  ) {
    this.credentials = credentials;
    this.fetcher = fetcher;
  }
  private async request(
    path: string,
    method: string,
    body: unknown,
    signal: AbortSignal | undefined,
    stream: boolean,
  ): Promise<{ response: Response; dispose: () => void }> {
    const credentials = this.credentials(),
      controller = new AbortController();
    const abort = () => {
      controller.abort();
    };
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) controller.abort();
    const timer = setTimeout(abort, stream ? 105000 : 20000);
    const dispose = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    };
    try {
      const response = await this.fetcher(credentials.url + '/functions/v1/tutor' + path, {
        method,
        headers: {
          apikey: credentials.key,
          Authorization: 'Bearer ' + credentials.token,
          'Content-Type': 'application/json',
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const error: unknown = await response.json().catch(() => null);
        const code =
          error &&
          typeof error === 'object' &&
          'error' in error &&
          typeof error.error === 'string' &&
          serverCodes.has(error.error)
            ? error.error
            : response.status === 401
              ? 'auth'
              : 'server';
        throw new TutorError(code === 'missing' ? 'deleted' : code);
      }
      return { response, dispose };
    } catch (error) {
      dispose();
      if (error instanceof TutorError) throw error;
      throw new TutorError(signal?.aborted ? 'cancelled' : 'network');
    }
  }
  async json(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<unknown> {
    const { response, dispose } = await this.request(path, method, body, signal, false);
    try {
      return response.status === 204 ? null : await response.json();
    } catch {
      throw new TutorError('protocol');
    } finally {
      dispose();
    }
  }
  async stream(
    request: TutorRequest,
    signal: AbortSignal,
    output: (event: TutorStreamEvent) => void,
  ) {
    const { response, dispose } = await this.request('', 'POST', request, signal, true);
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      if (!response.headers.get('Content-Type')?.includes('text/event-stream') || !response.body)
        throw new TutorError('protocol');
      reader = response.body.getReader();
      const wire: { started: boolean; done: boolean } = { started: false, done: false };
      const decoder = new TutorEventDecoder((event) => {
        if (signal.aborted) throw new TutorError('cancelled');
        if (wire.done) throw new TutorError('protocol');
        if (event.type === 'meta' || event.type === 'replay') {
          if (
            wire.started ||
            event.id !== request.id ||
            event.conversationId !== request.conversationId
          )
            throw new TutorError('protocol');
          wire.started = true;
        }
        if (!wire.started) throw new TutorError('protocol');
        if (event.type === 'done') wire.done = true;
        output(event);
        if (event.type === 'error')
          throw new TutorError(event.code === 'storage' ? 'storage' : 'server');
      });
      for (;;) {
        if (signal.aborted) throw new TutorError('cancelled');
        const part = await reader.read();
        if (part.done) break;
        decoder.push(part.value);
      }
      decoder.push(new Uint8Array(), true);
      if (!wire.done) throw new TutorError('interrupted');
    } catch (error) {
      if (error instanceof TutorError) throw error;
      throw new TutorError(signal.aborted ? 'cancelled' : 'network');
    } finally {
      await reader?.cancel().catch(() => undefined);
      reader?.releaseLock();
      dispose();
    }
  }
}
