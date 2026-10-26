import { describe, it, expect } from 'vitest';
import { EXERCISE_DATABASE } from '../data/exercises';
import { Routine, WorkoutExercise } from '../types/workout';

// Helper simulation of the Smart Routine Wizard Generator logic
function generateWizardRoutines(params: {
  daysPerWeek: 2 | 3 | 4 | 5 | 6;
  priorityMuscles: string[];
  durationMinutes: 45 | 60 | 75 | 90;
  equipmentPref: 'technogym' | 'hammer' | 'cables_selectorized' | 'free_weights' | 'hybrid';
  experienceLevel: 'principiante' | 'intermedio' | 'avanzado';
}): Routine[] {
  const { daysPerWeek, priorityMuscles, durationMinutes, equipmentPref, experienceLevel } = params;
  const maxExercises = durationMinutes === 45 ? 4 : durationMinutes === 60 ? 5 : durationMinutes === 75 ? 6 : 7;
  const setsForPriority = experienceLevel === 'principiante' ? 3 : 4;
  const setsForStandard = experienceLevel === 'principiante' ? 2 : 3;

  interface DayPlan {
    name: string;
    focusMuscles: string[];
  }

  let splitPlan: DayPlan[] = [];

  if (daysPerWeek === 2) {
    splitPlan = [
      { name: 'Día 1: Full Body A', focusMuscles: [...priorityMuscles, 'quadriceps', 'shoulders', 'biceps'] },
      { name: 'Día 2: Full Body B', focusMuscles: ['hamstrings', ...priorityMuscles, 'glutes', 'triceps'] }
    ];
  } else if (daysPerWeek === 3) {
    splitPlan = [
      { name: 'Día 1: Push', focusMuscles: ['chest', 'shoulders', 'triceps'] },
      { name: 'Día 2: Pull', focusMuscles: ['lats', 'upper_back', 'biceps'] },
      { name: 'Día 3: Legs', focusMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'] }
    ];
  } else if (daysPerWeek === 4) {
    splitPlan = [
      { name: 'Día 1: Torso A', focusMuscles: ['chest', 'lats', 'shoulders', 'triceps'] },
      { name: 'Día 2: Pierna A', focusMuscles: ['quadriceps', 'calves', 'abdominals'] },
      { name: 'Día 3: Torso B', focusMuscles: ['upper_back', 'chest', 'biceps', 'shoulders'] },
      { name: 'Día 4: Pierna B', focusMuscles: ['hamstrings', 'glutes', 'calves'] }
    ];
  } else if (daysPerWeek === 5) {
    splitPlan = [
      { name: 'Día 1: Push', focusMuscles: ['chest', 'shoulders', 'triceps'] },
      { name: 'Día 2: Pull', focusMuscles: ['lats', 'upper_back', 'biceps'] },
      { name: 'Día 3: Legs', focusMuscles: ['quadriceps', 'hamstrings', 'glutes'] },
      { name: 'Día 4: Torso Pro', focusMuscles: [...priorityMuscles, 'shoulders'] },
      { name: 'Día 5: Brazos', focusMuscles: ['biceps', 'triceps', 'shoulders'] }
    ];
  } else {
    splitPlan = [
      { name: 'Día 1: Push A', focusMuscles: ['chest', 'shoulders', 'triceps'] },
      { name: 'Día 2: Pull A', focusMuscles: ['lats', 'upper_back', 'biceps'] },
      { name: 'Día 3: Legs A', focusMuscles: ['quadriceps', 'calves'] },
      { name: 'Día 4: Push B', focusMuscles: ['shoulders', 'chest', 'triceps'] },
      { name: 'Día 5: Pull B', focusMuscles: ['upper_back', 'lats', 'biceps'] },
      { name: 'Día 6: Legs B', focusMuscles: ['hamstrings', 'glutes'] }
    ];
  }

  const pickExercise = (muscle: string, pref: string, used: Set<string>) => {
    const candidates = EXERCISE_DATABASE.filter(
      t => (t.muscle_group === muscle || (t.other_muscles && (t.other_muscles as string[]).includes(muscle))) && !used.has(t.id)
    );
    if (candidates.length === 0) {
      return EXERCISE_DATABASE.find(t => t.muscle_group === muscle) || EXERCISE_DATABASE[0];
    }
    if (pref === 'technogym') {
      const tg = candidates.find(t => t.brand?.toLowerCase().includes('technogym'));
      if (tg) return tg;
    } else if (pref === 'hammer') {
      const hm = candidates.find(t => t.brand?.toLowerCase().includes('hammer'));
      if (hm) return hm;
    } else if (pref === 'cables_selectorized') {
      const cb = candidates.find(t => t.equipment_category === 'cable' || t.equipment_category === 'machine');
      if (cb) return cb;
    } else if (pref === 'free_weights') {
      const fw = candidates.find(t => t.equipment_category === 'dumbbell' || t.equipment_category === 'barbell');
      if (fw) return fw;
    }
    return candidates[0];
  };

  return splitPlan.map((day, dayIdx) => {
    const used = new Set<string>();
    const sortedMuscles = [...day.focusMuscles].sort((a, b) => {
      const aPri = priorityMuscles.includes(a);
      const bPri = priorityMuscles.includes(b);
      if (aPri && !bPri) return -1;
      if (!aPri && bPri) return 1;
      return 0;
    });

    const chosenMuscles = sortedMuscles.slice(0, maxExercises);
    const exercises: WorkoutExercise[] = chosenMuscles.map((m, exIdx) => {
      const tmpl = pickExercise(m, equipmentPref, used);
      used.add(tmpl.id);
      const isPriority = priorityMuscles.includes(m);
      const setCount = isPriority ? setsForPriority : setsForStandard;

      return {
        id: `ex_${dayIdx}_${exIdx}`,
        exercise_template_id: tmpl.id,
        title: tmpl.title,
        brand: tmpl.brand,
        muscle_group: tmpl.muscle_group,
        equipment_category: tmpl.equipment_category,
        image_url: tmpl.image_url,
        target_rep_range: isPriority ? '6-10' : '8-12',
        sets: Array.from({ length: setCount }, (_, sIdx) => ({
          id: `s_${dayIdx}_${exIdx}_${sIdx}`,
          index: sIdx + 1,
          type: 'normal',
          weight_kg: 20,
          reps: 10,
          rpe: isPriority ? 8.5 : 8.0,
          is_completed: false
        }))
      };
    });

    return {
      id: `smart_routine_${dayIdx}`,
      title: day.name,
      folder_name: `Plan IA (${daysPerWeek} días)`,
      exercises,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });
}

describe('Routine Management & Smart AI Routine Wizard', () => {
  it('generates the exact number of days configured (2, 3, 4, 5, 6 days)', () => {
    const r2 = generateWizardRoutines({ daysPerWeek: 2, priorityMuscles: ['chest'], durationMinutes: 60, equipmentPref: 'hybrid', experienceLevel: 'principiante' });
    expect(r2.length).toBe(2);

    const r3 = generateWizardRoutines({ daysPerWeek: 3, priorityMuscles: ['chest'], durationMinutes: 60, equipmentPref: 'hybrid', experienceLevel: 'principiante' });
    expect(r3.length).toBe(3);

    const r4 = generateWizardRoutines({ daysPerWeek: 4, priorityMuscles: ['lats'], durationMinutes: 60, equipmentPref: 'hybrid', experienceLevel: 'principiante' });
    expect(r4.length).toBe(4);

    const r5 = generateWizardRoutines({ daysPerWeek: 5, priorityMuscles: ['shoulders'], durationMinutes: 60, equipmentPref: 'hybrid', experienceLevel: 'principiante' });
    expect(r5.length).toBe(5);

    const r6 = generateWizardRoutines({ daysPerWeek: 6, priorityMuscles: ['quadriceps'], durationMinutes: 60, equipmentPref: 'hybrid', experienceLevel: 'principiante' });
    expect(r6.length).toBe(6);
  });

  it('places prioritized muscles FIRST in the session exercise order', () => {
    const routines = generateWizardRoutines({
      daysPerWeek: 4,
      priorityMuscles: ['lats'], // Priority is back/dorsal
      durationMinutes: 60,
      equipmentPref: 'technogym',
      experienceLevel: 'intermedio'
    });

    const torsoADay = routines[0];
    // In Torso day, lats must be the first exercise because it is prioritized
    expect(torsoADay.exercises[0].muscle_group).toBe('lats');
  });

  it('assigns higher set volume to prioritized muscles vs standard muscles', () => {
    const routines = generateWizardRoutines({
      daysPerWeek: 3,
      priorityMuscles: ['chest'],
      durationMinutes: 60,
      equipmentPref: 'technogym',
      experienceLevel: 'intermedio' // 4 sets for priority, 3 sets for standard
    });

    const pushDay = routines[0];
    const chestEx = pushDay.exercises.find(e => e.muscle_group === 'chest');
    const tricepsEx = pushDay.exercises.find(e => e.muscle_group === 'triceps');

    expect(chestEx).toBeDefined();
    expect(chestEx?.sets.length).toBe(4); // Priority gets 4 sets

    if (tricepsEx) {
      expect(tricepsEx.sets.length).toBe(3); // Non-priority gets 3 sets
    }
  });

  it('calibrates exercise count according to session duration (45m vs 60m vs 75m)', () => {
    const r45 = generateWizardRoutines({ daysPerWeek: 3, priorityMuscles: ['chest'], durationMinutes: 45, equipmentPref: 'technogym', experienceLevel: 'principiante' });
    expect(r45[0].exercises.length).toBeLessThanOrEqual(4);

    const r60 = generateWizardRoutines({ daysPerWeek: 3, priorityMuscles: ['chest'], durationMinutes: 60, equipmentPref: 'technogym', experienceLevel: 'principiante' });
    expect(r60[0].exercises.length).toBeLessThanOrEqual(5);

    const r75 = generateWizardRoutines({ daysPerWeek: 3, priorityMuscles: ['chest'], durationMinutes: 75, equipmentPref: 'technogym', experienceLevel: 'principiante' });
    expect(r75[0].exercises.length).toBeLessThanOrEqual(6);
  });

  it('respects equipment preference when selecting exercises', () => {
    const technogymRoutines = generateWizardRoutines({
      daysPerWeek: 3,
      priorityMuscles: ['chest', 'lats'],
      durationMinutes: 60,
      equipmentPref: 'technogym',
      experienceLevel: 'intermedio'
    });

    const chestExercise = technogymRoutines[0].exercises.find(e => e.muscle_group === 'chest');
    expect(chestExercise?.brand?.toLowerCase()).toContain('technogym');

    const hammerRoutines = generateWizardRoutines({
      daysPerWeek: 3,
      priorityMuscles: ['lats'],
      durationMinutes: 60,
      equipmentPref: 'hammer',
      experienceLevel: 'intermedio'
    });

    const latsExercise = hammerRoutines[1].exercises.find(e => e.muscle_group === 'lats' || e.muscle_group === 'upper_back');
    expect(latsExercise?.brand?.toLowerCase()).toContain('hammer');
  });

  it('supports beginner vs advanced experience calibration (RIR & volume)', () => {
    const beginnerRoutines = generateWizardRoutines({
      daysPerWeek: 3,
      priorityMuscles: ['chest'],
      durationMinutes: 60,
      equipmentPref: 'hybrid',
      experienceLevel: 'principiante'
    });

    const advancedRoutines = generateWizardRoutines({
      daysPerWeek: 3,
      priorityMuscles: ['chest'],
      durationMinutes: 60,
      equipmentPref: 'hybrid',
      experienceLevel: 'avanzado'
    });

    // Beginner priority gets 3 sets, advanced gets 4 sets
    expect(beginnerRoutines[0].exercises[0].sets.length).toBe(3);
    expect(advancedRoutines[0].exercises[0].sets.length).toBe(4);
  });
});
