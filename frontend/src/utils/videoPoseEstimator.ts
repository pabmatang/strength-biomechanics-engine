/**
 * Video Pose Estimator & Biomechanical Trigonometry Engine
 *
 * Integrates Google MediaPipe Tasks Vision (PoseLandmarker) for real-time
 * video pose estimation, combined with geometric vector trigonometry (Math.atan2)
 * for joint angle tracking and exercise-specific repetition detection.
 */

import { FilesetResolver, PoseLandmarker, PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { BiomechanicalTelemetryFrame, PatternFamily, TargetMuscle, LoadType, calculateTibialAngle } from './biomechanicsEngine';
import { Point2D } from './oneEuroFilter';

export interface Keypoint2D {
  x: number;
  y: number;
  z?: number;
  score?: number;
  visibility?: number;
  name?: string;
}

export type JointAngleKey = 'knee' | 'hip' | 'elbow' | 'shoulder' | 'ankle' | 'torso';

export interface CalculatedAngles {
  kneeAngle: number;
  hipAngle: number;
  elbowAngle: number;
  torsoLeanAngle: number;
}

/**
 * Calculates internal angle in degrees [0 - 180°] at the central vertex.
 * Uses 2D planar vectors:
 * v1 = A - Vertex
 * v2 = C - Vertex
 * angle = |atan2(v1.y, v1.x) - atan2(v2.y, v2.x)|
 */
export function calculateJointAngle(
  pointA: Keypoint2D,
  vertex: Keypoint2D,
  pointC: Keypoint2D
): number {
  if (!pointA || !vertex || !pointC) return 180;

  const v1x = pointA.x - vertex.x;
  const v1y = pointA.y - vertex.y;
  const v2x = pointC.x - vertex.x;
  const v2y = pointC.y - vertex.y;

  const angle1 = Math.atan2(v1y, v1x);
  const angle2 = Math.atan2(v2y, v2x);

  let diff = Math.abs(angle1 - angle2);
  if (diff > Math.PI) {
    diff = 2 * Math.PI - diff;
  }

  const deg = (diff * 180) / Math.PI;
  return Math.round(deg * 10) / 10;
}

export interface BiomechanicalRule {
  id: string;
  joint: JointAngleKey;
  phase: 'bottom' | 'eccentric' | 'concentric' | 'inflection' | 'lockout';
  minAcceptableAngle?: number;
  maxAcceptableAngle?: number;
  alertMessageUnder: string;
  alertMessageOver: string;
}

export interface ExercisePoseProfile {
  id: string;
  name: string;
  category: 'back' | 'chest' | 'biceps' | 'triceps' | 'legs_quads' | 'legs_hamstrings';
  primaryJoint: JointAngleKey;
  standingThreshold: number; // Angle at start of rep
  inflectionThreshold: number; // Angle at max contraction/stretch
  trackingMode: 'ascending' | 'descending'; // whether angle decreases or increases during concentric
  targetJointDescription: string;
  rules: BiomechanicalRule[];
}

/**
 * Complete Exercise Biomechanics Profiles:
 * - Espalda (Jalón al pecho / Remo Technogym Pure Strength)
 * - Bíceps (Curl con mancuernas / barra / polea / banco Scott)
 * - Tríceps (Extensión en polea / tras nuca)
 * - Femoral en Peso Muerto Rumano (RDL / Hip Hinge)
 * - Press de Banca / Pecho Convergente (Hammer / Technogym)
 * - Sentadilla (Squat)
 * - Prensa de Piernas
 */
export const EXERCISE_POSE_PROFILES: Record<string, ExercisePoseProfile> = {
  lat_pulldown: {
    id: 'lat_pulldown',
    name: 'Espalda (Jalón / Remo Technogym)',
    category: 'back',
    primaryJoint: 'elbow',
    standingThreshold: 155, // Brazos extendidos arriba
    inflectionThreshold: 88, // Codos flexionados cerca del dorsal
    trackingMode: 'descending',
    targetJointDescription: 'Flexión de codo y trayectoria hacia el ilíaco',
    rules: [
      {
        id: 'lat_rom_depth',
        joint: 'elbow',
        phase: 'bottom',
        maxAcceptableAngle: 95,
        alertMessageOver: 'Tirón algo corto: baja los codos hacia las caderas para activar el dorsal ancho.',
        alertMessageUnder: '✓ ROM completo en dorsal: contracción profunda hacia el ilíaco.'
      },
      {
        id: 'torso_swing',
        joint: 'torso',
        phase: 'concentric',
        maxAcceptableAngle: 25,
        alertMessageOver: 'Inclinación excesiva hacia atrás: evita balancear el torso con la zona lumbar.',
        alertMessageUnder: '✓ Colocación correcta: torso estable y alineación torácica firme.'
      }
    ]
  },
  biceps_curl: {
    id: 'biceps_curl',
    name: 'Bíceps (Curl con Mancuernas / Polea)',
    category: 'biceps',
    primaryJoint: 'elbow',
    standingThreshold: 150, // Brazo estirado abajo
    inflectionThreshold: 65, // Brazo flexionado arriba
    trackingMode: 'descending',
    targetJointDescription: 'Ángulo de flexión del codo [55° - 150°]',
    rules: [
      {
        id: 'biceps_contraction',
        joint: 'elbow',
        phase: 'bottom',
        maxAcceptableAngle: 75,
        alertMessageOver: 'Contracción incompleta: flexiona el codo hasta sentir el pico del bíceps.',
        alertMessageUnder: '✓ ROM completo: pico de contracción máximo de bíceps.'
      },
      {
        id: 'elbow_drift',
        joint: 'shoulder',
        phase: 'concentric',
        maxAcceptableAngle: 30,
        alertMessageOver: 'Codos adelantados: no balancees los hombros para subir el peso.',
        alertMessageUnder: '✓ Colocación correcta: codos fijos a los costados y tronco vertical.'
      }
    ]
  },
  triceps_extension: {
    id: 'triceps_extension',
    name: 'Tríceps (Extensión en Polea / Tras Nuca)',
    category: 'triceps',
    primaryJoint: 'elbow',
    standingThreshold: 85, // Codo flexionado a ~90°
    inflectionThreshold: 160, // Codo bloqueado extendido a ~165°
    trackingMode: 'ascending',
    targetJointDescription: 'Extensión completa del codo hacia abajo [90° - 165°]',
    rules: [
      {
        id: 'triceps_lockout',
        joint: 'elbow',
        phase: 'bottom',
        minAcceptableAngle: 155,
        alertMessageUnder: 'Extensión incompleta: bloquea los codos abajo para apretar la cabeza lateral.',
        alertMessageOver: '✓ ROM completo: bloqueo concéntrico perfecto de tríceps.'
      },
      {
        id: 'elbow_flare',
        joint: 'shoulder',
        phase: 'concentric',
        maxAcceptableAngle: 35,
        alertMessageOver: 'Codos abiertos: mantenlos paralelos pegados al cuerpo.',
        alertMessageUnder: '✓ Colocación correcta: codos alineados y muñecas estables.'
      }
    ]
  },
  rdl_deadlift: {
    id: 'rdl_deadlift',
    name: 'Femoral / Peso Muerto Rumano (RDL)',
    category: 'legs_hamstrings',
    primaryJoint: 'hip',
    standingThreshold: 165, // De pie erecto
    inflectionThreshold: 90, // Bisagra de cadera máxima
    trackingMode: 'descending',
    targetJointDescription: 'Bisagra de cadera (Hip Hinge) con rodillas fijas',
    rules: [
      {
        id: 'hip_hinge_depth',
        joint: 'hip',
        phase: 'bottom',
        maxAcceptableAngle: 98,
        alertMessageOver: 'Bisagra insuficiente: empuja la cadera hacia la pared trasera para estirar el isquiosural.',
        alertMessageUnder: '✓ ROM completo: estiramiento máximo de cadena posterior alcanzado.'
      },
      {
        id: 'knee_squat_trap',
        joint: 'knee',
        phase: 'bottom',
        minAcceptableAngle: 145,
        alertMessageUnder: '¡Alerta Sentadilla!: Estás doblando las rodillas en exceso. Fíjalas en ligera semiflexión (~155°).',
        alertMessageOver: '✓ Colocación correcta: semiflexión de rodilla biomecánicamente óptima.'
      }
    ]
  },
  bench_press: {
    id: 'bench_press',
    name: 'Press de Pecho / Banca (Hammer & Convergente)',
    category: 'chest',
    primaryJoint: 'elbow',
    standingThreshold: 150, // Brazos extendidos
    inflectionThreshold: 92, // Barra/manerales en el pecho (85°-95° es ROM completo seguro)
    trackingMode: 'descending',
    targetJointDescription: 'Descenso de manerales al pecho y empuje convergente',
    rules: [
      {
        id: 'elbow_flare',
        joint: 'elbow',
        phase: 'bottom',
        maxAcceptableAngle: 98,
        alertMessageOver: 'Recorrido algo corto: desciende los manerales hasta flexionar codos a ~90° para máximo estiramiento.',
        alertMessageUnder: '✓ ROM completo: flexión de codo a ~90° con estiramiento óptimo de pectoral.'
      },
      {
        id: 'shoulder_retraction',
        joint: 'shoulder',
        phase: 'concentric',
        maxAcceptableAngle: 75,
        alertMessageOver: 'Codos a 90°: cierra a 45°-60° respecto al torso para proteger el manguito rotador.',
        alertMessageUnder: '✓ Colocación correcta: escápulas retraídas y torso firme en el respaldo.'
      }
    ]
  },
  squat: {
    id: 'squat',
    name: 'Sentadilla Libre & Multipower (Squat)',
    category: 'legs_quads',
    primaryJoint: 'knee',
    standingThreshold: 160,
    inflectionThreshold: 92,
    trackingMode: 'descending',
    targetJointDescription: 'Flexión profunda de rodilla y bisagra de cadera',
    rules: [
      {
        id: 'depth_check',
        joint: 'knee',
        phase: 'bottom',
        maxAcceptableAngle: 96,
        alertMessageOver: 'Profundidad insuficiente: la cadera debe descender hasta el paralelo (≤ 90°).',
        alertMessageUnder: '✓ ROM completo: profundidad válida al paralelo superada con control.'
      },
      {
        id: 'torso_lean',
        joint: 'hip',
        phase: 'bottom',
        minAcceptableAngle: 45,
        alertMessageUnder: 'Torso excesivamente inclinado hacia adelante: riesgo de sobrecarga lumbar.',
        alertMessageOver: '✓ Colocación correcta: torso erguido y columna neutra.'
      }
    ]
  },
  leg_press: {
    id: 'leg_press',
    name: 'Prensa de Piernas 45°',
    category: 'legs_quads',
    primaryJoint: 'knee',
    standingThreshold: 160,
    inflectionThreshold: 92,
    trackingMode: 'descending',
    targetJointDescription: 'Flexión de rodilla en plataforma inclinada',
    rules: [
      {
        id: 'knee_flexion',
        joint: 'knee',
        phase: 'bottom',
        maxAcceptableAngle: 96,
        alertMessageOver: 'Baja más la plataforma para lograr flexión profunda de cuádriceps.',
        alertMessageUnder: '✓ ROM completo: flexión profunda sin retroversión pélvica.'
      }
    ]
  }
};

export type RepPhase = 'STANDING' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING';

export interface RepetitionRecord {
  repIndex: number;
  isValid: boolean;
  eccentricTimeSeconds: number;
  concentricTimeSeconds: number;
  minKneeAngle?: number;
  minHipAngle?: number;
  minElbowAngle?: number;
  setupStatus?: 'correct' | 'needs_attention';
  tempoStatus?: 'controlled' | 'fast';
  romStatus?: 'full' | 'partial';
  feedbackAlerts: Array<{
    ruleId: string;
    joint: string;
    measuredValue: number;
    expectedThreshold: number;
    message: string;
  }>;
}

export type PoseModelQuality = 'full' | 'heavy' | 'lite';

// Global singleton for MediaPipe Pose Landmarker
let poseLandmarkerInstance: PoseLandmarker | null = null;
let poseLandmarkerQualityLoaded: PoseModelQuality | null = null;
let isInitializingLandmarker = false;

/**
 * Initializes or returns the singleton Google MediaPipe PoseLandmarker model.
 * Uses 'full' by default (much sharper elbow/wrist/knee localization on dark/occluded clothes than 'lite'
 * with zero offline MP4 seek delay), with optional 'heavy' mode and automatic 'lite' fallback.
 */
export async function getPoseLandmarker(quality: PoseModelQuality = 'full'): Promise<PoseLandmarker | null> {
  if (poseLandmarkerInstance && poseLandmarkerQualityLoaded === quality) {
    return poseLandmarkerInstance;
  }
  if (isInitializingLandmarker) {
    while (isInitializingLandmarker) {
      await new Promise(r => setTimeout(r, 80));
    }
    if (poseLandmarkerInstance && poseLandmarkerQualityLoaded === quality) {
      return poseLandmarkerInstance;
    }
  }

  const modelUrls: Record<PoseModelQuality, string> = {
    heavy: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task',
    full: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
    lite: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
  };
  const confidenceOpts = {
    minPoseDetectionConfidence: 0.6,
    minPosePresenceConfidence: 0.6,
    minTrackingConfidence: 0.68
  };

  isInitializingLandmarker = true;
  try {
    if (poseLandmarkerInstance && poseLandmarkerQualityLoaded !== quality) {
      try {
        poseLandmarkerInstance.close();
      } catch {
        // Ignore cleanup errors
      }
      poseLandmarkerInstance = null;
      poseLandmarkerQualityLoaded = null;
    }

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    const order: PoseModelQuality[] = quality === 'heavy'
      ? ['heavy', 'full', 'lite']
      : quality === 'full'
        ? ['full', 'lite']
        : ['lite'];

    for (const tier of order) {
      for (const delegate of ['GPU', 'CPU'] as const) {
        try {
          poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: modelUrls[tier], delegate },
            runningMode: 'VIDEO',
            numPoses: 1,
            ...confidenceOpts
          });
          poseLandmarkerQualityLoaded = tier;
          return poseLandmarkerInstance;
        } catch (attemptErr) {
          console.warn(`PoseLandmarker init fallback (${tier}/${delegate}):`, attemptErr);
        }
      }
    }
    return null;
  } catch (err) {
    console.error('Failed to initialize MediaPipe PoseLandmarker:', err);
    return null;
  } finally {
    isInitializingLandmarker = false;
  }
}

export interface NormalizedVideoRoi {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Computes the normalized [0..1] crop rectangle of the video visible inside a zoomed & panned object-contain viewport.
 * Allows MediaPipe PoseLandmarker to infer on higher-resolution cropped athlete pixels when zoom > 1.
 */
export function computeZoomedVideoRoi(
  boxW: number,
  boxH: number,
  vidW: number,
  vidH: number,
  zoom: number,
  panOffset: { x: number; y: number }
): NormalizedVideoRoi {
  if (zoom <= 1.05 || boxW <= 0 || boxH <= 0 || vidW <= 0 || vidH <= 0) {
    return { x: 0, y: 0, w: 1, h: 1 };
  }

  const scaleContain = Math.min(boxW / vidW, boxH / vidH);
  const rw = vidW * scaleContain;
  const rh = vidH * scaleContain;

  const vx0 = Math.max(0, 0.5 - (boxW / 2 + panOffset.x) / (zoom * rw));
  const vx1 = Math.min(1, 0.5 + (boxW / 2 - panOffset.x) / (zoom * rw));
  const vy0 = Math.max(0, 0.5 - (boxH / 2 + panOffset.y) / (zoom * rh));
  const vy1 = Math.min(1, 0.5 + (boxH / 2 - panOffset.y) / (zoom * rh));

  const w = vx1 - vx0;
  const h = vy1 - vy0;
  if (w < 0.15 || h < 0.15) {
    return { x: 0, y: 0, w: 1, h: 1 };
  }
  return { x: vx0, y: vy0, w, h };
}

/**
 * Maps PoseLandmarker normalized landmarks detected on a cropped ROI back into full [0..1] video space.
 */
export function remapLandmarksFromRoi(
  landmarks: Array<{ x: number; y: number; z: number; visibility?: number }>,
  roi: NormalizedVideoRoi
): Array<{ x: number; y: number; z: number; visibility?: number }> {
  if (roi.x === 0 && roi.y === 0 && roi.w === 1 && roi.h === 1) return landmarks;
  return landmarks.map(lm => ({
    x: roi.x + lm.x * roi.w,
    y: roi.y + lm.y * roi.h,
    z: lm.z * Math.max(roi.w, roi.h),
    visibility: lm.visibility
  }));
}

let lastMonotonicPoseTimestampMs = 0;

/**
 * Ensures strictly increasing timestamps across both offline frame extraction and live video inference,
 * preventing MediaPipe VIDEO-mode timestamp collision errors.
 */
export function getMonotonicPoseTimestamp(candidateMs: number = performance.now()): number {
  const next = Math.max(candidateMs, lastMonotonicPoseTimestampMs + 1);
  lastMonotonicPoseTimestampMs = next;
  return next;
}

export interface ExtractedPoseFrame {
  keypoints: Record<string, Keypoint2D>;
  rawLandmarks?: Array<{ x: number; y: number; z: number; visibility?: number }>;
  elbowAngle: number;
  kneeAngle: number;
  hipAngle: number;
  torsoLeanAngle: number;
  dominantSide: 'left' | 'right';
  sideScores?: { left: number; right: number };
}

/**
 * Extracts keypoint coordinates and calculates joint angles from MediaPipe landmarks
 */
export function extractPoseDataFromLandmarks(
  landmarks: Array<{ x: number; y: number; z: number; visibility?: number }>,
  previousDominantSide?: 'left' | 'right',
  analysisRegion?: 'upper' | 'lower'
): ExtractedPoseFrame | null {
  if (!landmarks || landmarks.length < 33) return null;

  // MediaPipe Landmark Index Mapping:
  // 11: left_shoulder, 12: right_shoulder
  // 13: left_elbow, 14: right_elbow
  // 15: left_wrist, 16: right_wrist
  // 23: left_hip, 24: right_hip
  // 25: left_knee, 26: right_knee
  // 27: left_ankle, 28: right_ankle

  const ls = landmarks[11];
  const rs = landmarks[12];
  const le = landmarks[13];
  const re = landmarks[14];
  const lw = landmarks[15];
  const rw = landmarks[16];
  const lPinky = landmarks[17];
  const rPinky = landmarks[18];
  const lIndex = landmarks[19];
  const rIndex = landmarks[20];
  const lThumb = landmarks[21];
  const rThumb = landmarks[22];
  const lh = landmarks[23];
  const rh = landmarks[24];
  const lk = landmarks[25];
  const rk = landmarks[26];
  const laRaw = landmarks[27];
  const raRaw = landmarks[28];
  const lHeel = landmarks[29];
  const rHeel = landmarks[30];
  const lFootIndex = landmarks[31];
  const rFootIndex = landmarks[32];
  const lear = landmarks[7];
  const rear = landmarks[8];

  // Refine ankle position using heel & foot_index consistency when ankle drifts toward toes or up the sock/shin
  const refineAnkle = (
    ank?: typeof ls,
    heel?: typeof ls,
    toe?: typeof ls
  ) => {
    if (!ank) return { x: 0.5, y: 0.5, z: 0, visibility: 0 };
    if (!heel || !toe) return ank;
    const heelVis = heel.visibility ?? 0;
    const toeVis = toe.visibility ?? 0;
    const ankVis = ank.visibility ?? 0.7;
    if (heelVis < 0.35 || toeVis < 0.35) return ank;

    // Anatomically, the talocrural malleolus sits at ~18-24% along the heel->toe axis and ~12% foot length above heel level.
    const footDx = toe.x - heel.x;
    const footDy = toe.y - heel.y;
    const footLen = Math.hypot(footDx, footDy);
    if (footLen < 0.02 || footLen > 0.28) return ank;

    const projT = ((ank.x - heel.x) * footDx + (ank.y - heel.y) * footDy) / (footLen * footLen);
    const heightAboveHeel = heel.y - ank.y;

    // If ankle drifts upward onto the sock/shin (> 0.22 of foot length above heel) or forward toward toes (> 0.40)
    if (heightAboveHeel > footLen * 0.22 || projT > 0.40 || projT < -0.15 || ankVis < 0.65) {
      const clampedT = Math.max(0.12, Math.min(0.28, projT));
      const anchorX = heel.x + clampedT * footDx;
      const anchorY = heel.y - footLen * 0.12;
      const blend = ankVis < 0.60 ? 0.75 : 0.50;
      return {
        x: ank.x * (1 - blend) + anchorX * blend,
        y: ank.y * (1 - blend) + anchorY * blend,
        z: ank.z,
        visibility: Math.max(ankVis, heelVis * 0.85)
      };
    }
    return ank;
  };

  const la = refineAnkle(laRaw, lHeel, lFootIndex);
  const ra = refineAnkle(raRaw, rHeel, rFootIndex);

  // Refine intermediate joint centers (knee or elbow) with kinematic anatomical consistency
  const refineJointAnatomy = (
    proximal?: typeof ls,
    joint?: typeof ls,
    distal?: typeof ls,
    jointType: 'knee' | 'elbow' = 'knee'
  ): typeof ls | undefined => {
    if (!joint) return undefined;
    if (!proximal || !distal) return joint;
    const pVis = proximal.visibility ?? 0.7;
    const jVis = joint.visibility ?? 0.7;
    const dVis = distal.visibility ?? 0.7;

    const dProx = Math.hypot(joint.x - proximal.x, joint.y - proximal.y);
    const dDist = Math.hypot(distal.x - joint.x, distal.y - joint.y);
    const dTotal = Math.hypot(distal.x - proximal.x, distal.y - proximal.y);

    if (dProx < 0.02 || dDist < 0.02 || dTotal < 0.02) return joint;

    const ratio = dDist / dProx;
    const expectedRatio = jointType === 'knee' ? 0.95 : 0.88;

    if (jVis < 0.65 || ratio < expectedRatio * 0.55 || ratio > expectedRatio * 1.70) {
      const midX = (proximal.x + distal.x) / 2;
      const midY = (proximal.y + distal.y) / 2;
      const perpX = -(distal.y - proximal.y);
      const perpY = distal.x - proximal.x;
      const perpLen = Math.hypot(perpX, perpY) || 1e-4;

      const sign = (joint.x - midX) * perpX + (joint.y - midY) * perpY >= 0 ? 1 : -1;
      const limbSpan = Math.max(dProx, dDist);
      const bendDepth = Math.min(limbSpan * 0.75, Math.hypot(joint.x - midX, joint.y - midY));

      const stabilizedX = midX + sign * (perpX / perpLen) * bendDepth;
      const stabilizedY = midY + sign * (perpY / perpLen) * bendDepth;

      const blend = jVis < 0.50 ? 0.75 : 0.45;
      return {
        x: joint.x * (1 - blend) + stabilizedX * blend,
        y: joint.y * (1 - blend) + stabilizedY * blend,
        z: joint.z,
        visibility: Math.max(jVis, (pVis + dVis) * 0.45)
      };
    }

    return joint;
  };

  const refinedLk = refineJointAnatomy(lh, lk, la, 'knee');
  const refinedRk = refineJointAnatomy(rh, rk, ra, 'knee');
  const refinedLe = refineJointAnatomy(ls, le, lw, 'elbow');
  const refinedRe = refineJointAnatomy(rs, re, rw, 'elbow');

  // Estimate true palm / fist grip center when index/pinky/thumb knuckles are near the wrist (bar/dumbbell handle)
  const computeHandGripCenter = (
    wr?: typeof ls,
    idx?: typeof ls,
    pnk?: typeof ls,
    thb?: typeof ls
  ) => {
    if (!wr) return { x: 0.5, y: 0.5, z: 0, visibility: 0 };
    const idxOk = Boolean(idx && (idx.visibility ?? 0) >= 0.42 && Math.hypot(idx.x - wr.x, idx.y - wr.y) < 0.11);
    const pnkOk = Boolean(pnk && (pnk.visibility ?? 0) >= 0.42 && Math.hypot(pnk.x - wr.x, pnk.y - wr.y) < 0.11);
    if (!idxOk && !pnkOk) return wr;

    const knX = idxOk && pnkOk ? (idx!.x + pnk!.x) / 2 : (idxOk ? idx!.x : pnk!.x);
    const knY = idxOk && pnkOk ? (idx!.y + pnk!.y) / 2 : (idxOk ? idx!.y : pnk!.y);
    const thbOk = Boolean(thb && (thb.visibility ?? 0) >= 0.42 && Math.hypot(thb.x - wr.x, thb.y - wr.y) < 0.11);

    if (thbOk) {
      return {
        x: knX * 0.48 + thb!.x * 0.22 + wr.x * 0.30,
        y: knY * 0.48 + thb!.y * 0.22 + wr.y * 0.30,
        z: wr.z,
        visibility: wr.visibility
      };
    }
    return {
      x: knX * 0.62 + wr.x * 0.38,
      y: knY * 0.62 + wr.y * 0.38,
      z: wr.z,
      visibility: wr.visibility
    };
  };

  const leftHandGrip = computeHandGripCenter(lw, lIndex, lPinky, lThumb);
  const rightHandGrip = computeHandGripCenter(rw, rIndex, rPinky, rThumb);

  const scoreUpperArm = (s: typeof ls, e: typeof ls, w: typeof ls) => {
    const sVis = s?.visibility ?? 0.7;
    const eVis = e?.visibility ?? 0.7;
    const wVis = w?.visibility ?? 0.7;
    const minVis = Math.min(sVis, eVis, wVis);
    const avgVis = (sVis + eVis + wVis) / 3;

    const upper2D = (s && e) ? Math.hypot(e.x - s.x, e.y - s.y) : 0;
    const fore2D = (e && w) ? Math.hypot(w.x - e.x, w.y - e.y) : 0;
    const span2D = upper2D + fore2D;
    const dz = ((s && e) ? Math.abs((e.z ?? 0) - (s.z ?? 0)) : 0) + ((e && w) ? Math.abs((w.z ?? 0) - (e.z ?? 0)) : 0);
    // Arms moving cleanly in the XY camera plane (less foreshortened along Z) yield more accurate 2D angles
    const planarClarity = span2D / Math.max(0.05, span2D + dz * 0.65);
    const minSegPenalty = Math.min(upper2D, fore2D) < 0.045 ? -0.08 : 0;
    const inBoundsBonus = (s && e && w && w.x >= 0.03 && w.x <= 0.97 && e.x >= 0.03 && e.x <= 0.97) ? 0.04 : 0;

    return {
      score: avgVis * 0.40 + minVis * 0.35 + planarClarity * 0.25 + minSegPenalty + inBoundsBonus,
      minVis
    };
  };

  const leftArmMetrics = scoreUpperArm(ls, le, lw);
  const rightArmMetrics = scoreUpperArm(rs, re, rw);

  let leftVis: number;
  let rightVis: number;
  let leftMinVis: number;
  let rightMinVis: number;
  if (analysisRegion === 'upper') {
    leftVis = leftArmMetrics.score;
    rightVis = rightArmMetrics.score;
    leftMinVis = leftArmMetrics.minVis;
    rightMinVis = rightArmMetrics.minVis;
  } else {
    const leftLegVis = ((lh?.visibility ?? 0.7) + (lk?.visibility ?? 0.7) + (la?.visibility ?? 0.7)) / 3;
    const rightLegVis = ((rh?.visibility ?? 0.7) + (rk?.visibility ?? 0.7) + (ra?.visibility ?? 0.7)) / 3;
    const leftArmVis = ((ls?.visibility ?? 0.7) + (le?.visibility ?? 0.7) + (lw?.visibility ?? 0.7)) / 3;
    const rightArmVis = ((rs?.visibility ?? 0.7) + (re?.visibility ?? 0.7) + (rw?.visibility ?? 0.7)) / 3;
    leftVis = analysisRegion === 'lower'
      ? leftLegVis * 0.75 + leftArmVis * 0.25
      : leftLegVis * 0.55 + leftArmVis * 0.45;
    rightVis = analysisRegion === 'lower'
      ? rightLegVis * 0.75 + rightArmVis * 0.25
      : rightLegVis * 0.55 + rightArmVis * 0.45;
    leftMinVis = Math.min(lh?.visibility ?? 0.7, lk?.visibility ?? 0.7, la?.visibility ?? 0.7);
    rightMinVis = Math.min(rh?.visibility ?? 0.7, rk?.visibility ?? 0.7, ra?.visibility ?? 0.7);
  }

  // Strict side lock: pick clearest side initially, and NEVER flip sides mid-rep unless the active side genuinely disappears/occludes while the other side is clear
  let dominantSide: 'left' | 'right';
  if (!previousDominantSide) {
    dominantSide = rightVis >= leftVis ? 'right' : 'left';
  } else if (previousDominantSide === 'left') {
    const emergencySwitch = (leftMinVis < 0.38 && rightMinVis >= 0.70) || (rightVis > leftVis + 0.28);
    dominantSide = emergencySwitch ? 'right' : 'left';
  } else {
    const emergencySwitch = (rightMinVis < 0.38 && leftMinVis >= 0.70) || (leftVis > rightVis + 0.28);
    dominantSide = emergencySwitch ? 'left' : 'right';
  }

  // Graceful fallback if dominant landmark is heavily occluded by equipment/plates
  const pickLandmark = (primary?: typeof ls, fallback?: typeof ls): NonNullable<typeof ls> => {
    if (primary && (primary.visibility ?? 1) >= 0.25) return primary;
    if (fallback && (fallback.visibility ?? 1) >= 0.35) return fallback;
    return primary || fallback || { x: 0.5, y: 0.5, z: 0, visibility: 0 };
  };

  const shoulder = dominantSide === 'right' ? pickLandmark(rs, ls) : pickLandmark(ls, rs);
  const elbow = dominantSide === 'right' ? pickLandmark(refinedRe, refinedLe) : pickLandmark(refinedLe, refinedRe);
  const wrist = dominantSide === 'right' ? pickLandmark(rw, lw) : pickLandmark(lw, rw);
  const handGrip = dominantSide === 'right' ? rightHandGrip : leftHandGrip;
  const hip = dominantSide === 'right' ? pickLandmark(rh, lh) : pickLandmark(lh, rh);
  const knee = dominantSide === 'right' ? pickLandmark(refinedRk, refinedLk) : pickLandmark(refinedLk, refinedRk);
  const ankle = dominantSide === 'right' ? pickLandmark(ra, la) : pickLandmark(la, ra);

  // Pick the most confident ear, or the dominant side ear if sufficiently visible (>= 0.35).
  // NEVER fall back to nose (landmarks[0]) as connecting Nose -> Shoulder creates an artificial 35°-45° kink!
  const preferredEar = dominantSide === 'right' ? rear : lear;
  const alternateEar = dominantSide === 'right' ? lear : rear;
  const validEar = (preferredEar && (preferredEar.visibility ?? 1) >= 0.35)
    ? preferredEar
    : (alternateEar && (alternateEar.visibility ?? 1) >= 0.35)
      ? alternateEar
      : undefined;
  const ear = validEar;

  const keypoints: Record<string, Keypoint2D> = {
    nose: landmarks[0] ? { x: landmarks[0].x, y: landmarks[0].y, visibility: landmarks[0].visibility, name: 'nose' } : undefined as any,
    ear: ear ? { x: ear.x, y: ear.y, visibility: ear.visibility, name: 'ear' } : undefined as any,
    shoulder: { x: shoulder.x, y: shoulder.y, visibility: shoulder.visibility, name: 'shoulder' },
    elbow: { x: elbow.x, y: elbow.y, visibility: elbow.visibility, name: 'elbow' },
    wrist: { x: wrist.x, y: wrist.y, visibility: wrist.visibility, name: 'wrist' },
    hand_grip: { x: handGrip.x, y: handGrip.y, visibility: handGrip.visibility, name: 'hand_grip' },
    hip: { x: hip.x, y: hip.y, visibility: hip.visibility, name: 'hip' },
    knee: { x: knee.x, y: knee.y, visibility: knee.visibility, name: 'knee' },
    ankle: { x: ankle.x, y: ankle.y, visibility: ankle.visibility, name: 'ankle' },
    // Both sides for full skeleton rendering
    left_ear: lear ? { x: lear.x, y: lear.y, visibility: lear.visibility } : undefined as any,
    right_ear: rear ? { x: rear.x, y: rear.y, visibility: rear.visibility } : undefined as any,
    left_shoulder: { x: ls.x, y: ls.y, visibility: ls.visibility },
    right_shoulder: { x: rs.x, y: rs.y, visibility: rs.visibility },
    left_elbow: { x: (refinedLe || le).x, y: (refinedLe || le).y, visibility: (refinedLe || le).visibility },
    right_elbow: { x: (refinedRe || re).x, y: (refinedRe || re).y, visibility: (refinedRe || re).visibility },
    left_wrist: { x: lw.x, y: lw.y, visibility: lw.visibility },
    right_wrist: { x: rw.x, y: rw.y, visibility: rw.visibility },
    left_hand_grip: { x: leftHandGrip.x, y: leftHandGrip.y, visibility: leftHandGrip.visibility },
    right_hand_grip: { x: rightHandGrip.x, y: rightHandGrip.y, visibility: rightHandGrip.visibility },
    left_hip: { x: lh.x, y: lh.y, visibility: lh.visibility },
    right_hip: { x: rh.x, y: rh.y, visibility: rh.visibility },
    left_knee: { x: (refinedLk || lk).x, y: (refinedLk || lk).y, visibility: (refinedLk || lk).visibility },
    right_knee: { x: (refinedRk || rk).x, y: (refinedRk || rk).y, visibility: (refinedRk || rk).visibility },
    left_ankle: { x: la.x, y: la.y, visibility: la.visibility },
    right_ankle: { x: ra.x, y: ra.y, visibility: ra.visibility }
  };

  // Compute angles
  const elbowAngle = calculateJointAngle(keypoints.shoulder, keypoints.elbow, keypoints.wrist);
  const kneeAngle = calculateJointAngle(keypoints.hip, keypoints.knee, keypoints.ankle);
  const hipAngle = calculateJointAngle(keypoints.shoulder, keypoints.hip, keypoints.knee);

  // Torso lean: angle of shoulder-hip relative to vertical line
  const verticalPoint = { x: keypoints.hip.x, y: keypoints.hip.y - 0.5 };
  const torsoLeanAngle = calculateJointAngle(keypoints.shoulder, keypoints.hip, verticalPoint);

  return {
    keypoints,
    rawLandmarks: landmarks,
    elbowAngle,
    kneeAngle,
    hipAngle,
    torsoLeanAngle,
    dominantSide,
    sideScores: { left: leftVis, right: rightVis }
  };
}

/**
 * Draws the real human pose skeleton onto the video canvas overlay.
 */
export function drawSkeletonOnCanvas(
  ctx: CanvasRenderingContext2D,
  keypoints: Record<string, Keypoint2D>,
  width: number,
  height: number,
  feedbackColor: string = '#10B981',
  activeAngleBadge?: { angle: number; label: string; x?: number; y?: number },
  primaryJointKey?: 'hip' | 'knee' | 'elbow' | 'shoulder',
  renderedRect?: { offsetX: number; offsetY: number; renderW: number; renderH: number }
) {
  ctx.clearRect(0, 0, width, height);

  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const rect = renderedRect || { offsetX: 0, offsetY: 0, renderW: width, renderH: height };
  const toX = (p: Keypoint2D) => rect.offsetX + p.x * rect.renderW;
  const toY = (p: Keypoint2D) => rect.offsetY + p.y * rect.renderH;

  const isVisible = (p?: Keypoint2D) => {
    if (!p) return false;
    if (p.visibility !== undefined && p.visibility < 0.25) return false;
    return true;
  };

  const drawSegment = (p1?: Keypoint2D, p2?: Keypoint2D, color = 'rgba(255, 255, 255, 0.85)') => {
    if (!isVisible(p1) || !isVisible(p2)) return;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 3;
    ctx.strokeStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(toX(p1!), toY(p1!));
    ctx.lineTo(toX(p2!), toY(p2!));
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(toX(p1!), toY(p1!));
    ctx.lineTo(toX(p2!), toY(p2!));
    ctx.stroke();
    ctx.restore();
  };

  const drawJoint = (p?: Keypoint2D, radius = 5, color = '#3B82F6') => {
    if (!isVisible(p)) return;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(toX(p!), toY(p!), radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  };

  // Shoulders and Torso Box
  const ls = keypoints['left_shoulder'] || keypoints['shoulder'];
  const rs = keypoints['right_shoulder'] || keypoints['shoulder'];
  const lh = keypoints['left_hip'] || keypoints['hip'];
  const rh = keypoints['right_hip'] || keypoints['hip'];
  const nose = keypoints['nose'];

  // Head and Neck
  if (isVisible(nose)) {
    drawJoint(nose, 7, '#38BDF8');
    if (isVisible(ls) && isVisible(rs)) {
      const midShoulder: Keypoint2D = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
      drawSegment(nose, midShoulder, 'rgba(56, 189, 248, 0.7)');
    }
  }

  // Spine line
  if (isVisible(ls) && isVisible(rs) && isVisible(lh) && isVisible(rh)) {
    const midShoulder: Keypoint2D = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
    const midHip: Keypoint2D = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
    drawSegment(midShoulder, midHip, 'rgba(255, 255, 255, 0.85)');
  }

  drawSegment(ls, rs, 'rgba(56, 189, 248, 0.85)'); // Shoulder girdle
  drawSegment(ls, lh, 'rgba(255, 255, 255, 0.5)');
  drawSegment(rs, rh, 'rgba(255, 255, 255, 0.5)');
  drawSegment(lh, rh, 'rgba(56, 189, 248, 0.85)'); // Pelvis

  // Left Arm
  drawSegment(keypoints['left_shoulder'], keypoints['left_elbow'], 'rgba(147, 197, 253, 0.85)');
  drawSegment(keypoints['left_elbow'], keypoints['left_wrist'], 'rgba(147, 197, 253, 0.85)');

  // Right Arm
  drawSegment(keypoints['right_shoulder'], keypoints['right_elbow'], 'rgba(147, 197, 253, 0.85)');
  drawSegment(keypoints['right_elbow'], keypoints['right_wrist'], 'rgba(147, 197, 253, 0.85)');

  // Left Leg
  drawSegment(keypoints['left_hip'], keypoints['left_knee'], 'rgba(216, 180, 254, 0.85)');
  drawSegment(keypoints['left_knee'], keypoints['left_ankle'], 'rgba(216, 180, 254, 0.85)');

  // Right Leg
  drawSegment(keypoints['right_hip'], keypoints['right_knee'], 'rgba(216, 180, 254, 0.85)');
  drawSegment(keypoints['right_knee'], keypoints['right_ankle'], 'rgba(216, 180, 254, 0.85)');

  // Draw Joint Circles
  const joints = [
    keypoints['left_shoulder'], keypoints['right_shoulder'],
    keypoints['left_elbow'], keypoints['right_elbow'],
    keypoints['left_wrist'], keypoints['right_wrist'],
    keypoints['left_hip'], keypoints['right_hip'],
    keypoints['left_knee'], keypoints['right_knee'],
    keypoints['left_ankle'], keypoints['right_ankle']
  ];

  joints.forEach(j => {
    if (j) drawJoint(j, 4.5, '#60A5FA');
  });

  // Dynamic vertex resolution: strictly prioritize the target joint of the selected pattern
  const trackedJoint = (primaryJointKey ? keypoints[primaryJointKey] : undefined) ||
    keypoints['hip'] || keypoints['knee'] || keypoints['elbow'];

  if (trackedJoint && isVisible(trackedJoint)) {
    // Primary vertex node
    drawJoint(trackedJoint, 7.5, feedbackColor);

    // Articular angle arc at vertex (radius 22px)
    ctx.save();
    ctx.strokeStyle = feedbackColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(toX(trackedJoint), toY(trackedJoint), 22, -0.6 * Math.PI, 0.4 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  // Draw Floating Angle Badge anchored directly adjacent to the primary vertex
  if (activeAngleBadge && trackedJoint && isVisible(trackedJoint)) {
    const badgeX = toX(trackedJoint);
    const badgeY = toY(trackedJoint) - 24;

    ctx.save();
    ctx.font = 'bold 12px monospace';
    const text = `${Math.round(activeAngleBadge.angle)}°`;
    const textWidth = ctx.measureText(text).width;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = feedbackColor;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(badgeX - textWidth / 2 - 6, badgeY - 12, textWidth + 12, 18, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, badgeX, badgeY - 2);
    ctx.restore();
  }
}

export interface RenderOverlayOptions {
  showLeverArms?: boolean;
  showCanvasText?: boolean;
  zoom?: number;
  panOffset?: { x: number; y: number };
  primaryJointKey?: 'hip' | 'knee' | 'elbow' | 'shoulder';
  patternFamily?: PatternFamily;
  targetMuscle?: TargetMuscle;
  loadType?: LoadType;
  exerciseId?: string;
  useInternalCanvasTransform?: boolean;
  renderedRect?: { offsetX: number; offsetY: number; renderW: number; renderH: number };
}

/**
 * Strokes a canvas path with a subtle dark backing outline + shadow so colored lines stay crisp on any background.
 */
function strokeHighContrastPath(
  ctx: CanvasRenderingContext2D,
  buildPath: () => void,
  color: string,
  lineWidth: number,
  dash: number[] = []
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash(dash);

  // Dark outline under-stroke
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 4;
  ctx.strokeStyle = 'rgba(2, 6, 23, 0.75)';
  ctx.lineWidth = lineWidth + 2.4;
  ctx.beginPath();
  buildPath();
  ctx.stroke();

  // Foreground high-contrast stroke
  ctx.shadowBlur = 0;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  buildPath();
  ctx.stroke();
  ctx.restore();
}

/**
 * Shared helper to draw a floating rounded badge on canvas
 */
function drawCanvasBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  borderColor: string,
  textColor = '#FFFFFF'
) {
  ctx.save();
  ctx.font = 'bold 11px monospace';
  const textWidth = ctx.measureText(text).width;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.roundRect(x - textWidth / 2 - 6, y - 10, textWidth + 12, 18, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y - 1);
  ctx.restore();
}

/**
 * Draws the Knee Angle arc + proximity-to-90° badge for Hip Thrust (used in both Mode 1 and Mode 2)
 */
function drawHipThrustKneeAngle(
  ctx: CanvasRenderingContext2D,
  hip: Keypoint2D,
  knee: Keypoint2D,
  ankle: Keypoint2D,
  width: number,
  height: number,
  kneeAngleDeg: number,
  includeSegments: boolean,
  showCanvasText = true,
  renderedRect?: { offsetX: number; offsetY: number; renderW: number; renderH: number }
) {
  const rect = renderedRect || { offsetX: 0, offsetY: 0, renderW: width, renderH: height };
  const kx = rect.offsetX + knee.x * rect.renderW;
  const ky = rect.offsetY + knee.y * rect.renderH;
  const hx = rect.offsetX + hip.x * rect.renderW;
  const hy = rect.offsetY + hip.y * rect.renderH;
  const ax = rect.offsetX + ankle.x * rect.renderW;
  const ay = rect.offsetY + ankle.y * rect.renderH;

  const isOptimal = kneeAngleDeg >= 76 && kneeAngleDeg <= 104;
  const isQuads = kneeAngleDeg < 76;
  const kneeColor = isOptimal ? '#10B981' : (isQuads ? '#F59E0B' : '#38BDF8');

  ctx.save();
  if (includeSegments) {
    strokeHighContrastPath(
      ctx,
      () => {
        ctx.moveTo(hx, hy);
        ctx.lineTo(kx, ky);
        ctx.lineTo(ax, ay);
      },
      'rgba(226, 232, 240, 0.90)',
      3
    );
  }

  // Draw true geometric arc between femur (knee->hip) and tibia (knee->ankle)
  const aHip = Math.atan2(hy - ky, hx - kx);
  const aAnkle = Math.atan2(ay - ky, ax - kx);
  let diff = aAnkle - aHip;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;

  strokeHighContrastPath(
    ctx,
    () => {
      ctx.arc(kx, ky, 22, aHip, aHip + diff, diff < 0);
    },
    kneeColor,
    2.5
  );

  // Joint circle at knee
  ctx.fillStyle = kneeColor;
  ctx.beginPath();
  ctx.arc(kx, ky, 5.5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (showCanvasText) {
    const tag = isOptimal ? 'Glúteo ~90°' : (isQuads ? '+Cuádriceps' : '+Femoral');
    drawCanvasBadge(ctx, kx, ky + 35, `Rodilla: ${Math.round(kneeAngleDeg)}° (${tag})`, kneeColor);
  }
  ctx.restore();
}

/**
 * Mode 2 dedicated Hip Thrust Optimization Overlay:
 * No moment arms / gravity force line — renders strictly Knee Angle (Glute vs Quads/Femoral)
 * and Lumbar + Neck Neutrality (Ear -> Shoulder -> Hip).
 */
function drawHipThrustOptimizationOverlay(
  ctx: CanvasRenderingContext2D,
  frame: BiomechanicalTelemetryFrame,
  keypoints: Record<string, Keypoint2D>,
  width: number,
  height: number,
  showCanvasText = true,
  renderedRect?: { offsetX: number; offsetY: number; renderW: number; renderH: number }
) {
  const rect = renderedRect || { offsetX: 0, offsetY: 0, renderW: width, renderH: height };
  const toX = (p: Keypoint2D) => rect.offsetX + p.x * rect.renderW;
  const toY = (p: Keypoint2D) => rect.offsetY + p.y * rect.renderH;

  const ear = keypoints['ear'] || keypoints['left_ear'] || keypoints['right_ear'];
  const shoulder = keypoints['shoulder'] || keypoints['left_shoulder'] || keypoints['right_shoulder'];
  const hip = keypoints['hip'] || keypoints['left_hip'] || keypoints['right_hip'];
  const knee = keypoints['knee'] || keypoints['left_knee'] || keypoints['right_knee'];
  const ankle = keypoints['ankle'] || keypoints['left_ankle'] || keypoints['right_ankle'];

  const kneeAngle = Math.round(
    frame.biomechanics?.kneeAngleDegrees ??
    (hip && knee && ankle ? calculateJointAngle(hip, knee, ankle) : 90)
  );

  // 1. Knee Angle (Femur - Knee - Tibia) for Quads vs Femoral vs Glute (~90°)
  if (hip && knee && ankle) {
    drawHipThrustKneeAngle(ctx, hip, knee, ankle, width, height, kneeAngle, true, showCanvasText, rect);
  }

  // 2. Lumbar & Neck Neutrality (Shoulder -> Hip and Ear -> Shoulder)
  const lumbarOk = frame.technique.lumbarNeutral !== false;
  const neckOk = frame.technique.neckNeutral !== false;
  const lumbarColor = lumbarOk ? '#10B981' : '#EF4444';
  const neckColor = neckOk ? '#10B981' : '#EF4444';

  if (shoulder && hip) {
    ctx.save();

    // Lumbar segment (shoulder -> hip)
    strokeHighContrastPath(
      ctx,
      () => {
        ctx.moveTo(toX(shoulder), toY(shoulder));
        ctx.lineTo(toX(hip), toY(hip));
      },
      lumbarColor,
      3.5,
      !lumbarOk ? [6, 4] : []
    );

    // Neck segment (ear -> shoulder)
    const hasValidEar = ear && (ear.visibility === undefined || ear.visibility >= 0.35);
    if (hasValidEar) {
      strokeHighContrastPath(
        ctx,
        () => {
          ctx.moveTo(toX(ear!), toY(ear!));
          ctx.lineTo(toX(shoulder), toY(shoulder));
        },
        neckColor,
        3.5,
        !neckOk ? [6, 4] : []
      );
    }

    const drawNode = (p: Keypoint2D, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(toX(p), toY(p), 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };
    if (hasValidEar) drawNode(ear!, neckColor);
    drawNode(shoulder, neckOk && lumbarOk ? '#10B981' : '#F59E0B');
    drawNode(hip, lumbarColor);

    if (showCanvasText) {
      const midX = (toX(shoulder) + toX(hip)) / 2;
      const midY = (toY(shoulder) + toY(hip)) / 2 - 18;
      const statusText = `Lumbar: ${lumbarOk ? '✓' : '⚠️'} · Cuello: ${neckOk ? '✓' : '⚠️'}`;
      drawCanvasBadge(ctx, midX, midY, statusText, lumbarOk && neckOk ? '#10B981' : '#EF4444');
    }
    ctx.restore();
  }
}

/**
 * Draws Mode 2: Biomechanical Moment Arms & Force Vector Overlay
 */
export function drawBiomechanicsOverlayOnCanvas(
  ctx: CanvasRenderingContext2D,
  frame: BiomechanicalTelemetryFrame,
  keypoints: Record<string, Keypoint2D>,
  width: number,
  height: number,
  options: RenderOverlayOptions = {}
) {
  // Clear previous frame completely so lines and labels never duplicate or overlap
  ctx.clearRect(0, 0, width, height);

  const {
    showLeverArms = true,
    showCanvasText = true,
    zoom = 1,
    panOffset = { x: 0, y: 0 },
    patternFamily,
    targetMuscle,
    loadType,
    exerciseId,
    useInternalCanvasTransform = false,
    renderedRect
  } = options;

  const rect = renderedRect || { offsetX: 0, offsetY: 0, renderW: width, renderH: height };
  const toX = (p: Keypoint2D | { x: number; y: number }) => rect.offsetX + p.x * rect.renderW;
  const toY = (p: Keypoint2D | { x: number; y: number }) => rect.offsetY + p.y * rect.renderH;

  ctx.save();
  if (useInternalCanvasTransform && (zoom !== 1 || panOffset.x !== 0 || panOffset.y !== 0)) {
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);
  }

  const bio = frame.biomechanics;
  if (!bio) {
    ctx.restore();
    return;
  }

  // Dedicated Hip Thrust Mode 2: No moment arms; analyze Knee Angle + Lumbar & Neck neutrality
  if (exerciseId?.includes('hip_thrust')) {
    drawHipThrustOptimizationOverlay(ctx, frame, keypoints, width, height, showCanvasText, rect);
    ctx.restore();
    return;
  }

  // Working side keypoints (strictly active lead side, no background/rear clutter)
  const hip = keypoints['hip'] || keypoints['left_hip'] || keypoints['right_hip'];
  const knee = keypoints['knee'] || keypoints['left_knee'] || keypoints['right_knee'];
  const ankle = keypoints['ankle'] || keypoints['left_ankle'] || keypoints['right_ankle'];
  const hand = keypoints['wrist'] || keypoints['left_wrist'] || keypoints['right_wrist'];
  const handGrip = keypoints['hand_grip'] || keypoints['left_hand_grip'] || keypoints['right_hand_grip'] || hand;
  const shoulder = keypoints['shoulder'] || keypoints['left_shoulder'] || keypoints['right_shoulder'];
  const elbow = keypoints['elbow'] || keypoints['left_elbow'] || keypoints['right_elbow'];

  const isUpperBody = patternFamily === 'push_press' ||
    patternFamily === 'pull_row' ||
    targetMuscle === 'pectorals' ||
    targetMuscle === 'lats' ||
    targetMuscle === 'biceps' ||
    targetMuscle === 'triceps' ||
    targetMuscle === 'upper_back';

  const isHipThrust = exerciseId?.includes('hip_thrust');

  // Force Application Contact Point:
  // - For Hip Thrust: load is applied directly at the PELVIS / HIP where barbell or pad rests.
  // - If loadType === 'machine' or exercise is on a machine / leg press / hack (or foot on machine plate):
  //   The load/reaction force is applied at the FOOT / ANKLE on the machine.
  // - For free-weight hinge / dumbbell / upper body: force passes through the exact fist/hand grip center (`hand_grip`).
  const isFootOnMachine = (
    loadType === 'machine' ||
    exerciseId?.includes('press') ||
    exerciseId?.includes('hack') ||
    exerciseId?.includes('machine') ||
    exerciseId?.includes('extension')
  ) && !isUpperBody && !isHipThrust;

  const contactPoint = (isHipThrust && hip)
    ? hip
    : (isUpperBody && handGrip)
        ? handGrip
        : ((isFootOnMachine && ankle)
            ? ankle
            : (bio.loadPosition || (handGrip || ankle || shoulder || { x: 0.5, y: 0.5 })));

  const loadX = toX(contactPoint);
  const loadY = toY(contactPoint);

  // 1. Force Line of Action of Force (with dark outline for visibility over gym backgrounds)
  strokeHighContrastPath(
    ctx,
    () => {
      ctx.moveTo(loadX, rect.offsetY);
      ctx.lineTo(loadX, rect.offsetY + rect.renderH);
    },
    '#EF4444',
    2.2
  );

  // Load position dot & arrow
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.arc(loadX, loadY, 6, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Directional arrowhead
  const headLen = 8;
  const arrowY = Math.min(rect.offsetY + rect.renderH - 12, loadY + 40);
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 3;
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.moveTo(loadX, arrowY);
  ctx.lineTo(loadX - headLen * 0.7, arrowY - headLen);
  ctx.lineTo(loadX + headLen * 0.7, arrowY - headLen);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Helper for drawing orthogonal moment arm segment with non-colliding floating badge
  const drawMomentArm = (
    y: number,
    xJoint: number,
    color: string,
    label: string,
    labelOffsetY: number = -12,
    labelOffsetX: number = 0
  ) => {
    strokeHighContrastPath(
      ctx,
      () => {
        ctx.moveTo(loadX, y);
        ctx.lineTo(xJoint, y);
      },
      color,
      2.5
    );

    // Endpoints
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(loadX, y, 4, 0, 2 * Math.PI);
    ctx.arc(xJoint, y, 4, 0, 2 * Math.PI);
    ctx.fill();

    if (!showCanvasText) return;

    // Floating text badge anchored strictly on its own side/row without crossing sibling badges
    ctx.font = 'bold 11px monospace';
    const textWidth = ctx.measureText(label).width;
    const minHalf = textWidth / 2 + 8;
    const rawMidX = (loadX + xJoint) / 2 + labelOffsetX;
    const midX = Math.max(rect.offsetX + minHalf, Math.min(rect.offsetX + rect.renderW - minHalf, rawMidX));
    const midY = Math.max(rect.offsetY + 14, Math.min(rect.offsetY + rect.renderH - 14, y + labelOffsetY));

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(midX - textWidth / 2 - 5, midY - 8, textWidth + 10, 16, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, midX, midY);
  };

  // 2. Direct Orthogonal Moment Arms (Exclusively two segments with dynamic vertical ordering)
  if (showLeverArms) {
    if (!isUpperBody) {
      const lowerCloseY = Boolean(hip && knee && Math.abs(toY(hip) - toY(knee)) < 48);
      const hipIsHigher = !hip || !knee || toY(hip) <= toY(knee);
      if (hip) {
        const hipPx = Math.abs(Math.round(toX(hip) - loadX));
        drawMomentArm(
          toY(hip),
          toX(hip),
          '#06B6D4',
          `d_cadera: ${hipPx}px`,
          lowerCloseY ? (hipIsHigher ? -35 : 35) : -35
        );
      }
      if (knee) {
        const kneePx = Math.abs(Math.round(toX(knee) - loadX));
        drawMomentArm(
          toY(knee),
          toX(knee),
          '#10B981',
          `d_rodilla: ${kneePx}px`,
          lowerCloseY ? (hipIsHigher ? 35 : -35) : 35
        );
      }
    } else {
      const shY = shoulder ? toY(shoulder) : 0;
      const elY = elbow ? toY(elbow) : 0;
      const dyUpper = shoulder && elbow ? Math.abs(shY - elY) : 999;
      const armsCloseY = dyUpper < 50;
      const armsVeryCloseY = dyUpper < 22;
      const shoulderIsHigher = !shoulder || !elbow || shY <= elY;

      if (shoulder) {
        const shPx = Math.abs(Math.round(toX(shoulder) - loadX));
        const shOffsetY = armsCloseY ? (shoulderIsHigher ? -15 : 15) : -12;
        const shOffsetX = armsVeryCloseY ? -22 : 0;
        drawMomentArm(
          shY,
          toX(shoulder),
          '#8B5CF6',
          `d_hombro: ${shPx}px`,
          shOffsetY,
          shOffsetX
        );
      }
      if (elbow) {
        const elPx = Math.abs(Math.round(toX(elbow) - loadX));
        const elOffsetY = armsCloseY ? (shoulderIsHigher ? 15 : -15) : -12;
        const elOffsetX = armsVeryCloseY ? 22 : 0;
        drawMomentArm(
          elY,
          toX(elbow),
          '#EC4899',
          `d_codo: ${elPx}px`,
          elOffsetY,
          elOffsetX
        );
      }
    }
  }

  // 3. Subtle Tibia Segment (Rodilla -> Tobillo) with Non-Intrusive Stabilized Tibial Angle θ_tibia
  if (knee && ankle && !isUpperBody) {
    const kx = toX(knee);
    const ky = toY(knee);
    const ax = toX(ankle);
    const ay = toY(ankle);

    // Thin, subtle dashed guide line with dark shadow so it stays visible over equipment
    strokeHighContrastPath(
      ctx,
      () => {
        ctx.moveTo(kx, ky);
        ctx.lineTo(ax, ay);
      },
      'rgba(56, 189, 248, 0.55)',
      1.8,
      [4, 3]
    );

    if (showCanvasText) {
      // Use smoothly stabilized angle from telemetry (integer rounded)
      const tibialAngle = Math.round(frame.biomechanics?.tibialAngleDegrees ?? calculateTibialAngle(ankle, knee));

      // Position the badge cleanly offset beside the foot/ankle base, NEVER over the middle of the shin!
      const badgeX = ax + (ax >= kx ? 28 : -28);
      const badgeY = ay - 6;
      const tText = `θ_tibia: ${tibialAngle}°`;
      ctx.font = 'bold 10px monospace';
      const tWidth = ctx.measureText(tText).width;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(badgeX - tWidth / 2 - 4, badgeY - 8, tWidth + 8, 15, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38BDF8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tText, badgeX, badgeY - 1);
    }
  }

  // 4. Clean Joint Dots ONLY on Active Working Side (Zero Extra Noise)
  const drawJointDot = (pt: { x: number; y: number }, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(toX(pt), toY(pt), 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  if (!isUpperBody) {
    if (hip) drawJointDot(hip, '#06B6D4');
    if (knee) drawJointDot(knee, '#10B981');
    if (ankle) drawJointDot(ankle, isFootOnMachine ? '#EF4444' : '#38BDF8');
    if (!isFootOnMachine && handGrip) drawJointDot(handGrip, '#EF4444');
  } else {
    if (shoulder) drawJointDot(shoulder, '#8B5CF6');
    if (elbow) drawJointDot(elbow, '#EC4899');
    if (handGrip) drawJointDot(handGrip, '#EF4444');

    const isCableFly = Boolean(options.exerciseId?.includes('fly'));
    const flyEval = bio.flyEvaluation;
    if (showCanvasText && isCableFly && elbow && flyEval) {
      drawCanvasBadge(
        ctx,
        toX(elbow),
        toY(elbow) - 20,
        `Codo: ${flyEval.elbowAngleDeg}° (${flyEval.areArmsExtended ? 'Pecho + Hombro' : '+Tríceps'})`,
        flyEval.areArmsExtended ? '#10B981' : '#F59E0B',
        flyEval.areArmsExtended ? '#A7F3D0' : '#FDE68A'
      );
    }

    const isBiceps = Boolean(options.exerciseId?.includes('biceps') || options.exerciseId?.includes('curl') || targetMuscle === 'biceps');
    const bEval = bio.bicepsEvaluation;
    if (showCanvasText && isBiceps && elbow && bEval) {
      drawCanvasBadge(
        ctx,
        toX(elbow),
        toY(elbow) - 20,
        bEval.armAlignment === 'aligned_pivot' ? '✓ Codo Eje Fijo' : '⚠️ Balanceo Codo',
        bEval.armAlignment === 'aligned_pivot' ? '#10B981' : '#F59E0B',
        bEval.armAlignment === 'aligned_pivot' ? '#A7F3D0' : '#FDE68A'
      );
    }

    const isTriceps = Boolean(options.exerciseId?.includes('triceps') || targetMuscle === 'triceps');
    const tEval = bio.tricepsEvaluation;
    if (showCanvasText && isTriceps && handGrip && tEval) {
      drawCanvasBadge(
        ctx,
        toX(handGrip),
        toY(handGrip) - 20,
        tEval.wristAlignment === 'aligned_neutral' ? '✓ Muñeca Neutra' : '⚠️ Muñeca Quebrada',
        tEval.wristAlignment === 'aligned_neutral' ? '#10B981' : '#F59E0B',
        tEval.wristAlignment === 'aligned_neutral' ? '#A7F3D0' : '#FDE68A'
      );
    }

    const isUpperBack = Boolean(options.exerciseId?.includes('upper_back') || targetMuscle === 'upper_back');
    const ubEval = bio.upperBackEvaluation;
    if (showCanvasText && isUpperBack && elbow && ubEval) {
      drawCanvasBadge(
        ctx,
        toX(elbow),
        toY(elbow) - 20,
        `Codo: ${ubEval.elbowAngleDeg}° (${ubEval.elbowAngleStatus === 'optimal_90' ? '~90° Espalda Alta' : ubEval.elbowAngleStatus === 'too_acute_biceps' ? '<80° +Bíceps' : 'Tirón'})`,
        ubEval.elbowAngleStatus === 'optimal_90' ? '#10B981' : '#F59E0B',
        ubEval.elbowAngleStatus === 'optimal_90' ? '#A7F3D0' : '#FDE68A'
      );
    }

    // Ground foot stability dots for Chest Press (Leg Drive visibility; skip for dips & flys)
    const isDips = Boolean(options.exerciseId?.includes('dips'));
    const pressEval = bio.pressEvaluation;
    if (!isCableFly && !isDips && pressEval && pressEval.footStabilityStatus !== 'not_visible') {
      const footColor = pressEval.footStabilityStatus === 'stable_leg_drive' ? '#10B981' : '#EF4444';
      const la = keypoints['left_ankle'];
      const ra = keypoints['right_ankle'];
      if (la && (la.visibility === undefined || la.visibility >= 0.50) && la.y <= 0.96) drawJointDot(la, footColor);
      if (ra && (ra.visibility === undefined || ra.visibility >= 0.50) && ra.y <= 0.96) drawJointDot(ra, footColor);
    }
  }

  // 5. Top HUD Banner (suppressed when showCanvasText is false to avoid overlapping video text)
  if (showCanvasText) {
    const isSetupOrLockout = frame.phase === 'LOCKOUT' && Math.abs(frame.angularVelocityDegPerSec) < 8;
    const biasText = isSetupOrLockout
      ? 'POSICIÓN INICIAL • LISTO PARA INICIAR'
      : bio.muscleBiasLabel.toUpperCase();

    ctx.font = 'bold 11px monospace';
    const bannerWidth = ctx.measureText(biasText).width + 24;
    const bannerX = rect.offsetX + rect.renderW / 2;
    const bannerY = Math.max(24, rect.offsetY + 24);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = isSetupOrLockout ? '#64748B' : (bio.muscleBias === 'hip_glute_bias' ? '#06B6D4' : '#10B981');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bannerX - bannerWidth / 2, bannerY - 12, bannerWidth, 24, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(biasText, bannerX, bannerY);
  }

  ctx.restore();
}

/**
 * Dual Mode Orchestrator for Canvas Rendering
 */
export function drawDualModeOverlay(
  ctx: CanvasRenderingContext2D,
  mode: 'technique' | 'biomechanics',
  frame: BiomechanicalTelemetryFrame,
  keypoints: Record<string, Keypoint2D>,
  width: number,
  height: number,
  primaryColor = '#10B981',
  options: RenderOverlayOptions = {},
  primaryJointKey?: 'hip' | 'knee' | 'elbow' | 'shoulder'
) {
  // CRITICAL: Always clear canvas so prior frames never persist or ghost
  ctx.clearRect(0, 0, width, height);

  const mergedOptions: RenderOverlayOptions = {
    ...options,
    primaryJointKey: primaryJointKey || options.primaryJointKey
  };

  const rect = mergedOptions.renderedRect || { offsetX: 0, offsetY: 0, renderW: width, renderH: height };
  const toX = (p: Keypoint2D | { x: number; y: number }) => rect.offsetX + p.x * rect.renderW;
  const toY = (p: Keypoint2D | { x: number; y: number }) => rect.offsetY + p.y * rect.renderH;

  if (mode === 'biomechanics') {
    // Mode 2: Biomechanical optimization - pure load vector, moment arms, zero skeleton clutter
    drawBiomechanicsOverlayOnCanvas(ctx, frame, keypoints, width, height, mergedOptions);
  } else {
    const { zoom = 1, panOffset = { x: 0, y: 0 }, useInternalCanvasTransform = false, showCanvasText = true } = mergedOptions;
    ctx.save();
    if (useInternalCanvasTransform && (zoom !== 1 || panOffset.x !== 0 || panOffset.y !== 0)) {
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoom, zoom);
    }

    // Mode 1: Technique - full smoothed skeleton + primary joint ROM arc
    drawSkeletonOnCanvas(
      ctx,
      keypoints,
      width,
      height,
      primaryColor,
      showCanvasText
        ? {
            angle: frame.currentAngle,
            label: 'Ángulo'
          }
        : undefined,
      mergedOptions.primaryJointKey,
      mergedOptions.renderedRect
    );

    // Spinal Alignment (Oreja -> Hombro -> Cadera)
    // Only use authentic ear landmark (never nose)
    const ear = keypoints['ear'] || keypoints['left_ear'] || keypoints['right_ear'];
    const shoulder = keypoints['shoulder'] || keypoints['left_shoulder'] || keypoints['right_shoulder'];
    const elbow = keypoints['elbow'] || keypoints['left_elbow'] || keypoints['right_elbow'];
    const hip = keypoints['hip'] || keypoints['left_hip'] || keypoints['right_hip'];
    const knee = keypoints['knee'] || keypoints['left_knee'] || keypoints['right_knee'];
    const ankle = keypoints['ankle'] || keypoints['left_ankle'] || keypoints['right_ankle'];

    const isHipThrust = mergedOptions.exerciseId?.includes('hip_thrust');
    const isCableFly = Boolean(mergedOptions.exerciseId?.includes('fly'));

    // In Hip Thrust Mode 1, render the Knee Angle (~90° check) cleanly at the knee vertex
    if (isHipThrust && hip && knee && ankle) {
      const kneeAngle = Math.round(
        frame.technique.kneeAngleDegrees ?? calculateJointAngle(hip, knee, ankle)
      );
      drawHipThrustKneeAngle(ctx, hip, knee, ankle, width, height, kneeAngle, false, showCanvasText, mergedOptions.renderedRect);
    }

    const ls = keypoints['left_shoulder'];
    const rs = keypoints['right_shoulder'];
    const lh = keypoints['left_hip'];
    const rh = keypoints['right_hip'];
    const nose = keypoints['nose'];
    const isFrontalBilateral = Boolean(ls && rs && lh && rh && Math.abs(rs.x - ls.x) >= 0.12 && !isHipThrust);

    const spineShoulder = isFrontalBilateral ? { x: (ls!.x + rs!.x) / 2, y: (ls!.y + rs!.y) / 2 } : shoulder;
    const spineHip = isFrontalBilateral ? { x: (lh!.x + rh!.x) / 2, y: (lh!.y + rh!.y) / 2 } : hip;
    const spineHead = isFrontalBilateral ? nose : ear;

    // In Cable Fly Mode 1: hide spinal curvature overlay and render arm extension + shoulder posture badges
    const flyEval = frame.technique.flyEvaluation;
    if (showCanvasText && isCableFly && flyEval) {
      if (elbow) {
        drawCanvasBadge(
          ctx,
          toX(elbow),
          toY(elbow) - 18,
          `Codo: ${flyEval.elbowAngleDeg}° · ${flyEval.areArmsExtended ? 'Extendido' : 'Más recto'}`,
          flyEval.areArmsExtended ? '#10B981' : '#EF4444',
          flyEval.areArmsExtended ? '#6EE7B7' : '#FCA5A5'
        );
      }
      if (spineShoulder) {
        drawCanvasBadge(
          ctx,
          toX(spineShoulder),
          toY(spineShoulder) - 22,
          flyEval.shoulderAnteriorized ? '⚠️ Hombro anteriorizado' : '✓ Hombro atrás',
          flyEval.shoulderAnteriorized ? '#EF4444' : '#10B981',
          flyEval.shoulderAnteriorized ? '#FCA5A5' : '#6EE7B7'
        );
      }
    }

    if (!isCableFly && spineShoulder && spineHip) {
      ctx.save();
      const lumbarOk = frame.technique.lumbarNeutral !== false;
      const neckOk = frame.technique.neckNeutral !== false;
      const spineNeutral = isHipThrust ? (lumbarOk && neckOk) : frame.technique.isSpineNeutral;
      const spineColor = spineNeutral ? '#10B981' : '#EF4444';
      const hasValidHead = spineHead && (spineHead.visibility === undefined || spineHead.visibility >= 0.35);

      strokeHighContrastPath(
        ctx,
        () => {
          if (hasValidHead) {
            ctx.moveTo(toX(spineHead!), toY(spineHead!));
            ctx.lineTo(toX(spineShoulder), toY(spineShoulder));
          } else {
            ctx.moveTo(toX(spineShoulder), toY(spineShoulder));
          }
          ctx.lineTo(toX(spineHip), toY(spineHip));
        },
        spineColor,
        3.5,
        !spineNeutral ? [7, 4] : []
      );

      // Draw spinal alignment joint nodes
      const drawSpinalNode = (p: Keypoint2D, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(toX(p), toY(p), 5.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      };

      if (hasValidHead) drawSpinalNode(spineHead!, spineColor);
      drawSpinalNode(spineShoulder, spineColor);
      drawSpinalNode(spineHip, spineColor);

      if (showCanvasText) {
        // Dedicated spinal alignment status badge
        const midX = (toX(spineShoulder) + toX(spineHip)) / 2;
        const midY = (toY(spineShoulder) + toY(spineHip)) / 2;
        ctx.font = 'bold 11px monospace';
        const label = isHipThrust
          ? (spineNeutral
              ? '✓ LUMBAR Y CUELLO NEUTROS'
              : (!lumbarOk ? '⚠️ HIPEREXTENSIÓN LUMBAR' : '⚠️ REVISAR CUELLO'))
          : (spineNeutral
              ? `✓ COLUMNA NEUTRA (${frame.technique.spinalAngleDegrees}°)`
              : `⚠️ ALERTA: FLEXIÓN ESPINAL (${frame.technique.spinalAngleDegrees}°)`);
        const tWidth = ctx.measureText(label).width;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = spineColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(midX - tWidth / 2 - 6, midY - 11, tWidth + 12, 18, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = spineNeutral ? '#6EE7B7' : '#FCA5A5';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, midX, midY - 2);
      }

      ctx.restore();
    }

    ctx.restore();
  }
}

/**
 * Deliverable 2: CanvasBiomechanicalRenderer
 * Decoupled render orchestrator for high-performance canvas overlays
 */
export class CanvasBiomechanicalRenderer {
  static render(
    ctx: CanvasRenderingContext2D,
    mode: 'technique' | 'biomechanics',
    frame: BiomechanicalTelemetryFrame,
    keypoints: Record<string, Keypoint2D>,
    width: number,
    height: number,
    primaryColor: string = '#10B981',
    options: RenderOverlayOptions = {},
    primaryJointKey?: 'hip' | 'knee' | 'elbow' | 'shoulder'
  ): void {
    drawDualModeOverlay(
      ctx,
      mode,
      frame,
      keypoints,
      width,
      height,
      primaryColor,
      options,
      primaryJointKey
    );
  }
}
