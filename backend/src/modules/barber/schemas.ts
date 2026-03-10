import { z } from 'zod';

export const updateBarberProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
});

export type UpdateBarberProfileBody = z.infer<typeof updateBarberProfileSchema>;

const dailyHoursSchema = z.object({
  open: z.string().regex(/^([01]\\d|2[0-3]):([0-5]\\d)$/, 'Formato HH:MM'),
  close: z.string().regex(/^([01]\\d|2[0-3]):([0-5]\\d)$/, 'Formato HH:MM'),
});

export const updateBarberSettingsSchema = z.object({
  slotIntervalMinutes: z.number().int().min(5).max(120).optional(),
  minAdvanceBookingMinutes: z.number().int().min(0).nullable().optional(),
  maxAdvanceBookingDays: z.number().int().min(1).nullable().optional(),
  minCancelMinutes: z.number().int().min(0).nullable().optional(),
  weeklyHours: z.record(z.string(), dailyHoursSchema).nullable().optional(),
});

export type UpdateBarberSettingsBody = z.infer<typeof updateBarberSettingsSchema>;
