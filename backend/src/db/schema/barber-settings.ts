import {
  pgTable,
  uuid,
  integer,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';
import { barberProfile } from './barber-profile';

/**
 * Weekly hours: day 0 = Sunday, 6 = Saturday.
 * Format: { "0": { "open": "09:00", "close": "18:00" }, ... }
 */
export type WeeklyHours = Record<
  string,
  { open: string; close: string } | null
>;

export const barberSettings = pgTable('barber_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  barberProfileId: uuid('barber_profile_id')
    .notNull()
    .unique()
    .references(() => barberProfile.id, { onDelete: 'cascade' }),
  slotIntervalMinutes: integer('slot_interval_minutes').notNull().default(30),
  minAdvanceBookingMinutes: integer('min_advance_booking_minutes'),
  maxAdvanceBookingDays: integer('max_advance_booking_days'),
  minCancelMinutes: integer('min_cancel_minutes'),
  weeklyHours: jsonb('weekly_hours').$type<WeeklyHours>(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
