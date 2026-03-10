import { db } from '../../db';
import { barberProfile, barberSettings } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { UpdateBarberProfileBody, UpdateBarberSettingsBody } from './schemas';

export async function getBarberProfileByUserId(userId: string) {
  const [profile] = await db
    .select()
    .from(barberProfile)
    .where(eq(barberProfile.userId, userId));
  return profile ?? null;
}

export async function getBarberSettingsByProfileId(barberProfileId: string) {
  const [settings] = await db
    .select()
    .from(barberSettings)
    .where(eq(barberSettings.barberProfileId, barberProfileId));
  return settings ?? null;
}

export async function updateBarberProfile(
  barberProfileId: string,
  data: UpdateBarberProfileBody
) {
  const updates: Partial<{
    displayName: string;
    bio: string | null;
    photoUrl: string | null;
    updatedAt: Date;
  }> = { updatedAt: new Date() };

  if (data.displayName !== undefined) updates.displayName = data.displayName;
  if (data.bio !== undefined) updates.bio = data.bio;
  if (data.photoUrl !== undefined) updates.photoUrl = data.photoUrl;

  const [updated] = await db
    .update(barberProfile)
    .set(updates)
    .where(eq(barberProfile.id, barberProfileId))
    .returning();
  
  return updated ?? null;
}

export async function updateBarberSettings(
  barberProfileId: string,
  data: UpdateBarberSettingsBody
) {
  const updates: Partial<{
    slotIntervalMinutes: number;
    minAdvanceBookingMinutes: number | null;
    maxAdvanceBookingDays: number | null;
    minCancelMinutes: number | null;
    weeklyHours: any;
    updatedAt: Date;
  }> = { updatedAt: new Date() };

  if (data.slotIntervalMinutes !== undefined) updates.slotIntervalMinutes = data.slotIntervalMinutes;
  if (data.minAdvanceBookingMinutes !== undefined) updates.minAdvanceBookingMinutes = data.minAdvanceBookingMinutes;
  if (data.maxAdvanceBookingDays !== undefined) updates.maxAdvanceBookingDays = data.maxAdvanceBookingDays;
  if (data.minCancelMinutes !== undefined) updates.minCancelMinutes = data.minCancelMinutes;
  if (data.weeklyHours !== undefined) updates.weeklyHours = data.weeklyHours;

  const [updated] = await db
    .update(barberSettings)
    .set(updates)
    .where(eq(barberSettings.barberProfileId, barberProfileId))
    .returning();
  
  return updated ?? null;
}
