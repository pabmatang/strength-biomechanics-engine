import { EXERCISE_DATABASE } from '../data/exercises';
import { Routine, WorkoutExercise, ExerciseTemplate, MuscleGroup } from '../types/workout';

export type BaseEquipmentType = 'free_weight' | 'cable' | 'generic_machine';
export type MachineBrandFilter =
  | 'Technogym'
  | 'Hammer Strength'
  | 'Panatta'
  | 'Nautilus'
  | 'Cybex'
  | 'Matrix'
  | 'Gym80';

export type ExperienceLevel = 'principiante' | 'intermedio' | 'avanzado';
export type SplitDays = 2 | 3 | 4 | 5 | 6;
export type SessionDuration = 45 | 60 | 75 | 90 | 105 | 120;
export type RoutineSplitType = 'ppl' | 'torso_pierna' | 'fullbody' | 'auto';

export interface RoutineGeneratorOptions {
  experienceLevel: ExperienceLevel;
  daysPerWeek: SplitDays;
  durationMinutes: SessionDuration;
  baseEquipment: BaseEquipmentType[]; // At least 1 required
  machineBrands?: MachineBrandFilter[]; // Optional multi-select
  targetWeeklyVolume: Record<string, number>; // muscle -> weekly target sets
  routineSplitType?: RoutineSplitType;
  dislikedMuscles?: string[];
  priorityMuscles?: string[];
}

export const BROAD_GROUP_MAP: Record<string, string> = {
  lats: 'back',
  upper_back: 'back',
  trapezius: 'back',
  traps: 'back',
  lower_back: 'back',
  chest: 'chest',
  shoulders: 'shoulders',
  deltoids_lateral: 'shoulders',
  deltoids_rear: 'shoulders',
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

export const ALL_DISPLAY_MUSCLES: { key: string; label: string; defaultGroup: string }[] = [
  { key: 'chest', label: 'Pectoral', defaultGroup: 'chest' },
  { key: 'lats', label: 'Dorsal (Amplitud)', defaultGroup: 'back' },
  { key: 'upper_back', label: 'Espalda Alta & Trapecio', defaultGroup: 'back' },
  { key: 'shoulders', label: 'Deltoides (Lateral/Frontal)', defaultGroup: 'shoulders' },
  { key: 'biceps', label: 'Bíceps', defaultGroup: 'arms' },
  { key: 'triceps', label: 'Tríceps', defaultGroup: 'arms' },
  { key: 'quadriceps', label: 'Cuádriceps', defaultGroup: 'legs' },
  { key: 'hamstrings', label: 'Isquiosurales (Femoral)', defaultGroup: 'legs' },
  { key: 'glutes', label: 'Glúteo', defaultGroup: 'legs' },
  { key: 'calves', label: 'Gemelos / Pantorrilla', defaultGroup: 'legs' },
  { key: 'adductors', label: 'Aductores / Abductores', defaultGroup: 'legs' },
  { key: 'abdominals', label: 'Abdomen & Core', defaultGroup: 'core' }
];

/**
 * Strict equipment and brand filtering check.
 * Guarantees zero machines when only free_weight and cable are selected.
 */
export function isExerciseAllowed(
  t: ExerciseTemplate,
  baseEquipment: BaseEquipmentType[],
  machineBrands: MachineBrandFilter[] = []
): boolean {
  const cat = t.equipment_category;

  // 1. Free weights
  if (cat === 'dumbbell' || cat === 'barbell' || cat === 'plate' || cat === 'kettlebell' || cat === 'none') {
    return baseEquipment.includes('free_weight');
  }

  // 2. Cables
  if (cat === 'cable') {
    return baseEquipment.includes('cable');
  }

  // 3. Machines and Smith / Guided
  if (cat === 'machine' || cat === 'smith') {
    // If machines are not enabled in any form, reject strictly
    const allowGeneric = baseEquipment.includes('generic_machine');
    const hasBrandFilter = machineBrands.length > 0;

    if (!allowGeneric && !hasBrandFilter) {
      return false;
    }

    const brand = t.brand || 'General';
    const isGenericBrand = brand === 'General' || brand === 'Estándar' || (brand as string) === 'Genérica';

    // If it's a generic machine and generic_machine is selected, allow it
    if (isGenericBrand && allowGeneric) {
      return true;
    }

    // If it matches one of the selected brands, allow it
    if (hasBrandFilter && machineBrands.some(b => brand.toLowerCase().includes(b.toLowerCase()))) {
      return true;
    }

    return false;
  }

  // Reject any other non-free-weight equipment (cardio, etc.)
  return false;
}

/**
 * Calculates a coherent baseline weekly sets budget per muscle based on level, days and session duration.
 */
export function calculateDefaultWeeklyVolume(
  experienceLevel: ExperienceLevel,
  daysPerWeek: SplitDays,
  durationMinutes: SessionDuration
): Record<string, number> {
  // Sets per session budget: ~3.5-4 min per set after 10 min warmup
  const targetSessionSets = Math.max(10, Math.min(32, Math.round((durationMinutes - 10) / 3.6)));
  const totalWeeklyBudget = targetSessionSets * daysPerWeek;

  // Relative muscle distribution ratios
  const baseWeights: Record<string, number> = {
    chest: experienceLevel === 'principiante' ? 6 : experienceLevel === 'intermedio' ? 10 : 14,
    lats: experienceLevel === 'principiante' ? 6 : experienceLevel === 'intermedio' ? 10 : 14,
    upper_back: experienceLevel === 'principiante' ? 4 : experienceLevel === 'intermedio' ? 8 : 10,
    shoulders: experienceLevel === 'principiante' ? 4 : experienceLevel === 'intermedio' ? 8 : 10,
    biceps: experienceLevel === 'principiante' ? 4 : experienceLevel === 'intermedio' ? 8 : 10,
    triceps: experienceLevel === 'principiante' ? 4 : experienceLevel === 'intermedio' ? 8 : 10,
    quadriceps: experienceLevel === 'principiante' ? 6 : experienceLevel === 'intermedio' ? 10 : 14,
    hamstrings: experienceLevel === 'principiante' ? 4 : experienceLevel === 'intermedio' ? 8 : 10,
    glutes: experienceLevel === 'principiante' ? 4 : experienceLevel === 'intermedio' ? 8 : 10,
    calves: experienceLevel === 'principiante' ? 2 : experienceLevel === 'intermedio' ? 6 : 8,
    adductors: experienceLevel === 'principiante' ? 0 : experienceLevel === 'intermedio' ? 4 : 6,
    abdominals: experienceLevel === 'principiante' ? 2 : experienceLevel === 'intermedio' ? 4 : 6
  };

  const rawSum = Object.values(baseWeights).reduce((a, b) => a + b, 0);
  const scale = totalWeeklyBudget / rawSum;

  const result: Record<string, number> = {};
  for (const [m, w] of Object.entries(baseWeights)) {
    // Round to nearest even number for clean session distribution, min 0 max 24
    let val = Math.round((w * scale) / 2) * 2;
    if (w === 0) val = 0;
    result[m] = Math.max(0, Math.min(24, val));
  }

  return result;
}

/**
 * Calculates estimated minutes per session from weekly sets
 */
export function calculateEstimatedSessionDuration(totalWeeklySets: number, daysPerWeek: number): number {
  if (daysPerWeek <= 0) return 60;
  const setsPerSession = totalWeeklySets / daysPerWeek;
  return Math.round(10 + setsPerSession * 3.6);
}

export function isMusclePrioritized(muscle: string, priorities: string[]): boolean {
  if (!priorities || priorities.length === 0) return false;
  if (priorities.includes(muscle)) return true;
  const broad = BROAD_GROUP_MAP[muscle] || muscle;
  if (priorities.includes(broad)) return true;
  if (broad === 'back' && (priorities.includes('lats') || priorities.includes('upper_back') || priorities.includes('back'))) return true;
  if (broad === 'chest' && (priorities.includes('chest') || priorities.includes('pectoral'))) return true;
  return false;
}

export interface DayQueueItem {
  muscle: string;
  bias?: 'lats' | 'upper_back' | 'trapezius';
  note?: string;
  isComplementary?: boolean;
}

export function orderDayExercises(queue: DayQueueItem[], priorities: string[]): DayQueueItem[] {
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

/**
 * Main routine generation engine.
 */
export function generateWizardRoutines(options: RoutineGeneratorOptions): Routine[] {
  const {
    experienceLevel = 'intermedio',
    daysPerWeek,
    durationMinutes,
    baseEquipment,
    machineBrands = [],
    targetWeeklyVolume,
    routineSplitType = 'auto',
    dislikedMuscles = [],
    priorityMuscles = []
  } = options;

  // Normalized exercise count per session:
  // 45m = 4, 60m = 5, 75m = 6, 90m = 7, 105m = 8, 120m = 9
  const exactExercisesCount =
    durationMinutes === 45 ? 4 :
    durationMinutes === 60 ? 5 :
    durationMinutes === 75 ? 6 :
    durationMinutes === 90 ? 7 :
    durationMinutes === 105 ? 8 : 9;

  // 1. Strict allowed exercise pool
  const allowedExercises = EXERCISE_DATABASE.filter(t => isExerciseAllowed(t, baseEquipment, machineBrands));

  // Helper to pick best exercise for muscle strictly within allowedExercises
  const pickBestExercise = (
    muscle: string,
    usedIds: Set<string>,
    variantBias?: 'lats' | 'upper_back' | 'trapezius'
  ): ExerciseTemplate => {
    // First, direct primary muscle match unused
    let pool = allowedExercises.filter(t => t.muscle_group === muscle && !usedIds.has(t.id));

    // Fallback to direct primary match used
    if (pool.length === 0) {
      pool = allowedExercises.filter(t => t.muscle_group === muscle);
    }

    // Fallback to secondary other_muscles
    if (pool.length === 0) {
      pool = allowedExercises.filter(
        t => t.other_muscles && (t.other_muscles as string[]).includes(muscle) && !usedIds.has(t.id)
      );
    }

    // Fallback to broad group match within allowedExercises
    if (pool.length === 0) {
      const broad = BROAD_GROUP_MAP[muscle] || muscle;
      pool = allowedExercises.filter(t => (BROAD_GROUP_MAP[t.muscle_group] || t.muscle_group) === broad);
    }

    // If still empty (e.g. extremely constrained), take any allowed exercise
    if (pool.length === 0) {
      return allowedExercises[0] || EXERCISE_DATABASE[0];
    }

    // Apply variant bias if requested
    if (variantBias && pool.length > 1) {
      const biased = pool.filter(t => {
        const title = t.title.toLowerCase();
        if (variantBias === 'lats') {
          return title.includes('jalón') || title.includes('dorsal') || title.includes('lat') || title.includes('pulldown') || title.includes('pullover');
        } else if (variantBias === 'upper_back') {
          return title.includes('remo') || title.includes('row') || title.includes('pájaros') || title.includes('face') || title.includes('pecho');
        } else if (variantBias === 'trapezius') {
          return title.includes('encogimiento') || title.includes('shrug') || title.includes('trapecio');
        }
        return true;
      });
      if (biased.length > 0) {
        pool = biased;
      }
    }

    return pool[0];
  };

  interface DayPlan {
    name: string;
    focusCategory: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'fullbody';
    focusMuscles: DayQueueItem[];
  }

  let splitPlan: DayPlan[] = [];

  const effectiveSplit = routineSplitType === 'auto'
    ? (daysPerWeek === 2 ? 'fullbody' : daysPerWeek === 4 ? 'torso_pierna' : 'ppl')
    : routineSplitType;

  // Build structure based on split
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
            { muscle: 'abdominals', isComplementary: true },
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'chest' }
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
            { muscle: 'hamstrings' },
            { muscle: 'calves' },
            { muscle: 'glutes' }
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
            { muscle: 'abdominals', isComplementary: true },
            { muscle: 'chest' },
            { muscle: 'upper_back', bias: 'upper_back' }
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
            { muscle: 'quadriceps' },
            { muscle: 'glutes' },
            { muscle: 'calves' }
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
            { muscle: 'abdominals', isComplementary: true },
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'chest' }
          ]
        }
      ];
    } else {
      // 4-day Torso / Pierna
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
            { muscle: 'abdominals', isComplementary: true },
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'chest' }
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
            { muscle: 'hamstrings' },
            { muscle: 'calves' },
            { muscle: 'glutes' }
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
            { muscle: 'abdominals', isComplementary: true },
            { muscle: 'chest' },
            { muscle: 'upper_back', bias: 'upper_back' }
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
            { muscle: 'quadriceps' },
            { muscle: 'glutes' },
            { muscle: 'calves' }
          ]
        }
      ];
    }
  } else if (effectiveSplit === 'fullbody') {
    // 2-day Full Body
    splitPlan = [
      {
        name: 'Día 1: Full Body A (Sentadilla, Tracción & Empuje)',
        focusCategory: 'fullbody',
        focusMuscles: [
          { muscle: 'quadriceps' },
          { muscle: 'chest' },
          { muscle: 'lats', bias: 'lats' },
          { muscle: 'hamstrings' },
          { muscle: 'shoulders' },
          { muscle: 'biceps' },
          { muscle: 'triceps' },
          { muscle: 'calves' },
          { muscle: 'abdominals', isComplementary: true }
        ]
      },
      {
        name: 'Día 2: Full Body B (Bisagra, Espalda Alta & Brazos)',
        focusCategory: 'fullbody',
        focusMuscles: [
          { muscle: 'hamstrings' },
          { muscle: 'upper_back', bias: 'upper_back' },
          { muscle: 'chest' },
          { muscle: 'quadriceps' },
          { muscle: 'glutes' },
          { muscle: 'triceps' },
          { muscle: 'biceps' },
          { muscle: 'shoulders' },
          { muscle: 'abdominals', isComplementary: true }
        ]
      }
    ];
  } else {
    // Default PPL (3, 5, 6 days)
    if (daysPerWeek === 3) {
      splitPlan = [
        {
          name: 'Día 1: Push (Pecho, Deltoides & Tríceps Intercalados)',
          focusCategory: 'push',
          focusMuscles: [
            { muscle: 'chest' },
            { muscle: 'shoulders' },
            { muscle: 'chest' },
            { muscle: 'triceps' },
            { muscle: 'shoulders' },
            { muscle: 'triceps' },
            { muscle: 'abdominals', isComplementary: true },
            { muscle: 'chest' },
            { muscle: 'triceps' }
          ]
        },
        {
          name: 'Día 2: Pull (Dorsal, Espalda Alta & Bíceps)',
          focusCategory: 'pull',
          focusMuscles: [
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'biceps' },
            { muscle: 'upper_back', bias: 'upper_back' },
            { muscle: 'biceps' },
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'upper_back', bias: 'trapezius' },
            { muscle: 'abdominals', isComplementary: true },
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'biceps' }
          ]
        },
        {
          name: 'Día 3: Legs (Cuádriceps, Isquios & Glúteo)',
          focusCategory: 'legs',
          focusMuscles: [
            { muscle: 'quadriceps' },
            { muscle: 'hamstrings' },
            { muscle: 'quadriceps' },
            { muscle: 'calves' },
            { muscle: 'adductors', isComplementary: true },
            { muscle: 'glutes' },
            { muscle: 'hamstrings' },
            { muscle: 'calves' },
            { muscle: 'glutes' }
          ]
        }
      ];
    } else if (daysPerWeek === 5) {
      splitPlan = [
        {
          name: 'Día 1: Push A (Pecho, Deltoides Lateral & Tríceps)',
          focusCategory: 'push',
          focusMuscles: [
            { muscle: 'chest' },
            { muscle: 'shoulders' },
            { muscle: 'chest' },
            { muscle: 'triceps' },
            { muscle: 'shoulders' },
            { muscle: 'triceps' },
            { muscle: 'abdominals', isComplementary: true },
            { muscle: 'chest' },
            { muscle: 'triceps' }
          ]
        },
        {
          name: 'Día 2: Pull A (Dorsal, Espalda Alta & Bíceps)',
          focusCategory: 'pull',
          focusMuscles: [
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'biceps' },
            { muscle: 'upper_back', bias: 'upper_back' },
            { muscle: 'biceps' },
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'upper_back', bias: 'trapezius' },
            { muscle: 'abdominals', isComplementary: true },
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'biceps' }
          ]
        },
        {
          name: 'Día 3: Legs A (Cuádriceps, Femoral & Gemelo)',
          focusCategory: 'legs',
          focusMuscles: [
            { muscle: 'quadriceps' },
            { muscle: 'hamstrings' },
            { muscle: 'quadriceps' },
            { muscle: 'calves' },
            { muscle: 'adductors', isComplementary: true },
            { muscle: 'glutes' },
            { muscle: 'hamstrings' },
            { muscle: 'calves' },
            { muscle: 'glutes' }
          ]
        },
        {
          name: 'Día 4: Upper Body (Tracción, Empuje & Brazos)',
          focusCategory: 'upper',
          focusMuscles: [
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'chest' },
            { muscle: 'upper_back', bias: 'upper_back' },
            { muscle: 'shoulders' },
            { muscle: 'biceps' },
            { muscle: 'triceps' },
            { muscle: 'abdominals', isComplementary: true },
            { muscle: 'chest' },
            { muscle: 'upper_back', bias: 'upper_back' }
          ]
        },
        {
          name: 'Día 5: Lower Body & Glúteos (Cadena Posterior & Pierna)',
          focusCategory: 'legs',
          focusMuscles: [
            { muscle: 'hamstrings' },
            { muscle: 'quadriceps' },
            { muscle: 'glutes' },
            { muscle: 'calves' },
            { muscle: 'adductors', isComplementary: true },
            { muscle: 'glutes' },
            { muscle: 'quadriceps' },
            { muscle: 'hamstrings' },
            { muscle: 'calves' }
          ]
        }
      ];
    } else {
      // 6 days PPL x 2
      splitPlan = [
        {
          name: 'Día 1: Push A (Pecho Foco & Deltoides)',
          focusCategory: 'push',
          focusMuscles: [
            { muscle: 'chest' },
            { muscle: 'shoulders' },
            { muscle: 'chest' },
            { muscle: 'triceps' },
            { muscle: 'shoulders' },
            { muscle: 'triceps' },
            { muscle: 'abdominals', isComplementary: true },
            { muscle: 'chest' },
            { muscle: 'triceps' }
          ]
        },
        {
          name: 'Día 2: Pull A (Dorsal Ancho & Bíceps)',
          focusCategory: 'pull',
          focusMuscles: [
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'biceps' },
            { muscle: 'upper_back', bias: 'upper_back' },
            { muscle: 'biceps' },
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'upper_back', bias: 'trapezius' },
            { muscle: 'abdominals', isComplementary: true },
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'biceps' }
          ]
        },
        {
          name: 'Día 3: Legs A (Cuádriceps & Gemelo)',
          focusCategory: 'legs',
          focusMuscles: [
            { muscle: 'quadriceps' },
            { muscle: 'hamstrings' },
            { muscle: 'quadriceps' },
            { muscle: 'calves' },
            { muscle: 'adductors', isComplementary: true },
            { muscle: 'glutes' },
            { muscle: 'hamstrings' },
            { muscle: 'calves' },
            { muscle: 'glutes' }
          ]
        },
        {
          name: 'Día 4: Push B (Hombro Foco & Pecho)',
          focusCategory: 'push',
          focusMuscles: [
            { muscle: 'shoulders' },
            { muscle: 'chest' },
            { muscle: 'triceps' },
            { muscle: 'shoulders' },
            { muscle: 'chest' },
            { muscle: 'triceps' },
            { muscle: 'abdominals', isComplementary: true },
            { muscle: 'shoulders' },
            { muscle: 'chest' }
          ]
        },
        {
          name: 'Día 5: Pull B (Espalda Alta & Bíceps)',
          focusCategory: 'pull',
          focusMuscles: [
            { muscle: 'upper_back', bias: 'upper_back' },
            { muscle: 'biceps' },
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'biceps' },
            { muscle: 'upper_back', bias: 'trapezius' },
            { muscle: 'lats', bias: 'lats' },
            { muscle: 'abdominals', isComplementary: true },
            { muscle: 'upper_back', bias: 'upper_back' },
            { muscle: 'biceps' }
          ]
        },
        {
          name: 'Día 6: Legs B (Isquios & Cadena Posterior)',
          focusCategory: 'legs',
          focusMuscles: [
            { muscle: 'hamstrings' },
            { muscle: 'glutes' },
            { muscle: 'quadriceps' },
            { muscle: 'calves' },
            { muscle: 'adductors', isComplementary: true },
            { muscle: 'hamstrings' },
            { muscle: 'glutes' },
            { muscle: 'quadriceps' },
            { muscle: 'calves' }
          ]
        }
      ];
    }
  }

  // Count how many times each muscle appears across the whole routine
  const muscleOccurrenceCount: Record<string, number> = {};
  splitPlan.forEach(day => {
    day.focusMuscles.forEach(item => {
      const broad = BROAD_GROUP_MAP[item.muscle] || item.muscle;
      // Check if excluded: volume === 0 or in dislikedMuscles
      const targetSets = targetWeeklyVolume[item.muscle] ?? targetWeeklyVolume[broad] ?? 10;
      if (targetSets > 0 && !dislikedMuscles.includes(item.muscle) && !dislikedMuscles.includes(broad)) {
        muscleOccurrenceCount[item.muscle] = (muscleOccurrenceCount[item.muscle] || 0) + 1;
      }
    });
  });

  const routines: Routine[] = [];

  splitPlan.forEach((dayPlan, dayIdx) => {
    const usedIds = new Set<string>();

    // 1. Filter out omitted muscles (targetWeeklyVolume === 0 or in dislikedMuscles)
    let validQueue = dayPlan.focusMuscles.filter(item => {
      const broad = BROAD_GROUP_MAP[item.muscle] || item.muscle;
      const targetSets = targetWeeklyVolume[item.muscle] ?? targetWeeklyVolume[broad] ?? 10;
      if (targetSets <= 0) return false;
      if (dislikedMuscles.includes(item.muscle) || dislikedMuscles.includes(broad)) return false;
      return true;
    });

    // 2. Order queue prioritizing priorityMuscles
    validQueue = orderDayExercises(validQueue, priorityMuscles);

    // 3. Take exactly exactExercisesCount exercises
    const selectedQueue = validQueue.slice(0, exactExercisesCount);

    // If still short of exactExercisesCount (e.g. user set many muscles to 0), fill from allowed non-zero muscles
    if (selectedQueue.length < exactExercisesCount) {
      const allowedMuscles = Object.entries(targetWeeklyVolume)
        .filter(([m, v]) => v > 0 && !dislikedMuscles.includes(m))
        .map(([m]) => m);

      for (const m of allowedMuscles) {
        if (selectedQueue.length >= exactExercisesCount) break;
        selectedQueue.push({ muscle: m });
      }
    }

    const exercises: WorkoutExercise[] = [];

    selectedQueue.forEach((item, exIdx) => {
      const template = pickBestExercise(item.muscle, usedIds, item.bias);
      usedIds.add(template.id);

      // Determine sets count for this exercise based on targetWeeklyVolume
      const broad = BROAD_GROUP_MAP[item.muscle] || item.muscle;
      const totalWeeklySets = targetWeeklyVolume[item.muscle] ?? targetWeeklyVolume[broad] ?? 10;
      const occurrences = muscleOccurrenceCount[item.muscle] || 1;
      
      // Distribute sets cleanly per session
      let setsForThisExercise = Math.max(2, Math.round(totalWeeklySets / occurrences));

      // Clamp between 2 and 5 sets per exercise
      setsForThisExercise = Math.max(2, Math.min(5, setsForThisExercise));

      const defaultWeight =
        template.equipment_category === 'barbell' ? 50 :
        template.equipment_category === 'dumbbell' ? 18 :
        template.equipment_category === 'cable' ? 25 :
        template.equipment_category === 'machine' ? 40 : 0;

      const sets = Array.from({ length: setsForThisExercise }, (_, sIdx) => {
        const isWarmup = sIdx === 0 && (experienceLevel === 'avanzado' || (setsForThisExercise >= 4 && sIdx === 0));
        const isFailure = sIdx === setsForThisExercise - 1 && experienceLevel === 'avanzado';

        return {
          id: `s_${dayIdx + 1}_${exIdx + 1}_${sIdx + 1}`,
          index: sIdx + 1,
          type: isWarmup ? ('warmup' as const) : isFailure ? ('failure' as const) : ('normal' as const),
          weight_kg: isWarmup ? Math.round(defaultWeight * 0.6) : defaultWeight,
          reps: isWarmup ? 12 : 8 + (sIdx % 3) * 2,
          is_completed: false
        };
      });

      exercises.push({
        id: `we_${dayIdx + 1}_${exIdx + 1}`,
        exercise_template_id: template.id,
        title: template.title,
        brand: template.brand,
        muscle_group: template.muscle_group,
        equipment_category: template.equipment_category,
        exercise_type: template.exercise_type,
        catalog_machine_id: template.catalog_machine_id,
        image_url: template.image_url,
        notes: item.note || (template.setup_tips ? template.setup_tips[0] : undefined),
        sets
      });
    });

    routines.push({
      id: `wizard_routine_day_${dayIdx + 1}`,
      title: dayPlan.name,
      folder_name: 'Rutina Generada por MIA',
      description: `Sesión de ${durationMinutes} min · ${exercises.length} ejercicios · ${exercises.reduce((acc, e) => acc + e.sets.length, 0)} series`,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      exercises
    });
  });

  return routines;
}
