import { z } from 'zod';
export const accountSettingsSchema = z
  .object({
    locale: z.enum(['de', 'en-US', 'en-GB']).nullable(),
    appearance: z.enum(['system', 'light', 'dark']),
    haptics: z.boolean(),
    reduceMotion: z.boolean(),
    noteNaming: z.enum(['auto', 'de', 'intl']),
    harmonySystem: z.enum(['functions', 'roman', 'both']),
    sound: z.boolean(),
    referenceHz: z.number().int().min(415).max(466),
    displayName: z.string().trim().min(1).max(60).nullable(),
    goal: z.enum(['hobby', 'school', 'exam', 'ensemble']),
    experience: z.enum(['new', 'basics', 'experienced']),
  })
  .strict();
export type AccountSettings = z.infer<typeof accountSettingsSchema>;
export const accountSettingsPatchSchema = accountSettingsSchema
  .partial()
  .strict()
  .refine((patch) => Object.keys(patch).length > 0);
export const DEFAULT_ACCOUNT_SETTINGS: AccountSettings = {
  locale: null,
  appearance: 'system',
  haptics: true,
  reduceMotion: false,
  noteNaming: 'auto',
  harmonySystem: 'both',
  sound: true,
  referenceHz: 440,
  displayName: null,
  goal: 'hobby',
  experience: 'new',
};
export const storedAccountSettingsSchema = z
  .object({
    version: z.literal(1),
    settings: accountSettingsSchema,
    dirty: accountSettingsSchema.partial().strict(),
  })
  .strict();
export type StoredAccountSettings = z.infer<typeof storedAccountSettingsSchema>;
