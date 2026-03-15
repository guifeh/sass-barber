import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticate, requireRole } from '../auth/guards';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = path.join(__dirname, '..', '..', '..', 'public', 'uploads');

export async function uploadRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
): Promise<void> {
  // Ensure uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  app.post('/upload/photo', {
    preHandler: [authenticate, requireRole('barbeiro')],
    handler: async (request, reply) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ message: 'No file uploaded' });
      }

      // Validate file type
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedMimes.includes(data.mimetype)) {
        return reply.status(400).send({ message: 'Only images (JPEG, PNG, WebP, GIF) are allowed' });
      }

      // Generate unique filename
      const ext = path.extname(data.filename) || '.jpg';
      const fileName = `${randomUUID()}${ext}`;
      const filePath = path.join(UPLOADS_DIR, fileName);

      // Save file
      const buffer = await data.toBuffer();

      // Limit to 5MB
      if (buffer.length > 5 * 1024 * 1024) {
        return reply.status(400).send({ message: 'File too large. Max 5MB.' });
      }

      fs.writeFileSync(filePath, buffer);

      const photoUrl = `/uploads/${fileName}`;
      return reply.send({ photoUrl });
    },
  });
}
