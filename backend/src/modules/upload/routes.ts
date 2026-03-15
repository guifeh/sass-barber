import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticate, requireRole } from '../auth/guards';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
): Promise<void> {
  app.post('/upload/photo', {
    preHandler: [authenticate, requireRole('barbeiro')],
    handler: async (request, reply) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ message: 'No file uploaded' });
      }
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedMimes.includes(data.mimetype)) {
        return reply.status(400).send({ message: 'Only images (JPEG, PNG, WebP, GIF) are allowed' });
      }
      const ext = path.extname(data.filename) || '.jpg';
      const fileName = `${randomUUID()}${ext}`;
      const buffer = await data.toBuffer();
      if (buffer.length > 5 * 1024 * 1024) {
        return reply.status(400).send({ message: 'File too large. Max 5MB.' });
      }

      const { error } = await supabase.storage
        .from('barber-uploads')
        .upload(fileName, buffer, {
          contentType: data.mimetype,
          upsert: false,
        });
      if (error) {
        console.error('Supabase upload error:', error);
        return reply.status(500).send({ message: 'Failed to upload file' });
      }
      
      const { data: urlData } = supabase.storage
        .from('barber-uploads')
        .getPublicUrl(fileName);
      return reply.send({ photoUrl: urlData.publicUrl });
    },
  });
}
