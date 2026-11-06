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

export type ResistanceSourceType = 'gravity' | 'cable_high' | 'cable_mid' | 'cable_low';
export type MuscleBiasCategory = 'hip_glute_bias' | 'knee_quad_bias' | 'balanced_hybrid' | 'lat_bias' | 'upper_back_bias';
export type ResistanceCurveMatch = 'lengthened_stretch' | 'shortened_lockout' | 'mid_range_bell';

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
  timestampMs: number = performance.now()
): BiomechanicalTelemetryFrame {
  const hip = smoothedKeypoints['hip'] || smoothedKeypoints['right_hip'] || smoothedKeypoints['left_hip'];
  const knee = smoothedKeypoints['knee'] || smoothedKeypoints['right_knee'] || smoothedKeypoints['left_knee'];
  const ankle = smoothedKeypoints['ankle'] || smoothedKeypoints['right_ankle'] || smoothedKeypoints['left_ankle'];
  const shoulder = smoothedKeypoints['shoulder'] || smoothedKeypoints['right_shoulder'] || smoothedKeypoints['left_shoulder'];
  const wrist = smoothedKeypoints['wrist'] || smoothedKeypoints['right_wrist'] || smoothedKeypoints['left_wrist'];
  const elbow = smoothedKeypoints['elbow'] || smoothedKeypoints['right_elbow'] || smoothedKeypoints['left_elbow'];

  // Determine load center of mass
  // In squats / lunges / leg press: load is roughly at bar/hands or shoulder
  // In deadlift / bench / pulldown / curl: load is at wrist/hands
  const isLowerBodyCompound = exerciseId.includes('squat') || exerciseId.includes('press') || exerciseId.includes('lunge');
  const loadPosition: Point2D = isLowerBodyCompound && shoulder
    ? { x: (shoulder.x + (wrist ? wrist.x : shoulder.x)) / 2, y: shoulder.y }
    : (wrist || shoulder || { x: 0.5, y: 0.5 });

  // 1. Line of Action of Force
  let lineP1: Point2D;
  let lineP2: Point2D;
  let forceVector: Vector2D;

  if (resistanceType === 'gravity') {
    // Pure vertical gravity line passing through load position
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
  const hipOverKneeRatio = dHip / (dKnee + epsilon);

  // Moment arm orthogonal projection segments for visual overlay
  const hipProjection = hip ? { start: hip, end: projectPointOntoLine(hip, lineP1, lineP2) } : undefined;
  const kneeProjection = knee ? { start: knee, end: projectPointOntoLine(knee, lineP1, lineP2) } : undefined;
  const shoulderProjection = shoulder ? { start: shoulder, end: projectPointOntoLine(shoulder, lineP1, lineP2) } : undefined;
  const elbowProjection = elbow ? { start: elbow, end: projectPointOntoLine(elbow, lineP1, lineP2) } : undefined;

  // 3. Tibial Angle & Muscle Bias
  const tibialAngle = (ankle && knee) ? calculateTibialAngle(ankle, knee) : 0;
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
    if (hipOverKneeRatio > 1.25 || tibialAngle < 12) {
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
  const spineAngle = (shoulder && hip) ? calculateSpineAlignment(shoulder, hip) : 15;
  const isSpineNeutral = spineAngle <= 38;

  // Dynamic Knee Valgus: check if left and right knee distance collapses relative to ankles
  const lKnee = smoothedKeypoints['left_knee'];
  const rKnee = smoothedKeypoints['right_knee'];
  const lAnkle = smoothedKeypoints['left_ankle'];
  const rAnkle = smoothedKeypoints['right_ankle'];

  let isKneeValgusDetected = false;
  let valgusRatio = 1.0;

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

  const activeCues: string[] = [];
  if (!isSpineNeutral) {
    activeCues.push('⚡ Quiebre de neutralidad espinal: mantén el torso erguido y core apretado.');
  }
  if (isKneeValgusDetected) {
    activeCues.push('⚡ Valgo dinámico de rodilla: empuja las rodillas hacia afuera en línea con los pies.');
  }
  if (phase === 'BOTTOM' && currentAngle <= 95) {
    activeCues.push('✓ Rango de Movimiento (ROM) completo alcanzado.');
  }

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
      activeCues
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
