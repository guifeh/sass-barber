import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid DATABASE_URL for drizzle-kit');
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

