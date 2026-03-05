import { z } from 'zod';

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const availabilityQuerySchema = z.object({
  date: z.string().regex(isoDateRegex, 'Date must be YYYY-MM-DD'),
  serviceId: z.string().uuid(),
  barberId: z.string().uuid().optional(),
});

export const createAppointmentBodySchema = z.object({
  serviceId: z.string().uuid(),
  barberId: z.string().uuid(),
  startTime: z.string().min(1, 'startTime is required'),
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type CreateAppointmentBody = z.infer<typeof createAppointmentBodySchema>;
