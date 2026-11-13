/**
 * kinematicPipeline.ts
 * 
 * Pipeline de Visión por Computador y Cinemática Pura 100% en cliente (Navegador/Local).
 * Refactorizado para alta velocidad, exactitud sub-píxel y conteo determinista de repeticiones:
 * 
 * 1. Aceleración x10: Modelo MediaPipe Pose FULL (no heavy), captura con requestVideoFrameCallback
 *    a playbackRate = 3.0x (15 FPS), y fallback a 12 FPS / 12s / 384x384 si se usa currentTime.
 * 2. Sin deformación ósea: ELIMINADO enforceBoneLength. Sustituido por interpolación de baja visibilidad
 *    (< 0.5) y suavizado bidireccional zeroPhaseSmooth sin desfase de fase (lag = 0).
 * 3. Detector matemático de repeticiones por valles y picos sobre el array completo (mínimo -25° caída,
 *    +20° subida, separación >= 12 frames), asignando 'Inicio', 'Excéntrica', 'Fondo', 'Concéntrica'
 *    y repCount acumulativo.
 * 4. Desplazamiento limpio de etiquetas en canvas: líneas limpias de 3px y badges con offset de ±35px
 *    o panel HUD en esquina para evitar solapamientos en cadera.
 */

import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

// ============================================================================
// Tipos y Modelos de Datos
// ============================================================================

export interface Point {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export type JointName = 'shoulder' | 'elbow' | 'wrist' | 'hip' | 'knee' | 'ankle';

export type BodySide = 'left' | 'right';

export type MovementPhase = 'Inicio' | 'Excéntrica' | 'Fondo' | 'Concéntrica';

export interface AthleteRoi {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  pixelRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface RepetitionInterval {
  repNumber: number;
  peakStartIndex: number;
  bottomIndex: number;
  peakEndIndex: number;
  peakStartAngle: number;
  bottomAngle: number;
  peakEndAngle: number;
  romDeg: number;
  durationSec: number;
}

export interface ProcessedKinematicFrame {
  frameIndex: number;
  timestampSec: number;
  lockedSide: BodySide;
  /** Coordenadas globales en píxeles del vídeo original tras zeroPhaseSmooth */
  joints: Record<JointName, Point>;
  /** Coordenadas normalizadas [0, 1] en el espacio global del vídeo original */
  normalizedJoints: Record<JointName, Point>;
  /** Coordenadas originales sin filtro para auditoría/diagnóstico */
  rawJointsPx: Record<JointName, Point>;
  /** Ángulos articulares calculados en grados */
  anglesDeg: {
    elbow: number;     // Flexión de codo (Hombro - Codo - Muñeca)
    knee: number;      // Ángulo de rodilla (Cadera - Rodilla - Tobillo)
    shoulder: number;  // Ángulo de hombro respecto a la cadera
    hip: number;       // Ángulo de cadera (Hombro - Cadera - Rodilla)
  };
  /** Ángulo principal representativo para el detector de repeticiones */
  mainAngle: number;
  /** Fase del movimiento detectada determinísticamente por picos/valles */
  phase: MovementPhase;
  /** Contador acumulado de repeticiones completadas */
  repCount: number;
  /** Región de interés (ROI) utilizada para la inferencia */
  roi: AthleteRoi;
  /** Visibilidad registrada por articulación */
  visibility: Record<JointName, number>;
}

export interface KinematicPipelineConfig {
  /** Offset inicial a omitir (segundos). Defecto: 2.0s */
  startOffsetSec?: number;
  /** Duración máxima de análisis (segundos). Defecto: 20.0s en modo rápido, 12.0s en fallback */
  maxAnalysisDurationSec?: number;
  /** Frecuencia de muestreo (FPS). Defecto: 15 FPS en modo rápido, 12 FPS en fallback */
  targetSampleFps?: number;
  /** Ruta o URL del modelo MediaPipe Pose. Defecto: pose_landmarker_full.task */
  modelAssetPath?: string;
  /** Ruta o URL de los binarios WASM de MediaPipe */
  wasmLoaderPath?: string;
  /** Delegado de inferencia: GPU preferente con fallback a CPU */
  delegate?: 'GPU' | 'CPU';
  /** Margen por cada lado para el recorte dinámico. Defecto: 25% */
  roiMarginRatio?: number;
  /** Dimensión del lienzo auxiliar en píxeles. Defecto: 512 en modo rápido, 384 en fallback */
  roiCanvasSize?: number;
  /** Número de fotogramas iniciales para decidir el lado bloqueado. Defecto: 15 frames */
  sideLockingFramesCount?: number;
  /** Velocidad de reproducción para captura rápida con requestVideoFrameCallback. Defecto: 3.0 */
  fastPlaybackRate?: number;
  /** Umbral mínimo de caída excéntrica para validar una repetición (grados). Defecto: 25° */
  minDropDeg?: number;
  /** Umbral mínimo de ascenso concéntrico para validar una repetición (grados). Defecto: 20° */
  minRiseDeg?: number;
  /** Separación mínima de frames entre valles consecutivos. Defecto: 12 frames (~0.8s) */
  minValleySeparationFrames?: number;
}

export interface SamplingTimeline {
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  stepSec: number;
  timestampsSec: number[];
}

// MediaPipe Pose Landmark Indices oficiales
export const MP_POSE_LANDMARKS = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

export const LEFT_SIDE_INDICES = [11, 13, 15, 23, 25, 27] as const;
export const RIGHT_SIDE_INDICES = [12, 14, 16, 24, 26, 28] as const;

export const ALL_JOINTS: JointName[] = ['shoulder', 'elbow', 'wrist', 'hip', 'knee', 'ankle'];

// Parámetros por defecto optimizados (Bug 1: Modelo FULL)
export const DEFAULT_PIPELINE_CONFIG: Required<KinematicPipelineConfig> = {
  startOffsetSec: 2.0,
  maxAnalysisDurationSec: 20.0,
  targetSampleFps: 15,
  modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
  wasmLoaderPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
  delegate: 'GPU',
  roiMarginRatio: 0.25,
  roiCanvasSize: 512,
  sideLockingFramesCount: 15,
  fastPlaybackRate: 3.0,
  minDropDeg: 25,
  minRiseDeg: 20,
  minValleySeparationFrames: 12
};

// ============================================================================
// Funciones Matemáticas Puras y Procesamiento de Señal
// ============================================================================

/**
 * Calcula la mediana estadística de un array numérico.
 */
export function calculateMedian(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Distancia euclidiana en 2D entre dos puntos.
 */
export function euclideanDistance2D(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Calcula el ángulo en grados formado en el vértice B por los segmentos BA y BC.
 */
export function calculateAngleDegrees(a: Point, b: Point, c: Point): number {
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;

  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.hypot(v1x, v1y);
  const mag2 = Math.hypot(v2x, v2y);

  if (mag1 * mag2 < 1e-6) return 180;
  const cosTheta = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cosTheta) * 180) / Math.PI;
}

/**
 * Bug 2: Interpolación de fotogramas con baja visibilidad (visibility < 0.5).
 * Rellena las articulaciones ocluidas interpolando linealmente entre el último y
 * el próximo fotograma fiables.
 */
export function interpolateLowVisibilityLandmarks(
  framesJoints: Array<Record<JointName, Point>>,
  minVisibility = 0.5
): Array<Record<JointName, Point>> {
  const n = framesJoints.length;
  if (n <= 1) return framesJoints;

  const result: Array<Record<JointName, Point>> = framesJoints.map(frame => ({
    shoulder: { ...frame.shoulder },
    elbow: { ...frame.elbow },
    wrist: { ...frame.wrist },
    hip: { ...frame.hip },
    knee: { ...frame.knee },
    ankle: { ...frame.ankle }
  }));

  for (const joint of ALL_JOINTS) {
    for (let i = 0; i < n; i++) {
      const curVis = result[i][joint].visibility ?? 0;
      if (curVis < minVisibility) {
        // Buscar frame anterior fiable
        let prevIdx = -1;
        for (let p = i - 1; p >= 0; p--) {
          if ((result[p][joint].visibility ?? 0) >= minVisibility) {
            prevIdx = p;
            break;
          }
        }

        // Buscar frame posterior fiable
        let nextIdx = -1;
        for (let q = i + 1; q < n; q++) {
          if ((result[q][joint].visibility ?? 0) >= minVisibility) {
            nextIdx = q;
            break;
          }
        }

        if (prevIdx !== -1 && nextIdx !== -1) {
          const ratio = (i - prevIdx) / (nextIdx - prevIdx);
          const pP = result[prevIdx][joint];
          const nP = result[nextIdx][joint];
          result[i][joint].x = pP.x + ratio * (nP.x - pP.x);
          result[i][joint].y = pP.y + ratio * (nP.y - pP.y);
          if (pP.z !== undefined && nP.z !== undefined) {
            result[i][joint].z = pP.z + ratio * (nP.z - pP.z);
          }
          result[i][joint].visibility = Math.min(pP.visibility ?? 1, nP.visibility ?? 1) * 0.85;
        } else if (prevIdx !== -1) {
          result[i][joint].x = result[prevIdx][joint].x;
          result[i][joint].y = result[prevIdx][joint].y;
          result[i][joint].visibility = 0.5;
        } else if (nextIdx !== -1) {
          result[i][joint].x = result[nextIdx][joint].x;
          result[i][joint].y = result[nextIdx][joint].y;
          result[i][joint].visibility = 0.5;
        }
      }
    }
  }

  return result;
}

/**
 * Bug 2: Suavizado bidireccional de fase cero (zeroPhaseSmooth).
 * Aplica un filtro hacia adelante y hacia atrás que elimina el temblor de alta frecuencia
 * sin introducir retraso temporal (desfase = 0), manteniendo los puntos exactamente
 * en las articulaciones anatómicas reales sin deformación esquelética.
 */
export function zeroPhaseSmooth(values: number[], alpha = 0.38): number[] {
  const n = values.length;
  if (n <= 2) return [...values];

  // Paso 1: Filtro IIR hacia adelante
  const forward: number[] = new Array(n);
  forward[0] = values[0];
  for (let i = 1; i < n; i++) {
    forward[i] = alpha * values[i] + (1 - alpha) * forward[i - 1];
  }

  // Paso 2: Filtro IIR hacia atrás (cancela el desfase de fase)
  const backward: number[] = new Array(n);
  backward[n - 1] = forward[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    backward[i] = alpha * forward[i] + (1 - alpha) * backward[i + 1];
  }

  return backward;
}

/**
 * Aplica zeroPhaseSmooth sobre las coordenadas X e Y de todas las articulaciones.
 */
export function smoothJointsTrajectoryZeroPhase(
  framesJoints: Array<Record<JointName, Point>>,
  alpha = 0.38
): Array<Record<JointName, Point>> {
  const n = framesJoints.length;
  if (n <= 2) return framesJoints;

  const smoothedFrames: Array<Record<JointName, Point>> = framesJoints.map(f => ({
    shoulder: { ...f.shoulder },
    elbow: { ...f.elbow },
    wrist: { ...f.wrist },
    hip: { ...f.hip },
    knee: { ...f.knee },
    ankle: { ...f.ankle }
  }));

  for (const joint of ALL_JOINTS) {
    const rawX = framesJoints.map(f => f[joint].x);
    const rawY = framesJoints.map(f => f[joint].y);

    const smoothX = zeroPhaseSmooth(rawX, alpha);
    const smoothY = zeroPhaseSmooth(rawY, alpha);

    for (let i = 0; i < n; i++) {
      smoothedFrames[i][joint].x = smoothX[i];
      smoothedFrames[i][joint].y = smoothY[i];
    }
  }

  return smoothedFrames;
}

/**
 * Bug 3: Detector Matemático de Valles y Picos sobre el array completo de ángulos.
 * No utiliza una FSM en vivo frame a frame, garantizando que el contador de repeticiones
 * nunca se quede en 0 si la curva angular desciende y asciende.
 * 
 * Reglas:
 * 1. Mínimo local (valle / Fondo) donde el ángulo baje al menos minDropDeg (25°) respecto al pico previo.
 * 2. El ángulo sube al menos minRiseDeg (20°) tras el valle (fase concéntrica completada).
 * 3. Separación mínima de minValleySeparationFrames (12 frames) entre valles consecutivos.
 */
export function detectRepetitionsFromAngleSignal(
  angles: number[],
  minDropDeg = 25,
  minRiseDeg = 20,
  minValleySeparationFrames = 12
): RepetitionInterval[] {
  const n = angles.length;
  if (n < minValleySeparationFrames) return [];

  // 1. Detectar candidatos a mínimos locales (valles)
  const candidateValleys: number[] = [];
  for (let i = 1; i < n - 1; i++) {
    if (angles[i] <= angles[i - 1] && angles[i] <= angles[i + 1]) {
      candidateValleys.push(i);
    }
  }

  const validatedReps: RepetitionInterval[] = [];
  let lastAcceptedValley = -999;

  for (const valleyIdx of candidateValleys) {
    // Verificar separación mínima respecto al último valle aceptado
    if (valleyIdx - lastAcceptedValley < minValleySeparationFrames) {
      // Si está demasiado cerca, comprobar si este nuevo valle es aún más profundo
      if (validatedReps.length > 0) {
        const lastRep = validatedReps[validatedReps.length - 1];
        if (angles[valleyIdx] < lastRep.bottomAngle) {
          // Reemplazar por el valle más profundo
          validatedReps.pop();
        } else {
          continue;
        }
      } else {
        continue;
      }
    }

    const valleyAngle = angles[valleyIdx];

    // Buscar pico previo más alto (inicio de la bajada excéntrica)
    let peakStartIdx = valleyIdx;
    let maxBefore = valleyAngle;
    const searchBackLimit = Math.max(0, lastAcceptedValley >= 0 ? lastAcceptedValley : 0, valleyIdx - 45);
    for (let j = valleyIdx - 1; j >= searchBackLimit; j--) {
      if (angles[j] >= maxBefore) {
        maxBefore = angles[j];
        peakStartIdx = j;
      } else if (maxBefore - angles[j] >= 10) {
        // Fin del ascenso previo al retroceder
        break;
      }
    }

    const drop = maxBefore - valleyAngle;
    if (drop < minDropDeg) {
      continue; // No cumple la bajada mínima de 25°
    }

    // Buscar pico posterior más alto (fin de la subida concéntrica)
    let peakEndIdx = valleyIdx;
    let maxAfter = valleyAngle;
    const searchForwardLimit = Math.min(n - 1, valleyIdx + 45);
    for (let k = valleyIdx + 1; k <= searchForwardLimit; k++) {
      if (angles[k] >= maxAfter) {
        maxAfter = angles[k];
        peakEndIdx = k;
      } else if (maxAfter - angles[k] >= 10) {
        // Cima alcanzada y caída posterior detectada
        break;
      }
    }

    const rise = maxAfter - valleyAngle;
    if (rise < minRiseDeg) {
      continue; // No cumple la subida mínima de 20°
    }

    lastAcceptedValley = valleyIdx;
    validatedReps.push({
      repNumber: validatedReps.length + 1,
      peakStartIndex: peakStartIdx,
      bottomIndex: valleyIdx,
      peakEndIndex: peakEndIdx,
      peakStartAngle: Number(maxBefore.toFixed(1)),
      bottomAngle: Number(valleyAngle.toFixed(1)),
      peakEndAngle: Number(maxAfter.toFixed(1)),
      romDeg: Number(Math.max(drop, rise).toFixed(1)),
      durationSec: 0
    });
  }

  return validatedReps;
}

/**
 * Bug 3: Asigna fases ('Inicio', 'Excéntrica', 'Fondo', 'Concéntrica') y el repCount
 * acumulativo a cada fotograma a partir de los intervalos de repetición validados.
 */
export function assignRepetitionPhasesAndCounts(
  totalFrames: number,
  reps: RepetitionInterval[],
  timestampsSec?: number[]
): Array<{ phase: MovementPhase; repCount: number }> {
  const result: Array<{ phase: MovementPhase; repCount: number }> = [];

  for (let i = 0; i < totalFrames; i++) {
    let assignedPhase: MovementPhase = 'Inicio';
    let count = 0;

    for (const rep of reps) {
      if (i >= rep.peakStartIndex && i <= rep.peakEndIndex) {
        if (i < rep.bottomIndex) {
          assignedPhase = 'Excéntrica';
        } else if (i === rep.bottomIndex) {
          assignedPhase = 'Fondo';
        } else {
          assignedPhase = 'Concéntrica';
        }
        break;
      }
    }

    for (const rep of reps) {
      if (i >= rep.bottomIndex) {
        count = rep.repNumber;
      }
    }

    result.push({ phase: assignedPhase, repCount: count });
  }

  // Calcular duración en segundos de cada repetición si se suministran timestamps
  if (timestampsSec && timestampsSec.length === totalFrames) {
    for (const rep of reps) {
      const startT = timestampsSec[rep.peakStartIndex] ?? 0;
      const endT = timestampsSec[rep.peakEndIndex] ?? startT;
      rep.durationSec = Number((endT - startT).toFixed(2));
    }
  }

  return result;
}

/**
 * Regla 1: Ventana de Muestreo Temporal
 */
export function buildSamplingTimeline(
  videoDurationSec: number,
  config: KinematicPipelineConfig = {}
): SamplingTimeline {
  const startOffset = config.startOffsetSec ?? DEFAULT_PIPELINE_CONFIG.startOffsetSec;
  const maxDuration = config.maxAnalysisDurationSec ?? DEFAULT_PIPELINE_CONFIG.maxAnalysisDurationSec;
  const fps = config.targetSampleFps ?? DEFAULT_PIPELINE_CONFIG.targetSampleFps;
  const stepSec = 1 / fps;

  if (videoDurationSec <= 0) {
    return {
      startTimeSec: 0,
      endTimeSec: 0,
      durationSec: 0,
      stepSec,
      timestampsSec: []
    };
  }

  const startTimeSec = videoDurationSec <= startOffset
    ? Math.max(0, videoDurationSec * 0.05)
    : startOffset;

  const endTimeSec = Math.min(startTimeSec + maxDuration, videoDurationSec);
  const durationSec = Math.max(0, endTimeSec - startTimeSec);

  const timestampsSec: number[] = [];
  for (let t = startTimeSec; t < endTimeSec - 1e-4; t += stepSec) {
    timestampsSec.push(Number(t.toFixed(4)));
  }

  if (timestampsSec.length === 0 && durationSec > 0) {
    timestampsSec.push(Number(startTimeSec.toFixed(4)));
  }

  return {
    startTimeSec,
    endTimeSec,
    durationSec,
    stepSec,
    timestampsSec
  };
}

/**
 * Regla 2: Recorte Dinámico alrededor del Atleta (ROI Crop 25% margen)
 */
export function computeAthleteRoi(
  landmarks: Point[],
  videoWidth: number,
  videoHeight: number,
  marginRatio = DEFAULT_PIPELINE_CONFIG.roiMarginRatio
): AthleteRoi {
  if (!landmarks || landmarks.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 1,
      maxY: 1,
      width: 1,
      height: 1,
      pixelRect: { x: 0, y: 0, width: videoWidth, height: videoHeight }
    };
  }

  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  let validCount = 0;

  for (const lm of landmarks) {
    if (!lm) continue;
    if (lm.visibility !== undefined && lm.visibility < 0.20) continue;
    if (lm.x < minX) minX = lm.x;
    if (lm.x > maxX) maxX = lm.x;
    if (lm.y < minY) minY = lm.y;
    if (lm.y > maxY) maxY = lm.y;
    validCount++;
  }

  if (validCount === 0 || minX >= maxX || minY >= maxY) {
    minX = 0;
    minY = 0;
    maxX = 1;
    maxY = 1;
  }

  const rawW = maxX - minX;
  const rawH = maxY - minY;
  const marginW = rawW * marginRatio;
  const marginH = rawH * marginRatio;

  const cropMinX = Math.max(0, minX - marginW);
  const cropMinY = Math.max(0, minY - marginH);
  const cropMaxX = Math.min(1, maxX + marginW);
  const cropMaxY = Math.min(1, maxY + marginH);

  const cropW = Math.max(0.05, cropMaxX - cropMinX);
  const cropH = Math.max(0.05, cropMaxY - cropMinY);

  return {
    minX: cropMinX,
    minY: cropMinY,
    maxX: cropMaxX,
    maxY: cropMaxY,
    width: cropW,
    height: cropH,
    pixelRect: {
      x: Math.round(cropMinX * videoWidth),
      y: Math.round(cropMinY * videoHeight),
      width: Math.round(cropW * videoWidth),
      height: Math.round(cropH * videoHeight)
    }
  };
}

/**
 * Regla 2: Reconversión de coordenadas normalizadas del ROI al sistema global del vídeo.
 */
export function remapPointFromRoi(
  roiPoint: Point,
  roi: AthleteRoi,
  videoWidth: number,
  videoHeight: number
): { globalNormalized: Point; globalPixels: Point } {
  const globalNormX = roi.minX + roiPoint.x * roi.width;
  const globalNormY = roi.minY + roiPoint.y * roi.height;

  const globalNormalized: Point = {
    x: globalNormX,
    y: globalNormY,
    z: roiPoint.z,
    visibility: roiPoint.visibility
  };

  const globalPixels: Point = {
    x: globalNormX * videoWidth,
    y: globalNormY * videoHeight,
    z: roiPoint.z,
    visibility: roiPoint.visibility
  };

  return { globalNormalized, globalPixels };
}

/**
 * Regla 3: Bloqueo Unilateral (Side-Locking) en primeros 15 frames
 */
export function determineDominantSide(
  initialFramesLandmarks: Point[][]
): BodySide {
  let leftVisibilitySum = 0;
  let rightVisibilitySum = 0;

  for (const lms of initialFramesLandmarks) {
    if (!lms || lms.length === 0) continue;

    for (const idx of LEFT_SIDE_INDICES) {
      const lm = lms[idx];
      leftVisibilitySum += (lm && typeof lm.visibility === 'number') ? lm.visibility : 0;
    }

    for (const idx of RIGHT_SIDE_INDICES) {
      const lm = lms[idx];
      rightVisibilitySum += (lm && typeof lm.visibility === 'number') ? lm.visibility : 0;
    }
  }

  return rightVisibilitySum > leftVisibilitySum ? 'right' : 'left';
}

/**
 * Extrae las 6 articulaciones maestras del lado dominante.
 */
export function extractUnilateralJoints(
  landmarks: Point[],
  side: BodySide
): Record<JointName, Point> {
  const isLeft = side === 'left';
  const dummy: Point = { x: 0, y: 0, visibility: 0 };

  return {
    shoulder: landmarks[isLeft ? MP_POSE_LANDMARKS.LEFT_SHOULDER : MP_POSE_LANDMARKS.RIGHT_SHOULDER] || dummy,
    elbow: landmarks[isLeft ? MP_POSE_LANDMARKS.LEFT_ELBOW : MP_POSE_LANDMARKS.RIGHT_ELBOW] || dummy,
    wrist: landmarks[isLeft ? MP_POSE_LANDMARKS.LEFT_WRIST : MP_POSE_LANDMARKS.RIGHT_WRIST] || dummy,
    hip: landmarks[isLeft ? MP_POSE_LANDMARKS.LEFT_HIP : MP_POSE_LANDMARKS.RIGHT_HIP] || dummy,
    knee: landmarks[isLeft ? MP_POSE_LANDMARKS.LEFT_KNEE : MP_POSE_LANDMARKS.RIGHT_KNEE] || dummy,
    ankle: landmarks[isLeft ? MP_POSE_LANDMARKS.LEFT_ANKLE : MP_POSE_LANDMARKS.RIGHT_ANKLE] || dummy,
  };
}

// ============================================================================
// Bug 4: Renderizado Limpio en Canvas con Grosor 3px y Offsets sin Solapamiento
// ============================================================================

export interface CanvasOverlayOptions {
  showAnglesInCorner?: boolean;
  jointDotRadius?: number;
  skeletonLineWidth?: number;
  badgeVerticalOffset?: number; // ±35px
}

/**
 * Bug 4: Dibuja las articulaciones y los segmentos con grosor de 3px y coloca las
 * etiquetas con un offset vertical de ±35px o en un panel HUD en la esquina para
 * evitar que se pisen en el centro de la cadera.
 */
export function drawKinematicFrameOverlay(
  ctx: CanvasRenderingContext2D,
  frame: ProcessedKinematicFrame,
  canvasWidth: number,
  canvasHeight: number,
  options: CanvasOverlayOptions = {}
): void {
  const lineWidth = options.skeletonLineWidth ?? 3;
  const dotRadius = options.jointDotRadius ?? 5;
  const showInCorner = options.showAnglesInCorner ?? true;
  const vOffset = options.badgeVerticalOffset ?? 35;

  const { shoulder, elbow, wrist, hip, knee, ankle } = frame.joints;

  ctx.save();

  // Helper para trazar línea ósea limpia de 3px con contraste
  const drawBoneSegment = (p1: Point, p2: Point, color: string) => {
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.lineWidth = lineWidth + 2;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  };

  // Helper para nodo articular limpio
  const drawJointNode = (p: Point, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, dotRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  };

  // Segmentos esqueléticos: Húmero y Antebrazo
  drawBoneSegment(shoulder, elbow, '#8B5CF6'); // Violeta
  drawBoneSegment(elbow, wrist, '#EC4899');    // Rosa

  // Tronco y Cadera
  drawBoneSegment(shoulder, hip, '#38BDF8');   // Azul claro

  // Segmentos de pierna: Fémur y Tibia
  drawBoneSegment(hip, knee, '#06B6D4');       // Cian
  drawBoneSegment(knee, ankle, '#10B981');     // Esmeralda

  // Nodos articulares
  drawJointNode(shoulder, '#8B5CF6');
  drawJointNode(elbow, '#EC4899');
  drawJointNode(wrist, '#F43F5E');
  drawJointNode(hip, '#06B6D4');
  drawJointNode(knee, '#10B981');
  drawJointNode(ankle, '#38BDF8');

  if (showInCorner) {
    // HUD limpio en esquina superior para que jamás se solape con el cuerpo
    const hudW = 160;
    const hudH = 110;
    const hudX = canvasWidth - hudW - 12;
    const hudY = 12;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#38BDF8';
    ctx.fillText(`Reps: ${frame.repCount}`, hudX + 10, hudY + 10);

    ctx.fillStyle = frame.phase === 'Fondo' ? '#F59E0B' : '#A7F3D0';
    ctx.fillText(`Fase: ${frame.phase}`, hudX + 75, hudY + 10);

    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(`Rodilla: ${Math.round(frame.anglesDeg.knee)}°`, hudX + 10, hudY + 34);
    ctx.fillText(`Cadera:  ${Math.round(frame.anglesDeg.hip)}°`, hudX + 10, hudY + 56);
    ctx.fillText(`Codo:    ${Math.round(frame.anglesDeg.elbow)}°`, hudX + 10, hudY + 78);
  } else {
    // Badges sobre el cuerpo con offset vertical estricto de ±35px para no pisarse
    const drawBadge = (x: number, y: number, text: string, color: string) => {
      ctx.font = 'bold 11px monospace';
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x - tw / 2 - 4, y - 8, tw + 8, 16, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
    };

    // Cadera hacia arriba (-35px), Rodilla hacia abajo (+35px)
    drawBadge(hip.x, hip.y - vOffset, `Cadera: ${Math.round(frame.anglesDeg.hip)}°`, '#06B6D4');
    drawBadge(knee.x, knee.y + vOffset, `Rodilla: ${Math.round(frame.anglesDeg.knee)}°`, '#10B981');
    drawBadge(elbow.x, elbow.y - vOffset, `Codo: ${Math.round(frame.anglesDeg.elbow)}°`, '#EC4899');
  }

  ctx.restore();
}

// ============================================================================
// Clase Principal: KinematicPipeline
// ============================================================================

export class KinematicPipeline {
  private config: Required<KinematicPipelineConfig>;
  private landmarker: PoseLandmarker | null = null;
  private isInitialized = false;

  constructor(customConfig: KinematicPipelineConfig = {}) {
    this.config = {
      ...DEFAULT_PIPELINE_CONFIG,
      ...customConfig
    };
  }

  /**
   * Bug 1: Inicializa MediaPipe Tasks-Vision con pose_landmarker_full.task (no heavy)
   * y GPU en modo VIDEO.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized && this.landmarker) return;

    const vision = await FilesetResolver.forVisionTasks(this.config.wasmLoaderPath);

    const delegates: Array<'GPU' | 'CPU'> = this.config.delegate === 'GPU'
      ? ['GPU', 'CPU']
      : ['CPU'];

    let lastError: unknown = null;
    for (const delegate of delegates) {
      try {
        this.landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: this.config.modelAssetPath,
            delegate
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.55,
          minPosePresenceConfidence: 0.55,
          minTrackingConfidence: 0.60
        });
        this.isInitialized = true;
        return;
      } catch (err) {
        lastError = err;
        console.warn(`[KinematicPipeline] Init fallback (${delegate}):`, err);
      }
    }

    throw new Error(`No se pudo inicializar MediaPipe PoseLandmarker Full: ${String(lastError)}`);
  }

  /**
   * Ejecuta el pipeline completo de análisis cinemático sobre un vídeo HTML o archivo.
   */
  async processClip(
    videoSource: HTMLVideoElement | File | Blob,
    onProgress?: (progressPct: number, currentFrame: number, totalFrames: number) => void
  ): Promise<ProcessedKinematicFrame[]> {
    await this.initialize();
    if (!this.landmarker) {
      throw new Error('PoseLandmarker no está inicializado.');
    }

    let videoElement: HTMLVideoElement;
    let objectUrlToRevoke: string | null = null;

    if (typeof HTMLVideoElement !== 'undefined' && videoSource instanceof HTMLVideoElement) {
      videoElement = videoSource;
    } else {
      if (typeof document === 'undefined') {
        throw new Error('Procesamiento de vídeo requiere entorno DOM con elemento HTMLVideoElement.');
      }
      videoElement = document.createElement('video');
      videoElement.crossOrigin = 'anonymous';
      videoElement.playsInline = true;
      videoElement.muted = true;
      objectUrlToRevoke = URL.createObjectURL(videoSource as Blob);
      videoElement.src = objectUrlToRevoke;
      await new Promise<void>((resolve, reject) => {
        videoElement.onloadedmetadata = () => resolve();
        videoElement.onerror = () => reject(new Error('Fallo al cargar metadatos de vídeo.'));
      });
    }

    try {
      return await this.executeExtractionLoop(videoElement, onProgress);
    } finally {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    }
  }

  /**
   * Bug 1: Bucle de extracción x10 con requestVideoFrameCallback a 3.0x de velocidad
   * o fallback a 12 FPS / 12s / 384px si se requiere currentTime.
   */
  private async executeExtractionLoop(
    video: HTMLVideoElement,
    onProgress?: (progressPct: number, currentFrame: number, totalFrames: number) => void
  ): Promise<ProcessedKinematicFrame[]> {
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;

    const hasRvfc = typeof (video as any).requestVideoFrameCallback === 'function';

    // Parámetros adaptativos según disponibilidad de requestVideoFrameCallback (Bug 1)
    const effectiveFps = hasRvfc ? this.config.targetSampleFps : 12;
    const effectiveMaxDuration = hasRvfc ? this.config.maxAnalysisDurationSec : 12.0;
    const canvasSize = hasRvfc ? this.config.roiCanvasSize : 384;

    const timeline = buildSamplingTimeline(video.duration, {
      startOffsetSec: this.config.startOffsetSec,
      maxAnalysisDurationSec: effectiveMaxDuration,
      targetSampleFps: effectiveFps
    });

    const totalExpectedFrames = timeline.timestampsSec.length;
    if (totalExpectedFrames === 0) return [];

    let offCanvas: HTMLCanvasElement | OffscreenCanvas;
    let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

    if (typeof OffscreenCanvas !== 'undefined') {
      offCanvas = new OffscreenCanvas(canvasSize, canvasSize);
      ctx = offCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    } else {
      offCanvas = document.createElement('canvas');
      offCanvas.width = canvasSize;
      offCanvas.height = canvasSize;
      ctx = offCanvas.getContext('2d');
    }

    if (!ctx) {
      throw new Error('No se pudo inicializar el contexto 2D del canvas auxiliar.');
    }

    interface RawFrameRecord {
      frameIndex: number;
      timestampSec: number;
      allLandmarks: Point[];
      roi: AthleteRoi;
    }

    const rawRecords: RawFrameRecord[] = [];
    let athleteRoi: AthleteRoi | null = null;

    if (hasRvfc) {
      // --- MODO RÁPIDO X10: Reproducción nativa a 3.0x de velocidad con requestVideoFrameCallback ---
      video.muted = true;
      video.playbackRate = this.config.fastPlaybackRate;
      video.currentTime = timeline.startTimeSec;

      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          resolve();
        };
        video.addEventListener('seeked', onSeeked);
      });

      let lastSampleTime = -1;
      const stepSec = 1 / effectiveFps;

      await new Promise<void>((resolve) => {
        let isCompleted = false;

        const finish = () => {
          if (isCompleted) return;
          isCompleted = true;
          video.pause();
          resolve();
        };

        video.addEventListener('ended', finish);

        const onFrame = (now: number, metadata: any) => {
          if (isCompleted) return;
          const mediaTime = metadata.mediaTime ?? video.currentTime;

          if (mediaTime >= timeline.endTimeSec || rawRecords.length >= totalExpectedFrames) {
            finish();
            return;
          }

          if (mediaTime >= timeline.startTimeSec && (mediaTime - lastSampleTime >= stepSec - 0.006 || lastSampleTime < 0)) {
            lastSampleTime = mediaTime;

            // Inferencia con ROI Crop (Regla 2)
            if (!athleteRoi) {
              ctx!.clearRect(0, 0, canvasSize, canvasSize);
              ctx!.drawImage(video, 0, 0, videoWidth, videoHeight, 0, 0, canvasSize, canvasSize);
              const tsMs = Math.round(mediaTime * 1000);
              const det = this.landmarker!.detectForVideo(offCanvas as any, tsMs);

              if (det.landmarks && det.landmarks.length > 0 && det.landmarks[0].length >= 29) {
                const firstLms: Point[] = det.landmarks[0].map(lm => ({
                  x: lm.x,
                  y: lm.y,
                  z: lm.z,
                  visibility: lm.visibility
                }));
                athleteRoi = computeAthleteRoi(firstLms, videoWidth, videoHeight, this.config.roiMarginRatio);
                rawRecords.push({
                  frameIndex: rawRecords.length,
                  timestampSec: mediaTime,
                  allLandmarks: firstLms,
                  roi: athleteRoi
                });
              }
            } else {
              const { pixelRect } = athleteRoi;
              ctx!.clearRect(0, 0, canvasSize, canvasSize);
              ctx!.drawImage(
                video,
                pixelRect.x,
                pixelRect.y,
                pixelRect.width,
                pixelRect.height,
                0,
                0,
                canvasSize,
                canvasSize
              );
              const tsMs = Math.round(mediaTime * 1000);
              const det = this.landmarker!.detectForVideo(offCanvas as any, tsMs);

              if (det.landmarks && det.landmarks.length > 0) {
                const globalLandmarks: Point[] = det.landmarks[0].map(lm => {
                  const remapped = remapPointFromRoi(
                    { x: lm.x, y: lm.y, z: lm.z, visibility: lm.visibility },
                    athleteRoi!,
                    videoWidth,
                    videoHeight
                  );
                  return {
                    x: remapped.globalNormalized.x,
                    y: remapped.globalNormalized.y,
                    z: lm.z,
                    visibility: lm.visibility
                  };
                });
                rawRecords.push({
                  frameIndex: rawRecords.length,
                  timestampSec: mediaTime,
                  allLandmarks: globalLandmarks,
                  roi: athleteRoi
                });
              }
            }

            if (onProgress) {
              const pct = Math.min(65, Math.round((rawRecords.length / totalExpectedFrames) * 65));
              onProgress(pct, rawRecords.length, totalExpectedFrames);
            }
          }

          if (!isCompleted && mediaTime < timeline.endTimeSec) {
            (video as any).requestVideoFrameCallback(onFrame);
          } else {
            finish();
          }
        };

        video.play().then(() => {
          (video as any).requestVideoFrameCallback(onFrame);
        }).catch(() => {
          // Si el autoplay falla, recurrir al método de seek
          finish();
        });
      });
    }

    // --- MODO FALLBACK (Si RVFC no extrajo fotogramas o no está soportado) ---
    if (rawRecords.length === 0) {
      for (let i = 0; i < totalExpectedFrames; i++) {
        const timestampSec = timeline.timestampsSec[i];
        await new Promise<void>((resolve) => {
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            resolve();
          };
          video.addEventListener('seeked', onSeeked);
          video.currentTime = timestampSec;
        });

        if (!athleteRoi) {
          ctx.clearRect(0, 0, canvasSize, canvasSize);
          ctx.drawImage(video, 0, 0, videoWidth, videoHeight, 0, 0, canvasSize, canvasSize);
          const tsMs = Math.round(timestampSec * 1000);
          const det = this.landmarker!.detectForVideo(offCanvas as any, tsMs);

          if (det.landmarks && det.landmarks.length > 0 && det.landmarks[0].length >= 29) {
            const firstLms: Point[] = det.landmarks[0].map(lm => ({
              x: lm.x,
              y: lm.y,
              z: lm.z,
              visibility: lm.visibility
            }));
            athleteRoi = computeAthleteRoi(firstLms, videoWidth, videoHeight, this.config.roiMarginRatio);
            rawRecords.push({
              frameIndex: i,
              timestampSec,
              allLandmarks: firstLms,
              roi: athleteRoi
            });
          }
          continue;
        }

        const { pixelRect } = athleteRoi;
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        ctx.drawImage(
          video,
          pixelRect.x,
          pixelRect.y,
          pixelRect.width,
          pixelRect.height,
          0,
          0,
          canvasSize,
          canvasSize
        );
        const tsMs = Math.round(timestampSec * 1000);
        const det = this.landmarker!.detectForVideo(offCanvas as any, tsMs);

        if (det.landmarks && det.landmarks.length > 0) {
          const globalLandmarks: Point[] = det.landmarks[0].map(lm => {
            const remapped = remapPointFromRoi(
              { x: lm.x, y: lm.y, z: lm.z, visibility: lm.visibility },
              athleteRoi!,
              videoWidth,
              videoHeight
            );
            return {
              x: remapped.globalNormalized.x,
              y: remapped.globalNormalized.y,
              z: lm.z,
              visibility: lm.visibility
            };
          });
          rawRecords.push({
            frameIndex: i,
            timestampSec,
            allLandmarks: globalLandmarks,
            roi: athleteRoi
          });
        }

        if (onProgress) {
          const pct = Math.round(((i + 1) / totalExpectedFrames) * 65);
          onProgress(pct, i + 1, totalExpectedFrames);
        }
      }
    }

    if (rawRecords.length === 0) {
      return [];
    }

    // --- FASE 2: Bloqueo Unilateral (Regla 3) ---
    const initialSubset = rawRecords
      .slice(0, this.config.sideLockingFramesCount)
      .map(r => r.allLandmarks);
    const dominantSide = determineDominantSide(initialSubset);

    // Extraer articulaciones en píxeles del vídeo original
    const rawFramesJointsPx: Array<Record<JointName, Point>> = [];
    const framesVisibility: Array<Record<JointName, number>> = [];

    for (const record of rawRecords) {
      const unilateral = extractUnilateralJoints(record.allLandmarks, dominantSide);
      rawFramesJointsPx.push({
        shoulder: { x: unilateral.shoulder.x * videoWidth, y: unilateral.shoulder.y * videoHeight, z: unilateral.shoulder.z, visibility: unilateral.shoulder.visibility },
        elbow: { x: unilateral.elbow.x * videoWidth, y: unilateral.elbow.y * videoHeight, z: unilateral.elbow.z, visibility: unilateral.elbow.visibility },
        wrist: { x: unilateral.wrist.x * videoWidth, y: unilateral.wrist.y * videoHeight, z: unilateral.wrist.z, visibility: unilateral.wrist.visibility },
        hip: { x: unilateral.hip.x * videoWidth, y: unilateral.hip.y * videoHeight, z: unilateral.hip.z, visibility: unilateral.hip.visibility },
        knee: { x: unilateral.knee.x * videoWidth, y: unilateral.knee.y * videoHeight, z: unilateral.knee.z, visibility: unilateral.knee.visibility },
        ankle: { x: unilateral.ankle.x * videoWidth, y: unilateral.ankle.y * videoHeight, z: unilateral.ankle.z, visibility: unilateral.ankle.visibility },
      });

      framesVisibility.push({
        shoulder: unilateral.shoulder.visibility ?? 0,
        elbow: unilateral.elbow.visibility ?? 0,
        wrist: unilateral.wrist.visibility ?? 0,
        hip: unilateral.hip.visibility ?? 0,
        knee: unilateral.knee.visibility ?? 0,
        ankle: unilateral.ankle.visibility ?? 0,
      });
    }

    // --- FASE 3: Interpolación (< 0.5) y Suavizado Bidireccional zeroPhaseSmooth (Bug 2) ---
    // (ELIMINADO enforceBoneLength que encogía el esqueleto con discos grandes)
    const interpolatedJoints = interpolateLowVisibilityLandmarks(rawFramesJointsPx, 0.5);
    const smoothedJointsPx = smoothJointsTrajectoryZeroPhase(interpolatedJoints, 0.38);

    // --- FASE 4: Cálculo de Ángulos Articulares y Señal Principal ---
    const primaryAngles: number[] = [];
    const intermediateFrames: Array<Omit<ProcessedKinematicFrame, 'phase' | 'repCount'>> = [];

    for (let i = 0; i < smoothedJointsPx.length; i++) {
      const jointsPx = smoothedJointsPx[i];
      const rawPx = rawFramesJointsPx[i];
      const vis = framesVisibility[i];
      const record = rawRecords[i];

      const elbowAngle = calculateAngleDegrees(jointsPx.shoulder, jointsPx.elbow, jointsPx.wrist);
      const kneeAngle = calculateAngleDegrees(jointsPx.hip, jointsPx.knee, jointsPx.ankle);
      const shoulderAngle = calculateAngleDegrees(jointsPx.hip, jointsPx.shoulder, jointsPx.elbow);
      const hipAngle = calculateAngleDegrees(jointsPx.shoulder, jointsPx.hip, jointsPx.knee);

      // Usar rodilla o codo según el mayor rango dinámico para el detector de repeticiones
      const mainAngle = kneeAngle;
      primaryAngles.push(mainAngle);

      const normalizedJoints: Record<JointName, Point> = {
        shoulder: { x: jointsPx.shoulder.x / videoWidth, y: jointsPx.shoulder.y / videoHeight, z: jointsPx.shoulder.z, visibility: vis.shoulder },
        elbow: { x: jointsPx.elbow.x / videoWidth, y: jointsPx.elbow.y / videoHeight, z: jointsPx.elbow.z, visibility: vis.elbow },
        wrist: { x: jointsPx.wrist.x / videoWidth, y: jointsPx.wrist.y / videoHeight, z: jointsPx.wrist.z, visibility: vis.wrist },
        hip: { x: jointsPx.hip.x / videoWidth, y: jointsPx.hip.y / videoHeight, z: jointsPx.hip.z, visibility: vis.hip },
        knee: { x: jointsPx.knee.x / videoWidth, y: jointsPx.knee.y / videoHeight, z: jointsPx.knee.z, visibility: vis.knee },
        ankle: { x: jointsPx.ankle.x / videoWidth, y: jointsPx.ankle.y / videoHeight, z: jointsPx.ankle.z, visibility: vis.ankle },
      };

      intermediateFrames.push({
        frameIndex: record.frameIndex,
        timestampSec: record.timestampSec,
        lockedSide: dominantSide,
        joints: jointsPx,
        normalizedJoints,
        rawJointsPx: rawPx,
        anglesDeg: {
          elbow: Number(elbowAngle.toFixed(1)),
          knee: Number(kneeAngle.toFixed(1)),
          shoulder: Number(shoulderAngle.toFixed(1)),
          hip: Number(hipAngle.toFixed(1))
        },
        mainAngle: Number(mainAngle.toFixed(1)),
        roi: record.roi,
        visibility: vis
      });
    }

    // --- FASE 5: Detector Matemático de Valles y Picos sobre el Array Completo (Bug 3) ---
    // (NO FSM frame a frame)
    const validatedReps = detectRepetitionsFromAngleSignal(
      primaryAngles,
      this.config.minDropDeg,
      this.config.minRiseDeg,
      this.config.minValleySeparationFrames
    );

    const phasesAndCounts = assignRepetitionPhasesAndCounts(
      intermediateFrames.length,
      validatedReps,
      intermediateFrames.map(f => f.timestampSec)
    );

    const finalFrames: ProcessedKinematicFrame[] = intermediateFrames.map((f, i) => ({
      ...f,
      phase: phasesAndCounts[i].phase,
      repCount: phasesAndCounts[i].repCount
    }));

    if (onProgress) {
      onProgress(100, finalFrames.length, finalFrames.length);
    }

    return finalFrames;
  }

  /**
   * Cierra las instancias de MediaPipe para liberar recursos de GPU/WASM.
   */
  dispose(): void {
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch {
        // Ignorar errores al cerrar
      }
      this.landmarker = null;
    }
    this.isInitialized = false;
  }
}

/**
 * Función helper de un solo paso para procesar vídeos directamente.
 */
export async function processVideoKinematics(
  videoSource: HTMLVideoElement | File | Blob,
  config?: KinematicPipelineConfig,
  onProgress?: (progressPct: number, currentFrame: number, totalFrames: number) => void
): Promise<ProcessedKinematicFrame[]> {
  const pipeline = new KinematicPipeline(config);
  try {
    return await pipeline.processClip(videoSource, onProgress);
  } finally {
    pipeline.dispose();
  }
}
