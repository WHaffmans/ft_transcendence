import Database from 'better-sqlite3';
import { getDatabase } from '../config/database.js';
import { User } from '../models/user.model.js';

export class UserRepository {
  private db: Database.Database;
  
  // Prepared statements
  private selectAll: Database.Statement;
  private selectById: Database.Statement;
  private selectByUsername: Database.Statement;
  private insertUser: Database.Statement;
  private updateUser: Database.Statement;
  private deleteUser: Database.Statement;

  constructor() {
    this.db = getDatabase();
    
    // Initialize prepared statements
    this.selectAll = this.db.prepare('SELECT id, username, createdAt FROM users ORDER BY id');
    this.selectById = this.db.prepare('SELECT id, username, createdAt FROM users WHERE id = ?');
    this.selectByUsername = this.db.prepare('SELECT id, username, createdAt FROM users WHERE username = ?');
    this.insertUser = this.db.prepare('INSERT INTO users (username, createdAt) VALUES (?, ?)');
    this.updateUser = this.db.prepare('UPDATE users SET username = ? WHERE id = ?');
    this.deleteUser = this.db.prepare('DELETE FROM users WHERE id = ?');
  }

  findAll(): User[] {
    return this.selectAll.all() as User[];
  }

  findById(id: number): User | undefined {
    return this.selectById.get(id) as User | undefined;
  }

  findByUsername(username: string): User | undefined {
    return this.selectByUsername.get(username) as User | undefined;
  }

  create(username: string, createdAt: string): User {
    const info = this.insertUser.run(username, createdAt);
    const newId = info.lastInsertRowid as number;
    return this.selectById.get(newId) as User;
  }

  update(id: number, username: string): User | undefined {
    this.updateUser.run(username, id);
    return this.selectById.get(id) as User | undefined;
  }

  delete(id: number): void {
    this.deleteUser.run(id);
  }
}
