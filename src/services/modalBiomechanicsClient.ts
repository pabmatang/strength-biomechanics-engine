/**
 * Unified Biomechanics Client & Memory Cache (Cerebrium / Modal / HuggingFace)
 * 
 * Supports Cerebrium Serverless T4 GPU JSON invocation (Base64) as well as
 * standard multipart/form-data backends.
 * In-memory Map cache keyed by file fingerprint + workout configuration
 * guarantees 0 ms and €0 cost switches between Analysis Views.
 */

import { blobToBase64 } from '../utils/videoCompressor';
import type { MachineResistanceProfile } from '../utils/machinePhysicsEngine';

export interface ExerciseConfig {
  exerciseType: string;
  exerciseName?: string;
  targetMuscle: string;
  loadType: string;
  isManualOverride?: boolean;
  geminiApiKey?: string;
  customNotes?: string;
  weightKg?: number;
  targetReps?: number;
  anthropometry?: any;
  runVlm?: boolean;
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
  rep_index?: number;
  start_time: number;
  start_sec?: number;
  inflection_time: number;
  inflection_sec?: number;
  end_time: number;
  peak_sec?: number;
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
  rom_px?: number;
  rom_pct_of_rep1?: number;
  mean_concentric_vel?: number;
  sticking_point_sec?: number;
  path_points?: [number, number, number][];
  verdict: RepetitionVerdict;
}

export interface TimelineCue {
  rep_index?: number;
  timestamp_sec: number;
  type: 'warning' | 'error' | 'critical' | 'positive' | string;
  badge: 'Sticking Point' | 'Desaceleración' | 'Pérdida de ROM' | 'Asimetría' | 'Control Óptimo' | string;
  message: string;
  technical_fix: string;
  affected_joint: 'elbow' | 'shoulder' | 'lumbar' | 'wrist' | 'knee' | 'hip' | string;
}

export interface AlignmentCheck {
  joint: string;
  status: 'pass' | 'warning' | 'critical';
  observation: string;
  fix: string;
}

export interface AlignmentAndDiscomfort {
  joint_stress_level: 'low' | 'moderate' | 'high';
  discomfort_risk_summary: string;
  checks: AlignmentCheck[];
}

export interface LimitingFactorMuscle {
  muscle_id: string;
  muscle_name: string;
  effective_set_credit: number;
  reason?: string;
}

export interface SynergistMuscle {
  muscle_id: string;
  muscle_name: string;
  effective_set_credit: number;
  reason?: string;
}

export interface StimulusAndSpecificity {
  target_muscle?: string;
  secondary_muscles?: string[];
  tension_profile?: string;
  limiting_factor?: LimitingFactorMuscle;
  synergists?: SynergistMuscle[];
  muscle_split_pct?: { primary: number; secondary: number };
  suggested_volume_multiplier?: number;
  actionable_adjustments?: string[];
}

export interface IntensityAudit {
  reps_completed: number;
  rir_estimated: number;
  rpe_estimated: number;
  velocity_loss_pct: number;
  failure_proximity: 'safe' | 'effective_growth' | 'absolute_failure' | 'submaximal';
  coach_verdict: string;
}

export interface RepComparisonPoint {
  rep_index: number;
  path_points: [number, number, number][];
  rom_px: number;
  mean_vel: number;
  duration_sec: number;
}

export interface RepComparison {
  rep1: RepComparisonPoint;
  last_rep: RepComparisonPoint;
  rom_loss_pct: number;
  velocity_loss_pct: number;
}

export interface BiomechanicsFrame {
  frame_idx: number;
  time: number;
  timestamp_sec?: number;
  rep_number: number;
  rep_index?: number;
  phase: 'IDLE' | 'ECCENTRIC' | 'BOTTOM' | 'CONCENTRIC' | 'LOCKOUT' | string;
  body_region?: 'upper' | 'lower';
  load_point?: [number, number];
  load_speed_px_s?: number;
  load_speed_norm?: number;
  angles?: {
    elbow?: number;
    shoulder?: number;
    hip?: number;
    knee?: number;
    neck?: number;
    [key: string]: number | undefined;
  };
  keypoints?: {
    shoulder?: [number, number];
    elbow?: [number, number];
    wrist?: [number, number];
    hip?: [number, number];
    knee?: [number, number];
    ankle?: [number, number];
    ear?: [number, number];
    [key: string]: [number, number] | undefined;
  };
  main_angle: number;
  secondary_angle: number;
  keypoints_norm: NormalizedKeypoints;
  moment_arms: MomentArms;
  verdict: RepetitionVerdict;
  force_vector?: {
    origin?: [number, number] | string;
    ux?: number;
    uy?: number;
    d_primary_px?: number;
    d_secondary_px?: number;
    primary_pct?: number;
    secondary_pct?: number;
    primary_short?: string;
    secondary_short?: string;
    direction?: string;
    dx?: number;
    dy?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface VlmVisualAnchors {
  is_anchor_joint_supported: boolean;
  kf_bottom: { proximal: [number, number]; middle: [number, number]; distal: [number, number] };
  kf_peak: { proximal: [number, number]; middle: [number, number]; distal: [number, number] };
}

export interface VlmAnalysis {
  detected_exercise_name?: string;
  detected_exercise_type?: string;
  target_muscle?: string;
  load_type?: string;
  camera_plane?: string;
  visual_anchors?: VlmVisualAnchors;
  active_working_side?: 'left' | 'right';
  is_bilateral_visible?: boolean;
  hide_torso_line?: boolean;
  hide_neck_line?: boolean;
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
  total_duration_sec?: number;
  total_reps: number;
  locked_side: 'left' | 'right';
  camera_plane?: string;
  moment_arms_2d_valid?: boolean;
  debug_pose_audit?: {
    camera_plane: string;
    moment_arms_2d_valid: boolean;
    locked_side: string;
    proximal_source: string;
    proximal_vitpose_error: number;
    vlm_error?: string | null;
    vlm_mode?: string;
    [key: string]: any;
  };
  detected_exercise_type?: string;
  target_muscle?: string;
  load_type?: string;
  body_region?: 'upper' | 'lower';
  is_upper_body?: boolean;
  repetitions_summary: RepetitionSummary[];
  rep_comparison?: RepComparison;
  snapshot_stretch_b64?: string | null;
  snapshot_peak_b64?: string | null;
  joints_stretch?: Record<string, [number, number]>;
  joints_peak?: Record<string, [number, number]>;
  timeline_cues?: TimelineCue[];
  alignment_and_discomfort?: AlignmentAndDiscomfort;
  stimulus_and_specificity?: StimulusAndSpecificity;
  intensity_audit?: IntensityAudit;
  intensity_metrics?: IntensityMetrics;
  avg_tempo?: {
    eccentric_s: number;
    pause_s: number;
    concentric_s: number;
    formatted: string;
  };
  active_window?: {
    start_sec: number;
    end_sec: number;
  };
  mean_eccentric_time_s?: number;
  mean_pause_time_s?: number;
  mean_concentric_time_s?: number;
  effective_muscle_weights?: Record<string, number>;
  vlm_analysis?: VlmAnalysis;
  vlm_used?: boolean;
  vlm_error?: string | null;
  vlm_mode?: 'video_mp4' | 'keyframes_jpeg' | 'fallback';
  vlm_model_used?: string | null;
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
  onProgress?: (stage: string, progress: number) => void;
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
    (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
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

    const isTrimmedClient = Boolean((videoBlob as any).__trimmedClientSide);
    const speedFactor = Number((videoBlob as any).__speedFactor || 1.0);
    const startTime = isTrimmedClient
      ? 0.0
      : (typeof range?.startTime === 'number' && !isNaN(range.startTime) ? Number(range.startTime.toFixed(2)) : 0.0);
    const endTime = isTrimmedClient
      ? null
      : (typeof range?.endTime === 'number' && !isNaN(range.endTime) && range.endTime > startTime ? Number(range.endTime.toFixed(2)) : null);

    const geminiApiKey = config.geminiApiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    const CHUNK_THRESHOLD = 8 * 1024 * 1024; // 8 MB
    const CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB

    if (videoBlob.size > CHUNK_THRESHOLD) {
      const apiBase = endpointUrl.replace(/\/analyze\/?$/, '');
      const initUrl = isCerebrium ? `${apiBase}/upload_init` : `${apiBase}/analyze/upload/init`;
      const chunkBaseUrl = isCerebrium ? `${apiBase}/upload_chunk` : `${apiBase}/analyze/upload/chunk`;
      const completeUrl = isCerebrium ? `${apiBase}/upload_complete` : `${apiBase}/analyze/upload/complete`;

      options?.onProgress?.('Iniciando subida optimizada...', 5);
      let initRes = await fetch(initUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: isCerebrium ? JSON.stringify({}) : undefined,
        signal: currentController.signal
      });

      if ([502, 503, 504].includes(initRes.status) && !currentController.signal.aborted) {
        await new Promise((res) => setTimeout(res, 1500));
        initRes = await fetch(initUrl, {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: isCerebrium ? JSON.stringify({}) : undefined,
          signal: currentController.signal
        });
      }

      if (!initRes.ok) {
        throw new Error(`Error al inicializar sesión de subida por fragmentos (${initRes.status})`);
      }

      const initJson = await initRes.json();
      const initPayload = initJson.result || initJson.data || initJson;
      const upload_id = initPayload.upload_id;
      if (!upload_id) {
        throw new Error('El servidor no devolvió un upload_id válido.');
      }

      const totalBytes = videoBlob.size;
      let offset = 0;

      while (offset < totalBytes) {
        if (currentController.signal.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }
        const chunkBlob = videoBlob.slice(offset, Math.min(offset + CHUNK_SIZE, totalBytes));
        const displayPct = Math.round((offset / totalBytes) * 100);
        options?.onProgress?.('Subiendo fragmentos...', displayPct);

        let chunkRes: Response;
        if (isCerebrium) {
          const chunkBase64 = await blobToBase64(chunkBlob);
          chunkRes = await fetch(chunkBaseUrl, {
            method: 'POST',
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              upload_id,
              chunk_base64: chunkBase64
            }),
            signal: currentController.signal
          });
        } else {
          chunkRes = await fetch(`${chunkBaseUrl}/${upload_id}`, {
            method: 'POST',
            headers: {
              ...headers,
              'Content-Type': 'application/octet-stream'
            },
            body: chunkBlob,
            signal: currentController.signal
          });
        }

        if (!chunkRes.ok) {
          throw new Error(`Error al subir fragmento de vídeo (${chunkRes.status})`);
        }
        offset += chunkBlob.size;
      }

      options?.onProgress?.('Optimizando vídeo en servidor...', 35);
      const completeTargetUrl = isCerebrium ? completeUrl : `${completeUrl}/${upload_id}`;
      const completeBody = {
        ...(isCerebrium ? { upload_id } : {}),
        exercise_type: String(config.exerciseType),
        exercise_name: String(config.exerciseName || ''),
        target_muscle: String(config.targetMuscle),
        load_type: String(config.loadType),
        is_manual_override: Boolean(config.isManualOverride),
        gemini_api_key: geminiApiKey,
        start_time: startTime,
        end_time: endTime,
        speed_factor: speedFactor,
        weight_kg: config.weightKg,
        target_reps: config.targetReps,
        anthropometry: config.anthropometry,
        run_vlm: Boolean(config.runVlm)
      };

      response = await fetch(completeTargetUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        signal: currentController.signal,
        body: JSON.stringify(completeBody)
      });
    } else {
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
              exercise_name: String(config.exerciseName || ''),
              target_muscle: String(config.targetMuscle),
              load_type: String(config.loadType),
              is_manual_override: Boolean(config.isManualOverride),
              gemini_api_key: geminiApiKey,
              start_time: startTime,
              end_time: endTime,
              speed_factor: speedFactor,
              weight_kg: config.weightKg,
              target_reps: config.targetReps,
              anthropometry: config.anthropometry,
              run_vlm: Boolean(config.runVlm)
            })
          });
        } else {
          const formData = new FormData();
          formData.append('video', videoBlob, 'input_video.webm');
          formData.append('exercise_type', String(config.exerciseType));
          formData.append('exercise_name', String(config.exerciseName || ''));
          formData.append('target_muscle', String(config.targetMuscle));
          formData.append('load_type', String(config.loadType));
          formData.append('gemini_api_key', geminiApiKey);
          formData.append('start_time', String(startTime));
          formData.append('run_vlm', String(Boolean(config.runVlm)));
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
    }

    // Asynchronous Job Queue Polling (HTTP 202 Accepted)
    if (response.status === 202) {
      const initJson = await response.json();
      const jobId = initJson.job_id;
      if (!jobId) {
        throw new Error('Respuesta 202 sin job_id recibido.');
      }
      options?.onProgress?.(initJson.stage || 'Procesando vídeo en cola...', initJson.progress || 10);

      const statusBase = endpointUrl.replace(/\/analyze\/?$/, '');
      const statusUrl = `${statusBase}/analyze/status/${jobId}`;

      let completedData: BiomechanicsAnalysisResponse | null = null;
      while (!currentController.signal.aborted) {
        await new Promise((res) => setTimeout(res, 1500));
        if (currentController.signal.aborted) break;

        const statusResp = await fetch(statusUrl, {
          headers,
          signal: currentController.signal
        });
        if (!statusResp.ok) {
          throw new Error(`Error consultando estado del análisis (${statusResp.status})`);
        }
        const statusJson = await statusResp.json();
        options?.onProgress?.(statusJson.stage || 'Analizando biomecánica...', statusJson.progress || 50);

        if (statusJson.status === 'done') {
          const raw = statusJson.result?.result || statusJson.result?.data || statusJson.result;
          completedData = raw as BiomechanicsAnalysisResponse;
          break;
        } else if (statusJson.status === 'error') {
          throw new Error(statusJson.error || 'Error en el procesamiento del análisis en el servidor');
        }
      }

      if (!completedData) {
        throw new Error('Análisis cancelado o no completado.');
      }
      if (!completedData.frames || !Array.isArray(completedData.frames)) {
        throw new Error('La respuesta del microservicio no contiene el array de frames cinemáticos esperado.');
      }

      analysisCache.set(cacheKey, completedData);
      return completedData;
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
    (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
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

export interface CoachReviewResponse {
  success: boolean;
  coach_review?: any;
  vlm_error?: string | null;
  vlm_mode?: string;
  vlm_model_used?: string | null;
  error?: string;
}

export async function requestCoachReviewWithModal(
  videoBlob: Blob,
  config: ExerciseConfig,
  summaryData: any
): Promise<CoachReviewResponse> {
  const rawEndpoint =
    (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const base64Data = await blobToBase64(videoBlob);
  const geminiApiKey = config.geminiApiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

  const resp = await fetch(endpointUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'coach_review',
      video_base64: base64Data,
      exercise_type: String(config.exerciseType),
      exercise_name: String(config.exerciseName || ''),
      summary_data: summaryData,
      gemini_api_key: geminiApiKey,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`HTTP ${resp.status}: ${errText.slice(0, 100)}`);
  }

  const rawJson = await resp.json();
  const data = (rawJson.result || rawJson.data || rawJson) as CoachReviewResponse;
  return data;
}

/**
 * Classifies a machine's mechanical resistance profile from an uploaded photograph
 * using the Cerebrium backend and Gemini Flash lever physics.
 */
export async function classifyMachinePhoto(
  imageBlob: Blob,
  exerciseHint: string = '',
  apiKeyOverride?: string
): Promise<MachineResistanceProfile> {
  const endpointUrl =
    (import.meta.env.VITE_CEREBRIUM_API_URL as string | undefined)?.trim() ||
    (import.meta.env.VITE_MODAL_API_URL as string | undefined)?.trim() ||
    'https://api.cortex.cerebrium.ai/v4/p-4d762e83/biomechanics-engine/analyze';

  const apiKey =
    apiKeyOverride ||
    (import.meta.env.VITE_CEREBRIUM_API_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_CEREBRIUM_TOKEN as string | undefined)?.trim() ||
    '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const base64Data = await blobToBase64(imageBlob);
  const geminiApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

  const resp = await fetch(endpointUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'classify_machine_photo',
      image_b64: base64Data,
      exercise_hint: exerciseHint,
      gemini_api_key: geminiApiKey,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`HTTP ${resp.status}: ${errText.slice(0, 100)}`);
  }

  const rawJson = await resp.json();
  const data = (rawJson.result || rawJson.data || rawJson) as MachineResistanceProfile;
  return data;
}
