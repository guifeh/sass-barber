import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { env } from '../../config/env';
import { registerBodySchema, loginBodySchema, refreshBodySchema } from './schemas';
import { registerUser, loginUser, findUserByEmail } from './service';
import { authenticate, requireRole } from './guards';
import { db } from '../../db';
import { users, barberProfile } from '../../db/schema';
import { eq } from 'drizzle-orm';

export async function authRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
): Promise<void> {
  app.post('/auth/register', {
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'barbeiro', 'usuario'] },
        },
        required: ['name', 'email', 'password'],
      },
      response: {
        201: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                barberProfileId: { type: 'string' },
              },
            },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number' },
          },
        },
        400: { type: 'object', properties: { message: { type: 'string' }, errors: { type: 'object' } } },
        409: { type: 'object', properties: { message: { type: 'string' } } },
        500: { type: 'object', properties: { message: { type: 'string' } } },
      },
    },
    handler: async (request, reply) => {
      const parsed = registerBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          message: 'Validation failed',
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const existing = await findUserByEmail(parsed.data.email);
      if (existing) {
        return reply.status(409).send({ message: 'Email already registered' });
      }
      const user = await registerUser(parsed.data) as any;
      if (!user) {
        return reply.status(500).send({ message: 'Failed to create user' });
      }
      const accessToken = app.jwt.sign(
        { sub: user.id, role: user.role, barberProfileId: user.barberProfileId || undefined, type: 'access' as const },
        { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
      );
      const refreshToken = app.jwt.sign(
        { sub: user.id, type: 'refresh' as const },
        { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
      );
      return reply.status(201).send({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds, for client convenience
      });
    },
  });

  app.post('/auth/login', {
    schema: {
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
        required: ['email', 'password'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: { 
                id: { type: 'string' }, 
                name: { type: 'string' }, 
                email: { type: 'string' }, 
                role: { type: 'string' },
                barberProfileId: { type: 'string' }
              },
            },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number' },
          },
        },
        400: { type: 'object', properties: { message: { type: 'string' }, errors: { type: 'object' } } },
        401: { type: 'object', properties: { message: { type: 'string' } } },
      },
    },
    handler: async (request, reply) => {
      const parsed = loginBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          message: 'Validation failed',
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const user = await loginUser(parsed.data);
      if (!user) {
        return reply.status(401).send({ message: 'Invalid email or password' });
      }
      const accessToken = app.jwt.sign(
        { sub: user.id, role: user.role, barberProfileId: user.barberProfileId || undefined, type: 'access' as const },
        { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
      );
      const refreshToken = app.jwt.sign(
        { sub: user.id, type: 'refresh' as const },
        { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
      );
      return reply.send({
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role,
          barberProfileId: user.barberProfileId || undefined
        },
        accessToken,
        refreshToken,
        expiresIn: 900,
      });
    },
  });

  // POST /auth/refresh
  app.post('/auth/refresh', {
    schema: {
      body: {
        type: 'object',
        properties: { refreshToken: { type: 'string' } },
        required: ['refreshToken'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number' },
          },
        },
        400: { type: 'object', properties: { message: { type: 'string' }, errors: { type: 'object' } } },
        401: { type: 'object', properties: { message: { type: 'string' } } },
      },
    },
    handler: async (request, reply) => {
      const parsed = refreshBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          message: 'Validation failed',
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      try {
        const payload = app.jwt.verify(parsed.data.refreshToken) as {
          sub?: string;
          type?: string;
        };
        if (payload.type !== 'refresh' || !payload.sub) {
          return reply.status(401).send({ message: 'Invalid refresh token' });
        }
        const [user] = await db
          .select({ id: users.id, role: users.role, barberProfileId: barberProfile.id })
          .from(users)
          .leftJoin(barberProfile, eq(users.id, barberProfile.userId))
          .where(eq(users.id, payload.sub));
        if (!user) {
          return reply.status(401).send({ message: 'User not found' });
        }
        const accessToken = app.jwt.sign(
          { sub: user.id, role: user.role, barberProfileId: user.barberProfileId || undefined, type: 'access' as const },
          { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
        );
        const newRefreshToken = app.jwt.sign(
          { sub: user.id, type: 'refresh' as const },
          { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
        );
        return reply.send({
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: 900,
        });
      } catch {
        return reply.status(401).send({ message: 'Invalid or expired refresh token' });
      }
    },
  });

  app.get('/me', {
    preHandler: [authenticate],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'barbeiro', 'usuario'] },
          },
        },
        404: { type: 'object', properties: { message: { type: 'string' } } },
      },
    },
    handler: async (request, reply) => {
      const userPayload = request.user as { sub: string };
      const userId = userPayload.sub;
      const [user] = await db
        .select({ id: users.id, name: users.name, email: users.email, role: users.role })
        .from(users)
        .where(eq(users.id, userId));
      if (!user) {
        return reply.status(404).send({ message: 'User not found' });
      }
      return reply.send(user);
    },
  });
}
