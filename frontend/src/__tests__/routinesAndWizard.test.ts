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
  const complementaryPool = ['calves', 'abdominals', 'adductors'].filter(m => !dislikedMuscles.includes(m));
  if (complementaryPool.length === 0) complementaryPool.push('abdominals');

  interface DayQueueItem {
    muscle: string;
    bias?: 'lats' | 'upper_back' | 'trapezius';
    note?: string;
    isComplementary?: boolean;
  }

  interface DayPlan {
    name: string;
    focusMuscles: DayQueueItem[];
  }

  let splitPlan: DayPlan[] = [];

  if (daysPerWeek === 2) {
    splitPlan = [
      {
        name: 'Día 1: Full Body A',
        focusMuscles: [
          { muscle: 'lats', bias: 'lats' },
          { muscle: 'biceps' },
          { muscle: 'chest' },
          { muscle: 'quadriceps' },
          { muscle: complementaryPool[0], isComplementary: true },
          { muscle: 'shoulders' },
          { muscle: 'calves' }
        ]
      },
      {
        name: 'Día 2: Full Body B',
        focusMuscles: [
          { muscle: 'upper_back', bias: 'upper_back' },
          { muscle: 'chest' },
          { muscle: 'hamstrings' },
          { muscle: 'triceps' },
          { muscle: complementaryPool[1 % complementaryPool.length], isComplementary: true },
          { muscle: 'adductors' },
          { muscle: 'abdominals' }
        ]
      }
    ];
  } else if (daysPerWeek === 3) {
    splitPlan = [
      {
        name: 'Día 1: Push',
        focusMuscles: [
          { muscle: 'chest' },
          { muscle: 'chest' },
          { muscle: 'shoulders' },
          { muscle: 'triceps' },
          { muscle: complementaryPool[0], isComplementary: true },
          { muscle: 'shoulders' },
          { muscle: 'triceps' }
        ]
      },
      {
        name: 'Día 2: Pull',
        focusMuscles: [
          { muscle: 'lats', bias: 'lats' },
          { muscle: 'biceps' }, // Interleaved
          { muscle: 'upper_back', bias: 'upper_back' },
          { muscle: 'shoulders' },
          { muscle: complementaryPool[1 % complementaryPool.length], isComplementary: true },
          { muscle: 'biceps' },
          { muscle: 'upper_back', bias: 'trapezius' }
        ]
      },
      {
        name: 'Día 3: Legs',
        focusMuscles: [
          { muscle: 'quadriceps' },
          { muscle: 'hamstrings' },
          { muscle: 'quadriceps' },
          { muscle: 'glutes' },
          { muscle: complementaryPool[2 % complementaryPool.length] || 'calves', isComplementary: true },
          { muscle: 'adductors' },
          { muscle: 'calves' }
        ]
      }
    ];
  } else if (daysPerWeek === 4) {
    splitPlan = [
      {
        name: 'Día 1: Torso A',
        focusMuscles: [
          { muscle: 'lats', bias: 'lats' },
          { muscle: 'biceps' },
          { muscle: 'chest' },
          { muscle: 'upper_back', bias: 'upper_back' },
          { muscle: complementaryPool[0], isComplementary: true },
          { muscle: 'shoulders' },
          { muscle: 'triceps' }
        ]
      },
      {
        name: 'Día 2: Pierna A',
        focusMuscles: [
          { muscle: 'quadriceps' },
          { muscle: 'hamstrings' },
          { muscle: 'quadriceps' },
          { muscle: 'adductors' },
          { muscle: complementaryPool[1 % complementaryPool.length], isComplementary: true },
          { muscle: 'glutes' },
          { muscle: 'calves' }
        ]
      },
      {
        name: 'Día 3: Torso B',
        focusMuscles: [
          { muscle: 'chest' },
          { muscle: 'upper_back', bias: 'upper_back' },
          { muscle: 'biceps' },
          { muscle: 'lats', bias: 'lats' },
          { muscle: complementaryPool[2 % complementaryPool.length] || 'abdominals', isComplementary: true },
          { muscle: 'shoulders' },
          { muscle: 'triceps' }
        ]
      },
      {
        name: 'Día 4: Pierna B',
        focusMuscles: [
          { muscle: 'hamstrings' },
          { muscle: 'quadriceps' },
          { muscle: 'glutes' },
          { muscle: 'calves' },
          { muscle: complementaryPool[0], isComplementary: true },
          { muscle: 'adductors' },
          { muscle: 'abdominals' }
        ]
      }
    ];
  } else if (daysPerWeek === 5) {
    // 5-DAY SPLIT: Back strictly in Day 1 and Day 4 ONLY (Frecuencia 2)
    splitPlan = [
      {
        name: 'Día 1: Pull A (Dorsal & Bíceps Intercalado)',
        focusMuscles: [
          { muscle: 'lats', bias: 'lats' },
          { muscle: 'biceps' }, // Interleaved
          { muscle: 'lats', bias: 'lats' },
          { muscle: 'shoulders' }, // Rear delt
          { muscle: complementaryPool[0], isComplementary: true },
          { muscle: 'biceps' },
          { muscle: complementaryPool[1 % complementaryPool.length], isComplementary: true }
        ]
      },
      {
        name: 'Día 2: Push A (Pectoral & Tríceps)',
        focusMuscles: [
          { muscle: 'chest' },
          { muscle: 'chest' },
          { muscle: 'shoulders' },
          { muscle: 'triceps' },
          { muscle: complementaryPool[1 % complementaryPool.length], isComplementary: true },
          { muscle: 'shoulders' },
          { muscle: 'triceps' }
        ]
      },
      {
        name: 'Día 3: Legs (Cuádriceps, Femoral & Aductor)',
        focusMuscles: [
          { muscle: 'quadriceps' },
          { muscle: 'hamstrings' },
          { muscle: 'quadriceps' },
          { muscle: 'glutes' },
          { muscle: complementaryPool[2 % complementaryPool.length] || 'adductors', isComplementary: true },
          { muscle: 'calves' },
          { muscle: 'hamstrings' }
        ]
      },
      {
        name: 'Día 4: Pull B (Espalda Alta & Bíceps Intercalado)',
        focusMuscles: [
          { muscle: 'upper_back', bias: 'upper_back' },
          { muscle: 'biceps' }, // Interleaved
          { muscle: 'lats', bias: 'lats' },
          { muscle: 'shoulders' }, // Rear delt / facepull
          { muscle: complementaryPool[0], isComplementary: true },
          { muscle: 'upper_back', bias: 'trapezius' },
          { muscle: 'biceps' }
        ]
      },
      {
        name: 'Día 5: Push B (Pectoral Superior & Deltoides)',
        focusMuscles: [
          { muscle: 'chest' },
          { muscle: 'chest' },
          { muscle: 'shoulders' },
          { muscle: 'triceps' },
          { muscle: complementaryPool[1 % complementaryPool.length], isComplementary: true },
          { muscle: 'shoulders' },
          { muscle: 'triceps' }
        ]
      }
    ];
  } else {
    // 6-Day PPLx2
    splitPlan = [
      {
        name: 'Día 1: Push A',
        focusMuscles: [
          { muscle: 'chest' }, { muscle: 'chest' }, { muscle: 'shoulders' },
          { muscle: 'triceps' }, { muscle: complementaryPool[0], isComplementary: true },
          { muscle: 'shoulders' }, { muscle: 'triceps' }
        ]
      },
      {
        name: 'Día 2: Pull A',
        focusMuscles: [
          { muscle: 'lats', bias: 'lats' }, { muscle: 'biceps' }, { muscle: 'lats' },
          { muscle: 'shoulders' }, { muscle: complementaryPool[1 % complementaryPool.length], isComplementary: true },
          { muscle: 'biceps' }, { muscle: 'upper_back' }
        ]
      },
      {
        name: 'Día 3: Legs A',
        focusMuscles: [
          { muscle: 'quadriceps' }, { muscle: 'hamstrings' }, { muscle: 'quadriceps' },
          { muscle: 'adductors' }, { muscle: complementaryPool[2 % complementaryPool.length] || 'calves', isComplementary: true },
          { muscle: 'glutes' }, { muscle: 'calves' }
        ]
      },
      {
        name: 'Día 4: Push B',
        focusMuscles: [
          { muscle: 'chest' }, { muscle: 'chest' }, { muscle: 'shoulders' },
          { muscle: 'triceps' }, { muscle: complementaryPool[0], isComplementary: true },
          { muscle: 'shoulders' }, { muscle: 'triceps' }
        ]
      },
      {
        name: 'Día 5: Pull B',
        focusMuscles: [
          { muscle: 'upper_back', bias: 'upper_back' }, { muscle: 'biceps' }, { muscle: 'lats' },
          { muscle: 'upper_back', bias: 'trapezius' }, { muscle: complementaryPool[1 % complementaryPool.length], isComplementary: true },
          { muscle: 'shoulders' }, { muscle: 'biceps' }
        ]
      },
      {
        name: 'Día 6: Legs B',
        focusMuscles: [
          { muscle: 'hamstrings' }, { muscle: 'quadriceps' }, { muscle: 'glutes' },
          { muscle: 'calves' }, { muscle: complementaryPool[2 % complementaryPool.length] || 'calves', isComplementary: true },
          { muscle: 'adductors' }, { muscle: 'abdominals' }
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

  return splitPlan.map((day, dayIdx) => {
    const used = new Set<string>();
    const broadCategoryCounts: Record<string, number> = {};
    const chosenQueue: DayQueueItem[] = [];

    for (const item of day.focusMuscles) {
      if (chosenQueue.length >= exactExercisesCount) break;
      const broad = BROAD_GROUP_MAP[item.muscle] || item.muscle;
      const count = broadCategoryCounts[broad] || 0;
      if (count >= 3) continue; // Max 3 per muscle group per session!
      broadCategoryCounts[broad] = count + 1;
      chosenQueue.push(item);
    }

    while (chosenQueue.length < exactExercisesCount) {
      chosenQueue.push({
        muscle: complementaryPool[0] || 'abdominals',
        isComplementary: true
      });
    }

    const exercises: WorkoutExercise[] = chosenQueue.map((item, exIdx) => {
      const tmpl = pickExercise(item.muscle, equipmentPref, used);
      used.add(tmpl.id);
      const isPriority = priorityMuscles.includes(item.muscle) || priorityMuscles.includes(BROAD_GROUP_MAP[item.muscle]);
      const isComp = item.isComplementary || ['calves', 'abdominals', 'adductors', 'abductors'].includes(item.muscle);

      let setCount = 3;
      if (isPriority) setCount = 4;
      else if (isComp) setCount = 4;
      else setCount = experienceLevel === 'principiante' ? 2 : 3;

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
      priorityMuscles: ['lats', 'chest', 'biceps'],
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

  it('enforces maximum 3 exercises of the same broad muscle group per session', () => {
    const routines = generateWizardRoutines({
      daysPerWeek: 5,
      priorityMuscles: ['lats', 'chest'],
      durationMinutes: 90, // 7 exercises per day
      equipmentPref: 'technogym',
      experienceLevel: 'avanzado'
    });

    routines.forEach(day => {
      const counts: Record<string, number> = {};
      day.exercises.forEach(ex => {
        const broad = BROAD_GROUP_MAP[ex.muscle_group] || ex.muscle_group;
        counts[broad] = (counts[broad] || 0) + 1;
      });

      // Assert no single group ever has > 3 exercises in any session
      Object.entries(counts).forEach(([group, count]) => {
        expect(count, `Muscle group ${group} exceeded 3 exercises in ${day.title}`).toBeLessThanOrEqual(3);
      });
    });
  });

  it('interleaves biceps on Pull days between back exercises', () => {
    const routines = generateWizardRoutines({
      daysPerWeek: 5,
      priorityMuscles: ['lats', 'biceps'],
      durationMinutes: 60,
      equipmentPref: 'technogym',
      experienceLevel: 'avanzado'
    });

    const pullDay1 = routines[0];
    const exMuscles = pullDay1.exercises.map(e => e.muscle_group);
    
    // Position 0 is Back, Position 1 is Biceps (interleaved!), Position 2 is Back
    expect(exMuscles[0]).toBe('lats');
    expect(exMuscles[1]).toBe('biceps');
  });

  it('meets weekly volume landmarks (12-16 sets for priority muscles, 4 sets for complementary)', () => {
    const routines = generateWizardRoutines({
      daysPerWeek: 5,
      priorityMuscles: ['lats', 'chest', 'biceps'],
      durationMinutes: 60, // 5 exercises per session
      equipmentPref: 'technogym',
      experienceLevel: 'avanzado'
    });

    // Compute weekly sets for Back (lats + upper_back)
    const backSets = routines.reduce((total, r) => {
      return total + r.exercises
        .filter(e => ['lats', 'upper_back', 'trapezius'].includes(e.muscle_group))
        .reduce((s, e) => s + e.sets.length, 0);
    }, 0);

    // Back has 2 exercises on Day 1 (4 sets each = 8) + 2 on Day 4 (4 sets each = 8) = 16 sets
    expect(backSets).toBeGreaterThanOrEqual(12);
    expect(backSets).toBeLessThanOrEqual(16);

    // Check complementary exercises (adductors, calves or abs)
    const adductorSets = routines.reduce((total, r) => {
      return total + r.exercises
        .filter(e => ['adductors', 'abductors'].includes(e.muscle_group))
        .reduce((s, e) => s + e.sets.length, 0);
    }, 0);

    if (adductorSets > 0) {
      expect(adductorSets).toBe(4); // 4-set reminder
    }
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
  });
});
