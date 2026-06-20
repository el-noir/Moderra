// JWT and user profile stored in localStorage for this assessment build — prefer httpOnly cookies in production.
import type { AuthUser } from './types';

const TOKEN_KEY = 'genisis_access_token';
const USER_KEY = 'genisis_user';

export function getAccessToken(): string | null {
  return null; // Token is now handled via httpOnly cookies
}

export function setAccessToken(token: string): void {
  // No-op
}

export function clearAccessToken(): void {
  window.localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function isAdminUser(): boolean {
  return getStoredUser()?.role === 'admin';
}
