import { describe, it, expect, beforeEach } from 'vitest';
import { OneEuroFilter, PoseLandmarkSmoother } from '../utils/oneEuroFilter';
import { BiomechanicalFSM } from '../utils/biomechanicalFSM';
import {
  perpendicularDistanceToLine,
  projectPointOntoLine,
  calculateTibialAngle,
  calculateSpineAlignment,
  evaluateBiomechanicalFrame,
  auditCompletedRepetition
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
});
