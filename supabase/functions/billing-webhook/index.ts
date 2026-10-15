import { observeHandler } from '../_shared/operations.ts';
import { billingServer } from '../_shared/billing-server.ts';
const server = billingServer((key) => Deno.env.get(key));
Deno.serve(observeHandler('billing-webhook', (request) => server.webhook(request)));
