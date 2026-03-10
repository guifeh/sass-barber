import type { FastifyRequest, FastifyReply } from 'fastify';

export type AllowedRole = 'admin' | 'barbeiro' | 'usuario';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
    const payload = request.user as { sub?: string; role?: string; type?: string };
    if (payload.type !== 'access') {
      return reply.status(401).send({ message: 'Invalid token type' });
    }
    if (!payload.sub || !payload.role) {
      return reply.status(401).send({ message: 'Invalid token payload' });
    }
  } catch {
    return reply.status(401).send({ message: 'Unauthorized' });
  }
}

export function requireRole(...allowedRoles: AllowedRole[]) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user as { role?: string };
    if (!user || !user.role) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }
    if (!allowedRoles.includes(user.role as AllowedRole)) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
  };
}
