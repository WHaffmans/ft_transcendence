import { FastifyInstance } from 'fastify';
import { UserService } from '../services/user.service.js';

export async function userRoutes(fastify: FastifyInstance, userService: UserService) {
  // GET all users
  fastify.get('/users', async () => {
    const users = userService.getAllUsers();
    return { users };
  });

  // GET user by ID
  fastify.get<{ Params: { id: string } }>('/users/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const user = userService.getUserById(id);

    if (!user) {
      reply.code(404);
      return { error: 'User not found' };
    }

    return { user };
  });

  // POST create user
  fastify.post<{ Body: { username: string } }>('/users', async (request, reply) => {
    const { username } = request.body as { username?: string };

    if (!username || typeof username !== 'string') {
      reply.code(400);
      return { error: 'Username is required and must be a non-empty string' };
    }

    const result = userService.createUser({ username });

    if (result.error) {
      reply.code(result.error === 'Username already exists' ? 409 : 400);
      return { error: result.error };
    }

    reply.code(201);
    return { user: result.user };
  });

  // PUT update user
  fastify.put<{ Params: { id: string }; Body: { username: string } }>(
    '/users/:id',
    async (request, reply) => {
      const id = parseInt(request.params.id);
      const { username } = request.body as { username?: string };

      if (!username || typeof username !== 'string') {
        reply.code(400);
        return { error: 'Username is required and must be a non-empty string' };
      }

      const result = userService.updateUser(id, { username });

      if (result.error) {
        const code = result.error === 'User not found' ? 404 : 
                     result.error === 'Username already exists' ? 409 : 400;
        reply.code(code);
        return { error: result.error };
      }

      return { user: result.user };
    }
  );

  // DELETE user
  fastify.delete<{ Params: { id: string } }>('/users/:id', async (request, reply) => {
    const id = parseInt(request.params.id);
    const result = userService.deleteUser(id);

    if (result.error) {
      reply.code(404);
      return { error: result.error };
    }

    return { message: 'User deleted successfully', user: result.user };
  });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', service: 'user-service' };
  });
}
