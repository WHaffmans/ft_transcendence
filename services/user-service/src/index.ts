import Fastify from 'fastify';
import { initDatabase } from './config/database.js';
import { UserService } from './services/user.service.js';
import { userRoutes } from './routes/user.routes.js';
import { UserRepository } from './repositories/user.repository';

/**
 * @type {import('fastify').FastifyInstance} Instance of Fastify
 */
const fastify = Fastify({ logger: true });

async function start() {
  const port = parseInt(process.env.PORT || '3000');
  const host = process.env.HOST || '0.0.0.0';

  initDatabase();
  await userRoutes(fastify, new UserService(new UserRepository()));

  await fastify.listen({ port, host }, function (err: Error | null, address: string) {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    console.log(`user service is running on ${address}`);
  });
}

start();

