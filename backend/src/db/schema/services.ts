import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { barberProfile } from './barber-profile';

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  barberProfileId: uuid('barber_profile_id')
    .notNull()
    .references(() => barberProfile.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull(),
  basePrice: integer('base_price'), // stored in cents for precision
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
