/**
 * Thin typed client for the Spring Boot API.
 *
 * Every call goes to `/api/v1` (proxied by Vite in development and by the same
 * origin in production). The JWT is kept in localStorage and attached as a
 * Bearer token; nothing else about the user session is trusted from the client.
 */

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

const TOKEN_KEY = 'chance_auth_token';

export type TrainingGoal = 'hypertrophy' | 'fat_loss' | 'strength' | 'recomposition';

export interface ApiUserProfile {
  id: string;
  username: string;
  email: string;
  goal: TrainingGoal;
  role: string;
  createdAt: string;
}

export interface AuthResponseDto {
  token: string;
  tokenType: string;
  username: string;
  expiresIn: number;
  user: ApiUserProfile;
}

export interface ScannedMachineDto {
  machineName: string;
  brand: string | null;
  modelSeries: string | null;
  primaryMuscleGroup: string | null;
  secondaryMuscleGroups: string[] | null;
  equipmentCategory: string | null;
  biomechanicalSetupTips: string[] | null;
}

export interface BiomechanicalAlternativeDto {
  id: string;
  name: string;
  brand: string | null;
  targetMuscle: string;
  movementPlane: string;
  jointStressAvoided: string;
  axialLoading: boolean;
  similarityScore: number;
  biomechanicalRationale: string;
}

export interface SubstitutionRequest {
  currentExercise: string;
  jointDiscomfort: string;
  targetMuscle?: string;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Storage can be disabled (private mode); the session then lives in memory only.
  }
}

function buildHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json() as { message?: string; detail?: string };
    return body.message || body.detail || `La API respondió ${response.status}`;
  } catch {
    return `La API respondió ${response.status}`;
  }
}

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = 30_000): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: buildHeaders(init.headers),
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch {
    throw new ApiError(
      0,
      'No se pudo conectar con la API. Arranca el backend Spring Boot en http://localhost:8080.'
    );
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return await response.json() as T;
}

export function loginRequest(identifier: string, password: string): Promise<AuthResponseDto> {
  return request<AuthResponseDto>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: identifier.trim(), password })
  });
}

export function registerRequest(input: {
  username: string;
  email: string;
  password: string;
  goal: TrainingGoal;
}): Promise<AuthResponseDto> {
  return request<AuthResponseDto>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}

export function fetchProfile(): Promise<ApiUserProfile> {
  return request<ApiUserProfile>('/auth/me');
}

/** Uploads a JPEG/PNG/WebP photo to the multimodal vision endpoint. */
export function scanMachineImage(file: File): Promise<ScannedMachineDto> {
  const form = new FormData();
  form.append('file', file, file.name || 'machine.jpg');

  return request<ScannedMachineDto>('/exercises/scan', {
    method: 'POST',
    body: form
  }, 180_000);
}

/** Semantic kNN substitution backed by pgvector. */
export function findSubstitutes(input: SubstitutionRequest): Promise<BiomechanicalAlternativeDto[]> {
  return request<BiomechanicalAlternativeDto[]>('/biomechanics/substitute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  }, 60_000);
}

export interface VideoTelemetryPayload {
  userId?: string;
  exerciseId: string;
  exerciseName: string;
  videoDurationSeconds: number;
  hardwareModel?: string;
  metrics: {
    totalRepsCounted: number;
    validRepsCount: number;
    failedRepsCount: number;
    averageRepCadenceSeconds: number;
    romConsistencyScore: number;
  };
  repsDetail: Array<{
    repIndex: number;
    isValid: boolean;
    eccentricTimeSeconds: number;
    concentricTimeSeconds: number;
    minKneeAngle?: number;
    minHipAngle?: number;
    minElbowAngle?: number;
    feedbackAlerts: Array<{
      ruleId: string;
      joint: string;
      measuredValue: number;
      expectedThreshold: number;
      message: string;
    }>;
  }>;
}

export interface TelemetryAnalysisResponse {
  analysisId: string;
  status: 'EXCELLENT' | 'MODERATE_FATIGUE' | 'CRITICAL_ADJUSTMENT';
  totalReps: number;
  validReps: number;
  efficiencyPercentage: number;
  averageRangeOfMotionDegrees: number;
  biomechanicalPrescription: string;
  keyActionPoints: string[];
}

/** Sends client-side video pose estimation metrics to the Spring Boot backend */
export function sendVideoTelemetry(payload: VideoTelemetryPayload): Promise<TelemetryAnalysisResponse> {
  return request<TelemetryAnalysisResponse>('/biomechanics/video-telemetry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }, 30_000);
}
