import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  listPublicBarbers,
  listPublicServicesByBarber,
  getPublicAvailability,
} from './service';
import { z } from 'zod';

const searchQuerySchema = z.object({
  search: z.string().optional(),
});

const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/, 'Formato YYYY-MM-DD'),
  serviceId: z.string().uuid(),
});

export async function publicRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
): Promise<void> {
  app.get('/public/barbers', {
    schema: {
      querystring: {
        type: 'object',
        properties: { search: { type: 'string' } },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              displayName: { type: 'string' },
              bio: { type: ['string', 'null'] },
              photoUrl: { type: ['string', 'null'] },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const parsed = searchQuerySchema.safeParse(request.query);
      const search = parsed.success ? parsed.data.search : undefined;
      const barbers = await listPublicBarbers(search);
      return reply.send(barbers);
    },
  });

  app.get<{ Params: { barberId: string } }>('/public/barbers/:barberId/services', {
    schema: {
      params: {
        type: 'object',
        properties: { barberId: { type: 'string', format: 'uuid' } },
        required: ['barberId'],
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              description: { type: ['string', 'null'] },
              durationMinutes: { type: 'integer' },
              basePrice: { type: ['integer', 'null'] },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const services = await listPublicServicesByBarber(request.params.barberId);
      return reply.send(services);
    },
  });

  app.get<{ Params: { barberId: string }; Querystring: { date: string; serviceId: string } }>(
    '/public/barbers/:barberId/availability',
    {
      schema: {
        params: {
          type: 'object',
          properties: { barberId: { type: 'string', format: 'uuid' } },
          required: ['barberId'],
        },
        querystring: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'YYYY-MM-DD' },
            serviceId: { type: 'string', format: 'uuid' },
          },
          required: ['date', 'serviceId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              slots: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    start: { type: 'string', format: 'date-time' },
                    end: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          400: { type: 'object', properties: { message: { type: 'string' } } },
        },
      },
      handler: async (request, reply) => {
        const parsed = availabilityQuerySchema.safeParse(request.query);
        if (!parsed.success) {
          return reply.status(400).send({
            message: 'Validation failed',
            errors: parsed.error.flatten().fieldErrors,
          });
        }
        const { slots, error } = await getPublicAvailability(
          parsed.data.date,
          parsed.data.serviceId,
          request.params.barberId
        );
        if (error) {
          return reply.status(400).send({ message: error });
        }
        return reply.send({ slots });
      },
    }
  );
}
