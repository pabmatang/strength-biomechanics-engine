/**
 * Unified Biomechanics Client & Memory Cache (Cerebrium / Modal / HuggingFace)
 * 
 * Supports Cerebrium Serverless T4 GPU JSON invocation (Base64) as well as
 * standard multipart/form-data backends.
 * In-memory Map cache keyed by file fingerprint + workout configuration
 * guarantees 0 ms and €0 cost switches between Analysis Views.
 */

import { blobToBase64 } from '../utils/videoCompressor';

export interface ExerciseConfig {
  exerciseType: string;
  targetMuscle: string;
  loadType: string;
  customNotes?: string;
  weightKg?: number;
  targetReps?: number;
  anthropometry?: any;
}

export interface Keypoint2D {
  x: number;
  y: number;
  score: number;
}

export interface NormalizedKeypoints {
  shoulder: Keypoint2D;
  elbow: Keypoint2D;
  wrist: Keypoint2D;
  hip: Keypoint2D;
  knee: Keypoint2D;
  ankle: Keypoint2D;
  head: Keypoint2D;
}

export interface MomentArms {
  d_hip: number;
  d_knee: number;
  d_shoulder: number;
  d_elbow?: number;
}

export interface RepetitionVerdict {
  status: 'OPTIMAL' | 'IMPROVEMENT_OPPORTUNITY' | 'TRACKING' | string;
  dominant_joint: string;
  target_alignment: boolean;
  primary_torque_bias: string;
  inflection_knee_deg: number;
  inflection_hip_deg: number;
  d_hip_norm: number;
  d_knee_norm: number;
  d_shoulder_norm: number;
  recommendation: string;
  [key: string]: any;
}

export interface IntensityMetrics {
  estimated_rir: string;
  estimated_rpe: number;
  exact_rir?: number;
  exact_rpe?: number;
  v_fail?: number;
  delta_v_rep?: number;
  estimated_1rm_kg?: number;
  velocity_loss_pct: number;
  first_rep_vel: number;
  v_best?: number;
  last_rep_vel: number;
  max_rep_vel: number;
  rep_velocities: number[];
  status_text?: string;
}

export interface AnthropometricRatios {
  femur_to_torso: number;
  tibia_to_femur: number;
  arm_to_torso: number;
  clavicle_to_pelvis: number;
}

export interface AnthropometricProfile {
  success: boolean;
  ratios: AnthropometricRatios;
  population_means: AnthropometricRatios;
  archetype: string;
  archetype_description: string;
  custom_thresholds: {
    squat_torso_tolerance_deg: number;
    press_elbow_depth_deg: number;
    rdl_hip_hinge_depth_deg: number;
    archetype: string;
  };
  frontImage?: string;
  sideImage?: string;
  date?: string;
}

export interface RepetitionSummary {
  rep_number: number;
  start_time: number;
  inflection_time: number;
  end_time: number;
  eccentric_sec: number;
  pause_sec: number;
  concentric_sec: number;
  concentric_time_s?: number;
  eccentric_time_s?: number;
  pause_time_s?: number;
  concentric_velocity_deg_s?: number;
  min_primary_angle: number;
  max_primary_angle: number;
  rom_deg?: number;
  verdict: RepetitionVerdict;
}

export interface BiomechanicsFrame {
  frame_idx: number;
  time: number;
  rep_number: number;
  phase: 'IDLE' | 'ECCENTRIC' | 'BOTTOM' | 'CONCENTRIC' | 'LOCKOUT' | string;
  main_angle: number;
  secondary_angle: number;
  keypoints_norm: NormalizedKeypoints;
  moment_arms: MomentArms;
  verdict: RepetitionVerdict;
  force_vector?: { origin?: string; direction?: string; dx?: number; dy?: number };
  [key: string]: any;
}

export interface VlmAnalysis {
  active_working_side?: 'left' | 'right';
  is_bilateral_visible?: boolean;
  hide_torso_line?: boolean;
  force_vector_2d?: { ux: number; uy: number };
  load_anchor_joint?: 'wrist' | 'hip';
  torque_split?: {
    primary_muscle: string;
    primary_pct: number;
    secondary_muscle: string;
    secondary_pct: number;
    short_primary_label: string;
    short_secondary_label: string;
  };
  effective_muscle_weights?: Record<string, number>;
  postural_diagnosis?: {
    overall_status: 'Óptimo' | 'Ajustar' | string;
    summary: string;
    neck_and_spine: string;
    joint_alignment: string;
    rom_quality: string;
  };
  vbt_override?: {
    verified_reps?: number;
    exact_rir?: number;
    exact_rpe?: number;
  };
}

export interface BiomechanicsAnalysisResponse {
  fps: number;
  duration: number;
  total_reps: number;
  locked_side: 'left' | 'right';
  repetitions_summary: RepetitionSummary[];
  intensity_metrics?: IntensityMetrics;
  effective_muscle_weights?: Record<string, number>;
  vlm_analysis?: VlmAnalysis;
  frames: BiomechanicsFrame[];
}

// In-memory response cache
const analysisCache = new Map<string, BiomechanicsAnalysisResponse>();

// Active AbortController to cancel previous in-flight requests
let activeAbortController: AbortController | null = null;

export interface BiomechanicsAnalysisOptions {
  range?: {
    startTime: number;
    endTime: number;
  };
}

export function getBiomechanicsCacheKey(
  fileIdentifier: string,
  config: ExerciseConfig,
  range?: { startTime: number; endTime: number }
): string {
  const rangePart = range ? `_${range.startTime.toFixed(1)}-${range.endTime.toFixed(1)}` : '';
  return `${fileIdentifier}_${config.exerciseType}_${config.targetMuscle}_${config.loadType}${rangePart}`;
}

export function clearBiomechanicsCache(): void {
  analysisCache.clear();
}

/**
 * Dispatches video to Cerebrium or Modal/Hugging Face Serverless Backend.
 * Uses cached result if identical video, range & exercise configuration was already evaluated.
 * Cancels active in-flight request via AbortController if a new analysis is triggered.
 */
export async function analyzeVideoWithModal(
  videoBlob: Blob,
  config: ExerciseConfig,
  fileIdentifier: string = 'video_input',
  options?: BiomechanicsAnalysisOptions
): Promise<BiomechanicsAnalysisResponse> {
  const range = options?.range;
  const cacheKey = getBiomechanicsCacheKey(fileIdentifier, config, range);
  const cached = analysisCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Cancel prior in-flight request to avoid duplicate container spin-ups
  if (activeAbortController) {
    try {
      activeAbortController.abort();
    } catch {
      // safe abort
    }
    activeAbortController = null;
  }

  const currentController = new AbortController();
  activeAbortController = currentController;

  const rawEndpoint =
    (import.meta.env.VITE_CEREBRIUM_ENDPOINT_URL as string | undefined)?.trim() ||
    (import.meta.env.VITE_MODAL_ENDPOINT_URL as string | undefined)?.trim() ||
    'https://api.cerebrium.ai/v4/p-88374926/biomechanics-engine/analyze';

  const endpointUrl = rawEndpoint && rawEndpoint.length > 0
    ? rawEndpoint
    : 'https://api.cerebrium.ai/v4/p-88374926/biomechanics-engine/analyze';

  const apiKey =
    (import.meta.env.VITE_CEREBRIUM_API_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_CEREBRIUM_TOKEN as string | undefined)?.trim() ||
    '';

  const isCerebrium = endpointUrl.toLowerCase().includes('cerebrium');
  const headers: Record<string, string> = {};

  if (apiKey && apiKey.length > 0) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    let response: Response;

    const startTime = typeof range?.startTime === 'number' && !isNaN(range.startTime)
      ? Number(range.startTime.toFixed(2))
      : 0.0;
    const endTime = typeof range?.endTime === 'number' && !isNaN(range.endTime) && range.endTime > startTime
      ? Number(range.endTime.toFixed(2))
      : null;

    let base64Data = '';
    if (isCerebrium) {
      headers['Content-Type'] = 'application/json';
      base64Data = await blobToBase64(videoBlob);

      if (!base64Data || typeof base64Data !== 'string' || base64Data.length < 100) {
        throw new Error('No valid video payload provided (expected base64 or video_url). El archivo de vídeo no contiene datos válidos.');
      }
    }

    const doFetch = async () => {
      if (isCerebrium) {
        return fetch(endpointUrl, {
          method: 'POST',
          headers,
          signal: currentController.signal,
          body: JSON.stringify({
            video_base64: base64Data,
            exercise_type: String(config.exerciseType),
            target_muscle: String(config.targetMuscle),
            load_type: String(config.loadType),
            start_time: startTime,
            end_time: endTime,
            weight_kg: config.weightKg,
            target_reps: config.targetReps,
            anthropometry: config.anthropometry
          })
        });
      } else {
        const formData = new FormData();
        formData.append('video', videoBlob, 'input_video.webm');
        formData.append('exercise_type', String(config.exerciseType));
        formData.append('target_muscle', String(config.targetMuscle));
        formData.append('load_type', String(config.loadType));
        formData.append('start_time', String(startTime));
        if (endTime !== null) {
          formData.append('end_time', String(endTime));
        }

        return fetch(endpointUrl, {
          method: 'POST',
          headers,
          signal: currentController.signal,
          body: formData
        });
      }
    };

    try {
      response = await doFetch();
    } catch (fetchErr: any) {
      if (fetchErr.name !== 'AbortError') {
        console.warn('[BiomechanicsClient] Error de conexión en primer intento. Reintentando tras 1500 ms...', fetchErr);
        await new Promise((res) => setTimeout(res, 1500));
        response = await doFetch();
      } else {
        throw fetchErr;
      }
    }

    // Auto-retry transparente ante 502 / 503 / 504 (Cold Start en Cerebrium GPU)
    if ([502, 503, 504].includes(response.status)) {
      console.warn(`[BiomechanicsClient] Cold start detectado (${response.status}). Esperando 1500 ms y reintentando automáticamente en segundo plano...`);
      await new Promise((res) => setTimeout(res, 1500));
      if (!currentController.signal.aborted) {
        response = await doFetch();
      }
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const message = `Error en el microservicio biomecánico (${response.status}): ${errorText || response.statusText}`;
      console.error(`[BiomechanicsClient] ${message}`);
      throw new Error(message);
    }

    const rawJson = await response.json();
    // Cerebrium wraps output in { result: ... } if deployed as standard handler
    const data: BiomechanicsAnalysisResponse = (rawJson.result || rawJson.data || rawJson) as BiomechanicsAnalysisResponse;

    if (!data.frames || !Array.isArray(data.frames)) {
      throw new Error('La respuesta del microservicio no contiene el array de frames cinemáticos esperado.');
    }

    analysisCache.set(cacheKey, data);
    return data;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.info('[BiomechanicsClient] Petición anterior cancelada por nueva acción.');
    } else {
      console.error('[BiomechanicsClient] Fallo en la comunicación con el microservicio:', err);
    }
    throw err;
  } finally {
    if (activeAbortController === currentController) {
      activeAbortController = null;
    }
  }
}

/**
 * Dispatches client calibration photos (frontal and lateral) to Cerebrium to evaluate
 * distance-invariant anatomical ratios and classify structural archetype.
 */
export async function analyzeAnthropometry(
  frontBase64: string,
  sideBase64: string
): Promise<AnthropometricProfile> {
  const endpointUrl =
    (import.meta.env.VITE_CEREBRIUM_ENDPOINT_URL as string | undefined)?.trim() ||
    'https://api.cerebrium.ai/v4/p-88374926/biomechanics-engine/analyze';

  const apiKey =
    (import.meta.env.VITE_CEREBRIUM_API_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_CEREBRIUM_TOKEN as string | undefined)?.trim() ||
    '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const payload = {
    action: 'anthropometry',
    front_image_base64: frontBase64,
    side_image_base64: sideBase64
  };

  let response = await fetch(endpointUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if ([502, 503, 504].includes(response.status)) {
    console.warn(`[BiomechanicsClient] Cold start detectado en antropometría (${response.status}). Esperando 1500 ms y reintentando...`);
    await new Promise((res) => setTimeout(res, 1500));
    response = await fetch(endpointUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Error al analizar antropometría (${response.status}): ${errorText || response.statusText}`);
  }

  const rawJson = await response.json();
  const data = (rawJson.result || rawJson.data || rawJson) as AnthropometricProfile;
  return data;
}
