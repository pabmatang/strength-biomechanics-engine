import { describe, it, expect, beforeEach } from 'vitest';

// Node environment localStorage mock
if (typeof localStorage === 'undefined') {
  let store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = String(val); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() { return Object.keys(store).length; }
  };
}

import { registerUser, loginUser, getCurrentUser } from '../utils/cloudSync';

describe('Authentication & Cloud Sync Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('rejects registration with invalid email format', async () => {
    const result = await registerUser('Test User', 'notanemail', 'password123');
    expect(result.success).toBe(false);
    expect(result.error).toContain('correo electrónico');
  });

  it('rejects registration with short password (<4 chars)', async () => {
    const result = await registerUser('Test User', 'test@example.com', '123');
    expect(result.success).toBe(false);
    expect(result.error).toContain('al menos 4 caracteres');
  });

  it('successfully registers a new user with valid credentials', async () => {
    const result = await registerUser('Joan Pradells', 'joan@pradells.com', 'secret123');
    expect(result.success).toBe(true);
    expect(result.user?.name).toBe('Joan Pradells');
    expect(result.user?.email).toBe('joan@pradells.com');

    // User is stored in session
    const current = getCurrentUser();
    expect(current?.email).toBe('joan@pradells.com');
  });

  it('rejects duplicate user registration with same email', async () => {
    await registerUser('User One', 'duplicate@example.com', 'pass123');
    const duplicateAttempt = await registerUser('User Two', 'duplicate@example.com', 'differentPass');
    expect(duplicateAttempt.success).toBe(false);
    expect(duplicateAttempt.error).toContain('Ya existe una cuenta con este correo');
  });

  it('rejects login for unregistered email', async () => {
    const result = await loginUser('nonexistent@example.com', 'password123');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Usuario no registrado');
  });

  it('rejects login with incorrect password for registered user', async () => {
    await registerUser('Carlos', 'carlos@example.com', 'correctPassword');
    const result = await loginUser('carlos@example.com', 'wrongPassword');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Contraseña incorrecta');
  });

  it('successfully logs in with correct password', async () => {
    await registerUser('Carlos', 'carlos@example.com', 'correctPassword');
    const result = await loginUser('carlos@example.com', 'correctPassword');
    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('carlos@example.com');
  });

  it('logs in default seeded athlete (pablo@chance.app / pablo123)', async () => {
    const result = await loginUser('pablo@chance.app', 'pablo123');
    expect(result.success).toBe(true);
    expect(result.user?.name).toContain('Pablo');
  });
});
