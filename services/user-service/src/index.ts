import Fastify from 'fastify';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const fastify = Fastify({
  logger: true
});

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'users.db');
const db = new Database(dbPath);

// Simple migration: create users table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    createdAt TEXT NOT NULL
  );
`);

type User = {
  id: number;
  username: string;
  createdAt: string;
};

const selectAll = db.prepare('SELECT id, username, createdAt FROM users ORDER BY id');
const selectById = db.prepare('SELECT id, username, createdAt FROM users WHERE id = ?');
const selectByUsername = db.prepare('SELECT id FROM users WHERE username = ?');
const insertUser = db.prepare('INSERT INTO users (username, createdAt) VALUES (?, ?)');
const updateUser = db.prepare('UPDATE users SET username = ? WHERE id = ?');
const deleteUser = db.prepare('DELETE FROM users WHERE id = ?');

// GET all users
fastify.get('/users', async (request, reply) => {
  const rows = selectAll.all();
  return { users: rows };
});

// GET user by ID
fastify.get<{ Params: { id: string } }>('/users/:id', async (request, reply) => {
  const id = parseInt(request.params.id);
  const user = selectById.get(id) as User | undefined;

  if (!user) {
    reply.code(404);
    return { error: 'User not found' };
  }

  return { user };
});

// POST create user
fastify.post<{ Body: { username: string } }>('/users', async (request, reply) => {
  const { username } = request.body as { username?: string };

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    reply.code(400);
    return { error: 'Username is required and must be a non-empty string' };
  }

  const trimmed = username.trim();

  // Check if username already exists
  const exists = selectByUsername.get(trimmed);
  if (exists) {
    reply.code(409);
    return { error: 'Username already exists' };
  }

  const now = new Date().toISOString();
  const info = insertUser.run(trimmed, now);
  const newId = info.lastInsertRowid as number;
  const newUser = selectById.get(newId);

  reply.code(201);
  return { user: newUser };
});

// PUT update user
fastify.put<{ Params: { id: string }, Body: { username: string } }>('/users/:id', async (request, reply) => {
  const id = parseInt(request.params.id);
  const { username } = request.body as { username?: string };

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    reply.code(400);
    return { error: 'Username is required and must be a non-empty string' };
  }

  const trimmed = username.trim();

  const existing = selectById.get(id);
  if (!existing) {
    reply.code(404);
    return { error: 'User not found' };
  }

  // Check if new username already exists (excluding current user)
  const byName = selectByUsername.get(trimmed);
  if (byName && byName.id !== id) {
    reply.code(409);
    return { error: 'Username already exists' };
  }

  updateUser.run(trimmed, id);
  const updated = selectById.get(id);
  return { user: updated };
});

// DELETE user
fastify.delete<{ Params: { id: string } }>('/users/:id', async (request, reply) => {
  const id = parseInt(request.params.id);
  const existing = selectById.get(id);

  if (!existing) {
    reply.code(404);
    return { error: 'User not found' };
  }

  deleteUser.run(id);
  return { message: 'User deleted successfully', user: existing };
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'user-service' };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`🚀 User service is running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
