import { EXERCISE_DATABASE } from '../data/exercises';
import { Routine, WorkoutExercise, ExerciseTemplate, MuscleGroup } from '../types/workout';

export type BaseEquipmentType = 'free_weight' | 'cable' | 'generic_machine';
export type MachineBrandFilter =
  | 'Technogym'
  | 'Hammer Strength'
  | 'Titanium Strength'
  | 'Panatta'
  | 'Nautilus'
  | 'Cybex'
  | 'Matrix'
  | 'Gym80'
  | 'Life Fitness'
  | 'Precor';

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
  priorityOrder?: string[];
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
  bias?: 'lats' | 'upper_back' | 'trapezius' | 'quad_extension';
  note?: string;
  isComplementary?: boolean;
}

export const FINISHER_MUSCLES = new Set(['calves', 'adductors', 'abdominals']);

export function getExercisePattern(t: ExerciseTemplate): string {
  const id = (t.id || '').toLowerCase();
  const title = (t.title || '').toLowerCase();
  const m = t.muscle_group;

  if (m === 'chest') {
    if (id.includes('incline') || title.includes('incline') || title.includes('inclinad')) return 'chest_incline_press';
    if (id.includes('decline') || title.includes('decline') || title.includes('declinad') || id.includes('wide') || title.includes('wide')) return 'chest_decline_wide_press';
    if (id.includes('pec_deck') || id.includes('pec_fly') || id.includes('fly') || title.includes('apertura') || title.includes('pec')) return 'chest_fly_pec_deck';
    return 'chest_flat_press';
  }
  if (m === 'lats' || m === 'upper_back' || m === 'traps') {
    if (id.includes('pullover') || title.includes('pullover')) return 'back_pullover';
    if (id.includes('pulldown') || id.includes('lat_machine') || id.includes('vertical_traction') || title.includes('jalón') || title.includes('dominada')) return 'back_vertical_pull';
    if (id.includes('t_bar') || id.includes('high_row') || title.includes('remo en t') || title.includes('remo alto') || title.includes('dy_row')) return 'back_tbar_high_row';
    if (id.includes('shrug') || title.includes('encogimiento')) return 'back_shrug';
    if (id.includes('face_pull') || id.includes('rear_delt') || title.includes('pájaro')) return 'back_rear_delt';
    return 'back_horizontal_row';
  }
  if (m === 'shoulders') {
    if (id.includes('lateral') || id.includes('delts_machine') || title.includes('lateral') || title.includes('delts')) return 'shoulder_lateral_raise';
    return 'shoulder_press';
  }
  if (m === 'biceps') {
    if (id.includes('scott') || id.includes('preacher') || title.includes('predicador') || t.equipment_category === 'machine') return 'biceps_preacher_machine';
    if (id.includes('incline') || title.includes('inclinad')) return 'biceps_incline_curl';
    if (id.includes('hammer') || title.includes('martillo')) return 'biceps_hammer_curl';
    return 'biceps_standing_curl';
  }
  if (m === 'triceps') {
    if (id.includes('dip') || id.includes('triceps_press') || title.includes('fondo')) return 'triceps_dip_press';
    if (id.includes('skull') || id.includes('french') || id.includes('francés') || id.includes('overhead')) return 'triceps_overhead';
    return 'triceps_pushdown_extension';
  }
  if (m === 'quadriceps') {
    if (id.includes('leg_extension') || title.includes('extensión de cuádriceps') || title.includes('leg extension')) return 'quad_leg_extension';
    if (id.includes('leg_press') || title.includes('prensa')) return 'quad_leg_press';
    return 'quad_squat_pattern';
  }
  if (m === 'hamstrings') {
    if (id.includes('seated_leg_curl') || title.includes('sentado')) return 'ham_seated_curl';
    if (id.includes('leg_curl') || id.includes('prone') || id.includes('lying') || id.includes('standing_leg_curl') || title.includes('curl')) return 'ham_lying_curl';
    return 'ham_hinge_rdl';
  }
  if (m === 'glutes') {
    if (id.includes('hip_thrust') || id.includes('glute_drive') || id.includes('platinum') || title.includes('hip thrust') || title.includes('bridge')) return 'glute_hip_thrust';
    if (id.includes('abductor') || title.includes('abductor')) return 'glute_abductor';
    return 'glute_kickback_extension';
  }
  if (m === 'calves') {
    if (id.includes('seated') || title.includes('sentado')) return 'calf_seated';
    return 'calf_standing';
  }
  if (m === 'adductors' || m === 'abductors') return 'hip_adduction_abduction';
  if (m === 'abdominals') return 'core_crunch';
  return `${m}_${t.equipment_category}`;
}

export function isAntagonistPair(m1: string, m2: string): boolean {
  const b1 = BROAD_GROUP_MAP[m1] || m1;
  const b2 = BROAD_GROUP_MAP[m2] || m2;
  const pair = [b1, b2].sort().join('|');
  return (
    pair === 'back|chest' ||
    pair === 'hamstrings|quadriceps' ||
    pair === 'glutes|quadriceps' ||
    pair === 'biceps|triceps' ||
    pair === 'back|shoulders'
  );
}

export function getTargetRepsForExercise(
  t: ExerciseTemplate,
  isPrimaryCompound: boolean,
  experienceLevel: ExperienceLevel
): number {
  const pattern = getExercisePattern(t);
  const m = t.muscle_group;

  // 12-20 reps: lateral delts, calves, adductors/abductors, abs
  if (
    pattern === 'shoulder_lateral_raise' ||
    m === 'calves' ||
    m === 'adductors' ||
    m === 'abductors' ||
    m === 'abdominals'
  ) {
    return 15;
  }

  // 10-15 reps: arm & leg isolations
  if (
    m === 'biceps' ||
    m === 'triceps' ||
    pattern === 'quad_leg_extension' ||
    pattern === 'ham_seated_curl' ||
    pattern === 'ham_lying_curl' ||
    pattern === 'chest_fly_pec_deck' ||
    pattern === 'back_rear_delt'
  ) {
    return 12;
  }

  // 6-10 reps (or 6-8 in avanzado): heavy primary compounds
  if (isPrimaryCompound) {
    return experienceLevel === 'avanzado' ? 7 : 8;
  }

  // 8-12 reps: secondary guided machines / secondary compounds
  return 10;
}

export function orderDayExercises(
  queue: DayQueueItem[],
  priorities: string[],
  targetWeeklyVolume: Record<string, number> = {}
): DayQueueItem[] {
  if (queue.length <= 1) return queue;

  const getRank = (muscle: string): number => {
    const broad = BROAD_GROUP_MAP[muscle] || muscle;
    if (priorities && priorities.length > 0) {
      const idx = priorities.findIndex(p => p === muscle || p === broad);
      if (idx !== -1) return idx;
    }
    return 999;
  };

  const getVol = (muscle: string): number => {
    const broad = BROAD_GROUP_MAP[muscle] || muscle;
    return targetWeeklyVolume[muscle] ?? targetWeeklyVolume[broad] ?? 10;
  };

  const isFinisher = (item: DayQueueItem): boolean => {
    return FINISHER_MUSCLES.has(item.muscle) || getVol(item.muscle) <= 4;
  };

  const mainItems = queue.filter(i => !isFinisher(i));
  const finisherItems = queue.filter(i => isFinisher(i));

  // Group main items by muscle, ordered by priority rank (then descending volume)
  const uniqueMainMuscles = Array.from(new Set(mainItems.map(i => i.muscle))).sort((a, b) => {
    const ra = getRank(a);
    const rb = getRank(b);
    if (ra !== rb) return ra - rb;
    return getVol(b) - getVol(a);
  });

  const pools: Record<string, DayQueueItem[]> = {};
  uniqueMainMuscles.forEach(m => {
    pools[m] = mainItems.filter(i => i.muscle === m);
  });

  const orderedMain: DayQueueItem[] = [];
  if (uniqueMainMuscles.length >= 2) {
    const m1 = uniqueMainMuscles[0];
    const m2 = uniqueMainMuscles[1];
    if (isAntagonistPair(m1, m2)) {
      // Interleave #1 <-> #2
      while ((pools[m1]?.length || 0) > 0 || (pools[m2]?.length || 0) > 0) {
        if (pools[m1]?.length) orderedMain.push(pools[m1].shift()!);
        if (pools[m2]?.length) orderedMain.push(pools[m2].shift()!);
      }
    }
  }

  // Drain remaining main muscles in strict priority order
  for (const m of uniqueMainMuscles) {
    while (pools[m]?.length) {
      orderedMain.push(pools[m].shift()!);
    }
  }

  // Finishers always at the end, sorted by priorityOrder if provided
  finisherItems.sort((a, b) => getRank(a.muscle) - getRank(b.muscle));

  return [...orderedMain, ...finisherItems];
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
    priorityMuscles = [],
    priorityOrder = []
  } = options;

  const effectivePriorities = priorityOrder.length > 0 ? priorityOrder : priorityMuscles;

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
  // Enforces anti-redundancy (no duplicate biomechanical pattern in same day) and Day A / Day B rotation
  const pickBestExercise = (
    muscle: string,
    usedIds: Set<string>,
    usedPatterns: Set<string>,
    globalUsedIds: Set<string>,
    variantBias?: 'lats' | 'upper_back' | 'trapezius' | 'quad_extension',
    preferCompound: boolean = false
  ): ExerciseTemplate => {
    let pool = allowedExercises.filter(t => t.muscle_group === muscle && !usedIds.has(t.id));

    if (pool.length === 0) {
      pool = allowedExercises.filter(t => t.muscle_group === muscle);
    }
    if (pool.length === 0) {
      pool = allowedExercises.filter(
        t => t.other_muscles && (t.other_muscles as string[]).includes(muscle) && !usedIds.has(t.id)
      );
    }
    if (pool.length === 0) {
      const broad = BROAD_GROUP_MAP[muscle] || muscle;
      pool = allowedExercises.filter(t => (BROAD_GROUP_MAP[t.muscle_group] || t.muscle_group) === broad);
    }
    if (pool.length === 0) {
      return allowedExercises[0] || EXERCISE_DATABASE[0];
    }

    // Filter out already-used biomechanical patterns in this session when alternatives exist
    const nonRedundant = pool.filter(t => !usedPatterns.has(getExercisePattern(t)));
    if (nonRedundant.length > 0) {
      pool = nonRedundant;
    }

    // Apply variant bias if requested
    if (variantBias && pool.length > 1) {
      const biased = pool.filter(t => {
        const title = t.title.toLowerCase();
        const id = t.id.toLowerCase();
        if (variantBias === 'lats') {
          return title.includes('jalón') || title.includes('dorsal') || title.includes('lat') || title.includes('pulldown') || title.includes('pullover');
        } else if (variantBias === 'upper_back') {
          return title.includes('remo') || title.includes('row') || title.includes('pájaros') || title.includes('face') || title.includes('pecho');
        } else if (variantBias === 'trapezius') {
          return title.includes('encogimiento') || title.includes('shrug') || title.includes('trapecio');
        } else if (variantBias === 'quad_extension') {
          return id.includes('leg_extension') || title.includes('leg extension') || title.includes('extensión');
        }
        return true;
      });
      if (biased.length > 0) {
        pool = biased;
      }
    } else if (variantBias === 'quad_extension') {
      const extPool = pool.filter(t => t.id.toLowerCase().includes('leg_extension') || t.title.toLowerCase().includes('leg extension'));
      if (extPool.length > 0) pool = extPool;
    }

    // Prefer compound for opening exercise when requested
    if (preferCompound && pool.length > 1) {
      const compoundPool = pool.filter(t => {
        const pat = getExercisePattern(t);
        return !pat.includes('fly') && !pat.includes('extension') && !pat.includes('curl') && !pat.includes('lateral') && !pat.includes('abductor');
      });
      if (compoundPool.length > 0) {
        pool = compoundPool;
      }
    }

    // Rotate machines/angles across Day A / Day B whenever available
    const freshAcrossWeek = pool.filter(t => !globalUsedIds.has(t.id));
    if (freshAcrossWeek.length > 0) {
      pool = freshAcrossWeek;
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

  // Map each muscle -> list of compatible day indices in splitPlan
  const muscleDaysMap: Record<string, number[]> = {};
  splitPlan.forEach((day, dIdx) => {
    const seenInDay = new Set<string>();
    day.focusMuscles.forEach(item => {
      const m = item.muscle;
      if (seenInDay.has(m)) return;
      seenInDay.add(m);
      const broad = BROAD_GROUP_MAP[m] || m;
      const targetSets = targetWeeklyVolume[m] ?? targetWeeklyVolume[broad] ?? 0;
      if (targetSets > 0 && !dislikedMuscles.includes(m) && !dislikedMuscles.includes(broad)) {
        if (!muscleDaysMap[m]) muscleDaysMap[m] = [];
        muscleDaysMap[m].push(dIdx);
      }
    });
  });

  // Ensure any non-zero muscle in targetWeeklyVolume has at least one compatible day
  Object.entries(targetWeeklyVolume).forEach(([m, sets]) => {
    if (sets <= 0 || dislikedMuscles.includes(m)) return;
    if (!muscleDaysMap[m] || muscleDaysMap[m].length === 0) {
      const isLower = ['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'].includes(m);
      const matchIdx = splitPlan.findIndex(d =>
        isLower ? (d.focusCategory === 'lower' || d.focusCategory === 'legs' || d.focusCategory === 'fullbody') : (d.focusCategory !== 'lower' && d.focusCategory !== 'legs')
      );
      muscleDaysMap[m] = [matchIdx >= 0 ? matchIdx : 0];
    }
  });

  // Allocate exact weekly sets per (dayIdx, muscle)
  // Maintenance (1..4 sets/wk) is consolidated into ONE single session per week!
  const dayMuscleSets: Record<number, Record<string, number>> = {};
  splitPlan.forEach((_, idx) => { dayMuscleSets[idx] = {}; });

  Object.entries(muscleDaysMap).forEach(([m, dayIndices]) => {
    const broad = BROAD_GROUP_MAP[m] || m;
    const totalSets = targetWeeklyVolume[m] ?? targetWeeklyVolume[broad] ?? 0;
    if (totalSets <= 0 || dayIndices.length === 0) return;

    if (totalSets <= 4) {
      // Consolidate 100% into a single session
      const chosenDay = m === 'abdominals' ? dayIndices[dayIndices.length - 1] : dayIndices[0];
      dayMuscleSets[chosenDay][m] = totalSets;
    } else {
      const count = dayIndices.length;
      const base = Math.floor(totalSets / count);
      const rem = totalSets % count;
      dayIndices.forEach((dIdx, i) => {
        const allocated = base + (i < rem ? 1 : 0);
        if (allocated > 0) {
          dayMuscleSets[dIdx][m] = allocated;
        }
      });
    }
  });

  const routines: Routine[] = [];
  const globalUsedIds = new Set<string>();

  splitPlan.forEach((dayPlan, dayIdx) => {
    const usedIds = new Set<string>();
    const usedPatterns = new Set<string>();
    const allocatedForDay = dayMuscleSets[dayIdx] || {};

    // Build DayQueueItems with exact set counts per exercise
    interface PlannedItem extends DayQueueItem {
      plannedSets: number;
    }
    const dayQueue: PlannedItem[] = [];

    Object.entries(allocatedForDay).forEach(([m, setsForMuscle]) => {
      if (setsForMuscle <= 0) return;

      // Count distinct available templates/patterns for this muscle
      const availForMuscle = allowedExercises.filter(t => t.muscle_group === m);
      const distinctPatterns = new Set(availForMuscle.map(t => getExercisePattern(t))).size;

      // Normal: 2-4 sets/exercise prioritizing variety; 4-5 sets ONLY as fallback for short sessions or limited equipment
      let numExercises = setsForMuscle <= 4 ? 1 : setsForMuscle <= 8 ? 2 : 3;
      if (durationMinutes <= 45 && setsForMuscle <= 5) {
        numExercises = 1;
      }
      if (distinctPatterns > 0) {
        numExercises = Math.min(numExercises, Math.max(1, distinctPatterns));
      }
      // Ensure each exercise gets at least 2 sets (or exact 1 set if user configured 1 set)
      if (setsForMuscle >= 2) {
        while (numExercises > 1 && Math.floor(setsForMuscle / numExercises) < 2) {
          numExercises--;
        }
      }

      const baseSets = Math.floor(setsForMuscle / numExercises);
      const remSets = setsForMuscle % numExercises;

      // Gather bias hints from dayPlan.focusMuscles
      const planBiases = dayPlan.focusMuscles.filter(x => x.muscle === m && x.bias).map(x => x.bias);

      for (let i = 0; i < numExercises; i++) {
        const exSets = baseSets + (i < remSets ? 1 : 0);
        if (exSets <= 0) continue;
        let bias: PlannedItem['bias'] = planBiases[i] as any;
        if (m === 'quadriceps' && numExercises >= 2 && i === numExercises - 1) {
          bias = 'quad_extension';
        }
        dayQueue.push({
          muscle: m,
          bias,
          plannedSets: exSets,
          isComplementary: FINISHER_MUSCLES.has(m) || setsForMuscle <= 4
        });
      }
    });

    // Smart sequencing: Priority opening, #1 <-> #2 antagonist interleaving, finishers strictly last
    const orderedQueue = orderDayExercises(dayQueue, effectivePriorities, targetWeeklyVolume) as PlannedItem[];

    const exercises: WorkoutExercise[] = [];
    const seenPrimaryMuscles = new Set<string>();

    orderedQueue.forEach((item, exIdx) => {
      const isFirstForMuscle = !seenPrimaryMuscles.has(item.muscle);
      seenPrimaryMuscles.add(item.muscle);

      const template = pickBestExercise(
        item.muscle,
        usedIds,
        usedPatterns,
        globalUsedIds,
        item.bias,
        isFirstForMuscle
      );
      usedIds.add(template.id);
      usedPatterns.add(getExercisePattern(template));
      globalUsedIds.add(template.id);

      const setsForThisExercise = Math.max(1, item.plannedSets);
      const isPrimaryCompound = isFirstForMuscle && !FINISHER_MUSCLES.has(item.muscle);
      const baseReps = getTargetRepsForExercise(template, isPrimaryCompound, experienceLevel);

      const defaultWeight =
        template.equipment_category === 'barbell' ? 50 :
        template.equipment_category === 'dumbbell' ? 18 :
        template.equipment_category === 'cable' ? 25 :
        template.equipment_category === 'machine' ? 40 : 0;

      const sets = Array.from({ length: setsForThisExercise }, (_, sIdx) => {
        const isWarmup = sIdx === 0 && (experienceLevel === 'avanzado' && setsForThisExercise >= 3);
        const isFailure = sIdx === setsForThisExercise - 1 && experienceLevel === 'avanzado' && setsForThisExercise >= 2;

        return {
          id: `s_${dayIdx + 1}_${exIdx + 1}_${sIdx + 1}`,
          index: sIdx + 1,
          type: isWarmup ? ('warmup' as const) : isFailure ? ('failure' as const) : ('normal' as const),
          weight_kg: isWarmup ? Math.round(defaultWeight * 0.6) : defaultWeight,
          reps: isWarmup ? Math.min(12, baseReps + 2) : baseReps,
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
      id: `wizard_routine_${Date.now()}_day_${dayIdx + 1}`,
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
