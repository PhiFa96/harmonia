import { z } from 'zod';
export const cancellationBodySchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    email: z
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    contract: z.string().trim().max(256),
    tier: z.enum(['premium', 'max']),
    kind: z.enum(['ordinary', 'extraordinary']),
    reason: z.string().trim().max(2000),
    date: z.union([z.literal('earliest'), z.iso.date()]),
    locale: z.enum(['de', 'en-US', 'en-GB']),
  })
  .strict()
  .refine((value) => value.kind !== 'extraordinary' || value.reason.length > 0);
export const cancellationRequestSchema = z
  .object({ id: z.uuid(), body: cancellationBodySchema })
  .strict();
export type CancellationBody = z.infer<typeof cancellationBodySchema>;
export const cancellationReceiptSchema = z
  .object({
    id: z.uuid(),
    receivedAt: z.iso.datetime({ offset: true }),
    status: z.literal('received'),
  })
  .strict();
