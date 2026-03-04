import {
  pgTable,
  uuid,
  timestamp,
  varchar,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { barberProfile } from './barber-profile';
import { services } from './services';

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'pending_confirmation',
  'confirmed',
  'cancelled',
  'no_show',
]);

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  barberId: uuid('barber_id')
    .notNull()
    .references(() => barberProfile.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id')
    .notNull()
    .references(() => services.id, { onDelete: 'restrict' }),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  status: appointmentStatusEnum('status')
    .notNull()
    .default('pending_confirmation'),
  confirmationToken: varchar('confirmation_token', { length: 255 }),
  confirmationDeadline: timestamp('confirmation_deadline', {
    withTimezone: true,
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
