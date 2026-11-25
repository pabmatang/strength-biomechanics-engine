import { EXERCISE_DATABASE } from '../data/exercises';
import { Routine, WorkoutExercise, ExerciseTemplate } from '../types/workout';

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

export const FINISHER_MUSCLES = new Set(['calves', 'adductors', 'abdominals']);
const LOWER_MUSCLES = new Set(['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors']);

/**
 * Strict equipment and brand filtering check.
 */
export function isExerciseAllowed(
  t: ExerciseTemplate,
  baseEquipment: BaseEquipmentType[],
  machineBrands: MachineBrandFilter[] = []
): boolean {
  const cat = t.equipment_category;

  if (cat === 'dumbbell' || cat === 'barbell' || cat === 'plate' || cat === 'kettlebell' || cat === 'none') {
    return baseEquipment.includes('free_weight');
  }

  if (cat === 'cable') {
    if (!baseEquipment.includes('cable')) return false;
    // Generic cables (General) are always allowed when cable is enabled;
    // branded cable stations (e.g. Technogym DAP) are allowed if that brand is selected or generic_machine is on.
    const brand = t.brand || 'General';
    if (brand === 'General' || brand === 'Estándar') return true;
    if (machineBrands.length > 0 && machineBrands.some(b => brand.toLowerCase().includes(b.toLowerCase()))) return true;
    return baseEquipment.includes('generic_machine');
  }

  if (cat === 'machine' || cat === 'smith') {
    const allowGeneric = baseEquipment.includes('generic_machine');
    const hasBrandFilter = machineBrands.length > 0;
    if (!allowGeneric && !hasBrandFilter) return false;

    const brand = t.brand || 'General';
    const isGenericBrand = brand === 'General' || brand === 'Estándar' || (brand as string) === 'Genérica';
    if (isGenericBrand && allowGeneric) return true;
    if (hasBrandFilter && machineBrands.some(b => brand.toLowerCase().includes(b.toLowerCase()))) return true;
    return false;
  }

  return false;
}

export function calculateDefaultWeeklyVolume(
  experienceLevel: ExperienceLevel,
  daysPerWeek: SplitDays,
  durationMinutes: SessionDuration
): Record<string, number> {
  const targetSessionSets = Math.max(10, Math.min(32, Math.round((durationMinutes - 10) / 3.6)));
  const totalWeeklyBudget = targetSessionSets * daysPerWeek;

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
    let val = Math.round((w * scale) / 2) * 2;
    if (w === 0) val = 0;
    result[m] = Math.max(0, Math.min(24, val));
  }

  return result;
}

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
  bias?: 'lats' | 'upper_back' | 'trapezius' | 'quad_extension' | 'shoulder_lateral' | 'shoulder_press' | 'ham_knee_flexion' | 'chest_fly' | 'calf_extended' | 'calf_seated';
  note?: string;
  isComplementary?: boolean;
}

export function getExercisePattern(t: ExerciseTemplate): string {
  const id = (t.id || '').toLowerCase();
  const title = (t.title || '').toLowerCase();
  const m = t.muscle_group;

  if (m === 'chest') {
    if (id.includes('incline') || title.includes('incline') || title.includes('inclinad')) return 'chest_incline_press';
    if (id.includes('decline') || title.includes('decline') || title.includes('declinad') || id.includes('wide') || title.includes('wide')) return 'chest_decline_wide_press';
    if (id.includes('pec_deck') || id.includes('pec_fly') || id.includes('fly') || title.includes('apertura') || title.includes('pec') || title.includes('cruce')) return 'chest_fly_pec_deck';
    return 'chest_flat_press';
  }
  if (m === 'lats' || m === 'upper_back' || m === 'traps') {
    if (id.includes('pullover') || id.includes('lat_prayer') || title.includes('pullover')) return 'back_pullover';
    if (id.includes('pulldown') || id.includes('lat_machine') || id.includes('vertical_traction') || title.includes('jalón') || title.includes('dominada')) return 'back_vertical_pull';
    if (id.includes('t_bar') || id.includes('high_row') || title.includes('remo en t') || title.includes('remo alto') || title.includes('dy_row')) return 'back_tbar_high_row';
    if (id.includes('shrug') || title.includes('encogimiento')) return 'back_shrug';
    if (id.includes('face_pull') || id.includes('rear_delt') || title.includes('pájaro') || title.includes('face pull')) return 'back_rear_delt';
    return 'back_horizontal_row';
  }
  if (m === 'shoulders') {
    if (id.includes('lateral') || id.includes('delts_machine') || title.includes('lateral') || title.includes('delts') || title.includes('pájaro') || title.includes('rear')) return 'shoulder_lateral_raise';
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
    if (id.includes('skull') || id.includes('french') || id.includes('francés') || id.includes('overhead') || id.includes('katana')) return 'triceps_overhead';
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
    if (id.includes('pull_through') || title.includes('pull-through')) return 'glute_hinge_pull_through';
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

export function getTargetRepRangeForExercise(
  t: ExerciseTemplate,
  isPrimaryCompound: boolean,
  experienceLevel: ExperienceLevel
): { reps: number; repRange: string } {
  const pattern = getExercisePattern(t);
  const m = t.muscle_group;
  const id = (t.id || '').toLowerCase();
  const title = (t.title || '').toLowerCase();

  const isYOrFrontRaise =
    id.includes('y_raise') ||
    id.includes('front_raise') ||
    title.includes('elevaciones en y') ||
    title.includes('elevaciones frontales');
  const isCablePullThroughOrDeadlift =
    id.includes('pull_through') ||
    id.includes('cable_deadlift') ||
    title.includes('pull-through') ||
    title.includes('peso muerto en polea');

  // 12-20 reps: accessories & maintenance (lateral delts, Y-raises, face pull, calves, adductors/abductors, abs)
  if (
    pattern === 'shoulder_lateral_raise' ||
    pattern === 'back_rear_delt' ||
    isYOrFrontRaise ||
    m === 'calves' ||
    m === 'adductors' ||
    m === 'abductors' ||
    m === 'abdominals'
  ) {
    return { reps: 15, repRange: '12-20' };
  }

  // 10-15 reps: arm & leg isolations, pec fly, glute accessories & cable pull-through/deadlift
  if (
    m === 'biceps' ||
    m === 'triceps' ||
    pattern === 'quad_leg_extension' ||
    pattern === 'ham_seated_curl' ||
    pattern === 'ham_lying_curl' ||
    pattern === 'chest_fly_pec_deck' ||
    pattern === 'glute_abductor' ||
    pattern === 'glute_kickback_extension' ||
    pattern === 'glute_hinge_pull_through' ||
    isCablePullThroughOrDeadlift
  ) {
    return { reps: 12, repRange: '10-15' };
  }

  // Guard: never assign heavy 6-8 / 6-10 to unstable/accessory cables (except heavy back pulldown/row)
  if (t.equipment_category === 'cable' && pattern !== 'back_vertical_pull' && pattern !== 'back_horizontal_row') {
    return { reps: 12, repRange: '10-15' };
  }

  // 6-10 reps (or 6-8 in avanzado): heavy primary compounds
  if (isPrimaryCompound) {
    return experienceLevel === 'avanzado'
      ? { reps: 7, repRange: '6-8' }
      : { reps: 8, repRange: '6-10' };
  }

  // 8-12 reps: secondary guided machines / secondary compounds
  return { reps: 10, repRange: '8-12' };
}

export function getTargetRepsForExercise(
  t: ExerciseTemplate,
  isPrimaryCompound: boolean,
  experienceLevel: ExperienceLevel
): number {
  return getTargetRepRangeForExercise(t, isPrimaryCompound, experienceLevel).reps;
}

/**
 * Intra-session sequencing:
 * - Opens with #1 from priorityOrder
 * - Interleaves #1 <-> #2 when antagonists
 * - Enforces biomechanics guard: push compounds (chest, shoulders) ALWAYS before triceps
 *   unless triceps is absolute #1; back compounds ALWAYS before biceps unless biceps is absolute #1.
 * - Finishers (calves, adductors, abdominals, or <=4 sets/wk) ALWAYS placed last.
 */
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

  const absTopMuscle = priorities && priorities.length > 0 ? priorities[0] : null;
  const pushCompoundItems = mainItems.filter(
    i => i.muscle === 'chest' || (i.muscle === 'shoulders' && i.bias === 'shoulder_press')
  );
  const hasPushCompoundInDay = pushCompoundItems.length > 0;
  const hasPullCompoundInDay = mainItems.some(i => i.muscle === 'lats' || i.muscle === 'upper_back');

  const getEffectiveRank = (muscle: string): number => {
    let r = getRank(muscle);
    // Guard: never fry triceps before chest or compound shoulder press unless triceps is #1 absolute.
    // For lateral/rear delts (no shoulder_press), respect explicit priorityOrder if triceps is ranked higher;
    // otherwise default to placing shoulders before triceps.
    if (muscle === 'triceps' && absTopMuscle !== 'triceps') {
      if (hasPushCompoundInDay) {
        const maxPushRank = Math.max(...pushCompoundItems.map(i => getRank(i.muscle)));
        r = Math.max(r, maxPushRank + 0.5);
      }
      const shRank = getRank('shoulders');
      if (mainItems.some(i => i.muscle === 'shoulders') && !(r < shRank)) {
        r = Math.max(r, shRank + 0.5);
      }
    }
    // Guard: never fry biceps before back compounds unless biceps is #1 absolute
    if (muscle === 'biceps' && hasPullCompoundInDay && absTopMuscle !== 'biceps') {
      const maxPullRank = Math.max(
        ...mainItems.filter(i => i.muscle === 'lats' || i.muscle === 'upper_back').map(i => getRank(i.muscle))
      );
      r = Math.max(r, maxPullRank + 0.5);
    }
    return r;
  };

  const uniqueMainMuscles = Array.from(new Set(mainItems.map(i => i.muscle))).sort((a, b) => {
    const ra = getEffectiveRank(a);
    const rb = getEffectiveRank(b);
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
      while ((pools[m1]?.length || 0) > 0 || (pools[m2]?.length || 0) > 0) {
        if (pools[m1]?.length) orderedMain.push(pools[m1].shift()!);
        if (pools[m2]?.length) orderedMain.push(pools[m2].shift()!);
      }
    }
  }

  for (const m of uniqueMainMuscles) {
    while (pools[m]?.length) {
      orderedMain.push(pools[m].shift()!);
    }
  }

  finisherItems.sort((a, b) => getRank(a.muscle) - getRank(b.muscle));

  return [...orderedMain, ...finisherItems];
}

/**
 * Dynamic Balanced Session Allocator:
 * Distributes all non-zero muscles across D days (2..6) keeping session sets within ~±3 of targetSetsPerDay,
 * respecting 48h muscle spacing, asymmetric synergist guards (no heavy triceps day before chest/shoulders),
 * and automatic frequency based on weekly volume.
 */
function allocateBalancedSessions(
  daysPerWeek: number,
  targetWeeklyVolume: Record<string, number>,
  dislikedMuscles: string[],
  priorities: string[]
): Record<number, Record<string, number>> {
  const dayMuscleSets: Record<number, Record<string, number>> = {};
  const dayTotalSets: number[] = Array.from({ length: daysPerWeek }, () => 0);
  for (let d = 0; d < daysPerWeek; d++) dayMuscleSets[d] = {};

  const activeMuscles = ALL_DISPLAY_MUSCLES
    .map(m => m.key)
    .filter(m => {
      const broad = BROAD_GROUP_MAP[m] || m;
      const v = targetWeeklyVolume[m] ?? 0;
      return v > 0 && !dislikedMuscles.includes(m) && !dislikedMuscles.includes(broad);
    });

  const totalWeeklySets = activeMuscles.reduce((acc, m) => acc + (targetWeeklyVolume[m] || 0), 0);
  if (totalWeeklySets === 0 || activeMuscles.length === 0) return dayMuscleSets;

  const targetSetsPerDay = totalWeeklySets / daysPerWeek;

  const hasBothBack = activeMuscles.includes('lats') && activeMuscles.includes('upper_back');

  // Placement order (Longest Processing Time bin-packing):
  // 1. All primary compounds (lower + upper) sorted by effective block volume descending
  // 2. Arms (triceps, biceps) placed around chest/back without pre-fatigue
  // 3. Finishers / Maintenance (<= 4 sets or calves/adductors/abdominals)
  const getTier = (m: string): number => {
    const v = targetWeeklyVolume[m] || 0;
    if (FINISHER_MUSCLES.has(m) || v <= 4) return 3;
    if (m === 'biceps' || m === 'triceps') return 2;
    return 1;
  };

  const getEffectiveVolume = (m: string): number => {
    if (hasBothBack && (m === 'lats' || m === 'upper_back')) {
      return (targetWeeklyVolume['lats'] || 0) + (targetWeeklyVolume['upper_back'] || 0);
    }
    return targetWeeklyVolume[m] || 0;
  };

  const sortedMuscles = [...activeMuscles].sort((a, b) => {
    const ta = getTier(a);
    const tb = getTier(b);
    if (ta !== tb) return ta - tb;
    const va = getEffectiveVolume(a);
    const vb = getEffectiveVolume(b);
    if (va !== vb) return vb - va;
    const pa = priorities.indexOf(a);
    const pb = priorities.indexOf(b);
    return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
  });

  // Helper to generate valid combinations of k days from 0..daysPerWeek-1
  const getDayCombinations = (k: number): number[][] => {
    const res: number[][] = [];
    const backtrack = (start: number, cur: number[]) => {
      if (cur.length === k) {
        res.push([...cur]);
        return;
      }
      for (let i = start; i < daysPerWeek; i++) {
        cur.push(i);
        backtrack(i + 1, cur);
        cur.pop();
      }
    };
    backtrack(0, []);
    return res;
  };

  const computeFreq = (totalSets: number): number => {
    let freq = 1;
    if (totalSets <= 4) {
      freq = 1;
    } else if (totalSets <= 14) {
      freq = Math.min(daysPerWeek, 2);
    } else {
      freq = Math.min(daysPerWeek, daysPerWeek >= 5 ? 3 : 2);
    }
    while (freq < daysPerWeek && Math.ceil(totalSets / freq) > 10) {
      freq++;
    }
    return freq;
  };

  let backPairPlaced = false;
  // In 2-3 day splits (e.g. Mon/Wed/Fri), sessions already have rest days between them.
  // Strict 48h & next-day pre-fatigue hard blocks apply to >= 4 day splits.
  const consecutiveDayPenalty = daysPerWeek >= 4 ? 20000 : 400;

  for (const m of sortedMuscles) {
    if (hasBothBack && (m === 'lats' || m === 'upper_back')) {
      if (backPairPlaced) continue;
      backPairPlaced = true;

      const latsSets = targetWeeklyVolume['lats'] || 0;
      const ubSets = targetWeeklyVolume['upper_back'] || 0;
      const freq = Math.max(computeFreq(latsSets), computeFreq(ubSets));
      const combos = getDayCombinations(freq);

      const latsBase = Math.floor(latsSets / freq);
      const latsRem = latsSets % freq;
      const ubBase = Math.floor(ubSets / freq);
      const ubRem = ubSets % freq;

      let bestCombo = combos[0];
      let bestScore = Infinity;

      for (const combo of combos) {
        let penalty = 0;

        // Strict 48h spacing check (no consecutive days when freq < daysPerWeek)
        if (freq < daysPerWeek) {
          for (let i = 0; i < combo.length - 1; i++) {
            if (combo[i + 1] - combo[i] === 1) {
              penalty += consecutiveDayPenalty;
            }
          }
        }

        // Strict synergist pre-fatigue guard: never place back the day after biceps,
        // and prefer alternating days with chest when possible
        combo.forEach((d) => {
          const prevD = d - 1;
          if (prevD >= 0 && (dayMuscleSets[prevD]['biceps'] || 0) > 0) {
            penalty += consecutiveDayPenalty;
          }
          if ((dayMuscleSets[d]['chest'] || 0) > 0 && daysPerWeek >= 3) {
            penalty += 300;
          }
        });

        const simulatedTotals = [...dayTotalSets];
        combo.forEach((d, idx) => {
          simulatedTotals[d] += (latsBase + (idx < latsRem ? 1 : 0)) + (ubBase + (idx < ubRem ? 1 : 0));
        });
        const maxS = Math.max(...simulatedTotals);
        const minS = Math.min(...simulatedTotals);
        const sqDev = simulatedTotals.reduce((acc, s) => acc + Math.pow(s - targetSetsPerDay, 2), 0);
        const overCapPenalty = simulatedTotals.reduce((acc, s) => acc + Math.max(0, s - Math.ceil(targetSetsPerDay + 3)) * 2000, 0);
        penalty += (maxS - minS) * 1000 + sqDev * 80 + overCapPenalty;

        if (penalty < bestScore) {
          bestScore = penalty;
          bestCombo = combo;
        }
      }

      bestCombo.forEach((d, idx) => {
        const lHere = latsBase + (idx < latsRem ? 1 : 0);
        const uHere = ubBase + (idx < ubRem ? 1 : 0);
        if (lHere > 0) {
          dayMuscleSets[d]['lats'] = (dayMuscleSets[d]['lats'] || 0) + lHere;
          dayTotalSets[d] += lHere;
        }
        if (uHere > 0) {
          dayMuscleSets[d]['upper_back'] = (dayMuscleSets[d]['upper_back'] || 0) + uHere;
          dayTotalSets[d] += uHere;
        }
      });
      continue;
    }

    const totalSets = targetWeeklyVolume[m] || 0;
    if (totalSets <= 0) continue;

    // Frequency by weekly volume & intra-session junk volume cap (<= 9-10 direct sets/day)
    const freq = computeFreq(totalSets);

    const base = Math.floor(totalSets / freq);
    const rem = totalSets % freq;
    const combos = getDayCombinations(freq);

    let bestCombo = combos[0];
    let bestScore = Infinity;

    for (const combo of combos) {
      let penalty = 0;

      // 1. Strict 48h spacing check (no consecutive days for ANY muscle when freq < daysPerWeek)
      if (freq < daysPerWeek) {
        for (let i = 0; i < combo.length - 1; i++) {
          if (combo[i + 1] - combo[i] === 1) {
            penalty += consecutiveDayPenalty;
          }
        }
      }

      // 2. Strict Asymmetric Synergist Interference guard:
      //    NEVER place Triceps on day d if Chest is on d+1 (pre-fatigue)
      //    NEVER place Biceps on day d if Lats/Upper Back is on d+1 (pre-fatigue)
      combo.forEach((d) => {
        const nextD = d + 1;
        const prevD = d - 1;

        if (m === 'triceps' && nextD < daysPerWeek) {
          if ((dayMuscleSets[nextD]['chest'] || 0) > 0) {
            penalty += consecutiveDayPenalty;
          } else if ((dayMuscleSets[nextD]['shoulders'] || 0) > 0) {
            penalty += 400;
          }
        }
        if (m === 'chest' && prevD >= 0) {
          if ((dayMuscleSets[prevD]['triceps'] || 0) > 0) {
            penalty += consecutiveDayPenalty;
          }
        }
        if (m === 'biceps' && nextD < daysPerWeek) {
          if ((dayMuscleSets[nextD]['lats'] || 0) > 0 || (dayMuscleSets[nextD]['upper_back'] || 0) > 0) {
            penalty += consecutiveDayPenalty;
          }
        }
        if ((m === 'lats' || m === 'upper_back') && prevD >= 0) {
          if ((dayMuscleSets[prevD]['biceps'] || 0) > 0) {
            penalty += consecutiveDayPenalty;
          }
        }
        if (m === 'calves' || m === 'adductors') {
          const hasLegs = (dayMuscleSets[d]['quadriceps'] || 0) > 0 || (dayMuscleSets[d]['hamstrings'] || 0) > 0;
          if (!hasLegs) penalty += 150;
          if (m === 'adductors' && nextD < daysPerWeek && (dayMuscleSets[nextD]['quadriceps'] || 0) > 0) {
            penalty += 900; // Prefer not placing adductors the day before heavy squats/leg press without breaking +-3 set balance
          }
        }
      });

      // 3. Load balancing score: strictly enforce <= +-3 sets around targetSetsPerDay
      const simulatedTotals = [...dayTotalSets];
      combo.forEach((d, idx) => {
        simulatedTotals[d] += base + (idx < rem ? 1 : 0);
      });
      const maxS = Math.max(...simulatedTotals);
      const minS = Math.min(...simulatedTotals);
      const sqDev = simulatedTotals.reduce((acc, s) => acc + Math.pow(s - targetSetsPerDay, 2), 0);
      const overCapPenalty = simulatedTotals.reduce((acc, s) => acc + Math.max(0, s - Math.ceil(targetSetsPerDay + 3)) * 2000, 0);
      penalty += (maxS - minS) * 1000 + sqDev * 80 + overCapPenalty;

      if (penalty < bestScore) {
        bestScore = penalty;
        bestCombo = combo;
      }
    }

    bestCombo.forEach((d, idx) => {
      const setsHere = base + (idx < rem ? 1 : 0);
      if (setsHere > 0) {
        dayMuscleSets[d][m] = (dayMuscleSets[d][m] || 0) + setsHere;
        dayTotalSets[d] += setsHere;
      }
    });
  }

  return dayMuscleSets;
}

function buildDynamicDayTitle(dayIdx: number, orderedMuscles: string[]): string {
  const labelMap: Record<string, string> = {
    chest: 'Pectoral',
    lats: 'Dorsal',
    upper_back: 'Espalda Alta',
    shoulders: 'Deltoides',
    biceps: 'Bíceps',
    triceps: 'Tríceps',
    quadriceps: 'Cuádriceps',
    hamstrings: 'Femoral',
    glutes: 'Glúteo',
    calves: 'Gemelos',
    adductors: 'Aductores',
    abdominals: 'Abdomen'
  };

  const uniqueMain = Array.from(new Set(orderedMuscles.filter(m => !FINISHER_MUSCLES.has(m))));
  const hasLower = uniqueMain.some(m => LOWER_MUSCLES.has(m));
  const hasUpper = uniqueMain.some(m => !LOWER_MUSCLES.has(m));

  const prefix = hasLower && hasUpper
    ? (uniqueMain.filter(m => LOWER_MUSCLES.has(m)).length >= uniqueMain.filter(m => !LOWER_MUSCLES.has(m)).length ? 'Pierna + Torso' : 'Torso + Pierna')
    : hasLower
    ? 'Pierna'
    : 'Torso';

  const topNames = uniqueMain.slice(0, 3).map(m => labelMap[m] || m);
  if (topNames.length === 0) {
    const fallbackNames = Array.from(new Set(orderedMuscles)).slice(0, 2).map(m => labelMap[m] || m);
    return `Día ${dayIdx + 1}: ${fallbackNames.join(' & ') || 'Sesión Equilibrada'}`;
  }
  return `Día ${dayIdx + 1}: ${prefix} (${topNames.join(', ')})`;
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
    dislikedMuscles = [],
    priorityMuscles = [],
    priorityOrder = []
  } = options;

  const effectivePriorities = priorityOrder.length > 0 ? priorityOrder : priorityMuscles;
  const allowedExercises = EXERCISE_DATABASE.filter(t => isExerciseAllowed(t, baseEquipment, machineBrands));

  const chestVolume = targetWeeklyVolume['chest'] ?? 0;
  let shoulderPressDaysUsed = 0;

  // Check if user has dedicated machines for isolations/legs in allowedExercises
  const hasDedicatedLegExtension = allowedExercises.some(
    t => t.muscle_group === 'quadriceps' && t.equipment_category === 'machine' && (t.id.includes('leg_extension') || t.title.toLowerCase().includes('leg extension') || t.title.toLowerCase().includes('extensión de cuádriceps'))
  );
  const hasDedicatedLegCurl = allowedExercises.some(
    t => t.muscle_group === 'hamstrings' && t.equipment_category === 'machine' && (t.id.includes('leg_curl') || t.title.toLowerCase().includes('leg curl') || t.title.toLowerCase().includes('femoral'))
  );
  const hasDedicatedAdductor = allowedExercises.some(
    t => t.muscle_group === 'adductors' && t.equipment_category === 'machine'
  );
  const hasDedicatedGlute = allowedExercises.some(
    t => t.muscle_group === 'glutes' && t.equipment_category === 'machine'
  );

  const pickBestExercise = (
    muscle: string,
    usedIds: Set<string>,
    usedPatterns: Set<string>,
    globalUsedIds: Set<string>,
    variantBias?: DayQueueItem['bias'],
    preferCompound: boolean = false
  ): ExerciseTemplate => {
    let pool = allowedExercises.filter(t => t.muscle_group === muscle && !usedIds.has(t.id));

    // Allow repeating irreplaceable isolations across Day A / Day B if no other unused machine exists
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

    // Quality rule: NEVER degrade to unstable/improvised cables when a dedicated machine exists
    if (muscle === 'quadriceps' && hasDedicatedLegExtension) {
      const stable = pool.filter(t => t.id !== 'cable_leg_extension' && !t.title.toLowerCase().includes('tobillera'));
      if (stable.length > 0) pool = stable;
    }
    if (muscle === 'hamstrings' && hasDedicatedLegCurl) {
      const stable = pool.filter(
        t =>
          t.id !== 'cable_standing_leg_curl' &&
          t.id !== 'cable_seated_hamstring_curl' &&
          !t.id.includes('cable_deadlift') &&
          !t.title.toLowerCase().includes('tobillera') &&
          !t.title.toLowerCase().includes('polea baja')
      );
      if (stable.length > 0) pool = stable;
    }
    if (muscle === 'adductors' && hasDedicatedAdductor) {
      const stable = pool.filter(
        t =>
          t.equipment_category === 'machine' ||
          (!t.id.includes('cable_hip_adduction') && !t.id.includes('cable_adduction') && !t.title.toLowerCase().includes('tobillera') && !t.title.toLowerCase().includes('polea baja'))
      );
      if (stable.length > 0) pool = stable;
    }
    if (muscle === 'glutes' && hasDedicatedGlute) {
      const stable = pool.filter(
        t =>
          !t.id.includes('cable_deadlift') &&
          !t.title.toLowerCase().includes('peso muerto en polea') &&
          !t.title.toLowerCase().includes('tobillera')
      );
      if (stable.length > 0) pool = stable;
    }
    if (muscle === 'shoulders' && chestVolume >= 8) {
      const noFront = pool.filter(
        t => !t.id.includes('front_raise') && !t.title.toLowerCase().includes('elevaciones frontales')
      );
      if (noFront.length > 0) pool = noFront;
    }

    // Strict anti-redundancy: never repeat same biomechanical pattern within same session
    // (For shoulder_lateral bias, keep lateral/rear options so it never degrades into an unwanted shoulder_press)
    const nonRedundant = pool.filter(t => {
      if (variantBias === 'shoulder_lateral' && getExercisePattern(t) === 'shoulder_press') return false;
      return !usedPatterns.has(getExercisePattern(t));
    });
    if (nonRedundant.length > 0) {
      pool = nonRedundant;
    } else if (variantBias === 'shoulder_lateral') {
      const lateralOnly = pool.filter(t => getExercisePattern(t) !== 'shoulder_press');
      if (lateralOnly.length > 0) pool = lateralOnly;
    }

    // Hard biomechanical guard: NEVER pick two flat/same-plane chest press machines in the same day
    if (muscle === 'chest' && (usedPatterns.has('chest_flat_press') || usedPatterns.has('chest_decline_wide_press'))) {
      const diffPlane = pool.filter(
        t => getExercisePattern(t) !== 'chest_flat_press' && getExercisePattern(t) !== 'chest_decline_wide_press'
      );
      if (diffPlane.length > 0) {
        pool = diffPlane;
      } else {
        const altChest = allowedExercises.filter(
          t => t.muscle_group === 'chest' && getExercisePattern(t) !== 'chest_flat_press' && getExercisePattern(t) !== 'chest_decline_wide_press' && !usedIds.has(t.id)
        );
        if (altChest.length > 0) pool = altChest;
      }
    }

    // Apply biomechanical variant bias
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
          return id.includes('leg_extension') || title.includes('leg extension') || title.includes('extensión de cuádriceps');
        } else if (variantBias === 'shoulder_lateral') {
          return getExercisePattern(t) === 'shoulder_lateral_raise';
        } else if (variantBias === 'shoulder_press') {
          return getExercisePattern(t) === 'shoulder_press';
        } else if (variantBias === 'ham_knee_flexion') {
          return id.includes('seated_leg_curl') || id.includes('leg_curl') || title.includes('curl');
        } else if (variantBias === 'chest_fly') {
          return getExercisePattern(t) === 'chest_fly_pec_deck';
        } else if (variantBias === 'calf_extended') {
          return getExercisePattern(t) === 'calf_standing';
        } else if (variantBias === 'calf_seated') {
          return getExercisePattern(t) === 'calf_seated';
        }
        return true;
      });
      if (biased.length > 0) {
        pool = biased;
      }
    }

    // Prioritize Seated Leg Curl for hamstrings knee flexion (stretch-mediated hypertrophy)
    if (variantBias === 'ham_knee_flexion' && pool.length > 1) {
      const seated = pool.filter(t => getExercisePattern(t) === 'ham_seated_curl');
      if (seated.length > 0) pool = seated;
    }

    // Prefer dedicated machines over free/cable when both are in pool for isolation stability,
    // and prefer compounds for opening exercises
    if (preferCompound && pool.length > 1) {
      const compoundPool = pool.filter(t => {
        const pat = getExercisePattern(t);
        return !pat.includes('fly') && !pat.includes('extension') && !pat.includes('curl') && !pat.includes('lateral') && !pat.includes('abductor');
      });
      if (compoundPool.length > 0) {
        pool = compoundPool;
      }
    }

    // Rotate machines/angles across Day A / Day B whenever distinct options exist
    const freshAcrossWeek = pool.filter(t => !globalUsedIds.has(t.id));
    if (freshAcrossWeek.length > 0) {
      pool = freshAcrossWeek;
    }

    return pool[0];
  };

  // Allocate exact balanced sets across D days
  const dayMuscleSets = allocateBalancedSessions(daysPerWeek, targetWeeklyVolume, dislikedMuscles, effectivePriorities);

  const routines: Routine[] = [];
  const globalUsedIds = new Set<string>();
  const quadWeeklySets = targetWeeklyVolume['quadriceps'] || 0;
  const hasAnyLegExtension = allowedExercises.some(
    t => t.muscle_group === 'quadriceps' && getExercisePattern(t) === 'quad_leg_extension'
  );
  const totalQuadDays = Object.values(dayMuscleSets).filter(d => (d['quadriceps'] || 0) > 0).length;
  let quadDaysSeen = 0;
  let quadExtensionAssigned = false;

  const hasAnyChestFly = allowedExercises.some(
    t => t.muscle_group === 'chest' && getExercisePattern(t) === 'chest_fly_pec_deck'
  );
  const totalChestDays = Object.values(dayMuscleSets).filter(d => (d['chest'] || 0) > 0).length;
  let chestDaysSeen = 0;
  let chestFlyAssigned = false;

  for (let dayIdx = 0; dayIdx < daysPerWeek; dayIdx++) {
    const usedIds = new Set<string>();
    const usedPatterns = new Set<string>();
    const allocatedForDay = dayMuscleSets[dayIdx] || {};

    interface PlannedItem extends DayQueueItem {
      plannedSets: number;
    }
    const dayQueue: PlannedItem[] = [];

    Object.entries(allocatedForDay).forEach(([m, setsForMuscle]) => {
      if (setsForMuscle <= 0) return;

      const availForMuscle = allowedExercises.filter(t => t.muscle_group === m);
      const distinctPatterns = new Set(availForMuscle.map(t => getExercisePattern(t))).size;

      let numExercises = setsForMuscle <= 4 ? 1 : setsForMuscle <= 8 ? 2 : 3;
      if (durationMinutes <= 45 && setsForMuscle <= 5) {
        numExercises = 1;
      }
      if (distinctPatterns > 0) {
        numExercises = Math.min(numExercises, Math.max(1, distinctPatterns));
      }
      if (setsForMuscle >= 2) {
        while (numExercises > 1 && Math.floor(setsForMuscle / numExercises) < 2) {
          numExercises--;
        }
      }

      if (m === 'quadriceps') {
        quadDaysSeen++;
        if (
          quadWeeklySets >= 6 &&
          hasAnyLegExtension &&
          !quadExtensionAssigned &&
          quadDaysSeen === totalQuadDays &&
          numExercises === 1 &&
          setsForMuscle >= 4 &&
          distinctPatterns >= 2
        ) {
          numExercises = 2;
        }
      }
      if (m === 'chest') {
        chestDaysSeen++;
        if (
          chestVolume >= 10 &&
          hasAnyChestFly &&
          !chestFlyAssigned &&
          chestDaysSeen === totalChestDays &&
          numExercises === 1 &&
          setsForMuscle >= 4 &&
          distinctPatterns >= 2
        ) {
          numExercises = 2;
        }
      }

      const baseSets = Math.floor(setsForMuscle / numExercises);
      const remSets = setsForMuscle % numExercises;

      for (let i = 0; i < numExercises; i++) {
        const exSets = baseSets + (i < remSets ? 1 : 0);
        if (exSets <= 0) continue;

        let bias: DayQueueItem['bias'] = undefined;
        if (m === 'quadriceps') {
          if (numExercises >= 2 && i === numExercises - 1) {
            bias = 'quad_extension';
            quadExtensionAssigned = true;
          } else if (
            quadWeeklySets >= 6 &&
            hasAnyLegExtension &&
            !quadExtensionAssigned &&
            quadDaysSeen === totalQuadDays
          ) {
            bias = 'quad_extension';
            quadExtensionAssigned = true;
          }
        } else if (m === 'hamstrings' && i === 0) {
          // Mandatory knee flexion (Seated Leg Curl preferred) whenever hamstrings > 0
          bias = 'ham_knee_flexion';
        } else if (m === 'shoulders') {
          // Anterior deltoid saturation guard: if chest >= 12, max 1 shoulder_press day/wk and >= 65% lateral/rear
          if (chestVolume >= 12) {
            if (i === 0 && shoulderPressDaysUsed === 0 && numExercises >= 2) {
              bias = 'shoulder_press';
              shoulderPressDaysUsed++;
            } else {
              bias = 'shoulder_lateral';
            }
          } else {
            bias = i === 0 ? 'shoulder_press' : 'shoulder_lateral';
          }
        } else if (m === 'chest') {
          if (chestVolume >= 10 && hasAnyChestFly && !chestFlyAssigned) {
            if ((numExercises >= 2 && i === numExercises - 1) || chestDaysSeen === totalChestDays) {
              bias = 'chest_fly';
              chestFlyAssigned = true;
            }
          }
        } else if (m === 'calves') {
          // Kinoshita et al. (2023): extended-knee calf raises first; seated calf only as 2nd complementary exercise
          bias = i === 0 ? 'calf_extended' : 'calf_seated';
        } else if (m === 'lats') {
          bias = i === 0 ? 'lats' : undefined;
        } else if (m === 'upper_back') {
          bias = 'upper_back';
        }

        dayQueue.push({
          muscle: m,
          bias,
          plannedSets: exSets,
          isComplementary: FINISHER_MUSCLES.has(m) || setsForMuscle <= 4
        });
      }
    });

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
      const { reps: baseReps, repRange } = getTargetRepRangeForExercise(template, isPrimaryCompound, experienceLevel);

      const defaultWeight =
        template.equipment_category === 'barbell' ? 50 :
        template.equipment_category === 'dumbbell' ? 18 :
        template.equipment_category === 'cable' ? 25 :
        template.equipment_category === 'machine' ? 40 : 0;

      const sets = Array.from({ length: setsForThisExercise }, (_, sIdx) => {
        const isWarmup = sIdx === 0 && experienceLevel === 'avanzado' && setsForThisExercise >= 3;
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
        target_rep_range: repRange,
        rep_range: repRange,
        notes: item.note || (template.setup_tips ? template.setup_tips[0] : undefined),
        sets
      });
    });

    const dynamicTitle = buildDynamicDayTitle(dayIdx, orderedQueue.map(q => q.muscle));

    routines.push({
      id: `wizard_routine_${Date.now()}_day_${dayIdx + 1}`,
      title: dynamicTitle,
      folder_name: 'Rutina Generada por MIA',
      description: `Sesión de ${durationMinutes} min · ${exercises.length} ejercicios · ${exercises.reduce((acc, e) => acc + e.sets.length, 0)} series`,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      exercises
    });
  }

  return routines;
}
