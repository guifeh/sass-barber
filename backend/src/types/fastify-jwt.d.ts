declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      sub: string;
      role: 'admin' | 'barbeiro' | 'usuario';
      type: 'access' | 'refresh';
    };
  }
}
