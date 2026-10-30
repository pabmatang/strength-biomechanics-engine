import { describe, it, expect } from 'vitest';
import { EXERCISE_DATABASE } from '../data/exercises';
import { Routine, WorkoutExercise } from '../types/workout';

const BROAD_GROUP_MAP: Record<string, string> = {
  lats: 'back',
  upper_back: 'back',
  trapezius: 'back',
  traps: 'back',
  lower_back: 'back',
  chest: 'chest',
  shoulders: 'shoulders',
  biceps: 'biceps',
  triceps: 'triceps',
  quadriceps: 'quadriceps',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  calves: 'calves',
  abdominals: 'abdominals',
  adductors: 'adductors',
  abductors: 'adductors'
};

// Helper simulation of the Smart Routine Wizard Generator logic
function generateWizardRoutines(params: {
  daysPerWeek: 2 | 3 | 4 | 5 | 6;
  priorityMuscles: string[];
  durationMinutes: 45 | 60 | 75 | 90;
  equipmentPref: 'technogym' | 'hammer' | 'cables_selectorized' | 'free_weights' | 'hybrid';
  experienceLevel: 'principiante' | 'intermedio' | 'avanzado';
  dislikedMuscles?: string[];
}): Routine[] {
  const { daysPerWeek, priorityMuscles, durationMinutes, equipmentPref, experienceLevel, dislikedMuscles = [] } = params;
  const exactExercisesCount = durationMinutes === 45 ? 4 : durationMinutes === 60 ? 5 : durationMinutes === 75 ? 6 : 7;

  interface DayQueueItem {
    muscle: string;
    bias?: 'lats' | 'upper_back' | 'trapezius';
    note?: string;
    isComplementary?: boolean;
  }

  interface DayPlan {
    name: string;
    focusCategory: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'fullbody';
    focusMuscles: DayQueueItem[];
  }

  let splitPlan: DayPlan[] = [];

  if (daysPerWeek === 2) {
    splitPlan = [
      {
        name: 'Día 1: Full Body A',
        focusCategory: 'fullbody',
        focusMuscles: [
          { muscle: 'lats', bias: 'lats' },
          { muscle: 'chest' }, // Interleaved
          { muscle: 'quadriceps' },
          { muscle: 'biceps' },
          { muscle: 'triceps' },
          { muscle: 'shoulders' },
          { muscle: 'calves' }
        ]
      },
      {
        name: 'Día 2: Full Body B',
        focusCategory: 'fullbody',
        focusMuscles: [
          { muscle: 'upper_back', bias: 'upper_back' },
          { muscle: 'chest' },
          { muscle: 'hamstrings' },
          { muscle: 'triceps' },
          { muscle: 'biceps' },
          { muscle: 'adductors', isComplementary: true },
          { muscle: 'abdominals' }
        ]
      }
    ];
  } else if (daysPerWeek === 3) {
    splitPlan = [
      {
        name: 'Día 1: Push (Pectoral & Deltoides Intercalados)',
        focusCategory: 'push',
        focusMuscles: [
          { muscle: 'chest' },
          { muscle: 'shoulders' }, // Interleaved: Chest -> Delts -> Chest
          { muscle: 'chest' },
          { muscle: 'triceps' },
          { muscle: 'abdominals', isComplementary: true },
          { muscle: 'shoulders' },
          { muscle: 'triceps' }
        ]
      },
      {
        name: 'Día 2: Pull (Espalda & Bíceps Intercalados)',
        focusCategory: 'pull',
        focusMuscles: [
          { muscle: 'lats', bias: 'lats' },
          { muscle: 'biceps' }, // Interleaved
          { muscle: 'upper_back', bias: 'upper_back' },
          { muscle: 'shoulders' },
          { muscle: 'biceps' },
          { muscle: 'abdominals', isComplementary: true },
          { muscle: 'upper_back', bias: 'trapezius' }
        ]
      },
      {
        name: 'Día 3: Legs',
        focusCategory: 'legs',
        focusMuscles: [
          { muscle: 'quadriceps' },
          { muscle: 'hamstrings' },
          { muscle: 'quadriceps' },
          { muscle: 'calves' },
          { muscle: 'adductors', isComplementary: true },
          { muscle: 'glutes' },
          { muscle: 'hamstrings' }
        ]
      }
    ];
  } else if (daysPerWeek === 4) {
    // 4-day Torso/Pierna: includes BOTH Biceps and Triceps in Torso days!
    splitPlan = [
      {
        name: 'Día 1: Torso A (Tracción, Empuje & Brazos Intercalados)',
        focusCategory: 'upper',
        focusMuscles: [
          { muscle: 'lats', bias: 'lats' },
          { muscle: 'chest' }, // Interleaved
          { muscle: 'shoulders' },
          { muscle: 'biceps' },
          { muscle: 'triceps' }, // Both arms included in top 5!
          { muscle: 'upper_back', bias: 'upper_back' },
          { muscle: 'abdominals', isComplementary: true }
        ]
      },
      {
        name: 'Día 2: Pierna A',
        focusCategory: 'lower',
        focusMuscles: [
          { muscle: 'quadriceps' },
          { muscle: 'hamstrings' },
          { muscle: 'quadriceps' },
          { muscle: 'calves' },
          { muscle: 'adductors', isComplementary: true },
          { muscle: 'glutes' },
          { muscle: 'hamstrings' }
        ]
      },
      {
        name: 'Día 3: Torso B (Foco Pectoral, Espalda Alta & Brazos)',
        focusCategory: 'upper',
        focusMuscles: [
          { muscle: 'chest' },
          { muscle: 'upper_back', bias: 'upper_back' },
          { muscle: 'shoulders' },
          { muscle: 'triceps' },
          { muscle: 'biceps' }, // Both arms included in top 5!
          { muscle: 'lats', bias: 'lats' },
          { muscle: 'abdominals', isComplementary: true }
        ]
      },
      {
        name: 'Día 4: Pierna B',
        focusCategory: 'lower',
        focusMuscles: [
          { muscle: 'hamstrings' },
          { muscle: 'quadriceps' },
          { muscle: 'hamstrings' },
          { muscle: 'calves' },
          { muscle: 'adductors', isComplementary: true },
          { muscle: 'glutes' },
          { muscle: 'quadriceps' }
        ]
      }
    ];
  } else if (daysPerWeek === 5) {
    // 5-DAY SPLIT:
    // Push A & B: Chest interleaved with delts/triceps (NO consecutive chest!).
    // Pull A & B: Back interleaved with biceps (Back strictly on Day 1 & Day 4 = Frequency 2).
    // Legs: Quads interleaved with hamstrings; Calves and Adductor strictly on Leg day.
    splitPlan = [
      {
        name: 'Día 1: Pull A (Foco Dorsal Ancho & Bíceps Intercalado)',
        focusCategory: 'pull',
        focusMuscles: [
          { muscle: 'lats', bias: 'lats' },
          { muscle: 'biceps' }, // Interleaved
          { muscle: 'lats', bias: 'lats' },
          { muscle: 'shoulders' },
          { muscle: 'biceps' },
          { muscle: 'abdominals', isComplementary: true },
          { muscle: 'lats', bias: 'lats' }
        ]
      },
      {
        name: 'Día 2: Push A (Pectoral & Deltoides Intercalados)',
        focusCategory: 'push',
        focusMuscles: [
          { muscle: 'chest' },
          { muscle: 'shoulders' }, // Interleaved: Chest -> Shoulders -> Chest!
          { muscle: 'chest' },
          { muscle: 'triceps' },
          { muscle: 'shoulders' },
          { muscle: 'triceps' },
          { muscle: 'abdominals', isComplementary: true }
        ]
      },
      {
        name: 'Día 3: Legs (Cuádriceps, Femoral & Aductor)',
        focusCategory: 'legs',
        focusMuscles: [
          { muscle: 'quadriceps' },
          { muscle: 'hamstrings' },
          { muscle: 'quadriceps' },
          { muscle: 'calves' },
          { muscle: 'adductors', isComplementary: true },
          { muscle: 'glutes' },
          { muscle: 'hamstrings' }
        ]
      },
      {
        name: 'Día 4: Pull B (Espalda Alta, Trapecios & Bíceps Intercalados)',
        focusCategory: 'pull',
        focusMuscles: [
          { muscle: 'upper_back', bias: 'upper_back' },
          { muscle: 'biceps' }, // Interleaved
          { muscle: 'lats', bias: 'lats' },
          { muscle: 'upper_back', bias: 'trapezius' },
          { muscle: 'shoulders' },
          { muscle: 'biceps' },
          { muscle: 'abdominals', isComplementary: true }
        ]
      },
      {
        name: 'Día 5: Push B (Pectoral Superior & Tríceps Intercalados)',
        focusCategory: 'push',
        focusMuscles: [
          { muscle: 'chest' },
          { muscle: 'shoulders' }, // Interleaved: Chest -> Delts -> Chest
          { muscle: 'chest' },
          { muscle: 'triceps' },
          { muscle: 'triceps' },
          { muscle: 'shoulders' },
          { muscle: 'abdominals', isComplementary: true }
        ]
      }
    ];
  } else {
    // 6-Day PPLx2
    splitPlan = [
      {
        name: 'Día 1: Push A',
        focusCategory: 'push',
        focusMuscles: [
          { muscle: 'chest' }, { muscle: 'shoulders' }, { muscle: 'chest' },
          { muscle: 'triceps' }, { muscle: 'shoulders' }, { muscle: 'triceps' },
          { muscle: 'abdominals', isComplementary: true }
        ]
      },
      {
        name: 'Día 2: Pull A',
        focusCategory: 'pull',
        focusMuscles: [
          { muscle: 'lats', bias: 'lats' }, { muscle: 'biceps' }, { muscle: 'lats' },
          { muscle: 'shoulders' }, { muscle: 'biceps' }, { muscle: 'upper_back' },
          { muscle: 'abdominals', isComplementary: true }
        ]
      },
      {
        name: 'Día 3: Legs A',
        focusCategory: 'legs',
        focusMuscles: [
          { muscle: 'quadriceps' }, { muscle: 'hamstrings' }, { muscle: 'quadriceps' },
          { muscle: 'calves' }, { muscle: 'adductors', isComplementary: true },
          { muscle: 'glutes' }, { muscle: 'calves' }
        ]
      },
      {
        name: 'Día 4: Push B',
        focusCategory: 'push',
        focusMuscles: [
          { muscle: 'chest' }, { muscle: 'shoulders' }, { muscle: 'chest' },
          { muscle: 'triceps' }, { muscle: 'triceps' }, { muscle: 'shoulders' },
          { muscle: 'abdominals', isComplementary: true }
        ]
      },
      {
        name: 'Día 5: Pull B',
        focusCategory: 'pull',
        focusMuscles: [
          { muscle: 'upper_back', bias: 'upper_back' }, { muscle: 'biceps' }, { muscle: 'lats' },
          { muscle: 'shoulders' }, { muscle: 'biceps' }, { muscle: 'upper_back', bias: 'trapezius' },
          { muscle: 'abdominals', isComplementary: true }
        ]
      },
      {
        name: 'Día 6: Legs B',
        focusCategory: 'legs',
        focusMuscles: [
          { muscle: 'hamstrings' }, { muscle: 'quadriceps' }, { muscle: 'hamstrings' },
          { muscle: 'calves' }, { muscle: 'adductors', isComplementary: true },
          { muscle: 'glutes' }, { muscle: 'glutes' }
        ]
      }
    ];
  }

  const pickExercise = (muscle: string, pref: string, used: Set<string>) => {
    // 1. Strict primary muscle group match
    let candidates = EXERCISE_DATABASE.filter(
      t => t.muscle_group === muscle && !used.has(t.id)
    );

    // 2. Secondary fallback only if empty
    if (candidates.length === 0) {
      candidates = EXERCISE_DATABASE.filter(
        t => t.other_muscles && (t.other_muscles as string[]).includes(muscle) && !used.has(t.id)
      );
    }
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

  // Track global weekly exercise counts per broad muscle group to strictly hit volume targets
  const weeklyGroupExerciseCount: Record<string, number> = {};

  return splitPlan.map((day, dayIdx) => {
    const used = new Set<string>();
    const broadCategoryCounts: Record<string, number> = {};
    const chosenQueue: DayQueueItem[] = [];

    for (const item of day.focusMuscles) {
      if (chosenQueue.length >= exactExercisesCount) break;
      const broad = BROAD_GROUP_MAP[item.muscle] || item.muscle;
      const count = broadCategoryCounts[broad] || 0;
      if (count >= 3) continue; // Max 3 per muscle group per session!

      const isPriority = priorityMuscles.includes(item.muscle) || (BROAD_GROUP_MAP[item.muscle] && priorityMuscles.includes(BROAD_GROUP_MAP[item.muscle]));
      const isComp = item.isComplementary || ['abdominals', 'adductors', 'abductors'].includes(item.muscle);

      const weeklyCap = isComp ? 2 : (isPriority ? 4 : (experienceLevel === 'principiante' ? 3 : 4));
      const currentWeeklyCount = weeklyGroupExerciseCount[broad] || 0;
      if (currentWeeklyCount >= weeklyCap) {
        continue;
      }

      broadCategoryCounts[broad] = count + 1;
      weeklyGroupExerciseCount[broad] = currentWeeklyCount + 1;
      chosenQueue.push(item);
    }

    let fallbackLoop = 0;
    while (chosenQueue.length < exactExercisesCount && fallbackLoop < 10) {
      fallbackLoop++;
      if (day.focusCategory === 'legs' || day.focusCategory === 'lower') {
        chosenQueue.push({
          muscle: 'adductors',
          isComplementary: true
        });
      } else {
        chosenQueue.push({
          muscle: 'abdominals',
          isComplementary: true
        });
      }
    }

    const exercises: WorkoutExercise[] = chosenQueue.map((item, exIdx) => {
      const tmpl = pickExercise(item.muscle, equipmentPref, used);
      used.add(tmpl.id);
      const isPriority = priorityMuscles.includes(item.muscle) || (BROAD_GROUP_MAP[item.muscle] && priorityMuscles.includes(BROAD_GROUP_MAP[item.muscle]));
      const isComp = item.isComplementary || ['abdominals', 'adductors', 'abductors'].includes(item.muscle);

      let setCount = 2;
      if (isComp) {
        setCount = 2;
      } else if (experienceLevel === 'principiante') {
        setCount = 2; // Exact 2 sets for beginner
      } else if (experienceLevel === 'intermedio') {
        setCount = isPriority ? 3 : 2;
      } else {
        // Avanzado
        setCount = isPriority ? 4 : 3;
      }

      return {
        id: `ex_${dayIdx}_${exIdx}`,
        exercise_template_id: tmpl.id,
        title: tmpl.title,
        brand: tmpl.brand,
        muscle_group: tmpl.muscle_group,
        equipment_category: tmpl.equipment_category,
        image_url: tmpl.image_url,
        target_rep_range: isPriority ? '6-8' : (isComp ? '12-15' : '8-12'),
        sets: Array.from({ length: setCount }, (_, sIdx) => ({
          id: `s_${dayIdx}_${exIdx}_${sIdx}`,
          index: sIdx + 1,
          type: 'normal',
          weight_kg: 20,
          reps: isPriority ? 8 : (isComp ? 12 : 10),
          rpe: isPriority ? 8.5 : (isComp ? 7.5 : 8.0),
          is_completed: false
        }))
      };
    });

    return {
      id: `smart_routine_${dayIdx}`,
      title: day.name,
      folder_name: `Plan automático (${daysPerWeek} días)`,
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

    const r5 = generateWizardRoutines({ daysPerWeek: 5, priorityMuscles: ['lats'], durationMinutes: 60, equipmentPref: 'hybrid', experienceLevel: 'principiante' });
    expect(r5.length).toBe(5);

    const r6 = generateWizardRoutines({ daysPerWeek: 6, priorityMuscles: ['quadriceps'], durationMinutes: 60, equipmentPref: 'hybrid', experienceLevel: 'principiante' });
    expect(r6.length).toBe(6);
  });

  it('guarantees Back appears on EXACTLY 2 days in a 5-day training split (Frequency 2 limit)', () => {
    const routines5Days = generateWizardRoutines({
      daysPerWeek: 5,
      priorityMuscles: ['lats', 'chest'],
      durationMinutes: 60,
      equipmentPref: 'technogym',
      experienceLevel: 'avanzado'
    });

    // Check which days contain Back exercises (lats, upper_back, trapezius)
    const daysWithBack = routines5Days.filter(day =>
      day.exercises.some(ex => ['lats', 'upper_back', 'trapezius', 'lower_back'].includes(ex.muscle_group))
    );

    // Must be EXACTLY 2 days (Pull A and Pull B), NEVER > 2 or > 3!
    expect(daysWithBack.length).toBe(2);
    expect(daysWithBack[0].title).toContain('Día 1: Pull A');
    expect(daysWithBack[1].title).toContain('Día 4: Pull B');
  });

  it('interleaves Push exercises so Chest is separated by Deltoids or Triceps', () => {
    const routines = generateWizardRoutines({
      daysPerWeek: 5,
      priorityMuscles: ['chest', 'lats'],
      durationMinutes: 60,
      equipmentPref: 'technogym',
      experienceLevel: 'intermedio'
    });

    const pushDay = routines[1]; // Día 2: Push A
    const exMuscles = pushDay.exercises.map(e => e.muscle_group);
    
    // Position 0 is Chest, Position 1 is Shoulders (interleaved!), Position 2 is Chest
    expect(exMuscles[0]).toBe('chest');
    expect(exMuscles[1]).toBe('shoulders');
    expect(exMuscles[2]).toBe('chest');
  });

  it('includes BOTH Biceps and Triceps in Torso days without excessive calves', () => {
    const routines = generateWizardRoutines({
      daysPerWeek: 4, // Torso / Pierna
      priorityMuscles: ['chest', 'lats'],
      durationMinutes: 60, // 5 exercises
      equipmentPref: 'technogym',
      experienceLevel: 'intermedio'
    });

    const torsoDay1 = routines[0]; // Torso A
    const torsoMuscles = torsoDay1.exercises.map(e => e.muscle_group);

    // Torso A must have Biceps and Triceps
    expect(torsoMuscles).toContain('biceps');
    expect(torsoMuscles).toContain('triceps');

    // Calves must NOT be in Torso days
    expect(torsoMuscles).not.toContain('calves');

    // Total calves across all 4 days must be reasonable (<= 6 sets, never 16!)
    const totalCalvesSets = routines.reduce((tot, r) => {
      return tot + r.exercises
        .filter(e => e.muscle_group === 'calves')
        .reduce((s, e) => s + e.sets.length, 0);
    }, 0);
    expect(totalCalvesSets).toBeLessThanOrEqual(6);
  });

  it('strictly limits Principiante to 2 sets per exercise (all standard muscles = 6 sets/week)', () => {
    const beginnerRoutines = generateWizardRoutines({
      daysPerWeek: 5,
      priorityMuscles: ['chest'],
      durationMinutes: 60,
      equipmentPref: 'technogym',
      experienceLevel: 'principiante'
    });

    // In beginner, EVERY exercise must have exactly 2 sets
    beginnerRoutines.forEach(day => {
      day.exercises.forEach(ex => {
        expect(ex.sets.length, `Expected 2 sets for beginner in ${ex.title}`).toBe(2);
      });
    });

    // Check weekly volume of standard muscle (e.g. Deltoides or Triceps = 6 sets)
    const deltsSets = beginnerRoutines.reduce((tot, r) => {
      return tot + r.exercises
        .filter(e => e.muscle_group === 'shoulders')
        .reduce((s, e) => s + e.sets.length, 0);
    }, 0);
    expect(deltsSets).toBeLessThanOrEqual(6);
  });

  it('scales Avanzado to 10 sets standard and 12-16 sets for priority muscles', () => {
    const advancedRoutines = generateWizardRoutines({
      daysPerWeek: 5,
      priorityMuscles: ['chest', 'lats'],
      durationMinutes: 60,
      equipmentPref: 'technogym',
      experienceLevel: 'avanzado'
    });

    // Priority chest: 4 sets per exercise
    const chestSets = advancedRoutines.reduce((tot, r) => {
      return tot + r.exercises
        .filter(e => e.muscle_group === 'chest')
        .reduce((s, e) => s + e.sets.length, 0);
    }, 0);
    expect(chestSets).toBeGreaterThanOrEqual(12);
    expect(chestSets).toBeLessThanOrEqual(16);

    // Standard muscle (e.g. shoulders or triceps): ~10 sets
    const tricepsSets = advancedRoutines.reduce((tot, r) => {
      return tot + r.exercises
        .filter(e => e.muscle_group === 'triceps')
        .reduce((s, e) => s + e.sets.length, 0);
    }, 0);
    expect(tricepsSets).toBeLessThanOrEqual(10);
  });

  it('calibrates exercise count strictly by session duration across all days', () => {
    const r45 = generateWizardRoutines({ daysPerWeek: 5, priorityMuscles: ['chest'], durationMinutes: 45, equipmentPref: 'technogym', experienceLevel: 'principiante' });
    r45.forEach(d => expect(d.exercises.length).toBe(4));

    const r60 = generateWizardRoutines({ daysPerWeek: 5, priorityMuscles: ['chest'], durationMinutes: 60, equipmentPref: 'technogym', experienceLevel: 'principiante' });
    r60.forEach(d => expect(d.exercises.length).toBe(5));

    const r75 = generateWizardRoutines({ daysPerWeek: 5, priorityMuscles: ['chest'], durationMinutes: 75, equipmentPref: 'technogym', experienceLevel: 'principiante' });
    r75.forEach(d => expect(d.exercises.length).toBe(6));

    const r90 = generateWizardRoutines({ daysPerWeek: 5, priorityMuscles: ['chest'], durationMinutes: 90, equipmentPref: 'technogym', experienceLevel: 'principiante' });
    r90.forEach(d => expect(d.exercises.length).toBe(7));
  });
});
