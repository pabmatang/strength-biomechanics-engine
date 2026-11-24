/**
 * Deterministic estimation helpers for the activity screens.
 *
 * These are estimates, not sensor readings: the app has no pedometer, Health
 * Connect or Apple Health integration, so the inputs always come from manual
 * logging. The formulas are documented so the numbers can be audited.
 */

/** Walking distance from a step count (average stride length, default 0.75 m). */
export function stepsToDistanceKm(steps: number, strideLengthMeters = 0.75): number {
  return Math.round(((steps * strideLengthMeters) / 1000) * 100) / 100;
}

/**
 * Active calories from steps. Uses the common ~0.04 kcal/step approximation for
 * a 78 kg adult and scales linearly with body weight.
 */
export function stepsToActiveCalories(steps: number, weightKg = 78): number {
  const kcalPerStep = (weightKg / 78) * 0.04;
  return Math.round(steps * kcalPerStep);
}

export interface CardioEnergyInput {
  activity_type: string;
  duration_minutes: number;
  weightKg: number;
  incline_percentage?: number;
  speed_kmh?: number;
}

/**
 * MET/ACSM-based energy expenditure estimate for logged cardio sessions.
 *
 * - Incline treadmill: ACSM walking equation
 *   VO2 = 0.1·S + 1.8·S·G + 3.5 (S in m/min, G as grade fraction)
 * - Stationary bike: ~7 METs
 * - Anything else: ~6.5 METs (moderate cardio)
 *
 * kcal/min = VO2 · weightKg / 200
 */
export function calculateCardioSessionCalories(session: CardioEnergyInput): number {
  const { activity_type, duration_minutes, weightKg, incline_percentage = 0, speed_kmh = 5 } = session;
  let kcalPerMinute: number;

  if (activity_type === 'incline_treadmill') {
    const speedMetersPerMinute = (speed_kmh * 1000) / 60;
    const grade = incline_percentage / 100;
    const vo2 = 0.1 * speedMetersPerMinute + 1.8 * speedMetersPerMinute * grade + 3.5;
    kcalPerMinute = (vo2 * weightKg) / 200;
  } else if (activity_type === 'bike') {
    kcalPerMinute = (7 * 3.5 * weightKg) / 200;
  } else {
    kcalPerMinute = (6.5 * 3.5 * weightKg) / 200;
  }

  return Math.round(kcalPerMinute * duration_minutes);
}
