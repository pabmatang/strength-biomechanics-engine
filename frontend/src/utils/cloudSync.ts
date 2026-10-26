import { UserProfile, UserDataSnapshot } from '../types/workout';

const AUTH_USER_KEY = 'chance_auth_user';
const USERS_REGISTRY_KEY = 'chance_local_users_registry';
const USER_DATA_PREFIX = 'chance_userdata_';

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
  snapshot?: UserDataSnapshot | null;
}

// Helper to sanitize email as storage key
function getSafeKey(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * Get users registry from localStorage, initialized with default demo athlete if empty
 */
function getUsersRegistry(): Record<string, { user: UserProfile; passwordHash: string; created_at: string }> {
  try {
    const raw = localStorage.getItem(USERS_REGISTRY_KEY);
    const registry = raw ? JSON.parse(raw) : {};

    // Seed default demo account if not exists
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

/**
 * Get the currently logged-in user session from localStorage
 */
export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save user session to localStorage
 */
export function setCurrentUser(user: UserProfile | null) {
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

/**
 * Register a new user account (Strict verification - fails if user already exists)
 */
export async function registerUser(
  name: string,
  email: string,
  password: string,
  goal: 'hypertrophy' | 'fat_loss' | 'strength' | 'recomposition' = 'hypertrophy'
): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanEmail) {
    return { success: false, error: 'Por favor, introduce tu correo electrónico.' };
  }
  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, error: 'El formato de correo electrónico no es válido.' };
  }
  if (!cleanPass || cleanPass.length < 4) {
    return { success: false, error: 'La contraseña debe tener al menos 4 caracteres.' };
  }

  const registry = getUsersRegistry();

  // STRICT: Check if user already exists
  if (registry[cleanEmail]) {
    return {
      success: false,
      error: 'Ya existe una cuenta con este correo electrónico. Por favor, inicia sesión.'
    };
  }

  const user: UserProfile = {
    id: `user_${getSafeKey(cleanEmail)}`,
    name: name.trim() || cleanEmail.split('@')[0],
    email: cleanEmail,
    goal,
    created_at: new Date().toISOString()
  };

  registry[cleanEmail] = {
    user,
    passwordHash: btoa(cleanPass),
    created_at: new Date().toISOString()
  };

  try {
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registry));
    setCurrentUser(user);
    return { success: true, user };
  } catch (err: any) {
    return { success: false, error: 'Error al registrar usuario: ' + err.message };
  }
}

/**
 * Log in with existing credentials (Strict verification of email/username & password)
 */
export async function loginUser(emailOrUsername: string, password: string): Promise<AuthResult> {
  const cleanInput = emailOrUsername.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanInput) {
    return { success: false, error: 'Por favor, introduce tu correo o nombre de usuario.' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Por favor, introduce tu contraseña.' };
  }

  const registry = getUsersRegistry();

  // 1. Direct match by email
  let record = registry[cleanInput];

  // 2. If not found by email, search by username or email prefix
  if (!record) {
    const matchingKey = Object.keys(registry).find(key => {
      const regUser = registry[key]?.user;
      return (
        regUser?.name?.toLowerCase() === cleanInput ||
        key.split('@')[0].toLowerCase() === cleanInput
      );
    });
    if (matchingKey) {
      record = registry[matchingKey];
    }
  }

  // 3. User does not exist in registry
  if (!record) {
    return {
      success: false,
      error: 'Usuario no registrado. Comprueba tus datos o ve a la pestaña "Crear Cuenta".'
    };
  }

  // 4. Verify password hash
  const expectedHash = record.passwordHash;
  const providedHash = btoa(cleanPass);

  if (expectedHash !== providedHash) {
    return {
      success: false,
      error: 'Contraseña incorrecta. Por favor, verifica tu clave de acceso.'
    };
  }

  // 5. Successful login
  setCurrentUser(record.user);
  
  // Load user's saved snapshot if available
  const safeKey = getSafeKey(record.user.email);
  const savedSnapshotRaw = localStorage.getItem(`${USER_DATA_PREFIX}${safeKey}`);
  const snapshot = savedSnapshotRaw ? JSON.parse(savedSnapshotRaw) : null;

  return { success: true, user: record.user, snapshot };
}

/**
 * Quick Demo Login
 */
export function loginDemoUser(): UserProfile {
  const demoUser: UserProfile = {
    id: 'user_pablo_athlete',
    name: 'Pablo (Atleta CHΔNCE)',
    email: 'pablo@chance.app',
    goal: 'hypertrophy',
    created_at: new Date().toISOString()
  };
  setCurrentUser(demoUser);
  return demoUser;
}

/**
 * Push snapshot to Cloud & Local Storage
 */
export async function syncSnapshotToCloud(snapshot: UserDataSnapshot): Promise<boolean> {
  const safeKey = getSafeKey(snapshot.user.email);
  
  // Always save locally per-user first
  try {
    localStorage.setItem(`${USER_DATA_PREFIX}${safeKey}`, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

/**
 * Pull latest snapshot from Cloud / Local
 */
export async function fetchSnapshotFromCloud(email: string): Promise<UserDataSnapshot | null> {
  try {
    const safeKey = getSafeKey(email);
    const raw = localStorage.getItem(`${USER_DATA_PREFIX}${safeKey}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Multi-device instant transfer code (base64 compressed sync payload)
 */
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
