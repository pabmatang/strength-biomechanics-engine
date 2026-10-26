import { UserProfile, UserDataSnapshot } from '../types/workout';
import {
  ApiError,
  ApiUserProfile,
  TrainingGoal,
  loginRequest,
  registerRequest,
  setToken
} from './api';

const AUTH_USER_KEY = 'chance_auth_user';
const USER_DATA_PREFIX = 'chance_local_snapshot_';
const GUEST_EMAIL = 'invitado@local';
const GUEST_ID = 'guest_local';

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
  snapshot?: UserDataSnapshot | null;
}

/**
 * Accounts live in PostgreSQL and are verified by the Spring Boot API (BCrypt + JWT).
 * This module only persists the returned token and a local UI cache of the profile,
 * plus per-user workout data for offline use. There is no client-side password
 * registry and no fake "cloud" stored in the browser.
 */

function getSafeKey(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function toUserProfile(user: ApiUserProfile): UserProfile {
  const goal: TrainingGoal = user.goal ?? 'hypertrophy';
  return {
    id: user.id,
    name: user.username,
    email: user.email,
    goal,
    created_at: user.createdAt
  };
}

function toAuthResult(user: ApiUserProfile, token: string): AuthResult {
  setToken(token);
  const profile = toUserProfile(user);
  setCurrentUser(profile);
  return { success: true, user: profile, snapshot: loadSnapshotLocally(profile.email) };
}

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;

    const user = JSON.parse(raw) as UserProfile;
    if (!user?.email) return null;

    // Guests have no backend session on purpose; real accounts must keep their JWT.
    const isGuest = user.id === GUEST_ID;
    if (!isGuest && !localStorage.getItem('chance_auth_token')) {
      localStorage.removeItem(AUTH_USER_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

/** Saves the session profile. Passing null logs out and clears the JWT. */
export function setCurrentUser(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
      setToken(null);
    }
  } catch {
    // Ignore storage failures: the app still works for the current tab.
  }
}

/**
 * Derives a backend-compatible username (3-50 chars) from the display name.
 * The backend accepts login with either username or email.
 */
export function usernameFromName(name: string, email: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (normalized.length >= 3) {
    return normalized.slice(0, 50);
  }

  const emailPrefix = email.split('@')[0] ?? '';
  const fallback = emailPrefix
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return (fallback.length >= 3 ? fallback : `user_${fallback}`).slice(0, 50);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function registerUser(
  name: string,
  email: string,
  password: string,
  goal: TrainingGoal = 'hypertrophy'
): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  if (!EMAIL_PATTERN.test(cleanEmail)) {
    return { success: false, error: 'El formato del correo electrónico no es válido.' };
  }
  if (password.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  try {
    const response = await registerRequest({
      username: usernameFromName(cleanName, cleanEmail),
      email: cleanEmail,
      password,
      goal
    });
    return toAuthResult(response.user, response.token);
  } catch (error) {
    return { success: false, error: describeAuthError(error, 'No se pudo crear la cuenta.') };
  }
}

export async function loginUser(emailOrUsername: string, password: string): Promise<AuthResult> {
  const identifier = emailOrUsername.trim();

  if (!identifier) {
    return { success: false, error: 'Introduce tu email o nombre de usuario.' };
  }
  if (!password) {
    return { success: false, error: 'Introduce tu contraseña.' };
  }

  try {
    const response = await loginRequest(identifier, password);
    return toAuthResult(response.user, response.token);
  } catch (error) {
    return { success: false, error: describeAuthError(error, 'No se pudo iniciar sesión.') };
  }
}

/**
 * Local guest session: no account, no JWT, no server persistence.
 * The UI labels it explicitly so it is never confused with a real login.
 */
export function loginDemoUser(): UserProfile {
  const guest: UserProfile = {
    id: GUEST_ID,
    name: 'Invitado (solo local)',
    email: GUEST_EMAIL,
    goal: 'hypertrophy',
    created_at: new Date().toISOString()
  };
  setCurrentUser(guest);
  return guest;
}

export function isGuestUser(user: UserProfile | null): boolean {
  return user?.id === GUEST_ID;
}

/**
 * Persists the snapshot in localStorage for offline use. This is local-first
 * storage, not a cloud backup: the API has workout endpoints for analytics, but
 * there is no multi-device snapshot sync endpoint.
 */
export async function saveSnapshotLocally(snapshot: UserDataSnapshot): Promise<boolean> {
  try {
    localStorage.setItem(
      `${USER_DATA_PREFIX}${getSafeKey(snapshot.user.email)}`,
      JSON.stringify(snapshot)
    );
    return true;
  } catch {
    return false;
  }
}

export function loadSnapshotLocally(email: string): UserDataSnapshot | null {
  try {
    const raw = localStorage.getItem(`${USER_DATA_PREFIX}${getSafeKey(email)}`);
    return raw ? JSON.parse(raw) as UserDataSnapshot : null;
  } catch {
    return null;
  }
}

/** Base64 payload for moving a snapshot between devices by hand (clipboard/QR). */
export function exportSyncPayload(snapshot: UserDataSnapshot): string {
  try {
    const jsonStr = JSON.stringify(snapshot);
    return btoa(unescape(encodeURIComponent(jsonStr)));
  } catch {
    return '';
  }
}

export function importSyncPayload(code: string): UserDataSnapshot | null {
  try {
    const jsonStr = decodeURIComponent(escape(atob(code.trim())));
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.user && parsed.routines) {
      return parsed as UserDataSnapshot;
    }
    return null;
  } catch {
    return null;
  }
}

function describeAuthError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Credenciales incorrectas. Revisa tu email/usuario y contraseña.';
    }
    if (error.status === 0) {
      return error.message;
    }
    return error.message || fallback;
  }
  return fallback;
}
