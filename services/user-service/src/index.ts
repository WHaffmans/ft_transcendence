import Fastify from 'fastify';
import { initDatabase } from './config/database.js';
import { UserRepository } from './repositories/user.repository.js';
import { UserService } from './services/user.service.js';
import { userRoutes } from './routes/user.routes.js';

async function start() {
  const fastify = Fastify({ logger: true });

  try {
    // Initialize database
    initDatabase();

    // Setup dependency injection
    const userRepository = new UserRepository();
    const userService = new UserService(userRepository);

    // Register routes
    await userRoutes(fastify, userService);

    // Start server
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`🚀 User service is running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

