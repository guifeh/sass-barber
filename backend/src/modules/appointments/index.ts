export { appointmentsRoutes } from './routes';
export { availabilityQuerySchema, createAppointmentBodySchema } from './schemas';
export type { AvailabilityQuery, CreateAppointmentBody } from './schemas';
export {
  getAvailability,
  createAppointment,
  listMyAppointments,
  listBarberAppointments,
  cancelAppointment,
  confirmAppointmentByToken,
  getFirstBarberProfile,
  getBarberProfileById,
  getBarberProfileByUserId,
} from './service';
export type { Slot } from './service';
