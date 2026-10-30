import { UserProfile, UserDataSnapshot } from '../types/workout';
import {
  ApiError,
  ApiUserProfile,
  TrainingGoal,
  loginRequest,
  registerRequest,
  setToken,
  getToken
} from './api';

const AUTH_USER_KEY = 'chance_auth_user';
const USERS_REGISTRY_KEY = 'chance_local_users_registry';
const USER_DATA_PREFIX = 'chance_userdata_';
const GUEST_EMAIL = 'invitado@local';
const GUEST_ID = 'guest_local';

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
  snapshot?: UserDataSnapshot | null;
}

function getSafeKey(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * Registry of accounts stored in localStorage.
 * Automatically seeds the default athlete 'pablo@chance.app' (password: 'pablo123')
 * to allow instant testing in static environments like Netlify or local preview.
 */
function getUsersRegistry(): Record<string, { user: UserProfile; passwordHash: string; created_at: string }> {
  try {
    const raw = localStorage.getItem(USERS_REGISTRY_KEY);
    const registry = raw ? JSON.parse(raw) : {};

    const demoEmail = 'pablo@chance.app';
    if (!registry[demoEmail]) {
      registry[demoEmail] = {
        user: {
          id: 'user_pablo_athlete',
          name: 'Pablo (Atleta CHΔNCE)',
          email: demoEmail,
          goal: 'hypertrophy',
          created_at: '2026-01-01T00:00:00.000Z'
        },
        passwordHash: btoa('pablo123'),
        created_at: '2026-01-01T00:00:00.000Z'
      };
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registry));
    }

    return registry;
  } catch {
    return {};
  }
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

    const isGuest = user.id === GUEST_ID;
    const hasToken = getToken();

    // In offline or local mode, preserve session if registered locally
    if (!isGuest && !hasToken) {
      const registry = getUsersRegistry();
      if (!registry[user.email.toLowerCase()]) {
        localStorage.removeItem(AUTH_USER_KEY);
        return null;
      }
    }
    return user;
  } catch {
    return null;
  }
}

/** Saves the session profile. Passing null logs out and clears tokens. */
export function setCurrentUser(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
      setToken(null);
    }
  } catch {
    // Ignore storage failures
  }
}

/**
 * Derives a backend-compatible username (3-50 chars) from display name and email.
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

/**
 * Registers a user:
 * 1. Attempts to register on the Spring Boot backend API.
 * 2. If the backend is not present (404 on Netlify / static hosting) or unreachable,
 *    gracefully falls back to Local Storage so the user can use the app without errors.
 */
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
    // If backend reports 409 Conflict, respect the backend constraint
    if (error instanceof ApiError && error.status === 409) {
      return { success: false, error: error.message || 'Ya existe una cuenta con este correo electrónico.' };
    }

    // If backend is 404 (static hosting like Netlify) or connection refused (status 0):
    // Fall back to Local Storage registration!
    if (error instanceof ApiError && (error.status === 404 || error.status === 0)) {
      const registry = getUsersRegistry();
      if (registry[cleanEmail]) {
        return { success: false, error: 'Ya existe una cuenta con este correo electrónico.' };
      }

      const user: UserProfile = {
        id: `user_${getSafeKey(cleanEmail)}`,
        name: cleanName || cleanEmail.split('@')[0],
        email: cleanEmail,
        goal,
        created_at: new Date().toISOString()
      };

      registry[cleanEmail] = {
        user,
        passwordHash: btoa(password.trim()),
        created_at: new Date().toISOString()
      };

      try {
        localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registry));
        setCurrentUser(user);
        setToken(`local_offline_jwt_${Date.now()}`);
        return { success: true, user };
      } catch (err: any) {
        return { success: false, error: 'Error al guardar usuario en almacenamiento local: ' + err.message };
      }
    }

    return { success: false, error: describeAuthError(error, 'No se pudo crear la cuenta.') };
  }
}

/**
 * Logs in a user:
 * 1. Attempts authentication with the Spring Boot backend API.
 * 2. If the backend is 404 (Netlify) or offline, falls back to the local account registry
 *    (including 'pablo@chance.app' / 'pablo123').
 */
export async function loginUser(emailOrUsername: string, password: string): Promise<AuthResult> {
  const identifier = emailOrUsername.trim();
  const cleanPass = password.trim();

  if (!identifier) {
    return { success: false, error: 'Introduce tu email o nombre de usuario.' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Introduce tu contraseña.' };
  }

  try {
    const response = await loginRequest(identifier, cleanPass);
    return toAuthResult(response.user, response.token);
  } catch (error) {
    // If the server answered 401 Unauthorized, the credentials were wrong
    if (error instanceof ApiError && error.status === 401) {
      return { success: false, error: 'Credenciales incorrectas. Revisa tu email/usuario y contraseña.' };
    }

    // In static hosting environments (404 on Netlify / localhost:4173 without backend)
    // or when the backend is unreachable:
    const registry = getUsersRegistry();
    const cleanInput = identifier.toLowerCase();

    let record = registry[cleanInput];
    if (!record) {
      const match = Object.keys(registry).find(key => {
        const u = registry[key]?.user;
        return (
          u?.name?.toLowerCase() === cleanInput ||
          key.split('@')[0].toLowerCase() === cleanInput
        );
      });
      if (match) record = registry[match];
    }

    if (record) {
      if (record.passwordHash === btoa(cleanPass)) {
        setCurrentUser(record.user);
        setToken(`local_offline_jwt_${Date.now()}`);
        const snapshot = loadSnapshotLocally(record.user.email);
        return { success: true, user: record.user, snapshot };
      } else {
        return { success: false, error: 'Contraseña incorrecta. Por favor, verifica tu clave de acceso.' };
      }
    }

    if (error instanceof ApiError && error.status === 404) {
      return {
        success: false,
        error: 'Usuario no registrado. Regístrate en la pestaña "Crear Cuenta" o usa la cuenta demo pablo@chance.app / pablo123.'
      };
    }

    return { success: false, error: describeAuthError(error, 'No se pudo iniciar sesión.') };
  }
}

/**
 * Local demo guest session: instant access with full functionality.
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
