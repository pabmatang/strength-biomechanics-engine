import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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

import {
  getCurrentUser,
  isGuestUser,
  loginDemoUser,
  loginUser,
  registerUser,
  setCurrentUser
} from '../utils/cloudSync';
import { getToken } from '../utils/api';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function authPayload(username = 'pablo_coach', email = 'pablo@strength-lab.io') {
  return {
    token: 'jwt-token-for-tests',
    tokenType: 'Bearer',
    username,
    expiresIn: 86_400_000,
    user: {
      id: '0f8e5f30-5f6a-4f9b-9f0f-1f2f3f4f5f6f',
      username,
      email,
      goal: 'strength',
      role: 'USER',
      createdAt: '2026-10-26T10:00:00Z'
    }
  };
}

describe('Authentication against the Spring Boot API', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects registration with an invalid email before calling the API', async () => {
    const result = await registerUser('Test User', 'notanemail', 'password123');

    expect(result.success).toBe(false);
    expect(result.error).toContain('correo electrónico');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects passwords shorter than the 6 characters required by the backend', async () => {
    const result = await registerUser('Test User', 'test@example.com', '12345');

    expect(result.success).toBe(false);
    expect(result.error).toContain('al menos 6 caracteres');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('registers through /auth/register and stores the JWT', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, authPayload('joan_pradells', 'joan@pradells.com')));

    const result = await registerUser('Joan Pradells', 'joan@pradells.com', 'secret123', 'strength');

    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('joan@pradells.com');
    expect(getToken()).toBe('jwt-token-for-tests');
    expect(getCurrentUser()?.name).toBe('joan_pradells');

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/v1/auth/register');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      username: 'joan_pradells',
      email: 'joan@pradells.com',
      goal: 'strength'
    });
    expect(JSON.parse(String(init?.body))).not.toHaveProperty('name');
  });

  it('surfaces the 409 message returned when the email is already registered', async () => {
    fetchMock.mockResolvedValue(jsonResponse(409, {
      timestamp: '2026-10-26T10:00:00Z',
      status: 409,
      error: 'Conflict',
      message: 'Ya existe una cuenta con este correo electrónico',
      path: '/api/v1/auth/register'
    }));

    const result = await registerUser('User Two', 'duplicate@example.com', 'password123');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Ya existe una cuenta con este correo');
  });

  it('logs in through /auth/login keeping the canonical username from the server', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, authPayload()));

    const result = await loginUser('pablo@strength-lab.io', 'StrongBioPass2026!');

    expect(result.success).toBe(true);
    expect(result.user?.id).toBe('0f8e5f30-5f6a-4f9b-9f0f-1f2f3f4f5f6f');
    expect(getToken()).toBe('jwt-token-for-tests');

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/v1/auth/login');
    expect(JSON.parse(String(init?.body))).toEqual({
      username: 'pablo@strength-lab.io',
      password: 'StrongBioPass2026!'
    });
  });

  it('maps a 401 to a credentials message and keeps no session', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, {
      status: 401,
      message: 'Credenciales incorrectas'
    }));

    const result = await loginUser('carlos@example.com', 'wrongPassword');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Credenciales incorrectas');
    expect(getToken()).toBeNull();
    expect(getCurrentUser()).toBeNull();
  });

  it('explains that the backend is down when fetch fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    const result = await loginUser('carlos@example.com', 'correctPassword');

    expect(result.success).toBe(false);
    expect(result.error).toContain('No se pudo conectar con la API');
  });

  it('clears the JWT on logout', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, authPayload()));
    await loginUser('pablo_coach', 'StrongBioPass2026!');
    expect(getToken()).not.toBeNull();

    setCurrentUser(null);

    expect(getToken()).toBeNull();
    expect(getCurrentUser()).toBeNull();
  });

  it('supports a local guest session without a JWT', () => {
    const guest = loginDemoUser();

    expect(guest.name).toContain('Invitado');
    expect(isGuestUser(guest)).toBe(true);
    expect(getCurrentUser()?.email).toBe('invitado@local');
    expect(getToken()).toBeNull();
  });
});
