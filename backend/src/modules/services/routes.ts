import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { createServiceBodySchema, updateServiceBodySchema } from './schemas';
import {
  listServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from './service';
import { authenticate, requireRole } from '../auth/guards';

const adminOrBarbeiro = [authenticate, requireRole('admin', 'barbeiro')];

export async function servicesRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
): Promise<void> {
  app.get('/services', {
    preHandler: adminOrBarbeiro,
    schema: {
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
              active: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      const items = await listServices(false);
      return reply.send(items);
    },
  });

  app.get<{ Params: { id: string } }>('/services/:id', {
    preHandler: adminOrBarbeiro,
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: ['string', 'null'] },
            durationMinutes: { type: 'integer' },
            basePrice: { type: ['integer', 'null'] },
            active: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const service = await getServiceById(request.params.id);
      if (!service) {
        return reply.status(404).send({ message: 'Service not found' });
      }
      return reply.send(service);
    },
  });

  app.post('/services', {
    preHandler: adminOrBarbeiro,
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: ['string', 'null'] },
          durationMinutes: { type: 'integer' },
          basePrice: { type: ['integer', 'null'] },
          active: { type: 'boolean' },
        },
        required: ['name', 'durationMinutes'],
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: ['string', 'null'] },
            durationMinutes: { type: 'integer' },
            basePrice: { type: ['integer', 'null'] },
            active: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const parsed = createServiceBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          message: 'Validation failed',
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const service = await createService(parsed.data);
      if (!service) {
        return reply.status(500).send({ message: 'Failed to create service' });
      }
      return reply.status(201).send(service);
    },
  });

  app.put<{ Params: { id: string } }>('/services/:id', {
    preHandler: adminOrBarbeiro,
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: ['string', 'null'] },
          durationMinutes: { type: 'integer' },
          basePrice: { type: ['integer', 'null'] },
          active: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: ['string', 'null'] },
            durationMinutes: { type: 'integer' },
            basePrice: { type: ['integer', 'null'] },
            active: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const existing = await getServiceById(request.params.id);
      if (!existing) {
        return reply.status(404).send({ message: 'Service not found' });
      }
      const parsed = updateServiceBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          message: 'Validation failed',
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const service = await updateService(request.params.id, parsed.data);
      if (!service) {
        return reply.status(500).send({ message: 'Failed to update service' });
      }
      return reply.send(service);
    },
  });

  app.delete<{ Params: { id: string } }>('/services/:id', {
    preHandler: adminOrBarbeiro,
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const existing = await getServiceById(request.params.id);
      if (!existing) {
        return reply.status(404).send({ message: 'Service not found' });
      }
      const deleted = await deleteService(request.params.id);
      if (!deleted) {
        return reply.status(500).send({ message: 'Failed to delete service' });
      }
      return reply.send({ message: 'Service deleted' });
    },
  });
}
