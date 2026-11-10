import { describe, it, expect, beforeEach } from 'vitest';
import { OneEuroFilter, PoseLandmarkSmoother } from '../utils/oneEuroFilter';
import { BiomechanicalFSM } from '../utils/biomechanicalFSM';
import {
  perpendicularDistanceToLine,
  projectPointOntoLine,
  calculateTibialAngle,
  calculateSpineAlignment,
  evaluateBiomechanicalFrame,
  auditCompletedRepetition,
  detectCameraPlane,
  calculateSpinalCollinearity,
  evaluateBiomechanicalVerdict,
  evaluatePressBiomechanics,
  evaluatePressVerdict,
  FootStabilityState,
  auditTechniqueRules,
  assessFramingQuality,
  EXERCISE_BIOMECHANICS_RULES
} from '../utils/biomechanicsEngine';

describe('1€ Filter (OneEuroFilter) - Anti-Jitter Signal Stabilization', () => {
  it('smooths high-frequency noise when stationary (zero velocity)', () => {
    const filter = new OneEuroFilter(1.0, 0.008, 1.0);
    const baseValue = 0.5;

    // Simulate noisy stationary signal with jitter +/- 0.05
    const timestamps = [100, 133, 166, 200, 233, 266, 300];
    const noisyValues = [0.52, 0.48, 0.53, 0.47, 0.51, 0.49, 0.50];

    const filtered: number[] = [];
    timestamps.forEach((t, i) => {
      filtered.push(filter.filter(noisyValues[i], t));
    });

    // The variation of the filtered signal should be substantially smaller than raw jitter
    const rawDev = Math.max(...noisyValues) - Math.min(...noisyValues);
    const filtDev = Math.max(...filtered.slice(2)) - Math.min(...filtered.slice(2));

    expect(filtDev).toBeLessThan(rawDev * 0.5);
    expect(filtered[filtered.length - 1]).toBeCloseTo(0.5, 1);
  });

  it('adapts cutoff frequency dynamically during rapid movement to minimize phase lag', () => {
    const filter = new OneEuroFilter(1.0, 0.015, 1.0);

    // Initial steady state
    filter.filter(0.2, 100);
    filter.filter(0.2, 133);

    // Rapid step motion
    const valAtHighSpeed = filter.filter(0.8, 166);

    // Because beta increases cutoff, filter should rapidly track the fast displacement
    expect(valAtHighSpeed).toBeGreaterThan(0.28);
  });

  it('smooths a full pose landmark dictionary without mutating raw data', () => {
    const smoother = new PoseLandmarkSmoother();
    const rawPose = {
      hip: { x: 0.5, y: 0.6 },
      knee: { x: 0.52, y: 0.8 },
      ankle: { x: 0.51, y: 0.95 }
    };

    const smoothed = smoother.smoothLandmarks(rawPose, 100);
    expect(smoothed.hip.x).toBe(0.5);
    expect(smoothed.knee.y).toBe(0.8);

    // Second frame with small jitter
    const smoothed2 = smoother.smoothLandmarks(
      {
        hip: { x: 0.53, y: 0.6 },
        knee: { x: 0.50, y: 0.8 },
        ankle: { x: 0.52, y: 0.95 }
      },
      133
    );

    expect(smoothed2.hip.x).toBeLessThan(0.53);
    expect(smoothed2.hip.x).toBeGreaterThan(0.5);
  });
});

describe('Biomechanical Finite State Machine (FSM) & Tempo Engine', () => {
  let fsm: BiomechanicalFSM;

  beforeEach(() => {
    fsm = new BiomechanicalFSM({
      trackingMode: 'descending',
      lockoutThreshold: 165,
      inflectionThreshold: 90,
      hysteresisAngleBand: 8,
      velocityThresholdDegPerSec: 15,
      minPhaseDurationMs: 100,
      bounceThresholdMs: 150
    });
  });

  it('starts in LOCKOUT phase and rejects small micro-fluctuations below hysteresis band', () => {
    expect(fsm.getPhase()).toBe('LOCKOUT');

    // Slight noise of 3 degrees should NOT trigger ECCENTRIC
    fsm.update(163, 100);
    fsm.update(162, 133);
    expect(fsm.getPhase()).toBe('LOCKOUT');
  });

  it('transitions properly through all 4 phases and calculates accurate tempo', () => {
    // 1. Enter ECCENTRIC (angle drops significantly with negative velocity)
    fsm.update(165, 100);
    fsm.update(154, 150);
    fsm.update(140, 200);
    expect(fsm.getPhase()).toBe('ECCENTRIC');

    // Progressing downwards
    fsm.update(120, 500);
    fsm.update(100, 1000);
    fsm.update(88, 1500); // Reaches depth
    fsm.update(88, 1650);

    // 2. Enters BOTTOM (velocity stalls near inflection)
    expect(fsm.getPhase()).toBe('BOTTOM');

    // Pause in bottom stretch for 600ms
    fsm.update(88, 1900);
    fsm.update(89, 2250);

    // 3. Enters CONCENTRIC (positive velocity)
    fsm.update(105, 2400);
    fsm.update(118, 2500);
    expect(fsm.getPhase()).toBe('CONCENTRIC');

    fsm.update(145, 2900);
    const completedRep = fsm.update(164, 3200);

    // 4. Completed Repetition Verification
    expect(completedRep).not.toBeNull();
    if (completedRep) {
      expect(completedRep.repIndex).toBe(1);
      expect(completedRep.isValid).toBe(true);
      expect(completedRep.minAngle).toBeLessThanOrEqual(90);
      expect(completedRep.romExcursion).toBeGreaterThanOrEqual(70);

      // Verify tempo breakdown (eccentric ~ 1.4s, pause ~ 0.8s, concentric ~ 1.0s)
      expect(completedRep.tempo.eccentricDurationSeconds).toBeGreaterThan(1.0);
      expect(completedRep.tempo.bottomPauseDurationSeconds).toBeGreaterThan(0.4);
      expect(completedRep.tempo.concentricDurationSeconds).toBeGreaterThan(0.6);
      expect(completedRep.bottomBounceDetected).toBe(false);
    }

    expect(fsm.getPhase()).toBe('LOCKOUT');
  });

  it('flags bottom bounce when inversion is too abrupt (< 150ms)', () => {
    // Descent
    fsm.update(165, 100);
    fsm.update(150, 150);
    fsm.update(130, 200);
    fsm.update(88, 500);
    // Instant reversal with only 50ms pause
    fsm.update(88, 520);
    fsm.update(105, 570);
    const rep = fsm.update(165, 1000);

    if (rep) {
      expect(rep.bottomBounceDetected).toBe(true);
    }
  });
});

describe('Biomechanical Physics & Moment Arm Calculations', () => {
  it('calculates perpendicular distance to a vertical gravity line exactly', () => {
    const jointHip = { x: 0.35, y: 0.6 };
    const loadLineP1 = { x: 0.50, y: 0.0 };
    const loadLineP2 = { x: 0.50, y: 1.0 };

    const dist = perpendicularDistanceToLine(jointHip, loadLineP1, loadLineP2);
    expect(dist).toBeCloseTo(0.15, 4);
  });

  it('projects points orthogonally onto arbitrary vector lines', () => {
    const point = { x: 2, y: 0 };
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 0, y: 5 }; // Vertical Y axis

    const projected = projectPointOntoLine(point, p1, p2);
    expect(projected.x).toBeCloseTo(0, 4);
    expect(projected.y).toBeCloseTo(0, 4);
  });

  it('accurately computes tibial angle relative to vertical', () => {
    // Vertical tibia: ankle and knee share same X
    const ankle = { x: 0.5, y: 0.9 };
    const kneeVertical = { x: 0.5, y: 0.7 };
    expect(calculateTibialAngle(ankle, kneeVertical)).toBeCloseTo(0, 1);

    // Forward knee travel
    const kneeForward = { x: 0.6, y: 0.7 }; // dx = 0.1, dy = 0.2 -> atan2(0.1, 0.2) = 26.5 deg
    expect(calculateTibialAngle(ankle, kneeForward)).toBeCloseTo(26.6, 1);
  });

  it('accurately computes spinal alignment angle', () => {
    const hip = { x: 0.5, y: 0.6 };
    const shoulderErect = { x: 0.5, y: 0.3 };
    expect(calculateSpineAlignment(shoulderErect, hip)).toBeCloseTo(0, 1);

    // Inclined torso
    const shoulderInclined = { x: 0.65, y: 0.35 };
    expect(calculateSpineAlignment(shoulderInclined, hip)).toBeGreaterThan(25);
  });

  it('evaluates muscle bias: Glute Bias when d_hip >> d_knee, Quad Bias when d_knee >> d_hip', () => {
    // 1. Hip Dominant setup (e.g. RDL / Low bar squat with vertical tibia)
    const hipDominantKeypoints = {
      hip: { x: 0.30, y: 0.60 },
      knee: { x: 0.48, y: 0.75 },
      ankle: { x: 0.49, y: 0.95 },
      shoulder: { x: 0.50, y: 0.40 },
      wrist: { x: 0.50, y: 0.65 } // Load at x=0.50 -> d_hip = 0.20, d_knee = 0.02
    };

    const hipFrame = evaluateBiomechanicalFrame(
      hipDominantKeypoints,
      'squat',
      'BOTTOM',
      88,
      -5,
      'gravity',
      'glutes',
      1000
    );

    expect(hipFrame.biomechanics.momentArms.hip).toBeGreaterThan(hipFrame.biomechanics.momentArms.knee);
    expect(hipFrame.biomechanics.momentArms.hipOverKneeRatio).toBeGreaterThan(1.25);
    expect(hipFrame.biomechanics.muscleBias).toBe('hip_glute_bias');
    expect(hipFrame.biomechanics.resistancePeakLocation).toBe('lengthened_stretch');

    // 2. Knee Dominant setup (e.g. Sissy squat / High bar with forward knee travel)
    const kneeDominantKeypoints = {
      hip: { x: 0.50, y: 0.60 },
      knee: { x: 0.68, y: 0.75 }, // Large forward knee travel
      ankle: { x: 0.48, y: 0.95 },
      shoulder: { x: 0.50, y: 0.40 },
      wrist: { x: 0.50, y: 0.65 } // Load at x=0.50 -> d_hip = 0.0, d_knee = 0.18
    };

    const kneeFrame = evaluateBiomechanicalFrame(
      kneeDominantKeypoints,
      'squat',
      'BOTTOM',
      85,
      -5,
      'gravity',
      'quads',
      1200
    );

    expect(kneeFrame.biomechanics.momentArms.knee).toBeGreaterThan(kneeFrame.biomechanics.momentArms.hip);
    expect(kneeFrame.biomechanics.momentArms.hipOverKneeRatio).toBeLessThan(0.85);
    expect(kneeFrame.biomechanics.muscleBias).toBe('knee_quad_bias');
  });

  it('audits a completed repetition and produces structured JSON telemetry', () => {
    const mockRep = {
      repIndex: 1,
      isValid: true,
      tempo: {
        eccentricDurationSeconds: 2.8,
        bottomPauseDurationSeconds: 0.9,
        concentricDurationSeconds: 1.1,
        totalDurationSeconds: 4.8,
        tempoString: '2.8s - 0.9s - 1.1s'
      },
      minAngle: 86,
      maxAngle: 165,
      romExcursion: 79,
      startAngle: 165,
      endAngle: 164,
      peakEccentricVelocityDegPerSec: 55,
      peakConcentricVelocityDegPerSec: 62,
      bottomBounceDetected: false,
      completionTimestamp: 3000
    };

    const audit = auditCompletedRepetition(mockRep, [mockRep], 'Sentadilla Libre', 'quads');

    expect(audit.repIndex).toBe(1);
    expect(audit.techniqueVerdict.romStatus).toBe('full');
    expect(audit.techniqueVerdict.romConsistencyScore).toBe(100);
    expect(audit.techniqueVerdict.bounceDetected).toBe(false);
    expect(audit.biomechanicsVerdict.stretchHypertrophyOptimized).toBe(true);
    expect(audit.biomechanicsVerdict.scientificAssessment).toContain('recto femoral');
  });

  it('detects camera recording plane (sagittal vs frontal) to suppress valgus false positives', () => {
    // Sagittal profile: both shoulders and hips have x-difference < 0.10
    const sagittalPose = {
      left_shoulder: { x: 0.48, y: 0.30 },
      right_shoulder: { x: 0.51, y: 0.30 },
      left_hip: { x: 0.49, y: 0.55 },
      right_hip: { x: 0.52, y: 0.55 }
    };
    expect(detectCameraPlane(sagittalPose)).toBe('sagittal');

    // Frontal view: broad shoulder separation
    const frontalPose = {
      left_shoulder: { x: 0.35, y: 0.30 },
      right_shoulder: { x: 0.65, y: 0.30 },
      left_hip: { x: 0.40, y: 0.55 },
      right_hip: { x: 0.60, y: 0.55 }
    };
    expect(detectCameraPlane(frontalPose)).toBe('frontal');
  });

  it('separates anterior torso lean from true spinal curvature breakdown', () => {
    // Bulgarian split squat: anterior torso lean of 55° with healthy neutral collinearity
    // Ear at (0.62, 0.22), Shoulder at (0.58, 0.30), Hip at (0.42, 0.52)
    // Both segments follow straight aligned line
    const ear = { x: 0.65, y: 0.22 };
    const shoulder = { x: 0.57, y: 0.33 };
    const hip = { x: 0.41, y: 0.55 };

    const spinalAnalysis = calculateSpinalCollinearity(ear, shoulder, hip);
    expect(spinalAnalysis.torsoLeanDeg).toBeGreaterThan(35); // Healthy torso lean
    expect(spinalAnalysis.deviationAngleDeg).toBeLessThanOrEqual(15);
    expect(spinalAnalysis.isSpineNeutral).toBe(true); // Should NOT flag a technical fault!

    // Severe spinal flexion / kyphotic collapse: deviation > 15°
    const earBroken = { x: 0.70, y: 0.20 };
    const shoulderBroken = { x: 0.55, y: 0.32 };
    const hipBroken = { x: 0.35, y: 0.40 };

    const brokenAnalysis = calculateSpinalCollinearity(earBroken, shoulderBroken, hipBroken);
    expect(brokenAnalysis.deviationAngleDeg).toBeGreaterThan(15);
    expect(brokenAnalysis.isSpineNeutral).toBe(false);
  });

  it('generates accurate applied biomechanical verdicts for glutes, quads and hamstrings', () => {
    // 1. Glute verdict: ratio > 1.4 & vertical tibia (<= 18°) -> optimal
    const gluteOptimal = evaluateBiomechanicalVerdict('glutes_max', 0.55, 0.25, 12);
    expect(gluteOptimal.isOptimal).toBe(true);
    expect(gluteOptimal.verdictTitle).toContain('Enfoque óptimo en Glúteo en estiramiento');

    // Glute with excess knee travel -> warning
    const gluteShifted = evaluateBiomechanicalVerdict('glutes_max', 0.30, 0.45, 26);
    expect(gluteShifted.isOptimal).toBe(false);
    expect(gluteShifted.verdictTitle).toContain('Dominancia desplazada hacia Cuádriceps');

    // 2. Hamstrings verdict: pure hinge
    const hamOptimal = evaluateBiomechanicalVerdict('hamstrings', 0.50, 0.20, 10, 50, 60);
    expect(hamOptimal.isOptimal).toBe(true);
    expect(hamOptimal.verdictTitle).toContain('Patrón de bisagra puro para Isquiosurales');

    // 3. Quadriceps verdict: knee dominant with tibial forward travel
    const quadOptimal = evaluateBiomechanicalVerdict('quadriceps', 0.20, 0.50, 25);
    expect(quadOptimal.isOptimal).toBe(true);
    expect(quadOptimal.verdictTitle).toContain('Sobrecarga óptima en Cuádriceps');

    // 4. Quadriceps with insufficient tibial forward travel (< 18°)
    const quadNoTravel = evaluateBiomechanicalVerdict('quadriceps', 0.45, 0.20, 12);
    expect(quadNoTravel.isOptimal).toBe(false);
    expect(quadNoTravel.verdictTitle).toContain('Falta de avance de rodilla sobre el mediopié');

    // 5. Hip Thrust specific verdict: Knee Angle (~90° vs Quads/Femoral) + Lumbar & Neck Neutrality
    const hipThrustOptimal = evaluateBiomechanicalVerdict('glutes_max', 0.10, 0.35, 14, 0, 70, true, 'hip_thrust_barbell', 90, true, true);
    expect(hipThrustOptimal.isOptimal).toBe(true);
    expect(hipThrustOptimal.verdictTitle).toContain('Ángulo de Rodilla Óptimo para Glúteo Mayor (~90°)');

    const hipThrustQuads = evaluateBiomechanicalVerdict('glutes_max', 0.10, 0.35, 14, 0, 70, true, 'hip_thrust_barbell', 70, true, true);
    expect(hipThrustQuads.isOptimal).toBe(false);
    expect(hipThrustQuads.verdictTitle).toContain('Cuádriceps');

    const hipThrustHams = evaluateBiomechanicalVerdict('glutes_max', 0.10, 0.35, 14, 0, 70, true, 'hip_thrust_barbell', 115, true, true);
    expect(hipThrustHams.isOptimal).toBe(false);
    expect(hipThrustHams.verdictTitle).toContain('Femoral');

    const hipThrustLumbarBad = evaluateBiomechanicalVerdict('glutes_max', 0.10, 0.35, 14, 0, 70, true, 'hip_thrust_barbell', 90, false, true);
    expect(hipThrustLumbarBad.isOptimal).toBe(false);
    expect(hipThrustLumbarBad.verdictTitle).toContain('Lumbar');

    const hipThrustNeckBad = evaluateBiomechanicalVerdict('glutes_max', 0.10, 0.35, 14, 0, 70, true, 'hip_thrust_barbell', 90, true, false);
    expect(hipThrustNeckBad.isOptimal).toBe(false);
    expect(hipThrustNeckBad.verdictTitle).toContain('Cuello');
  });

  it('audits pattern-specific technical faults via auditTechniqueRules', () => {
    // A) Hinge / RDL: Load separation > 12/15cm
    const hingeKeypointsSeparated = {
      wrist: { x: 0.65, y: 0.60 },
      knee: { x: 0.45, y: 0.60 },
      ankle: { x: 0.45, y: 0.85 },
      shoulder: { x: 0.48, y: 0.35 },
      hip: { x: 0.40, y: 0.50 }
    };
    const alertsSeparation = auditTechniqueRules(
      'hinge_deadlift',
      hingeKeypointsSeparated,
      130,
      'ECCENTRIC',
      hingeKeypointsSeparated.wrist
    );
    expect(alertsSeparation.some(a => a.code === 'LOAD_SEPARATION')).toBe(true);

    // Hinge with load close to tibia
    const hingeKeypointsTight = {
      wrist: { x: 0.46, y: 0.60 },
      knee: { x: 0.45, y: 0.60 },
      ankle: { x: 0.45, y: 0.85 },
      shoulder: { x: 0.48, y: 0.35 },
      hip: { x: 0.40, y: 0.50 }
    };
    const alertsTight = auditTechniqueRules(
      'hinge_deadlift',
      hingeKeypointsTight,
      130,
      'ECCENTRIC',
      hingeKeypointsTight.wrist
    );
    expect(alertsTight.some(a => a.code === 'LOAD_TIGHT')).toBe(true);

    // B) Squat: Depth deficit at bottom (hip.y < knee.y - 0.02)
    const squatKeypointsHigh = {
      hip: { x: 0.50, y: 0.48 }, // Hip higher on screen (lower y) than knee
      knee: { x: 0.52, y: 0.62 },
      ankle: { x: 0.50, y: 0.85 }
    };
    const alertsDepth = auditTechniqueRules(
      'squat_knee_dominant',
      squatKeypointsHigh,
      105,
      'BOTTOM',
      { x: 0.50, y: 0.40 }
    );
    expect(alertsDepth.some(a => a.code === 'DEPTH_DEFICIT')).toBe(true);

    // Squat: Optimal parallel/sub-parallel depth
    const squatKeypointsDeep = {
      hip: { x: 0.48, y: 0.63 }, // Hip below or at knee level
      knee: { x: 0.55, y: 0.62 },
      ankle: { x: 0.50, y: 0.85 }
    };
    const alertsDeep = auditTechniqueRules(
      'squat_knee_dominant',
      squatKeypointsDeep,
      85,
      'BOTTOM',
      { x: 0.50, y: 0.40 }
    );
    expect(alertsDeep.some(a => a.code === 'DEPTH_ACHIEVED')).toBe(true);

    // C) Pull/Row: Biceps overuse (< 70° flexion)
    const alertsPull = auditTechniqueRules(
      'pull_row',
      {},
      55, // 55° acute elbow flexion
      'CONCENTRIC',
      { x: 0.5, y: 0.5 }
    );
    expect(alertsPull.some(a => a.code === 'BICEPS_OVERUSE')).toBe(true);
  });

  it('validates EXERCISE_BIOMECHANICS_RULES mapping for all pattern families', () => {
    expect(EXERCISE_BIOMECHANICS_RULES.hinge_deadlift.primaryJoint).toBe('hip');
    expect(EXERCISE_BIOMECHANICS_RULES.hinge_deadlift.anglePoints.vertex).toBe('hip');

    expect(EXERCISE_BIOMECHANICS_RULES.squat_knee_dominant.primaryJoint).toBe('knee');
    expect(EXERCISE_BIOMECHANICS_RULES.squat_knee_dominant.anglePoints.vertex).toBe('knee');

    expect(EXERCISE_BIOMECHANICS_RULES.pull_row.primaryJoint).toBe('elbow');
    expect(EXERCISE_BIOMECHANICS_RULES.push_press.primaryJoint).toBe('elbow');
  });

  it('computes horizontal orthogonal moment arm spans in gravity mode', () => {
    const keypoints = {
      hip: { x: 0.35, y: 0.55 },
      knee: { x: 0.48, y: 0.70 },
      wrist: { x: 0.50, y: 0.60 }
    };
    const frame = evaluateBiomechanicalFrame(
      keypoints,
      'rdl_glute',
      'BOTTOM',
      120,
      0,
      'gravity'
    );

    expect(frame.biomechanics.momentArmProjections.hipProjection).toBeDefined();
    expect(frame.biomechanics.momentArmProjections.kneeProjection).toBeDefined();

    // Hip orthogonal projection should connect horizontal span (start.x = load.x, start.y = hip.y) to hip
    const hipProj = frame.biomechanics.momentArmProjections.hipProjection!;
    expect(hipProj.start.y).toBeCloseTo(keypoints.hip.y);
    expect(hipProj.end.x).toBeCloseTo(keypoints.hip.x);

    // Knee orthogonal projection should connect horizontal span (start.x = load.x, start.y = knee.y) to knee
    const kneeProj = frame.biomechanics.momentArmProjections.kneeProjection!;
    expect(kneeProj.start.y).toBeCloseTo(keypoints.knee.y);
    expect(kneeProj.end.x).toBeCloseTo(keypoints.knee.x);
  });

  it('correctly audits Hip Thrust biomechanics, load point at pelvis and avoids false technique alerts', () => {
    // 1. Hip Thrust with full lockout and vertical shins
    const hipThrustKeypoints = {
      shoulder: { x: 0.65, y: 0.45 },
      hip: { x: 0.45, y: 0.48 },
      knee: { x: 0.35, y: 0.48 },
      ankle: { x: 0.35, y: 0.75 },
      ear: { x: 0.70, y: 0.40 },
      wrist: { x: 0.45, y: 0.45 }
    };

    const alertsOptimal = auditTechniqueRules(
      'hinge_deadlift',
      hipThrustKeypoints,
      172,
      'LOCKOUT',
      hipThrustKeypoints.hip,
      'hip_thrust_barbell'
    );

    expect(alertsOptimal.some(a => a.code === 'HIP_LOCKOUT_MAXIMAL')).toBe(true);
    expect(alertsOptimal.some(a => a.code === 'KNEE_ANGLE_OPTIMAL_90')).toBe(true);
    expect(alertsOptimal.some(a => a.code === 'CHIN_TUCK_SAFE')).toBe(true);
    // Crucial: Must NEVER trigger deadlift/RDL load separation or spinal breakdown in hip thrust
    expect(alertsOptimal.some(a => a.code === 'LOAD_SEPARATION')).toBe(false);
    expect(alertsOptimal.some(a => a.code === 'SPINE_BREAKDOWN')).toBe(false);

    // 2. Hip Thrust with feet too close (knee < 80° -> quad dominant)
    const hipThrustQuadsKp = {
      ...hipThrustKeypoints,
      ankle: { x: 0.45, y: 0.72 } // ankle tucked backward under hip -> acute knee angle
    };
    const alertsQuads = auditTechniqueRules(
      'hinge_deadlift',
      hipThrustQuadsKp,
      172,
      'LOCKOUT',
      hipThrustQuadsKp.hip,
      'hip_thrust_barbell'
    );
    expect(alertsQuads.some(a => a.code === 'KNEE_ANGLE_TOO_CLOSED_QUADS')).toBe(true);

    // 3. Hip Thrust with feet too far forward (knee > 102° -> hamstring/femoral dominant)
    const hipThrustHamsKp = {
      ...hipThrustKeypoints,
      ankle: { x: 0.22, y: 0.72 } // ankle pushed far forward -> obtuse knee angle
    };
    const alertsHams = auditTechniqueRules(
      'hinge_deadlift',
      hipThrustHamsKp,
      172,
      'LOCKOUT',
      hipThrustHamsKp.hip,
      'hip_thrust_barbell'
    );
    expect(alertsHams.some(a => a.code === 'KNEE_ANGLE_TOO_OPEN_HAMS')).toBe(true);

    // 4. Hip Thrust with cervical hyperextension (head dropped backward)
    const hipThrustNeckBadKp = {
      ...hipThrustKeypoints,
      ear: { x: 0.72, y: 0.52 } // dropped below bench/shoulder axis
    };
    const alertsNeckBad = auditTechniqueRules(
      'hinge_deadlift',
      hipThrustNeckBadKp,
      172,
      'LOCKOUT',
      hipThrustNeckBadKp.hip,
      'hip_thrust_barbell'
    );
    expect(alertsNeckBad.some(a => a.code === 'HIP_THRUST_NECK_MISALIGNMENT')).toBe(true);

    // 5. Hip Thrust with incomplete lockout (< 155°)
    const alertsIncomplete = auditTechniqueRules(
      'hinge_deadlift',
      hipThrustKeypoints,
      142,
      'LOCKOUT',
      hipThrustKeypoints.hip,
      'hip_thrust_barbell'
    );
    expect(alertsIncomplete.some(a => a.code === 'HIP_EXTENSION_INCOMPLETE')).toBe(true);

    // 6. Telemetry frame knee angle & lumbar/neck fields
    const frame = evaluateBiomechanicalFrame(
      hipThrustKeypoints,
      'hip_thrust_barbell',
      'LOCKOUT',
      175,
      0,
      'gravity'
    );

    expect(frame.technique.kneeAngleDegrees).toBeGreaterThanOrEqual(80);
    expect(frame.technique.kneeAngleDegrees).toBeLessThanOrEqual(102);
    expect(frame.technique.lumbarNeutral).toBe(true);
    expect(frame.technique.neckNeutral).toBe(true);
    expect(frame.biomechanics.muscleBias).toBe('hip_glute_bias');
    expect(frame.technique.isSpineNeutral).toBe(true);

    // 7. Upright forward-gaze chin-tuck (~125 deg ear-shoulder-hip) must remain neckNeutral
    const uprightChinTuckKp = {
      ...hipThrustKeypoints,
      shoulder: { x: 0.64, y: 0.48 },
      hip: { x: 0.55, y: 0.57 },
      ear: { x: 0.63, y: 0.36 }
    };
    const chinTuckFrame = evaluateBiomechanicalFrame(
      uprightChinTuckKp,
      'hip_thrust_barbell',
      'CONCENTRIC',
      140,
      20,
      'gravity'
    );
    expect(chinTuckFrame.technique.neckNeutral).toBe(true);

    // 8. Framing quality detector flags close-up plate-collapsed torso & accepts well-framed video
    const goodFraming = assessFramingQuality({
      shoulder: { x: 0.64, y: 0.48, visibility: 0.9 },
      hip: { x: 0.55, y: 0.57, visibility: 0.9 },
      knee: { x: 0.37, y: 0.52, visibility: 0.9 },
      ankle: { x: 0.31, y: 0.78, visibility: 0.9 }
    }, 'hip_thrust_barbell');
    expect(goodFraming.isValid).toBe(true);

    const collapsedCloseFraming = assessFramingQuality({
      shoulder: { x: 0.46, y: 0.49, visibility: 0.8 },
      hip: { x: 0.45, y: 0.48, visibility: 0.8 },
      knee: { x: 0.35, y: 0.48, visibility: 0.8 },
      ankle: { x: 0.35, y: 0.75, visibility: 0.8 }
    }, 'hip_thrust_barbell');
    expect(collapsedCloseFraming.isValid).toBe(false);
    expect(collapsedCloseFraming.message).toContain('Aleja más');
  });

  it('evaluates Chest Press load vector at hand grip, ~90° hand-elbow alignment, safe elbow drop, frontal spine neutrality and foot leg drive', () => {
    const tracker: FootStabilityState = {};

    // 1. Ideal Frontal Converging Chest Press
    const idealPressKp = {
      left_shoulder: { x: 0.60, y: 0.38 },
      right_shoulder: { x: 0.40, y: 0.38 },
      left_elbow: { x: 0.66, y: 0.45 },
      right_elbow: { x: 0.34, y: 0.45 },
      left_wrist: { x: 0.65, y: 0.42 },
      right_wrist: { x: 0.35, y: 0.42 },
      left_hip: { x: 0.56, y: 0.60 },
      right_hip: { x: 0.44, y: 0.60 },
      left_ankle: { x: 0.58, y: 0.88, visibility: 0.9 },
      right_ankle: { x: 0.42, y: 0.88, visibility: 0.9 },
      ear: { x: 0.44, y: 0.28 },
      shoulder: { x: 0.60, y: 0.38 },
      elbow: { x: 0.66, y: 0.45 },
      wrist: { x: 0.65, y: 0.42 },
      hip: { x: 0.56, y: 0.60 }
    };

    const frame = evaluateBiomechanicalFrame(
      idealPressKp,
      'converging_chest_press_machine',
      'CONCENTRIC',
      125,
      15,
      'machine',
      'chest',
      1000,
      14,
      tracker
    );

    // Red load force line must anchor directly at wrist/hand grip, NOT midpoint to shoulder
    expect(frame.biomechanics.loadPosition.x).toBeCloseTo(idealPressKp.wrist.x);
    expect(frame.biomechanics.loadPosition.y).toBeCloseTo(idealPressKp.wrist.y);

    // Frontal spine symmetry must remain neutral (no false unilateral ear-shoulder break)
    expect(frame.technique.isSpineNeutral).toBe(true);

    // Press specific metrics
    const pressEval = frame.biomechanics.pressEvaluation!;
    expect(pressEval.handElbowAlignment).toBe('aligned_90');
    expect(pressEval.elbowShoulderPosition).toBe('optimal_below_shoulder');
    expect(pressEval.footStabilityStatus).toBe('stable_leg_drive');
    expect(evaluatePressVerdict(pressEval).isOptimal).toBe(true);

    // 2. Closed hand inside elbow -> Triceps involvement
    const closedPressKp = {
      ...idealPressKp,
      left_wrist: { x: 0.60, y: 0.42 },
      right_wrist: { x: 0.40, y: 0.42 }
    };
    const closedEval = evaluatePressBiomechanics(closedPressKp, 'frontal', tracker);
    expect(closedEval.handElbowAlignment).toBe('closed_triceps');
    expect(evaluatePressVerdict(closedEval).verdictTitle).toContain('Tríceps');

    // 3. Elbow raised at shoulder level -> Shoulder risk
    const highElbowKp = {
      ...idealPressKp,
      left_elbow: { x: 0.69, y: 0.37 },
      right_elbow: { x: 0.31, y: 0.37 }
    };
    const highElbowEval = evaluatePressBiomechanics(highElbowKp, 'frontal', tracker);
    expect(highElbowEval.elbowShoulderPosition).toBe('high_shoulder_risk');
    expect(evaluatePressVerdict(highElbowEval).isOptimal).toBe(false);

    // 4. Lifting foot off floor breaks leg drive stability
    const liftedFootKp = {
      ...idealPressKp,
      left_ankle: { x: 0.58, y: 0.80, visibility: 0.9 } // lifted upward
    };
    const liftedEval = evaluatePressBiomechanics(liftedFootKp, 'frontal', tracker);
    expect(liftedEval.footStabilityStatus).toBe('foot_lifted');

    // 5. Shifting foot position horizontally across reps triggers instability alert
    const shiftedFootKp = {
      ...idealPressKp,
      right_ankle: { x: 0.33, y: 0.88, visibility: 0.9 } // slid horizontally
    };
    const shiftedEval = evaluatePressBiomechanics(shiftedFootKp, 'frontal', tracker);
    expect(shiftedEval.footStabilityStatus).toBe('foot_shifted');
  });
});
