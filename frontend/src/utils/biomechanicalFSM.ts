/**
 * Biomechanical Finite State Machine (FSM) & Repetition Counter
 *
 * Implements a non-blocking 4-phase state machine driven by joint angle θ
 * and smoothed angular velocity (dθ/dt).
 *
 * States:
 * - LOCKOUT: Initial static or extended posture.
 * - ECCENTRIC: Active lowering/yielding phase (dθ/dt < -V_thresh for >= 3 frames).
 * - BOTTOM: Zero-velocity turnaround zone (inflection point). Captures maximum
 *           excursion, peak moment arms, and dwell time.
 * - CONCENTRIC: Ascending propulsion phase (dθ/dt > +V_thresh).
 * - COMPLETION: Return near lockout OR turnaround after >= 35° excursion.
 *
 * Never freezes in CONCENTRIC: incorporates reversal escape hatches and minimum
 * excursion hysteresis (>= 35°-40°) to avoid counting noise or premature stalls.
 */

export type FsmPhase = 'LOCKOUT' | 'ECCENTRIC' | 'BOTTOM' | 'CONCENTRIC';

export interface RepTempoMetrics {
  eccentricDurationSeconds: number;
  bottomPauseDurationSeconds: number;
  concentricDurationSeconds: number;
  totalDurationSeconds: number;
  tempoString: string; // e.g. "3.0s - 0.8s - 1.2s"
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
  trackingMode: 'descending' | 'ascending';
  lockoutThreshold: number;       // Nominal angle at full extension (e.g. 165°)
  inflectionThreshold: number;    // Target angle at bottom (e.g. 90°)
  hysteresisAngleBand: number;    // Excursion required to start eccentric (e.g. 10°)
  velocityThresholdDegPerSec: number; // e.g. 18°/s
  minPhaseDurationMs: number;     // e.g. 120ms
  bounceThresholdMs: number;      // Pause < 140ms is a bounce
  minRepExcursionDeg: number;     // Minimum 35°-40° net excursion required to register a repetition
}

export const DEFAULT_FSM_CONFIG: FsmConfig = {
  trackingMode: 'descending',
  lockoutThreshold: 165,
  inflectionThreshold: 90,
  hysteresisAngleBand: 10,
  velocityThresholdDegPerSec: 18,
  minPhaseDurationMs: 120,
  bounceThresholdMs: 140,
  minRepExcursionDeg: 35
};

export class BiomechanicalFSM {
  private phase: FsmPhase = 'LOCKOUT';
  private phaseStartTime: number = 0;
  private repStartTime: number = 0;
  private eccentricStartTime: number = 0;
  private bottomStartTime: number = 0;
  private concentricStartTime: number = 0;

  private minAngleInRep: number = 180;
  private maxAngleInRep: number = 0;
  private startAngleInRep: number = 165;
  private calibratedTopAngle: number = 165;

  private peakEccentricVelocity: number = 0;
  private peakConcentricVelocity: number = 0;

  private completedReps: CompletedRepetition[] = [];
  private lastRepEndTime: number = -999999;

  // Angular velocity smoothing (EMA)
  private prevAngle: number = 165;
  private prevTimestamp: number = 0;
  private smoothedVelocity: number = 0;

  // Frame persistence counters for hysteresis
  private consecutiveVelFrames: number = 0;
  private bottomDwellFrames: number = 0;

  private config: FsmConfig;

  constructor(config: Partial<FsmConfig> = {}) {
    this.config = { ...DEFAULT_FSM_CONFIG, ...config };
    this.calibratedTopAngle = this.config.lockoutThreshold;
    this.minAngleInRep = this.config.lockoutThreshold;
    this.maxAngleInRep = this.config.lockoutThreshold;
    this.startAngleInRep = this.config.lockoutThreshold;
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

  public getMinAngleInCurrentRep(): number {
    return this.minAngleInRep;
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
    this.bottomDwellFrames = 0;
  }

  /**
   * Evaluates incoming frame with current angle and monotonic timestamp.
   * Returns newly completed repetition or null.
   */
  public update(currentAngle: number, timestampMs: number): CompletedRepetition | null {
    if (this.prevTimestamp === 0 || timestampMs <= this.prevTimestamp) {
      this.prevAngle = currentAngle;
      this.prevTimestamp = timestampMs;
      return null;
    }

    const dtSec = Math.max((timestampMs - this.prevTimestamp) / 1000, 0.005);
    const rawVelocity = (currentAngle - this.prevAngle) / dtSec; // deg/sec (+ increasing, - decreasing)

    // EMA smoothing on angular velocity: alpha = 0.65
    this.smoothedVelocity = 0.65 * rawVelocity + 0.35 * this.smoothedVelocity;
    this.prevAngle = currentAngle;
    this.prevTimestamp = timestampMs;

    const isDescendingMode = this.config.trackingMode === 'descending';
    const phaseElapsedMs = timestampMs - this.phaseStartTime;

    let finishedRep: CompletedRepetition | null = null;

    // Track extremes in current repetition
    if (currentAngle < this.minAngleInRep) this.minAngleInRep = currentAngle;
    if (currentAngle > this.maxAngleInRep) this.maxAngleInRep = currentAngle;

    switch (this.phase) {
      case 'LOCKOUT': {
        // Calibrate top starting posture when static
        if (isDescendingMode) {
          if (currentAngle > this.calibratedTopAngle && currentAngle <= 180) {
            this.calibratedTopAngle = currentAngle;
          }
          const angleDropped = currentAngle <= this.calibratedTopAngle - this.config.hysteresisAngleBand;
          const velocityDown = this.smoothedVelocity <= -this.config.velocityThresholdDegPerSec;
          const cooldownOk = (timestampMs - this.lastRepEndTime) >= 500;

          if (velocityDown) {
            this.consecutiveVelFrames++;
          } else {
            this.consecutiveVelFrames = 0;
          }

          // Require >= 2-3 frames of sustained downward velocity
          if (angleDropped && this.consecutiveVelFrames >= 2 && cooldownOk) {
            this.transitionTo('ECCENTRIC', timestampMs);
            this.repStartTime = timestampMs;
            this.eccentricStartTime = timestampMs;
            this.startAngleInRep = this.calibratedTopAngle;
            this.minAngleInRep = currentAngle;
            this.maxAngleInRep = this.calibratedTopAngle;
            this.peakEccentricVelocity = Math.abs(this.smoothedVelocity);
            this.peakConcentricVelocity = 0;
            this.bottomDwellFrames = 0;
          }
        } else {
          // Ascending mode
          if (currentAngle < this.calibratedTopAngle && currentAngle >= 60) {
            this.calibratedTopAngle = currentAngle;
          }
          const angleRaised = currentAngle >= this.calibratedTopAngle + this.config.hysteresisAngleBand;
          const velocityUp = this.smoothedVelocity >= this.config.velocityThresholdDegPerSec;
          const cooldownOk = (timestampMs - this.lastRepEndTime) >= 500;

          if (velocityUp) {
            this.consecutiveVelFrames++;
          } else {
            this.consecutiveVelFrames = 0;
          }

          if (angleRaised && this.consecutiveVelFrames >= 2 && cooldownOk) {
            this.transitionTo('ECCENTRIC', timestampMs);
            this.repStartTime = timestampMs;
            this.eccentricStartTime = timestampMs;
            this.startAngleInRep = this.calibratedTopAngle;
            this.minAngleInRep = this.calibratedTopAngle;
            this.maxAngleInRep = currentAngle;
            this.peakEccentricVelocity = Math.abs(this.smoothedVelocity);
            this.peakConcentricVelocity = 0;
            this.bottomDwellFrames = 0;
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
          // Bottom inflection is entered when:
          // 1. Angle reaches deep inflection zone AND velocity stalls (|velocity| <= 15 deg/s or reverses)
          // 2. OR velocity definitively reverses upward (smoothedVelocity > 0)
          const nearDepth = currentAngle <= this.config.inflectionThreshold + 18;
          const velocityStalled = this.smoothedVelocity >= -15;
          const velocityReversed = this.smoothedVelocity > 5;

          if (phaseElapsedMs >= this.config.minPhaseDurationMs && ((nearDepth && velocityStalled) || velocityReversed)) {
            this.transitionTo('BOTTOM', timestampMs);
            this.bottomStartTime = timestampMs;
            this.bottomDwellFrames = 0;
          }
        } else {
          const nearPeak = currentAngle >= this.config.inflectionThreshold - 18;
          const velocityStalled = this.smoothedVelocity <= 15;
          const velocityReversed = this.smoothedVelocity < -5;

          if (phaseElapsedMs >= this.config.minPhaseDurationMs && ((nearPeak && velocityStalled) || velocityReversed)) {
            this.transitionTo('BOTTOM', timestampMs);
            this.bottomStartTime = timestampMs;
            this.bottomDwellFrames = 0;
          }
        }
        break;
      }

      case 'BOTTOM': {
        this.bottomDwellFrames++;

        if (isDescendingMode) {
          // Transition to CONCENTRIC when velocity becomes positive and sustained
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
          const totalExcursion = this.startAngleInRep - this.minAngleInRep;
          // Normal Lockout Completion:
          // Returns within 15° of start or reaches lockout threshold
          const reachedLockout = currentAngle >= this.calibratedTopAngle - 15 ||
            currentAngle >= this.config.lockoutThreshold - 18;

          // REVERSAL ESCAPE HATCH (Anti-freeze):
          // If athlete ascended significantly (>= 35° excursion from bottom) and starts descending again
          // (smoothedVelocity <= -15), finalize previous rep immediately so counter NEVER gets stuck!
          const ascendedFar = (currentAngle - this.minAngleInRep) >= this.config.minRepExcursionDeg;
          const reDescending = this.smoothedVelocity <= -this.config.velocityThresholdDegPerSec;

          if ((phaseElapsedMs >= this.config.minPhaseDurationMs && reachedLockout && totalExcursion >= this.config.minRepExcursionDeg) ||
              (phaseElapsedMs >= 300 && ascendedFar && reDescending)) {
            finishedRep = this.finalizeRep(currentAngle, timestampMs);
            this.transitionTo(reDescending ? 'ECCENTRIC' : 'LOCKOUT', timestampMs);
            this.lastRepEndTime = timestampMs;
            if (reDescending) {
              this.startAngleInRep = currentAngle;
              this.minAngleInRep = currentAngle;
            }
          }
        } else {
          const totalExcursion = this.maxAngleInRep - this.startAngleInRep;
          const reachedLockout = currentAngle <= this.calibratedTopAngle + 15 ||
            currentAngle <= this.config.lockoutThreshold + 18;
          const ascendedFar = (this.maxAngleInRep - currentAngle) >= this.config.minRepExcursionDeg;
          const reDescending = this.smoothedVelocity >= this.config.velocityThresholdDegPerSec;

          if ((phaseElapsedMs >= this.config.minPhaseDurationMs && reachedLockout && totalExcursion >= this.config.minRepExcursionDeg) ||
              (phaseElapsedMs >= 300 && ascendedFar && reDescending)) {
            finishedRep = this.finalizeRep(currentAngle, timestampMs);
            this.transitionTo(reDescending ? 'ECCENTRIC' : 'LOCKOUT', timestampMs);
            this.lastRepEndTime = timestampMs;
            if (reDescending) {
              this.startAngleInRep = currentAngle;
              this.maxAngleInRep = currentAngle;
            }
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
      ? this.minAngleInRep <= this.config.inflectionThreshold + 10
      : this.maxAngleInRep >= this.config.inflectionThreshold - 10;

    const bottomBounceDetected = (this.concentricStartTime - this.bottomStartTime) < this.config.bounceThresholdMs;

    const repRecord: CompletedRepetition = {
      repIndex: this.completedReps.length + 1,
      isValid: isRomFull && romExcursion >= this.config.minRepExcursionDeg,
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
