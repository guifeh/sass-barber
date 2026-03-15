import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env';
import * as schema from './schema';

const isLocal = env.DATABASE_URL.includes('localhost') || env.DATABASE_URL.includes('127.0.0.1');

const poolConfig: any = {
  connectionString: env.DATABASE_URL,
};

if (!isLocal) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });

// Startup check for production
if (!isLocal) {
  pool.connect()
    .then(client => {
      console.log('[DB] Connected successfully to remote database (SSL bypass)');
      client.release();
    })
    .catch(err => {
      console.error('[DB] Connection failure:', err.message);
    });
}

