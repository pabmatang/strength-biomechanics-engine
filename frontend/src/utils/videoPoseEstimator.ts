/**
 * Video Pose Estimator & Biomechanical Trigonometry Engine
 *
 * Integrates Google MediaPipe Tasks Vision (PoseLandmarker) for real-time
 * video pose estimation, combined with geometric vector trigonometry (Math.atan2)
 * for joint angle tracking and exercise-specific repetition detection.
 */

import { FilesetResolver, PoseLandmarker, PoseLandmarkerResult } from '@mediapipe/tasks-vision';

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
    inflectionThreshold: 80, // Codos flexionados cerca del dorsal
    trackingMode: 'descending',
    targetJointDescription: 'Flexión de codo y trayectoria hacia el ilíaco',
    rules: [
      {
        id: 'lat_rom_depth',
        joint: 'elbow',
        phase: 'bottom',
        maxAcceptableAngle: 85,
        alertMessageOver: 'Tirón incompleto: baja los codos hacia las caderas/ilíaco para activar el dorsal ancho.',
        alertMessageUnder: 'Rango de recorrido óptimo en dorsal ancho.'
      },
      {
        id: 'torso_swing',
        joint: 'torso',
        phase: 'concentric',
        maxAcceptableAngle: 25,
        alertMessageOver: 'Inclinación excesiva hacia atrás: evita balancear el torso con la zona lumbar.',
        alertMessageUnder: 'Torso estable y alineación torácica estricta.'
      }
    ]
  },
  biceps_curl: {
    id: 'biceps_curl',
    name: 'Bíceps (Curl con Mancuernas / Polea)',
    category: 'biceps',
    primaryJoint: 'elbow',
    standingThreshold: 155, // Brazo estirado abajo
    inflectionThreshold: 55, // Brazo flexionado arriba
    trackingMode: 'descending',
    targetJointDescription: 'Ángulo de flexión del codo [50° - 160°]',
    rules: [
      {
        id: 'biceps_contraction',
        joint: 'elbow',
        phase: 'bottom',
        maxAcceptableAngle: 65,
        alertMessageOver: 'Contracción incompleta: flexiona el codo hasta sentir el pico del bíceps.',
        alertMessageUnder: 'Pico de contracción máximo alcanzado.'
      },
      {
        id: 'elbow_drift',
        joint: 'shoulder',
        phase: 'concentric',
        maxAcceptableAngle: 30,
        alertMessageOver: 'Codos adelantados: no balancees los hombros para subir el peso.',
        alertMessageUnder: 'Codos firmes bloqueados a los costados.'
      }
    ]
  },
  triceps_extension: {
    id: 'triceps_extension',
    name: 'Tríceps (Extensión en Polea / Tras Nuca)',
    category: 'triceps',
    primaryJoint: 'elbow',
    standingThreshold: 85, // Codo flexionado a 90°
    inflectionThreshold: 165, // Codo bloqueado extendido a ~170°
    trackingMode: 'ascending',
    targetJointDescription: 'Extensión completa del codo hacia abajo [90° - 170°]',
    rules: [
      {
        id: 'triceps_lockout',
        joint: 'elbow',
        phase: 'bottom',
        minAcceptableAngle: 160,
        alertMessageUnder: 'Extensión incompleta: bloquea los codos abajo para apretar la cabeza lateral.',
        alertMessageOver: 'Bloqueo concéntrico perfecto de tríceps.'
      },
      {
        id: 'elbow_flare',
        joint: 'shoulder',
        phase: 'concentric',
        maxAcceptableAngle: 35,
        alertMessageOver: 'Codos abiertos: mantenlos paralelos pegados al cuerpo.',
        alertMessageUnder: 'Alineación de codos correcta.'
      }
    ]
  },
  rdl_deadlift: {
    id: 'rdl_deadlift',
    name: 'Femoral / Peso Muerto Rumano (RDL)',
    category: 'legs_hamstrings',
    primaryJoint: 'hip',
    standingThreshold: 165, // De pie erecto
    inflectionThreshold: 85, // Bisagra de cadera máxima
    trackingMode: 'descending',
    targetJointDescription: 'Bisagra de cadera (Hip Hinge) con rodillas fijas',
    rules: [
      {
        id: 'hip_hinge_depth',
        joint: 'hip',
        phase: 'bottom',
        maxAcceptableAngle: 90,
        alertMessageOver: 'Bisagra insuficiente: empuja la cadera hacia la pared trasera para estirar el isquiosural.',
        alertMessageUnder: 'Estiramiento máximo de cadena posterior alcanzado.'
      },
      {
        id: 'knee_squat_trap',
        joint: 'knee',
        phase: 'bottom',
        minAcceptableAngle: 145,
        alertMessageUnder: '¡Alerta Sentadilla!: Estás doblando las rodillas en exceso. Fíjalas en ligera semiflexión (~155°).',
        alertMessageOver: 'Semiflexión de rodilla biomecánicamente óptima.'
      }
    ]
  },
  bench_press: {
    id: 'bench_press',
    name: 'Press de Pecho / Banca (Hammer & Convergente)',
    category: 'chest',
    primaryJoint: 'elbow',
    standingThreshold: 160, // Brazos extendidos
    inflectionThreshold: 85, // Barra/manerales en el pecho
    trackingMode: 'descending',
    targetJointDescription: 'Descenso de manerales al pecho y empuje convergente',
    rules: [
      {
        id: 'elbow_flare',
        joint: 'elbow',
        phase: 'bottom',
        maxAcceptableAngle: 90,
        alertMessageOver: 'Baja más los manerales hasta sentir el estiramiento en el pectoral medio/inferior.',
        alertMessageUnder: 'Estiramiento profundo en el pectoral.'
      },
      {
        id: 'shoulder_retraction',
        joint: 'shoulder',
        phase: 'concentric',
        maxAcceptableAngle: 75,
        alertMessageOver: 'Codos a 90°: cierra a 45°-60° respecto al torso para proteger el manguito rotador.',
        alertMessageUnder: 'Ángulo articular codo-torso seguro.'
      }
    ]
  },
  squat: {
    id: 'squat',
    name: 'Sentadilla Libre & Multipower (Squat)',
    category: 'legs_quads',
    primaryJoint: 'knee',
    standingThreshold: 160,
    inflectionThreshold: 90,
    trackingMode: 'descending',
    targetJointDescription: 'Flexión profunda de rodilla y bisagra de cadera',
    rules: [
      {
        id: 'depth_check',
        joint: 'knee',
        phase: 'bottom',
        maxAcceptableAngle: 90,
        alertMessageOver: 'Profundidad insuficiente: la cadera debe descender hasta el paralelo (≤ 90°).',
        alertMessageUnder: 'Profundidad completa válida (paralelo superado).'
      },
      {
        id: 'torso_lean',
        joint: 'hip',
        phase: 'bottom',
        minAcceptableAngle: 45,
        alertMessageUnder: 'Torso excesivamente inclinado hacia adelante: riesgo de sobrecarga lumbar.',
        alertMessageOver: 'Torso verticalizado y columna neutra.'
      }
    ]
  },
  leg_press: {
    id: 'leg_press',
    name: 'Prensa de Piernas 45°',
    category: 'legs_quads',
    primaryJoint: 'knee',
    standingThreshold: 160,
    inflectionThreshold: 90,
    trackingMode: 'descending',
    targetJointDescription: 'Flexión de rodilla en plataforma inclinada',
    rules: [
      {
        id: 'knee_flexion',
        joint: 'knee',
        phase: 'bottom',
        maxAcceptableAngle: 90,
        alertMessageOver: 'Baja más la plataforma para lograr flexión profunda de cuádriceps.',
        alertMessageUnder: 'Rango de movimiento completo sin retroversión pélvica.'
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
  landmarks: Array<{ x: number; y: number; z: number; visibility?: number }>
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

  const leftVis = ((ls?.visibility ?? 0.8) + (le?.visibility ?? 0.8) + (lw?.visibility ?? 0.8) + (lh?.visibility ?? 0.8)) / 4;
  const rightVis = ((rs?.visibility ?? 0.8) + (re?.visibility ?? 0.8) + (rw?.visibility ?? 0.8) + (rh?.visibility ?? 0.8)) / 4;
  const dominantSide = rightVis >= leftVis ? 'right' : 'left';

  const shoulder = dominantSide === 'right' ? rs : ls;
  const elbow = dominantSide === 'right' ? re : le;
  const wrist = dominantSide === 'right' ? rw : lw;
  const hip = dominantSide === 'right' ? rh : lh;
  const knee = dominantSide === 'right' ? rk : lk;
  const ankle = dominantSide === 'right' ? ra : la;

  const keypoints: Record<string, Keypoint2D> = {
    shoulder: { x: shoulder.x, y: shoulder.y, visibility: shoulder.visibility, name: 'shoulder' },
    elbow: { x: elbow.x, y: elbow.y, visibility: elbow.visibility, name: 'elbow' },
    wrist: { x: wrist.x, y: wrist.y, visibility: wrist.visibility, name: 'wrist' },
    hip: { x: hip.x, y: hip.y, visibility: hip.visibility, name: 'hip' },
    knee: { x: knee.x, y: knee.y, visibility: knee.visibility, name: 'knee' },
    ankle: { x: ankle.x, y: ankle.y, visibility: ankle.visibility, name: 'ankle' },
    // Both sides for full skeleton rendering
    left_shoulder: { x: ls.x, y: ls.y },
    right_shoulder: { x: rs.x, y: rs.y },
    left_elbow: { x: le.x, y: le.y },
    right_elbow: { x: re.x, y: re.y },
    left_wrist: { x: lw.x, y: lw.y },
    right_wrist: { x: rw.x, y: rw.y },
    left_hip: { x: lh.x, y: lh.y },
    right_hip: { x: rh.x, y: rh.y },
    left_knee: { x: lk.x, y: lk.y },
    right_knee: { x: rk.x, y: rk.y },
    left_ankle: { x: la.x, y: la.y },
    right_ankle: { x: ra.x, y: ra.y }
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
  activeAngleBadge?: { angle: number; label: string; x?: number; y?: number }
) {
  ctx.clearRect(0, 0, width, height);

  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const drawSegment = (p1?: Keypoint2D, p2?: Keypoint2D, color = 'rgba(255, 255, 255, 0.75)') => {
    if (!p1 || !p2) return;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(p1.x * width, p1.y * height);
    ctx.lineTo(p2.x * width, p2.y * height);
    ctx.stroke();
  };

  const drawJoint = (p?: Keypoint2D, radius = 5, color = '#3B82F6') => {
    if (!p) return;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  };

  // Shoulders and Torso Box
  const ls = keypoints['left_shoulder'] || keypoints['shoulder'];
  const rs = keypoints['right_shoulder'] || keypoints['shoulder'];
  const lh = keypoints['left_hip'] || keypoints['hip'];
  const rh = keypoints['right_hip'] || keypoints['hip'];

  drawSegment(ls, rs, 'rgba(56, 189, 248, 0.85)'); // Shoulder girdle
  drawSegment(ls, lh, 'rgba(255, 255, 255, 0.6)');
  drawSegment(rs, rh, 'rgba(255, 255, 255, 0.6)');
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
    if (j) drawJoint(j, 5, '#60A5FA');
  });

  // Highlight dominant/tracked primary joint
  const trackedJoint = keypoints['elbow'] || keypoints['knee'] || keypoints['hip'];
  if (trackedJoint) {
    drawJoint(trackedJoint, 8, feedbackColor);
  }

  // Draw Floating Angle Badge on the primary tracked joint
  if (activeAngleBadge && trackedJoint) {
    const badgeX = (activeAngleBadge.x ?? trackedJoint.x) * width;
    const badgeY = ((activeAngleBadge.y ?? trackedJoint.y) * height) - 22;

    ctx.save();
    ctx.font = 'bold 12px monospace';
    const text = `${activeAngleBadge.angle}°`;
    const textWidth = ctx.measureText(text).width;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
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
