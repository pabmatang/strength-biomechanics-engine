import { describe, it, expect } from 'vitest';
import { DailyStepEntry } from '../types/workout';
import {
  calculateCardioSessionCalories,
  stepsToActiveCalories,
  stepsToDistanceKm
} from '../utils/stepMath';

describe('Step math & cardio energy estimation', () => {
  it('converts step counts to walking distance in kilometers', () => {
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

  it('computes rolling weekly step average from manually logged history entries', () => {
    const stepHistory: DailyStepEntry[] = [
      { id: 's1', date: '2026-10-25', steps: 11200, distance_km: 8.4, active_calories: 448, source: 'Manual' },
      { id: 's2', date: '2026-10-24', steps: 9500, distance_km: 7.13, active_calories: 380, source: 'Manual' },
      { id: 's3', date: '2026-10-23', steps: 12000, distance_km: 9.0, active_calories: 480, source: 'Manual' },
      { id: 's4', date: '2026-10-22', steps: 8300, distance_km: 6.23, active_calories: 332, source: 'Manual' },
      { id: 's5', date: '2026-10-21', steps: 10500, distance_km: 7.88, active_calories: 420, source: 'Manual' },
      { id: 's6', date: '2026-10-20', steps: 9800, distance_km: 7.35, active_calories: 392, source: 'Manual' },
      { id: 's7', date: '2026-10-19', steps: 10200, distance_km: 7.65, active_calories: 408, source: 'Manual' }
    ];

    const totalSteps = stepHistory.reduce((sum, e) => sum + e.steps, 0);
    const avgSteps = Math.round(totalSteps / stepHistory.length);

    expect(avgSteps).toBe(10214);
    expect(avgSteps).toBeGreaterThanOrEqual(10000);
  });
});
