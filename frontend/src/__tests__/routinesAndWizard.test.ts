import { describe, it, expect } from 'vitest';
import { EXERCISE_DATABASE } from '../data/exercises';
import { Routine, WorkoutExercise } from '../types/workout';
import {
  generateWizardRoutines as generateEngineRoutines,
  getTargetRepRangeForExercise,
  orderDayExercises
} from '../utils/routineGenerator';

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

const isMusclePrioritized = (muscle: string, priorities: string[]): boolean => {
  if (!priorities || priorities.length === 0) return false;
  if (priorities.includes(muscle)) return true;
  const broad = BROAD_GROUP_MAP[muscle] || muscle;
  if (priorities.includes(broad)) return true;
  if (broad === 'back' && (priorities.includes('lats') || priorities.includes('upper_back') || priorities.includes('back'))) return true;
  if (broad === 'chest' && (priorities.includes('chest') || priorities.includes('pectoral'))) return true;
  return false;
};

const isMuscleDisliked = (muscle: string, disliked: string[]): boolean => {
  if (!disliked || disliked.length === 0) return false;
  if (disliked.includes(muscle)) return true;
  const broad = BROAD_GROUP_MAP[muscle] || muscle;
  if (disliked.includes(broad)) return true;
  return false;
};

// Helper simulation of the Smart Routine Wizard Generator logic
function generateWizardRoutines(params: {
  daysPerWeek: 2 | 3 | 4 | 5 | 6;
  priorityMuscles: string[];
  durationMinutes: 45 | 60 | 75 | 90;
  equipmentPref: 'technogym' | 'hammer' | 'cables_selectorized' | 'free_weights' | 'hybrid';
  experienceLevel: 'principiante' | 'intermedio' | 'avanzado';
  dislikedMuscles?: string[];
  routineSplitType?: 'ppl' | 'torso_pierna' | 'fullbody' | 'auto';
}): Routine[] {
  const { daysPerWeek, priorityMuscles, durationMinutes, equipmentPref, experienceLevel, dislikedMuscles = [], routineSplitType = 'auto' } = params;
  const exactExercisesCount = durationMinutes === 45 ? 4 : durationMinutes === 60 ? 5 : durationMinutes === 75 ? 6 : 7;

    interface DayQueueItem {
    muscle: string;
    bias?: 'lats' | 'upper_back' | 'trapezius';
    note?: string;
    isComplementary?: boolean;
  }

  function orderDayExercises(queue: DayQueueItem[], priorities: string[]): DayQueueItem[] {
    if (!priorities || priorities.length === 0) return queue;

    const priorityItems = queue.filter(item => isMusclePrioritized(item.muscle, priorities));
    const secondaryItems = queue.filter(item => !isMusclePrioritized(item.muscle, priorities));

    if (priorityItems.length === 0) return queue;

    const result: DayQueueItem[] = [];
    const prioPool = [...priorityItems];
    const secPool = [...secondaryItems];

    while (prioPool.length > 0 || secPool.length > 0) {
      if (prioPool.length > 0) {
        const lastBroad = result.length > 0
          ? (BROAD_GROUP_MAP[result[result.length - 1].muscle] || result[result.length - 1].muscle)
          : null;

        const candidateIdx = prioPool.findIndex(item => {
          const broad = BROAD_GROUP_MAP[item.muscle] || item.muscle;
          return broad !== lastBroad;
        });

        if (candidateIdx !== -1) {
          result.push(prioPool.splice(candidateIdx, 1)[0]);
          continue;
        } else if (secPool.length > 0) {
          result.push(secPool.shift()!);
          continue;
        } else {
          result.push(prioPool.shift()!);
          continue;
        }
      }

      if (secPool.length > 0) {
        result.push(secPool.shift()!);
      }
    }

    return result;
  }

  interface DayPlan {
    name: string;
    focusCategory: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'fullbody';
    focusMuscles: DayQueueItem[];
  }

  let splitPlan: DayPlan[] = [];

  const effectiveSplit = routineSplitType === 'auto'
    ? (daysPerWeek === 2 ? 'fullbody' : daysPerWeek === 4 ? 'torso_pierna' : 'ppl')
    : routineSplitType;

  if (effectiveSplit === 'torso_pierna') {
    if (daysPerWeek === 5) {
      splitPlan = [
        {
          name: 'Día 1: Torso A (Tracción, Empuje & Brazos)',
          focusCategory: 'upper',
          focusMuscles: [
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'chest' },
            { muscle: 'shoulders' },
            { muscle: 'biceps' },
            { muscle: 'triceps' },
            { muscle: 'upper_back', bias: 'upper_back' },
            { muscle: 'abdominals', isComplementary: true }
          ]
        },
        {
          name: 'Día 2: Pierna A (Cuádriceps, Femoral & Gemelo)',
          focusCategory: 'lower',
          focusMuscles: [
            { muscle: 'quadriceps' },
            { muscle: 'hamstrings' },
            { muscle: 'calves' },
            { muscle: 'adductors', isComplementary: true },
            { muscle: 'glutes' },
            { muscle: 'quadriceps' },
            { muscle: 'hamstrings' }
          ]
        },
        {
          name: 'Día 3: Torso B (Foco Pectoral & Espalda Alta)',
          focusCategory: 'upper',
          focusMuscles: [
            { muscle: 'chest' },
            { muscle: 'upper_back', bias: 'upper_back' },
            { muscle: 'shoulders' },
            { muscle: 'triceps' },
            { muscle: 'biceps' },
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'abdominals', isComplementary: true }
          ]
        },
        {
          name: 'Día 4: Pierna B (Isquios & Cadena Posterior)',
          focusCategory: 'lower',
          focusMuscles: [
            { muscle: 'hamstrings' },
            { muscle: 'quadriceps' },
            { muscle: 'calves' },
            { muscle: 'adductors', isComplementary: true },
            { muscle: 'glutes' },
            { muscle: 'hamstrings' },
            { muscle: 'quadriceps' }
          ]
        },
        {
          name: 'Día 5: Torso C (Especialización Prioridad: Pecho, Espalda & Brazos)',
          focusCategory: 'upper',
          focusMuscles: [
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'chest' },
            { muscle: 'upper_back', bias: 'upper_back' },
            { muscle: 'shoulders' },
            { muscle: 'biceps' },
            { muscle: 'triceps' },
            { muscle: 'abdominals', isComplementary: true }
          ]
        }
      ];
    } else {
      // 4-day Torso/Pierna
      splitPlan = [
        {
          name: 'Día 1: Torso A (Tracción, Empuje & Brazos Intercalados)',
          focusCategory: 'upper',
          focusMuscles: [
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'chest' },
            { muscle: 'shoulders' },
            { muscle: 'biceps' },
            { muscle: 'triceps' },
            { muscle: 'upper_back', bias: 'upper_back' },
            { muscle: 'abdominals', isComplementary: true }
          ]
        },
        {
          name: 'Día 2: Pierna A (Cuádriceps, Femoral & Accesorios)',
          focusCategory: 'lower',
          focusMuscles: [
            { muscle: 'quadriceps' },
            { muscle: 'hamstrings' },
            { muscle: 'calves' },
            { muscle: 'adductors', isComplementary: true },
            { muscle: 'glutes' },
            { muscle: 'quadriceps' },
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
            { muscle: 'biceps' },
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'abdominals', isComplementary: true }
          ]
        },
        {
          name: 'Día 4: Pierna B (Isquiosurales, Cadena Posterior & Gemelo)',
          focusCategory: 'lower',
          focusMuscles: [
            { muscle: 'hamstrings' },
            { muscle: 'quadriceps' },
            { muscle: 'calves' },
            { muscle: 'adductors', isComplementary: true },
            { muscle: 'glutes' },
            { muscle: 'hamstrings' },
            { muscle: 'quadriceps' }
          ]
        }
      ];
    }
  } else if (daysPerWeek === 2) {
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
    const isLowerBodyPrioritized = priorityMuscles.some(m => ['quadriceps', 'hamstrings', 'glutes'].includes(m));

    if (isLowerBodyPrioritized) {
      splitPlan = [
        {
          name: 'Día 1: Pierna A (Foco Cuádriceps & Glúteos)',
          focusCategory: 'legs',
          focusMuscles: [
            { muscle: 'glutes' },
            { muscle: 'quadriceps' },
            { muscle: 'glutes' },
            { muscle: 'hamstrings' },
            { muscle: 'quadriceps' },
            { muscle: 'calves' },
            { muscle: 'adductors', isComplementary: true }
          ]
        },
        {
          name: 'Día 2: Push',
          focusCategory: 'push',
          focusMuscles: [
            { muscle: 'chest' },
            { muscle: 'shoulders' },
            { muscle: 'chest' },
            { muscle: 'triceps' },
            { muscle: 'triceps' },
            { muscle: 'shoulders' },
            { muscle: 'abdominals', isComplementary: true }
          ]
        },
        {
          name: 'Día 3: Pierna B (Foco Isquios & Glúteos)',
          focusCategory: 'legs',
          focusMuscles: [
            { muscle: 'hamstrings' },
            { muscle: 'glutes' },
            { muscle: 'hamstrings' },
            { muscle: 'quadriceps' },
            { muscle: 'glutes' },
            { muscle: 'calves' },
            { muscle: 'adductors', isComplementary: true }
          ]
        },
        {
          name: 'Día 4: Pull',
          focusCategory: 'pull',
          focusMuscles: [
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'biceps' },
            { muscle: 'upper_back', bias: 'upper_back' },
            { muscle: 'shoulders' },
            { muscle: 'biceps' },
            { muscle: 'upper_back', bias: 'trapezius' },
            { muscle: 'abdominals', isComplementary: true }
          ]
        },
        {
          name: 'Día 5: Pierna C (Especialización Glúteos)',
          focusCategory: 'legs',
          focusMuscles: [
            { muscle: 'glutes' },
            { muscle: 'quadriceps' },
            { muscle: 'hamstrings' },
            { muscle: 'glutes' },
            { muscle: 'calves' },
            { muscle: 'adductors', isComplementary: true }
          ]
        }
      ];
    } else {
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
          name: 'Día 3: Legs (Cuádriceps, Femoral & Glúteo)',
          focusCategory: 'legs',
          focusMuscles: [
            { muscle: 'quadriceps' },
            { muscle: 'hamstrings' },
            { muscle: 'glutes' },
            { muscle: 'quadriceps' },
            { muscle: 'calves' },
            { muscle: 'adductors', isComplementary: true },
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
    }
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

  // Pass 1: Select chosen exercises for each day
  const selectedDayQueues: DayQueueItem[][] = [];
  const weeklyGroupExerciseCount: Record<string, number> = {};

  splitPlan.forEach((day) => {
    const broadCategoryCounts: Record<string, number> = {};
    const filteredQueue = day.focusMuscles.filter(
      item => !isMuscleDisliked(item.muscle, dislikedMuscles)
    );

    // In Torso/Upper days, preserve the 1-per-group balance (Back, Chest, Delts, Biceps, Triceps)
    // In Leg/Lower days, ensure priority leg muscles (Glutes, Quads, Hamstrings) are evaluated before accessory calves/adductors
    let candidatePool = filteredQueue;
    if (day.focusCategory === 'legs' || day.focusCategory === 'lower') {
      const priorityCandidates = filteredQueue.filter(item => isMusclePrioritized(item.muscle, priorityMuscles));
      const secondaryCandidates = filteredQueue.filter(item => !isMusclePrioritized(item.muscle, priorityMuscles));
      candidatePool = [...priorityCandidates, ...secondaryCandidates];
    }

    const chosenQueue: DayQueueItem[] = [];

    for (const item of candidatePool) {
      if (chosenQueue.length >= exactExercisesCount) break;
      const broad = BROAD_GROUP_MAP[item.muscle] || item.muscle;
      const count = broadCategoryCounts[broad] || 0;
      if (count >= 3) continue; // Max 3 per muscle group per session!

      const isPriority = isMusclePrioritized(item.muscle, priorityMuscles);
      const isComp = item.isComplementary || ['abdominals', 'adductors', 'abductors'].includes(item.muscle);

      const weeklyCap = isComp 
        ? 2 
        : (isPriority ? (daysPerWeek >= 5 ? 5 : 4) : (daysPerWeek >= 5 ? 3 : 2));

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
      let candidate: DayQueueItem;
      if (day.focusCategory === 'legs' || day.focusCategory === 'lower') {
        if (isMusclePrioritized('glutes', priorityMuscles) && (broadCategoryCounts['glutes'] || 0) < 2) {
          candidate = { muscle: 'glutes', note: 'Glúteos: Hip thrust o extensión en polea' };
        } else if ((broadCategoryCounts['calves'] || 0) < 1) {
          candidate = { muscle: 'calves', note: 'Gemelos: Elevaciones de talones' };
        } else {
          candidate = { muscle: 'adductors', isComplementary: true, note: 'Aductor en máquina' };
        }
      } else {
        const coreWeekly = weeklyGroupExerciseCount['abdominals'] || 0;
        if (coreWeekly < 1 && !dislikedMuscles.includes('abdominals')) {
          candidate = { muscle: 'abdominals', isComplementary: true, note: 'Core: Abdomen en polea' };
        } else if (day.focusCategory === 'pull') {
          candidate = { muscle: 'biceps', note: 'Bíceps: Curl concentrado o martillo' };
        } else {
          candidate = { muscle: 'shoulders', note: 'Deltoides Lateral: Elevaciones en polea' };
        }
      }
      const broad = BROAD_GROUP_MAP[candidate.muscle] || candidate.muscle;
      broadCategoryCounts[broad] = (broadCategoryCounts[broad] || 0) + 1;
      weeklyGroupExerciseCount[broad] = (weeklyGroupExerciseCount[broad] || 0) + 1;
      chosenQueue.push(candidate);
    }

    // Apply Biomechanical Priority Reordering:
    // Puts all priority muscles at the very start of the session,
    // while maintaining interleaving if a muscle has multiple exercises.
    const orderedQueue = orderDayExercises(chosenQueue, priorityMuscles);
    selectedDayQueues.push(orderedQueue);
  });

  // Count total weekly appearances
  const totalGroupAppearances: Record<string, number> = {};
  selectedDayQueues.forEach(queue => {
    queue.forEach(item => {
      const broad = BROAD_GROUP_MAP[item.muscle] || item.muscle;
      totalGroupAppearances[broad] = (totalGroupAppearances[broad] || 0) + 1;
    });
  });

  // Pass 2: Allocate sets
  return splitPlan.map((day, dayIdx) => {
    const used = new Set<string>();
    const chosenQueue = selectedDayQueues[dayIdx];

    const exercises: WorkoutExercise[] = chosenQueue.map((item, exIdx) => {
      const tmpl = pickExercise(item.muscle, equipmentPref, used);
      used.add(tmpl.id);
      const broad = BROAD_GROUP_MAP[item.muscle] || item.muscle;
      const isPriority = isMusclePrioritized(item.muscle, priorityMuscles);
      const isComp = item.isComplementary || ['abdominals', 'adductors', 'abductors'].includes(item.muscle);
      const appearances = totalGroupAppearances[broad] || 1;

      let setCount = 2;
      if (experienceLevel === 'principiante') {
        setCount = 2;
      } else if (isComp) {
        setCount = (appearances <= 1) ? 3 : 2;
      } else if (isPriority) {
        if (appearances <= 2) {
          setCount = (experienceLevel === 'avanzado' || durationMinutes >= 75) ? 5 : 4;
        } else if (appearances === 3) {
          setCount = (experienceLevel === 'avanzado' || durationMinutes >= 75) ? 4 : 3;
        } else {
          setCount = (experienceLevel === 'avanzado' || durationMinutes >= 75) ? 4 : 3;
        }
      } else {
        if (appearances <= 1) {
          setCount = 3;
        } else {
          setCount = 2;
        }
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

  it('generates exact 5 days when 5 days and torso_pierna split are requested', () => {
    const routines5DaysTorso = generateWizardRoutines({
      daysPerWeek: 5,
      routineSplitType: 'torso_pierna',
      priorityMuscles: ['lats', 'chest'],
      durationMinutes: 60,
      equipmentPref: 'technogym',
      experienceLevel: 'intermedio'
    });

    expect(routines5DaysTorso.length).toBe(5);
    expect(routines5DaysTorso[0].title).toContain('Día 1: Torso A');
    expect(routines5DaysTorso[1].title).toContain('Día 2: Pierna A');
    expect(routines5DaysTorso[2].title).toContain('Día 3: Torso B');
    expect(routines5DaysTorso[3].title).toContain('Día 4: Pierna B');
    expect(routines5DaysTorso[4].title).toContain('Día 5: Torso C');
  });

  it('calibrates priority muscles to 8-10 series and secondary muscles to 3-4 series in 4-day torso/pierna with minimum 3-set floor', () => {
    const routines = generateWizardRoutines({
      daysPerWeek: 4,
      routineSplitType: 'torso_pierna',
      priorityMuscles: ['lats', 'chest'],
      durationMinutes: 60, // 5 exercises/session
      equipmentPref: 'technogym',
      experienceLevel: 'intermedio'
    });

    expect(routines.length).toBe(4);

    // Compute weekly volume per broad group
    const volume: Record<string, number> = {};
    routines.forEach(r => {
      r.exercises.forEach(e => {
        const broad = BROAD_GROUP_MAP[e.muscle_group] || e.muscle_group;
        volume[broad] = (volume[broad] || 0) + e.sets.length;
      });
    });

    // Priority muscles (Back & Chest) must receive 8 to 10 sets
    expect(volume['back']).toBeGreaterThanOrEqual(8);
    expect(volume['back']).toBeLessThanOrEqual(10);
    expect(volume['chest']).toBeGreaterThanOrEqual(8);
    expect(volume['chest']).toBeLessThanOrEqual(10);

    // Secondary muscle groups (shoulders, biceps, triceps, calves, adductors) must receive 3 to 4 sets
    expect(volume['shoulders']).toBeGreaterThanOrEqual(3);
    expect(volume['shoulders']).toBeLessThanOrEqual(4);
    expect(volume['biceps']).toBeGreaterThanOrEqual(3);
    expect(volume['biceps']).toBeLessThanOrEqual(4);
    expect(volume['triceps']).toBeGreaterThanOrEqual(3);
    expect(volume['triceps']).toBeLessThanOrEqual(4);
    expect(volume['calves']).toBeGreaterThanOrEqual(3);
    expect(volume['calves']).toBeLessThanOrEqual(4);
    expect(volume['adductors']).toBeGreaterThanOrEqual(3);
    expect(volume['adductors']).toBeLessThanOrEqual(4);

    // Strict minimum floor: NO active muscle group has fewer than 3 sets
    Object.entries(volume).forEach(([grp, sets]) => {
      expect(sets, `Group ${grp} must have at least 3 sets`).toBeGreaterThanOrEqual(3);
    });
  });

  it('guarantees priority muscles are placed at the very beginning of the session (1st/2nd exercise)', () => {
    // Case 1: Priority is Chest only -> Chest must be 1st exercise in both Torso A and Torso B
    const rChestOnly = generateWizardRoutines({
      daysPerWeek: 4,
      routineSplitType: 'torso_pierna',
      priorityMuscles: ['chest'],
      durationMinutes: 60,
      equipmentPref: 'technogym',
      experienceLevel: 'intermedio'
    });

    const torsoADay = rChestOnly[0]; // Torso A
    const torsoBDay = rChestOnly[2]; // Torso B
    expect(torsoADay.exercises[0].muscle_group).toBe('chest');
    expect(torsoBDay.exercises[0].muscle_group).toBe('chest');

    // Case 2: Priority is Chest & Biceps -> Both must be 1st and 2nd exercises
    const rChestBiceps = generateWizardRoutines({
      daysPerWeek: 4,
      routineSplitType: 'torso_pierna',
      priorityMuscles: ['chest', 'biceps'],
      durationMinutes: 60,
      equipmentPref: 'technogym',
      experienceLevel: 'intermedio'
    });

    const torsoA_CB = rChestBiceps[0];
    const firstTwoA = [torsoA_CB.exercises[0].muscle_group, torsoA_CB.exercises[1].muscle_group];
    expect(firstTwoA).toContain('chest');
    expect(firstTwoA).toContain('biceps');

    const torsoB_CB = rChestBiceps[2];
    const firstTwoB = [torsoB_CB.exercises[0].muscle_group, torsoB_CB.exercises[1].muscle_group];
    expect(firstTwoB).toContain('chest');
    expect(firstTwoB).toContain('biceps');

    // Case 3: Priority is Quads & Glutes -> Glutes and Quads are 1st and 2nd on Leg days, NEVER last
    const rLegPrio = generateWizardRoutines({
      daysPerWeek: 4,
      routineSplitType: 'torso_pierna',
      priorityMuscles: ['quadriceps', 'glutes'],
      durationMinutes: 60,
      equipmentPref: 'technogym',
      experienceLevel: 'intermedio'
    });

    const legA = rLegPrio[1]; // Pierna A
    const legA_firstTwo = [legA.exercises[0].muscle_group, legA.exercises[1].muscle_group];
    expect(legA_firstTwo).toContain('quadriceps');
    expect(legA_firstTwo).toContain('glutes');
    // Hip thrust / glutes must NOT be the last exercise
    expect(legA.exercises[legA.exercises.length - 1].muscle_group).not.toBe('glutes');
  });

  it('guarantees Glutes receive full priority volume and Abdomen is strictly capped when leg muscles are prioritized in 5 days', () => {
    const rLower5Days = generateWizardRoutines({
      daysPerWeek: 5,
      priorityMuscles: ['hamstrings', 'quadriceps', 'glutes'],
      durationMinutes: 60,
      equipmentPref: 'technogym',
      experienceLevel: 'intermedio'
    });

    expect(rLower5Days.length).toBe(5);

    // Calculate weekly volume
    const volume: Record<string, number> = {};
    rLower5Days.forEach(day => {
      day.exercises.forEach(ex => {
        const broad = BROAD_GROUP_MAP[ex.muscle_group] || ex.muscle_group;
        volume[broad] = (volume[broad] || 0) + ex.sets.length;
      });
    });

    // Glutes MUST be present and receive priority volume (>= 8 sets)
    expect(volume['glutes']).toBeDefined();
    expect(volume['glutes']).toBeGreaterThanOrEqual(8);

    // Quads and Hamstrings must also receive priority volume
    expect(volume['quadriceps']).toBeGreaterThanOrEqual(8);
    expect(volume['hamstrings']).toBeGreaterThanOrEqual(6);

    // Abdomen must NOT be overloaded (maximum 4 sets weekly recordatorio)
    const abdomenSets = volume['abdominals'] || 0;
    expect(abdomenSets).toBeLessThanOrEqual(4);
  });

  describe('Multi-Equipment, Brand Selection & Strict Volume Allocation', () => {
    it('strictly generates ZERO machine exercises when only free_weight and cable are selected', () => {
      const routines = generateEngineRoutines({
        experienceLevel: 'intermedio',
        daysPerWeek: 4,
        durationMinutes: 60,
        baseEquipment: ['free_weight', 'cable'],
        machineBrands: [],
        targetWeeklyVolume: {
          chest: 10,
          lats: 10,
          upper_back: 8,
          shoulders: 8,
          biceps: 8,
          triceps: 8,
          quadriceps: 10,
          hamstrings: 8,
          glutes: 8,
          calves: 6,
          adductors: 4,
          abdominals: 4
        }
      });

      expect(routines.length).toBe(4);

      const allExercises = routines.flatMap(r => r.exercises);
      expect(allExercises.length).toBeGreaterThan(0);

      const machineExercises = allExercises.filter(ex => ex.equipment_category === 'machine');
      expect(machineExercises.length).toBe(0);

      allExercises.forEach(ex => {
        expect(['cable', 'dumbbell', 'barbell', 'plate', 'kettlebell', 'none']).toContain(ex.equipment_category);
      });
    });

    it('strictly combines only specified brands plus cables and free weights without foreign brands', () => {
      const routines = generateEngineRoutines({
        experienceLevel: 'avanzado',
        daysPerWeek: 5,
        durationMinutes: 75,
        baseEquipment: ['free_weight', 'cable'],
        machineBrands: ['Technogym', 'Hammer Strength'],
        targetWeeklyVolume: {
          chest: 12,
          lats: 12,
          upper_back: 10,
          shoulders: 10,
          biceps: 10,
          triceps: 10,
          quadriceps: 12,
          hamstrings: 10,
          glutes: 10,
          calves: 6,
          adductors: 4,
          abdominals: 4
        }
      });

      expect(routines.length).toBe(5);
      const allExercises = routines.flatMap(r => r.exercises);

      allExercises.forEach(ex => {
        if (ex.equipment_category === 'machine') {
          const brand = ex.brand || '';
          const isAllowedBrand = brand.includes('Technogym') || brand.includes('Hammer');
          expect(isAllowedBrand).toBe(true);
          expect(brand).not.toContain('Panatta');
          expect(brand).not.toContain('Matrix');
          expect(brand).not.toContain('Gym80');
        } else {
          expect(['cable', 'dumbbell', 'barbell', 'plate', 'kettlebell', 'none']).toContain(ex.equipment_category);
        }
      });
    });

    it('completely excludes calves and abdominals when their target volume is set to 0', () => {
      const routines = generateEngineRoutines({
        experienceLevel: 'intermedio',
        daysPerWeek: 4,
        durationMinutes: 60,
        baseEquipment: ['free_weight', 'cable', 'generic_machine'],
        machineBrands: ['Technogym'],
        targetWeeklyVolume: {
          chest: 12,
          lats: 12,
          upper_back: 10,
          shoulders: 8,
          biceps: 8,
          triceps: 8,
          quadriceps: 12,
          hamstrings: 10,
          glutes: 8,
          calves: 0, // EXCLUDED
          abdominals: 0, // EXCLUDED
          adductors: 4
        }
      });

      const allExercises = routines.flatMap(r => r.exercises);

      const calfExercises = allExercises.filter(ex => ex.muscle_group === 'calves');
      expect(calfExercises.length).toBe(0);

      const absExercises = allExercises.filter(ex => ex.muscle_group === 'abdominals');
      expect(absExercises.length).toBe(0);
    });

    it('respects priorityOrder tie-breakers, interleaves antagonists (#1 <-> #2), and places maintenance finishers last', () => {
      const routines = generateEngineRoutines({
        experienceLevel: 'intermedio',
        daysPerWeek: 3,
        durationMinutes: 75,
        baseEquipment: ['free_weight', 'cable', 'generic_machine'],
        machineBrands: ['Technogym', 'Hammer Strength'],
        targetWeeklyVolume: {
          chest: 10,
          lats: 10,
          upper_back: 8,
          shoulders: 8,
          biceps: 6,
          triceps: 6,
          quadriceps: 10,
          hamstrings: 10,
          glutes: 10,
          calves: 2,
          adductors: 2,
          abdominals: 2
        },
        priorityOrder: [
          'hamstrings', 'quadriceps', 'glutes',
          'chest', 'lats', 'upper_back', 'shoulders', 'biceps', 'triceps',
          'calves', 'adductors', 'abdominals'
        ]
      });

      // Leg day: hamstrings (#1) opens and interleaves with quadriceps (#2), finishers at the very end
      const lowerA = routines.find(r =>
        r.exercises.some(e => e.muscle_group === 'hamstrings') &&
        r.exercises.some(e => e.muscle_group === 'quadriceps')
      )!;
      expect(lowerA).toBeDefined();
      expect(lowerA.exercises[0].muscle_group).toBe('hamstrings');
      expect(lowerA.exercises[1].muscle_group).toBe('quadriceps');

      // Maintenance (2 sets/wk) consolidated into 1 single day with exact 2 sets total and at the end
      const allEx = routines.flatMap(r => r.exercises);
      const calfEx = allEx.filter(e => e.muscle_group === 'calves');
      const absEx = allEx.filter(e => e.muscle_group === 'abdominals');
      const addEx = allEx.filter(e => e.muscle_group === 'adductors');

      expect(calfEx.length).toBe(1);
      expect(calfEx[0].sets.length).toBe(2);
      expect(absEx.length).toBe(1);
      expect(absEx[0].sets.length).toBe(2);
      expect(addEx.length).toBe(1);
      expect(addEx[0].sets.length).toBe(2);

      // Finishers in lowerA must be after all main quad/ham/glute exercises
      const lastMainIdx = lowerA.exercises.reduce((acc, e, idx) =>
        ['quadriceps', 'hamstrings', 'glutes'].includes(e.muscle_group) ? idx : acc, -1);
      const firstFinisherIdx = lowerA.exercises.findIndex(e => ['calves', 'adductors', 'abdominals'].includes(e.muscle_group));
      if (firstFinisherIdx !== -1) {
        expect(firstFinisherIdx).toBeGreaterThan(lastMainIdx);
      }
    });

    it('prevents redundant patterns in same session, includes leg_extension for quads, and differentiates rep ranges', () => {
      const routines = generateEngineRoutines({
        experienceLevel: 'intermedio',
        daysPerWeek: 4,
        durationMinutes: 90,
        baseEquipment: ['free_weight', 'cable', 'generic_machine'],
        machineBrands: ['Technogym', 'Matrix'],
        targetWeeklyVolume: {
          chest: 12,
          lats: 12,
          upper_back: 10,
          shoulders: 8,
          biceps: 8,
          triceps: 8,
          quadriceps: 12,
          hamstrings: 10,
          glutes: 8,
          calves: 4,
          adductors: 4,
          abdominals: 4
        }
      });

      const legDays = routines.filter(r => r.exercises.some(e => e.muscle_group === 'quadriceps'));
      const hasLegExt = legDays.some(d => d.exercises.some(e =>
        e.exercise_template_id.includes('leg_extension') || e.title.toLowerCase().includes('leg extension')
      ));
      expect(hasLegExt).toBe(true);

      // Differentiated rep ranges
      const allEx = routines.flatMap(r => r.exercises);
      const calfEx = allEx.find(e => e.muscle_group === 'calves');
      const absEx = allEx.find(e => e.muscle_group === 'abdominals');
      const compoundChest = allEx.find(e => e.muscle_group === 'chest');

      expect(calfEx?.sets[0].reps).toBeGreaterThanOrEqual(12);
      expect(absEx?.sets[0].reps).toBeGreaterThanOrEqual(12);
      expect(compoundChest?.sets[0].reps).toBeLessThanOrEqual(10);
    });

    it('balances asymmetric 78-torso / 30-legs volume across 3, 4 and 5 days (spread <= 4 sets, no day > 30 sets for 4-5d)', () => {
      const volume = {
        chest: 14,
        lats: 14,
        upper_back: 12,
        shoulders: 12,
        biceps: 12,
        triceps: 10,
        abdominals: 4, // total torso = 78
        quadriceps: 10,
        hamstrings: 8,
        glutes: 8,
        calves: 2,
        adductors: 2 // total legs = 30
      };

      for (const days of [3, 4, 5] as const) {
        const routines = generateEngineRoutines({
          experienceLevel: 'intermedio',
          daysPerWeek: days,
          durationMinutes: 75,
          baseEquipment: ['cable', 'generic_machine'],
          machineBrands: ['Technogym'],
          targetWeeklyVolume: volume
        });

        const dayTotals = routines.map(r => r.exercises.reduce((acc, e) => acc + e.sets.length, 0));
        const spread = Math.max(...dayTotals) - Math.min(...dayTotals);
        expect(spread).toBeLessThanOrEqual(4);
        if (days >= 4) {
          dayTotals.forEach(t => expect(t).toBeLessThanOrEqual(30));
        }
      }
    });

    it('enforces non-interference (no heavy triceps before chest day, no triceps before shoulder press)', () => {
      const routines = generateEngineRoutines({
        experienceLevel: 'intermedio',
        daysPerWeek: 4,
        durationMinutes: 75,
        baseEquipment: ['free_weight', 'cable', 'generic_machine'],
        machineBrands: ['Technogym'],
        targetWeeklyVolume: {
          chest: 12,
          lats: 10,
          upper_back: 8,
          shoulders: 10,
          biceps: 8,
          triceps: 10,
          quadriceps: 10,
          hamstrings: 8,
          glutes: 8,
          calves: 2,
          adductors: 2,
          abdominals: 2
        },
        priorityOrder: ['chest', 'lats', 'triceps', 'shoulders', 'upper_back', 'biceps', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abdominals']
      });

      // No heavy triceps (>= 4 sets) on day d immediately before chest on day d+1
      for (let d = 0; d < routines.length - 1; d++) {
        const tricepsSetsToday = routines[d].exercises
          .filter(e => e.muscle_group === 'triceps')
          .reduce((acc, e) => acc + e.sets.length, 0);
        const hasChestTomorrow = routines[d + 1].exercises.some(e => e.muscle_group === 'chest');
        if (tricepsSetsToday >= 4) {
          expect(hasChestTomorrow).toBe(false);
        }
      }

      // Within same day, triceps never precedes chest or compound shoulder press
      routines.forEach(r => {
        const firstTricepsIdx = r.exercises.findIndex(e => e.muscle_group === 'triceps');
        const lastPushIdx = r.exercises.reduce((acc, e, idx) =>
          (e.muscle_group === 'chest' || (e.muscle_group === 'shoulders' && (e.title.toLowerCase().includes('press') || e.exercise_template_id.includes('press')))) ? idx : acc, -1);
        if (firstTricepsIdx !== -1 && lastPushIdx !== -1) {
          expect(firstTricepsIdx).toBeGreaterThan(lastPushIdx);
        }
      });
    });

    it('enforces mandatory leg curl, avoids ankle cable extension, blocks double flat press, varies rep_range, and prevents brand leaks', () => {
      const routines = generateEngineRoutines({
        experienceLevel: 'intermedio',
        daysPerWeek: 4,
        durationMinutes: 75,
        baseEquipment: ['cable'],
        machineBrands: ['Technogym'],
        targetWeeklyVolume: {
          chest: 12,
          lats: 10,
          upper_back: 8,
          shoulders: 8,
          biceps: 8,
          triceps: 8,
          quadriceps: 10,
          hamstrings: 8,
          glutes: 8,
          calves: 2,
          adductors: 2,
          abdominals: 2
        }
      });

      const allEx = routines.flatMap(r => r.exercises);

      // 1. At least 1 leg curl when hamstrings > 0
      const hasLegCurl = allEx.some(e =>
        e.muscle_group === 'hamstrings' && (e.exercise_template_id.includes('leg_curl') || e.title.toLowerCase().includes('curl'))
      );
      expect(hasLegCurl).toBe(true);

      // 2. Zero ankle cable leg extension when Technogym Leg Extension is available
      const hasAnkleExt = allEx.some(e => e.exercise_template_id === 'cable_leg_extension');
      expect(hasAnkleExt).toBe(false);

      // 3. Zero unselected brands (Eleiko, Matrix) when only cable + Technogym selected
      allEx.forEach(e => {
        expect(e.brand).not.toBe('Eleiko');
        expect(e.brand).not.toBe('Matrix');
      });

      // 4. Varied rep_range values (not all 8-12)
      const uniqueRepRanges = new Set(allEx.map(e => e.rep_range || e.target_rep_range));
      expect(uniqueRepRanges.size).toBeGreaterThanOrEqual(3);
    });

    it('pairs lats + upper_back on same days, enforces 48h rest for arms, blocks pre-fatigue, enforces Leg Extension >= 6 sets, and prevents double flat chest press', () => {
      const routines = generateEngineRoutines({
        experienceLevel: 'intermedio',
        daysPerWeek: 4,
        durationMinutes: 90,
        baseEquipment: ['cable', 'generic_machine'],
        machineBrands: ['Technogym'],
        targetWeeklyVolume: {
          chest: 12,
          lats: 10,
          upper_back: 10,
          shoulders: 8,
          biceps: 8,
          triceps: 8,
          quadriceps: 6,
          hamstrings: 8,
          glutes: 6,
          calves: 4,
          adductors: 4,
          abdominals: 4
        }
      });

      expect(routines.length).toBe(4);

      // 1. Lats and upper_back must appear on the EXACT same days
      const latsDays = routines.map((r, i) => r.exercises.some(e => e.muscle_group === 'lats') ? i : -1).filter(i => i !== -1);
      const upperBackDays = routines.map((r, i) => r.exercises.some(e => e.muscle_group === 'upper_back') ? i : -1).filter(i => i !== -1);
      expect(latsDays).toEqual(upperBackDays);

      // 2. Strict 48h rule for ALL muscles (no consecutive days for biceps, triceps, chest, lats, etc.)
      for (let d = 0; d < routines.length - 1; d++) {
        const musclesToday = new Set(routines[d].exercises.map(e => e.muscle_group));
        const musclesTomorrow = new Set(routines[d + 1].exercises.map(e => e.muscle_group));
        expect(musclesToday.has('triceps') && musclesTomorrow.has('triceps')).toBe(false);
        expect(musclesToday.has('biceps') && musclesTomorrow.has('biceps')).toBe(false);
        expect(musclesToday.has('chest') && musclesTomorrow.has('chest')).toBe(false);
        expect(musclesToday.has('lats') && musclesTomorrow.has('lats')).toBe(false);

        // 3. Synergist pre-fatigue guard: NO biceps day before back, NO triceps day before chest
        const hasBackTomorrow = musclesTomorrow.has('lats') || musclesTomorrow.has('upper_back');
        if (hasBackTomorrow) {
          expect(musclesToday.has('biceps')).toBe(false);
        }
        if (musclesTomorrow.has('chest')) {
          expect(musclesToday.has('triceps')).toBe(false);
        }
      }

      // 4. Mandatory Leg Extension when quadriceps >= 6 sets/wk
      const allEx = routines.flatMap(r => r.exercises);
      const hasLegExtension = allEx.some(e =>
        e.muscle_group === 'quadriceps' &&
        (e.exercise_template_id.includes('leg_extension') || e.title.toLowerCase().includes('leg extension'))
      );
      expect(hasLegExtension).toBe(true);

      // 5. Never two flat chest press machines in the same day
      routines.forEach(r => {
        const flatPresses = r.exercises.filter(e => {
          if (e.muscle_group !== 'chest') return false;
          const t = e.title.toLowerCase();
          const id = e.exercise_template_id.toLowerCase();
          return !t.includes('incline') && !t.includes('inclinad') && !t.includes('pec') && !t.includes('fly') && !t.includes('cruce') && !id.includes('incline') && !id.includes('pec');
        });
        expect(flatPresses.length).toBeLessThanOrEqual(1);
      });
    });

    it('enforces dedicated machines, coherent rep ranges (>=10-15 on isolations/cables), extended-knee calves, chest fly & no front raises, priority triceps before lateral delts, and no adductors before squats', () => {
      // 1. Hammer Strength + Matrix + Cable: dedicated machines chosen over improvised cables, extended-knee calves, pec fly, no front raises, no adductors before squat day
      const routines = generateEngineRoutines({
        experienceLevel: 'avanzado',
        daysPerWeek: 4,
        durationMinutes: 90,
        baseEquipment: ['cable', 'generic_machine'],
        machineBrands: ['Hammer Strength', 'Matrix'],
        targetWeeklyVolume: {
          chest: 12,
          lats: 10,
          upper_back: 10,
          shoulders: 8,
          biceps: 8,
          triceps: 8,
          quadriceps: 10,
          hamstrings: 8,
          glutes: 8,
          calves: 4,
          adductors: 4,
          abdominals: 4
        }
      });

      const allEx = routines.flatMap(r => r.exercises);

      // Dedicated machines instead of improvised cables for leg curl & adductor
      const hamEx = allEx.filter(e => e.muscle_group === 'hamstrings');
      expect(hamEx.length).toBeGreaterThan(0);
      hamEx.forEach(e => {
        expect(e.exercise_template_id).not.toContain('cable_seated_hamstring_curl');
        expect(e.exercise_template_id).not.toContain('cable_standing_leg_curl');
      });

      const addEx = allEx.filter(e => e.muscle_group === 'adductors');
      expect(addEx.length).toBeGreaterThan(0);
      addEx.forEach(e => {
        expect(e.equipment_category).toBe('machine');
      });

      // Calves (4 sets/wk -> 1 exercise): extended-knee variant (NOT Seated Calf)
      const calfEx = allEx.filter(e => e.muscle_group === 'calves');
      expect(calfEx.length).toBe(1);
      expect(calfEx[0].title.toLowerCase()).not.toContain('seated');
      expect(calfEx[0].title.toLowerCase()).not.toContain('sentado');

      // Chest >= 10: no Front Raises in shoulders & at least 1 Pec Fly / Pec Deck
      const shEx = allEx.filter(e => e.muscle_group === 'shoulders');
      shEx.forEach(e => {
        expect(e.exercise_template_id).not.toContain('front_raise');
        expect(e.title.toLowerCase()).not.toContain('elevaciones frontales');
      });
      const hasChestFly = allEx.some(e =>
        e.muscle_group === 'chest' &&
        (e.exercise_template_id.includes('pec') || e.title.toLowerCase().includes('pec') || e.title.toLowerCase().includes('fly') || e.title.toLowerCase().includes('cruce'))
      );
      expect(hasChestFly).toBe(true);

      // Adductors must NOT be placed the day before a quadriceps/squat day
      for (let d = 0; d < routines.length - 1; d++) {
        const hasAdductorsToday = routines[d].exercises.some(e => e.muscle_group === 'adductors');
        const hasQuadsTomorrow = routines[d + 1].exercises.some(e => e.muscle_group === 'quadriceps');
        if (hasQuadsTomorrow) {
          expect(hasAdductorsToday).toBe(false);
        }
      }

      // 2. Elevaciones en Y & Cable Pull-Through never get 6-8 reps (even in avanzado as primary)
      const yRaise = EXERCISE_DATABASE.find(t => t.id === 'cable_y_raise');
      const pullThrough = EXERCISE_DATABASE.find(t => t.id === 'cable_pull_through');
      expect(yRaise).toBeDefined();
      expect(pullThrough).toBeDefined();
      expect(getTargetRepRangeForExercise(yRaise!, true, 'avanzado').repRange).toBe('12-20');
      expect(getTargetRepRangeForExercise(pullThrough!, true, 'avanzado').repRange).toBe('10-15');

      // 3. Push day without compound Shoulder Press: #2 Triceps ordered before #4 Shoulders (lateral)
      const ordered = orderDayExercises(
        [
          { muscle: 'chest', plannedSets: 4 } as any,
          { muscle: 'shoulders', bias: 'shoulder_lateral', plannedSets: 4 } as any,
          { muscle: 'triceps', plannedSets: 4 } as any
        ],
        ['chest', 'triceps', 'lats', 'shoulders'],
        { chest: 12, triceps: 8, shoulders: 8 }
      );
      const triIdx = ordered.findIndex(i => i.muscle === 'triceps');
      const shIdx = ordered.findIndex(i => i.muscle === 'shoulders');
      expect(triIdx).toBeGreaterThan(0); // after chest
      expect(triIdx).toBeLessThan(shIdx); // before lateral delts
    });
  });
});
