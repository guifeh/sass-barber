import { relations } from 'drizzle-orm';
import { users } from './users';
import { barberProfile } from './barber-profile';
import { services } from './services';
import { appointments } from './appointments';
import { barberSettings } from './barber-settings';

export { users, userRoleEnum } from './users';
export { barberProfile } from './barber-profile';
export { services } from './services';
export { appointments, appointmentStatusEnum } from './appointments';
export {
  barberSettings,
  type WeeklyHours,
} from './barber-settings';

export const usersRelations = relations(users, ({ one, many }) => ({
  barberProfile: one(barberProfile),
  appointments: many(appointments),
}));

export const barberProfileRelations = relations(barberProfile, ({
  one,
  many,
}) => ({
  user: one(users),
  appointments: many(appointments),
  settings: one(barberSettings),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  user: one(users),
  barber: one(barberProfile),
  service: one(services),
}));

export const barberSettingsRelations = relations(barberSettings, ({ one }) => ({
  barberProfile: one(barberProfile),
}));
