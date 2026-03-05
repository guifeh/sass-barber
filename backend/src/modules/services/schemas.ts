import { z } from 'zod';

export const createServiceBodySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(2000).optional().nullable(),
  durationMinutes: z.number().int().min(1).max(480),
  basePrice: z.number().int().min(0).optional().nullable(),
  active: z.boolean().optional().default(true),
});

export const updateServiceBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  durationMinutes: z.number().int().min(1).max(480).optional(),
  basePrice: z.number().int().min(0).optional().nullable(),
  active: z.boolean().optional(),
});

export type CreateServiceBody = z.infer<typeof createServiceBodySchema>;
export type UpdateServiceBody = z.infer<typeof updateServiceBodySchema>;
