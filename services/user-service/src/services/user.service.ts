import { UserRepository } from '../repositories/user.repository.js';
import { User, CreateUserInput, UpdateUserInput } from '../models/user.model.js';

export class UserService {
  constructor(private repository: UserRepository) {}

  getAllUsers(): User[] {
    return this.repository.findAll();
  }

  getUserById(id: number): User | null {
    const user = this.repository.findById(id);
    return user || null;
  }

  createUser(input: CreateUserInput): { user?: User; error?: string } {
    const trimmed = input.username.trim();

    if (trimmed.length === 0) {
      return { error: 'Username cannot be empty' };
    }

    // Check if username already exists
    const existing = this.repository.findByUsername(trimmed);
    if (existing) {
      return { error: 'Username already exists' };
    }

    const now = new Date().toISOString();
    const user = this.repository.create(trimmed, now);
    return { user };
  }

  updateUser(id: number, input: UpdateUserInput): { user?: User; error?: string } {
    const trimmed = input.username.trim();

    if (trimmed.length === 0) {
      return { error: 'Username cannot be empty' };
    }

    const existing = this.repository.findById(id);
    if (!existing) {
      return { error: 'User not found' };
    }

    // Check if new username already exists (excluding current user)
    const byName = this.repository.findByUsername(trimmed);
    if (byName && byName.id !== id) {
      return { error: 'Username already exists' };
    }

    const user = this.repository.update(id, trimmed);
    return { user };
  }

  deleteUser(id: number): { user?: User; error?: string } {
    const existing = this.repository.findById(id);
    if (!existing) {
      return { error: 'User not found' };
    }

    this.repository.delete(id);
    return { user: existing };
  }
}
