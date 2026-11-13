/**
 * kinematicPipeline.ts
 * 
 * Pipeline de Visión por Computador y Cinemática Pura 100% en cliente (Navegador/Local).
 * Refactorización matemática y secuencial para estabilización sub-píxel de articulaciones:
 * 
 * 1. Configuración del Modelo Local y Muestreo (@mediapipe/tasks-vision heavy GPU, 20s @ 15 FPS, skip 2s).
 * 2. Recorte Dinámico alrededor del Atleta (ROI Crop 512x512 con margen del 25%).
 * 3. Bloqueo Unilateral (Side-Locking en primeros 15 frames sumando visibility de lados).
 * 4. Calibración y Bloqueo de Longitud Ósea (Mediana euclidiana con visibilidad > 0.85 y enforceBoneLength).
 * 5. Ensamblado y Exportación de Fotogramas Cinemáticos Estables.
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

export interface CalibratedBoneLengthsPx {
  L_humero: number;    // Hombro -> Codo
  L_antebrazo: number; // Codo -> Muñeca
  L_femur: number;     // Cadera -> Rodilla
  L_tibia: number;     // Rodilla -> Tobillo
}

export interface ProcessedKinematicFrame {
  frameIndex: number;
  timestampSec: number;
  lockedSide: BodySide;
  /** Coordenadas globales en píxeles del vídeo original tras bloqueo óseo */
  joints: Record<JointName, Point>;
  /** Coordenadas normalizadas [0, 1] en el espacio global del vídeo original */
  normalizedJoints: Record<JointName, Point>;
  /** Coordenadas originales sin corrección ósea para auditoría/diagnóstico */
  rawJointsPx: Record<JointName, Point>;
  /** Ángulos articulares calculados en grados */
  anglesDeg: {
    elbow: number;     // Flexión de codo (Hombro - Codo - Muñeca)
    knee: number;      // Ángulo de rodilla (Cadera - Rodilla - Tobillo)
    shoulder: number;  // Ángulo de hombro respecto a la vertical/cadera
    hip: number;       // Ángulo de cadera (Hombro - Cadera - Rodilla)
  };
  /** Longitudes óseas fijadas para este clip */
  calibratedBoneLengthsPx: CalibratedBoneLengthsPx;
  /** Región de interés (ROI) utilizada para la inferencia */
  roi: AthleteRoi;
  /** Visibilidad registrada por articulación */
  visibility: Record<JointName, number>;
}

export interface KinematicPipelineConfig {
  /** Offset inicial a omitir (segundos). Regla 1: 2.0s */
  startOffsetSec?: number;
  /** Duración máxima de análisis (segundos). Regla 1: 20.0s */
  maxAnalysisDurationSec?: number;
  /** Frecuencia de muestreo (FPS). Regla 1: 15 FPS */
  targetSampleFps?: number;
  /** Ruta o URL del modelo MediaPipe Pose. Regla 1: heavy */
  modelAssetPath?: string;
  /** Ruta o URL de los binarios WASM de MediaPipe */
  wasmLoaderPath?: string;
  /** Delegado de inferencia: GPU preferente con fallback a CPU */
  delegate?: 'GPU' | 'CPU';
  /** Margen por cada lado para el recorte dinámico. Regla 2: 25% */
  roiMarginRatio?: number;
  /** Dimensión del lienzo auxiliar en píxeles. Regla 2: 512x512 */
  roiCanvasSize?: number;
  /** Número de fotogramas iniciales para decidir el lado bloqueado. Regla 3: 15 frames */
  sideLockingFramesCount?: number;
  /** Umbral mínimo de visibilidad para calibrar la longitud de los huesos. Regla 4: 0.85 */
  boneLengthMinVisibility?: number;
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

// Parámetros por defecto según especificación estricta
export const DEFAULT_PIPELINE_CONFIG: Required<KinematicPipelineConfig> = {
  startOffsetSec: 2.0,
  maxAnalysisDurationSec: 20.0,
  targetSampleFps: 15,
  modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task',
  wasmLoaderPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
  delegate: 'GPU',
  roiMarginRatio: 0.25,
  roiCanvasSize: 512,
  sideLockingFramesCount: 15,
  boneLengthMinVisibility: 0.85
};

// ============================================================================
// Funciones Matemáticas Puras (Reglas 1, 2, 3 y 4)
// ============================================================================

/**
 * Calcula la mediana estadística de un conjunto de números.
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
 * Regla 4 (Fórmula Obligatoria):
 * Toma un ancla proximal y recalcula la posición del punto objetivo manteniendo
 * exactamente la dirección del vector pero forzando la longitud fija especificada.
 */
export function enforceBoneLength(anchor: Point, target: Point, fixedLength: number): Point {
  const dx = target.x - anchor.x;
  const dy = target.y - anchor.y;
  const currentDist = Math.hypot(dx, dy) || 1e-5;
  return {
    x: anchor.x + (dx / currentDist) * fixedLength,
    y: anchor.y + (dy / currentDist) * fixedLength,
    z: target.z,
    visibility: target.visibility
  };
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
 * Regla 1: Ventana de Muestreo Temporal
 * Omite los primeros 2 segundos muertos, limita a 20s y genera pasos a 15 FPS.
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

  // Si el vídeo dura menos que el offset, arrancar suavemente desde un 5%
  const startTimeSec = videoDurationSec <= startOffset
    ? Math.max(0, videoDurationSec * 0.05)
    : startOffset;

  const endTimeSec = Math.min(startTimeSec + maxDuration, videoDurationSec);
  const durationSec = Math.max(0, endTimeSec - startTimeSec);

  const timestampsSec: number[] = [];
  for (let t = startTimeSec; t < endTimeSec - 1e-4; t += stepSec) {
    timestampsSec.push(Number(t.toFixed(4)));
  }

  // Asegurar que al menos haya un fotograma si la duración es válida
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
 * Regla 2: Recorte Dinámico alrededor del Atleta (ROI Crop)
 * Extrae el bounding box del cuerpo con un margen del 25% por cada lado.
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
    // Omitir puntos totalmente invisibles o artefactos espurios
    if (lm.visibility !== undefined && lm.visibility < 0.20) continue;
    if (lm.x < minX) minX = lm.x;
    if (lm.x > maxX) maxX = lm.x;
    if (lm.y < minY) minY = lm.y;
    if (lm.y > maxY) maxY = lm.y;
    validCount++;
  }

  // Si no se detectan puntos fiables, abarcar el frame completo
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
 * Regla 2: Reconversión de coordenadas normalizadas del ROI [0, 1]
 * al sistema de coordenadas global del vídeo original.
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
 * Regla 3: Bloqueo Unilateral (Side-Locking)
 * Suma la visibilidad de los landmarks del lado izquierdo (11, 13, 15, 23, 25, 27)
 * frente al lado derecho (12, 14, 16, 24, 26, 28) en los primeros 15 frames procesados.
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
 * Extrae las 6 articulaciones maestras para el lado unilateral seleccionado.
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

/**
 * Regla 4.1: Calibración de Longitud Ósea
 * Filtra los frames con visibilidad > 0.85 y calcula la mediana de distancia
 * euclidiana en píxeles para L_humero, L_antebrazo, L_femur, L_tibia.
 */
export function calibrateBoneLengthsPx(
  framesJointsPx: Record<JointName, Point>[],
  minVisibility = DEFAULT_PIPELINE_CONFIG.boneLengthMinVisibility
): CalibratedBoneLengthsPx {
  const humerusDistances: number[] = [];
  const forearmDistances: number[] = [];
  const femurDistances: number[] = [];
  const tibiaDistances: number[] = [];

  // Muestreo estricto con visibilidad >= minVisibility
  for (const joints of framesJointsPx) {
    const sVis = joints.shoulder.visibility ?? 1;
    const eVis = joints.elbow.visibility ?? 1;
    const wVis = joints.wrist.visibility ?? 1;
    const hVis = joints.hip.visibility ?? 1;
    const kVis = joints.knee.visibility ?? 1;
    const aVis = joints.ankle.visibility ?? 1;

    if (sVis >= minVisibility && eVis >= minVisibility) {
      humerusDistances.push(euclideanDistance2D(joints.shoulder, joints.elbow));
    }
    if (eVis >= minVisibility && wVis >= minVisibility) {
      forearmDistances.push(euclideanDistance2D(joints.elbow, joints.wrist));
    }
    if (hVis >= minVisibility && kVis >= minVisibility) {
      femurDistances.push(euclideanDistance2D(joints.hip, joints.knee));
    }
    if (kVis >= minVisibility && aVis >= minVisibility) {
      tibiaDistances.push(euclideanDistance2D(joints.knee, joints.ankle));
    }
  }

  // Fallback adaptativo si la toma tiene iluminación deficiente y pocas muestras > 0.85
  const collectWithRelaxedVis = (targetList: number[], getDist: (j: Record<JointName, Point>) => number, checkVis: (j: Record<JointName, Point>) => boolean) => {
    if (targetList.length >= 3) return;
    for (const joints of framesJointsPx) {
      if (checkVis(joints)) {
        targetList.push(getDist(joints));
      }
    }
    // Si aún no hay muestras, usar todos los frames disponibles que tengan distancia positiva
    if (targetList.length === 0) {
      for (const joints of framesJointsPx) {
        const d = getDist(joints);
        if (d > 5) targetList.push(d);
      }
    }
  };

  collectWithRelaxedVis(
    humerusDistances,
    j => euclideanDistance2D(j.shoulder, j.elbow),
    j => (j.shoulder.visibility ?? 0) >= 0.5 && (j.elbow.visibility ?? 0) >= 0.5
  );
  collectWithRelaxedVis(
    forearmDistances,
    j => euclideanDistance2D(j.elbow, j.wrist),
    j => (j.elbow.visibility ?? 0) >= 0.5 && (j.wrist.visibility ?? 0) >= 0.5
  );
  collectWithRelaxedVis(
    femurDistances,
    j => euclideanDistance2D(j.hip, j.knee),
    j => (j.hip.visibility ?? 0) >= 0.5 && (j.knee.visibility ?? 0) >= 0.5
  );
  collectWithRelaxedVis(
    tibiaDistances,
    j => euclideanDistance2D(j.knee, j.ankle),
    j => (j.knee.visibility ?? 0) >= 0.5 && (j.ankle.visibility ?? 0) >= 0.5
  );

  return {
    L_humero: Math.max(10, calculateMedian(humerusDistances)),
    L_antebrazo: Math.max(10, calculateMedian(forearmDistances)),
    L_femur: Math.max(10, calculateMedian(femurDistances)),
    L_tibia: Math.max(10, calculateMedian(tibiaDistances)),
  };
}

/**
 * Regla 4.2: Bloqueo de Longitud Ósea (Chaining Proximal -> Distal)
 * Recalcula la posición del codo/muñeca y rodilla/tobillo forzando las longitudes fijas
 * mediante la fórmula vectorial estricta.
 */
export function applyKinematicBoneLocking(
  rawJointsPx: Record<JointName, Point>,
  boneLengths: CalibratedBoneLengthsPx
): Record<JointName, Point> {
  // Cadena cinemática de miembro superior (Ancla proximal: Hombro)
  const shoulder = { ...rawJointsPx.shoulder };
  const elbow = enforceBoneLength(shoulder, rawJointsPx.elbow, boneLengths.L_humero);
  const wrist = enforceBoneLength(elbow, rawJointsPx.wrist, boneLengths.L_antebrazo);

  // Cadena cinemática de miembro inferior (Ancla proximal: Cadera)
  const hip = { ...rawJointsPx.hip };
  const knee = enforceBoneLength(hip, rawJointsPx.knee, boneLengths.L_femur);
  const ankle = enforceBoneLength(knee, rawJointsPx.ankle, boneLengths.L_tibia);

  return {
    shoulder,
    elbow,
    wrist,
    hip,
    knee,
    ankle
  };
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
   * Inicializa MediaPipe Tasks-Vision con el modelo Heavy y GPU en modo VIDEO.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized && this.landmarker) return;

    const vision = await FilesetResolver.forVisionTasks(this.config.wasmLoaderPath);

    // Intentar primero GPU según especificación técnica (Regla 1) con fallback elegante a CPU
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
          minPoseDetectionConfidence: 0.6,
          minPosePresenceConfidence: 0.6,
          minTrackingConfidence: 0.65
        });
        this.isInitialized = true;
        return;
      } catch (err) {
        lastError = err;
        console.warn(`[KinematicPipeline] Init fallback (${delegate}):`, err);
      }
    }

    throw new Error(`No se pudo inicializar MediaPipe PoseLandmarker Heavy: ${String(lastError)}`);
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
   * Bucle secuencial de extracción respetando las 5 reglas técnicas.
   */
  private async executeExtractionLoop(
    video: HTMLVideoElement,
    onProgress?: (progressPct: number, currentFrame: number, totalFrames: number) => void
  ): Promise<ProcessedKinematicFrame[]> {
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;

    // 1. Muestreo temporal
    const timeline = buildSamplingTimeline(video.duration, this.config);
    const totalFrames = timeline.timestampsSec.length;
    if (totalFrames === 0) return [];

    // 2. OffscreenCanvas auxiliar 512x512
    const canvasSize = this.config.roiCanvasSize;
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

    // Estructuras intermedias
    interface RawFrameRecord {
      frameIndex: number;
      timestampSec: number;
      allLandmarks: Point[];
      roi: AthleteRoi;
    }

    const rawRecords: RawFrameRecord[] = [];
    let athleteRoi: AthleteRoi | null = null;

    // Helper de búsqueda precisa de fotograma
    const seekVideoFrame = async (targetSec: number): Promise<void> => {
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          if ('requestVideoFrameCallback' in video) {
            (video as any).requestVideoFrameCallback(() => resolve());
          } else {
            resolve();
          }
        };
        video.addEventListener('seeked', onSeeked);
        video.currentTime = targetSec;
      });
    };

    // --- FASE 1: Detección frame a frame con ROI Crop (Reglas 1 y 2) ---
    for (let i = 0; i < totalFrames; i++) {
      const timestampSec = timeline.timestampsSec[i];
      await seekVideoFrame(timestampSec);

      // Si aún no tenemos ROI, usar frame completo para hallar bounding box inicial
      if (!athleteRoi) {
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight, 0, 0, canvasSize, canvasSize);

        const videoTimestampMs = Math.round(timestampSec * 1000);
        const result = this.landmarker!.detectForVideo(offCanvas as any, videoTimestampMs);

        if (result.landmarks && result.landmarks.length > 0 && result.landmarks[0].length >= 29) {
          const firstLms: Point[] = result.landmarks[0].map(lm => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility
          }));

          // Regla 2: Recorte dinámico con 25% de margen
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

      // Con ROI calculado: dibujar únicamente el recorte del atleta en el canvas 512x512
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

      const videoTimestampMs = Math.round(timestampSec * 1000);
      const result = this.landmarker!.detectForVideo(offCanvas as any, videoTimestampMs);

      if (result.landmarks && result.landmarks.length > 0) {
        const roiLandmarks = result.landmarks[0];
        // Reconvertir coordenadas normalizadas del ROI al sistema global del vídeo
        const globalLandmarks: Point[] = roiLandmarks.map(lm => {
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
        const pct = Math.round(((i + 1) / totalFrames) * 60); // 0% - 60% para inferencia
        onProgress(pct, i + 1, totalFrames);
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

    // Extraer articulaciones unilaterales en píxeles del vídeo original
    const framesJointsPx: Array<{
      frameIndex: number;
      timestampSec: number;
      roi: AthleteRoi;
      jointsPx: Record<JointName, Point>;
      visibility: Record<JointName, number>;
    }> = [];

    for (const record of rawRecords) {
      const unilateral = extractUnilateralJoints(record.allLandmarks, dominantSide);
      const jointsPx: Record<JointName, Point> = {
        shoulder: { x: unilateral.shoulder.x * videoWidth, y: unilateral.shoulder.y * videoHeight, z: unilateral.shoulder.z, visibility: unilateral.shoulder.visibility },
        elbow: { x: unilateral.elbow.x * videoWidth, y: unilateral.elbow.y * videoHeight, z: unilateral.elbow.z, visibility: unilateral.elbow.visibility },
        wrist: { x: unilateral.wrist.x * videoWidth, y: unilateral.wrist.y * videoHeight, z: unilateral.wrist.z, visibility: unilateral.wrist.visibility },
        hip: { x: unilateral.hip.x * videoWidth, y: unilateral.hip.y * videoHeight, z: unilateral.hip.z, visibility: unilateral.hip.visibility },
        knee: { x: unilateral.knee.x * videoWidth, y: unilateral.knee.y * videoHeight, z: unilateral.knee.z, visibility: unilateral.knee.visibility },
        ankle: { x: unilateral.ankle.x * videoWidth, y: unilateral.ankle.y * videoHeight, z: unilateral.ankle.z, visibility: unilateral.ankle.visibility },
      };

      const visibility: Record<JointName, number> = {
        shoulder: unilateral.shoulder.visibility ?? 0,
        elbow: unilateral.elbow.visibility ?? 0,
        wrist: unilateral.wrist.visibility ?? 0,
        hip: unilateral.hip.visibility ?? 0,
        knee: unilateral.knee.visibility ?? 0,
        ankle: unilateral.ankle.visibility ?? 0,
      };

      framesJointsPx.push({
        frameIndex: record.frameIndex,
        timestampSec: record.timestampSec,
        roi: record.roi,
        jointsPx,
        visibility
      });
    }

    // --- FASE 3: Calibración de Longitud Ósea (Regla 4.1) ---
    const calibratedBoneLengths = calibrateBoneLengthsPx(
      framesJointsPx.map(f => f.jointsPx),
      this.config.boneLengthMinVisibility
    );

    // --- FASE 4: Bloqueo Óseo y Ensamblado Cinemático (Regla 4.2) ---
    const finalFrames: ProcessedKinematicFrame[] = [];

    for (let i = 0; i < framesJointsPx.length; i++) {
      const f = framesJointsPx[i];

      // Bloqueo vectorial rígido
      const lockedJointsPx = applyKinematicBoneLocking(f.jointsPx, calibratedBoneLengths);

      // Conversión normalizada [0, 1]
      const normalizedJoints: Record<JointName, Point> = {
        shoulder: { x: lockedJointsPx.shoulder.x / videoWidth, y: lockedJointsPx.shoulder.y / videoHeight, z: lockedJointsPx.shoulder.z, visibility: lockedJointsPx.shoulder.visibility },
        elbow: { x: lockedJointsPx.elbow.x / videoWidth, y: lockedJointsPx.elbow.y / videoHeight, z: lockedJointsPx.elbow.z, visibility: lockedJointsPx.elbow.visibility },
        wrist: { x: lockedJointsPx.wrist.x / videoWidth, y: lockedJointsPx.wrist.y / videoHeight, z: lockedJointsPx.wrist.z, visibility: lockedJointsPx.wrist.visibility },
        hip: { x: lockedJointsPx.hip.x / videoWidth, y: lockedJointsPx.hip.y / videoHeight, z: lockedJointsPx.hip.z, visibility: lockedJointsPx.hip.visibility },
        knee: { x: lockedJointsPx.knee.x / videoWidth, y: lockedJointsPx.knee.y / videoHeight, z: lockedJointsPx.knee.z, visibility: lockedJointsPx.knee.visibility },
        ankle: { x: lockedJointsPx.ankle.x / videoWidth, y: lockedJointsPx.ankle.y / videoHeight, z: lockedJointsPx.ankle.z, visibility: lockedJointsPx.ankle.visibility },
      };

      // Cálculo exacto de ángulos articulares
      const elbowAngle = calculateAngleDegrees(
        lockedJointsPx.shoulder,
        lockedJointsPx.elbow,
        lockedJointsPx.wrist
      );
      const kneeAngle = calculateAngleDegrees(
        lockedJointsPx.hip,
        lockedJointsPx.knee,
        lockedJointsPx.ankle
      );
      const shoulderAngle = calculateAngleDegrees(
        lockedJointsPx.hip,
        lockedJointsPx.shoulder,
        lockedJointsPx.elbow
      );
      const hipAngle = calculateAngleDegrees(
        lockedJointsPx.shoulder,
        lockedJointsPx.hip,
        lockedJointsPx.knee
      );

      finalFrames.push({
        frameIndex: f.frameIndex,
        timestampSec: f.timestampSec,
        lockedSide: dominantSide,
        joints: lockedJointsPx,
        normalizedJoints,
        rawJointsPx: f.jointsPx,
        anglesDeg: {
          elbow: Number(elbowAngle.toFixed(2)),
          knee: Number(kneeAngle.toFixed(2)),
          shoulder: Number(shoulderAngle.toFixed(2)),
          hip: Number(hipAngle.toFixed(2))
        },
        calibratedBoneLengthsPx: calibratedBoneLengths,
        roi: f.roi,
        visibility: f.visibility
      });

      if (onProgress) {
        const pct = Math.round(60 + ((i + 1) / framesJointsPx.length) * 40); // 60% - 100%
        onProgress(pct, i + 1, framesJointsPx.length);
      }
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
