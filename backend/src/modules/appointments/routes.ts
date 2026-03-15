import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { availabilityQuerySchema, createAppointmentBodySchema } from './schemas';
import {
  getAvailability,
  createAppointment,
  listMyAppointments,
  listBarberAppointments,
  cancelAppointment,
  confirmAppointmentByToken,
  cancelAppointmentByToken,
  getFirstBarberProfile,
  getBarberProfileByUserId,
} from './service';
import { authenticate, requireRole } from '../auth/guards';
import { sendAppointmentCreatedEmails } from '../notifications/service';

export async function appointmentsRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
): Promise<void> {
  app.get<{ Querystring: { date?: string; serviceId?: string; barberId?: string } }>(
    '/availability',
    {
      preHandler: [authenticate],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'YYYY-MM-DD' },
            serviceId: { type: 'string', format: 'uuid' },
            barberId: { type: 'string', format: 'uuid' },
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
        const { slots, error } = await getAvailability(
          parsed.data.date,
          parsed.data.serviceId,
          parsed.data.barberId
        );
        if (error) {
          return reply.status(400).send({ message: error });
        }
        return reply.send({ slots });
      },
    }
  );

  app.post('/appointments', {
    preHandler: [authenticate, requireRole('admin', 'barbeiro', 'usuario')],
    schema: {
      body: {
        type: 'object',
        properties: {
          serviceId: { type: 'string', format: 'uuid' },
          barberId: { type: 'string', format: 'uuid' },
          startTime: { type: 'string', format: 'date-time' },
        },
        required: ['serviceId', 'barberId', 'startTime'],
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            barberId: { type: 'string', format: 'uuid' },
            serviceId: { type: 'string', format: 'uuid' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            status: { type: 'string' },
            confirmationToken: { type: ['string', 'null'] },
            confirmationDeadline: { type: ['string', 'null'], format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        400: { type: 'object', properties: { message: { type: 'string' } } },
        403: { type: 'object', properties: { message: { type: 'string' } } },
        500: { type: 'object', properties: { message: { type: 'string' } } },
      },
    },
    handler: async (request, reply) => {
      const parsed = createAppointmentBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          message: 'Validation failed',
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const user = request.user as { sub: string; role: string };
      if (user.role === 'barbeiro') {
        return reply.status(403).send({ message: 'Barbeiros não podem realizar agendamentos' });
      }
      const userId = user.sub;
      const { appointment, error } = await createAppointment(userId, parsed.data);
      if (error) {
        return reply.status(400).send({ message: error });
      }
      if (!appointment) {
        return reply.status(500).send({ message: 'Failed to create appointment' });
      }
      sendAppointmentCreatedEmails(appointment.id).catch((err) => {
        request.log.error(err, 'Failed to send appointment created emails');
      });
      return reply.status(201).send(appointment);
    },
  });

  app.get('/appointments/me', {
    preHandler: [authenticate],
    schema: {
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              userId: { type: 'string', format: 'uuid' },
              barberId: { type: 'string', format: 'uuid' },
              serviceId: { type: 'string', format: 'uuid' },
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: 'string', format: 'date-time' },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const userId = (request.user as { sub: string }).sub;
      const list = await listMyAppointments(userId);
      return reply.send(list);
    },
  });

  app.get<{
    Querystring: { from?: string; to?: string };
  }>('/appointments/barber', {
    preHandler: [authenticate, requireRole('admin', 'barbeiro')],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string', format: 'date-time' },
          to: { type: 'string', format: 'date-time' },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              userId: { type: 'string', format: 'uuid' },
              barberId: { type: 'string', format: 'uuid' },
              serviceId: { type: 'string', format: 'uuid' },
              startTime: { type: 'string', format: 'date-time' },
              endTime: { type: 'string', format: 'date-time' },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        404: { type: 'object', properties: { message: { type: 'string' } } },
      },
    },
    handler: async (request, reply) => {
      const user = request.user as { sub: string; role: string };
      let barberId: string;
      if (user.role === 'admin') {
        const first = await getFirstBarberProfile();
        if (!first) {
          return reply.status(404).send({ message: 'No barber profile found' });
        }
        barberId = first.id;
      } else {
        const barber = await getBarberProfileByUserId(user.sub);
        if (!barber) {
          return reply.status(404).send({ message: 'Barber profile not found' });
        }
        barberId = barber.id;
      }
      const from = request.query.from ? new Date(request.query.from) : undefined;
      const to = request.query.to ? new Date(request.query.to) : undefined;
      const list = await listBarberAppointments(barberId, from, to);
      return reply.send(list);
    },
  });

  app.post<{ Params: { id: string } }>('/appointments/:id/cancel', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
        400: { type: 'object', properties: { message: { type: 'string' } } },
        403: { type: 'object', properties: { message: { type: 'string' } } },
        404: { type: 'object', properties: { message: { type: 'string' } } },
      },
    },
    handler: async (request, reply) => {
      const userId = (request.user as { sub: string }).sub;
      const role = (request.user as { role: string }).role;
      const { success, error } = await cancelAppointment(request.params.id, userId, role);
      if (!success) {
        if (error === 'Appointment not found') {
          return reply.status(404).send({ message: error });
        }
        if (error === 'Forbidden') {
          return reply.status(403).send({ message: error });
        }
        return reply.status(400).send({ message: error ?? 'Failed to cancel' });
      }
      return reply.send({ message: 'Appointment cancelled' });
    },
  });

  app.get<{ Querystring: { token?: string } }>('/appointments/confirm', {
    schema: {
      querystring: {
        type: 'object',
        properties: { token: { type: 'string' } },
        required: ['token'],
      },
      response: {
        200: {},
        400: {},
      },
    },
    handler: async (request, reply) => {
      const token = request.query.token;
      if (!token) {
        const accept = request.headers.accept ?? '';
        if (accept.includes('text/html')) {
          return reply
            .status(400)
            .type('text/html')
            .send(
              '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Erro</title></head><body style="font-family:sans-serif;padding:2rem;"><h2>Link inválido</h2><p>Token é obrigatório.</p></body></html>'
            );
        }
        return reply.status(400).send({ message: 'Token is required' });
      }
      const { success, error } = await confirmAppointmentByToken(token);
      const accept = request.headers.accept ?? '';
      const preferHtml = accept.includes('text/html');

      if (!success && error) {
        if (preferHtml) {
          return reply
            .status(400)
            .type('text/html')
            .send(
              `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Erro</title></head><body style="font-family:sans-serif;padding:2rem;"><h2>Não foi possível confirmar</h2><p>${escapeHtml(error)}</p></body></html>`
            );
        }
        return reply.status(400).send({ message: error });
      }

      if (preferHtml) {
        return reply.type('text/html').send(
          `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Agendamento confirmado</title></head>
<body style="font-family:sans-serif;max-width:480px;margin:2rem auto;padding:2rem;">
  <h2 style="color:#16a34a;">Agendamento confirmado</h2>
  <p>Seu agendamento foi confirmado com sucesso. Até lá!</p>
</body></html>`
        );
      }
      return reply.send({
        success: true,
        message: 'Appointment confirmed successfully.',
      });
    },
  });

  app.get<{ Querystring: { token?: string } }>('/appointments/cancel', {
    schema: {
      querystring: {
        type: 'object',
        properties: { token: { type: 'string' } },
        required: ['token'],
      },
      response: { 200: {}, 400: {} },
    },
    handler: async (request, reply) => {
      const token = request.query.token;
      if (!token) {
        const accept = request.headers.accept ?? '';
        if (accept.includes('text/html')) {
          return reply
            .status(400)
            .type('text/html')
            .send(
              '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Erro</title></head><body style="font-family:sans-serif;padding:2rem;"><h2>Link inválido</h2><p>Token é obrigatório.</p></body></html>'
            );
        }
        return reply.status(400).send({ message: 'Token is required' });
      }
      const { success, error } = await cancelAppointmentByToken(token);
      const accept = request.headers.accept ?? '';
      const preferHtml = accept.includes('text/html');

      if (!success && error) {
        if (preferHtml) {
          return reply
            .status(400)
            .type('text/html')
            .send(
              `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Erro</title></head><body style="font-family:sans-serif;padding:2rem;"><h2>Não foi possível cancelar</h2><p>${escapeHtml(error)}</p></body></html>`
            );
        }
        return reply.status(400).send({ message: error });
      }

      if (preferHtml) {
        return reply.type('text/html').send(
          `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Agendamento cancelado</title></head>
<body style="font-family:sans-serif;max-width:480px;margin:2rem auto;padding:2rem;">
  <h2 style="color:#dc2626;">Agendamento cancelado</h2>
  <p>Seu agendamento foi cancelado. Até uma próxima!</p>
</body></html>`
        );
      }
      return reply.send({
        success: true,
        message: 'Appointment cancelled successfully.',
      });
    },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
