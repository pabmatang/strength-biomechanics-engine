/**
 * Video Pose Estimator & Geometric Trigonometry Engine
 *
 * Implements real-time joint angle tracking, FSM state machines for repetition
 * counting, and biomechanical feedback rules.
 */

export interface Keypoint2D {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

export type JointAngleKey = 'knee' | 'hip' | 'elbow' | 'shoulder' | 'ankle';

export interface CalculatedAngles {
  kneeAngle: number;
  hipAngle: number;
  elbowAngle: number;
  torsoLeanAngle: number;
}

/**
 * Calculates internal angle in degrees [0 - 180°] at the central vertex.
 */
export function calculateJointAngle(
  pointA: Keypoint2D,
  vertex: Keypoint2D,
  pointC: Keypoint2D
): number {
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
  phase: 'bottom' | 'eccentric' | 'concentric';
  minAcceptableAngle?: number;
  maxAcceptableAngle?: number;
  alertMessageUnder: string;
  alertMessageOver: string;
}

export interface ExercisePoseProfile {
  id: string;
  name: string;
  primaryJoint: JointAngleKey;
  standingThreshold: number;
  inflectionThreshold: number;
  rules: BiomechanicalRule[];
}

export const EXERCISE_POSE_PROFILES: Record<string, ExercisePoseProfile> = {
  squat: {
    id: 'squat',
    name: 'Sentadilla (Squat)',
    primaryJoint: 'knee',
    standingThreshold: 155,
    inflectionThreshold: 90,
    rules: [
      {
        id: 'depth_check',
        joint: 'knee',
        phase: 'bottom',
        maxAcceptableAngle: 90,
        alertMessageOver: 'Profundidad insuficiente: la cadera debe descender hasta el paralelo (≤ 90°).',
        alertMessageUnder: 'Profundidad completa alcanzada (Ass to Grass).'
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
  bench_press: {
    id: 'bench_press',
    name: 'Press de Banca',
    primaryJoint: 'elbow',
    standingThreshold: 160,
    inflectionThreshold: 85,
    rules: [
      {
        id: 'elbow_flare',
        joint: 'elbow',
        phase: 'bottom',
        minAcceptableAngle: 75,
        maxAcceptableAngle: 95,
        alertMessageUnder: 'Codos excesivamente pegados a las costillas.',
        alertMessageOver: 'Codos abiertos a 90°: riesgo de pinzamiento del manguito rotador.'
      }
    ]
  },
  leg_press: {
    id: 'leg_press',
    name: 'Prensa de Piernas',
    primaryJoint: 'knee',
    standingThreshold: 160,
    inflectionThreshold: 90,
    rules: [
      {
        id: 'knee_flexion',
        joint: 'knee',
        phase: 'bottom',
        maxAcceptableAngle: 90,
        alertMessageOver: 'Baja más la plataforma para lograr flexión profunda de cuádriceps.',
        alertMessageUnder: 'Rango de movimiento completo sin retroversión pélvica (butt wink).'
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

/**
 * Draws kinematic skeleton overlay onto HTML5 Canvas.
 */
export function drawSkeletonOnCanvas(
  ctx: CanvasRenderingContext2D,
  keypoints: Record<string, Keypoint2D>,
  width: number,
  height: number,
  feedbackColor: string = '#10B981'
) {
  ctx.clearRect(0, 0, width, height);

  // Key joints
  const shoulder = keypoints['shoulder'];
  const elbow = keypoints['elbow'];
  const wrist = keypoints['wrist'];
  const hip = keypoints['hip'];
  const knee = keypoints['knee'];
  const ankle = keypoints['ankle'];

  ctx.lineWidth = 4;
  ctx.strokeStyle = feedbackColor;
  ctx.fillStyle = '#3B82F6';

  const drawSegment = (p1?: Keypoint2D, p2?: Keypoint2D) => {
    if (!p1 || !p2) return;
    ctx.beginPath();
    ctx.moveTo(p1.x * width, p1.y * height);
    ctx.lineTo(p2.x * width, p2.y * height);
    ctx.stroke();
  };

  const drawJoint = (p?: Keypoint2D, radius = 6, color = '#3B82F6') => {
    if (!p) return;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  };

  // Draw upper body segments
  drawSegment(shoulder, elbow);
  drawSegment(elbow, wrist);
  drawSegment(shoulder, hip);

  // Draw lower body segments
  drawSegment(hip, knee);
  drawSegment(knee, ankle);

  // Draw joint nodes
  drawJoint(shoulder, 6);
  drawJoint(elbow, 6);
  drawJoint(wrist, 6);
  drawJoint(hip, 7);
  drawJoint(knee, 8, feedbackColor);
  drawJoint(ankle, 6);
}
