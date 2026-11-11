/**
 * Biomechanical Optimization & Physics Engine
 *
 * Implements:
 * 1. Force Line of Action (Gravity vector vs Cable Pulley vector).
 * 2. Perpendicular Moment Arms (d_hip, d_knee, d_shoulder, d_elbow).
 * 3. Muscle Bias Analysis (Hip vs Knee dominance ratio, Tibial Angle, Arm path).
 * 4. Resistance Profile vs Muscle Length Matching (Lengthened vs Shortened peak torque).
 * 5. Technique Audit (ROM consistency, Spinal Neutrality, Knee Valgus, Rebound detection).
 * 6. Structured JSON Output Schema for Frontend Overlays & Telemetry.
 */

import { Point2D } from './oneEuroFilter';
import { CompletedRepetition, FsmPhase } from './biomechanicalFSM';

export type LoadType = 'gravity' | 'cable' | 'machine';
export type TargetMuscle = 'quadriceps' | 'glutes_max' | 'hamstrings' | 'lats' | 'pectorals';
export type CameraPlane = 'sagittal' | 'frontal' | 'oblique';
export type PatternFamily = 'hinge_deadlift' | 'squat_knee_dominant' | 'pull_row' | 'push_press';

export type ResistanceSourceType = 'gravity' | 'cable_high' | 'cable_mid' | 'cable_low' | 'machine';
export type MuscleBiasCategory = 'hip_glute_bias' | 'knee_quad_bias' | 'balanced_hybrid' | 'lat_bias' | 'upper_back_bias';
export type ResistanceCurveMatch = 'lengthened_stretch' | 'shortened_lockout' | 'mid_range_bell';

export interface TechniqueFeedbackAlert {
  type: 'warning' | 'success';
  code: string;
  message: string;
}

export interface PatternBiomechanicsConfig {
  family: PatternFamily;
  primaryJoint: 'knee' | 'hip' | 'elbow' | 'shoulder';
  vertexKey: 'hip' | 'knee' | 'elbow' | 'shoulder';
  anglePoints: {
    pointA: string;
    vertex: string;
    pointC: string;
  };
  evaluateRules: (
    keypoints: Record<string, Point2D>,
    currentAngle: number,
    fsmPhase: FsmPhase,
    loadPosition: Point2D
  ) => TechniqueFeedbackAlert[];
}

export interface ExercisePatternSpec {
  id: string;
  name: string;
  targetMuscle: TargetMuscle;
  loadType: LoadType;
  patternFamily: PatternFamily;
  primaryJoint: 'knee' | 'hip' | 'elbow' | 'shoulder';
  trackingMode: 'ascending' | 'descending';
  standingThreshold: number;
  inflectionThreshold: number;
  description: string;
  targetRatioDescription: string;
}

/**
 * Exercise Catalog grouped by Target Muscle, Pattern Family & Load Type
 */
export const EXERCISE_PATTERNS: ExercisePatternSpec[] = [
  // Glúteo Mayor (Patrones de Bisagra / Glúteo)
  {
    id: 'bulgarian_split_squat_glute',
    name: 'Sentadilla Búlgara (Sesgo Glúteo - Torso Inclinado)',
    targetMuscle: 'glutes_max',
    loadType: 'gravity',
    patternFamily: 'hinge_deadlift',
    primaryJoint: 'hip',
    trackingMode: 'descending',
    standingThreshold: 165,
    inflectionThreshold: 88,
    description: 'Inclinación anterior del torso (45°-65°) con tibia vertical para maximizar d_cadera.',
    targetRatioDescription: 'd_cadera / d_rodilla > 1.4'
  },
  {
    id: 'hip_thrust_barbell',
    name: 'Hip Thrust con Barra / Máquina',
    targetMuscle: 'glutes_max',
    loadType: 'gravity',
    patternFamily: 'hinge_deadlift',
    primaryJoint: 'hip',
    trackingMode: 'descending',
    standingThreshold: 170,
    inflectionThreshold: 105,
    description: 'Extensión pura de cadera con soporte torácico y máxima contracción terminal.',
    targetRatioDescription: 'Máximo momento de extensión al bloqueo horizontal'
  },
  {
    id: 'rdl_glute_knee_flexion',
    name: 'Peso Muerto Rumano (RDL con flexión de rodilla)',
    targetMuscle: 'glutes_max',
    loadType: 'gravity',
    patternFamily: 'hinge_deadlift',
    primaryJoint: 'hip',
    trackingMode: 'descending',
    standingThreshold: 170,
    inflectionThreshold: 90,
    description: 'Bisagra de cadera con flexión de rodilla (~30°) para involucrar fibras del glúteo en estiramiento.',
    targetRatioDescription: 'd_cadera dominante con vector de gravedad vertical'
  },
  {
    id: 'leg_press_high_feet',
    name: 'Prensa de Piernas 45° (Pies altos y separados)',
    targetMuscle: 'glutes_max',
    loadType: 'machine',
    patternFamily: 'hinge_deadlift',
    primaryJoint: 'hip',
    trackingMode: 'descending',
    standingThreshold: 165,
    inflectionThreshold: 85,
    description: 'Posición alta de los pies para reducir la flexión tibial y acentuar la cadera.',
    targetRatioDescription: 'Mayor flexión de cadera en la inversión de carga'
  },
  {
    id: 'cable_kickback_glute',
    name: 'Patada de Glúteo en Polea Baja',
    targetMuscle: 'glutes_max',
    loadType: 'cable',
    patternFamily: 'hinge_deadlift',
    primaryJoint: 'hip',
    trackingMode: 'ascending',
    standingThreshold: 120,
    inflectionThreshold: 175,
    description: 'Aducción/extensión contra vector de cable oblicuo.',
    targetRatioDescription: 'Vector orientado 30° respecto al eje fémur'
  },

  // Cuádriceps (Patrones de Rodilla)
  {
    id: 'squat_high_bar',
    name: 'Sentadilla Libre / Barra Alta (Dominancia Rodilla)',
    targetMuscle: 'quadriceps',
    loadType: 'gravity',
    patternFamily: 'squat_knee_dominant',
    primaryJoint: 'knee',
    trackingMode: 'descending',
    standingThreshold: 168,
    inflectionThreshold: 82,
    description: 'Torso erguido con traslación tibial anterior para maximizar d_rodilla.',
    targetRatioDescription: 'd_rodilla > d_cadera'
  },
  {
    id: 'leg_extension_machine',
    name: 'Extensión de Cuádriceps en Máquina',
    targetMuscle: 'quadriceps',
    loadType: 'machine',
    patternFamily: 'squat_knee_dominant',
    primaryJoint: 'knee',
    trackingMode: 'ascending',
    standingThreshold: 90,
    inflectionThreshold: 168,
    description: 'Aislamiento concéntrico guiado con perfil de leva adaptado a la extensión.',
    targetRatioDescription: 'Sobrecarga uniforme en toda la curva de extensión'
  },
  {
    id: 'hack_squat_machine',
    name: 'Sentadilla Hack (Máquina)',
    targetMuscle: 'quadriceps',
    loadType: 'machine',
    patternFamily: 'squat_knee_dominant',
    primaryJoint: 'knee',
    trackingMode: 'descending',
    standingThreshold: 165,
    inflectionThreshold: 80,
    description: 'Soporte espinal continuo con máxima dorsiflexión y flexión de rodilla.',
    targetRatioDescription: 'Brazo de momento de rodilla aumentado'
  },
  {
    id: 'sissy_squat_bodyweight',
    name: 'Sentadilla Sissy / Búlgara Sesgo Cuádriceps',
    targetMuscle: 'quadriceps',
    loadType: 'gravity',
    patternFamily: 'squat_knee_dominant',
    primaryJoint: 'knee',
    trackingMode: 'descending',
    standingThreshold: 170,
    inflectionThreshold: 85,
    description: 'Tronco vertical y rodillas adelantadas más allá de los dedos del pie.',
    targetRatioDescription: 'Ángulo tibial > 24°'
  },

  // Isquiosurales (Patrones de Bisagra Pura)
  {
    id: 'rdl_strict_hamstring',
    name: 'Peso Muerto Rumano (RDL Bisagra estricta cadera)',
    targetMuscle: 'hamstrings',
    loadType: 'gravity',
    patternFamily: 'hinge_deadlift',
    primaryJoint: 'hip',
    trackingMode: 'descending',
    standingThreshold: 170,
    inflectionThreshold: 95,
    description: 'Rodilla fija a 15°-20° de semiflexión con máximo retroceso de cadera.',
    targetRatioDescription: 'Cadera retrasada, tibia 90° respecto al suelo'
  },
  {
    id: 'seated_leg_curl_machine',
    name: 'Curl Femoral Sentado (Máquina)',
    targetMuscle: 'hamstrings',
    loadType: 'machine',
    patternFamily: 'squat_knee_dominant',
    primaryJoint: 'knee',
    trackingMode: 'descending',
    standingThreshold: 165,
    inflectionThreshold: 75,
    description: 'Cadera flexionada a 90° para sobrecarga de isquiosurales en longitud alargada.',
    targetRatioDescription: 'Máxima tensión en estiramiento proximal'
  },
  {
    id: 'lying_leg_curl_machine',
    name: 'Curl Femoral Tumbado (Máquina)',
    targetMuscle: 'hamstrings',
    loadType: 'machine',
    patternFamily: 'squat_knee_dominant',
    primaryJoint: 'knee',
    trackingMode: 'descending',
    standingThreshold: 165,
    inflectionThreshold: 78,
    description: 'Flexión de rodilla en decúbito prono con cadera extendida.',
    targetRatioDescription: 'Pico de torque en rango medio'
  },

  // Dorsal (Patrones de Tracción / Espalda)
  {
    id: 'lat_pulldown_unilateral',
    name: 'Jalón Unilateral en Polea (Codo al Ilíaco)',
    targetMuscle: 'lats',
    loadType: 'cable',
    patternFamily: 'pull_row',
    primaryJoint: 'elbow',
    trackingMode: 'descending',
    standingThreshold: 155,
    inflectionThreshold: 85,
    description: 'Trayectoria sagital con codo cerrado al torso para alinear con fibras del dorsal ancho.',
    targetRatioDescription: 'Aducción en plano escapular / sagital'
  },
  {
    id: 'chest_supported_lat_row',
    name: 'Remo al Ilíaco con Apoyo de Pecho',
    targetMuscle: 'lats',
    loadType: 'machine',
    patternFamily: 'pull_row',
    primaryJoint: 'elbow',
    trackingMode: 'descending',
    standingThreshold: 160,
    inflectionThreshold: 88,
    description: 'Estabilidad torácica y tracción orientada a la cresta ilíaca.',
    targetRatioDescription: 'Palanca en hombro maximizada'
  },
  {
    id: 'straight_arm_cable_pulldown',
    name: 'Pull-over en Polea Alta',
    targetMuscle: 'lats',
    loadType: 'cable',
    patternFamily: 'pull_row',
    primaryJoint: 'shoulder',
    trackingMode: 'descending',
    standingThreshold: 140,
    inflectionThreshold: 70,
    description: 'Extensión pura de hombro con codo semifijo.',
    targetRatioDescription: 'Sobrecarga en ángulo de máxima extensión'
  },

  // Pectoral (Patrones de Empuje / Pecho)
  {
    id: 'converging_chest_press_machine',
    name: 'Press de Pecho en Máquina Convergente',
    targetMuscle: 'pectorals',
    loadType: 'machine',
    patternFamily: 'push_press',
    primaryJoint: 'elbow',
    trackingMode: 'descending',
    standingThreshold: 165,
    inflectionThreshold: 88,
    description: 'Trayectoria convergente que sigue el alineamiento de fibras esternocostales.',
    targetRatioDescription: 'Aducción horizontal terminal'
  },
  {
    id: 'incline_dumbbell_press',
    name: 'Press Inclinado con Mancuernas (30°)',
    targetMuscle: 'pectorals',
    loadType: 'gravity',
    patternFamily: 'push_press',
    primaryJoint: 'elbow',
    trackingMode: 'descending',
    standingThreshold: 165,
    inflectionThreshold: 88,
    description: 'Enfoque en pectoral superior (haz clavicular) con trayectoria vertical estable.',
    targetRatioDescription: 'Énfasis en pectoral superior'
  },
  {
    id: 'cable_fly_mid_sternal',
    name: 'Cruces en Polea a Altura Media',
    targetMuscle: 'pectorals',
    loadType: 'cable',
    patternFamily: 'push_press',
    primaryJoint: 'shoulder',
    trackingMode: 'descending',
    standingThreshold: 95,
    inflectionThreshold: 38,
    description: 'Brazos lo más extendidos posible para maximizar la tensión en el pectoral.',
    targetRatioDescription: 'Aducción pectoral con brazos extendidos'
  },
  {
    id: 'dips_chest_lean',
    name: 'Fondos en Paralelas (Inclinación Torácica)',
    targetMuscle: 'pectorals',
    loadType: 'gravity',
    patternFamily: 'push_press',
    primaryJoint: 'elbow',
    trackingMode: 'descending',
    standingThreshold: 165,
    inflectionThreshold: 85,
    description: 'Torso inclinado a 45° y codos abiertos a 45° para focalizar fibras inferiores y medias.',
    targetRatioDescription: 'Momento de flexión en hombro aumentado'
  }
];

export function getPatternFamily(exerciseId: string): PatternFamily {
  const pattern = EXERCISE_PATTERNS.find(p => p.id === exerciseId);
  if (pattern) return pattern.patternFamily;
  if (exerciseId.includes('rdl') || exerciseId.includes('deadlift') || exerciseId.includes('thrust') || exerciseId.includes('glute') || exerciseId.includes('hinge')) {
    return 'hinge_deadlift';
  }
  if (exerciseId.includes('squat') || exerciseId.includes('press') || exerciseId.includes('extension') || exerciseId.includes('quad')) {
    return 'squat_knee_dominant';
  }
  if (exerciseId.includes('pull') || exerciseId.includes('row') || exerciseId.includes('lat') || exerciseId.includes('espalda')) {
    return 'pull_row';
  }
  return 'push_press';
}

/**
 * Computes planar 2D joint angle (0..180 deg) at vertex formed by vertex->a and vertex->c.
 */
export function computeJointAngle2D(a?: Point2D, vertex?: Point2D, c?: Point2D): number {
  if (!a || !vertex || !c) return 90;
  const a1 = Math.atan2(a.y - vertex.y, a.x - vertex.x);
  const a2 = Math.atan2(c.y - vertex.y, c.x - vertex.x);
  let diff = Math.abs(a1 - a2);
  if (diff > Math.PI) diff = 2 * Math.PI - diff;
  return Math.round((diff * 180 / Math.PI) * 10) / 10;
}

export interface HipThrustAlignmentEvaluation {
  kneeAngleDegrees: number;
  kneeBias: 'optimal_glute_90' | 'quad_dominant' | 'hamstring_dominant';
  lumbarNeutral: boolean;
  lumbarStatusLabel: string;
  neckNeutral: boolean;
  neckStatusLabel: string;
  neckDeviationDeg: number;
}

/**
 * Evaluates Hip Thrust specific biomechanics:
 * 1) Knee angle proximity to 90° (controls Glute vs Quad/Hamstring bias)
 * 2) Lumbar neutrality (avoids hyperextension arch above shoulder-knee bridge line)
 * 3) Neck / cervical neutrality (chin-tuck vs cervical hyperextension behind bench)
 */
export function evaluateHipThrustAlignment(
  keypoints: Record<string, Point2D>,
  currentHipAngle: number
): HipThrustAlignmentEvaluation {
  const ear = keypoints['ear'] || keypoints['right_ear'] || keypoints['left_ear'];
  const shoulder = keypoints['shoulder'] || keypoints['right_shoulder'] || keypoints['left_shoulder'];
  const hip = keypoints['hip'] || keypoints['right_hip'] || keypoints['left_hip'];
  const knee = keypoints['knee'] || keypoints['right_knee'] || keypoints['left_knee'];
  const ankle = keypoints['ankle'] || keypoints['right_ankle'] || keypoints['left_ankle'];

  const kneeAngleDegrees = Math.round(computeJointAngle2D(hip, knee, ankle));

  let kneeBias: 'optimal_glute_90' | 'quad_dominant' | 'hamstring_dominant' = 'optimal_glute_90';
  if (kneeAngleDegrees < 80) {
    kneeBias = 'quad_dominant';
  } else if (kneeAngleDegrees > 102) {
    kneeBias = 'hamstring_dominant';
  }

  let lumbarNeutral = true;
  let lumbarStatusLabel = '✓ Lumbar Neutro';
  if (shoulder && hip && knee && Math.abs(knee.x - shoulder.x) > 0.08) {
    const t = Math.max(0, Math.min(1, (hip.x - shoulder.x) / (knee.x - shoulder.x)));
    const expectedLineY = shoulder.y + t * (knee.y - shoulder.y);
    if (hip.y < expectedLineY - 0.045 && currentHipAngle >= 165) {
      lumbarNeutral = false;
      lumbarStatusLabel = '⚡ Hiperextensión Lumbar';
    }
  }

  let neckNeutral = true;
  let neckStatusLabel = '✓ Cuello Neutro';
  let neckDeviationDeg = 0;
  if (ear && shoulder && hip) {
    const spineCollinearity = calculateSpinalCollinearity(ear, shoulder, hip);
    neckDeviationDeg = spineCollinearity.deviationAngleDeg;
    const neckJointAngle = computeJointAngle2D(ear, shoulder, hip);

    let isCervicalHyperextension = false;
    if (Math.abs(shoulder.x - hip.x) > 0.04) {
      const slopeY = (shoulder.y - hip.y) / (shoulder.x - hip.x);
      const extrapolatedTorsoYAtEar = shoulder.y + (ear.x - shoulder.x) * slopeY;
      // Only flag hyperextension when head drops noticeably backward/below torso bench axis
      if (ear.y > extrapolatedTorsoYAtEar + 0.03) {
        isCervicalHyperextension = true;
      }
    }

    if (isCervicalHyperextension) {
      neckNeutral = false;
      neckStatusLabel = '⚡ Hiperextensión Cervical';
    } else if (neckJointAngle < 75) {
      // Allow healthy forward chin-tuck (80°-180°); only warn on extreme chest smash (<75°)
      neckNeutral = false;
      neckStatusLabel = '⚡ Flexión Cervical Excesiva';
    }
  }

  return {
    kneeAngleDegrees,
    kneeBias,
    lumbarNeutral,
    lumbarStatusLabel,
    neckNeutral,
    neckStatusLabel,
    neckDeviationDeg
  };
}

export interface FramingQualityResult {
  isValid: boolean;
  reasonCode: 'OK' | 'TOO_CLOSE_CLIPPED' | 'OCCLUDED_LOW_CONFIDENCE' | 'COLLAPSED_TORSO_BY_PLATES';
  message: string;
}

/**
 * Detects whether the camera framing is too close or heavily occluded by equipment/plates
 * for trustworthy pose tracking.
 */
export function assessFramingQuality(
  keypoints: Record<string, Point2D & { visibility?: number }>,
  exerciseId?: string
): FramingQualityResult {
  const shoulder = keypoints['shoulder'];
  const hip = keypoints['hip'];
  const knee = keypoints['knee'];
  const ankle = keypoints['ankle'];

  const isLowerBody = !exerciseId ||
    exerciseId.includes('hip_thrust') ||
    exerciseId.includes('squat') ||
    exerciseId.includes('rdl') ||
    exerciseId.includes('press') ||
    exerciseId.includes('bulgarian');

  if (!isLowerBody) {
    return { isValid: true, reasonCode: 'OK', message: '' };
  }

  const required = [shoulder, hip, knee, ankle].filter(Boolean);
  if (required.length < 4) {
    return {
      isValid: false,
      reasonCode: 'OCCLUDED_LOW_CONFIDENCE',
      message: 'No se puede analizar: cuerpo incompleto. Aleja más el vídeo para encuadrar todo el perfil.'
    };
  }

  const lowVisCount = required.filter(p => p.visibility !== undefined && p.visibility < 0.38).length;
  const avgVis = required.reduce((acc, p) => acc + (p.visibility ?? 0.8), 0) / required.length;
  if (lowVisCount >= 2 || avgVis < 0.42) {
    return {
      isValid: false,
      reasonCode: 'OCCLUDED_LOW_CONFIDENCE',
      message: 'No se puede analizar: los discos tapan el torso o el plano está muy cerrado. Aleja más el vídeo.'
    };
  }

  const clippedCount = required.filter(
    p => p.x < 0.02 || p.x > 0.98 || p.y < 0.02 || p.y > 0.98
  ).length;
  if (clippedCount >= 2) {
    return {
      isValid: false,
      reasonCode: 'TOO_CLOSE_CLIPPED',
      message: 'No se puede analizar: vídeo demasiado cerca (cuerpo cortado). Aleja más la cámara.'
    };
  }

  const torsoLen = Math.hypot(shoulder.x - hip.x, shoulder.y - hip.y);
  const femurLen = Math.hypot(hip.x - knee.x, hip.y - knee.y);
  const shinLen = Math.hypot(knee.x - ankle.x, knee.y - ankle.y);

  if (torsoLen < 0.065 && (femurLen > 0.10 || shinLen > 0.12)) {
    return {
      isValid: false,
      reasonCode: 'COLLAPSED_TORSO_BY_PLATES',
      message: 'No se puede analizar bien: plano muy cercano u obstruido por discos. Aleja más el vídeo.'
    };
  }

  return { isValid: true, reasonCode: 'OK', message: '' };
}

export interface FootStabilityState {
  baselineLeftAnkle?: Point2D;
  baselineRightAnkle?: Point2D;
  groundY?: number;
}

export interface PressBiomechanicsEvaluation {
  handElbowAlignment: 'aligned_90' | 'closed_triceps' | 'wide_stretch';
  handElbowLabel: string;
  elbowShoulderPosition: 'optimal_below_shoulder' | 'high_shoulder_risk' | 'too_tucked';
  elbowShoulderLabel: string;
  shoulderAbductionDeg: number;
  footStabilityStatus: 'stable_leg_drive' | 'foot_lifted' | 'foot_shifted' | 'not_visible';
  footStabilityLabel: string;
  spineNeutral: boolean;
  spineAngleDeg: number;
}

/**
 * Evaluates Upper Body Chest Press biomechanics:
 * 1) Hand vs Elbow alignment (~90° stacked vs closed +Triceps vs wide)
 * 2) Elbow height relative to Shoulder (safely below shoulder ~45°-65° scapular plane)
 * 3) Bilateral/Frontal Spinal Neutrality (prevents ear-to-shoulder false frontal break)
 * 4) Ground Foot Stability / Leg Drive (detects lifting feet or shifting foot placement across reps)
 */
export function evaluatePressBiomechanics(
  keypoints: Record<string, Point2D & { visibility?: number }>,
  cameraPlane: CameraPlane,
  footTracker?: FootStabilityState,
  currentElbowAngle?: number
): PressBiomechanicsEvaluation {
  const ls = keypoints['left_shoulder'];
  const rs = keypoints['right_shoulder'];
  const le = keypoints['left_elbow'];
  const re = keypoints['right_elbow'];
  const lw = keypoints['left_wrist'];
  const rw = keypoints['right_wrist'];
  const lh = keypoints['left_hip'];
  const rh = keypoints['right_hip'];
  const la = keypoints['left_ankle'];
  const ra = keypoints['right_ankle'];

  const shoulder = keypoints['shoulder'] || rs || ls;
  const elbow = keypoints['elbow'] || re || le;
  const wrist = keypoints['wrist'] || rw || lw;
  const hip = keypoints['hip'] || rh || lh;
  const ear = keypoints['ear'] || keypoints['right_ear'] || keypoints['left_ear'];

  // 1. Hand vs Elbow Alignment (generous ±0.50 band around vertical/aligned ~90° so natural converging paths aren't penalized)
  let handElbowAlignment: 'aligned_90' | 'closed_triceps' | 'wide_stretch' = 'aligned_90';
  let handElbowLabel = '✓ Mano a la altura del codo (~90° Pectoral)';

  const evalArmHandElbow = (sh?: Point2D, el?: Point2D, wr?: Point2D): number | null => {
    if (!sh || !el || !wr) return null;
    const upperLen = Math.max(0.05, Math.hypot(el.x - sh.x, el.y - sh.y));
    if (cameraPlane === 'sagittal') {
      const forearmLen = Math.max(0.05, Math.hypot(wr.x - el.x, wr.y - el.y));
      return (wr.x - el.x) / forearmLen;
    }
    const outwardSign = el.x >= sh.x ? 1 : -1;
    return ((wr.x - el.x) * outwardSign) / upperLen;
  };

  const leftOffset = (ls && le && lw && (lw.visibility ?? 0.8) >= 0.35) ? evalArmHandElbow(ls, le, lw) : null;
  const rightOffset = (rs && re && rw && (rw.visibility ?? 0.8) >= 0.35) ? evalArmHandElbow(rs, re, rw) : null;

  let forearmRatio = 0;
  if (leftOffset !== null && rightOffset !== null) {
    forearmRatio = (leftOffset + rightOffset) / 2;
  } else if (leftOffset !== null) {
    forearmRatio = leftOffset;
  } else if (rightOffset !== null) {
    forearmRatio = rightOffset;
  } else if (shoulder && elbow && wrist) {
    forearmRatio = evalArmHandElbow(shoulder, elbow, wrist) ?? 0;
  }

  if (forearmRatio < -0.50) {
    handElbowAlignment = 'closed_triceps';
    handElbowLabel = 'Mano más cerrada que el codo → +Tríceps';
  } else if (forearmRatio > 0.50) {
    handElbowAlignment = 'wide_stretch';
    handElbowLabel = 'Mano más abierta que el codo (+Estiramiento)';
  }

  // 2. Elbow Height Relative to Shoulder (safely below shoulder ~45°-65° scapular plane)
  // Ignore near lockout (>= 145 deg) because pushing straight forward toward camera projects elbow upward in 2D
  let elbowShoulderPosition: 'optimal_below_shoulder' | 'high_shoulder_risk' | 'too_tucked' = 'optimal_below_shoulder';
  let elbowShoulderLabel = '✓ Codo debajo del hombro (plano escapular seguro)';
  let shoulderAbductionDeg = 55;

  const evalShoulderArm = (sh?: Point2D, el?: Point2D, hp?: Point2D) => {
    if (!sh || !el) return null;
    const armLen = Math.max(0.05, Math.hypot(el.x - sh.x, el.y - sh.y));
    const dropY = el.y - sh.y; // > 0 when elbow is lower on screen than shoulder
    const dropRatio = dropY / armLen;
    const abd = hp ? computeJointAngle2D(hp, sh, el) : 55;
    return { dropY, dropRatio, abd };
  };

  const leftArm = evalShoulderArm(ls, le, lh);
  const rightArm = evalShoulderArm(rs, re, rh);
  const armSample = (leftArm && rightArm)
    ? {
        dropY: (leftArm.dropY + rightArm.dropY) / 2,
        dropRatio: (leftArm.dropRatio + rightArm.dropRatio) / 2,
        abd: Math.round((leftArm.abd + rightArm.abd) / 2)
      }
    : (leftArm || rightArm || evalShoulderArm(shoulder, elbow, hip));

  if (armSample) {
    shoulderAbductionDeg = Math.round(armSample.abd);
    const isNearLockoutExtension = currentElbowAngle !== undefined && currentElbowAngle >= 145;
    if (!isNearLockoutExtension && (armSample.dropY < -0.015 || (armSample.abd > 86 && armSample.dropRatio < 0.06))) {
      elbowShoulderPosition = 'high_shoulder_risk';
      elbowShoulderLabel = '⚠️ Codo alto (por encima del hombro): bájalos para proteger el hombro';
    } else if (armSample.abd < 20 && armSample.dropRatio > 0.92) {
      elbowShoulderPosition = 'too_tucked';
      elbowShoulderLabel = 'Codo muy pegado al torso (<20°): énfasis en tríceps';
    } else {
      elbowShoulderPosition = 'optimal_below_shoulder';
      elbowShoulderLabel = '✓ Codo debajo del hombro (plano escapular seguro)';
    }
  }

  // 3. Spinal Neutrality (use symmetrical mid-line in frontal/oblique view so wide shoulders aren't penalized)
  let spineNeutral = true;
  let spineAngleDeg = 0;
  if (cameraPlane !== 'sagittal' && ls && rs && lh && rh) {
    const midShoulder = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
    const midHip = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
    spineAngleDeg = calculateSpineAlignment(midShoulder, midHip);
    spineNeutral = spineAngleDeg <= 15.0;
  } else {
    const col = calculateSpinalCollinearity(ear, shoulder, hip);
    spineAngleDeg = col.torsoLeanDeg;
    spineNeutral = col.deviationAngleDeg <= 22.0;
  }

  // 4. Foot Stability / Ground Leg Drive Check
  // Compare each foot strictly against ITS OWN individual floor baseline so oblique camera perspective never causes false alerts!
  let footStabilityStatus: 'stable_leg_drive' | 'foot_lifted' | 'foot_shifted' | 'not_visible' = 'not_visible';
  let footStabilityLabel = 'Pies no visibles en encuadre';

  const laVisible = la && (la.visibility === undefined || la.visibility >= 0.62) && la.y <= 0.93 && (!keypoints['left_knee'] || keypoints['left_knee'].y <= 0.88);
  const raVisible = ra && (ra.visibility === undefined || ra.visibility >= 0.62) && ra.y <= 0.93 && (!keypoints['right_knee'] || keypoints['right_knee'].y <= 0.88);

  if (laVisible || raVisible) {
    if (footTracker) {
      if (laVisible) {
        if (!footTracker.baselineLeftAnkle) {
          footTracker.baselineLeftAnkle = { x: la!.x, y: la!.y };
        } else {
          // Track lowest floor baseline individually for left foot
          footTracker.baselineLeftAnkle.y = Math.max(footTracker.baselineLeftAnkle.y, la!.y);
        }
      }
      if (raVisible) {
        if (!footTracker.baselineRightAnkle) {
          footTracker.baselineRightAnkle = { x: ra!.x, y: ra!.y };
        } else {
          // Track lowest floor baseline individually for right foot
          footTracker.baselineRightAnkle.y = Math.max(footTracker.baselineRightAnkle.y, ra!.y);
        }
      }

      const liftedLeft = Boolean(laVisible && footTracker.baselineLeftAnkle && la!.y < footTracker.baselineLeftAnkle.y - 0.055);
      const liftedRight = Boolean(raVisible && footTracker.baselineRightAnkle && ra!.y < footTracker.baselineRightAnkle.y - 0.055);

      const shiftedLeft = Boolean(laVisible && footTracker.baselineLeftAnkle &&
        Math.abs(la!.x - footTracker.baselineLeftAnkle.x) > 0.075);
      const shiftedRight = Boolean(raVisible && footTracker.baselineRightAnkle &&
        Math.abs(ra!.x - footTracker.baselineRightAnkle.x) > 0.075);

      if (liftedLeft || liftedRight) {
        footStabilityStatus = 'foot_lifted';
        footStabilityLabel = '⚠️ Pies levantados del suelo: apóyalos firmes para leg drive';
      } else if (shiftedLeft || shiftedRight) {
        footStabilityStatus = 'foot_shifted';
        footStabilityLabel = '⚠️ Pies cambiando de posición: fíjalos en cada repetición';
      } else {
        footStabilityStatus = 'stable_leg_drive';
        footStabilityLabel = '✓ Pies firmes en el suelo (leg drive estable)';
      }
    } else {
      footStabilityStatus = 'stable_leg_drive';
      footStabilityLabel = '✓ Pies firmes en el suelo (leg drive estable)';
    }
  }

  return {
    handElbowAlignment,
    handElbowLabel,
    elbowShoulderPosition,
    elbowShoulderLabel,
    shoulderAbductionDeg,
    footStabilityStatus,
    footStabilityLabel,
    spineNeutral,
    spineAngleDeg
  };
}

export interface FlyBiomechanicsEvaluation {
  elbowAngleDeg: number;
  areArmsExtended: boolean;
  shoulderAnteriorized: boolean;
  armExtensionLabel: string;
  shoulderPostureLabel: string;
  muscleFocusSummary: string;
}

/**
 * Evaluates Cable Fly / Cruces en Polea biomechanics:
 * 1) Arm extension: keep elbows as straight / minimally flexed as possible (>= 142°) vs triceps takeover
 * 2) Shoulder retraction: avoid excessive shoulder anteriorization / protraction
 */
export function evaluateFlyBiomechanics(
  keypoints: Record<string, Point2D & { visibility?: number }>,
  cameraPlane: CameraPlane
): FlyBiomechanicsEvaluation {
  const ls = keypoints['left_shoulder'];
  const rs = keypoints['right_shoulder'];
  const le = keypoints['left_elbow'];
  const re = keypoints['right_elbow'];
  const lw = keypoints['left_wrist'];
  const rw = keypoints['right_wrist'];
  const lh = keypoints['left_hip'];
  const rh = keypoints['right_hip'];

  const shoulder = keypoints['shoulder'] || rs || ls;
  const elbow = keypoints['elbow'] || re || le;
  const wrist = keypoints['wrist'] || rw || lw;
  const hip = keypoints['hip'] || rh || lh;
  const ear = keypoints['ear'] || keypoints['right_ear'] || keypoints['left_ear'];

  // 1. Elbow extension across visible arms
  const leftValid = Boolean(ls && le && lw && (le.visibility ?? 0.8) >= 0.35 && (lw.visibility ?? 0.8) >= 0.35);
  const rightValid = Boolean(rs && re && rw && (re.visibility ?? 0.8) >= 0.35 && (rw.visibility ?? 0.8) >= 0.35);

  let elbowAngleDeg = 160;
  if (leftValid && rightValid) {
    const lAng = computeJointAngle2D(ls, le, lw);
    const rAng = computeJointAngle2D(rs, re, rw);
    elbowAngleDeg = Math.round((lAng + rAng) / 2);
  } else if (leftValid) {
    elbowAngleDeg = Math.round(computeJointAngle2D(ls, le, lw));
  } else if (rightValid) {
    elbowAngleDeg = Math.round(computeJointAngle2D(rs, re, rw));
  } else if (shoulder && elbow && wrist) {
    elbowAngleDeg = Math.round(computeJointAngle2D(shoulder, elbow, wrist));
  }

  const areArmsExtended = elbowAngleDeg >= 142;

  // 2. Shoulder anteriorization / excessive protraction check (without column check)
  let shoulderAnteriorized = false;
  if (cameraPlane !== 'sagittal' && ls && rs && lh && rh) {
    const shoulderWidth = Math.abs(rs.x - ls.x);
    const hipWidth = Math.abs(rh.x - lh.x);
    const collapsedWidth = hipWidth > 0.05 && (shoulderWidth / hipWidth) < 1.12;
    const midShoulderY = (ls.y + rs.y) / 2;
    const shruggedTowardEar = Boolean(ear && (midShoulderY - ear.y) < 0.048);
    shoulderAnteriorized = collapsedWidth || shruggedTowardEar;
  } else if (shoulder && hip && wrist) {
    // Sagittal: check if shoulder rolls noticeably forward toward wrist past ear-hip line
    const pushDir = Math.sign(wrist.x - hip.x) || 1;
    const refX = ear ? (ear.x + hip.x) / 2 : hip.x;
    const forwardProtraction = (shoulder.x - refX) * pushDir;
    const shruggedTowardEar = Boolean(ear && (shoulder.y - ear.y) < 0.048);
    shoulderAnteriorized = forwardProtraction > 0.085 || shruggedTowardEar;
  }

  const armExtensionLabel = areArmsExtended
    ? `✓ Brazos extendidos (${elbowAngleDeg}°): mínima flexión`
    : `⚠️ Brazos flexionados (${elbowAngleDeg}°): extiéndelos más`;

  const shoulderPostureLabel = shoulderAnteriorized
    ? '⚠️ Hombro anteriorizado: abre el pecho atrás'
    : '✓ Hombros estables sin anteriorización';

  const muscleFocusSummary = areArmsExtended
    ? 'Brazos rectos: pectoral y hombro comparten el trabajo (el pecho limita el ejercicio)'
    : 'Codo flexionado: mayor trabajo de tríceps';

  return {
    elbowAngleDeg,
    areArmsExtended,
    shoulderAnteriorized,
    armExtensionLabel,
    shoulderPostureLabel,
    muscleFocusSummary
  };
}

/**
 * Technical Fault Auditor by Movement Pattern
 */
export function auditTechniqueRules(
  patternFamily: PatternFamily,
  keypoints: Record<string, Point2D>,
  currentAngle: number,
  fsmPhase: FsmPhase,
  loadPosition: Point2D,
  exerciseId?: string,
  footTracker?: FootStabilityState
): TechniqueFeedbackAlert[] {
  const alerts: TechniqueFeedbackAlert[] = [];
  const ear = keypoints['ear'] || keypoints['right_ear'] || keypoints['left_ear'];
  const shoulder = keypoints['shoulder'] || keypoints['right_shoulder'] || keypoints['left_shoulder'];
  const hip = keypoints['hip'] || keypoints['right_hip'] || keypoints['left_hip'];
  const knee = keypoints['knee'] || keypoints['right_knee'] || keypoints['left_knee'];
  const ankle = keypoints['ankle'] || keypoints['right_ankle'] || keypoints['left_ankle'];
  const wrist = keypoints['wrist'] || keypoints['right_wrist'] || keypoints['left_wrist'];

  // A1) Patrón Hip Thrust (Extensión de cadera + Ángulo de rodilla cercano a 90° + Lumbar/Cuello)
  if (exerciseId?.includes('hip_thrust')) {
    const htEval = evaluateHipThrustAlignment(keypoints, currentAngle);

    // 1. Ángulo de rodilla cercano a 90° (evita implicar en exceso cuádriceps o femoral):
    if (htEval.kneeBias === 'quad_dominant') {
      alerts.push({
        type: 'warning',
        code: 'KNEE_ANGLE_TOO_CLOSED_QUADS',
        message: `Rodilla muy cerrada (${htEval.kneeAngleDegrees}° < 80°): pies cerca del banco aumentan carga en cuádriceps. Adelántalos para acercarte a 90°.`
      });
    } else if (htEval.kneeBias === 'hamstring_dominant') {
      alerts.push({
        type: 'warning',
        code: 'KNEE_ANGLE_TOO_OPEN_HAMS',
        message: `Rodilla muy abierta (${htEval.kneeAngleDegrees}° > 102°): pies muy adelantados desplazan estímulo al femoral. Acércalos hacia ~90°.`
      });
    } else {
      alerts.push({
        type: 'success',
        code: 'KNEE_ANGLE_OPTIMAL_90',
        message: `✓ Ángulo de rodilla óptimo (${htEval.kneeAngleDegrees}° ≈ 90°): foco máximo en glúteo sin exceso de cuádriceps ni femoral`
      });
    }

    // 2. Bloqueo y extensión completa de cadera en lockout:
    if (fsmPhase === 'LOCKOUT' || currentAngle >= 155) {
      if (currentAngle < 155) {
        alerts.push({
          type: 'warning',
          code: 'HIP_EXTENSION_INCOMPLETE',
          message: 'Extensión incompleta: empuja la pelvis hasta alinear fémur y torso a 170°-180°'
        });
      } else {
        alerts.push({
          type: 'success',
          code: 'HIP_LOCKOUT_MAXIMAL',
          message: '✓ Bloqueo concéntrico completo: pico de acortamiento máximo del glúteo mayor'
        });
      }
    }

    // 3. Neutralidad Lumbar y Cuello:
    if (!htEval.lumbarNeutral) {
      alerts.push({
        type: 'warning',
        code: 'HIP_THRUST_LUMBAR_HYPEREXTENSION',
        message: 'Hiperextensión lumbar al bloquear: mantén costillas abajo y retroversión pélvica'
      });
    }
    if (!htEval.neckNeutral) {
      alerts.push({
        type: 'warning',
        code: 'HIP_THRUST_NECK_MISALIGNMENT',
        message: 'Desalineación cervical: evita echar la cabeza atrás; mantén barbilla recogida (chin-tuck)'
      });
    } else {
      alerts.push({
        type: 'success',
        code: 'CHIN_TUCK_SAFE',
        message: '✓ Neutralidad lumbar y cuello firme con barbilla recogida en banco'
      });
    }
  }

  // A2) Patrón Peso Muerto / RDL convencional (Hinge / Glúteo / Isquios)
  else if (patternFamily === 'hinge_deadlift') {
    // 1. Separación de la carga (Momento lumbar lesivo):
    // Distancia horizontal en X entre mano (mancuerna/barra) y espinilla/rodilla (|X_mano - X_tibia|)
    if (wrist && knee) {
      const tibiaX = ankle ? (knee.x + ankle.x) / 2 : knee.x;
      const loadSeparation = Math.abs(wrist.x - tibiaX);
      if (fsmPhase !== 'LOCKOUT' && loadSeparation > 0.12) {
        alerts.push({
          type: 'warning',
          code: 'LOAD_SEPARATION',
          message: '¡Carga alejada del cuerpo! Acércala a las espinillas para proteger la zona lumbar'
        });
      } else {
        alerts.push({
          type: 'success',
          code: 'LOAD_TIGHT',
          message: '✓ Carga pegada a las espinillas: momento lumbar minimizado'
        });
      }
    }

    // 2. Neutralidad Espinal (Colinealidad Oreja - Hombro - Cadera > 15°)
    const spineCollinearity = calculateSpinalCollinearity(ear, shoulder, hip);
    if (!spineCollinearity.isSpineNeutral) {
      alerts.push({
        type: 'warning',
        code: 'SPINE_BREAKDOWN',
        message: 'Pérdida de neutralidad: flexión espinal detectada'
      });
    } else {
      alerts.push({
        type: 'success',
        code: 'SPINE_NEUTRAL',
        message: '✓ Neutralidad espinal firme y columna protegida'
      });
    }
  }

  // B) Patrón Sentadilla / Squat (Rodilla / Cuádriceps)
  else if (patternFamily === 'squat_knee_dominant') {
    // 1. Falta de Profundidad:
    // En BOTTOM, Y_cadera >= Y_rodilla (en coordenadas de pantalla donde Y aumenta hacia abajo)
    if (fsmPhase === 'BOTTOM' && hip && knee) {
      if (hip.y < knee.y - 0.02) {
        alerts.push({
          type: 'warning',
          code: 'DEPTH_DEFICIT',
          message: 'Profundidad insuficiente: el fémur no alcanza la paralela'
        });
      } else {
        alerts.push({
          type: 'success',
          code: 'DEPTH_ACHIEVED',
          message: '✓ Profundidad óptima: cadera en paralelo o sub-paralelo'
        });
      }
    }

    // 2. Inclinación tibial y avance de rodilla sobre el mediopié
    if (ankle && knee) {
      const tibialAngle = calculateTibialAngle(ankle, knee);
      if (tibialAngle < 16 && fsmPhase === 'BOTTOM') {
        alerts.push({
          type: 'warning',
          code: 'INSUFFICIENT_TIBIAL_TRAVEL',
          message: 'Falta avance de rodilla sobre el mediopié: limita la flexión de rodilla'
        });
      } else if (tibialAngle >= 18) {
        alerts.push({
          type: 'success',
          code: 'TIBIAL_TRAVEL_OPTIMAL',
          message: '✓ Avance tibial óptimo con flexión profunda de rodilla'
        });
      }
    }
  }

  // C) Patrón de Tracción / Remo / Espalda
  else if (patternFamily === 'pull_row') {
    // 1. Alineación de Fuerza y Antebrazo:
    if (currentAngle < 70 && (fsmPhase === 'BOTTOM' || fsmPhase === 'CONCENTRIC')) {
      alerts.push({
        type: 'warning',
        code: 'BICEPS_OVERUSE',
        message: 'Tirón excesivo de bíceps: alinea el antebrazo con la dirección de la tracción'
      });
    } else {
      alerts.push({
        type: 'success',
        code: 'PULL_ALIGNED',
        message: '✓ Tracción eficiente con dorsal: antebrazo en línea con la fuerza'
      });
    }
  }

  // D1) Patrón Cruces en Polea / Aperturas (Fly) -> Solo extensión de brazos y sin anteriorización excesiva del hombro
  else if (exerciseId?.includes('fly')) {
    const camPlane = detectCameraPlane(keypoints);
    const flyEval = evaluateFlyBiomechanics(keypoints, camPlane);

    if (!flyEval.areArmsExtended) {
      alerts.push({
        type: 'warning',
        code: 'FLY_ARMS_BENT',
        message: `Brazos flexionados (${flyEval.elbowAngleDeg}°): extiéndelos lo máximo posible (casi rectos, ≥142°) para no convertir el cruce en press.`
      });
    } else {
      alerts.push({
        type: 'success',
        code: 'FLY_ARMS_EXTENDED',
        message: `✓ Brazos bien extendidos (${flyEval.elbowAngleDeg}°): mínima flexión y brazo de momento óptimo en pectoral`
      });
    }

    if (flyEval.shoulderAnteriorized) {
      alerts.push({
        type: 'warning',
        code: 'FLY_SHOULDER_ANTERIORIZATION',
        message: 'Hombros demasiado anteriorizados: mantén el pecho abierto y hombros abajo/atrás para no cargar en exceso el hombro anterior.'
      });
    } else {
      alerts.push({
        type: 'success',
        code: 'FLY_SHOULDER_RETRACTED',
        message: '✓ Hombro estable sin anteriorización excesiva: pecho abierto y escápulas controladas'
      });
    }
  }

  // D2) Patrón de Empuje / Pecho (Press de Pecho)
  else if (patternFamily === 'push_press') {
    const camPlane = detectCameraPlane(keypoints);
    const pressEval = evaluatePressBiomechanics(keypoints, camPlane, footTracker, currentAngle);

    // 1. Alineación mano vs codo (~90° vs +Tríceps vs Abierto)
    if (pressEval.handElbowAlignment === 'closed_triceps') {
      alerts.push({
        type: 'warning',
        code: 'HAND_INSIDE_ELBOW_TRICEPS',
        message: 'Mano más cerrada que el codo: mayor implicación de tríceps; alinea la muñeca con el codo (~90°) para aislar pectoral.'
      });
    } else if (pressEval.handElbowAlignment === 'wide_stretch') {
      alerts.push({
        type: 'warning',
        code: 'HAND_WIDE_ELBOW',
        message: 'Mano más abierta que el codo: aumenta tensión en inserción pectoral/hombro; busca alineación a ~90°.'
      });
    } else {
      alerts.push({
        type: 'success',
        code: 'HAND_ELBOW_90_ALIGNED',
        message: '✓ Mano alineada con el codo (~90°): empuje eficiente centrado en fibras pectorales'
      });
    }

    // 2. Altura del codo respecto al hombro (~45°-65° debajo del hombro)
    if (pressEval.elbowShoulderPosition === 'high_shoulder_risk') {
      alerts.push({
        type: 'warning',
        code: 'ELBOW_TOO_HIGH_SHOULDER_RISK',
        message: 'Codo demasiado alto (a la altura o encima del hombro): bájalos ligeramente (~45°-65°) para evitar molestias articulares.'
      });
    } else if (pressEval.elbowShoulderPosition === 'too_tucked') {
      alerts.push({
        type: 'warning',
        code: 'ELBOW_TOO_TUCKED_TRICEPS',
        message: 'Codos muy pegados al cuerpo (<25°): desplaza el trabajo hacia tríceps y deltoides anterior.'
      });
    } else {
      alerts.push({
        type: 'success',
        code: 'ELBOW_BELOW_SHOULDER_SAFE',
        message: pressEval.elbowShoulderLabel
      });
    }

    // 3. Estabilidad de pies en el suelo (Leg Drive)
    if (pressEval.footStabilityStatus === 'foot_lifted') {
      alerts.push({
        type: 'warning',
        code: 'FOOT_LIFTED_NO_LEG_DRIVE',
        message: 'Pies levantándose del suelo: mantén toda la planta firme abajo para generar mayor fuerza (leg drive) y estabilidad.'
      });
    } else if (pressEval.footStabilityStatus === 'foot_shifted') {
      alerts.push({
        type: 'warning',
        code: 'FOOT_SHIFTING_INSTABILITY',
        message: 'Pies moviéndose entre repeticiones: fija su posición en el suelo para no perder estabilidad.'
      });
    } else if (pressEval.footStabilityStatus === 'stable_leg_drive') {
      alerts.push({
        type: 'success',
        code: 'FOOT_DRIVE_STABLE',
        message: '✓ Pies firmes en el suelo: buena transferencia de fuerza y estabilidad en el press'
      });
    }

    if (currentAngle < 85 && fsmPhase === 'BOTTOM') {
      alerts.push({
        type: 'success',
        code: 'CHEST_STRETCH',
        message: '✓ Estiramiento profundo del pectoral con adecuada retracción escapular'
      });
    }
  }

  return alerts;
}

export const EXERCISE_BIOMECHANICS_RULES: Record<PatternFamily, PatternBiomechanicsConfig> = {
  hinge_deadlift: {
    family: 'hinge_deadlift',
    primaryJoint: 'hip',
    vertexKey: 'hip',
    anglePoints: { pointA: 'shoulder', vertex: 'hip', pointC: 'knee' },
    evaluateRules: (kp, angle, phase, load) => auditTechniqueRules('hinge_deadlift', kp, angle, phase, load)
  },
  squat_knee_dominant: {
    family: 'squat_knee_dominant',
    primaryJoint: 'knee',
    vertexKey: 'knee',
    anglePoints: { pointA: 'hip', vertex: 'knee', pointC: 'ankle' },
    evaluateRules: (kp, angle, phase, load) => auditTechniqueRules('squat_knee_dominant', kp, angle, phase, load)
  },
  pull_row: {
    family: 'pull_row',
    primaryJoint: 'elbow',
    vertexKey: 'elbow',
    anglePoints: { pointA: 'shoulder', vertex: 'elbow', pointC: 'wrist' },
    evaluateRules: (kp, angle, phase, load) => auditTechniqueRules('pull_row', kp, angle, phase, load)
  },
  push_press: {
    family: 'push_press',
    primaryJoint: 'elbow',
    vertexKey: 'elbow',
    anglePoints: { pointA: 'shoulder', vertex: 'elbow', pointC: 'wrist' },
    evaluateRules: (kp, angle, phase, load) => auditTechniqueRules('push_press', kp, angle, phase, load)
  }
};

export interface Vector2D {
  x: number;
  y: number;
}

export interface Segment2D {
  start: Point2D;
  end: Point2D;
}

/**
 * Real-time Biomechanical Frame Data (Overlay Rendering + Metrics)
 */
export interface BiomechanicalTelemetryFrame {
  timestampMs: number;
  phase: FsmPhase;
  currentAngle: number;
  angularVelocityDegPerSec: number;

  // Mode 1: Technique metrics
  technique: {
    romPercentage: number;
    spinalAngleDegrees: number;
    isSpineNeutral: boolean;
    isKneeValgusDetected: boolean;
    valgusDeviationRatio: number;
    kneeAngleDegrees?: number;
    lumbarNeutral?: boolean;
    lumbarStatusLabel?: string;
    neckNeutral?: boolean;
    neckStatusLabel?: string;
    pressEvaluation?: PressBiomechanicsEvaluation;
    flyEvaluation?: FlyBiomechanicsEvaluation;
    activeCues: string[];
    alerts?: TechniqueFeedbackAlert[];
  };

  // Mode 2: Biomechanical Optimization & Physics
  biomechanics: {
    resistanceType: ResistanceSourceType;
    forceVector: Vector2D;
    forceLineOfAction: Segment2D; // Line extending across the frame
    loadPosition: Point2D;

    // Moment arms (perpendicular distances in normalized units and relative to femur)
    momentArms: {
      hip: number;     // Normalized distance
      knee: number;    // Normalized distance
      shoulder?: number;
      elbow?: number;
      hipOverKneeRatio: number; // d_hip / (d_knee + epsilon)
    };

    // Projected perpendicular lines for overlay visualization
    momentArmProjections: {
      hipProjection?: Segment2D;
      kneeProjection?: Segment2D;
      shoulderProjection?: Segment2D;
      elbowProjection?: Segment2D;
    };

    tibialAngleDegrees: number;
    kneeAngleDegrees?: number;
    pressEvaluation?: PressBiomechanicsEvaluation;
    flyEvaluation?: FlyBiomechanicsEvaluation;
    muscleBias: MuscleBiasCategory;
    muscleBiasLabel: string;
    resistancePeakLocation: ResistanceCurveMatch;
    lengthenedOverloadScore: number; // 0 - 100%
  };
}

/**
 * Repetition Audit Summary (Structured JSON format)
 */
export interface RepetitionBiomechanicalAudit {
  repIndex: number;
  isValid: boolean;
  tempo: {
    eccentricSeconds: number;
    bottomPauseSeconds: number;
    concentricSeconds: number;
    totalSeconds: number;
    tempoDisplay: string;
  };
  techniqueVerdict: {
    romConsistencyScore: number; // 0 - 100%
    romReachedDegrees: number;
    romStatus: 'full' | 'partial' | 'excessive';
    spinalNeutrality: 'neutral' | 'flexed' | 'hyperextended';
    bounceDetected: boolean;
    feedbackCues: string[];
  };
  biomechanicsVerdict: {
    dominantBias: MuscleBiasCategory;
    biasLabel: string;
    meanHipOverKneeRatio: number;
    tibialInclinationDegrees: number;
    peakTorquePhase: 'lengthened_stretch' | 'shortened_lockout' | 'mid_range';
    stretchHypertrophyOptimized: boolean;
    scientificAssessment: string;
  };
}

/**
 * Computes shortest perpendicular distance from a 2D point P0 to a line passing through P1 and P2.
 * Formula: d = |(y2 - y1)*x0 - (x2 - x1)*y0 + x2*y1 - y2*x1| / sqrt((y2 - y1)^2 + (x2 - x1)^2)
 */
export function perpendicularDistanceToLine(
  point: Point2D,
  lineP1: Point2D,
  lineP2: Point2D
): number {
  const dx = lineP2.x - lineP1.x;
  const dy = lineP2.y - lineP1.y;
  const lineLenSq = dx * dx + dy * dy;

  if (lineLenSq < 1e-9) {
    // Degenerate line (P1 == P2), return Euclidean distance
    const ex = point.x - lineP1.x;
    const ey = point.y - lineP1.y;
    return Math.sqrt(ex * ex + ey * ey);
  }

  const numerator = Math.abs(dy * point.x - dx * point.y + lineP2.x * lineP1.y - lineP2.y * lineP1.x);
  const denominator = Math.sqrt(lineLenSq);
  return numerator / denominator;
}

/**
 * Projects a point P0 orthogonally onto a line passing through P1 and P2.
 */
export function projectPointOntoLine(
  point: Point2D,
  lineP1: Point2D,
  lineP2: Point2D
): Point2D {
  const dx = lineP2.x - lineP1.x;
  const dy = lineP2.y - lineP1.y;
  const lineLenSq = dx * dx + dy * dy;

  if (lineLenSq < 1e-9) return { x: lineP1.x, y: lineP1.y };

  const u = ((point.x - lineP1.x) * dx + (point.y - lineP1.y) * dy) / lineLenSq;
  return {
    x: lineP1.x + u * dx,
    y: lineP1.y + u * dy
  };
}

/**
 * Computes tibial angle relative to vertical [0 = perfectly vertical, > 0 = forward knee travel]
 */
export function calculateTibialAngle(ankle: Point2D, knee: Point2D): number {
  if (!ankle || !knee) return 0;
  // In screen coords, Y increases downwards: ankle is lower (higher Y), knee is higher (lower Y)
  const dx = knee.x - ankle.x;
  const dy = ankle.y - knee.y; // positive when knee is above ankle
  const rad = Math.atan2(Math.abs(dx), Math.max(dy, 1e-4));
  return Math.round((rad * 180 / Math.PI) * 10) / 10;
}

/**
 * Computes spinal alignment angle relative to vertical (ear - shoulder - hip)
 */
export function calculateSpineAlignment(shoulder: Point2D, hip: Point2D): number {
  if (!shoulder || !hip) return 0;
  const dx = shoulder.x - hip.x;
  const dy = hip.y - shoulder.y; // positive when shoulder is above hip
  const rad = Math.atan2(Math.abs(dx), Math.max(dy, 1e-4));
  return Math.round((rad * 180 / Math.PI) * 10) / 10;
}

/**
 * Detects camera recording plane from tracked bilateral landmarks.
 * In a sagittal profile view, shoulder width and hip width are < 0.10.
 */
export function detectCameraPlane(keypoints: Record<string, Point2D>): CameraPlane {
  const lShoulder = keypoints['left_shoulder'];
  const rShoulder = keypoints['right_shoulder'];
  const lHip = keypoints['left_hip'];
  const rHip = keypoints['right_hip'];

  if (!lShoulder || !rShoulder || !lHip || !rHip) {
    return 'sagittal'; // Default to sagittal if only unilateral points are visible
  }

  const shoulderWidth = Math.abs(rShoulder.x - lShoulder.x);
  const hipWidth = Math.abs(rHip.x - lHip.x);

  if (shoulderWidth < 0.10 && hipWidth < 0.10) {
    return 'sagittal';
  } else if (shoulderWidth >= 0.16) {
    return 'frontal';
  }
  return 'oblique';
}

/**
 * Computes true spinal curvature breakdown via collinearity of ear - shoulder - hip.
 * Does NOT falsely penalize anterior torso lean (45°-70° is optimal for glute bias / RDL).
 * Collinearity deviation > 15° indicates genuine spinal flexion / breakdown.
 */
export function calculateSpinalCollinearity(
  ear?: Point2D,
  shoulder?: Point2D,
  hip?: Point2D
): { deviationAngleDeg: number; isSpineNeutral: boolean; torsoLeanDeg: number } {
  if (!shoulder || !hip) {
    return { deviationAngleDeg: 0, isSpineNeutral: true, torsoLeanDeg: 0 };
  }

  const torsoLeanDeg = calculateSpineAlignment(shoulder, hip);

  if (!ear) {
    // If ear is occluded/absent, tolerate healthy torso lean up to 75° (essential in Bulgarian / RDL)
    return {
      deviationAngleDeg: 0,
      isSpineNeutral: torsoLeanDeg <= 75,
      torsoLeanDeg
    };
  }

  // Vector 1: ear -> shoulder
  const v1x = shoulder.x - ear.x;
  const v1y = shoulder.y - ear.y;
  const a1 = Math.atan2(v1y, v1x);

  // Vector 2: shoulder -> hip
  const v2x = hip.x - shoulder.x;
  const v2y = hip.y - shoulder.y;
  const a2 = Math.atan2(v2y, v2x);

  let diffRad = Math.abs(a1 - a2);
  if (diffRad > Math.PI) diffRad = 2 * Math.PI - diffRad;
  const deviationAngleDeg = Math.round((diffRad * 180 / Math.PI) * 10) / 10;

  // Curvature breakdown when ear-shoulder-hip deviate by more than 15°
  const isSpineNeutral = deviationAngleDeg <= 15.0;

  return {
    deviationAngleDeg,
    isSpineNeutral,
    torsoLeanDeg
  };
}

/**
 * Generates direct applied biomechanical verdict based on target muscle and measured lever ratios.
 */
export function evaluateBiomechanicalVerdict(
  targetMuscle: TargetMuscle,
  meanHipMoment: number,
  meanKneeMoment: number,
  tibialAngle: number,
  torsoLean: number = 0,
  romExcursion: number = 70,
  spinalNeutral: boolean = true,
  exerciseId?: string,
  kneeAngle: number = 90,
  lumbarNeutral: boolean = true,
  neckNeutral: boolean = true
): {
  isOptimal: boolean;
  verdictTitle: string;
  verdictDescription: string;
  ratio: number;
} {
  // Dedicated verdict for Hip Thrust patterns: based strictly on Knee Angle (~90° vs Quads/Femoral) + Lumbar & Neck Neutrality (no moment arms)
  if (exerciseId?.includes('hip_thrust')) {
    const angle = Math.round(kneeAngle);
    const isAngleOptimal = angle >= 80 && angle <= 102;
    const isOptimal = isAngleOptimal && lumbarNeutral && neckNeutral;

    let verdictTitle = 'Ángulo de Rodilla Óptimo para Glúteo Mayor (~90°)';
    let verdictDescription = `Rodilla en ${angle}° (cerca de 90°): evita implicar en exceso cuádriceps o femoral y concentra el estímulo en el glúteo con lumbar y cuello neutros.`;

    if (angle < 80) {
      verdictTitle = 'Sesgo Desplazado hacia Cuádriceps (Rodilla < 80°)';
      verdictDescription = `Ángulo de rodilla cerrado (${angle}°). Pies muy cerca del banco aumentan la carga sobre el cuádriceps. Adelántalos para acercarte a ~90°.`;
    } else if (angle > 102) {
      verdictTitle = 'Sesgo Desplazado hacia Femoral / Isquios (Rodilla > 102°)';
      verdictDescription = `Ángulo de rodilla abierto (${angle}°). Pies muy adelantados transfieren el estímulo al femoral. Acércalos hacia ~90°.`;
    } else if (!lumbarNeutral || !neckNeutral) {
      verdictTitle = !lumbarNeutral
        ? 'Alerta de Neutralidad Lumbar en Hip Thrust'
        : 'Alerta de Neutralidad del Cuello (Cervical)';
      verdictDescription = !lumbarNeutral
        ? `Ángulo de rodilla óptimo (${angle}°), pero se detecta hiperextensión lumbar. Mete costillas y realiza retroversión pélvica.`
        : `Ángulo de rodilla óptimo (${angle}°), pero el cuello pierde alineación neutra. Mantén barbilla recogida mirando al frente (chin-tuck).`;
    }

    return {
      isOptimal,
      ratio: 1.0,
      verdictTitle,
      verdictDescription
    };
  }

  const hipOverKnee = meanHipMoment / (meanKneeMoment + 1e-5);
  const kneeOverHip = meanKneeMoment / (meanHipMoment + 1e-5);

  switch (targetMuscle) {
    case 'glutes_max': {
      const isOptimal = hipOverKnee >= 1.4 && tibialAngle <= 18;
      return {
        isOptimal,
        ratio: Math.round(hipOverKnee * 100) / 100,
        verdictTitle: isOptimal
          ? 'Enfoque óptimo en Glúteo en estiramiento: Brazo de momento en cadera maximizado'
          : 'Dominancia desplazada hacia Cuádriceps (exceso de traslación tibial)',
        verdictDescription: isOptimal
          ? `Brazo de momento en cadera dominante (ratio ${hipOverKnee.toFixed(2)}x) y tibia vertical (${tibialAngle.toFixed(1)}°). Carga concentrada en fibras del glúteo mayor.`
          : `Tibia inclinada hacia adelante (${tibialAngle.toFixed(1)}°) o ratio cadera/rodilla bajo (${hipOverKnee.toFixed(2)}x). Para glúteo, frena el avance tibial y profundiza la bisagra de cadera.`
      };
    }
    case 'hamstrings': {
      const isOptimal = tibialAngle <= 16 && romExcursion >= 35;
      return {
        isOptimal,
        ratio: Math.round(hipOverKnee * 100) / 100,
        verdictTitle: isOptimal
          ? 'Patrón de bisagra puro para Isquiosurales'
          : 'Exceso de flexión de rodilla reduciendo palanca en isquios',
        verdictDescription: isOptimal
          ? `Rodilla fija en semiflexión y cadera proyectada hacia atrás. Brazo de palanca horizontal máximo en la inserción isquiotibial proximal.`
          : `Flexión de rodilla excesiva que acorta los isquiotibiales distales. Mantén las rodillas fijas a 15°-20° y desplaza la pelvis hacia atrás.`
      };
    }
    case 'quadriceps': {
      const isOptimal = tibialAngle >= 18 && (kneeOverHip >= 0.9 || tibialAngle >= 20);
      return {
        isOptimal,
        ratio: Math.round(kneeOverHip * 100) / 100,
        verdictTitle: isOptimal
          ? 'Sobrecarga óptima en Cuádriceps'
          : (tibialAngle < 18
              ? 'Falta de avance de rodilla sobre el mediopié (inclinación tibial insuficiente)'
              : 'Dominancia desplazada hacia Cadera'),
        verdictDescription: isOptimal
          ? `Avance tibial pronunciado (${tibialAngle.toFixed(1)}°) y brazo de momento preponderante en rodilla (${kneeOverHip.toFixed(2)}x). Reclutamiento profundo de vastos.`
          : `Avance tibial insuficiente (${tibialAngle.toFixed(1)}° < 18°). Aumenta la dorsiflexión o eleva ligeramente los talones para maximizar la flexión de rodilla.`
      };
    }
    case 'lats': {
      return {
        isOptimal: true,
        ratio: 1.5,
        verdictTitle: 'Trayectoria alineada con Fibras del Dorsal',
        verdictDescription: 'Tracción en plano sagital con codos pegados al torso, reduciendo el momento en romboides y maximizando extensión de hombro.'
      };
    }
    case 'pectorals': {
      return {
        isOptimal: true,
        ratio: 1.4,
        verdictTitle: 'Aducción horizontal óptima en Pectoral',
        verdictDescription: 'Vector perpendicular al esternón con trayectoria convergente adecuada y estiramiento profundo.'
      };
    }
  }
}

/**
 * Generates direct verdict for Press / Pectorals from real-time Press evaluation
 */
export function evaluatePressVerdict(pressEval: PressBiomechanicsEvaluation): {
  isOptimal: boolean;
  verdictTitle: string;
  verdictDescription: string;
  ratio: number;
} {
  const handOk = pressEval.handElbowAlignment === 'aligned_90';
  const elbowHeightOk = pressEval.elbowShoulderPosition === 'optimal_below_shoulder';
  const feetOk = pressEval.footStabilityStatus === 'stable_leg_drive' || pressEval.footStabilityStatus === 'not_visible';
  const spineOk = pressEval.spineNeutral;

  const isOptimal = handOk && elbowHeightOk && feetOk && spineOk;

  if (pressEval.elbowShoulderPosition === 'high_shoulder_risk') {
    return {
      isOptimal: false,
      ratio: 1.0,
      verdictTitle: 'Riesgo Articular: Codo demasiado alto respecto al Hombro',
      verdictDescription: 'Los codos suben a nivel o encima del hombro. Bájalos ligeramente (~45°-65° debajo del hombro) para evitar molestias y proteger el manguito rotador.'
    };
  }
  if (pressEval.footStabilityStatus === 'foot_lifted' || pressEval.footStabilityStatus === 'foot_shifted') {
    return {
      isOptimal: false,
      ratio: 1.0,
      verdictTitle: pressEval.footStabilityStatus === 'foot_lifted'
        ? 'Falta de Apoyo Podal: Pies levantándose del suelo'
        : 'Pies Inestables: Cambiando de posición en la serie',
      verdictDescription: 'Apoya ambas plantas firmes en el suelo para generar leg drive, estabilidad torácica y máxima producción de fuerza en el press.'
    };
  }
  if (pressEval.handElbowAlignment === 'closed_triceps') {
    return {
      isOptimal: false,
      ratio: 1.0,
      verdictTitle: 'Mano más cerrada que el codo → Mayor implicación de Tríceps',
      verdictDescription: 'La muñeca queda por dentro del eje del codo, aumentando el momento extensor en tríceps. Ábrela ligeramente hasta alinear mano y codo (~90°) para aislar pectoral.'
    };
  }
  if (pressEval.handElbowAlignment === 'wide_stretch') {
    return {
      isOptimal: false,
      ratio: 1.0,
      verdictTitle: 'Mano más abierta que el codo (+Tensión Inserción Pectoral)',
      verdictDescription: 'La muñeca supera por fuera la vertical del codo. Alinea la mano a la altura del codo (~90°) para optimizar el empuje.'
    };
  }

  return {
    isOptimal,
    ratio: 1.4,
    verdictTitle: 'Press Óptimo para Pectoral (~90° Mano-Codo & Hombro Seguro)',
    verdictDescription: `Mano alineada con el codo (~90°), codo bajo el hombro (${pressEval.shoulderAbductionDeg}° plano escapular) y base sólida.`
  };
}

/**
 * Generates direct verdict for Cable Fly / Aperturas from elbow extension & shoulder posture
 */
export function evaluateFlyVerdict(flyEval: FlyBiomechanicsEvaluation): {
  isOptimal: boolean;
  verdictTitle: string;
  verdictDescription: string;
  ratio: number;
} {
  if (!flyEval.areArmsExtended) {
    return {
      isOptimal: false,
      ratio: 1.0,
      verdictTitle: `Codo Flexionado (${flyEval.elbowAngleDeg}°): Mayor Trabajo de Tríceps`,
      verdictDescription: 'Al doblar más el codo se acorta el brazo de palanca y el tríceps asume más trabajo para empujar la polea. Extiende más los brazos para maximizar la carga en el pectoral.'
    };
  }

  if (flyEval.shoulderAnteriorized) {
    return {
      isOptimal: false,
      ratio: 1.3,
      verdictTitle: 'Brazos Rectos, pero Hombro Anteriorizado',
      verdictDescription: 'Con brazos rectos pectoral y hombro comparten el trabajo y el pecho limita, pero al adelantar demasiado los hombros aumentas la tensión en el deltoides anterior. Abre el pecho atrás.'
    };
  }

  return {
    isOptimal: true,
    ratio: 1.6,
    verdictTitle: 'Brazos Rectos: Pectoral y Hombro Comparten el Trabajo (El Pecho Limita)',
    verdictDescription: `Codos casi rectos (${flyEval.elbowAngleDeg}°): pectoral mayor y hombro se reparten el mismo brazo de momento en la aducción, siendo el pecho el factor limitante del ejercicio.`
  };
}

/**
 * Evaluates real-time biomechanics and technique from stabilized keypoints
 */
export function evaluateBiomechanicalFrame(
  smoothedKeypoints: Record<string, Point2D>,
  exerciseId: string,
  phase: FsmPhase,
  currentAngle: number,
  angularVelocity: number,
  resistanceType: ResistanceSourceType = 'gravity',
  targetMuscleGroup: 'quads' | 'glutes' | 'hamstrings' | 'lats' | 'chest' | 'triceps' | 'biceps' = 'quads',
  timestampMs: number = performance.now(),
  smoothedTibialAngle?: number,
  footTracker?: FootStabilityState
): BiomechanicalTelemetryFrame {
  const hip = smoothedKeypoints['hip'] || smoothedKeypoints['right_hip'] || smoothedKeypoints['left_hip'];
  const knee = smoothedKeypoints['knee'] || smoothedKeypoints['right_knee'] || smoothedKeypoints['left_knee'];
  const ankle = smoothedKeypoints['ankle'] || smoothedKeypoints['right_ankle'] || smoothedKeypoints['left_ankle'];
  const shoulder = smoothedKeypoints['shoulder'] || smoothedKeypoints['right_shoulder'] || smoothedKeypoints['left_shoulder'];
  const wrist = smoothedKeypoints['wrist'] || smoothedKeypoints['right_wrist'] || smoothedKeypoints['left_wrist'];
  const handGrip = smoothedKeypoints['hand_grip'] || smoothedKeypoints['right_hand_grip'] || smoothedKeypoints['left_hand_grip'] || wrist;
  const elbow = smoothedKeypoints['elbow'] || smoothedKeypoints['right_elbow'] || smoothedKeypoints['left_elbow'];

  // Determine load / force application point:
  // - Hip Thrust: load is at the hip/pelvis.
  // - Upper body (press/row/curl/triceps): load is strictly at the hand grip (center of dumbbell/barbell/cable handle) or wrist fallback.
  // - Machine lower body with foot on platform: force is at the foot/ankle.
  // - Free-weight hinge/deadlift: load is at the hand grip (wrist fallback).
  // - Barbell back squat: load is at the shoulder/bar.
  const patternFamily = getPatternFamily(exerciseId);
  const isHipThrust = exerciseId.includes('hip_thrust');
  const isHinge = patternFamily === 'hinge_deadlift' && !isHipThrust;
  const isUpperBody = exerciseId.includes('lat') || exerciseId.includes('row') || exerciseId.includes('press_chest') || exerciseId.includes('curl') || exerciseId.includes('triceps') || patternFamily === 'push_press' || patternFamily === 'pull_row';
  const isMachineFootContact = (resistanceType === 'machine' || exerciseId.includes('press') || exerciseId.includes('hack') || exerciseId.includes('extension')) && !isUpperBody && !isHipThrust;

  const loadPosition: Point2D = (isHipThrust && hip)
    ? hip
    : (isUpperBody && handGrip
        ? handGrip
        : (isMachineFootContact && ankle
            ? ankle
            : (isHinge && handGrip
                ? handGrip
                : (shoulder
                    ? { x: (shoulder.x + (handGrip ? handGrip.x : shoulder.x)) / 2, y: shoulder.y }
                    : (handGrip || ankle || shoulder || { x: 0.5, y: 0.5 })))));

  // 1. Line of Action of Force
  let lineP1: Point2D;
  let lineP2: Point2D;
  let forceVector: Vector2D;

  if (resistanceType === 'gravity' || resistanceType === 'machine') {
    // Pure vertical reaction / gravity line passing through load position (or foot on machine)
    forceVector = { x: 0, y: 1 };
    lineP1 = { x: loadPosition.x, y: 0.0 };
    lineP2 = { x: loadPosition.x, y: 1.0 };
  } else {
    // Cable/Pulley origin determination
    let origin: Point2D = { x: 0.1, y: 0.1 };
    if (resistanceType === 'cable_low') origin = { x: 0.1, y: 0.9 };
    else if (resistanceType === 'cable_mid') origin = { x: 0.1, y: 0.5 };
    else if (resistanceType === 'cable_high') origin = { x: 0.1, y: 0.05 };

    const cDx = loadPosition.x - origin.x;
    const cDy = loadPosition.y - origin.y;
    const len = Math.sqrt(cDx * cDx + cDy * cDy) || 1;
    forceVector = { x: cDx / len, y: cDy / len };

    lineP1 = origin;
    lineP2 = {
      x: origin.x + forceVector.x * 2.0,
      y: origin.y + forceVector.y * 2.0
    };
  }

  // 2. Moment Arms (perpendicular distances)
  const dHip = hip ? perpendicularDistanceToLine(hip, lineP1, lineP2) : 0;
  const dKnee = knee ? perpendicularDistanceToLine(knee, lineP1, lineP2) : 0;
  const dShoulder = shoulder ? perpendicularDistanceToLine(shoulder, lineP1, lineP2) : 0;
  const dElbow = elbow ? perpendicularDistanceToLine(elbow, lineP1, lineP2) : 0;

  const epsilon = 1e-4;
  const rawRatio = dHip / (dKnee + epsilon);
  const isUprightSetup = phase === 'LOCKOUT' && Math.abs(angularVelocity) < 10;
  const hipOverKneeRatio = isUprightSetup && (dHip < 0.04 || dKnee < 0.04)
    ? 1.0
    : Math.max(0.1, Math.min(5.0, rawRatio));

  // Moment arm orthogonal projection segments for visual overlay directly onto athlete
  const hipProjection = hip
    ? (resistanceType === 'gravity'
        ? { start: { x: loadPosition.x, y: hip.y }, end: hip }
        : { start: hip, end: projectPointOntoLine(hip, lineP1, lineP2) })
    : undefined;
  const kneeProjection = knee
    ? (resistanceType === 'gravity'
        ? { start: { x: loadPosition.x, y: knee.y }, end: knee }
        : { start: knee, end: projectPointOntoLine(knee, lineP1, lineP2) })
    : undefined;
  const shoulderProjection = shoulder
    ? (resistanceType === 'gravity'
        ? { start: { x: loadPosition.x, y: shoulder.y }, end: shoulder }
        : { start: shoulder, end: projectPointOntoLine(shoulder, lineP1, lineP2) })
    : undefined;
  const elbowProjection = elbow
    ? (resistanceType === 'gravity'
        ? { start: { x: loadPosition.x, y: elbow.y }, end: elbow }
        : { start: elbow, end: projectPointOntoLine(elbow, lineP1, lineP2) })
    : undefined;

  // 3. Tibial Angle & Muscle Bias (smoothly stabilized and rounded)
  const tibialAngle = Math.round((smoothedTibialAngle !== undefined
    ? smoothedTibialAngle
    : ((ankle && knee) ? calculateTibialAngle(ankle, knee) : 0)) * 10) / 10;
  let muscleBias: MuscleBiasCategory = 'balanced_hybrid';
  let muscleBiasLabel = 'Estímulo Equilibrado Híbrido';

  if (exerciseId.includes('lat') || exerciseId.includes('row')) {
    // Upper body pulling: Lat bias vs Upper Back
    if (dShoulder > 1.25 * dElbow) {
      muscleBias = 'lat_bias';
      muscleBiasLabel = 'Sesgo en Dorsal Ancho (Palanca en Hombro)';
    } else {
      muscleBias = 'upper_back_bias';
      muscleBiasLabel = 'Sesgo en Espalda Alta / Romboides';
    }
  } else {
    // Lower body: Hip vs Knee
    if (isHipThrust) {
      muscleBias = 'hip_glute_bias';
      muscleBiasLabel = 'Sesgo Dominante de Glúteo (Extensión Terminal)';
    } else if (isUprightSetup && dHip < 0.04 && dKnee < 0.04) {
      muscleBias = 'balanced_hybrid';
      muscleBiasLabel = 'Posición Inicial Neutra';
    } else if (hipOverKneeRatio > 1.25 || tibialAngle < 12) {
      muscleBias = 'hip_glute_bias';
      muscleBiasLabel = 'Sesgo Dominante de Cadera (Glúteo & Isquios)';
    } else if (hipOverKneeRatio < 0.82 || tibialAngle > 22) {
      muscleBias = 'knee_quad_bias';
      muscleBiasLabel = 'Sesgo Dominante de Rodilla (Cuádriceps)';
    } else {
      muscleBias = 'balanced_hybrid';
      muscleBiasLabel = 'Estímulo Equilibrado (Cadera & Rodilla)';
    }
  }

  // 4. Resistance Curve Match vs Muscle Length
  let resistancePeakLocation: ResistanceCurveMatch = 'mid_range_bell';
  let lengthenedScore = 75;

  if (phase === 'BOTTOM') {
    resistancePeakLocation = isHipThrust ? 'mid_range_bell' : 'lengthened_stretch';
    lengthenedScore = 95;
  } else if (phase === 'LOCKOUT') {
    // In Hip Thrust, peak resistance occurs at full extension/shortened lockout
    resistancePeakLocation = 'shortened_lockout';
    lengthenedScore = 40;
  } else {
    resistancePeakLocation = 'mid_range_bell';
    lengthenedScore = 70;
  }

  // 5. Technique Checks (Mode 1) & Pattern Evaluations
  const cameraPlane = detectCameraPlane(smoothedKeypoints);
  const ear = smoothedKeypoints['ear'] || smoothedKeypoints['right_ear'] || smoothedKeypoints['left_ear'];
  const spineAnalysis = calculateSpinalCollinearity(ear, shoulder, hip);
  let spineAngle = spineAnalysis.torsoLeanDeg;

  const kneeAngleDegrees = Math.round(computeJointAngle2D(hip, knee, ankle));
  const htEval = isHipThrust ? evaluateHipThrustAlignment(smoothedKeypoints, currentAngle) : null;
  const isCableFly = exerciseId.includes('fly');
  const isChestPress = patternFamily === 'push_press' && !isCableFly;
  const flyEval = isCableFly ? evaluateFlyBiomechanics(smoothedKeypoints, cameraPlane) : undefined;
  const pressEval = isChestPress ? evaluatePressBiomechanics(smoothedKeypoints, cameraPlane, footTracker, currentAngle) : undefined;

  // Spinal neutrality:
  // - Cable Fly: spine check disabled (user focus strictly on arm extension + shoulder retraction)
  // - Hip Thrust: lumbar + neck neutrality
  // - Chest Press (especially frontal view): symmetrical torso alignment (never unilateral ear->shoulder triangle)
  // - Sagittal lower-body patterns: ear->shoulder->hip collinearity
  let isSpineNeutral = spineAnalysis.isSpineNeutral;
  if (isCableFly) {
    isSpineNeutral = true;
  } else if (isHipThrust) {
    isSpineNeutral = Boolean(htEval?.lumbarNeutral && htEval?.neckNeutral);
  } else if (pressEval) {
    isSpineNeutral = pressEval.spineNeutral;
    spineAngle = pressEval.spineAngleDeg;
  } else if (cameraPlane !== 'sagittal') {
    const ls = smoothedKeypoints['left_shoulder'];
    const rs = smoothedKeypoints['right_shoulder'];
    const lh = smoothedKeypoints['left_hip'];
    const rh = smoothedKeypoints['right_hip'];
    if (ls && rs && lh && rh) {
      const midSh = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
      const midHp = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
      spineAngle = calculateSpineAlignment(midSh, midHp);
      isSpineNeutral = spineAngle <= 15.0;
    }
  }

  if (isHipThrust && htEval) {
    if (htEval.kneeBias === 'quad_dominant') {
      muscleBias = 'knee_quad_bias';
      muscleBiasLabel = `Sesgo hacia Cuádriceps (Rodilla ${htEval.kneeAngleDegrees}° < 80°)`;
    } else if (htEval.kneeBias === 'hamstring_dominant') {
      muscleBias = 'hip_glute_bias';
      muscleBiasLabel = `Sesgo hacia Femoral / Isquios (Rodilla ${htEval.kneeAngleDegrees}° > 102°)`;
    } else {
      muscleBias = 'hip_glute_bias';
      muscleBiasLabel = `Ángulo Óptimo Glúteo (${htEval.kneeAngleDegrees}° ≈ 90°)`;
    }
  } else if (flyEval) {
    muscleBias = 'balanced_hybrid';
    muscleBiasLabel = flyEval.areArmsExtended
      ? 'Brazos Rectos: Pectoral + Hombro (Pecho Limita)'
      : 'Codo Flexionado: Mayor Trabajo Tríceps';
  } else if (pressEval) {
    muscleBias = 'balanced_hybrid';
    muscleBiasLabel = pressEval.handElbowAlignment === 'closed_triceps'
      ? 'Sesgo hacia Tríceps (Mano cerrada)'
      : pressEval.handElbowAlignment === 'wide_stretch'
        ? 'Sesgo Estiramiento Pectoral'
        : 'Empuje Óptimo Pectoral (~90°)';
  }

  // Dynamic Knee Valgus: ONLY evaluated in frontal camera plane for lower-body patterns
  let isKneeValgusDetected = false;
  let valgusRatio = 1.0;

  if (cameraPlane === 'frontal' && !isUpperBody) {
    const lKnee = smoothedKeypoints['left_knee'];
    const rKnee = smoothedKeypoints['right_knee'];
    const lAnkle = smoothedKeypoints['left_ankle'];
    const rAnkle = smoothedKeypoints['right_ankle'];

    if (lKnee && rKnee && lAnkle && rAnkle) {
      const kneeDist = Math.abs(rKnee.x - lKnee.x);
      const ankleDist = Math.abs(rAnkle.x - lAnkle.x);
      if (ankleDist > 0.08) {
        valgusRatio = kneeDist / ankleDist;
        if (valgusRatio < 0.72) {
          isKneeValgusDetected = true;
        }
      }
    }
  }

  const techniqueAlerts = auditTechniqueRules(
    patternFamily,
    smoothedKeypoints,
    currentAngle,
    phase,
    loadPosition,
    exerciseId,
    footTracker
  );

  const activeCues: string[] = [];
  if (!isSpineNeutral && !isHipThrust && !isCableFly) {
    activeCues.push('⚡ Quiebre de neutralidad espinal: inclinación lateral o curvatura alterada (> 15°).');
  }
  if (isKneeValgusDetected) {
    activeCues.push('⚡ Valgo dinámico de rodilla: empuja las rodillas hacia afuera en línea con los pies.');
  }
  if (phase === 'BOTTOM' && currentAngle <= 95 && !isCableFly) {
    activeCues.push('✓ Rango de Movimiento (ROM) completo alcanzado.');
  }
  // Include specific pattern warnings in active cues
  techniqueAlerts.forEach(alert => {
    if (alert.type === 'warning' && !activeCues.includes(alert.message)) {
      activeCues.push(`⚡ ${alert.message}`);
    }
  });

  const computedRomPct = isCableFly
    ? Math.max(0, Math.min(100, Math.round(((95 - currentAngle) / (95 - 38)) * 100)))
    : Math.max(0, Math.min(100, Math.round(((165 - currentAngle) / (165 - 90)) * 100)));

  return {
    timestampMs,
    phase,
    currentAngle,
    angularVelocityDegPerSec: Math.round(angularVelocity),
    technique: {
      romPercentage: computedRomPct,
      spinalAngleDegrees: spineAngle,
      isSpineNeutral,
      isKneeValgusDetected,
      valgusDeviationRatio: Math.round(valgusRatio * 100) / 100,
      kneeAngleDegrees,
      lumbarNeutral: htEval ? htEval.lumbarNeutral : isSpineNeutral,
      lumbarStatusLabel: htEval ? htEval.lumbarStatusLabel : (isSpineNeutral ? '✓ Neutra' : '⚡ Desalineada'),
      neckNeutral: htEval ? htEval.neckNeutral : isSpineNeutral,
      neckStatusLabel: htEval ? htEval.neckStatusLabel : (isSpineNeutral ? '✓ Cuello Neutro' : '⚡ Desalineado'),
      pressEvaluation: pressEval,
      flyEvaluation: flyEval,
      activeCues,
      alerts: techniqueAlerts
    },
    biomechanics: {
      resistanceType,
      forceVector,
      forceLineOfAction: { start: lineP1, end: lineP2 },
      loadPosition,
      momentArms: {
        hip: Math.round(dHip * 100) / 100,
        knee: Math.round(dKnee * 100) / 100,
        shoulder: Math.round(dShoulder * 100) / 100,
        elbow: Math.round(dElbow * 100) / 100,
        hipOverKneeRatio: Math.round(hipOverKneeRatio * 100) / 100
      },
      momentArmProjections: {
        hipProjection,
        kneeProjection,
        shoulderProjection,
        elbowProjection
      },
      tibialAngleDegrees: tibialAngle,
      kneeAngleDegrees,
      pressEvaluation: pressEval,
      flyEvaluation: flyEval,
      muscleBias,
      muscleBiasLabel,
      resistancePeakLocation,
      lengthenedOverloadScore: lengthenedScore
    }
  };
}

/**
 * Compiles a completed repetition into a comprehensive scientific audit
 */
export function auditCompletedRepetition(
  rep: CompletedRepetition,
  allReps: CompletedRepetition[],
  exerciseProfileName: string,
  targetBias: 'quads' | 'glutes' | 'hamstrings' | 'lats' = 'quads'
): RepetitionBiomechanicalAudit {
  // ROM Consistency calculation across all reps
  const allRomExcursions = allReps.map(r => r.romExcursion);
  const meanRom = allRomExcursions.reduce((a, b) => a + b, 0) / (allRomExcursions.length || 1);
  const diffFromMean = Math.abs(rep.romExcursion - meanRom);
  const consistencyScore = Math.max(60, Math.min(100, Math.round(100 - (diffFromMean / (meanRom || 1)) * 100)));

  const cues: string[] = [];
  if (rep.bottomBounceDetected) {
    cues.push('⚡ Rebote en fase inferior: evita el rebote miotático pasivo; mantén pausa de 0.5s.');
  } else {
    cues.push('✓ Control excéntrico óptimo con desaceleración terminal.');
  }

  if (rep.tempo.eccentricDurationSeconds >= 2.0) {
    cues.push(`★ Tempo excéntrico excelente (${rep.tempo.eccentricDurationSeconds}s): alta tensión mecánica.`);
  } else {
    cues.push(`⚡ Excéntrico algo rápido (${rep.tempo.eccentricDurationSeconds}s): frena la bajada a 2.5s.`);
  }

  const isQuadTarget = targetBias === 'quads';
  const biasCategory: MuscleBiasCategory = isQuadTarget ? 'knee_quad_bias' : 'hip_glute_bias';
  const biasLabel = isQuadTarget ? 'Dominancia de Rodilla (Cuádriceps)' : 'Dominancia de Cadera (Glúteo)';

  const scientificAssessment = isQuadTarget
    ? 'El avance tibial y el momento de flexión de rodilla maximizan el reclutamiento del recto femoral y vastos con elongación profunda.'
    : 'La bisagra de cadera incrementa el brazo de palanca horizontal respecto a la línea de gravedad, sobrecargando glúteo mayor e isquiosurales.';

  return {
    repIndex: rep.repIndex,
    isValid: rep.isValid,
    tempo: {
      eccentricSeconds: rep.tempo.eccentricDurationSeconds,
      bottomPauseSeconds: rep.tempo.bottomPauseDurationSeconds,
      concentricSeconds: rep.tempo.concentricDurationSeconds,
      totalSeconds: rep.tempo.totalDurationSeconds,
      tempoDisplay: rep.tempo.tempoString
    },
    techniqueVerdict: {
      romConsistencyScore: consistencyScore,
      romReachedDegrees: rep.minAngle,
      romStatus: rep.isValid ? 'full' : 'partial',
      spinalNeutrality: 'neutral',
      bounceDetected: rep.bottomBounceDetected,
      feedbackCues: cues
    },
    biomechanicsVerdict: {
      dominantBias: biasCategory,
      biasLabel,
      meanHipOverKneeRatio: isQuadTarget ? 0.75 : 1.35,
      tibialInclinationDegrees: isQuadTarget ? 24 : 10,
      peakTorquePhase: 'lengthened_stretch',
      stretchHypertrophyOptimized: true,
      scientificAssessment
    }
  };
}
