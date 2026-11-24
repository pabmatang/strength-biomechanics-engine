import { describe, it, expect } from 'vitest';
import { calculate1RM, calculateWorkoutVolume, countCompletedSets } from '../utils/fitness';
import { WorkoutExercise } from '../types/workout';

describe('Fitness Calculation Engine (1RM & Volume)', () => {
  describe('calculate1RM (Epley Formula)', () => {
    it('returns exact weight for a single rep (reps = 1)', () => {
      expect(calculate1RM(100, 1)).toBe(100);
      expect(calculate1RM(140, 1)).toBe(140);
    });

    it('returns 0 for non-positive reps or non-positive weight', () => {
      expect(calculate1RM(0, 10)).toBe(0);
      expect(calculate1RM(100, 0)).toBe(0);
      expect(calculate1RM(-50, 5)).toBe(0);
    });

    it('accurately computes estimated 1RM for standard rep ranges', () => {
      // 100kg x 10 reps = 100 * (1 + 10/30) = 133.3 kg
      expect(calculate1RM(100, 10)).toBe(133.3);
      // 80kg x 6 reps = 80 * (1 + 6/30) = 96.0 kg
      expect(calculate1RM(80, 6)).toBe(96);
    });
  });

  describe('calculateWorkoutVolume', () => {
    it('excludes warmup sets from total volume load', () => {
      const mockExercises: WorkoutExercise[] = [
        {
          id: 'ex_1',
          exercise_template_id: 'technogym_pure_chest_press',
          title: 'Technogym Pure Strength Chest Press',
          muscle_group: 'chest',
          equipment_category: 'machine',
          exercise_type: 'weight_reps',
          sets: [
            { id: 's1', index: 0, type: 'warmup', weight_kg: 40, reps: 15, is_completed: true, rpe: 6 },
            { id: 's2', index: 1, type: 'normal', weight_kg: 80, reps: 10, is_completed: true, rpe: 9 }, // 800 kg
            { id: 's3', index: 2, type: 'normal', weight_kg: 85, reps: 8, is_completed: true, rpe: 9.5 }  // 680 kg
          ]
        }
      ];

      // Total expected: 800 + 680 = 1480 kg (warmup excluded)
      expect(calculateWorkoutVolume(mockExercises)).toBe(1480);
    });

    it('excludes uncompleted sets from total volume', () => {
      const mockExercises: WorkoutExercise[] = [
        {
          id: 'ex_2',
          exercise_template_id: 'technogym_pure_pulldown',
          title: 'Technogym Pure Strength Pulldown',
          muscle_group: 'lats',
          equipment_category: 'machine',
          exercise_type: 'weight_reps',
          sets: [
            { id: 's1', index: 0, type: 'normal', weight_kg: 70, reps: 10, is_completed: true }, // 700
            { id: 's2', index: 1, type: 'normal', weight_kg: 75, reps: 10, is_completed: false } // ignored
          ]
        }
      ];

      expect(calculateWorkoutVolume(mockExercises)).toBe(700);
    });
  });

  describe('countCompletedSets', () => {
    it('accurately counts only completed sets', () => {
      const mockExercises: WorkoutExercise[] = [
        {
          id: 'ex_1',
          exercise_template_id: 'squat',
          title: 'Hack Squat',
          muscle_group: 'quadriceps',
          equipment_category: 'machine',
          exercise_type: 'weight_reps',
          sets: [
            { id: 's1', index: 0, type: 'warmup', weight_kg: 50, reps: 10, is_completed: true },
            { id: 's2', index: 1, type: 'normal', weight_kg: 100, reps: 8, is_completed: true },
            { id: 's3', index: 2, type: 'normal', weight_kg: 120, reps: 6, is_completed: false }
          ]
        }
      ];

      expect(countCompletedSets(mockExercises)).toBe(2);
    });
  });
});
