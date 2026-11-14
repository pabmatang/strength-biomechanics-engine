/**
 * Unified Biomechanics Client & Memory Cache (Cerebrium / Modal / HuggingFace)
 * 
 * Supports Cerebrium Serverless T4 GPU JSON invocation (Base64) as well as
 * standard multipart/form-data backends.
 * In-memory Map cache keyed by file fingerprint + workout configuration
 * guarantees 0 ms and €0 cost switches between Analysis Views.
 */

export interface ExerciseConfig {
  exerciseType: string;
  targetMuscle: string;
  loadType: string;
  customNotes?: string;
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
  velocity_loss_pct: number;
  first_rep_vel: number;
  last_rep_vel: number;
  max_rep_vel: number;
  rep_velocities: number[];
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
}

export interface BiomechanicsAnalysisResponse {
  fps: number;
  duration: number;
  total_reps: number;
  locked_side: 'left' | 'right';
  repetitions_summary: RepetitionSummary[];
  intensity_metrics?: IntensityMetrics;
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

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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

    if (isCerebrium) {
      headers['Content-Type'] = 'application/json';
      const base64Data = await blobToBase64(videoBlob);

      response = await fetch(endpointUrl, {
        method: 'POST',
        headers,
        signal: currentController.signal,
        body: JSON.stringify({
          video_base64: base64Data,
          video: base64Data,
          exercise_type: String(config.exerciseType),
          target_muscle: String(config.targetMuscle),
          load_type: String(config.loadType),
          start_time: startTime,
          end_time: endTime
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

      response = await fetch(endpointUrl, {
        method: 'POST',
        headers,
        signal: currentController.signal,
        body: formData
      });
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
