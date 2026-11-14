/**
 * Modal Biomechanics Client & Memory Cache
 * 
 * Communicates with the Serverless backend on Modal (RT-DETR + ViTPose-Base + SciPy).
 * Implements an in-memory Map cache keyed by file fingerprint + workout configuration,
 * providing 0 ms and €0 cost switches between Analysis Views.
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

export interface RepetitionSummary {
  rep_number: number;
  start_time: number;
  inflection_time: number;
  end_time: number;
  eccentric_sec: number;
  pause_sec: number;
  concentric_sec: number;
  min_primary_angle: number;
  max_primary_angle: number;
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
  frames: BiomechanicsFrame[];
}

// In-memory response cache
const analysisCache = new Map<string, BiomechanicsAnalysisResponse>();

export function getBiomechanicsCacheKey(fileIdentifier: string, config: ExerciseConfig): string {
  return `${fileIdentifier}_${config.exerciseType}_${config.targetMuscle}_${config.loadType}`;
}

export function clearBiomechanicsCache(): void {
  analysisCache.clear();
}

/**
 * Dispatches video to Modal Labs Serverless Backend.
 * Uses cached result if identical video & exercise configuration was already evaluated.
 * Throws real network and server errors without any synthetic mock fallback.
 */
export async function analyzeVideoWithModal(
  videoBlob: Blob,
  config: ExerciseConfig,
  fileIdentifier: string = 'video_input'
): Promise<BiomechanicsAnalysisResponse> {
  const cacheKey = getBiomechanicsCacheKey(fileIdentifier, config);
  const cached = analysisCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const endpointUrl = import.meta.env.VITE_MODAL_ENDPOINT_URL;

  if (!endpointUrl || endpointUrl.trim() === '') {
    const errorMsg = 'No se ha configurado VITE_MODAL_ENDPOINT_URL en el entorno (.env). Despliega el backend en Modal con "modal deploy backend/modal_biomechanics.py" y añade la URL asignada a tu .env.';
    console.error(`[ModalBiomechanicsClient] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const formData = new FormData();
  formData.append('video', videoBlob, 'input_video.webm');
  formData.append('exercise_type', config.exerciseType);
  formData.append('target_muscle', config.targetMuscle);
  formData.append('load_type', config.loadType);

  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const message = `Error en el servidor de biomecánica Modal (${response.status}): ${errorText || response.statusText}`;
      console.error(`[ModalBiomechanicsClient] ${message}`);
      throw new Error(message);
    }

    const data = (await response.json()) as BiomechanicsAnalysisResponse;
    analysisCache.set(cacheKey, data);
    return data;
  } catch (err: any) {
    console.error('[ModalBiomechanicsClient] Fallo en la comunicación con Modal Backend:', err);
    throw err;
  }
}
