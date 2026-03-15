import Fastify from 'fastify';
import type { FastifyPluginCallback } from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import { env } from './config/env';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { authRoutes } from './modules/auth';
import { servicesRoutes } from './modules/services';
import { appointmentsRoutes } from './modules/appointments';
import { barberRoutes } from './modules/barber';
import { publicRoutes } from './modules/public';
import { dashboardRoutes } from './modules/dashboard';
import { uploadRoutes } from './modules/upload';
import { startConfirmationRemindersJob } from './jobs/confirmation-reminders';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';

async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  });

  await app.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'public', 'uploads'),
    prefix: '/uploads/',
    decorateReply: false,
  });

  await app.register(
    fastifyJwt as FastifyPluginCallback<{ secret: string }>,
    { secret: env.JWT_SECRET }
  );

  await app.register(authRoutes);
  await app.register(servicesRoutes);
  await app.register(appointmentsRoutes);
  await app.register(barberRoutes);
  await app.register(publicRoutes);
  await app.register(dashboardRoutes);
  await app.register(uploadRoutes);

  app.get('/health', async () => {
    try {
      await db.execute(sql`select 1`);
      return { status: 'ok', database: 'up' };
    } catch (error) {
      app.log.error(error);
      return { status: 'degraded', database: 'down' };
    }
  });

  return app;
}

async function start() {
  const app = await buildServer();

  startConfirmationRemindersJob();

  try {
    await app.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });

    console.log(`HTTP server running on port ${env.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();

