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
 * Uses cached result if identical video & exercise configuration was already evaluated.
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

  const endpointUrl =
    import.meta.env.VITE_CEREBRIUM_ENDPOINT_URL ||
    import.meta.env.VITE_MODAL_ENDPOINT_URL;

  const apiKey =
    import.meta.env.VITE_CEREBRIUM_API_KEY ||
    import.meta.env.VITE_CEREBRIUM_TOKEN ||
    '';

  if (!endpointUrl || endpointUrl.trim() === '') {
    const errorMsg =
      'No se ha configurado VITE_CEREBRIUM_ENDPOINT_URL ni VITE_MODAL_ENDPOINT_URL en el archivo .env. Despliega el backend ("cerebrium deploy") y añade la URL a tu entorno.';
    console.error(`[BiomechanicsClient] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const isCerebrium = endpointUrl.toLowerCase().includes('cerebrium');
  const headers: Record<string, string> = {};

  if (apiKey && apiKey.trim() !== '') {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  try {
    let response: Response;

    if (isCerebrium) {
      headers['Content-Type'] = 'application/json';
      const base64Data = await blobToBase64(videoBlob);

      response = await fetch(endpointUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          video_base64: base64Data,
          exercise_type: config.exerciseType,
          target_muscle: config.targetMuscle,
          load_type: config.loadType
        })
      });
    } else {
      const formData = new FormData();
      formData.append('video', videoBlob, 'input_video.webm');
      formData.append('exercise_type', config.exerciseType);
      formData.append('target_muscle', config.targetMuscle);
      formData.append('load_type', config.loadType);

      response = await fetch(endpointUrl, {
        method: 'POST',
        headers,
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
    console.error('[BiomechanicsClient] Fallo en la comunicación con el microservicio:', err);
    throw err;
  }
}
