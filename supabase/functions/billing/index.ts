import { billingServer } from '../_shared/billing-server.ts';
const server = billingServer((key) => Deno.env.get(key));
Deno.serve((request) => server.account(request));
