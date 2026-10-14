declare const Deno: {
  readonly args: string[];
  exit(code?: number): never;
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): unknown;
};
