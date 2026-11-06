/**
 * Biomechanical Finite State Machine (FSM) with Hysteresis
 *
 * Implements a 4-phase state machine driven by angular position and sustained
 * angular velocity (dθ/dt) to eliminate false state transitions, micro-stutters,
 * and premature repetition counting.
 *
 * Phases:
 * - LOCKOUT / TOP: Starting joint angle or locked out finish.
 * - ECCENTRIC: Controlled yielding / lengthening under tension.
 * - BOTTOM / INFLECTION: Direction reversal / peak excursion / stretch pause.
 * - CONCENTRIC: Acceleration and propulsive phase back toward lockout.
 */

export type FsmPhase = 'LOCKOUT' | 'ECCENTRIC' | 'BOTTOM' | 'CONCENTRIC';

export interface RepTempoMetrics {
  eccentricDurationSeconds: number;
  bottomPauseDurationSeconds: number;
  concentricDurationSeconds: number;
  totalDurationSeconds: number;
  tempoString: string; // e.g. "3-1-1"
}

export interface CompletedRepetition {
  repIndex: number;
  isValid: boolean;
  tempo: RepTempoMetrics;
  minAngle: number;
  maxAngle: number;
  romExcursion: number;
  startAngle: number;
  endAngle: number;
  peakEccentricVelocityDegPerSec: number;
  peakConcentricVelocityDegPerSec: number;
  bottomBounceDetected: boolean;
  completionTimestamp: number;
}

export interface FsmConfig {
  trackingMode: 'descending' | 'ascending'; // descending = angle decreases during eccentric (e.g. Squat); ascending = angle increases during eccentric (e.g. Triceps ext)
  lockoutThreshold: number;   // Nominal angle at full extension (e.g. 165°)
  inflectionThreshold: number;// Target angle at bottom (e.g. 90°)
  hysteresisAngleBand: number;// Minimum angle excursion to trigger phase exit (e.g. 8°)
  velocityThresholdDegPerSec: number; // Angular velocity threshold (e.g. 15°/s)
  minPhaseDurationMs: number; // Minimum duration in a phase before transition is eligible (e.g. 120ms)
  bounceThresholdMs: number;  // Pause less than this is considered a bounce (e.g. 150ms)
}

export class BiomechanicalFSM {
  private phase: FsmPhase = 'LOCKOUT';
  private phaseStartTime: number = 0;
  private repStartTime: number = 0;
  private eccentricStartTime: number = 0;
  private bottomStartTime: number = 0;
  private concentricStartTime: number = 0;

  private minAngleInRep: number = 180;
  private maxAngleInRep: number = 0;
  private startAngleInRep: number = 180;
  private calibratedTopAngle: number = 165;

  private peakEccentricVelocity: number = 0;
  private peakConcentricVelocity: number = 0;

  private completedReps: CompletedRepetition[] = [];
  private lastRepEndTime: number = -999999;

  // Smoothing for angular velocity
  private prevAngle: number = 165;
  private prevTimestamp: number = 0;
  private smoothedVelocity: number = 0;

  // Frame persistence counters for hysteresis
  private consecutiveVelFrames: number = 0;

  constructor(private config: FsmConfig) {
    this.calibratedTopAngle = config.lockoutThreshold;
    this.minAngleInRep = config.lockoutThreshold;
    this.maxAngleInRep = config.lockoutThreshold;
  }

  public getPhase(): FsmPhase {
    return this.phase;
  }

  public getSmoothedVelocity(): number {
    return this.smoothedVelocity;
  }

  public getCompletedReps(): CompletedRepetition[] {
    return this.completedReps;
  }

  public reset(): void {
    this.phase = 'LOCKOUT';
    this.phaseStartTime = 0;
    this.repStartTime = 0;
    this.eccentricStartTime = 0;
    this.bottomStartTime = 0;
    this.concentricStartTime = 0;
    this.minAngleInRep = this.config.lockoutThreshold;
    this.maxAngleInRep = this.config.lockoutThreshold;
    this.startAngleInRep = this.config.lockoutThreshold;
    this.calibratedTopAngle = this.config.lockoutThreshold;
    this.peakEccentricVelocity = 0;
    this.peakConcentricVelocity = 0;
    this.completedReps = [];
    this.lastRepEndTime = -999999;
    this.prevAngle = this.config.lockoutThreshold;
    this.prevTimestamp = 0;
    this.smoothedVelocity = 0;
    this.consecutiveVelFrames = 0;
  }

  /**
   * Process a new stabilized joint angle frame with timestamp.
   * Returns a newly completed rep if this frame finished a rep, or null.
   */
  public update(currentAngle: number, timestampMs: number): CompletedRepetition | null {
    if (this.prevTimestamp === 0 || timestampMs <= this.prevTimestamp) {
      this.prevAngle = currentAngle;
      this.prevTimestamp = timestampMs;
      return null;
    }

    const dtSec = Math.max((timestampMs - this.prevTimestamp) / 1000, 0.005);
    const rawVelocity = (currentAngle - this.prevAngle) / dtSec; // deg/s (+ increasing, - decreasing)

    // EMA smoothing on angular velocity
    this.smoothedVelocity = 0.65 * rawVelocity + 0.35 * this.smoothedVelocity;
    this.prevAngle = currentAngle;
    this.prevTimestamp = timestampMs;

    const isDescendingMode = this.config.trackingMode === 'descending';
    const phaseElapsedMs = timestampMs - this.phaseStartTime;

    let finishedRep: CompletedRepetition | null = null;

    // Track extremes
    if (currentAngle < this.minAngleInRep) this.minAngleInRep = currentAngle;
    if (currentAngle > this.maxAngleInRep) this.maxAngleInRep = currentAngle;

    // State Machine logic with hysteresis
    switch (this.phase) {
      case 'LOCKOUT': {
        // Calibrate top angle when static near top
        if (isDescendingMode) {
          if (currentAngle > this.calibratedTopAngle && currentAngle <= 180) {
            this.calibratedTopAngle = currentAngle;
          }
          // Condition to enter ECCENTRIC:
          // 1. Angle has dropped past hysteresis band
          // 2. Velocity is negative and sustained
          // 3. Cooldown from previous rep (at least 800ms)
          const angleDropped = currentAngle <= this.calibratedTopAngle - this.config.hysteresisAngleBand;
          const velocityDown = this.smoothedVelocity <= -this.config.velocityThresholdDegPerSec;
          const repCooldownOk = (timestampMs - this.lastRepEndTime) >= 700;

          if (velocityDown) {
            this.consecutiveVelFrames++;
          } else {
            this.consecutiveVelFrames = 0;
          }

          if (angleDropped && this.consecutiveVelFrames >= 2 && repCooldownOk) {
            this.transitionTo('ECCENTRIC', timestampMs);
            this.repStartTime = timestampMs;
            this.eccentricStartTime = timestampMs;
            this.startAngleInRep = this.calibratedTopAngle;
            this.minAngleInRep = currentAngle;
            this.maxAngleInRep = this.calibratedTopAngle;
            this.peakEccentricVelocity = Math.abs(this.smoothedVelocity);
            this.peakConcentricVelocity = 0;
          }
        } else {
          // Ascending mode (e.g. triceps flexion -> extension)
          if (currentAngle < this.calibratedTopAngle && currentAngle >= 60) {
            this.calibratedTopAngle = currentAngle;
          }
          const angleRaised = currentAngle >= this.calibratedTopAngle + this.config.hysteresisAngleBand;
          const velocityUp = this.smoothedVelocity >= this.config.velocityThresholdDegPerSec;
          const repCooldownOk = (timestampMs - this.lastRepEndTime) >= 700;

          if (velocityUp) {
            this.consecutiveVelFrames++;
          } else {
            this.consecutiveVelFrames = 0;
          }

          if (angleRaised && this.consecutiveVelFrames >= 2 && repCooldownOk) {
            this.transitionTo('ECCENTRIC', timestampMs);
            this.repStartTime = timestampMs;
            this.eccentricStartTime = timestampMs;
            this.startAngleInRep = this.calibratedTopAngle;
            this.minAngleInRep = this.calibratedTopAngle;
            this.maxAngleInRep = currentAngle;
            this.peakEccentricVelocity = Math.abs(this.smoothedVelocity);
            this.peakConcentricVelocity = 0;
          }
        }
        break;
      }

      case 'ECCENTRIC': {
        const velMag = Math.abs(this.smoothedVelocity);
        if (velMag > this.peakEccentricVelocity) {
          this.peakEccentricVelocity = velMag;
        }

        if (isDescendingMode) {
          // Transition to BOTTOM when:
          // Angle approaches inflection OR velocity slows near zero/reverses
          const reachedDepth = currentAngle <= this.config.inflectionThreshold + 8;
          const velocityStalledOrReversed = this.smoothedVelocity >= -8;

          if (phaseElapsedMs >= this.config.minPhaseDurationMs && (reachedDepth || velocityStalledOrReversed)) {
            this.transitionTo('BOTTOM', timestampMs);
            this.bottomStartTime = timestampMs;
          }
        } else {
          const reachedPeak = currentAngle >= this.config.inflectionThreshold - 8;
          const velocityStalledOrReversed = this.smoothedVelocity <= 8;

          if (phaseElapsedMs >= this.config.minPhaseDurationMs && (reachedPeak || velocityStalledOrReversed)) {
            this.transitionTo('BOTTOM', timestampMs);
            this.bottomStartTime = timestampMs;
          }
        }
        break;
      }

      case 'BOTTOM': {
        // In BOTTOM phase, we measure dwell time (stretch pause)
        if (isDescendingMode) {
          // Transition to CONCENTRIC when velocity becomes clearly positive
          const velocityUp = this.smoothedVelocity >= this.config.velocityThresholdDegPerSec;
          const angleRebounded = currentAngle >= this.minAngleInRep + 6;

          if (velocityUp || angleRebounded) {
            this.transitionTo('CONCENTRIC', timestampMs);
            this.concentricStartTime = timestampMs;
          }
        } else {
          const velocityDown = this.smoothedVelocity <= -this.config.velocityThresholdDegPerSec;
          const angleRebounded = currentAngle <= this.maxAngleInRep - 6;

          if (velocityDown || angleRebounded) {
            this.transitionTo('CONCENTRIC', timestampMs);
            this.concentricStartTime = timestampMs;
          }
        }
        break;
      }

      case 'CONCENTRIC': {
        const velMag = Math.abs(this.smoothedVelocity);
        if (velMag > this.peakConcentricVelocity) {
          this.peakConcentricVelocity = velMag;
        }

        if (isDescendingMode) {
          // Rep finishes when angle returns near lockout
          const reachedTop = currentAngle >= this.calibratedTopAngle - this.config.hysteresisAngleBand ||
            currentAngle >= this.config.lockoutThreshold - 10;
          const totalExcursion = this.calibratedTopAngle - this.minAngleInRep;

          if (phaseElapsedMs >= this.config.minPhaseDurationMs && reachedTop && totalExcursion >= 25) {
            finishedRep = this.finalizeRep(currentAngle, timestampMs);
            this.transitionTo('LOCKOUT', timestampMs);
            this.lastRepEndTime = timestampMs;
          }
        } else {
          const reachedTop = currentAngle <= this.calibratedTopAngle + this.config.hysteresisAngleBand ||
            currentAngle <= this.config.lockoutThreshold + 10;
          const totalExcursion = this.maxAngleInRep - this.calibratedTopAngle;

          if (phaseElapsedMs >= this.config.minPhaseDurationMs && reachedTop && totalExcursion >= 25) {
            finishedRep = this.finalizeRep(currentAngle, timestampMs);
            this.transitionTo('LOCKOUT', timestampMs);
            this.lastRepEndTime = timestampMs;
          }
        }
        break;
      }
    }

    return finishedRep;
  }

  private transitionTo(newPhase: FsmPhase, timestampMs: number): void {
    this.phase = newPhase;
    this.phaseStartTime = timestampMs;
    this.consecutiveVelFrames = 0;
  }

  private finalizeRep(endAngle: number, timestampMs: number): CompletedRepetition {
    const isDescending = this.config.trackingMode === 'descending';
    const eccDuration = Math.max(0.3, Math.round(((this.bottomStartTime - this.eccentricStartTime) / 1000) * 10) / 10);
    const bottomPauseDuration = Math.max(0.0, Math.round(((this.concentricStartTime - this.bottomStartTime) / 1000) * 10) / 10);
    const conDuration = Math.max(0.3, Math.round(((timestampMs - this.concentricStartTime) / 1000) * 10) / 10);
    const totalDuration = Math.round((eccDuration + bottomPauseDuration + conDuration) * 10) / 10;

    const tempoString = `${eccDuration.toFixed(1)}s - ${bottomPauseDuration.toFixed(1)}s - ${conDuration.toFixed(1)}s`;

    const romExcursion = isDescending
      ? (this.startAngleInRep - this.minAngleInRep)
      : (this.maxAngleInRep - this.startAngleInRep);

    const isRomFull = isDescending
      ? this.minAngleInRep <= this.config.inflectionThreshold + 6
      : this.maxAngleInRep >= this.config.inflectionThreshold - 6;

    const bottomBounceDetected = (this.concentricStartTime - this.bottomStartTime) < this.config.bounceThresholdMs;

    const repRecord: CompletedRepetition = {
      repIndex: this.completedReps.length + 1,
      isValid: isRomFull && romExcursion >= 30,
      tempo: {
        eccentricDurationSeconds: eccDuration,
        bottomPauseDurationSeconds: bottomPauseDuration,
        concentricDurationSeconds: conDuration,
        totalDurationSeconds: totalDuration,
        tempoString
      },
      minAngle: Math.round(this.minAngleInRep),
      maxAngle: Math.round(this.maxAngleInRep),
      romExcursion: Math.round(romExcursion),
      startAngle: Math.round(this.startAngleInRep),
      endAngle: Math.round(endAngle),
      peakEccentricVelocityDegPerSec: Math.round(this.peakEccentricVelocity),
      peakConcentricVelocityDegPerSec: Math.round(this.peakConcentricVelocity),
      bottomBounceDetected,
      completionTimestamp: timestampMs
    };

    this.completedReps.push(repRecord);
    return repRecord;
  }
}
