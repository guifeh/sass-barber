import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { updateBarberProfileSchema, updateBarberSettingsSchema } from './schemas';
import {
  getBarberProfileByUserId,
  getBarberSettingsByProfileId,
  updateBarberProfile,
  updateBarberSettings,
} from './service';
import { authenticate, requireRole } from '../auth/guards';

export async function barberRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
): Promise<void> {
  app.get('/barber/profile/me', {
    preHandler: [authenticate, requireRole('barbeiro')],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            displayName: { type: 'string' },
            bio: { type: ['string', 'null'] },
            photoUrl: { type: ['string', 'null'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        404: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      },
    },
    handler: async (request, reply) => {
      const user = request.user as { sub: string };
      const profile = await getBarberProfileByUserId(user.sub);
      if (!profile) {
        return reply.status(404).send({ message: 'Profile not found' });
      }
      return reply.send(profile);
    },
  });

  app.put('/barber/profile/me', {
    preHandler: [authenticate, requireRole('barbeiro')],
    schema: {
      body: {
        type: 'object',
        properties: {
          displayName: { type: 'string' },
          bio: { type: ['string', 'null'] },
          photoUrl: { type: ['string', 'null'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            displayName: { type: 'string' },
            bio: { type: ['string', 'null'] },
            photoUrl: { type: ['string', 'null'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        400: {
          type: 'object',
          properties: { message: { type: 'string' }, errors: { type: 'object', additionalProperties: true } },
        },
        404: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      },
    },
    handler: async (request, reply) => {
      const user = request.user as { barberProfileId?: string };
      if (!user.barberProfileId) {
        return reply.status(404).send({ message: 'Profile not found' });
      }

      const parsed = updateBarberProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          message: 'Validation failed',
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const updated = await updateBarberProfile(user.barberProfileId, parsed.data);
      if (!updated) {
        return reply.status(404).send({ message: 'Profile not found' });
      }
      return reply.send(updated);
    },
  });

  app.get('/barber/settings/me', {
    preHandler: [authenticate, requireRole('barbeiro')],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            barberProfileId: { type: 'string', format: 'uuid' },
            slotIntervalMinutes: { type: 'integer' },
            minAdvanceBookingMinutes: { type: ['integer', 'null'] },
            maxAdvanceBookingDays: { type: ['integer', 'null'] },
            minCancelMinutes: { type: ['integer', 'null'] },
            weeklyHours: { type: ['object', 'null'], additionalProperties: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        404: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      },
    },
    handler: async (request, reply) => {
      const user = request.user as { barberProfileId?: string };
      if (!user.barberProfileId) {
        return reply.status(404).send({ message: 'Settings not found' });
      }
      const settings = await getBarberSettingsByProfileId(user.barberProfileId);
      if (!settings) {
        return reply.status(404).send({ message: 'Settings not found' });
      }
      return reply.send(settings);
    },
  });

  app.put('/barber/settings/me', {
    preHandler: [authenticate, requireRole('barbeiro')],
    schema: {
      body: {
        type: 'object',
        properties: {
          slotIntervalMinutes: { type: 'integer' },
          minAdvanceBookingMinutes: { type: ['integer', 'null'] },
          maxAdvanceBookingDays: { type: ['integer', 'null'] },
          minCancelMinutes: { type: ['integer', 'null'] },
          weeklyHours: { type: ['object', 'null'], additionalProperties: true },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            barberProfileId: { type: 'string', format: 'uuid' },
            slotIntervalMinutes: { type: 'integer' },
            minAdvanceBookingMinutes: { type: ['integer', 'null'] },
            maxAdvanceBookingDays: { type: ['integer', 'null'] },
            minCancelMinutes: { type: ['integer', 'null'] },
            weeklyHours: { type: ['object', 'null'], additionalProperties: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        400: {
          type: 'object',
          properties: { message: { type: 'string' }, errors: { type: 'object', additionalProperties: true } },
        },
        404: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      },
    },
    handler: async (request, reply) => {
      const user = request.user as { barberProfileId?: string };
      if (!user.barberProfileId) {
        return reply.status(404).send({ message: 'Settings not found' });
      }

      const parsed = updateBarberSettingsSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          message: 'Validation failed',
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const updated = await updateBarberSettings(user.barberProfileId, parsed.data);
      if (!updated) {
        return reply.status(404).send({ message: 'Settings not found' });
      }
      return reply.send(updated);
    },
  });
}
