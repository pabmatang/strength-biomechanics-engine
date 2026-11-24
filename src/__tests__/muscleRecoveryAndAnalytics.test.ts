import { describe, it, expect } from 'vitest';
import { Workout } from '../types/workout';
import { calculate1RM } from '../utils/fitness';

function evaluateMuscleRecovery(nowMs: number, lastTrainedMs: number | null): {
  hoursAgo: number | null;
  status: 'fresh' | 'ready' | 'recovering' | 'fatigued' | 'untrained';
  label: string;
} {
  if (!lastTrainedMs) {
    return { hoursAgo: null, status: 'untrained', label: 'Sin registros previos' };
  }

  const hoursAgo = Math.max(0, Math.round((nowMs - lastTrainedMs) / (3600 * 1000)));

  if (hoursAgo < 24) {
    return { hoursAgo, status: 'fatigued', label: `Descanso: ${hoursAgo}h • Fatiga aguda (Inflamación)` };
  } else if (hoursAgo < 48) {
    return { hoursAgo, status: 'recovering', label: `Descanso: ${hoursAgo}h • En recuperación activa` };
  } else if (hoursAgo <= 96) {
    const days = Math.floor(hoursAgo / 24);
    return { hoursAgo, status: 'ready', label: `Descanso: ${hoursAgo}h (${days}d) • Supercompensado (Listo)` };
  } else {
    const days = Math.floor(hoursAgo / 24);
    return { hoursAgo, status: 'fresh', label: `Descanso: ${days} días • Totalmente recuperado` };
  }
}

function calculateMuscleTonnageAndFrequency(muscle: string, workouts: Workout[], windowDays: number = 7): {
  effectiveSets: number;
  totalTonnageKg: number;
  frequency: number;
  avgRpe: number | null;
} {
  const now = Date.now();
  const windowMs = windowDays * 24 * 3600 * 1000;
  const recentWorkouts = workouts.filter(w => (now - new Date(w.start_time).getTime()) <= windowMs);

  let effectiveSets = 0;
  let totalTonnageKg = 0;
  const trainingDays = new Set<string>();
  const rpeList: number[] = [];

  recentWorkouts.forEach(w => {
    let touchedInWorkout = false;
    w.exercises.forEach(ex => {
      if (ex.muscle_group === muscle) {
        ex.sets.forEach(s => {
          if (s.is_completed && s.type !== 'warmup') {
            effectiveSets++;
            totalTonnageKg += (s.weight_kg || 0) * (s.reps || 0);
            touchedInWorkout = true;
            if (s.rpe) rpeList.push(s.rpe);
          }
        });
      }
    });
    if (touchedInWorkout && w.start_time) {
      trainingDays.add(w.start_time.split('T')[0]);
    }
  });

  const avgRpe = rpeList.length > 0 ? Math.round((rpeList.reduce((a, b) => a + b, 0) / rpeList.length) * 10) / 10 : null;

  return {
    effectiveSets,
    totalTonnageKg: Math.round(totalTonnageKg),
    frequency: trainingDays.size,
    avgRpe
  };
}

describe('Muscle Rest Time, Supercompensation & Volume Analytics Engine', () => {
  const now = Date.now();
  const HOUR = 3600 * 1000;

  it('classifies muscle as fatigued (<24h) during acute post-workout inflammatory phase', () => {
    const trained12hAgo = now - 12 * HOUR;
    const res = evaluateMuscleRecovery(now, trained12hAgo);
    expect(res.status).toBe('fatigued');
    expect(res.hoursAgo).toBe(12);
    expect(res.label).toContain('Fatiga aguda');
  });

  it('classifies muscle as recovering (24-48h) during active muscle protein synthesis', () => {
    const trained30hAgo = now - 30 * HOUR;
    const res = evaluateMuscleRecovery(now, trained30hAgo);
    expect(res.status).toBe('recovering');
    expect(res.hoursAgo).toBe(30);
    expect(res.label).toContain('En recuperación activa');
  });

  it('classifies muscle as ready / supercompensated (48-96h) for optimal session timing', () => {
    const trained54hAgo = now - 54 * HOUR;
    const res = evaluateMuscleRecovery(now, trained54hAgo);
    expect(res.status).toBe('ready');
    expect(res.hoursAgo).toBe(54);
    expect(res.label).toContain('Supercompensado');
  });

  it('classifies muscle as fully fresh (>96h) when 4 or more days have elapsed', () => {
    const trained5DaysAgo = now - 120 * HOUR;
    const res = evaluateMuscleRecovery(now, trained5DaysAgo);
    expect(res.status).toBe('fresh');
    expect(res.label).toContain('Totalmente recuperado');
  });

  it('handles muscle with zero workout history as untrained', () => {
    const res = evaluateMuscleRecovery(now, null);
    expect(res.status).toBe('untrained');
    expect(res.hoursAgo).toBeNull();
  });

  it('accurately computes weekly effective sets, tonnage, frequency, and average RPE', () => {
    const sampleHistory: Workout[] = [
      {
        id: 'w1',
        title: 'Push Day 1',
        start_time: new Date(now - 2 * 24 * HOUR).toISOString(),
        end_time: new Date(now - 2 * 24 * HOUR + 3600 * 1000).toISOString(),
        duration_seconds: 3600,
        volume_kg: 1790,
        sets_count: 4,
        personal_records: [],
        exercises: [
          {
            id: 'e1',
            exercise_template_id: 'technogym_pure_chest_press',
            title: 'Technogym Pure Strength Chest Press',
            muscle_group: 'chest',
            equipment_category: 'machine',
            sets: [
              { id: 's1', index: 1, type: 'warmup', weight_kg: 40, reps: 10, is_completed: true }, // warmup excluded!
              { id: 's2', index: 2, type: 'normal', weight_kg: 80, reps: 8, is_completed: true, rpe: 8.0 }, // 640 kg
              { id: 's3', index: 3, type: 'normal', weight_kg: 80, reps: 8, is_completed: true, rpe: 8.5 }, // 640 kg
              { id: 's4', index: 4, type: 'normal', weight_kg: 85, reps: 6, is_completed: true, rpe: 9.5 }  // 510 kg
            ]
          }
        ]
      },
      {
        id: 'w2',
        title: 'Push Day 2',
        start_time: new Date(now - 5 * 24 * HOUR).toISOString(),
        end_time: new Date(now - 5 * 24 * HOUR + 3600 * 1000).toISOString(),
        duration_seconds: 3600,
        volume_kg: 1400,
        sets_count: 2,
        personal_records: [],
        exercises: [
          {
            id: 'e2',
            exercise_template_id: 'hammer_iso_decline',
            title: 'Hammer Strength Incline Press',
            muscle_group: 'chest',
            equipment_category: 'machine',
            sets: [
              { id: 's5', index: 1, type: 'normal', weight_kg: 70, reps: 10, is_completed: true, rpe: 8.0 }, // 700 kg
              { id: 's6', index: 2, type: 'normal', weight_kg: 70, reps: 10, is_completed: true, rpe: 8.5 }  // 700 kg
            ]
          }
        ]
      }
    ];

    const stats = calculateMuscleTonnageAndFrequency('chest', sampleHistory, 7);

    // Effective sets: 3 from w1 (warmup excluded) + 2 from w2 = 5 sets
    expect(stats.effectiveSets).toBe(5);

    // Total Tonnage: 640 + 640 + 510 + 700 + 700 = 3190 kg
    expect(stats.totalTonnageKg).toBe(3190);

    // Frequency: 2 distinct days
    expect(stats.frequency).toBe(2);

    // Average RPE: (8.0 + 8.5 + 9.5 + 8.0 + 8.5) / 5 = 42.5 / 5 = 8.5
    expect(stats.avgRpe).toBe(8.5);
  });

  it('calculates 1 Repetition Max (1RM) using Epley formula with rounding', () => {
    // 100 kg x 1 rep = 100 kg
    expect(calculate1RM(100, 1)).toBe(100);

    // 100 kg x 5 reps = 100 * (1 + 5/30) = 100 * 1.1667 = 116.7 kg
    expect(calculate1RM(100, 5)).toBe(116.7);

    // 80 kg x 10 reps = 80 * (1 + 10/30) = 80 * 1.3333 = 106.7 kg
    expect(calculate1RM(80, 10)).toBe(106.7);

    // Zero edge cases
    expect(calculate1RM(0, 10)).toBe(0);
    expect(calculate1RM(100, 0)).toBe(0);
  });
});
