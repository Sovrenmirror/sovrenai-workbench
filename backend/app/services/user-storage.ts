import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'user' | 'readonly';
  createdAt: Date;
  lastLogin?: Date;
}

export interface CreateUserInput {
  username: string;
  password: string;
  role: 'admin' | 'user' | 'readonly';
}

/**
 * In-memory user storage (replace with database in production)
 * TODO: Migrate to SQLite in Phase 2
 */
class UserStorage {
  private users: Map<string, User> = new Map();
  private usernameIndex: Map<string, string> = new Map(); // username -> userId

  constructor() {
    // Create default admin user if none exists
    this.initializeDefaultUsers();
  }

  private async initializeDefaultUsers(): Promise<void> {
    const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'changeme123';

    if (!this.usernameIndex.has(defaultAdminUsername)) {
      try {
        await this.createUser({
          username: defaultAdminUsername,
          password: defaultAdminPassword,
          role: 'admin'
        });
        console.log(`[UserStorage] Default admin user created: ${defaultAdminUsername}`);
        console.log(`[UserStorage] WARNING: Change default password in production!`);
      } catch (error) {
        console.error('[UserStorage] Failed to create default admin:', error);
      }
    }
  }

  /**
   * Create new user with hashed password
   */
  async createUser(input: CreateUserInput): Promise<User> {
    // Validate username uniqueness
    if (this.usernameIndex.has(input.username)) {
      throw new Error('Username already exists');
    }

    // Validate username format (alphanumeric, 3-32 chars)
    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(input.username)) {
      throw new Error('Invalid username format. Must be 3-32 alphanumeric characters.');
    }

    // Validate password strength (min 8 chars)
    if (input.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Generate unique ID
    const userId = crypto.randomUUID();

    const user: User = {
      id: userId,
      username: input.username,
      passwordHash,
      role: input.role,
      createdAt: new Date()
    };

    this.users.set(userId, user);
    this.usernameIndex.set(input.username, userId);

    console.log(`[UserStorage] Created user: ${input.username} (${input.role})`);

    return user;
  }

  /**
   * Authenticate user with username and password
   */
  async authenticate(username: string, password: string): Promise<User | null> {
    const userId = this.usernameIndex.get(username);
    if (!userId) {
      // Timing-safe: hash even if user doesn't exist (prevents username enumeration)
      await bcrypt.hash(password, SALT_ROUNDS);
      return null;
    }

    const user = this.users.get(userId);
    if (!user) {
      return null;
    }

    // Compare password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    // Update last login
    user.lastLogin = new Date();

    console.log(`[UserStorage] Authenticated: ${username}`);
    return user;
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): User | undefined {
    return this.users.get(userId);
  }

  /**
   * Get user by username
   */
  getUserByUsername(username: string): User | undefined {
    const userId = this.usernameIndex.get(username);
    if (!userId) return undefined;
    return this.users.get(userId);
  }

  /**
   * Update user role (admin only)
   */
  updateUserRole(userId: string, newRole: 'admin' | 'user' | 'readonly'): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    user.role = newRole;
    console.log(`[UserStorage] Updated role for ${user.username}: ${newRole}`);
    return true;
  }

  /**
   * Delete user (admin only)
   */
  deleteUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    this.users.delete(userId);
    this.usernameIndex.delete(user.username);

    console.log(`[UserStorage] Deleted user: ${user.username}`);
    return true;
  }

  /**
   * List all users (admin only)
   */
  listUsers(): Array<Omit<User, 'passwordHash'>> {
    return Array.from(this.users.values()).map(user => ({
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }));
  }

  /**
   * Get total user count
   */
  getUserCount(): number {
    return this.users.size;
  }
}

// Singleton instance
export const userStorage = new UserStorage();
