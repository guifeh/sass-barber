import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env';
import { db } from './db';
import { sql } from 'drizzle-orm';

async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: true,
  });

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

