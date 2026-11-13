/**
 * kinematicPipeline.ts
 * 
 * Pipeline de Visión por Computador y Cinemática Pura 100% en cliente (Navegador/Local).
 * Refactorizado para exactitud anatómica 1:1 sobre el vídeo real:
 * 
 * 1. Detección Directa sobre el elemento <video> (ELIMINADO cropToAthlete y OffscreenCanvas intermedio).
 *    MediaPipe gestiona internamente el tracking en modo VIDEO sin deformación de Aspect Ratio.
 * 2. Sin deformación ósea: ELIMINADO enforceBoneLength. Coordenadas [0..1] reales preservadas
 *    con interpolación de baja visibilidad (< 0.5) y suavizado temporal zeroPhaseSmooth (lag = 0).
 * 3. Renderizado 1:1 en Canvas con alineación para 'object-fit: contain' mediante getRenderedVideoRect.
 * 4. Detector matemático de repeticiones por picos y valles sobre array completo (-25° / +20° / 12 frames).
 * 5. Visualización limpia con trazos de 3px y offsets sin solapamiento (±35px) o panel HUD.
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

export interface RenderedVideoRect {
  offsetX: number;
  offsetY: number;
  renderW: number;
  renderH: number;
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
  /** Coordenadas normalizadas directas [0..1] de MediaPipe tras zeroPhaseSmooth */
  normalizedJoints: Record<JointName, Point>;
  /** Coordenadas en píxeles del vídeo original (normalized * videoWidth/Height) */
  joints: Record<JointName, Point>;
  /** Coordenadas sin filtro temporal para auditoría/diagnóstico */
  rawJoints: Record<JointName, Point>;
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

export const DEFAULT_PIPELINE_CONFIG: Required<KinematicPipelineConfig> = {
  startOffsetSec: 2.0,
  maxAnalysisDurationSec: 20.0,
  targetSampleFps: 15,
  modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
  wasmLoaderPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
  delegate: 'GPU',
  sideLockingFramesCount: 15,
  fastPlaybackRate: 3.0,
  minDropDeg: 25,
  minRiseDeg: 20,
  minValleySeparationFrames: 12
};

// ============================================================================
// Funciones Matemáticas Puras y Proyección Geométrica
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
 * Regla 3: Calcula el rectángulo real renderizado del vídeo dentro del contenedor/canvas
 * para compensar barras negras de 'object-fit: contain' (Aspect Ratio Alignment 1:1).
 */
export function getRenderedVideoRect(
  video: { videoWidth: number; videoHeight: number },
  canvas: { width: number; height: number }
): RenderedVideoRect {
  const vW = video.videoWidth || 640;
  const vH = video.videoHeight || 480;
  const cW = canvas.width || 640;
  const cH = canvas.height || 480;

  const videoRatio = vW / vH;
  const canvasRatio = cW / cH;
  let renderW = cW;
  let renderH = cH;
  let offsetX = 0;
  let offsetY = 0;

  if (videoRatio > canvasRatio) {
    renderH = cW / videoRatio;
    offsetY = (cH - renderH) / 2;
  } else {
    renderW = cH * videoRatio;
    offsetX = (cW - renderW) / 2;
  }

  return { offsetX, offsetY, renderW, renderH };
}

/**
 * Convierte un punto normalizado [0..1] a coordenadas en píxeles del canvas
 * respetando el encuadre exacto del vídeo ('object-fit: contain').
 */
export function projectLandmarkToCanvas(
  normalizedPoint: Point,
  rect: RenderedVideoRect
): Point {
  return {
    x: rect.offsetX + normalizedPoint.x * rect.renderW,
    y: rect.offsetY + normalizedPoint.y * rect.renderH,
    z: normalizedPoint.z,
    visibility: normalizedPoint.visibility
  };
}

/**
 * Interpolación lineal de fotogramas con baja visibilidad (< 0.5).
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
        let prevIdx = -1;
        for (let p = i - 1; p >= 0; p--) {
          if ((result[p][joint].visibility ?? 0) >= minVisibility) {
            prevIdx = p;
            break;
          }
        }

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
 * Suavizado bidireccional de fase cero (zeroPhaseSmooth).
 * Elimina vibraciones sin introducir retraso temporal (desfase = 0).
 */
export function zeroPhaseSmooth(values: number[], alpha = 0.38): number[] {
  const n = values.length;
  if (n <= 2) return [...values];

  const forward: number[] = new Array(n);
  forward[0] = values[0];
  for (let i = 1; i < n; i++) {
    forward[i] = alpha * values[i] + (1 - alpha) * forward[i - 1];
  }

  const backward: number[] = new Array(n);
  backward[n - 1] = forward[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    backward[i] = alpha * forward[i] + (1 - alpha) * backward[i + 1];
  }

  return backward;
}

/**
 * Aplica zeroPhaseSmooth sobre las coordenadas X e Y directas [0..1] de todas las articulaciones.
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
 * Detector Matemático de Valles y Picos sobre el array completo de ángulos.
 */
export function detectRepetitionsFromAngleSignal(
  angles: number[],
  minDropDeg = 25,
  minRiseDeg = 20,
  minValleySeparationFrames = 12
): RepetitionInterval[] {
  const n = angles.length;
  if (n < minValleySeparationFrames) return [];

  const candidateValleys: number[] = [];
  for (let i = 1; i < n - 1; i++) {
    if (angles[i] <= angles[i - 1] && angles[i] <= angles[i + 1]) {
      candidateValleys.push(i);
    }
  }

  const validatedReps: RepetitionInterval[] = [];
  let lastAcceptedValley = -999;

  for (const valleyIdx of candidateValleys) {
    if (valleyIdx - lastAcceptedValley < minValleySeparationFrames) {
      if (validatedReps.length > 0) {
        const lastRep = validatedReps[validatedReps.length - 1];
        if (angles[valleyIdx] < lastRep.bottomAngle) {
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
        break;
      }
    }

    const drop = maxBefore - valleyAngle;
    if (drop < minDropDeg) {
      continue;
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
        break;
      }
    }

    const rise = maxAfter - valleyAngle;
    if (rise < minRiseDeg) {
      continue;
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
 * Asigna fases y repCount acumulativo a cada fotograma.
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
 * Ventana de Muestreo Temporal
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
 * Bloqueo Unilateral (Side-Locking) en primeros 15 frames
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
 * Extrae las 6 articulaciones maestras del lado dominante con coordenadas directas [0..1].
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
// Renderizado Limpio en Canvas con Alineación 1:1 a 'object-fit: contain'
// ============================================================================

export interface CanvasOverlayOptions {
  showAnglesInCorner?: boolean;
  jointDotRadius?: number;
  skeletonLineWidth?: number;
  badgeVerticalOffset?: number; // ±35px
}

/**
 * Renderizado de articulaciones alineado 1:1 al vídeo real proyectando el aspecto contain.
 */
export function drawKinematicFrameOverlay(
  ctx: CanvasRenderingContext2D,
  frame: ProcessedKinematicFrame,
  canvas: { width: number; height: number },
  video?: { videoWidth: number; videoHeight: number },
  options: CanvasOverlayOptions = {}
): void {
  const lineWidth = options.skeletonLineWidth ?? 3;
  const dotRadius = options.jointDotRadius ?? 5;
  const showInCorner = options.showAnglesInCorner ?? true;
  const vOffset = options.badgeVerticalOffset ?? 35;

  const vInfo = video || { videoWidth: canvas.width, videoHeight: canvas.height };
  const rect = getRenderedVideoRect(vInfo, canvas);

  // Proyectar coordenadas normalizadas [0..1] a píxeles exactos del vídeo dentro del canvas
  const project = (p: Point): Point => projectLandmarkToCanvas(p, rect);

  const shoulder = project(frame.normalizedJoints.shoulder);
  const elbow = project(frame.normalizedJoints.elbow);
  const wrist = project(frame.normalizedJoints.wrist);
  const hip = project(frame.normalizedJoints.hip);
  const knee = project(frame.normalizedJoints.knee);
  const ankle = project(frame.normalizedJoints.ankle);

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

  // Segmentos esqueléticos: Miembro superior
  drawBoneSegment(shoulder, elbow, '#8B5CF6'); // Violeta
  drawBoneSegment(elbow, wrist, '#EC4899');    // Rosa

  // Tronco
  drawBoneSegment(shoulder, hip, '#38BDF8');   // Azul claro

  // Segmentos: Miembro inferior
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
    const hudW = 160;
    const hudH = 110;
    const hudX = canvas.width - hudW - 12;
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
   * Inicializa MediaPipe Tasks-Vision con pose_landmarker_full.task (GPU en modo VIDEO).
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
   * Ejecuta el análisis cinemático directamente sobre el vídeo sin lienzos intermedios.
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
   * Bucle de extracción directo: pasa el elemento <video> DIRECTAMENTE a MediaPipe
   * (sin cropToAthlete ni OffscreenCanvas intermedio que alteren el Aspect Ratio).
   */
  private async executeExtractionLoop(
    video: HTMLVideoElement,
    onProgress?: (progressPct: number, currentFrame: number, totalFrames: number) => void
  ): Promise<ProcessedKinematicFrame[]> {
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;

    const hasRvfc = typeof (video as any).requestVideoFrameCallback === 'function';
    const effectiveFps = hasRvfc ? this.config.targetSampleFps : 12;
    const effectiveMaxDuration = hasRvfc ? this.config.maxAnalysisDurationSec : 12.0;

    const timeline = buildSamplingTimeline(video.duration, {
      startOffsetSec: this.config.startOffsetSec,
      maxAnalysisDurationSec: effectiveMaxDuration,
      targetSampleFps: effectiveFps
    });

    const totalExpectedFrames = timeline.timestampsSec.length;
    if (totalExpectedFrames === 0) return [];

    interface RawFrameRecord {
      frameIndex: number;
      timestampSec: number;
      allLandmarks: Point[];
    }

    const rawRecords: RawFrameRecord[] = [];

    if (hasRvfc) {
      // --- MODO RÁPIDO: Captura continua a 3.0x de velocidad con requestVideoFrameCallback ---
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

            // Inferencia Directa sobre el elemento <video>
            const tsMs = Math.round(mediaTime * 1000);
            const det = this.landmarker!.detectForVideo(video, tsMs);

            if (det.landmarks && det.landmarks.length > 0 && det.landmarks[0].length >= 29) {
              const directLandmarks: Point[] = det.landmarks[0].map(lm => ({
                x: lm.x,
                y: lm.y,
                z: lm.z,
                visibility: lm.visibility
              }));

              rawRecords.push({
                frameIndex: rawRecords.length,
                timestampSec: mediaTime,
                allLandmarks: directLandmarks
              });
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
          finish();
        });
      });
    }

    // --- MODO FALLBACK (si RVFC no extrajo fotogramas o no está soportado) ---
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

        // Inferencia Directa sobre el elemento <video>
        const tsMs = Math.round(timestampSec * 1000);
        const det = this.landmarker!.detectForVideo(video, tsMs);

        if (det.landmarks && det.landmarks.length > 0 && det.landmarks[0].length >= 29) {
          const directLandmarks: Point[] = det.landmarks[0].map(lm => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility
          }));

          rawRecords.push({
            frameIndex: i,
            timestampSec,
            allLandmarks: directLandmarks
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

    // --- FASE 2: Bloqueo Unilateral ---
    const initialSubset = rawRecords
      .slice(0, this.config.sideLockingFramesCount)
      .map(r => r.allLandmarks);
    const dominantSide = determineDominantSide(initialSubset);

    // Extraer coordenadas directas normalizadas [0..1]
    const rawFramesNormalized: Array<Record<JointName, Point>> = [];
    const framesVisibility: Array<Record<JointName, number>> = [];

    for (const record of rawRecords) {
      const unilateral = extractUnilateralJoints(record.allLandmarks, dominantSide);
      rawFramesNormalized.push({
        shoulder: { x: unilateral.shoulder.x, y: unilateral.shoulder.y, z: unilateral.shoulder.z, visibility: unilateral.shoulder.visibility },
        elbow: { x: unilateral.elbow.x, y: unilateral.elbow.y, z: unilateral.elbow.z, visibility: unilateral.elbow.visibility },
        wrist: { x: unilateral.wrist.x, y: unilateral.wrist.y, z: unilateral.wrist.z, visibility: unilateral.wrist.visibility },
        hip: { x: unilateral.hip.x, y: unilateral.hip.y, z: unilateral.hip.z, visibility: unilateral.hip.visibility },
        knee: { x: unilateral.knee.x, y: unilateral.knee.y, z: unilateral.knee.z, visibility: unilateral.knee.visibility },
        ankle: { x: unilateral.ankle.x, y: unilateral.ankle.y, z: unilateral.ankle.z, visibility: unilateral.ankle.visibility },
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

    // --- FASE 3: Interpolación (< 0.5) y Suavizado Bidireccional zeroPhaseSmooth ---
    // (SIN enforceBoneLength para evitar deformaciones en discos/máquinas)
    const interpolatedNorm = interpolateLowVisibilityLandmarks(rawFramesNormalized, 0.5);
    const smoothedNorm = smoothJointsTrajectoryZeroPhase(interpolatedNorm, 0.38);

    // --- FASE 4: Cálculo de Ángulos Articulares y Señal Principal ---
    const primaryAngles: number[] = [];
    const intermediateFrames: Array<Omit<ProcessedKinematicFrame, 'phase' | 'repCount'>> = [];

    for (let i = 0; i < smoothedNorm.length; i++) {
      const norm = smoothedNorm[i];
      const rawNorm = rawFramesNormalized[i];
      const vis = framesVisibility[i];
      const record = rawRecords[i];

      // Convertir a píxeles nativos del vídeo original para cálculos angulares y cinemáticos
      const jointsPx: Record<JointName, Point> = {
        shoulder: { x: norm.shoulder.x * videoWidth, y: norm.shoulder.y * videoHeight, z: norm.shoulder.z, visibility: vis.shoulder },
        elbow: { x: norm.elbow.x * videoWidth, y: norm.elbow.y * videoHeight, z: norm.elbow.z, visibility: vis.elbow },
        wrist: { x: norm.wrist.x * videoWidth, y: norm.wrist.y * videoHeight, z: norm.wrist.z, visibility: vis.wrist },
        hip: { x: norm.hip.x * videoWidth, y: norm.hip.y * videoHeight, z: norm.hip.z, visibility: vis.hip },
        knee: { x: norm.knee.x * videoWidth, y: norm.knee.y * videoHeight, z: norm.knee.z, visibility: vis.knee },
        ankle: { x: norm.ankle.x * videoWidth, y: norm.ankle.y * videoHeight, z: norm.ankle.z, visibility: vis.ankle },
      };

      const rawJointsPx: Record<JointName, Point> = {
        shoulder: { x: rawNorm.shoulder.x * videoWidth, y: rawNorm.shoulder.y * videoHeight, z: rawNorm.shoulder.z, visibility: vis.shoulder },
        elbow: { x: rawNorm.elbow.x * videoWidth, y: rawNorm.elbow.y * videoHeight, z: rawNorm.elbow.z, visibility: vis.elbow },
        wrist: { x: rawNorm.wrist.x * videoWidth, y: rawNorm.wrist.y * videoHeight, z: rawNorm.wrist.z, visibility: vis.wrist },
        hip: { x: rawNorm.hip.x * videoWidth, y: rawNorm.hip.y * videoHeight, z: rawNorm.hip.z, visibility: vis.hip },
        knee: { x: rawNorm.knee.x * videoWidth, y: rawNorm.knee.y * videoHeight, z: rawNorm.knee.z, visibility: vis.knee },
        ankle: { x: rawNorm.ankle.x * videoWidth, y: rawNorm.ankle.y * videoHeight, z: rawNorm.ankle.z, visibility: vis.ankle },
      };

      const elbowAngle = calculateAngleDegrees(jointsPx.shoulder, jointsPx.elbow, jointsPx.wrist);
      const kneeAngle = calculateAngleDegrees(jointsPx.hip, jointsPx.knee, jointsPx.ankle);
      const shoulderAngle = calculateAngleDegrees(jointsPx.hip, jointsPx.shoulder, jointsPx.elbow);
      const hipAngle = calculateAngleDegrees(jointsPx.shoulder, jointsPx.hip, jointsPx.knee);

      const mainAngle = kneeAngle;
      primaryAngles.push(mainAngle);

      intermediateFrames.push({
        frameIndex: record.frameIndex,
        timestampSec: record.timestampSec,
        lockedSide: dominantSide,
        normalizedJoints: norm,
        joints: jointsPx,
        rawJoints: rawJointsPx,
        anglesDeg: {
          elbow: Number(elbowAngle.toFixed(1)),
          knee: Number(kneeAngle.toFixed(1)),
          shoulder: Number(shoulderAngle.toFixed(1)),
          hip: Number(hipAngle.toFixed(1))
        },
        mainAngle: Number(mainAngle.toFixed(1)),
        visibility: vis
      });
    }

    // --- FASE 5: Detector Matemático de Valles y Picos sobre Array Completo ---
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
   * Cierra las instancias de MediaPipe para liberar recursos.
   */
  dispose(): void {
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch {
        // Ignorar errores
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
