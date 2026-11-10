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

// Global singleton for MediaPipe Pose Landmarker
let poseLandmarkerInstance: PoseLandmarker | null = null;
let isInitializingLandmarker = false;

/**
 * Initializes or returns the singleton Google MediaPipe PoseLandmarker model.
 */
export async function getPoseLandmarker(): Promise<PoseLandmarker | null> {
  if (poseLandmarkerInstance) return poseLandmarkerInstance;
  if (isInitializingLandmarker) {
    while (isInitializingLandmarker) {
      await new Promise(r => setTimeout(r, 80));
    }
    return poseLandmarkerInstance;
  }

  isInitializingLandmarker = true;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numPoses: 1
    });

    return poseLandmarkerInstance;
  } catch (err) {
    console.warn('GPU acceleration unavailable for MediaPipe, falling back to CPU delegate...', err);
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'CPU'
        },
        runningMode: 'VIDEO',
        numPoses: 1
      });
      return poseLandmarkerInstance;
    } catch (fallbackErr) {
      console.error('Failed to initialize MediaPipe PoseLandmarker:', fallbackErr);
      return null;
    }
  } finally {
    isInitializingLandmarker = false;
  }
}

export interface ExtractedPoseFrame {
  keypoints: Record<string, Keypoint2D>;
  rawLandmarks?: Array<{ x: number; y: number; z: number; visibility?: number }>;
  elbowAngle: number;
  kneeAngle: number;
  hipAngle: number;
  torsoLeanAngle: number;
  dominantSide: 'left' | 'right';
}

/**
 * Extracts keypoint coordinates and calculates joint angles from MediaPipe landmarks
 */
export function extractPoseDataFromLandmarks(
  landmarks: Array<{ x: number; y: number; z: number; visibility?: number }>,
  previousDominantSide?: 'left' | 'right'
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
  const lh = landmarks[23];
  const rh = landmarks[24];
  const lk = landmarks[25];
  const rk = landmarks[26];
  const la = landmarks[27];
  const ra = landmarks[28];
  const lear = landmarks[7];
  const rear = landmarks[8];

  // Evaluate full-body visibility (both lower and upper limbs) for rock-solid stability
  const leftLegVis = ((lh?.visibility ?? 0.7) + (lk?.visibility ?? 0.7) + (la?.visibility ?? 0.7)) / 3;
  const rightLegVis = ((rh?.visibility ?? 0.7) + (rk?.visibility ?? 0.7) + (ra?.visibility ?? 0.7)) / 3;
  const leftArmVis = ((ls?.visibility ?? 0.7) + (le?.visibility ?? 0.7) + (lw?.visibility ?? 0.7)) / 3;
  const rightArmVis = ((rs?.visibility ?? 0.7) + (re?.visibility ?? 0.7) + (rw?.visibility ?? 0.7)) / 3;
  const leftVis = leftLegVis * 0.55 + leftArmVis * 0.45;
  const rightVis = rightLegVis * 0.55 + rightArmVis * 0.45;

  // Strict hysteresis to prevent flip-flopping between frames
  let dominantSide: 'left' | 'right';
  if (!previousDominantSide) {
    dominantSide = rightVis >= leftVis ? 'right' : 'left';
  } else if (previousDominantSide === 'left') {
    dominantSide = (rightVis > leftVis + 0.15) ? 'right' : 'left';
  } else {
    dominantSide = (leftVis > rightVis + 0.15) ? 'left' : 'right';
  }

  // Graceful fallback if dominant landmark is heavily occluded by equipment/plates
  const pickLandmark = (primary?: typeof ls, fallback?: typeof ls): NonNullable<typeof ls> => {
    if (primary && (primary.visibility ?? 1) >= 0.25) return primary;
    if (fallback && (fallback.visibility ?? 1) >= 0.35) return fallback;
    return primary || fallback || { x: 0.5, y: 0.5, z: 0, visibility: 0 };
  };

  const shoulder = dominantSide === 'right' ? pickLandmark(rs, ls) : pickLandmark(ls, rs);
  const elbow = dominantSide === 'right' ? pickLandmark(re, le) : pickLandmark(le, re);
  const wrist = dominantSide === 'right' ? pickLandmark(rw, lw) : pickLandmark(lw, rw);
  const hip = dominantSide === 'right' ? pickLandmark(rh, lh) : pickLandmark(lh, rh);
  const knee = dominantSide === 'right' ? pickLandmark(rk, lk) : pickLandmark(lk, rk);
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
    hip: { x: hip.x, y: hip.y, visibility: hip.visibility, name: 'hip' },
    knee: { x: knee.x, y: knee.y, visibility: knee.visibility, name: 'knee' },
    ankle: { x: ankle.x, y: ankle.y, visibility: ankle.visibility, name: 'ankle' },
    // Both sides for full skeleton rendering
    left_ear: lear ? { x: lear.x, y: lear.y, visibility: lear.visibility } : undefined as any,
    right_ear: rear ? { x: rear.x, y: rear.y, visibility: rear.visibility } : undefined as any,
    left_shoulder: { x: ls.x, y: ls.y, visibility: ls.visibility },
    right_shoulder: { x: rs.x, y: rs.y, visibility: rs.visibility },
    left_elbow: { x: le.x, y: le.y, visibility: le.visibility },
    right_elbow: { x: re.x, y: re.y, visibility: re.visibility },
    left_wrist: { x: lw.x, y: lw.y, visibility: lw.visibility },
    right_wrist: { x: rw.x, y: rw.y, visibility: rw.visibility },
    left_hip: { x: lh.x, y: lh.y, visibility: lh.visibility },
    right_hip: { x: rh.x, y: rh.y, visibility: rh.visibility },
    left_knee: { x: lk.x, y: lk.y, visibility: lk.visibility },
    right_knee: { x: rk.x, y: rk.y, visibility: rk.visibility },
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
    dominantSide
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
  primaryJointKey?: 'hip' | 'knee' | 'elbow' | 'shoulder'
) {
  ctx.clearRect(0, 0, width, height);

  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const isVisible = (p?: Keypoint2D) => {
    if (!p) return false;
    if (p.visibility !== undefined && p.visibility < 0.25) return false;
    return true;
  };

  const drawSegment = (p1?: Keypoint2D, p2?: Keypoint2D, color = 'rgba(255, 255, 255, 0.75)') => {
    if (!isVisible(p1) || !isVisible(p2)) return;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(p1!.x * width, p1!.y * height);
    ctx.lineTo(p2!.x * width, p2!.y * height);
    ctx.stroke();
  };

  const drawJoint = (p?: Keypoint2D, radius = 5, color = '#3B82F6') => {
    if (!isVisible(p)) return;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p!.x * width, p!.y * height, radius, 0, 2 * Math.PI);
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
    ctx.arc(trackedJoint.x * width, trackedJoint.y * height, 22, -0.6 * Math.PI, 0.4 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  // Draw Floating Angle Badge anchored directly adjacent to the primary vertex
  if (activeAngleBadge && trackedJoint && isVisible(trackedJoint)) {
    const badgeX = (activeAngleBadge.x ?? trackedJoint.x) * width;
    const badgeY = ((activeAngleBadge.y ?? trackedJoint.y) * height) - 24;

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
    ctx.fillText(text, badgeX, badgeY - 3);
    ctx.restore();
  }
}

export interface RenderOverlayOptions {
  showLeverArms?: boolean;
  zoom?: number;
  panOffset?: { x: number; y: number };
  primaryJointKey?: 'hip' | 'knee' | 'elbow' | 'shoulder';
  patternFamily?: PatternFamily;
  targetMuscle?: TargetMuscle;
  loadType?: LoadType;
  exerciseId?: string;
  useInternalCanvasTransform?: boolean;
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
  includeSegments: boolean
) {
  const kx = knee.x * width;
  const ky = knee.y * height;

  const isOptimal = kneeAngleDeg >= 80 && kneeAngleDeg <= 102;
  const isQuads = kneeAngleDeg < 80;
  const kneeColor = isOptimal ? '#10B981' : (isQuads ? '#F59E0B' : '#38BDF8');

  ctx.save();
  if (includeSegments) {
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.85)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hip.x * width, hip.y * height);
    ctx.lineTo(kx, ky);
    ctx.lineTo(ankle.x * width, ankle.y * height);
    ctx.stroke();
  }

  // Draw true geometric arc between femur (knee->hip) and tibia (knee->ankle)
  const aHip = Math.atan2(hip.y * height - ky, hip.x * width - kx);
  const aAnkle = Math.atan2(ankle.y * height - ky, ankle.x * width - kx);
  let diff = aAnkle - aHip;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;

  ctx.strokeStyle = kneeColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(kx, ky, 22, aHip, aHip + diff, diff < 0);
  ctx.stroke();

  // Joint circle at knee
  ctx.fillStyle = kneeColor;
  ctx.beginPath();
  ctx.arc(kx, ky, 5.5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const tag = isOptimal ? 'Glúteo ~90°' : (isQuads ? '+Cuádriceps' : '+Femoral');
  drawCanvasBadge(ctx, kx, ky - 24, `Rodilla: ${Math.round(kneeAngleDeg)}° (${tag})`, kneeColor);
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
  height: number
) {
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
    drawHipThrustKneeAngle(ctx, hip, knee, ankle, width, height, kneeAngle, true);
  }

  // 2. Lumbar & Neck Neutrality (Shoulder -> Hip and Ear -> Shoulder)
  const lumbarOk = frame.technique.lumbarNeutral !== false;
  const neckOk = frame.technique.neckNeutral !== false;
  const lumbarColor = lumbarOk ? '#10B981' : '#EF4444';
  const neckColor = neckOk ? '#10B981' : '#EF4444';

  if (shoulder && hip) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 3.5;

    // Lumbar segment (shoulder -> hip)
    ctx.strokeStyle = lumbarColor;
    if (!lumbarOk) ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(shoulder.x * width, shoulder.y * height);
    ctx.lineTo(hip.x * width, hip.y * height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Neck segment (ear -> shoulder)
    const hasValidEar = ear && (ear.visibility === undefined || ear.visibility >= 0.35);
    if (hasValidEar) {
      ctx.strokeStyle = neckColor;
      if (!neckOk) ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(ear!.x * width, ear!.y * height);
      ctx.lineTo(shoulder.x * width, shoulder.y * height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const drawNode = (p: Keypoint2D, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };
    if (hasValidEar) drawNode(ear!, neckColor);
    drawNode(shoulder, neckOk && lumbarOk ? '#10B981' : '#F59E0B');
    drawNode(hip, lumbarColor);

    const midX = (shoulder.x + hip.x) * width / 2;
    const midY = (shoulder.y + hip.y) * height / 2 - 18;
    const statusText = `Lumbar: ${lumbarOk ? '✓' : '⚠️'} · Cuello: ${neckOk ? '✓' : '⚠️'}`;
    drawCanvasBadge(ctx, midX, midY, statusText, lumbarOk && neckOk ? '#10B981' : '#EF4444');
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
    zoom = 1,
    panOffset = { x: 0, y: 0 },
    patternFamily,
    targetMuscle,
    loadType,
    exerciseId,
    useInternalCanvasTransform = false
  } = options;

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
    drawHipThrustOptimizationOverlay(ctx, frame, keypoints, width, height);
    ctx.restore();
    return;
  }

  // Working side keypoints (strictly active lead side, no background/rear clutter)
  const hip = keypoints['hip'] || keypoints['left_hip'] || keypoints['right_hip'];
  const knee = keypoints['knee'] || keypoints['left_knee'] || keypoints['right_knee'];
  const ankle = keypoints['ankle'] || keypoints['left_ankle'] || keypoints['right_ankle'];
  const hand = keypoints['wrist'] || keypoints['left_wrist'] || keypoints['right_wrist'];
  const shoulder = keypoints['shoulder'] || keypoints['left_shoulder'] || keypoints['right_shoulder'];
  const elbow = keypoints['elbow'] || keypoints['left_elbow'] || keypoints['right_elbow'];

  const isUpperBody = patternFamily === 'push_press' ||
    patternFamily === 'pull_row' ||
    targetMuscle === 'pectorals' ||
    targetMuscle === 'lats';

  const isHipThrust = exerciseId?.includes('hip_thrust');

  // Force Application Contact Point:
  // - For Hip Thrust: load is applied directly at the PELVIS / HIP where barbell or pad rests.
  // - If loadType === 'machine' or exercise is on a machine / leg press / hack (or foot on machine plate):
  //   The load/reaction force is applied at the FOOT / ANKLE on the machine.
  // - For free-weight hinge / dumbbell: force is at the hand / wrist.
  // - For barbell squat: force is at the shoulder/bar.
  // - For upper body: force is at the hand / wrist.
  const isFootOnMachine = (
    loadType === 'machine' ||
    exerciseId?.includes('press') ||
    exerciseId?.includes('hack') ||
    exerciseId?.includes('machine') ||
    exerciseId?.includes('extension')
  ) && !isUpperBody && !isHipThrust;

  const contactPoint = (isHipThrust && hip)
    ? hip
    : (isUpperBody && hand)
        ? hand
        : ((isFootOnMachine && ankle)
            ? ankle
            : (bio.loadPosition || (hand || ankle || shoulder || { x: 0.5, y: 0.5 })));

  const loadX = contactPoint.x * width;
  const loadY = contactPoint.y * height;

  // 1. Force Line of Action (Línea de Acción de la Fuerza):
  // Continuous vertical line passing strictly through the load application point (hand grip or foot on machine)
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(loadX, 0);
  ctx.lineTo(loadX, height);
  ctx.stroke();

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
  const arrowY = Math.min(height - 12, loadY + 40);
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.moveTo(loadX, arrowY);
  ctx.lineTo(loadX - headLen * 0.7, arrowY - headLen);
  ctx.lineTo(loadX + headLen * 0.7, arrowY - headLen);
  ctx.closePath();
  ctx.fill();

  // Helper for drawing orthogonal moment arm segment with non-overlapping badge
  const drawMomentArm = (
    y: number,
    xJoint: number,
    color: string,
    label: string,
    labelOffsetY: number = -9
  ) => {
    // Horizontal orthogonal line from force vector to joint center
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(loadX, y);
    ctx.lineTo(xJoint, y);
    ctx.stroke();

    // Endpoints
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(loadX, y, 4, 0, 2 * Math.PI);
    ctx.arc(xJoint, y, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Floating text badge
    const midX = (loadX + xJoint) / 2;
    const midY = y + labelOffsetY;
    ctx.font = 'bold 11px monospace';
    const textWidth = ctx.measureText(label).width;

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

  // 2. Direct Orthogonal Moment Arms (Exclusively two segments)
  if (showLeverArms) {
    if (!isUpperBody) {
      if (hip) {
        const hipPx = Math.abs(Math.round(hip.x * width - loadX));
        drawMomentArm(hip.y * height, hip.x * width, '#06B6D4', `d_cadera: ${hipPx}px`);
      }
      if (knee) {
        const kneePx = Math.abs(Math.round(knee.x * width - loadX));
        drawMomentArm(knee.y * height, knee.x * width, '#10B981', `d_rodilla: ${kneePx}px`);
      }
    } else {
      const armsCloseY = shoulder && elbow && Math.abs(shoulder.y - elbow.y) * height < 34;
      if (shoulder) {
        const shPx = Math.abs(Math.round(shoulder.x * width - loadX));
        drawMomentArm(
          shoulder.y * height,
          shoulder.x * width,
          '#8B5CF6',
          `d_hombro: ${shPx}px`,
          armsCloseY ? -13 : -9
        );
      }
      if (elbow) {
        const elPx = Math.abs(Math.round(elbow.x * width - loadX));
        drawMomentArm(
          elbow.y * height,
          elbow.x * width,
          '#EC4899',
          `d_codo: ${elPx}px`,
          armsCloseY ? 15 : -9
        );
      }
    }
  }

  // 3. Subtle Tibia Segment (Rodilla -> Tobillo) with Non-Intrusive Stabilized Tibial Angle θ_tibia
  if (knee && ankle && !isUpperBody) {
    const kx = knee.x * width;
    const ky = knee.y * height;
    const ax = ankle.x * width;
    const ay = ankle.y * height;

    // Thin, subtle dashed guide line that does not obstruct the leg
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.40)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(kx, ky);
    ctx.lineTo(ax, ay);
    ctx.stroke();
    ctx.setLineDash([]);

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

  // 4. Clean Joint Dots ONLY on Active Working Side (Zero Extra Noise)
  const drawJointDot = (pt: { x: number; y: number }, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pt.x * width, pt.y * height, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  if (!isUpperBody) {
    if (hip) drawJointDot(hip, '#06B6D4');
    if (knee) drawJointDot(knee, '#10B981');
    if (ankle) drawJointDot(ankle, isFootOnMachine ? '#EF4444' : '#38BDF8');
    if (!isFootOnMachine && hand) drawJointDot(hand, '#EF4444');
  } else {
    if (shoulder) drawJointDot(shoulder, '#8B5CF6');
    if (elbow) drawJointDot(elbow, '#EC4899');
    if (hand) drawJointDot(hand, '#EF4444');

    // Ground foot stability dots for Chest Press (Leg Drive visibility)
    const pressEval = bio.pressEvaluation;
    if (pressEval && pressEval.footStabilityStatus !== 'not_visible') {
      const footColor = pressEval.footStabilityStatus === 'stable_leg_drive' ? '#10B981' : '#EF4444';
      const la = keypoints['left_ankle'];
      const ra = keypoints['right_ankle'];
      if (la && (la.visibility === undefined || la.visibility >= 0.35)) drawJointDot(la, footColor);
      if (ra && (ra.visibility === undefined || ra.visibility >= 0.35)) drawJointDot(ra, footColor);
    }
  }

  // 5. Muscle Bias HUD Banner at top of canvas
  const isSetupOrLockout = frame.phase === 'LOCKOUT' && Math.abs(frame.angularVelocityDegPerSec) < 8;
  const biasText = isSetupOrLockout
    ? 'POSICIÓN INICIAL • ESPERANDO DESCENSO'
    : `${bio.muscleBiasLabel.toUpperCase()} • RATIO: ${bio.momentArms.hipOverKneeRatio}`;

  ctx.font = 'bold 11px monospace';
  const bannerWidth = ctx.measureText(biasText).width + 24;
  const bannerX = width / 2;
  const bannerY = 24;

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

  if (mode === 'biomechanics') {
    // Mode 2: Biomechanical optimization - pure load vector, moment arms, zero skeleton clutter
    drawBiomechanicsOverlayOnCanvas(ctx, frame, keypoints, width, height, mergedOptions);
  } else {
    const { zoom = 1, panOffset = { x: 0, y: 0 }, useInternalCanvasTransform = false } = mergedOptions;
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
      {
        angle: frame.currentAngle,
        label: 'Ángulo'
      },
      mergedOptions.primaryJointKey
    );

    // Spinal Alignment (Oreja -> Hombro -> Cadera)
    // Only use authentic ear landmark (never nose)
    const ear = keypoints['ear'] || keypoints['left_ear'] || keypoints['right_ear'];
    const shoulder = keypoints['shoulder'] || keypoints['left_shoulder'] || keypoints['right_shoulder'];
    const hip = keypoints['hip'] || keypoints['left_hip'] || keypoints['right_hip'];
    const knee = keypoints['knee'] || keypoints['left_knee'] || keypoints['right_knee'];
    const ankle = keypoints['ankle'] || keypoints['left_ankle'] || keypoints['right_ankle'];

    const isHipThrust = mergedOptions.exerciseId?.includes('hip_thrust');

    // In Hip Thrust Mode 1, render the Knee Angle (~90° check) cleanly at the knee vertex
    if (isHipThrust && hip && knee && ankle) {
      const kneeAngle = Math.round(
        frame.technique.kneeAngleDegrees ?? calculateJointAngle(hip, knee, ankle)
      );
      drawHipThrustKneeAngle(ctx, hip, knee, ankle, width, height, kneeAngle, false);
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

    if (spineShoulder && spineHip) {
      ctx.save();
      const lumbarOk = frame.technique.lumbarNeutral !== false;
      const neckOk = frame.technique.neckNeutral !== false;
      const spineNeutral = isHipThrust ? (lumbarOk && neckOk) : frame.technique.isSpineNeutral;
      const spineColor = spineNeutral ? '#10B981' : '#EF4444';
      ctx.strokeStyle = spineColor;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (!spineNeutral) {
        ctx.setLineDash([7, 4]);
      }

      ctx.beginPath();
      const hasValidHead = spineHead && (spineHead.visibility === undefined || spineHead.visibility >= 0.35);
      if (hasValidHead) {
        ctx.moveTo(spineHead.x * width, spineHead.y * height);
        ctx.lineTo(spineShoulder.x * width, spineShoulder.y * height);
      } else {
        ctx.moveTo(spineShoulder.x * width, spineShoulder.y * height);
      }
      ctx.lineTo(spineHip.x * width, spineHip.y * height);
      ctx.stroke();

      // Draw spinal alignment joint nodes
      const drawSpinalNode = (p: Keypoint2D, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, 5.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      };

      if (hasValidHead) drawSpinalNode(spineHead!, spineColor);
      drawSpinalNode(spineShoulder, spineColor);
      drawSpinalNode(spineHip, spineColor);

      // Dedicated spinal alignment status badge
      const midX = (spineShoulder.x + spineHip.x) * width / 2;
      const midY = (spineShoulder.y + spineHip.y) * height / 2;
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
