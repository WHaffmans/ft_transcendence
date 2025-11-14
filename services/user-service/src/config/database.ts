import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let db: Database.Database;

export function initDatabase(): Database.Database {
  // Ensure data directory exists
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'users.db');
  db = new Database(dbPath);

  // Run migrations
  runMigrations();

  return db;
}

function runMigrations(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL
    );
  `);
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}
