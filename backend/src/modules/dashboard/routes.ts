import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDashboardMetrics } from './service';
import { authenticate, requireRole } from '../auth/guards';

export async function dashboardRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
): Promise<void> {
  app.get('/dashboard/metrics', {
    preHandler: [authenticate, requireRole('barbeiro')],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            totalAppointmentsToday: { type: 'integer' },
            projectedRevenueTodayCents: { type: 'integer' },
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
        return reply.status(404).send({ message: 'Barber profile not found' });
      }

      const metrics = await getDashboardMetrics(user.barberProfileId);
      return reply.send(metrics);
    },
  });
}
