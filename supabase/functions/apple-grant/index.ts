import { appleGrantHandler } from '../_shared/apple-grant.ts';
Deno.serve(appleGrantHandler((key) => Deno.env.get(key)));
