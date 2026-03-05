import { defineConfig } from 'drizzle-kit';
import path from 'path';
import { config } from 'dotenv';
import { z } from 'zod';

config({ path: path.resolve(__dirname, '.env') });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid or missing DATABASE_URL for drizzle-kit.');
  console.error('Create backend/.env with DATABASE_URL (see .env.example).');
  throw new Error('Invalid DATABASE_URL for drizzle-kit');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema',
  out: './drizzle',
  dbCredentials: {
    url: parsedEnv.data.DATABASE_URL,
  },
});

