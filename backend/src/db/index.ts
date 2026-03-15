import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env';
import * as schema from './schema';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL.includes('supabase.co') || env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

export const db = drizzle(pool, { schema });

