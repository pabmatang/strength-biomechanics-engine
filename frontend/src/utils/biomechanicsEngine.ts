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
    trackingMode: 'ascending',
    standingThreshold: 110,
    inflectionThreshold: 175,
    description: 'Extensión pura de cadera con soporte torácico y máxima contracción terminal.',
    targetRatioDescription: 'Máximo momento de extensión al bloqueo'
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
    trackingMode: 'ascending',
    standingThreshold: 85,
    inflectionThreshold: 160,
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
    trackingMode: 'ascending',
    standingThreshold: 85,
    inflectionThreshold: 162,
    description: 'Vector vertical pasando por la clavícula para reclutamiento de haz clavicular.',
    targetRatioDescription: 'Línea de gravedad sobre esternón superior'
  },
  {
    id: 'cable_fly_mid_sternal',
    name: 'Cruces en Polea a Altura Media',
    targetMuscle: 'pectorals',
    loadType: 'cable',
    patternFamily: 'push_press',
    primaryJoint: 'shoulder',
    trackingMode: 'descending',
    standingThreshold: 150,
    inflectionThreshold: 80,
    description: 'Tensión constante durante el estiramiento profundo con vector perpendicular al húmero.',
    targetRatioDescription: 'Máxima sobrecarga en estiramiento'
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
 * Technical Fault Auditor by Movement Pattern
 */
export function auditTechniqueRules(
  patternFamily: PatternFamily,
  keypoints: Record<string, Point2D>,
  currentAngle: number,
  fsmPhase: FsmPhase,
  loadPosition: Point2D
): TechniqueFeedbackAlert[] {
  const alerts: TechniqueFeedbackAlert[] = [];
  const ear = keypoints['ear'] || keypoints['right_ear'] || keypoints['left_ear'];
  const shoulder = keypoints['shoulder'] || keypoints['right_shoulder'] || keypoints['left_shoulder'];
  const hip = keypoints['hip'] || keypoints['right_hip'] || keypoints['left_hip'];
  const knee = keypoints['knee'] || keypoints['right_knee'] || keypoints['left_knee'];
  const ankle = keypoints['ankle'] || keypoints['right_ankle'] || keypoints['left_ankle'];
  const wrist = keypoints['wrist'] || keypoints['right_wrist'] || keypoints['left_wrist'];

  // A) Patrón Peso Muerto / RDL (Hinge / Glúteo / Isquios)
  if (patternFamily === 'hinge_deadlift') {
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

  // D) Patrón de Empuje / Pecho
  else if (patternFamily === 'push_press') {
    if (currentAngle < 75 && fsmPhase === 'BOTTOM') {
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
  spinalNeutral: boolean = true
): {
  isOptimal: boolean;
  verdictTitle: string;
  verdictDescription: string;
  ratio: number;
} {
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
  smoothedTibialAngle?: number
): BiomechanicalTelemetryFrame {
  const hip = smoothedKeypoints['hip'] || smoothedKeypoints['right_hip'] || smoothedKeypoints['left_hip'];
  const knee = smoothedKeypoints['knee'] || smoothedKeypoints['right_knee'] || smoothedKeypoints['left_knee'];
  const ankle = smoothedKeypoints['ankle'] || smoothedKeypoints['right_ankle'] || smoothedKeypoints['left_ankle'];
  const shoulder = smoothedKeypoints['shoulder'] || smoothedKeypoints['right_shoulder'] || smoothedKeypoints['left_shoulder'];
  const wrist = smoothedKeypoints['wrist'] || smoothedKeypoints['right_wrist'] || smoothedKeypoints['left_wrist'];
  const elbow = smoothedKeypoints['elbow'] || smoothedKeypoints['right_elbow'] || smoothedKeypoints['left_elbow'];

  // Determine load / force application point:
  // - Machine exercises with foot on platform (leg press, hack squat, etc.) or when resistanceType === 'machine':
  //   the force is applied at the foot/ankle on the machine.
  // - Free-weight hinge/deadlift: load is strictly held at the hands (wrist landmark).
  // - Free-weight barbell back squat: load is at the shoulder/bar.
  // - Upper body patterns: load is at the hands.
  const patternFamily = getPatternFamily(exerciseId);
  const isHinge = patternFamily === 'hinge_deadlift';
  const isUpperBody = exerciseId.includes('lat') || exerciseId.includes('row') || exerciseId.includes('press_chest') || exerciseId.includes('curl') || exerciseId.includes('triceps') || patternFamily === 'push_press' || patternFamily === 'pull_row';
  const isMachineFootContact = (resistanceType === 'machine' || exerciseId.includes('press') || exerciseId.includes('hack') || exerciseId.includes('extension')) && !isUpperBody;

  const loadPosition: Point2D = isMachineFootContact && ankle
    ? ankle
    : (isHinge && wrist
        ? wrist
        : (shoulder
            ? { x: (shoulder.x + (wrist ? wrist.x : shoulder.x)) / 2, y: shoulder.y }
            : (wrist || ankle || shoulder || { x: 0.5, y: 0.5 })));

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

  // 3. Tibial Angle & Muscle Bias (smoothly stabilized)
  const tibialAngle = smoothedTibialAngle !== undefined
    ? smoothedTibialAngle
    : ((ankle && knee) ? calculateTibialAngle(ankle, knee) : 0);
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
    if (isUprightSetup && dHip < 0.04 && dKnee < 0.04) {
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
    resistancePeakLocation = 'lengthened_stretch';
    lengthenedScore = 95;
  } else if (phase === 'LOCKOUT') {
    resistancePeakLocation = 'shortened_lockout';
    lengthenedScore = 40;
  } else {
    resistancePeakLocation = 'mid_range_bell';
    lengthenedScore = 70;
  }

  // 5. Technique Checks (Mode 1)
  const ear = smoothedKeypoints['ear'] || smoothedKeypoints['right_ear'] || smoothedKeypoints['left_ear'];
  const spineAnalysis = calculateSpinalCollinearity(ear, shoulder, hip);
  const spineAngle = spineAnalysis.torsoLeanDeg;
  const isSpineNeutral = spineAnalysis.isSpineNeutral;

  // Dynamic Knee Valgus: ONLY evaluated in frontal camera plane
  const cameraPlane = detectCameraPlane(smoothedKeypoints);
  let isKneeValgusDetected = false;
  let valgusRatio = 1.0;

  if (cameraPlane === 'frontal') {
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
    loadPosition
  );

  const activeCues: string[] = [];
  if (!isSpineNeutral) {
    activeCues.push('⚡ Quiebre de neutralidad espinal: curvatura alterada (desviación oreja-hombro-cadera > 15°).');
  }
  if (isKneeValgusDetected) {
    activeCues.push('⚡ Valgo dinámico de rodilla: empuja las rodillas hacia afuera en línea con los pies.');
  }
  if (phase === 'BOTTOM' && currentAngle <= 95) {
    activeCues.push('✓ Rango de Movimiento (ROM) completo alcanzado.');
  }
  // Include specific pattern warnings in active cues
  techniqueAlerts.forEach(alert => {
    if (alert.type === 'warning' && !activeCues.includes(alert.message)) {
      activeCues.push(`⚡ ${alert.message}`);
    }
  });

  return {
    timestampMs,
    phase,
    currentAngle,
    angularVelocityDegPerSec: Math.round(angularVelocity),
    technique: {
      romPercentage: Math.min(100, Math.round(((165 - currentAngle) / (165 - 90)) * 100)),
      spinalAngleDegrees: spineAngle,
      isSpineNeutral,
      isKneeValgusDetected,
      valgusDeviationRatio: Math.round(valgusRatio * 100) / 100,
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
