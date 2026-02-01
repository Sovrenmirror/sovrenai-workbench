/**
 * Authentication Service
 * Handles authentication, token fetching and storage
 */

import { config } from '../config/api';

const TOKEN_KEY = 'sovren_auth_token';
const USER_KEY = 'sovren_auth_user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Get stored token from localStorage
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored user from localStorage
 */
export function getStoredUser(): AuthUser | null {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

/**
 * Store session in localStorage
 */
export function storeSession(session: AuthSession): void {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

/**
 * Clear stored session
 */
export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Login with credentials
 */
export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const response = await fetch(config.api.auth.founderLogin, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Login failed: ${response.statusText}`);
  }

  const session: AuthSession = await response.json();

  // Store session
  storeSession(session);
  console.log('[Auth] Login successful');
  console.log('[Auth] User:', session.user.name, `(${session.user.role})`);

  return session;
}

/**
 * Fetch dev session (development mode only)
 * Requires VITE_DEV_EMAIL and VITE_DEV_PASSWORD environment variables
 */
export async function fetchDevSession(): Promise<AuthSession> {
  if (!config.features.devAutoLogin) {
    throw new Error('Dev auto-login is only available in development mode');
  }

  const devEmail = import.meta.env.VITE_DEV_EMAIL;
  const devPassword = import.meta.env.VITE_DEV_PASSWORD;

  if (!devEmail || !devPassword) {
    throw new Error(
      'Dev credentials not configured. Set VITE_DEV_EMAIL and VITE_DEV_PASSWORD in .env.local'
    );
  }

  return login({ email: devEmail, password: devPassword });
}

/**
 * Ensure we have a valid token (uses stored or fetches dev session in dev mode)
 */
export async function ensureAuthenticated(): Promise<string> {
  // Check if we already have a token
  const token = getStoredToken();

  if (token) {
    console.log('[Auth] Using stored token');
    return token;
  }

  // In development mode, try auto-login
  if (config.features.devAutoLogin) {
    try {
      console.log('[Auth] No stored token, attempting dev auto-login...');
      const session = await fetchDevSession();
      return session.token;
    } catch (error) {
      console.warn('[Auth] Dev auto-login failed:', error);
      throw new Error('Authentication required. Please log in.');
    }
  }

  throw new Error('Authentication required. Please log in.');
}

/**
 * Get authorization header value
 */
export async function getAuthHeader(): Promise<string> {
  const token = await ensureAuthenticated();
  return `Bearer ${token}`;
}

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

/**
 * Logout - clear session
 */
export function logout(): void {
  clearSession();
  console.log('[Auth] Logged out');
}
