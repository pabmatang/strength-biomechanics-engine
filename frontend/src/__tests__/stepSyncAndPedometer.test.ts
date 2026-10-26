import { describe, it, expect } from 'vitest';
import { DailyStepEntry, CardioSession } from '../types/workout';

// Conversion helpers from pedometer
function stepsToDistanceKm(steps: number, strideLengthMeters: number = 0.76): number {
  return parseFloat(((steps * strideLengthMeters) / 1000).toFixed(2));
}

function stepsToActiveCalories(steps: number, weightKg: number = 78): number {
  // Standard MET formula: ~0.04 kcal per step for a 75-80kg individual
  const kcalPerStep = (weightKg / 78) * 0.04;
  return Math.round(steps * kcalPerStep);
}

function calculateCardioSessionCalories(session: {
  activity_type: string;
  duration_minutes: number;
  weightKg: number;
  incline_percentage?: number;
  speed_kmh?: number;
}): number {
  const { activity_type, duration_minutes, weightKg, incline_percentage = 0, speed_kmh = 5 } = session;

  if (activity_type === 'incline_treadmill') {
    // ACSM formula for walking on incline:
    // VO2 = (0.1 * S) + (1.8 * S * G) + 3.5 where S in m/min, G is grade fraction
    const speedMMin = (speed_kmh * 1000) / 60;
    const grade = incline_percentage / 100;
    const vo2 = 0.1 * speedMMin + 1.8 * speedMMin * grade + 3.5;
    const kcalPerMin = (vo2 * weightKg) / 200;
    return Math.round(kcalPerMin * duration_minutes);
  } else if (activity_type === 'bike') {
    // Moderate stationary cycling ~7 METs
    const kcalPerMin = (7 * 3.5 * weightKg) / 200;
    return Math.round(kcalPerMin * duration_minutes);
  }
  // Default moderate cardio ~6.5 METs
  return Math.round(((6.5 * 3.5 * weightKg) / 200) * duration_minutes);
}

describe('Step Synchronization, Pedometer & Cardio Logging Engine', () => {
  it('converts step counts to accurate walking distance in kilometers', () => {
    // 10,000 steps with 0.76m average stride length = 7.60 km
    expect(stepsToDistanceKm(10000, 0.76)).toBe(7.6);
    expect(stepsToDistanceKm(5000, 0.76)).toBe(3.8);
    expect(stepsToDistanceKm(12500, 0.76)).toBe(9.5);
  });

  it('calculates active calories burned from step volume and user weight', () => {
    // 10,000 steps for 78kg = 400 kcal
    expect(stepsToActiveCalories(10000, 78)).toBe(400);

    // Heavier person burns slightly more per step
    expect(stepsToActiveCalories(10000, 90)).toBeGreaterThan(400);

    // Lighter person burns slightly less
    expect(stepsToActiveCalories(10000, 60)).toBeLessThan(400);
  });

  it('calculates energy expenditure for incline treadmill cardio session (ACSM formula)', () => {
    // 30 min at 10% incline and 5.0 km/h for a 78kg athlete
    const cals = calculateCardioSessionCalories({
      activity_type: 'incline_treadmill',
      duration_minutes: 30,
      weightKg: 78,
      incline_percentage: 10,
      speed_kmh: 5.0
    });

    // Should burn approximately 290-310 kcal (high efficiency fat-burn without joint impact)
    expect(cals).toBeGreaterThanOrEqual(280);
    expect(cals).toBeLessThanOrEqual(320);
  });

  it('calculates energy expenditure for stationary cycling session', () => {
    const cals = calculateCardioSessionCalories({
      activity_type: 'bike',
      duration_minutes: 25,
      weightKg: 78
    });

    // 25 min at 7 METs for 78kg = ~239 kcal
    expect(cals).toBeCloseTo(239, -1);
  });

  it('computes rolling weekly step average from history entries', () => {
    const stepHistory: DailyStepEntry[] = [
      { id: 's1', date: '2026-10-25', steps: 11200, distance_km: 8.5, active_calories: 448, source: 'Sensor del Dispositivo' },
      { id: 's2', date: '2026-10-24', steps: 9500, distance_km: 7.2, active_calories: 380, source: 'Sensor del Dispositivo' },
      { id: 's3', date: '2026-10-23', steps: 12000, distance_km: 9.1, active_calories: 480, source: 'Sensor del Dispositivo' },
      { id: 's4', date: '2026-10-22', steps: 8300, distance_km: 6.3, active_calories: 332, source: 'Sensor del Dispositivo' },
      { id: 's5', date: '2026-10-21', steps: 10500, distance_km: 8.0, active_calories: 420, source: 'Sensor del Dispositivo' },
      { id: 's6', date: '2026-10-20', steps: 9800, distance_km: 7.4, active_calories: 392, source: 'Sensor del Dispositivo' },
      { id: 's7', date: '2026-10-19', steps: 10200, distance_km: 7.7, active_calories: 408, source: 'Sensor del Dispositivo' }
    ];

    const totalSteps = stepHistory.reduce((sum, e) => sum + e.steps, 0);
    const avgSteps = Math.round(totalSteps / stepHistory.length);

    expect(avgSteps).toBe(10214);
    expect(avgSteps).toBeGreaterThanOrEqual(10000); // Met 10k step daily standard
  });
});
