/**
 * Developer Bootstrap System
 * Auto-creates founder account and provides dev mode auto-login
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') });

const DATA_DIR = resolve(__dirname, '../../../data');
const ADMIN_FILE = resolve(DATA_DIR, '.admin.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'founder' | 'admin' | 'user';
  permissions: string[];
  organization: string;
  createdAt: string;
  passwordHash?: string;
}

export interface BootstrapResult {
  success: boolean;
  message: string;
  user?: User;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

/**
 * Bootstrap the system - create founder account if needed
 */
export function bootstrap(): BootstrapResult {
  try {
    // Check if admin file exists
    if (existsSync(ADMIN_FILE)) {
      const admin = JSON.parse(readFileSync(ADMIN_FILE, 'utf-8'));
      return {
        success: true,
        message: 'Founder account already exists',
        user: admin
      };
    }

    // Create founder account from environment (required)
    const founderEmail = process.env.ADMIN_EMAIL;
    const founderPassword = process.env.ADMIN_PASSWORD;
    const founderName = process.env.ADMIN_NAME;

    if (!founderEmail || !founderPassword || !founderName) {
      throw new Error(
        'Missing required environment variables: ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME must be set. ' +
        'See .env.example for configuration.'
      );
    }

    const passwordHash = bcrypt.hashSync(founderPassword, 10);

    const founder: User = {
      id: 'founder-001',
      email: founderEmail,
      name: founderName,
      role: 'founder',
      permissions: ['*'], // All permissions
      organization: 'SovrenAI',
      createdAt: new Date().toISOString(),
      passwordHash
    };

    // Save admin file with restricted permissions
    writeFileSync(ADMIN_FILE, JSON.stringify(founder, null, 2), { mode: 0o600 });

    // Ensure file has correct permissions (600 = rw-------)
    try {
      chmodSync(ADMIN_FILE, 0o600);
    } catch (error) {
      console.warn('[Bootstrap] Could not set file permissions:', error);
    }

    console.log('\n✅ Founder account created:');
    console.log(`   Email: ${founder.email}`);
    console.log(`   Name: ${founder.name}`);
    console.log(`   Role: ${founder.role}`);
    console.log('   ⚠️  Change password in production!\n');

    return {
      success: true,
      message: 'Founder account created',
      user: founder
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Bootstrap failed: ${error.message}`
    };
  }
}

/**
 * Authenticate user with email and password
 */
export function authenticate(email: string, password: string): AuthResult {
  try {
    if (!existsSync(ADMIN_FILE)) {
      return {
        success: false,
        error: 'No admin account found'
      };
    }

    const admin: User = JSON.parse(readFileSync(ADMIN_FILE, 'utf-8'));

    if (admin.email.toLowerCase() !== email.toLowerCase()) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }

    if (!admin.passwordHash) {
      return {
        success: false,
        error: 'Invalid account configuration'
      };
    }

    const passwordValid = bcrypt.compareSync(password, admin.passwordHash);

    if (!passwordValid) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }

    // Generate JWT token
    const token = generateToken(admin);

    // Remove password hash from response
    const userWithoutHash = { ...admin };
    delete userWithoutHash.passwordHash;

    return {
      success: true,
      user: userWithoutHash,
      token
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Authentication failed: ${error.message}`
    };
  }
}

/**
 * Get dev session (auto-login in development)
 */
export function getDevSession(): AuthResult {
  if (process.env.NODE_ENV !== 'development') {
    return {
      success: false,
      error: 'Dev mode not enabled'
    };
  }

  try {
    if (!existsSync(ADMIN_FILE)) {
      bootstrap();
    }

    const admin: User = JSON.parse(readFileSync(ADMIN_FILE, 'utf-8'));
    const token = generateToken(admin);

    // Remove password hash from response
    const userWithoutHash = { ...admin };
    delete userWithoutHash.passwordHash;

    return {
      success: true,
      user: userWithoutHash,
      token
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Dev session failed: ${error.message}`
    };
  }
}

/**
 * Generate JWT token
 */
function generateToken(user: User): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required. See .env.example for configuration.');
  }
  const expiresIn: string = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    },
    secret,
    {
      expiresIn: expiresIn as any,
      issuer: 'sovrenai-backend',
      audience: 'sovrenai-api'
    }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): any {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required. See .env.example for configuration.');
  }

  try {
    return jwt.verify(token, secret, {
      issuer: 'sovrenai-backend',
      audience: 'sovrenai-api'
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Auth middleware for Express
 */
export function authMiddleware(req: any, res: any, next: any): void {
  // Allow dev mode bypass
  if (process.env.NODE_ENV === 'development') {
    const devSession = getDevSession();
    if (devSession.success) {
      req.user = devSession.user;
      req.devMode = true;
      next();
      return;
    }
  }

  // Check for token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No authorization token' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Run bootstrap if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 SovrenAI Developer Bootstrap\n');
  const result = bootstrap();

  if (result.success) {
    console.log('✅', result.message);
    if (result.user) {
      console.log('\nFounder Account:');
      console.log('  Email:', result.user.email);
      console.log('  Name:', result.user.name);
      console.log('  Role:', result.user.role);
      console.log('  Organization:', result.user.organization);
    }
  } else {
    console.error('❌', result.message);
    process.exit(1);
  }
}
